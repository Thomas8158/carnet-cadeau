/* =====================================================================
 *  reactions.js — Ce qui se passe quand on survole / touche un objet
 *
 *  Chaque fonction reçoit le <svg> de l'objet et renvoie une timeline GSAP
 *  qui REVIENT toujours à l'état initial (on peut donc la rejouer à l'infini).
 *  Les noms de classes ciblés (.book-cover, .env-flap…) viennent de art.js.
 * ===================================================================== */

import { burst } from './fx.js';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const HOLD = (d) => ({ duration: d }); // petite pause dans une timeline

const reactions = {
  /* Le livre s'ouvre : la couverture pivote autour de la reliure. */
  book(root) {
    const book = root.querySelector('.book');
    const cover = root.querySelector('.book-cover');
    const inside = root.querySelector('.book-cover-in');
    gsap.set([cover, inside], { svgOrigin: '58 100' });
    gsap.set(inside, { scaleX: 0.001 });

    return gsap
      .timeline()
      .to(book, { x: 34, duration: 0.5, ease: 'power2.out' }, 0)
      .to(cover, { scaleX: 0.001, duration: 0.26, ease: 'power1.in' }, 0)
      .set(cover, { opacity: 0 })
      .set(inside, { opacity: 1 })
      .to(inside, { scaleX: -1, duration: 0.36, ease: 'power2.out' })
      .to({}, HOLD(1.1))
      .to(inside, { scaleX: 0.001, duration: 0.3, ease: 'power1.in' })
      .set(inside, { opacity: 0 })
      .set(cover, { opacity: 1 })
      .to(cover, { scaleX: 1, duration: 0.32, ease: 'power2.out' })
      .to(book, { x: 0, duration: 0.45, ease: 'power2.inOut' }, '<');
  },

  /* L'enveloppe s'ouvre : le sceau saute, le rabat se retourne, la lettre sort. */
  letter(root) {
    const flap = root.querySelector('.env-flap');
    const flapOpen = root.querySelector('.env-flap-open');
    const paper = root.querySelector('.env-paper');
    const seal = root.querySelector('.env-seal');
    gsap.set([flap, flapOpen], { svgOrigin: '100 70' });
    gsap.set(seal, { svgOrigin: '100 120' });

    return gsap
      .timeline()
      .to(seal, { y: 12, rotation: 22, opacity: 0, duration: 0.28, ease: 'power2.in' }, 0)
      .to(flap, { scaleY: 0.001, duration: 0.24, ease: 'power1.in' }, 0.12)
      .set(flap, { opacity: 0 })
      .set(flapOpen, { opacity: 1, scaleY: 0.001 })
      .to(flapOpen, { scaleY: 1, duration: 0.3, ease: 'power2.out' })
      .to(paper, { y: -40, duration: 0.6, ease: 'back.out(1.6)' }, '-=0.1')
      .to({}, HOLD(1.2))
      .to(paper, { y: 0, duration: 0.45, ease: 'power2.inOut' })
      .to(flapOpen, { scaleY: 0.001, duration: 0.25, ease: 'power1.in' }, '-=0.15')
      .set(flapOpen, { opacity: 0 })
      .set(flap, { opacity: 1, scaleY: 0.001 })
      .to(flap, { scaleY: 1, duration: 0.28, ease: 'power2.out' })
      .set(seal, { y: 0, rotation: 0 })
      .to(seal, { opacity: 1, duration: 0.25 });
  },

  /* Le bouquet se balance, les fleurs tournent, des pétales tombent. */
  flowers(root) {
    const bouquet = root.querySelector('.fl-bouquet');
    const spins = root.querySelectorAll('.spin');
    const fall = root.querySelectorAll('.petal-fall');
    gsap.set(bouquet, { svgOrigin: '100 152' });

    const tl = gsap
      .timeline()
      .to(bouquet, { rotation: 5, duration: 0.25, ease: 'sine.inOut' }, 0)
      .to(bouquet, { rotation: -4, duration: 0.3, ease: 'sine.inOut' })
      .to(bouquet, { rotation: 0, duration: 1.1, ease: 'elastic.out(1,.35)' })
      .to(spins, { rotation: 24, duration: 0.5, ease: 'power2.out', stagger: 0.08 }, 0)
      .to(spins, { rotation: 0, duration: 0.9, ease: 'elastic.out(1,.4)', stagger: 0.08 }, 0.55);

    fall.forEach((p, i) => {
      const dir = i % 2 ? 1 : -1;
      tl.set(p, { x: 0, y: 0, rotation: 0, opacity: 0 }, 0.1 + i * 0.12)
        .to(p, { opacity: 1, duration: 0.1 }, 0.12 + i * 0.12)
        .to(p, { y: 96 + i * 6, x: dir * (10 + i * 7), rotation: dir * 140, duration: 1.4, ease: 'sine.in' }, 0.12 + i * 0.12)
        .to(p, { opacity: 0, duration: 0.35 }, 1.0 + i * 0.12)
        .set(p, { x: 0, y: 0, rotation: 0 });
    });
    return tl;
  },

  /* Le pendentif se balance et scintille. */
  jewel(root) {
    const pendant = root.querySelector('.pendant');
    const sparks = root.querySelectorAll('.spark');
    gsap.set(pendant, { svgOrigin: '100 88' });

    return gsap
      .timeline()
      .to(pendant, { rotation: 8, duration: 0.3, ease: 'sine.inOut' }, 0)
      .to(pendant, { rotation: 0, duration: 1.5, ease: 'elastic.out(1,.25)' })
      .fromTo(
        sparks,
        { scale: 0, rotation: -30, opacity: 0 },
        { scale: 1, rotation: 0, opacity: 1, duration: 0.35, ease: 'back.out(2.5)', stagger: 0.12 },
        0
      )
      .to(sparks, { scale: 0, rotation: 40, opacity: 0, duration: 0.4, ease: 'power2.in', stagger: 0.12 }, 0.7);
  },

  /* Le doudou rebondit (écrasé / étiré), agite les bras et les oreilles. */
  plush(root) {
    const wrap = root.closest('.obj__react');
    const armL = root.querySelector('.pl-arm-l');
    const armR = root.querySelector('.pl-arm-r');
    const earL = root.querySelector('.pl-ear-l');
    const earR = root.querySelector('.pl-ear-r');
    const head = root.querySelector('.pl-head');
    gsap.set(wrap, { transformOrigin: '50% 100%' });
    gsap.set(armL, { svgOrigin: '68 112' });
    gsap.set(armR, { svgOrigin: '132 112' });
    gsap.set(earL, { svgOrigin: '72 56' });
    gsap.set(earR, { svgOrigin: '128 56' });
    gsap.set(head, { svgOrigin: '100 108' });

    return gsap
      .timeline()
      .to(wrap, { scaleX: 1.08, scaleY: 0.9, duration: 0.14, ease: 'power1.out' })
      .to(wrap, { y: -34, scaleX: 0.95, scaleY: 1.08, duration: 0.28, ease: 'power2.out' })
      .to(wrap, { y: 0, scaleX: 1.06, scaleY: 0.92, duration: 0.22, ease: 'power2.in' })
      .to(wrap, { scaleX: 1, scaleY: 1, duration: 0.7, ease: 'elastic.out(1,.35)' })
      .to(armL, { rotation: 26, duration: 0.18, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 0.15)
      .to(armR, { rotation: -26, duration: 0.18, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 0.15)
      .to(earL, { rotation: -14, duration: 0.16, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 0.2)
      .to(earR, { rotation: 14, duration: 0.16, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 0.2)
      .to(head, { rotation: 5, duration: 0.3, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 0.2);
  },

  /* Le tiroir coulisse vers l'avant et laisse dépasser des papiers. */
  drawer(root) {
    const front = root.querySelector('.dr-front');
    const papers = root.querySelector('.dr-papers');

    return gsap
      .timeline()
      .to(front, { y: 32, duration: 0.5, ease: 'power3.out' }, 0)
      .to(papers, { y: -30, duration: 0.6, ease: 'back.out(1.5)' }, 0.1)
      .to({}, HOLD(1.1))
      .to(papers, { y: 0, duration: 0.4, ease: 'power2.inOut' })
      .to(front, { y: 0, duration: 0.5, ease: 'power3.inOut' }, '<0.1');
  },

  /* Un éclat de lumière traverse la glace, le miroir oscille, ça scintille. */
  mirror(root) {
    const all = root.querySelector('.mir-all');
    const glint = root.querySelector('.mir-glint');
    const sparks = root.querySelectorAll('.spark');
    gsap.set(all, { svgOrigin: '100 188' });

    return gsap
      .timeline()
      .to(all, { rotation: 3, duration: 0.3, ease: 'sine.inOut' }, 0)
      .to(all, { rotation: 0, duration: 1.3, ease: 'elastic.out(1,.3)' })
      .to(glint, { x: 120, duration: 0.8, ease: 'power2.inOut' }, 0)
      .set(glint, { x: -90 })
      .to(glint, { x: 0, duration: 0.6, ease: 'power2.out' })
      .fromTo(
        sparks,
        { scale: 0, rotation: -30, opacity: 0 },
        { scale: 1, rotation: 0, opacity: 1, duration: 0.35, ease: 'back.out(2.5)', stagger: 0.1 },
        0.1
      )
      .to(sparks, { scale: 0, rotation: 40, opacity: 0, duration: 0.4, ease: 'power2.in', stagger: 0.1 }, 0.8);
  },
};

/**
 * Joue la réaction d'un objet (bouton .obj). Ignore l'appel si l'objet est déjà
 * en train de réagir, ou si la personne préfère moins d'animations.
 */
export function react(objEl) {
  if (!window.gsap || reducedMotion || objEl._busy) return;
  const root = objEl.querySelector('svg');
  const fn = reactions[objEl.dataset.type];
  if (!root || !fn) return;

  objEl._busy = true;
  try {
    fn(root).eventCallback('onComplete', () => {
      objEl._busy = false;
    });
  } catch (err) {
    console.warn('Réaction impossible pour', objEl.dataset.type, err);
    objEl._busy = false;
  }

  // Petite gerbe d'étincelles, seulement si l'objet est visible à l'écran.
  const r = objEl.getBoundingClientRect();
  if (r.bottom > 0 && r.top < innerHeight) {
    burst(r.left + r.width / 2, r.top + r.height * 0.38, { count: 5, kinds: ['sparkle', 'heart'], spread: 80 });
  }
}
