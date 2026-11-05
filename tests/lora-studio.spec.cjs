// Local-only provider/form/vendor fixtures; never submits a real inquiry or payment.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const base = 'http://127.0.0.1:8000';
(async () => {
 const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
 try {
  const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  const errors = [], payloads = [];
  let offline = false, submissions = 0;
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => {
   const request = route.request(), url = request.url();
   if (url.endsWith('/.netlify/functions/lora-ai')) {
    if (request.method() === 'GET') return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ configured: !offline }) });
    const data = request.postDataJSON(); payloads.push(data);
    if (offline) return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'AI is unavailable. The brief builder still works.' }) });
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ mode: data.mode, reply: `Fixture ${data.mode} response with <b>literal markup</b>.` }) });
   }
   if (url.endsWith('/__forms.html') && request.method() === 'POST') {
    submissions++; return route.fulfill({ status: 200, contentType: 'text/html', body: 'Local submission fixture' });
   }
   if (url.startsWith('https://code.tidio.co/')) return route.fulfill({ contentType: 'application/javascript', body: 'window.tidioChatApi={on(){},show(){},setColorPalette(){}};document.dispatchEvent(new Event("tidioChat-ready"));' });
   if (url.startsWith(base)) return route.continue();
   return route.abort();
  });
  await page.goto(base + '/studio/');
  await page.waitForFunction(() => document.getElementById('studio-status').textContent.includes('AI configured'));
  for (const [mode, name] of [['brand','Brand Ad Adviser'],['brief','Creative Brief Assistant'],['learn','AI Video Learning Coach']]) {
   await page.locator(`[data-mode="${mode}"]`).click();
   assert.equal(await page.locator('#active-mode-name').textContent(), name);
   await page.locator('#studio-examples button').first().click();
   assert.ok((await page.locator('#studio-question').inputValue()).length > 20);
   await page.locator('#studio-send').click();
   await page.waitForFunction(() => !document.getElementById('studio-send').disabled);
   assert.ok((await page.locator('#studio-messages').textContent()).includes(`Fixture ${mode} response`));
   assert.equal(await page.locator('#studio-messages b').count(), 0);
   assert.equal(payloads.at(-1).mode, mode);
   assert.deepEqual(Object.keys(payloads.at(-1)).sort(), ['messages','mode']);
   await page.locator('#studio-question').fill('Please explain the next step.');
   await page.locator('#studio-send').click();
   await page.waitForFunction(() => !document.getElementById('studio-send').disabled);
   assert.equal(payloads.at(-1).messages.length, 3);
   await page.locator('#chat-clear').click();
   assert.equal(await page.locator('#studio-messages .studio-message').count(), 1);
  }
  for (const width of [1440, 1024, 820, 768, 390, 320]) {
   await page.setViewportSize({ width, height: 900 });
   assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Studio overflow at ${width}`);
   assert.equal(await page.locator('script[src^="https://code.tidio.co/"]').count(), 1);
   assert.equal(await page.locator('.assistant-toggle').count(), 0);
  }
  offline = true;
  await page.goto(base + '/studio/');
  await page.waitForFunction(() => document.getElementById('studio-status').textContent.includes('setup pending'));
  await page.locator('#studio-question').fill('A test question while offline.');
  await page.locator('#studio-send').click();
  await page.waitForFunction(() => !document.getElementById('studio-send').disabled);
  assert.ok((await page.locator('#studio-feedback').textContent()).includes('unavailable'));
  const requestsBeforeBuilder = payloads.length;
  assert.equal(await page.locator('#brief-contact').isDisabled(), true);
  await page.locator('#brief-brand').fill('Local test brand');
  await page.locator('#brief-audience').fill('Small business owners');
  await page.locator('#brief-message').fill('Explain our new product.');
  await page.locator('#brief-generate').click();
  const brief = await page.locator('#brief-preview').textContent();
  assert.ok(brief.includes('Local test brand') && brief.includes('Small business owners'));
  assert.equal(payloads.length, requestsBeforeBuilder);
  assert.equal(await page.evaluate(() => sessionStorage.getItem('lora-studio-brief')), null);
  await page.locator('#brief-copy').click();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), brief);
  await page.locator('#brief-contact').click();
  await page.waitForURL('**/contact/');
  assert.equal(await page.locator('textarea[name="message"]').inputValue(), brief);
  assert.equal(await page.locator('[name="contact-consent"]').isChecked(), false);
  assert.equal(submissions, 0);
  await page.reload();
  assert.equal(await page.locator('textarea[name="message"]').inputValue(), brief);
  await page.locator('[name="name"]').fill('Local test');
  await page.locator('[name="email"]').fill('local-test@example.com');
  await page.locator('#interest').selectOption({ label: 'Launch Visuals' });
  await page.locator('[name="contact-consent"]').check();
  await page.locator('button[type="submit"]').click();
  await page.waitForFunction(() => document.getElementById('lora-form-status').dataset.state === 'success');
  assert.equal(submissions, 1);
  assert.equal(await page.evaluate(() => sessionStorage.getItem('lora-studio-brief')), null);
  // A disabled storage policy keeps the visitor on the brief rather than losing it.
  await page.goto(base + '/studio/');
  await page.locator('#brief-generate').click();
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('Blocked for test'); }; });
  await page.locator('#brief-contact').click();
  assert.ok(page.url().endsWith('/studio/'));
  assert.ok((await page.locator('#brief-feedback').textContent()).includes('storage is unavailable'));
  await page.locator('#brief-form button[type="reset"]').click();
  assert.equal(await page.locator('#brief-contact').isDisabled(), true);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: '/tmp/lora-studio-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: '/tmp/lora-studio-mobile.png', fullPage: true });
  assert.deepEqual(errors, []);
  console.log('PASS: all three assistants, follow-up history, safe reply text, clear chat, offline recovery, free brief/copy/reset, consent-preserving contact handoff and storage cleanup, blocked storage, six viewports, single Tidio script. Provider, form and vendor responses were mocked.');
 } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
