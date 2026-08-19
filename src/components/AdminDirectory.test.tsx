/** @vitest-environment happy-dom */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminDirectory } from './AdminDirectory';
import type { AdminUserListResponse } from '@/lib/types';

const mocks = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace, push: vi.fn(), refresh: vi.fn() }),
}));

const EMPTY_DATA: AdminUserListResponse = { total: 0, limit: 50, offset: 0, users: [] };

const ONE_USER: AdminUserListResponse = {
  total: 1,
  limit: 50,
  offset: 0,
  users: [
    {
      id: 'u1',
      handle: 'follower',
      display_name: 'Follower Example',
      email: 'follower@example.com',
      user_group: 'user',
      status: 'active',
      created_at: '2026-01-04T12:00:00Z',
      last_tracked_at: '2026-08-17T09:12:00Z',
      tracked_total: 42,
    },
  ],
};

describe('AdminDirectory', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('shows an empty state naming the query with a clear option', () => {
    render(
      <AdminDirectory initialData={EMPTY_DATA} initialQuery="zzz-no-match" pageSize={50} />,
    );

    expect(screen.getByText('No users match “zzz-no-match”.')).toBeTruthy();
    expect(screen.getByText('Clear search')).toBeTruthy();
  });

  it('shows a generic empty state with no clear option when there is no query', () => {
    render(<AdminDirectory initialData={EMPTY_DATA} initialQuery="" pageSize={50} />);

    expect(screen.getByText('No users found.')).toBeTruthy();
    expect(screen.queryByText('Clear search')).toBeNull();
  });

  it('debounces typing and syncs the committed query to ?q= without a submit button', async () => {
    render(<AdminDirectory initialData={ONE_USER} initialQuery="" pageSize={50} />);

    const input = screen.getByLabelText('Search users');
    fireEvent.change(input, { target: { value: 'foll' } });

    // Still within the debounce window - no navigation yet.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(mocks.replace).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    expect(mocks.replace).toHaveBeenCalledWith('/admin?q=foll', { scroll: false });
  });

  it('drops the ?q= param entirely when the search is cleared', async () => {
    render(<AdminDirectory initialData={ONE_USER} initialQuery="foll" pageSize={50} />);

    const input = screen.getByLabelText('Search users');
    fireEvent.change(input, { target: { value: '' } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(mocks.replace).toHaveBeenCalledWith('/admin', { scroll: false });
  });

  it('shows the "N of total" count for a non-empty result', () => {
    render(<AdminDirectory initialData={ONE_USER} initialQuery="" pageSize={50} />);

    expect(screen.getByText('1 of 1 users')).toBeTruthy();
  });
});
