# La regia del doppiaggio

Il copione si legge con una sola voce narrante su ElevenLabs (modello v3, quello dei tag audio). La regia aggiunge al
testo i **tag fra quadre** che dicono alla voce *come* dire una frase: emozione, tono, ritmo, respiri, e qualche effetto
sonoro. I tag non si leggono: ElevenLabs li interpreta.

La regia sta in `doppiaggio/regia/<storia>.yaml`, una chiave per pezzo (`id: |` e il testo con i tag). I testi del gioco
non cambiano. `npm run regia` controlla che, tolti i tag, il testo sia identico parola per parola a quello del gioco;
`npm run doppiaggio` usa la regia nel copione e, se una scena cambia, la segna superata e torna al testo semplice.

## La regola d'oro

**Si aggiungono solo tag.** Nessuna parola, virgola o a capo del testo si tocca. Un tag è sempre in inglese, minuscolo,
fra quadre, seguito da uno spazio, e sta *prima* delle parole su cui agisce: all'inizio di una frase, prima di una
battuta fra virgolette, o a metà frase dove il tono cambia.

## La voce

Il narratore parla in seconda persona dentro la testa del protagonista: voce bassa, controllata, un po' stanca, con
un'ironia asciutta. È il registro di base e **non si tagga**: i tag servono quando qualcosa si sposta da lì.

- **Apertura.** Il primo tag di una scena ne fissa l'aria, se l'aria è netta: `[ominous]`, `[tense]`, `[somber]`,
  `[calm]`, `[wry]`, `[warm]`, `[eerie]`. Se la scena comincia neutra, si comincia senza tag.
- **Svolte.** Quando la scena gira (arriva la violenza, una notizia, una risata, un lutto) un tag segna il cambio.
- **Densità.** Un tag ogni due-quattro frasi, in media. Mai due tag di emozione di fila (il pensiero sì, vedi sotto). Un
  pezzo breve può averne uno o nessuno.
- **Esiti.** Il successo spesso porta sollievo o soddisfazione trattenuta (`[relieved]`, `[satisfied]`, `[wry]`); il
  fallimento amarezza o tensione (`[bitter]`, `[tense]`, `[resigned]`); la sconfitta fatica e dolore
  (`[breathing heavily]`, `[pained]`, `[exhausted]`); la vittoria una calma che arriva dopo lo sforzo (`[exhales]`).

## I pensieri

I pensieri del protagonista (nel gioco in corsivo) sono **sussurrati**: `[whispers]` all'inizio del pensiero, sempre.
È la voce interiore alla Disco Elysium, e resta. Si può aggiungere un secondo tag che ne dia il colore:
`[whispers] [sarcastic]`, `[whispers] [bitter]`, `[whispers] [amused]`, `[whispers] [uneasy]`, `[whispers] [tender]`.

## Le battute

Le battute dei personaggi fra virgolette sono recitate dalla stessa voce, con un tocco del carattere di chi parla: un tag
prima della battuta quando chi parla ha un tono preciso. `[gruff]` per l'oste o la guardia, `[sneering]` per chi
disprezza, `[pleading]`, `[shouting]`, `[warmly]`, `[coldly]`, `[nervously]`, `[slyly]`, `[menacing]`, `[mocking]`,
`[hoarse]`, `[trembling]`, `[deadpan]`. Le battute neutre restano senza tag.

## Tag che funzionano bene

- **Emozione e tono**: `[calm]` `[tense]` `[ominous]` `[somber]` `[sad]` `[sorrowful]` `[bitter]` `[wry]` `[amused]`
  `[sarcastic]` `[angry]` `[furious]` `[fearful]` `[nervous]` `[uneasy]` `[curious]` `[surprised]` `[awed]` `[eerie]`
  `[solemn]` `[resigned]` `[tired]` `[relieved]` `[satisfied]` `[determined]` `[tender]` `[warm]` `[cold]` `[urgent]`
  `[hesitant]` `[thoughtful]` `[mysterious]` `[dramatic]`
- **Modo**: `[whispers]` `[softly]` `[quietly]` `[slowly]` `[quickly]` `[muttering]` `[under breath]` `[shouting]`
  `[deadpan]`
- **Ritmo**: `[pause]` `[short pause]` `[long pause]`, prima della frase che deve cadere da sola (una rivelazione,
  l'ultima riga di una scena forte). Con parsimonia.
- **Respiri e suoni della voce**: `[sighs]` `[exhales]` `[inhales deeply]` `[breathing heavily]` `[gasps]` `[swallows]`
  `[clears throat]` `[laughs softly]` `[chuckles]` `[laughs bitterly]` `[scoffs]` `[coughs]` `[groans]`. Solo dove il
  testo lo suggerisce, e mai più di due per pezzo.

## Effetti sonori

ElevenLabs genera anche suoni descritti fra quadre. Si usano **solo quando il testo descrive un suono che accade in
quel momento**, al massimo due per pezzo, prima della frase in cui il suono accade. Descrizione breve e concreta, in
inglese: `[distant bell tolling]` `[crowd murmuring]` `[heavy door creaking]` `[door slams]` `[footsteps on stone]`
`[rain on rooftops]` `[wind howling]` `[fire crackling]` `[swords clashing]` `[metal clanging]` `[explosion]`
`[glass shattering]` `[horse whinnying]` `[dog barking]` `[water dripping]` `[chains rattling]` `[thunder rumbling]`
`[wood splintering]` `[bowstring snaps]` `[howling in the distance]`. Niente effetti su ricordi, ipotesi o descrizioni
statiche: «le campane suonavano» al passato remoto di un ricordo resta senza effetto.

## Esempio

Testo del gioco:

> Il primo grido arriva dalla piazza. Poco dopo, a est della locanda, un orco più grosso degli altri sbuca da una strada
> laterale in sella a un cinghiale corazzato. *Ecco, adesso sì che è una festa.*

Regia:

> [crowd screaming] Il primo grido arriva dalla piazza. [tense] Poco dopo, a est della locanda, un orco più grosso degli
> altri sbuca da una strada laterale in sella a un cinghiale corazzato. [whispers] [sarcastic] Ecco, adesso sì che è una
> festa.
