// Le viste del gioco. Ogni funzione riceve lo stato e restituisce HTML; gli eventi
// sono gestiti in main.ts tramite attributi data-az.
import type { TContenuti, TStorylet, TFrammento, TLuogo, TNegozio } from '../motore/contenuto';
import {
  ATTRIBUTI, ABILITA, NEGATIVE, MAX_NEGATIVA, RINTOCCHI_MAX, CODA_MAX, MANO_MAX, MAX_CONSUMABILI_IN_COMBATTIMENTO, NOMI,
  SOGLIE_PE,
} from '../motore/regole';
import {
  msAlProssimoRintocco, msAllaProssimaCarta, storyletDisponibili, requisitiSoddisfatti, requisitiMancanti, parseRequisito, type Stato,
} from '../motore/personaggio';
import { anteprima, puoEntrare, correggibile, secondaSceltaDisponibile, listino, negozioAperto, vociCompra, vendibili, type Risultato } from '../motore/azioni';
import { incantesimiConosciuti, repertorio, limiteRepertorio } from '../motore/magia';
import { NIENTE_ARMA, NIENTE_ARMATURA, oggetto, possiede, indossato, perchéNonIndossabile } from '../motore/oggetti';
import { crisiAttiva, opzioniVisibili, mutazioniDi } from '../motore/crisi';
import { areaAttuale, areaChiusa, profondita, stanzeVisibili } from '../motore/spedizioni';
import { nelDiario } from '../motore/diario';
import { serieDi, avanzamento, prossimaTappa, type Serie } from '../motore/serie';
import { NOMI_TRADIZIONI, OVUNQUE } from '../motore/contenuto';
import { piede } from './pagine';
import { inPiedi, CONSUMABILI, perchéNonLanciabile, descriviModifica, type StatoCombattimento, type Combattente } from '../motore/combattimento';
import { h, mezzi, segno, durata, percentuale, nome, requisitoLeggibile, tempoGiocato } from './formato';
import {
  tavola, prosa, primaFrase, campanaGrande, campanaPiccola, dado, pallini, barraPE, barraNegativa, barraVariazione, etichetta,
  descriviArma, descriviArmatura, descriviOggetto, srcTavola, ROMBO,
} from './componenti';

export type Scheda = 'storia' | 'personaggio' | 'averi' | 'bazar' | 'mappa' | 'diario';
export type Vista =
  | { tipo: 'area' }
  | { tipo: 'storylet'; id: string }
  | { tipo: 'risultato'; id: string; risultato: Risultato; indice?: number; prima?: Stato }
  | { tipo: 'combattimento'; id: string; indice: number; cs: StatoCombattimento };

export interface Contesto {
  s: Stato;
  c: TContenuti;
  vista: Vista;
  scheda: Scheda;
  frammento: TFrammento | undefined;
  confermaNuovo: boolean;
  avviso: string;
  ora: number;
  bersaglio?: string;
  luogo?: string; // il luogo (mini-hub) aperto dentro l'area, se c'è
  voci?: Set<string>; // i pezzi doppiati (id del copione)
  voceInCorso?: string | null;
}

/** L'id del copione per l'esito di un'opzione (vedi scripts/doppiaggio.ts). */
export function idVoceEsito(st: TStorylet, indice: number, r: Risultato): string {
  const o = st.opzioni[indice];
  const ramo = o?.prova ? (r.riuscito ? 'successo' : 'fallimento') : o?.combattimento ? (r.riuscito ? 'vittoria' : 'sconfitta') : 'esito';
  return `${st.id}__${indice + 1}-${ramo}`;
}

/** Il pulsante per ascoltare un pezzo doppiato, se c'è. */
function ascolta(x: Contesto, id: string): string {
  if (!x.voci?.has(id)) return '';
  const parla = x.voceInCorso === id;
  return `<button type="button" class="ascolta${parla ? ' parla' : ''}" data-az="voce" data-id="${id}" aria-pressed="${parla}">${parla ? 'Ferma la voce' : 'Ascolta'}</button>`;
}

const trova = (c: TContenuti, id: string) => c.storylet.find((x) => x.id === id);
const areaDi = (x: Contesto) => x.c.aree.find((a) => a.id === x.s.area)!;
/** I luoghi dell'area attuale che il personaggio può vedere. */
export function luoghiQui(s: Stato, c: TContenuti): TLuogo[] {
  return c.luoghi.filter((l) => l.area === s.area && requisitiSoddisfatti(s, l.requisiti, c));
}
/** Il luogo aperto, se è ancora valido (stessa area, requisiti soddisfatti). */
export function luogoAperto(x: Pick<Contesto, 's' | 'c' | 'luogo'>): TLuogo | undefined {
  return x.luogo ? luoghiQui(x.s, x.c).find((l) => l.id === x.luogo) : undefined;
}
const tipoStorylet = (st: TStorylet) => (st.tipo === 'crisi' ? 'Crisi' : st.tipo === 'prologo' ? 'Prologo' : st.tipo === 'carta' ? 'Occasione' : st.ripetibile ? 'Ripetibile' : 'Storia');

// ================================================================ impianto

export function pagina(x: Contesto, centro: string): string {
  return `
  ${topbar(x)}
  ${fondale(x)}
  <div class="impianto">
    <aside class="colonna sinistra" aria-label="Rintocchi e statistiche">${sinistra(x)}</aside>
    <main class="colonna centro">
      ${schede(x)}
      ${x.avviso ? `<p class="avviso" role="status">${h(x.avviso)}</p>` : ''}
      <div class="pannello">${centro}</div>
    </main>
    <aside class="colonna destra" aria-label="Luogo e frammenti del Codex">${destra(x)}</aside>
  </div>
  ${piede()}`;
}

/** Il marchio del gioco nella barra in alto. */
export const MARCHIO = `<div class="marchio">${ROMBO}<span class="nome-marchio"><span><b>LUDUS</b> · <em>NY'ZAR</em></span><small>Cronache della Superficie Fratturata</small></span></div>`;

function topbar(x: Contesto): string {
  const origine = x.c.origini.find((o) => o.id === x.s.origine);
  return `<header class="topbar">
    ${MARCHIO}
    <div class="chi">
      <span class="nome-pg">${h(x.s.nome)}</span>
      <span class="origine-pg">${h(origine?.nome ?? '')}</span>
      <button type="button" class="link stato-salvataggio" data-az="pagina" data-id="salvataggio" data-indicatore="salvataggio">Salvato nel browser</button>
      <button type="button" class="link${x.confermaNuovo ? ' allarme' : ''}" data-az="nuovo">${x.confermaNuovo ? 'Confermi? Il personaggio va perso' : 'Nuovo personaggio'}</button>
    </div>
  </header>`;
}

function fondale(x: Contesto): string {
  const a = areaDi(x);
  return `<div class="fondale">
    ${a.immagine ? `<img src="${srcTavola(a.immagine, 'l')}" alt="" decoding="sync">` : ''}
    <div class="fondale-testo">
      <span class="etichetta precursore">Qir-Azel · 150 D.C.</span>
      <h1>${h(a.nome)}</h1>
      <p>${h(primaFrase(a.testo))}</p>
    </div>
  </div>`;
}

/** Durante il prologo (quality «prologo» 1 o 2, azzerata da «Tre giorni dopo») si apre solo quello che serve alla scena. */
export const inPrologo = (s: Stato): boolean => (s.quality['prologo'] ?? 0) > 0;
const SCHEDE_DEL_PROLOGO: Scheda[] = ['storia', 'personaggio', 'averi'];
export const schedaAperta = (s: Stato, k: Scheda): boolean => !inPrologo(s) || SCHEDE_DEL_PROLOGO.includes(k);

function schede(x: Contesto): string {
  const voci: [Scheda, string][] = [['storia', 'Storia'], ['personaggio', 'Personaggio'], ['averi', 'Averi'], ['bazar', 'Bazar'], ['mappa', 'Mappa'], ['diario', 'Diario']];
  const prossima = msAlProssimoRintocco(x.s, x.ora);
  return `<div class="barra-schede">
    <p class="mini-stato" aria-label="Rintocchi e monete">
      ${campanaPiccola()}<b>${x.s.rintocchi}</b>/${RINTOCCHI_MAX}
      <span class="timer" data-timer="rintocco">${prossima === null ? 'Tutti pronti' : `Il prossimo tra ${durata(prossima)}`}</span>
      <span class="moneta" aria-hidden="true"></span><b>${mezzi(x.s.quality['monete'] ?? 0)}</b>
    </p>
    <nav class="schede" aria-label="Sezioni">${voci
    .map(([id, t]) => schedaAperta(x.s, id)
      ? `<button type="button" data-az="scheda" data-id="${id}" ${x.scheda === id ? 'aria-current="page" class="attiva"' : ''}>${t}</button>`
      : `<button type="button" class="chiusa" disabled title="Si apre dopo il prologo">${t}</button>`)
    .join('')}</nav>
  </div>`;
}

// ================================================================ colonna sinistra

function sinistra(x: Contesto): string {
  const { s, c } = x;
  const prossima = msAlProssimoRintocco(s, x.ora);
  const attributi = ATTRIBUTI.map((a) => `<li>
      <div class="riga-stat"><span>${NOMI[a]}</span><b>${s.attributi[a]}</b></div>${barraPE(s, a)}</li>`).join('');
  const negative = NEGATIVE.map((k) => {
    const v = s.quality[k] ?? 0;
    return `<li><div class="riga-stat"><span>${h(nome(k, c))}</span><b>${mezzi(v)}</b></div>${barraNegativa(v)}</li>`;
  }).join('');
  return `
    <div class="blocco-rintocchi">
      ${campanaGrande(s.rintocchi)}
      <div class="contatore">
        <span class="etichetta velo">Rintocchi</span>
        <b>${s.rintocchi}<small>/${RINTOCCHI_MAX}</small></b>
        <span class="timer" data-timer="rintocco">${prossima === null ? 'Tutti pronti' : `Il prossimo tra ${durata(prossima)}`}</span>
      </div>
    </div>
    <div class="borsa"><span class="moneta" aria-hidden="true"></span><span><b>${mezzi(s.quality['monete'] ?? 0)}</b> monete</span></div>
    <section class="stat-laterali"><h2 class="etichetta">Attributi</h2><ul>${attributi}</ul></section>
    <section class="stat-laterali"><h2 class="etichetta">Negative</h2><ul>${negative}</ul></section>`;
}

// ================================================================ colonna destra

function destra(x: Contesto): string {
  const a = areaDi(x);
  const f = x.frammento;
  return `
    <div class="dove">
      <span class="etichetta">Ti trovi a</span>
      <p class="luogo-attuale">${h(a.nome)}${luogoAperto(x) ? `<small>${h(luogoAperto(x)!.nome)}</small>` : ''}</p>
      ${schedaAperta(x.s, 'mappa') ? '<button type="button" class="bottone" data-az="scheda" data-id="mappa">Apri la mappa</button>' : ''}
    </div>
    ${f ? `<article class="frammento">
      <header><span class="etichetta velo">Dal Codex</span><h2>${h(f.titolo)}</h2></header>
      ${f.immagine ? tavola(f.immagine, { classe: 'frammento-tavola' }) : ''}
      ${prosa(f.testo, 'prosa piccola')}
      <button type="button" class="link" data-az="frammento">Un altro frammento ↻</button>
    </article>` : ''}`;
}

// ================================================================ STORIA

export function storia(x: Contesto): string {
  switch (x.vista.tipo) {
    case 'storylet': return vistaStorylet(x, x.vista.id);
    case 'risultato': return vistaRisultato(x, x.vista.id, x.vista.risultato);
    case 'combattimento': return vistaCombattimento(x, x.vista.cs);
    default: {
      const crisi = crisiAttiva(x.s, x.c);
      return crisi ? vistaStorylet(x, crisi.id) : vistaArea(x);
    }
  }
}

function portaA(st: TStorylet, id: string): boolean {
  return st.opzioni.some((o) => [o.esito, o.successo, o.fallimento, o.vittoria, o.sconfitta].some((e) => e?.segue === id));
}

function vistaArea(x: Contesto): string {
  const { s, c } = x;
  const disponibili = storyletDisponibili(s, c);
  // un seguito lasciato a metà (chiudendo il risultato invece di proseguire) torna in cima alla storia
  const sospeso = s.sospeso ? trova(c, s.sospeso) : undefined;
  const inAttesa = sospeso && requisitiSoddisfatti(s, sospeso.requisiti, c) ? sospeso : undefined;
  const riprendi = inAttesa && !disponibili.includes(inAttesa) ? [inAttesa] : [];
  // finché il seguito aspetta, la scena che lo apre non si rigioca (niente effetti presi due volte)
  const storie = [...riprendi, ...disponibili.filter((st) => !st.ripetibile && !(inAttesa && st !== inAttesa && portaA(st, inAttesa.id)))];
  const crisi = NEGATIVE.filter((k) => (s.quality[k] ?? 0) >= MAX_NEGATIVA);
  const avvisoCrisi = crisi.length ? `<p class="avviso crisi">${crisi.map((k) => h(nome(k, c))).join(', ')} al massimo. La crisi ti aspetta all'uscita da quest'area.</p>` : '';
  const sped = areaAttuale(s, c)?.spedizione;
  if (sped) {
    return `${avvisoCrisi}${testataSpedizione(x)}${occasioni(x)}
      ${storie.length ? `<h2 class="titolo-sezione">La tua storia</h2><ul class="elenco-storylet">${storie.map((st) => rigaStorylet(x, st)).join('')}</ul>` : ''}
      <h2 class="titolo-sezione">Davanti a te</h2>
      <ul class="elenco-storylet">${stanzeVisibili(s, c).map((st) => rigaStorylet(x, st, true)).join('')}</ul>`;
  }
  const qui = luogoAperto(x);
  if (qui) return avvisoCrisi + vistaLuogo(x, qui, storie, riprendi);
  const luoghi = luoghiQui(s, c);
  const ids = new Set(luoghi.map((l) => l.id));
  const inGiro = stanzeVisibili(s, c).filter((st) => !st.presso || !ids.has(st.presso));
  const schede = luoghi.map((l) => {
    const ripetibili = disponibili.filter((st) => st.ripetibile && st.presso === l.id).length;
    const nuove = storie.filter((st) => st.presso === l.id).length;
    const aperti = negoziAperti(x, l.negozi).length;
    if (!ripetibili && !nuove && !aperti) return '';
    const segni = [
      nuove ? `<span class="segno storia">${nuove === 1 ? 'Una storia' : `${nuove} storie`}</span>` : '',
      ripetibili ? `<span class="segno">${ripetibili === 1 ? 'Una cosa da fare' : `${ripetibili} cose da fare`}</span>` : '',
      aperti ? `<span class="segno bottega">${aperti === 1 ? 'Bottega' : `${aperti} botteghe`}</span>` : '',
    ].join('');
    return `<li><button type="button" class="scheda-luogo${nuove ? ' con-storia' : ''}" data-az="luogo" data-id="${l.id}">
      ${tavola(l.immagine, { classe: 'paesaggio' })}
      <span class="corpo">
        <span class="nome-luogo">${h(l.nome)}</span>
        <span class="sommario">${h(l.sommario)}</span>
        <span class="segni">${segni}</span>
      </span>
    </button></li>`;
  }).join('');
  return `
    ${avvisoCrisi}
    ${occasioni(x)}
    ${storie.length ? `<h2 class="titolo-sezione">La tua storia</h2><ul class="elenco-storylet">${storie.map((st) => rigaStorylet(x, st)).join('')}</ul>` : ''}
    ${schede ? `<h2 class="titolo-sezione">I luoghi</h2><ul class="griglia-luoghi">${schede}</ul>` : ''}
    ${inGiro.length ? `<h2 class="titolo-sezione">In giro per ${h(areaDi(x).nome)}</h2><ul class="elenco-storylet">${inGiro.map((st) => rigaStorylet(x, st)).join('')}</ul>` : ''}`;
}

function vistaLuogo(x: Contesto, l: TLuogo, storieArea: TStorylet[], riprendi: TStorylet[] = []): string {
  const { s, c } = x;
  // un seguito in sospeso si riprende anche da dentro il luogo
  const storie = [...riprendi, ...storieArea.filter((st) => st.presso === l.id && !riprendi.includes(st))];
  const ripetibili = stanzeVisibili(s, c).filter((st) => st.presso === l.id);
  const botteghe = negoziAperti(x, l.negozi).map((n) => bottega(x, n)).join('');
  // la prossima storia della serie del luogo, se non è ancora aperta: si vede chiusa, con quello che manca
  const inAttesa = serieDi(c).serie.filter((z) => z.tipo === 'luogo').map((z) => {
    const id = prossimaTappa(s, z);
    const st = id ? trova(c, id) : undefined;
    if (!st || st.presso !== l.id || storie.includes(st)) return '';
    const mancanti = requisitiMancanti(s, st.requisiti, c);
    if (!mancanti.length) return '';
    return rigaChiusa(x, st, z, mancanti);
  }).join('');
  const vuoto = !storie.length && !ripetibili.length && !botteghe && !inAttesa;
  return `<article class="scena pagina-luogo">
    <button type="button" class="bottone indietro in-cima" data-az="esci-luogo">← ${h(areaDi(x).nome)}</button>
    <header class="scena-testa">
      ${tavola(l.immagine, { classe: 'ritratto grande', taglio: 'l' })}
      <div class="scena-titoli">
        <div class="testa">${etichetta('Luogo', 'velo')}<span class="luogo">${h(areaDi(x).nome)}</span></div>
        <h2>${h(l.nome)}</h2>
        ${prosa(l.testo)}
      </div>
    </header>
    ${occasioni(x)}
    ${storie.length || inAttesa ? `<h2 class="titolo-sezione">La tua storia</h2><ul class="elenco-storylet">${storie.map((st) => rigaStorylet(x, st)).join('')}${inAttesa}</ul>` : ''}
    ${ripetibili.length ? `<h2 class="titolo-sezione">Cose da fare</h2><ul class="elenco-storylet">${ripetibili.map((st) => rigaStorylet(x, st)).join('')}</ul>` : ''}
    ${botteghe}
    ${vuoto ? '<p class="vuoto">Per ora qui non c\'è niente per te. Torna più avanti.</p>' : ''}
  </article>`;
}

function testataSpedizione(x: Contesto): string {
  const { s, c } = x;
  const a = areaAttuale(s, c)!;
  const sped = a.spedizione!;
  const p = profondita(s, a.id);
  const ritorno = c.aree.find((z) => z.id === sped.ritorno)?.nome ?? sped.ritorno;
  // la barra serve solo se qualcosa qui dipende dalla profondità (nel pozzo dell'Ira, per esempio, no)
  const misura = storyletDisponibili(s, c).some((st) => st.area === a.id && st.requisiti.some((r) => r.startsWith(`profondita.${a.id}`)));
  return `<section class="spedizione">
    ${misura ? `<div class="profondita">
      <span class="etichetta">Profondità</span>
      <span class="barra pe${p >= sped.soglia ? ' piena' : ''}"><i style="width:${Math.min(100, (p / sped.soglia) * 100).toFixed(1)}%"></i></span>
      <b>${mezzi(p)} / ${sped.soglia}</b>
    </div>` : ''}
    <button type="button" class="bottone" data-az="ritirata" title="Si perde la profondità raggiunta">Torna verso ${h(ritorno)}</button>
  </section>`;
}

function occasioni(x: Contesto): string {
  const { s, c } = x;
  const mano = s.mano.map((id) => trova(c, id)).filter((st): st is TStorylet => !!st);
  const puoPescare = s.coda > 0 && s.mano.length < MANO_MAX;
  const prossima = msAllaProssimaCarta(s, x.ora);
  const slot = Array.from({ length: MANO_MAX }, (_, i) => {
    const st = mano[i];
    if (!st) return `<li class="carta vuota" aria-hidden="true"><span></span></li>`;
    const altrove = st.area !== s.area && !(st.area === OVUNQUE && !areaChiusa(areaAttuale(s, c)));
    const dove = altrove ? (c.aree.find((a) => a.id === st.area)?.nome ?? 'in città') : '';
    return `<li class="carta${altrove ? ' altrove' : ''}">
      <button type="button" class="apri-carta" data-az="apri" data-id="${st.id}" aria-label="${h(st.titolo)}" ${altrove ? `disabled title="Si gioca in ${h(dove)}"` : ''}>
        ${tavola(st.immagine, { classe: 'ritratto' })}
        <span class="titolo-carta">${h(st.titolo)}</span>
      </button>
      <button type="button" class="scarta" data-az="scarta" data-id="${st.id}" aria-label="Scarta ${h(st.titolo)}" title="Scarta">×</button>
    </li>`;
  }).join('');
  return `<section class="occasioni" aria-label="Occasioni">
    <button type="button" class="mazzo" data-az="pesca" ${puoPescare ? '' : 'disabled'}>
      <span class="dorso" aria-hidden="true">${ROMBO}</span>
      <span class="conteggio"><b>${s.coda}</b> ${s.coda === 1 ? 'occasione' : 'occasioni'} in attesa</span>
      <span class="timer" data-timer="carta">${prossima === null ? `Mazzo pieno (${CODA_MAX})` : `Un'altra tra ${durata(prossima)}`}</span>
      ${puoPescare ? '<span class="azione">Pesca</span>' : s.mano.length >= MANO_MAX ? '<span class="azione muta">Mano piena</span>' : ''}
    </button>
    <ul class="mano">${slot}</ul>
  </section>`;
}

/** Una riga della scheda Personaggio per una serie: nome, descrizione, tacche e, a serie chiusa, la parola "conclusa". */
function rigaPista(s: Stato, c: TContenuti, id: string, nomeSerie: string, descrizione?: string, immagine?: string): string {
  const z = serieDi(c).serie.find((x) => x.id === id || x.quality === id);
  const fatti = z ? avanzamento(s, z) : Math.floor(s.quality[id] ?? 0);
  const speso = z ? s.tempo?.serie[z.id] ?? 0 : 0;
  const tempo = speso >= 60000 ? `<span class="tempo-serie" title="Tempo di gioco in questa storia">${h(tempoGiocato(speso))}</span>` : '';
  const segno = z ? `<span class="serie">${tacche(fatti, z.massimo)}${fatti >= z.massimo ? '<span class="etichetta velo">Conclusa</span>' : ''}${tempo}</span>` : `<span class="etichetta velo">Capitolo ${mezzi(fatti)}</span>`;
  const prossima = z?.tipo === 'luogo' ? prossimaTappa(s, z) : undefined;
  const dopo = prossima ? `<p>Prossima storia: «${h(trova(c, prossima)?.titolo ?? '')}».</p>` : '';
  return `<li class="${z && fatti >= z.massimo ? 'conclusa' : ''}">${tavola(immagine, { classe: 'icona' })}<div><b>${h(nomeSerie)}</b>${descrizione ? `<p>${h(descrizione)}</p>` : ''}${dopo}</div>${segno}</li>`;
}

/** Le tacche di una serie: piene fino a dove sei, quella del passo in corso accesa. */
export function tacche(fatti: number, massimo: number, ora?: number): string {
  const segni = Array.from({ length: massimo }, (_, i) => `<i class="${i < fatti ? 'piena' : ''}${i === ora ? ' ora' : ''}"></i>`).join('');
  return `<span class="tacche" role="img" aria-label="${fatti} passi su ${massimo}">${segni}</span><span class="conta-serie">${fatti}/${massimo}</span>`;
}

/** L'etichetta della serie di uno storylet (la storia lunga a cui appartiene e a che punto sei), o quella del tipo. */
function testaStorylet(x: Pick<Contesto, 's' | 'c'>, st: TStorylet, tipo: string): string {
  const serie: Serie | undefined = st.ripetibile ? undefined : serieDi(x.c).diStorylet.get(st.id);
  const luogo = st.luogo ? `<span class="luogo">${h(st.luogo)}</span>` : '';
  if (!serie) return `${etichetta(tipo, st.ripetibile ? 'dim' : 'velo')}${luogo}`;
  const fatti = avanzamento(x.s, serie);
  return `<span class="serie"><span class="nome-serie">${h(serie.nome)}</span>${tacche(fatti, serie.massimo, fatti < serie.massimo ? fatti : undefined)}</span>${luogo}`;
}

/** La prossima storia di un luogo, ancora chiusa: titolo, serie e che cosa manca per aprirla. */
function rigaChiusa(x: Pick<Contesto, 's' | 'c'>, st: TStorylet, z: Serie, mancanti: string[]): string {
  const { s, c } = x;
  const cosa = mancanti.map((r) => {
    const { chiave } = parseRequisito(r);
    const q = c.quality.find((y) => y.id === chiave);
    if (q?.categoria === 'pista') return `Più avanti in «${q.nome}».`;
    if (q?.categoria === 'reputazione') return `${requisitoLeggibile(r, s, c)} Sale con le cose da fare qui.`;
    return requisitoLeggibile(r, s, c);
  });
  const fatti = avanzamento(s, z);
  return `<li class="storylet-riga storia chiusa">
    ${tavola(st.immagine, { classe: 'ritratto' })}
    <div class="corpo">
      <div class="testa"><span class="serie"><span class="nome-serie">${h(z.nome)}</span>${tacche(fatti, z.massimo, fatti)}</span></div>
      <h3>${h(st.titolo)}</h3>
      <ul class="mancanti">${cosa.map((t) => `<li>${h(t)}</li>`).join('')}</ul>
    </div>
    <span class="bottone vai chiuso" aria-hidden="true">Chiusa</span>
  </li>`;
}

function rigaStorylet(x: Pick<Contesto, 's' | 'c'>, st: TStorylet, stanza = false): string {
  const tipo = stanza ? 'Stanza' : tipoStorylet(st);
  return `<li class="storylet-riga ${st.ripetibile ? 'ripetibile' : 'storia'}">
    ${tavola(st.immagine, { classe: 'ritratto' })}
    <div class="corpo">
      <div class="testa">${testaStorylet(x, st, tipo)}</div>
      <h3>${h(st.titolo)}</h3>
      <p class="sommario">${h(st.sommario ?? primaFrase(st.testo))}</p>
    </div>
    <button type="button" class="bottone vai" data-az="apri" data-id="${st.id}">Vai</button>
  </li>`;
}

function vistaStorylet(x: Contesto, id: string): string {
  const { s, c } = x;
  const st = trova(c, id);
  if (!st) return vistaArea(x);
  const visibili = opzioniVisibili(s, st, c);
  const rami = st.opzioni.map((o, i) => {
    if (!visibili.includes(i)) return '';
    const a = anteprima(s, o, c);
    let sfida = '';
    if (a.prova) {
      const attr = o.prova!.attributo;
      const liv = a.prova.pool - s.attributi[attr];
      sfida = `<div class="sfida">
        <span class="icona-sfida" aria-hidden="true">${dado(Math.max(1, Math.min(6, a.prova.richiesti + 2)))}</span>
        <div><p><b>Prova ${h(a.prova.difficolta.toLowerCase())}.</b> ${h(NOMI[attr]!)} ${s.attributi[attr]} e ${h(NOMI[a.prova.abilita] ?? a.prova.abilita)} ${liv}: ${a.prova.pool} dadi, ${a.prova.richiesti === 1 ? 'serve 1 successo' : `servono ${a.prova.richiesti} successi`}.</p>
        <p class="probabilita">${percentuale(a.prova.probabilita)} di riuscita</p></div>
      </div>`;
    }
    if (a.combattimento) {
      const sc = c.scontri.find((z) => z.id === o.combattimento)!;
      const nemici = sc.nemici.map((n) => c.nemici.find((z) => z.id === n)!.nome).join(' e ');
      sfida = `<div class="sfida combattimento">
        <span class="icona-sfida spade" aria-hidden="true">⚔</span>
        <div><p><b>Combattimento ${h(a.combattimento.etichetta.toLowerCase())}.</b> Contro ${h(nemici)}. Si combatte a round: attacchi, intimidisci o ti curi.</p>
        <p class="probabilita">${percentuale(a.combattimento.probabilita)} di vittoria</p></div>
      </div>`;
    }
    const mancanti = a.mancanti.map((r) => `<li>${h(requisitoLeggibile(r, s, c))}</li>`).join('');
    const costo = a.costo === 0 ? 'Gratis' : `${a.costo} ${a.costo === 1 ? 'rintocco' : 'rintocchi'}`;
    const inc = a.incantesimo;
    const magia = inc ? `<p class="nota-incantesimo">${etichetta(`Incantesimo · ${inc.nome}`, 'precursore')}
      <span>Senza successi c'è la Dissonanza (+½ Tormento).${inc.prezzo ? ` La formula costa ${Object.entries(inc.prezzo).map(([k, v]) => `${mezzi(v)} ${nome(k, c)}`).join(' e ')} a ogni lancio.` : ''}</span></p>` : '';
    return `<li class="ramo${a.disponibile ? '' : ' chiuso'}">
      ${tavola(o.immagine ?? st.immagine, { classe: 'ritratto piccolo' })}
      <div class="corpo">
        <h3>${h(o.testo)}</h3>
        ${o.descrizione ? `<p class="descrizione">${h(o.descrizione)}</p>` : ''}
        ${magia}
        ${sfida}
        ${mancanti ? `<ul class="mancanti">${mancanti}</ul>` : ''}
        ${a.motivo ? `<p class="mancanti">${h(a.motivo)}</p>` : ''}
      </div>
      <div class="azione-ramo">
        <button type="button" class="bottone vai" data-az="scegli" data-id="${st.id}" data-i="${i}" ${a.disponibile ? '' : 'disabled'}>Vai</button>
        <span class="costo">${costo}</span>
      </div>
    </li>`;
  }).join('');
  return `<article class="scena">
    <header class="scena-testa">
      ${tavola(st.immagine, { classe: 'ritratto grande', taglio: 'l' })}
      <div class="scena-titoli">
        <div class="testa">${testaStorylet(x, st, tipoStorylet(st))}</div>
        <h2>${h(st.titolo)}</h2>
        ${ascolta(x, st.id)}
        ${prosa(st.testo)}
      </div>
    </header>
    <ul class="rami">${rami}</ul>
    ${st.mostra && visibili.length === 0 ? `<div class="azioni-fondo"><button type="button" class="bottone primario" data-az="fine-mutazioni">Prosegui</button></div>` : ''}
    ${st.tipo === 'crisi' || st.tipo === 'seguito' || st.tipo === 'prologo' ? '' : '<button type="button" class="bottone indietro" data-az="area">← Non ora</button>'}
  </article>`;
}

function vistaRisultato(x: Contesto, id: string, r: Risultato): string {
  const { s, c } = x;
  const st = trova(c, id);
  const righe: string[] = [];
  if (r.tiro) {
    righe.push(`<li class="esito-riga tiro">
      <span class="icona-riga dadi">${r.tiro.facce.map(dado).join('')}</span>
      <p>${r.riuscito ? 'Ce l\'hai fatta' : 'Non è bastato'}: ${r.tiro.successi} ${r.tiro.successi === 1 ? 'successo' : 'successi'} su ${r.tiro.richiesti} richiesti con ${h(NOMI[r.tiro.abilita] ?? r.tiro.abilita)} (${percentuale(r.tiro.probabilita)}).</p>
    </li>`);
  } else if (r.riuscito !== undefined) {
    righe.push(`<li class="esito-riga"><span class="icona-riga simbolo">⚔</span><p>${r.riuscito ? 'Hai vinto lo scontro.' : 'Hai perso lo scontro.'}</p></li>`);
  }
  for (const v of r.variazioni) {
    const q = c.quality.find((z) => z.id === v.chiave);
    const d = v.dopo - v.prima;
    const nm = h(nome(v.chiave, c));
    let frase: string; let barra = '';
    if (q?.categoria === 'negativa') {
      frase = d > 0 ? `${nm} sale a ${mezzi(v.dopo)}.` : `${nm} scende a ${mezzi(v.dopo)}.`;
      barra = barraVariazione(v.prima, v.dopo, MAX_NEGATIVA, 'neg');
    } else if (q?.categoria === 'pista') {
      frase = `La storia <em>${nm}</em> va avanti.`;
      barra = barraVariazione(v.prima, v.dopo, 5, 'pista');
    } else if (q?.categoria === 'reputazione') {
      frase = `${nm}: reputazione ${segno(d)}, ora ${segno(v.dopo)}.`;
    } else if (q?.categoria === 'accesso') {
      frase = d > 0 ? `Ora hai: ${nm}.` : `Hai perso: ${nm}.`;
    } else {
      frase = d > 0 ? `Hai ottenuto ${mezzi(d)} × ${nm} (ora ${mezzi(v.dopo)}).` : `Hai perso ${mezzi(-d)} × ${nm} (ora ${mezzi(v.dopo)}).`;
    }
    const buono = q?.categoria === 'negativa' ? d < 0 : d > 0;
    righe.push(`<li class="esito-riga ${buono ? 'bene' : 'male'}">
      ${tavola(q?.immagine ?? (v.chiave.startsWith('profondita.') ? 'icone/stairs' : 'icone/scroll-quill'), { classe: 'icona icona-riga' })}
      <div><p>${frase}</p>${barra}</div>
    </li>`);
  }
  for (const cr of r.crescite) {
    const chiave = cr.chiave;
    const nm = h(NOMI[chiave] ?? chiave);
    const liv = chiave in s.attributi ? s.attributi[chiave as 'fisico'] : (s.abilita[chiave] ?? 0);
    const pe = Math.round(cr.pe * 4) / 4;
    const soglia = SOGLIE_PE[liv] ?? 0;
    const ora = s.pe[chiave] ?? 0;
    const testo = cr.nuovoLivello
      ? `<b>${nm} sale a ${cr.nuovoLivello}!</b>`
      : soglia ? `${nm}: +${mezzi(pe)} PE (${mezzi(Math.round(ora * 4) / 4)} su ${soglia} per il livello ${liv + 1}).` : `${nm}: livello massimo.`;
    righe.push(`<li class="esito-riga crescita${cr.nuovoLivello ? ' livello' : ''}">
      <span class="icona-riga simbolo">✦</span>
      <div><p>${testo}</p>
      ${soglia ? barraVariazione(cr.nuovoLivello ? 0 : Math.max(0, ora - cr.pe), ora, soglia, 'pe', [String(liv), String(liv + 1)]) : ''}</div>
    </li>`);
  }
  if (r.dissonanza) righe.push(`<li class="esito-riga male"><span class="icona-riga simbolo">⟡</span><p>Nessun successo, e il Mana ti torna indietro (Dissonanza).</p></li>`);
  if (r.conclusa) righe.push(`<li class="esito-riga bene"><span class="icona-riga simbolo">✦</span><p>Hai concluso «${h(r.conclusa)}».</p></li>`);
  if (r.guasto) righe.push(`<li class="esito-riga male"><span class="icona-riga simbolo">⚙</span><p>Nessun successo, e il reperto si è guastato.</p></li>`);
  const puoiSecondaScelta = !!x.vista && x.vista.tipo === 'risultato' && !!x.vista.prima && x.vista.indice !== undefined && secondaSceltaDisponibile(s, r, c);
  const puoiCorreggere = !!x.vista && x.vista.tipo === 'risultato' && x.vista.prima && x.vista.indice !== undefined && correggibile(s, r);
  const ancora = st && (st.tipo === 'carta' ? s.mano.includes(st.id) : storyletDisponibili(s, c).some((z) => z.id === st.id));
  const segue = r.segue ? trova(c, r.segue) : undefined;
  const titolo = r.titolo ?? (r.riuscito === undefined ? st?.titolo ?? '' : r.riuscito ? 'Riuscito' : 'Fallito');
  const annotato = nelDiario(s, { storylet: id, titolo, testo: r.testo });
  return `<article class="scena risultato">
    <header class="scena-testa">
      ${tavola(r.immagine ?? st?.immagine, { classe: 'ritratto grande', taglio: 'l' })}
      <div class="scena-titoli">
        <div class="testa">${r.riuscito === undefined ? etichetta(st?.titolo ?? '', 'dim') : etichetta(r.riuscito ? 'Successo' : 'Fallimento', r.riuscito ? 'precursore' : 'mana')}${r.corretto ? etichetta('Corretto', 'velo') : ''}</div>
        <h2>${h(titolo)}</h2>
        ${st && x.vista.tipo === 'risultato' && x.vista.indice !== undefined ? ascolta(x, idVoceEsito(st, x.vista.indice, r)) : ''}
        ${prosa(r.testo)}
      </div>
    </header>
    ${righe.length ? `<ul class="esiti">${righe.join('')}</ul>` : ''}
    <div class="azioni-fondo">
      <button type="button" class="bottone diario-btn" data-az="annota" ${annotato ? 'disabled' : ''} title="Conserva questa pagina per rileggerla">${annotato ? 'Nel diario' : 'Annota nel diario'}</button>
      ${puoiSecondaScelta ? `<button type="button" class="bottone" data-az="seconda-scelta" title="Lo specchio ti lascia ripetere la prova; se riesce, +½ Tormento">Seconda scelta</button>` : ''}
      ${puoiCorreggere ? `<button type="button" class="bottone" data-az="correggi" title="Un rintocco e una prova Media di Magia; costa ½ Tormento">Correzione</button>` : ''}
      ${ancora ? `<button type="button" class="bottone" data-az="apri" data-id="${st!.id}">Riprova</button>` : ''}
      ${segue ? `<button type="button" class="bottone primario" data-az="apri" data-id="${segue.id}">Prosegui</button>` : ''}
      <button type="button" class="bottone${segue ? '' : ' primario'}" data-az="area">Torna: ${h(areaDi(x).nome)}</button>
    </div>
  </article>`;
}

function barraPF(p: { pf: number; pfMax: number }): string {
  const q = p.pf / p.pfMax;
  return `<span class="barra pf${q < 0.4 ? ' bassa' : ''}"><i style="width:${(q * 100).toFixed(1)}%"></i></span><b class="pf-num">${p.pf}/${p.pfMax} PF</b>`;
}

function barraEnergia(p: { energia: number; energiaMax: number }): string {
  const q = p.energiaMax ? Math.min(1, p.energia / p.energiaMax) : 0;
  return `<span class="barra energia"><i style="width:${(q * 100).toFixed(1)}%"></i></span><b class="pf-num">${p.energia}/${p.energiaMax} Energia</b>`;
}

function chipEffetti(cb: Combattente, c: TContenuti): string {
  const nomi = (cb.effetti ?? []).map((e) => {
    const fonte = e.fonte === 'intimidire' ? 'Intimidito' : e.fonte === 'inceppamento' ? 'Arma inceppata'
      : c.incantesimi.find((i) => i.id === e.fonte)?.nome ?? c.oggetti.find((o) => o.id === e.fonte)?.nome ?? e.fonte;
    return `<span class="chip ${e.valore >= 0 && e.tipo !== 'salta' ? 'buono' : 'cattivo'}" title="${h(descriviModifica(e))}">${h(fonte)}${e.tipo === 'salta' ? '' : ` · ${e.round}`}</span>`;
  });
  for (const v of cb.veleni ?? []) nomi.push(`<span class="chip cattivo">Avvelenato · ${v.round}</span>`);
  return nomi.length ? `<div class="chips">${nomi.join('')}</div>` : '';
}

function vistaCombattimento(x: Contesto, cs: StatoCombattimento): string {
  const { c } = x;
  const pg = cs.combattenti.find((z) => z.lato === 'pg')!;
  const nemici = cs.combattenti.filter((z) => z.lato === 'nemico');
  const vivi = nemici.filter(inPiedi);
  const bersaglio = vivi.find((n) => n.id === x.bersaglio) ?? vivi[0];
  const usatiTot = Object.values(cs.usati).reduce((a, b) => a + b, 0);
  const nemicoImg = (id: string) => c.nemici.find((n) => id.startsWith(n.id + '#'))?.immagine;
  const righe = nemici.map((n) => {
    const attivo = inPiedi(n) && !cs.finito;
    const scelto = attivo && n.id === bersaglio?.id;
    const stato = n.fuggito ? 'Fuggito' : n.pf === 0 ? 'A terra' : scelto ? 'Bersaglio' : '';
    const contenuto = `${tavola(nemicoImg(n.id), { classe: 'ritratto piccolo' })}
      <div class="corpo">
        <div class="testa"><h3>${h(n.nome)}</h3>${stato ? etichetta(stato, scelto ? 'mana' : 'dim') : ''}</div>
        <div class="pf-riga">${barraPF(n)}</div>
        ${chipEffetti(n, c)}
      </div>`;
    return attivo
      ? `<li><button type="button" class="combattente${scelto ? ' scelto' : ''}" data-az="bersaglio" data-id="${n.id}" aria-pressed="${scelto}">${contenuto}</button></li>`
      : `<li><div class="combattente fuori">${contenuto}</div></li>`;
  }).join('');

  const incantesimi = (cs.incantesimi ?? []).map((inc) => {
    const aSe = inc.tipo === 'potenziamento' || inc.tipo === 'cura';
    const motivo = perchéNonLanciabile(cs, inc, aSe ? undefined : bersaglio);
    const proibito = inc.prezzo ? ` · ${Object.entries(inc.prezzo).map(([k, v]) => `+${mezzi(v)} ${nome(k, c)}`).join(', ')}` : '';
    return `<button type="button" class="bottone incantesimo" data-az="lancia" data-id="${inc.id}" ${motivo ? `disabled title="${h(motivo)}"` : `title="${h(inc.descrizione)}"`}>
      ${h(inc.nome)} <small>${inc.livello} En${h(proibito)}</small></button>`;
  }).join('');
  const reperti = (cs.reperti ?? []).map((r) => `<button type="button" class="bottone incantesimo" data-az="reperto" data-id="${r.id}" ${r.cariche > 0 ? '' : 'disabled'}>
      ${h(r.nome)} <small>${r.cariche} ${r.cariche === 1 ? 'carica' : 'cariche'}</small></button>`).join('');
  const consumabili = Object.entries(CONSUMABILI).map(([k, e]) => {
    const rimasti = (cs.consumabili[k] ?? 0) - (cs.usati[k] ?? 0);
    if ((cs.consumabili[k] ?? 0) === 0) return '';
    const ok = rimasti > 0 && usatiTot < MAX_CONSUMABILI_IN_COMBATTIMENTO;
    const cosa = e.pf ? `+${e.pf} PF` : `+${e.energia} Energia`;
    return `<button type="button" class="bottone" data-az="cura" data-id="${k}" ${ok ? '' : 'disabled'}>${h(nome(k, c))} ${cosa} <small>(${rimasti})</small></button>`;
  }).join('');

  const azioni = cs.finito
    ? `<p class="verdetto ${cs.vinto ? 'vinto' : 'perso'}">${cs.vinto ? 'Vittoria' : 'Sconfitta'}</p>
       <div class="azioni-fondo"><button type="button" class="bottone primario" data-az="concludi">Prosegui</button></div>`
    : `<div class="barra-azioni">
        <p class="etichetta">Contro ${h(bersaglio?.nome ?? '')}</p>
        <div class="gruppo">
          <button type="button" class="bottone primario" data-az="attacca">Attacca</button>
          <button type="button" class="bottone" data-az="intimidisci">Intimidisci</button>
        </div>
        ${incantesimi ? `<p class="etichetta">Incantesimi</p><div class="gruppo">${incantesimi}</div>` : ''}
        ${reperti ? `<p class="etichetta">Reperti · Mentale + Tecnologia, con zero successi si guastano</p><div class="gruppo">${reperti}</div>` : ''}
        ${consumabili ? `<p class="etichetta">Consumabili · ${usatiTot}/${MAX_CONSUMABILI_IN_COMBATTIMENTO}</p><div class="gruppo">${consumabili}</div>` : ''}
      </div>`;

  return `<article class="scena combattimento">
    <div class="testa">${etichetta(`Combattimento · round ${Math.min(cs.round, 99)}`, 'mana')}</div>
    <h2>${h(cs.nome)}</h2>
    <ul class="combattenti">
      <li><div class="combattente pg">
        ${tavola(x.c.origini.find((o) => o.id === x.s.origine)?.immagine, { classe: 'ritratto piccolo' })}
        <div class="corpo">
          <div class="testa"><h3>${h(pg.nome)}</h3>${etichetta('Tu', 'velo')}</div>
          <div class="pf-riga">${barraPF(pg)}</div>
          ${pg.energiaMax > 0 && (cs.incantesimi ?? []).length ? `<div class="pf-riga">${barraEnergia(pg)}</div>` : ''}
          ${chipEffetti(pg, c)}
        </div>
      </div></li>
      ${righe}
    </ul>
    ${!cs.finito && vivi.length > 1 ? '<p class="suggerimento">Tocca un nemico per sceglierlo come bersaglio.</p>' : ''}
    ${azioni}
    <ol class="registro" aria-live="polite">${cs.log.slice(-12).map((l) => `<li>${h(l)}</li>`).join('')}</ol>
  </article>`;
}

// ================================================================ PERSONAGGIO

export function personaggio(x: Contesto): string {
  const { s, c } = x;
  const origine = c.origini.find((o) => o.id === s.origine);
  const colonne = ATTRIBUTI.map((a) => {
    const abil = ABILITA[a].map((k) => `<li class="${(s.abilita[k] ?? 0) === 0 ? 'zero' : ''}">
        <div class="riga-stat"><span>${h(NOMI[k]!)}</span>${pallini(s.abilita[k] ?? 0)}</div>${barraPE(s, k)}</li>`).join('');
    return `<section class="colonna-attributo">
      <header><h3>${NOMI[a]}</h3>${pallini(s.attributi[a])}</header>${barraPE(s, a)}
      <ul>${abil}</ul>
    </section>`;
  }).join('');
  const negative = NEGATIVE.map((k) => {
    const q = c.quality.find((z) => z.id === k);
    const v = s.quality[k] ?? 0;
    return `<li><div class="riga-stat"><span>${h(q?.nome ?? k)}</span><b>${mezzi(v)} / ${MAX_NEGATIVA}</b></div>${barraNegativa(v)}<p>${h(q?.descrizione ?? '')}</p></li>`;
  }).join('');
  // le reputazioni dei luoghi (famiglia Luoghi) compaiono solo quando ne hai una
  const reputazioni = c.quality.filter((q) => q.categoria === 'reputazione' && (q.famiglia !== 'Luoghi' || (s.quality[q.id] ?? 0) !== 0)).map((q) => {
    const v = s.quality[q.id] ?? 0;
    return `<li class="${v === 0 ? 'zero' : v < 0 ? 'neg' : 'pos'}">${tavola(q.immagine, { classe: 'icona' })}<span>${h(q.nome)}</span><b>${segno(v)}</b></li>`;
  }).join('');
  const piste = c.quality.filter((q) => q.categoria === 'pista' && (s.quality[q.id] ?? 0) > 0);
  const luoghiAvviati = serieDi(c).serie.filter((z) => z.tipo === 'luogo' && avanzamento(s, z) > 0);
  const mutazioni = mutazioniDi(s, c);
  const conosciuti = incantesimiConosciuti(s, c);
  const rep = repertorio(s, c).map((i) => i.id);
  const limite = limiteRepertorio(s);
  const energia = s.attributi.mentale + (s.abilita['magia'] ?? 0);
  const incantesimi = conosciuti.map((i) => {
    const daCombattimento = i.uso.includes('combattimento');
    const dentro = rep.includes(i.id);
    const uso = i.uso.map((u) => (u === 'combattimento' ? 'Combattimento' : 'Storie')).join(' · ');
    return `<li class="incantesimo-riga${dentro ? ' nel-repertorio' : ''}">
      ${tavola(i.immagine, { classe: 'icona' })}
      <div><div class="testa"><b>${h(i.nome)}</b>${etichetta(`${NOMI_TRADIZIONI[i.tradizione]} · livello ${i.livello} · ${uso}`, i.tradizione === 'precuriane' ? 'mana' : 'dim')}</div>
      <p>${h(i.descrizione)}</p></div>
      ${daCombattimento ? `<button type="button" class="bottone piccolo${dentro ? ' primario' : ''}" data-az="repertorio" data-id="${i.id}" aria-pressed="${dentro}" ${!dentro && rep.length >= limite ? 'disabled' : ''}>${dentro ? 'Nel repertorio' : 'Porta in combattimento'}</button>` : '<span></span>'}
    </li>`;
  }).join('');
  return `<article class="scheda-pg">
    <header class="scena-testa">
      ${tavola(origine?.immagine, { classe: 'ritratto grande' })}
      <div class="scena-titoli">
        ${etichetta(origine?.nome ?? '', 'velo')}
        <h2>${h(s.nome)}</h2>
        ${origine ? prosa(origine.testo) : ''}
        <p class="equip-riga"><span class="etichetta">Crescita</span> Ogni prova dà PE all'abilità usata e un quarto all'attributo. Più la prova è incerta, più insegna.</p>
        <p class="equip-riga tempo-di-gioco"><span class="etichetta">Tempo di gioco</span> ${h(tempoGiocato(s.tempo?.totale ?? 0))}</p>
      </div>
    </header>
    <h2 class="titolo-sezione">Attributi e abilità</h2>
    <div class="attributi-griglia">${colonne}</div>
    ${piste.length ? `<h2 class="titolo-sezione">Le tue storie</h2><ul class="elenco-piste">${piste.map((q) => rigaPista(s, c, q.id, q.nome, q.descrizione, q.immagine)).join('')}</ul>` : ''}
    ${luoghiAvviati.length ? `<h2 class="titolo-sezione">Nei luoghi della città</h2><ul class="elenco-piste">${luoghiAvviati.map((z) => rigaPista(s, c, z.id, z.nome, undefined, z.immagine)).join('')}</ul>` : ''}
    <h2 class="titolo-sezione">Incantesimi ${conosciuti.length ? `<small>repertorio ${rep.length}/${limite} · Energia ${energia}</small>` : ''}</h2>
    ${conosciuti.length ? `<ul class="incantesimi">${incantesimi}</ul>` : '<p class="vuoto">Non conosci ancora nessun incantesimo. Alla Locanda di Ilka, Besk Dravec insegna le basi a chi vuole imparare.</p>'}
    ${mutazioni.length ? `<h2 class="titolo-sezione">Mutazioni</h2><ul class="incantesimi">${mutazioni.map((m) => `<li class="incantesimo-riga">
      ${tavola(m.immagine, { classe: 'icona' })}
      <div><div class="testa"><b>${h(m.nome)}</b></div><p>${h(m.descrizione)}</p>
      <div class="chips"><span class="chip buono">${h(m.vantaggio)}</span><span class="chip cattivo">${h(m.svantaggio)}</span></div></div><span></span>
    </li>`).join('')}</ul>` : ''}
    <h2 class="titolo-sezione">Statistiche negative</h2>
    <ul class="negative-dettaglio">${negative}</ul>
    <h2 class="titolo-sezione">Reputazione</h2>
    <ul class="reputazioni">${reputazioni}</ul>
  </article>`;
}

// ================================================================ AVERI

/** Il congegno sul banco di Oda Krell (contenuti/superficie/reperti.yaml): le parti montate e i tre punteggi. */
function banco(s: Stato, c: Contesto['c']): string {
  const montate = s.quality['banco.parti'] ?? 0;
  if (montate <= 0) return '';
  const famiglie = ['involucro', 'camera', 'impugnatura', 'nucleo'] as const;
  const parti = famiglie.map((f) => {
    const g = s.quality[`banco.${f}`] ?? 0;
    const q = g > 0 ? c.quality.find((z) => z.id === `parte.${f}-${g}`) : undefined;
    return `<li class="oggetto${g ? '' : ' assente'}">${tavola(q?.immagine ?? 'icone/cube', { classe: 'icona' })}<span>${h(q?.nome ?? `${f[0]!.toUpperCase()}${f.slice(1)}: manca`)}</span><b>${g ? `grado ${g}` : '—'}</b></li>`;
  }).join('');
  const punti = ([['potenza', 'Potenza'], ['stabilita', 'Stabilità'], ['stranezza', 'Stranezza']] as const)
    .map(([k, n]) => `<li class="oggetto"><span>${n}</span><b>${mezzi(s.quality[`banco.${k}`] ?? 0)}</b></li>`).join('');
  return `<h2 class="titolo-sezione">Sul banco di Oda <small>${montate >= 4 ? 'il congegno è finito e si può vendere' : `${montate} parti su 4`}</small></h2>
    <ul class="oggetti">${parti}${punti}</ul>`;
}

export function averi(x: Contesto): string {
  const { s, c } = x;
  const nomeSlot: Record<string, string> = { arma: 'Arma', armatura: 'Armatura', scudo: 'Scudo', accessorio: 'Accessorio' };
  const riga = (id: string, azioni: string, etich?: string) => {
    const d = descriviOggetto(id, c);
    return `<li class="slot">
      ${tavola(d.immagine, { classe: 'ritratto piccolo' })}
      <div>${etich ? `<span class="etichetta">${h(etich)}</span>` : ''}<b>${h(d.nome)}</b>
        <small>${h(d.dettagli)}</small>
        ${d.difetti.length ? `<span class="chips">${d.difetti.map((x) => `<span class="chip cattivo">${h(x)}</span>`).join('')}</span>` : ''}
        ${azioni ? `<span class="azioni-oggetto">${azioni}</span>` : ''}
      </div></li>`;
  };
  const vuoto = (nome: string) => `<li class="slot vuoto-slot">${tavola(undefined, { classe: 'ritratto piccolo' })}<div><span class="etichetta">${nome}</span><b>Niente</b></div></li>`;
  const togli = (id: string, legata = false) => legata ? '' : `<button type="button" class="bottone piccolo" data-az="togli" data-id="${id}">Togli</button>`;
  const slots = [
    s.arma && s.arma !== NIENTE_ARMA ? riga(s.arma, togli(s.arma, oggetto(c, s.arma)?.difetti.includes('legata')), 'Arma') : riga(NIENTE_ARMA, '', 'Arma'),
    s.armatura && s.armatura !== NIENTE_ARMATURA ? riga(s.armatura, togli(s.armatura), 'Armatura') : riga(NIENTE_ARMATURA, '', 'Armatura'),
    s.scudo ? riga(s.scudo, togli(s.scudo), 'Scudo') : vuoto('Scudo'),
    ...[0, 1].map((k) => (s.accessori ?? [])[k] ? riga(s.accessori[k]!, togli(s.accessori[k]!), 'Accessorio') : vuoto('Accessorio')),
  ].join('');

  const posseduti = c.oggetti.filter((o) => possiede(s, o.id) && !indossato(s, o.id));
  const sacca = posseduti.filter((o) => o.slot !== 'nessuno').map((o) => {
    const motivo = perchéNonIndossabile(s, c, o.id);
    const n = s.quality[`oggetto.${o.id}`] ?? 0;
    return riga(o.id, `<button type="button" class="bottone piccolo" data-az="indossa" data-id="${o.id}" ${motivo ? `disabled title="${h(motivo)}"` : ''}>Indossa</button>${motivo ? `<small class="motivo">${h(motivo)}</small>` : ''}`,
      `${nomeSlot[o.slot]}${n > 1 ? ` · ${n}` : ''}`);
  }).join('');

  const reperti = c.oggetti.filter((o) => o.reperto && possiede(s, o.id)).map((o) => {
    const decifrato = (s.quality[`decifrato.${o.id}`] ?? 0) >= 1;
    const guasto = (s.quality[`guasto.${o.id}`] ?? 0) >= 1;
    const cariche = s.quality[`cariche.${o.id}`] ?? 0;
    const passivo = o.reperto!.tipo === 'passivo';
    const stato = !decifrato ? 'Da decifrare' : guasto ? 'Guasto' : passivo ? 'Attivo' : `${cariche}/${o.reperto!.cariche} cariche`;
    const azioni = !decifrato
      ? `<button type="button" class="bottone piccolo" data-az="apri" data-id="${o.reperto!.decifra}">Decifra</button>`
      : guasto ? '<small class="motivo">Oda Krell lo ripara, nella sua baracca sulla Superficie Fratturata.</small>'
      : [
          o.usa ? `<button type="button" class="bottone piccolo" data-az="apri" data-id="${o.usa}" ${requisitiSoddisfatti(s, c.storylet.find((z) => z.id === o.usa)?.requisiti, c) ? '' : 'disabled'}>Usa</button>` : '',
          !passivo ? `<button type="button" class="bottone piccolo" data-az="ricarica-reperto" data-id="${o.id}" ${(s.quality['cella'] ?? 0) >= 1 && cariche < o.reperto!.cariche ? '' : 'disabled'}>Ricarica con una cella (${mezzi(s.quality['cella'] ?? 0)})</button>` : '',
        ].join('');
    return `<li class="slot">
      ${tavola(o.immagine, { classe: 'ritratto piccolo' })}
      <div><span class="etichetta">${h(stato)}</span><b>${h(o.nome)}</b><small>${h(o.descrizione ?? '')}</small>
      <span class="azioni-oggetto">${azioni}</span></div></li>`;
  }).join('');

  const usabili = posseduti.filter((o) => o.slot === 'nessuno' && !o.reperto && o.usa).map((o) =>
    riga(o.id, `<button type="button" class="bottone piccolo" data-az="apri" data-id="${o.usa}">Usa</button>`, 'Oggetto')).join('');

  const famiglie = new Map<string, string[]>();
  for (const q of c.quality.filter((z) => z.categoria === 'bene')) {
    const f = q.famiglia ?? 'Altro';
    const v = s.quality[q.id] ?? 0;
    famiglie.set(f, [...(famiglie.get(f) ?? []), `<li class="oggetto${v === 0 ? ' assente' : ''}" title="Vale ${q.valore ?? '?'} ${q.valore === 1 ? 'moneta' : 'monete'}">
      ${tavola(q.immagine, { classe: 'icona' })}<span>${h(q.nome)}</span><b>${mezzi(v)}</b></li>`]);
  }
  const altri = c.quality.filter((q) => (q.categoria === 'consumabile' || q.categoria === 'accesso') && (s.quality[q.id] ?? 0) > 0)
    .map((q) => `<li class="oggetto">${tavola(q.immagine, { classe: 'icona' })}<span>${h(q.nome)}<small>${h(q.descrizione ?? '')}</small></span><b>${q.categoria === 'accesso' ? '✓' : mezzi(s.quality[q.id]!)}</b></li>`).join('');
  return `<article class="averi">
    <h2 class="titolo-sezione primo">Indossato <small>cambiare non costa rintocchi</small></h2>
    <ul class="slot-equip">${slots}</ul>
    ${sacca ? `<h2 class="titolo-sezione">Nella sacca</h2><ul class="slot-equip">${sacca}</ul>` : ''}
    ${reperti ? `<h2 class="titolo-sezione">Reperti dei Precursori</h2><ul class="slot-equip">${reperti}</ul>` : ''}
    ${usabili ? `<h2 class="titolo-sezione">Oggetti</h2><ul class="slot-equip">${usabili}</ul>` : ''}
    ${banco(s, c)}
    <h2 class="titolo-sezione">Con te</h2>
    ${altri ? `<ul class="oggetti">${altri}</ul>` : '<p class="vuoto">Niente di utile in tasca.</p>'}
    ${[...famiglie].map(([f, li]) => `<h2 class="titolo-sezione">${h(f)} <small>scala 5:1</small></h2><ul class="oggetti">${li.join('')}</ul>`).join('')}
  </article>`;
}

// ================================================================ BAZAR

/** Le botteghe di una lista che hanno qualcosa da mostrare adesso. */
function negoziAperti(x: Pick<Contesto, 's' | 'c'>, ids: string[]): TNegozio[] {
  return ids.map((id) => x.c.negozi.find((n) => n.id === id)).filter((n): n is TNegozio => !!n && negozioAperto(x.s, n, x.c));
}

export function bazar(x: Contesto): string {
  const area = areaDi(x);
  const aperti = negoziAperti(x, area.negozi);
  if (!aperti.length) return `<p class="vuoto">In ${h(area.nome)} non ci sono botteghe. Prova altrove in città.</p>`;
  return aperti.map((n) => bottega(x, n)).join('');
}

/** "Con Il Nodo d'Ossidiana 7: 35": il prezzo migliore che si apre più avanti. */
function suggerimentoPrezzo(x: Pick<Contesto, 's' | 'c'>, meglio?: { prezzo: number; requisiti?: string[] }): string {
  if (!meglio) return '';
  const manca = requisitiMancanti(x.s, meglio.requisiti, x.c).map((r) => requisitoLeggibile(r, x.s, x.c)).join(' ');
  return `<small class="prezzo-migliore">Prezzo migliore ${meglio.prezzo}, con ${h(manca)}</small>`;
}

function bottega(x: Contesto, n: TNegozio): string {
  const { s, c } = x;
  const monete = s.quality['monete'] ?? 0;
  const vende = listino(s, n.vende, c, 'vende').map(({ voce: v, meglio }) => {
    let d: { nome: string; dettagli: string; immagine?: string };
    let nota = '';
    if (v.quality.startsWith('oggetto.')) {
      const id = v.quality.slice(8);
      d = descriviOggetto(id, c);
      const n = s.quality[v.quality] ?? 0;
      if (indossato(s, id)) nota = 'In uso';
      else if (n > 0) nota = `Ne hai ${n}`;
    } else { const q = c.quality.find((z) => z.id === v.quality); d = { nome: q?.nome ?? v.quality, dettagli: `${q?.descrizione ?? ''} Ne hai ${mezzi(s.quality[v.quality] ?? 0)}.`, immagine: q?.immagine }; }
    const ok = monete >= v.prezzo;
    return `<li>${tavola(d.immagine, { classe: 'icona' })}<span class="merce"><b>${h(d.nome)}</b><small>${h(d.dettagli)}${nota ? ` · ${h(nota)}` : ''}</small>${suggerimentoPrezzo(x, meglio)}</span>
      <span class="prezzo">${v.prezzo}</span>
      <button type="button" class="bottone" data-az="compra" data-neg="${n.id}" data-id="${v.quality}" ${ok ? '' : 'disabled'}>Compra</button></li>`;
  }).join('');
  const compra = listino(s, vociCompra(n, c), c, 'compra').map(({ voce: v, meglio }) => {
    let d: { nome: string; immagine?: string };
    let nota: string;
    const hai = vendibili(s, v.quality, c);
    if (v.quality.startsWith('oggetto.')) {
      // armi e armature usate: compaiono solo se le possiedi
      const id = v.quality.slice(8);
      if (!(s.quality[v.quality] ?? 0)) return '';
      d = descriviOggetto(id, c);
      nota = indossato(s, id) ? (hai ? `Ne hai ${hai} oltre a quello in uso` : 'In uso, toglilo per venderlo') : `Ne hai ${hai}`;
    } else {
      const q = c.quality.find((z) => z.id === v.quality);
      d = { nome: q?.nome ?? v.quality, immagine: q?.immagine };
      nota = `Ne hai ${mezzi(s.quality[v.quality] ?? 0)}`;
    }
    return `<li class="${hai < 1 ? 'assente' : ''}">${tavola(d.immagine, { classe: 'icona' })}<span class="merce"><b>${h(d.nome)}</b><small>${h(nota)}</small>${suggerimentoPrezzo(x, meglio)}</span>
      <span class="prezzo">${v.prezzo}</span>
      <span class="doppio"><button type="button" class="bottone" data-az="vendi" data-neg="${n.id}" data-id="${v.quality}" data-n="1" ${hai >= 1 ? '' : 'disabled'}>Vendi 1</button><button type="button" class="bottone" data-az="vendi" data-neg="${n.id}" data-id="${v.quality}" data-n="tutti" ${hai >= 2 ? '' : 'disabled'}>Tutti</button></span></li>`;
  }).join('');
  return `<section class="bottega">
    <header class="scena-testa">
      ${tavola(n.immagine, { classe: 'ritratto' })}
      <div class="scena-titoli">${etichetta('Bottega', 'velo')}<h2>${h(n.nome)}</h2>${prosa(n.testo)}</div>
    </header>
    ${vende ? `<h3 class="titolo-sezione">In vendita</h3><ul class="listino">${vende}</ul>` : ''}
    ${compra ? `<h3 class="titolo-sezione">Compra da te</h3><ul class="listino">${compra}</ul>` : ''}
  </section>`;
}

// ================================================================ MAPPA

// ================================================================ DIARIO

export function diario(x: Contesto): string {
  const pagine = [...(x.s.diario ?? [])].reverse();
  const data = (n: number) => new Date(n).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });
  const elenco = pagine.map((p) => `<li class="pagina-diario">
      <details>
        <summary>
          ${tavola(p.immagine, { classe: 'icona' })}
          <span class="pagina-testa">
            <span class="etichetta">${h(p.luogo)} · ${h(data(p.quando))}${p.esito ? ` · ${p.esito === 'successo' ? 'riuscito' : 'fallito'}` : ''}</span>
            <b>${h(p.titolo)}</b>
            <small>${h(p.scena)}</small>
          </span>
        </summary>
        <div class="pagina-corpo">
          ${p.prima ? `<details class="pagina-scena"><summary>La scena</summary>${prosa(p.prima, 'prosa piccola')}</details>` : ''}
          ${prosa(p.testo)}
          <button type="button" class="link" data-az="strappa" data-id="${p.quando}">Togli dal diario</button>
        </div>
      </details>
    </li>`).join('');
  return `<section class="diario">
    <h2 class="titolo-sezione primo">Diario</h2>
    <p class="nota">${pagine.length
      ? `${pagine.length} ${pagine.length === 1 ? 'pagina' : 'pagine'}, dalla più recente. Per aggiungerne una, usa «Annota nel diario» sotto un esito.`
      : 'Il diario è vuoto. Sotto ogni esito trovi «Annota nel diario»: le pagine che conservi restano qui, da rileggere quando vuoi.'}</p>
    ${pagine.length ? `<ol class="pagine">${elenco}</ol>` : ''}
  </section>`;
}

export function mappa(x: Contesto): string {
  const { s, c } = x;
  const qui = c.aree.find((a) => a.id === s.area);
  const avviso = qui?.penalita ? `<p class="avviso">Sei in ${h(qui.nome)}. Da qui si esce solo con le storie, quando il recupero è completo.</p>`
    : qui?.spedizione ? `<p class="avviso">Sei in ${h(qui.nome)}. Per tornare in città usa il pulsante in cima alla pagina della spedizione.</p>` : '';
  return `${avviso}<ul class="mappa">${c.aree.filter((a) => !areaChiusa(a) || a.id === s.area).map((a) => {
    const qui = a.id === s.area;
    const p = puoEntrare(s, a.id, c);
    const info = qui ? 'Sei qui.' : !p.ok ? p.motivo! : p.gabella ? `Gabella: ${p.gabella} monete.` : 'Nessuna gabella.';
    return `<li class="luogo-mappa${qui ? ' qui' : ''}${!qui && !p.ok ? ' chiuso' : ''}">
      ${tavola(a.immagine, { classe: 'paesaggio', taglio: 'l' })}
      <div class="corpo">
        <h3>${h(a.nome)}</h3>
        <p class="sommario-luogo">${h(a.sommario ?? primaFrase(a.testo))}</p>
        <details class="descrizione-luogo"><summary>Leggi la descrizione</summary>${prosa(a.testo, 'prosa piccola')}</details>
        <div class="piede">${etichetta(info, qui ? 'precursore' : p.ok ? 'dim' : 'mana')}
        ${qui ? '' : `<button type="button" class="bottone primario" data-az="vai" data-id="${a.id}" ${p.ok ? '' : 'disabled'}>Vai</button>`}</div>
      </div>
    </li>`;
  }).join('')}</ul>`;
}

// ================================================================ CREAZIONE

const ROMANI = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

export function creazione(c: TContenuti, scelta: string): string {
  const o = c.origini.find((z) => z.id === scelta)!;
  const n = c.origini.indexOf(o);
  const voci = c.origini.map((z, i) => `<li><button type="button" class="origine${z.id === scelta ? ' scelta' : ''}" data-az="origine" data-id="${z.id}" aria-pressed="${z.id === scelta}">
      <span class="num-origine">${ROMANI[i] ?? i + 1}</span>
      ${tavola(z.immagine, { classe: 'miniatura' })}
      <span class="testo-origine">
        <span class="nome-origine">${h(z.nome)}</span>
        <span class="dettaglio">${ATTRIBUTI.map((a) => `${NOMI[a]!.slice(0, 3)} ${z.attributi[a] ?? 1}`).join(' · ')}</span>
      </span>
    </button></li>`).join('');
  const abil = Object.entries(o.abilita).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const beni = Object.entries(o.quality).map(([k, v]) => `${h(nome(k, c))}${k === 'monete' || v !== 1 ? ` ${mezzi(v)}` : ''}`).join(', ');
  const arma = descriviArma(o.arma, c); const armatura = descriviArmatura(o.armatura, c);
  return `
  <header class="topbar">${MARCHIO}</header>
  <main class="creazione">
    <header class="creazione-testa">
      <span class="occhiello"><span class="trattino"></span>Superficie Fratturata · 150 D.C.<span class="trattino"></span></span>
      <h1>Qir-Azel</h1>
      <p>Sono passati tre giorni dal Festival delle Foglie Alate e dalla razzia degli orchi.</p>
    </header>
    <div class="creazione-corpo">
      <section class="scelta-origini" aria-labelledby="passo-origine">
        <h2 class="passo" id="passo-origine"><span>I</span>Da dove vieni</h2>
        <ul class="origini">${voci}</ul>
      </section>
      <section class="dettaglio-origine" aria-live="polite">
        <div class="testa-origine">
          ${tavola(o.immagine, { classe: 'paesaggio', taglio: 'l' })}
          <div class="titoli-origine">
            ${etichetta(`Origine ${ROMANI[n] ?? n + 1} di ${ROMANI[c.origini.length - 1] ?? c.origini.length}`, 'velo')}
            <h2>${h(o.nome)}</h2>
          </div>
        </div>
        <div class="corpo-origine">
          ${prosa(o.testo)}
          <div class="profilo-origine">
            <div>
              <h3 class="etichetta">Attributi</h3>
              <dl class="attributi-origine">${ATTRIBUTI.map((a) => `<div><dt>${NOMI[a]}</dt><dd>${pallini(o.attributi[a] ?? 1)}</dd></div>`).join('')}</dl>
            </div>
            <div>
              <h3 class="etichetta">Abilità</h3>
              <p class="abilita-origine">${abil.map(([k, v]) => `<span>${h(NOMI[k]!)} <b>${v}</b></span>`).join('')}</p>
            </div>
          </div>
          <dl class="dotazione">
            <div><dt>Arma</dt><dd>${h(arma.nome)} <small>${h(arma.dettagli)}</small></dd></div>
            <div><dt>Armatura</dt><dd>${h(armatura.nome)} <small>${h(armatura.dettagli)}</small></dd></div>
            <div><dt>Con te</dt><dd>${beni || 'niente'}</dd></div>
          </dl>
          <form class="modulo-nome" data-form="crea">
            <h2 class="passo"><span>II</span><label for="nome-pg">Come ti chiamano</label></h2>
            <div class="riga">
              <input id="nome-pg" name="nome" maxlength="40" autocomplete="off" placeholder="Il nome che usano nei vicoli" required>
              <button type="submit" class="bottone primario">Scendi in città</button>
            </div>
          </form>
        </div>
      </section>
    </div>
  </main>
  ${piede()}`;
}
