// Le regole aggiunte con la revisione finale: seguiti in coda, opzioni chiuse dalla trama nascoste, frammenti
// del Codex che scadono, il viaggio di Galdrick nei vecchi salvataggi.
import { describe, it, expect } from 'vitest';
import { CONTENUTI as c } from '../src/dati/contenuti';
import { nuovoPersonaggio, requisitiSoddisfatti, aggiornaTempo } from '../src/motore/personaggio';
import { opzioniVisibili, diTrama } from '../src/motore/crisi';
import { scegli } from '../src/motore/azioni';
import type { TStorylet } from '../src/motore/contenuto';

const pg = () => { const s = nuovoPersonaggio('Vessa', c.origini[0]!, 0, 'citta-bassa'); delete s.quality['prologo']; return s; };
const finta = (id: string, opzioni: TStorylet['opzioni']): TStorylet =>
  ({ id, titolo: id, area: 'citta-bassa', tipo: 'fisso', ripetibile: true, requisiti: [], testo: 'x', opzioni });

describe('revisione finale', () => {
  it('un seguito nuovo non cancella quello in sospeso', () => {
    const s = pg();
    const seguiti = c.storylet.filter((x) => x.tipo === 'seguito').slice(0, 2).map((x) => x.id);
    const apre = (verso: string) => finta(`apre-${verso}`, [{ testo: 'vai', costo: 0, esito: { testo: 'x', segue: verso } }]);
    scegli(s, apre(seguiti[0]!), 0, c, 0);
    scegli(s, apre(seguiti[1]!), 0, c, 0);
    expect(s.sospeso).toBe(seguiti[1]);
    // giocare il secondo riporta in cima il primo
    const secondo = c.storylet.find((x) => x.id === seguiti[1])!;
    const i = secondo.opzioni.findIndex((o) => !!o.esito && !o.esito.segue);
    if (i >= 0 && requisitiSoddisfatti(s, secondo.opzioni[i]!.requisiti, c)) {
      scegli(s, secondo, i, c, 0, () => 0, { gratis: true });
      expect(s.sospeso).toBe(seguiti[0]);
    }
  });

  it('le opzioni chiuse da un fatto della trama non si vedono, quelle chiuse da cose da procurarsi sì', () => {
    const s = pg();
    const st = finta('prova', [
      { testo: 'sempre', costo: 0, esito: { testo: 'x' } },
      { testo: 'dopo la pelle', requisiti: ['pista.pelle >= 6'], esito: { testo: 'x' } },
      { testo: 'con le monete', requisiti: ['monete >= 9999'], esito: { testo: 'x' } },
    ]);
    expect(diTrama('pista.pelle >= 6', c)).toBe(true);
    expect(diTrama('monete >= 10', c)).toBe(false);
    expect(opzioniVisibili(s, st, c).map((i) => st.opzioni[i]!.testo)).toEqual(['sempre', 'con le monete']);
  });

  it('i frammenti del Codex hanno requisiti validi e alcuni scadono con la trama', () => {
    expect(c.frammenti.filter((f) => f.requisiti.length).length).toBeGreaterThanOrEqual(4);
    const s = pg();
    s.quality['pista.pelle'] = 7;
    expect(requisitiSoddisfatti(s, c.frammenti.find((f) => f.id === 'pignatta-grassa')!.requisiti, c)).toBe(false);
  });

  it('chi era già nel viaggio di Galdrick riceve il flag', () => {
    const s = pg();
    Object.assign(s.quality, { 'pista.tribu': 4, 'pista.acciaio': 3 });
    aggiornaTempo(s, 0);
    expect(s.quality['galdrick.via']).toBe(1);
    const t = pg();
    Object.assign(t.quality, { 'pista.tribu': 4, 'pista.acciaio': 8 });
    aggiornaTempo(t, 0);
    expect(t.quality['galdrick.via']).toBeUndefined();
  });
});
