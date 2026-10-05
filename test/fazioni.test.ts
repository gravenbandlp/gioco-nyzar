// Le quest di fazione (ottobre 2026): una pista da 15 passi per fazione, cinque gradi, e l'esito "almeno".
// I percorsi a caso fino al passo 15 stanno in fazioni-percorsi-*.test.ts, divisi per farli girare in parallelo.
import { describe, it, expect } from 'vitest';
import { CONTENUTI as c } from '../src/dati/contenuti';
import { serieDi } from '../src/motore/serie';
import { nuovoPersonaggio } from '../src/motore/personaggio';
import { scegli } from '../src/motore/azioni';
import { Storylet } from '../src/motore/contenuto';

import { FAZIONI } from './fazioni-percorsi';

describe('fazioni', () => {
  it("l'esito almeno alza una quality fino alla soglia e non la abbassa", () => {
    const st = Storylet.parse({ id: 'prova-almeno', titolo: 'Prova', area: 'citta-bassa', ripetibile: true, testo: 'x', opzioni: [{ testo: 'x', esito: { testo: 'x', almeno: { 'rep.velo': 4 } } }] });
    const s = nuovoPersonaggio('Vessa', c.origini[0]!, 0, 'citta-bassa');
    delete s.quality['prologo'];
    s.quality['rep.velo'] = 1;
    scegli(s, st, 0, c, 0);
    expect(s.quality['rep.velo']).toBe(4);
    s.quality['rep.velo'] = 6;
    scegli(s, st, 0, c, 0);
    expect(s.quality['rep.velo']).toBe(6);
  });

  it('ogni fazione ha la sua quest da 15 passi e cinque gradi ai passi 3, 6, 9, 12, 15', () => {
    expect(c.fazioni.map((f) => f.id).sort()).toEqual([...FAZIONI].sort());
    for (const f of c.fazioni) {
      expect(f.pista).toBe(`fazione.${f.id}`);
      expect(f.gradi.map((g) => g.passo)).toEqual([3, 6, 9, 12, 15]);
      expect(serieDi(c).serie.find((z) => z.quality === f.pista)?.massimo, f.id).toBe(15);
    }
  });

  it('ogni passo ha almeno una scena che lo apre', () => {
    for (const f of c.fazioni) for (let n = 0; n < 15; n++) {
      const apre = c.storylet.filter((st) => st.requisiti.some((r) => r.replace(/\s/g, '') === `${f.pista}==${n}`));
      expect(apre.length, `${f.id}: passo ${n + 1}`).toBeGreaterThan(0);
    }
  });

  it('i passi di grado portano la reputazione almeno alla soglia', () => {
    for (const f of c.fazioni) for (const [i, g] of f.gradi.entries()) {
      const scene = c.storylet.filter((st) => st.requisiti.some((r) => r.replace(/\s/g, '') === `${f.pista}==${g.passo - 1}`));
      const esiti = scene.flatMap((st) => st.opzioni.flatMap((o) => [o.esito, o.successo, o.fallimento, o.vittoria, o.sconfitta]))
        .filter((e) => e && (e.effetti?.[f.pista] ?? 0) > 0);
      // anche i seguiti aperti dalle scene del passo possono chiuderlo
      const seguiti = scene.flatMap((st) => st.opzioni.flatMap((o) => [o.esito, o.successo, o.fallimento, o.vittoria, o.sconfitta]))
        .map((e) => e?.segue).filter((x): x is string => !!x);
      const daSeguiti = c.storylet.filter((st) => seguiti.includes(st.id)).flatMap((st) => st.opzioni.flatMap((o) => [o.esito, o.successo, o.fallimento, o.vittoria, o.sconfitta]))
        .filter((e) => e && (e.effetti?.[f.pista] ?? 0) > 0);
      const tutti = [...esiti, ...daSeguiti];
      expect(tutti.length, `${f.id}: grado ${i + 1}`).toBeGreaterThan(0);
      expect(tutti.some((e) => (e!.almeno?.[f.reputazione] ?? 0) >= 2 * (i + 1)), `${f.id}: grado ${i + 1} senza almeno`).toBe(true);
    }
  });
});
