# Lavorare in locale

Come rimettere in piedi il progetto sul tuo computer, lavorarci con Claude Code dal terminale di VS Code e
pubblicare il gioco con il login Google.

## 1. Cosa serve installato

- **Git** e **Node.js 22** (LTS). Controllo: `node -v` deve dire v22 o più.
- **ffmpeg**, solo per importare musica e ambienti (`npm run audio`). Windows: `winget install ffmpeg`;
  macOS: `brew install ffmpeg`.
- **VS Code** con **Claude Code** nel terminale integrato. Se non l'hai già: `npm install -g @anthropic-ai/claude-code`,
  poi `claude` dentro la cartella del repository. Claude Code legge da solo `CLAUDE.md`, che lo manda a
  `docs/progetto.md` e `docs/ripresa.md`.

## 2. Le cartelle

Tutto sta in una cartella di lavoro, con i tre pezzi uno accanto all'altro (gli script li cercano così):

```
ny-zar/
  gioco-nyzar/     questo repository
  codex-nyzar/     il Codex (serve per le tavole e per scrivere nuovi frammenti)
  audio-nyzar/     fuori da git, per le licenze
    musica/        le tracce di Lisette Amago, con il nome originale del file
    ambienti/      gli ambienti di Andrea Baroni, con il nome originale
```

```sh
mkdir ny-zar && cd ny-zar
git clone https://github.com/gravenbandlp/gioco-nyzar.git
git clone https://github.com/gravenbandlp/codex-nyzar.git
cd gioco-nyzar
npm install
```

I nomi dei file sorgente di musica e ambienti sono in `contenuti/audio.yaml` (campo `sorgente`).

## 3. Primo avvio

```sh
npm run audio                 # musica e ambienti da ../audio-nyzar in public/audio (serve ffmpeg)
npm run dev                   # il gioco su http://localhost:5173
npx vitest run                # i test (188)
```

Le tavole sono già nel repository (`public/tavole/`): stampe d'epoca di pubblico dominio virate in seppia, con le
fonti in `src/dati/fonti-tavole.json`; come farne di nuove è nel README.

Il doppiaggio è stato tolto il 4 ottobre 2026: le voci generate stanno in `../audio-nyzar/voce-dal-gioco`, copione
e regia in `../doppiaggio-archivio`, il codice nella storia git.

## 4. Pubblicare

Si pubblica solo sul sito. L'Artifact su claude.ai, usato fino all'inizio di ottobre 2026, non si aggiorna più.

**Sito su https://ludus.nyzar.net, con il login Google.** Chiunque abbia il link può giocare e salvare nel proprio
account Google. Serve una volta sola la configurazione qui sotto, poi:

```sh
npm run pubblica
```

che fa il build e carica `dist/` sul Worker `gioco-nyzar` (`wrangler.jsonc`, solo file statici), che risponde su
`ludus.nyzar.net`. La prima volta `npx wrangler login` ti chiede di entrare in Cloudflare. L'audio non è in git, quindi
si pubblica da questa macchina, dove `public/audio/` c'è.

Il vecchio progetto Pages `gioco-nyzar` contiene solo `rinvio-pages/`: `gioco-nyzar.pages.dev` rimanda a
`ludus.nyzar.net` con lo stesso percorso. Si ricarica con `npm run rinvio:pages`, e non serve rifarlo a ogni
pubblicazione.

Il 21 ottobre 2026 il gioco su pages.dev non partiva più: i pezzi dei contenuti e le tavole si piantavano a metà.
Succedeva a tutto quello che stava sul piano free di Cloudflare (pages.dev, workers.dev, anche ludus.nyzar.net),
mentre i servizi di Cloudflare stessa andavano. Il dominio e il Worker da soli non hanno cambiato niente. L'ha risolto
il piano Pro sulla zona `nyzar.net`, che vale per tutti i suoi sottodomini. `src/dati/scarica.ts` riscarica comunque un
pezzo fermo da 10 secondi.

## 5. Il login Google con Supabase

Il codice è già nel gioco (`src/ui/salvataggi.ts`, prove in `test/salvataggi.test.ts`, dettagli in
`docs/salvataggi.md`). Si accende quando il build trova le due variabili `VITE_SUPABASE_URL` e
`VITE_SUPABASE_CHIAVE`, e solo fuori da claude.ai.

1. **Progetto Supabase.** Su supabase.com crea un progetto (il piano gratuito basta). In *SQL Editor* incolla ed
   esegui `supabase/schema.sql`: crea la tabella `salvataggi` (una riga per account) e la regola per cui ognuno legge
   e scrive solo la propria.
2. **Le chiavi.** In *Project Settings → API* (o *API Keys*) prendi l'URL del progetto e la chiave pubblica (*anon* o
   *publishable*). Copia `.env.example` in `.env.local` e incollale lì. Quella chiave è pubblica per costruzione; la
   chiave *service_role* / *secret* non va mai nel gioco né in git.
3. **Client OAuth Google.** Su console.cloud.google.com, *Google Auth Platform*:
   - *Branding*: nome dell'app («Ny'Zar · Cronache della Città Bassa»), email di supporto.
   - *Audience*: utenti esterni; poi **pubblica l'app** (con l'app in prova possono entrare solo gli account di prova
     che aggiungi a mano). Per email e profilo non serve la verifica di Google.
   - *Data access*: gli scope `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`.
   - *Clients → Create client → Web application*. Origini JavaScript autorizzate: `http://localhost:5173` e
     l'indirizzo del sito (per esempio `https://gioco-nyzar.pages.dev`). URI di reindirizzamento autorizzato: quello
     che Supabase mostra nella pagina del provider Google, cioè `https://<progetto>.supabase.co/auth/v1/callback`.
4. **Provider Google in Supabase.** *Authentication → Sign In / Providers → Google*: attivalo e incolla Client ID e
   Client secret del passo 3.
5. **Indirizzi di ritorno.** *Authentication → URL Configuration*: *Site URL* = l'indirizzo del sito; in *Redirect URLs*
   aggiungi anche `http://localhost:5173/` per provare in locale.
6. **Prova in locale.** `npm run dev`, apri il gioco, pagina **Salvataggio** dal piè di pagina: c'è **Entra con
   Google**. Dopo il login la stessa pagina dice con che account sei entrato, e in Supabase, *Table Editor →
   salvataggi*, compare la tua riga dopo la prima mossa.
7. **Online.** Su Cloudflare, nel Worker, non servono variabili: il build si fa qui con
   `.env.local` e `npm run pubblica` carica il risultato.

Il gioco usa il flusso di login implicito di Supabase senza librerie esterne: il pulsante porta a Google, il ritorno
arriva con i gettoni nel frammento dell'indirizzo, il gioco li conserva nel browser e li rinnova da solo. Se un giorno
si vuole il flusso PKCE, si cambia `archivioGoogle` in `src/ui/salvataggi.ts`.

## 6. Quando qualcosa non va

- `npm run contenuti` dice dove e perché un YAML non va (id duplicati, requisiti su quality che non esistono, tavole
  mancanti).
- `npm run stile` elenca i tic di scrittura da togliere.
- Un test di percorso che scade per tempo su una macchina lenta: rilancialo da solo
  (`npx vitest run test/piste.test.ts`).
- Il gioco senza audio: manca `public/audio/` (passi 3 e 4).

## 7. Com'è configurato (3 ottobre 2026)

- Sito: https://ludus.nyzar.net dal 21 ottobre 2026, Worker `gioco-nyzar` (`wrangler.jsonc`, anche su
  https://gioco-nyzar.gravenbandlp.workers.dev). Il dominio `nyzar.net` è registrato su Cloudflare, nello stesso
  account, sul piano Pro, e terrà anche `codex.` ed `editor.`.
- Il sito di prima, https://gioco-nyzar.pages.dev, progetto Pages `gioco-nyzar` (creato con
  `wrangler pages project create --force`: wrangler 4.147 manda i progetti nuovi sui Workers, il `--force` è servito
  solo la prima volta). Dal 21 ottobre 2026 rimanda a ludus.nyzar.net (`rinvio-pages/`).
- Supabase: progetto `gioco-nyzar` (ref `yvfxpusdtlutalqdigyz`, Irlanda), tabella `salvataggi` da `supabase/schema.sql`,
  provider Google attivo, Site URL `https://ludus.nyzar.net`, Redirect URLs `https://ludus.nyzar.net/` e
  `http://localhost:5173/`. Il Site URL serve solo se manca l'indirizzo di ritorno, che il gioco passa sempre.
- Google Cloud: progetto `gioco-nyzar`, client web «gioco-nyzar web» (origini `http://localhost:5173` e
  `https://ludus.nyzar.net`, reindirizzamento al callback di Supabase), app OAuth pubblicata (in produzione, senza logo
  per non far scattare la verifica). Nel branding, dal 21 ottobre 2026: home https://ludus.nyzar.net, privacy e
  termini https://ludus.nyzar.net/privacy (`public/privacy.html`), domini autorizzati `nyzar.net` e quello di
  Supabase. Il ritorno da Google va a Supabase, quindi il login non dipende dal
  dominio del sito. Il branding non viene mostrato agli utenti finché l'app non è verificata.
- Su Windows i comandi `!` di Claude Code passano per bash: percorsi con le barre dritte (`/c/Users/...`).
