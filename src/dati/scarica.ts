// Nel sito pubblicato i contenuti arrivano a pezzi (vedi scripts/contenuti-a-pezzi.ts).
// I pezzi si scaricano in parallelo e quello che si pianta si riprova: un intoppo della rete
// rallenta il caricamento invece di fermarlo.
import type { TContenuti } from '../motore/contenuto';

const ATTESA_MS = 15_000; // oltre, il pezzo si dà per perso e si riscarica
const TENTATIVI = 5;

async function scaricaPezzo(url: string): Promise<Record<string, unknown>> {
  for (let tentativo = 1; ; tentativo++) {
    const ferma = new AbortController();
    const timer = setTimeout(() => ferma.abort(), ATTESA_MS * tentativo);
    try {
      const risposta = await fetch(url, { signal: ferma.signal });
      if (!risposta.ok) throw new Error(`${url}: ${risposta.status}`);
      return await risposta.json() as Record<string, unknown>;
    } catch (errore) {
      if (tentativo >= TENTATIVI) throw errore;
    } finally {
      clearTimeout(timer);
    }
  }
}

/** Il primo pezzo ha tutto tranne gli storylet, gli altri sono fette dell'elenco degli storylet. */
export async function scaricaContenuti(pezzi: string[]): Promise<TContenuti> {
  try {
    const [base, ...fette] = await Promise.all(pezzi.map(scaricaPezzo));
    return { ...base, storylet: fette.flatMap((f) => f.storylet as unknown[]) } as unknown as TContenuti;
  } catch (errore) {
    const app = document.getElementById('app');
    if (app) app.innerHTML = '<p class="attesa">Il gioco non si è caricato: la rete non risponde. <a href="">Riprova</a></p>';
    throw errore;
  }
}
