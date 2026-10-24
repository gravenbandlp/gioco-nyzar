# Le storie del gioco

Generato da `npm run mappa-storie` (`scripts/mappa-storie.ts`): non modificarlo a mano. Le sezioni e l'ordine sono
quelli delle Cronache (`contenuti/cronache.yaml`); le serie le ricava `src/motore/serie.ts`.

## Le storie di Qir-Azel

### La Dama d'Argento

`pista.dama-argento` · 11 passi · 17 scene

- **File:** `aree/citta-bassa.yaml`, `piste/dama-argento-1.yaml`, `piste/dama-argento-2.yaml`
- **Passi:**
  0. «Una parola orchesca»
  1. «Chi parla la lingua dei Nove Chiodi»
  2. «La Segheria Malgrani»
  3. «Il sorriso di Marko»
  4. «La lanterna accesa»
  5. «La padrona di casa»
  6. «La stanza Luna Crescente»
  7. «Gli Scuri in Via dei Rasoi»
  8. «Il Ponte del Pesce»
  9. «I morti parlano», «La porta aperta», «Il resoconto alla Pignatta», «I conti in pari», «Il tagliagole in cella», «Quello che sa un tagliagole»
  10. «Il doppio filo»

### Il Sepolcro violato

`pista.sepolcro` · 7 passi · 11 scene

- **File:** `piste/sepolcro-1.yaml`, `piste/sepolcro-2.yaml`, `piste/sepolcro-roccia.yaml`
- **Spedizioni:** Roccia di Wren (`roccia-di-wren`)
- **Passi:**
  0. «Un avviso con il sigillo»
  1. «La lastra forzata»
  2. «Sotto la lastra», «Il sarcofago vuoto»
  3. «Il nucleo della macchina»
  4. «La strada per la Roccia», «L'airone», «L'altare del Cucitore»
  5. «Gli archivi», «Prima dell'apertura»
  6. «Il rapporto»

### La caccia di Corin

`pista.corin` · 6 passi · 13 scene

- **File:** `piste/corin-foresta.yaml`, `piste/corin.yaml`
- **Spedizioni:** Foresta Strisciante (`foresta-strisciante`)
- **Dipende da:** L'Arena di Qir-Azel almeno al passo 1; Sotto la pelle di Qir-Azel almeno al passo 5
- **Oggetti:** Cavallo da guerra
- **Passi:**
  0. «Un mercante al Grifone»
  1. «Le Scuderie della Zanna Rotta»
  2. «Verso la Foresta Strisciante», «Nella fossa», «La farfalla foglia-rossa», «Il cinghiale mutato»
  3. «Il puma nero», «Il banchetto del cinghiale»
  4. «Senza architettura», «Ampolle e Rimedi»
  5. «La carovana per Laresh»

### La Promessa dell'Arpia

`pista.teatro` · 2 passi · 4 scene

- **File:** `piste/teatro.yaml`
- **Dipende da:** Sotto la pelle di Qir-Azel almeno al passo 5
- **Passi:**
  0. «Il Teatro delle Meraviglie», «Un manifesto fresco di colla»
  1. «La prima della Promessa»

### Il registro del custode

`pista.registro` · 5 passi · 12 scene

- **File:** `piste/registro.yaml`
- **Dipende da:** Le cinque tribù almeno al passo 4
- **Passi:**
  0. «Il Ponte dei Morti, di notte»
  1. «Il custode notturno», «Le tariffe», «Il gabbiotto», «Senza uomini»
  2. «Il cifrario del custode», «L'archivio dei dazi», «Il cifrario dei custodi», «Quello che c'è scritto»
  3. «L'unico mulino»
  4. «Il registro sul tavolo dello sceriffo», «Il registro alla Caserma»

### Le cinque tribù

`pista.tribu` · 4 passi · 7 scene

- **File:** `piste/tribu-palude.yaml`, `piste/tribu.yaml`
- **Spedizioni:** Palude Acquanera (`palude-acquanera`)
- **Dipende da:** La Dama d'Argento almeno al passo 11; Il Sepolcro violato almeno al passo 7
- **Passi:**
  0. «Brutte notizie in Municipio»
  1. «Cena con Ilvaena»
  2. «Verso la Palude Acquanera», «La lanterna nel fango», «La torre di Bolgrum»
  3. «Rapporto in Municipio», «Una tribù su cinque»

### Acciaio e Ira

`pista.acciaio` · 8 passi · 14 scene

- **File:** `piste/acciaio-1.yaml`, `piste/acciaio-acciaieria.yaml`, `piste/acciaio-pozzo.yaml`, `piste/acciaio-segrete.yaml`
- **Spedizioni:** Acciaieria dei Tarvelin (`acciaieria`), Segrete dell'Ira (`segrete-dell-ira`), Vhar'Ul (`vhar-ul`), Laboratorio di Calibrazione (`laboratorio-di-calibrazione`), Sito Mahr-Kel (`mahr-kel`)
- **Dipende da:** Le cinque tribù almeno al passo 4
- **Oggetti:** Diario di Isvaro, Arco di Isvaro, Spadone di Uzgreth, Cilindro di lyssan
- **Passi:**
  0. «L'ultimatum»
  1. «La taverniera scomparsa», «I figli di Ondrel»
  2. «L'Acciaieria chiusa»
  3. «La fornace»
  4. «La cella»
  5. «Sul gradino», «Il diario di Isvaro»
  6. «Il tunnel dei contrabbandieri», «Di nuovo nel tunnel», «Uzgreth alle fosse», «L'Aula dell'Ira»
  7. «La vasca asciutta», «Il pozzo prosciugato»

### Capomozzo

`pista.capomozzo` · 10 passi · 27 scene

- **File:** `piste/capomozzo-1.yaml`, `piste/capomozzo-cuore.yaml`, `piste/capomozzo-forte.yaml`, `piste/capomozzo-ritorno.yaml`, `piste/capomozzo-sotterranei.yaml`
- **Spedizioni:** Rovolungo (`rovolungo`), Il cuore di Capomozzo (`cuore-di-capomozzo`), Capomozzo (`capomozzo`), I sotterranei di Capomozzo (`sotto-capomozzo`)
- **Dipende da:** Acciaio e Ira almeno al passo 8; Il Sepolcro violato almeno al passo 7
- **Oggetti:** Respiratore, Congegno di controllo, Stella a sette punte, Cristalli anti-Marea, Maschera della Forza, Maschera della Rottura, Maschera della Distorsione, Maschera della Natura, Ombrafosca, Giaco di maglia di Balthog, Spada orchesca di Druzk, Armatura di Druzk, Diario di Aurenne
- **Passi:**
  0. «La strada per Capomozzo»
  1. «La grotta sotto il Buco», «La tana di Borgoth», «Borgoth parla», «Gli amici nuovi»
  2. «Il cavallo in gabbia», «La camera del capotribù», «Balthog il Prescelto»
  3. «Le gabbie dei cuccioli», «La tana del Pungitore», «L'harem di Dorbak», «Il pagliericcio», «La stanza pulita», «Garin e Kessa»
  4. «Il ponte di osservazione», «La mia vera madre»
  5. «La porta della stella», «La rovina sommersa», «Il titano dormiente», «La maschera spaccata», «La corsa»
  6. «Il ritorno a Qir-Azel»
  7. «La Madre del Velo»
  8. «Aurenne si risveglia»
  9. «I Raschiatori», «L'orlo della Cicatrice»

### L'Arena di Qir-Azel

`pista.arena` · 5 passi · 8 scene

- **File:** `citta/carte.yaml`, `piste/arena.yaml`
- **Dipende da:** La caccia di Corin almeno al passo 6; Capomozzo almeno al passo 7; Sotto la pelle di Qir-Azel almeno al passo 7
- **Oggetti:** Fermaglio di Orvald, Cintura del campione
- **Passi:**
  0. «Una lettera da Laresh», «L'annuncio dei cristalli»
  1. «La Grande Mischia»
  2. «La prova a squadre», «Una leggenda»
  3. «L'ora dei gladiatori»
  4. «Lo scontro delle ere»

### Sotto la pelle di Qir-Azel

`pista.pelle` · 7 passi · 16 scene

- **File:** `piste/pelle-maniero.yaml`, `piste/pelle-scuri.yaml`
- **Spedizioni:** Maniero Malgrani (`maniero-malgrani`)
- **Dipende da:** Il registro del custode almeno al passo 5; Capomozzo almeno al passo 7
- **Oggetti:** Registro dei pagamenti, Cristallo della visione del vero
- **Passi:**
  0. «La mappa coi segnalini rossi»
  1. «Lo studio di Ottone», «Lucia Malgrani», «Roldan Kael», «Il pianoforte dei Malgrani»
  2. «Una radice»
  3. «La bisca nella cisterna», «Il vicolo della Dispensa», «Il quarto pilone», «La chiave disegnata», «Il cane della Caserma»
  4. «L'alba non porta luce»
  5. «L'assalto alla Pignatta», «Dieci anni»
  6. «La città dopo Vesh»

## Le fazioni della città

### Confraternita del Velo: La riga strappata

`fazione.velo` · 15 passi · 36 scene · gradi ai passi 3, 6, 9, 12, 15

- **File:** `citta/cattedrale.yaml`, `fazioni/velo/passi-1.yaml`, `fazioni/velo/passi-2.yaml`, `fazioni/velo/passi-3.yaml`, `fazioni/velo/spedizione-gola.yaml`, `fazioni/velo/spedizione-sacca.yaml`
- **Spedizioni:** La gola di Tuarmir (`velo-gola-di-tuarmir`), La sacca sotto l'Orlo (`velo-sacca-dell-orlo`)
- **Dipende da:** Capomozzo almeno al passo 8; Sotto la pelle di Qir-Azel almeno al passo 6
- **Oggetti:** Il sigillo del Velo, La corda del laico, La lanterna del custode, Il velo grigio, La lama di Kael Dareth, Il simbolo dell'Albero in platino
- **Passi:**
  0. «I Giardini della Linfa», «Il ladro di linfa»
  1. «Le campane a lutto», «Il cronista dei bollettini»
  2. «I bollettini delle sacche», «La colonna dei laici»
  3. «Gli archivi minori», «La notte del Santuario»
  4. «Le firme della compieta», «Il campanile»
  5. «Il voto del Velo», «La veglia del voto»
  6. «La garitta dei piloni», «Il ragazzo che parla»
  7. «Il pozzo di scolo», «La sacca», «La corda al cristallo»
  8. «Lettere a nessuno», «A chi portarle»
  9. «Il predicatore dell'Antico», «La notte di Ardice»
  10. «La strada di Tuarmir», «La porta», «I due dischi»
  11. «La Madre non riceve», «Sotto l'altare», «La navata della sera»
  12. «Il tè di Valdrano», «Chi avvertire»
  13. «La compieta grande», «Il cristallo batte fuori tempo»
  14. «La bocca cucita», «Davanti al Consiglio», «La scala delle celle», «La lettera falsa»

### Gilda dei Mercanti: Il terzo piano

`fazione.gilda` · 15 passi · 34 scene · gradi ai passi 3, 6, 9, 12, 15

- **File:** `fazioni/gilda/passi-1.yaml`, `fazioni/gilda/passi-2.yaml`, `fazioni/gilda/passi-3.yaml`, `fazioni/gilda/spedizione-laresh.yaml`, `fazioni/gilda/spedizione-monconi.yaml`, `fazioni/gilda/spedizione-ponte-dei-morti.yaml`
- **Spedizioni:** La pista di Laresh (`gilda-pista-di-laresh`), I monconi del Ventisette (`gilda-monconi-del-ventisette`), Sotto il Ponte dei Morti (`gilda-sotto-il-ponte-dei-morti`)
- **Dipende da:** Capomozzo almeno al passo 10; Il registro del custode almeno al passo 5
- **Oggetti:** Gettone del socio di corda, Giubba dei Custodi di Passaggio, Sigillo del portasigillo, Cappa delle mille corde, Catena del terzo piano, Guanti delle tiracorde, Lanterna cieca di Maedric
- **Passi:**
  0. «L'avviso di Lira», «Il banco di Varn»
  1. «Le casse del Festival», «Fra le travi», «L'ammanco»
  2. «Il nodo di cera», «Il nodo davanti ai soci»
  3. «I sei carri per Laresh», «La carovana che non è arrivata», «Il carro coperto»
  4. «Timbri di notte», «Il banco del timbro», «Quello che sai dei timbri»
  5. «Il conto dei dazi», «Il conto al Municipio»
  6. «Due porte che si chiudono da dentro»
  7. «La botola del gabbiotto», «La casa appesa», «Il secondo libro»
  8. «Il sigillo», «La sera di Morlacchi»
  9. «La merce di Tasha»
  10. «Le tre versioni del Ventisette», «La camera del pilone», «Il documento e la scorta»
  11. «L'assemblea dei soci», «Quattro mani»
  12. «I voti delle botteghe», «Le corde toccate»
  13. «La notte prima del voto», «L'alba sulla campata», «Bracco appeso»
  14. «Il voto dei nodi», «La sala del terzo piano»

### La Caserma di Qir-Azel: Il mantello scarlatto

`fazione.caserma` · 15 passi · 28 scene · gradi ai passi 3, 6, 9, 12, 15

- **File:** `citta/guarnigione.yaml`, `fazioni/caserma/passi-1.yaml`, `fazioni/caserma/passi-2.yaml`, `fazioni/caserma/passi-3.yaml`, `fazioni/caserma/spedizione-mulino-nero.yaml`, `fazioni/caserma/spedizione-sotto-le-assi.yaml`, `fazioni/caserma/spedizione-strada-del-fango.yaml`
- **Spedizioni:** Il Mulino Nero (`caserma-mulino-nero`), Sotto le assi (`caserma-sotto-le-assi`), La strada del fango (`caserma-strada-del-fango`)
- **Dipende da:** Capomozzo almeno al passo 1; Sotto la pelle di Qir-Azel almeno al passo 6
- **Oggetti:** Giubba senza mostrine, Mantello scarlatto, Lanterna di ronda, Spada di Ivo Carstan, Distintivo del capitano, Piastre della Caserma, Mazzo di Nihali, Cotta della Caserma, Registro del Pesatore
- **Passi:**
  0. «Il registro del furiere»
  1. «La ronda di notte», «La lanterna sul Ponte dei Morti»
  2. «I mantelli dei morti», «Il giuramento»
  3. «La casa di pietra blu», «Il facchino che scappa»
  4. «La rete grande», «Nando Rizza»
  5. «Il fuoco al Ponte del Conciatore»
  6. «La paga che non arriva», «La seduta del Consiglio»
  7. «Il miliziano con la tosse», «Il debito di Fulvio Saldo»
  8. «La lista dello sceriffo», «Il nome nella lista»
  9. «I trenta di Ghoran»
  10. «Il Pesatore», «La porta delle cucine»
  11. «Il carro-gabbia», «Il registro del Pesatore»
  12. «La lettera da Ghoran», «In cima alla colonna»
  13. «La cantina sotto la ruota», «Il libro delle paghe»
  14. «La veglia per Carstan», «La teca»

### Consiglio di Qir-Azel: Dalla panca al tavolo

`fazione.consiglio` · 15 passi · 35 scene · gradi ai passi 3, 6, 9, 12, 15

- **File:** `citta/municipio.yaml`, `fazioni/consiglio/passi-1.yaml`, `fazioni/consiglio/passi-2.yaml`, `fazioni/consiglio/passi-3.yaml`, `fazioni/consiglio/passi-3b.yaml`, `fazioni/consiglio/spedizione-guado.yaml`, `fazioni/consiglio/spedizione-maniero.yaml`
- **Spedizioni:** Il guado del Torvessa (`consiglio-guado-del-torvessa`), Il Maniero Castaldi, di notte (`consiglio-maniero-di-notte`)
- **Dipende da:** Capomozzo almeno al passo 10; Le cinque tribù almeno al passo 1; Acciaio e Ira almeno al passo 8; Sotto la pelle di Qir-Azel almeno al passo 7
- **Oggetti:** Penna d'osso del Municipio, Lettera col sigillo del Consiglio, Cuoio della Guardia Castaldi, Spada del paladino stanco, Anello delle bilance, Mazza del Patto, Spilla del Consiglio, Pungolo da carrettiere di Sarpa, Guanti della Gazza
- **Passi:**
  0. «Le petizioni», «La cassa dei respinti»
  1. «Il ponticello di Ada»
  2. «Il ritratto della Rappresentante», «La faccia della Rappresentante», «Un angolo del bancone»
  3. «La cena di consiglio»
  4. «Un incarico del Consiglio», «Il nome sul registro»
  5. «La tribuna», «A inchiostro»
  6. «Il bilancio di Aldous»
  7. «I carri di Laresh», «Il guado vecchio»
  8. «Il grano nel magazzino», «Il messo del sigillo»
  9. «L'idromele delle dieci», «Il libretto di Ettore»
  10. «Le sedie vuote», «L'archivio che allaga», «Le pagine incollate»
  11. «Il giardino di Maerith», «La soglia del Maniero»
  12. «La notte prima della seduta», «Sui tetti di rame»
  13. «La vigilia della seduta», «La seduta», «Lo spoglio»
  14. «La spilla», «Il dispositivo»

### Accademia di Torvessa: Il cerchio aperto

`fazione.accademia` · 15 passi · 34 scene · gradi ai passi 3, 6, 9, 12, 15

- **File:** `citta/accademia.yaml`, `fazioni/accademia/passi-1.yaml`, `fazioni/accademia/passi-2.yaml`, `fazioni/accademia/passi-3.yaml`, `fazioni/accademia/spedizione-gallerie.yaml`, `fazioni/accademia/spedizione-gradone.yaml`, `fazioni/accademia/spedizione-lacrima.yaml`
- **Spedizioni:** Le gallerie della condotta (`accademia-gallerie-della-condotta`), Il Gradone Rosso (`accademia-gradone-rosso`), La Lacrima pietrificata (`accademia-lacrima-pietrificata`)
- **Dipende da:** Capomozzo almeno al passo 7
- **Oggetti:** Anello d'ottone dei Precursori, Cristallo d'aula, Lente da tasca di Tobol, Bastone del Regolatore, Mantello del cerchio aperto, Sigillo del cerchio aperto, Piccozza del centoventi
- **Passi:**
  0. «L'acqua che conta»
  1. «I cristalli del laboratorio», «La fontana di Via del Salmone»
  2. «La lite delle mappe», «Il registro degli uditori»
  3. «La Vecchia», «Il giuramento»
  4. «Il diario del centoventi»
  5. «La scarpata del Gradone», «Il nucleo del Gradone»
  6. «La stanza di Dalmas», «I quaderni di Dalmas»
  7. «La lingua delle macchine», «La ninna nanna di Ilka», «I calchi e la riga», «Due brevi e una lunga»
  8. «Una cattedra a Torvessa», «La chiave del seminterrato», «Il voto del maestro aggiunto»
  9. «L'acqua in Consiglio»
  10. «La colletta dei cristalli», «La notte del furto»
  11. «Il consiglio ristretto», «Le torbiere a nord del Torvessa», «La goccia che non cade»
  12. «La notte del battito», «Gli echi della Vecchia»
  13. «La sera prima del consiglio», «La scelta della condotta»
  14. «Il cerchio aperto», «Scendere nelle gallerie», «Il distacco»

### Maison des Lunes: La scatola di latta

`fazione.maison` · 15 passi · 30 scene · gradi ai passi 3, 6, 9, 12, 15

- **File:** `citta/maison.yaml`, `fazioni/maison/passi-1.yaml`, `fazioni/maison/passi-2.yaml`, `fazioni/maison/passi-3.yaml`, `fazioni/maison/spedizione-cena.yaml`, `fazioni/maison/spedizione-cristallo.yaml`, `fazioni/maison/spedizione-magazzini.yaml`
- **Spedizioni:** La cena di Marella (`maison-cena-al-maniero-castaldi`), Sotto il cristallo spento (`maison-sotto-il-cristallo-spento`), I magazzini del Ponte del Pesce (`maison-magazzini-del-ponte-del-pesce`)
- **Dipende da:** Capomozzo almeno al passo 10; Sotto la pelle di Qir-Azel almeno al passo 6; La Dama d'Argento almeno al passo 6
- **Oggetti:** Bastone animato dell'armadio, Ventaglio dei segnali, Cristallo accoppiato, Chiave della porta di servizio, Spilla della mezzaluna, Soprabito della sarta, Catena di bronzo, Il libro dei clienti di Vesh
- **Passi:**
  0. «Il quaderno di Sara»
  1. «La lanterna spenta, di nuovo», «La porta della Luna Calante»
  2. «La sala interna»
  3. «I segnali di Tachek», «Il cugino della Rappresentante»
  4. «Il fiasco senza biglietto», «Le domande gentili»
  5. «Ospite della Maison»
  6. «La lampada della Luna Calante»
  7. «La legnaia», «La camera d'ascolto»
  8. «Lo scrivano», «Il quaderno dello scrivano»
  9. «La luce color miele», «L'ammenda», «La proposta»
  10. «Un posto a tavola», «Quintus alla carrozza», «Julia sulla terrazza»
  11. «La sera prima del voto»
  12. «Voce del salotto», «Le pagine nella cenere»
  13. «La terza arcata», «Lo scrittoio dei Ferrante»
  14. «I fratelli Ferrante», «La scatola di latta»

### Raschiatori: Una lanterna per nome

`fazione.raschiatori` · 15 passi · 24 scene · gradi ai passi 3, 6, 9, 12, 15

- **File:** `fazioni/raschiatori/passi-1.yaml`, `fazioni/raschiatori/passi-2.yaml`, `fazioni/raschiatori/passi-3.yaml`, `fazioni/raschiatori/spedizione-gradinata.yaml`, `fazioni/raschiatori/spedizione-korith.yaml`, `fazioni/raschiatori/spedizione-pozzo.yaml`, `fazioni/raschiatori/spedizione-primo-strato.yaml`
- **Spedizioni:** La Gradinata Cieca (`raschiatori-gradinata`), Le Carcasse di Korith (`raschiatori-korith`), Il Pozzo Senzanome (`raschiatori-pozzo`), Il primo strato (`raschiatori-primo-strato`)
- **Dipende da:** Capomozzo almeno al passo 7; Acciaio e Ira almeno al passo 8
- **Oggetti:** Bracciale dei turni, Scandaglio di cristallo, Ascia da tunnel, Giubba del primo strato, Piccone della Fiamma, Bracciale di rame dei Quattro, Disco dei quattro segni, Carta di Korith
- **Passi:**
  0. «Due righe vuote», «Due posti vuoti»
  1. «Corde che non sono nostre», «Le lampade di notte»
  2. «La regola della casa»
  3. «Argento torna dai conti»
  4. «L'ottavo gradino», «Il custode delle file»
  5. «Il diritto di prima mappa»
  6. «Un giorno di marcia fuori»
  7. «L'argano sul Pozzo», «La camera del gelo»
  8. «Il giudizio del Ferro»
  9. «La penitenza», «Le ombre che indicano»
  10. «Le costole nella conca», «Il timone»
  11. «La Cripta e la chiave»
  12. «La lanterna nera»
  13. «Le piattaforme della Cicatrice», «La camera dei quattro»
  14. «Fiamma», «Una lanterna per nome»

### Scuri: Il tavolo d'angolo

`fazione.scuri` · 15 passi · 38 scene · gradi ai passi 3, 6, 9, 12, 15

- **File:** `aree/citta-bassa.yaml`, `fazioni/scuri/passi-1.yaml`, `fazioni/scuri/passi-2.yaml`, `fazioni/scuri/passi-3.yaml`, `fazioni/scuri/spedizione-casa-dei-nodi.yaml`, `fazioni/scuri/spedizione-vie-di-sotto.yaml`
- **Spedizioni:** La Casa dei Nodi di notte (`scuri-casa-dei-nodi`), Le Vie di Sotto (`scuri-vie-di-sotto`)
- **Dipende da:** Capomozzo almeno al passo 10; Sotto la pelle di Qir-Azel almeno al passo 5
- **Oggetti:** Stiletto da manica, Cappuccio degli Scuri, Le tre chiavi del Mercato, Brigantina degli Scuri, Sciabola di Vesh, Anello liscio di Vesh
- **Passi:**
  0. «Un favore per gli Scuri», «Il conto del vetraio»
  1. «La spalla del baro», «I gettoni d'argilla»
  2. «Firme», «Cosimo Venn»
  3. «La colonna della Maison», «La porta di servizio»
  4. «Le Vie di Sotto», «La sala delle nove colonne», «La sala nuova»
  5. «Le chiavi vecchie»
  6. «Il tavolo di Mirko», «Il mulino all'alba», «I debiti di Mirko»
  7. «Prima della prossima luna», «Il segno sotto la spalla»
  8. «L'ultimo ordine», «Le tre chiavi», «La veglia», «Chi parla per ultimo»
  9. «Il gettone d'argilla»
  10. «La Casa dei Nodi di notte», «La ronda dei balestrieri», «La cassaforte dei timbri», «La cassaforte aperta»
  11. «Le tre porte»
  12. «Nihali torna da Pannion»
  13. «L'anello liscio», «Quello che sei»
  14. «Il cerchio di gesso», «Chi tiene i conti»

### Circolo di Velthar: Il respiro corto

`fazione.circolo` · 15 passi · 40 scene · gradi ai passi 3, 6, 9, 12, 15

- **File:** `fazioni/circolo/passi-1.yaml`, `fazioni/circolo/passi-2.yaml`, `fazioni/circolo/passi-3.yaml`, `fazioni/circolo/spedizione-bosco.yaml`, `fazioni/circolo/spedizione-fenditura.yaml`
- **Spedizioni:** Il Bosco interno (`circolo-bosco-interno`), La fenditura del Respiro (`circolo-fenditura`)
- **Dipende da:** Capomozzo almeno al passo 7; Le cinque tribù almeno al passo 2; La caccia di Corin almeno al passo 3
- **Oggetti:** Segno delle tre tacche, Arco di tasso del margine, Fumo, la lupa grigia, Braska, il puma peldifuoco, Innesto di legnoscuro, Cappuccio di nebbia, Corda per la fenditura, Mantello di muschio grigio, Ramo di metallo vivo, Ghianda di metallo vivo
- **Passi:**
  0. «Uno del Bosco ti cerca», «Un lupo alle Scuderie»
  1. «Il legno che luccica», «Chi compra il grigio»
  2. «Il margine», «La spirale»
  3. «Il boschetto grigio», «Il cuore del boschetto grigio»
  4. «Le tavole di Serha», «La curva del Velo»
  5. «La radura sigillata», «Sulla spirale»
  6. «Una parola nella testa», «La Spina dell'Eco»
  7. «Il Circolo Ristretto», «Con chi passerai la luna»
  8. «La notte col branco», «Il cervo dalle corna di metallo», «La vena e il sangue», «La vena», «Tre notti nel tronco», «I ricordi non tuoi»
  9. «Il nome della via», «L'Albero si è riacceso», «La corda di radici vive», «Una corda dai Raschiatori», «La corda di Oda Krell»
  10. «La tempesta dalla pianura», «Le bestie davanti alla tempesta», «Gli orchi al margine»
  11. «Padre Vantes al margine», «La spirale di chi scende»
  12. «La discesa», «Il Custode di linfa»
  13. «Tornare all'Albero», «Occhi dorati»
  14. «Il respiro lungo», «Il posto sulla spirale»

## La Superficie

### Ghoran: Si pesa

`fazione.ghoran` · 15 passi · 16 scene · gradi ai passi 3, 6, 9, 12, 15

- **File:** `villaggi/ghoran/passi-1.yaml`, `villaggi/ghoran/passi-2.yaml`, `villaggi/ghoran/passi-3.yaml`, `villaggi/ghoran/spedizione-fossa.yaml`
- **Spedizioni:** La Fossa del Seme (`ghoran-fossa-del-seme`)
- **Dipende da:** L'Arena di Qir-Azel almeno al passo 5
- **Oggetti:** Filo di rame del clan, Lancia della Pece, Pelle della Fossa, Bipenne di Ragh, Dente del verro radicato
- **Passi:**
  0. «La bilancia della palizzata»
  1. «Una ripresa per Ragh»
  2. «La sala lunga»
  3. «Un morto nel campo»
  4. «Il fiele d'anguilla»
  5. «Sul piatto»
  6. «La casa bianca»
  7. «Il recinto di notte»
  8. «L'incidente»
  9. «Le radici senza sangue»
  10. «La grata della Fossa», «La porta dell'ascia»
  11. «Parente di clan»
  12. «L'occhio di Ragh»
  13. «La notte dei tamburi»
  14. «Oltre la porta»

### Laresh: La terra che beve

`fazione.laresh` · 15 passi · 20 scene · gradi ai passi 3, 6, 9, 12, 15

- **File:** `villaggi/laresh/passi-1.yaml`, `villaggi/laresh/passi-2.yaml`, `villaggi/laresh/passi-3.yaml`, `villaggi/laresh/spedizione-campo.yaml`
- **Spedizioni:** Il campo che beve (`laresh-campo-che-beve`)
- **Dipende da:** L'Arena di Qir-Azel almeno al passo 5; Sotto la pelle di Qir-Azel almeno al passo 7
- **Oggetti:** Fischietto d'osso, Puledra grigia, Giubba delle spigolatrici, Falce della chiusa
- **Passi:**
  0. «La vedova e il libro dei conti»
  1. «Il mugnaio cieco», «Quello che sente la macina»
  2. «Fra mezzanotte e le tre», «La tavola di Casa Velar»
  3. «Il giorno della pesa»
  4. «I ragazzi della Cicatrice»
  5. «Trenta cani per tre carri»
  6. «Il nero passa il rio», «Il tubo nella cenere»
  7. «Quelli di prima bevono»
  8. «L'assemblea dell'aia»
  9. «La notte dei fuochi»
  10. «Sotto la macina», «La chiusa»
  11. «L'acqua nel rio di mezzo»
  12. «Le impronte nel grano nuovo»
  13. «La notte della mietitura»
  14. «Il primo pane»

### Tuarmir: Il vento nuovo

`fazione.tuarmir` · 15 passi · 17 scene · gradi ai passi 3, 6, 9, 12, 15

- **File:** `villaggi/tuarmir/passi-1.yaml`, `villaggi/tuarmir/passi-2.yaml`, `villaggi/tuarmir/passi-3.yaml`, `villaggi/tuarmir/spedizione-gola-alta.yaml`
- **Spedizioni:** La gola alta (`tuarmir-gola-alta`)
- **Dipende da:** L'Arena di Qir-Azel almeno al passo 5
- **Oggetti:** Maschera d'erbe di Tuarmir, Roncola della raccolta, Mantello di muschio, Lancia del Pettine
- **Passi:**
  0. «La voce bassa»
  1. «Le due spiegazioni»
  2. «La maschera cucita»
  3. «Il libro di Lonn Var»
  4. «Fenno sotto la Sella»
  5. «Il raccolto lasciato in pace»
  6. «Il quaderno delle foglie», «Alenna e le misure»
  7. «La polvere grigia»
  8. «La notte che il vento gira»
  9. «Maela è salita»
  10. «Sopra la croce», «La grata»
  11. «La mappa dei nastri»
  12. «Le lettere nel cassetto»
  13. «La raccolta di Ruvo»
  14. «Il dono del vento»

### Pannion: Per il fumo di Pannion

`fazione.pannion` · 15 passi · 16 scene · gradi ai passi 3, 6, 9, 12, 15

- **File:** `villaggi/pannion/passi-1.yaml`, `villaggi/pannion/passi-2.yaml`, `villaggi/pannion/passi-3.yaml`, `villaggi/pannion/spedizione-vecchia-pannion.yaml`
- **Spedizioni:** La vecchia Pannion (`pannion-vecchia-pannion`)
- **Dipende da:** L'Arena di Qir-Azel almeno al passo 5
- **Oggetti:** Lanterna da pontile, Giubba di resina, Scheggia del Vecchio, Scure di linfa
- **Passi:**
  0. «Il fumo di Pannion»
  1. «I tronchi segnati»
  2. «La consegna»
  3. «La linfa rossa»
  4. «Le lanterne dei pontili»
  5. «Il conto del legname»
  6. «Un dito in una notte»
  7. «Il carbonaio di sotto»
  8. «Quelli che scendono di notte»
  9. «L'anno della linfa»
  10. «La discesa», «La Conca degli specchi»
  11. «Quello che ha visto l'acqua»
  12. «Le lanterne spente»
  13. «La strada delle lanterne»
  14. «Il Vecchio»

### I luoghi neri e la Campana Sepolta

`raccolta.luoghi-neri` · 15 passi · 31 scene

- **File:** `luoghi-neri/anello-del-camminatore.yaml`, `luoghi-neri/campana/batacchio.yaml`, `luoghi-neri/campana/canne.yaml`, `luoghi-neri/campana/coro.yaml`, `luoghi-neri/campana/sblocco.yaml`, `luoghi-neri/campana/sfiati.yaml`, `luoghi-neri/costola-di-drago.yaml`, `luoghi-neri/forno-della-nonna.yaml`, `luoghi-neri/lente-del-sornione.yaml`, `luoghi-neri/soglia-di-mara.yaml`, `luoghi-neri/spina-dell-eco.yaml`, `luoghi-neri/stele-dei-naviganti.yaml`, `luoghi-neri/tamburi-di-fondo.yaml`, `luoghi-neri/tracce.yaml`, `luoghi-neri/volta-dell-aculeo.yaml`, `torre/sblocco.yaml`
- **Spedizioni:** L'Anello del Camminatore (`anello-del-camminatore`), La camera del batacchio (`campana-batacchio`), Le canne (`campana-canne`), Il coro (`campana-coro`), Gli sfiati della Ripamuta (`campana-sfiati`), La Costola di Drago (`costola-di-drago`), Il Forno della Nonna (`forno-della-nonna`), La Lente del Sornione (`lente-del-sornione`), La Soglia di Mara (`soglia-di-mara`), La Spina dell'Eco (`spina-dell-eco`), Le Stele dei Naviganti (`stele-dei-naviganti`), I Tamburi di Fondo (`tamburi-di-fondo`), La Volta dell'Aculeo (`volta-dell-aculeo`)
- **Dipende da:** L'Arena di Qir-Azel almeno al passo 5; Capomozzo almeno al passo 10
- **Oggetti:** Perno del quadrante, Il Battente, Le piastre del Campanaro, La Sordina, La verga della Capoturno, La conchiglia sorda, Martello d'accordatura, Piastrina della mano aperta, Vetro delle due stelle, Cerata del portinaio, Canna della voce, Asta del fanalista, Rotella del conto, Aculeo della Lancetta
- **Passi:**
  1. `misura.costola >= 1`
  2. `misura.tamburi >= 1`
  3. `misura.aculeo >= 1`
  4. `misura.anello >= 1`
  5. `misura.forno >= 1`
  6. `misura.stele >= 1`
  7. `misura.sornione >= 1`
  8. `misura.mara >= 1`
  9. `misura.spina >= 1`
  10. `campana.annuncio >= 1`
  11. `campana.strato >= 1`
  12. `campana.strato >= 2`
  13. `campana.strato >= 3`
  14. `campana.scelta >= 1`
  15. `campana.epilogo >= 1`

### Il campanile rovescio

`raccolta.torre` · 6 passi · 8 scene

- **File:** `torre/anello-1-fondo.yaml`, `torre/anello-2-fondo.yaml`, `torre/anello-3-fondo.yaml`, `torre/anello-4-fondo.yaml`, `torre/sblocco.yaml`
- **Spedizioni:** La scala delle corde (`torre-anello-1`), Le casse di risonanza (`torre-anello-2`), La fonderia delle note (`torre-anello-3`), Il battito (`torre-anello-4`)
- **Oggetti:** La Nota Lunga, La Cassa Armonica, La Bocca della Campana, Il Manto del Battito, Il frammento del sigillo
- **Passi:**
  1. `torre.botola >= 1`
  2. `torre.anello >= 1`
  3. `torre.anello >= 2`
  4. `torre.anello >= 3`
  5. `torre.anello >= 4`
  6. `torre.sigillo >= 1`

### Il Mercante della Memoria Residua

`raccolta.mercante` · 5 passi · 4 scene

- **File:** `superficie/ricorrenti.yaml`
- **Passi:**
  1. `mercante.incontri >= 1`
  2. `mercante.incontri >= 2`
  3. `mercante.incontri >= 3`
  4. `mercante.incontri >= 4`
  5. `mercante.scatola >= 1`

### Il bambino senza impronte

`raccolta.bambino` · 4 passi · 5 scene

- **File:** `superficie/ricorrenti.yaml`
- **Passi:**
  1. `bambino.stadio >= 1`
  2. `bambino.stadio >= 2`
  3. `bambino.stadio >= 3`
  4. `bambino.fine >= 1`

### Il Cavaliere della Marea

`raccolta.cavaliere` · 5 passi · 3 scene

- **File:** `superficie/ricorrenti.yaml`
- **Passi:**
  1. `cavaliere.incontri >= 1`
  2. `cavaliere.memoria >= 1`
  3. `cavaliere.memoria >= 2`
  4. `cavaliere.memoria >= 3`
  5. `cavaliere.fine >= 1`

### La Frattura che respira

`raccolta.frattura` · 5 passi · 1 scene

- **File:** `superficie/ricorrenti.yaml`
- **Spedizioni:** Nodo dei Precursori (`nodo-dei-precursori`)
- **Passi:**
  1. `frattura.respiro >= 1`
  2. `frattura.respiro >= 2`
  3. `frattura.respiro >= 3`
  4. `frattura.respiro >= 4`
  5. `frattura.premio >= 1`

### La carovana dei muti

`raccolta.carovana` · 5 passi · 5 scene

- **File:** `superficie/occasioni-catene.yaml`
- **Passi:**
  1. `carovana.passo >= 1`
  2. `carovana.passo >= 2`
  3. `carovana.passo >= 3`
  4. `carovana.passo >= 4`
  5. `carovana.passo >= 5`

### Il cartografo cieco

`raccolta.cartografo` · 4 passi · 4 scene

- **File:** `superficie/occasioni-catene.yaml`
- **Passi:**
  1. `cartografo.passo >= 1`
  2. `cartografo.passo >= 2`
  3. `cartografo.passo >= 3`
  4. `cartografo.passo >= 4`

### Il corriere della Caserma

`raccolta.corriere` · 2 passi · 2 scene

- **File:** `superficie/carte-3.yaml`
- **Passi:**
  1. `sup3.messaggero >= 1`
  2. `sup3.messaggero >= 2`

### Il cane che aspetta

`raccolta.cane` · 2 passi · 2 scene

- **File:** `superficie/carte-3.yaml`
- **Passi:**
  1. `sup3.cane >= 1`
  2. `sup3.cane >= 4`

### La voce nel metallo

`raccolta.voce` · 4 passi · 3 scene

- **File:** `superficie/carte-3.yaml`
- **Passi:**
  1. `sup3.voce >= 1`
  2. `sup3.voce >= 2`
  3. `sup3.voce >= 3`
  4. `sup3.voce >= 99`

## I luoghi della città

### La casa nel vicolo

`raccolta.casa` · 10 passi · 11 scene

- **File:** `citta/occasioni-ovunque.yaml`, `economia/casa.yaml`
- **Oggetti:** Ciondolo del Nodo, Spillone di Nerissa
- **Passi:**
  1. `casa >= 1`
  2. `casa >= 2`
  3. `casa >= 3`
  4. `casa >= 4`
  5. `casa >= 5`
  6. `casa >= 6`
  7. `ospite.primo >= 1`
  8. `ospite.secondo >= 1`
  9. `ospite.terzo >= 1`
  10. `ospite.quarto >= 1`

### Fosco e la casa che manca

`raccolta.fosco` · 3 passi · 3 scene

- **File:** `citta/carte-citta-bassa.yaml`
- **Oggetti:** Taccuino dei civici
- **Passi:**
  1. `fosco >= 1`
  2. `fosco >= 2`
  3. `fosco >= 3`

### L'argento dei Lusardi

`raccolta.lusardi` · 3 passi · 3 scene

- **File:** `citta/carte-quartieri-alti.yaml`
- **Oggetti:** Sigillo dei Lusardi
- **Passi:**
  1. `lusardi.passo >= 1`
  2. `lusardi.passo >= 2`
  3. `lusardi.passo >= 3`

### Ilde e la Mula

`raccolta.ilde` · 4 passi · 4 scene

- **File:** `citta/carte-ponti-sospesi.yaml`
- **Passi:**
  1. `chiatta.ilde >= 1`
  2. `chiatta.ilde >= 2`
  3. `chiatta.ilde >= 3`
  4. `chiatta.ilde >= 4`

### La bottega che ticchetta

`raccolta.bottega` · 4 passi · 4 scene

- **File:** `citta/occasioni-citta-bassa.yaml`
- **Passi:**
  1. `bottega.passo >= 1`
  2. `bottega.passo >= 2`
  3. `bottega.passo >= 3`
  4. `bottega.passo >= 4`

### Il registro della governante

`raccolta.governante` · 4 passi · 4 scene

- **File:** `citta/occasioni-quartieri-alti.yaml`
- **Passi:**
  1. `governante.passo >= 1`
  2. `governante.passo >= 2`
  3. `governante.passo >= 3`
  4. `governante.passo >= 4`

### L'ultimo pontiere

`raccolta.pontiere` · 4 passi · 4 scene

- **File:** `citta/occasioni-ponti-sospesi.yaml`
- **Passi:**
  1. `pontiere.passo >= 1`
  2. `pontiere.passo >= 2`
  3. `pontiere.passo >= 3`
  4. `pontiere.passo >= 4`

### Le lettere senza mittente

`raccolta.lettere` · 4 passi · 4 scene

- **File:** `citta/occasioni-ovunque.yaml`
- **Passi:**
  1. `lettere.passo >= 1`
  2. `lettere.passo >= 2`
  3. `lettere.passo >= 3`
  4. `lettere.passo >= 4`

### Locanda del Grifone di Ferro

`luogo.rep.grifone` · 3 passi · 4 scene

- **File:** `citta/grifone.yaml`
- **Dipende da:** Acciaio e Ira almeno al passo 8
- **Passi:**
  1. «La storia di Brunella» (`la-storia-di-brunella`)
  2. «L'insegna del Grifone» (`l-insegna-del-grifone`)
  3. «Una chiave del Grifone» (`una-chiave-del-grifone`)

### Mercato dei Nodi

`luogo.rep.nodo` · 3 passi · 5 scene

- **File:** `citta/nodo.yaml`
- **Passi:**
  1. «Il corvo del bancone» (`il-corvo-del-bancone`)
  2. «Il cassetto chiuso» (`il-cassetto-chiuso`)
  3. «Socio del Nodo» (`socio-del-nodo`)

### La gente dei Ponti

`luogo.rep.ponti` · 3 passi · 5 scene

- **File:** `citta/ponti.yaml`
- **Passi:**
  1. «Il braciere di Mamma Tesh» (`il-braciere-di-mamma-tesh`)
  2. «Le lanterne in fondo al ponte» (`le-lanterne-del-ponte-dei-morti`)
  3. «Il passo dei Ponti» (`il-passo-dei-ponti`)

### Le botteghe del ferro

`luogo.rep.botteghe` · 3 passi · 6 scene

- **File:** `citta/botteghe.yaml`
- **Oggetti:** Martello dei Due Mastini, Re della Collina, Corazza ostinata, Cotta di maglia di Irsa, Coltelli da lancio (set di tre), Giaco di maglia di Irsa
- **Passi:**
  1. «I due mastini» (`i-due-mastini`)
  2. «Il cuoio di Kasselt» (`il-cuoio-di-kasselt`)
  3. «Il capolavoro» (`il-capolavoro`)

### Le macerie della Pignatta

`luogo.nomea.citta-bassa` · 3 passi · 4 scene

- **File:** `citta/macerie.yaml`
- **Dipende da:** Sotto la pelle di Qir-Azel almeno al passo 6
- **Passi:**
  1. «Rozalia torna» (`rozalia-torna`)
  2. «Il cantiere» (`il-cantiere`)
  3. «L'insegna nuova» (`l-insegna-nuova`)

### Cimitero di Qir-Azel

`luogo.rep.cimitero` · 3 passi · 6 scene

- **File:** `citta/cimitero.yaml`
- **Passi:**
  1. «La lapide senza nome» (`la-lapide-senza-nome`)
  2. «I registri di Gundo» (`i-registri-di-gundo`)
  3. «Le chiavi del cimitero» (`le-chiavi-del-cimitero`)

### Biblioteca di Qir-Azel

`luogo.rep.biblioteca` · 3 passi · 5 scene

- **File:** `citta/biblioteca.yaml`
- **Passi:**
  1. «Gli scaffali sigillati» (`gli-scaffali-sigillati`)
  2. «I cristalli che pensano» (`i-cristalli-che-pensano`)
  3. «La chiave degli scaffali» (`la-chiave-degli-scaffali`)

### Teatro delle Meraviglie

`luogo.rep.teatro` · 3 passi · 5 scene

- **File:** `citta/teatro.yaml`
- **Passi:**
  1. «La sartoria» (`la-sartoria`)
  2. «Un copione nuovo» (`un-copione-nuovo`)
  3. «Il nome sul cartellone» (`il-nome-sul-cartellone`)

## Le Avventure

### La notte della Zanna Rotta

`avventura.zanna-rotta` · 8 passi · 13 scene

- **File:** `avventure/zanna-rotta/spedizione.yaml`, `avventure/zanna-rotta/storia.yaml`
- **Spedizioni:** La pista grigia (`avv-zanna-rotta`)
- **Dipende da:** Capomozzo almeno al passo 10
- **Oggetti:** Pelliccia di Mezzaluna
- **Passi:**
  0. «La giumenta sotto la giubba», «Il tuo cavallo ha visto»
  1. «La stalla senza tracce»
  2. «La tinozza nel cortile»
  3. «Tre ospiti a colazione»
  4. «La notte nella stalla»
  5. «Il mattino nel box»
  6. «La strada di Laresh», «La radura dei vetri», «Mezzaluna», «Il cristallo nella borsa»
  7. «La pelle di Mezzaluna», «La pelliccia conciata»

### I Puliti di Pannion

`avventura.puliti` · 9 passi · 13 scene

- **File:** `avventure/puliti/spedizione.yaml`, `avventure/puliti/storia.yaml`
- **Spedizioni:** Le acque sotto la vecchia Pannion (`avv-puliti`)
- **Dipende da:** Per il fumo di Pannion almeno al passo 15
- **Oggetti:** Piastrina fredda
- **Passi:**
  0. «Il castagnaro»
  1. «Le gocce sugli stipiti»
  2. «La mensa che si volta»
  3. «La pelle bagnata»
  4. «Quelli che portano all'acqua»
  5. «Il rito sul bordo», «Le bocche informi»
  6. «La bocca della cisterna», «I murali del sovrano», «L'offerta», «Lo scontro nell'acqua»
  7. «Il risveglio»
  8. «La piastrina fredda»

### La stazione del gelo

`avventura.stazione-gelo` · 7 passi · 9 scene

- **File:** `avventure/stazione-gelo/spedizione.yaml`, `avventure/stazione-gelo/storia.yaml`
- **Spedizioni:** Le stanze della Brinaia (`avv-stazione-gelo`)
- **Dipende da:** Capomozzo almeno al passo 10
- **Oggetti:** Specchio da braccio
- **Passi:**
  0. «Una lettera per il Gradone»
  1. «La Brinaia»
  2. «La cella gelata»
  3. «La Raschiatrice»
  4. «Il forziere del Ghiro»
  5. «La porta di fuori», «Il Ghiro», «Lo specchio»
  6. «Dietro le bottiglie»

### Le Prove del Guado

`avventura.prove-guado` · 10 passi · 12 scene

- **File:** `avventure/prove-guado/spedizione.yaml`, `avventure/prove-guado/storia.yaml`
- **Spedizioni:** Le terrazze del Gradone (`avv-prove-guado`)
- **Dipende da:** Si pesa almeno al passo 15
- **Oggetti:** Maglio di Branko
- **Passi:**
  0. «Due nomi sulla tavoletta»
  1. «La sera prima»
  2. «I cinghiali corazzati»
  3. «Le rapide dei nastri»
  4. «Il pino rosso»
  5. «La gigantessa al guado»
  6. «La notte alla bilancia»
  7. «La gola dell'Acquarossa», «Il ragazzo delle lische», «La grotta di Ozzra»
  8. «Giù dal Gradone»
  9. «Il banchetto del Guado»

### Il debito del Ponte del Pesce

`avventura.ponte-pesce` · 8 passi · 13 scene

- **File:** `avventure/ponte-pesce/spedizione.yaml`, `avventure/ponte-pesce/storia.yaml`
- **Spedizioni:** Le acque sotto lo Scoglio (`avv-ponte-pesce`)
- **Dipende da:** Capomozzo almeno al passo 10
- **Oggetti:** Arpione del Sommerso
- **Passi:**
  0. «L'uomo fradicio»
  1. «Il racconto di Ciro», «La riva deserta»
  2. «Il boccaglio del nonno»
  3. «L'acqua del canale»
  4. «I turni delle guardie»
  5. «La barca di Ciro», «L'uomo all'ancora», «Le acque profonde», «La guardia che sale»
  6. «Sotto l'arco», «La parola di Ilske»
  7. «L'arpione del Sommerso»

### Il Rosicaossa

`avventura.rosicaossa` · 8 passi · 12 scene

- **File:** `avventure/rosicaossa/spedizione.yaml`, `avventure/rosicaossa/storia.yaml`
- **Spedizioni:** Le pareti della Cicatrice (`avv-rosicaossa`)
- **Dipende da:** Capomozzo almeno al passo 10
- **Oggetti:** Scudo di ossa e ferro
- **Passi:**
  0. «La mano sul ponte»
  1. «Il gioco degli obblighi»
  2. «Il punto della calata»
  3. «Lo scolatore»
  4. «I dispersi della parete»
  5. «Senza peso», «Il nido», «L'acqua che sale»
  6. «La risalita», «La ragazzina che non ricorda»
  7. «Ossa e ferro»

### La signora delle gole

`avventura.signora-gole` · 8 passi · 12 scene

- **File:** `avventure/signora-gole/spedizione.yaml`, `avventure/signora-gole/storia.yaml`
- **Spedizioni:** I Calanchi Rossi (`avv-signora-gole`)
- **Dipende da:** Per il fumo di Pannion almeno al passo 15
- **Oggetti:** Lama della Signora
- **Passi:**
  0. «Il carro del bivio», «Gli occhi bianchi»
  1. «Il capitano della scorta»
  2. «Gli occhi bianchi»
  3. «La capa»
  4. «La mappa»
  5. «Verso i Calanchi Rossi», «La tana dello scorpione», «La Signora delle gole», «La lama ingioiellata»
  6. «Il capitano legato»
  7. «La lama della Signora»

### Il Divoratore

`avventura.divoratore` · 8 passi · 12 scene

- **File:** `avventure/divoratore/spedizione.yaml`, `avventure/divoratore/storia.yaml`
- **Spedizioni:** Le gallerie del Divoratore (`avv-divoratore`)
- **Dipende da:** Il vento nuovo almeno al passo 15
- **Oggetti:** Placca del Divoratore
- **Passi:**
  0. «Il muro che crolla»
  1. «Il carro del fabbro»
  2. «La grotta dei letti»
  3. «La campana delle ore»
  4. «Le cariche»
  5. «La tana», «Il Divoratore passa», «La Strozza», «La bocca», «Il camino»
  6. «La Strozza chiusa»
  7. «La placca»

### Il libro della regina

`avventura.libro-regina` · 8 passi · 10 scene

- **File:** `avventure/libro-regina/spedizione.yaml`, `avventure/libro-regina/storia.yaml`
- **Spedizioni:** Il mausoleo della regina (`avv-libro-regina`)
- **Dipende da:** Si pesa almeno al passo 15
- **Oggetti:** Bracciale di Tamsira
- **Passi:**
  0. «Lo stalliere giallo»
  1. «Il fienile dei muli»
  2. «Le unghie gialle»
  3. «Quello che ha visto Nevio»
  4. «L'anello di cera verde»
  5. «La Porta delle Sei», «La stanza delle sei», «La camera della regina»
  6. «Il giallo che se ne va»
  7. «Quello che teneva Radek»

### Le buche di Laresh

`avventura.buche-laresh` · 7 passi · 13 scene

- **File:** `avventure/buche-laresh/spedizione.yaml`, `avventure/buche-laresh/storia.yaml`
- **Spedizioni:** Le gallerie del rio basso (`avv-buche-laresh`)
- **Dipende da:** La terra che beve almeno al passo 15
- **Oggetti:** Roncola della regina
- **Passi:**
  0. «L'avviso al mulino», «L'anno delle zuccaiole»
  1. «La padrona del rio basso»
  2. «Grande come un vitello»
  3. «Lo stivale della caposquadra»
  4. «La notte sul confine»
  5. «La buca del pero», «Il canto», «La caposquadra», «Il nido», «La regina che scava»
  6. «L'ultima dispensa», «Il solco del pero»

### La bambina che sognava il serpente

`avventura.sogno-serpente` · 6 passi · 11 scene

- **File:** `avventure/sogno-serpente/spedizione.yaml`, `avventure/sogno-serpente/storia.yaml`
- **Spedizioni:** Dentro la roccia rossa (`avv-sogno-serpente`)
- **Dipende da:** Il vento nuovo almeno al passo 15
- **Oggetti:** Penna della guardiana
- **Passi:**
  0. «Gli avvisi al pozzo»
  1. «La stanza di Isel»
  2. «La canzone dei punti»
  3. «La crepa del serpente»
  4. «Dentro la roccia», «La parete dei chiamati», «Ulvessa», «Il padre», «L'ultima strofa»
  5. «La parte della roccia», «Il silenzio di Isel»

### L'investitura

`avventura.investitura` · 8 passi · 11 scene

- **File:** `avventure/investitura/spedizione.yaml`, `avventure/investitura/storia.yaml`
- **Spedizioni:** La notte della veglia (`avv-investitura`)
- **Dipende da:** Capomozzo almeno al passo 10
- **Oggetti:** Lama dell'investitura
- **Passi:**
  0. «L'invito dei Castaldi»
  1. «Un dono per l'erede»
  2. «Lo scambio dei doni»
  3. «L'ora prima di mezzanotte»
  4. «I voti di mezzanotte»
  5. «La sala al buio», «Il precettore», «La quinta tacca», «L'ultima tacca»
  6. «La firma all'alba»
  7. «La lama dell'investitura»

### Il torchio che non si ferma

`avventura.torchio` · 7 passi · 11 scene

- **File:** `avventure/torchio/spedizione.yaml`, `avventure/torchio/storia.yaml`
- **Spedizioni:** Il Torchio Dossena (`avv-torchio`)
- **Dipende da:** La terra che beve almeno al passo 15
- **Oggetti:** Corazza del portabotti
- **Passi:**
  0. «Un biglietto con il sigillo»
  1. «La visita al Torchio Dossena», «Il fulmine sul camino»
  2. «Oltre il cancello»
  3. «Il meccanico nella gora», «Quello che sa Lapo»
  4. «Il melo grande», «Il pannello centrale», «Il cancello del torchio»
  5. «Il torchio fermo»
  6. «La corazza del portabotti»

### La radura spenta

`avventura.radura-spenta` · 8 passi · 12 scene

- **File:** `avventure/radura-spenta/spedizione.yaml`, `avventure/radura-spenta/storia.yaml`
- **Spedizioni:** Il sentiero della Culla (`avv-radura-spenta`)
- **Dipende da:** Capomozzo almeno al passo 10
- **Oggetti:** Mantello della Culla
- **Passi:**
  0. «La lanterna di Ponente»
  1. «Il vetro sul dosso»
  2. «Le impronte bruciate»
  3. «La notte al cippo»
  4. «La fonte di Arvel»
  5. «Il sentiero dei cervi», «I bozzoli», «La Culla delle Foglie», «Lo stallone»
  6. «La lanterna riaccesa»
  7. «Le ali rosse», «La Culla in silenzio»

## Spedizioni che non appartengono a una storia

- Il villaggio storto (`villaggio-storto`)
