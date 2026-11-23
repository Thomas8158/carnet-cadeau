/* =====================================================================
 *  player.js — Médias : lecteur vidéo « maison » + intégrations
 *
 *  • Fichier vidéo (.mp4, .webm…)  → lecteur personnalisé aux couleurs du carnet
 *  • YouTube / Vimeo / Google Drive → intégration (iframe) propre
 *  • normalizeImage() convertit les liens de partage (Drive, Dropbox)
 *    en liens d'image directs.
 * ===================================================================== */

const ICON = {
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>',
  vol: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  mute: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  full: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

const fmt = (s) => (isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '0:00');

/* ───────────── Détection du type de lien ───────────── */

/** Identifiant d'un fichier Google Drive dans un lien de partage. */
const driveId = (url) => (url.match(/drive\.google\.com\/file\/d\/([\w-]+)/) || url.match(/[?&]id=([\w-]+)/) || [])[1];

/**
 * Analyse une adresse de vidéo.
 * @returns {{kind:'file'|'iframe', src:string}}
 */
export function parseVideo(url) {
  const u = String(url).trim();

  const yt = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([\w-]{6,})/);
  if (yt) return { kind: 'iframe', src: `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0&modestbranding=1&playsinline=1` };

  const vm = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return { kind: 'iframe', src: `https://player.vimeo.com/video/${vm[1]}?dnt=1` };

  if (/drive\.google\.com/.test(u) && driveId(u)) return { kind: 'iframe', src: `https://drive.google.com/file/d/${driveId(u)}/preview` };

  return { kind: 'file', src: u };
}

/** Convertit les liens de partage courants en liens d'image directs. */
export function normalizeImage(url) {
  const u = String(url).trim();
  const id = /drive\.google\.com/.test(u) && driveId(u);
  if (id) return `https://lh3.googleusercontent.com/d/${id}=w1600`;
  if (/dropbox\.com/.test(u)) return u.replace(/[?&]dl=0/, '').replace(/(\?|$)/, (m) => (m === '?' ? '?raw=1&' : '?raw=1'));
  return u;
}

/* ───────────── Intégration (iframe) ───────────── */

export function createEmbed(src) {
  const el = document.createElement('div');
  el.className = 'player player--embed';
  const frame = document.createElement('iframe');
  frame.src = src;
  frame.title = 'Vidéo du souvenir';
  frame.loading = 'lazy';
  frame.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
  frame.allowFullscreen = true;
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  el.append(frame);
  return { el, destroy: () => frame.removeAttribute('src') };
}

/* ───────────── Lecteur personnalisé ───────────── */

export function createVideo({ src, poster }) {
  const el = document.createElement('div');
  el.className = 'player';
  el.innerHTML = `
    <video class="player__video" playsinline preload="metadata"></video>
    <button type="button" class="player__big" aria-label="Lire la vidéo">${ICON.play}</button>
    <p class="player__err" hidden>Cette vidéo ne veut pas se lancer… ✿</p>
    <div class="player__bar">
      <button type="button" class="p-play" aria-label="Lecture / pause">${ICON.play}</button>
      <input class="p-seek" type="range" min="0" max="1000" value="0" step="1" aria-label="Position dans la vidéo">
      <span class="p-time">0:00</span>
      <button type="button" class="p-mute" aria-label="Couper ou remettre le son">${ICON.vol}</button>
      <button type="button" class="p-full" aria-label="Plein écran">${ICON.full}</button>
    </div>`;

  const $ = (s) => el.querySelector(s);
  const video = $('video');
  const big = $('.player__big');
  const playBtn = $('.p-play');
  const seek = $('.p-seek');
  const time = $('.p-time');
  const muteBtn = $('.p-mute');
  const fullBtn = $('.p-full');

  video.src = src;
  if (poster) video.poster = poster;

  /* lecture / pause */
  const toggle = () => (video.paused ? video.play().catch(() => el.classList.add('is-error')) : video.pause());
  big.addEventListener('click', toggle);
  playBtn.addEventListener('click', toggle);
  video.addEventListener('click', toggle);

  video.addEventListener('play', () => {
    el.classList.add('is-playing');
    playBtn.innerHTML = ICON.pause;
  });
  const onStop = () => {
    el.classList.remove('is-playing');
    playBtn.innerHTML = ICON.play;
  };
  video.addEventListener('pause', onStop);
  video.addEventListener('ended', onStop);

  /* progression */
  video.addEventListener('timeupdate', () => {
    if (!video.duration) return;
    const pct = (video.currentTime / video.duration) * 1000;
    seek.value = pct;
    seek.style.setProperty('--p', `${pct / 10}%`);
    time.textContent = fmt(video.currentTime);
  });
  seek.addEventListener('input', () => {
    if (video.duration) video.currentTime = (seek.value / 1000) * video.duration;
    seek.style.setProperty('--p', `${seek.value / 10}%`);
  });

  /* son */
  muteBtn.addEventListener('click', () => {
    video.muted = !video.muted;
    muteBtn.innerHTML = video.muted ? ICON.mute : ICON.vol;
  });

  /* plein écran (iOS utilise l'API de l'élément <video>) */
  fullBtn.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (el.requestFullscreen) el.requestFullscreen();
    else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
  });

  /* les commandes se cachent pendant la lecture, reviennent au mouvement */
  let hideTimer;
  const wake = () => {
    el.classList.add('is-active');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => el.classList.remove('is-active'), 2400);
  };
  el.addEventListener('pointermove', wake);
  el.addEventListener('pointerdown', wake);

  /* erreur de chargement */
  video.addEventListener('error', () => {
    $('.player__err').hidden = false;
    big.hidden = true;
  });

  return {
    el,
    destroy() {
      clearTimeout(hideTimer);
      video.pause();
      video.removeAttribute('src');
      video.load();
    },
  };
}
