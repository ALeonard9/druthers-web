/** @vitest-environment happy-dom */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VoiceSearch } from './VoiceSearch';

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

describe('VoiceSearch', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    MockSpeechRecognition.instances = [];
    delete (window as typeof window & { SpeechRecognition?: unknown }).SpeechRecognition;
  });

  it('hides the microphone when speech recognition is unavailable', () => {
    render(<VoiceSearch onTranscript={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Start voice search' })).toBeNull();
  });

  it('requests recognition from a user gesture and sends a transcript to the caller', () => {
    (window as typeof window & { SpeechRecognition?: unknown }).SpeechRecognition = MockSpeechRecognition;
    const onTranscript = vi.fn();
    render(<VoiceSearch onTranscript={onTranscript} />);

    fireEvent.click(screen.getByRole('button', { name: 'Start voice search' }));
    expect(MockSpeechRecognition.instances[0].start).toHaveBeenCalledOnce();
    expect(screen.getByRole('status').textContent).toContain('Listening for a title…');

    act(() => {
      MockSpeechRecognition.instances[0].onresult?.({
        resultIndex: 0,
        results: [[{ transcript: '  Dune  ' }]],
      } as unknown as Event & { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }>> });
    });

    expect(onTranscript).toHaveBeenCalledWith('Dune');
  });

  it('reports empty and denied recognition attempts', () => {
    (window as typeof window & { SpeechRecognition?: unknown }).SpeechRecognition = MockSpeechRecognition;
    render(<VoiceSearch onTranscript={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Start voice search' }));
    act(() => MockSpeechRecognition.instances[0].onend?.());
    expect(screen.getByRole('status').textContent).toContain('No speech detected. Try again.');

    fireEvent.click(screen.getByRole('button', { name: 'Start voice search' }));
    act(() => MockSpeechRecognition.instances[0].onerror?.({ error: 'not-allowed' } as Event & { error: string }));
    expect(screen.getByRole('status').textContent).toContain('Microphone access was denied.');
  });
});
