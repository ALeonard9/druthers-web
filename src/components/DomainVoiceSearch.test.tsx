/** @vitest-environment happy-dom */
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BookSearch } from './BookSearch';
import { GameSearch } from './GameSearch';
import { MovieSearch } from './MovieSearch';
import { TVSearch } from './TVSearch';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

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

const cases = [
  { name: 'movies', component: <MovieSearch />, endpoint: '/api/movies/search?q=The%20Matrix' },
  { name: 'tv', component: <TVSearch />, endpoint: '/api/tv/search?q=The%20Matrix' },
  { name: 'books', component: <BookSearch />, endpoint: '/api/books/search?q=The%20Matrix' },
  { name: 'games', component: <GameSearch />, endpoint: '/api/games/search?q=The%20Matrix' },
] as const;

describe('per-domain voice search (web#242)', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    MockSpeechRecognition.instances = [];
    delete (window as typeof window & { SpeechRecognition?: unknown }).SpeechRecognition;
  });

  it.each(cases)('runs a $name transcript through its existing search endpoint', async ({ component, endpoint }) => {
    (window as typeof window & { SpeechRecognition?: unknown }).SpeechRecognition = MockSpeechRecognition;
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    render(component);

    fireEvent.click(screen.getByRole('button', { name: 'Start voice search' }));
    act(() => {
      MockSpeechRecognition.instances[0].onresult?.({
        resultIndex: 0,
        results: [[{ transcript: 'The Matrix' }]],
      } as unknown as Event & { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }>> });
    });

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(endpoint));
    expect(screen.getByRole('textbox')).toHaveProperty('value', 'The Matrix');
  });
});
