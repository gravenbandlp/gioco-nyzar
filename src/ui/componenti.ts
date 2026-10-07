// Pezzi grafici riutilizzati da tutte le viste. Restituiscono stringhe HTML.
import ICONE from '../generato/icone.json';
import type { TContenuti, TOggetto, TVoce } from '../motore/contenuto';
import { NOMI_DIFETTI } from '../motore/contenuto';
import { NOMI, MAX_NEGATIVA, SOGLIA_PERICOLO, RINTOCCHI_MAX } from '../motore/regole';
import { progressoPE, type Stato } from '../motore/personaggio';
import { h, mezzi } from './formato';
import { leggiVoce, leggiOrigine, nomeVoce, senzaSegni, type Voce } from '../motore/voci';

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

/**
 * Testo narrativo: paragrafi separati da una riga vuota, *corsivo* con asterischi, nomi del glossario.
 * I paragrafi che cominciano con {abilità Difficoltà} sono voci delle abilità (motore/voci.ts): `valuta` fa il
 * check passivo, e la voce compare con il suo esito e il colore dell'attributo. Senza `valuta` non compaiono.
 */
export function prosa(testo: string, classe = 'prosa', valuta?: (v: Voce) => boolean, origine?: { id: string; nome: string }): string {
  const paragrafi = testo.trim().split(/\n\s*\n/).map((p) => p.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean);
  const viste = new Set<string>();
  const html = paragrafi.map((p) => {
    // un paragrafo d'origine compare solo a chi ha quell'origine, con il nome dell'origine come etichetta
    const o = leggiOrigine(p);
    if (o) {
      if (!origine || !o.origini.includes(origine.id)) return '';
      return `<p class="abilita-voce voce-origine"><b class="abilita-nome">${h(origine.nome.toUpperCase())} –</b> ${registri(annota(h(o.testo), viste))}</p>`;
    }
    const v = leggiVoce(p);
    if (!v) return `<p>${registri(annota(h(p), viste))}</p>`;
    if (!valuta) return '';
    const riuscita = valuta(v);
    if (riuscita === v.seFallita) return '';
    // classe propria: `voce` è già quella dei nomi del glossario con il tooltip
    return `<p class="abilita-voce ${v.attributo}"><b class="abilita-nome">${h(nomeVoce(v.abilita))}<span> [${h(v.difficolta)}: ${riuscita ? 'riuscita' : 'fallita'}]</span> –</b> ${registri(annota(h(v.testo), viste))}</p>`;
  }).join('');
  return `<div class="${classe}">${html}</div>`;
}

/** Prima frase di un testo, per gli elenchi quando manca il sommario. */
export function primaFrase(testo: string): string {
  const t = senzaSegni(testo).trim().replace(/\s+/g, ' ').replace(/\*/g, '');
  const f = t.match(/^.+?[.!?»](?=\s|$)/)?.[0] ?? t;
  if (f.length <= 170) return f;
  return `${f.slice(0, 160).replace(/\s+\S*$/, '')}…`; // taglia a parola intera
}

/** Sagoma della campana (corpo e labbro), condivisa fra la grande e la piccola. */
const SAGOMA_CAMPANA = 'M32 14C22 14 18 22 18 34V54C18 64 13 70 7 74V78H57V74C51 70 46 64 46 54V34C46 22 42 14 32 14Z';

/** La campana grande della colonna laterale: il bronzo vivo scende verso la corona con i rintocchi spesi. */
export function campanaGrande(rintocchi: number): string {
  const q = Math.max(0, Math.min(1, rintocchi / RINTOCCHI_MAX));
  const cima = (14 + 64 * (1 - q)).toFixed(2); // la campana va da y 14 (corona) a y 78 (labbro)
  return `<svg class="campana-grande${rintocchi === 0 ? ' muta' : ''}" viewBox="0 0 64 96" aria-hidden="true">
    <defs>
      <linearGradient id="campana-bronzo" x1="0" x2="1">
        <stop offset="0" stop-color="#6e4c1d"/><stop offset="0.35" stop-color="#c99a48"/>
        <stop offset="0.5" stop-color="#f1d595"/><stop offset="0.68" stop-color="#b98a3e"/><stop offset="1" stop-color="#5c3f17"/>
      </linearGradient>
      <clipPath id="campana-livello"><rect x="0" y="${cima}" width="64" height="96"/></clipPath>
    </defs>
    <rect class="trave" x="8" y="0" width="48" height="6" rx="2"/>
    <path class="gancio" d="M27 6V9A5 5 0 0 0 37 9V6"/>
    <path class="patina" d="${SAGOMA_CAMPANA}"/>
    <g class="bronzo"><path d="${SAGOMA_CAMPANA}" clip-path="url(#campana-livello)"/></g>
    <path class="fregio" d="M18 40H46M10.5 71H53.5"/>
    <path class="contorno" d="${SAGOMA_CAMPANA}"/>
    <path class="battaglio" d="M32 78V85"/><circle class="battaglio" cx="32" cy="88" r="4"/>
  </svg>`;
}

/** La campana piccola della barra in alto, sul telefono. */
export function campanaPiccola(): string {
  return `<svg class="mini-campana" viewBox="4 10 56 82" aria-hidden="true"><path d="${SAGOMA_CAMPANA}"/><circle cx="32" cy="86" r="5"/></svg>`;
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

/** Che cosa fanno le proprietà e i difetti degli oggetti magici (docs/regolamento-oggetti.md), per chi deve decidere se comprarli. */
const EFFETTI_PROPRIETA: Record<string, string> = {
  assetata: 'Assetata: recuperi 1 PF a ogni colpo a segno.',
  schermata: 'Schermata: la Contaminazione che prendi si dimezza.',
  lucida: 'Lucida: il Tormento che prendi si dimezza.',
  ultimoRespiro: 'Ultimo respiro: quando arrivi a 0 PF resti a 1, una volta per scontro.',
  secondaScelta: 'Seconda scelta: una volta per esito ripeti una prova fallita; se la seconda riesce, +½ Tormento.',
  ostinata: 'Ostinata: +2 danno quando hai meno di metà dei PF.',
  silenziosa: "Silenziosa: niente penalità di Furtività dall'armatura.",
  caricatore: "Caricatore: l'arma non perde un round a ricaricare dopo ogni tiro.",
};
const EFFETTI_DIFETTI: Record<string, string> = {
  pesante: 'Pesante: serve Fisico 3 per indossarla.',
  rumorosa: 'Rumorosa: −1 Furtività.',
  riconoscibile: 'Riconoscibile: in certe storie chi la vede la riconosce.',
  inquieta: 'Inquieta: +½ Tormento a ogni scontro in cui la usi.',
  stancante: 'Stancante: +½ Ferite dopo ogni scontro in cui la indossi.',
  inceppamento: 'Inceppamento: con zero successi in attacco perdi il round dopo.',
  legata: 'Legata: non si vende, non si cede e non si toglie.',
};

/** Le statistiche di un oggetto in chiaro, una riga per voce: quello che serve sapere prima di comprarlo. */
export function spiegaOggetto(id: string, c: TContenuti): { voci: string[]; difetti: string[] } {
  const og = c.oggetti.find((o) => o.id === id);
  if (!og) return { voci: [], difetti: [] };
  const voci: string[] = [];
  const slot: Record<string, string> = { arma: 'Arma', armatura: 'Armatura', scudo: 'Scudo', accessorio: 'Accessorio', nessuno: 'Oggetto' };
  const arma = og.slot === 'arma' ? c.armi.find((a) => a.id === og.base) : undefined;
  const armatura = og.slot === 'armatura' ? c.armature.find((a) => a.id === og.base) : undefined;
  const scudo = og.slot === 'scudo' ? c.scudi.find((a) => a.id === og.base) : undefined;
  const base = arma ?? armatura ?? scudo;
  voci.push(`${slot[og.slot]}${base ? `, ${base.nome.toLowerCase()}` : ''}${og.grado ? `, grado ${og.grado}` : ''}.`);
  const p = og.proprieta;
  if (arma) {
    voci.push(`Si usa con ${NOMI[arma.abilita]}. Danno +${arma.danno + p.affilata}${p.affilata ? ` (${p.affilata} dall'affilatura)` : ''}.`);
    if (arma.proprieta.length) voci.push(`Proprietà dell'arma: ${arma.proprieta.join(', ')}.`);
  }
  if (armatura) {
    voci.push(`Riduce il danno di ${armatura.riduzione + p.robusta}${p.robusta ? ` (${p.robusta} in più perché robusta)` : ''}.`);
    const pen = Object.entries(armatura.penalita).filter(([k]) => !(k === 'furtivita' && p.silenziosa));
    if (pen.length) voci.push(`Penalità: ${pen.map(([k, v]) => `${NOMI[k]} ${v}`).join(', ')}.`);
  }
  if (scudo) {
    voci.push(`+${scudo.dadi} ${scudo.dadi === 1 ? 'dado' : 'dadi'} in difesa.`);
    const pen = Object.entries(scudo.penalita);
    if (pen.length) voci.push(`Penalità: ${pen.map(([k, v]) => `${NOMI[k]} ${v}`).join(', ')}.`);
  }
  if (og.dadi && og.slot !== 'scudo') voci.push(`+${og.dadi} ${og.dadi === 1 ? 'dado' : 'dadi'} ${og.slot === 'arma' ? 'in attacco' : 'in difesa'}.`);
  if (p.penetrante) voci.push(`Ignora ${p.penetrante} di armatura del nemico.`);
  if (p.riserva) voci.push(`+${p.riserva * 2} Energia per gli incantesimi.`);
  if (p.rapida) voci.push(`+${p.rapida} ${p.rapida === 1 ? 'dado' : 'dadi'} di iniziativa.`);
  for (const k of Object.keys(EFFETTI_PROPRIETA)) if ((p as Record<string, unknown>)[k]) voci.push(EFFETTI_PROPRIETA[k]!);
  for (const [k, v] of Object.entries(p.talento)) voci.push(`+${v} ${v === 1 ? 'dado' : 'dadi'} ${/^a/i.test(NOMI[k] ?? '') ? 'ad' : 'a'} ${NOMI[k]} fuori dal combattimento.`);
  if (p.chiave.length) voci.push('Apre opzioni in più in alcune storie.');
  return { voci, difetti: og.difetti.map((d) => EFFETTI_DIFETTI[d] ?? NOMI_DIFETTI[d]) };
}

export function descriviArma(id: string, c: TContenuti) { return descriviOggetto(id, c); }
export function descriviArmatura(id: string, c: TContenuti) { return descriviOggetto(id, c); }

/** Il rombo del Codex, usato come marchio. */
export const ROMBO = `<svg class="rombo" viewBox="0 0 32 32" aria-hidden="true"><rect x="6" y="6" width="20" height="20" transform="rotate(45 16 16)" fill="none" stroke="currentColor" stroke-width="1.2"/><rect x="12" y="12" width="8" height="8" transform="rotate(45 16 16)" fill="currentColor"/></svg>`;
