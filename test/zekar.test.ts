import { rngConSeme } from '../src/motore/dadi';
import { nuovoPersonaggio, type Stato } from '../src/motore/personaggio';
import { scegli, concludiZekar, anteprima } from '../src/motore/azioni';
import { nuovaPartita, siediti, muovi, lateraliValide, OBIETTIVO, type StatoZekar, type Avversario } from '../src/motore/zekar';
import { CONTENUTI as c } from '../src/dati/contenuti';

const avv = (id: string) => c.zekar.find((z) => z.id === id)! as Avversario;
const st = (id: string) => c.storylet.find((x) => x.id === id)!;
const pg = (): Stato => {
  const s = nuovoPersonaggio('Vessa', c.origini.find((o) => o.id === 'figlio-della-citta-bassa')!, 0, 'ponti-sospesi');
  delete s.quality['prologo'];
  s.quality['rep.grifone'] = 2; s.quality['monete'] = 100;
  return s;
};

/** Gioca la partita fino in fondo con una condotta semplice: laterale per superare chi sta, ferma a 17. */
function giocaTutta(zs: StatoZekar, rng: () => number): void {
  for (let passi = 0; zs.fase === 'gioco' && passi < 400; passi++) {
    const io = zs.g[0], lui = zs.g[1];
    if (!zs.lateraleUsata && io.totale > OBIETTIVO) {
      const i = io.laterali.findIndex((v) => io.totale + v <= OBIETTIVO);
      if (i >= 0) { muovi(zs, { tipo: 'laterale', indice: i }, rng); continue; }
    }
    muovi(zs, { tipo: io.totale >= 17 || (lui.sta && io.totale > lui.totale) ? 'stai' : 'passa' }, rng);
  }
}

describe('zekar: regole', () => {
  it('le laterali sono quattro valori diversi fra −5 e +5', () => {
    expect(lateraliValide([-3, -2, 2, 3])).toBe(true);
    expect(lateraliValide([2, 2, 3, 4])).toBe(false);
    expect(lateraliValide([0, 1, 2, 3])).toBe(false);
    expect(lateraliValide([1, 2, 3])).toBe(false);
  });
  it('una partita arriva sempre a tre round vinti, e a ogni pesca il totale sale della carta', () => {
    for (let seme = 1; seme <= 40; seme++) {
      const rng = rngConSeme(seme);
      const zs = nuovaPartita(avv('dragna-gro-malog'));
      siediti(zs, [-3, -2, 2, 3], rng);
      giocaTutta(zs, rng);
      expect(zs.fase).toBe('finita');
      expect(Math.max(zs.g[0].vinti, zs.g[1].vinti)).toBe(3);
      expect(zs.vinto).toBe(zs.g[0].vinti === 3);
      for (const e of zs.eventi.filter((x) => x.tipo === 'pesca')) expect(e.valore).toBeGreaterThanOrEqual(1);
    }
  });
  it('le laterali si consumano e se ne gioca una sola per turno', () => {
    const rng = rngConSeme(3);
    const zs = nuovaPartita(avv('raschiatori'));
    siediti(zs, [-1, 1, 2, 3], rng);
    expect(zs.turno).toBe(0); // se apre l'avversario, quando siedi ha già giocato il suo turno
    expect(muovi(zs, { tipo: 'laterale', indice: 0 }, rng)).toBe(true);
    if (zs.turno === 0 && zs.round === 1) expect(muovi(zs, { tipo: 'laterale', indice: 0 }, rng)).toBe(false);
    expect(zs.g[0].laterali).toHaveLength(3);
  });
  it('chi supera 20 a fine turno sballa e perde il round', () => {
    const rng = rngConSeme(5);
    const zs = nuovaPartita(avv('raschiatori'));
    siediti(zs, [1, 2, 3, 4], rng);
    for (let i = 0; i < 50 && zs.fase === 'gioco'; i++) {
      if (zs.g[0].totale > OBIETTIVO) {
        const prima = zs.g[1].vinti;
        muovi(zs, { tipo: 'passa' }, rng);
        expect(zs.eventi.some((e) => e.tipo === 'sballa' && e.chi === 0)).toBe(true);
        expect(zs.g[1].vinti).toBe(prima + 1);
        return;
      }
      muovi(zs, { tipo: 'passa' }, rng); // non stare mai: prima o poi si sballa
    }
  });
});

describe('zekar: al Grifone', () => {
  it('la partita secca costa un rintocco e paga la posta', () => {
    const s = pg();
    const i = st('zekar-al-grifone').opzioni.findIndex((o) => o.requisiti?.includes('monete >= 15'));
    const r = scegli(s, st('zekar-al-grifone'), i, c, 0, rngConSeme(1));
    expect(r.tipo).toBe('zekar');
    expect(s.rintocchi).toBe(39);
    const zs = (r as { zekar: StatoZekar }).zekar;
    const rng = rngConSeme(2);
    siediti(zs, [-3, -2, 2, 3], rng);
    giocaTutta(zs, rng);
    concludiZekar(s, st('zekar-al-grifone'), i, zs, c);
    expect(s.quality['monete']).toBe(zs.vinto ? 115 : 85);
  });
  it("l'anteprima dice contro chi e con che probabilità", () => {
    const s = pg();
    const a = anteprima(s, st('zekar-al-grifone').opzioni[2]!, c);
    expect(a.zekar?.avversario).toBe('Dragna Gro-Malog');
    expect(a.zekar!.probabilita).toBeGreaterThan(0.3);
    expect(a.zekar!.probabilita).toBeLessThan(0.75);
  });
  it('il torneo: quota al primo tavolo, rimborsi per tavoli vinti, e si ricomincia da capo', () => {
    const torneo = st('torneo-del-grifone');
    const visibile = (s: Stato) => torneo.opzioni.findIndex((o) => (o.quando ?? []).every((q) => {
      const [k, op, n] = q.split(' ');
      const v = s.quality[k!] ?? 0;
      return op === '==' ? v === Number(n) : op === '<=' ? v <= Number(n) : v >= Number(n);
    }));
    // vince tre tavoli e perde la finale: tre volte la quota e mezzo punto di reputazione
    const s = pg();
    const esiti = [true, true, true, false];
    for (const vinto of esiti) {
      const i = visibile(s);
      const r = scegli(s, torneo, i, c, 0, rngConSeme(1));
      const zs = (r as { zekar: StatoZekar }).zekar;
      zs.fase = 'finita'; zs.vinto = vinto;
      concludiZekar(s, torneo, i, zs, c);
    }
    expect(s.quality['monete']).toBe(100 - 20 + 60);
    expect(s.quality['rep.grifone']).toBe(2.5);
    expect(s.quality['zekar.torneo'] ?? 0).toBe(0);
    expect(s.rintocchi).toBe(36);
  });
  it('il torneo vinto paga sei volte la quota', () => {
    const torneo = st('torneo-del-grifone');
    const s = pg();
    for (let k = 0; k < 4; k++) {
      const i = torneo.opzioni.findIndex((o) => o.quando?.includes(`zekar.torneo == ${k}`) && (k < 3 || o.quando.includes('rep.grifone <= 3')));
      const zs = (scegli(s, torneo, i, c, 0, rngConSeme(1)) as { zekar: StatoZekar }).zekar;
      zs.fase = 'finita'; zs.vinto = true;
      concludiZekar(s, torneo, i, zs, c);
    }
    expect(s.quality['monete']).toBe(100 - 20 + 120);
    expect(s.quality['rep.grifone']).toBe(3);
  });
  it('senza reputazione 2 al Grifone lo Zekar non si vede', () => {
    for (const id of ['zekar-al-grifone', 'torneo-del-grifone']) expect(st(id).requisiti).toContain('rep.grifone >= 2');
  });
});
