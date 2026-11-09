import { contrastRatio } from './matches.mjs';

/** Keep theme ink when readable; otherwise shift toward its strongest neutral endpoint. */
export function attributionInk(ink, paper) {
  if (contrastRatio(ink, paper) >= 4.8) return ink;
  const channels=ink.slice(1).match(/../g).map(value=>parseInt(value,16));
  const endpoint=contrastRatio('#000000',paper)>=contrastRatio('#ffffff',paper)?0:255;
  const target=Math.min(4.8,contrastRatio(endpoint===0?'#000000':'#ffffff',paper));
  for(let step=1;step<=100;step++) {
    const candidate='#'+channels.map(channel=>Math.round(channel+(endpoint-channel)*step/100).toString(16).padStart(2,'0')).join('');
    if(contrastRatio(candidate,paper)>=target) return candidate;
  }
  throw new Error('Theme paper cannot support readable attribution.');
}

export function attributionTokens(palette) {
  return {
    'htmpres-credit-bg':'var(--paper)',
    'htmpres-credit-ink':contrastRatio(palette.ink,palette.paper)>=4.8?'var(--ink)':attributionInk(palette.ink,palette.paper),
    'htmpres-source-ink':contrastRatio(palette.muted,palette.paper)>=4.8?'var(--htmpres-importance-0-ink)':attributionInk(palette.muted,palette.paper),
  };
}
