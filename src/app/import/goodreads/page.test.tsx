/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import GoodreadsImportPage from './page';

const mocks = vi.hoisted(() => ({ getSessionUser: vi.fn(), redirect: vi.fn() }));

vi.mock('@/lib/session', () => ({ getSessionUser: mocks.getSessionUser }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('@/components/GoodreadsImport', () => ({ GoodreadsImport: () => <div>Goodreads uploader</div> }));

describe('Goodreads import page', () => {
  beforeEach(() => {
    mocks.getSessionUser.mockResolvedValue({ user_id: 'viewer', email: 'viewer@example.com' });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('gives signed-in users a standalone importer and route back to Add books', async () => {
    render(await GoodreadsImportPage());

    expect(screen.getByRole('heading', { name: 'Bring your Goodreads shelves home' })).toBeTruthy();
    expect(screen.getByText('Goodreads uploader')).toBeTruthy();
    expect(screen.getByRole('link', { name: '← Back to Add books' }).getAttribute('href')).toBe('/books/search');
  });

  it('redirects visitors who are not signed in', async () => {
    mocks.getSessionUser.mockResolvedValue(null);

    await GoodreadsImportPage();

    expect(mocks.redirect).toHaveBeenCalledWith('/login');
  });
});
