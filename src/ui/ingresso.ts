// La soglia: una schermata d'ingresso sopra il gioco. Il clic per entrare è il gesto che i browser chiedono prima
// di lasciar suonare l'audio, così musica e ambiente partono già sulla prima schermata.
import { ROMBO, srcTavola } from './componenti';
import type { Lettore } from './audio';

const SFONDO = 'ambientazione/cicatrice-del-mondo';

export function montaIngresso(l: Lettore): void {
  const soglia = document.createElement('div');
  soglia.className = 'soglia';
  soglia.setAttribute('role', 'dialog');
  soglia.setAttribute('aria-modal', 'true');
  soglia.setAttribute('aria-labelledby', 'soglia-titolo');
  soglia.innerHTML = `
    <img class="soglia-sfondo" src="${srcTavola(SFONDO, 'l')}" alt="" decoding="async">
    <div class="soglia-testo">
      <div class="marchio">${ROMBO}<span class="nome-marchio"><span><b>NY'ZAR</b> · <em>QIR-AZEL</em></span><small>Cronache della Città Bassa</small></span></div>
      <span class="etichetta precursore">Superficie Fratturata · 150 D.C.</span>
      <h1 id="soglia-titolo">Qir-Azel</h1>
      <p>La città sull'orlo della Cicatrice del Mondo.</p>
      <div class="soglia-azioni">
        <button type="button" class="bottone primario" data-soglia="entra">Entra a Qir-Azel</button>
        <button type="button" class="soglia-muto" data-soglia="muto">Entra senza audio</button>
      </div>
      <small class="soglia-nota">Musica, ambienti e voci: meglio con le cuffie.</small>
    </div>`;
  document.documentElement.classList.add('con-soglia');
  document.body.append(soglia);

  const entra = (muto: boolean) => {
    if (muto) l.silenzia(true);
    else if (l.prefs.muto) l.silenzia(false);
    else l.avvia();
    document.documentElement.classList.remove('con-soglia');
    soglia.classList.add('via');
    const togli = () => soglia.remove();
    soglia.addEventListener('transitionend', togli, { once: true });
    setTimeout(togli, 900); // se la transizione non parte (movimento ridotto)
  };
  soglia.querySelector<HTMLButtonElement>('[data-soglia=entra]')!.addEventListener('click', () => entra(false));
  soglia.querySelector<HTMLButtonElement>('[data-soglia=muto]')!.addEventListener('click', () => entra(true));
  soglia.querySelector<HTMLButtonElement>('[data-soglia=entra]')!.focus();
}
