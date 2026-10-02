# Progetto · Strato 3: assemblare congegni dei Precursori

Stato: **realizzato in forma ridotta il 2 ottobre 2026** con la Superficie Fratturata (`contenuti/superficie/reperti.yaml`, schema in testa al file): reperti sigillati aperti da Oda Krell, quattro famiglie di parti in tre gradi, il banco di Oda sulla Superficie al posto della cantina, i punteggi sommati dagli effetti (senza motore nuovo), due coppie che si disturbano, cinque compratori (Orvald, il Velo, il Mercato delle Ombre, Dragna, il Mercante della Memoria al posto del collezionista) e la riparazione dei reperti guasti. Il congegno si vede negli Averi. Restano da fare le stanze profonde delle rovine e l'esplosione dei congegni instabili. Il testo qui sotto è il progetto originale.

Stato originale: **a progetto**, da fare in futuro. Scritto il 2 ottobre 2026, dopo gli strati 1 e 2 dell'economia (il giro
delle merci e la casa, `contenuti/economia/`). Va fatto solo se i giocatori usano davvero i primi due: il segnale
sono le conversioni ripetute, le vendite al Mercato delle Ombre e la casa che arriva oltre il terzo livello.

## Cosa deve fare

È il sistema firma per chi ottimizza, l'equivalente del Mercato delle Ossa di Fallen London costruito su quello
che è identitario di Ny'Zar: la tecnologia dei Precursori. Il giocatore recupera parti nelle rovine, le assembla
al banco della cantina e vende il congegno a compratori che vogliono cose diverse. Il valore nasce dall'incrocio
fra la combinazione delle parti e il compratore scelto, così non esiste una ricetta migliore per tutti.

Il secondo pezzo è il rischio delle spedizioni, alla maniera dello Zee: più scendi, migliori sono le parti, più
salgono Ferite e Contaminazione, e decidi tu quando tornare.

## Le parti

Quattro famiglie di parti, ognuna con tre gradi (comune, buona, rara). Sono beni (`categoria: bene`, famiglia
`Parti precuriane`), così si vedono negli Averi e passano dai negozi come le altre merci.

| Parte | Cosa porta al congegno | Esempi di nome |
|---|---|---|
| Involucro | Stabilità | guscio di metallo scuro, carcassa incrinata, cassa sigillata |
| Camera di cristallo | Potenza | camera spenta, camera a vene, camera che pulsa ancora |
| Impugnatura | Uso (umano o no) | impugnatura non umana, manico rifatto, presa a sei dita |
| Nucleo | Stranezza | nucleo opaco, nucleo che sussurra, nucleo che ricorda |

Il `reliquie.meccanismo-spento` dello strato 1 diventa l'involucro comune: chi ne ha accumulati non li perde.

## Il congegno

Un congegno in costruzione è uno stato del personaggio, non un oggetto: `banco.involucro`, `banco.camera`,
`banco.impugnatura`, `banco.nucleo` (il grado montato, da 0 a 3) più tre punteggi derivati, `banco.potenza`,
`banco.stabilita` e `banco.stranezza`. Si monta una parte alla volta con uno storylet ripetibile al banco della
cantina (`casa >= 5`); ogni montaggio è una prova di Mentale + Tecnologia, e il fallimento consuma la parte o
alza la Stranezza (che non sempre è un male).

Regole di combinazione, da tarare:
- ogni parte aggiunge il suo valore principale e un po' di un secondo valore;
- certe coppie si disturbano (un nucleo che ricorda con un'impugnatura non umana alza la Stranezza ma abbassa
  la Stabilità);
- un congegno con Stabilità bassa e Potenza alta può esplodere al primo uso: si scopre solo vendendolo o
  provandolo (una prova facoltativa che dà un'anteprima dei valori e costa un rintocco).

## I compratori

Ognuno legge i punteggi in modo diverso. Il prezzo è una formula sui tre valori, e le reputazioni dei luoghi lo
alzano come per le merci dello strato 1.

| Compratore | Dove | Vuole | Paga anche in |
|---|---|---|---|
| Orvald Temmerin | Accademia | Stabilità e Potenza: un congegno che funziona | reputazione dell'Accademia, PE in Tecnologia |
| La Confraternita del Velo | Cattedrale | qualunque cosa, per sigillarla; paga poco | Tormento e Contaminazione che scendono |
| Gli Scuri o chi ne prende il posto | Mercato delle Ombre | Potenza: un'arma | monete, molte; Sospetto |
| Un collezionista dei Quartieri Alti | da inventare, sotto un maniero | Stranezza, e niente altro | Lustro |
| I Raschiatori | Grifone | i congegni guasti, per le parti | parti rare, accesso alle stanze profonde |

Il collezionista è il personaggio nuovo dello strato: va proposto a Luca prima di scriverlo, perché tocca le
grandi famiglie.

## Le spedizioni come Zee

Le tre rovine dei Raschiatori (Vhar'Ul, il Laboratorio di Calibrazione, il Sito Mahr-Kel in
`contenuti/piste/rovine.yaml`) sono già ripetibili. Si aggiunge a ognuna una banda di stanze profonde:
- oltre la soglia attuale compaiono stanze che danno parti, con il grado che sale con `profondita.<area>`;
- ogni stanza profonda costa Ferite o Contaminazione anche quando riesce;
- tornare indietro è sempre possibile e azzera la profondità, come oggi: il calcolo è fra spingere ancora per
  una parte rara e perdere tutto in una crisi.

## Motore

Quasi tutto si fa con i contenuti di oggi (storylet ripetibili, effetti, `quando`, requisiti). Servono tre
aggiunte:
1. **Effetti calcolati.** Un esito deve poter scrivere `banco.potenza` a partire dalle parti montate: un campo
   `calcola` sull'esito, con poche formule fisse scelte per nome (`somma`, `media`, `scarto`), o una funzione nel
   motore dedicata al banco (`src/motore/banco.ts`).
2. **Prezzi calcolati.** Una voce di negozio con `prezzo` dato da una formula sui punteggi del banco, invece di un
   numero fisso. In alternativa la vendita è uno storylet per compratore, con le fasce di prezzo come opzioni
   chiuse dai requisiti sui punteggi: più verboso ma senza motore nuovo.
3. **Anteprima.** Una riga sotto il banco che mostra i tre punteggi del congegno in costruzione, come fa oggi la
   barra delle spedizioni.

## Contenuti da scrivere

- Le parti: dodici beni con descrizione.
- Il banco della cantina: uno storylet di montaggio per famiglia di parti, uno per provare il congegno, uno per
  smontarlo.
- Cinque compratori: uno storylet ciascuno, con varianti per fasce di punteggio.
- Le stanze profonde: due o tre per rovina.
- La riparazione dei reperti guasti, promessa in `docs/regolamento-oggetti.md`: si fa al banco con le parti.

Stima: un blocco grande, come il blocco 7 di Capomozzo per il motore e la metà per la scrittura.

## Da decidere con Luca

- Se i congegni assemblati si possono anche usare (diventano reperti con cariche) o solo vendere.
- Il collezionista dei Quartieri Alti: chi è, di quale famiglia.
- Se le parti rare devono avere nomi del Codex (precuriano) o restare descrittive.
