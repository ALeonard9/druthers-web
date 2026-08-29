/** @vitest-environment happy-dom */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MoviesImport } from './MoviesImport';

describe('MoviesImport', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('shows an error for unsupported files', async () => {
    render(<MoviesImport />);

    const file = new File(['{"bad": "json"}'], 'export.json', { type: 'application/json' });
    const input = screen.getByLabelText('Select file');
    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByText('Please select a CSV or XLSX file.')).toBeTruthy();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('uploads a CSV and displays success stats and skipped rows', async () => {
    const onComplete = vi.fn();
    render(<MoviesImport onComplete={onComplete} />);

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          valid: true,
          summary: { imported: 4, matched: 2, skipped: 5 },
          rows: [
            {
              row: 12,
              status: 'skipped',
              tmdb_id: 603,
              movie_id: 'movie-1',
              title: 'The Matrix',
              catalog_created: false,
              message: 'Missing title',
            },
          ],
        }),
      )
    );

    const file = new File(['title,year\nMatrix,1999\n'], 'movies.csv', { type: 'text/csv' });
    const input = screen.getByLabelText('Select file');
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/import/movies', expect.objectContaining({ method: 'POST' })));

    const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const formData = callArgs[1].body as FormData;
    expect(formData.get('file')).toBe(file);

    expect(await screen.findByText('Import complete!')).toBeTruthy();
    expect(screen.getByText('4 movies added to your shelves')).toBeTruthy();
    expect(screen.getByText('2 movies updated')).toBeTruthy();
    expect(screen.getByText('5 existing movies recognized')).toBeTruthy();

    expect(screen.getByText('Skipped items')).toBeTruthy();
    expect(screen.getByText('Row 12')).toBeTruthy();
    expect(screen.getByText('Missing title')).toBeTruthy();

    expect(onComplete).toHaveBeenCalled();
  });

  it('displays API errors gracefully', async () => {
    render(<MoviesImport />);

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ error: 'File too large' }),
        { status: 413 }
      )
    );

    const file = new File(['csvdata'], 'large.csv', { type: 'text/csv' });
    const input = screen.getByLabelText('Select file');
    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByText('File too large')).toBeTruthy();
  });

  it('displays row validation errors gracefully', async () => {
    render(<MoviesImport />);

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: 'Validation failed',
          row_errors: [
            { row: 2, errors: ['Invalid year'] }
          ]
        }),
        { status: 400 }
      )
    );

    const file = new File(['title,year\nMatrix,bad\n'], 'bad.csv', { type: 'text/csv' });
    const input = screen.getByLabelText('Select file');
    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByText('Validation failed')).toBeTruthy();
    expect(await screen.findByText('Validation Errors')).toBeTruthy();
    expect(screen.getByText('Row 2')).toBeTruthy();
    expect(screen.getByText('Invalid year')).toBeTruthy();
  });

  it('accepts a CSV dropped onto the upload area', async () => {
    render(<MoviesImport />);
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({
        valid: true,
        summary: { imported: 1, matched: 0, skipped: 0 },
        rows: [
          {
            row: 2,
            status: 'imported',
            tmdb_id: 603,
            movie_id: 'movie-1',
            title: 'The Matrix',
            catalog_created: false,
            message: 'Imported',
          },
        ],
      })),
    );

    const file = new File(['title,year\nMatrix,1999\n'], 'shelf.csv', { type: 'text/csv' });
    fireEvent.drop(screen.getByText('Drop your CSV or XLSX file here').parentElement!, {
      dataTransfer: { files: [file] },
    });

    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/import/movies', expect.objectContaining({ method: 'POST' })));
    expect(await screen.findByText('1 movies added to your shelves')).toBeTruthy();
    expect(screen.queryByText('Skipped items')).toBeNull();
  });
});
