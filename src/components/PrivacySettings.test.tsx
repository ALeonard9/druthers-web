/** @vitest-environment happy-dom */
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PrivacySettings } from './PrivacySettings';
import type { Visibility } from '@/lib/types';

function visibility(overrides: Partial<Visibility> = {}): Visibility {
  return {
    handle: 'avery',
    visibility_profile: 'public',
    default_privacy: 'friends',
    visibility_movies: null,
    visibility_tv: null,
    visibility_books: null,
    visibility_games: null,
    visibility_watchlist_movies: null,
    visibility_watchlist_tv: null,
    visibility_watchlist_books: null,
    visibility_watchlist_games: null,
    ...overrides,
  };
}

describe('PrivacySettings', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('saves a default change without writing shelf overrides', async () => {
    const initial = visibility();
    const updated = visibility({ default_privacy: 'public' });
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify(initial), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(updated), { status: 200 }));

    render(<PrivacySettings />);
    const defaultPills = await screen.findByRole('radiogroup', {
      name: 'Default privacy for all shelves',
    });
    fireEvent.click(within(defaultPills).getByRole('radio', { name: 'Public' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const [, request] = fetchMock.mock.calls[1];
    expect(request).toMatchObject({ method: 'PUT' });
    expect(JSON.parse((request as RequestInit).body as string)).toEqual({ default_privacy: 'public' });
    expect(screen.getAllByText('Using default (Public).')).toHaveLength(8);
  });

  it('clears an explicit shelf override to resume inheriting the default', async () => {
    const initial = visibility({ visibility_movies: 'public' });
    const updated = visibility();
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify(initial), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(updated), { status: 200 }));

    render(<PrivacySettings />);
    await screen.findByText('Override (Public).');
    fireEvent.click(screen.getAllByRole('button', { name: 'Use default' })[0]);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const [, request] = fetchMock.mock.calls[1];
    expect(JSON.parse((request as RequestInit).body as string)).toEqual({ visibility_movies: null });
    expect(screen.getAllByText('Using default (Friends).')).toHaveLength(8);
  });
});
