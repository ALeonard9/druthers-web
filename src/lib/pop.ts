// A tiny synthesized "bubble pop" for done/watched actions (Todoist-style).
// WebAudio synthesis — no audio asset to load, nothing on the wire.

let ctx: AudioContext | null = null;

export function playPop(): void {
  if (typeof window === 'undefined') return;
  try {
    ctx = ctx ?? new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    const t = ctx.currentTime;

    // The pop: a sine blip whose pitch drops fast, with a snappy envelope.
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(620, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.12);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.28, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  } catch {
    // Audio is a garnish — never let it break the action.
  }
}
