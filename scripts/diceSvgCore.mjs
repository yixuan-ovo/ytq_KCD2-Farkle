/** @typedef {{ fill: string; border: string; pip: string; icon: string }} DiceTheme */

const P = {
  c: [64, 64],
  tl: [36, 36],
  tr: [92, 36],
  bl: [36, 92],
  br: [92, 92],
  ml: [36, 64],
  mr: [92, 64],
};

const layouts = {
  1: ['c'],
  2: ['tl', 'br'],
  3: ['tl', 'c', 'br'],
  4: ['tl', 'tr', 'bl', 'br'],
  5: ['tl', 'tr', 'c', 'bl', 'br'],
  6: ['tl', 'ml', 'bl', 'tr', 'mr', 'br'],
};

/**
 * @param {string} icon
 * @param {DiceTheme} theme
 * @param {{ color?: string; large?: boolean }} [opts]
 */
export function renderIcon(icon, theme, opts = {}) {
  const color = opts.color ?? theme.pip;
  const s = opts.large ? 1.35 : 1;
  const g = `transform="translate(64 64) scale(${s})"`;

  const icons = {
    crown: `<g ${g} fill="${color}"><path d="M-18 12 L-14-8 L-5 0 L0-12 L5 0 L14-8 L18 12 Z"/><rect x="-18" y="12" width="36" height="6" rx="2"/></g>`,
    clover: `<g ${g} fill="${color}"><circle cx="-8" cy="-4" r="7"/><circle cx="8" cy="-4" r="7"/><circle cx="0" cy="8" r="7"/></g>`,
    devil: `<g ${g} fill="${color}"><path d="M-16-6 Q-20-18 -8-14 Q0-22 8-14 Q20-18 16-6 Q18 8 0 14 Q-18 8 -16-6 Z"/><circle cx="-6" cy="2" r="3" fill="${theme.fill}"/><circle cx="6" cy="2" r="3" fill="${theme.fill}"/></g>`,
    halo: `<g ${g} fill="none" stroke="${color}" stroke-width="3"><ellipse cx="0" cy="-8" rx="22" ry="8"/><circle cx="0" cy="6" r="12" fill="${color}" opacity="0.25"/></g>`,
    cross: `<g ${g} fill="${color}"><rect x="-3" y="-18" width="6" height="36" rx="1"/><rect x="-14" y="-6" width="28" height="6" rx="1"/></g>`,
    king: `<g ${g} fill="${color}"><path d="M-14 14 L-10-10 L0 2 L10-10 L14 14 Z"/><circle cx="0" cy="-12" r="5"/><rect x="-14" y="14" width="28" height="5" rx="1"/></g>`,
    tooth: `<g ${g} fill="${color}"><path d="M-10 14 Q-14-4 -6-10 Q0-16 6-10 Q14-4 10 14 Q4 18 0 16 Q-4 18 -10 14 Z"/></g>`,
    horse: `<g ${g} fill="${color}"><path d="M-18 12 L-12-6 L-4-10 L6-4 L14 2 L10 12 L-6 14 Z"/></g>`,
    wheel: `<g ${g} fill="none" stroke="${color}" stroke-width="3"><circle cx="0" cy="0" r="16"/><line x1="0" y1="-16" x2="0" y2="16"/><line x1="-16" y1="0" x2="16" y2="0"/></g>`,
    skull: `<g ${g} fill="${color}"><ellipse cx="0" cy="-2" rx="14" ry="12"/><rect x="-10" y="8" width="20" height="8" rx="3"/><circle cx="-5" cy="-2" r="3" fill="${theme.fill}"/><circle cx="5" cy="-2" r="3" fill="${theme.fill}"/></g>`,
    star: `<g ${g} fill="${color}"><path d="M0-16 L4-4 L16-4 L6 4 L10 16 L0 10 L-10 16 L-6 4 L-16-4 L-4-4 Z"/></g>`,
    paint: `<g ${g} fill="${color}"><ellipse cx="-6" cy="8" rx="10" ry="6"/><rect x="4" y="-14" width="6" height="22" rx="2"/><circle cx="7" cy="-16" r="4"/></g>`,
    pie: `<g ${g} fill="${color}"><path d="M0-14 A14 14 0 1 1 0 14 A14 14 0 0 1 0-14 Z M0-14 L0 0 L12 8 Z" fill-rule="evenodd"/></g>`,
    book: `<g ${g} fill="${color}"><rect x="-14" y="-12" width="28" height="24" rx="2"/><line x1="0" y1="-12" x2="0" y2="12" stroke="${theme.fill}" stroke-width="2"/></g>`,
    coin: `<g ${g} fill="${color}"><circle cx="0" cy="0" r="16"/><text x="0" y="5" text-anchor="middle" font-size="12" fill="${theme.fill}" font-family="serif">G</text></g>`,
    strip: `<g ${g} fill="${color}"><path d="M-16-8 L16-8 L12 8 L-12 8 Z"/></g>`,
    scales: `<g ${g} fill="none" stroke="${color}" stroke-width="2.5"><line x1="0" y1="-14" x2="0" y2="14"/><line x1="-16" y1="-6" x2="16" y2="-6"/><path d="M-16-6 L-20 6 L-12 6 Z"/><path d="M16-6 L12 6 L20 6 Z"/></g>`,
    weight: `<g ${g} fill="${color}"><path d="M-8 14 L-4-6 L4-6 L8 14 Z"/><rect x="-12" y="14" width="24" height="4" rx="1"/><line x1="0" y1="-14" x2="0" y2="-6" stroke="${color}" stroke-width="3"/></g>`,
    arrowDown: `<g ${g} fill="${color}"><path d="M0 14 L-12-2 L-4-2 L-4-14 L4-14 L4-2 L12-2 Z"/></g>`,
    number3: `<g ${g}><text x="0" y="8" text-anchor="middle" font-size="32" font-weight="bold" fill="${color}" font-family="serif">3</text></g>`,
  };

  return icons[icon] ?? `<g ${g}><circle cx="0" cy="0" r="10" fill="${color}"/></g>`;
}

function innerStroke(theme) {
  const c = theme.border;
  return `<rect x="18" y="18" width="92" height="92" rx="12" fill="none" stroke="${c}55" stroke-width="2"/>`;
}

function pipMarkup(theme, keys) {
  return keys.map((k) => `<circle cx="${P[k][0]}" cy="${P[k][1]}" r="8" fill="${theme.pip}"/>`).join('\n    ');
}

/**
 * @param {string} dieId
 * @param {DiceTheme} theme
 * @param {'hidden'|'devil'|number} face
 */
export function generateDiceSvg(dieId, theme, face) {
  const uid = `${dieId}_${face}`.replace(/[^a-zA-Z0-9_]/g, '_');
  const label =
    face === 'hidden' ? 'hidden' : face === 'devil' ? 'devil' : `dice face ${face}`;

  let body = '';
  const isDevilFace =
    dieId === 'DevilDie' && (face === 'devil' || face === 1);

  if (face === 'hidden') {
    body = renderIcon(theme.icon, theme, { large: true });
  } else if (isDevilFace || face === 'devil') {
    body = renderIcon('devil', theme, { large: true, color: theme.pip });
  } else if (typeof face === 'number' && layouts[face]) {
    body = pipMarkup(theme, layouts[face]);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="${label}">
  <rect x="6" y="6" width="116" height="116" rx="18" fill="${theme.fill}" stroke="${theme.border}" stroke-width="3"/>
  ${innerStroke(theme)}
  ${body}
</svg>
`;
}

/** @param {string} dieId */
export function facesForDie(dieId) {
  const faces = ['hidden', 1, 2, 3, 4, 5, 6, 'devil'];
  return faces;
}
