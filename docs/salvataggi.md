# Salvataggi

Dal 7 ottobre 2026 c'è un solo salvataggio: il personaggio sta nell'account Google di chi gioca, una riga per account
nella tabella `salvataggi` di Supabase (personaggio in jsonb, colonna `dati`). Si gioca solo sul sito,
https://gioco-nyzar.pages.dev, e solo dopo essere entrati con Google. Nel browser non resta nessuna copia del
personaggio: solo i gettoni del login (`gioco-nyzar/sessione`). Niente Artifact di claude.ai, niente file da scaricare
o caricare. Codice: `src/ui/salvataggi.ts`, test: `test/salvataggi.test.ts`.

Le vecchie chiavi del browser (`gioco-nyzar/prototipo/v1`, `gioco-nyzar/proprietario`) vengono cancellate all'avvio.

## Versioni

Ogni salvataggio porta `dati.rev`, un intero che sale di uno a ogni scrittura. Un dispositivo scrive solo se
nell'account c'è ancora la versione da cui è partito: un solo `PATCH .../salvataggi?utente=eq.<id>&dati->>rev=eq.<base>`,
atomico in Postgres. Se non aggiorna niente, un altro dispositivo ha salvato nel frattempo: si rilegge la copia
dell'account e si riprende da lì, e le mosse fatte sul dispositivo rimasto indietro si perdono. L'orologio dei
dispositivi non decide niente (`salvatoAl` è solo informativo).

Base 0 vuol dire riga assente o salvataggio di prima delle versioni: si prova `dati->>rev=is.null`, poi l'inserimento
(409 se un altro dispositivo l'ha appena creata).

Regole della sincronia (`Sincronia`):
- all'avvio si legge il personaggio dall'account, e la soglia resta chiusa finché non arriva;
- ogni mossa si scrive dopo un secondo e mezzo di quiete, e subito quando la pagina va in secondo piano;
- al ritorno sulla pagina, al ritorno del fuoco sulla finestra e ogni 20 secondi si confronta la versione dell'account;
  se è cambiata si riprende quella;
- senza rete la mossa resta in attesa e si riprova ogni 10 secondi; con la sessione scaduta si torna alla soglia
  «Entra con Google».

Per leggere un personaggio da fuori: con il sito aperto nel browser dell'account (meglio la pagina `/privacy`, che non
avvia il gioco), il gettone è in `localStorage` (`gioco-nyzar/sessione`, campo `access_token`); con quello e la chiave
pubblica si chiama `<VITE_SUPABASE_URL>/rest/v1/salvataggi?select=dati`. La policy RLS fa vedere a ciascuno solo la
propria riga.

## L'accesso Google

Serve il sito su Cloudflare Pages e il progetto Supabase gratuito, con `VITE_SUPABASE_URL` e `VITE_SUPABASE_CHIAVE`
nel build (in `.env.local`, vedi `.env.example`). I passi, dalla tabella (`supabase/schema.sql`) al client OAuth e alla
pubblicazione, sono in `docs/locale.md`, sezioni 5 e 6.

Il login usa il flusso implicito di Supabase senza librerie: il pulsante porta a Google, il ritorno arriva con i
gettoni nel frammento dell'indirizzo, il gioco li legge, li conserva nel browser e li rinnova da solo (se un'altra
scheda li ha già rinnovati usa i suoi).
