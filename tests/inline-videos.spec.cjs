// Regression tests for inline video playback on both portfolio sections.
// External YouTube connections are blocked: no real autoplay, API calls, or uploads.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const base = 'http://127.0.0.1:8000';
const videos = {
  'Africa In My Veins': 'Sq4zTReSyBY',
  'African Spirit Anthem': 'gXa3twObtzk',
  'Argungu Fishing Festival': 'XR8RzqfUVpk',
  'Dee’s Bite Cakes Ads': 'n64X16gVrXE'
};
(async () => {
  const browser=await chromium.launch({
    executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',
    headless:true,args:['--no-sandbox']
  });
  try {
    for(const path of ['/','/work/']) {
      const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
      const errors=[];
      page.on('pageerror',err=>errors.push(err.message));
      await page.route('**/*',route=>route.request().url().startsWith(base)
        ? route.continue() : route.abort());
      await page.goto(base+path);
      const gallery=page.locator('.portfolio');
      assert.equal(await gallery.locator('.portfolio-player').count(),4);
      assert.equal(await gallery.locator('iframe').count(),0,'Do not preload players');
      for(const [title,id] of Object.entries(videos)){
        const trigger=gallery.locator(`a[data-inline-video="${id}"]`);
        assert.equal(await trigger.count(),1);
        assert.equal(await trigger.getAttribute('href'),`https://youtu.be/${id}`);
        assert.match(await trigger.getAttribute('aria-label'),/Play .* video/);
        await trigger.click();
        const frame=gallery.locator('.portfolio-player iframe');
        assert.equal(await frame.count(),1,'Only one active player at once');
        assert.equal(await frame.getAttribute('src'),
          `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`);
        assert.match(await frame.getAttribute('title'),/YouTube player/);
        const close=gallery.locator('.portfolio-player-close');
        assert.equal(await close.count(),1);
        if(id==='gXa3twObtzk'){
          // One player is automatically stopped when another is chosen.
          const next=gallery.locator('a[data-inline-video="XR8RzqfUVpk"]');
          await next.click();
          assert.equal(await gallery.locator('iframe').count(),1);
          assert.match(await gallery.locator('iframe').getAttribute('src'),/XR8RzqfUVpk/);
        }
        await gallery.locator('.portfolio-player-close').click();
        assert.equal(await gallery.locator('iframe').count(),0);
      }
      for(const width of [390,320]){
        await page.setViewportSize({width,height:844});
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true,
          'No overflow at '+width+' for '+path);
      }
      const youtubeLinks=gallery.locator('a.worklink[href^="https://youtu.be/"]');
      assert.equal(await youtubeLinks.count(),4,'Keep an external playback fallback');
      assert.deepEqual(errors,[]);
      await page.close();
    }
    console.log('PASS: inline portfolio video cards, lazy players, one active at a time, close/restore, fallback links and mobile layout.');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
