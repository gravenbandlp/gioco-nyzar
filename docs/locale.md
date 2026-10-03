# Lavorare in locale

Come rimettere in piedi il progetto sul tuo computer, lavorarci con Claude Code dal terminale di VS Code, fare il
doppiaggio e pubblicare il gioco con il login Google.

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
    voci/          gli mp3 del doppiaggio, nominati con l'id del pezzo
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
npm run voci                  # le voci da ../audio-nyzar/voci in public/audio/voce
npm run dev                   # il gioco su http://localhost:5173
npx vitest run                # i test (188)
```

Le tavole sono già nel repository (`public/tavole/`). Se ne aggiungi di nuove nei contenuti: `npm run tavole`, che le
prende da `../codex-nyzar/src/assets/tavole`.

Le voci della prima batch stanno nella cartella Drive che avevi condiviso: scaricale in `../audio-nyzar/voci` e lancia
`npm run voci`. I nomi con il prefisso esadecimale del caricamento (`edf885c2-...`) vanno bene, il prefisso si toglie
da solo.

## 4. Il copione del doppiaggio in locale

```sh
npm run copione:locale
```

Rigenera il copione dai contenuti e lo apre su http://localhost:5180. La spunta **Registrato** si salva nel
repository, in `doppiaggio/spunte.json`: committala, così il punto a cui sei arrivato resta nella storia del progetto e
Claude Code lo può leggere. I pezzi già importati nel gioco sono segnati **Nel gioco** da `doppiaggio/registrati.json`,
che `npm run voci` aggiorna da solo.

**Portare le spunte dall'Artifact.** Le spunte che hai dato nel copione pubblicato su claude.ai stanno nel tuo
browser. Apri quel copione, premi **Scarica le spunte**, poi nel copione locale premi **Carica spunte** e scegli il
file: si sommano a quelle che ci sono.

Il giro di lavoro è lo stesso di prima: copi il testo in ElevenLabs, scarichi l'mp3, lo rinomini con l'id, spunti.
A fine sessione metti i file in `../audio-nyzar/voci`, lanci `npm run voci` e fai il commit di
`doppiaggio/registrati.json` e `doppiaggio/spunte.json`. Se un testo cambia dopo la registrazione, il pezzo esce dal
gioco e compare fra i **da rifare**.

## 5. Pubblicare

Due strade, che possono convivere.

**Artifact su claude.ai.** È quella usata finora: salva nell'account claude.ai di chi gioca (tu e chi inviti per email
come Editor). Si pubblica da una conversazione su claude.ai con Claude, seguendo `docs/ripresa.md`, sezione
«Pubblicare»; Claude Code in locale non pubblica Artifact.

**Sito proprio su Cloudflare Pages, con il login Google.** Chiunque abbia il link può giocare e salvare nel proprio
account Google. Serve una volta sola la configurazione qui sotto, poi:

```sh
npm run pubblica:pages
```

che fa il build e carica `dist/` sul progetto Pages `gioco-nyzar` (la prima volta `npx wrangler login` ti chiede di
entrare in Cloudflare). L'audio non è in git, quindi si pubblica da questa macchina, dove `public/audio/` c'è.

## 6. Il login Google con Supabase

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
7. **Online.** Su Cloudflare, nel progetto Pages, non servono variabili: il build si fa qui con `.env.local` e
   `npm run pubblica:pages` carica il risultato.

Il gioco usa il flusso di login implicito di Supabase senza librerie esterne: il pulsante porta a Google, il ritorno
arriva con i gettoni nel frammento dell'indirizzo, il gioco li conserva nel browser e li rinnova da solo. Se un giorno
si vuole il flusso PKCE, si cambia `archivioGoogle` in `src/ui/salvataggi.ts`.

## 7. Quando qualcosa non va

- `npm run contenuti` dice dove e perché un YAML non va (id duplicati, requisiti su quality che non esistono, tavole
  mancanti).
- `npm run stile` elenca i tic di scrittura da togliere.
- Un test di percorso che scade per tempo su una macchina lenta: rilancialo da solo
  (`npx vitest run test/piste.test.ts`).
- Il gioco senza audio: manca `public/audio/` (passi 3 e 4).

## 8. Com'è configurato (3 ottobre 2026)

- Sito: https://gioco-nyzar.pages.dev, progetto Pages `gioco-nyzar` (creato con `wrangler pages project create --force`:
  wrangler 4.147 manda i progetti nuovi sui Workers, il `--force` è servito solo la prima volta).
- Supabase: progetto `gioco-nyzar` (ref `yvfxpusdtlutalqdigyz`, Irlanda), tabella `salvataggi` da `supabase/schema.sql`,
  provider Google attivo, Site URL il sito, Redirect URLs il sito e `http://localhost:5173/`.
- Google Cloud: progetto `gioco-nyzar`, client web «gioco-nyzar web», app OAuth pubblicata (in produzione, senza logo
  per non far scattare la verifica). Privacy e termini: https://gioco-nyzar.pages.dev/privacy (`public/privacy.html`).
- Su Windows i comandi `!` di Claude Code passano per bash: percorsi con le barre dritte (`/c/Users/...`).
