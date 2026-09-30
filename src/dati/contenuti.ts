// Contenuti validati in fase di build (scripts/build-contenuti.ts).
import dati from '../generato/contenuti.json';
import type { TContenuti } from '../motore/contenuto';

export const CONTENUTI = dati as unknown as TContenuti;
