// I test di percorso sono sincroni e lunghi: fra un test e l'altro vitest passa solo per le microtask, e se un file
// intero tiene occupato il processo per più di un minuto le sue chiamate interne scadono ("Timeout calling
// onTaskUpdate"). Una pausa vera dopo ogni test lascia arrivare le risposte.
import { afterEach } from 'vitest';

afterEach(() => new Promise<void>((fatto) => setTimeout(fatto, 0)));
