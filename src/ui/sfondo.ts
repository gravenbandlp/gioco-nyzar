// La trama di mana: lo sfondo animato del Codex Ny'Zar (codex-nyzar, src/components/ManaNet.astro), rifatto qui.
// Tre strati di particelle a profondità diverse, raccolte attorno a centri di densità che cambiano ogni mezzo minuto,
// unite da filetti quando sono vicine; al passaggio del mouse si illuminano e virano all'oro.
// Si ferma quando la pagina non si vede; con il movimento ridotto disegna un solo fotogramma.

interface Strato {
  count: number; speedFactor: number; radiusBase: number; radiusVar: number;
  maxDist: number; parallaxFactor: number; connectionAlpha: number; particleAlpha: number;
}
interface Particella { x: number; y: number; vx: number; vy: number; radius: number; color: 'precursore' | 'velo'; pulse: number; glow: number }

const STRATI: Strato[] = [
  { count: 40, speedFactor: 0.3, radiusBase: 0.5, radiusVar: 0.5, maxDist: 110, parallaxFactor: 0.15, connectionAlpha: 0.10, particleAlpha: 0.35 },
  { count: 55, speedFactor: 0.6, radiusBase: 0.9, radiusVar: 0.7, maxDist: 140, parallaxFactor: 0.5, connectionAlpha: 0.18, particleAlpha: 0.55 },
  { count: 25, speedFactor: 1.0, radiusBase: 1.4, radiusVar: 0.9, maxDist: 170, parallaxFactor: 1.0, connectionAlpha: 0.26, particleAlpha: 0.75 },
];
const MOUSE_DIST = 220;
const GLOW_DIST = 140;
const GLOW_DECAY = 0.92;
const COLORI = { precursore: '58, 138, 153', velo: '184, 138, 62' };

export function avviaSfondo(): void {
  if (document.getElementById('trama')) return;
  const canvas = document.createElement('canvas');
  canvas.id = 'trama';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const fermo = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // su schermi piccoli meno particelle: il disegno dei filetti cresce col quadrato
  const densita = innerWidth < 700 ? 0.55 : 1;
  const mouse = { x: -9999, y: -9999, active: false };
  let centri: { x: number; y: number; radius: number }[] = [];
  const strati: { config: Strato; particles: Particella[] }[] = [];

  const generaCentri = () => {
    centri = Array.from({ length: 4 + Math.floor(Math.random() * 3) }, () => ({
      x: Math.random() * innerWidth, y: Math.random() * innerHeight, radius: 180 + Math.random() * 220,
    }));
  };
  const posizione = () => {
    if (Math.random() < 0.7 && centri.length) {
      const c = centri[Math.floor(Math.random() * centri.length)]!;
      const a = Math.random() * Math.PI * 2; const r = Math.random() * c.radius;
      return { x: c.x + Math.cos(a) * r, y: c.y + Math.sin(a) * r };
    }
    return { x: Math.random() * innerWidth, y: Math.random() * innerHeight };
  };
  const ridimensiona = () => {
    const dpr = devicePixelRatio || 1;
    canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
    canvas.style.width = `${innerWidth}px`; canvas.style.height = `${innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const inizia = () => {
    ridimensiona();
    generaCentri();
    strati.length = 0;
    for (const config of STRATI) {
      const particles: Particella[] = [];
      for (let i = 0; i < Math.round(config.count * densita); i++) {
        const p = posizione();
        particles.push({
          x: p.x, y: p.y,
          vx: (Math.random() - 0.5) * 0.3 * config.speedFactor, vy: (Math.random() - 0.5) * 0.3 * config.speedFactor,
          radius: config.radiusBase + Math.random() * config.radiusVar,
          color: Math.random() > 0.88 ? 'velo' : 'precursore', pulse: Math.random() * Math.PI * 2, glow: 0,
        });
      }
      strati.push({ config, particles });
    }
  };

  const aggiorna = () => {
    for (const { config, particles } of strati) {
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        p.pulse += 0.012 * config.speedFactor;
        p.glow *= GLOW_DECAY;
        if (p.x < -10) p.x = innerWidth + 10;
        if (p.x > innerWidth + 10) p.x = -10;
        if (p.y < -10) p.y = innerHeight + 10;
        if (p.y > innerHeight + 10) p.y = -10;
        if (mouse.active) {
          const dx = p.x - mouse.x; const dy = p.y - mouse.y; const dist = Math.hypot(dx, dy);
          if (dist < GLOW_DIST) p.glow = Math.max(p.glow, (1 - dist / GLOW_DIST) * (0.5 + config.parallaxFactor * 0.5));
          if (config.parallaxFactor >= 0.9 && dist < MOUSE_DIST && dist > 0) {
            const forza = (1 - dist / MOUSE_DIST) * 0.4;
            p.vx += (dx / dist) * forza * 0.04; p.vy += (dy / dist) * forza * 0.04;
          }
        }
        p.vx *= 0.985; p.vy *= 0.985;
        if (Math.hypot(p.vx, p.vy) < 0.12 * config.speedFactor) {
          p.vx += (Math.random() - 0.5) * 0.04; p.vy += (Math.random() - 0.5) * 0.04;
        }
      }
    }
  };

  const disegna = () => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const { config, particles } of strati) {
      ctx.lineWidth = 0.5 + config.parallaxFactor * 0.3;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i]!;
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j]!;
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist >= config.maxDist) continue;
          const alpha = (1 - dist / config.maxDist) * config.connectionAlpha + Math.max(a.glow, b.glow) * 0.35;
          ctx.strokeStyle = `rgba(${COLORI.precursore}, ${alpha})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      if (config.parallaxFactor >= 0.9 && mouse.active) {
        ctx.lineWidth = 0.7;
        for (const p of particles) {
          const dist = Math.hypot(p.x - mouse.x, p.y - mouse.y);
          if (dist >= MOUSE_DIST) continue;
          ctx.strokeStyle = `rgba(${COLORI.velo}, ${(1 - dist / MOUSE_DIST) * 0.42})`;
          ctx.beginPath(); ctx.moveTo(mouse.x, mouse.y); ctx.lineTo(p.x, p.y); ctx.stroke();
        }
      }
      for (const p of particles) {
        const osc = (Math.sin(p.pulse) + 1) / 2;
        const raggio = p.radius + osc * 0.5 + p.glow * 2.5;
        const alpha = Math.min(config.particleAlpha + osc * 0.2 + p.glow * 0.6, 1);
        ctx.fillStyle = `rgba(${p.glow > 0.3 ? COLORI.velo : COLORI[p.color]}, ${alpha})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, raggio, 0, Math.PI * 2); ctx.fill();
        if (p.glow > 0.2) {
          ctx.fillStyle = `rgba(${COLORI.velo}, ${p.glow * 0.18})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, raggio * 3.5, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
  };

  inizia();
  disegna(); // un primo fotogramma subito, anche se la pagina si apre in secondo piano
  addEventListener('resize', () => { ridimensiona(); generaCentri(); if (fermo) disegna(); });
  if (fermo) { disegna(); return; }

  let inCorso = false;
  const ciclo = () => {
    if (document.hidden) { inCorso = false; return; }
    aggiorna(); disegna();
    requestAnimationFrame(ciclo);
  };
  const assicura = () => { if (inCorso) return; inCorso = true; requestAnimationFrame(ciclo); };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) assicura(); });
  addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; }, { passive: true });
  document.documentElement.addEventListener('mouseleave', () => { mouse.active = false; });
  setInterval(generaCentri, 30_000);
  assicura();
}
