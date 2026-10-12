# Le Avventure

Quattordici avventure di One Shot Wonders rifatte per Ny'Zar (progetto approvato da Luca il 12 ottobre 2026, doc
«Avventure di Ny'Zar — Progetto di adattamento»). Ognuna è una catena lunga con il marchio «Avventura», chiusa da una
spedizione di 10 step e da un oggetto di grado 4.

## Regole comuni

- **Geografia chiusa.** Nessun villaggio o città nuovi: in Superficie Fratturata ci sono solo Ghoran, Pannion,
  Tuarmir e Laresh, l'unica città è Qir-Azel. Si possono aggiungere rovine, grotte, cripte, PNG e piccole storie
  locali dentro luoghi già noti, senza contraddire glossario e Codex.
- **Nomi.** Tutti i nomi del manuale si cambiano. I nomi nuovi li inventa chi scrive (Luca li approva in blocco):
  controlla che non esistano già in `contenuti/glossario/` e nei glossari dei villaggi, e che non vengano da Rise of
  the Runelords. Ogni nome nuovo va nel `glossario.yaml` dell'Avventura.
- **Clima.** Niente neve né ghiaccio naturali; il gelo dell'avventura 3 viene da una macchina dei Precursori.
- **Canone dei villaggi.** Le Avventure di villaggio si aprono dopo il passo 15 della quest del villaggio: prima di
  scrivere leggi la quest (`contenuti/villaggi/<villaggio>/`) e il glossario del villaggio, usa i PNG che esistono
  dove servono e non contraddire ciò che la quest ha stabilito.
- **Stile.** `docs/stile-dei-testi.md` vale per intero. `npm run stile` deve dare 0 segnalazioni.

## Convenzioni tecniche

| Cosa | Forma |
| --- | --- |
| Cartella | `contenuti/avventure/<id>/` (`storia.yaml`, `spedizione.yaml`, `nemici.yaml`, `oggetti.yaml`, `glossario.yaml`) |
| Pista | `avventura.<id>`, categoria `pista`, da 0 a circa 8. Il prefisso `avventura.` dà il marchio «Avventura» (`src/motore/serie.ts`) |
| Altre quality | `avv-<id>.<nome>` (vantaggi, scelte, stati) |
| Area della spedizione | `avv-<id>`, con `spedizione: { ritorno: <area da cui si entra>, soglia: 10, stanze: 3 }` |
| Storylet, nemici, scontri, oggetti | id che cominciano con `avv-<id>-` |
| Cronache | la serie `avventura.<id>` nella sezione `avventure` di `contenuti/cronache.yaml` |

**Sblocco.** Avventure di Qir-Azel e della Superficie: `pista.capomozzo >= 10`. Avventure di villaggio:
`fazione.<villaggio> >= 15`.

**Struttura (circa 26 storylet).**

1. Aggancio (1-2): uno storylet fisso `presso` un luogo esistente, o una carta del mazzo dell'area. Porta la pista a 1.
2. Sviluppo (2-6): le scene della one-shot. Ogni scena riuscita può lasciare un vantaggio (`avv-<id>.vantaggio` o
   quality più precise) che in spedizione apre una via più facile con `requisiti`, o toglie un pericolo.
3. Spedizione: ingresso (storylet fuori dall'area, con `vai: avv-<id>`) con tre vie (prova Media; il vantaggio della
   fase 2; una via a 2 rintocchi). Stanze ripetibili in fasce, documentate in testa al file:
   - 1-3: 4 stanze, prove Medie e Difficili;
   - 4-6: 4 stanze più una stanza di svolta non ripetibile a profondità 5, prove Difficili;
   - 7-9: 4 stanze, prove Difficili, una Molto difficile o uno scontro per stanza;
   - 10: il cuore, non ripetibile, `profondita.avv-<id> >= 10` (lo cerca `test/spedizioni-percorribili.test.ts`).
   Ogni stanza ha una via senza prova da 2 rintocchi più ½ negativa (3 rintocchi nelle stanze 7-9). Chi fallisce
   prende almeno ½ negativa e non scende. Al cuore la sconfitta dà una negativa e `vai: <ritorno>`.
4. Epilogo (1-2): una scelta con conseguenze su reputazione o stato, poi `oggetto.avv-<id>-<nome>: 1`.

Prendi a modello `contenuti/villaggi/ghoran/spedizione-fossa.yaml` (fasce, cuore, `colonna`) e
`contenuti/luoghi-neri/campana/sfiati.yaml` (difficoltà), e le quest dei villaggi per l'aggancio con `presso`.

**Difficoltà.** Fra l'Atto IV dei villaggi e la Campana, più vicino alla Campana. Profilo di riferimento: «fine
contenuti» di `scripts/simula-fine.ts` (`npx tsx scripts/simula-fine.ts avv-<id>-`).

| | Valori |
| --- | --- |
| Gregari | attacco 5-6, PF 10-14, riduzione 3; vittoria fra 70 e 85% |
| Boss | attacco 6, PF 24-28, riduzione 5, `feriteSconfitta` 3, una fase o due brevi; vittoria fra 40 e 55% |
| Vie del boss | Difficili, e fallire costa (regola delle boss battle). L'avventura 11 è l'eccezione approvata: si vince proteggendo un rito |

**Ricompensa di grado 4.** Il budget è `punti ≤ grado + difetti` (`src/motore/contenuto.ts`). Armi, armature e scudi
hanno una `base`; gli accessori arrivano a grado 4 senza dadi (limite alzato per le Avventure). Modelli: i gradi 4
delle quest di fazione, per esempio `ghoran-bipenne-di-ragh` e `caserma-piastre-della-caserma`. Un difetto (legata,
riconoscibile, rumorosa…) dove ha senso.

**Prima di chiudere:** `npm run contenuti`, `npm run stile` (0 segnalazioni), `npx vitest run`, la simulazione dei
nemici. Le tavole riusano immagini già presenti in `public/tavole/` (nessuna tavola nuova in questa fase).

## Le quattordici

| # | id | Avventura | Dove | Sblocco | Grado 4 |
| --- | --- | --- | --- | --- | --- |
| 1 | `zanna-rotta` | La notte della Zanna Rotta | Qir-Azel, Città Bassa → Foresta Strisciante | capomozzo | armatura |
| 2 | `puliti` | I Puliti di Pannion | Pannion → acque sotto la vecchia Pannion | fazione.pannion | accessorio |
| 3 | `stazione-gelo` | La stazione del gelo | Gradone Rosso, stazione dei Precursori | capomozzo | scudo |
| 4 | `prove-guado` | Le Prove del Guado | Ghoran → Gradone Rosso | fazione.ghoran | arma |
| 5 | `ponte-pesce` | Il debito del Ponte del Pesce | Qir-Azel, Ponte del Pesce → Roccia di Wren | capomozzo | arma |
| 6 | `rosicaossa` | Il Rosicaossa | Qir-Azel, Ponte dei Morti → pareti della Cicatrice | capomozzo | scudo |
| 7 | `signora-gole` | La signora delle gole | strada del nord verso Pannion | fazione.pannion | arma |
| 8 | `divoratore` | Il Divoratore | Tuarmir, la gola | fazione.tuarmir | scudo |
| 9 | `libro-regina` | Il libro della regina | Ghoran → mausoleo nel Gradone Rosso | fazione.ghoran | accessorio |
| 10 | `buche-laresh` | Le buche di Laresh | Laresh, i campi | fazione.laresh | arma |
| 11 | `sogno-serpente` | La bambina che sognava il serpente | Tuarmir → la roccia rossa | fazione.tuarmir | accessorio |
| 12 | `investitura` | L'investitura | Qir-Azel, Maniero Castaldi | capomozzo | arma |
| 13 | `torchio` | Il torchio che non si ferma | Laresh, i mulini | fazione.laresh | armatura |
| 14 | `radura-spenta` | La radura spenta | Bosco di Velthar | capomozzo | armatura |

### 1 · La notte della Zanna Rotta (Secret to Bear)
I cavalli delle Scuderie della Zanna Rotta vengono sbranati di notte. Il colpevole è un mercante ospite della
Locanda di Ilka, contaminato dalla Marea Grigia senza saperlo: di notte una mutazione lo fa diventare una bestia
irsuta. Aggancio: lo stalliere cerca chi sappia leggere tracce (`chiave.cavalcatura` cambia la scena). Sviluppo: la
stalla senza tracce esterne e il sangue che sale al bagno della locanda; i tre ospiti che si accusano a vicenda; la
notte della trasformazione, uno scontro da contenere chiudendolo in stalla; il mattino, quando il mercante ricorda la
radura dove ha raccolto un cristallo. Spedizione nella Foresta Strisciante: 1-3 il suo itinerario a ritroso; 4-6 la
radura del cristallo, svolta a 5 (altri animali mutati: la sacca è ancora attiva); 7-9 la tana dei contaminati.
Cuore: la prima creatura toccata dalla sacca, un orso grigio enorme. Epilogo: il mercante alla Caserma o al Circolo
di Velthar. Ricompensa: armatura di pelliccia grigia.

### 2 · I Puliti di Pannion (In Too Deep)
Metà di Pannion si dice «pulita»: mangia pesce crudo, incide gocce sugli stipiti, sta ferma per ore. Un collezionista
di curiosità salito da Qir-Azel ha svegliato con un tomo una creatura del Regno Profondo che dorme nelle acque sotto
la vecchia Pannion. Aggancio: un contadino immune (amuleto dei Precursori ereditato) offre una paga alta per il
raccolto, perché i braccianti non vengono più. Sviluppo: le stranezze; l'osteria dove tutti si voltano insieme e
salutano in coro; i fedeli che trascinano un uomo all'acqua; il rito sul bordo guidato dal collezionista; lo
scontro, in cui alcuni fedeli caduti diventano bocche informi. Spedizione: 1-3 la cisterna allagata; 4-6 le rovine
dell'antico dominio della creatura, svolta a 5 (murali: un tempo regnava su un impero); 7-9 la soglia del Regno
Profondo, dove le visioni chiedono di arrendersi. Cuore: la creatura offre di «pulirti» (accettare = sconfitta),
poi lo scontro in acqua. Epilogo: il villaggio si sveglia; il contadino ti dà l'amuleto, accessorio che scherma la
mente.

### 3 · La stazione del gelo (Flee or Freeze)
Un ex magister dell'Accademia di Torvessa vive in una stazione dei Precursori sul Gradone Rosso e ha rimesso in moto
una macchina che gela le stanze; chi entra nelle sue terre si sveglia in cella senza armi. Aggancio: l'Accademia
cerca chi porti una lettera al magister sparito da anni. Sviluppo: la cella gelata e il custode che ride; il fantasma
di una Raschiatrice morta tentando la fuga, che indica lo specchio-portale nella sala del tesoro; il recupero
dell'equipaggiamento da un forziere. Spedizione al contrario (la profondità misura quanto ti avvicini allo specchio):
1-3 segrete e bestie del gelo; 4-6 corridoi coperti di glifi; 7-9 sale eleganti dove il freddo uccide. Svolta a 9:
il custode toglie il travestimento ed è il magister. Cuore: lo scontro mentre lo specchio si carica, vinto anche
attraversandolo con una prova Difficile. Epilogo: lo specchio porta al Grifone di Ferro. Ricompensa: scudo del
tesoro, proprietà lucida.

### 4 · Le Prove del Guado (Ice Trials)
A Ghoran i clan tengono ogni anno le Prove del Guado; un campione del clan della Pece vince da nove anni ed è l'unico
iscritto. Aggancio: l'organizzatrice, una ragazza che vuole ridare vita alle Prove, ti iscrive in fretta. Sviluppo:
spingere cinghiali corazzati nel recinto; la discesa delle rapide afferrando i nastri; l'abbattimento a gara di un
albero; l'attacco di una gigantessa degli Spacca-ossa, che porta via il campione ferito. Spedizione nel Gradone
Rosso: 1-3 le tracce e il bestiame rubato nei mesi prima; 4-6 le terrazze e i gregari della tribù; 7-9 la tana, con
il campione vivo. Cuore: la gigantessa. Epilogo: il campione ti dichiara vincitore davanti ai clan, banchetto.
Ricompensa: la sua arma, che ti cede.

### 5 · Il debito del Ponte del Pesce (Return the Favour)
Un pescatore del Ponte del Pesce è stato salvato nel Torvessa da un sommerso, uno della gente d'acqua delle grotte
allagate sotto la Roccia di Wren (lore nuova approvata). I suoi lo hanno incatenato per aver toccato un uomo di terra.
Aggancio: il pescatore fradicio cerca chi non abbia paura dell'acqua. Sviluppo: perché la riva sotto la Roccia è
deserta da anni; un modo per respirare sott'acqua (un cristallo conduttore da comprare o rubare); i turni delle
guardie osservati dalla riva. Spedizione: 1-3 la corrente, i granchi giganti e il polpo che ha affondato la barca;
4-6 le grotte e il prigioniero incatenato a un'ancora; 7-9 le guardie da stordire una alla volta (se ti scoprono le
stanze rimaste diventano scontri). Cuore: la fuga verso le acque profonde con il capo delle guardie alle spalle.
Ricompensa: l'arpione del sommerso.

### 6 · Il Rosicaossa (Truth or Scare)
I ragazzi della Città Bassa si sfidano a scendere sotto il Ponte dei Morti, nella tana del Rosicaossa della
filastrocca; una ragazzina non è tornata. Il Rosicaossa esiste: una creatura antica annidata sulle pareti della
Cicatrice del Mondo, che svuota le ossa ai vivi. Aggancio: l'amica che l'ha sfidata ti afferra il braccio sul ponte.
Sviluppo: il gioco degli obblighi e il punto da cui si è calata; chi in Città Bassa conosce i condotti, mentre
l'acqua di scolo comincia a salire. Spedizione (l'acqua sale: dopo il 5 la via senza prova costa un rintocco in più):
1-3 condotti ripidi e scivolosi; 4-6 due servitori bugiardi; 7-9 corridoi con glifi instabili. Cuore: il Rosicaossa
con due svuotati, Raschiatori spariti negli anni. Epilogo: la ragazzina non ricorda nulla. Ricompensa: scudo di ossa
e ferro del ponte.

### 7 · La signora delle gole (Lure of the Lamia)
Sulla strada del nord, prima di Pannion, briganti con gli occhi bianchi assaltano chi passa. Li comanda contro la loro
volontà una creatura serpentina che lega le menti con cristalli conduttori piantati nella nuca. Il capitano della
scorta della Gilda dei Mercanti su quella strada è suo complice, comprato con la promessa di una parte del bottino.
Aggancio: l'agguato; la capa dei briganti sussurra «aiuto» e ti passa una mappa prima di svenire. Sviluppo: il
capitano che arriva e offre una ricompensa; i briganti troppo storditi per parlare; la mappa. Spedizione: 1-3 la
pista della mappa fra le gole; 4-6 la tana di uno scorpione gigante, dove il capitano combatte al tuo fianco; 7-9 la
frana illusoria e il covo pieno di sete rubate. Svolta e cuore: uno dei briganti è lei travestita; prova ad
affascinarti, poi combatte con il capitano. Epilogo: i briganti tornano liberi. Ricompensa: la lama ingioiellata
della signora.

### 8 · Il Divoratore (On Shaky Ground)
Scosse sempre più forti nella gola di Tuarmir: un verme gigantesco, il Divoratore delle storie dei vecchi, risale
verso il villaggio. Non si combatte a viso aperto: si evacua e lo si fa saltare. Aggancio: all'alba crolla un muro
accanto a te. Sviluppo: carri, casse e capre impazzite; l'infermeria bloccata dalle macerie, con sciami spinti fuori
dal terreno; la campana d'allarme da suonare mentre la torre trema; le cariche, da Raschiatori o Acciaieria Tarvelin
a seconda della reputazione. Spedizione (la profondità conta le cariche piazzate nelle gallerie del verme prima che
torni): 1-3 gallerie vecchie; 4-6 gallerie fresche e calde, svolta a 5 (il verme passa a pochi metri); 7-9 la
strozzatura della gola. Cuore: il verme arriva, tre prove Difficili di fila per accendere le micce e uscire vivo.
Ricompensa: scudo ricavato da una placca del suo dente.

### 9 · Il libro della regina (The Tomb's Tome)
Un predatore di rovine ha rubato un libro dal mausoleo di una regina vissuta prima della Guerra del Cristallo, di cui
nessuno ricorda il regno (lore nuova approvata), e ha portato la maledizione a Ghoran. Aggancio: lo stalliere crolla
davanti a te, scavato e giallo. Sviluppo: il ladro febbricitante che stringe il libro; la maledizione che colpisce
anche te (Contaminazione che sale a ogni scena finché il libro non torna). Spedizione nel mausoleo del Gradone Rosso:
sei statue di ancelle con le mani vuote; 1-6 ritrovi pergamena, rosario, spada, lira, incensiere e teschio (ombre si
svegliano mentre cerchi); 7-9 la camera reale, che si chiude alle tue spalle. Cuore: rimetti il libro e la regina si
alza con le ancelle; ti offre di restare custode per sempre, se rifiuti combatte. Ricompensa: il bracciale della
regina (accessorio).

### 10 · Le buche di Laresh (On Burrowed Time)
I campi di Laresh si riempiono di buche ogni notte e il raccolto sparisce: sotto c'è una colonia di insetti
scavatori giganti. Due coltivatori confinanti litigano, e in fondo sono migliori amici. Aggancio: un avviso per una
disinfestazione semplice, appeso al mulino. Sviluppo: la padrona che vuole sapere chi le ruba il raccolto; il vicino
che giura di aver visto un insetto grande come un vitello; lo stivale della caposquadra accanto a una buca. Spedizione
(il tunnel crolla alle spalle all'ingresso): 1-3 pozze di saliva acida; 4-6 larve che mangiano metallo (via senza
prova che toglie un consumabile); 7-9 le dispense, con la caposquadra viva. Cuore: il nido, in due fasi, con larve
nuove a ogni turno. Ricompensa: una lama dalla mandibola della regina degli scavatori.

### 11 · La bambina che sognava il serpente (Chasing Dreams)
A Tuarmir uno scalpellino cerca la figlia sparita da due notti; lei sognava un serpente alato. È salita da sola alla
roccia rossa sopra la gola, dove dorme una guardiana antica che l'ha scelta. Aggancio: lo scalpellino attacca avvisi
al pozzo. Sviluppo: la stanza della bambina, con i disegni e la finestra sulla roccia; le impronte fino a una crepa
segnata da un serpente con le ali. Spedizione nel tempio, una prova per fascia: 1-2 il coraggio (guardiani di
pietra); 3-4 il rispetto (una porta che si apre a chi bussa e chiede; forzarla costa Tormento); 5-6 la generosità
(piedistalli che chiedono un'offerta vera: consumabili o un oggetto); 7-9 la gentilezza (un cinghiale ferito: se lo
abbatti la porta resta chiusa, se lo curi si apre). Cuore: la guardiana veglia la bambina durante un rito;
combatterla è Molto difficile e costa caro, la via giusta è proteggere il rito con tre prove Difficili non di
combattimento. Ricompensa: una penna della guardiana (accessorio).

### 12 · L'investitura (Surprise Guests)
Al Maniero Castaldi si tiene a mezzanotte l'investitura di una giovane erede dei Castaldi, e tu sei il testimone
esterno chiamato per tradizione. Una parente lontana voleva quel titolo e colpisce adesso, perché dopo la firma sul
libro dell'investitura non potrà più farlo senza essere esiliata. Aggancio: l'invito, con la richiesta di portare un
dono personale. Sviluppo: lo scambio dei doni; i voti interrotti, quando le candele si spengono e le guardie crollano
in un sonno strano. Spedizione = l'assedio (la profondità conta le ore della notte; tieni la sala mentre gli ospiti
sono chiusi di sotto): 1-3 sciami di pipistrelli dalle travi; 4-6 mantelli d'ombra e un sabotaggio delle luci,
svolta a 5 (un ospite tradisce); 7-9 statue animate dalle gallerie. Cuore: la parente esce dal buio davanti
all'altare; madre e guardia del corpo intervengono se hai tenuto in vita abbastanza ospiti. Ricompensa: la lama
dell'investitura.

### 13 · Il torchio che non si ferma (Trouble Brewing)
A Laresh un investitore di Qir-Azel ha costruito un torchio e distilleria a mana e automi; guarda solo al guadagno e
ha rifiutato i sistemi di sicurezza. Un fulmine ha guastato i controlli e gli automi, comprati all'Orlo dei Rottami e
migliorati dal meccanico, sono impazziti. Aggancio: l'invito alla visita prima dell'inaugurazione (l'investitore ha
sentito che di recente ti sei arricchito). Sviluppo: l'investitore in fuga oltre il cancello; il meccanico allo
stremo, che spiega l'unico modo per fermare tutto: distruggere il pannello centrale. Spedizione: 1-3 cancelli e
cesoie volanti; 4-6 il frutteto, con tre ospiti su un albero che regge poco e i raccoglitori di rame; 7-9 il reparto,
vapore bollente e mosto che rende il pavimento una lastra. Cuore: il portabotti impazzito e accelerato; lo batti
oppure colpisci il pannello alle sue spalle con prove Difficili. Epilogo: un'investitrice della Gilda dei Mercanti
compra tutto e promuove il meccanico. Ricompensa: la corazza del portabotti.

### 14 · La radura spenta (Nightmare Glade)
Un novizio del Circolo di Velthar ha lasciato spegnere la lanterna del santuario al margine del Bosco di Velthar.
Cavalli di fuoco nero hanno occupato la radura sacra e scacciato il suo guardiano, un cervo bianco antichissimo; il
bosco marcisce. Aggancio: il novizio inginocchiato al santuario. Sviluppo: la lanterna e il vetro dimenticato; le
impronte di zoccoli bruciate. Spedizione: 1-3 il bosco corrotto, rovi che feriscono; 4-6 la fossa dei serpenti sotto
le foglie bruciate; 7-9 l'anello di betulle in fiamme. Cuore: cinque cavalli neri in due fasi; quando ne resta uno
torna il cervo bianco e combatte con te. Epilogo: la radura guarisce. Ricompensa: un mantello di cuoio benedetto dal
Circolo (armatura).
