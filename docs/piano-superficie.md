# Piano · la Superficie dopo l'Arena

Approvato da Luca il 10 ottobre 2026. Dopo la fine dell'Arena (`pista.arena >= 5`, vittoria o sconfitta) la
Superficie Fratturata si apre: i quattro villaggi diventano luoghi con la loro quest da 15 passi, un'azione
ripetibile scopre nove spedizioni nuove nei luoghi neri del Codex, e le nove insieme aprono una spedizione finale
lunga e durissima, la Campana Sepolta.

Questo file è anche la guida per chi scrive i contenuti: id, quality condivise, fili di trama, numeri.
Valgono tutte le regole di `CLAUDE.md`, `docs/ripresa.md` e `docs/stile-dei-testi.md`.

## Decisioni di Luca

- Lo sblocco è solo `pista.arena >= 5` (anche se l'Arena può finire prima di `pista.capomozzo >= 10`).
- Il filo della Campana è canone: il suono basso che precedette la Caduta veniva da uno strumento d'allarme dei
  Precursori sparso sotto la Superficie, e i luoghi neri ne sono i pezzi. Se abbia provocato la Caduta o l'abbia
  annunciata resta aperto per il Capitolo II.
- Dama Ryn Velar e Frate Koln restano con questi nomi.
- La spedizione finale chiede le nove spedizioni nuove. Le tre rovine del Grifone, Korith e la Gradinata non contano.
- Dragna Gro-Malog resta come nel gioco: addestra le reclute dei Raschiatori al Grifone. Non fa la buttafuori.

## Nomi (dal testo di Luca al gioco)

Ameiko Kaijitsu → Liaren Tarvelin. Locanda del Drago Arrugginito → Locanda del Grifone di Ferro. Julia Deverin →
Julia Castaldi. Titus Scarnetti → Ottone Malgrani (i mulini di Laresh sono una concessione dei Malgrani). Padre
Zantus → Padre Aurelio Vantes. Stoot → Roccia di Wren. Palude Ceppofreddo → Palude Acquanera. «Gilda dei
Raschiatori» → i Raschiatori (nel gioco «la Gilda» sono i Mercanti). Restano uguali: Ragh Kor'Nul, Tasha la Bianca,
Dama Ryn Velar, Old Marrek, Cahir, Madre Cerya, Lonn Var, Sorella Alenna, Darrin Huld, Frate Koln, Arelan Dorr.
Mai Koruvus, Stoot, Sette Denti, Boscogratto, Kaijitsu, Scarnetti, Deverin, Sandpoint.

## Geografia

| Direzione | Villaggio | Luoghi neri vicini |
|---|---|---|
| Nord, verso il Rovolungo e Velthar | nessuno | Anello del Camminatore (nord-ovest), Spina dell'Eco |
| Est, verso il Gradone Rosso | Pannion (nord-est, nel fumo dei carbonai) | Lente del Sornione, Soglia di Mara |
| Sud, oltre il Gradone verso la palude | Ghoran | Costola di Drago, Tamburi di Fondo |
| Ovest | Laresh (campi e mulini), Tuarmir (la gola) | Volta dell'Aculeo e Anello (Laresh), Forno della Nonna e Stele dei Naviganti (Tuarmir) |

Ogni villaggio dà una traccia sui suoi due luoghi neri (vedi sotto). La Spina dell'Eco non ha un villaggio: le sue
tracce vengono dall'azione e dalla carta.

## Struttura dei file

```
contenuti/scoperte/tracce.yaml        quality condivise, l'aggancio dopo l'Arena, «Battere la Superficie», le carte
contenuti/scoperte/<luogo>.yaml       una spedizione per file, con area, ingresso, stanze, cuore, nemici, oggetti, colonna
contenuti/villaggi/<villaggio>/       quest.yaml, luogo.yaml, passi-1/2/3.yaml, spedizione-*.yaml, nemici.yaml,
                                      oggetti.yaml, glossario.yaml (come le fazioni in contenuti/fazioni/<id>/)
contenuti/campana/                    la spedizione finale, in più file
scripts/simula-fine.ts                probabilità di vittoria per un personaggio di fine capitolo e di fine contenuti
```

La colonna sonora di ogni area e luogo nuovo va nel file che lo definisce (sezione `colonna:`), con le tracce che ci
sono già in `contenuti/audio.yaml`. Le tavole sono solo quelle che esistono in `public/tavole/` (o le icone
`icone/<nome>` di game-icons.net): non se ne aggiungono senza Luca.

## Quality condivise (in `contenuti/scoperte/tracce.yaml`)

| Quality | Valori | A cosa serve |
|---|---|---|
| `villaggi.notizie` | 0/1 | l'aggancio dopo l'Arena è stato letto |
| `traccia.<luogo>` | 0–3 | a 3 il luogo è scoperto e il suo ingresso compare sulla Superficie |
| `misura.<luogo>` | 0/1 | il cuore della spedizione è stato vinto una volta: la misura del luogo è presa |
| `dono.<villaggio>` | 0/1 | la quest del villaggio è finita: il dono apre una via in più nella Campana |

I nove `<luogo>`: `costola`, `tamburi`, `aculeo`, `anello`, `forno`, `stele`, `sornione`, `mara`, `spina`.
I quattro `<villaggio>`: `ghoran`, `laresh`, `tuarmir`, `pannion`.

**Da dove vengono le tracce:**
1. `battere-la-superficie`, ripetibile sulla Superficie con `pista.arena >= 5`: una direzione per volta, una prova
   Media, il successo dà una traccia al primo luogo non ancora scoperto di quella direzione.
2. Le carte del mazzo della Superficie, una per luogo (`carta-voci-<luogo>`), con `traccia.<luogo> < 3`.
3. I villaggi: il passo 3 della quest di ogni villaggio (il grado 1) dà una traccia a ciascuno dei suoi due luoghi.

## I villaggi

Ogni villaggio è un **luogo** dell'area `superficie-fratturata`, con id uguale al nome (`ghoran`, `laresh`,
`tuarmir`, `pannion`) e `requisiti: [pista.arena >= 5]`. Dentro, come nella città viva (`contenuti/citta/biblioteca.yaml`):

- **un'attività ripetibile** con `presso`, opzioni a fasce di `rep.<villaggio>` (`< 2`, `>= 2, < 4`, `>= 4, < 6`,
  `>= 6`) che danno poco (monete, merci della Superficie, reperti) e alzano la reputazione di ½ fino a un tetto;
- **un servizio** ripetibile (un mestiere del villaggio che si compra: cure, una scorta, una vendita, un'informazione);
- la reputazione `rep.<villaggio>` (`categoria: reputazione, famiglia: Luoghi`).

Le tre storie a gradini 2/4/6 della città viva qui non servono: al loro posto c'è la quest.

**La quest** è una fazione del gioco (`fazioni:` con id del villaggio, `reputazione: rep.<villaggio>`,
`pista: fazione.<villaggio>`), con 15 passi in cinque atti e i gradi ai passi 3, 6, 9, 12, 15, come le nove fazioni
(`docs/ripresa.md`, «Le quest di fazione»; esempio completo in `contenuti/fazioni/raschiatori/`):
- la scena del passo N chiede `fazione.<villaggio> == N-1` e lo chiude con `effetti: { fazione.<villaggio>: 1 }`;
- il passo 0 chiede anche `pista.arena >= 5`; le scene stanno presso il luogo del villaggio o in giro per la
  Superficie, qualcuna in città quando la trama lo vuole;
- i passi di grado portano la reputazione almeno a 2, 4, 6, 8, 10 con `almeno: { rep.<villaggio>: N }`;
- il passo 3 dà anche `traccia.<a>: 1, traccia.<b>: 1` sui due luoghi neri del villaggio, con una riga di prosa
  che li nomina come voci della gente del posto;
- l'Atto IV ha una spedizione propria del villaggio (11 storylet circa: ingresso, 8–9 stanze in fasce, cuore con boss);
- il passo 15 dà l'oggetto unico di grado 4 della quest e `dono.<villaggio>: 1`;
- ricompense ai gradi: un oggetto, un servizio o un incantesimo a ogni grado, come le fazioni;
- origini: almeno 6 paragrafi d'origine e 3 opzioni d'origine nella quest; il Fuggiasco di Ghoran conta molto a
  Ghoran, l'Accolito del Velo a Tuarmir, il Mercante dei Ponti a Laresh e il Figlio della Città Bassa con gli Scuri.

**Il segno della Campana.** In ogni villaggio qualcosa si sta svegliando, e una scena per villaggio (non prima
dell'Atto III) lo mostra senza spiegarlo: a Ghoran le radici della Fossa palpitano anche senza sangue, a Laresh i
fuochi azzurri si mettono in fila verso un punto, a Tuarmir il vento soffia da dove prima non soffiava, a Pannion il
Vecchio cresce di un dito in una notte. Nessun villaggio scopre che cos'è: la risposta sta nella Campana.

### Ghoran · «Si pesa» (il più legato alle trame)
Palafitte annerite su pozze di fango, passerelle che cedono, torce di pece. Comandano i clan, che riconoscono Ragh
Kor'Nul (un occhio solo, voce profonda, memoria che non perdona). Commercio di prigionieri, mercenariato, bestie da
combattimento; Tasha la Bianca vende schiavi con eleganza fredda e dice di liberare le anime con la sofferenza. Ogni
notte i tamburi del campo dei gladiatori. Sotto l'arena c'è la Fossa del Seme, più antica del villaggio, con pareti
che nessun martello scheggia e radici nere che reagiscono al sangue. Ci si combatte solo per le dispute serie fra
famiglie; Ragh non ci scende da diciannove anni e là sotto, in un patto, ha perso l'occhio. Chi ne risale vivo è
parente di clan. Ghoran è a sud, oltre il Gradone Rosso. Il motto è «A Ghoran non si compra. Si pesa».
- Fili già nel gioco da raccogliere con `quando`: i mercenari di Durgan all'Arena (`piste/arena.yaml`), Tasha e
  `gilda.tasha` (passo 10 della Gilda), il Pesatore Ulmo Strass e Brina (Caserma), Nella di Ghoran e
  `raschiatori.merlach`, Lucia Malgrani e la zia Urtilia Mendion a Ghoran dopo `pista.pelle >= 7`, l'origine
  `fuggiasco-di-ghoran` e il suo prologo (`contenuti/prologo/prologhi-2.yaml`).
- Spedizione dell'Atto IV: **la Fossa del Seme**.
- Arco proposto: arrivare e farsi pesare (l'arena dei gladiatori); una disputa fra clan in cui fai da peso; i
  commerci di Tasha e una scelta sugli schiavi; la Fossa che si sveglia; il patto di Ragh e la discesa.

### Laresh · «La terra che beve»
Campagne a perdita d'occhio, mulini e stalle lungo i rii, case basse di fango e paglia, il grano resistente che fa il
pane di Qir-Azel. Di notte lucciole e fuochi azzurri ad altezza d'uomo. Dama Ryn Velar, vedova asciutta e severa,
amministra le terre del marito ed è fedele a Julia Castaldi e al programma delle licenze sul grano; teme i
Raschiatori che passano a reclutare i giovani. I mulini sono concessione dei Malgrani da decenni. Old Marrek,
mugnaio cieco del mulino centrale, sente la macina e legge il futuro nelle crepe del grano bruciato (preciso sulle
carestie, impreciso sull'amore, pagato in idromele); dice che la terra ogni tanto beve sangue. Cahir, stalliere
mezzelfo di venticinque anni, sogna una carovana indipendente.
- Fili già nel gioco: la pista di Laresh della Gilda (`fazioni/gilda/spedizione-laresh.yaml`, con Cahir e i suoi
  cani, il grano nero, i fuochi azzurri, i mugnai diventati predoni), i granai dei Castaldi e il guado del Consiglio,
  il Mulino Nero della Caserma, Corin Ashdale che vive a Laresh dopo `pista.corin >= 6`, e dopo `pista.pelle >= 7` i
  mulini dei Malgrani che passano alle cooperative (varianti con `quando`).
- Spedizione dell'Atto IV: **il campo che beve**, sotto il mulino centrale.

### Tuarmir · «Il vento nuovo»
Una gola di roccia scura dove il sole arriva poche ore al giorno, case scavate nella pietra e coperte di muschio,
maschere di stoffa impregnate d'erbe per la raccolta. Il villaggio vive di erbe e funghi per la Confraternita del Velo.
Madre Cerya, erborista cieca da quando a nove anni guardò un fungo che non andava guardato, guida la raccolta con
autorità assoluta. Lonn Var controlla le rotte e vende «droghe spirituali» ai Quartieri Alti. Sorella Alenna, del
Velo, è lì da otto mesi per controllarlo; scrive a Padre Aurelio Vantes che le erbe stanno cambiando. Cerya dice
che il vento prima soffiava dalla Cicatrice e ora soffia da qualcosa che non sa nominare.
- Fili già nel gioco: la gola sotto il villaggio è il passo 11 del Velo (`fazioni/velo/spedizione-gola.yaml`: Lonn
  Var, le erbatrici, il fungo da non guardare, Madre Cerya, l'Eco di Serad, `velo.alenna` 1 se Alenna è tornata in
  città, 2 se è rimasta con Cerya). La quest del villaggio non ripete la gola: va in alto, da dove entra il vento.
- Spedizione dell'Atto IV: **la gola alta**.

### Pannion · «Il Vecchio»
Un'altura di terra rossa fra sequoie minori e fiumi di linfa solidificata che luccicano come vetro colato, case di
legno scuro e resina, piogge di scintille d'estate, odore costante di fumo. Lanterne sui pontili per guidare a casa
gli spiriti della foresta. Si taglia il legname per i ponti di Qir-Azel e si cuoce il carbone per le forge. Il
Caposquadra Darrin Huld, di poche parole, non ama la città ma tiene fede alle consegne per Julia Castaldi. Al centro
il Vecchio Albero, totem nero alto come una casa, che cresce ancora; Darrin gli parla per nome. Frate Koln, del Velo,
raccoglie ai suoi piedi una linfa rossastra per gli unguenti della cappella, e la linfa funziona.
- Fili già nel gioco: i carbonai e il motto «Per il fumo di Pannion» (`superficie/carte-1.yaml`), Nihali e i capi
  delle bande dei villaggi (`fazioni/scuri/passi-3.yaml`), la mappa di Ottone con Pannion cerchiato («legname,
  prezzo nostro», `piste/pelle-maniero.yaml`), Aldous Castaldi e i contratti di legname, Delek il carbonaio nel
  diario di Aurenne (`piste/capomozzo-ritorno.yaml`).
- **La vecchia Pannion**: il villaggio di oggi sta sull'altura; quello vecchio, più in basso, è stato lasciato al
  bosco, che si è ripreso le case. Lì c'è la Conca degli specchi del Codex (`codex/superficie.yaml`).
- Spedizione dell'Atto IV: **la vecchia Pannion**, con la Conca degli specchi.

## Le nove spedizioni dei luoghi neri

Una per file in `contenuti/scoperte/`. L'area ha id uguale al nome del luogo (`costola-di-drago`, `tamburi-di-fondo`,
`volta-dell-aculeo`, `anello-del-camminatore`, `forno-della-nonna`, `stele-dei-naviganti`, `lente-del-sornione`,
`soglia-di-mara`, `spina-dell-eco`), `spedizione: { ritorno: superficie-fratturata, soglia: 4, stanze: 3 }`.

- **Ingresso**: storylet ripetibile nell'area `superficie-fratturata` con `requisiti: [traccia.<luogo> >= 3]`, come
  `villaggio-in-lontananza` (`contenuti/superficie/villaggio.yaml`): la prima volta è la scoperta. Vie con prova,
  una via a cavallo (`chiave.cavalcatura`) a costo 0, una via a costo 2.
- **Stanze**: 8–9 ripetibili in fasce di profondità (0, 1, 2, 3, con qualche fascia doppia), documentate in testa al
  file. Le stanze **non** chiedono la traccia: ci si arriva solo dall'ingresso. Ogni stanza ha due prove (Media,
  qualcuna Difficile) e una via senza prova da 2 rintocchi con un po' di Ferite, Tormento o Contaminazione.
- **Cuore** a profondità 4, non ripetibile, `requisiti: [profondita.<area> >= 4, misura.<luogo> == 0]`: il boss o
  la prova grande; la vittoria dà `misura.<luogo>: 1`, un oggetto unico del luogo (grado 2–3), reliquie o parti dei
  Precursori, e `vai: superficie-fratturata`. Chi fallisce torna in Superficie senza misura e può ritentare.
- **Dopo**: un secondo cuore ripetibile con `misura.<luogo> >= 1` e `profondita.<area> >= 4`, che rende meno (come
  la variante `villaggio.vinto` del villaggio storto), così la spedizione resta una fonte di reperti.
- Il test `test/spedizioni-percorribili.test.ts` cerca il cuore fra gli storylet **non ripetibili** con
  `profondita.<area> >= soglia`, e prende come punto di partenza i requisiti `==` del cuore (qui `misura.<luogo> == 0`).
- Boss: al livello delle spedizioni di fazione dell'Atto IV (il pilota di Korith: attacco 5, difesa 4, difesa
  mentale 5, PF 14, danno 4, riduzione 4). Per un combattente di fine capitolo (`npx tsx scripts/simula-fine.ts`)
  i boss stanno fra il 45 e il 65%, i gregari sopra l'80%.

**Che cosa misura ogni luogo.** Ogni luogo nero è un organo della Campana, e la sua misura è un pezzo di quello che
serve per trovarla e aprirla. Nessuna spedizione dice che cos'è la Campana: si vede un congegno che fa una cosa, e
una scritta, un'eco o una macchina lascia capire che fa parte di qualcosa di più grande. Le nove misure si mettono
insieme solo nella spedizione finale.

| Luogo | Che cosa c'è sotto | La misura |
|---|---|---|
| Costola di Drago (alture a sud di Ghoran) | una canna di risonanza lunga quanto una collina, che vibra sempre sulla stessa nota bassa | **la nota**: un diapason di metallo nero che, battuto, la ripete |
| Tamburi di Fondo (guado nord della Palude Acquanera) | una camera allagata con un battente che bussa tre colpi ogni mezzanotte: un contatore | **il conto**: quanti colpi restano, inciso su una piastra che scala da sola |
| Volta dell'Aculeo (Conca dei Rovi, a ovest di Laresh) | la cupola sfondata di uno sfiato, che fischia una notte all'anno: la prova annuale dello strumento | **la data**: la notte del fischio e la sua durata |
| Anello del Camminatore (nord-ovest, margini del Rovolungo) | nove pietre che sono nove tasti; sotto, un quadrante che fa girare chi ci entra | **l'ordine**: in che sequenza le nove misure vanno date alla Campana. Le nove pietre sono i nove luoghi |
| Forno della Nonna (strada di Tuarmir) | la stanza calda di un operatore, uno scambiatore che non si è mai spento; il bambino seduto al tavolo nei sogni è la memoria di chi ci lavorava | **il nome**: la parola con cui l'operatore si faceva riconoscere dalle macchine |
| Stele dei Naviganti (sud-ovest, oltre la Foresta Strisciante) | di giorno le ombre puntano a Korith, come nel canone dei Raschiatori; nella notte di luna nuova la settima colonna proietta un'ombra in più | **la direzione**: dove punta l'ombra in più |
| Lente del Sornione (oltre l'orlo nord del Gradone Rosso) | un occhio rivolto in alto, che mostra il cielo com'era la notte del suono, con due stelle che oggi non ci sono | **il cielo**: la posizione delle due stelle, cioè l'ora |
| Soglia di Mara (crinale a est della Roccia di Wren) | una porta di servizio: chi ci passa al tramonto è per tre battiti dentro la Campana (pioggia salata, fuoco di legna) | **la porta**: la chiave del passaggio, un gesto o un oggetto |
| Spina dell'Eco (pianura fra Velthar e il Rovolungo) | la voce dello strumento, che ripete con nove battiti di ritardo. La scena del Circolo (`circolo-la-spina-dell-eco`, la parola di quattro sillabe) resta in superficie: la spedizione scende sotto | **la voce**: il richiamo a cui la Campana risponde |

Le Stele e la Soglia dicono insieme dove sta la Campana: sotto una scogliera della costa grigia a nord-est, oltre il
Rovolungo (il nome del posto lo dà la spedizione finale).

## La Campana Sepolta (la spedizione finale)

- **Sblocco**: le nove misure (`misura.<luogo> >= 1` per tutti e nove). Lo annuncia una scena non ripetibile sulla
  Superficie, `le-nove-misure`, con la tavola e una musica propria: le misure messe insieme indicano un punto
  della costa.
- **Struttura**: quattro strati in catena, come Capomozzo, ognuno un'area spedizione con soglia 5 (venti stanze in
  tutto). Il progresso fra gli strati resta (`campana.strato` da 0 a 4); dentro uno strato la ritirata azzera la
  profondità. Alla fine dei primi tre strati un guardiano.
  1. Gli sfiati: gallerie allagate dalla marea, sale e ruggine.
  2. Le canne: una foresta di canne di metallo, il suono che fa male (Tormento).
  3. Il coro: la sala degli operatori, la Marea come memoria corrotta (il bambino al tavolo del Forno, di nuovo).
  4. La camera del batacchio: la Campana, e il Campanaro.
- **Prove**: Difficili e Molto difficili; le vie senza prova costano 2 o 3 rintocchi più Ferite, Tormento o
  Contaminazione. I doni dei villaggi (`dono.<villaggio> >= 1`) aprono una via più facile in uno strato ciascuno.
- **Il Campanaro**: una quarta forma della Salvaguardia (il Codex ne conosce tre), in tre scontri di fila, con
  `feriteSconfitta: 4` e statistiche oltre il massimo attuale. Con `scripts/simula-fine.ts` il personaggio di fine
  contenuti deve vincere ogni fase fra il 15 e il 35%; tutte e tre di fila restano un'impresa.
- **Ricompense**: tre o quattro oggetti di grado 5 (oggi non ne esiste nessuno), più un accessorio di grado 3.
- **La scelta finale**: zittire la Campana o lasciarla armata (`campana.scelta` 1 o 2), un aggancio per il Capitolo II.

## Numeri

- Scene di storia 150–250 parole, azioni ripetibili 80–150, esiti anche due righe.
- Ogni fallimento nelle storie, nei seguiti e nelle carte dà almeno ½ di una negativa; le ripetibili no.
- Oggetti: le quest dei villaggi danno al passo 15 un oggetto unico di grado 4, come le fazioni; le spedizioni
  dei luoghi neri un oggetto di grado 2–3; la Campana tre o quattro di grado 5.
- Nemici: quelli dei villaggi e dei luoghi neri al livello delle quest di fazione (boss al 45–65% per il combattente
  di fine capitolo), quelli della Campana oltre.

## Avanzamento

- [x] Blocco 1: questo piano, `contenuti/scoperte/tracce.yaml` (quality condivise, aggancio dopo l'Arena,
      «Battere la Superficie», nove carte), `scripts/simula-fine.ts`, le tre incongruenze.
- [x] Blocchi 2–5: Ghoran, Laresh, Tuarmir, Pannion (`contenuti/villaggi/`, 28–32 storylet ciascuno).
- [x] Blocchi 6–7: le nove spedizioni (`contenuti/scoperte/`, 11–12 storylet ciascuna).
- [x] Blocco 8: la Campana Sepolta (`contenuti/campana/`, la Ripamuta, 4 strati da 11 stanze, il Campanaro in tre fasi).

## Canone fissato dai contenuti (da rivedere con Luca)

- **I segni dei nove luoghi**, nell'ordine delle pietre dell'Anello: 1 cerchio (Anello), 2 porta (Mara), 3 mano
  aperta (Forno), 4 riga fra due onde (Spina), 5 occhio (Sornione), 6 punta (Aculeo), 7 tre punti (Tamburi),
  8 sette righe (Stele), 9 arco curvo (Costola). In ogni luogo nero c'è un cerchio di nove incavi, con il segno del
  luogo inciso più a fondo e un condotto verso nord-est.
- **Le misure**: la nota si canta (non c'è un diapason); il conto dei Tamburi si copia a mano e scende di tre colpi
  a notte; la Lancetta dell'Aculeo spinge di un dente a notte la ruota dei giorni; l'operatore del Forno si chiamava
  Nan'Ireth (da qui «la Nonna»); le due stelle del Sornione, una bianca e una rossa, segnano l'ultima ora prima
  dell'alba; la porta di Mara è un gesto (palmo sinistro sul pilastro, tre battiti a occhi chiusi); il richiamo della
  Spina sono tre note discendenti, l'ultima tenuta nove battiti.
- **La Campana** sta sotto la Ripamuta, una scogliera di basalto della costa grigia oltre il Rovolungo. La scelta
  finale è `campana.scelta` (1 zittita, 2 armata).
- **Ghoran**: Ragh diede l'occhio al custode del Seme, la massa nera sotto la Fossa; a fine quest il patto si rinnova
  o la radice madre si taglia (`ghoran.patto`).
- **Laresh**: sotto il mulino centrale un impianto dei Precursori beve acqua e sangue dei campi e li manda verso
  nord-est; il grano di Laresh viene dal campo pallido sotterraneo.
- **Tuarmir**: la grata della Sella, dove il vento nuovo entra nella montagna, e il muschio sordo.
- **Pannion**: il villaggio salì sull'altura settant'anni fa, dopo una notte in cui la terra fece un suono basso e
  le sequoie piansero linfa per una stagione.
