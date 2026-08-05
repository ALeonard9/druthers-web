/** @vitest-environment happy-dom */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ShareTop5Button,
  messageSharePayload,
  shareDialogTitle,
  shouldUseNativeFileShare,
} from './ShareTop5Button';
import type { ShareData, ShareDestination } from '@/lib/shareCards';

const data: ShareData = {
  handle: 'avery',
  url: 'https://www.druthers.io/u/avery',
  profilePublic: true,
  shelves: [],
  totalRanked: 0,
};

const destination: ShareDestination = {
  url: 'https://www.druthers.io/u/avery/tv/watchlist',
  label: 'your TV list',
  visibility: 'public',
  warning: null,
  settingsHref: null,
};

describe('universal share menu (web#123)', () => {
  afterEach(cleanup);

  beforeEach(() => {
    window.history.replaceState({}, '', '/tv/watchlist');
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: vi.fn().mockResolvedValue(undefined),
    });
    vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  it('offers the three link-first actions and copies the canonical path', async () => {
    render(<ShareTop5Button data={data} destination={destination} />);
    fireEvent.click(screen.getByRole('button', { name: 'Share' }));

    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Copy URL',
      'Send message',
      'Share on Facebook',
      'Share on X',
    ]);

    fireEvent.click(screen.getByRole('menuitem', { name: 'Copy URL' }));
    await waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'https://www.druthers.io/u/avery/tv/watchlist',
      ),
    );
    expect(screen.getByRole('menuitem', { name: 'Copied URL ✓' })).toBeTruthy();
  });

  it('sends a text-first message payload without an image attachment', async () => {
    render(
      <ShareTop5Button
        data={data}
        destination={destination}
        initialCategory="tv"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Share' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Send message' }));

    await waitFor(() =>
      expect(navigator.share).toHaveBeenCalledWith({
        title: 'My TV',
        text: 'My TV on Druthers',
        url: 'https://www.druthers.io/u/avery/tv/watchlist',
      }),
    );
    expect(navigator.share).not.toHaveBeenCalledWith(
      expect.objectContaining({ files: expect.anything() }),
    );
  });

  it('warns before sharing a friends-only URL and links to settings', () => {
    render(
      <ShareTop5Button
        data={data}
        destination={{
          ...destination,
          visibility: 'friends',
          warning: 'Only signed-in friends you’ve accepted can open this link.',
          settingsHref: '/settings#sharing',
        }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Share' }));
    expect(screen.getByText(/Only signed-in friends/)).toBeTruthy();
    expect(screen.getByRole('link', { name: /Sharing settings/ }).getAttribute('href')).toBe(
      '/settings#sharing',
    );
  });

  it('dismisses with Escape', () => {
    render(<ShareTop5Button data={data} destination={destination} />);
    fireEvent.click(screen.getByRole('button', { name: 'Share' }));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
  });
});

describe('contextual share formatter title', () => {
  it('names ranked and watchlist content instead of calling everything Top 5', () => {
    expect(shareDialogTitle('games', 'ranked')).toBe('Share my games');
    expect(shareDialogTitle('tv', 'watchlist')).toBe('Share my TV watchlist');
    expect(shareDialogTitle('books', 'watchlist')).toBe('Share my read list');
  });

  it('builds concise category and watchlist message copy', () => {
    expect(
      messageSharePayload({
        category: 'games',
        kind: 'ranked',
        url: 'http://localhost:3000/u/avery/games',
      }),
    ).toEqual({
      title: 'My games',
      text: 'My games on Druthers',
      url: 'https://www.druthers.io/u/avery/games',
    });
    expect(
      messageSharePayload({
        category: 'books',
        kind: 'watchlist',
        url: 'https://www.druthers.io/u/avery/books/watchlist',
      }).text,
    ).toBe('My reading list on Druthers');
    expect(
      messageSharePayload({
        category: 'tv',
        kind: 'ranked',
        ownerHandle: 'avery',
        url: 'https://www.druthers.io/u/avery/tv',
      }).text,
    ).toBe('@avery’s TV on Druthers');
  });

  it('routes Facebook around the unreliable PWA file share sheet', () => {
    expect(shouldUseNativeFileShare('facebook', true)).toBe(false);
    expect(shouldUseNativeFileShare('x', true)).toBe(true);
    expect(shouldUseNativeFileShare('x', false)).toBe(false);
  });
});
