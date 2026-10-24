# Il campanile rovescio (piano, 24 ottobre 2026)

Il contenuto finale del Capitolo I: una spedizione di 40 piani sotto la Campana Sepolta, con prove Difficili e Molto
difficili, un superboss ogni dieci piani e un megaboss al quarantesimo. Sotto il quarantesimo la torre continua, ma il
sigillo del piano 41 non riconosce ancora la Maschera del Portatore: lo apriranno i capitoli successivi, quaranta piani
alla volta. Deciso con Luca il 24 ottobre 2026 (40 piani, la lore del campanile rovescio).

Il 24 ottobre Luca ha approvato i nomi del piano (il campanile rovescio, la canna, i quattro anelli); i nomi dei boss e
degli oggetti del set si propongono con il set.

## Lore

- La Campana Sepolta è la cella campanaria in cima a un campanile che i Precursori hanno costruito all'ingiù, appeso
  alla scogliera della Ripamuta e affondato nella roccia. Il Campanaro custodiva la botola sotto il batacchio, non la
  Campana. Sotto la botola c'è la **canna** *(provvisorio)*, il pozzo in cui la Campana mandava la voce verso il basso;
  i piani sono anelli di stanze attorno alla canna.
- Il canone lo regge: nel Codex i ponti-ascensore della Città Bassa sono «torri verticali alimentate da Cristalli
  Conduttori» che scendono verso Darn-Morakh, e del Labirinto il glossario dice che intere porzioni si riorganizzano.
  Il campanile fa lo stesso: a ogni discesa i piani sono diversi.
- I sigilli fra un anello e l'altro sono serrature della Salvaguardia che leggono le Maschere: riconoscono il Portatore
  dell'Alba e lo lasciano scendere fin dove arriva la sua Maschera. La Maschera di oggi è di grado 3; il sigillo del 41
  chiede il grado 4.
- Più si scende, più forte si sente il battito che i Raschiatori sentono in fondo a Darn-Morakh. Dove porti la torre non
  lo si dice.
- Le due scelte della Campana: zittita (`campana.scelta` 1), la torre è muta e i piani cambiano solo fra una discesa e
  l'altra; armata (2), ogni rintocco li rimescola. Cambia solo la prosa dell'ingresso e di qualche stanza (Luca, 24
  ottobre 2026: un effetto di gioco, se mai, più avanti).

## Sblocco

- `pista.capomozzo >= 10` (il Portatore dell'Alba, con la sua Maschera) e `campana.scelta >= 1` (il Campanaro battuto).
- Lo annuncia una scena non ripetibile nella camera del batacchio, la prima volta che ci si torna con tutti e due i
  requisiti: la botola, la canna, la scala a chiocciola che scende nel buio. Da lì l'ingresso ripetibile.
- Chi ha battuto il Campanaro prima di essere Portatore vede la botola chiusa, con una frase che la lega alla Maschera.

## Struttura

- **Quattro anelli da dieci piani**, ognuno un'area spedizione (`torre-anello-1` … `-4`, soglia 9, tre stanze visibili).
  I piani 1–9 dell'anello sono stanze ripetibili in fasce di profondità; il piano 10 è il cuore, con il superboss.
- **Il piano** si mostra al giocatore: profondità più dieci per ogni anello passato («Piano 17»).
- **Il progresso** fra gli anelli resta (`torre.anello` da 0 a 4, come `campana.strato`). Dentro un anello la ritirata e
  la sconfitta al superboss riportano all'inizio dell'anello.
- **Il rimescolamento**: oggi le stanze visibili hanno un seme fisso per personaggio e profondità
  (`stanzeVisibili` in `src/motore/spedizioni.ts`). Per la torre il seme prende anche il numero della discesa
  (`torre.discese`), che sale a ogni ingresso: a ogni discesa i piani sono diversi.
- **Il sigillo del 41**: sotto il megaboss una scena con la porta che legge la Maschera e non si apre
  (`maschera.grado < 4`). È il gancio del Capitolo II.

### I quattro anelli *(temi provvisori)*

| Anello | Piani | Tema | Pressione | Superboss |
|---|---|---|---|---|
| 1 | 1–10 | La scala delle corde: ballatoi attorno alla canna, corde di metallo, il vuoto | Ferite (cadute), Atletica, Acrobazia | una quinta forma della Salvaguardia, che manovra le corde |
| 2 | 11–20 | Le casse di risonanza: stanze dove ogni suono rimbomba e fa male | Tormento, Resilienza, Percezione | una creatura cresciuta nella risonanza |
| 3 | 21–30 | La fonderia delle note: dove la canna fu intonata, calore e metallo vivo | Contaminazione, Tecnologia, Resistenza | il coro degli operatori, la Marea come memoria |
| 4 | 31–40 | Il battito: il fondo della canna, la pulsazione che sale da sotto | tutte le negative, prove miste | **megaboss**: il guardiano del sigillo, che mette alla prova la Maschera |

## Difficoltà e usura

- **Prove**: Difficili negli anelli 1–2, Difficili e Molto difficili negli anelli 3–4. Ogni stanza ha anche una via senza
  prova da 2 o 3 rintocchi più una negativa (come la Campana), così chi non ha l'abilità giusta scende lo stesso, ma si
  consuma.
- **Usura**: la difficoltà vera è arrivare in fondo con 5 bende, 5 tonici e 5 unguenti (`SCORTA_MAX`). Un'opzione su
  quattro o cinque costa Ferite, Tormento o Contaminazione anche quando riesce; le crisi a 8 restano e fanno uscire dalla
  torre come da ogni spedizione.
- **Ristoro**: una sola stanza di ristoro per anello, in fascia fissa (piani 5–6), con una scelta fra curarsi e fare
  scorta: la gestione resta del giocatore.
- **Nemici**: due o tre combattimenti per anello oltre al superboss. Anello 1 al livello della Campana, poi a salire.
- **Superboss** (piani 10, 20, 30): due fasi di fila; con `scripts/simula-fine.ts` il personaggio di fine contenuti,
  con gli oggetti della Campana, vince ogni fase fra il 35 e il 55%.
- **Megaboss** (piano 40): tre fasi di fila, ogni fase fra il 25 e il 40%, come il Campanaro ma un gradino sopra.
- **Le quattro Maschere**: in ogni anello una stanza ha un'opzione per ciascuna Maschera (`quando` sulla Maschera
  posseduta), una via più facile che si legge come la Maschera che risponde al campanile. Contro il megaboss la propria
  Maschera apre una via che le altre non hanno.

## Ricompense

Decise da Luca il 24 ottobre 2026.
- Nelle stanze solo PE.
- Ogni superboss e il megaboss: PE, lyssan e un oggetto di grado 5. I quattro oggetti sono un **set**: un'arma a una mano,
  uno scudo, un'armatura e un accessorio, con un aspetto comune e distintivo anche sul ritratto, perché finire la torre è
  il traguardo più grande del capitolo. Il set si mostra a Luca in un artifact dedicato prima di entrare nel gioco.
- Il set, approvato da Luca il 24 ottobre 2026: «Il bronzo della canna», bronzo da campana (`bronzoCampana`), verderame e
  luce di cristallo. Gli aspetti sono già nel motore del ritratto (spada `variante: 'canna'`, scudo `forma: 'campana'`,
  piastre con `rifiniture` e `onde`, mantello con `orlo`); gli accessori arrivano al grado 5 da quel giorno.
  - Piano 10, **La Nota Lunga** (spada lunga): Affilata 2, Penetrante 2, Ostinata.
  - Piano 20, **La Cassa Armonica** (piastre): Robusta 1, Lucida, Talento Resilienza 1.
  - Piano 30, **La Bocca della Campana** (scudo): +4 dadi in difesa, Talento Resistenza 1.
  - Piano 40, **Il Manto del Battito** (mantello, accessorio): Ultimo respiro, Rapida 1, Talento Percezione 1 e Atletica 1.
- Ritarati il 24 ottobre 2026 perché il set intero valga almeno il Battente con le piastre del Campanaro: con la prima
  versione chi lo indossava perdeva quasi ogni scontro della torre (Lettore alla porta 3% contro 30%). Ora i tre pezzi
  vincono in media il 47% degli scontri della torre contro il 43% di Battente e piastre, e con il Manto il 63% contro il 60%.
- Il megaboss dà anche il frammento che nel Capitolo II porterà la Maschera al grado 4 (non è un oggetto da indossare).
- Le discese ripetute danno solo PE e lyssan: gli oggetti del set una volta sola (`avuto.<id> == 0`).

## Materiale (stima)

| Voce | Quantità |
|---|---|
| Stanze ripetibili | 80 (20 per anello, in tre fasce: piani 1–3, 4–6, 7–9) |
| Seguiti delle stanze | 12–16 |
| Cuori (superboss e megaboss) | 4 |
| Scene di storia (sblocco, ingresso, sigilli fra gli anelli, sigillo del 41, epiloghi per `campana.scelta`) | 10–12 |
| **Storylet in tutto** | **circa 110** |
| Nemici e scontri | 28–32 (8–10 nemici comuni, tre superboss in due fasi, il megaboss in tre) |
| Oggetti unici | il set di grado 5 (arma a una mano, scudo, armatura, accessorio), più il frammento |
| Quality | `torre.anello`, `torre.discese`, `torre.piano`, `maschera.grado` e poche altre |
| Parole | 45–55 mila (la Campana ne ha 39 mila; il gioco intero 1,14 milioni) |
| Tavole | quelle che ci sono, più 4–6 stampe nuove di pubblico dominio per gli anelli |

## Ore di gioco (stima)

Ipotesi: una stanza costa in media 2,5 rintocchi; un personaggio di fine contenuti fallisce una prova su quattro e
batte un superboss in due tentativi, il megaboss in tre o quattro; ogni sconfitta al cuore fa ripartire l'anello.

- Un anello: circa 12 stanze tentate per arrivare al piano 10, cioè una trentina di rintocchi a tentativo.
- Prima salita completa: circa 300–350 rintocchi, contando i tentativi ai cuori.
- **Gioco attivo: 5–8 ore** per la prima salita. Con la partita di prova di Luca, circa 20 ore per il capitolo, è fra un
  quarto e un terzo del capitolo.
- **Calendario: 1–2 settimane**, perché i rintocchi tornano al ritmo di uno ogni 10 minuti (al massimo 144 al giorno).
- Le discese successive, senza gli unici, sono più brevi: 3–5 ore se si vuole rifarla tutta.

## Motore

- `spedizione.rimescola` (una quality: il seme delle stanze visibili prende il suo valore) e `spedizione.piani` (il
  piano prima della prima stanza: l'intestazione mostra «Piano N», `piano()` in `src/motore/spedizioni.ts`). Le altre
  spedizioni non cambiano.
- `maschera.grado` non si scrive: lo calcola `valoreOggetti` dalle Maschere possedute, che hanno la chiave
  `maschera` (le quattro di Capomozzo valgono 3). La quality esiste solo perché i requisiti la leggano.
- `test/spedizioni-percorribili.test.ts` copre da solo i quattro anelli; un `test/torre.test.ts` per lo sblocco, il
  rimescolamento, i sigilli e le ricompense.

## Blocchi

- [x] Il set: i quattro oggetti, la pixel art, l'artifact per Luca (approvato il 24 ottobre 2026).
- [x] Blocco 0 (24 ottobre 2026): motore (seme, piano, `maschera.grado`), lo sblocco nella camera del batacchio
      (`contenuti/torre/sblocco.yaml`: la botola zittita o armata, la lastra chiusa per chi non è Portatore), la scala
      della canna, il sigillo del 41, la raccolta nelle Cronache, `test/torre.test.ts`. Ogni scena chiede
      `torre.aperta >= 1`, che nessuna storia accende: si toglie quando il campanile è completo (blocco 5), insieme al
      primo controllo del test. La scala riceve le discese anello per anello (`effetti: { torre.discese: 1 }` e `vai`). Il sigillo è
      una scena della costa grigia; con il blocco 4 può diventare il seguito della vittoria sul megaboss.
- [x] Blocco 1 (24 ottobre 2026): anello 1, la scala delle corde (`contenuti/torre/anello-1.yaml` e
      `anello-1-fondo.yaml`), 20 stanze in tre fasce, la Tessitrice in due fasi e il fuso con La Nota Lunga (150
      lyssan e 10 PE a ogni vittoria, la spada una volta sola). Nemici in `contenuti/torre/nemici.yaml`, tarati sul
      profilo «fine Campana» di `scripts/simula-fine.ts` con `scripts/strumenti/tara-nemici.ts`: rammendatori 69%,
      giovani 60%, suonatore 69%, Tessitrice 49% e 46%. Quel profilo batte il Campanaro quasi sempre, quindi la torre
      sta un gradino sopra. La scala della canna scende nell'anello 1; l'interruttore `torre.aperta` resta sulle scene
      d'ingresso finché il campanile non è completo, così nessuno gioca un anello solo. Dopo il fuso si risale in
      Superficie: con il blocco 2 il fuso apre anche la discesa all'anello 2.
- [x] Blocco 2 (24 ottobre 2026): anello 2, le casse di risonanza (`contenuti/torre/anello-2.yaml` e
      `anello-2-fondo.yaml`), 20 stanze con il Tormento come pressione, l'Uditore in due fasi (nella cassa, nel
      silenzio) e la cassa con La Cassa Armonica (200 lyssan e 10 PE a ogni vittoria). Orecchianti 70%, risonatore
      66%, Uditore 43% e 40%. Il fuso della Tessitrice apre `torre-1-la-porta-tonda` (scendere nell'anello 2 o
      risalire) e la scala della canna scende all'undicesimo piano con torre.anello >= 1. Dopo la cassa per ora si
      risale: con il blocco 3 arriva la seconda porta tonda.
- [x] Blocco 3 (24 ottobre 2026): anello 3, la fonderia delle note (`contenuti/torre/anello-3.yaml` e
      `anello-3-fondo.yaml`), 20 stanze con la Contaminazione e le ustioni, la Colata in due fasi (nel crogiolo,
      rappresa) e l'ultima campana con La Bocca della Campana (250 lyssan e 10 PE a ogni vittoria). Scorie 65%,
      versatore 62%, Colata 38% e 36%. La cassa dell'Uditore apre `torre-2-la-porta-tonda` e la scala della canna scende
      al ventunesimo piano con torre.anello >= 2. Dopo l'ultima campana per ora si risale: con il blocco 4 arriva la
      terza porta tonda.
- [x] Blocco 4 (24 ottobre 2026): anello 4, il battito (`contenuti/torre/anello-4.yaml` e `anello-4-fondo.yaml`),
      20 stanze con tutte le negative, il Lettore in tre fasi (alla porta, con una via per ciascuna Maschera; senza
      volto; nel battito) e il leggio con Il Manto del Battito, il frammento del sigillo e 400 lyssan. La prima volta il
      leggio apre il sigillo del quarantunesimo piano, che è diventato un seguito. Sentinelle 61%, pulsante 62%, Lettore
      30%, 29% e 30%. Il nome è di Luca, che ci ha visto anche chi legge il gioco: la prosa lo tratta come chi legge
      una pagina, senza dirlo.
- [x] Blocco 5 (24 ottobre 2026): tolto l'interruttore `torre.aperta`; la scala della canna resta aperta anche a
      campanile finito, per chi torna a farmare PE e lyssan; `docs/storie.md` rigenerata. Il bilanciamento si è fatto
      anello per anello.

## Da decidere con Luca

- I nomi dei tre superboss e del megaboss. Il set non dà bonus per i pezzi indossati insieme (Luca, 24 ottobre 2026).
