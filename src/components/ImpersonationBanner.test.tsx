/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ImpersonationBanner } from './ImpersonationBanner';
import type { ImpersonationMeta } from '@/lib/sessionCookies';

const META: ImpersonationMeta = {
  session_id: 's1',
  expires_at: '2026-08-19T12:15:00Z',
  target: { id: 'target-1', handle: 'private-user', display_name: 'Private User', email: 'p@example.com' },
  acting_admin: { id: 'admin-1', handle: 'adam', email: 'admin@example.com' },
};

describe('ImpersonationBanner', () => {
  afterEach(cleanup);

  it('names the target by handle and display name, not email', () => {
    render(<ImpersonationBanner meta={META} />);

    expect(screen.getByText('@private-user', { exact: false })).toBeTruthy();
    expect(screen.getByText(/Private User/)).toBeTruthy();
    expect(screen.queryByText(/p@example\.com/)).toBeNull();
  });

  it('names the acting admin', () => {
    render(<ImpersonationBanner meta={META} />);

    expect(screen.getByText(/@adam/)).toBeTruthy();
  });

  it('carries the escape action and no dismiss control', () => {
    render(<ImpersonationBanner meta={META} />);

    expect(screen.getByRole('button', { name: 'Back to admin' })).toBeTruthy();
    // Not dismissible - no close/dismiss button distinct from the escape action.
    expect(screen.queryByRole('button', { name: /dismiss/i })).toBeNull();
  });

  it('falls back to email for an acting admin with no handle', () => {
    render(
      <ImpersonationBanner
        meta={{ ...META, acting_admin: { id: 'a2', handle: '', email: 'noHandle@example.com' } }}
      />,
    );

    expect(screen.getByText(/noHandle@example\.com/)).toBeTruthy();
  });
});
