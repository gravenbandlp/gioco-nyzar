# Gioco Ny'Zar

Gioco narrativo a storylet ambientato a Qir-Azel, nella Superficie Fratturata di Ny'Zar.
Per orientarsi: `docs/progetto.md` (scopo, stato, checklist), `docs/locale.md` (installazione, audio,
pubblicazione, login Google), `docs/ripresa.md` (regole operative), `CLAUDE.md` (istruzioni per Claude Code).

## Il gioco

Il Capitolo I completo: otto origini, tre quartieri di Qir-Azel e la Superficie Fratturata, dieci storie
principali, spedizioni, città viva, economia. I rintocchi si consumano e si ricaricano (1 ogni 10 minuti,
massimo 20); le occasioni si pescano dal mazzo (mano 3, coda 6). Il salvataggio sta nel browser, nell'account
(claude.ai o Google) e su file.

```sh
npm install
npm run dev        # gioca in locale su http://localhost:5173
npm test           # valida i contenuti e prova il motore
npm run simula     # tabella di vittoria: origini × scontri
npm run build      # dist/index.html (un solo file) più dist/tavole/
```

## Tavole

Le illustrazioni sono incisioni e stampe d'epoca di pubblico dominio (Piranesi, Callot, Hollar e altri), prese da
Wikimedia Commons con licenza CC0 o pubblico dominio e virate in seppia. Nessuna è generata con l'IA. Nei YAML basta
scrivere `immagine: collezione/slug` (per esempio `immagine: personaggi/marko-thessel`) su un'area, uno storylet,
un'opzione, un esito, una quality, un nemico, un negozio o un'origine; il file sta in `public/tavole/` in due tagli
(`-s.webp` da 360px e `-l.webp` da 1232px). Il build si ferma se una tavola citata manca.

Per farne una nuova servono Python, Pillow e numpy: `scripts/strumenti/tavole/commons.py` cerca e scarica da Commons,
`tratta.py` ritaglia la lastra (`tratta` per i luoghi, `ritratto` per figure e oggetti, centrati nel 3:4 che il gioco
mostra) e la vira in seppia. Ogni tavola va registrata in `src/dati/fonti-tavole.json` (opera, autore, data, pagina
della fonte, licenza): la pagina Crediti mostra l'elenco.

## Interfaccia

Impianto alla Fallen London con la lingua visiva del Codex: campana dei rintocchi e statistiche a sinistra,
schede Storia · Personaggio · Averi · Bazar · Mappa al centro, luogo e frammenti del Codex a destra
(`contenuti/frammenti.yaml`, solo informazioni pubbliche). Su telefono le colonne si impilano e
rintocchi e monete restano nella barra delle schede.

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
  strumenti/tavole/   ritaglio e viraggio delle stampe di pubblico dominio
src/motore/           regole pure, senza interfaccia (testabili e riusabili sul server)
src/ui/               interfaccia in TypeScript senza framework (viste.ts, componenti.ts, stile.css)
public/tavole/        tavole (stampe d'epoca virate in seppia)
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
      costo: 1                # rintocchi (default 1)
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
