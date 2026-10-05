import { describe } from 'vitest';
import { percorsiFazione } from './fazioni-percorsi';

describe('quest di fazione', () => {
  percorsiFazione('gilda');
  percorsiFazione('raschiatori');
  percorsiFazione('maison');
});
