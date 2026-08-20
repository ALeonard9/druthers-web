/** @vitest-environment happy-dom */
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Page from './page';

const mocks = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  getImpersonationMeta: vi.fn(),
}));

vi.mock('@/lib/api', () => ({ apiFetch: mocks.apiFetch }));
vi.mock('@/lib/session', () => ({ getImpersonationMeta: mocks.getImpersonationMeta }));
vi.mock('@/components/AdminAuditFilters', () => ({ AdminAuditFilters: () => null }));

const EVENT_BASE = {
  id: 1,
  created_at: '2026-08-19T12:00:00Z',
  action: 'admin.user.view',
  result: 'allowed',
  detail: null,
  request_id: 'r1',
  method: 'GET',
  path: '/v1/admin/users/x',
  status_code: 200,
  source_ip: '127.0.0.1',
};

describe('AdminAuditPage', () => {
  afterEach(cleanup);

  it('bails out before fetching while impersonating - the layout block screen is what should render', async () => {
    mocks.getImpersonationMeta.mockResolvedValue({ target: { id: 't1' } });

    const element = await Page({ searchParams: Promise.resolve({}) });

    expect(element).toBeNull();
    expect(mocks.apiFetch).not.toHaveBeenCalled();
  });

  it('renders "Unknown" for a null actor rather than crashing - a real API response shape, not hypothetical', async () => {
    mocks.getImpersonationMeta.mockResolvedValue(null);
    mocks.apiFetch.mockImplementation(async (path: string) =>
      path.includes('impersonation')
        ? { sessions: [] }
        : {
            total: 1,
            limit: 50,
            offset: 0,
            events: [{ ...EVENT_BASE, actor: null, target: null }],
          },
    );

    const { getByText, getAllByText } = render(await Page({ searchParams: Promise.resolve({}) }));

    // One "Unknown" for the actor column, and the target column falls back
    // to "-" since a null target reads as "about no one", not "unknown who".
    expect(getAllByText('Unknown')).toHaveLength(1);
    expect(getByText('-')).toBeTruthy();
  });

  it('falls back to email when an actor has no handle', async () => {
    mocks.getImpersonationMeta.mockResolvedValue(null);
    mocks.apiFetch.mockImplementation(async (path: string) =>
      path.includes('impersonation')
        ? { sessions: [] }
        : {
            total: 1,
            limit: 50,
            offset: 0,
            events: [
              {
                ...EVENT_BASE,
                actor: { id: 'a1', handle: null, email: 'admin@example.com' },
                target: { id: 't1', handle: 'follower', email: 'follower@example.com' },
              },
            ],
          },
    );

    const { getByText } = render(await Page({ searchParams: Promise.resolve({}) }));

    expect(getByText('admin@example.com')).toBeTruthy();
    expect(getByText('follower')).toBeTruthy();
  });

  it('shows the unfiltered empty state with no events and no filters', async () => {
    mocks.getImpersonationMeta.mockResolvedValue(null);
    mocks.apiFetch.mockImplementation(async (path: string) =>
      path.includes('impersonation') ? { sessions: [] } : { total: 0, limit: 50, offset: 0, events: [] },
    );

    const { getByText } = render(await Page({ searchParams: Promise.resolve({}) }));

    expect(getByText('No audit events yet. Admin actions will show up here.')).toBeTruthy();
  });

  it('shows the filtered empty state when a filter is active', async () => {
    mocks.getImpersonationMeta.mockResolvedValue(null);
    mocks.apiFetch.mockImplementation(async (path: string) =>
      path.includes('impersonation') ? { sessions: [] } : { total: 0, limit: 50, offset: 0, events: [] },
    );

    const { getByText } = render(
      await Page({ searchParams: Promise.resolve({ actor: 'follower' }) }),
    );

    expect(getByText('No audit events match these filters.')).toBeTruthy();
  });
});
