// Che aspetto ha ogni oggetto del gioco sul ritratto. Le armi, le armature e gli scudi comuni prendono la forma
// della loro base; gli unici e gli accessori hanno una voce qui, letta dalla loro descrizione. Un oggetto nuovo
// indossabile va aggiunto qui: test/ritratto.test.ts lo controlla.
import type { TContenuti } from '../../motore/contenuto';
import type { Stato, AspettoPg } from '../../motore/personaggio';
import { NIENTE_ARMA, NIENTE_ARMATURA, oggetto } from '../../motore/oggetti';
import { mutazioniDi, hash } from '../../motore/crisi';
import { TAGLI, BARBE, CORPI, type Aspetto, type Figura, type Posa, type Segno, type VisAccessorio, type VisArma, type VisArmatura, type VisScudo } from './motore';
import { PELLI, CHIOME } from './tavolozza';

export const ARMI_BASE: Record<string, VisArma> = {
  'mani-nude': { forma: 'mani' },
  tirapugni: { forma: 'tirapugni' },
  pugnale: { forma: 'pugnale' },
  'spada-corta': { forma: 'spadaCorta' },
  lancia: { forma: 'lancia' },
  mazza: { forma: 'mazza' },
  'ascia-da-battaglia': { forma: 'ascia' },
  'spada-lunga': { forma: 'spada' },
  'ascia-bipenne': { forma: 'bipenne' },
  'martello-da-guerra': { forma: 'martello' },
  spadone: { forma: 'spadone' },
  fionda: { forma: 'fionda' },
  'coltelli-da-lancio': { forma: 'coltelli' },
  'arco-corto': { forma: 'arcoCorto' },
  'balestra-leggera': { forma: 'balestra', variante: 'leggera' },
  'arco-lungo': { forma: 'arcoLungo' },
  'balestra-pesante': { forma: 'balestra' },
};

export const ARMATURE_BASE: Record<string, VisArmatura> = {
  nessuna: { forma: 'strada' },
  'giaco-imbottito': { forma: 'giaco' },
  'cuoio-rinforzato': { forma: 'cuoio' },
  'cotta-di-maglia': { forma: 'maglia' },
  'armatura-a-piastre': { forma: 'piastre' },
};

export const SCUDI_BASE: Record<string, VisScudo> = {
  scudo: { forma: 'scudo' },
  'scudo-pesante': { forma: 'torre' },
};

/** Gli oggetti unici: la forma e i materiali vengono dalla descrizione. */
export const UNICI: Record<string, VisArma | VisArmatura | VisScudo> = {
  // armi
  'avv-buche-laresh-roncola-della-regina': { forma: 'roncola', lama: 'chitina', manico: 'frassino' },
  'avv-investitura-lama-dell-investitura': { forma: 'spada', lama: 'neroLama', elsa: 'ferroNero', pomo: 'ferroNero', dettaglio: 'neroLama' },
  'avv-ponte-pesce-arpione-del-sommerso': { forma: 'lancia', variante: 'tridente', manico: 'legnoNero', lama: 'ferro' },
  'avv-prove-guado-maglio-di-branko': { forma: 'martello', variante: 'maglio', manico: 'pece' },
  'avv-signora-gole-lama-della-signora': { forma: 'spadaCurva', lama: 'acciaioChiaro', impugnatura: 'cuoioVerde', dettaglio: 'cristallo' },
  'accademia-piccozza-del-centoventi': { forma: 'piccozza' },
  'accademia-bastone-del-regolatore': { forma: 'bastone', variante: 'cristallo', manico: 'frassino', dettaglio: 'vetro' },
  'caserma-spada-di-ivo-carstan': { forma: 'spada', variante: 'ammaccata', impugnatura: 'cuoioChiaro' },
  'circolo-arco-di-tasso': { forma: 'arcoLungo', manico: 'tasso' },
  'circolo-ramo-di-metallo-vivo': { forma: 'lancia', variante: 'ramo', manico: 'precursoreGrigio', lama: 'acciaioChiaro' },
  'consiglio-mazza-del-patto': { forma: 'mazza', dettaglio: 'oro' },
  'consiglio-pungolo-di-sarpa': { forma: 'lancia', variante: 'ritorto', manico: 'frassino', lama: 'ferro' },
  'consiglio-spada-del-paladino': { forma: 'spada', pomo: 'scarlatto' },
  'gilda-spada-del-membro-eletto': { forma: 'spada', impugnatura: 'cuoioVerde' },
  'gilda-balestra-dei-ponti': { forma: 'balestra' },
  'maison-bastone-animato': { forma: 'bastoneAnimato', manico: 'ebano', pomo: 'argento' },
  'raschiatori-ascia-da-tunnel': { forma: 'ascia', variante: 'corta' },
  'raschiatori-piccone-della-fiamma': { forma: 'martello', variante: 'piccone', testa: 'precursoreGrigio' },
  'scuri-stiletto-da-manica': { forma: 'stiletto' },
  'scuri-sciabola-di-vesh': { forma: 'sciabola', elsa: 'argento', pomo: 'argento' },
  'velo-lama-di-kael': { forma: 'spada', lama: 'precursoreGrigio', elsa: 'precursore', pomo: 'precursore' },
  'campana-verga-della-capoturno': { forma: 'verga', manico: 'ferroNero', dettaglio: 'mana' },
  'campana-il-battente': { forma: 'martello', variante: 'battente', manico: 'ferro', testa: 'bronzo' },
  'costola-di-drago-martello-d-accordatura': { forma: 'martello', variante: 'feltro', testa: 'feltro' },
  'stele-dei-naviganti-asta': { forma: 'lancia', variante: 'asta', manico: 'precursoreGrigio', lama: 'precursoreGrigio' },
  'volta-dell-aculeo-aculeo-della-lancetta': { forma: 'stiletto', lama: 'acciaioChiaro' },
  'arco-lungo-composito-mira': { forma: 'arcoLungo', variante: 'composito', manico: 'tasso' },
  'arco-lungo-composito-forza': { forma: 'arcoLungo', variante: 'composito', manico: 'tasso' },
  'balestra-vansaya': { forma: 'balestra', manico: 'legnoNero', dettaglio: 'avorio' },
  'asce-da-lancio': { forma: 'coltelli', dettaglio: 'cristallo' },
  're-della-collina': { forma: 'spadone', variante: 'storto', lama: 'neroLama' },
  'martello-dei-due-mastini': { forma: 'martello' },
  'spillone-di-nerissa': { forma: 'spillone', lama: 'argentoBrunito', pomo: 'giaietto' },
  'mazza-ferrata-di-squiggor': { forma: 'mazza', variante: 'borchie', testa: 'ferroNero', manico: 'cuoio' },
  'spadone-runico-di-capomozzo': { forma: 'spadone', lama: 'ferro', dettaglio: 'mana' },
  'spadone-di-uzgreth': { forma: 'spadone', variante: 'largo' },
  'arco-di-isvaro': { forma: 'arcoLungo', manico: 'legnoChiaro' },
  'pugnale-dell-arpia': { forma: 'pugnale', pomo: 'madreperla' },
  'spada-di-druzk': { forma: 'spadaCurva', lama: 'neroLama', elsa: 'ferroNero' },
  'ghoran-lancia-della-pece': { forma: 'lancia', variante: 'stretta', manico: 'pece' },
  'ghoran-bipenne-di-ragh': { forma: 'bipenne', lama: 'neroLama', manico: 'corteccia' },
  'laresh-falce-della-chiusa': { forma: 'falce', lama: 'acciaioChiaro', manico: 'frassino' },
  'pannion-scure-di-linfa': { forma: 'bipenne', variante: 'scure', manico: 'corteccia', dettaglio: 'linfa' },
  'tuarmir-roncola-della-raccolta': { forma: 'coltelloCurvo', manico: 'corno' },
  'tuarmir-lancia-del-pettine': { forma: 'lancia', variante: 'dente', lama: 'precursoreGrigio', manico: 'frassino' },
  // armature
  'avv-radura-spenta-mantello-della-culla': { forma: 'cuoio', corpo: 'cuoio2', lungo: true, pelo: 'peloBianco', borchie: null },
  'avv-torchio-corazza-del-portabotti': { forma: 'piastre', corpo: 'precursoreGrigio', sotto: 'cuoio' },
  'avv-zanna-rotta-pelliccia-di-mezzaluna': { forma: 'cuoio', corpo: 'pelo', pelliccia: true },
  'accademia-mantello-del-cerchio-aperto': { forma: 'giaco', corpo: 'lanaGrigia', lungo: true, stemma: { forma: 'cerchio', mat: 'argento' } },
  'caserma-giubba-senza-mostrine': { forma: 'cuoio', borchie: null },
  'caserma-cotta-della-caserma': { forma: 'maglia', anelli: { dove: 'spalle', mat: 'ottone' } },
  'caserma-piastre-della-caserma': { forma: 'piastre', stemma: { forma: 'torre', mat: 'acciaioChiaro' } },
  'circolo-mantello-di-muschio': { forma: 'cuoio', corpo: 'cuoioGrigio', lungo: true, muschio: true, borchie: null },
  'consiglio-cuoio-della-guardia': { forma: 'cuoio', stemma: { forma: 'bilance', mat: 'cuoio' } },
  'gilda-giubba-dei-custodi': { forma: 'cuoio', spalleLarghe: true, borchie: 'lana' },
  'gilda-cappa-delle-mille-corde': { forma: 'cuoio', corpo: 'cuoioNero', lungo: true, brigantina: true, borchie: 'canapa' },
  'maison-soprabito-della-sarta': { forma: 'giaco', corpo: 'lanaNera', lungo: true },
  'raschiatori-giubba-del-primo-strato': { forma: 'cuoio', borchie: 'rame' },
  'scuri-brigantina': { forma: 'cuoio', corpo: 'cuoioNero', brigantina: true },
  'soglia-di-mara-cerata-del-portinaio': { forma: 'cuoio', corpo: 'tela', lungo: true, borchie: null },
  'cotta-di-maglia-di-irsa': { forma: 'maglia', spalleLarghe: true },
  'giaco-di-maglia-di-irsa': { forma: 'maglia', anelli: { dove: 'zigzag', mat: 'bronzo' } },
  'cuoio-borchiato-di-irsa': { forma: 'cuoio', corpo: 'cuoioGrigio', borchie: 'argento', stemma: { forma: 'spirale', mat: 'scarlatto' } },
  'corazza-ostinata': { forma: 'piastre', corpo: 'ferro', irregolare: true },
  'giacca-rinforzata-di-squiggor': { forma: 'cuoio', corpo: 'cuoioNero', brigantina: true, borchie: 'ferro' },
  'armatura-di-druzk': { forma: 'cuoio', corpo: 'cinghiale', borchie: 'ferroNero' },
  'giaco-di-balthog': { forma: 'maglia', sotto: 'seta' },
  'ghoran-pelle-della-fossa': { forma: 'cuoio', corpo: 'cinghiale', borchie: null },
  'laresh-giubba-delle-spigolatrici': { forma: 'cuoio', corpo: 'cuoioChiaro', spalleLarghe: true, borchie: null },
  'pannion-giubba-di-resina': { forma: 'cuoio', corpo: 'resina' },
  'tuarmir-mantello-di-muschio': { forma: 'cuoio', corpo: 'cuoio', lungo: true, muschio: true, borchie: null },
  'campana-piastre-del-campanaro': { forma: 'piastre', corpo: 'ferroNero', sotto: 'cuoio' },
  // scudi
  'avv-divoratore-placca-del-divoratore': { forma: 'placca' },
  'avv-rosicaossa-scudo-di-ossa-e-ferro': { forma: 'tondo', faccia: 'ferroNero', emblema: 'osso' },
  'avv-stazione-gelo-specchio-da-braccio': { forma: 'disco', faccia: 'precursoreGrigio', specchio: true },
  'campana-la-sordina': { forma: 'disco', faccia: 'ferroNero' },
  // le occasioni del 17 ottobre 2026
  'spada-del-cercatore': { forma: 'spada', impugnatura: 'cuoioChiaro' },
  'stocco-del-maestro-di-sala': { forma: 'spada', elsa: 'argento' },
  'sf-tubo-della-capsula': { forma: 'balestra', variante: 'leggera', manico: 'precursoreGrigio' },
  'sf-lama-che-non-dorme': { forma: 'spada', lama: 'neroLama', dettaglio: 'mana' },
  'corazza-del-vecchio-campione': { forma: 'maglia', anelli: { dove: 'spalle', mat: 'bronzo' } },
  'sf-corazza-del-tumulo': { forma: 'maglia', spalleLarghe: true, anelli: { dove: 'spalle', mat: 'precursoreGrigio' } },
};

export const ACCESSORI: Record<string, VisAccessorio> = {
  'avv-libro-regina-bracciale': { tipo: 'bracciale', mat: 'bronzo', dettaglio: 'arenaria' },
  'avv-puliti-piastrina-fredda': { tipo: 'pendente', forma: 'piastra', mat: 'precursore', filo: 'cuoio' },
  'avv-sogno-serpente-penna-della-guardiana': { tipo: 'capelli', forma: 'penna', mat: 'piumaRossa' },
  'taccuino-dei-civici': { tipo: 'fianco', forma: 'taccuino' },
  'sigillo-dei-lusardi': { tipo: 'anello', mat: 'argento' },
  'accademia-cristallo-d-aula': { tipo: 'anello', mat: 'ottone', gemma: 'cristallo' },
  'accademia-lente-da-tasca': { tipo: 'fianco', forma: 'lente' },
  'accademia-anello-d-ottone': { tipo: 'anello', mat: 'ottone' },
  'accademia-sigillo-del-cerchio-aperto': { tipo: 'anello', mat: 'argento' },
  'caserma-mantello-scarlatto': { tipo: 'mantello', mat: 'scarlatto' },
  'caserma-lanterna-di-ronda': { tipo: 'lanterna', forma: 'ronda' },
  'caserma-mazzo-di-nihali': { tipo: 'fianco', forma: 'astuccio', mat: 'vernice' },
  'caserma-distintivo-del-capitano': { tipo: 'spilla', forma: 'placca', mat: 'argentoBrunito' },
  'circolo-segno-delle-tre-tacche': { tipo: 'pendente', forma: 'disco', mat: 'corteccia', filo: 'canapa' },
  'circolo-lupa-brina': { tipo: 'compagno', specie: 'lupa' },
  'circolo-braska': { tipo: 'compagno', specie: 'puma' },
  'circolo-innesto-di-legnoscuro': { tipo: 'innesto' },
  'circolo-cappuccio-di-nebbia': { tipo: 'cappuccio', mat: 'lanaVerde' },
  'circolo-ghianda-di-metallo-vivo': { tipo: 'pendente', forma: 'ghianda', mat: 'precursoreGrigio', filo: 'corteccia' },
  'consiglio-penna-d-osso': { tipo: 'fianco', forma: 'penna' },
  'consiglio-lettera-col-sigillo': { tipo: 'fianco', forma: 'lettera' },
  'consiglio-anello-delle-bilance': { tipo: 'anello', mat: 'argentoBrunito' },
  'consiglio-spilla-del-consiglio': { tipo: 'spilla', forma: 'anelli', mat: 'argento' },
  'consiglio-guanti-della-gazza': { tipo: 'guanti', mat: 'cuoioChiaro' },
  'gilda-gettone-del-socio': { tipo: 'pendente', forma: 'disco', mat: 'bronzo', filo: 'cuoioVerde' },
  'gilda-lanterna-cieca-di-maedric': { tipo: 'lanterna', forma: 'cieca' },
  'gilda-sigillo-del-portasigillo': { tipo: 'fianco', forma: 'astuccio' },
  'gilda-guanti-delle-tiracorde': { tipo: 'guanti', mat: 'cuoio2' },
  'gilda-catena-del-terzo-piano': { tipo: 'pendente', forma: 'catena', mat: 'argento', filo: 'argento' },
  'maison-ventaglio-dei-segnali': { tipo: 'fianco', forma: 'ventaglio' },
  'maison-cristallo-accoppiato': { tipo: 'fianco', forma: 'gabbia' },
  'maison-spilla-della-mezzaluna': { tipo: 'spilla', forma: 'luna', mat: 'argento' },
  'maison-catena-di-bronzo': { tipo: 'bracciale', mat: 'bronzo' },
  'raschiatori-bracciale-dei-turni': { tipo: 'bracciale', mat: 'cuoio', dettaglio: 'cristallo', luce: true },
  'raschiatori-scandaglio': { tipo: 'pendente', forma: 'scheggia', mat: 'cristallo', filo: 'argento' },
  'raschiatori-bracciale-di-rame': { tipo: 'bracciale', mat: 'rame', dettaglio: 'ferro' },
  'scuri-cappuccio-degli-scuri': { tipo: 'cappuccio', mat: 'lanaGrigia' },
  'scuri-tre-chiavi': { tipo: 'fianco', forma: 'chiavi' },
  'scuri-anello-liscio': { tipo: 'anello', mat: 'argento' },
  'velo-corda-del-laico': { tipo: 'fianco', forma: 'corda' },
  'velo-sigillo-del-velo': { tipo: 'pendente', forma: 'disco', mat: 'bronzo', filo: 'lanaGrigia' },
  'velo-lanterna-del-custode': { tipo: 'lanterna', forma: 'custode' },
  'velo-velo-grigio': { tipo: 'velo', mat: 'lanaGrigia' },
  'velo-simbolo-in-platino': { tipo: 'pendente', forma: 'simbolo', mat: 'platino', filo: 'argento' },
  'anello-del-camminatore-perno': { tipo: 'fianco', forma: 'cilindro' },
  'campana-conchiglia-sorda': { tipo: 'orecchio', mat: 'ferroNero' },
  'forno-della-nonna-piastrina': { tipo: 'pendente', forma: 'piastra', mat: 'precursoreGrigio', filo: 'cuoio' },
  'lente-del-sornione-vetro-delle-due-stelle': { tipo: 'fianco', forma: 'lente' },
  'spina-dell-eco-canna-della-voce': { tipo: 'pendente', forma: 'canna', mat: 'precursoreGrigio', filo: 'cuoio' },
  'tamburi-di-fondo-rotella-del-conto': { tipo: 'pendente', forma: 'ruota', mat: 'ferroNero', filo: 'canapa' },
  'anello-del-respiro-misurato': { tipo: 'anello', mat: 'argento' },
  'mantello-delle-correnti-laterali': { tipo: 'mantello', mat: 'petrolio', riflesso: '#3f7a64' },
  'amuleto-del-corvo-vigile': { tipo: 'pendente', forma: 'piuma', mat: 'piumaNera', filo: 'cuoio' },
  'ciondolo-del-nodo': { tipo: 'pendente', forma: 'goccia', mat: 'ossidiana', filo: 'seta' },
  'cavallo-da-guerra': { tipo: 'compagno', specie: 'cavallo', manto: 'baio', finimenti: true },
  'specchio-della-seconda-scelta': { tipo: 'fianco', forma: 'specchio' },
  'anello-del-pugno-saldo': { tipo: 'anello', mat: 'ferroNero', gemma: 'vetro' },
  ombrafosca: { tipo: 'compagno', specie: 'cavallo', manto: 'morello' },
  'cristalli-anti-marea': { tipo: 'pendente', forma: 'cristalli', mat: 'cristallo', filo: 'canapa' },
  'stella-a-sette-punte': { tipo: 'fianco', forma: 'stella' },
  'maschera-della-forza': { tipo: 'maschera', forma: 'volto', mat: 'argentoBrunito', dettaglio: '#c63a4a' },
  'maschera-della-rottura': { tipo: 'maschera', forma: 'senzaBocca', mat: 'oroOpaco', dettaglio: '#f4fbf8' },
  'maschera-della-distorsione': { tipo: 'maschera', forma: 'incrinata', mat: 'vetro', dettaglio: '#16141e' },
  'maschera-della-natura': { tipo: 'maschera', forma: 'corteccia', mat: 'corteccia', dettaglio: 'ferro' },
  'fermaglio-di-orvald': { tipo: 'spilla', forma: 'filo', mat: 'argento' },
  'cintura-del-campione': { tipo: 'cintura', mat: 'cuoioRosso', fibbia: 'bronzo' },
  'cristallo-della-visione-del-vero': { tipo: 'fianco', forma: 'uovo' },
  'fonte-di-energia': { tipo: 'petto', forma: 'sfera', mat: 'precursoreGrigio', luce: 'luceBianca' },
  'modulo-di-isolamento': { tipo: 'petto', forma: 'piastra', mat: 'precursore' },
  'matrice-di-levigazione': { tipo: 'fianco', forma: 'reticolo' },
  'ghoran-filo-di-rame': { tipo: 'capelli', forma: 'filo', mat: 'rame' },
  'laresh-fischietto-d-osso': { tipo: 'fianco', forma: 'fischietto' },
  'laresh-puledra-grigia': { tipo: 'compagno', specie: 'cavallo', manto: 'grigio' },
  'pannion-lanterna-da-pontile': { tipo: 'lanterna', forma: 'pontile' },
  'pannion-scheggia-del-vecchio': { tipo: 'pendente', forma: 'scheggia', mat: 'legnoNero', filo: 'cuoio' },
  'tuarmir-maschera-d-erbe': { tipo: 'maschera', forma: 'erbe', mat: 'tela' },
  // le occasioni del 17 ottobre 2026
  'compasso-dei-primi-maghi': { tipo: 'fianco', forma: 'reticolo', mat: 'ottone' },
  'cintura-da-cavo': { tipo: 'cintura', mat: 'canapa', fibbia: 'ferro' },
  'bussola-senza-nord': { tipo: 'fianco', forma: 'stella', mat: 'ottone' },
  'astrolabio-del-forestiero': { tipo: 'pendente', forma: 'ruota', mat: 'ottone', filo: 'cuoio' },
  'bracciale-del-lottatore': { tipo: 'bracciale', mat: 'cuoio', dettaglio: 'rame' },
  'sf-cristallo-della-fenditura': { tipo: 'pendente', forma: 'scheggia', mat: 'cristallo', filo: 'cuoio' },
};

const SEGNI: Record<string, Segno> = {
  'occhi-luminescenti': 'occhi', 'vene-di-luce': 'vene', 'unghie-di-metallo': 'unghie', 'pelle-increspata': 'pelle',
};

export function visArma(id: string, c: TContenuti): VisArma {
  const u = UNICI[id];
  if (u && isArma(u)) return u;
  const base = oggetto(c, id)?.base ?? id;
  return ARMI_BASE[base] ?? ARMI_BASE[id] ?? { forma: 'mani' };
}
export function visArmatura(id: string, c: TContenuti): VisArmatura {
  const u = UNICI[id];
  if (u && isArmatura(u)) return u;
  const base = oggetto(c, id)?.base ?? id;
  return ARMATURE_BASE[base] ?? ARMATURE_BASE[id] ?? { forma: 'strada' };
}
export function visScudo(id: string, c: TContenuti): VisScudo | undefined {
  if (!id) return undefined;
  const u = UNICI[id];
  if (u && isScudo(u)) return u;
  const base = oggetto(c, id)?.base ?? id;
  return SCUDI_BASE[base] ?? SCUDI_BASE[id];
}

const FORME_ARMATURA = new Set(['strada', 'giaco', 'cuoio', 'maglia', 'piastre']);
const FORME_SCUDO = new Set(['scudo', 'torre', 'tondo', 'disco', 'placca']);
function isArmatura(v: VisArma | VisArmatura | VisScudo): v is VisArmatura { return FORME_ARMATURA.has(v.forma); }
function isScudo(v: VisArma | VisArmatura | VisScudo): v is VisScudo { return FORME_SCUDO.has(v.forma); }
function isArma(v: VisArma | VisArmatura | VisScudo): v is VisArma { return !isArmatura(v) && !isScudo(v); }

/** Un aspetto ragionevole per chi non l'ha ancora scelto: dipende dal nome, così resta lo stesso. */
export function aspettoPredefinito(nome: string): Aspetto {
  const k = hash(nome || 'senza nome');
  const pelli = Object.keys(PELLI), chiome = ['nero', 'castano', 'castano', 'rame', 'cenere', 'nero'];
  const colore = chiome[k % chiome.length]!;
  return {
    pelle: pelli[(k >> 3) % pelli.length]!,
    capelli: TAGLI[(k >> 6) % TAGLI.length]!,
    coloreCapelli: colore,
    barba: BARBE[(k >> 9) % BARBE.length]!,
    coloreBarba: colore,
  };
}

/** L'aspetto salvato, se è valido (i salvataggi passano da mani diverse). */
export function aspettoValido(a: AspettoPg | undefined): Aspetto | undefined {
  if (!a) return undefined;
  if (!(a.pelle in PELLI) || !(a.coloreCapelli in CHIOME) || !(a.coloreBarba in CHIOME)) return undefined;
  if (!(TAGLI as readonly string[]).includes(a.capelli) || !(BARBE as readonly string[]).includes(a.barba)) return undefined;
  if (a.corpo !== undefined && !(CORPI as readonly string[]).includes(a.corpo)) return undefined;
  return a as Aspetto;
}

export interface Dotazione { arma: string; armatura: string; scudo: string; accessori: string[]; segni: Segno[] }

/** Come si tiene l'arma, dalle sue regole: due mani da mischia, due mani da distanza, una mano o lo scudo. */
export function posaDi(arma: string, scudo: string, c: TContenuti): Posa {
  const id = arma || NIENTE_ARMA;
  const base = c.armi.find((a) => a.id === (oggetto(c, id)?.base ?? id));
  if (base?.proprieta.includes('Due mani')) return base.abilita === 'armi-da-distanza' ? 'mira' : 'dueMani';
  return id !== NIENTE_ARMA || scudo ? 'guardia' : 'dritta';
}

export function figura(aspetto: Aspetto, d: Dotazione, c: TContenuti): Figura {
  return {
    aspetto,
    posa: posaDi(d.arma, d.scudo, c),
    arma: visArma(d.arma || NIENTE_ARMA, c),
    armatura: visArmatura(d.armatura || NIENTE_ARMATURA, c),
    scudo: visScudo(d.scudo, c),
    accessori: d.accessori.map((id) => ACCESSORI[id]).filter((x): x is VisAccessorio => !!x),
    segni: d.segni,
  };
}

/** La figura del personaggio in gioco, con quello che indossa e i segni della Marea. */
export function figuraDi(s: Stato, c: TContenuti, aspetto?: Aspetto): Figura {
  const segni = mutazioniDi(s, c).map((m) => SEGNI[m.id]).filter((x): x is Segno => !!x);
  return figura(aspetto ?? aspettoValido(s.aspetto) ?? aspettoPredefinito(s.nome), { arma: s.arma, armatura: s.armatura, scudo: s.scudo, accessori: [...(s.accessori ?? []), ...(s.animale ? [s.animale] : [])], segni }, c);
}
