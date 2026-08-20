/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react';
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
});

describe('NotesVisibilityDisclaimer', () => {
  it('uses the resolved notes tier and links to sharing settings', () => {
    render(<NotesVisibilityDisclaimer tier="public" />);

    expect(screen.getByText('Visible to: public.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Change visibility' }).getAttribute('href')).toBe('/settings#sharing');
  });
});
