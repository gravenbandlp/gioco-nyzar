import { nuovoPersonaggio } from '../src/motore/personaggio';
import { scegli } from '../src/motore/azioni';
import { crisiAttiva, opzioniVisibili } from '../src/motore/crisi';
import { requisitiSoddisfatti } from '../src/motore/personaggio';
import { CONTENUTI as c } from '../src/dati/contenuti';
import { rngConSeme } from '../src/motore/dadi';

const ARRIVI: Record<string, string> = {
  'figlio-della-citta-bassa': 'citta-bassa', 'apprendista-raschiatore': 'ponti-sospesi', 'accolito-del-velo': 'citta-bassa',
  'rampollo-dei-quartieri-alti': 'quartieri-alti', 'mercante-dei-ponti': 'ponti-sospesi', 'figlio-del-circolo': 'ponti-sospesi',
  'fuggiasco-di-ghoran': 'citta-bassa', 'allievo-di-torvessa': 'quartieri-alti',
};

describe('prologo', () => {
  it.each(c.origini.map((o) => o.id))('%s: il prologo si apre da solo e porta tre giorni dopo', (id) => {
    const s = nuovoPersonaggio('Vessa', c.origini.find((o) => o.id === id)!, 0, 'citta-bassa');
    const p = crisiAttiva(s, c)!;
    expect(p.tipo).toBe('prologo');
    // l'ultima opzione senza combattimento, per non dipendere dai dadi dello scontro
    const i = p.opzioni.map((o, k) => (!o.combattimento && requisitiSoddisfatti(s, o.requisiti, c) ? k : -1)).filter((k) => k >= 0).pop()!;
    const r = scegli(s, p, i, c, 0, rngConSeme(1));
    expect(r.tipo).toBe('risultato');
    const seguito = crisiAttiva(s, c)!; // anche se chiudi il risultato, il seguito si apre da solo
    expect(seguito.id).toBe('tre-giorni-dopo');
    expect(crisiAttiva(s, c)?.id).not.toBe(p.id);
    const visibili = seguito.opzioni.map((_, k) => k).filter((k) => requisitiSoddisfatti(s, seguito.opzioni[k]!.requisiti, c));
    expect(visibili).toHaveLength(1);
    expect(opzioniVisibili(s, seguito, c)).toContain(visibili[0]);
    scegli(s, seguito, visibili[0]!, c, 0, rngConSeme(1));
    expect(s.quality['prologo'] ?? 0).toBe(0);
    expect(s.area).toBe(ARRIVI[id]);
    expect(s.quality['alloggio.grifone']).toBe(7);
    expect(crisiAttiva(s, c)).toBeUndefined();
  });
  it('i salvataggi senza prologo non lo vedono', () => {
    const s = nuovoPersonaggio('Vessa', c.origini[0]!, 0, 'citta-bassa');
    delete s.quality['prologo'];
    expect(crisiAttiva(s, c)).toBeUndefined();
  });
});
