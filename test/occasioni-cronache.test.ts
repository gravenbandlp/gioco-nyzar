// Le mini-Cronache del mazzo (17 ottobre 2026): ogni esito che chiude la storia paga il premio finale in lyssan,
// 50 a passo in città e 70 in Superficie. Le chiusure anticipate della Superficie pagano 70 per passo raggiunto.
import { describe, it, expect } from 'vitest';
import { CONTENUTI as c } from '../src/dati/contenuti';
import type { TStorylet } from '../src/motore/contenuto';

type Esito = NonNullable<TStorylet['opzioni'][number]['esito']>;

/** La catena, gli storylet che la chiudono, come si riconosce un esito di chiusura e il premio minimo. */
const CATENE: { id: string; finali: string[]; chiude: (e: Esito) => boolean; premio: number }[] = [
  { id: 'fosco', finali: ['carta-fosco-la-casa-quattordici'], chiude: (e) => e.imposta?.['fosco'] === 3 || e.effetti?.['oggetto.taccuino-dei-civici'] === 1, premio: 150 },
  { id: 'lusardi', finali: ['carta-qa-lusardi-ultima-stanza'], chiude: (e) => (e.imposta?.['lusardi.passo'] ?? e.effetti?.['lusardi.passo'] ?? 0) > 0, premio: 150 },
  { id: 'ilde', finali: ['carta-ilde-l-ultima-traversata'], chiude: (e) => (e.effetti?.['chiatta.fine'] ?? e.imposta?.['chiatta.fine'] ?? 0) > 0, premio: 200 },
  { id: 'bottega', finali: ['carta-cb-bottega-la-grata'], chiude: (e) => (e.imposta?.['bottega.fine'] ?? e.effetti?.['bottega.fine'] ?? 0) > 0, premio: 200 },
  { id: 'governante', finali: ['carta-qa2-governante-scelta'], chiude: (e) => (e.imposta?.['governante.fine'] ?? e.effetti?.['governante.fine'] ?? 0) > 0, premio: 200 },
  { id: 'pontiere', finali: ['carta-ps2-pontiere-la-campata'], chiude: (e) => (e.imposta?.['pontiere.fine'] ?? e.effetti?.['pontiere.fine'] ?? 0) > 0, premio: 200 },
  { id: 'lettere', finali: ['carta-ov-lettere-lo-scrivano'], chiude: (e) => (e.imposta?.['lettere.fine'] ?? e.effetti?.['lettere.fine'] ?? 0) > 0, premio: 200 },
  { id: 'carovana', finali: ['carta-sfc-carovana-fine'], chiude: (e) => (e.imposta?.['carovana.fine'] ?? e.effetti?.['carovana.fine'] ?? 0) > 0, premio: 350 },
  { id: 'cartografo', finali: ['carta-sfc-cartografo-fine'], chiude: (e) => (e.imposta?.['cartografo.fine'] ?? e.effetti?.['cartografo.fine'] ?? 0) > 0, premio: 280 },
  { id: 'mercante', finali: ['carta-sup-mercante-scatola'], chiude: () => true, premio: 350 },
  { id: 'bambino', finali: ['carta-sup-bambino-fine'], chiude: (e) => (e.effetti?.['bambino.fine'] ?? 0) > 0, premio: 280 },
  { id: 'cavaliere', finali: ['carta-sup-cavaliere-nome'], chiude: () => true, premio: 350 },
  { id: 'frattura', finali: ['sup-frattura-respiro-lungo', 'sup-frattura-che-respira'], chiude: (e) => (e.effetti?.['frattura.premio'] ?? 0) > 0 || (e.effetti?.['frattura.spenta'] ?? e.imposta?.['frattura.spenta'] ?? 0) > 0, premio: 350 },
  { id: 'corriere', finali: ['carta-sup3-il-messaggero-ritorna'], chiude: () => true, premio: 140 },
  { id: 'cane', finali: ['carta-sup3-il-cane-ritorna'], chiude: () => true, premio: 140 },
  { id: 'voce', finali: ['carta-sup3-la-voce-fine'], chiude: (e) => e.imposta?.['sup3.voce'] === 99, premio: 210 },
];

const esiti = (st: TStorylet) => st.opzioni.flatMap((o) => [o.esito, o.successo, o.fallimento, o.vittoria, o.sconfitta]).filter((e): e is Esito => !!e);

describe('le mini-Cronache del mazzo', () => {
  it('ogni chiusura paga il premio finale', () => {
    for (const k of CATENE) {
      const chiusure = k.finali.flatMap((id) => {
        const st = c.storylet.find((x) => x.id === id);
        expect(st, id).toBeDefined();
        return esiti(st!).filter(k.chiude);
      });
      expect(chiusure.length, k.id).toBeGreaterThan(0);
      for (const e of chiusure) expect(e.effetti?.['monete'] ?? 0, `${k.id}: ${e.titolo}`).toBeGreaterThanOrEqual(k.premio);
    }
  });

  it('le catene sono nelle Cronache', () => {
    for (const k of CATENE) expect(c.raccolte.some((r) => r.id === k.id), k.id).toBe(true);
  });

  it('le chiusure anticipate della Superficie pagano qualcosa', () => {
    const anticipate = c.storylet.filter((st) => ['carta-sup-bambino', 'carta-sup-bambino-torna', 'carta-sup-bambino-2', 'carta-sup-bambino-3',
      'carta-sup-cavaliere', 'carta-sup-cavaliere-torna', 'carta-sup3-la-voce', 'carta-sup3-la-voce-torna'].includes(st.id));
    expect(anticipate).toHaveLength(8);
    for (const st of anticipate) for (const e of esiti(st)) {
      const chiude = e.effetti?.['bambino.fine'] === 4 || e.effetti?.['cavaliere.fine'] === 1 || e.imposta?.['sup3.voce'] === 99;
      if (chiude) expect(e.effetti?.['monete'] ?? 0, `${st.id}: ${e.titolo}`).toBeGreaterThanOrEqual(70);
    }
  });
});
