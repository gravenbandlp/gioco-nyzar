// Il tetto dei rintocchi e la ricarica piena quando si conclude una storia principale.
import { describe, it, expect } from 'vitest';
import { CONTENUTI as c } from '../src/dati/contenuti';
import { RINTOCCHI_MAX } from '../src/motore/regole';
import { nuovoPersonaggio, aggiornaTempo } from '../src/motore/personaggio';
import { pisteConcluse, scegli } from '../src/motore/azioni';
import { serieDi } from '../src/motore/serie';

describe('rintocchi', () => {
  it('il tetto è venti, e i salvataggi più alti scendono al tetto', () => {
    expect(RINTOCCHI_MAX).toBe(20);
    const s = nuovoPersonaggio('Vessa', c.origini[0]!, 0, 'citta-bassa');
    s.rintocchi = 40;
    aggiornaTempo(s, 1000);
    expect(s.rintocchi).toBe(20);
  });

  it('un salvataggio con le candele di prima si ritrova i rintocchi', () => {
    const s = nuovoPersonaggio('Vessa', c.origini[0]!, 0, 'citta-bassa') as ReturnType<typeof nuovoPersonaggio> & Record<string, unknown>;
    const vecchio = s as unknown as Record<string, unknown>;
    delete vecchio.rintocchi;
    delete vecchio.rintocchiAl;
    vecchio.candele = 7;
    vecchio.candeleAl = 5000;
    aggiornaTempo(s, 5000 + 25 * 60_000); // due rintocchi maturati nel frattempo
    expect(s.rintocchi).toBe(9);
    expect(vecchio.candele).toBeUndefined();
  });

  it('ogni storia principale si può concludere da qualche esito', () => {
    for (const z of serieDi(c).serie.filter((x) => x.tipo === 'pista')) {
      const arriva = c.storylet.some((st) => st.opzioni.some((o) => [o.esito, o.successo, o.fallimento, o.vittoria, o.sconfitta].some((e) => {
        if (!e) return false;
        if ((e.imposta?.[z.quality!] ?? -1) >= z.massimo) return true;
        const inc = e.effetti?.[z.quality!] ?? 0;
        return inc > 0 && st.requisiti.some((r) => r.replace(/\s/g, '') === `${z.quality}==${z.massimo - inc}`);
      })));
      expect(arriva, z.id).toBe(true);
    }
  });

  it('concludere una pista riaccende tutto, una serie di luogo no', () => {
    const s = nuovoPersonaggio('Vessa', c.origini[0]!, 0, 'citta-bassa');
    const pista = serieDi(c).serie.find((z) => z.quality === 'pista.registro')!;
    const prima = { ...s.quality, 'pista.registro': pista.massimo - 1 };
    s.quality['pista.registro'] = pista.massimo;
    expect(pisteConcluse(prima, s, c).map((z) => z.id)).toEqual(['pista.registro']);
    expect(pisteConcluse({ ...s.quality }, s, c)).toEqual([]);
  });

  it('nel gioco: l\'ultima scena di una pista riempie i rintocchi', () => {
    const z = serieDi(c).serie.find((x) => x.quality === 'pista.registro')!;
    const st = c.storylet.find((x) => x.requisiti.some((r) => r.replace(/\s/g, '') === `pista.registro==${z.massimo - 1}`))!;
    const i = st.opzioni.findIndex((o) => !o.prova && !o.combattimento && (o.esito?.effetti?.['pista.registro'] ?? 0) > 0);
    expect(i).toBeGreaterThanOrEqual(0);
    const s = nuovoPersonaggio('Vessa', c.origini[0]!, 0, st.area);
    Object.assign(s.quality, { 'pista.registro': z.massimo - 1, monete: 500, invito: 1 });
    for (const r of [...st.requisiti, ...(st.opzioni[i]!.requisiti ?? [])]) {
      const m = r.match(/^([\w.-]+)\s*(>=|==|>)\s*([\d.]+)$/);
      if (m && m[1] !== 'pista.registro') s.quality[m[1]!] = Number(m[3]) + (m[2] === '>' ? 1 : 0);
    }
    s.rintocchi = 3;
    const r = scegli(s, st, i, c, 0, () => 0);
    expect(r.tipo).toBe('risultato');
    expect(s.rintocchi).toBe(RINTOCCHI_MAX);
    if (r.tipo === 'risultato') expect(r.risultato.conclusa).toBeTruthy();
  });
});
