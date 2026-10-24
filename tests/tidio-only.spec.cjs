// Test Tidio as the only visible chat with an isolated vendor mock.
// The automatic welcome is configured in Tidio's account, not injected by site JS.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const base='http://127.0.0.1:8000';
const tidio='https://code.tidio.co/9hmxhxqgu4ngeksux6hsezml5klhmyap.js';
(async () => {
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  try {
    const page=await browser.newPage({viewport:{width:390,height:844}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/*',route=>{
      if(route.request().url()===tidio)return route.fulfill({
        status:200,contentType:'application/javascript',
        body:`window.__tidioEvents={};window.__tidioCalls=[];window.tidioChatApi={
          on(name,cb){(window.__tidioEvents[name]||=[]).push(cb)},
          show(){window.__tidioCalls.push('show')},
          setColorPalette(color){window.__tidioCalls.push('color:'+color)},
          messageFromOperator(text){window.__tidioCalls.push('welcome:'+text)}
        };document.dispatchEvent(new Event('tidioChat-ready'));`
      });
      if(route.request().url().startsWith(base))return route.continue();
      return route.abort();
    });
    for(const path of ['/','/about/','/contact/']){
      await page.goto(base+path);
      await page.waitForFunction(()=>window.__tidioCalls?.includes('show'));
      assert.equal(await page.locator('#lora-assistant, .assistant-toggle').count(),0);
      assert.equal(await page.locator('script[src^="https://code.tidio.co/"]').count(),1);
      assert.ok((await page.evaluate(()=>window.__tidioCalls)).includes('color:#dcb25d'));
      assert.equal(await page.evaluate(()=>window.__tidioCalls.some(v=>v.startsWith('welcome:'))),false);
    }
    assert.deepEqual(errors,[]);
    console.log('PASS: no guide, sole Tidio widget, gold palette, no duplicate site-injected welcome.');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
