// La venatura horror (motore/inquietudine.ts): soglie, narratore inaffidabile, mezzanotte, pagine notate, silenzi.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { CONTENUTI as c } from '../src/dati/contenuti';
import { nuovoPersonaggio } from '../src/motore/personaggio';
import { intensita, inquietudineDi, descrizioneDi, notteFonda, forseNotato, PAUSA_NOTATI, SOGLIA_NARRATORE } from '../src/motore/inquietudine';
import { erroriVoci, senzaSegni } from '../src/motore/voci';
import { prosa } from '../src/ui/componenti';
import { sceltaAudio } from '../src/ui/colonna';
import type { TStorylet } from '../src/motore/contenuto';

const pg = () => nuovoPersonaggio('Vessa', c.origini[0]!, 0, 'citta-bassa');

describe('la venatura horror', () => {
  afterEach(() => { vi.useRealTimers(); });

  it('le negative contano solo dalla soglia, e al massimo valgono 1', () => {
    expect(intensita(4)).toBe(0);
    expect(intensita(5)).toBeGreaterThan(0);
    expect(intensita(8)).toBe(1);
    const s = pg();
    s.quality['contaminazione'] = 3;
    expect(inquietudineDi(s).contaminazione).toBeGreaterThan(0);
    expect(inquietudineDi(s).tormento).toBe(0);
  });

  it('la descrizione inquieta compare solo col Tormento alto, e resta ferma per dieci minuti', () => {
    const st: TStorylet = { id: 'x', titolo: 'x', area: 'citta-bassa', tipo: 'fisso', ripetibile: true, requisiti: [], testo: 'x',
      opzioni: [{ testo: 'a', descrizione: 'normale', inquieta: 'storta', esito: { testo: 'x' } }] };
    const o = st.opzioni[0]!;
    const s = pg();
    expect(descrizioneDi(s, st, 0, o, 0)).toBe('normale');
    s.quality['tormento'] = SOGLIA_NARRATORE;
    const viste = new Set(Array.from({ length: 40 }, (_, k) => descrizioneDi(s, st, 0, o, k * 600000)));
    expect(viste).toEqual(new Set(['normale', 'storta']));
    expect(descrizioneDi(s, st, 0, o, 1000)).toBe(descrizioneDi(s, st, 0, o, 599000));
  });

  it('i paragrafi di mezzanotte si vedono solo a notte fonda e non sporcano il resto', () => {
    const testo = 'La strada è vuota.\n\n{mezzanotte} Qualcuno ti segue.';
    expect(erroriVoci(testo)).toEqual([]);
    expect(senzaSegni(testo)).not.toContain('{mezzanotte}');
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 12, 2, 30));
    expect(notteFonda()).toBe(true);
    expect(prosa(testo)).toContain('Qualcuno ti segue');
    vi.setSystemTime(new Date(2026, 9, 12, 14, 0));
    expect(prosa(testo)).not.toContain('Qualcuno ti segue');
  });

  it('una pagina notata arriva dopo la pausa, una volta sola, e finisce nel diario col nome', () => {
    const s = pg();
    const cc = { aree: c.aree, notati: [{ id: 'uno', testo: 'Ti ho visto, {nome}.', requisiti: [] }] };
    s.tempo = { totale: PAUSA_NOTATI - 1, serie: {} };
    expect(forseNotato(s, cc, 0, () => 0)).toBeUndefined();
    s.tempo.totale = PAUSA_NOTATI;
    expect(forseNotato(s, cc, 0, () => 0)).toBe('uno');
    expect(s.diario!.at(-1)!.testo).toBe('Ti ho visto, Vessa.');
    s.tempo.totale = PAUSA_NOTATI * 3;
    expect(forseNotato(s, cc, 0, () => 0)).toBeUndefined();
  });

  it('le pagine notate dei contenuti hanno requisiti validi', () => {
    const quality = new Set(c.quality.map((q) => q.id));
    for (const n of c.notati) for (const r of n.requisiti) expect(quality.has(r.split(/\s/)[0]!), `${n.id}: ${r}`).toBe(true);
  });

  it('nel silenzio tace la musica, non l\'ambiente, e mai in combattimento', () => {
    const base = sceltaAudio(c, { area: 'citta-bassa' });
    const zitto = sceltaAudio(c, { area: 'citta-bassa', silenzio: true });
    expect(zitto.musica).toBeNull();
    expect(zitto.ambiente).toBe(base.ambiente);
    expect(sceltaAudio(c, { area: 'citta-bassa', silenzio: true, combattimento: true }).musica).not.toBeNull();
  });
});
