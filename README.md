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
npm run build      # dist/index.html (un solo file) più dist/tavole/
npm run tavole     # importa dal Codex le tavole citate nei contenuti
```

## Tavole

Le illustrazioni vengono dalle tavole del Codex. Nei YAML basta scrivere
`immagine: collezione/slug` (per esempio `immagine: personaggi/marko-thessel`) su un'area, uno
storylet, un'opzione, un esito, una quality, un nemico, un negozio o un'origine. Poi
`npm run tavole` le converte in WebP in due tagli (`public/tavole/…-s.webp` da 360px e `-l.webp`
da 1280px), senza metadati. Il build si ferma se una tavola citata non è stata importata. Dove
manca un'immagine l'interfaccia mostra il segnaposto "Tavola non catalogata".

Lo script cerca il Codex in `../codex-nyzar/src/assets/tavole`; si può passare un altro percorso:
`npm run tavole -- /percorso/tavole`.

## Interfaccia

Impianto alla Fallen London con la lingua visiva del Codex: candela e statistiche a sinistra,
schede Storia · Personaggio · Averi · Bazar · Mappa al centro, luogo e frammenti del Codex a destra
(`contenuti/frammenti.yaml`, solo informazioni pubbliche). Su telefono le colonne si impilano e
candele e monete restano nella barra delle schede.

## Come è fatto

```
contenuti/            tutto il testo e i numeri del gioco, in YAML
  aree/               un file per area: l'area e i suoi storylet
  nemici/             nemici e scontri
  quality.yaml        monete, beni, negative, reputazioni, accessi, piste
  origini.yaml        le build di partenza
  frammenti.yaml      brevi voci del Codex mostrate a margine
  equipaggiamento.yaml, negozi.yaml
scripts/
  build-contenuti.ts  valida i YAML e scrive src/generato/contenuti.json
  simula.ts           bilanciamento dei combattimenti
  importa-tavole.ts   tavole del Codex → public/tavole
src/motore/           regole pure, senza interfaccia (testabili e riusabili sul server)
src/ui/               interfaccia in TypeScript senza framework (viste.ts, componenti.ts, stile.css)
public/tavole/        illustrazioni importate dal Codex
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
  sommario: "Qui le notizie arrivano prima dei banditori."   # una riga per l'elenco
  immagine: ambientazione/pignatta-grassa
  testo: |
    Tavoli di carte, sidro torbido…

    Una riga vuota separa i paragrafi; *asterischi* per il corsivo.
  opzioni:
    - testo: "Offrire da bere e ascoltare"
      costo: 1                # candele (default 1)
      prova: { attributo: sociale, abilita: [conoscenze-della-strada, empatia], difficolta: Media }
      descrizione: "Una frase su cosa tenti."
      successo: { titolo: "Cose che non dovevi sentire", testo: "…", effetti: { informazioni.voce: 2 } }
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
