import { readFileSync } from 'node:fs';
import { CONTENUTI as c } from '../src/dati/contenuti';
import { leggiGapless, confiniLoop } from '../src/ui/audio';
import { sceltaAudio } from '../src/ui/colonna';

describe('MP3 senza stacchi', () => {
  // mezzo secondo di sinusoide a 48 kHz: 24000 campioni utili
  const dati = readFileSync(new URL('./fixture/sinusoide.mp3', import.meta.url));
  const buf = dati.buffer.slice(dati.byteOffset, dati.byteOffset + dati.byteLength);
  const g = leggiGapless(buf)!;

  it('legge frame, ritardo e riempimento dall\'intestazione', () => {
    expect(g.frequenza).toBe(48000);
    expect(g.frame * g.campioniPerFrame - g.ritardo - g.riempimento).toBe(24000);
  });

  it('se il browser ha già tolto il silenzio, il loop è tutto il buffer', () => {
    const l = confiniLoop(24000, 48000, g);
    expect(l.inizio).toBe(0);
    expect(l.fine).toBeCloseTo(0.5, 6);
  });

  it('se il browser non lo toglie, il loop salta ritardo dell\'encoder e del decoder', () => {
    const l = confiniLoop(g.frame * g.campioniPerFrame, 48000, g);
    expect(l.inizio * 48000).toBeCloseTo(g.ritardo + 529, 3);
    expect((l.fine - l.inizio) * 48000).toBeCloseTo(24000, 3);
  });

  it('con un buffer ricampionato scala i confini', () => {
    const l = confiniLoop(Math.round(g.frame * g.campioniPerFrame * 44100 / 48000), 44100, g);
    expect(l.fine - l.inizio).toBeCloseTo(0.5, 4);
  });
});

describe('colonna sonora', () => {
  it('lo strato più specifico vince, il resto si eredita', () => {
    const cb = sceltaAudio(c, { area: 'citta-bassa' });
    expect(cb.musica).toBeTruthy();
    const pign = sceltaAudio(c, { area: 'citta-bassa', luogo: 'pignatta-grassa' });
    expect(pign.musica).not.toBe(cb.musica);
    expect(pign.ambiente).toBe(cb.ambiente); // la Pignatta non dichiara l'ambiente: resta quello del quartiere
    const lotta = sceltaAudio(c, { area: 'citta-bassa', luogo: 'pignatta-grassa', combattimento: true });
    expect(lotta.musica).toBe(c.colonna.find((v) => v.contesto === 'combattimento')!.musica);
  });

  it('"nessuno" spegne l\'ambiente ereditato', () => {
    expect(sceltaAudio(c, { area: 'quartieri-alti', luogo: 'biblioteca-di-qir-azel' }).ambiente).toBeNull();
  });

  it('ogni area della città e ogni spedizione ha una musica propria', () => {
    for (const a of c.aree) expect(c.colonna.some((v) => v.contesto === 'area' && v.id === a.id && v.musica)).toBe(true);
  });
});
