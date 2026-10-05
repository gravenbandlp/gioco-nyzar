import { nuovoPersonaggio } from '../src/motore/personaggio';
import { leggiVoce, checkPassivo, erroriVoci, senzaSegni } from '../src/motore/voci';
import { prosa } from '../src/ui/componenti';
import { CONTENUTI as c } from '../src/dati/contenuti';

const pg = () => nuovoPersonaggio('Vessa', c.origini.find((o) => o.id === 'figlio-della-citta-bassa')!, 0, 'citta-bassa');

describe('voci delle abilità', () => {
  it('legge il segno, l\'attributo e la variante fallita', () => {
    expect(leggiVoce('{percezione Media} Sul vetro qualcuno ha inciso.')).toMatchObject({ abilita: 'percezione', attributo: 'mentale', difficolta: 'Media', seFallita: false, testo: 'Sul vetro qualcuno ha inciso.' });
    expect(leggiVoce('{resistenza Molto facile fallita} Hai freddo.')).toMatchObject({ attributo: 'fisico', difficolta: 'Molto facile', seFallita: true });
    expect(leggiVoce('{empatia Difficile} Lo spolvera.')?.attributo).toBe('sociale');
    expect(leggiVoce('Un paragrafo normale.')).toBeNull();
  });
  it('segnala i segni sbagliati', () => {
    expect(erroriVoci('{percezione Media} Va bene.')).toEqual([]);
    expect(erroriVoci('{volare Media} No.')).toHaveLength(1);
    expect(erroriVoci('{percezione Mediocre} No.')).toHaveLength(1);
    expect(erroriVoci('{percezione Media}')).toHaveLength(1);
  });
  it('il check passivo non tira dadi e sale con l\'abilità', () => {
    const s = pg();
    s.abilita['percezione'] = 0;
    const v = { abilita: 'percezione', attributo: 'mentale' as const, difficolta: 'Difficile' as const };
    const prima = checkPassivo(s, c, v);
    expect(checkPassivo(s, c, v)).toBe(prima);
    s.abilita['percezione'] = 5; s.attributi.mentale = 5;
    expect(checkPassivo(s, c, v)).toBe(true);
  });
  it('nella prosa compare la voce riuscita o quella fallita, mai tutte e due', () => {
    const testo = 'Prima.\n\n{percezione Media} Lo vedi.\n\n{percezione Media fallita} Non vedi niente.';
    const si = prosa(testo, 'prosa', () => true);
    expect(si).toContain('Lo vedi.');
    expect(si).not.toContain('Non vedi niente.');
    expect(si).toContain('PERCEZIONE');
    const no = prosa(testo, 'prosa', () => false);
    expect(no).toContain('Non vedi niente.');
    expect(no).not.toContain('Lo vedi.');
    expect(prosa(testo)).not.toContain('PERCEZIONE');
    expect(senzaSegni(testo)).not.toContain('{');
  });
  it("un paragrafo d'origine compare solo a chi ha quell'origine", () => {
    const testo = 'Prima.\n\n{origine accolito-del-velo apprendista-raschiatore} Il saio ti tradisce.\n\nDopo.';
    const accolito = prosa(testo, 'prosa', () => true, { id: 'accolito-del-velo', nome: 'Accolito del Velo' });
    expect(accolito).toContain('Il saio ti tradisce.');
    expect(accolito).toContain('ACCOLITO DEL VELO');
    expect(prosa(testo, 'prosa', () => true, { id: 'fuggiasco-di-ghoran', nome: 'Fuggiasco di Ghoran' })).not.toContain('Il saio');
    expect(prosa(testo)).not.toContain('Il saio');
    expect(erroriVoci('{origine accolito-del-velo} Va bene.', ['accolito-del-velo'])).toEqual([]);
    expect(erroriVoci('{origine nessuno} No.', ['accolito-del-velo'])).toHaveLength(1);
    expect(senzaSegni(testo)).not.toContain('{');
  });
  it('tutti i segni nei contenuti sono validi', () => {
    const errori: string[] = [];
    for (const st of c.storylet) {
      errori.push(...erroriVoci(st.testo));
      for (const o of st.opzioni) for (const e of [o.successo, o.fallimento, o.vittoria, o.sconfitta, o.esito]) if (e) errori.push(...erroriVoci(e.testo));
    }
    expect(errori).toEqual([]);
  });
});
