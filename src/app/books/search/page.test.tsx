/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BookSearchPage from './page';

const mocks = vi.hoisted(() => ({ getSessionUser: vi.fn() }));

vi.mock('@/lib/session', () => ({ getSessionUser: mocks.getSessionUser }));
vi.mock('@/components/DomainCatalogSearch', () => ({
  DomainCatalogSearch: ({ domain }: { domain: string }) => <div>{domain} search</div>,
}));
vi.mock('@/components/MultiAddMode', () => ({ MultiAddMode: ({ children }: { children: ReactNode }) => <>{children}</> }));

describe('book search page', () => {
  beforeEach(() => {
    mocks.getSessionUser.mockResolvedValue({ user_id: 'viewer', email: 'viewer@example.com' });
  });

  afterEach(cleanup);

  it('keeps Goodreads import as a quiet secondary link', async () => {
    render(await BookSearchPage({ searchParams: Promise.resolve({}) }));

    const link = screen.getByRole('link', { name: 'Import your library.' });
    expect(link.getAttribute('href')).toBe('/import/goodreads');
    expect(screen.queryByRole('heading', { name: /Import from Goodreads/ })).toBeNull();
  });
});
