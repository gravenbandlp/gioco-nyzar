# Ny'Zar · Cronache della Città Bassa — il file di progetto

Aggiornato al 2 ottobre 2026. Da tenere aggiornato a ogni blocco di lavoro: stato, cose fatte, checklist.
Le regole operative di ogni giorno stanno in `docs/ripresa.md`, il lavoro in locale in `docs/locale.md`.

## Cos'è

Un gioco narrativo a scelte nel browser, sul modello di Fallen London (storylet, quality, azioni che si ricaricano
col tempo, mazzo di occasioni, luoghi dentro i quartieri), ambientato a Qir-Azel, la città sull'orlo della
Cicatrice del Mondo nel setting techno-fantasy Ny'Zar. Rispetto a Fallen London aggiunge un sistema da gioco di
ruolo: attributi e abilità, prove a dadi, combattimento a round, magia, oggetti e reperti dei Precursori.

La trama viene dal Capitolo I della cronaca D&D *Il Peccato degli Uomini* che Luca masterizza, con nomi, fazioni e
luoghi presi da Rise of the Runelords rinominati. Il protagonista è uno solo, nuovo, e arriva da una delle otto
origini. Tono della prosa: seconda persona, concreta, con un po' di Disco Elysium nella voce interiore.

È un progetto personale, fatto per passione e senza guadagno: artwork con Midjourney (dalle tavole del Codex),
voci con ElevenLabs, musiche di Lisette Amago e ambienti di Andrea Baroni (Cyberleaf).

## Scope

**Dentro (Capitolo I, fatto):** Qir-Azel con tre quartieri e la Superficie Fratturata intorno; dieci storie
principali; la città viva (ogni luogo con attività, servizio, reputazione e storie a gradini); economia a tre
strati; spedizioni; crisi e aree di penalità; doppiaggio delle scene di storia; salvataggio con account.

**Fuori, per ora:**
- Capitolo II: la discesa nella Cicatrice, i villaggi come zone vere, il Bosco di Velthar con la Via del Respiro.
- Il videogioco companion in Godot (RPG 2D a turni), messo in pausa a fine settembre 2026.
- Il TTRPG proprietario: il gioco a storylet ne anticipa il regolamento, ma il manuale è un'altra cosa.
- Multigiocatore, monetizzazione, app native.

## Dove siamo (2 ottobre 2026)

| Cosa | Quanto |
|---|---|
| Storylet | 613 (385 fissi, 139 carte, 62 seguiti, 9 prologhi, 5 crisi, 13 di oggetti) |
| Aree | 23: 3 quartieri, la Superficie, 4 aree di penalità, 15 spedizioni |
| Storie principali | Dama d'Argento (11 passi), Sepolcro violato (7), Caccia di Corin (6), Promessa dell'Arpia (2), Registro del custode (5), Cinque tribù (4), Acciaio e Ira (8), Capomozzo (10), Arena (5), Sotto la pelle (7) |
| Quality | 428 |
| Scontri e nemici | 64 scontri, 67 nemici |
| Oggetti, incantesimi, mutazioni | 76, 25, 8 |
| Luoghi, negozi | 29, 10 |
| Glossario (tooltip) | 198 voci |
| Frammenti del Codex | 163 |
| Testo | circa 472.000 parole |
| Audio | 10 musiche, 17 ambienti, 110 voci su 1608 pezzi del copione |
| Test | 188 |

Pubblicato come Artifact su claude.ai (gioco alla versione 48, copione alla 18); link in `docs/ripresa.md`.

**Tempo di gioco stimato.** Solo le storie principali: 2–3 ore a chi scorre, 7–9 a chi legge, 10–12 a chi ascolta
le voci. Tutto il gioco: 7–9, 21–29 e 29–40 ore rispettivamente; un completista aggiunge 3–5 ore per origine e 6–10
per la Superficie. A calendario, con i rintocchi: da circa cinque giorni per chi gioca ogni volta che la campana è
piena a circa un mese e una settimana per chi gioca una volta al giorno.

## Com'è fatto il gioco

- **Rintocchi** (la campana): 20 al massimo, uno ogni 10 minuti; tornano tutti quando si conclude una storia
  principale, metà alle tappe intermedie delle storie lunghe (`ricariche` sulle piste in `contenuti/quality.yaml`).
- **Mazzo di occasioni**: mano da 3, coda da 6, una carta ogni 10 minuti; ogni area ha il suo mazzo, le carte
  "ovunque" non arrivano fuori città né in spedizione.
- **Personaggio**: tre attributi (Fisico, Sociale, Mentale) e 24 abilità; crescono con i PE delle prove.
  Otto origini, ognuna con prologo proprio e opzioni proprie nelle scene (88 opzioni di origine).
- **Prove e combattimento**: prove a dadi con difficoltà nominate; combattimento a round con attacco, intimidire,
  cure, incantesimi e reperti (`src/motore/combattimento.ts`). Magia in quattro tradizioni (`docs/regolamento-magia.md`).
- **Negative e crisi**: Ferite, Scandalo, Sospetto, Tormento, Contaminazione; oltre soglia scatta una crisi che porta
  in un'area di penalità (prigione, ostracismo, convalescenza, delirio) o alle mutazioni della Marea
  (`docs/regolamento-crisi.md`).
- **Spedizioni**: aree con profondità e una soglia per il cuore; le stanze superate non tornano nella stessa visita,
  l'ordine si dà con fasce di profondità; ritirata sempre possibile.
- **Città viva**: ogni luogo ha un'attività ripetibile, un servizio, una reputazione propria e storie a gradini 2/4/6.
- **Economia**: strato 1 e 2 (Informazioni, Cristalli, Reliquie che salgono di scalino, compratori per famiglia, il
  Mercato delle Ombre, la casa nel Vicolo dei Cardatori); strato 3 in forma ridotta (reperti sigillati aperti da Oda
  Krell, parti in quattro famiglie e tre gradi, il banco, cinque compratori, riparazioni).
- **Superficie Fratturata**: il quarto hub, aperto da subito, con carte, catene ricorrenti (Mercante della Memoria,
  Bambino senza impronte, Cavaliere della Marea, Frattura che respira), due spedizioni proprie (Villaggio storto,
  Nodo dei Precursori) e le partenze per le spedizioni fuori città.
- **Doppiaggio**: solo le scene di storia e i loro esiti; id stabili `<scena>` e `<scena>__<opzione>-<esito>`.
- **Salvataggio**: nel browser sempre; nell'account claude.ai dentro l'Artifact; con Google e Supabase fuori da
  claude.ai (pronto, spento); su file per tutti (`docs/salvataggi.md`).
- **Interfaccia**: lingua visiva del Codex, tre colonne (campana e statistiche, schede, luogo e frammenti),
  tooltip del glossario sui nomi, musica e ambienti per area/luogo/scena, lettura delle voci.

## Cronologia

- **Fine settembre 2026.** Scelta del formato a storylet al posto del videogioco e della land play-by-chat.
  Prototipo: creazione del personaggio, Città Bassa, Dama d'Argento fino alla Segheria.
- **30 settembre.** Piano del Capitolo I approvato (`docs/piano-capitolo-1.md`): otto blocchi di produzione.
- **1° ottobre.** Voce della prosa con un po' di Disco Elysium, glossario dei tooltip, luoghi come mini-hub, città
  viva su tutti i luoghi, audio completo, blocchi 1–8 chiusi (tutte le storie principali).
- **2 ottobre.**
  - Economia strati 1 e 2; rintocchi a 20 con ricarica piena a fine storia.
  - Le candele diventano rintocchi, con la campana (per staccarsi da Fallen London).
  - Prima batch di voci importata (110 pezzi).
  - Spedizioni in ordine: stanze che non tornano, fasce di profondità, revisione di tutte le spedizioni.
  - La Superficie Fratturata dalla tabella degli incontri della cronaca, con lo strato 3 dei reperti.
  - Mazzi dei quartieri portati a 25–28 carte, opzioni di origine, vie sociali ai combattimenti della Superficie,
    tappe intermedie con mezza campana.
  - Salvataggio nell'account e su file; login Google con Supabase pronto.
  - Frammenti del Codex da 19 a 163.
  - Passaggio a Claude Code in locale (questo file, `CLAUDE.md`, `docs/locale.md`, copione in locale).

## Checklist

### Subito
- [ ] Clonare in locale e verificare che `npm run dev`, `npm run build` e i test girino anche su questa macchina
      (`docs/locale.md`).
- [ ] Importare musica e ambienti (`npm run audio`) e le voci già registrate (`npm run voci`).
- [ ] Portare le spunte del copione dall'Artifact al locale («Scarica le spunte» → «Carica spunte»).
- [ ] Decidere dove pubblicare: Artifact su claude.ai, sito proprio (Cloudflare Pages), o entrambi.

### Salvataggio e pubblicazione
- [ ] Creare il progetto Supabase, il client OAuth Google e accendere il login (`docs/locale.md`, sezione Google).
- [ ] Pubblicare su Cloudflare Pages con le variabili `VITE_SUPABASE_*`.
- [ ] Provare il salvataggio su due dispositivi diversi con lo stesso account Google.
- [ ] Se si condivide l'Artifact con amici: invitarli per email come Editor (con un link pubblico non salvano
      nell'account).

### Doppiaggio
- [ ] Registrare i pezzi che mancano: 1498 su 1608 (le scene di storia prima delle opzioni di origine).
- [ ] Importare a batch con `npm run voci` e controllare i "da rifare" dopo ogni modifica ai testi.

### Contenuti da sistemare
- [ ] Voci di glossario per i personaggi nuovi delle carte della città (Ilde Sarrocchi, Ugo Bracco, Clelia Vennari,
      Berengario Lusardi, Fosco Ambri e gli altri elencati in testa a `contenuti/citta/carte-*.yaml`).
- [ ] Rileggere i dettagli inventati dagli agenti che non sono nel Codex: le chiatte a fune e il privilegio di fune,
      Temmerin che fa decifrare i libri sequestrati, il palco di famiglia del Rampollo, i segni a tre tacche del
      Circolo, il motto di Vantes «Quando dubiti, tocca».
- [ ] Incoerenza da decidere: Mirn il Sordo muore «in una cella della Cattedrale» negli anni '40, quando secondo il
      Codex c'era ancora il vecchio Santuario.
- [ ] Bosco di Velthar: nord-ovest nel gioco, nord-est nel Codex.
- [ ] `mn-culto-dell-antico` (frammento): tenerlo o toglierlo, perché può confondersi con il Culto dell'Anonimo.
- [ ] `nomea.citta-bassa` per ora si imposta e basta: deve colorare le carte del quartiere.
- [ ] Ripassare le carte e gli storylet che citano gli Scuri come forza attiva dopo `pista.pelle >= 6`.
- [ ] Nel copione dell'Arpia restano «Silver Pond» ed «Empty Glass».
- [ ] Strato 3: le stanze profonde delle rovine e l'esplosione dei congegni instabili.

### Idee non ancora fatte (dalle discussioni)
- Superficie: una fiducia per ogni insediamento, con richieste che si incrociano fra villaggi (Roadwarden).
- Rapporti di viaggio come merce da vendere in città (i port report di Sunless Sea).
- Richieste che scadono se ignorate, con la città che va avanti da sola (Pathologic 2).
- Orologi a segmenti visibili sulle storie secondarie, alcuni che avanzano da soli (Citizen Sleeper).
- Reperti decifrati a metà che valgono meno o ingannano il compratore (Heaven's Vault).
- Compratori che chiedono soglie di aspetto invece di oggetti precisi (Cultist Simulator / Book of Hours).
- Nel Nodo dei Precursori una quality "comprensione" che apre opzioni al posto delle chiavi (Outer Wilds).
- Missioni secondarie aperte all'inizio che si chiudono nel finale del capitolo (Disco Elysium).
- Un Codex rinominato che un giorno sostituisca quello online, con l'originale riservato ai giocatori del tavolo.

### Capitolo II (quando la cronaca ci arriva)
- [ ] Piano del capitolo dal verbale, come `docs/piano-capitolo-1.md`.
- [ ] La discesa nella Cicatrice; i villaggi fuori città come zone; il Bosco di Velthar e la Via del Respiro.
- [ ] Rintocchi, mazzi e ricariche da ribilanciare sulla nuova lunghezza.

## Decisioni prese (da non rimettere in discussione senza motivo)
- Formato a storylet, interfaccia alla Fallen London con la grafica del Codex; Fallen London è dichiarato come
  modello nei Termini, ma la risorsa delle azioni si chiama rintocchi, non candele.
- Doppiaggio solo sulle scene di storia, per risparmiare crediti e dare peso alla trama.
- Nomi da Runelords rinominati nel gioco; il Codex online resta con i nomi originali.
- Superficie aperta da subito, senza gabella; i rischi stanno negli incontri.
- Le ricompense della Superficie sono reperti da decifrare, ricombinare, vendere o usare, più qualche moneta.
- Un solo personaggio per salvataggio; l'account ne tiene uno.
