// Gli effetti sonori del combattimento, sintetizzati al momento con Web Audio: niente campioni registrati,
// quindi niente file da importare né licenze. Ogni suono è breve e passa per il canale «effetti» del lettore.

export type Suono = 'dadi' | 'colpo' | 'caduto' | 'parata' | 'magia' | 'cura' | 'dissonanza' | 'minaccia' | 'fermo' | 'vittoria' | 'sconfitta';

let rumoreBianco: AudioBuffer | null = null;
function rumore(ctx: BaseAudioContext): AudioBuffer {
  if (rumoreBianco && rumoreBianco.sampleRate === ctx.sampleRate) return rumoreBianco;
  const b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return (rumoreBianco = b);
}

/** Un'esplosione di rumore filtrato: tocco, schiocco, soffio. */
function soffio(ctx: BaseAudioContext, out: AudioNode, t: number, durata: number, filtro: BiquadFilterType, freq: number, vol: number, q = 1): void {
  const s = ctx.createBufferSource();
  s.buffer = rumore(ctx);
  const f = ctx.createBiquadFilter();
  f.type = filtro; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + durata);
  s.connect(f).connect(g).connect(out);
  s.start(t, Math.random() * 0.5, durata + 0.05);
}

/** Una nota con inviluppo percussivo; `verso` fa scivolare la frequenza. */
function nota(ctx: BaseAudioContext, out: AudioNode, t: number, freq: number, durata: number, vol: number, forma: OscillatorType = 'sine', verso?: number, attacco = 0.005): void {
  const o = ctx.createOscillator();
  o.type = forma;
  o.frequency.setValueAtTime(freq, t);
  if (verso) o.frequency.exponentialRampToValueAtTime(verso, t + durata);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attacco);
  g.gain.exponentialRampToValueAtTime(0.0001, t + durata);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + durata + 0.05);
}

export function suona(ctx: BaseAudioContext, out: AudioNode, s: Suono): void {
  const t = ctx.currentTime + 0.01;
  switch (s) {
    case 'dadi': { // dadi d'osso su un tavolo di legno: tocchi sempre più fitti e più deboli
      let x = t;
      for (let i = 0; i < 9; i++) {
        soffio(ctx, out, x, 0.03, 'bandpass', 1800 + Math.random() * 2200, 0.5 * (1 - i / 11), 4);
        nota(ctx, out, x, 700 + Math.random() * 500, 0.04, 0.05 * (1 - i / 11), 'triangle');
        x += 0.02 + Math.random() * 0.05 * (1 - i / 12);
      }
      break;
    }
    case 'colpo':
      nota(ctx, out, t, 120, 0.18, 0.7, 'sine', 45);
      soffio(ctx, out, t, 0.12, 'lowpass', 900, 0.6);
      soffio(ctx, out, t, 0.04, 'highpass', 2500, 0.25);
      break;
    case 'caduto':
      nota(ctx, out, t, 80, 0.55, 0.8, 'sine', 28);
      soffio(ctx, out, t, 0.35, 'lowpass', 500, 0.6);
      soffio(ctx, out, t + 0.16, 0.25, 'lowpass', 350, 0.35);
      break;
    case 'parata': // lama contro lama: parziali non armoniche che si spengono piano
      for (const [f, v] of [[1180, 0.18], [1810, 0.12], [2630, 0.08], [3970, 0.05]] as const) nota(ctx, out, t, f, 0.45, v, 'sine');
      soffio(ctx, out, t, 0.03, 'highpass', 3000, 0.3);
      break;
    case 'magia': // un accordo che sale e si apre, sopra un soffio che si alza
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => nota(ctx, out, t + i * 0.045, f, 0.8, 0.09, 'sine', f * 1.01, 0.04));
      soffio(ctx, out, t, 0.6, 'bandpass', 4000, 0.12, 0.7);
      break;
    case 'cura':
      nota(ctx, out, t, 523.25, 0.7, 0.14, 'triangle', undefined, 0.02);
      nota(ctx, out, t + 0.12, 783.99, 0.9, 0.12, 'triangle', undefined, 0.02);
      break;
    case 'dissonanza': // due note troppo vicine che battono, e il Mana che torna indietro
      nota(ctx, out, t, 146.8, 0.7, 0.18, 'sawtooth', 110);
      nota(ctx, out, t, 155.6, 0.7, 0.18, 'sawtooth', 104);
      soffio(ctx, out, t, 0.5, 'lowpass', 600, 0.2);
      break;
    case 'minaccia':
      nota(ctx, out, t, 90, 0.35, 0.3, 'sawtooth', 70, 0.08);
      soffio(ctx, out, t, 0.3, 'bandpass', 300, 0.3, 2);
      break;
    case 'fermo':
      soffio(ctx, out, t, 0.08, 'lowpass', 400, 0.4);
      break;
    case 'vittoria':
      [392, 493.88, 587.33, 783.99].forEach((f, i) => nota(ctx, out, t + i * 0.13, f, 1.4 - i * 0.15, 0.13, 'triangle', undefined, 0.01));
      break;
    case 'sconfitta':
      [220, 174.61, 130.81].forEach((f, i) => nota(ctx, out, t + i * 0.32, f, 1.2, 0.2, 'sine', f * 0.97, 0.03));
      soffio(ctx, out, t, 1.2, 'lowpass', 300, 0.15);
      break;
  }
}
