/**
 * Son de notification temps réel — généré via Web Audio API (pas de fichier audio à charger).
 * Utilisé partout où une notification socket.io arrive en direct (owner, locataire, admin).
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) audioCtx = new Ctor();
  return audioCtx;
}

/** Joue un court carillon à deux notes pour signaler une nouvelle notification temps réel. */
export function playNotificationSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    const now = ctx.currentTime;
    const notes: { freq: number; start: number; duration: number }[] = [
      { freq: 880,    start: 0,   duration: 0.14 },
      { freq: 1318.5, start: 0.1, duration: 0.18 },
    ];

    notes.forEach(({ freq, start, duration }) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.2, now + start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + duration + 0.02);
    });
  } catch {
    // Silencieux si l'audio n'est pas disponible (ex: politique autoplay du navigateur)
  }
}
