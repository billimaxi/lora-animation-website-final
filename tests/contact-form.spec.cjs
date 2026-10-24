// Run with Node.js + Playwright available and the local dev server on port 8000.
// No real messages are sent: HTTP form POST responses are mocked.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
 const browser = await chromium.launch({
   executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
   headless: true, args: ['--no-sandbox']
 });
 try {
  const page = await browser.newPage();
  let statusCode = 200, submitted = [];
  page.on('pageerror', error => { throw error; });
  await page.route('**/*', route => {
   const request = route.request();
   if (request.method() === 'POST' && request.url() === 'http://127.0.0.1:8000/__forms.html') {
     submitted.push({url:request.url(),headers:request.headers(),body:request.postData()});
     return route.fulfill({status:statusCode,body:statusCode===200?'OK':'Not Found'});
   }
   if (new URL(request.url()).hostname === '127.0.0.1') return route.continue();
   return route.abort();
  });
  await page.goto('http://127.0.0.1:8000/contact/');
  const form = page.locator('form[name="lora-contact"]');
  const fill = async name => {
   await form.locator('[name="name"]').fill(name);
   await form.locator('[name="email"]').fill('review@example.com');
   await form.locator('[name="interest"]').selectOption({label:'Launch Visuals'});
   await form.locator('[name="message"]').fill('I would like to commission an animation for our product launch.');
   await form.locator('[name="contact-consent"]').check();
  };
  await fill('Preview Reviewer');
  await form.locator('[type="submit"]').click();
  await assert.doesNotReject(()=>page.locator('#lora-form-status[data-state="success"]').waitFor());
  assert.equal(await page.locator('h2').first().count()>=0,true);
  assert.equal(page.url(), 'http://127.0.0.1:8000/contact/');
  assert.equal(submitted.length,1);
  assert.match(submitted[0].headers['content-type'], /application\/x-www-form-urlencoded/);
  assert.match(submitted[0].body, /form-name=lora-contact/);
  assert.match(submitted[0].body, /name=Preview\+Reviewer/);
  statusCode = 404;
  await fill('Second Reviewer');
  await form.locator('[type="submit"]').click();
  await page.locator('#lora-form-status[data-state="error"]').waitFor();
  assert.match(await page.locator('#lora-form-status').textContent(),/could not submit.*HTTP 404/);
  assert.equal(page.url(),'http://127.0.0.1:8000/contact/');
  assert.equal(await form.locator('[name="name"]').inputValue(),'Second Reviewer');
  assert.equal(submitted.length,2);
  console.log('PASS: encoded Netlify POST, inline success, inline HTTP 404 failure, retained form data, no navigation');
 } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
