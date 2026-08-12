'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { SEARCH_SCOPES, SEARCH_SCOPE_LABELS, type SearchScope } from '@/lib/searchScope';

type SpeechRecognitionEventLike = Event & {
  resultIndex: number;
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type SpeechRecognitionErrorEventLike = Event & { error: string };

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onstart: (() => void) | null;
  abort: () => void;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function speechRecognitionConstructor() {
  if (typeof window === 'undefined') return undefined;

  const browserWindow = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition;
}

function voiceSearchError(error: string) {
  if (error === 'not-allowed' || error === 'service-not-allowed') {
    return 'Microphone access was denied.';
  }

  if (error === 'network') {
    return 'Voice search needs a network connection.';
  }

  return 'Couldn’t recognize that. Try again.';
}

export function SearchForm({
  query = '',
  scope = 'all',
  compact = false,
}: {
  query?: string;
  scope?: SearchScope;
  compact?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const cancelledRef = useRef(false);
  const receivedResultRef = useRef(false);
  const failedRef = useRef(false);
  const voiceAvailable = useSyncExternalStore(
    () => () => undefined,
    () => Boolean(speechRecognitionConstructor()),
    () => false,
  );
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'empty' | 'error'>('idle');
  const [voiceError, setVoiceError] = useState('');

  useEffect(() => {
    const Recognition = speechRecognitionConstructor();

    if (!Recognition) return;

    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = navigator.language;

    recognition.onstart = () => {
      cancelledRef.current = false;
      receivedResultRef.current = false;
      failedRef.current = false;
      setVoiceError('');
      setVoiceStatus('listening');
    };
    recognition.onresult = (event) => {
      receivedResultRef.current = true;
      const transcript = Array.from(event.results)
        .slice(event.resultIndex)
        .map((result) => result[0]?.transcript ?? '')
        .join('')
        .trim();

      if (!transcript) {
        setVoiceStatus('empty');
        return;
      }

      if (inputRef.current) inputRef.current.value = transcript;
      recognition.stop();
      formRef.current?.requestSubmit();
    };
    recognition.onerror = (event) => {
      failedRef.current = true;
      setVoiceError(voiceSearchError(event.error));
      setVoiceStatus('error');
    };
    recognition.onend = () => {
      if (!cancelledRef.current && !receivedResultRef.current && !failedRef.current) setVoiceStatus('empty');
    };

    recognitionRef.current = recognition;

    return () => recognition.abort();
  }, []);

  function toggleVoiceSearch() {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (voiceStatus === 'listening') {
      cancelledRef.current = true;
      recognition.stop();
      setVoiceStatus('idle');
      return;
    }

    setVoiceStatus('idle');
    try {
      recognition.start();
    } catch {
      setVoiceError(voiceSearchError('unknown'));
      setVoiceStatus('error');
    }
  }

  return (
    <form
      ref={formRef}
      action="/search"
      className={compact ? 'relative flex min-w-0 w-full' : 'relative flex w-full max-w-xl gap-2'}
    >
      <label className="sr-only" htmlFor={compact ? 'top-search-scope' : 'search-scope'}>
        Search scope
      </label>
      <select
        id={compact ? 'top-search-scope' : 'search-scope'}
        name="scope"
        defaultValue={scope}
        className="shrink-0 rounded-l border border-r-0 border-neutral-700 bg-panel px-2 py-1.5 text-sm text-neutral-200 outline-none focus:border-brass"
      >
        {SEARCH_SCOPES.map((option) => (
          <option key={option} value={option}>
            {SEARCH_SCOPE_LABELS[option]}
          </option>
        ))}
      </select>
      <input
        ref={inputRef}
        type="search"
        name="q"
        defaultValue={query}
        placeholder="Search everything…"
        autoFocus={!compact}
        className="min-w-0 flex-1 border border-neutral-700 bg-panel px-3 py-1.5 text-sm outline-none placeholder:text-neutral-600 focus:border-brass"
      />
      {voiceAvailable && (
        <button
          type="button"
          onClick={toggleVoiceSearch}
          className="shrink-0 border border-l-0 border-neutral-700 bg-panel px-2 text-neutral-300 hover:text-paper focus:outline-none focus:ring-1 focus:ring-brass"
          aria-label={voiceStatus === 'listening' ? 'Stop voice search' : 'Start voice search'}
          aria-pressed={voiceStatus === 'listening'}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6.75 6.75 0 0 0 6.75-6.75v-1.5m-13.5 0V12A6.75 6.75 0 0 0 12 18.75m0 0v3m-3 0h6M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" />
          </svg>
        </button>
      )}
      <button
        type="submit"
        className="shrink-0 rounded-r bg-brass px-3 py-1.5 text-sm font-medium text-ink hover:bg-brass-bright"
      >
        Search
      </button>
      {voiceStatus !== 'idle' && (
        <span className="absolute left-0 top-full mt-1 text-xs text-neutral-400" role="status">
          {voiceStatus === 'listening' && 'Listening for a title…'}
          {voiceStatus === 'empty' && 'No speech detected. Try again.'}
          {voiceStatus === 'error' && voiceError}
        </span>
      )}
    </form>
  );
}
