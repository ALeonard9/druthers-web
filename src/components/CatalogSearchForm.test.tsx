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

describe('CatalogSearchForm filter chips (web#303)', () => {
  afterEach(cleanup);

  it('renders a chip for each parsed key:value filter in the query', () => {
    render(
      <CatalogSearchForm
        query="director:Nolan genre:sci-fi Dune"
        onQueryChange={vi.fn()}
        onSearch={vi.fn()}
        placeholder="Search titles"
        domain="movies"
      />,
    );

    expect(screen.getByText('director:')).toBeTruthy();
    expect(screen.getByText('Nolan')).toBeTruthy();
    expect(screen.getByText('genre:')).toBeTruthy();
    expect(screen.getByText('sci-fi')).toBeTruthy();
    expect(screen.getByRole('list', { name: 'Active filters' })).toBeTruthy();
  });

  it('does not render chips when the query has no filters', () => {
    render(
      <CatalogSearchForm
        query="Dune"
        onQueryChange={vi.fn()}
        placeholder="Search titles"
      />,
    );

    expect(screen.queryByRole('list', { name: 'Active filters' })).toBeNull();
  });

  it('removes a filter and updates the query via onQueryChange', () => {
    const onQueryChange = vi.fn();
    render(
      <CatalogSearchForm
        query="director:Nolan Dune"
        onQueryChange={onQueryChange}
        placeholder="Search titles"
        domain="movies"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remove filter director:Nolan' }));
    expect(onQueryChange).toHaveBeenCalledWith('Dune');
  });

  it('removes a filter in uncontrolled mode', () => {
    render(
      <CatalogSearchForm
        query="genre:action The Matrix"
        placeholder="Search titles"
        domain="movies"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remove filter genre:action' }));
    expect(screen.queryByText('genre:')).toBeNull();
    expect((screen.getByRole('searchbox') as HTMLInputElement).value).toBe('The Matrix');
  });

  it('serializes multiple remaining filters after one is removed', () => {
    const onQueryChange = vi.fn();
    render(
      <CatalogSearchForm
        query="director:Nolan genre:sci-fi Dune"
        onQueryChange={onQueryChange}
        placeholder="Search titles"
        domain="movies"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remove filter director:Nolan' }));
    expect(onQueryChange).toHaveBeenCalledWith('genre:sci-fi Dune');
  });

  it('renders chips for quoted values', () => {
    render(
      <CatalogSearchForm
        query='director:"Christopher Nolan" Dune'
        onQueryChange={vi.fn()}
        placeholder="Search titles"
        domain="movies"
      />,
    );

    expect(screen.getByText('Christopher Nolan')).toBeTruthy();
  });
});

describe('CatalogSearchForm autocomplete (web#303)', () => {
  afterEach(cleanup);

  it('shows suggestions when typing a partial filter key', () => {
    render(
      <CatalogSearchForm
        query=""
        onQueryChange={vi.fn()}
        placeholder="Search titles"
        domain="movies"
      />,
    );

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'd' } });
    expect(screen.getByRole('listbox', { name: 'Filter suggestions' })).toBeTruthy();
    expect(screen.getByText('director:')).toBeTruthy();
  });

  it('filters suggestions by prefix', () => {
    render(
      <CatalogSearchForm
        query=""
        onQueryChange={vi.fn()}
        placeholder="Search titles"
        domain="movies"
      />,
    );

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'act' } });
    expect(screen.getByText('actor:')).toBeTruthy();
    expect(screen.queryByText('director:')).toBeNull();
  });

  it('hides suggestions when typing a full word with no prefix match', () => {
    render(
      <CatalogSearchForm
        query=""
        onQueryChange={vi.fn()}
        placeholder="Search titles"
        domain="movies"
      />,
    );

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzz' } });
    expect(screen.queryByRole('listbox', { name: 'Filter suggestions' })).toBeNull();
  });

  it('selecting a suggestion inserts the key: prefix via onQueryChange', () => {
    const onQueryChange = vi.fn();
    render(
      <CatalogSearchForm
        query=""
        onQueryChange={onQueryChange}
        placeholder="Search titles"
        domain="movies"
      />,
    );

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'd' } });
    fireEvent.mouseDown(screen.getByText('director:'));
    expect(onQueryChange).toHaveBeenCalledWith('director:');
  });

  it('does not show suggestions for unrecognised domain keys', () => {
    render(
      <CatalogSearchForm
        query=""
        onQueryChange={vi.fn()}
        placeholder="Search titles"
        domain="books"
      />,
    );

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'd' } });
    // 'director' is not a books-domain key
    expect(screen.queryByRole('listbox', { name: 'Filter suggestions' })).toBeNull();
  });

  it('shows "all" scope suggestions when no domain is set', () => {
    render(
      <CatalogSearchForm
        query=""
        onQueryChange={vi.fn()}
        placeholder="Search titles"
      />,
    );

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'n' } });
    expect(screen.getByText('network:')).toBeTruthy();
  });
});
