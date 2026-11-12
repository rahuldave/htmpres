/** Actual CUA geometry/contrast regressions for decks/pictures in either view. */
import { chooseDeckSlide } from './deck-browser.mjs';
import { mediaTextSnapshot, mediaTextFailures } from './media-panels-browser.mjs';

export function pictureSnapshot(doc = document, viewport = {width:innerWidth,height:innerHeight}) {
    const slide=doc.querySelector('.slide.active'), rect=el=>el?.getBoundingClientRect().toJSON()||null;
    const style=el=>el?getComputedStyle(el):null, visible=el=>!!el&&style(el).display!=='none'&&style(el).visibility!=='hidden'&&el.getBoundingClientRect().height>0;
    const full=slide.querySelector('.ds-full'), img=slide.querySelector('img'), caption=slide.querySelector('figcaption'), layer=slide.querySelector('.ds-layer'), heading=slide.querySelector(':scope > h2'),bodyPanel=slide.querySelector(':scope > p:has(.key)'), label=getComputedStyle(slide,'::after');
    const color=el=>el?{ink:style(el).color,ground:style(el).backgroundColor}:null;
    const px=value=>Number.parseFloat(value)||0, scale=rect(slide).width/slide.offsetWidth, ss=style(slide);
    const token=(name,fallback)=>px(ss.getPropertyValue(name))||fallback;
    const titleGap=token('--htmpres-media-title-gap',token('--htmpres-within-gap',16))*scale;
    const footerGap=token('--htmpres-media-footer-gap',12)*scale;
    const inset=token('--htmpres-credit-inset',24)*scale;
    const hasLabel=!!slide.dataset.section?.trim();
    const labelHeight=(px(label.height)+(label.boxSizing==='border-box'?0:px(label.paddingTop)+px(label.paddingBottom)+px(label.borderTopWidth)+px(label.borderBottomWidth)))*scale;
    const labelTop=rect(slide).bottom-px(label.bottom)*scale-labelHeight;
    const credit=slide.querySelector('.slide-credits');
    const footerTop=Math.min(rect(slide).bottom-inset,credit?rect(credit).top-footerGap:Infinity,hasLabel?labelTop-footerGap:Infinity);
    const wrapper=slide.querySelector(':scope > .ds-media'), ws=wrapper?style(wrapper):null;
    const verticalInset=ws?(px(ws.paddingTop)+px(ws.paddingBottom)+px(ws.borderTopWidth)+px(ws.borderBottomWidth))*scale:0;
    const horizontalInset=ws?(px(ws.paddingLeft)+px(ws.paddingRight)+px(ws.borderLeftWidth)+px(ws.borderRightWidth))*scale:0;
    const imageTop=heading&&style(heading).position!=='absolute'?rect(heading).bottom+titleGap:rect(slide).top+px(ss.paddingTop)*scale;
    const captionGap=caption&&visible(caption)?px(style(caption.parentElement).rowGap)*scale:0;
    const available={width:rect(slide).width-(px(ss.paddingLeft)+px(ss.paddingRight))*scale-horizontalInset,height:footerTop-imageTop-verticalInset-(caption&&visible(caption)?rect(caption).height+captionGap:0)};
    const ib=rect(img), is=style(img), content={width:ib.width-(px(is.paddingLeft)+px(is.paddingRight)+px(is.borderLeftWidth)+px(is.borderRightWidth))*scale,height:ib.height-(px(is.paddingTop)+px(is.paddingBottom)+px(is.borderTopWidth)+px(is.borderBottomWidth))*scale};
    const ratio=Math.min(content.width/img.naturalWidth,content.height/img.naturalHeight);
    const drawn={width:img.naturalWidth*ratio,height:img.naturalHeight*ratio};
    const allImagesDescribed=[...doc.images].every(image=>image.hasAttribute('alt')&&(image.alt.trim()||image.classList.contains('decorative')||image.closest('[aria-hidden="true"]')));
    const space={pure:slide.classList.contains('htmpres-picture-slide'),available,drawn,titleGap,imageTop,actualTop:ib.top,scale,captionAlign:caption?style(caption).textAlign:null,allImagesDescribed};
    return {space,title:slide.dataset.title,slide:rect(slide),full:rect(full),image:rect(img),caption:rect(caption),captionVisible:visible(caption),alt:img?.alt,loaded:!!img?.complete&&img.naturalWidth>0,fit:style(img)?.objectFit,layer:rect(layer),layerColors:color(layer),keyColors:color(slide.querySelector('.key')),heading:rect(heading),headingColors:color(heading),bodyPanelColors:color(bodyPanel),expectedFit:img?.classList.contains("ds-fill")||img?.closest(".ds-fill")?"cover":"contain",splitPane:rect(slide.querySelector(':scope > .ds-media:not(.ds-full)')),splitCopy:rect(slide.classList.contains('htmpres-split-media')?slide.querySelector(':scope > ul,:scope > ol,:scope > .ds-right:not(.ds-media),:scope > .ds-left:not(.ds-media)'):null),credit:rect(slide.querySelector('.slide-credits')),label:{visible:hasLabel&&label.display!=='none'&&label.visibility!=='hidden'&&label.content!=='none',ground:label.backgroundColor,ink:label.color,zIndex:label.zIndex},viewport};
}
export async function inspectPictureSlide(tab) {
  const state = await tab.playwright.evaluate(pictureSnapshot);
  state.textBoxes = await tab.playwright.locator('.slide.active').evaluate(mediaTextSnapshot);
  return state;
}
function contrast(a,b) {
  const lum=s=>s.match(/[\d.]+/g).slice(0,3).map(Number).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((n,x,i)=>n+x*[.2126,.7152,.0722][i],0);
  return (Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
}
const opaque=s=>s&&s!=='transparent'&&(!s.startsWith('rgba')||Number(s.match(/[\d.]+/g)[3])===1);
const inside=(a,b)=>a&&b&&a.width>0&&a.height>0&&a.top>=b.top-2&&a.bottom<=b.bottom+2&&a.left>=b.left-2&&a.right<=b.right+2;
export function pictureFailures(state,number) {
  const s=state, failures=[],expect=(v,m)=>{if(!v)failures.push(m);};
  expect(s.loaded,'image loaded');
  expect(s.space.allImagesDescribed,'every actual image has alt and is described or explicitly decorative');
  if(s.space.pure&&s.expectedFit==='contain') {
    const {available:a,drawn:d}=s.space;
    const expectedScale=Math.min(a.width/d.width,a.height/d.height);
    expect(a.width>0&&a.height>0&&Math.abs(expectedScale-1)*Math.max(d.width,d.height)<3,'drawn picture reaches a limiting edge of independently available space');
    expect(Math.abs(s.space.actualTop-s.space.imageTop)<3,'title-to-picture gap matches the theme media gap');
    if(s.caption) expect(s.space.captionAlign==='center','caption centers under the centered picture');
  }
  if(s.full) {
    expect(inside(s.full,s.slide)&&Math.abs(s.full.width-s.slide.width)<3&&Math.abs(s.full.height-s.slide.height)<3,'full image fills slide');
    if(s.layer) expect(inside(s.layer,s.slide),'overlay stays inside slide');
    expect(Array.isArray(s.textBoxes),'text backing was inspected');
    failures.push(...mediaTextFailures(s.textBoxes || []));
    if(number===4){expect(s.alt==='A long line of students waits before one database','full picture keeps exact screen-reader alt');expect(!s.captionVisible,'full picture caption not visible');}
  }
  expect(!s.label.visible||(opaque(s.label.ground)&&contrast(s.label.ink,s.label.ground)>=4.5&&Number(s.label.zIndex)>=2),'picture section label has readable foreground ground');
  if(!s.full) {
    expect(inside(s.image,s.slide),'picture stays inside slide');
    if(s.heading) expect(s.image.top>=s.heading.bottom-2,'picture starts below title');
    expect(s.fit===s.expectedFit,'fit preserves shape or explicit fill crops');
    if(s.caption) {expect(s.captionVisible&&inside(s.caption,s.slide),'normal caption visible inside slide');expect(s.image.bottom<=s.caption.top+2,'caption follows image without overlap');}
    if(s.credit) {expect(inside(s.credit,s.slide),'credit stays inside slide');expect((s.caption||s.image).bottom<=s.credit.top-2,'caption/picture stays above credit');}
  }
  if(s.splitCopy) {expect(inside(s.splitCopy,s.slide),'split explanation stays inside slide');expect(Math.abs(s.splitCopy.top-s.splitPane.top)<3,'split explanation shares the picture row');}
  return failures;
}
export const pictureSlideLabels=["Fault 1: readable", "Fault 2: layer ink", "Fault 2: title on a background", "Fault 3: caption", "Fault 4: label over a picture", "Fault 5: a bare picture under a title", "Fit wide wrapped", "Fit wide bare", "Fit tall wrapped", "Fit tall bare", "Fit 16 by 9 wrapped", "Fit 16 by 9 bare", "Split picture and explanation", "Overlay on a bright picture", "A title on a bright background", "Readable media without a full-slide container", "A left picture beside a list", "A right picture beside a list", "Linked photo picture without a fit class", "Linked wide picture without a fit class", "Linked tall picture without a fit class", "A deliberately cropped picture", "Untitled contained picture", "Untitled split picture", "Untitled left picture beside a list", "Untitled right picture beside a list", "Every student waits for one database", "A titled picture, no section", "ViewBox photo, caption, credit, label", "ViewBox photo, caption, credit", "ViewBox photo, caption, label", "ViewBox photo, caption", "ViewBox photo, linked, credit, label", "ViewBox photo, linked, credit", "ViewBox photo, linked, label", "ViewBox photo, linked", "ViewBox wide, caption, credit, label", "ViewBox wide, caption, credit", "ViewBox wide, caption, label", "ViewBox wide, caption", "ViewBox wide, linked, credit, label", "ViewBox wide, linked, credit", "ViewBox wide, linked, label", "ViewBox wide, linked", "ViewBox tall, caption, credit, label", "ViewBox tall, caption, credit", "ViewBox tall, caption, label", "ViewBox tall, caption", "ViewBox tall, linked, credit, label", "ViewBox tall, linked, credit", "ViewBox tall, linked, label", "ViewBox tall, linked", "Explicit decorative bare", "Explicit decorative full", "Explicit decorative split", "Panels on semantic text blocks"];
export async function checkPictureSlidesBrowser(tab,{collect=false}={}) {
  const labels=pictureSlideLabels;
  await tab.playwright.evaluate(async()=>{await document.fonts.ready;return document.fonts.status;});
  const results=[];
  await chooseDeckSlide(tab,`1. ${labels[0]}`);
  for(let i=0;i<labels.length;i++) {
    if(i){await tab.playwright.locator('#nextBtn').click();await tab.getAXState({emit:false});}
    const state=await inspectPictureSlide(tab),failures=pictureFailures(state,i+1);
    if(state.title!==labels[i])failures.push('Next reaches the expected picture slide');
    if(i===3 && !(await tab.playwright.locator('.slide.active').getByRole('img',{name:state.alt,exact:true}).isVisible())) failures.push('full picture exposes accessible image name');
    results.push({slide:i+1,failures,state});
    if(failures.length&&!collect) throw new Error(`Picture slide ${i+1}: ${failures.join('; ')}`);
  }
  return results;
}

/** Revisiting a picture must not grow its credit reserve or shrink its drawing. */
export async function checkPictureRevisitBrowser(tab) {
  await chooseDeckSlide(tab,'27. Every student waits for one database');
  const before=await inspectPictureSlide(tab);
  await tab.playwright.locator('#nextBtn').click();await tab.getAXState({emit:false});
  await tab.playwright.locator('#prevBtn').click();await tab.getAXState({emit:false});
  const after=await inspectPictureSlide(tab);
  if(Math.abs(before.space.drawn.height-after.space.drawn.height)>1||Math.abs(before.space.available.height-after.space.available.height)>1)throw Error('Revisiting the picture changed its available or drawn size');
  return {before:before.space,after:after.space};
}
