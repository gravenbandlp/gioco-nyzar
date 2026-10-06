# Salvataggi

Dal 6 ottobre 2026 si gioca sul sito, https://gioco-nyzar.pages.dev, e i personaggi stanno nell'account Google di chi
gioca: una riga per account nella tabella `salvataggi` di Supabase, con il personaggio in jsonb. L'Artifact su
claude.ai non si usa più. Il browser tiene solo una copia di riserva fra una scrittura e l'altra (`localStorage`,
chiave `gioco-nyzar/prototipo/v1`). Chiunque può scaricare una copia su file e ricaricarla (pagina «Salvataggio» dal
piè di pagina o dalla barra in alto). Codice: `src/ui/salvataggi.ts`, test: `test/salvataggi.test.ts`.

Per leggere un personaggio da fuori: con il sito aperto nel browser dell'account, il gettone è in `localStorage`
(`gioco-nyzar/sessione`, campo `access_token`); con quello e la chiave pubblica di `.env.local` si chiama
`<VITE_SUPABASE_URL>/rest/v1/salvataggi?select=dati`. La policy RLS fa vedere a ciascuno solo la propria riga.

Regole della sincronia:
- a ogni mossa la copia del browser si aggiorna subito, quella dell'account dopo qualche secondo di quiete e quando la
  pagina va in secondo piano;
- all'apertura, se nell'account c'è una versione più recente dello stesso personaggio, si riprende quella;
- tornando su una scheda rimasta aperta, o facendo una mossa da un dispositivo rimasto indietro, si riprende la copia più
  recente invece di sovrascriverla;
- se nell'account c'è un personaggio diverso da quello in gioco, sceglie il giocatore quale tenere.

## L'accesso Google

Serve il sito su Cloudflare Pages e il progetto Supabase gratuito. Nel gioco l'accesso Google compare solo se il build
ha `VITE_SUPABASE_URL` e `VITE_SUPABASE_CHIAVE` (in `.env.local`, vedi `.env.example`). I passi, dalla tabella
(`supabase/schema.sql`) al client OAuth e alla pubblicazione, sono in `docs/locale.md`, sezioni 5 e 6.

Il login usa il flusso implicito di Supabase senza librerie: il pulsante porta a Google, il ritorno arriva con i
gettoni nel frammento dell'indirizzo, il gioco li legge, li conserva nel browser (`gioco-nyzar/sessione`) e li
rinnova da solo.

## Solo con l'account, sul sito (3 ottobre 2026)

Sul sito con l'accesso Google configurato non si gioca senza account: la soglia (`src/ui/ingresso.ts`) mostra
«Entra con Google» finché l'account non è collegato, poi «Entra a Qir-Azel». La copia nel browser resta come riserva
fra una scrittura e l'altra, porta il nome dell'account a cui appartiene (`gioco-nyzar/proprietario`) e si toglie
uscendo dall'account; un altro account non se la ritrova (`stato.estraneo` in `Sincronia.collega`).
Senza le variabili `VITE_SUPABASE_*` il gioco resta giocabile nel browser, come in sviluppo.
