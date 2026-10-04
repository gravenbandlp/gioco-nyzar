// Le pagine informative aperte dal piè di pagina: regolamento e domande frequenti, termini (origini e fonti
// d'ispirazione), crediti. Testo statico, scritto qui perché non fa parte della narrativa.
import { h } from './formato';
import type { DatiSalvati, StatoArchivio } from './salvataggi';
import {
  RINTOCCHI_MAX, MINUTI_PER_RINTOCCO, MANO_MAX, CODA_MAX, MINUTI_PER_CARTA, MAX_NEGATIVA, SOGLIA_PERICOLO, DIFFICOLTA,
  ETICHETTE_DIFFICOLTA, SOGLIE_PE, MAX_CONSUMABILI_IN_COMBATTIMENTO,
} from '../motore/regole';
import { probabilita } from '../motore/dadi';
import FONTI from '../dati/fonti-tavole.json';

export type PaginaInfo = 'regolamento' | 'termini' | 'crediti' | 'salvataggio';
export const PAGINE_INFO: PaginaInfo[] = ['regolamento', 'termini', 'crediti', 'salvataggio'];

declare const __VERSIONE__: string;
export const VERSIONE: string = typeof __VERSIONE__ === 'string' ? __VERSIONE__ : 'sviluppo';
const ANNO = 2026;

const a = (href: string, testo: string) => `<a href="${href}" target="_blank" rel="noopener">${testo}</a>`;

export function piede(): string {
  return `<footer class="piede-pagina">
    <span>© ${ANNO} Luca Pasini · Ny'Zar</span>
    <span class="versione">Versione ${VERSIONE}</span>
    <nav aria-label="Informazioni">
      <button type="button" class="link" data-az="pagina" data-id="salvataggio">Salvataggio</button>
      <button type="button" class="link" data-az="pagina" data-id="regolamento">Regolamento</button>
      <button type="button" class="link" data-az="pagina" data-id="termini">Termini</button>
      <button type="button" class="link" data-az="pagina" data-id="crediti">Crediti</button>
    </nav>
  </footer>`;
}

/** `corpo` sostituisce il testo statico: la pagina del salvataggio dipende dallo stato dell'account. */
export function paginaInfo(id: PaginaInfo, corpo = id === 'regolamento' ? regolamento() : id === 'termini' ? termini() : id === 'crediti' ? crediti() : ''): string {
  return `<article class="pagina-info">
    <button type="button" class="bottone indietro" data-az="chiudi-pagina">← Torna al gioco</button>
    ${corpo}
  </article>`;
}

function domanda(d: string, r: string): string {
  return `<details class="faq"><summary>${d}</summary><div>${r}</div></details>`;
}

/** Tabella delle probabilità di riuscita: righe = dadi, colonne = difficoltà. Calcolata con la funzione del motore. */
/** Su cento, senza far sembrare certo quello che non lo è (né impossibile quello che è solo improbabile). */
const cento = (p: number): string => (p >= 1 ? '100' : p >= 0.995 ? '&gt;99' : p <= 0 ? '0' : p < 0.005 ? '&lt;1' : String(Math.round(p * 100)));

function tabellaProbabilita(): string {
  const colonne = (['Molto facile', 'Facile', 'Media', 'Difficile', 'Molto difficile'] as const).map((k) => [k, DIFFICOLTA[k]] as const);
  const righe = [1, 2, 3, 4, 5, 6, 7, 8, 10].map((n) => `<tr><th scope="row">${n}</th>${colonne
    .map(([, r]) => `<td>${cento(probabilita(n, r))}</td>`).join('')}</tr>`).join('');
  return `<div class="tabella-regole"><table>
    <caption>Probabilità di riuscita, su cento</caption>
    <thead><tr><th scope="col">Dadi</th>${colonne.map(([k, r]) => `<th scope="col">${k}<small>${r} ${r === 1 ? 'successo' : 'successi'}</small></th>`).join('')}</tr></thead>
    <tbody>${righe}</tbody>
  </table></div>`;
}

function regolamento(): string {
  return `
  <header><span class="etichetta velo">Regolamento</span><h2>Come si gioca</h2></header>
  <p>Ludus Ny'Zar è un gioco narrativo a <em>storylet</em>: brevi scene che si aprono e si chiudono in base a quello che il
  tuo personaggio ha fatto, sa e possiede. Non c'è una mappa da esplorare a passi. Scegli dove andare e cosa fare, e il
  mondo tiene il conto delle tue scelte. Sotto il racconto c'è un regolamento da gioco di ruolo, con prove a dadi e
  combattimenti a round, e questa pagina lo spiega per intero.</p>

  <h3>Il personaggio</h3>
  <p>Hai tre <b>attributi</b>, Fisico, Sociale e Mentale, e otto <b>abilità</b> per ciascuno. Tutti vanno da 0 a 5.</p>
  <ul class="elenco-regole">
    <li><b>Fisico</b>: Rissa, Armi da mischia, Armi da distanza, Resistenza, Atletica, Acrobazia, Furtività, Cavalcare.</li>
    <li><b>Sociale</b>: Conoscenze della strada, Galateo, Persuasione, Intimidire, Ingannare, Empatia, Espressività,
    Addestrare animali.</li>
    <li><b>Mentale</b>: Accademiche, Percezione, Politica ed economia, Tecnologia, Magia, Medicina, Natura, Resilienza.</li>
  </ul>
  <p>L'origine che scegli all'inizio ti dà i primi valori, un'arma, un'armatura e qualche oggetto. Il resto lo costruisci
  giocando.</p>

  <h3>Le prove</h3>
  <p>Quando un'opzione chiede una prova, il gioco tira un mucchio di dadi a sei facce, tanti quanti sono
  <b>l'attributo più l'abilità</b>. Ogni dado che fa <b>4, 5 o 6</b> è un <b>successo</b>, quindi ogni dado riesce una
  volta su due. La difficoltà dice quanti successi servono:</p>
  <ul class="elenco-regole">
    ${ETICHETTE_DIFFICOLTA.map((k) => `<li><b>${k}</b>: ${DIFFICOLTA[k]} ${DIFFICOLTA[k] === 1 ? 'successo' : 'successi'}.</li>`).join('')}
  </ul>
  <p>Se un'opzione accetta più abilità (per esempio Persuasione o Ingannare), il gioco usa quella in cui sei più forte.
  Alcuni oggetti, talenti e mutazioni aggiungono dadi. Prima di scegliere vedi sempre quanti dadi tiri e quante
  probabilità hai; dopo, vedi i dadi usciti.</p>
  <div class="esempio-regole">
    <span class="etichetta">Esempio</span>
    <p>Hai Sociale 2 e Persuasione 2, e un'opzione chiede <i>Persuasione, Media</i>. Tiri 4 dadi e ti servono 3 successi.
    Escono 6, 4, 2 e 5: tre successi, la prova riesce. Con 4 dadi una prova Media riesce poco meno di una volta su tre;
    con un dado in più, una volta su due.</p>
  </div>
  ${tabellaProbabilita()}
  <p>Una prova fallita non chiude quasi mai la strada. Costa qualcosa (monete, tempo, una negativa che sale) e porta a un
  esito diverso. Ci sono due casi speciali: con <b>zero successi</b> un reperto dei Precursori usato nella prova si guasta,
  e un incantesimo provoca una <b>Dissonanza</b>, che ti dà mezzo punto di Tormento.</p>

  <h3>Crescita</h3>
  <p>Ogni prova, riuscita o fallita, dà <b>punti esperienza</b> all'abilità usata. Ne dà di più quando l'esito era
  incerto: da 3 a 4 punti con una probabilità fra una su cinque e sette su dieci, uno solo se la prova era quasi certa o
  quasi disperata. L'attributo dell'abilità riceve un quarto di quei punti. Per salire servono
  ${SOGLIE_PE.map((n, i) => `${n} punti per il livello ${i + 1}`).join(', ')}. Le abilità a zero si allenano con le
  azioni facili dei luoghi, che in città ci sono per tutte.</p>

  <h3>I rintocchi</h3>
  <p>Qir-Azel scandisce le giornate a campane, e il tuo tempo si conta a rintocchi. Quasi ogni azione costa un rintocco,
  alcune due o tre, alcune niente. Ne hai al massimo ${RINTOCCHI_MAX} e ne torna uno ogni ${MINUTI_PER_RINTOCCO} minuti,
  anche a gioco chiuso, e non si ricaricano in nessun altro modo. Senza rintocchi
  puoi ancora leggere il diario, cambiare equipaggiamento e fare compere. Il ritmo è voluto, perché Ny'Zar si gioca a
  sessioni brevi, tornando più volte al giorno.</p>

  <h3>Quartieri, luoghi e storie</h3>
  <p>La città è divisa in quartieri (Città Bassa, Ponti Sospesi, Quartieri Alti) e ti sposti dalla scheda <b>Mappa</b>;
  alcuni ponti chiedono una gabella, i Quartieri Alti un invito. Ogni quartiere ha i suoi <b>luoghi</b>, come la locanda
  o la biblioteca, con azioni da ripetere quanto vuoi per guadagnare monete, esperienza e informazioni, una reputazione
  propria e le botteghe. In cima alla pagina, sotto <b>La tua storia</b>, ci sono le scene che fanno avanzare la trama.</p>
  <p>Durante il <b>prologo</b> sono aperte solo le schede Storia, Personaggio e Averi. Mappa, bazar e diario si aprono
  quando il prologo finisce.</p>
  <p>Alcune storie portano fuori città, in una <b>spedizione</b>: una foresta, una palude, un isolotto. Le stanze
  compaiono poche alla volta, la profondità sale a ogni stanza superata e, raggiunta la soglia, si apre il cuore del
  posto. Puoi ritirarti quando vuoi, ma la profondità si azzera, e una stanza già superata non ricompare finché non esci.</p>

  <h3>La Superficie Fratturata</h3>
  <p>Fuori dalle mura c'è la <b>Superficie Fratturata</b>, che raggiungi dalla mappa quando vuoi. Lì il mazzo pesca solo
  gli incontri della Superficie, e alcuni incontri ritornano e cambiano a seconda di come li hai trattati. Il bottino
  tipico è il <b>reperto sigillato</b>. Nella sua baracca Oda Krell ti aiuta ad aprirlo e a scegliere quale parte
  estrarne, e sul suo banco monti le parti in un congegno che si vende a compratori diversi, ognuno interessato alla
  Potenza, alla Stabilità o alla Stranezza. Oda ripara anche i reperti guasti.</p>

  <h3>Le occasioni</h3>
  <p>Il mazzo delle occasioni si riempie da solo, una carta ogni ${MINUTI_PER_CARTA} minuti fino a ${CODA_MAX}. Peschi in
  mano fino a ${MANO_MAX} carte, con gli incontri e i guai che capitano per strada. Una carta legata a un quartiere si
  gioca solo lì; quelle che non ti interessano le scarti con la ×.</p>

  <h3>Il combattimento</h3>
  <p>Gli scontri si giocano a round. Prima di cominciare vedi quanto è difficile, da <i>Molto facile</i> a
  <i>Impossibile</i>: il gioco simula lo scontro molte volte con il tuo personaggio così com'è. Se è difficile, di solito
  la scena offre un'altra strada, a parole o di nascosto.</p>
  <p>In combattimento contano questi valori, tutti nella scheda Personaggio:</p>
  <ul class="elenco-regole">
    <li><b>Attacco</b>: Fisico più l'abilità dell'arma (Rissa a mani nude o con i tirapugni, Armi da mischia, Armi da distanza).</li>
    <li><b>Difesa</b>: Fisico più Acrobazia, più lo scudo se ne hai uno.</li>
    <li><b>Punti ferita (PF)</b>: 5 più Fisico più Resistenza.</li>
    <li><b>Danno</b> dell'arma e <b>Riduzione</b> dell'armatura, che toglie danni a ogni colpo subito.</li>
    <li><b>Iniziativa</b>: Atletica più Percezione. A inizio scontro tutti tirano l'iniziativa e agiscono in quell'ordine, a ogni round.</li>
  </ul>
  <p><b>Attaccare.</b> Chi attacca tira i dadi d'Attacco, chi si difende i dadi di Difesa, e si contano i successi di
  entrambi. Se l'attacco ne fa di più, il colpo va a segno e fa tanti danni quanta è la differenza, più il danno
  dell'arma, meno la riduzione dell'armatura. Un colpo a segno fa sempre almeno 1 danno. Con un pareggio o meno, il colpo
  è parato. Le armi <i>Perforanti</i> ignorano 2 punti di riduzione e quelle <i>Contundenti</i> 1; con un'arma a
  <i>Portata</i> colpisci per primo nel primo round.</p>
  <p>A ogni round, al tuo turno, scegli una di queste azioni:</p>
  <ul class="elenco-regole">
    <li><b>Attaccare</b> un nemico, come sopra.</li>
    <li><b>Intimidire</b>: Sociale più Intimidire contro Mentale più Resilienza del nemico. Se vinci, esita e ha un dado
    in meno in attacco per 2 round; se vinci di 3 o più e il nemico è di quelli che possono scappare, scappa.</li>
    <li><b>Lanciare un incantesimo</b> del tuo repertorio: tiri Mentale più Magia e spendi Energia pari al livello
    dell'incantesimo. Con zero successi c'è la Dissonanza.</li>
    <li><b>Usare un reperto</b> dei Precursori, che ha un certo numero di cariche.</li>
    <li><b>Usare un consumabile</b>: le bende ridanno 2 PF, il tonico 4, l'estratto di energia 3 Energia. Al massimo
    ${MAX_CONSUMABILI_IN_COMBATTIMENTO} per scontro.</li>
  </ul>
  <p><b>Come finisce.</b> Lo scontro finisce quando cadi tu o cadono (o scappano) tutti i nemici. Se vinci, le Ferite
  dipendono dai PF che ti restano: nessuna se ne hai almeno quattro quinti, mezza se ne hai almeno due quinti, una se
  sei sceso sotto. Se perdi prendi le Ferite che lo scontro prevede e la storia prosegue dal ramo della sconfitta, che
  costa ma non ti uccide. I nemici più duri della trama restano duri: le vie per batterli sono Difficili e fallire costa.</p>
  <div class="esempio-regole">
    <span class="etichetta">Esempio di combattimento</span>
    <p>Sei un <i>Figlio della Città Bassa</i>: Fisico 2, Sociale 2, Rissa 3, Acrobazia 1, Intimidire 1, tirapugni (danno
    1), nessuna armatura. Quindi hai 5 dadi d'Attacco, 3 di Difesa e 7 PF. Sulla Superficie ti sbarra la strada un
    <i>Predone</i>: Attacco 2, Difesa 2, Difesa mentale 2, 5 PF, danno 1, nessuna armatura.</p>
    <p><b>Iniziativa.</b> Tu tiri 0 dadi, perché Atletica e Percezione sono a zero; il predone ne tira 2. Agisce prima lui.</p>
    <p><b>Round 1.</b> Il predone attacca con 2 dadi: 5 e 6, due successi. Ti difendi con 3 dadi: 1, 4 e 2, un successo.
    Ti colpisce per 2 − 1 = 1, più 1 della sua arma: 2 danni, e scendi a 5 PF. Tocca a te. Attacchi con 5 dadi: 6, 4, 2,
    5 e 1, tre successi. Lui si difende con 4 e 3, un successo. Lo colpisci per 3 − 1 = 2, più 1 dei tirapugni: 3 danni,
    e gli restano 2 PF.</p>
    <p><b>Round 2.</b> Il predone attacca con 4 e 2, un successo; tu ti difendi con 6, 6 e 3, due successi, e pari. Al tuo
    turno provi a intimidirlo con Sociale 2 più Intimidire 1: escono 5, 4 e 6, tre successi. Lui tira la Difesa mentale,
    1 e 3, zero successi. Vinci di 3 e il predone è di quelli che scappano, quindi se ne va.</p>
    <p><b>Fine.</b> Hai vinto con 5 PF su 7, più di due quinti: prendi mezza Ferita.</p>
  </div>

  <h3>Le statistiche negative e le crisi</h3>
  <p>Ferite, Scandalo, Sospetto, Tormento e Contaminazione salgono con i rischi che corri. Si abbassano con il riposo,
  le cure, i favori giusti. Da ${SOGLIA_PERICOLO} in su la barra diventa rossa. Se una arriva a ${MAX_NEGATIVA} scatta una
  <b>crisi</b>: finisci in convalescenza, in cella, ai margini della città o nel delirio, e ne esci solo giocando la storia
  che ti ci ha portato. La Contaminazione della Marea porta invece alle mutazioni.</p>

  <h3>Diario, nomi e audio</h3>
  <p>Sotto ogni esito c'è <b>Annota nel diario</b>, e le pagine che conservi restano nella scheda Diario. I nomi
  sottolineati nei testi aprono una scheda con quello che sa chiunque in città. Il pulsante con la nota musicale, in
  basso a destra, regola musica e ambiente, o li spegne.</p>

  <h3>Domande frequenti</h3>
  ${domanda('Dove vengono salvati i progressi?', `<p>Nel tuo account Google, dopo ogni azione: entrando con lo stesso account da un altro dispositivo
    ritrovi il personaggio dove l'hai lasciato. Dalla pagina «Salvataggio» puoi anche scaricarne una copia su file.</p>`)}
  ${domanda('Posso perdere il personaggio?', `<p>No, nessuna scelta lo uccide. Sconfitte e crisi costano tempo e qualche conseguenza, poi si torna in città.
    Il personaggio si perde solo se lo cancelli tu con «Nuovo personaggio».</p>`)}
  ${domanda('Una scena dice che mi manca qualcosa. Che faccio?', `<p>Sotto l'opzione bloccata c'è scritto cosa serve: una quality, un oggetto, un livello d'abilità, un luogo.
    Quasi sempre c'è anche un'altra opzione che costa di più o rischia di più, ma è aperta.</p>`)}
  ${domanda('Ho finito le cose da fare nella storia.', `<p>Le storie si aprono man mano: alcune chiedono un'abilità più alta, un invito, un oggetto, o che sia
    passato un altro passo della trama. Le azioni ripetibili nei luoghi servono proprio a prepararsi.</p>`)}
  ${domanda('Conviene ripetere la stessa azione?', `<p>Sì, ed è normale: le azioni ripetibili esistono per allenarsi e mettere da parte monete.</p>`)}
  ${domanda('Che differenza c\'è fra la Storia e le Occasioni?', `<p>La Storia è la trama, sempre disponibile nel posto giusto. Le occasioni sono il caso: arrivano da sole, a volte
    portano ricompense rare, a volte guai, e puoi scartarle.</p>`)}
  ${domanda('Il gioco ha un finale?', `<p>Per ora c'è il primo capitolo. Il gioco segue la cronaca di Ny'Zar, che ne ha tre.</p>`)}
  ${domanda('L\'audio non parte.', `<p>I browser bloccano l'audio finché non tocchi la pagina, e il clic su «Entra a Qir-Azel» basta. Se ancora
    non senti nulla, controlla il pulsante in basso a destra.</p>`)}`;
}

function termini(): string {
  return `
  <header><span class="etichetta velo">Termini</span><h2>Da dove nasce il gioco</h2></header>
  <p>Ny'Zar è un'ambientazione techno-fantasy per giochi di ruolo da tavolo, nata e cresciuta al tavolo con un gruppo di
  amici. Da quasi un anno la giochiamo nella cronaca <em>Il Peccato degli Uomini</em>, e tutto quello che è emerso nelle
  sessioni è raccolto nel ${a('https://codex-nyzar.pages.dev', 'Codex di Ny\'Zar')}.</p>
  <p>Questo gioco porta la città di Qir-Azel e il primo capitolo della cronaca in una forma diversa: un racconto a scelte che
  si gioca da soli, nel browser, pochi rintocchi alla volta. Rispetto alla cronaca alcuni nomi sono cambiati e la storia si
  apre a un protagonista nuovo, che non è nessuno dei personaggi del nostro tavolo.</p>

  <h3>Le fonti d'ispirazione</h3>
  <p><b>${a('https://www.fallenlondon.com', 'Fallen London')}</b> di Failbetter Games è il modello del regolamento e
  dell'interfaccia: gli storylet, le azioni che si ricaricano col tempo, le quality che tengono il conto di tutto, il mazzo
  delle occasioni, i luoghi dentro i quartieri. Su quella base il gioco aggiunge un sistema proprio, più vicino al gioco di
  ruolo da tavolo, con attributi, abilità, prove a dadi, combattimento a round e magia.</p>
  <p><b>Disco Elysium</b> di ZA/UM ha dato il tono alla voce del narratore, quella che sta dentro la testa del protagonista.</p>
  <p>Il resto viene dal gioco di ruolo da tavolo e dalle sere passate a giocarlo.</p>

  <h3>Cosa ho creato</h3>
  <p>L'ambientazione di Ny'Zar, la cronaca <em>Il Peccato degli Uomini</em> e i suoi personaggi, il Codex, la scrittura
  della storia, il sito e questo gioco sono un mio progetto personale, che porto avanti da solo, con le mie risorse e per
  passione. Non ci guadagno nulla.</p>

  <h3>Note legali</h3>
  <p>Ny'Zar e i suoi testi sono © ${ANNO} Luca Pasini, tutti i diritti riservati. Fallen London è un marchio di
  Failbetter Games e Disco Elysium di ZA/UM: questo progetto non è affiliato a nessuna delle due. Le tavole sono stampe
  d'epoca di pubblico dominio, elencate nei crediti con la loro fonte. Musiche, ambienti sonori e icone appartengono ai
  rispettivi autori, elencati nei crediti, e sono usati secondo le loro licenze.</p>
  <p>Sul sito si gioca entrando con Google: il gioco conserva nome, email e salvataggio, solo per farti ritrovare il
  personaggio. Dentro claude.ai il salvataggio sta invece nel tuo account Claude. I dettagli sono nella
  ${a('https://gioco-nyzar.pages.dev/privacy', 'pagina sulla privacy')}. Non usa cookie di profilazione e non
  contiene pubblicità.</p>`;
}

// ---------------------------------------------------------------- fonti delle tavole

interface Fonte { tavola: string; opera: string; autore: string; data?: string; url: string; licenza: string }
const fonti = FONTI as Fonte[];
const COLLEZIONI: [string, string][] = [
  ['ambientazione', 'Luoghi'], ['soglia', 'Ingresso'], ['cronaca', 'Cronaca'], ['personaggi', 'Personaggi'], ['fazioni', 'Fazioni'],
  ['reliquie', 'Reliquie e armi'], ['bestiario', 'Bestiario'],
];
const nomeTavola = (slug: string) => { const s = slug.replace(/-/g, ' '); return s.charAt(0).toUpperCase() + s.slice(1); };

/** Gli autori con più tavole, in una frase: «Piranesi, Callot e Hollar». */
const AUTORI_TAVOLE = (() => {
  const conta = new Map<string, number>();
  for (const f of fonti) conta.set(f.autore, (conta.get(f.autore) ?? 0) + 1);
  const nomi = [...conta].filter(([n]) => !/ignoto|anonimo|sconosciuto/i.test(n)).sort((x, y) => y[1] - x[1]).slice(0, 8).map(([n]) => h(n));
  return nomi.length > 1 ? `${nomi.slice(0, -1).join(', ')} e ${nomi.at(-1)}` : nomi.join('');
})();

function fontiTavole(): string {
  const gruppi = COLLEZIONI.map(([k, titolo]) => {
    const righe = fonti.filter((f) => f.tavola.startsWith(`${k}/`)).map((f) => `<li><b>${h(nomeTavola(f.tavola.slice(k.length + 1)))}</b>:
      <em>${h(f.opera)}</em>, ${h(f.autore)}${f.data ? `, ${h(f.data)}` : ''}. ${a(f.url, 'Fonte')} (${h(f.licenza)})</li>`).join('');
    return righe ? `<h4>${titolo}</h4><ul class="fonti">${righe}</ul>` : '';
  }).join('');
  return `<details class="fonti-tavole"><summary>Le fonti delle ${fonti.length} tavole</summary>${gruppi}</details>`;
}

function crediti(): string {
  return `
  <header><span class="etichetta velo">Crediti</span><h2>Chi ha fatto cosa</h2></header>

  <h3>Ideazione, scrittura e sviluppo</h3>
  <p><b>Luca Pasini</b>. L'ambientazione di Ny'Zar, il Codex, il regolamento, la trama, i personaggi e i testi originali
  della cronaca <em>Il Peccato degli Uomini</em>, da cui nasce il gioco. Il codice e parte della stesura dei testi delle
  scene sono fatti con l'assistenza di Claude (Anthropic), su trama, personaggi e regole miei.</p>

  <h3>Musica</h3>
  <p>Colonna sonora di <b>${a('https://itch.io/profile/lisetteamago', 'Lisette Amago')}</b>.</p>
  <p>Ambienti sonori: <em>Fantasy Ambiences</em> di <b>Andrea Baroni</b>, Cyberleaf Studio
  (${a('https://andreabaroni.com', 'andreabaroni.com')}).</p>

  <h3>Illustrazioni</h3>
  <p>Le tavole sono incisioni, acqueforti e stampe d'epoca, dal Cinquecento all'Ottocento, tutte di pubblico dominio.
  Le ho scelte una per una, ritagliate e virate in seppia perché stessero insieme. Gli autori principali sono
  ${AUTORI_TAVOLE}. Ogni tavola, con l'opera da cui viene, il museo o la biblioteca che la conserva e la licenza, è
  nell'elenco qui sotto.</p>
  ${fontiTavole()}

  <h3>Icone e caratteri</h3>
  <p>Icone di Lorc, Delapouite e altri autori di ${a('https://game-icons.net', 'game-icons.net')}, con licenza
  ${a('https://creativecommons.org/licenses/by/3.0/', 'CC BY 3.0')}. Caratteri Cormorant Garamond, Lora e JetBrains Mono,
  da Google Fonts, con licenza SIL Open Font License.</p>

  <h3>Una nota sugli strumenti</h3>
  <p>Nel gioco non ci sono immagini né voci generate con l'intelligenza artificiale. Le tavole sono stampe d'epoca, le
  musiche e gli ambienti sonori sono opera dei loro autori, e il gioco non ha doppiaggio. L'intelligenza artificiale
  (Claude, di Anthropic) è servita per il codice e per parte della stesura dei testi, come scritto sopra.</p>`;
}

// ---------------------------------------------------------------- salvataggio

export interface DatiPaginaSalvataggio {
  archivio: StatoArchivio;
  personaggio?: { nome: string; salvatoAl: number }; // quello in gioco qui
  daImportare?: DatiSalvati; // file scelto, in attesa di conferma
  messaggio?: string; // per esempio un file che non è un salvataggio
  google: boolean; // l'accesso Google è configurato in questo build
}

const quando = (ms: number) => new Date(ms).toLocaleString('it-IT', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

export function corpoSalvataggio(p: DatiPaginaSalvataggio): string {
  const a = p.archivio;
  const righe: string[] = [];
  if (a.tipo === 'claude' && a.connesso) {
    righe.push(`<p>Il personaggio si salva nel tuo account Claude${a.chi ? `, a nome di <b>${h(a.chi)}</b>` : ''}: aprendo il gioco da un altro
    dispositivo con lo stesso account lo ritrovi dove l'hai lasciato.${a.ultimo ? ` Ultimo salvataggio nell'account: ${quando(a.ultimo)}.` : ''}</p>`);
  } else if (a.tipo === 'claude') {
    righe.push(`<p>Da questo accesso alla pagina il gioco non può salvare nel tuo account Claude, quindi il personaggio resta solo in
    questo browser. Per non perderlo scaricane una copia ogni tanto, qui sotto.</p>`);
  } else if (a.tipo === 'google' && a.connesso) {
    righe.push(`<p>Sei entrato con Google${a.chi ? ` come <b>${h(a.chi)}</b>` : ''}. Il personaggio si salva nel tuo account e lo
    ritrovi da qualunque dispositivo.${a.ultimo ? ` Ultimo salvataggio nell'account: ${quando(a.ultimo)}.` : ''}</p>
    <p><button type="button" class="link" data-az="esci-account">Esci dall'account</button></p>`);
  } else if (p.google) {
    righe.push(`<p>Il collegamento con il tuo account Google si è interrotto: per ora il personaggio è salvato solo in questo
    browser. Rientra con Google per riprendere a salvarlo nell'account.</p>
    <p><button type="button" class="bottone primario" data-az="entra-google">Entra con Google</button></p>`);
  } else {
    righe.push(`<p>Il personaggio è salvato in questo browser. Se cancelli i dati di navigazione o cambi dispositivo lo perdi, a
    meno di averne scaricato una copia.</p>`);
  }
  if (a.errore) righe.push(`<p class="avviso">${h(a.errore)}</p>`);
  if (p.messaggio) righe.push(`<p class="avviso">${h(p.messaggio)}</p>`);
  if (a.conflitto) {
    const r = a.conflitto.remoto;
    righe.push(`<section class="riquadro-salvataggio">
      <h3>Due personaggi</h3>
      <p>Nel tuo account c'è <b>${h(r.stato.nome)}</b>, salvato il ${quando(r.salvatoAl)}, e in questo browser
      ${p.personaggio ? `stai giocando <b>${h(p.personaggio.nome)}</b>` : 'non c\'è nessun personaggio'}. L'account ne tiene uno solo:
      scegli quale. Prima di scegliere puoi scaricare una copia di quello che hai qui.</p>
      <p><button type="button" class="bottone" data-az="tieni-account">Riprendi ${h(r.stato.nome)}</button>
      ${p.personaggio ? `<button type="button" class="bottone" data-az="tieni-browser">Tieni ${h(p.personaggio.nome)}</button>` : ''}</p>
    </section>`);
  }
  const imp = p.daImportare;
  righe.push(`<h3>Una copia su file</h3>
    <p>Il file contiene tutto il personaggio, diario compreso. Si ricarica da qui, anche su un altro dispositivo.</p>
    <p>${p.personaggio ? '<button type="button" class="bottone" data-az="esporta">Scarica il salvataggio</button>' : ''}
    <label class="bottone">Carica un salvataggio<input type="file" accept=".json,application/json" data-carica="salvataggio" hidden></label></p>
    ${imp ? `<p class="avviso">Nel file c'è <b>${h(imp.stato.nome)}</b>, salvato il ${quando(imp.salvatoAl)}.
      ${p.personaggio ? `Caricandolo, ${h(p.personaggio.nome)} viene sostituito.` : ''}
      <button type="button" class="bottone primario" data-az="conferma-import">Carica ${h(imp.stato.nome)}</button>
      <button type="button" class="link" data-az="annulla-import">Lascia stare</button></p>` : ''}`);
  return `<header><span class="etichetta velo">Salvataggio</span><h2>Dove resta il tuo personaggio</h2></header>
  ${righe.join('\n')}`;
}
