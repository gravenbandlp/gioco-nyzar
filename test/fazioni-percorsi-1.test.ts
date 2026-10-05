import { describe } from 'vitest';
import { percorsiFazione } from './fazioni-percorsi';

describe('quest di fazione', () => {
  percorsiFazione('velo');
  percorsiFazione('caserma');
  percorsiFazione('scuri');
});
