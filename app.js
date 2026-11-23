/* =====================================================================
 *  app.js — Le chef d'orchestre du carnet
 *
 *  1. Configuration              6. Modale « souvenir »
 *  2. Outils (texte, stockage)   7. Routeur + transitions entre vues
 *  3. Chargement du contenu      8. Parallaxe, réactions « idle », toast
 *  4. Rendu des vues             9. Démarrage
 *  5. Nouveautés (badges)
 *
 *  Le DESIGN vit dans styles.css / art.js ; le CONTENU vit dans content.json.
 *  Ce fichier ne contient aucun texte à modifier.
 * ===================================================================== */

import { ART } from './art.js';
import { react } from './reactions.js';
import { createVideo, createEmbed, parseVideo, normalizeImage } from './player.js';
import { initClickParticles } from './fx.js';

/* ───────────────────────── 1. CONFIGURATION ───────────────────────── */
const CONFIG = {
  /**
   * D'où vient le contenu ? Par défaut le fichier content.json posé à côté du site.
   * Pour le mettre à jour sans toucher au site, tu peux pointer vers une URL
   * distante qui renvoie le même JSON (ex. un fichier « raw » sur GitHub).
   */
  contentUrl: 'content.json',
  storagePrefix: 'carnet:',
  idleReactionMs: [6500, 11500], // un objet « fait signe » de temps en temps
};

const VIEWS = ['table', 'lettres', 'pellicule'];
const hasGSAP = typeof window.gsap !== 'undefined';
const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const animate = hasGSAP && !prefersReduced;

const state = {
  content: null,
  memories: [],
  byId: new Map(),
  newIds: { memories: new Set(), letters: new Set() },
  current: null,
};

/* ───────────────────────── 2. OUTILS ───────────────────────── */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const rand = (a, b) => a + Math.random() * (b - a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Stockage local, jamais bloquant (navigation privée, quota…). */
const store = {
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem(CONFIG.storagePrefix + key);
      return v === null ? fallback : JSON.parse(v);
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(CONFIG.storagePrefix + key, JSON.stringify(value)); } catch { /* ignoré */ }
  },
};

/** Échappe le HTML : le contenu du JSON ne peut jamais injecter de code. */
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/**
 * Mini-langage pour les textes de content.json :
 *   *mot*            → italique
 *   ==mot==          → surligné jaune
 *   [[id|texte]]     → petite référence cliquable qui ouvre le souvenir « id »
 *   retour à la ligne → <br>
 */
function rich(s) {
  return esc(s)
    .replace(/\[\[([\w-]+)\|([^\]]+)\]\]/g, '<button type="button" class="ref" data-memory="$1">$2</button>')
    .replace(/==([^=]+)==/g, '<mark>$1</mark>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}
/** Paragraphes séparés par une ligne vide. */
const paragraphs = (s) =>
  String(s ?? '')
    .split(/\n{2,}/)
    .filter((p) => p.trim())
    .map((p) => `<p>${rich(p.trim())}</p>`)
    .join('');

/** Découpe un titre en mots pour l'apparition « masquée » (garde les <em>). */
function splitWords(el) {
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) return frag.append(' ');
          const w = document.createElement('span');
          const i = document.createElement('span');
          w.className = 'w';
          i.className = 'wi';
          i.textContent = part;
          w.append(i);
          frag.append(w);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1) walk(child);
    });
  };
  walk(el);
}

/** Image de remplacement (dégradé pastel + cœur) quand il n'y a pas de photo. */
const HEART_PATH = 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z';
const placeholderHtml = (i) => `<span class="ph ph--${i % 4}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${HEART_PATH}"/></svg></span>`;
function placeholderEl(i) {
  const t = document.createElement('template');
  t.innerHTML = placeholderHtml(i);
  return t.content.firstElementChild;
}

/* ───────────────────────── 3. CHARGEMENT DU CONTENU ───────────────────────── */

/**
 * Lit le contenu à chaque ouverture (jamais mis en cache par le navigateur).
 * Si le réseau échoue, on retombe sur la dernière version vue.
 */
async function loadContent() {
  const sep = CONFIG.contentUrl.includes('?') ? '&' : '?';
  try {
    const res = await fetch(`${CONFIG.contentUrl}${sep}_=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    store.set('content', data);
    return data;
  } catch (err) {
    const cached = store.get('content');
    if (cached) return cached;
    throw err;
  }
}

/** Valeurs par défaut + identifiants garantis. */
function prepare(data) {
  const memories = (data.memories || []).map((m, i) => ({ ...m, id: String(m.id || `souvenir-${i + 1}`) }));
  const letters = (data.letters || []).map((l, i) => ({ ...l, id: String(l.id || `lettre-${i + 1}`) }));
  return {
    site: data.site || {},
    sections: data.sections || {},
    objects: (data.objects || []).filter((o) => ART[o.type]),
    notes: data.notes || [],
    letters,
    memories,
  };
}

/* ───────────────────────── 4. RENDU DES VUES ───────────────────────── */

function renderTable() {
  const { site, objects, notes } = state.content;

  const objectsHtml = objects
    .map((o, i) => {
      const isNew = o.memory && state.newIds.memories.has(o.memory);
      return `
      <button type="button" class="obj" data-type="${esc(o.type)}" data-memory="${esc(o.memory || '')}"
              aria-label="${esc(o.label || o.type)}${o.memory ? ' — ouvrir le souvenir' : ''}">
        <span class="obj__plx" data-depth="${10 + (i % 4) * 7}">
          <span class="obj__float" style="--fd:${(6 + ((i * 1.3) % 3)).toFixed(1)}s; --fdelay:${(-i * 1.7).toFixed(1)}s">
            <span class="obj__react">${ART[o.type].replace('<svg class="art"', `<svg class="art" style="--bd:${(5 + (i % 3)).toFixed(1)}s"`)}</span>
            <span class="obj__label"><span class="tape tape--mini tape--rose"></span>${esc(o.label || '')}</span>
          </span>
        </span>
        ${isNew ? '<span class="sticker-new">nouveau</span>' : ''}
      </button>`;
    })
    .join('');

  const notesHtml = notes
    .slice(0, 3)
    .map((n, i) => {
      const cls = `scrap scrap--${i + 1} scrap--${esc(n.tone || (i === 1 ? 'rose' : 'yellow'))}`;
      const style = `style="--rot:${i % 2 ? 3 : -4}deg"`;
      const inner = `<span class="tape tape--mini"></span>${rich(n.text)}`;
      return n.memory
        ? `<button type="button" class="${cls}" ${style} data-memory="${esc(n.memory)}">${inner}</button>`
        : `<div class="${cls}" ${style}>${inner}</div>`;
    })
    .join('');

  $('#view-table').innerHTML = `
    <header class="mast">
      <div class="mast__meta">
        <span>${esc(site.eyebrow || '')}</span>
        <span>${esc(site.issue || '')}</span>
        <span>${esc(site.date || '')}</span>
      </div>
      <h1 class="mast__title">${rich(site.title || '')}</h1>
      <svg class="scribble" viewBox="0 0 300 18" preserveAspectRatio="none" aria-hidden="true">
        <path d="M3 11C50 3 90 15 140 8s100-6 157 3" pathLength="1"/>
      </svg>
      <p class="mast__sub">${rich(site.subtitle || '')}</p>
      <p class="mast__intro">${rich(site.intro || '')}</p>
    </header>

    <div class="table">
      ${objectsHtml}
      ${notesHtml}
      <p class="table__hint">${rich(site.hint || '')}</p>
    </div>

    <p class="foot">${rich(site.footer || '')}${site.updated ? `<small>mis à jour · ${esc(site.updated)}</small>` : ''}</p>`;

  splitWords($('.mast__title'));
}

function renderLetters() {
  const sec = state.content.sections.letters || {};
  const lettersHtml = state.content.letters
    .map((l, i) => {
      const tone = ['rose', 'yellow'].includes(l.tone) ? l.tone : 'cream';
      const tape = i % 2 ? 'tape--rose' : 'tape--stripe';
      const margin = (l.margin || []).map((m) => `<p class="annot">${rich(m)}</p>`).join('');
      return `
      <article class="letter letter--${tone}" id="lettre-${esc(l.id)}" data-reveal>
        <aside class="letter__margin">${margin}</aside>
        <div class="letter__paper">
          <span class="tape tape--top ${tape}"></span>
          ${state.newIds.letters.has(l.id) ? '<span class="sticker-new">nouveau</span>' : ''}
          <p class="letter__meta"><span>${esc(l.date || '')}</span><span>N° ${String(i + 1).padStart(2, '0')}</span></p>
          <h3 class="letter__title">${rich(l.title || '')}</h3>
          ${l.to ? `<p class="letter__to">${rich(l.to)}</p>` : ''}
          <div class="letter__body">${paragraphs(l.text)}</div>
          ${l.sign ? `<p class="letter__sign">${rich(l.sign)}</p>` : ''}
        </div>
      </article>`;
    })
    .join('');

  $('#view-lettres').innerHTML = `
    <header class="sec-head">
      <p class="kicker">${esc(sec.kicker || '')}</p>
      <h2>${rich(sec.title || 'Mots *&* Lettres')}</h2>
      <p class="deck">${rich(sec.deck || '')}</p>
    </header>
    <div class="letters">${lettersHtml}</div>
    <p class="foot">${rich(state.content.site.footer || '')}</p>`;
}

function renderFilm() {
  const sec = state.content.sections.film || {};
  const items = state.memories
    .map((m, i) => {
      const img = m.photo
        ? `<img src="${esc(normalizeImage(m.photo))}" alt="${esc(m.alt || m.title || '')}" loading="lazy" decoding="async">`
        : placeholderHtml(i);
      const isNew = state.newIds.memories.has(m.id);
      return `
      <li data-reveal>
        <button type="button" class="polaroid" data-memory="${esc(m.id)}" data-i="${i}" aria-label="Ouvrir : ${esc(m.title || '')}">
          <span class="tape tape--top ${i % 2 ? 'tape--rose' : ''}"></span>
          ${isNew ? '<span class="sticker-new">nouveau</span>' : ''}
          <span class="polaroid__img">${img}</span>
          <span class="polaroid__cap">${esc(m.caption || m.title || '')}</span>
          <span class="polaroid__date">${esc(m.date || '')}</span>
        </button>
      </li>`;
    })
    .join('');

  $('#view-pellicule').innerHTML = `
    <header class="sec-head">
      <p class="kicker">${esc(sec.kicker || '')}</p>
      <h2>${rich(sec.title || 'La *pellicule*')}</h2>
      <p class="deck">${rich(sec.deck || '')}</p>
    </header>
    <ul class="film">${items}</ul>
    <p class="foot">${rich(state.content.site.footer || '')}</p>`;

  // Si une photo ne charge pas : on remplace par l'image pastel, jamais d'icône cassée.
  $$('.polaroid__img img').forEach((img) =>
    img.addEventListener('error', () => img.replaceWith(placeholderEl(+img.closest('[data-i]').dataset.i)))
  );
}

/* ───────────────────────── 5. NOUVEAUTÉS ─────────────────────────
 * À chaque visite on mémorise les identifiants vus. Quand tu ajoutes un
 * souvenir ou une lettre dans content.json, la personne qui revient voit un
 * petit badge « nouveau » (et un point sur le menu) jusqu'à ouverture.     */
function trackNew(kind, ids) {
  const known = store.get(`known:${kind}`);
  let pending = store.get(`new:${kind}`, []);
  if (Array.isArray(known)) {
    const fresh = ids.filter((id) => !known.includes(id));
    pending = [...new Set([...pending, ...fresh])].filter((id) => ids.includes(id));
  } else {
    pending = []; // première visite : rien n'est « nouveau »
  }
  store.set(`known:${kind}`, ids);
  store.set(`new:${kind}`, pending);
  return new Set(pending);
}
function markSeen(kind, id) {
  const set = state.newIds[kind];
  if (!set.delete(id)) return;
  store.set(`new:${kind}`, [...set]);
  $$(`[data-memory="${CSS.escape(id)}"] .sticker-new`).forEach((n) => n.remove());
  updateDock(state.current);
}

/* ───────────────────────── 6. MODALE « SOUVENIR » ───────────────────────── */
const modalState = { origin: null, player: null, index: -1 };
const el = {}; // éléments de la modale, remplis au démarrage

function destroyPlayer() {
  modalState.player?.destroy();
  modalState.player = null;
}

/** Affiche la photo et/ou la vidéo ; si les deux existent, deux petits onglets. */
function mountMedia(mem, index) {
  destroyPlayer();
  el.media.replaceChildren();
  el.tabs.replaceChildren();
  el.tabs.onclick = null;

  const photo = mem.photo ? normalizeImage(mem.photo) : '';
  const video = mem.video ? parseVideo(mem.video) : null;

  const show = (kind) => {
    destroyPlayer();
    el.media.replaceChildren();
    if (kind === 'video' && video) {
      const poster = mem.poster ? normalizeImage(mem.poster) : photo;
      const p = video.kind === 'file' ? createVideo({ src: video.src, poster }) : createEmbed(video.src);
      modalState.player = p;
      el.media.append(p.el);
    } else if (photo) {
      const img = new Image();
      img.alt = mem.alt || mem.title || '';
      img.decoding = 'async';
      img.addEventListener('error', () => el.media.replaceChildren(placeholderEl(index)));
      img.src = photo;
      el.media.append(img);
    } else {
      el.media.append(placeholderEl(index));
    }
    $$('button', el.tabs).forEach((b) => b.setAttribute('aria-selected', String(b.dataset.kind === kind)));
  };

  if (photo && video) {
    el.tabs.innerHTML = '<button type="button" role="tab" data-kind="photo">Photo</button><button type="button" role="tab" data-kind="video">Vidéo</button>';
    el.tabs.onclick = (e) => {
      const b = e.target.closest('button');
      if (b) show(b.dataset.kind);
    };
  }
  show(!photo && video ? 'video' : 'photo');
}

function fillMemory(mem) {
  const index = state.memories.findIndex((m) => m.id === mem.id);
  modalState.index = index;
  el.date.textContent = mem.date || '';
  el.title.innerHTML = rich(mem.title || '');
  el.body.innerHTML = paragraphs(mem.text);
  el.sign.textContent = mem.sign || '';
  el.caption.textContent = mem.caption || '';
  el.count.textContent = `${index + 1} / ${state.memories.length}`;
  const multi = state.memories.length > 1;
  el.prev.hidden = el.next.hidden = !multi;
  mountMedia(mem, index);
  el.card.scrollTop = 0;
  markSeen('memories', mem.id);
}

function openMemory(id, origin) {
  const mem = state.byId.get(id);
  if (!mem) return;
  const alreadyOpen = !el.modal.hidden;
  if (alreadyOpen) return swapMemory(mem);

  modalState.origin = origin || null;
  fillMemory(mem);
  el.modal.hidden = false;
  document.body.classList.add('is-locked');
  el.close.focus({ preventScroll: true });

  if (!animate) return;
  const r = origin?.getBoundingClientRect();
  const dx = r ? r.left + r.width / 2 - innerWidth / 2 : 0;
  const dy = r ? r.top + r.height / 2 - innerHeight / 2 : 0;
  gsap.killTweensOf([el.card, el.backdrop, '.memory__polaroid', '.memory__text > *']);
  gsap
    .timeline()
    .fromTo(el.backdrop, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power1.out' }, 0)
    .fromTo(el.card, { x: dx * 0.6, y: dy * 0.6 + 30, scale: 0.55, rotation: -6, opacity: 0 }, { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, duration: 0.8, ease: 'expo.out' }, 0)
    .from('.memory__polaroid', { y: 26, opacity: 0, duration: 0.8, ease: 'back.out(1.4)' }, 0.12)
    .from('.memory__text > *', { y: 16, opacity: 0, duration: 0.6, ease: 'power2.out', stagger: 0.07 }, 0.25);
}

/** Souvenir déjà ouvert → on glisse vers le suivant (flèches, balayage, référence…). */
function swapMemory(mem, dir = 1) {
  const swap = () => fillMemory(mem);
  if (!animate) return swap();
  const targets = '.memory__polaroid, .memory__text';
  gsap
    .timeline()
    .to(targets, { x: -dir * 24, opacity: 0, duration: 0.2, ease: 'power1.in' })
    .add(swap)
    .fromTo(targets, { x: dir * 24, opacity: 0 }, { x: 0, opacity: 1, duration: 0.38, ease: 'power2.out' });
}

function stepMemory(dir) {
  const n = state.memories.length;
  if (n < 2 || modalState.index < 0) return;
  swapMemory(state.memories[(modalState.index + dir + n) % n], dir);
}

function closeMemory() {
  if (el.modal.hidden) return;
  const done = () => {
    el.modal.hidden = true;
    document.body.classList.remove('is-locked');
    destroyPlayer();
    if (hasGSAP) gsap.set([el.card, el.backdrop, '.memory__polaroid', '.memory__text', '.memory__text > *'], { clearProps: 'all' });
    modalState.origin?.focus?.({ preventScroll: true });
  };
  if (!animate) return done();
  gsap
    .timeline({ onComplete: done })
    .to(el.card, { scale: 0.92, y: 22, opacity: 0, duration: 0.28, ease: 'power2.in' }, 0)
    .to(el.backdrop, { opacity: 0, duration: 0.28 }, 0);
}

/** Garde le focus clavier à l'intérieur de la modale. */
function trapFocus(e) {
  if (e.key !== 'Tab') return;
  const items = $$('button:not([hidden]), [href], input, iframe', el.card).filter((n) => !n.disabled);
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

function bindModal() {
  Object.assign(el, {
    modal: $('#modal'), card: $('#memory'), backdrop: $('.modal__backdrop'), close: $('.memory__close'),
    media: $('#m-media'), tabs: $('#m-tabs'), caption: $('#m-caption'), date: $('#m-date'), title: $('#m-title'),
    body: $('#m-body'), sign: $('#m-sign'), prev: $('#m-prev'), next: $('#m-next'), count: $('#m-count'),
  });

  el.modal.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeMemory(); });
  el.prev.addEventListener('click', () => stepMemory(-1));
  el.next.addEventListener('click', () => stepMemory(1));

  document.addEventListener('keydown', (e) => {
    if (el.modal.hidden) return;
    if (e.key === 'Escape') closeMemory();
    else if (e.key === 'ArrowRight') stepMemory(1);
    else if (e.key === 'ArrowLeft') stepMemory(-1);
    else trapFocus(e);
  });

  // balayage horizontal sur mobile
  let sx = 0, sy = 0;
  el.card.addEventListener('touchstart', (e) => {
    if (e.target.closest('.player')) { sx = 0; return; }
    sx = e.touches[0].clientX; sy = e.touches[0].clientY;
  }, { passive: true });
  el.card.addEventListener('touchend', (e) => {
    if (!sx) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6) stepMemory(dx < 0 ? 1 : -1);
    sx = 0;
  }, { passive: true });
}

/* Un seul écouteur global : objets, petits papiers, polaroids et références. */
function bindClicks() {
  document.addEventListener('click', (e) => {
    const obj = e.target.closest('.obj');
    if (obj) {
      react(obj); // l'objet réagit…
      const id = obj.dataset.memory;
      if (id) setTimeout(() => openMemory(id, obj), animate ? 460 : 0); // …puis le souvenir s'ouvre
      return;
    }
    const ref = e.target.closest('[data-memory]');
    if (ref && ref.dataset.memory) openMemory(ref.dataset.memory, ref);
  });

  // survol à la souris / focus clavier : l'objet réagit sans ouvrir
  document.addEventListener('pointerenter', (e) => {
    const obj = e.target.closest?.('.obj');
    if (obj && e.pointerType === 'mouse') react(obj);
  }, true);
  document.addEventListener('focusin', (e) => {
    const obj = e.target.closest?.('.obj');
    if (obj && e.target.matches(':focus-visible')) react(obj);
  });
}

/* ───────────────────────── 7. ROUTEUR + TRANSITIONS ───────────────────────── */
let transitioning = false;
let queued = null;

function updateDock(name) {
  $$('.dock a').forEach((a) => {
    const active = a.dataset.view === name;
    if (active) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  const dot = (view, count) => { const d = $(`.dock a[data-view="${view}"] .dot`); if (d) d.hidden = !count; };
  dot('lettres', state.newIds.letters.size);
  dot('pellicule', state.newIds.memories.size);
}

/** Révèle les cartes au fil du défilement (IntersectionObserver + GSAP). */
function revealOnScroll(root) {
  const items = $$('[data-reveal]', root);
  if (!animate || !items.length || root.dataset.revealed || !('IntersectionObserver' in window)) return;
  root.dataset.revealed = '1';
  gsap.set(items, { opacity: 0, y: 44 });
  const io = new IntersectionObserver(
    (entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      gsap.to(en.target, { opacity: 1, y: 0, duration: 0.95, ease: 'power3.out' });
      io.unobserve(en.target);
    }),
    { rootMargin: '0px 0px -8% 0px', threshold: 0.06 }
  );
  items.forEach((n) => io.observe(n));
  // filet de sécurité : si l'observateur n'a rien déclenché, on montre tout.
  setTimeout(() => items.forEach((n) => { if (+gsap.getProperty(n, 'opacity') === 0 && n.getBoundingClientRect().top < innerHeight) gsap.to(n, { opacity: 1, y: 0, duration: 0.6 }); }), 2500);
}

/** Chorégraphie d'entrée de chaque vue. */
function enterView(name) {
  const root = $(`#view-${name}`);
  if (name === 'table') {
    initParallaxTargets();
    if (!animate) return;
    gsap
      .timeline()
      .from('.mast__meta', { opacity: 0, y: -10, duration: 0.6, ease: 'power2.out' })
      .from('.mast .wi', { yPercent: 115, duration: 1.05, ease: 'expo.out', stagger: 0.07 }, '-=0.3')
      .fromTo('.scribble path', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut' }, '-=0.7')
      .from('.mast__sub, .mast__intro', { opacity: 0, y: 14, duration: 0.8, stagger: 0.12, ease: 'power2.out' }, '-=0.9')
      .from('.obj__react', { y: 50, scale: 0.82, opacity: 0, duration: 1, ease: 'back.out(1.5)', stagger: 0.09 }, '-=0.7')
      .from('.obj__label, .scrap, .table__hint', { opacity: 0, duration: 0.7, stagger: 0.05 }, '-=0.7');
  } else {
    if (animate) gsap.from(`#view-${name} .sec-head > *`, { opacity: 0, y: 24, duration: 0.8, stagger: 0.1, ease: 'power3.out' });
    revealOnScroll(root);
  }
}

function go(name, { first = false } = {}) {
  if (!VIEWS.includes(name)) name = 'table';
  if (transitioning) { queued = name; return; }
  if (name === state.current) return;

  const prev = state.current && $(`#view-${state.current}`);
  const next = $(`#view-${name}`);
  const swap = () => {
    if (prev) prev.hidden = true;
    next.hidden = false;
    window.scrollTo(0, 0);
    state.current = name;
    updateDock(name);
  };

  if (first || !animate) { swap(); if (!first) enterView(name); return; }

  transitioning = true;
  const curtain = $('#curtain');
  gsap
    .timeline({
      onComplete: () => {
        transitioning = false;
        const q = queued; queued = null;
        if (q && q !== state.current) go(q);
      },
    })
    .set(curtain, { display: 'grid', yPercent: 100 })
    .to(curtain, { yPercent: 0, duration: 0.55, ease: 'power3.inOut' })
    .add(swap)
    .add(() => enterView(name), '+=0.1')
    .to(curtain, { yPercent: -100, duration: 0.62, ease: 'power3.inOut' }, '<')
    .set(curtain, { display: 'none' });
}

const routeFromHash = () => go(location.hash.replace('#', ''));

/* ───────────────────────── 8. PARALLAXE, « IDLE », TOAST ───────────────────────── */
let parallaxReady = false;
function initParallaxTargets() {
  if (parallaxReady || !hasGSAP || prefersReduced) return;
  parallaxReady = true;

  // décor : dérive lente au défilement
  const decos = $$('.deco').map((d) => ({ set: gsap.quickSetter(d, 'y', 'px'), speed: +d.dataset.speed || 0.1 }));
  addEventListener('scroll', () => { const y = scrollY; decos.forEach((d) => d.set(-y * d.speed)); }, { passive: true });

  // objets : léger décalage selon la souris (souris uniquement)
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const items = $$('.obj__plx').map((n) => ({
      x: gsap.quickTo(n, 'x', { duration: 0.9, ease: 'power3' }),
      y: gsap.quickTo(n, 'y', { duration: 0.9, ease: 'power3' }),
      d: +n.dataset.depth || 12,
    }));
    addEventListener('pointermove', (e) => {
      const nx = e.clientX / innerWidth - 0.5;
      const ny = e.clientY / innerHeight - 0.5;
      items.forEach((it) => { it.x(-nx * it.d); it.y(-ny * it.d); });
    }, { passive: true });
  }
}

/** De temps en temps, un objet « fait signe » tout seul (utile sur mobile). */
function scheduleIdle() {
  setTimeout(() => {
    if (state.current === 'table' && el.modal.hidden && !document.hidden) {
      const objs = $$('.obj');
      if (objs.length) react(objs[Math.floor(Math.random() * objs.length)]);
    }
    scheduleIdle();
  }, rand(...CONFIG.idleReactionMs));
}

function showToast(text) {
  if (!hasGSAP) return;
  const t = document.createElement('div');
  t.className = 'toast';
  t.setAttribute('role', 'status');
  t.textContent = text;
  document.body.append(t);
  gsap.timeline({ onComplete: () => t.remove() })
    .fromTo(t, { y: 24, opacity: 0, rotation: -3 }, { y: 0, opacity: 1, rotation: -2, duration: 0.7, ease: 'back.out(1.6)' })
    .to(t, { y: 10, opacity: 0, duration: 0.5, ease: 'power2.in' }, '+=3.6');
}

/* ───────────────────────── 9. DÉMARRAGE ───────────────────────── */
function hideLoader() {
  const l = $('#loader');
  if (!l) return;
  if (!animate) return l.remove();
  gsap.to(l, { opacity: 0, duration: 0.7, ease: 'power2.out', onComplete: () => l.remove() });
}

function showError() {
  $('#loader')?.remove();
  $('#app').innerHTML = `
    <div class="oops"><div>
      <h1>Le carnet n'a pas pu s'ouvrir</h1>
      <p>Je n'arrive pas à lire <code>content.json</code>. Vérifie ta connexion et réessaie dans un instant.</p>
      <p><small>Si tu ouvres <code>index.html</code> directement depuis ton ordinateur, le navigateur bloque la lecture du fichier : héberge le dossier en ligne, ou lance un petit serveur local (voir README).</small></p>
    </div></div>`;
}

async function boot() {
  let data;
  try {
    data = prepare(await loadContent());
  } catch (err) {
    console.error('Contenu illisible :', err);
    return showError();
  }

  state.content = data;
  state.memories = data.memories;
  state.byId = new Map(data.memories.map((m) => [m.id, m]));
  if (data.site.documentTitle) document.title = data.site.documentTitle;

  const hadVisit = store.get('known:memories') !== null;
  state.newIds.memories = trackNew('memories', data.memories.map((m) => m.id));
  state.newIds.letters = trackNew('letters', data.letters.map((l) => l.id));

  renderTable();
  renderLetters();
  renderFilm();

  bindModal();
  bindClicks();
  initClickParticles();
  addEventListener('hashchange', routeFromHash);

  go(location.hash.replace('#', ''), { first: true });

  // on attend les polices (max 1,4 s) pour que les titres n'« sautent » pas
  await Promise.race([document.fonts?.ready, sleep(1400)]);
  hideLoader();
  await sleep(animate ? 250 : 0);
  enterView(state.current);
  scheduleIdle();

  const fresh = state.newIds.memories.size + state.newIds.letters.size;
  if (hadVisit && fresh) setTimeout(() => showToast(fresh > 1 ? 'du nouveau dans le carnet ✿' : 'une nouveauté t\'attend ✿'), 1800);
}

boot();
