import { rngConSeme } from '../src/motore/dadi';
import { nuovoPersonaggio, cartePescabili, abilitaEffettiva, applicaEffetti, type Stato } from '../src/motore/personaggio';
import { scegli, anteprima, puoEntrare } from '../src/motore/azioni';
import { crisiAttiva, opzioniVisibili, mutazioniDi, tormentoDissonanza } from '../src/motore/crisi';
import { combattenteDaStato } from '../src/motore/combattimento';
import { CONTENUTI as c } from '../src/dati/contenuti';

const figlio = (): Stato => {
  const s = nuovoPersonaggio('Vessa', c.origini.find((o) => o.id === 'figlio-della-citta-bassa')!, 0, 'citta-bassa');
  delete s.quality['prologo'];
  return s;
};
const st = (id: string) => c.storylet.find((x) => x.id === id)!;
const opzione = (id: string, pred: (o: (typeof c.storylet)[number]['opzioni'][number]) => boolean) => st(id).opzioni.findIndex(pred);

describe('crisi', () => {
  it('a 8 si apre la crisi della statistica', () => {
    const s = figlio();
    expect(crisiAttiva(s, c)).toBeUndefined();
    s.quality['ferite'] = 8;
    expect(crisiAttiva(s, c)?.id).toBe('crisi-ferite');
  });
  it('pagare costa 0 candele e porta la statistica a 4', () => {
    const s = figlio();
    s.quality['ferite'] = 8; s.quality['monete'] = 50;
    const i = opzione('crisi-ferite', (o) => (o.requisiti ?? []).some((r) => r.startsWith('monete')));
    const r = scegli(s, st('crisi-ferite'), i, c, 0, rngConSeme(1));
    expect(r.tipo).toBe('risultato');
    expect(s.quality['ferite']).toBe(4);
    expect(s.quality['monete']).toBe(10);
    expect(s.candele).toBe(20);
  });
  it('sacrificare richiede almeno 10 PE e li azzera', () => {
    const s = figlio();
    s.quality['ferite'] = 8;
    const i = opzione('crisi-ferite', (o) => (o.requisiti ?? []).some((r) => r.startsWith('pe.')));
    expect(anteprima(s, st('crisi-ferite').opzioni[i]!, c).disponibile).toBe(false);
    s.pe['resistenza'] = 12;
    scegli(s, st('crisi-ferite'), i, c, 0, rngConSeme(1));
    expect(s.pe['resistenza']).toBe(0);
    expect(s.quality['ferite']).toBe(4);
  });
  it("accettare porta nell'area di penalità, da cui si esce solo con le storie", () => {
    const s = figlio();
    s.quality['ferite'] = 8;
    const i = opzione('crisi-ferite', (o) => o.esito?.vai === 'convalescenza');
    scegli(s, st('crisi-ferite'), i, c, 0, rngConSeme(1));
    expect(s.area).toBe('convalescenza');
    expect(crisiAttiva(s, c)).toBeUndefined(); // la crisi aspetta
    expect(puoEntrare(s, 'citta-bassa', c).ok).toBe(false);
    expect(puoEntrare({ ...s, area: 'citta-bassa' }, 'convalescenza', c).ok).toBe(false);
  });
  it("l'uscita riporta la statistica a 3, azzera il recupero e regala 10 PE", () => {
    const s = figlio();
    s.area = 'convalescenza'; s.quality['ferite'] = 8; s.quality['recupero.convalescenza'] = 4;
    const r = scegli(s, st('convalescenza-uscita'), 0, c, 0, rngConSeme(1));
    if (r.tipo !== 'risultato') throw new Error('atteso risultato');
    expect(s.quality['ferite']).toBe(3);
    expect(s.quality['recupero.convalescenza']).toBe(0);
    expect(r.risultato.crescite[0]!.pe).toBe(10);
    expect(c.aree.find((a) => a.id === s.area)!.penalita).toBe(false);
  });
  it('ogni area di penalità ha tre ripetibili e un\'uscita', () => {
    for (const a of c.aree.filter((x) => x.penalita)) {
      const lista = c.storylet.filter((x) => x.area === a.id);
      expect(lista.filter((x) => x.requisiti.some((r) => r.startsWith(`recupero.${a.id} >= 4`)))).toHaveLength(1);
      expect(lista.filter((x) => x.ripetibile && !x.requisiti.some((r) => r.startsWith('recupero')))).toHaveLength(3);
    }
  });
});

describe('mutazioni', () => {
  it('la scelta mostra due mutazioni fra quelle che non hai', () => {
    const s = figlio();
    s.quality['contaminazione'] = 8;
    const vis = opzioniVisibili(s, st('scelta-mutazione'), c);
    expect(vis).toHaveLength(2);
    expect(opzioniVisibili(s, st('scelta-mutazione'), c)).toEqual(vis); // stabile
  });
  it('mutare porta la Contaminazione a 3 e applica vantaggio e svantaggio', () => {
    const s = figlio();
    s.quality['contaminazione'] = 8;
    const i = opzione('scelta-mutazione', (o) => o.esito?.effetti?.['mutazione.gola-roca'] === 1);
    const prima = abilitaEffettiva(s, 'intimidire', c);
    scegli(s, st('scelta-mutazione'), i, c, 0, rngConSeme(1));
    expect(s.quality['contaminazione']).toBe(3);
    expect(mutazioniDi(s, c).map((m) => m.id)).toEqual(['gola-roca']);
    expect(abilitaEffettiva(s, 'intimidire', c)).toBe(prima + 1);
  });
  it('le mutazioni cambiano anche il combattimento e la Dissonanza', () => {
    const s = figlio();
    const base = combattenteDaStato(s, c);
    s.quality['mutazione.pelle-increspata'] = 1;
    s.quality['mutazione.sangue-grigio'] = 1;
    s.quality['mutazione.orecchio-per-il-mana'] = 1;
    const dopo = combattenteDaStato(s, c);
    expect(dopo.riduzione).toBe(base.riduzione + 1);
    expect(dopo.pfMax).toBe(base.pfMax - 1);
    expect(tormentoDissonanza(s, c)).toBe(1);
    applicaEffetti(s, { contaminazione: 2 }, c); // Sangue grigio dimezza
    expect(s.quality['contaminazione']).toBe(1);
  });
});

describe('carte della fascia 5–7', () => {
  it('compaiono in qualunque area quando la statistica è in pericolo', () => {
    const s = figlio();
    s.area = 'ponti-sospesi';
    expect(cartePescabili(s, c).some((x) => x.id.startsWith('carta-ferite'))).toBe(false);
    s.quality['ferite'] = 5;
    expect(cartePescabili(s, c).filter((x) => x.id.startsWith('carta-ferite'))).toHaveLength(2);
    s.quality['ferite'] = 8;
    expect(cartePescabili(s, c).some((x) => x.id.startsWith('carta-ferite'))).toBe(false);
  });
});
