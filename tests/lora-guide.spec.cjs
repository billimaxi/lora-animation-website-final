// Browser regression for the LORA Guide's guided answers and explicit Tidio handoff.
// The external widget is mocked, so no real support conversations are created.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const base = 'http://127.0.0.1:8000';
const tidio = 'https://code.tidio.co/9hmxhxqgu4ngeksux6hsezml5klhmyap.js';
(async () => {
 const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  headless: true, args: ['--no-sandbox']
 });
 try {
  const page = await browser.newPage({viewport: {width: 390, height: 844}});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => {
   const url = route.request().url();
   if (url === tidio) return route.fulfill({
    status: 200, contentType: 'application/javascript',
    body: `window.__chatActions=[];
window.__chatCallbacks={};
window.tidioChatApi={
 getStatus(){return 'online'},
 on(type, cb){(window.__chatCallbacks[type] ||= []).push(cb)},
 hide(){window.__chatActions.push('hide')},
 show(){window.__chatActions.push('show')},
 open(){window.__chatActions.push('open')}
};
document.dispatchEvent(new Event('tidioChat-ready'));`
   });
   return url.startsWith(base) ? route.continue() : route.abort();
  });
  await page.goto(base+'/');
  await page.waitForFunction(() => window.__chatActions?.includes('hide'));
  const toggle = page.locator('.assistant-toggle');
  await toggle.click();
  const guide = page.locator('#lora-assistant');
  assert.equal(await guide.isVisible(), true);
  assert.equal(await guide.locator('button[data-topic]').count(), 6);
  assert.equal(await page.locator('.assistant-handoff').isVisible(), false);
  assert.match(await page.locator('#assistant-answer').textContent(), /Welcome to LORA Animations/);
  await page.locator('[data-topic="services"]').click();
  assert.equal(await page.locator('.assistant-handoff').isVisible(), true);
  assert.match(await page.locator('#assistant-answer').textContent(), /What services does LORA offer/);
  assert.match(await page.locator('#assistant-answer').textContent(), /AI animation/);
  assert.match(await page.locator('.assistant-human-link').textContent(), /Talk to LORA Support/);
  await page.locator('.assistant-human-link').click();
  assert.equal(await guide.isVisible(), false);
  assert.deepEqual((await page.evaluate(() => window.__chatActions)).slice(-2), ['show','open']);
  await page.evaluate(() => window.__chatCallbacks.close?.forEach(fn => fn()));
  assert.equal((await page.evaluate(() => window.__chatActions)).at(-1), 'hide');
  assert.deepEqual(errors, []);

  // If the widget is unavailable, support can still be reached via WhatsApp.
  const blocked = await browser.newPage();
  const blockedErrors=[];
  blocked.on('pageerror', error=>blockedErrors.push(error.message));
  await blocked.route('**/*', route => route.request().url().startsWith(base)
    ? route.continue() : route.abort());
  await blocked.goto(base+'/contact/');
  await blocked.locator('.assistant-toggle').click();
  await blocked.locator('[data-topic="support"]').click();
  assert.equal(await blocked.locator('.assistant-handoff').isVisible(),true);
  assert.match(await blocked.locator('.assistant-human-link').getAttribute('href'), /wa\.me\/2349048200012/);
  assert.match(await blocked.locator('.assistant-human-link').textContent(), /WhatsApp/);
  assert.deepEqual(blockedErrors,[]);
  await blocked.close();
  console.log('PASS: branded launcher, preset questions, staged handoff, Tidio open/close, WhatsApp fallback');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
