'use client';

// TEMPORARY: sound audition page — pick the done/watched sound, then this
// page gets deleted and the winner moves into lib/pop.ts.

let ctx: AudioContext | null = null;
function ac(): AudioContext {
  ctx = ctx ?? new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(
  {
    type = 'sine' as OscillatorType,
    from,
    to,
    dur,
    delay = 0,
    peak = 0.28,
  }: {
    type?: OscillatorType;
    from: number;
    to: number;
    dur: number;
    delay?: number;
    peak?: number;
  },
) {
  const a = ac();
  const t = a.currentTime + delay;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(to, 1), t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(peak, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noise({ dur, freq, delay = 0, peak = 0.3 }: { dur: number; freq: number; delay?: number; peak?: number }) {
  const a = ac();
  const t = a.currentTime + delay;
  const buffer = a.createBuffer(1, a.sampleRate * dur, a.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource();
  src.buffer = buffer;
  const filter = a.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  filter.Q.value = 1.2;
  const gain = a.createGain();
  gain.gain.setValueAtTime(peak, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter).connect(gain).connect(a.destination);
  src.start(t);
}

const SOUNDS: { name: string; hint: string; play: () => void }[] = [
  {
    name: '1 · Bubble pop (current)',
    hint: 'sine drop, snappy',
    play: () => tone({ from: 620, to: 180, dur: 0.14 }),
  },
  {
    name: '2 · Droplet',
    hint: 'rising water blip',
    play: () => tone({ from: 300, to: 950, dur: 0.09, peak: 0.22 }),
  },
  {
    name: '3 · Cork',
    hint: 'deeper, rounder pop',
    play: () => {
      tone({ from: 220, to: 90, dur: 0.12, peak: 0.35 });
      noise({ dur: 0.03, freq: 1200, peak: 0.12 });
    },
  },
  {
    name: '4 · Marimba',
    hint: 'wooden tap, two partials',
    play: () => {
      tone({ from: 660, to: 655, dur: 0.16, peak: 0.25 });
      tone({ from: 1980, to: 1960, dur: 0.06, peak: 0.08 });
    },
  },
  {
    name: '5 · Ding-up',
    hint: 'two quick notes, cheerful',
    play: () => {
      tone({ from: 523, to: 523, dur: 0.08, peak: 0.18 });
      tone({ from: 784, to: 784, dur: 0.14, delay: 0.07, peak: 0.2 });
    },
  },
  {
    name: '6 · Tick',
    hint: 'dry click, quietest',
    play: () => noise({ dur: 0.04, freq: 2400, peak: 0.25 }),
  },
  {
    name: '7 · Chime',
    hint: 'small bell with ring-out',
    play: () => {
      tone({ from: 880, to: 875, dur: 0.4, peak: 0.16 });
      tone({ from: 1320, to: 1310, dur: 0.25, peak: 0.08 });
    },
  },
  {
    name: '8 · Coin',
    hint: 'rising game blip',
    play: () => {
      tone({ type: 'triangle', from: 520, to: 520, dur: 0.05, peak: 0.18 });
      tone({ type: 'triangle', from: 660, to: 660, dur: 0.16, delay: 0.05, peak: 0.2 });
    },
  },
  {
    name: '9 · Thock',
    hint: 'soft knock, muted',
    play: () => {
      noise({ dur: 0.06, freq: 350, peak: 0.4 });
      tone({ from: 180, to: 120, dur: 0.08, peak: 0.2 });
    },
  },
  {
    name: '10 · Pop + sparkle',
    hint: 'the pop with a tiny chime tail',
    play: () => {
      tone({ from: 620, to: 180, dur: 0.12 });
      tone({ from: 1568, to: 1560, dur: 0.12, delay: 0.09, peak: 0.07 });
    },
  },
];

export default function SoundsPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-paper">
          Pick the pop
        </h1>
        <p className="text-sm text-neutral-400">
          Temporary page. Tap each and tell me the number — the winner becomes
          the watched/done sound everywhere.
        </p>
      </div>
      <ul className="divide-y divide-line/60 rounded-lg border border-line bg-panel">
        {SOUNDS.map((s) => (
          <li key={s.name} className="flex items-center gap-3 px-4 py-2.5">
            <span className="flex-1 text-sm">
              {s.name}
              <span className="block text-xs text-neutral-500">{s.hint}</span>
            </span>
            <button
              onClick={s.play}
              className="shrink-0 rounded bg-moss-wash px-3 py-1.5 text-xs font-medium text-moss hover:bg-moss hover:text-ink"
            >
              ▶ Play
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
