# Magia

Integrazione alla sezione 7 del Regolamento v0.4, approvata il 30 settembre 2026. Le regole di base
restano quelle della v0.4: si tira Mentale + Magia; un incantesimo di livello N richiede Magia ≥ N e
costa N di Energia; l'Energia vale Mentale + Magia e si ricarica a fine combattimento; in combattimento
si portano al massimo Magia + 2 incantesimi.

## Tradizioni

Stesso tiro per tutte. Cambiano l'elenco degli incantesimi, chi li insegna e il prezzo.

| Tradizione | Chi la pratica | Chi insegna | Condizione per imparare | Rischio |
|---|---|---|---|---|
| Arte dei cristalli | maghi e stregoni | Accademia di Torvessa, Besk e Ilka Dravec, Biblioteca | lezioni a pagamento | nell'eclissi il Mana non risponde |
| Liturgia dell'Albero | chierici e paladini del Velo | Cattedrale del Velo | reputazione Velo ≥ 2 × livello | con reputazione Velo sotto 0 non funziona |
| Via del Respiro | druidi | Circolo di Velthar | reputazione Circolo ≥ 2 × livello | alcuni incantesimi spostano la Marea su di te |
| Formule precuriane | nessuno, ufficialmente | reperti e testi delle rovine | trovare la formula | ogni lancio costa ½ Tormento o ½ Contaminazione; il Velo dà Sospetto |

## Regole

- **Dissonanza.** Se un lancio ottiene zero successi, il Mana torna indietro: +½ Tormento. Vale per
  tutte le tradizioni, in combattimento e fuori.
- **Imparare.** Ogni incantesimo è una quality (`incantesimo.dardo`). Lo insegna uno storylet che
  chiede Magia al livello giusto e la condizione della tradizione; la lezione costa 2 candele e una
  prova di Mentale + Magia (livello 1 Facile, 2 Media, 3 Difficile, 4 e 5 Molto difficile). Il prezzo
  si paga solo se la prova riesce.
- **Fuori dal combattimento.** Un incantesimo conosciuto apre opzioni negli storylet (campo
  `incantesimo` dell'opzione). Si tira Mentale + Magia e si pagano candele; l'Energia non si usa.
- **Armatura.** Gli incantesimi che fanno danno ignorano l'armatura.
- **Durata.** Potenziamenti e indebolimenti durano i round indicati; lo stesso effetto non si somma
  a se stesso, si rinnova.
- **PE.** In combattimento, se hai lanciato almeno un incantesimo, anche Magia riceve i PE dello
  scontro.
- **Rapidità.** Nella v0.4 dava anche +2 dadi all'iniziativa. L'iniziativa si tira una volta a inizio
  scontro, quindi nel motore resta solo +1 dado in attacco per 3 round.
- **Correzione.** Dopo una prova fallita, una candela e una prova Media di Magia: se riesce, l'esito
  fallito si annulla e la prova si ripete. Una sola Correzione per esito; il prezzo si paga comunque.

## Origini

- **Accolito del Velo:** il punto di Persuasione passa a Magia; parte con Benedizione.
- **Figlio del Circolo:** il punto di Resilienza passa a Magia; parte con Richiamo.
- **Allievo di Torvessa** (nuova, ottava origine): Fisico 1, Sociale 1, Mentale 3; Magia 3,
  Accademiche 3, Percezione 2, Tecnologia 1, Resilienza 1; Invito ai Quartieri Alti; Dardo e Luce
  fredda.
- Chiunque può trovare la magia arcana giocando: alla Locanda di Ilka le sedute di studio con Besk
  (prova Molto facile di Mentale + Magia) fanno salire Magia da 0, e con Magia 1 Besk insegna Luce
  fredda e Dardo.

## Incantesimi

Tipi in combattimento: attacco (tiro contro la difesa indicata), automatico (successi fissi),
area (un tiro contro ciascun nemico), potenziamento, indebolimento, cura, fuga. L'elenco completo
con gli effetti è in `contenuti/incantesimi.yaml`.

| Tradizione | Livello 1 | Livello 2 | Livello 3 | Livello 4–5 |
|---|---|---|---|---|
| Cristalli | Dardo, Scudo arcano, Sussurro di paura, Luce fredda | Fiamma, Rapidità, Leggere il Mana | Lancia di luce, Sigillo | Folgore (5) |
| Albero | Benedizione | Rimarginare, Veglia | Esorcismo | |
| Respiro | Pelle di corteccia, Richiamo | Radici | Veleno dell'anima, Bere la Marea | Tempesta (4) |
| Precuriane | | | Maledizione, Correzione | Paralisi (4), Eco (4), Comando (5) |
