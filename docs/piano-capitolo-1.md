# Piano dei contenuti · Capitolo I

Approvato il 30 settembre 2026. Le parti che mancano nel verbale (Atto II di *Sotto la pelle*, stanze C25–C26 ed
E5–E7 di Capomozzo) le scriviamo noi, seguendo quello che c'è prima e dopo.

**Avanzamento.** Blocco 1 fatto: prologhi per origine (`contenuti/prologo/`), il Grifone come casa
(`contenuti/grifone.yaml`), il sistema delle spedizioni (`src/motore/spedizioni.ts`). Blocco 2 fatto: la Dama
d'Argento arriva a 11 (`contenuti/piste/`), con tre strade per il passo 9 e quattro carte della Città Bassa; un
seguito lasciato a metà resta in cima alla storia finché non lo giochi. Il 1° ottobre: più voce nei testi
(sezione "La voce" di `docs/stile-dei-testi.md`) e il glossario dei tooltip (`contenuti/glossario/`), con la
prima occorrenza di ogni nome sottolineata in ogni blocco di prosa. Blocco 3 fatto: il Sepolcro violato fino
a 7 (`contenuti/piste/sepolcro-*.yaml`), con la Roccia di Wren come prima spedizione; il passo della cripta dà
l'invito ai Quartieri Alti, così la Biblioteca è raggiungibile da ogni origine. Ogni stanza di spedizione ha una
via senza prova che costa due candele e un po' di Ferite o Tormento. Blocco 4 fatto: la caccia di Corin fino a 6
(`contenuti/piste/corin*.yaml`) con la Foresta Strisciante, e la Promessa dell'Arpia al Teatro
(`contenuti/piste/teatro.yaml`). Le cavalcature sono accessori con la chiave `cavalcatura`: ogni ingresso in
spedizione ha un'opzione a cavallo che costa una candela in meno. Dopo il blocco 4: le candele passano da 20 a 40 (ricarica
invariata, una ogni 10 minuti) e c'è l'allenamento di base (`contenuti/allenamento.yaml`): ogni abilità si allena
da zero in città fino a 2, con prove Molto facili su una sola abilità. Blocco 5 fatto: il registro del custode fino
a 5 (`contenuti/piste/registro.yaml`, con tre strade per decifrarlo, una senza invito alla Pignatta) e le cinque
tribù fino a 4 (`contenuti/piste/tribu*.yaml`) con la Palude Acquanera.

Base: verbale del Capitolo I (versione rinominata), schedario del Codex, contenuti già nel gioco.
Il gioco parte tre giorni dopo la razzia del Festival; il protagonista è uno solo e arriva da una delle otto origini.

## Cornice

- **Prologo per origine.** Uno storylet d'apertura per ciascuna origine racconta dove eri durante la razzia (la piazza, la porta nord col cavalcatore di Dorbak, i Ponti, la Cattedrale). Fa da primo combattimento guidato e ti lascia un aggancio verso una delle piste iniziali.
- **Il Grifone di Ferro come casa.** Liaren, Brunella, la bacheca (esiste già) e Gaia Acari che ti osserva dal suo tavolo. Una settimana di alloggio pagata da Corin Ashdale, per ringraziarti di quello che hai fatto durante la razzia.
- **Le scene legate ai PG della cronaca** diventano aperte a tutti oppure legate a un'origine o a un'abilità. Braska risponde a chi ha Natura o Addestrare animali. La moneta di Mirhya arriva come carta rara a chi ha Magia o Tormento alto. Il passato con Squiggor tocca a chi è cresciuto in Città Bassa o tra i Raschiatori. Alla fine del capitolo ricevi una sola Maschera fra le quattro, e la scegli tu.

## Piste principali

| Pista | Contenuto (dal verbale) | Dove | Si apre con | Porta a |
|---|---|---|---|---|
| **Dama d'Argento** (`pista.dama-argento`, 0–11) | Via dei Rasoi e gli Scuri (patto con Rozalia, minaccia o rissa con Squiggor); il Ponte del Pesce; interrogare un morto (con la magia o pagando un sacerdote); Jass e le sue tre vie | CB, Ponti | già attiva | Registro, Tribù |
| **Il Sepolcro violato** (`pista.sepolcro`, 0–7) | Galdrick e Borso in Caserma; cimitero e cripta; Biblioteca (Stanne, Mattias, Padre Walter: il nucleo della macchina, Balthog, le Notti Cucite); Roccia di Wren e lo spettro del Cucitore; secondo giro in Biblioteca (gli archivi mutilati su Capomozzo) | QA, CB, spedizione breve | bacheca del Grifone | Tribù, Capomozzo |
| **La caccia di Corin** (`pista.corin`, 0–6) | Corin al Grifone; Stroud alle Scuderie della Zanna Rotta; la Foresta Strisciante (Spiumatori, fossa, vermi-carogna, cinghiale mutato); il banchetto; gli organi portati in Biblioteca | Ponti, CB, spedizione | carta o bacheca | Sepolcro (prova), Gilda |
| **Il registro del custode** (`pista.registro`, 0–5) | Maedric Holl al Ponte dei Morti (fingerti cliente, trattare o combattere); decifrare il registro (Lira Demos o Mattias Crenn); rapporto a Galdrick; i mulini bruciati dei Malgrani | Ponti, QA | `indizio.custode-notturno` (Dama 9 → 10) | Sotto la pelle |
| **Le cinque tribù** (`pista.tribu`, 0–4) | Municipio con Galdrick, Julia e Ilvaena; cena con Ilvaena (tribù ed eroi orchi); Palude Acquanera con Bolgrum e Skarr | QA, spedizione | Dama 11 e Sepolcro 7 | Acciaio e Ira |
| **Acciaio e Ira** (`pista.acciaio`, 0–8) | Ondrel irrompe al Grifone; la taverniera scomparsa e la lettera di Isvaro; l'Acciaieria (i curiosi davanti, gli orchi alla fornace, Isvaro); il diario di Isvaro; Liaren salvata; le Segrete dell'Ira (Uzgreth, Yoggoth, il Pozzo da prosciugare) | CB, spedizione | Tribù ≥ 4 | Capomozzo |
| **Capomozzo** (`pista.capomozzo`, 0–10) | Rovolungo e Borgoth; la fortezza (Balthog, Ombrafosca); primo livello (Zagrath, i cuccioli d'orco, il diario di Aurenne, Garin e Kessa); secondo livello (Aurenne e il congegno, il Costruttore, la Maschera); ritorno in Cattedrale, la Madre del Velo, Aurenne che si risveglia; i Raschiatori e la discesa verso la Strada Antica | spedizione, QA, Ponti | Acciaio ≥ 8 e Sepolcro 7 | fine del Capitolo I |

Le prime tre piste corrono in parallelo fin dall'inizio. La discesa all'ascensore della Cicatrice chiude il capitolo; tutto il resto della città rimane giocabile.

## Archi secondari

- **La Promessa dell'Arpia.** La prima è stata rinviata per la razzia e Belcanto cerca attori, costumisti e aiutanti. Le prove al Teatro diventano un ripetibile di Espressività, con esiti comici e un po' di fama.
- **Topi in cantina.** Una carta di Rilla Tamberlo per l'Emporio; gli esiti vanno dal pulito allo Scandalo, e la porta dell'Emporio si può chiudere.
- **L'Arena.** Si apre dopo le Tribù ed è un ripetibile a gradi con `fama.arena`: la mischia, poi tre ondate, poi la finale contro Galdrick, Dragna, Ilvaena e Ottilia. La squadra degli Scuri resta umiliata e prepara l'arco successivo.
- **Sotto la pelle di Qir-Azel.** Si apre dopo il Registro: l'infiltrazione notturna al Maniero Malgrani (spedizione con allarme e prove raccolte), il Municipio, l'assalto alla Pignatta, Galdrick contro Vesh. Il modo in cui tratti la folla lascia `nomea.citta-bassa`, che colora gli storylet del quartiere.
- **Le rovine dei Raschiatori** (Vhar'Ul, il Laboratorio di Calibrazione, il Sito Mahr-Kel) come spedizioni ripetibili per chi ha il posto nei turni di scavo: reperti, celle, frammenti di memoria su Nhar'Kael.

## Sistemi da aggiungere (piccoli)

- **Spedizioni.** Nuovo tipo di area per i luoghi fuori città e i sotterranei, costruito sulla meccanica delle aree di penalità (non compaiono sulla mappa, ci entri da uno storylet). Ogni spedizione ha un mazzo proprio di carte-stanza e un contatore `profondita.<id>`; il boss si apre a una soglia, e la ritirata è sempre possibile ma azzera il contatore.
- **Documenti leggibili.** I diari di Isvaro e di Aurenne, il registro cifrato, il registro dei Malgrani e le registrazioni di Ashvarre diventano frammenti da leggere in Averi, come quelli che esistono già.

**Come funzionano (blocco 1).** Un'area con `spedizione: { ritorno, soglia, stanze }` non compare sulla mappa;
ci si entra con `vai` da uno storylet. I suoi ripetibili sono stanze: se ne vedono `stanze` alla volta (3 di
default), estratte a caso e rimescolate a ogni punto di `profondita.<area>`, quality generata dal build. In cima
alla pagina c'è la barra della profondità e il pulsante per tornare verso l'area di ritorno, che azzera la
profondità; si azzera anche uscendo con un `vai`. Gli storylet non ripetibili dell'area (il cuore, il boss) si
aprono con requisiti sulla profondità. Le carte "ovunque" non si pescano in spedizione, le crisi scattano lo
stesso. Il prologo usa il tipo `prologo`, che si apre da solo come una crisi: `prologo` vale 1 alla creazione
del personaggio, 2 dopo la scena dell'origine, 0 dopo *Tre giorni dopo*.

## Qualità nuove

Le sette piste; `fama` (quanto la città ti riconosce, chiesta da Galdrick); `fama.arena`; `nomea.citta-bassa`; `profondita.<spedizione>`; `documento.*`; `allarme.maniero`; `pozzo-dell-ira` (le colate da esaurire). `rep.caserma`, `rep.scuri`, `rep.malgrani`, `rep.tarvelin` e `debito.scuri` esistono già e vengono spostate dalle scelte.

## Oggetti dal verbale

- **Armi e armature:** la spada orchesca, l'armatura di pelle e l'arco corto di Druzk; le spade orchesche della fortezza; il giaco di maglia di Balthog; la spada da ogre di Uzgreth.
- **Reperti:** la bacchetta della stretta folgorante (a cariche); il registratore olografico di Ashvarre (si decifra); il congegno di controllo (confonde le macchine, e ogni ordine costa Tormento); la Fonte di energia di Vhar'Ul; la Matrice di levigazione.
- **Accessori:** il Cristallo di visione del vero (con un difetto); i cristalli anti-Marea (Schermata); la chiave a stella a sette punte; il pugnale dell'arpia; il simbolo del Grande Albero Rosso in platino.
- **Consumabili e beni:** la pergamena di un incantesimo (un solo lancio); i Fluidi di rigenerazione; le microbatterie (celle); le parti di droni; la collana e la tunica di seta da vendere.
- **Cavalcature:** il cavallo da guerra di Corin e Ombrafosca, come accessori con un bonus a Cavalcare. Riducono di una candela l'ingresso nelle spedizioni.

## Nemici

Orchi delle cinque tribù, il sacerdote-guerriero col tamburo, il cinghiale mutato, i vermi-carogna, i morti della cripta, lo spettro del Cucitore, i ceffi della Segheria, gli Scuri (Rozalia, Squiggor, i balestrieri), Maedric e i suoi uomini, Bolgrum e Skarr, Isvaro, le colate dell'Ira, Uzgreth, Yoggoth, Borgoth con Cenerascura, i Camminatori, Balthog, Zagrath, il Tentalith, Garin e Kessa, Aurenne col quadrupede, il Costruttore di Capomozzo. Le creature con nomi presi da D&D (Glabrezu, Vargouille, Wight, Allip, il drago bianco, i mostri dell'Arena) vanno sostituite con voci del bestiario del Codex.

## Carte per area

- **Città Bassa:** la nebbia grigia che sale da una grata; i ceffi vestiti da operai; la lanterna spenta della Maison; i balestrieri sui tetti; Gaia che ti segue; un uomo dei Malgrani che ti sbarra la strada; l'incubo del Cucitore che gira fra i bambini.
- **Ponti Sospesi:** un Raschiatore disperso; Dragna che sceglie chi scende; Corin con un incarico; Stroud e il suo odio per gli orchi; una lanterna nuova sul Ponte dei Morti.
- **Quartieri Alti:** Ottilia che ti ferma dopo un guaio coi Raschiatori; Padre Vantes con una commissione; Belcanto che cerca attori; i curiosi che riconoscono l'eroe; una stella color lavanda.
- **Ovunque:** la moneta che vibra (Crepuscolo), rara.

## Ripetibili

Raccontare storie a Liaren, per uno sconto e PE in Espressività; le ricerche in Biblioteca, che danno informazioni; le serate alla Maison, per voci e fiducia di Nerissa; i falsi di Rozalia alla Pignatta; le pattuglie con la milizia, che fanno salire `rep.caserma`; le prove al Teatro; l'Arena.

## Dopo la trama: la città viva

Deciso il 1° ottobre 2026. Chiusa la trama principale del Capitolo I (blocchi 6–8), si fa un passaggio "città
viva", un luogo alla volta. Ogni luogo importante riceve un'attività ripetibile tipica, un servizio (negozio,
maestro, cure), una reputazione propria a gradini e due o tre storie secondarie che si aprono con quella
reputazione. Per la magia: l'Arte dei cristalli all'Accademia di Torvessa, la Liturgia dell'Albero in Cattedrale,
la Via del Respiro al Circolo, le Formule precuriane con Ambrin e i reperti. I villaggi fuori città diventano zone
vere solo dal Capitolo II, quando la storia lascia Qir-Azel.

**I luoghi (fatto il 1° ottobre 2026).** Il passaggio poggia sui mini-hub già pronti: `contenuti/luoghi.yaml`
definisce i luoghi di ogni quartiere (immagine, una riga per la scheda, una presentazione, le botteghe che vi si
aprono), e gli storylet vi si agganciano con `presso: <luogo>`. Il quartiere mostra le occasioni, *La tua
storia* (tutte le storie disponibili, ovunque siano), la griglia dei luoghi con il conto di storie e cose da fare,
e *In giro per…* con i ripetibili senza luogo. Un luogo senza niente di disponibile non compare. I luoghi sono
solo presentazione: entrarci non costa candele. Le storie nuove dei blocchi 6–8 vanno agganciate a un luogo
quando ne hanno uno; l'Acciaieria diventa luogo nel blocco 6, quando ha più di un ripetibile.

## Audio da completare

Annotato il 1° ottobre 2026. In gioco ci sono le dieci musiche di Lisette Amago e cinque ambienti di Andrea Baroni
(Temple-Mystical, Temple-Quiet, Forest-Night, Forest-WindyAndCreepy, Campfire). Mancano questi ambienti, già
assegnati in `contenuti/audio.yaml` e per ora muti:

- **Village** (Ponti Sospesi, Ostracismo) e **Mines**: gli MP3 su Drive sono a 270–300 kbps e superano il limite di
  download del collegamento; vanno riesportati a 96 kbps costanti.
- **HellishDungeonI** (crisi, Delirio) e **DungeonI** (Prigione): stesso problema, da riesportare a 96 kbps.
- **Minetown** (Città Bassa) e **Cave**: non ancora convertiti.

I file vanno in `../audio-nyzar/ambienti/` con il nome originale; poi `npm run audio` li livella e li importa.

## Ordine di produzione

1. Prologhi per origine, il Grifone come casa, il sistema delle spedizioni.
2. Dama d'Argento completa (fino a Jass).
3. Sepolcro violato, Biblioteca, Roccia di Wren.
4. La caccia di Corin (Foresta Strisciante) e il Teatro.
5. Registro del custode, Cinque tribù, Palude Acquanera.
6. Acciaio e Ira e le Segrete.
7. Capomozzo, il ritorno e la partenza.
8. Arena, Sotto la pelle, rovine dei Raschiatori, Topi in cantina.

Stima complessiva: circa 90 storylet, 60 carte di spedizione, 25 carte di città, 30 oggetti, 35 nemici. Ogni blocco si chiude con validazione, controllo dello stile e una partita di prova.

## Buchi nel verbale

- Manca l'Atto II di *Sotto la pelle* e la nota del master sul perché si va al Maniero è rimasta aperta.
- Mancano le stanze C25–C26 di Capomozzo e E5–E7 del secondo livello.
- Nel copione dell'Arpia restano «Silver Pond» ed «Empty Glass».
