// Short two-note chime made with Web Audio, so there's no sound file to download.
let ctx: AudioContext | null = null;

const audio = () => {
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
};

// Browsers only allow audio after the user has interacted with the page once.
if (typeof window !== 'undefined') {
  const unlock = () => {
    audio()?.resume().catch(() => undefined);
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
}

export const playChime = () => {
  const ac = audio();
  if (!ac || ac.state !== 'running') return;
  const now = ac.currentTime;
  [
    { freq: 880, at: 0 },
    { freq: 1318.5, at: 0.11 },
  ].forEach(({ freq, at }) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, now + at);
    gain.gain.linearRampToValueAtTime(0.12, now + at + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + at + 0.45);
    osc.connect(gain).connect(ac.destination);
    osc.start(now + at);
    osc.stop(now + at + 0.5);
  });
};
