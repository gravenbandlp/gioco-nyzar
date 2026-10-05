// Pool di d6: ogni dado con 4+ è un successo (probabilità 1/2).

export type Rng = () => number;

/** Generatore deterministico (mulberry32) per test e simulazioni ripetibili. */
export function rngConSeme(seme: number): Rng {
  let a = seme >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function binomiale(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return r;
}

/** Probabilità esatta di ottenere almeno `richiesti` successi con `pool` dadi. */
export function probabilita(pool: number, richiesti: number): number {
  if (richiesti <= 0) return 1;
  const n = Math.max(0, Math.floor(pool));
  let tot = 0;
  for (let k = richiesti; k <= n; k++) tot += binomiale(n, k);
  return tot / 2 ** n;
}

export interface Tiro {
  facce: number[];
  successi: number;
}

export function tira(pool: number, rng: Rng = Math.random): Tiro {
  const facce: number[] = [];
  for (let i = 0; i < Math.max(0, Math.floor(pool)); i++) facce.push(1 + Math.floor(rng() * 6));
  return { facce, successi: facce.filter((f) => f >= 4).length };
}

/** Probabilità che `a` dadi facciano più successi di `d` dadi (il colpo va a segno). */
export function probabilitaSuperare(a: number, d: number): number {
  const pa = Math.max(0, Math.floor(a)), pd = Math.max(0, Math.floor(d));
  let tot = 0;
  for (let k = 1; k <= pa; k++) {
    const pk = binomiale(pa, k) / 2 ** pa;
    let menoDiK = 0;
    for (let j = 0; j < k && j <= pd; j++) menoDiK += binomiale(pd, j) / 2 ** pd;
    tot += pk * menoDiK;
  }
  return tot;
}
