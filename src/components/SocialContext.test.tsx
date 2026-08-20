/** @vitest-environment happy-dom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { getWatchlistLabels } from '@/lib/domainLabels';
import { NotesVisibilityDisclaimer, SocialContext } from './SocialContext';

afterEach(cleanup);

describe('SocialContext', () => {
  it('shows a tracked item with the permitted note, rank, and watchlist status', () => {
    render(
      <SocialContext
        domain="movies"
        people={[{
          handle: 'ada', display_name: 'Ada Lovelace', relationship: 'friends',
          rank: 3, on_watchlist: true, notes: 'A wonderful pick.',
        }]}
      />,
    );

    expect(screen.getByText('Ada Lovelace')).toBeTruthy();
    expect(screen.getByText('Friend')).toBeTruthy();
    expect(screen.getByText('Ranked #3')).toBeTruthy();
    expect(screen.getByText('On Watchlist')).toBeTruthy();
    expect(screen.getByText('A wonderful pick.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Ada Lovelace' }).getAttribute('href')).toBe('/u/ada');
    expect(screen.getByRole('link', { name: 'Ranked #3' }).getAttribute('href')).toBe('/u/ada/movies');
  });

  it('makes the common empty state explicit', () => {
    render(<SocialContext domain="movies" people={[]} />);

    expect(screen.getByText('No friends or people you follow are tracking this yet.')).toBeTruthy();
  });

  it('renders a withheld note differently from a missing entry', () => {
    render(
      <SocialContext
        domain="movies"
        people={[{
          handle: 'grace', display_name: null, relationship: 'follows',
          rank: null, on_watchlist: false, notes: null,
        }]}
      />,
    );

    expect(screen.getByText('grace')).toBeTruthy();
    expect(screen.getByText('Notes are not visible to you.')).toBeTruthy();
  });

  it('labels follows distinctly from friends', () => {
    render(
      <SocialContext
        domain="movies"
        people={[{
          handle: 'lin', display_name: 'Lin', relationship: 'follows',
          rank: null, on_watchlist: false, notes: '',
        }]}
      />,
    );

    expect(screen.getByText('Following')).toBeTruthy();
  });

  it('uses the book reading-list label instead of the movie watchlist label', () => {
    render(
      <SocialContext
        domain="books"
        people={[{
          handle: 'octavia', display_name: 'Octavia', relationship: 'friends',
          rank: null, on_watchlist: true, notes: '',
        }]}
      />,
    );

    expect(screen.getByText(getWatchlistLabels('books').on_badge)).toBeTruthy();
    expect(screen.queryByText('On Watchlist')).toBeNull();
  });

  it('shows the relationship filter only when both kinds are present and filters its rows', () => {
    render(
      <SocialContext
        domain="books"
        people={[
          {
            handle: 'octavia', display_name: 'Octavia', relationship: 'friends',
            rank: 1, on_watchlist: false, notes: '',
          },
          {
            handle: 'ursula', display_name: 'Ursula', relationship: 'follows',
            rank: 2, on_watchlist: false, notes: '',
          },
        ]}
      />,
    );

    expect(screen.getByRole('button', { name: 'All' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Friends' }));
    expect(screen.getByText('Octavia')).toBeTruthy();
    expect(screen.queryByText('Ursula')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Following' }));
    expect(screen.queryByText('Octavia')).toBeNull();
    expect(screen.getByText('Ursula')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Ranked #2' }).getAttribute('href')).toBe('/u/ursula/books');
  });

  it('omits the relationship filter when everyone has the same relationship', () => {
    render(
      <SocialContext
        domain="movies"
        people={[{
          handle: 'ada', display_name: 'Ada', relationship: 'friends',
          rank: null, on_watchlist: false, notes: '',
        }]}
      />,
    );

    expect(screen.queryByRole('button', { name: 'All' })).toBeNull();
  });

  it('shows a relationship-specific empty message when an active filter has no matching rows', () => {
    const { rerender } = render(
      <SocialContext
        domain="movies"
        people={[
          {
            handle: 'ada', display_name: 'Ada', relationship: 'friends',
            rank: null, on_watchlist: false, notes: '',
          },
          {
            handle: 'lin', display_name: 'Lin', relationship: 'follows',
            rank: null, on_watchlist: false, notes: '',
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Friends' }));
    rerender(
      <SocialContext
        domain="movies"
        people={[{
          handle: 'lin', display_name: 'Lin', relationship: 'follows',
          rank: null, on_watchlist: false, notes: '',
        }]}
      />,
    );

    expect(screen.getByText('No friends are tracking this yet.')).toBeTruthy();
    expect(screen.queryByText('No friends or people you follow are tracking this yet.')).toBeNull();
  });

  it('does not link a withheld rank', () => {
    render(
      <SocialContext
        domain="games"
        people={[{
          handle: 'grace', display_name: 'Grace', relationship: 'follows',
          rank: null, on_watchlist: false, notes: '',
        }]}
      />,
    );

    expect(screen.queryByRole('link', { name: /Ranked/ })).toBeNull();
  });
});

describe('NotesVisibilityDisclaimer', () => {
  it('uses the resolved notes tier and links to sharing settings', () => {
    render(<NotesVisibilityDisclaimer tier="public" />);

    expect(screen.getByText('Visible to: public.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Change visibility' }).getAttribute('href')).toBe('/settings#sharing');
  });
});
