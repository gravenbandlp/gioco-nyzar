# Salvataggi

Il personaggio si salva sempre nel browser (`localStorage`, chiave `gioco-nyzar/prototipo/v1`). In più c'è una copia
nell'account, che serve a riprenderlo da un altro dispositivo, e chiunque può scaricarne una copia su file e
ricaricarla (pagina «Salvataggio» dal piè di pagina o dalla barra in alto). Codice: `src/ui/salvataggi.ts`, test:
`test/salvataggi.test.ts`.

## Dentro l'Artifact di claude.ai (già attivo)

Il gioco pubblicato come Artifact dichiara le capacità `db`, `user` (con lo scope `profile`, per mostrare il nome) e
`downloads`. Il personaggio sta nella base dati dell'Artifact, nello spazio privato di chi gioca
(`data/users/<id>/salvataggio`, con il diario in blocchi sotto `.../salvataggio/diario/b0`, `b1`...): nessun altro lo
vede, nemmeno il proprietario dell'Artifact.

Chi può salvare nell'account: il proprietario, e chi è invitato per email come Editor (finché l'Artifact non è condiviso
anche con un link pubblico). Chi apre il gioco da un link pubblico, o con accesso di sola lettura, gioca con il salvataggio
nel browser e il file; la pagina «Salvataggio» glielo dice.

Regole della sincronia:
- a ogni mossa la copia del browser si aggiorna subito, quella dell'account dopo qualche secondo di quiete e quando la
  pagina va in secondo piano;
- all'apertura, se nell'account c'è una versione più recente dello stesso personaggio, si riprende quella;
- tornando su una scheda rimasta aperta, o facendo una mossa da un dispositivo rimasto indietro, si riprende la copia più
  recente invece di sovrascriverla;
- se nell'account c'è un personaggio diverso da quello in gioco, sceglie il giocatore quale tenere.

## Fuori da claude.ai, con l'accesso Google (pronto, spento)

Serve un sito proprio (per esempio Cloudflare Pages, come il Codex) e un progetto Supabase gratuito. Nel gioco l'accesso
Google compare solo se il build ha le due variabili d'ambiente, e solo fuori da claude.ai.

1. **Supabase**: crea un progetto su supabase.com. In *SQL Editor* esegui `supabase/schema.sql`.
2. **Google**: su console.cloud.google.com crea un client OAuth di tipo *Applicazione web*. Come URI di reindirizzamento
   autorizzato metti `https://<progetto>.supabase.co/auth/v1/callback`.
3. **Supabase, Authentication → Providers → Google**: attivalo e incolla Client ID e Client secret del passo 2.
4. **Supabase, Authentication → URL Configuration**: in *Site URL* e in *Redirect URLs* metti l'indirizzo del gioco
   (per esempio `https://gioco-nyzar.pages.dev`).
5. **Build**: `VITE_SUPABASE_URL=https://<progetto>.supabase.co VITE_SUPABASE_CHIAVE=<chiave anon pubblica> npm run build`.
   La chiave *anon* è pubblica per costruzione: la protezione la fanno le regole della tabella (ognuno vede solo la sua
   riga). Non usare mai la chiave *service_role*.
6. **Pubblicazione**: `dist/index.html` più le cartelle di `dist/` (tavole e audio). L'audio non è in git, quindi il
   deploy va fatto da una copia che ha `public/audio/` (per esempio `npx wrangler pages deploy dist`).

Il login usa il flusso implicito di Supabase: il pulsante porta a Google, il ritorno arriva con i gettoni nel frammento
dell'indirizzo, il gioco li legge, li conserva nel browser (`gioco-nyzar/sessione`) e li rinnova da solo.
