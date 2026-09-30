// Pezzi grafici riutilizzati da tutte le viste. Restituiscono stringhe HTML.
import type { TContenuti } from '../motore/contenuto';
import { NOMI, MAX_NEGATIVA, SOGLIA_PERICOLO, CANDELE_MAX } from '../motore/regole';
import { progressoPE, type Stato } from '../motore/personaggio';
import { h, mezzi } from './formato';

/** Percorso di una tavola importata dal Codex. */
export function srcTavola(t: string, taglio: 's' | 'l' = 's'): string {
  return `tavole/${t}-${taglio}.webp`;
}

/**
 * Tavola con cornice e cantonali alla maniera del Codex. Senza immagine mostra il segnaposto
 * "Tavola non catalogata", così si vede dove andrà un'illustrazione.
 */
export function tavola(t: string | undefined, opz: { classe?: string; taglio?: 's' | 'l'; alt?: string; didascalia?: string } = {}): string {
  const cls = `tavola ${opz.classe ?? ''}`.trim();
  const img = t
    ? `<img src="${srcTavola(t, opz.taglio)}" alt="${h(opz.alt ?? '')}" loading="lazy" decoding="async">`
    : `<span class="vuota"><span>Tavola non catalogata</span></span>`;
  return `<figure class="${cls}"><i class="k k1"></i><i class="k k2"></i><i class="k k3"></i><i class="k k4"></i>${img}${opz.didascalia ? `<figcaption>${opz.didascalia}</figcaption>` : ''}</figure>`;
}

/** Testo narrativo: paragrafi separati da una riga vuota, *corsivo* con asterischi. */
export function prosa(testo: string, classe = 'prosa'): string {
  const paragrafi = testo.trim().split(/\n\s*\n/).map((p) => p.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean);
  return `<div class="${classe}">${paragrafi.map((p) => `<p>${h(p).replace(/\*([^*]+)\*/g, '<em>$1</em>')}</p>`).join('')}</div>`;
}

/** Prima frase di un testo, per gli elenchi quando manca il sommario. */
export function primaFrase(testo: string): string {
  const t = testo.trim().replace(/\s+/g, ' ').replace(/\*/g, '');
  return (t.match(/^.+?[.!?»](?=\s|$)/)?.[0] ?? t).slice(0, 160);
}

/** La candela grande della colonna laterale: la cera cala con le candele rimaste. */
export function candelaGrande(candele: number): string {
  const q = Math.max(0, Math.min(1, candele / CANDELE_MAX));
  return `<div class="candela-grande" aria-hidden="true" style="--altezza:${(0.12 + q * 0.88).toFixed(3)}">
    <div class="fiamma${candele === 0 ? ' spenta' : ''}"><i></i></div>
    <div class="fusto"><span class="colatura c1"></span><span class="colatura c2"></span></div>
    <div class="piattino"></div>
  </div>`;
}

export function dado(f: number): string {
  const punti: Record<number, number[]> = { 1: [4], 2: [2, 6], 3: [2, 4, 6], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  const celle = Array.from({ length: 9 }, (_, i) => `<b${punti[f]!.includes(i) ? ' class="p"' : ''}></b>`).join('');
  return `<span class="dado${f >= 4 ? ' ok' : ''}" role="img" aria-label="${f}${f >= 4 ? ', successo' : ''}">${celle}</span>`;
}

export function pallini(v: number, max = 5): string {
  return `<span class="pallini" role="img" aria-label="${v} su ${max}">${Array.from({ length: max }, (_, i) => `<i${i < v ? ' class="on"' : ''}></i>`).join('')}</span>`;
}

export function barraPE(s: Stato, chiave: string): string {
  const { pe, soglia } = progressoPE(s, chiave);
  if (!soglia) return '<span class="barra pe piena" title="Livello massimo"><i style="width:100%"></i></span>';
  const q = Math.min(1, pe / soglia);
  return `<span class="barra pe" title="${mezzi(Math.round(pe * 4) / 4)} / ${soglia} PE verso il livello successivo"><i style="width:${(q * 100).toFixed(1)}%"></i></span>`;
}

/** Barra di una statistica negativa (0–8). Oltre la soglia di pericolo diventa rossa. */
export function barraNegativa(v: number): string {
  const cls = v >= MAX_NEGATIVA ? ' crisi' : v >= SOGLIA_PERICOLO ? ' pericolo' : '';
  return `<span class="barra neg${cls}"><i style="width:${((v / MAX_NEGATIVA) * 100).toFixed(1)}%"></i></span>`;
}

/** Barra "da → a" degli esiti, come in Fallen London: il tratto guadagnato è evidenziato. */
export function barraVariazione(prima: number, dopo: number, max: number, tipo: 'neg' | 'pe' | 'pista', estremi?: [string, string]): string {
  const a = Math.max(0, Math.min(1, Math.min(prima, dopo) / max));
  const b = Math.max(0, Math.min(1, Math.max(prima, dopo) / max));
  const cresce = dopo > prima;
  return `<span class="variazione-barra ${tipo}${cresce ? ' su' : ' giu'}">
    <b>${estremi ? estremi[0] : mezzi(prima)}</b>
    <span class="traccia"><i class="base" style="width:${(a * 100).toFixed(1)}%"></i><i class="delta" style="left:${(a * 100).toFixed(1)}%;width:${((b - a) * 100).toFixed(1)}%"></i></span>
    <b>${estremi ? estremi[1] : mezzi(dopo)}</b>
  </span>`;
}

export function etichetta(testo: string, tono: 'velo' | 'precursore' | 'mana' | 'dim' = 'dim'): string {
  return `<span class="etichetta ${tono}">${h(testo)}</span>`;
}

export function descriviArma(id: string, c: TContenuti): { nome: string; dettagli: string; immagine?: string } {
  const a = c.armi.find((x) => x.id === id);
  if (!a) return { nome: id, dettagli: '' };
  return { nome: a.nome, dettagli: [NOMI[a.abilita], `danno +${a.danno}`, ...a.proprieta].join(' · '), immagine: a.immagine };
}

export function descriviArmatura(id: string, c: TContenuti): { nome: string; dettagli: string; immagine?: string } {
  const a = c.armature.find((x) => x.id === id);
  if (!a) return { nome: id, dettagli: '' };
  const pen = Object.entries(a.penalita).map(([k, v]) => `${NOMI[k]} ${v}`);
  return { nome: a.nome, dettagli: [`riduzione ${a.riduzione}`, ...pen].join(' · '), immagine: a.immagine };
}

/** Il rombo del Codex, usato come marchio. */
export const ROMBO = `<svg class="rombo" viewBox="0 0 32 32" aria-hidden="true"><rect x="6" y="6" width="20" height="20" transform="rotate(45 16 16)" fill="none" stroke="currentColor" stroke-width="1.2"/><rect x="12" y="12" width="8" height="8" transform="rotate(45 16 16)" fill="currentColor"/></svg>`;
