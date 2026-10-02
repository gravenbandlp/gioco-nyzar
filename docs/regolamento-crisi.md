# Crisi, aree di penalità e mutazioni

Integrazione alle sezioni 5.3–5.5 del Regolamento v0.4, approvata il 30 settembre 2026.

## Crisi

- Quando una statistica negativa arriva a 8 si apre lo storylet di crisi (`tipo: crisi`). Finché non
  lo risolvi, al posto dell'area vedi solo la crisi. Le sue opzioni costano 0 rintocchi. Se due
  statistiche sono a 8, le crisi arrivano una dopo l'altra.
- Pagare o sacrificare: la statistica scende a 4. Accettare: vai nell'area di penalità; la
  statistica resta a 8 finché non esci, e intanto le altre crisi aspettano.

| Statistica | Pagare | Sacrificare | Accettare |
|---|---|---|---|
| Ferite | 40 monete a Nestor Gramm | i PE accumulati in Resistenza (almeno 10) | Convalescenza |
| Scandalo | 60 monete, oppure 2 pettegolezzi verificati | −2 reputazione con Velo, Gilda, Castaldi o Maison | Ostracismo |
| Sospetto | 80 monete di tangente | consegni un nome (Scuri −2, Caserma +1), oppure perdi il Contatto nell'ombra | Prigione |
| Tormento | 50 monete al Velo | i PE accumulati in Resilienza (almeno 10) | Delirio |
| Contaminazione | 150 monete di purificazione straordinaria | un cristallo carico ceduto al Velo | mutazione |

## Aree di penalità

- Convalescenza (infermeria della Cattedrale e Giardini della Linfa), Ostracismo (sottoponti),
  Prigione (carcere interrato della Caserma), Delirio (celle della Cattedrale).
- Sono nascoste dalla mappa: non ci si entra e non se ne esce a piedi, e dentro non si pescano
  le carte che valgono ovunque.
- Tre azioni ripetibili, ciascuna con abilità diverse, fanno salire `recupero.<area>` (successo +1,
  fallimento +½). A 4 si apre l'uscita: tre strade, ognuna dà 10 PE a un'abilità e porta in un'area
  diversa (i Quartieri Alti solo con l'invito). Uscendo la statistica va a 3 e il recupero a 0.

## Mutazioni

- Accettando la crisi della Contaminazione il gioco propone due mutazioni a caso fra quelle che non
  hai, e ne scegli una. La Contaminazione va a 3.
- I modificatori valgono sempre, dentro e fuori dal combattimento. L'elenco è in
  `contenuti/mutazioni.yaml`:

| Mutazione | Vantaggio | Svantaggio |
|---|---|---|
| Occhi luminescenti | +1 Percezione | −1 Furtività |
| Vene di luce | +2 Energia | −1 Galateo |
| Pelle increspata | +1 riduzione | −1 Acrobazia |
| Gola roca | +1 Intimidire | −1 Persuasione |
| Sangue grigio | Contaminazione per esposizione dimezzata | −1 PF |
| Mente silenziosa | +1 Resilienza | −1 Empatia |
| Unghie di metallo | +1 danno a mani nude | −1 Galateo |
| Orecchio per il Mana | +1 Magia fuori dal combattimento | la Dissonanza dà 1 Tormento invece di ½ |

- Se le hai già tutte, la Marea si ritira senza cambiarti ancora e la Contaminazione va a 3.

## Carte della fascia 5–7

Due per statistica (`area: ovunque`), una che peggiora e una che offre un modo per ridurla.
Compaiono in ogni area tranne quelle di penalità, da 5 a 7½.

## Strumenti per i contenuti

- `imposta: { ferite: 3, pe.resistenza: 0 }` negli esiti fissa un valore.
- `pe: { resistenza: 10 }` negli esiti regala PE.
- Requisiti sui PE accumulati: `pe.resistenza >= 10`.
- `tipo: seguito` per gli storylet che si aprono solo con `segue`; `mostra: 2` mostra due opzioni a
  caso fra quelle disponibili, sempre le stesse finché lo stato non cambia.
