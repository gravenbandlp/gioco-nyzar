import { impostaGlossario, prosa } from '../src/ui/componenti';
import { CONTENUTI as c } from '../src/dati/contenuti';
import type { TVoce } from '../src/motore/contenuto';

const voci: TVoce[] = [
  { id: 'nerissa', nome: 'Nerissa Dalvane', alias: ['Nerissa'], tipo: 'personaggio', testo: 'x', requisiti: [] },
  { id: 'maison', nome: 'Maison des Lunes', alias: ['Maison'], tipo: 'luogo', testo: 'x', requisiti: [] },
  { id: 'nodo', nome: "Nodo d'Ossidiana", alias: [], tipo: 'luogo', testo: 'x', requisiti: [] },
  { id: 'segreta', nome: 'Aurenne', alias: [], tipo: 'personaggio', testo: 'x', requisiti: ['pista.x >= 1'] },
];

describe('glossario nella prosa', () => {
  it('sottolinea la prima occorrenza, la forma più lunga e solo parole intere', () => {
    impostaGlossario(voci, (v) => v.requisiti.length === 0);
    const out = prosa("Nerissa Dalvane scende. Poi Nerissa sorride.\n\nAlla Maison des Lunes, *Maison* e Maisonette. Il Nodo d'Ossidiana. Aurenne.");
    expect(out.match(/data-voce="nerissa"/g)).toHaveLength(1);
    expect(out).toContain('<span class="voce" tabindex="0" role="button" data-voce="nerissa">Nerissa Dalvane</span>');
    expect(out.match(/data-voce="maison"/g)).toHaveLength(1);
    expect(out).toContain('>Maison des Lunes</span>');
    expect(out).toContain('Maisonette');
    expect(out).toContain('data-voce="nodo"');
    expect(out).not.toContain('data-voce="segreta"');
  });
  it('le voci vere del gioco non si sovrappongono e compaiono nei testi', () => {
    // una forma appartiene a un solo nome; le varianti dello stesso nome (prima e dopo un fatto) la condividono
    const nomeDi = new Map<string, string>();
    for (const v of c.glossario) for (const f of [v.nome, ...v.alias]) {
      expect(nomeDi.get(f) ?? v.nome, `${v.id}: ${f}`).toBe(v.nome);
      nomeDi.set(f, v.nome);
    }
    expect(c.glossario.length).toBeGreaterThan(80);
  });
});
