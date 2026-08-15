/** @vitest-environment happy-dom */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SearchForm } from './SearchForm';

class MockSpeechRecognition {
  static instances: MockSpeechRecognition[] = [];

  continuous = false;
  interimResults = false;
  lang = '';
  onend: (() => void) | null = null;
  onerror: ((event: Event & { error: string }) => void) | null = null;
  onresult: ((event: Event & { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null = null;
  onstart: (() => void) | null = null;
  abort = vi.fn();
  start = vi.fn(() => this.onstart?.());
  stop = vi.fn(() => this.onend?.());

  constructor() {
    MockSpeechRecognition.instances.push(this);
  }
}

describe('SearchForm', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    MockSpeechRecognition.instances = [];
    delete (window as typeof window & { SpeechRecognition?: unknown }).SpeechRecognition;
  });

  it('offers every scope in a keyboard-accessible native selector', () => {
    render(<SearchForm query="dune" scope="all" />);

    const scope = screen.getByRole('combobox', { name: 'Search scope' });
    expect(scope).toHaveProperty('value', 'all');
    expect([...scope.querySelectorAll('option')].map((option) => option.textContent)).toEqual([
      'All',
      'Movies',
      'TV',
      'Books',
      'Games',
      'Users',
    ]);

    fireEvent.change(scope, { target: { value: 'users' } });
    expect(scope).toHaveProperty('value', 'users');
  });

  it('submits the selected scope alongside the query in the compact top-bar layout', () => {
    render(<SearchForm compact query="ada" scope="users" />);

    expect(screen.getByRole('searchbox').closest('form')?.getAttribute('action')).toBe('/search');
    expect(screen.getByRole('combobox', { name: 'Search scope' })).toHaveProperty('value', 'users');
    expect(screen.getByRole('searchbox')).toHaveProperty('value', 'ada');
  });

  it('limits scope options to active shelves while keeping All and Users', () => {
    render(<SearchForm activeShelves={['movies', 'books']} />);

    expect(
      [...screen.getByRole('combobox', { name: 'Search scope' }).querySelectorAll('option')].map(
        (option) => option.textContent,
      ),
    ).toEqual(['All', 'Movies', 'Books', 'Users']);
  });

  it('hides the voice-search control when the browser does not support speech recognition', () => {
    render(<SearchForm />);

    expect(screen.queryByRole('button', { name: 'Start voice search' })).toBeNull();
  });

  it('transcribes speech into the existing catalog search form and submits it', () => {
    (window as typeof window & { SpeechRecognition?: unknown }).SpeechRecognition = MockSpeechRecognition;
    render(<SearchForm compact />);

    const requestSubmit = vi.spyOn(HTMLFormElement.prototype, 'requestSubmit').mockImplementation(() => undefined);

    fireEvent.click(screen.getByRole('button', { name: 'Start voice search' }));
    expect(MockSpeechRecognition.instances[0].start).toHaveBeenCalledOnce();
    expect(screen.getByRole('status').textContent).toContain('Listening for a title…');

    act(() => {
      MockSpeechRecognition.instances[0].onresult?.({
        resultIndex: 0,
        results: [[{ transcript: 'Dune' }]],
      } as unknown as Event & { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }>> });
    });

    expect(screen.getByRole('searchbox')).toHaveProperty('value', 'Dune');
    expect(requestSubmit).toHaveBeenCalledOnce();
  });

  it('explains empty and failed recognition attempts', () => {
    (window as typeof window & { SpeechRecognition?: unknown }).SpeechRecognition = MockSpeechRecognition;
    render(<SearchForm />);

    fireEvent.click(screen.getByRole('button', { name: 'Start voice search' }));
    act(() => MockSpeechRecognition.instances[0].onend?.());
    expect(screen.getByRole('status').textContent).toContain('No speech detected. Try again.');

    fireEvent.click(screen.getByRole('button', { name: 'Start voice search' }));
    act(() => MockSpeechRecognition.instances[0].onerror?.({ error: 'not-allowed' } as Event & { error: string }));
    expect(screen.getByRole('status').textContent).toContain('Microphone access was denied.');
  });
});
