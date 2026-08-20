/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { NotesVisibilityDisclaimer, SocialContext } from './SocialContext';

afterEach(cleanup);

describe('SocialContext', () => {
  it('shows a tracked item with the permitted note, rank, and watchlist status', () => {
    render(
      <SocialContext
        people={[{
          handle: 'ada', display_name: 'Ada Lovelace', relationship: 'friend',
          rank: 3, on_watchlist: true, notes: 'A wonderful pick.',
        }]}
      />,
    );

    expect(screen.getByText('Ada Lovelace')).toBeTruthy();
    expect(screen.getByText('Friend')).toBeTruthy();
    expect(screen.getByText('Ranked #3')).toBeTruthy();
    expect(screen.getByText('On watchlist')).toBeTruthy();
    expect(screen.getByText('A wonderful pick.')).toBeTruthy();
  });

  it('makes the common empty state explicit', () => {
    render(<SocialContext people={[]} />);

    expect(screen.getByText('No friends or people you follow are tracking this yet.')).toBeTruthy();
  });

  it('renders a withheld note differently from a missing entry', () => {
    render(
      <SocialContext
        people={[{
          handle: 'grace', display_name: null, relationship: 'follows',
          rank: null, on_watchlist: false, notes: null,
        }]}
      />,
    );

    expect(screen.getByText('grace')).toBeTruthy();
    expect(screen.getByText('Notes are not visible to you.')).toBeTruthy();
  });
});

describe('NotesVisibilityDisclaimer', () => {
  it('uses the resolved notes tier and links to sharing settings', () => {
    render(<NotesVisibilityDisclaimer tier="public" />);

    expect(screen.getByText('Visible to: public.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Change visibility' }).getAttribute('href')).toBe('/settings#sharing');
  });
});
