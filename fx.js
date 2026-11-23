/* =====================================================================
 *  fx.js — Particules : petits cœurs et étincelles
 *  Léger : quelques éléments DOM éphémères animés par GSAP, jamais plus
 *  de MAX_PARTICLES en même temps (reste fluide sur téléphone).
 * ===================================================================== */

const MAX_PARTICLES = 70;
const COLORS = ['#dd9aa3', '#f1c9cc', '#ecd06f', '#f7e7a1', '#c9808a'];

const GLYPHS = {
  heart:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z"/></svg>',
  sparkle:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1c.9 6.6 4.4 10.1 11 11-6.6.9-10.1 4.4-11 11-.9-6.6-4.4-10.1-11-11C7.6 11.1 11.1 7.6 12 1z"/></svg>',
};

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Fait jaillir une petite gerbe de particules à la position (x, y) de l'écran.
 * @param {number} x       position horizontale (px, viewport)
 * @param {number} y       position verticale (px, viewport)
 * @param {object} options count = nombre, kinds = formes, spread = rayon max
 */
export function burst(x, y, { count = 7, kinds = ['heart', 'sparkle'], spread = 70 } = {}) {
  const layer = document.getElementById('fx');
  if (!layer || !window.gsap || reducedMotion) return;

  count = Math.min(count, MAX_PARTICLES - layer.childElementCount);

  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    el.className = 'fx-p';
    el.innerHTML = GLYPHS[pick(kinds)];

    const size = rand(9, 20);
    const angle = rand(0, Math.PI * 2);
    const dist = rand(spread * 0.4, spread);
    const x0 = x - size / 2;
    const y0 = y - size / 2;

    gsap.set(el, { width: size, height: size, x: x0, y: y0, color: pick(COLORS), scale: 0, rotation: rand(-40, 40) });
    layer.appendChild(el);

    gsap
      .timeline({ onComplete: () => el.remove() })
      // 1) la particule jaillit…
      .to(el, {
        x: x0 + Math.cos(angle) * dist,
        y: y0 + Math.sin(angle) * dist - 14,
        scale: 1,
        rotation: rand(-120, 120),
        duration: rand(0.45, 0.7),
        ease: 'power3.out',
      })
      // 2) …puis s'élève doucement en s'effaçant
      .to(el, { y: `-=${rand(18, 40)}`, opacity: 0, scale: 0.4, duration: rand(0.5, 0.8), ease: 'sine.in' }, '>-0.1');
  }
}

/** Un clic / un toucher n'importe où fait éclore quelques cœurs. */
export function initClickParticles() {
  document.addEventListener(
    'pointerdown',
    (e) => {
      if (e.target.closest('input, textarea, video, iframe, .player__bar')) return;
      burst(e.clientX, e.clientY, { count: e.pointerType === 'touch' ? 5 : 6 });
    },
    { passive: true }
  );
}
