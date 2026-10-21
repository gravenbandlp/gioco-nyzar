# Ripresa del lavoro in una sessione nuova

Questo file dice a una sessione nuova (Claude o altri) tutto quello che serve per lavorare sul gioco senza lo
storico delle chat precedenti. Aggiornato il 2 ottobre 2026. Il quadro generale (scopo, stato, checklist) è in
`docs/progetto.md`; il lavoro in locale con Claude Code in `docs/locale.md`.

## Dove sta cosa
- Codice e contenuti: questo repository (github.com/gravenbandlp/gioco-nyzar, ramo `main`).
- Gioco pubblicato: https://ludus.nyzar.net (Worker Cloudflare, salvataggi negli account Google su Supabase). Il
  vecchio https://gioco-nyzar.pages.dev rimanda lì.
  L'Artifact su claude.ai (https://claude.ai/artifact/My9PgxUPzocV6rBKTJNGrR) è fermo dal 6 ottobre e non si aggiorna.
- Canone del mondo: il Codex online (codex.nyzar.net, prima codex-nyzar.pages.dev), repository github.com/gravenbandlp/codex-nyzar.
  **Non pubblicare mai il ramo `rinomina-nomi` del Codex**: il Codex online è quello che i giocatori usano da un anno.
- In locale le cartelle stanno accanto al repository: `../codex-nyzar`, `../audio-nyzar/{musica,ambienti}`.
- Fuori dal repository (Luca li ha come file): lo schedario del Codex (`nyzar-schedario-codex.md`) e il verbale del
  Capitolo I (`verbale-capitolo-I-rinominato.md`). Servono solo per scrivere storie nuove: chiedili se servono.
- Audio: `public/audio/` è escluso da git (pesa troppo) e si importa con `npm run audio`: per questo il sito si
  pubblica da questa macchina.

## Comandi
`npm install`, poi:
- `npm run contenuti`: valida gli YAML di `contenuti/` (deve dire "Contenuti validi").
- `npm run stile`: controlla le regole di `docs/stile-dei-testi.md` (deve dare 0 segnalazioni).
- `npx vitest run`: test (188 al 2 ottobre).
- `npm run build`: contenuti + tsc + build in `dist/index.html` (file unico).
- `npm run pubblica`: build e pubblicazione sul Worker di ludus.nyzar.net (`docs/locale.md`).

## Pubblicare
`npm run pubblica` da questa macchina: build e caricamento di `dist/` sul Worker `gioco-nyzar` (ludus.nyzar.net)
(`docs/locale.md`, sezione 4). Prima i controlli (`npm run contenuti`, `npm run stile`, `npx vitest run`), il commit
e il push su `main`.

Per provare il gioco in un browser: `scripts/strumenti/servi.py` (server dentro lo stesso processo di Playwright);
in Playwright lo stato si cambia da `window.nyzar.stato` e poi si ridisegna con un clic su una scheda.

## Regole che valgono sempre
- Lingua: italiano. Testi secondo `docs/stile-dei-testi.md`, senza tic da IA (terne, "non X ma Y", due punti a
  effetto, chiuse a sentenza).
- **Nessuna cifra di denaro o percentuale nella prosa**: i numeri si ribilanciano, i testi restano generici.
- Le boss battle sono boss battle: le vie per sconfiggere un boss sono Difficili, i fallimenti costano.
- Commit firmati `git -c user.name="gravenbandlp" -c user.email="gravenbandlp@gmail.com" commit`.
- **Niente IA nelle immagini e nell'audio**: le tavole sono stampe d'epoca di pubblico dominio virate in seppia, con
  la fonte in `src/dati/fonti-tavole.json` (la pagina Crediti la mostra). Il doppiaggio è stato tolto il 4 ottobre 2026.
- La risorsa delle azioni si chiama **rintocchi** (fino al 2 ottobre 2026 erano candele, troppo legate a Fallen
  London): nell'interfaccia è una campana. Nella prosa le candele restano oggetti veri, mai la risorsa.
- **Rintocchi**: 40 al massimo, ne torna uno ogni 10 minuti. Niente ricariche a fine storia o alle tappe, niente
  pulsante di prova: è una scelta di Luca (3 ottobre 2026), non reintrodurle. L'unica eccezione, decisa da Luca il
  17 ottobre 2026, sono le carte di ristoro del mazzo (effetto `rintocchi`, vedi "Il mazzo delle occasioni").
- **Origini**: le opzioni legate all'origine stanno in fondo alla scena con `quando: [origine.<id> >= 1]` e portano allo
  stesso stato della via normale che sostituiscono (stessi avanzamenti, flag, `vai`/`segue`).
- **Frammenti del Codex** (colonna destra): in `contenuti/frammenti.yaml` e in `contenuti/codex/` (uno per quartiere,
  la Superficie con le spedizioni, il mondo senza area), 163 al 2 ottobre. Solo contenuto `pubblica` del Codex, con i
  nomi del gioco al posto di quelli del Codex; i fatti che la trama cambia hanno `requisiti` sulle piste.
- **Mazzi dei quartieri**: almeno venti carte ciascuno (`test/mazzi-citta.test.ts`), con le carte nuove in
  `contenuti/citta/carte-<quartiere>.yaml`.
- **Spedizioni**: una stanza superata non ricompare nella stessa visita (`src/motore/spedizioni.ts`), e l'ordine delle
  stanze (avvicinamento, ingresso, interno, piano di sopra) si dà con fasce di requisiti sulla profondità, documentate
  in testa a ogni file. Una stanza scritta come luogo o oggetto unico va messa nella sua fascia, mai lasciata libera.
  Gli oggetti unici dati da stanze ripetibili si proteggono con `quando: [oggetto.<id> == 0]`.
  `test/spedizioni-percorribili.test.ts` controlla che ogni spedizione arrivi al cuore con le sole stanze mostrate.
- **Statistiche negative** (10 ottobre 2026, su richiesta di Luca): nelle storie, nei seguiti e nelle carte ogni
  fallimento dà almeno ½ di una negativa (Scandalo se c'è un testimone, Sospetto se c'è qualcosa di losco, Tormento,
  Contaminazione vicino alla Marea), scelta sul testo; le ripetibili e gli allenamenti restano senza. I malus di
  Scandalo, Sospetto, Tormento e Contaminazione da ½ e 1 sono saliti di ½. Le Ferite non sono state toccate.
- **Domande nei seguiti**: un'opzione a costo 0 che non chiude il seguito deve avere `segue: <il seguito stesso>`,
  sennò il seguito si perde e torna in cima la scena che lo apriva. Dopo un esito, «Riprova» compare solo se la prova
  è fallita; una scena che resta aperta si riprende con «Prosegui», un'azione ripetibile con «Di nuovo».
- Le varianti di stato del mondo sulle opzioni usano `quando` (l'opzione non compare) o requisiti su piste e flag
  (il motore le nasconde se chiuse); i requisiti su monete, merci, abilità e reputazione mostrano l'opzione chiusa.

## Il mazzo delle occasioni (17 ottobre 2026)
Proposta approvata da Luca: 81 carte nuove, i premi finali delle catene e cinque cambi al motore.
- Il mazzo si riempie fino a 10 carte (`CODA_MAX`), non più 6.
- `rarita` sulle carte (comune, insolita, rara): pesi 3, 2, 1 nella pesca (`PESI_RARITA` in `src/motore/regole.ts`).
- `inevitabile: true`: appena pescata la carta si apre da sola (`crisiAttiva`, dopo prologo e crisi), non si scarta, non
  ha «Non ora» e tutte le sue opzioni costano 0 rintocchi. Dopo un'inevitabile ne passano `TREGUA_INEVITABILI` pescate
  prima della successiva (quality `tregua.inevitabili`). Ogni agguato chiede la sua negativa principale sotto 6.
- Effetto `rintocchi`, col tetto: solo per le carte di ristoro, che ne danno il netto più uno (l'opzione costa 1).
- Tesori: un oggetto magico nuovo dietro una prova Difficile (città) o Molto difficile (Superficie). In città il grado
  +1 chiede `pista.dama-argento >= 6` e il +2 `pista.capomozzo >= 10`, sulla Superficie `pista.arena >= 5`.
- Mini-Cronache: catene di carte con `<catena>.passo` e `<catena>.fine`, raccolte in `contenuti/cronache.yaml`. Ogni
  chiusura paga 50 lyssan a passo in città e 70 in Superficie (`test/occasioni-cronache.test.ts`).
- File: `contenuti/citta/occasioni-*.yaml`, `contenuti/superficie/occasioni-*.yaml`. Test: `test/occasioni.test.ts`.

## Lo Zekar (5 ottobre 2026)
Il gioco di carte del Grifone di Ferro, aperto con `rep.grifone >= 2`. Regole e IA in `src/motore/zekar.ts` (le scelte
dove il regolamento di Luca lascia spazio sono in testa al file), il tavolo in `src/ui/zekar.ts`, i contenuti in
`contenuti/citta/zekar.yaml`, i test in `test/zekar.test.ts`. Un'opzione con `zekar: <avversario>` e gli esiti
`vittoria`/`sconfitta` apre una partita, come `combattimento`; ogni partita costa un rintocco. Gli avversari stanno
nella raccolta `zekar:` con le quattro laterali, la `soglia` a cui stanno e la `mira` per le laterali. La percentuale
sull'opzione viene da una simulazione con le laterali dell'ultima partita del giocatore (`s.zekarLaterali`).
Torneo: `zekar.torneo` conta i tavoli vinti; la reputazione del torneo si ferma a 4 come quella della sala.

## Le quest di fazione (ottobre 2026)
Nove fazioni a cui ci si unisce (Velo, Caserma, Gilda, Raschiatori, Circolo, Accademia, Scuri, Maison, Consiglio con
i Castaldi), ognuna con una quest da 15 passi in `contenuti/fazioni/<id>/`. Malgrani e Tarvelin restano famiglie.
- La quest è una pista, `fazione.<id>`: la scena del passo N chiede `fazione.<id> == N-1` e la chiude con +1.
- **Si aprono dopo Capomozzo** (Luca, 8 ottobre 2026): il primo passo di ogni quest chiede anche `pista.capomozzo >= 10`,
  perché le ricompense dei primi gradi, rivendute, valevano più di mille lyssan nei primi giorni di gioco. I seguiti
  del primo passo non lo chiedono, così chi li ha già aperti non resta bloccato.
- I gradi sono cinque, ai passi 3, 6, 9, 12 e 15, e stanno nella raccolta `fazioni:` con il nome e la ricompensa da
  mostrare: la scheda del personaggio ha la sezione «Fazioni» con il grado, la quest sta nelle Cronache. Ogni passo di grado porta la reputazione almeno a 2, 4,
  6, 8, 10 con l'esito `almeno`, che alza una quality fino a una soglia senza mai abbassarla.
- Ricompense: un oggetto, un servizio o un incantesimo a ogni grado; al grado 5 un oggetto unico di grado 4.
- Quality condivise in `contenuti/fazioni/comuni.yaml`: `bivio.legge` (Caserma e Scuri insieme fino all'ottavo passo,
  poi si sceglie), `crepuscolo.indizi` (il Crepuscolo non si nomina mai nel Capitolo I), `segreto.ettore`,
  `seggio.malgrani`.
- Le catene brevi di prima sono diventate i primi passi delle quest; i loro flag restano.
- Test: `test/fazioni.test.ts` (ogni quest arriva al passo 15 con ogni origine, a storia principale finita).

## La Superficie Fratturata
Il quarto hub, fuori città, aperto da subito e senza gabella (`contenuti/superficie/`, 2 ottobre 2026). Viene dalla
tabella degli incontri casuali della cronaca. L'area ha `fuori: true`, quindi le carte "ovunque" della città lì non arrivano.
- `area.yaml`: l'area, i luoghi (la baracca di Oda Krell, le terrazze di basalto, e la riva del Torvessa, la pianura del sud
  e la strada del nord, che compaiono con le storie), i beni dei reperti e del banco, le flag condivise, nemici e scontri.
- `carte-1/2/3.yaml`: gli incontri del mazzo. `ricorrenti.yaml`: Mercante della Memoria, Bambino senza impronte, Cavaliere
  della Marea, Frattura che respira, che apre il Nodo. `villaggio.yaml` e `nodo.yaml`: le due spedizioni dell'hub.
- `reperti.yaml`: Oda Krell, aprire i reperti, montare i congegni, riparare, i compratori in città, la sua bottega.
- `ripartenze.yaml`: da lì si riparte per Capomozzo e per gli scavi. Le ritirate dalle spedizioni fuori città portano alla
  Superficie, e la strada per la Roccia e quella per la Palude partono da lì.
- Test: `test/superficie.test.ts`.

## La Superficie dopo l'Arena (10 ottobre 2026)
Piano, canone fissato e id in `docs/piano-superficie.md`. Tutto si apre con `pista.arena >= 5`.
- `contenuti/luoghi-neri/tracce.yaml`: le quality condivise (`traccia.<luogo>` 0–3, `misura.<luogo>`, `dono.<villaggio>`),
  l'aggancio in città (`gente-di-fuori`), «Battere la Superficie» (una direzione per volta, un luogo per direzione) e
  le nove carte di voci. Test: `test/scoperte.test.ts`.
- `contenuti/villaggi/<villaggio>/`: Ghoran, Laresh, Tuarmir e Pannion, luoghi della Superficie con una quest da 15
  passi (sono fazioni: compaiono nella sezione «La Superficie» delle Cronache e in `FAZIONI` di `test/fazioni-percorsi.ts`). Il passo 3 dà le tracce
  dei due luoghi neri vicini, il passo 15 il dono.
- `contenuti/luoghi-neri/<luogo>.yaml`: le nove spedizioni dei luoghi neri; l'ingresso chiede tre tracce, il cuore dà la
  misura una volta sola, poi c'è un secondo cuore ripetibile.
- `contenuti/luoghi-neri/campana/`: la Campana Sepolta, quattro strati in catena (`campana.strato`) aperti dalle nove misure, con
  il Campanaro in tre fasi e gli unici oggetti di grado 5. Test: `test/campana.test.ts`.
- `scripts/simula-fine.ts`: probabilità di vittoria per un combattente di fine capitolo e uno di fine contenuti
  (`npx tsx scripts/simula-fine.ts <prefisso dello scontro>`).
- I test di percorso sono sincroni e lunghi: `test/cedi.ts` (in `setupFiles`) lascia una pausa dopo ogni test, le
  piste lunghe stanno in `test/piste-lunghe.test.ts` e le quest di fazione hanno un test per origine.

## Le Cronache e l'ordine delle storie (11 ottobre 2026)
- La scheda **Cronache** (`cronache` in `src/ui/viste.ts`) mostra le storie lunghe cominciate e non ancora chiuse, in
  quattro sezioni: le storie di Qir-Azel, le fazioni della città, la Superficie, i luoghi della città. Per ognuna: a che
  punto sei, il prossimo passo e dove si gioca, che cosa lo ferma, le spedizioni aperte o con il cuore vinto (quelle
  ancora da trovare si contano soltanto). Le concluse escono dall'elenco (decisione di Luca). La scheda Personaggio
  tiene solo i gradi delle fazioni.
- `contenuti/cronache.yaml`: le `sezioni` (ordine e appartenenza di ogni serie) e le `raccolte`, le storie lunghe senza
  pista che il motore non ricava da solo: i luoghi neri con la Campana (15 passi: nove misure, l'annuncio, tre strati,
  la scelta, l'epilogo), le quattro catene della Superficie e la casa nel vicolo. Una raccolta prende gli storylet che
  toccano le sue quality (`chiavi`, per prefisso) e conta come passi fatti i requisiti di `passi`.
- `src/motore/serie.ts`: le serie hanno un terzo tipo, `raccolta`; `prossimoPasso`, `iniziata`, le spedizioni di ogni
  serie (`serieDi(c).spedizioni`, dalla storia degli storylet dentro o dell'ingresso) e `statoSpedizione` (cuore vinto
  quando la condizione che il cuore chiede e poi cambia è superata, come `misura.x == 0`).
- Nelle pagine del quartiere e del luogo «La tua storia» è raccolta per sezione, una riga per storia lunga e le altre
  scene della stessa storia in una tendina; in fondo le storie singole. Le cose da fare si dividono per fazione o storia.
- Tre luoghi nuovi raccolgono le scene sciolte: la Locanda di Ilka (`luoghi.yaml`), il Maniero Castaldi, sede del
  Consiglio (`fazioni/consiglio/quest.yaml`), e I luoghi neri sulla Superficie, con «Battere la Superficie» e i nove
  ingressi (`luoghi-neri/tracce.yaml`). I passi delle fazioni che si giocano per strada restano senza luogo.
- `contenuti/scoperte/` e `contenuti/campana/` sono diventate `contenuti/luoghi-neri/` e `contenuti/luoghi-neri/campana/`.
- `npm run mappa-storie` rigenera `docs/storie.md`, la mappa di tutte le storie (file, passi, spedizioni, dipendenze,
  oggetti). Va rilanciato dopo ogni cambio alle storie.
- `test/cronache.test.ts`: ogni serie sta in una sezione sola, ogni scena da giocare una volta appartiene a una storia
  lunga o all'elenco `STORIE_SINGOLE` del test, ogni spedizione appartiene a una storia (tranne il Villaggio storto).
  Una scena nuova fuori da ogni storia fa fallire il test: o la si lega a una storia o la si aggiunge all'elenco.

## Combattimento (8 ottobre 2026)
- Uno scontro dà il triplo dei PE di una prova (`PE_COMBATTIMENTO` in `src/motore/regole.ts`), all'arma e alla Magia.
- I nemici di Acciaio, Rovine, Arena, Capomozzo e delle quest di fazione sono stati ritarati per un combattente di fine
  capitolo con lo Spadone di Uzgreth (Fisico 3, Armi da mischia 3, cuoio): boss al 50-65%, gregari quasi sempre vinti
  ma con PF persi, nessuno più a danno 1. La leva principale è la riduzione, che gli incantesimi ignorano, per non
  lasciare senza speranza il mago. I nemici dell'inizio (prologo, Città Bassa, Sepolcro, Registro, Foresta, Pelle,
  Superficie) sono rimasti com'erano.
- Le quest di fazione riusano nemici dell'inizio: lo scontro li rinforza con `rinforzo: { pf, danno, riduzione, attacco,
  solo }` (`src/motore/contenuto.ts`), senza toccare il nemico negli altri scontri.

## L'addestramento (12 ottobre 2026)
Le abilità crescono con i PE delle prove (`SOGLIE_PE` in `src/motore/regole.ts`, un quarto va all'attributo). Due
vie di addestramento, tutte e due con `marchio: addestramento` (l'etichetta «Addestramento» sulla riga):
- **di base**, gratis (`contenuti/allenamento.yaml`): prove Molto facili su una sola abilità, da 0 a 2;
- **a pagamento, alla Skyrim** (`contenuti/maestri.yaml`, decisione di Luca): nove maestri, uno per bottega o
  fazione, e ogni abilità ha un maestro solo. Una lezione costa un rintocco e 200, 400 o 800 monete ai livelli 2, 3 e 4,
  non ha prova e dà 10 PE (`pe:` nell'esito). Senza tetto al numero di lezioni. Il livello sta in `quando`, monete e
  reputazione in `requisiti` (4 per i livelli 2 e 3, 8 per il 4; alla Fucina `rep.botteghe` 3 e 6). Gli esiti sono
  scritti per maestro e livello e si riusano con le ancore YAML. Il Bosco di Velthar (Aelion) e la Casa dei Nodi
  (Lira Demos) si aprono con le quest del Circolo e della Gilda. Test: `test/maestri.test.ts`.

## Il ritratto in pixel art (13 ottobre 2026)
Ogni personaggio ha un ritratto in pixel art, disegnato tutto da codice (nessuna immagine, nessuna IA): `src/ui/ritratto/`.
- `motore.ts`: la figura in 48×72 pixel (84 con un compagno). Ogni pezzo è una forma di righe di pixel con un materiale;
  il tono viene dalla luce fredda in alto a sinistra, ogni forma getta un'ombra a destra e sotto, il contorno prende il
  colore del materiale. `tavolozza.ts`: le rampe di quattro toni dei materiali, delle pelli e delle chiome.
- `aspetti.ts`: che aspetto ha ogni oggetto. Armi, armature e scudi comuni prendono la forma della base; gli unici e
  tutti gli accessori (compagni compresi: cavalli, la lupa, il puma) hanno una voce scritta dalla loro descrizione.
  **Un oggetto indossabile nuovo va aggiunto qui**: `test/ritratto.test.ts` fallisce se manca, o se non si vede.
- Le pose (14 ottobre 2026): dritta a mani vuote; in guardia con un'arma a una mano o uno scudo; con le due mani
  sull'arma da mischia «Due mani»; in mira con arco e balestra. La decide `posaDi` in `aspetti.ts` dalle regole
  dell'arma, e il test controlla che la forma disegnata sia coerente. La figura si disegna sempre dritta su strati
  (fondo, corpo, arma, scudo); per le altre pose le braccia si staccano e si rimontano a pezzi fra spalla, gomito e
  mano (`tratto`), le gambe si aprono (`divarica`), l'arma si disegna appesa alla mano e si porta nella posa ribaltata
  e inclinata a scaletta (`presa`). Armature e accessori sulle braccia vanno con loro: non serve una versione per
  posa. Arco e balestra in mira si disegnano a parte (`arcoInMira`, `balestraInMira`).
- Il corpo femminile (`aspetto.corpo`): `restringi` stringe le spalle già vestite e avvicina le braccia; volto con
  mento più stretto e labbra, niente barba. Senza `corpo` la figura è maschile (i salvataggi di prima).
- Le mutazioni visibili (occhi luminescenti, vene di luce, unghie di metallo, pelle increspata) si vedono sul ritratto.
- L'aspetto (corpo, pelle, capelli, barba e loro colori) sta in `Stato.aspetto` e si sceglie nella creazione (passo II).
  Un personaggio senza aspetto valido (i salvataggi di prima) passa da «Che aspetto ha…» prima di riprendere; dalla
  scheda Personaggio si cambia con «Cambia aspetto».
- `tela.ts` disegna i `<canvas data-figura>` dopo ogni render, a ingrandimento intero, con il bagliore delle luci e un
  battito di palpebre ogni tanto (fermo con il movimento ridotto).
- `npx tsx scripts/strumenti/ritratti.ts <cartella> [armi|armature|scudi|accessori|pose|bestie|teste|una] [scala]` fa
  le tavole di prova in PNG; `RITAGLIO=x0,x1,y0,y1` guarda da vicino una parte della figura, `CORPO=femminile` usa la
  figura femminile, e `una` disegna le figure di `ARMI=spadone:cotta-di-maglia,arco-lungo` (con SCUDO e ACCESSORI).

## Il genere nei testi (14 ottobre 2026)
Con il corpo femminile anche la prosa è al femminile. I contenuti portano le due forme fra graffe, `sei arrivat{o|a}`
(le regole di scrittura in `docs/stile-dei-testi.md`), e `src/motore/genere.ts` le risolve: `applicaGenere` riscrive
una volta sola i testi dei contenuti per il genere del personaggio, ed è chiamata all'inizio di `render()` in
`main.ts` (nella creazione con il corpo scelto). Senza `aspetto.corpo` i testi restano al maschile. La prima passata,
il 14 ottobre, ha segnato circa 1.400 forme comuni (participi e aggettivi dopo i verbi, da bambino/da ragazzo, i
titoli degli esiti, i vocativi dei PNG); le forme meno comuni si segnano quando si incontrano. Test: `test/genere.test.ts`.

## Il gioco sul telefono (8 ottobre 2026)
Sotto gli 860px l'interfaccia segue Fallen London sul telefono (`src/ui/viste.ts`, sezione «telefono»; in fondo a
`src/ui/stile.css`): una riga di stato fissa in cima (rintocchi, monete, tasto dell'audio), il racconto a tutta
larghezza, la barra fissa in basso con Storia, Scheda, Averi, Bazar, Mappa e Altro. «Altro» è un foglio che sale dal
basso (diario, salvataggio, regolamento, crediti, termini, frammento del Codex, nuovo personaggio), aperto e chiuso
da `mostraAltro` in `main.ts` senza ridisegnare la pagina. Le colonne laterali, la testata e il piè di pagina lì non
si vedono; il fondale dell'area resta solo sull'elenco delle storie. Nelle scene la tavola sta accanto al titolo
(`.scena-titoli` diventa `display: contents`). `.pannello` è un container: le liste lunghe si adattano alla larghezza
del racconto con `@container`. I contenitori a griglia che ospitano pulsanti lunghi hanno `minmax(0, 1fr)`, sennò un
`.bottone` (che non va a capo) allarga la pagina oltre lo schermo.

## Stato del lavoro
Il Capitolo I è chiuso e rivisto (vedi `docs/piano-capitolo-1.md`). Fatti di recente: economia (strati 1 e 2,
`contenuti/economia/`), rintocchi a 40 (a 30 dal 12 al 16 ottobre) che tornano solo col tempo, revisione finale delle
incongruenze. A progetto: lo strato 3 dell'economia (`docs/progetto-reperti.md`).

Da fare:
- **Glossario**: i personaggi nuovi delle carte della città (Ilde Sarrocchi, Ugo Bracco, Clelia Vennari, Berengario
  Lusardi, Fosco Ambri, ecc., elencati in testa ai file `contenuti/citta/carte-*.yaml`) non hanno ancora una voce.
