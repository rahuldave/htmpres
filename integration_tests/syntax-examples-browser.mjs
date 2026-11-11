import { checkDocsLayout } from './docs-layout-browser.mjs';

/** Run through CUA on syntax-examples.html with its generated manifest. */
export async function checkSyntaxExamples(tab, manifest, {modes=['light','dark'], views=['audience','presenter']}={}) {
  const assert=(value,message)=>{if(!value) throw new Error(message);};
  const results=[];
  for(const mode of modes) for(const view of views) {
    await tab.playwright.locator('#example-mode').selectOption(mode);
    await tab.getAXState({emit:false});
    await tab.playwright.locator('#example-view').selectOption(view);
    await tab.getAXState({emit:false});
    for(let slide=1;slide<=manifest.slideSources.length;slide++) {
      await tab.playwright.locator('#example-slide').selectOption(String(slide));
      const steps=slide===17?7:slide===29?4:0;
      await tab.playwright.getByText(steps?`Step 0 of ${steps} · before reveals`:'This slide has no reveal steps',{exact:true}).waitFor({state:'visible',timeoutMs:30000});
      await tab.getAXState({emit:false});
      assert(await tab.playwright.locator('#example-markdown').textContent()===manifest.slideSources[slide-1].markdown,`Exact source ${mode}/${view}/${slide}`);
      const frame=tab.playwright.frameLocator('iframe');
      const data=await frame.locator('.slide.active').evaluate(node=>{
        const image=node.querySelector('img.ds-alpha');
        const background=node.querySelector('.ds-global-background');
        return {id:node.id,opacity:image&&getComputedStyle(image).opacity,
          scale:node.dataset.textFitScale,overflow:getComputedStyle(node).overflowY,
          background:background&&{opacity:getComputedStyle(background).opacity,fit:getComputedStyle(background.querySelector('img')||background).objectFit},
          images:[...node.querySelectorAll('img')].every(image=>image.complete&&image.naturalWidth>0),
          media:[...node.querySelectorAll('video,audio')].map(media=>({hidden:media.classList.contains('ds-hide'),controls:media.controls,paused:media.paused,autoplay:media.autoplay,ariaHidden:media.getAttribute('aria-hidden')}))};
      });
      assert(data.images,`Loaded images ${mode}/${view}/${slide}`);
      if(slide===1||slide===2) {
        const halves=await frame.locator('.slide.active').evaluate(node=>{
          const slide=node.getBoundingClientRect();
          return ['.ds-left','.ds-right'].map(selector=>{const rect=node.querySelector(selector).getBoundingClientRect();return {x:(rect.x-slide.x)/slide.width,width:rect.width/slide.width,height:rect.height/slide.height};});
        });
        assert(Math.abs(halves[0].x)<.01&&Math.abs(halves[1].x-.5)<.01&&halves.every(p=>Math.abs(p.width-.5)<.01&&Math.abs(p.height-1)<.01),`Edge-to-edge halves ${mode}/${view}/${slide}: ${JSON.stringify(halves)}`);
        const cover=await frame.locator('.slide.active .ds-media').evaluate(node=>{const box=node.getBoundingClientRect(),image=node.querySelector('img').getBoundingClientRect();return {x:Math.abs(box.x-image.x),y:Math.abs(box.y-image.y),width:Math.abs(box.width-image.width),height:Math.abs(box.height-image.height)};});
        assert(Object.values(cover).every(difference=>difference<1),`Image covers its whole half ${mode}/${view}/${slide}: ${JSON.stringify(cover)}`);
      }
      if(slide===4||slide===5) assert(Math.abs(Number(data.opacity)-(slide===4?.6:.25))<.001,`Opacity ${mode}/${view}/${slide}: ${data.opacity}`);
      if(slide===15) {
        await frame.getByRole('button',{name:'Presenter',exact:true}).click();
        assert(await frame.locator('#syntax-detail h3').textContent()==='Presenter view','Panel text replacement');
        await frame.getByRole('button',{name:'Both',exact:true}).press('Enter');
        assert(await frame.locator('#syntax-detail h3').textContent()==='Both views','Panel HTML replacement by keyboard');
      }
      if(slide===16) {
        for(const [name,count] of [['Prototypes',2],['Stable',2],['All',3]]) {
          await frame.getByRole('button',{name,exact:true}).click();
          const visible=await frame.locator('.candidate').evaluateAll(nodes=>nodes.filter(node=>getComputedStyle(node).display!=='none').length);
          assert(visible===count,`Filter ${name}: ${visible}`);
        }
      }
      if(slide===17||slide===29) {
        for(let step=1;step<=steps;step++) {
          await tab.playwright.getByRole('button',{name:'Next step',exact:true}).click();
          await tab.playwright.getByText(`Step ${step} of ${steps}${slide===29&&step===4?' · matched summary':''}`,{exact:true}).waitFor({state:'visible'});
        }
        assert(!await tab.playwright.getByRole('button',{name:'Next step',exact:true}).isEnabled(),'Reveal bounds');
      }
      if(slide===19) assert(data.media.some(media=>media.hidden&&media.ariaHidden==='true')&&data.media.some(media=>media.controls),'Audio controls and hidden media');
      if(slide===20) assert(data.media.every(media=>media.paused&&!media.autoplay),'Source preview pauses automatic playback');
      if(slide===24) assert(Number(data.scale)>=.64&&Number(data.scale)<1,`Actual text fitting ${mode}/${view}: ${data.scale}`);
      results.push(`${mode}/${view}/${slide}`);
    }
    await checkDocsLayout(tab);
  }
  return results;
}

/** Full exported views retain ordinary controls, navigation and playback. */
export async function checkSyntaxFullDeck(tab) {
  const assert=(value,message)=>{if(!value) throw new Error(message);};
  const base=(await tab.playwright.evaluate(()=>location.href)).split('#')[0].split('?')[0];
  await tab.goto(`${base}#/15`);
  await tab.getAXState({emit:false});
  const button=tab.playwright.locator('#panel-controls button[data-title]').nth(1);
  const expected=await button.getAttribute('data-title');
  await button.press('Space');
  await tab.getAXState({emit:false});
  assert(await tab.playwright.locator('.slide.active').getAttribute('id')==='panel-controls','Focused Space does not also advance the exported deck');
  assert(await tab.playwright.locator('#syntax-detail h3').textContent()===expected,'Space activates the panel button');
  await tab.playwright.locator('#overviewBtn').click();
  await tab.getAXState({emit:false});
  assert(await tab.playwright.locator('#overview').isVisible(),'Overview opens');
  await tab.playwright.locator('#overviewBtn').press('Escape');
  await tab.getAXState({emit:false});
  assert(!await tab.playwright.locator('#overview').isVisible(),'Escape closes overview from its focused button');
  await tab.playwright.locator('#nextBtn').click();
  await tab.playwright.locator('#nextBtn').press('ArrowRight');
  await tab.getAXState({emit:false});
  assert(await tab.playwright.locator('.slide.active').getAttribute('id')==='fragment-effects','Deck chrome retains arrow navigation');
  await tab.goto(`${base}#/25`);
  await tab.getAXState({emit:false});
  await tab.playwright.locator('#navigation-guard .no-tap-nav').click();
  await tab.getAXState({emit:false});
  assert(await tab.playwright.locator('.slide.active').getAttribute('id')==='navigation-guard','Authored tap guard keeps its region on the slide');
  await tab.playwright.locator('#navigation-guard .card').nth(1).click();
  await tab.getAXState({emit:false});
  assert(await tab.playwright.locator('.slide.active').getAttribute('id')==='scroll-overflow','An unguarded region still advances');
  const scroll=await tab.playwright.locator('#scroll-overflow.active').evaluate(node=>({height:node.clientHeight,scroll:node.scrollHeight,overflow:getComputedStyle(node).overflowY}));
  assert(scroll.scroll>scroll.height&&['auto','scroll'].includes(scroll.overflow),`Real overflow scroll: ${JSON.stringify(scroll)}`);
  const scrollBox=await tab.playwright.locator('#scroll-overflow.active').evaluate(node=>node.getBoundingClientRect().toJSON());
  await tab.scroll([scrollBox.right-12,scrollBox.top+scrollBox.height*.6],'down',8);
  await tab.getAXState({emit:false});
  assert(await tab.playwright.locator('#scroll-overflow.active').evaluate(node=>node.scrollTop>0),'Excess copy is reachable by scrolling');
  await tab.goto(`${base}#/18`);
  await tab.getAXState({emit:false});
  await tab.playwright.waitForLoadState({state:'networkidle'});
  await tab.playwright.locator('#video video').press('Space');
  await tab.getAXState({emit:false});
  const video=await tab.playwright.locator('#video video').evaluate(node=>({paused:node.paused,duration:node.duration,muted:node.muted,loop:node.loop}));
  assert(!video.paused&&video.duration>0&&video.muted&&video.loop,'Native video Space starts the loaded muted loop');
  assert(await tab.playwright.locator('.slide.active').getAttribute('id')==='video','Video keyboard input does not advance');
  await tab.playwright.locator('#nextBtn').click();
  await tab.getAXState({emit:false});
  assert(await tab.playwright.locator('#video video').evaluate(node=>node.paused&&node.currentTime===0),'Ordinary video pauses and resets when leaving');
  await tab.playwright.waitForLoadState({state:'networkidle'});
  const audio=await tab.playwright.locator('#audio audio.ds-keep-time').evaluate(node=>({duration:node.duration,controls:node.controls}));
  assert(audio.duration>0&&audio.controls,'Audio metadata and native controls are available');
  await tab.goto(`${base}#/20`);
  await tab.getAXState({emit:false});
  const automatic=tab.playwright.locator('#media-advance video');
  if(await automatic.evaluate(node=>node.paused)) await automatic.press('Space');
  const playbackDeadline=Date.now()+30000;
  while(Date.now()<playbackDeadline&&!await tab.playwright.locator('#embedded-page.active').isVisible()) {
    await tab.getAXState({emit:false});
  }
  assert(await tab.playwright.locator('#embedded-page.active').isVisible(),'Media completion advances to the embedded page');
  await tab.getAXState({emit:false});
  const embedded=tab.playwright.frameLocator('#embedded-page iframe');
  const before=Number.parseInt(await embedded.locator('output').textContent(),10);
  await embedded.getByRole('button',{name:'Add an observation',exact:true}).click();
  assert(Number.parseInt(await embedded.locator('output').textContent(),10)===before+1,'Local embedded page responds without deck navigation');
  return 'Exported controls, tap guard, scrolling, native video, audio metadata, media-end advance and local iframe passed';
}
