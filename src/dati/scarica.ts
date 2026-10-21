// Nel sito pubblicato i contenuti arrivano a pezzi (vedi scripts/contenuti-a-pezzi.ts).
// I pezzi si scaricano in parallelo e quello che si pianta si riprova: un intoppo della rete
// rallenta il caricamento invece di fermarlo.
import type { TContenuti } from '../motore/contenuto';

const SILENZIO_MS = 10_000; // senza un byte per tanto, il pezzo si dà per perso e si riscarica
const TENTATIVI = 5;

async function scaricaPezzo(url: string): Promise<Record<string, unknown>> {
  for (let tentativo = 1; ; tentativo++) {
    const ferma = new AbortController();
    let timer = setTimeout(() => ferma.abort(), SILENZIO_MS);
    const ancoraVivo = () => { clearTimeout(timer); timer = setTimeout(() => ferma.abort(), SILENZIO_MS); };
    try {
      const risposta = await fetch(url, { signal: ferma.signal, cache: tentativo > 1 ? 'reload' : 'default' });
      if (!risposta.ok || !risposta.body) throw new Error(`${url}: ${risposta.status}`);
      // Il corpo si legge a blocchi: un pezzo lento ma che arriva non si interrompe.
      const lettore = risposta.body.getReader();
      const decodifica = new TextDecoder();
      let testo = '';
      for (;;) {
        ancoraVivo();
        const { done, value } = await lettore.read();
        if (done) break;
        testo += decodifica.decode(value, { stream: true });
      }
      return JSON.parse(testo + decodifica.decode()) as Record<string, unknown>;
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
