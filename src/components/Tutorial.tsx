'use client';

import { useState, useEffect } from 'react';

const TUTORIAL_KEY = 'druthers_tutorial_seen';

export function useTutorial(hasItems: boolean) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (hasItems) return;
    if (typeof window !== 'undefined') {
      const seen = localStorage.getItem(TUTORIAL_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (!seen) setShow(true);
    }
  }, [hasItems]);

  function dismiss() {
    localStorage.setItem(TUTORIAL_KEY, 'true');
    setShow(false);
  }

  function launch() {
    setShow(true);
  }

  return { show, dismiss, launch };
}

export function TutorialModal({ onDismiss }: { onDismiss: () => void }) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to druthers',
      body: 'Your favorites — watched, read, played, and ranked. Let’s take a quick look around.',
      emoji: '👋',
    },
    {
      title: 'Find & Add',
      body: 'Use the Search bar at the top or the Add button on any shelf to capture titles you want to track.',
      emoji: '🔍',
    },
    {
      title: 'Rank by comparison',
      body: 'Instead of assigning numbers, you rank items by choosing between two titles until a list is built.',
      emoji: '⚖️',
    },
    {
      title: 'Keep track',
      body: 'See what you’re actively watching or playing in the Tonight section, and stay caught up.',
      emoji: '🗓️',
    },
    {
      title: 'Share your tastes',
      body: 'Once you’ve built your lists, share your Top 5 or full shelves with friends.',
      emoji: '💌',
    },
  ];

  const current = steps[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-night/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-panel p-6 shadow-2xl">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brass-wash text-3xl">
            {current.emoji}
          </div>
          <div>
            <h2 className="font-display text-2xl font-medium text-paper">
              {current.title}
            </h2>
            <p className="mt-2 text-sm text-neutral-400">
              {current.body}
            </p>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${
                  i === step ? 'bg-brass' : 'bg-line'
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onDismiss}
              className="rounded px-3 py-2 text-sm text-neutral-400 hover:text-white"
            >
              Skip
            </button>
            <button
              onClick={() => {
                if (step < steps.length - 1) setStep(step + 1);
                else onDismiss();
              }}
              className="rounded bg-brass px-4 py-2 text-sm font-medium text-ink hover:bg-brass-bright"
            >
              {step < steps.length - 1 ? 'Next' : 'Done'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TutorialLauncher({ hasItems }: { hasItems: boolean }) {
  const { show, dismiss } = useTutorial(hasItems);

  if (!show) return null;

  return <TutorialModal onDismiss={dismiss} />;
}

export function ReplayTutorialButton() {
  const [show, setShow] = useState(false);

  return (
    <>
      <button
        onClick={() => setShow(true)}
        className="mt-6 self-center text-sm text-neutral-400 hover:text-white underline decoration-line underline-offset-4"
      >
        Replay druthers tutorial
      </button>
      {show && <TutorialModal onDismiss={() => setShow(false)} />}
    </>
  );
}
