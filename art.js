/* =====================================================================
 *  art.js — Les petites illustrations SVG du carnet
 *
 *  Chaque objet est un SVG autonome (viewBox 200×200). Les classes
 *  (.book-cover, .env-flap, .dr-front, .pl-arm-l …) servent de « poignées »
 *  à reactions.js pour animer chaque pièce séparément.
 *
 *  Pour ajouter un objet : crée une entrée ici, une réaction du même nom
 *  dans reactions.js, puis utilise ce "type" dans content.json.
 * ===================================================================== */

const INK = '#4a3a35';

/** Enveloppe commune : le trait d'encre est défini en CSS (.art .ink). */
const svg = (inner) =>
  `<svg class="art" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${inner}</svg>`;

/* Étincelle à 4 branches, centrée sur (0,0) pour pivoter proprement */
const SPARK = 'M0 -9 Q1.3 -1.3 9 0 Q1.3 1.3 0 9 Q-1.3 1.3 -9 0 Q-1.3 -1.3 0 -9Z';
const spark = (x, y, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><path class="spark" d="${SPARK}" fill="#f7e7a1" stroke="${INK}" stroke-width="1.1" opacity="0"/></g>`;

/* n pétales ellipses disposés autour de (0,0) */
const petals = (n, rx, ry, cy, fill) =>
  Array.from(
    { length: n },
    (_, i) => `<ellipse cx="0" cy="${-cy}" rx="${rx}" ry="${ry}" transform="rotate(${(i * 360) / n})" fill="${fill}"/>`
  ).join('');

/* perles régulièrement réparties sur une ellipse (cadre du miroir) */
const pearls = (cx, cy, rx, ry, n) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return `<circle cx="${(cx + Math.cos(a) * rx).toFixed(1)}" cy="${(cy + Math.sin(a) * ry).toFixed(1)}" r="2.3" fill="#fffaf0"/>`;
  }).join('');

export const ART = {
  /* ───────────────────────── LIVRE ───────────────────────── */
  book: svg(`
    <g class="book">
      <g class="ink">
        <rect x="64" y="46" width="90" height="118" rx="3" fill="#fffaf0"/>
        <path d="M66 158h86M66 162h86" fill="none" stroke-width="1" opacity=".45"/>
        <path d="M80 72h54M80 84h44M80 96h50M80 108h34" fill="none" stroke="#dd9aa3" stroke-width="1.3"/>
        <path d="M124 126c-5-8-16-2-10 6l10 9 10-9c6-8-5-14-10-6z" fill="#f1c9cc"/>
        <path d="M130 160h10v28l-5-6-5 6z" fill="#ecd06f"/>

        <!-- face intérieure de la couverture (révélée à l'ouverture) -->
        <g class="book-cover-in" opacity="0">
          <rect x="58" y="40" width="96" height="124" rx="4" fill="#fbf0e0"/>
          <rect x="66" y="48" width="80" height="108" rx="2" fill="none" stroke="#dd9aa3" stroke-width="1" stroke-dasharray="3 3"/>
          <path d="M84 100h44M84 112h30" fill="none" stroke="#dd9aa3" stroke-width="1.2"/>
        </g>

        <!-- couverture -->
        <g class="book-cover">
          <rect x="58" y="40" width="96" height="124" rx="4" fill="#f1c9cc"/>
          <rect x="58" y="40" width="11" height="124" rx="3" fill="#dd9aa3"/>
          <rect x="80" y="60" width="62" height="42" rx="2" fill="#fffaf0"/>
          <text x="111" y="85" text-anchor="middle" font-size="17" font-style="italic" fill="${INK}" stroke="none">nos pages</text>
          <path d="M101 92h20" fill="none" stroke-width="1"/>
          <path d="M111 126c-5-8-15-2-10 5l10 9 10-9c5-7-5-13-10-5z" fill="#fffaf0"/>
          <circle cx="84" cy="152" r="2" fill="#fffaf0" stroke="none"/>
          <circle cx="92" cy="152" r="2" fill="#fffaf0" stroke="none"/>
          <circle cx="100" cy="152" r="2" fill="#fffaf0" stroke="none"/>
        </g>
      </g>
    </g>`),

  /* ───────────────────── LETTRE CACHETÉE ───────────────────── */
  letter: svg(`
    <g class="ink">
      <rect x="30" y="70" width="140" height="96" rx="5" fill="#efcfbf"/>
      <path class="env-flap-open" d="M30 70L100 22L170 70Z" fill="#e9b9bb" opacity="0"/>
      <g class="env-paper">
        <rect x="46" y="50" width="108" height="100" rx="3" fill="#fffdf6"/>
        <path d="M60 72h80M60 84h80M60 96h52" fill="none" stroke="#dd9aa3" stroke-width="1.2"/>
        <path d="M132 118c-4-7-13-2-9 5l9 8 9-8c4-7-5-12-9-5z" fill="#f1c9cc"/>
      </g>
      <path d="M30 70L100 122L30 166Z" fill="#f8e6da"/>
      <path d="M170 70L100 122L170 166Z" fill="#f8e6da"/>
      <path d="M30 166L100 112L170 166Z" fill="#fbefe5"/>
      <path class="env-flap" d="M30 70L100 122L170 70Z" fill="#f1c9cc"/>
      <g class="env-seal">
        <circle cx="100" cy="120" r="13" fill="#dd9aa3"/>
        <path d="M100 128c-7-4-9-9-5-12 2-2 4-1 5 1 1-2 3-3 5-1 4 3 2 8-5 12z" fill="#fff5f5" stroke="none"/>
      </g>
    </g>`),

  /* ───────────────────────── FLEURS ───────────────────────── */
  flowers: svg(`
    <g class="ink">
      <g class="fl-bouquet">
        <path d="M100 152C98 126 74 104 70 70" fill="none" stroke="#8fae7e" stroke-width="2.4"/>
        <path d="M100 152C100 122 100 92 100 56" fill="none" stroke="#8fae7e" stroke-width="2.4"/>
        <path d="M100 152C104 126 128 106 132 76" fill="none" stroke="#8fae7e" stroke-width="2.4"/>
        <path d="M88 126q-18-2-22-18q18 0 22 18z" fill="#b9ceaa"/>
        <path d="M112 120q18-2 22-18q-18 0-22 18z" fill="#b9ceaa"/>

        <g class="bloom" transform="translate(70 64)">
          <g class="spin">${petals(6, 7, 11, 11, '#f1c9cc')}</g>
          <circle r="5.5" fill="#ecd06f"/>
        </g>
        <g class="bloom" transform="translate(100 46)">
          <g class="spin">${petals(10, 4, 10, 12, '#fffaf0')}</g>
          <circle r="6" fill="#ecd06f"/>
        </g>
        <g class="bloom" transform="translate(132 72)">
          <g class="spin">${petals(5, 8, 8, 9, '#f7e7a1')}</g>
          <circle r="4.5" fill="#dd9aa3"/>
        </g>
      </g>

      <!-- pétales qui tombent à la réaction -->
      <g transform="translate(70 62)"><ellipse class="petal-fall" rx="4" ry="7" fill="#f1c9cc" opacity="0"/></g>
      <g transform="translate(100 46)"><ellipse class="petal-fall" rx="3.5" ry="7" fill="#fffaf0" opacity="0"/></g>
      <g transform="translate(132 72)"><ellipse class="petal-fall" rx="5" ry="5" fill="#f7e7a1" opacity="0"/></g>
      <g transform="translate(84 70)"><ellipse class="petal-fall" rx="4" ry="6" fill="#f1c9cc" opacity="0"/></g>

      <!-- pot en verre -->
      <path d="M76 128h48v6c10 8 14 20 12 34-1 8-7 12-15 12H79c-8 0-14-4-15-12-2-14 2-26 12-34z" fill="rgba(255,255,255,.55)"/>
      <path d="M65 152c-1.5 6-1.5 11-1 16 1 8 7 12 15 12h42c8 0 14-4 15-12 .5-5 .5-10-1-16z" fill="rgba(188,214,226,.45)" stroke="none"/>
      <path d="M72 140q-3 14 0 24" fill="none" stroke="#fff" stroke-width="2.4" opacity=".8" stroke-linecap="round"/>
      <!-- petit nœud -->
      <path d="M100 131L86 124V138Z" fill="#dd9aa3"/>
      <path d="M100 131L114 124V138Z" fill="#dd9aa3"/>
      <circle cx="100" cy="131" r="4" fill="#c9808a"/>
    </g>`),

  /* ───────────────────────── BIJOU ───────────────────────── */
  jewel: svg(`
    <g class="ink">
      <path d="M30 36Q100 140 170 36" fill="none" stroke="#ecd06f" stroke-width="1.2"/>
      <path class="chain" d="M30 36Q100 140 170 36" fill="none" stroke="#e0bc55" stroke-width="3.4" stroke-dasharray="0.1 6.5"/>
      <g class="pendant">
        <circle cx="100" cy="95" r="5.5" fill="none" stroke="#e0bc55" stroke-width="2.2"/>
        <path d="M82 108H118L130 121L100 156L70 121Z" fill="#f1c9cc"/>
        <path d="M90 121L100 108L110 121Z" fill="#fff5f5" stroke-width="1.1"/>
        <path d="M70 121H130M82 108L90 121L100 156M118 108L110 121L100 156" fill="none" stroke-width="1.1"/>
        <path d="M76 123L88 123L96 146Z" fill="#f9dfe1" stroke="none"/>
      </g>
    </g>
    ${spark(132, 90, 1)}${spark(62, 116, 0.8)}${spark(142, 140, 0.9)}${spark(58, 66, 0.7)}`),

  /* ───────────────────────── DOUDOU ───────────────────────── */
  plush: svg(`
    <g class="ink">
      <g class="pl-ear-l"><circle cx="68" cy="44" r="15" fill="#f7e7a1"/><circle cx="68" cy="44" r="7" fill="#f1c9cc" stroke="none"/></g>
      <g class="pl-ear-r"><circle cx="132" cy="44" r="15" fill="#f7e7a1"/><circle cx="132" cy="44" r="7" fill="#f1c9cc" stroke="none"/></g>
      <ellipse cx="72" cy="168" rx="19" ry="14" fill="#f7e7a1"/>
      <ellipse cx="128" cy="168" rx="19" ry="14" fill="#f7e7a1"/>
      <ellipse cx="72" cy="171" rx="8" ry="6" fill="#f1c9cc" stroke="none"/>
      <ellipse cx="128" cy="171" rx="8" ry="6" fill="#f1c9cc" stroke="none"/>
      <ellipse cx="100" cy="136" rx="40" ry="42" fill="#f7e7a1"/>
      <ellipse cx="100" cy="142" rx="24" ry="27" fill="#fff6dc" stroke="none"/>
      <g class="pl-arm-l"><ellipse cx="60" cy="130" rx="12" ry="22" transform="rotate(22 60 130)" fill="#f7e7a1"/></g>
      <g class="pl-arm-r"><ellipse cx="140" cy="130" rx="12" ry="22" transform="rotate(-22 140 130)" fill="#f7e7a1"/></g>
      <g class="pl-head">
        <circle cx="100" cy="74" r="37" fill="#f7e7a1"/>
        <path d="M112 48q12-4 16 6q2 12-9 14q-12 0-7-20z" fill="#f1c9cc" stroke-width="1.2" stroke-dasharray="2.5 2.5"/>
        <ellipse cx="100" cy="86" rx="17" ry="13" fill="#fff6dc"/>
        <ellipse cx="100" cy="80" rx="6" ry="4.2" fill="${INK}"/>
        <path d="M100 84v5M100 89q-5 5-10 1M100 89q5 5 10 1" fill="none" stroke-width="1.4"/>
        <circle cx="84" cy="70" r="3.2" fill="${INK}" stroke="none"/>
        <circle cx="116" cy="70" r="3.2" fill="${INK}" stroke="none"/>
        <circle cx="76" cy="84" r="6" fill="#f1c9cc" stroke="none" opacity=".75"/>
        <circle cx="124" cy="84" r="6" fill="#f1c9cc" stroke="none" opacity=".75"/>
      </g>
      <g class="pl-bow">
        <path d="M100 112L80 102V122Z" fill="#dd9aa3"/>
        <path d="M100 112L120 102V122Z" fill="#dd9aa3"/>
        <circle cx="100" cy="112" r="5" fill="#c9808a"/>
      </g>
    </g>`),

  /* ───────────────────────── TIROIR ───────────────────────── */
  drawer: svg(`
    <g class="ink">
      <rect x="44" y="168" width="12" height="14" rx="2" fill="#d9c3a0"/>
      <rect x="144" y="168" width="12" height="14" rx="2" fill="#d9c3a0"/>
      <rect x="30" y="44" width="140" height="128" rx="6" fill="#ead9bc"/>
      <rect x="42" y="56" width="116" height="52" rx="3" fill="#c9b184"/>

      <!-- souvenirs cachés dans le tiroir -->
      <g class="dr-papers">
        <g transform="rotate(-8 72 84)">
          <rect x="56" y="62" width="34" height="42" fill="#fffdf8"/>
          <rect x="60" y="66" width="26" height="25" fill="#f1c9cc" stroke="none"/>
        </g>
        <g transform="rotate(6 112 82)">
          <rect x="94" y="58" width="36" height="46" fill="#fffdf8"/>
          <rect x="98" y="62" width="28" height="28" fill="#f7e7a1" stroke="none"/>
        </g>
        <path d="M136 100c4-16 14-18 20-8" fill="none" stroke="#dd9aa3" stroke-width="2.4"/>
      </g>

      <!-- façade du tiroir du haut (coulisse vers l'avant) -->
      <g class="dr-front">
        <rect x="40" y="58" width="120" height="50" rx="4" fill="#f6e8cf"/>
        <rect x="47" y="65" width="106" height="36" rx="2" fill="none" stroke-width="1" stroke-dasharray="3 3" opacity=".55"/>
        <rect x="86" y="68" width="28" height="9" rx="1" fill="#fffaf0" stroke-width="1"/>
        <circle cx="100" cy="88" r="5.5" fill="#dd9aa3"/>
      </g>

      <!-- tiroir du bas -->
      <rect x="40" y="114" width="120" height="50" rx="4" fill="#f6e8cf"/>
      <rect x="47" y="121" width="106" height="36" rx="2" fill="none" stroke-width="1" stroke-dasharray="3 3" opacity=".55"/>
      <circle cx="100" cy="140" r="5.5" fill="#dd9aa3"/>
    </g>`),

  /* ───────────────────────── MIROIR ───────────────────────── */
  mirror: svg(`
    <defs>
      <linearGradient id="mirGlass" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fdf6ee"/>
        <stop offset=".55" stop-color="#e6eff2"/>
        <stop offset="1" stop-color="#f6dfe0"/>
      </linearGradient>
      <clipPath id="mirClip"><ellipse cx="100" cy="90" rx="46" ry="62"/></clipPath>
    </defs>
    <g class="ink">
      <g class="mir-all">
        <path d="M70 150L54 188M130 150L146 188" fill="none" stroke-width="3.2"/>
        <ellipse cx="100" cy="90" rx="58" ry="74" fill="#f7e7a1"/>
        ${pearls(100, 90, 52, 68, 18)}
        <ellipse cx="100" cy="90" rx="46" ry="62" fill="url(#mirGlass)"/>
        <g clip-path="url(#mirClip)" stroke="none">
          <path d="M70 128q10-26 30-20 22 6 30 26-20 14-60-6z" fill="#f1c9cc" opacity=".35"/>
          <g class="mir-glint">
            <polygon points="58,24 80,24 50,160 28,160" fill="#fff" opacity=".7"/>
            <polygon points="88,24 96,24 66,160 58,160" fill="#fff" opacity=".55"/>
          </g>
        </g>
        <path d="M100 22c-5-7-14-2-9 5l9 8 9-8c5-7-4-12-9-5z" fill="#f1c9cc"/>
      </g>
    </g>
    ${spark(32, 44, 1)}${spark(170, 62, 0.9)}${spark(164, 150, 0.8)}${spark(40, 138, 0.7)}`),
};
