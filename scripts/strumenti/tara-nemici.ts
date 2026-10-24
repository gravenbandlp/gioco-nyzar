// Cerca le statistiche di un nemico che portano uno scontro alla probabilità di vittoria voluta, sul profilo «fine
// Campana» (Fisico 4, Armi da mischia 4, il Battente e le piastre del Campanaro). Prova le combinazioni vicine a quelle
// scritte e stampa le migliori; poi le statistiche vanno ricopiate a mano nel file del nemico.
// Uso: npx tsx scripts/strumenti/tara-nemici.ts <scontro> <nemico> <obiettivo 0-1>
import { caricaContenuti } from '../build-contenuti';
import { nuovoPersonaggio } from '../../src/motore/personaggio';
import { combattenteDaStato, probabilitaVittoria } from '../../src/motore/combattimento';

const [scontroId, nemicoId, obiettivoArg] = process.argv.slice(2);
const obiettivo = Number(obiettivoArg);
const { contenuti: c, errori } = caricaContenuti({ tavole: false });
if (errori.length) { console.error(errori.join('\n')); process.exit(1); }
const s = nuovoPersonaggio('Prova', c.origini.find((o) => o.id === 'figlio-della-citta-bassa')!, 0, 'citta-bassa');
s.attributi.fisico = 4; s.attributi.mentale = 2;
for (const a of ['acrobazia', 'resistenza', 'atletica', 'percezione', 'resilienza']) s.abilita[a] = Math.max(s.abilita[a] ?? 0, 1);
s.abilita['armi-da-mischia'] = 4;
s.arma = 'campana-il-battente'; s.armatura = 'campana-piastre-del-campanaro';
s.quality['oggetto.campana-il-battente'] = 1; s.quality['oggetto.campana-piastre-del-campanaro'] = 1;
const pg = combattenteDaStato(s, c);
const sc = c.scontri.find((x) => x.id === scontroId)!;
const n = c.nemici.find((x) => x.id === nemicoId)!;
const base = { ...n };
const prova = (k: Partial<typeof n>) => { Object.assign(n, base, k); return probabilitaVittoria(pg, sc, c, 1500, 7); };
const righe: { p: number; k: Record<string, number | undefined> }[] = [];
// sopra e sotto i valori scritti; l'energia conta per chi lancia incantesimi
const intorno = (v: number, giu: number, su: number) => Array.from({ length: giu + su + 1 }, (_, i) => v - giu + i).filter((x) => x >= 0);
for (const attacco of intorno(base.attacco, 2, 2))
  for (const danno of intorno(base.danno, 1, 1))
    for (const riduzione of intorno(base.riduzione, 2, 1))
      for (const pf of [Math.round(base.pf * 0.75), base.pf, Math.round(base.pf * 1.3)])
        for (const energia of base.energia ? [Math.round(base.energia / 2), base.energia] : [base.energia]) {
          const k = { attacco, danno, riduzione, pf, energia };
          righe.push({ p: prova(k), k });
        }
righe.sort((a, b) => Math.abs(a.p - obiettivo) - Math.abs(b.p - obiettivo));
for (const r of righe.slice(0, 6)) console.log(`${Math.round(r.p * 100)}%`, JSON.stringify(r.k));
