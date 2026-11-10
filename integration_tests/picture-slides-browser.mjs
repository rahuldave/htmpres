/** Actual CUA geometry/contrast regressions for decks/pictures in either view. */
import { chooseDeckSlide } from './deck-browser.mjs';

export function pictureSnapshot(doc = document, viewport = {width:innerWidth,height:innerHeight}) {
    const slide=doc.querySelector('.slide.active'), rect=el=>el?.getBoundingClientRect().toJSON()||null;
    const style=el=>el?getComputedStyle(el):null, visible=el=>!!el&&style(el).display!=='none'&&style(el).visibility!=='hidden'&&el.getBoundingClientRect().height>0;
    const full=slide.querySelector('.ds-full'), img=slide.querySelector('img'), caption=slide.querySelector('figcaption'), layer=slide.querySelector('.ds-layer'), heading=slide.querySelector(':scope > h2'),bodyPanel=slide.querySelector(':scope > p:has(.key)'), label=getComputedStyle(slide,'::after');
    const color=el=>el?{ink:style(el).color,ground:style(el).backgroundColor}:null;
    return {title:slide.dataset.title,slide:rect(slide),full:rect(full),image:rect(img),caption:rect(caption),captionVisible:visible(caption),alt:img?.alt,loaded:!!img?.complete&&img.naturalWidth>0,fit:style(img)?.objectFit,layer:rect(layer),layerColors:color(layer),keyColors:color(slide.querySelector('.key')),heading:rect(heading),headingColors:color(heading),bodyPanelColors:color(bodyPanel),expectedFit:img?.classList.contains("ds-fill")||img?.closest(".ds-fill")?"cover":"contain",splitPane:rect(slide.querySelector(':scope > .ds-media:not(.ds-full)')),splitCopy:rect(slide.classList.contains('htmpres-split-media')?slide.querySelector(':scope > ul,:scope > ol,:scope > .ds-right:not(.ds-media),:scope > .ds-left:not(.ds-media)'):null),credit:rect(slide.querySelector('.slide-credits')),label:{visible:label.display!=='none'&&label.visibility!=='hidden'&&label.content!=='none',ground:label.backgroundColor,ink:label.color,zIndex:label.zIndex},viewport};
}
export async function inspectPictureSlide(tab) {
  return tab.playwright.evaluate(pictureSnapshot);
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
  if(s.full) {
    expect(inside(s.full,s.slide)&&Math.abs(s.full.width-s.slide.width)<3&&Math.abs(s.full.height-s.slide.height)<3,'full image fills slide');
    if(s.layer) {expect(inside(s.layer,s.slide),'overlay stays inside slide');expect(opaque(s.layerColors.ground)&&contrast(s.layerColors.ink,s.layerColors.ground)>=4.5,'overlay has readable theme ground');expect(contrast(s.keyColors.ink,s.layerColors.ground)>=4.5,'nested key readable on overlay');}
    if(s.bodyPanelColors) expect(opaque(s.bodyPanelColors.ground)&&contrast(s.keyColors.ink,s.bodyPanelColors.ground)>=4.5,'background body/key has readable theme ground');
    if(s.heading) expect(opaque(s.headingColors.ground)&&contrast(s.headingColors.ink,s.headingColors.ground)>=4.5,'background title has readable theme ground');
    if(number===4){expect(s.alt==='A long line of students waits before one database','full picture keeps exact screen-reader alt');expect(!s.captionVisible,'full picture caption not visible');}
  }
  expect(!s.label.visible||(opaque(s.label.ground)&&contrast(s.label.ink,s.label.ground)>=4.5&&Number(s.label.zIndex)>=2),'picture section label has readable foreground ground');
  if(!s.full) {
    expect(inside(s.image,s.slide),'picture stays inside slide');
    if(s.heading) expect(s.image.top>=s.heading.bottom-2,'picture starts below title');
    expect(s.fit===s.expectedFit,'fit preserves shape or explicit fill crops');
    if(s.caption||![19,20,21].includes(number)) {expect(s.captionVisible&&inside(s.caption,s.slide),'normal caption visible inside slide');expect(s.image.bottom<=s.caption.top+2,'caption follows image without overlap');}
    if(s.credit) {expect(inside(s.credit,s.slide),'credit stays inside slide');expect((s.caption||s.image).bottom<=s.credit.top-2,'caption/picture stays above credit');}
  }
  if(s.splitCopy) {expect(inside(s.splitCopy,s.slide),'split explanation stays inside slide');expect(Math.abs(s.splitCopy.top-s.splitPane.top)<3,'split explanation shares the picture row');}
  return failures;
}
export const pictureSlideLabels=['Fault 1: readable','Fault 2: layer ink','Fault 2: title on a background','Fault 3: caption','Fault 4: label over a picture','Fault 5: a bare picture under a title','Fit wide wrapped','Fit wide bare','Fit tall wrapped','Fit tall bare','Fit 16 by 9 wrapped','Fit 16 by 9 bare','Split picture and explanation','Overlay on a bright picture','A title on a bright background','Readable media without a full-slide container','A left picture beside a list','A right picture beside a list','Linked photo picture without a fit class','Linked wide picture without a fit class','Linked tall picture without a fit class','A deliberately cropped picture','Untitled contained picture','Untitled split picture','Untitled left picture beside a list','Untitled right picture beside a list'];
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
