/** @vitest-environment happy-dom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CatalogSearchForm } from './CatalogSearchForm';

vi.mock('./VoiceSearch', () => ({
  VoiceSearch: ({ onTranscript }: { onTranscript: (transcript: string) => void }) => (
    <button type="button" onClick={() => onTranscript('Dune')}>
      Voice search
    </button>
  ),
}));

describe('CatalogSearchForm shared contract (web#280)', () => {
  afterEach(cleanup);

  it('submits typed and dictated queries through the same host callback', () => {
    const onQueryChange = vi.fn();
    const onSearch = vi.fn();
    const { rerender } = render(
      <CatalogSearchForm
        query=""
        onQueryChange={onQueryChange}
        onSearch={onSearch}
        placeholder="Search titles"
      />,
    );

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Arrival' } });
    expect(onQueryChange).toHaveBeenCalledWith('Arrival');
    rerender(
      <CatalogSearchForm
        query="Arrival"
        onQueryChange={onQueryChange}
        onSearch={onSearch}
        placeholder="Search titles"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(onSearch).toHaveBeenCalledWith('Arrival');

    fireEvent.click(screen.getByRole('button', { name: 'Voice search' }));
    expect(onQueryChange).toHaveBeenCalledWith('Dune');
    expect(onSearch).toHaveBeenCalledWith('Dune');
  });

  it('keeps the global host URL-backed when no callback is supplied', () => {
    render(<CatalogSearchForm query="ada" placeholder="Search everything" showScope />);

    const form = screen.getByRole('searchbox').closest('form');
    expect(form?.getAttribute('action')).toBe('/search');
    expect(screen.getByRole('combobox', { name: 'Search scope' })).toBeTruthy();
  });
});
