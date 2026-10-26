// Il campanile rovescio (docs/piano-torre.md): lo sblocco, il grado della Maschera, le discese fra gli anelli, i pezzi
// del set una volta sola, il sigillo del quarantunesimo piano, il rimescolamento delle stanze e il piano mostrato,
// l'usura e il Lettore che ti legge.
import { describe, it, expect } from 'vitest';
import { nuovoPersonaggio, requisitiSoddisfatti, type Stato } from '../src/motore/personaggio';
import { scegli } from '../src/motore/azioni';
import { ricevi } from '../src/motore/oggetti';
import { stanzeVisibili, piano, ritirati, cambiaArea, scartaSeguitiRimasti } from '../src/motore/spedizioni';
import { combattenteDaStato, feriteDopo, iniziaCombattimento, probabilitaVittoria } from '../src/motore/combattimento';
import { rngConSeme } from '../src/motore/dadi';
import type { TContenuti, TStorylet } from '../src/motore/contenuto';
import { CONTENUTI as c } from '../src/dati/contenuti';

const figlio = (): Stato => {
  const s = nuovoPersonaggio('Vessa', c.origini.find((o) => o.id === 'figlio-della-citta-bassa')!, 0, 'superficie-fratturata');
  delete s.quality['prologo'];
  return s;
};
const st = (id: string) => c.storylet.find((x) => x.id === id)!;
const aperto = (s: Stato, id: string) => requisitiSoddisfatti(s, st(id).requisiti, c);
/** Un Portatore che ha zittito la Campana e visto l'epilogo. */
const portatore = (scelta = 1): Stato => {
  const s = figlio();
  Object.assign(s.quality, { 'campana.scelta': scelta, 'campana.epilogo': 1, 'pista.capomozzo': 10 });
  ricevi(s, c, 'maschera-della-forza');
  return s;
};

describe('il campanile rovescio', () => {
  it('il grado della Maschera viene dalle Maschere possedute', () => {
    const s = figlio();
    expect(requisitiSoddisfatti(s, ['maschera.grado == 0'], c)).toBe(true);
    ricevi(s, c, 'maschera-della-natura');
    expect(requisitiSoddisfatti(s, ['maschera.grado == 3'], c)).toBe(true);
    expect(requisitiSoddisfatti(s, ['maschera.grado >= 4'], c)).toBe(false);
  });

  it('la botola si apre al Portatore, con la prosa della sua Campana', () => {
    const z = portatore(1), a = portatore(2);
    expect(aperto(z, 'torre-la-botola-zittita')).toBe(true);
    expect(aperto(z, 'torre-la-botola-armata')).toBe(false);
    expect(aperto(a, 'torre-la-botola-armata')).toBe(true);
    expect(aperto(z, 'torre-la-botola-chiusa')).toBe(false);
    expect(aperto(z, 'torre-la-scala-della-canna')).toBe(false);
    scegli(z, st('torre-la-botola-zittita'), 0, c, 0);
    expect(z.quality['torre.botola']).toBe(1);
    expect(aperto(z, 'torre-la-botola-zittita')).toBe(false);
    expect(aperto(z, 'torre-la-scala-della-canna')).toBe(true);
  });

  it('chi ha battuto il Campanaro senza essere Portatore trova la lastra chiusa', () => {
    const s = portatore(1);
    s.quality['pista.capomozzo'] = 8;
    expect(aperto(s, 'torre-la-botola-zittita')).toBe(false);
    expect(aperto(s, 'torre-la-botola-chiusa')).toBe(true);
    scegli(s, st('torre-la-botola-chiusa'), 0, c, 0);
    expect(aperto(s, 'torre-la-botola-chiusa')).toBe(false);
    s.quality['pista.capomozzo'] = 10;
    expect(aperto(s, 'torre-la-botola-zittita')).toBe(true);
  });

  it('il sigillo del quarantunesimo segue il Lettore la prima volta, legge la Maschera di grado 3 e non si apre', () => {
    const s = portatore(1);
    s.quality['torre.botola'] = 1;
    s.quality['torre.anello'] = 4;
    expect(aperto(s, 'torre-la-scala-della-canna')).toBe(true); // si torna giù anche a campanile finito
    const [prima, dopo] = st('torre-4-il-leggio').opzioni;
    expect(prima!.esito?.segue).toBe('torre-il-sigillo');
    expect(prima!.esito?.effetti?.['oggetto.torre-frammento-del-sigillo']).toBe(1);
    expect(dopo!.esito?.vai).toBe('superficie-fratturata');
    const sigillo = st('torre-il-sigillo');
    expect(sigillo.tipo).toBe('seguito');
    const i = sigillo.opzioni.findIndex((o) => requisitiSoddisfatti(s, o.quando, c));
    expect(sigillo.opzioni[i]!.testo).toContain('Maschera');
    scegli(s, sigillo, i, c, 0);
    expect(s.quality['torre.sigillo']).toBe(1);
  });

  it('dopo la Tessitrice si scende nell\'anello 2, dalla porta tonda o dalla scala della canna', () => {
    const s = portatore(1);
    s.quality['torre.botola'] = 1;
    const scala = st('torre-la-scala-della-canna');
    const discese = () => scala.opzioni.filter((o) => requisitiSoddisfatti(s, o.quando, c) && o.esito?.vai).map((o) => o.esito!.vai);
    expect(discese()).not.toContain('torre-anello-2');
    s.quality['torre.anello'] = 1;
    expect(discese()).toContain('torre-anello-2');
    const porta = st('torre-1-la-porta-tonda');
    expect(porta.opzioni.map((o) => o.esito?.vai)).toEqual(['torre-anello-2', 'superficie-fratturata']);
    for (const o of st('torre-1-il-fuso').opzioni) expect(o.esito?.segue).toBe('torre-1-la-porta-tonda');
  });

  it('dopo l\'Uditore si scende nell\'anello 3, e ogni guardiano dà il suo pezzo del set una volta sola', () => {
    const s = portatore(1);
    s.quality['torre.botola'] = 1;
    s.quality['torre.anello'] = 2;
    const scala = st('torre-la-scala-della-canna');
    expect(scala.opzioni.filter((o) => requisitiSoddisfatti(s, o.quando, c)).map((o) => o.esito?.vai)).toContain('torre-anello-3');
    expect(st('torre-2-la-porta-tonda').opzioni.map((o) => o.esito?.vai)).toEqual(['torre-anello-3', 'superficie-fratturata']);
    for (const o of st('torre-2-la-cassa').opzioni) expect(o.esito?.segue).toBe('torre-2-la-porta-tonda');
    expect(st('torre-3-la-porta-tonda').opzioni.map((o) => o.esito?.vai)).toEqual(['torre-anello-4', 'superficie-fratturata']);
    s.quality['torre.anello'] = 3;
    expect(scala.opzioni.filter((o) => requisitiSoddisfatti(s, o.quando, c)).map((o) => o.esito?.vai)).toContain('torre-anello-4');
    const premi: [string, string][] = [['torre-1-il-fuso', 'torre-la-nota-lunga'], ['torre-2-la-cassa', 'torre-la-cassa-armonica'], ['torre-3-l-ultima-campana', 'torre-la-bocca-della-campana'], ['torre-4-il-leggio', 'torre-il-manto-del-battito']];
    for (const [id, pezzo] of premi) {
      const [prima, dopo] = st(id).opzioni;
      expect(prima!.quando, id).toContain(`avuto.${pezzo} == 0`);
      expect(prima!.esito?.effetti?.[`oggetto.${pezzo}`], id).toBe(1);
      expect(dopo!.quando, id).toContain(`avuto.${pezzo} >= 1`);
      expect(dopo!.esito?.effetti?.[`oggetto.${pezzo}`], id).toBeUndefined();
    }
  });

  it('le stanze cambiano a ogni discesa, e il piano si conta dall\'anello', () => {
    const stanza = (n: number): TStorylet => ({ ...st('torre-la-scala-della-canna'), id: `prova-stanza-${n}`, area: 'prova', presso: undefined, requisiti: [], ripetibile: true });
    const area = { ...c.aree.find((a) => a.id === 'campana-sfiati')!, id: 'prova' };
    const conRimescola: TContenuti = { ...c, aree: [...c.aree, { ...area, spedizione: { ...area.spedizione!, stanze: 3, rimescola: 'torre.discese', piani: 10 } }], storylet: [...c.storylet, ...Array.from({ length: 12 }, (_, n) => stanza(n))] };
    const senza: TContenuti = { ...conRimescola, aree: [...c.aree, area] };
    const s = figlio();
    s.area = 'prova';
    const viste = (k: TContenuti) => new Set(Array.from({ length: 6 }, (_, d) => { s.quality['torre.discese'] = d; return stanzeVisibili(s, k).map((x) => x.id).join(','); }));
    expect(viste(conRimescola).size).toBeGreaterThan(1);
    expect(viste(senza).size).toBe(1);
    s.quality['profondita.prova'] = 3;
    expect(piano(s, conRimescola)).toBe(14);
    expect(piano(s, senza)).toBeUndefined();
  });

  it('negli anelli due stanze fanno un piano', () => {
    const s = figlio();
    s.area = 'torre-anello-2';
    s.quality['profondita.torre-anello-2'] = 0;
    expect(piano(s, c)).toBe(11);
    s.quality['profondita.torre-anello-2'] = 1;
    expect(piano(s, c)).toBe(11);
    s.quality['profondita.torre-anello-2'] = 17;
    expect(piano(s, c)).toBe(19);
    s.quality['profondita.torre-anello-2'] = 18;
    expect(piano(s, c)).toBe(20);
  });

  it('nella torre le negative pesano negli scontri e i PF persi restano come Ferite', () => {
    const s = figlio();
    Object.assign(s.quality, { ferite: 2.5, tormento: 3, contaminazione: 4 });
    const fuori = combattenteDaStato(s, c);
    expect(fuori.pf).toBe(fuori.pfMax);
    s.area = 'torre-anello-1';
    const dentro = combattenteDaStato(s, c);
    expect(dentro.pfMax).toBe(fuori.pfMax);
    expect(dentro.pf).toBe(fuori.pfMax - 5);
    expect(dentro.difesaMentale).toBe(fuori.difesaMentale - 1);
    expect(dentro.difesaFisica).toBe(fuori.difesaFisica - 2);
    const sc = c.scontri.find((x) => x.id === 'torre-i-rammendatori')!;
    const cs = iniziaCombattimento(dentro, sc, c, {}, rngConSeme(1));
    const pg = cs.combattenti.find((x) => x.lato === 'pg')!;
    cs.finito = true; cs.vinto = true;
    pg.pf -= 3;
    expect(feriteDopo(cs, sc.feriteSconfitta)).toBe(1.5);
    pg.pf += 5; // le bende e i tonici le tolgono
    expect(feriteDopo(cs, sc.feriteSconfitta)).toBe(-1);
    cs.vinto = false;
    expect(feriteDopo(cs, sc.feriteSconfitta)).toBe(sc.feriteSconfitta);
  });

  it('il Lettore ti legge: resta difficile per chi ha poco e per chi ha tutto', () => {
    const pg = (livello: number) => {
      const s = figlio();
      s.attributi.fisico = livello;
      for (const a of ['armi-da-mischia', 'acrobazia', 'resistenza', 'resilienza']) s.abilita[a] = livello;
      s.arma = 'campana-il-battente'; s.armatura = 'campana-piastre-del-campanaro';
      s.quality['oggetto.campana-il-battente'] = 1; s.quality['oggetto.campana-piastre-del-campanaro'] = 1;
      return combattenteDaStato(s, c);
    };
    const debole = pg(3), forte = pg(5);
    const sc = c.scontri.find((x) => x.id === 'torre-il-lettore-alla-porta')!;
    const lettore = (p: typeof debole) => iniziaCombattimento(p, sc, c, {}, rngConSeme(1)).combattenti.find((x) => x.lato === 'nemico')!;
    expect(lettore(forte).attacco - lettore(debole).attacco).toBe(forte.difesa - debole.difesa);
    expect(lettore(forte).difesa - lettore(debole).difesa).toBe(forte.attacco - debole.attacco);
    expect(lettore(forte).pf).toBeGreaterThan(lettore(debole).pf);
    const pd = probabilitaVittoria(debole, sc, c, 400, 3), pf = probabilitaVittoria(forte, sc, c, 400, 3);
    expect(Math.abs(pd - pf)).toBeLessThan(0.2);
    expect(pf).toBeLessThan(0.7);
  }, 20000);

  it('chi scappa dopo la prima fase del Lettore lascia la seconda nella torre', () => {
    const s = portatore();
    s.area = 'torre-anello-4';
    s.quality['profondita.torre-anello-4'] = 18;
    s.sospeso = 'torre-4-il-lettore-senza-volto';
    s.sospesiPrima = ['torre-4-il-lettore-nel-battito'];
    ritirati(s, c);
    expect(s.area).toBe('superficie-fratturata');
    expect(s.sospeso).toBeUndefined();
    expect(s.sospesiPrima).toBeUndefined();
    // gli stati salvati prima della correzione si puliscono al caricamento
    s.sospeso = 'torre-4-il-lettore-senza-volto';
    scartaSeguitiRimasti(s, c);
    expect(s.sospeso).toBeUndefined();
  });

  it('un seguito di spedizione aperto da fuori resta in attesa', () => {
    const s = portatore();
    s.sospeso = 'circolo-occhi-dorati';
    cambiaArea(s, 'circolo-fenditura', c);
    cambiaArea(s, 'superficie-fratturata', c);
    expect(s.sospeso).toBe('circolo-occhi-dorati');
  });
});
