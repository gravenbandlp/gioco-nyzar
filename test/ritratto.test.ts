import { CONTENUTI as c } from '../src/dati/contenuti';
import { nuovoPersonaggio } from '../src/motore/personaggio';
import { disegna, type Aspetto } from '../src/ui/ritratto/motore';
import { ACCESSORI, ARMI_BASE, ARMATURE_BASE, SCUDI_BASE, UNICI, aspettoPredefinito, aspettoValido, figura, figuraDi, type Dotazione } from '../src/ui/ritratto/aspetti';
import { cambiaAspetto } from '../src/ui/ritratto/scelta';

const ASPETTO: Aspetto = { pelle: 'olivastra', capelli: 'corti', coloreCapelli: 'nero', barba: 'corta', coloreBarba: 'grigio' };
const NUDO: Dotazione = { arma: 'mani-nude', armatura: 'nessuna', scudo: '', accessori: [], segni: [] };
const pixel = (d: Dotazione) => Buffer.from(disegna(figura(ASPETTO, d, c)).pixel).toString('base64');
const BASI = new Set([...Object.keys(ARMI_BASE), ...Object.keys(ARMATURE_BASE), ...Object.keys(SCUDI_BASE)]);

describe('ritratto', () => {
  const nudo = pixel(NUDO);

  it('ogni arma, armatura e scudo unico ha un aspetto suo, le basi il loro', () => {
    for (const o of c.oggetti.filter((x) => x.slot === 'arma' || x.slot === 'armatura' || x.slot === 'scudo')) {
      if (BASI.has(o.id)) continue;
      expect(UNICI[o.id], `${o.id} non ha un aspetto in ui/ritratto/aspetti.ts`).toBeDefined();
    }
    for (const id of Object.keys(UNICI)) expect(c.oggetti.some((o) => o.id === id), `${id} non è un oggetto del gioco`).toBe(true);
  });

  it('ogni accessorio ha un aspetto', () => {
    for (const o of c.oggetti.filter((x) => x.slot === 'accessorio')) expect(ACCESSORI[o.id], `${o.id} non ha un aspetto`).toBeDefined();
    for (const id of Object.keys(ACCESSORI)) expect(c.oggetti.some((o) => o.id === id && o.slot === 'accessorio'), `${id} non è un accessorio`).toBe(true);
  });

  it('ogni oggetto indossato si vede sul ritratto', () => {
    for (const o of c.oggetti) {
      if (o.slot === 'nessuno' || o.id === 'mani-nude' || o.id === 'nessuna') continue;
      const d: Dotazione = o.slot === 'arma' ? { ...NUDO, arma: o.id }
        : o.slot === 'armatura' ? { ...NUDO, armatura: o.id }
        : o.slot === 'scudo' ? { ...NUDO, scudo: o.id }
        : { ...NUDO, accessori: [o.id] };
      expect(pixel(d), `${o.id} non cambia il ritratto`).not.toBe(nudo);
    }
  });

  it('le combinazioni più cariche si disegnano senza errori', () => {
    const r = disegna(figura(ASPETTO, {
      arma: 'spadone-runico-di-capomozzo', armatura: 'avv-zanna-rotta-pelliccia-di-mezzaluna', scudo: 'avv-divoratore-placca-del-divoratore',
      accessori: ['cavallo-da-guerra', 'circolo-lupa-brina'], segni: ['occhi', 'vene', 'unghie', 'pelle'],
    }, c));
    expect(r.W).toBe(84);
    expect(r.pixel.length).toBe(84 * 72 * 4);
  });

  it("l'aspetto si sceglie alla creazione e si conserva nello stato", () => {
    const s = nuovoPersonaggio('Vessa', c.origini[0]!, 0, 'citta-bassa', ASPETTO);
    expect(aspettoValido(s.aspetto)).toEqual(ASPETTO);
    expect(figuraDi(s, c).aspetto).toEqual(ASPETTO);
  });

  it('un salvataggio senza aspetto, o con un aspetto rotto, prende quello predefinito dal nome', () => {
    const s = nuovoPersonaggio('Daeran il Rosso', c.origini[0]!, 0, 'citta-bassa');
    expect(s.aspetto).toBeUndefined();
    expect(figuraDi(s, c).aspetto).toEqual(aspettoPredefinito('Daeran il Rosso'));
    expect(aspettoValido({ ...ASPETTO, pelle: 'verde' })).toBeUndefined();
    expect(aspettoValido({ ...ASPETTO, capelli: 'cresta' })).toBeUndefined();
  });

  it('il selettore accetta solo valori validi', () => {
    expect(cambiaAspetto(ASPETTO, 'coloreCapelli', 'rosso').coloreCapelli).toBe('rosso');
    expect(cambiaAspetto(ASPETTO, 'barba', 'lunga').barba).toBe('lunga');
    expect(cambiaAspetto(ASPETTO, 'pelle', 'blu')).toEqual(ASPETTO);
    expect(cambiaAspetto(ASPETTO, 'nome', 'x')).toEqual(ASPETTO);
  });

  it('le mutazioni visibili diventano segni sul ritratto', () => {
    const s = nuovoPersonaggio('Vessa', c.origini[0]!, 0, 'citta-bassa', ASPETTO);
    s.quality['mutazione.occhi-luminescenti'] = 1;
    s.quality['mutazione.gola-roca'] = 1;
    expect(figuraDi(s, c).segni).toEqual(['occhi']);
  });
});
