# Gioco Ny'Zar

Gioco narrativo a storylet ambientato a Qir-Azel, nella Superficie Fratturata di Ny'Zar.
Le regole stanno nel *Regolamento v0.4*; l'ambientazione nella *Bibbia di gioco v0.2*.

## Il prototipo

Primo traguardo: si crea un personaggio da una delle sette origini, si scende nella Città Bassa,
si guadagna con le azioni ripetibili e si segue la pista della Dama d'Argento fino alla Segheria
Malgrani (prova o rissa) e alla lanterna accesa in Via dei Rasoi. Le candele si consumano e si
ricaricano (1 ogni 10 minuti, massimo 20); le occasioni si pescano dal mazzo (mano 3, coda 6).
Il salvataggio sta nel browser (localStorage).

```sh
npm install
npm run dev        # gioca in locale su http://localhost:5173
npm test           # valida i contenuti e prova il motore
npm run simula     # tabella di vittoria: origini × scontri
npm run build      # un solo file: dist/index.html
```

## Come è fatto

```
contenuti/            tutto il testo e i numeri del gioco, in YAML
  aree/               un file per area: l'area e i suoi storylet
  nemici/             nemici e scontri
  quality.yaml        monete, beni, negative, reputazioni, accessi, piste
  origini.yaml        le build di partenza
  equipaggiamento.yaml, negozi.yaml
scripts/
  build-contenuti.ts  valida i YAML e scrive src/generato/contenuti.json
  simula.ts           bilanciamento dei combattimenti
src/motore/           regole pure, senza interfaccia (testabili e riusabili sul server)
src/ui/               interfaccia in TypeScript senza framework
test/                 Vitest
```

### Scrivere uno storylet

```yaml
- id: orecchie-pignatta
  titolo: Orecchie aperte alla Pignatta Grassa
  luogo: Pignatta Grassa
  area: citta-bassa
  ripetibile: true            # azione d'area; se false serve una pista che lo chiuda
  requisiti: [monete >= 1]    # chiave, operatore, numero
  testo: >
    Tavoli di carte, sidro torbido…
  opzioni:
    - testo: "Offrire da bere e ascoltare"
      costo: 1                # candele (default 1)
      prova: { attributo: sociale, abilita: [conoscenze-della-strada, empatia], difficolta: Media }
      successo: { testo: "…", effetti: { informazioni.voce: 2 } }
      fallimento: { testo: "…", effetti: { monete: -1 } }
```

Un'opzione ha una `prova` (con `successo` e `fallimento`), un `combattimento` (con `vittoria` e
`sconfitta`) oppure un `esito` diretto. Gli esiti possono avere `effetti`, `vai` (cambia area) e
`segue` (apre subito un altro storylet). Gli storylet di tipo `carta` finiscono nel mazzo delle
occasioni.

Il build si ferma se un riferimento è rotto: quality inesistenti, abilità sbagliate, scontri o
aree mancanti, effetti non a mezzi punti, origini che non rispettano la regola di creazione.

## Nomi

Il gioco usa i nomi nuovi (Liaren Tarvelin, Scuri, Malgrani, Grifone di Ferro…). La corrispondenza
con i nomi della campagna al tavolo sta nella tabella di rinomina, fuori da questo repository.
