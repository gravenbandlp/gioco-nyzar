import { describe } from 'vitest';
import { percorsiFazione } from './fazioni-percorsi';

describe('quest di fazione', () => {
  percorsiFazione('circolo');
  percorsiFazione('accademia');
  percorsiFazione('consiglio');
});
