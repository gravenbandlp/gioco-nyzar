// Controllo dello stile dei testi: segnala i "tic" tipici della prosa generata.
// Non blocca il build: stampa un rapporto per blocco di testo, da rileggere a mano.
// Uso: npm run stile            (tutti i testi)
//      npm run stile -- --soglia 0  (mostra anche i blocchi puliti)
import { caricaContenuti } from './build-contenuti';

interface Regola { nome: string; spiegazione: string; trova: (t: string) => string[] }

const frasi = (t: string) => t.replace(/\s+/g, ' ').split(/(?<=[.!?…])\s+(?=[«A-ZÀ-Ý*])/).map((f) => f.trim()).filter(Boolean);
const parole = (f: string) => f.replace(/[«»*]/g, '').split(/\s+/).filter(Boolean).length;
const tutte = (rx: RegExp) => (t: string) => [...t.replace(/\s+/g, ' ').matchAll(rx)].map((m) => m[0]);

export const REGOLE: Regola[] = [
  {
    nome: 'due punti',
    spiegazione: 'Due punti usati per una rivelazione o un effetto. Vanno bene solo prima di un discorso diretto o di un elenco vero.',
    trova: tutte(/[^\s«»]{2,}: (?!«)[^.«]{0,40}/g),
  },
  {
    nome: 'non X, ma Y',
    spiegazione: 'Correzione a effetto: "non per soldi, ma per paura", "non è X: è Y".',
    trova: (t) => [
      ...tutte(/\b[Nn]on\b[^.;!?«»]{1,50}?(,|:|;)\s*(ma|è|sono|bensì)\b[^.]{0,30}/g)(t),
      ...tutte(/\b[Nn]on [^,.;:«»]{1,25}, [^,.;:«»]{1,25}\./g)(t),
    ],
  },
  {
    nome: 'negazione a colpo',
    spiegazione: 'Frase breve che smentisce la precedente: "Suona come una consolazione. Non lo è."',
    trova: (t) => frasi(t).filter((f, i) => i > 0 && /^(Non|Né|Nemmeno|Neanche|Mai)\b/.test(f) && parole(f) <= 5),
  },
  {
    nome: 'terna',
    spiegazione: 'Tre aggettivi, tre sensazioni, tre elementi in fila. Uno basta, due se servono.',
    trova: tutte(/\b[\p{L}']+(?: [\p{L}']+){0,2}, [\p{L}']+(?: [\p{L}']+){0,2},? (?:e|o|né) [\p{L}']+(?: [\p{L}']+){0,2}/gu),
  },
  {
    nome: 'anafora',
    spiegazione: 'Frasi o membri che ripartono con la stessa parola per ritmo: "Nessuno canta, nessuno scherza".',
    trova: (t) => {
      const out = tutte(/\b(\p{L}{3,})\b[^.,;]{1,30}, \1\b/giu)(t);
      const fs = frasi(t);
      for (let i = 1; i < fs.length; i++) {
        const a = fs[i - 1]!.split(' ')[0]!.replace(/[«*]/g, ''); const b = fs[i]!.split(' ')[0]!.replace(/[«*]/g, '');
        if (a.length > 2 && a === b && !/^(Il|La|Lo|Le|Gli|I|Un|Una|E|Ma|Ti|Si|Ci)$/.test(a)) out.push(`${fs[i - 1]} / ${fs[i]}`);
      }
      return out;
    },
  },
  {
    nome: 'chiusa a effetto',
    spiegazione: 'Paragrafo che finisce con una frase-battuta di poche parole ("Le domande nemmeno.").',
    trova: (t) => t.trim().split(/\n\s*\n/).map((p) => frasi(p)).filter((fs) => fs.length >= 3)
      .map((fs) => fs.at(-1)!).filter((f) => parole(f) <= 5 && !/»$/.test(f)),
  },
  {
    nome: 'virgola dentro le caporali',
    spiegazione: 'Convenzione inglese. In italiano: «Dole» dice. Oppure «Dole», dice.',
    trova: tutte(/[,;]»/g),
  },
  {
    nome: 'formule consumate',
    spiegazione: 'Cliché della prosa generata.',
    trova: tutte(/(non (gli|le) arriva(va)? agli occhi|calma studiata|qualcosa di più \p{L}+|per un istante|sorprendentemente|come chi ha già|che nessuno (sa|osa|vuole)|un silenzio che|il peso di|sa di \p{L}+ e di|il tipo di \p{L}+ che)/giu),
  },
  { nome: 'trattino lungo', spiegazione: 'Inciso con trattino lungo.', trova: tutte(/[—–]/g) },
];

export function analizza(testo: string): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const r of REGOLE) {
    const trovati = r.trova(testo);
    if (trovati.length) out[r.nome] = trovati;
  }
  return out;
}

/** Quota di frasi di quattro parole o meno, al netto dei dialoghi. */
export function quotaFrasiBrevi(testo: string): number {
  const fs = frasi(testo.replace(/«[^»]*»/g, 'X'));
  if (fs.length < 4) return 0;
  return fs.filter((f) => parole(f) <= 4).length / fs.length;
}

function blocchi(dati: unknown, dove = ''): { dove: string; testo: string }[] {
  const out: { dove: string; testo: string }[] = [];
  if (Array.isArray(dati)) dati.forEach((x) => out.push(...blocchi(x, dove)));
  else if (dati && typeof dati === 'object') {
    const o = dati as Record<string, unknown>;
    const qui = typeof o['id'] === 'string' ? `${dove}${dove ? ' › ' : ''}${o['id']}` : dove;
    for (const [k, v] of Object.entries(o)) {
      if (['testo', 'sommario', 'descrizione', 'titolo'].includes(k) && typeof v === 'string') out.push({ dove: `${qui} [${k}]`, testo: v });
      else if (k !== 'id') out.push(...blocchi(v, typeof v === 'object' && !Array.isArray(v) ? `${qui} › ${k}` : qui));
    }
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { contenuti } = caricaContenuti({ tavole: false });
  const tutti = blocchi(contenuti);
  const totali: Record<string, number> = {};
  let parolaTot = 0, segnalati = 0;
  for (const b of tutti) {
    parolaTot += parole(b.testo);
    const r = analizza(b.testo);
    const brevi = quotaFrasiBrevi(b.testo);
    if (brevi > 0.25) r['troppe frasi brevi'] = [`${Math.round(brevi * 100)}% delle frasi ha quattro parole o meno`];
    const n = Object.values(r).reduce((a, x) => a + x.length, 0);
    for (const [k, v] of Object.entries(r)) totali[k] = (totali[k] ?? 0) + v.length;
    if (!n) continue;
    segnalati++;
    console.log(`\n${b.dove}`);
    for (const [k, v] of Object.entries(r)) for (const x of v) console.log(`  · ${k}: ${x.slice(0, 110)}`);
  }
  console.log(`\n${tutti.length} blocchi, ${parolaTot} parole, ${segnalati} blocchi con segnalazioni.`);
  for (const [k, v] of Object.entries(totali).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(28)} ${v}`);
}
