'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

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

export function VoiceSearch({ onTranscript, className }: { onTranscript: (transcript: string) => void; className?: string }) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onTranscriptRef = useRef(onTranscript);
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
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

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

      onTranscriptRef.current(transcript);
      recognition.stop();
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

  if (!voiceAvailable) return null;

  return (
    <div className="relative flex">
      <button
        type="button"
        onClick={toggleVoiceSearch}
        className={className}
        aria-label={voiceStatus === 'listening' ? 'Stop voice search' : 'Start voice search'}
        aria-pressed={voiceStatus === 'listening'}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6.75 6.75 0 0 0 6.75-6.75v-1.5m-13.5 0V12A6.75 6.75 0 0 0 12 18.75m0 0v3m-3 0h6M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" />
        </svg>
      </button>
      {voiceStatus !== 'idle' && (
        <span className="absolute left-0 top-full mt-1 whitespace-nowrap text-xs text-neutral-400" role="status">
          {voiceStatus === 'listening' && 'Listening for a title…'}
          {voiceStatus === 'empty' && 'No speech detected. Try again.'}
          {voiceStatus === 'error' && voiceError}
        </span>
      )}
    </div>
  );
}
