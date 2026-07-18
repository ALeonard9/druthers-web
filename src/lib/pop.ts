// The done/watched sound. Synthesized with WebAudio (no assets); the user
// picks a sound (or silence) on /sounds — stored per-device in localStorage.

const STORAGE_KEY = 'druthers.sound';
export const DEFAULT_SOUND = 'coin';

let ctx: AudioContext | null = null;
function ac(): AudioContext {
  ctx = ctx ?? new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone({
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
}) {
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

function noise({
  dur,
  freq,
  delay = 0,
  peak = 0.3,
}: {
  dur: number;
  freq: number;
  delay?: number;
  peak?: number;
}) {
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

const RECIPES: Record<string, () => void> = {
  pop: () => tone({ from: 620, to: 180, dur: 0.14 }),
  droplet: () => tone({ from: 300, to: 950, dur: 0.09, peak: 0.22 }),
  cork: () => {
    tone({ from: 220, to: 90, dur: 0.12, peak: 0.35 });
    noise({ dur: 0.03, freq: 1200, peak: 0.12 });
  },
  marimba: () => {
    tone({ from: 660, to: 655, dur: 0.16, peak: 0.25 });
    tone({ from: 1980, to: 1960, dur: 0.06, peak: 0.08 });
  },
  ding: () => {
    tone({ from: 523, to: 523, dur: 0.08, peak: 0.18 });
    tone({ from: 784, to: 784, dur: 0.14, delay: 0.07, peak: 0.2 });
  },
  tick: () => noise({ dur: 0.04, freq: 2400, peak: 0.25 }),
  chime: () => {
    tone({ from: 880, to: 875, dur: 0.4, peak: 0.16 });
    tone({ from: 1320, to: 1310, dur: 0.25, peak: 0.08 });
  },
  coin: () => {
    tone({ type: 'triangle', from: 520, to: 520, dur: 0.05, peak: 0.18 });
    tone({
      type: 'triangle',
      from: 660,
      to: 660,
      dur: 0.16,
      delay: 0.05,
      peak: 0.2,
    });
  },
  thock: () => {
    noise({ dur: 0.06, freq: 350, peak: 0.4 });
    tone({ from: 180, to: 120, dur: 0.08, peak: 0.2 });
  },
  sparkle: () => {
    tone({ from: 620, to: 180, dur: 0.12 });
    tone({ from: 1568, to: 1560, dur: 0.12, delay: 0.09, peak: 0.07 });
  },
};

export const SOUND_CHOICES: { id: string; name: string; hint: string }[] = [
  { id: 'coin', name: 'Coin', hint: 'rising game blip (default)' },
  { id: 'pop', name: 'Bubble pop', hint: 'sine drop, snappy' },
  { id: 'droplet', name: 'Droplet', hint: 'rising water blip' },
  { id: 'cork', name: 'Cork', hint: 'deeper, rounder pop' },
  { id: 'marimba', name: 'Marimba', hint: 'wooden tap' },
  { id: 'ding', name: 'Ding-up', hint: 'two quick notes' },
  { id: 'tick', name: 'Tick', hint: 'dry click, quietest' },
  { id: 'chime', name: 'Chime', hint: 'small bell with ring-out' },
  { id: 'thock', name: 'Thock', hint: 'soft knock, muted' },
  { id: 'sparkle', name: 'Pop + sparkle', hint: 'pop with a chime tail' },
  { id: 'none', name: 'No sound', hint: 'silence' },
];

const listeners = new Set<() => void>();

/** Re-render subscription for the settings UI (useSyncExternalStore). */
export function subscribeSoundChoice(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getSoundChoice(): string {
  if (typeof window === 'undefined') return DEFAULT_SOUND;
  return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_SOUND;
}

export function setSoundChoice(id: string): void {
  localStorage.setItem(STORAGE_KEY, id);
  for (const cb of listeners) cb();
}

/** Preview a specific sound (settings page). */
export function playSound(id: string): void {
  if (typeof window === 'undefined' || id === 'none') return;
  try {
    (RECIPES[id] ?? RECIPES[DEFAULT_SOUND])();
  } catch {
    // Audio is a garnish — never let it break the action.
  }
}

/** The done/watched sound, honoring the user's choice. */
export function playPop(): void {
  playSound(getSoundChoice());
}
