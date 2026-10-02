// Le pagine informative aperte dal piè di pagina: aiuto e domande frequenti, termini (origini e fonti
// d'ispirazione), crediti. Testo statico, scritto qui perché non fa parte della narrativa.
import { RINTOCCHI_MAX, MINUTI_PER_RINTOCCO, MANO_MAX, CODA_MAX, MINUTI_PER_CARTA, MAX_NEGATIVA } from '../motore/regole';

export type PaginaInfo = 'aiuto' | 'termini' | 'crediti';
export const PAGINE_INFO: PaginaInfo[] = ['aiuto', 'termini', 'crediti'];

declare const __VERSIONE__: string;
export const VERSIONE: string = typeof __VERSIONE__ === 'string' ? __VERSIONE__ : 'sviluppo';
const ANNO = 2026;

const a = (href: string, testo: string) => `<a href="${href}" target="_blank" rel="noopener">${testo}</a>`;

export function piede(): string {
  return `<footer class="piede-pagina">
    <span>© ${ANNO} Luca Pasini · Ny'Zar</span>
    <span class="versione">Versione ${VERSIONE}</span>
    <nav aria-label="Informazioni">
      <button type="button" class="link" data-az="pagina" data-id="aiuto">Aiuto</button>
      <button type="button" class="link" data-az="pagina" data-id="termini">Termini</button>
      <button type="button" class="link" data-az="pagina" data-id="crediti">Crediti</button>
    </nav>
  </footer>`;
}

export function paginaInfo(id: PaginaInfo): string {
  const corpo = id === 'aiuto' ? aiuto() : id === 'termini' ? termini() : crediti();
  return `<article class="pagina-info">
    <button type="button" class="bottone indietro" data-az="chiudi-pagina">← Torna al gioco</button>
    ${corpo}
  </article>`;
}

function domanda(d: string, r: string): string {
  return `<details class="faq"><summary>${d}</summary><div>${r}</div></details>`;
}

function aiuto(): string {
  return `
  <header><span class="etichetta velo">Aiuto</span><h2>Come si gioca</h2></header>
  <p>Ny'Zar · Qir-Azel è un gioco narrativo a <em>storylet</em>: brevi scene che si aprono e si chiudono in base a quello
  che il tuo personaggio ha fatto, sa e possiede. Non c'è una mappa da esplorare a passi: scegli dove andare e cosa
  fare, e il mondo tiene il conto delle tue scelte.</p>

  <h3>I rintocchi</h3>
  <p>Qir-Azel scandisce le giornate a campane, e il tuo tempo si conta a rintocchi. Quasi ogni azione costa un rintocco,
  alcune due o tre, alcune niente. Ne hai al massimo ${RINTOCCHI_MAX} e ne torna uno ogni ${MINUTI_PER_RINTOCCO} minuti,
  anche a gioco chiuso. Quando concludi una delle storie principali (quelle elencate in «Le tue storie», non le storie
  dei luoghi) tornano tutti. Quando sono finiti puoi ancora leggere il diario, cambiare
  equipaggiamento e fare compere: per andare avanti con la storia aspetti che tornino. Il ritmo è voluto, perché Ny'Zar si
  gioca a sessioni brevi, tornando più volte al giorno.</p>

  <h3>Quartieri, luoghi e storie</h3>
  <p>La città è divisa in quartieri (Città Bassa, Ponti Sospesi, Quartieri Alti) e ti sposti dalla scheda <b>Mappa</b>;
  alcuni ponti chiedono una gabella, i Quartieri Alti un invito. Ogni quartiere ha i suoi <b>luoghi</b>, come la locanda o
  la biblioteca. Dentro trovi le azioni che puoi ripetere quanto vuoi per guadagnare monete, esperienza e
  informazioni, e le botteghe. In cima alla pagina, sotto <b>La tua storia</b>, ci sono le scene che fanno avanzare la
  trama, con il luogo in cui si svolgono.</p>
  <p>Alcune storie portano fuori città, in una <b>spedizione</b>: una foresta, una palude, un isolotto. Lì le stanze
  compaiono poche alla volta, la profondità sale a ogni stanza superata e, raggiunta la soglia, si apre il cuore del
  posto. Puoi tornare indietro quando vuoi, ma la profondità si azzera.</p>

  <h3>Le occasioni</h3>
  <p>Il mazzo delle occasioni si riempie da solo, una carta ogni ${MINUTI_PER_CARTA} minuti fino a ${CODA_MAX}. Peschi in mano
  fino a ${MANO_MAX} carte, con gli incontri e i guai che capitano per strada. Una carta legata a un quartiere si gioca solo lì; quelle
  che non ti interessano le scarti con la ×.</p>

  <h3>Prove e crescita</h3>
  <p>Hai tre attributi (Fisico, Sociale, Mentale) e diverse abilità per ciascuno. In una prova tiri tanti dadi quanti sono
  l'attributo più l'abilità, e ogni dado da 4 in su è un successo: la difficoltà dice quanti successi servono. Prima di
  scegliere vedi sempre la percentuale di riuscita. Ogni prova, riuscita o fallita, dà esperienza all'abilità usata, e di
  più quando l'esito era incerto: le abilità crescono usandole, e con loro gli attributi.</p>

  <h3>Le statistiche negative</h3>
  <p>Ferite, Scandalo, Sospetto, Tormento e Contaminazione salgono con i rischi che corri. Si abbassano con il riposo, le
  cure, i favori giusti. Se una arriva a ${MAX_NEGATIVA} scatta una <b>crisi</b>: finisci in convalescenza, in cella, ai
  margini della città o nel delirio, e ne esci solo giocando la storia che ti ci ha portato.</p>

  <h3>Combattimento</h3>
  <p>Gli scontri si giocano a round. A ogni round scegli se attaccare, intimidire, curarti con un consumabile, lanciare un
  incantesimo o usare un reperto dei Precursori. Prima di cominciare vedi la probabilità di vittoria: se è bassa, di
  solito esiste un'altra strada.</p>

  <h3>Diario, nomi e audio</h3>
  <p>Sotto ogni esito c'è <b>Annota nel diario</b>: le pagine che conservi restano nella scheda Diario, da rileggere.
  I nomi sottolineati nei testi aprono una scheda con quello che sa chiunque in città. Il pulsante con la nota musicale,
  in basso a destra, regola musica e ambiente o li spegne.</p>

  <h3>Domande frequenti</h3>
  ${domanda('Dove vengono salvati i progressi?', `<p>Nel browser che usi, in automatico dopo ogni azione. Se cancelli i dati del sito o giochi in una finestra
    anonima, il personaggio va perso. Su un altro dispositivo o browser si ricomincia da capo.</p>`)}
  ${domanda('Posso perdere il personaggio?', `<p>No, nessuna scelta lo uccide. Le crisi ti costano tempo e qualche conseguenza, poi si torna in città.
    Il personaggio si perde solo se lo cancelli tu con «Nuovo personaggio».</p>`)}
  ${domanda('Una scena dice che mi manca qualcosa. Che faccio?', `<p>Sotto l'opzione bloccata c'è scritto cosa serve: una quality, un oggetto, un livello d'abilità, un luogo.
    Quasi sempre c'è anche un'altra opzione che costa di più o rischia di più, ma è aperta.</p>`)}
  ${domanda('Ho finito le cose da fare nella storia.', `<p>Le storie si aprono man mano: alcune chiedono un'abilità più alta, un invito, un oggetto, o che sia
    passato un altro passo della trama. Le azioni ripetibili nei luoghi servono proprio a prepararsi.</p>`)}
  ${domanda('Conviene ripetere la stessa azione?', `<p>Sì, ed è normale: le azioni ripetibili esistono per allenarsi e mettere da parte monete. Le abilità a zero
    si allenano con le azioni più facili, che in città ci sono per tutte.</p>`)}
  ${domanda('Che differenza c\'è fra la Storia e le Occasioni?', `<p>La Storia è la trama, sempre disponibile nel posto giusto. Le occasioni sono il caso: arrivano da sole, a volte
    portano ricompense rare, a volte guai, e puoi scartarle.</p>`)}
  ${domanda('Il gioco ha un finale?', `<p>Per ora c'è il primo capitolo, ancora in lavorazione. Il gioco segue la cronaca di Ny'Zar, che ne ha tre.</p>`)}
  ${domanda('L\'audio non parte.', `<p>I browser bloccano l'audio finché non tocchi la pagina: basta un clic qualsiasi. Se ancora non senti nulla,
    controlla il pulsante in basso a destra.</p>`)}`;
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
  <p>Ny'Zar, i suoi testi e le sue tavole sono © ${ANNO} Luca Pasini, tutti i diritti riservati. Fallen London è un marchio di
  Failbetter Games e Disco Elysium di ZA/UM: questo progetto non è affiliato a nessuna delle due. Musiche, ambienti sonori e
  icone appartengono ai rispettivi autori, elencati nei crediti, e sono usati secondo le loro licenze.</p>
  <p>Il gioco salva i progressi solo nel tuo browser. Non raccoglie dati personali, non usa cookie di profilazione e non
  contiene pubblicità.</p>`;
}

function crediti(): string {
  return `
  <header><span class="etichetta velo">Crediti</span><h2>Chi ha fatto cosa</h2></header>

  <h3>Ideazione, scrittura e sviluppo</h3>
  <p><b>Luca Pasini</b>. L'ambientazione di Ny'Zar, la cronaca da cui nasce la trama, il Codex, il regolamento, i testi
  delle scene e il browser game. Il codice del browser game è realizzato con l'assistenza di Claude (Anthropic).</p>

  <h3>Musica</h3>
  <p>Colonna sonora di <b>${a('https://itch.io/profile/lisetteamago', 'Lisette Amago')}</b>.</p>
  <p>Ambienti sonori: <em>Fantasy Ambiences</em> di <b>Andrea Baroni</b>, Cyberleaf Studio
  (${a('https://andreabaroni.com', 'andreabaroni.com')}).</p>

  <h3>Voci</h3>
  <p>Il doppiaggio è realizzato con ${a('https://elevenlabs.io', 'ElevenLabs')}. Le voci sono di persone reali, che le hanno
  registrate e messe a disposizione per la sintesi vocale: ogni utilizzo riconosce loro un compenso, quindi anche così il
  lavoro degli artisti viene sostenuto.</p>

  <h3>Illustrazioni</h3>
  <p>Le tavole del Codex e del gioco sono generate con Midjourney, a partire da descrizioni e scelte mie.</p>

  <h3>Icone e caratteri</h3>
  <p>Icone di Lorc, Delapouite e altri autori di ${a('https://game-icons.net', 'game-icons.net')}, con licenza
  ${a('https://creativecommons.org/licenses/by/3.0/', 'CC BY 3.0')}. Caratteri Cormorant Garamond, Lora e JetBrains Mono,
  da Google Fonts, con licenza SIL Open Font License.</p>

  <h3>Una nota sugli strumenti</h3>
  <p>Ny'Zar è un progetto personale, fatto con le mie risorse e per passione, e non ci guadagno nulla. Per questo
  illustrazioni e voci passano da strumenti di intelligenza artificiale. Se un giorno le cose cambiassero, pagherò
  volentieri illustratori e doppiatori.</p>`;
}
