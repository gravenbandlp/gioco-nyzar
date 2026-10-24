// Tavole di prova del ritratto: ogni oggetto indossabile del gioco su un personaggio di prova, in PNG.
// npx tsx scripts/strumenti/ritratti.ts <cartella> [armi|armature|scudi|accessori|pose|bestie|teste|capelli] [scala]
// CORPO=femminile disegna la figura femminile; con «una» le variabili ARMI, ARMATURA, SCUDO e ACCESSORI.
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CONTENUTI as c } from '../../src/dati/contenuti';
import { disegna, TAGLI, BARBE, type Aspetto } from '../../src/ui/ritratto/motore';
import { figura, type Dotazione } from '../../src/ui/ritratto/aspetti';

const [cartella = '.', quali = 'tutti', scalaArg = '3'] = process.argv.slice(2);
const S = Number(scalaArg);
// RITAGLIO=x0,x1,y0,y1 per guardare da vicino una parte della figura
const [rx0, rx1, ry0, ry1] = (process.env['RITAGLIO'] ?? '0,83,0,71').split(',').map(Number) as [number, number, number, number];
const ASPETTO: Aspetto = process.env['CORPO'] === 'femminile'
  ? { corpo: 'femminile', pelle: 'chiara', capelli: 'lunghi', coloreCapelli: 'castano', barba: 'nessuna', coloreBarba: 'castano' }
  : { pelle: 'chiara', capelli: 'corti', coloreCapelli: 'castano', barba: 'corta', coloreBarba: 'castano' };
const NUDO: Dotazione = { arma: 'mani-nude', armatura: 'cuoio-rinforzato', scudo: '', accessori: [], segni: [] };

function png(w: number, h: number, rgb: Buffer): Buffer {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) rgb.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3);
  const tab: number[] = []; for (let n = 0; n < 256; n++) { let k = n; for (let i = 0; i < 8; i++) k = k & 1 ? 0xedb88320 ^ (k >>> 1) : k >>> 1; tab[n] = k >>> 0; }
  const crc = (b: Buffer) => { let k = 0xffffffff; for (const x of b) k = tab[(k ^ x) & 255]! ^ (k >>> 8); return (k ^ 0xffffffff) >>> 0; };
  const pezzo = (t: string, d: Buffer) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const k = Buffer.alloc(4); k.writeUInt32BE(crc(td)); return Buffer.concat([l, td, k]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), pezzo('IHDR', ih), pezzo('IDAT', deflateSync(raw)), pezzo('IEND', Buffer.alloc(0))]);
}

function tavola(nome: string, dotazioni: Dotazione[], colonne: number, aspetti?: Aspetto[]): void {
  const rs = dotazioni.map((d, k) => disegna(figura(aspetti?.[k] ?? ASPETTO, d, c)));
  const cw = (Math.min(rx1, 83) - rx0 + 1) * S + 6, ch = (ry1 - ry0 + 1) * S + 6;
  const righe = Math.ceil(rs.length / colonne), w = colonne * cw, h = righe * ch;
  const img = Buffer.alloc(w * h * 3);
  for (let i = 0; i < w * h; i++) { img[i * 3] = 13; img[i * 3 + 1] = 20; img[i * 3 + 2] = 24; }
  rs.forEach((r, k) => {
    const ox = (k % colonne) * cw, oy = Math.floor(k / colonne) * ch;
    for (let y = ry0; y <= Math.min(ry1, r.H - 1); y++) for (let x = rx0; x <= Math.min(rx1, r.W - 1); x++) {
      const i = (y * r.W + x) * 4; if (!r.pixel[i + 3]) continue;
      for (let a = 0; a < S; a++) for (let b = 0; b < S; b++) { const j = ((oy + (y - ry0) * S + a) * w + ox + (x - rx0) * S + b) * 3; img[j] = r.pixel[i]!; img[j + 1] = r.pixel[i + 1]!; img[j + 2] = r.pixel[i + 2]!; }
    }
  });
  writeFileSync(join(cartella, `${nome}.png`), png(w, h, img));
  console.log(nome, rs.length);
}

const og = (slot: string) => c.oggetti.filter((o) => o.slot === slot);
const fai = (q: string) => quali === 'tutti' || quali === q;
if (fai('armi')) { const l = og('arma'); for (let i = 0; i < l.length; i += 24) tavola(`armi-${i / 24 + 1}`, l.slice(i, i + 24).map((o) => ({ ...NUDO, arma: o.id })), 8); }
if (fai('armature')) { const l = og('armatura'); for (let i = 0; i < l.length; i += 16) tavola(`armature-${i / 16 + 1}`, l.slice(i, i + 16).map((o) => ({ ...NUDO, armatura: o.id })), 8); }
if (fai('scudi')) tavola('scudi', og('scudo').map((o) => ({ ...NUDO, scudo: o.id })), 8);
if (quali === 'pose') tavola('pose', [
  { ...NUDO }, { ...NUDO, scudo: 'scudo' }, { ...NUDO, arma: 'pugnale' }, { ...NUDO, arma: 'spada-lunga', scudo: 'scudo-pesante' }, { ...NUDO, arma: 'lancia', scudo: 'scudo' }, { ...NUDO, arma: 'mazza', accessori: ['caserma-lanterna-di-ronda'] },
  { ...NUDO, arma: 'spadone' }, { ...NUDO, arma: 'ascia-bipenne' }, { ...NUDO, arma: 'martello-da-guerra' }, { ...NUDO, arma: 'laresh-falce-della-chiusa' }, { ...NUDO, arma: 'fionda' }, { ...NUDO, arma: 'coltelli-da-lancio' },
  { ...NUDO, arma: 'arco-corto' }, { ...NUDO, arma: 'arco-lungo' }, { ...NUDO, arma: 'balestra-leggera' }, { ...NUDO, arma: 'balestra-pesante' }, { ...NUDO, arma: 'spada-corta', armatura: 'armatura-a-piastre' }, { ...NUDO, arma: 'spadone', armatura: 'cotta-di-maglia' },
], 6);
// una o più figure da vicino: ARMI=spadone,arco-lungo ARMATURA=... SCUDO=... ACCESSORI=a,b
if (quali === 'una') {
  const e = (k: string) => process.env[k] ?? '';
  const armi = (e('ARMI') || 'mani-nude').split(',');
  // ogni voce di ARMI può portare la sua armatura: spadone:cotta-di-maglia
  tavola('una', armi.map((voce) => { const [arma = 'mani-nude', armatura] = voce.split(':'); return { ...NUDO, arma, armatura: armatura || e('ARMATURA') || NUDO.armatura, scudo: e('SCUDO'), accessori: e('ACCESSORI') ? e('ACCESSORI').split(',') : [] }; }), armi.length);
}
if (quali === 'bestie') tavola('bestie', ['cavallo-da-guerra', 'ombrafosca', 'laresh-puledra-grigia', 'circolo-lupa-brina', 'circolo-braska'].map((id) => ({ ...NUDO, accessori: [id] })), 3);
if (quali === 'teste') tavola('teste', ['circolo-cappuccio-di-nebbia', 'scuri-cappuccio-degli-scuri', 'velo-velo-grigio', 'maschera-della-forza', 'maschera-della-rottura', 'maschera-della-distorsione', 'maschera-della-natura', 'tuarmir-maschera-d-erbe', 'ghoran-filo-di-rame', 'avv-sogno-serpente-penna-della-guardiana', 'campana-conchiglia-sorda', 'velo-simbolo-in-platino', 'gilda-catena-del-terzo-piano', 'cristalli-anti-marea', 'fonte-di-energia', 'caserma-distintivo-del-capitano'].map((id) => ({ ...NUDO, armatura: 'nessuna', accessori: [id] })), 8);
if (fai('accessori')) { const l = og('accessorio'); for (let i = 0; i < l.length; i += 20) tavola(`accessori-${i / 20 + 1}`, l.slice(i, i + 20).map((o) => ({ ...NUDO, armatura: 'nessuna', accessori: [o.id] })), 5); }
// i tagli di capelli e le barbe, con i due corpi
if (quali === 'capelli') {
  const asp: Aspetto[] = [
    ...TAGLI.map((capelli, k): Aspetto => ({ pelle: ['chiara', 'olivastra', 'ambrata', 'scura', 'pallida'][k]!, capelli, coloreCapelli: ['castano', 'nero', 'rame', 'cenere', 'grigio'][k]!, barba: BARBE[k]!, coloreBarba: ['castano', 'nero', 'rame', 'cenere', 'grigio'][k]! })),
    ...TAGLI.map((capelli, k): Aspetto => ({ corpo: 'femminile', pelle: ['pallida', 'scura', 'chiara', 'olivastra', 'ambrata'][k]!, capelli, coloreCapelli: ['rosso', 'nero', 'castano', 'bianco', 'cenere'][k]!, barba: 'nessuna', coloreBarba: 'castano' })),
  ];
  tavola('capelli', asp.map(() => ({ ...NUDO, armatura: 'nessuna' })), 5, asp);
}
