/** @vitest-environment happy-dom */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GoodreadsImport } from './GoodreadsImport';

describe('GoodreadsImport', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('shows an error for non-CSV files', async () => {
    render(<GoodreadsImport />);

    const file = new File(['{"bad": "json"}'], 'export.json', { type: 'application/json' });
    const input = screen.getByLabelText('Select CSV file');
    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByText('Please select a CSV file.')).toBeTruthy();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('uploads a CSV and displays success stats and skipped rows', async () => {
    const onComplete = vi.fn();
    render(<GoodreadsImport onComplete={onComplete} />);

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          books_created: 1,
          books_matched: 5,
          trackers_created: 4,
          trackers_updated: 2,
          unplaced_read_book_ids: ['book-1', 'book-2'],
          skipped: [
            { row: 12, reason: 'Missing title' }
          ]
        }),
      )
    );

    const file = new File(['Title,Author\nBook,Bob\n'], 'goodreads_export.csv', { type: 'text/csv' });
    const input = screen.getByLabelText('Select CSV file');
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/import/goodreads', expect.objectContaining({ method: 'POST' })));

    const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const formData = callArgs[1].body as FormData;
    expect(formData.get('file')).toBe(file);

    expect(await screen.findByText('Import complete!')).toBeTruthy();
    expect(screen.getByText('4 books added to your shelves')).toBeTruthy();
    expect(screen.getByText('2 books updated')).toBeTruthy();
    expect(screen.getByText('5 existing books recognized')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Rank your imported books →' }).getAttribute('href')).toBe(
      '/books/ranking?item=book-1',
    );

    expect(screen.getByText('Skipped items')).toBeTruthy();
    expect(screen.getByText('Row 12')).toBeTruthy();
    expect(screen.getByText('Missing title')).toBeTruthy();

    expect(onComplete).toHaveBeenCalled();
  });

  it('displays API errors gracefully', async () => {
    render(<GoodreadsImport />);

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ error: 'File too large for a Goodreads export' }),
        { status: 413 }
      )
    );

    const file = new File(['csvdata'], 'large.csv', { type: 'text/csv' });
    const input = screen.getByLabelText('Select CSV file');
    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByText('File too large for a Goodreads export')).toBeTruthy();
  });

  it('accepts a CSV dropped onto the upload area', async () => {
    render(<GoodreadsImport />);
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({
        books_created: 0,
        books_matched: 1,
        trackers_created: 1,
        trackers_updated: 0,
        unplaced_read_book_ids: [],
        skipped: [],
      })),
    );

    const file = new File(['Title,Author\nBook,Bob\n'], 'shelf.csv', { type: 'text/csv' });
    fireEvent.drop(screen.getByText('Drop your Goodreads CSV here').parentElement!, {
      dataTransfer: { files: [file] },
    });

    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/import/goodreads', expect.objectContaining({ method: 'POST' })));
    expect(await screen.findByText('1 existing books recognized')).toBeTruthy();
    expect(screen.queryByRole('link', { name: /Rank .*book/ })).toBeNull();
  });
});
