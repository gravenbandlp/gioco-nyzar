# Ny'Zar · gioco a storylet — istruzioni per Claude Code

Gioco narrativo a storylet nel browser, ambientato a Qir-Azel (setting techno-fantasy Ny'Zar di Luca Pasini), sul
modello di Fallen London. TypeScript + Vite, contenuti in YAML validati con zod, test con vitest.

## Prima di tutto
1. Leggi `docs/progetto.md`: scopo, stato, cosa è fatto, cosa manca, la checklist.
2. Leggi `docs/ripresa.md`: le regole operative che valgono sempre.
3. Per scrivere testi leggi `docs/stile-dei-testi.md`. Per i sistemi: `docs/regolamento-*.md`, `docs/salvataggi.md`.
4. Il lavoro in locale (cartelle, audio, copione, pubblicazione) è in `docs/locale.md`.

## Comandi
- `npm run dev`: gioco su http://localhost:5173 (rigenera prima i contenuti).
- `npm run contenuti`: valida gli YAML di `contenuti/` (deve dire "Contenuti validi").
- `npm run stile`: controllo dei tic di scrittura (deve dare 0 segnalazioni).
- `npx vitest run`: tutti i test (188 al 2 ottobre 2026). Alcuni test di percorso durano qualche secondo.
- `npm run build`: build in `dist/` (un solo `index.html` più tavole e audio).
- `npm run copione`: rigenera il copione del doppiaggio; `npm run copione:locale` lo apre su http://localhost:5180
  con le spunte salvate in `doppiaggio/spunte.json`.
- `npm run voci -- <cartella>`: importa le voci registrate (mp3 nominati con l'id del pezzo).
- `npm run audio`, `npm run tavole`: importano musica/ambienti e tavole dalle cartelle accanto al repository.

## Regole che non si rompono
- Lingua: italiano, in codice, commenti, contenuti e messaggi di commit.
- Prosa: niente tic da IA (terne, "non X ma Y", due punti a effetto, chiuse a sentenza). Nessuna cifra di denaro o
  percentuale nella prosa. Seconda persona, presente.
- Nomi: il Codex usa ancora nomi presi da Rise of the Runelords; il gioco li ha rinominati. Nei contenuti valgono solo
  i nomi del gioco (`contenuti/glossario/`). Mai Koruvus, Stoot, Sette Denti, Boscogratto, Kaijitsu, Scarnetti,
  Deverin, Sandpoint e simili.
- Id del doppiaggio stabili: un'opzione nuova in una scena esistente va **in fondo**, mai in mezzo. Non riscrivere
  testi già registrati senza dirlo (`npm run doppiaggio` segnala quelli da rifare).
- Le varianti di trama vanno in `quando` (opzione nascosta); i requisiti su monete, merci, abilità e reputazione in
  `requisiti` (opzione visibile ma chiusa).
- Le boss battle restano boss battle: le vie per batterle sono Difficili e fallire costa.
- Dopo ogni modifica ai contenuti: `npm run contenuti`, `npm run stile`, `npx vitest run`.
- Commit firmati `git -c user.name="gravenbandlp" -c user.email="gravenbandlp@gmail.com" commit`, messaggi in italiano.
- Il Codex (`../codex-nyzar`) si legge e basta. Non pubblicare mai il ramo `rinomina-nomi` del Codex.
- Non committare `public/audio/`, `.env*` con chiavi, né file sciolti di musica e ambienti (licenze).

## Come lavora Luca
Risposte dirette, a livello di meccanismo, senza rassicurazioni né piani d'azione non richiesti. Rispondi alla
domanda fatta e fermati. Se una scelta è sua (canone, nomi nuovi, scope), chiedi prima di scrivere molto.
