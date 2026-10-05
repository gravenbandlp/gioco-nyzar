# Ripresa del lavoro in una sessione nuova

Questo file dice a una sessione nuova (Claude o altri) tutto quello che serve per lavorare sul gioco senza lo
storico delle chat precedenti. Aggiornato il 2 ottobre 2026. Il quadro generale (scopo, stato, checklist) è in
`docs/progetto.md`; il lavoro in locale con Claude Code in `docs/locale.md`.

## Dove sta cosa
- Codice e contenuti: questo repository (github.com/gravenbandlp/gioco-nyzar, ramo `main`).
- Gioco pubblicato: Artifact https://claude.ai/artifact/My9PgxUPzocV6rBKTJNGrR (versione 48 al 2 ottobre).
- Canone del mondo: il Codex online (codex-nyzar.pages.dev), repository github.com/gravenbandlp/codex-nyzar.
  **Non pubblicare mai il ramo `rinomina-nomi` del Codex**: il Codex online è quello che i giocatori usano da un anno.
- In locale le cartelle stanno accanto al repository: `../codex-nyzar`, `../audio-nyzar/{musica,ambienti}`.
- Fuori dal repository (Luca li ha come file): lo schedario del Codex (`nyzar-schedario-codex.md`) e il verbale del
  Capitolo I (`verbale-capitolo-I-rinominato.md`). Servono solo per scrivere storie nuove: chiedili se servono.
- Audio: `public/audio/` è escluso da git (pesa troppo). Musiche e ambienti sono già dentro l'Artifact del gioco e
  restano lì a ogni ripubblicazione.

## Comandi
`npm install`, poi:
- `npm run contenuti`: valida gli YAML di `contenuti/` (deve dire "Contenuti validi").
- `npm run stile`: controlla le regole di `docs/stile-dei-testi.md` (deve dare 0 segnalazioni).
- `npx vitest run`: test (188 al 2 ottobre).
- `npm run build`: contenuti + tsc + build in `dist/index.html` (file unico).
- `npm run pubblica:pages`: build e pubblicazione su Cloudflare Pages (`docs/locale.md`).

## Pubblicare
Come Artifact su claude.ai (da una conversazione con Claude, che ha lo strumento Artifact; Claude Code in locale non
ce l'ha). Per il sito proprio vedi `docs/locale.md`.
1. `npm run build`.
2. `python3 scripts/strumenti/prepara-artifact.py <cartella-temporanea>`: scrive `gioco-nyzar.html` e la mappa delle
   tavole nuove.
3. Artifact publish con `url` del gioco e `file_path` del file preparato; le tavole e gli audio nuovi vanno passati in
   `files` (percorso pubblicato → `dist/...`). Gli altri file già pubblicati restano. Le capacità (`db`, `user` con
   scope `profile`, `downloads`) restano quelle dichiarate: non passare `capabilities` se non cambiano.

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
- **Rintocchi**: 40 al massimo, ne torna uno ogni 10 minuti e basta. Niente ricariche a fine storia o alle tappe, niente
  pulsante di prova: è una scelta di Luca (3 ottobre 2026), non reintrodurle.
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
- Le varianti di stato del mondo sulle opzioni usano `quando` (l'opzione non compare) o requisiti su piste e flag
  (il motore le nasconde se chiuse); i requisiti su monete, merci, abilità e reputazione mostrano l'opzione chiusa.

## Lo Zekar (5 ottobre 2026)
Il gioco di carte del Grifone di Ferro, aperto con `rep.grifone >= 2`. Regole e IA in `src/motore/zekar.ts` (le scelte
dove il regolamento di Luca lascia spazio sono in testa al file), il tavolo in `src/ui/zekar.ts`, i contenuti in
`contenuti/citta/zekar.yaml`, i test in `test/zekar.test.ts`. Un'opzione con `zekar: <avversario>` e gli esiti
`vittoria`/`sconfitta` apre una partita, come `combattimento`; ogni partita costa un rintocco. Gli avversari stanno
nella raccolta `zekar:` con le quattro laterali, la `soglia` a cui stanno e la `mira` per le laterali. La percentuale
sull'opzione viene da una simulazione con le laterali dell'ultima partita del giocatore (`s.zekarLaterali`).
Torneo: `zekar.torneo` conta i tavoli vinti; la reputazione del torneo si ferma a 4 come quella della sala.

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

## Stato del lavoro
Il Capitolo I è chiuso e rivisto (vedi `docs/piano-capitolo-1.md`). Fatti di recente: economia (strati 1 e 2,
`contenuti/economia/`), rintocchi a 40 che tornano solo col tempo, revisione finale delle
incongruenze. A progetto: lo strato 3 dell'economia (`docs/progetto-reperti.md`).

Da fare:
- **Salvataggi** (`docs/salvataggi.md`): nell'Artifact il personaggio si salva nell'account claude.ai (base dati
  dell'Artifact, spazio privato di chi gioca); salvano il proprietario e chi è invitato per email come Editor, gli altri
  restano al browser e al file. Fuori da claude.ai c'è l'accesso Google con Supabase, pronto ma spento: per accenderlo
  servono il progetto Supabase, il client OAuth Google e un sito proprio (passi in `docs/salvataggi.md`).
- **Glossario**: i personaggi nuovi delle carte della città (Ilde Sarrocchi, Ugo Bracco, Clelia Vennari, Berengario
  Lusardi, Fosco Ambri, ecc., elencati in testa ai file `contenuti/citta/carte-*.yaml`) non hanno ancora una voce.
