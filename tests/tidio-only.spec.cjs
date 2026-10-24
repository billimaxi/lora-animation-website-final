// Tests Tidio-only layout and automatic browser-local welcome with a mock vendor API.
// Nothing is sent to Tidio servers during these tests.
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
      if(route.request().url()===tidio) return route.fulfill({
        status:200,contentType:'application/javascript',
        body:`window.__tidioEvents={};window.__tidioCalls=[];window.tidioChatApi={
          on(name,cb){(window.__tidioEvents[name]||=[]).push(cb)},
          show(){window.__tidioCalls.push('show')},
          setColorPalette(color){window.__tidioCalls.push('color:'+color)},
          messageFromOperator(text){window.__tidioCalls.push('welcome:'+text)}
        };
        document.dispatchEvent(new Event('tidioChat-ready'));`
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
      await page.evaluate(()=>window.__tidioEvents.open.forEach(cb=>cb()));
      const calls=await page.evaluate(()=>window.__tidioCalls.filter(v=>v.startsWith('welcome:')));
      if(path==='/') {
        assert.equal(calls.length,1);
        assert.match(calls[0],/Automated LORA welcome/);
        assert.match(calls[0],/LORA Animations/);
      } else assert.equal(calls.length,0,'Only one welcome per visitor tab session');
      await page.evaluate(()=>window.__tidioEvents.open.forEach(cb=>cb()));
      assert.equal(await page.evaluate(()=>window.__tidioCalls.filter(v=>v.startsWith('welcome:')).length),calls.length);
    }
    assert.deepEqual(errors,[]);
    console.log('PASS: no LORA Guide, only visible Tidio, gold accent, automatic one-time local greeting on open.');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
