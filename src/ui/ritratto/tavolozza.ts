// Le rampe di colore del ritratto. Ogni materiale ha quattro toni: 0 ombra profonda, 1 ombra, 2 base, 3 luce.
// Le ombre tirano verso il blu-verde del Codex, le luci verso l'avorio; saturazione bassa, tranne lo scarlatto e il Mana.

export type Rampa = readonly [string, string, string, string];

export const RAMPE: Record<string, Rampa> = {
  // stoffe
  lana: ['#111618', '#1d2628', '#2c3836', '#3f4d47'],
  lanaGrigia: ['#16191b', '#262b2d', '#3a4042', '#555b5b'],
  lanaVerde: ['#121813', '#1f2a22', '#2f3d33', '#45554a'],
  lanaNera: ['#08090b', '#111316', '#1b1e22', '#2a2e33'],
  lanaRossa: ['#1e0d0d', '#361516', '#4f2020', '#6a2f2a'],
  braghe: ['#0e1012', '#191c1f', '#25292b', '#34383a'],
  lino: ['#221d14', '#3f3626', '#5d523a', '#7a6e52'],
  tela: ['#1b1e1f', '#2f3536', '#4a5253', '#6a7273'],
  seta: ['#0c0c10', '#17161d', '#25232d', '#3a3744'],
  scarlatto: ['#240b0f', '#441318', '#661d1e', '#86302b'],
  petrolio: ['#071416', '#0e2427', '#17383b', '#2b5a55'],
  feltro: ['#1e2022', '#33373a', '#4b5053', '#62686a'],
  // pelli e cuoi
  cuoio: ['#120c0a', '#241913', '#37261c', '#4c3527'],
  cuoio2: ['#1a0f0b', '#352016', '#4f3020', '#6b452e'],
  cuoioNero: ['#09090a', '#141416', '#202124', '#303236'],
  cuoioGrigio: ['#18191a', '#2c2e2f', '#44474a', '#5f6366'],
  cuoioVerde: ['#0f1610', '#1b2a1d', '#2b412d', '#3e5a40'],
  cuoioRosso: ['#200c0a', '#3d1712', '#5c241a', '#7b3624'],
  cuoioChiaro: ['#26180f', '#45301e', '#664a30', '#886646'],
  resina: ['#1f1206', '#3e250c', '#5e3a14', '#82561f'],
  cinghiale: ['#17110d', '#2c2119', '#433327', '#5a4636'],
  pelo: ['#2a2b2b', '#4a4c4b', '#6d706e', '#959893'],
  peloBianco: ['#4a4c4c', '#7e807d', '#aeafa8', '#d2d0c6'],
  muschio: ['#121a14', '#22301f', '#36482c', '#506540'],
  corteccia: ['#100c09', '#1f1812', '#30251b', '#463626'],
  // metalli
  ferro: ['#0f1112', '#24282a', '#3e4346', '#646a6c'],
  ferroNero: ['#08090a', '#131518', '#1f2226', '#33373b'],
  acciaio: ['#0b1014', '#1c2830', '#334550', '#5d7480'],
  acciaioChiaro: ['#141b20', '#2e3d46', '#506670', '#8aa2aa'],
  maglia: ['#15191c', '#2f363b', '#4f585e', '#7d878b'],
  neroLama: ['#0a0c0e', '#15191c', '#20262a', '#2c3338'],
  precursore: ['#05070a', '#0e1317', '#192127', '#3a8a99'],
  precursoreGrigio: ['#12181c', '#26333a', '#41545c', '#7896a0'],
  oro: ['#33230e', '#5e4320', '#9a7234', '#c9984f'],
  oroOpaco: ['#2a2010', '#4a3a1e', '#6e5a32', '#8f7a4c'],
  argento: ['#2a2f32', '#555c60', '#868d90', '#c0c6c6'],
  argentoBrunito: ['#15181b', '#2c3236', '#4a5256', '#737c80'],
  bronzo: ['#24170b', '#432c14', '#694522', '#8f6534'],
  rame: ['#240f08', '#46200f', '#6e3519', '#965028'],
  ottone: ['#2c220c', '#54421a', '#806a2c', '#ab9246'],
  latta: ['#1f2224', '#3b4144', '#5d6467', '#868d8f'],
  platino: ['#3a3e40', '#6d7273', '#a0a5a4', '#d4d8d4'],
  // legni, ossa, corni
  legno: ['#160f0a', '#2d2016', '#443222', '#5e4630'],
  frassino: ['#2a1f14', '#4a3a26', '#6a5638', '#8a7550'],
  tasso: ['#24120c', '#432417', '#633924', '#835035'],
  legnoChiaro: ['#33281a', '#5a4a32', '#80704f', '#a4946e'],
  ebano: ['#060505', '#0f0d0c', '#191615', '#272220'],
  legnoNero: ['#0a0908', '#151311', '#211e1a', '#2f2b26'],
  pece: ['#050506', '#0c0c0e', '#151619', '#262a2e'],
  corno: ['#1a1410', '#33281f', '#4e4032', '#6d5d4a'],
  osso: ['#3a3426', '#6a6048', '#968a6a', '#bdb18e'],
  unghia: ['#2e2a20', '#544c3a', '#776c54', '#988c6e'],
  avorio: ['#4a4436', '#7c7460', '#ada38a', '#d6ccb0'],
  madreperla: ['#3c4446', '#6f7a7a', '#a3aca8', '#d4dad2'],
  giaietto: ['#030304', '#0b0b0e', '#16161b', '#3b3e4a'],
  chitina: ['#100806', '#2a170f', '#4b2a1b', '#8b5a36'],
  carta: ['#3a3528', '#686049', '#958b6c', '#bfb592'],
  // resti, pietre, vetri
  corda: ['#4a4538', '#6a6352', '#8a826e', '#a69d86'],
  canapa: ['#3a3222', '#5c5036', '#7e704e', '#9c8e6a'],
  piuma: ['#2e2e2c', '#4e4c48', '#706d66', '#938f86'],
  piumaNera: ['#050506', '#0d0e11', '#181a1f', '#2c3038'],
  piumaRossa: ['#2a0a08', '#561610', '#8a2618', '#c48a3c'],
  vernice: ['#1b3238', '#24464e', '#2f5a63', '#3d6e78'],
  vetro: ['#1a2a2e', '#2f4a50', '#527a80', '#a8c8c8'],
  ossidiana: ['#040406', '#0b0a10', '#16141e', '#3c3650'],
  arenaria: ['#3a160e', '#5e2416', '#86361f', '#a8522e'],
  pietra: ['#0a0e11', '#10171b', '#162026', '#1e2b33'],
  linfa: ['#2a0606', '#560c0a', '#8a1a12', '#c03a22'],
  // luci (non prendono ombre)
  luce: ['#8a5e22', '#c08a3c', '#e8b866', '#f8ecc4'],
  luceVelata: ['#5e3c16', '#8e6228', '#b8883e', '#d8b46a'],
  cristallo: ['#1c4a52', '#3a8a99', '#8fc3cb', '#d8f2f2'],
  mana: ['#4a0e16', '#8a1e2c', '#c63a4a', '#f08a8a'],
  luceBianca: ['#5a6a6c', '#9aaeb0', '#d4e4e2', '#f4fbf8'],
  // bestie
  lupo: ['#1c1e1f', '#353839', '#555858', '#7a7c79'],
  puma: ['#060607', '#0f1012', '#1a1b1f', '#2b2d33'],
  pumaFuoco: ['#2a0c06', '#5a1a0a', '#8a3010', '#b8521c'],
  baio: ['#1a0c07', '#36180c', '#562814', '#77401f'],
  morello: ['#050608', '#0c0e12', '#161a20', '#2a3a48'],
  grigioPomellato: ['#24272a', '#44484a', '#676b69', '#8c8f8a'],
  criniera: ['#060505', '#100d0b', '#1c1814', '#2c2620'],
  zoccolo: ['#0c0b0a', '#1a1816', '#2a2724', '#3e3a35'],
};

/** I materiali che fanno luce: niente ombre proiettate su di loro, niente luce calda della lanterna. */
export const EMISSIVI = new Set(['luce', 'luceVelata', 'cristallo', 'mana', 'luceBianca']);

export const PELLI: Record<string, Rampa> = {
  pallida: ['#3e2f35', '#7a615f', '#ad9081', '#cdb3a0'],
  chiara: ['#3a272a', '#71504a', '#a17866', '#c29b84'],
  olivastra: ['#2c231f', '#5c4836', '#856a4f', '#a6896a'],
  ambrata: ['#271a16', '#4d3226', '#744b35', '#93664a'],
  scura: ['#160f10', '#2e1f1c', '#4a3127', '#664537'],
};

export const CHIOME: Record<string, Rampa> = {
  nero: ['#0b0c0e', '#17181b', '#25252a', '#3b3a3a'],
  castano: ['#170f0b', '#2f2017', '#4a3222', '#644631'],
  rame: ['#220f0b', '#4a2014', '#723722', '#94553a'],
  rosso: ['#2a0a08', '#561811', '#82281a', '#a8402a'],
  cenere: ['#302b21', '#5a5240', '#82775c', '#a5997a'],
  grigio: ['#232527', '#46494b', '#6c6f6e', '#959791'],
  bianco: ['#3c4044', '#767a7a', '#a6a69e', '#cbc7ba'],
};

export const NOMI_PELLE: Record<string, string> = { pallida: 'Pallida', chiara: 'Chiara', olivastra: 'Olivastra', ambrata: 'Ambrata', scura: 'Scura' };
export const NOMI_CHIOMA: Record<string, string> = {
  nero: 'Nero', castano: 'Castano', rame: 'Rame', rosso: 'Rosso', cenere: 'Biondo cenere', grigio: 'Grigio', bianco: 'Bianco',
};
