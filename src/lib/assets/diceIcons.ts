import type { DiceIconName, DiceTheme } from './diceThemes';

export interface IconRenderOptions {
  /** 图标主色，默认 theme.pip */
  color?: string;
  /** 大号（hidden / devil 面） */
  large?: boolean;
}

/**
 * 返回居中于 (64,64) 的 SVG 片段（不含外层 transform 包装时可自行包 g）
 */
export function renderIcon(icon: DiceIconName, theme: DiceTheme, opts: IconRenderOptions = {}): string {
  const color = opts.color ?? theme.pip;
  const s = opts.large ? 1.35 : 1;
  const g = `transform="translate(64 64) scale(${s})"`;

  switch (icon) {
    case 'crown':
      return `<g ${g} fill="${color}"><path d="M-18 12 L-14-8 L-5 0 L0-12 L5 0 L14-8 L18 12 Z"/><rect x="-18" y="12" width="36" height="6" rx="2"/></g>`;
    case 'clover':
      return `<g ${g} fill="${color}"><circle cx="-8" cy="-4" r="7"/><circle cx="8" cy="-4" r="7"/><circle cx="0" cy="8" r="7"/><circle cx="0" cy="-10" r="5" fill="${theme.fill}"/></g>`;
    case 'devil':
      return `<g ${g} fill="${color}"><path d="M-16-6 Q-20-18 -8-14 Q0-22 8-14 Q20-18 16-6 Q18 8 0 14 Q-18 8 -16-6 Z"/><circle cx="-6" cy="2" r="3" fill="${theme.fill}"/><circle cx="6" cy="2" r="3" fill="${theme.fill}"/></g>`;
    case 'halo':
      return `<g ${g} fill="none" stroke="${color}" stroke-width="3"><ellipse cx="0" cy="-8" rx="22" ry="8"/><circle cx="0" cy="6" r="12" fill="${color}" opacity="0.25"/></g>`;
    case 'cross':
      return `<g ${g} fill="${color}"><rect x="-3" y="-18" width="6" height="36" rx="1"/><rect x="-14" y="-6" width="28" height="6" rx="1"/></g>`;
    case 'king':
      return `<g ${g} fill="${color}"><path d="M-14 14 L-10-10 L0 2 L10-10 L14 14 Z"/><circle cx="0" cy="-12" r="5"/><rect x="-14" y="14" width="28" height="5" rx="1"/></g>`;
    case 'tooth':
      return `<g ${g} fill="${color}"><path d="M-10 14 Q-14-4 -6-10 Q0-16 6-10 Q14-4 10 14 Q4 18 0 16 Q-4 18 -10 14 Z"/></g>`;
    case 'horse':
      return `<g ${g} fill="${color}"><path d="M-18 12 L-12-6 L-4-10 L6-4 L14 2 L10 12 L-6 14 Z"/><circle cx="8" cy="-6" r="3" fill="${theme.fill}"/></g>`;
    case 'wheel':
      return `<g ${g} fill="none" stroke="${color}" stroke-width="3"><circle cx="0" cy="0" r="16"/><line x1="0" y1="-16" x2="0" y2="16"/><line x1="-16" y1="0" x2="16" y2="0"/></g>`;
    case 'skull':
      return `<g ${g} fill="${color}"><ellipse cx="0" cy="-2" rx="14" ry="12"/><rect x="-10" y="8" width="20" height="8" rx="3"/><circle cx="-5" cy="-2" r="3" fill="${theme.fill}"/><circle cx="5" cy="-2" r="3" fill="${theme.fill}"/></g>`;
    case 'star':
      return `<g ${g} fill="${color}"><path d="M0-16 L4-4 L16-4 L6 4 L10 16 L0 10 L-10 16 L-6 4 L-16-4 L-4-4 Z"/></g>`;
    case 'paint':
      return `<g ${g} fill="${color}"><ellipse cx="-6" cy="8" rx="10" ry="6"/><rect x="4" y="-14" width="6" height="22" rx="2"/><circle cx="7" cy="-16" r="4"/></g>`;
    case 'pie':
      return `<g ${g} fill="${color}"><path d="M0-14 A14 14 0 1 1 0 14 A14 14 0 0 1 0-14 Z M0-14 L0 0 L12 8 Z" fill-rule="evenodd"/></g>`;
    case 'book':
      return `<g ${g} fill="${color}"><rect x="-14" y="-12" width="28" height="24" rx="2"/><line x1="0" y1="-12" x2="0" y2="12" stroke="${theme.fill}" stroke-width="2"/></g>`;
    case 'coin':
      return `<g ${g} fill="${color}"><circle cx="0" cy="0" r="16"/><circle cx="0" cy="0" r="10" fill="none" stroke="${theme.fill}" stroke-width="2"/><text x="0" y="5" text-anchor="middle" font-size="12" fill="${theme.fill}" font-family="serif">G</text></g>`;
    case 'strip':
      return `<g ${g} fill="${color}"><path d="M-16-8 L16-8 L12 8 L-12 8 Z"/><line x1="-8" y1="-4" x2="8" y2="4" stroke="${theme.fill}" stroke-width="2"/></g>`;
    case 'scales':
      return `<g ${g} fill="none" stroke="${color}" stroke-width="2.5"><line x1="0" y1="-14" x2="0" y2="14"/><line x1="-16" y1="-6" x2="16" y2="-6"/><path d="M-16-6 L-20 6 L-12 6 Z"/><path d="M16-6 L12 6 L20 6 Z"/></g>`;
    case 'weight':
      return `<g ${g} fill="${color}"><path d="M-8 14 L-4-6 L4-6 L8 14 Z"/><rect x="-12" y="14" width="24" height="4" rx="1"/><line x1="0" y1="-14" x2="0" y2="-6" stroke="${color}" stroke-width="3"/></g>`;
    case 'arrowDown':
      return `<g ${g} fill="${color}"><path d="M0 14 L-12-2 L-4-2 L-4-14 L4-14 L4-2 L12-2 Z"/></g>`;
    case 'number3':
      return `<g ${g} fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"><text x="0" y="8" text-anchor="middle" font-size="32" font-weight="bold" fill="${color}" stroke="none" font-family="serif">3</text></g>`;
    default:
      return `<g ${g}><circle cx="0" cy="0" r="10" fill="${color}"/></g>`;
  }
}
