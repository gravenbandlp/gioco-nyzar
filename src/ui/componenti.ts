// Pezzi grafici riutilizzati da tutte le viste. Restituiscono stringhe HTML.
import ICONE from '../generato/icone.json';
import type { TContenuti, TOggetto, TVoce } from '../motore/contenuto';
import { NOMI_DIFETTI } from '../motore/contenuto';
import { NOMI, MAX_NEGATIVA, SOGLIA_PERICOLO, CANDELE_MAX } from '../motore/regole';
import { progressoPE, type Stato } from '../motore/personaggio';
import { h, mezzi } from './formato';

/** Le icone minori (game-icons.net, CC BY 3.0) sono SVG in linea, colorati dal CSS. */
export const èIcona = (t: string): boolean => t.startsWith('icone/');
function iconaSvg(t: string, classe = ''): string {
  const nome = t.slice(6);
  const corpo = (ICONE as Record<string, string>)[nome] ?? '';
  return `<figure class="tavola icona-svg ${classe}" data-icona="${nome}"><svg viewBox="0 0 512 512" aria-hidden="true">${corpo}</svg></figure>`;
}

/** Percorso di una tavola importata dal Codex. */
export function srcTavola(t: string, taglio: 's' | 'l' = 's'): string {
  return `tavole/${t}-${taglio}.webp`;
}

/**
 * Tavola con cornice e cantonali alla maniera del Codex. Senza immagine mostra il segnaposto
 * "Tavola non catalogata", così si vede dove andrà un'illustrazione.
 */
export function tavola(t: string | undefined, opz: { classe?: string; taglio?: 's' | 'l'; alt?: string; didascalia?: string } = {}): string {
  if (t && èIcona(t)) return iconaSvg(t, opz.classe);
  const cls = `tavola ${opz.classe ?? ''}`.trim();
  const img = t
    ? `<img src="${srcTavola(t, opz.taglio)}" alt="${h(opz.alt ?? '')}" decoding="sync">`
    : `<span class="vuota"><span>Tavola non catalogata</span></span>`;
  return `<figure class="${cls}"><i class="k k1"></i><i class="k k2"></i><i class="k k3"></i><i class="k k4"></i>${img}${opz.didascalia ? `<figcaption>${opz.didascalia}</figcaption>` : ''}</figure>`;
}

// ---------------------------------------------------------------- glossario

// Una forma può avere più voci con requisiti diversi (lo stesso PNG prima e dopo un fatto della trama): vale la
// prima visibile.
const glossario: { voci: TVoce[] | null; rx: RegExp | null; forme: Map<string, TVoce[]>; visibile: (v: TVoce) => boolean } = {
  voci: null, rx: null, forme: new Map(), visibile: () => true,
};

/**
 * Prepara il riconoscimento dei nomi del glossario nella prosa. `visibile` decide, a ogni render,
 * quali voci si possono già mostrare (requisiti soddisfatti).
 */
export function impostaGlossario(voci: TVoce[], visibile: (v: TVoce) => boolean): void {
  if (voci !== glossario.voci) {
    glossario.voci = voci;
    glossario.forme = new Map();
    for (const v of voci) for (const f of [v.nome, ...v.alias]) glossario.forme.set(h(f), [...(glossario.forme.get(h(f)) ?? []), v]);
    const forme = [...glossario.forme.keys()].sort((a, b) => b.length - a.length).map((f) => f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    glossario.rx = forme.length ? new RegExp(`(?<![\\p{L}\\p{N}&#])(?:${forme.join('|')})(?![\\p{L}\\p{N}])`, 'gu') : null;
  }
  glossario.visibile = visibile;
}

/** Sottolinea la prima occorrenza di ogni voce del glossario in un pezzo di HTML già escapato. */
function annota(html: string, viste: Set<string>): string {
  if (!glossario.rx) return html;
  return html.replace(glossario.rx, (m) => {
    const v = glossario.forme.get(m)?.find((x) => glossario.visibile(x));
    if (!v || viste.has(v.nome)) return m;
    viste.add(v.nome);
    viste.add(v.id);
    return `<span class="voce" tabindex="0" role="button" data-voce="${v.id}">${m}</span>`;
  });
}

/**
 * I tre registri della prosa: la narrazione resta com'è, il parlato «…» e i pensieri *frase intera.* hanno
 * ciascuno il suo carattere. Il corsivo breve senza punto finale (*Ospiti Benvenuti*) è solo enfasi o scritta.
 */
function registri(html: string): string {
  return html
    .replace(/«[^«»]*»/g, (m) => `<span class="parlato">${m}</span>`)
    .replace(/\*([^*]+)\*/g, (_, t: string) => (/[.!?…]\s*$/.test(t) ? `<span class="pensiero">${t}</span>` : `<em>${t}</em>`));
}

/** Testo narrativo: paragrafi separati da una riga vuota, *corsivo* con asterischi, nomi del glossario. */
export function prosa(testo: string, classe = 'prosa'): string {
  const paragrafi = testo.trim().split(/\n\s*\n/).map((p) => p.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean);
  const viste = new Set<string>();
  return `<div class="${classe}">${paragrafi.map((p) => `<p>${registri(annota(h(p), viste))}</p>`).join('')}</div>`;
}

/** Prima frase di un testo, per gli elenchi quando manca il sommario. */
export function primaFrase(testo: string): string {
  const t = testo.trim().replace(/\s+/g, ' ').replace(/\*/g, '');
  const f = t.match(/^.+?[.!?»](?=\s|$)/)?.[0] ?? t;
  if (f.length <= 170) return f;
  return `${f.slice(0, 160).replace(/\s+\S*$/, '')}…`; // taglia a parola intera
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

/** Descrizione leggibile di un oggetto: statistiche di base, grado, proprietà e difetti. */
export function descriviOggetto(id: string, c: TContenuti): { nome: string; dettagli: string; immagine?: string; difetti: string[]; og?: TOggetto } {
  const og = c.oggetti.find((o) => o.id === id);
  const parti: string[] = [];
  const base = og?.base ?? id;
  const arma = og?.slot === 'arma' || !og ? c.armi.find((a) => a.id === base) : undefined;
  const armatura = og?.slot === 'armatura' || !og ? c.armature.find((a) => a.id === base) : undefined;
  const scudo = og?.slot === 'scudo' ? c.scudi.find((a) => a.id === base) : undefined;
  if (arma) parti.push(NOMI[arma.abilita]!, `danno +${arma.danno + (og?.proprieta.affilata ?? 0)}`, ...arma.proprieta);
  if (armatura) {
    parti.push(`riduzione ${armatura.riduzione + (og?.proprieta.robusta ?? 0)}`);
    for (const [k, v] of Object.entries(armatura.penalita)) if (!(k === 'furtivita' && og?.proprieta.silenziosa)) parti.push(`${NOMI[k]} ${v}`);
  }
  if (scudo) { parti.push(`+${scudo.dadi} ${scudo.dadi === 1 ? 'dado' : 'dadi'} in difesa`); for (const [k, v] of Object.entries(scudo.penalita)) parti.push(`${NOMI[k]} ${v}`); }
  if (og) {
    if (og.grado) parti.push(`magico +${og.grado}`);
    if (og.dadi && og.slot !== 'scudo') parti.push(`+${og.dadi} ${og.dadi === 1 ? 'dado' : 'dadi'} ${og.slot === 'arma' ? 'in attacco' : 'in difesa'}`);
    const p = og.proprieta;
    if (p.penetrante) parti.push(`ignora ${p.penetrante} di armatura`);
    if (p.riserva) parti.push(`+${p.riserva * 2} Energia`);
    if (p.rapida) parti.push(`+${p.rapida} iniziativa`);
    if (p.assetata) parti.push('Assetata');
    if (p.schermata) parti.push('Schermata');
    if (p.lucida) parti.push('Lucida');
    if (p.ultimoRespiro) parti.push('Ultimo respiro');
    if (p.secondaScelta) parti.push('Seconda scelta');
    if (p.ostinata) parti.push('Ostinata');
    if (p.caricatore) parti.push('Caricatore');
    for (const [k, v] of Object.entries(p.talento)) parti.push(`+${v} ${NOMI[k]} fuori dal combattimento`);
  }
  return { nome: og?.nome ?? arma?.nome ?? armatura?.nome ?? id, dettagli: parti.length ? parti.join(' · ') : og?.descrizione ?? '', immagine: og?.immagine, og,
    difetti: (og?.difetti ?? []).map((d) => NOMI_DIFETTI[d]) };
}

export function descriviArma(id: string, c: TContenuti) { return descriviOggetto(id, c); }
export function descriviArmatura(id: string, c: TContenuti) { return descriviOggetto(id, c); }

/** Il rombo del Codex, usato come marchio. */
export const ROMBO = `<svg class="rombo" viewBox="0 0 32 32" aria-hidden="true"><rect x="6" y="6" width="20" height="20" transform="rotate(45 16 16)" fill="none" stroke="currentColor" stroke-width="1.2"/><rect x="12" y="12" width="8" height="8" transform="rotate(45 16 16)" fill="currentColor"/></svg>`;
