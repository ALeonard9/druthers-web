/** @vitest-environment happy-dom */
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  CatalogDomainSection,
  SearchSectionSkeleton,
  catalogDomainMinQueryLength,
  createCatalogSearchTask,
} from './searchSections';

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api');
  return { ...actual, apiFetch: vi.fn(async () => []) };
});

describe('search section skeleton', () => {
  it('keeps a named, busy Books slot visible while its provider is pending', () => {
    render(<SearchSectionSkeleton title="Books" />);

    const heading = screen.getByRole('heading', { name: 'Books' });
    expect(heading.closest('section')?.getAttribute('aria-busy')).toBe('true');
    expect(screen.getByLabelText('Loading books search').textContent).toContain(
      'Loading books…',
    );
  });
});

describe('a domain below its provider floor', () => {
  it('is told apart from a domain that was searched and found nothing', async () => {
    // The bug this replaces: `q=Go` rendered "No books found" for a query no
    // provider ever received. Asserting the two states DIFFER is the point; a
    // future change that collapses them back fails here rather than passing.
    const notSearched = render(
      await CatalogDomainSection({
        ...createCatalogSearchTask('books', 'Go'),
        query: 'Go',
      }),
    ).container.textContent;

    const searchedAndEmpty = render(
      await CatalogDomainSection({
        domain: 'books',
        resultsPromise: Promise.resolve([]),
        belowMinQuery: false,
        query: 'Dune',
      }),
    ).container.textContent;

    expect(notSearched).not.toBe(searchedAndEmpty);
    expect(notSearched).toContain('Books search needs at least 3 characters.');
    expect(notSearched).not.toContain('No books found.');
    expect(searchedAndEmpty).toContain('No books found.');
  });

  it('does not claim a result count for a section it never searched', async () => {
    const { container } = render(
      await CatalogDomainSection({
        ...createCatalogSearchTask('books', 'Go'),
        query: 'Go',
      }),
    );

    const heading = within(container).getByRole('heading', { name: /Books/ });
    expect(heading.textContent).not.toContain('0');
  });

  it('leaves the domains whose providers accept short queries alone', () => {
    // Probed 2026-08-20 (api#398). Books is the only domain with a real floor,
    // so `q=Go` must reach the other three.
    expect(catalogDomainMinQueryLength('books')).toBe(3);
    expect(createCatalogSearchTask('books', 'Go').belowMinQuery).toBe(true);
    for (const domain of ['movies', 'tv', 'games'] as const) {
      expect(catalogDomainMinQueryLength(domain)).toBe(1);
      expect(createCatalogSearchTask(domain, 'Go').belowMinQuery).toBe(false);
    }
  });
});
