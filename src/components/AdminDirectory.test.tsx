/** @vitest-environment happy-dom */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminDirectory } from './AdminDirectory';
import type { AdminUserListResponse } from '@/lib/types';

const mocks = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace, push: mocks.push, refresh: vi.fn() }),
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
      <AdminDirectory initialStatus="" initialDirection="desc"
        initialData={EMPTY_DATA}
        initialQuery="zzz-no-match"
        pageSize={50}
        corpusTotal={0}
      />,
    );

    expect(screen.getByText('No users match “zzz-no-match”.')).toBeTruthy();
    expect(screen.getByText('Clear search')).toBeTruthy();
  });

  it('shows a generic empty state with no clear option when there is no query', () => {
    render(
      <AdminDirectory initialStatus="" initialDirection="desc" initialData={EMPTY_DATA} initialQuery="" pageSize={50} corpusTotal={0} />,
    );

    expect(screen.getByText('No users found.')).toBeTruthy();
    expect(screen.queryByText('Clear search')).toBeNull();
  });

  it('shows the corpus size, not the filtered total, so a search matching nothing still reassures the corpus is intact', () => {
    render(
      <AdminDirectory initialStatus="" initialDirection="desc"
        initialData={EMPTY_DATA}
        initialQuery="zzz-no-match"
        pageSize={50}
        corpusTotal={23}
      />,
    );

    // Not "0 of 0 users" - that reads as an empty database, not a search
    // with no hits.
    expect(screen.getByText('0 of 23 users')).toBeTruthy();
  });

  it('debounces typing and syncs the committed query to ?q= without a submit button', async () => {
    render(
      <AdminDirectory initialStatus="" initialDirection="desc" initialData={ONE_USER} initialQuery="" pageSize={50} corpusTotal={1} />,
    );

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
    render(
      <AdminDirectory initialStatus="" initialDirection="desc" initialData={ONE_USER} initialQuery="foll" pageSize={50} corpusTotal={1} />,
    );

    const input = screen.getByLabelText('Search users');
    fireEvent.change(input, { target: { value: '' } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(mocks.replace).toHaveBeenCalledWith('/admin', { scroll: false });
  });

  it('shows the "N of total" count for a non-empty result', () => {
    render(
      <AdminDirectory initialStatus="" initialDirection="desc" initialData={ONE_USER} initialQuery="" pageSize={50} corpusTotal={1} />,
    );

    expect(screen.getByText('1 of 1 users')).toBeTruthy();
  });

  it('shows an admin badge for an admin row', () => {
    const withAdmin: AdminUserListResponse = {
      ...ONE_USER,
      users: [{ ...ONE_USER.users[0], user_group: 'admin' }],
    };
    render(
      <AdminDirectory initialStatus="" initialDirection="desc" initialData={withAdmin} initialQuery="" pageSize={50} corpusTotal={1} />,
    );

    expect(screen.getAllByText('admin').length).toBeGreaterThan(0);
  });

  it('does not show an admin badge for a regular user', () => {
    render(
      <AdminDirectory initialStatus="" initialDirection="desc" initialData={ONE_USER} initialQuery="" pageSize={50} corpusTotal={1} />,
    );

    expect(screen.queryByText('admin')).toBeNull();
  });

  it('makes the whole row a click target, not just the handle text', () => {
    render(
      <AdminDirectory initialStatus="" initialDirection="desc" initialData={ONE_USER} initialQuery="" pageSize={50} corpusTotal={1} />,
    );

    // The email cell is nowhere near the handle link - clicking it should
    // still navigate, which only holds if the <tr> itself is the target.
    fireEvent.click(screen.getByText('follower@example.com'));

    expect(mocks.push).toHaveBeenCalledWith('/admin/users/u1');
  });

  it('sorts descending on the first click of a column, aria-sort included', () => {
    render(
      <AdminDirectory initialStatus="" initialDirection="desc" initialData={ONE_USER} initialQuery="" pageSize={50} corpusTotal={1} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Joined' }));

    expect(mocks.replace).toHaveBeenCalledWith('/admin?sort=joined&direction=desc', { scroll: false });
    expect(
      screen.getByRole('columnheader', { name: /Joined/ }).getAttribute('aria-sort'),
    ).toBe('descending');
  });

  it('flips to ascending on a second click of the already-active column', () => {
    render(
      <AdminDirectory
        initialStatus=""
        initialDirection="desc"
        initialData={ONE_USER}
        initialQuery=""
        initialSort="joined"
        pageSize={50}
        corpusTotal={1}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Joined/ }));

    expect(mocks.replace).toHaveBeenCalledWith('/admin?sort=joined&direction=asc', { scroll: false });
  });

  it('applies a status filter immediately, no debounce', () => {
    render(
      <AdminDirectory initialStatus="" initialDirection="desc" initialData={ONE_USER} initialQuery="" pageSize={50} corpusTotal={1} />,
    );

    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'disabled' } });

    expect(mocks.replace).toHaveBeenCalledWith('/admin?status=disabled', { scroll: false });
  });

  it('carries the active status and sort through a debounced search commit', async () => {
    render(
      <AdminDirectory
        initialStatus="disabled"
        initialDirection="asc"
        initialSort="joined"
        initialData={ONE_USER}
        initialQuery=""
        pageSize={50}
        corpusTotal={1}
      />,
    );

    fireEvent.change(screen.getByLabelText('Search users'), { target: { value: 'foll' } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(mocks.replace).toHaveBeenCalledWith(
      '/admin?q=foll&status=disabled&sort=joined&direction=asc',
      { scroll: false },
    );
  });
});
