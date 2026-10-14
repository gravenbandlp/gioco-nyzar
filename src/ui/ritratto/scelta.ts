// I comandi per scegliere l'aspetto: corpo, pelle, taglio e colore dei capelli, barba e suo colore (non per il corpo
// femminile).
// Ogni pulsante porta data-az="aspetto" con la chiave e il valore; main.ts aggiorna la scelta e ridisegna.
import { h } from '../formato';
import { TAGLI, BARBE, CORPI, type Aspetto } from './motore';
import { PELLI, CHIOME, NOMI_PELLE, NOMI_CHIOMA, type Rampa } from './tavolozza';

const NOMI_CORPO: Record<string, string> = { maschile: 'Maschile', femminile: 'Femminile' };
const NOMI_TAGLIO: Record<string, string> = { rasati: 'Rasati', corti: 'Corti', arruffati: 'Arruffati', lunghi: 'Lunghi', raccolti: 'Raccolti' };
const NOMI_BARBA: Record<string, string> = { nessuna: 'Nessuna', ispida: 'Ispida', baffi: 'Baffi', corta: 'Corta', lunga: 'Lunga' };

const bottone = (k: keyof Aspetto, v: string, nome: string, attuale: string) =>
  `<button type="button" class="bottone piccolo" data-az="aspetto" data-k="${k}" data-v="${v}" aria-pressed="${v === attuale}">${h(nome)}</button>`;

const campione = (k: keyof Aspetto, v: string, r: Rampa, nome: string, attuale: string) =>
  `<button type="button" class="campione-aspetto" data-az="aspetto" data-k="${k}" data-v="${v}" aria-pressed="${v === attuale}" title="${h(nome)}" aria-label="${h(nome)}">${[r[3], r[2], r[1], r[0]].map((c) => `<i style="background:${c}"></i>`).join('')}</button>`;

export function sceltaAspetto(a: Aspetto): string {
  const riga = (etichetta: string, dentro: string, classe: string) => `<div class="aspetto-riga"><span class="etichetta">${etichetta}</span><div class="${classe}">${dentro}</div></div>`;
  const corpo = a.corpo ?? 'maschile';
  const barba = corpo === 'femminile' ? '' : `
    ${riga('Barba', BARBE.map((v) => bottone('barba', v, NOMI_BARBA[v]!, a.barba)).join(''), 'tagli-aspetto')}
    ${riga('Colore', Object.entries(CHIOME).map(([v, r]) => campione('coloreBarba', v, r, NOMI_CHIOMA[v] ?? v, a.coloreBarba)).join(''), 'campioni-aspetto')}`;
  return `<div class="scelta-aspetto">
    ${riga('Corpo', CORPI.map((v) => bottone('corpo', v, NOMI_CORPO[v]!, corpo)).join(''), 'tagli-aspetto')}
    ${riga('Pelle', Object.entries(PELLI).map(([v, r]) => campione('pelle', v, r, NOMI_PELLE[v] ?? v, a.pelle)).join(''), 'campioni-aspetto')}
    ${riga('Capelli', TAGLI.map((v) => bottone('capelli', v, NOMI_TAGLIO[v]!, a.capelli)).join(''), 'tagli-aspetto')}
    ${riga('Colore', Object.entries(CHIOME).map(([v, r]) => campione('coloreCapelli', v, r, NOMI_CHIOMA[v] ?? v, a.coloreCapelli)).join(''), 'campioni-aspetto')}
    ${barba}
  </div>`;
}

/** Applica un clic del selettore a un aspetto, se la chiave e il valore sono validi. */
export function cambiaAspetto(a: Aspetto, k: string | undefined, v: string | undefined): Aspetto {
  if (!k || !v) return a;
  if (k === 'corpo' && (CORPI as readonly string[]).includes(v)) return { ...a, corpo: v as Aspetto['corpo'] };
  if (k === 'pelle' && v in PELLI) return { ...a, pelle: v };
  if ((k === 'coloreCapelli' || k === 'coloreBarba') && v in CHIOME) return { ...a, [k]: v };
  if (k === 'capelli' && (TAGLI as readonly string[]).includes(v)) return { ...a, capelli: v as Aspetto['capelli'] };
  if (k === 'barba' && (BARBE as readonly string[]).includes(v)) return { ...a, barba: v as Aspetto['barba'] };
  return a;
}
