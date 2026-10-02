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

Serve un sito proprio (Cloudflare Pages) e un progetto Supabase gratuito. Nel gioco l'accesso Google compare solo se il
build ha `VITE_SUPABASE_URL` e `VITE_SUPABASE_CHIAVE` (in `.env.local`, vedi `.env.example`), e solo fuori da claude.ai.
I passi, dalla tabella (`supabase/schema.sql`) al client OAuth e alla pubblicazione, sono in `docs/locale.md`,
sezioni 5 e 6.

Il login usa il flusso implicito di Supabase senza librerie: il pulsante porta a Google, il ritorno arriva con i
gettoni nel frammento dell'indirizzo, il gioco li legge, li conserva nel browser (`gioco-nyzar/sessione`) e li
rinnova da solo. Una riga per account nella tabella `salvataggi`, con il personaggio in jsonb.
