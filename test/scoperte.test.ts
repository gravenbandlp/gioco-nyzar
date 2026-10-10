// La Superficie dopo l'Arena (docs/piano-superficie.md): l'aggancio in città, «Battere la Superficie» che porta ogni
// luogo nero a tre tracce, e le carte di voci che spariscono quando il luogo è scoperto.
import { describe, it, expect } from 'vitest';
import { nuovoPersonaggio, storyletDisponibili, cartePescabili, type Stato } from '../src/motore/personaggio';
import { scegli, anteprima } from '../src/motore/azioni';
import { CONTENUTI as c } from '../src/dati/contenuti';
import { rngConSeme } from '../src/motore/dadi';
import { RINTOCCHI_MAX } from '../src/motore/regole';

const LUOGHI = ['anello', 'spina', 'sornione', 'mara', 'costola', 'tamburi', 'aculeo', 'forno', 'stele'];
const BATTERE = c.storylet.find((x) => x.id === 'battere-la-superficie')!;

function dopoArena(): Stato {
  const s = nuovoPersonaggio('Vessa', c.origini.find((o) => o.id === 'figlio-della-citta-bassa')!, 0, 'superficie-fratturata');
  delete s.quality['prologo'];
  s.quality['pista.arena'] = 5;
  return s;
}

describe('la Superficie dopo l\'Arena', () => {
  it('prima della fine dell\'Arena non si batte la Superficie e non arrivano le carte di voci', () => {
    const s = dopoArena();
    s.quality['pista.arena'] = 4;
    expect(storyletDisponibili(s, c).some((x) => x.id === BATTERE.id)).toBe(false);
    expect(cartePescabili(s, c).some((x) => x.id.startsWith('carta-voci-'))).toBe(false);
  });

  it('l\'aggancio dopo il torneo si legge una volta sola', () => {
    const s = dopoArena();
    s.area = 'quartieri-alti';
    s.quality['invito'] = 1;
    s.quality['pista.capomozzo'] = 7; // il luogo dell'Arena compare con il ritorno da Capomozzo
    const st = c.storylet.find((x) => x.id === 'gente-di-fuori')!;
    expect(storyletDisponibili(s, c).some((x) => x.id === st.id)).toBe(true);
    scegli(s, st, 0, c, 0);
    expect(s.quality['villaggi.notizie']).toBe(1);
    expect(storyletDisponibili(s, c).some((x) => x.id === st.id)).toBe(false);
  });

  it('battendo la Superficie si scoprono tutti e nove i luoghi neri, una direzione alla volta', () => {
    const s = dopoArena();
    const rng = rngConSeme(3);
    for (let n = 0; n < 2000 && LUOGHI.some((l) => (s.quality[`traccia.${l}`] ?? 0) < 3); n++) {
      s.rintocchi = RINTOCCHI_MAX;
      // si sceglie sempre una direzione con un luogo ancora da scoprire
      const ok = BATTERE.opzioni.map((o, i) => ({ o, i }))
        .filter(({ o }) => anteprima(s, o, c).disponibile && Object.keys(o.successo?.effetti ?? o.esito?.imposta ?? {}).some((k) => k.startsWith('traccia.')));
      expect(ok.length, `nessuna direzione aperta (${JSON.stringify(s.quality)})`).toBeGreaterThan(0);
      scegli(s, BATTERE, ok[Math.floor(rng() * ok.length)]!.i, c, 0, rng);
    }
    for (const l of LUOGHI) expect(s.quality[`traccia.${l}`] ?? 0, l).toBeGreaterThanOrEqual(3);
  });

  it('per ogni direzione si vede un solo luogo alla volta', () => {
    const s = dopoArena();
    const aperte = BATTERE.opzioni.filter((o) => anteprima(s, o, c).disponibile).map((o) => o.testo);
    expect(aperte).toEqual([
      'Battere il nord, verso il Rovolungo', "Battere l'est, oltre l'orlo del Gradone", 'Battere il sud, verso Ghoran',
      "Battere l'ovest, verso Laresh", 'Girare dove porta il sentiero',
    ]);
  });

  it('le carte di voci arrivano finché il loro luogo non è scoperto', () => {
    const s = dopoArena();
    expect(cartePescabili(s, c).filter((x) => x.id.startsWith('carta-voci-')).length).toBe(LUOGHI.length);
    for (const l of LUOGHI) s.quality[`traccia.${l}`] = 3;
    expect(cartePescabili(s, c).some((x) => x.id.startsWith('carta-voci-'))).toBe(false);
  });

  it('chi ha già visto la Spina con il Circolo o le Stele con i Raschiatori non deve cercarle', () => {
    const s = dopoArena();
    s.quality['circolo.parola'] = 1;
    s.quality['fazione.raschiatori'] = 11;
    const scorciatoie = BATTERE.opzioni.map((o, i) => ({ o, i })).filter(({ o }) => o.costo === 0 && anteprima(s, o, c).disponibile);
    expect(scorciatoie.length).toBe(2);
    for (const { i } of scorciatoie) scegli(s, BATTERE, i, c, 0);
    expect(s.quality['traccia.spina']).toBe(3);
    expect(s.quality['traccia.stele']).toBe(3);
  });
});
