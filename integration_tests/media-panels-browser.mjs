/** Text over pictures is transparent unless its own box opts into a panel. */
export function mediaTextSnapshot(slide) {
  const nodes = new Set(slide.querySelectorAll(':scope > h2, :scope > p, :scope > ul, :scope > ol, :scope > blockquote, :scope > .key, :scope > .aside, :scope > .statement, .ds-layer, .ds-panel'));
  return [...nodes].filter(node => !node.querySelector('img,video,audio') && !node.closest('.slide-credits')).map(node => {
    const style = getComputedStyle(node);
    return {tag:node.tagName, panel:node.classList.contains('ds-panel') || (node.parentElement===slide && slide.classList.contains('ds-panel')), ground:style.backgroundColor, ink:style.color,
      emphasis:[...node.querySelectorAll('.key,.aside,.statement,p,li,blockquote')].map(term=>getComputedStyle(term).color)};
  });
}

export function mediaTextFailures(boxes) {
  const alpha = color => color === 'transparent' ? 0 : color.startsWith('rgba') ? Number(color.match(/[\d.]+/g)[3]) : 1;
  const luminance = color => color.match(/[\d.]+/g).slice(0,3).map(Number).map(value=>value/255).map(value=>value<=.04045?value/12.92:((value+.055)/1.055)**2.4).reduce((sum,value,index)=>sum+value*[.2126,.7152,.0722][index],0);
  const contrast = (ink,ground) => (Math.max(luminance(ink),luminance(ground))+.05)/(Math.min(luminance(ink),luminance(ground))+.05);
  return boxes.flatMap(box => {
    if(!box.panel) return alpha(box.ground)===0 ? [] : [`${box.tag}: default picture text must be transparent`];
    return alpha(box.ground)===1 && [box.ink,...box.emphasis].every(ink=>contrast(ink,box.ground)>=4.5) ? [] : [`${box.tag}: explicit panel must have opaque readable theme colors`];
  });
}
