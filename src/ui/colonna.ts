// Quale musica e quale ambiente suonano in un dato momento. Funzione pura: la usa il lettore audio e la
// provano i test. Le voci della colonna sonora (contenuti/audio.yaml) si sovrappongono a strati, dal più
// generale al più specifico; ogni strato cambia solo quello che dichiara.
import type { TContenuti } from '../motore/contenuto';

export interface Momento {
  creazione?: boolean; // prima di avere un personaggio
  area?: string;
  luogo?: string;
  prologo?: boolean;
  crisi?: boolean;
  combattimento?: boolean;
}

export interface Scelta { musica: string | null; ambiente: string | null }

export function sceltaAudio(c: Pick<TContenuti, 'colonna'>, m: Momento): Scelta {
  const voce = (contesto: string, id?: string) => c.colonna.find((v) => v.contesto === contesto && (id === undefined || v.id === id));
  const strati = m.creazione
    ? [voce('predefinita'), voce('creazione')]
    : [
      voce('predefinita'),
      m.area ? voce('area', m.area) : undefined,
      m.luogo ? voce('luogo', m.luogo) : undefined,
      m.prologo ? voce('prologo') : undefined,
      m.crisi ? voce('crisi') : undefined,
      m.combattimento ? voce('combattimento') : undefined,
    ];
  const out: Scelta = { musica: null, ambiente: null };
  for (const v of strati) {
    if (!v) continue;
    if (v.musica) out.musica = v.musica;
    if (v.ambiente) out.ambiente = v.ambiente === 'nessuno' ? null : v.ambiente;
  }
  return out;
}
