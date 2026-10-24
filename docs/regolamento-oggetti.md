# Oggetti

Integrazione alla sezione 8 del Regolamento v0.4, approvata il 30 settembre 2026. Restano valide le
regole della v0.4: slot (arma, armatura, scudo, due accessori), anti-accumulo dei dadi, oggetti
magici da +1 a +5, reperti con cariche e celle, consumabili.

## Inventario

- Ogni oggetto posseduto è la quality `oggetto.<id>`. Gli oggetti comprati o trovati finiscono negli
  Averi; se lo slot è vuoto vengono indossati subito. Cambiare equipaggiamento non costa rintocchi.
- Un'arma a due mani toglie lo scudo e impedisce di indossarlo.
- Lo slot **Animale** (24 ottobre 2026) tiene un animale solo: un cavallo, la lupa Fumo o il puma Braska. I cavalli non
  danno bonus: averne uno, anche negli Averi, dà la chiave `cavalcatura` per le opzioni a cavallo, e quello che porti
  con te si vede sul ritratto. Lupa e puma tengono i loro bonus. Gli animali non si vendono, e `migraOggetti`
  restituisce i cavalli venduti prima a chi ha il segno della storia che li dà (`CAVALLI_DELLE_STORIE`).
- Di ogni consumabile (bende, tonico, estratto di energia, unguento, cella) se ne portano al massimo 5
  (`SCORTA_MAX` in `src/motore/regole.ts`, deciso l'11 ottobre 2026): quello che arriva oltre si perde, le botteghe
  non lo vendono e le opzioni che servono solo a comprarlo hanno il requisito `<consumabile> < 5`.
- Armi, scudi e armature si rivendono alle botteghe che le vendono, a metà del loro prezzo arrotondato per
  difetto e con gli stessi requisiti (`vociCompra` in `src/motore/azioni.ts`). Quello indossato va tolto prima;
  i Legati non si vendono. Gli oggetti magici si vendono a metà del loro valore alle botteghe che hanno il genere in
  `reliquie` (`negozi.yaml`): armi, armature e scudi da Irsa e Bram, accessori da Ambrin al Nodo d'Ossidiana.
  Gli animali non si vendono (24 ottobre 2026). Il valore è il `prezzo` dell'oggetto o, se manca, 700 per grado (più il prezzo
  della base), meno 150 per difetto, più 100 se l'oggetto ha una chiave. Le chiavi degli accessori aprono solo
  opzioni in più, mai l'unica via di una storia, quindi venderli non blocca niente.
- Anti-accumulo: armatura e scudo danno dadi in difesa, ma vale il più alto dei due. Lo stesso vale
  per l'iniziativa (Leggera o Rapida) e per i Talenti sulla stessa abilità.

## Proprietà aggiunte alla tabella 8.7

| Proprietà | Punti | Effetto |
|---|---|---|
| Ultimo respiro | 2 | a 0 PF resti a 1, una volta per scontro |
| Seconda scelta | 3 | una volta per esito ripeti una prova fallita; se la nuova riesce, +½ Tormento. Una prova già rifatta (con la Seconda scelta o con Correzione) non si rifà più |
| Ostinata | 1 | +2 danno quando hai meno di metà dei PF |
| Silenziosa | 1 | toglie la penalità di Furtività dell'armatura |
| Caricatore | 1 | con Ricarica, ricarichi dopo due tiri invece che dopo ogni tiro (fino al 23 ottobre 2026 la ignorava) |
| Chiave | 0 | apre opzioni negli storylet (requisito `chiave.<nome>`) |

Lucida e Schermata dimezzano al mezzo punto inferiore (½ diventa 0, 1 diventa ½). Due fonti di
Schermata, per esempio il Respiratore e un oggetto Schermato, azzerano la Contaminazione.

## Difetti

Ogni difetto dà un punto di grado in più.

| Difetto | Effetto |
|---|---|
| Pesante | richiede Fisico 3 per indossarla |
| Rumorosa | −1 Furtività |
| Riconoscibile | in certi storylet chi la vede la riconosce (requisito `indossa.riconoscibile`) |
| Inquieta | +½ Tormento a ogni scontro in cui la usi |
| Stancante | +½ Ferite dopo ogni scontro in cui la indossi |
| Inceppamento | con zero successi in attacco perdi il round successivo |
| Legata | non si vende, non si cede e non si toglie |

## Proprietà delle armi nel motore

Ribilanciate il 23 ottobre 2026 su richiesta di Luca (la mazza faceva quanto la spada lunga, costava meno e in più
era Contundente). Ogni famiglia ha un vantaggio, che le armi magiche ereditano dalla base:

- Bilanciata (spade): +1 dado in attacco.
- Spietata (asce): un colpo a segno fa almeno 2 danni invece di 1.
- Contundente (mazze e martelli): ignora 1 di riduzione. Perforante (balestre): ignora 2.
- Portata (lance e archi): +1 dado in difesa, e nel primo round attacchi per primo.
- Ricarica (balestre): dopo ogni tiro un round di ricarica. Il Caricatore lo porta a un round ogni due tiri.
- Leggera (+1 iniziativa), Occultabile (nessun effetto nei tiri), Due mani (niente scudo).

I prezzi seguono la probabilità media di vittoria su un campione di scontri (`scripts/strumenti/armi.ts`), con un
combattente di metà gioco (Fisico 3, abilità 3, cuoio rinforzato):

| Arma | Danno | Proprietà | Prezzo | Vittorie |
|---|---|---|---|---|
| Pugnale | 1 | Leggera, Occultabile | 10 | 38% |
| Lancia | 1 | Portata | 30 | 44% |
| Spada corta | 1 | Leggera, Bilanciata | 35 | 41% |
| Ascia da battaglia | 2 | Spietata | 50 | 44% |
| Mazza | 2 | Contundente | 60 | 45% |
| Spada lunga | 2 | Bilanciata | 60 | 45% |
| Ascia bipenne | 3 | Due mani, Spietata | 90 | 47% |
| Martello da guerra | 3 | Due mani, Contundente | 115 | 49% |
| Spadone | 4 | Due mani | 120 | 49% |
| Arco corto | 1 | Due mani, Portata | 35 | 44% |
| Balestra leggera | 4 | Due mani, Perforante, Ricarica | 70 | 47% |
| Arco lungo | 2 | Due mani, Portata | 75 | 47% |
| Balestra pesante | 5 | Due mani, Perforante, Ricarica | 130 | 50% |

Lo spadone non è cambiato, perché la taratura dei boss dell'8 ottobre usa lo Spadone di Uzgreth.

## Reliquie del Codex

Si comprano con storylet d'acquisto: Dietro il banco di Irsa e la Fucina dei Due Mastini in Città
Bassa, il Nodo d'Ossidiana ai Ponti Sospesi. L'arco composito ha due versioni secondo la risposta a
Irsa («mira» o «forza»); il cuoio borchiato va ordinato e ritirato in una seconda visita; l'amuleto
del corvo bisogna chiederlo ad Ambrin. Il bottino di Squiggor e lo spadone di Capomozzo sono
definiti ma per ora non si trovano. La conversione completa è in `contenuti/oggetti.yaml`.

## Reperti

- Si trovano da decifrare: lo storylet di decifrazione chiede una prova Media di Mentale +
  Tecnologia; se fallisce, +½ Tormento. Decifrato, il reperto parte con tutte le cariche.
- In combattimento si usano come azione con Mentale + Tecnologia. Con zero successi il reperto si
  guasta (anche fuori dal combattimento, nelle opzioni con `reperto`). Lo ripara Oda Krell nella sua
  baracca sulla Superficie Fratturata, con una parte comune e qualche moneta.
- Una cella ricarica una carica, dagli Averi, senza rintocchi.
- Passivi: Respiratore (Schermata) e Visore (+2 dadi a Percezione).
