/** @vitest-environment happy-dom */
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TutorialLauncher } from './Tutorial';

describe('TutorialLauncher', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(cleanup);

  it('shows for a first-time visitor with zero items', async () => {
    render(<TutorialLauncher hasItems={false} />);
    await waitFor(() => expect(screen.getByText('Welcome to druthers')).toBeTruthy());
  });

  it('does not show once the account has items, even unseen', () => {
    render(<TutorialLauncher hasItems />);
    expect(screen.queryByText('Welcome to druthers')).toBeNull();
  });

  it('does not show again once dismissed, regardless of item count', () => {
    window.localStorage.setItem('druthers_tutorial_seen', 'true');
    render(<TutorialLauncher hasItems={false} />);
    expect(screen.queryByText('Welcome to druthers')).toBeNull();
  });
});
