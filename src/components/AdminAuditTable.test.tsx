/** @vitest-environment happy-dom */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdminAuditTable } from './AdminAuditTable';
import type { AdminAuditEvent, AdminAuditResponse } from '@/lib/types';

function event(overrides: Partial<AdminAuditEvent>): AdminAuditEvent {
  return {
    id: 1,
    created_at: '2026-08-19T12:00:00Z',
    actor: { id: 'a1', handle: 'adam', email: 'admin@example.com' },
    target: null,
    action: 'admin.user.view',
    result: 'allowed',
    detail: null,
    request_id: 'r1',
    method: 'GET',
    path: '/v1/admin/users/x',
    status_code: 200,
    source_ip: '127.0.0.1',
    ...overrides,
  };
}

describe('AdminAuditTable', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('hides routine searches by default - they are the noise that buries everything else', () => {
    const data: AdminAuditResponse = {
      total: 2,
      limit: 50,
      offset: 0,
      events: [
        event({ id: 1, action: 'admin.user.search' }),
        event({ id: 2, action: 'admin.user.disable' }),
      ],
    };

    render(<AdminAuditTable initialData={data} filters={{ actor: '', target: '', action: '' }} pageSize={50} />);

    expect(screen.getByText('admin.user.disable')).toBeTruthy();
    expect(screen.queryByText('admin.user.search')).toBeNull();
    expect(screen.getByText(/1 searches hidden/)).toBeTruthy();
  });

  it('shows searches again when the toggle is switched off', () => {
    const data: AdminAuditResponse = {
      total: 1,
      limit: 50,
      offset: 0,
      events: [event({ id: 1, action: 'admin.user.search' })],
    };

    render(<AdminAuditTable initialData={data} filters={{ actor: '', target: '', action: '' }} pageSize={50} />);

    fireEvent.click(screen.getByLabelText('Hide routine searches'));

    expect(screen.getByText('admin.user.search')).toBeTruthy();
  });

  it('fetches the next page and appends it on Load more', async () => {
    const data: AdminAuditResponse = {
      total: 2,
      limit: 1,
      offset: 0,
      events: [event({ id: 1, action: 'admin.user.disable' })],
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            total: 2,
            limit: 1,
            offset: 1,
            events: [event({ id: 2, action: 'admin.user.enable' })],
          }),
        ),
      ),
    );

    render(<AdminAuditTable initialData={data} filters={{ actor: '', target: '', action: '' }} pageSize={1} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
    });

    expect(fetch).toHaveBeenCalledWith('/api/admin/audit?limit=1&offset=1');
    expect(screen.getByText('admin.user.disable')).toBeTruthy();
    expect(screen.getByText('admin.user.enable')).toBeTruthy();
  });

  it('carries active filters through to the Load more request', async () => {
    const data: AdminAuditResponse = {
      total: 2,
      limit: 1,
      offset: 0,
      events: [event({ id: 1 })],
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ total: 2, limit: 1, offset: 1, events: [] }))),
    );

    render(
      <AdminAuditTable
        initialData={data}
        filters={{ actor: 'follower', target: '', action: '' }}
        pageSize={1}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
    });

    expect(fetch).toHaveBeenCalledWith('/api/admin/audit?limit=1&offset=1&actor=follower');
  });

  it('shows no Load more button once every event is loaded', () => {
    const data: AdminAuditResponse = {
      total: 1,
      limit: 50,
      offset: 0,
      events: [event({ id: 1 })],
    };

    render(<AdminAuditTable initialData={data} filters={{ actor: '', target: '', action: '' }} pageSize={50} />);

    expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull();
  });
});
