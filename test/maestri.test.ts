// L'addestramento a pagamento (contenuti/maestri.yaml): ogni abilità ha un maestro solo, con tre lezioni ai livelli
// 2, 3 e 4; una lezione dà 10 PE all'abilità e un quarto al suo attributo. Maestri e allenamento di base portano il
// marchio «Addestramento».
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { describe, it, expect } from 'vitest';
import { CONTENUTI as c } from '../src/dati/contenuti';
import type { TOpzione, TStorylet } from '../src/motore/contenuto';
import { TUTTE_LE_ABILITA, attributoDi } from '../src/motore/regole';
import { nuovoPersonaggio } from '../src/motore/personaggio';
import { scegli } from '../src/motore/azioni';
import { opzioniVisibili } from '../src/motore/crisi';

const PREZZI: Record<number, number> = { 2: 200, 3: 400, 4: 800 };

const idsDi = (file: string): string[] =>
  (parse(readFileSync(join('contenuti', file), 'utf8')) as { storylet: { id: string }[] }).storylet.map((st) => st.id);
const MAESTRI = idsDi('maestri.yaml').map((id) => c.storylet.find((st) => st.id === id)!);

/** Le lezioni di un'abilità presso un maestro: le opzioni che le danno PE. */
const lezioniDi = (st: TStorylet, ab: string): TOpzione[] => st.opzioni.filter((o) => o.esito?.pe?.[ab] !== undefined);
/** Il livello a cui si vede una lezione, letto dal suo `quando`. */
const livelloDi = (o: TOpzione, ab: string): number | undefined => {
  for (const q of o.quando ?? []) {
    const m = q.match(/^\s*([a-z-]+)\s*==\s*(\d)\s*$/);
    if (m && m[1] === ab) return Number(m[2]);
  }
  return undefined;
};

describe('maestri', () => {
  it('ci sono nove maestri, tutti ripetibili e senza prove', () => {
    expect(MAESTRI).toHaveLength(9);
    for (const st of MAESTRI) {
      expect(st, st.id).toBeDefined();
      expect(st.ripetibile, st.id).toBe(true);
      for (const o of st.opzioni) expect(o.prova ?? o.combattimento ?? o.zekar, `${st.id}: ${o.testo}`).toBeUndefined();
    }
  });

  it.each(TUTTE_LE_ABILITA)('%s ha un maestro solo, con tre lezioni da 200, 400 e 800', (ab) => {
    const maestri = MAESTRI.filter((st) => lezioniDi(st, ab).length > 0);
    expect(maestri.map((st) => st.id), ab).toHaveLength(1);
    const lezioni = lezioniDi(maestri[0]!, ab);
    expect(lezioni.map((o) => livelloDi(o, ab)).sort()).toEqual([2, 3, 4]);
    for (const o of lezioni) {
      const livello = livelloDi(o, ab)!;
      const prezzo = PREZZI[livello]!;
      expect(o.esito!.effetti?.['monete'], `${ab} ${livello}`).toBe(-prezzo);
      expect(o.esito!.pe, `${ab} ${livello}`).toEqual({ [ab]: 10 });
      expect(o.costo ?? 1, `${ab} ${livello}`).toBe(1);
      // monete e reputazione stanno nei requisiti: la lezione si vede chiusa finché mancano
      expect(o.requisiti, `${ab} ${livello}`).toContain(`monete >= ${prezzo}`);
      expect(o.requisiti?.some((r) => r.startsWith('rep.')), `${ab} ${livello}`).toBe(true);
    }
  });

  it.each(TUTTE_LE_ABILITA)('una lezione di %s dà 10 PE all\'abilità e 2,5 all\'attributo', (ab) => {
    const st = MAESTRI.find((x) => lezioniDi(x, ab).length > 0)!;
    const s = nuovoPersonaggio('Allievo', c.origini[0]!, 0, st.area);
    s.abilita[ab] = 2;
    s.quality['monete'] = 1000;
    for (const q of c.quality) if (q.categoria === 'reputazione') s.quality[q.id] = 10;
    const attr = attributoDi(ab);
    const prima = { ab: s.pe[ab] ?? 0, attr: s.pe[attr] ?? 0 };
    const visibili = opzioniVisibili(s, st, c);
    const i = st.opzioni.findIndex((o, k) => visibili.includes(k) && livelloDi(o, ab) === 2);
    expect(i, `${st.id}: lezione di ${ab}`).toBeGreaterThanOrEqual(0);
    // a livello 2 le lezioni degli altri livelli non si vedono
    expect(visibili.filter((k) => lezioniDi(st, ab).includes(st.opzioni[k]!))).toEqual([i]);
    const r = scegli(s, st, i, c, 0, () => 0);
    expect(r.tipo).toBe('risultato');
    expect(s.pe[ab]).toBe(prima.ab + 10);
    expect(s.pe[attr]).toBe(prima.attr + 2.5);
    expect(s.quality['monete']).toBe(800);
  });

  it('maestri e allenamento di base portano il marchio «Addestramento»', () => {
    for (const id of [...idsDi('maestri.yaml'), ...idsDi('allenamento.yaml')]) {
      expect(c.storylet.find((st) => st.id === id)?.marchio, id).toBe('addestramento');
    }
  });
});
