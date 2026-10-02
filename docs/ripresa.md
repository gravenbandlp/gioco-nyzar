# Ripresa del lavoro in una sessione nuova

Questo file dice a una sessione nuova (Claude o altri) tutto quello che serve per lavorare sul gioco senza lo
storico delle chat precedenti. Aggiornato il 2 ottobre 2026.

## Dove sta cosa
- Codice e contenuti: questo repository (github.com/gravenbandlp/gioco-nyzar, ramo `main`).
- Gioco pubblicato: Artifact https://claude.ai/artifact/My9PgxUPzocV6rBKTJNGrR (versione 45 al 2 ottobre).
- Copione del doppiaggio: Artifact https://claude.ai/artifact/U2Z8WyFVoyoJb1ukbSkbZN (versione 15).
- Canone del mondo: il Codex online (codex-nyzar.pages.dev), repository github.com/gravenbandlp/codex-nyzar.
  **Non pubblicare mai il ramo `rinomina-nomi` del Codex**: il Codex online è quello che i giocatori usano da un anno.
- Fuori dal repository (Luca li ha come file): lo schedario del Codex (`nyzar-schedario-codex.md`) e il verbale del
  Capitolo I (`verbale-capitolo-I-rinominato.md`). Servono solo per scrivere storie nuove: chiedili se servono.
- Audio: `public/audio/` è escluso da git (pesa troppo). Musiche e ambienti sono già dentro l'Artifact del gioco e
  restano lì a ogni ripubblicazione. Le voci nuove arrivano da Luca come mp3 nominati con l'id del pezzo.

## Comandi
`npm install`, poi:
- `npm run contenuti`: valida gli YAML di `contenuti/` (deve dire "Contenuti validi").
- `npm run stile`: controlla le regole di `docs/stile-dei-testi.md` (deve dare 0 segnalazioni).
- `npx vitest run`: test (167 al 2 ottobre).
- `npm run build`: contenuti + tsc + build in `dist/index.html` (file unico).
- `npm run copione`: rigenera il copione del doppiaggio (`doppiaggio/copione-pagina.html`).
- `npm run voci -- <cartella>`: importa le voci registrate (mp3 nominati `<id>.mp3`) in `public/audio/voce/` e
  annota l'impronta in `doppiaggio/registrati.json`; se un testo è cambiato dopo la registrazione lo segnala.

## Pubblicare
1. `npm run build`.
2. `python3 scripts/strumenti/prepara-artifact.py <cartella-temporanea>`: scrive `gioco-nyzar.html` e la mappa delle
   tavole nuove.
3. Artifact publish con `url` del gioco e `file_path` del file preparato; le tavole e gli audio nuovi vanno passati in
   `files` (percorso pubblicato → `dist/...`). Gli altri file già pubblicati restano.
4. Copione: `npm run copione`, poi publish di `doppiaggio/copione-pagina.html` sull'url del copione.

Per provare il gioco in un browser: `scripts/strumenti/servi.py` (server dentro lo stesso processo di Playwright);
in Playwright lo stato si cambia da `window.nyzar.stato` e poi si ridisegna con un clic su una scheda.

## Regole che valgono sempre
- Lingua: italiano. Testi secondo `docs/stile-dei-testi.md`, senza tic da IA (terne, "non X ma Y", due punti a
  effetto, chiuse a sentenza).
- **Nessuna cifra di denaro o percentuale nella prosa**: i numeri si ribilanciano, i testi restano generici.
- Le boss battle sono boss battle: le vie per sconfiggere un boss sono Difficili, i fallimenti costano.
- Commit firmati `git -c user.name="gravenbandlp" -c user.email="gravenbandlp@gmail.com" commit`.
- **Id del doppiaggio stabili**: gli esiti hanno id `<scena>__<n>-<ramo>`, con n la posizione dell'opzione. Un'opzione
  nuova in una scena già scritta va **in fondo** all'elenco, mai in mezzo, altrimenti gli esiti successivi cambiano
  id e le registrazioni non combaciano più.
- La risorsa delle azioni si chiama **rintocchi** (fino al 2 ottobre 2026 erano candele, troppo legate a Fallen
  London): nell'interfaccia è una campana. Nella prosa le candele restano oggetti veri, mai la risorsa.
- **Spedizioni**: una stanza superata non ricompare nella stessa visita (`src/motore/spedizioni.ts`), e l'ordine delle
  stanze (avvicinamento, ingresso, interno, piano di sopra) si dà con fasce di requisiti sulla profondità, documentate
  in testa a ogni file. Una stanza scritta come luogo o oggetto unico va messa nella sua fascia, mai lasciata libera.
  Gli oggetti unici dati da stanze ripetibili si proteggono con `quando: [oggetto.<id> == 0]`.
  `test/spedizioni-percorribili.test.ts` controlla che ogni spedizione arrivi al cuore con le sole stanze mostrate.
- Le varianti di stato del mondo sulle opzioni usano `quando` (l'opzione non compare) o requisiti su piste e flag
  (il motore le nasconde se chiuse); i requisiti su monete, merci, abilità e reputazione mostrano l'opzione chiusa.

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
`contenuti/economia/`), rintocchi a 20 con ricarica piena a fine storia principale, revisione finale delle
incongruenze. A progetto: lo strato 3 dell'economia (`docs/progetto-reperti.md`).

Da fare:
- **Doppiaggio**: Luca registra seguendo il copione e manda gli mp3; si importano con `npm run voci` e si ripubblica
  il gioco passando i file nuovi di `public/audio/voce/` in `files`.
- **Account con Google** per salvare i personaggi: oggi il salvataggio è nel `localStorage` del browser
  (`src/ui/main.ts`, chiave `gioco-nyzar/prototipo/v1`). Prima di scegliere un backend (Firebase, Supabase o
  simili), verificare se le capacità degli Artifact (stato per utente, chi sta guardando) bastano a salvare i
  personaggi senza un login esterno, dato che il gioco gira dentro un Artifact.
