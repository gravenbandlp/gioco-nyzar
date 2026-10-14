// Le Cronache: ogni storia lunga sta in una sezione, ogni storia da giocare una volta appartiene a una storia lunga
// (o è una delle storie singole elencate qui), le raccolte contano i passi e le spedizioni sanno di chi sono.
import { describe, it, expect } from 'vitest';
import { CONTENUTI as c } from '../src/dati/contenuti';
import { nuovoPersonaggio, parseRequisito } from '../src/motore/personaggio';
import { serieDi, avanzamento, prossimoPasso, sbarra, statoSpedizione } from '../src/motore/serie';

/** Le scene che si giocano una volta e non fanno parte di una storia lunga: incontri, epiloghi, scelte sciolte. */
const STORIE_SINGOLE = [
  'chiedere-a-dragna', 'custodi-di-passaggio', 'il-registro-delle-allieve', 'il-compito-di-aurenne', 'dolovan-e-gli-orchi',
  'la-bilancia-di-grusk', 'la-segheria-dopo-i-malgrani', 'l-acciaieria-senza-padrone', 'scelta-mutazione', 'chi-sa-dove-si-e-spostato',
  'accademia-l-uomo-della-casa-dei-nodi', 'circolo-i-raschiatori-al-margine', 'gilda-il-sigillo-o-l-ombra', 'gilda-il-seggio-dei-malgrani',
  'gilda-il-pezzo-di-irsa', 'maison-laure-sulla-soglia', 'grifone-liaren', 'il-tavolo-d-angolo', 'la-rivincita', 'la-guerra-privata',
  'la-piastrina-di-dorr', 'la-cantina-dei-tamberlo', 'fare-pace-con-oddo', 'gente-di-fuori', 'oda-incontro',
];
/** Le spedizioni che non appartengono a nessuna storia lunga. */
const SPEDIZIONI_SINGOLE = ['villaggio-storto'];

const pg = () => nuovoPersonaggio('Vessa', c.origini[0]!, 0, 'citta-bassa');

describe('le cronache', () => {
  const { serie, diStorylet, spedizioni } = serieDi(c);

  it('ogni storia lunga sta in una sezione sola, e le sezioni citano solo storie che esistono', () => {
    const citate = c.sezioni.flatMap((x) => x.serie);
    for (const z of serie) expect(citate.filter((id) => id === z.id), z.id).toHaveLength(1);
    for (const id of citate) expect(serie.some((z) => z.id === id), id).toBe(true);
  });

  it('i passi delle raccolte chiedono quality che esistono', () => {
    const quality = new Set(c.quality.map((q) => q.id));
    for (const r of c.raccolte) for (const p of [...r.passi, ...(r.conclusa ? [r.conclusa] : [])]) {
      expect(quality.has(parseRequisito(p).chiave), `${r.id}: ${p}`).toBe(true);
    }
  });

  it('ogni scena da giocare una volta appartiene a una storia lunga, o è una storia singola dichiarata', () => {
    const fuori = new Set(c.aree.filter((a) => a.spedizione || a.penalita).map((a) => a.id));
    const sciolte = c.storylet.filter((st) => !st.ripetibile && ['fisso', 'seguito'].includes(st.tipo) && !fuori.has(st.area) && !diStorylet.has(st.id))
      .map((st) => st.id);
    // le carte sono occasioni del mazzo, e i seguiti delle carte restano con loro
    const carte = new Set(c.storylet.filter((st) => st.tipo === 'carta').flatMap((st) => st.opzioni.flatMap((o) => [o.esito, o.successo, o.fallimento, o.vittoria, o.sconfitta].map((e) => e?.segue))));
    expect(sciolte.filter((id) => !STORIE_SINGOLE.includes(id) && !carte.has(id))).toEqual([]);
    for (const id of STORIE_SINGOLE) expect(c.storylet.some((st) => st.id === id), id).toBe(true);
  });

  it('ogni spedizione appartiene a una storia lunga', () => {
    const date = new Set([...spedizioni.values()].flat().map((a) => a.id));
    expect(c.aree.filter((a) => a.spedizione && !date.has(a.id) && !SPEDIZIONI_SINGOLE.includes(a.id)).map((a) => a.id)).toEqual([]);
    expect(spedizioni.get('raccolta.luoghi-neri')!.map((a) => a.id)).toEqual(expect.arrayContaining(['costola-di-drago', 'campana-batacchio']));
    expect(spedizioni.get('fazione.caserma')!.map((a) => a.id)).toContain('caserma-mulino-nero');
  });

  it('i luoghi neri contano le misure e la Campana, e il cuore vinto si riconosce', () => {
    const s = pg();
    const z = serie.find((x) => x.id === 'raccolta.luoghi-neri')!;
    const costola = c.aree.find((a) => a.id === 'costola-di-drago')!;
    expect(avanzamento(s, z)).toBe(0);
    expect(statoSpedizione(s, c, costola)).toBe('chiusa');
    s.quality['traccia.costola'] = 3;
    s.quality['pista.arena'] = 5;
    expect(statoSpedizione(s, c, costola)).toBe('aperta');
    s.quality['misura.costola'] = 1;
    s.quality['campana.strato'] = 2;
    expect(avanzamento(s, z)).toBe(3);
    expect(statoSpedizione(s, c, costola)).toBe('vinta');
  });

  it('una raccolta chiusa per strada conta come conclusa', () => {
    const s = pg();
    const z = serie.find((x) => x.id === 'raccolta.bambino')!;
    s.quality['bambino.stadio'] = 1;
    expect(avanzamento(s, z)).toBe(1);
    s.quality['bambino.fine'] = 3;
    expect(avanzamento(s, z)).toBe(z.massimo);
    expect(prossimoPasso(s, c, z)).toBeUndefined();
  });

  it('il prossimo passo di una pista è la storia del passo a cui sei', () => {
    const s = pg();
    s.quality['prologo'] = 0;
    const z = serie.find((x) => x.id === 'pista.dama-argento')!;
    const p = prossimoPasso(s, c, z);
    expect(p?.st.requisiti).toContain('pista.dama-argento == 0');
  });

  it("un bivio già deciso ferma la storia dell'altra strada, e lo dice", () => {
    const s = pg();
    const caserma = serie.find((x) => x.id === 'fazione.caserma')!;
    const scuri = serie.find((x) => x.id === 'fazione.scuri')!;
    s.quality['fazione.caserma'] = 8;
    s.quality['fazione.scuri'] = 8;
    s.quality['pista.pelle'] = 6;
    // ancora da decidere: tutte e due le strade restano aperte
    expect(sbarra(s, c, caserma)).toBeUndefined();
    expect(sbarra(s, c, scuri)).toBeUndefined();
    s.quality['bivio.legge'] = 2;
    expect(prossimoPasso(s, c, caserma)?.aperta).toBe(false);
    expect(sbarra(s, c, caserma)).toEqual({ quality: 'bivio.legge', scelta: 'gli Scuri' });
    expect(sbarra(s, c, scuri)).toBeUndefined();
    s.quality['bivio.legge'] = 1;
    expect(sbarra(s, c, scuri)).toEqual({ quality: 'bivio.legge', scelta: 'la Caserma' });
    expect(sbarra(s, c, caserma)).toBeUndefined();
  });
});
