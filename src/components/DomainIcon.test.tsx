/** @vitest-environment happy-dom */
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DOMAIN_ICON_PATHS, DomainIcon } from './DomainIcon';
import type { ShelfId } from '@/lib/duelShelves';

const DOMAINS: ShelfId[] = ['movies', 'tv', 'books', 'games'];

describe('DomainIcon', () => {
  afterEach(cleanup);

  it.each(DOMAINS)('renders a hidden glyph for %s', (domain) => {
    const view = render(<DomainIcon domain={domain} />);
    const svg = view.container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.querySelector('path')?.getAttribute('d')).not.toBe('');
  });

  it('draws a distinct path per domain (no copy-paste regressions)', () => {
    const paths = DOMAINS.map(
      (domain) => render(<DomainIcon domain={domain} />).container.querySelector('svg path')?.getAttribute('d'),
    );
    expect(new Set(paths).size).toBe(DOMAINS.length);
  });

  it('exposes every domain in DOMAIN_ICON_PATHS', () => {
    for (const domain of DOMAINS) {
      expect(DOMAIN_ICON_PATHS[domain]).toBeTruthy();
    }
  });
});
