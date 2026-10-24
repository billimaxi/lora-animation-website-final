// Run with Node.js and Playwright available: node tests/site.spec.cjs
// Start the static server first. No payments or form submissions are sent.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    headless: true, args: ['--no-sandbox']
  });
  try {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1'
      ? route.continue() : route.abort());
    assert.equal((await page.goto('http://127.0.0.1:8000/')).status(), 200);
    const plans = [
      ['Essential', 'bcocgfguehfr', '$150'],
      ['Growth', 'ynkttbsoqk4d', '$250'],
      ['Studio Retainer', 'aigfn8ttglc2', '$500']
    ];
    assert.equal(await page.locator('.subscribe').count(), 3);
    for (const [plan, slug, price] of plans) {
      const card = page.locator('.plans-grid article').filter({ has: page.getByRole('heading', { name: plan, exact: true }) });
      assert.ok((await card.locator('h4').textContent()).includes(price));
      assert.equal(await card.locator('.subscribe').getAttribute('href'), `https://flutterwave.com/pay/${slug}`);
      assert.equal(await card.locator('.subscribe').getAttribute('target'), '_blank');
      assert.ok((await card.locator('.subscribe').getAttribute('rel')).includes('noopener'));
    }
    // About Us replaces Founder in navigation; the founder stays near the bottom of the homepage.
    await page.goto('http://127.0.0.1:8000/');
    assert.equal(await page.locator('nav a[href="/about/"]').textContent(), 'About Us');
    assert.equal(await page.locator('nav a[href="/founder/"]').count(), 0);
    assert.equal(await page.locator('main > .founder#founder').count(), 1);
    assert.equal(await page.locator('#founder .founder-portrait img').getAttribute('src'), '/assets/abala-ibrahim-founder.png');
    assert.equal(await page.locator('main > section').last().getAttribute('id'), 'founder');
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      const portrait = await page.locator('#founder .founder-portrait img').boundingBox();
      assert.ok(portrait.width <= 285, 'Founder portrait is compact at ' + width);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow at ' + width);
    }
    await page.goto('http://127.0.0.1:8000/about/');
    assert.equal((await page.locator('h1').textContent()).includes('Good ideas deserve'), true);
    assert.equal(await page.locator('nav a[href="/about/"]').getAttribute('aria-current'), 'page');
    assert.equal(await page.locator('.about-pillars article').count(), 3);
    assert.equal(await page.locator('a[href="/#founder"]').count(), 1);
    await page.goto('http://127.0.0.1:8000/founder/');
    assert.equal(await page.locator('.founder-portrait img').count(), 1);
    await page.goto('http://127.0.0.1:8000/contact/');
    const form = page.locator('form[name="lora-contact"]');
    for (const [attribute, value] of Object.entries({ method: 'POST', 'data-netlify': 'true', 'netlify-honeypot': 'bot-field', action: '/success' })) {
      assert.equal(await form.getAttribute(attribute), value);
    }
    assert.equal(await form.locator('[name="form-name"]').inputValue(), 'lora-contact');
    assert.equal(await form.locator('[name="bot-field"]').count(), 1);
    assert.equal(await form.evaluate(el => el.checkValidity()), false);
    await form.locator('[name="name"]').fill('Review Client');
    await form.locator('[name="email"]').fill('invalid');
    assert.equal(await form.locator('[name="email"]').evaluate(el => el.checkValidity()), false);
    await form.locator('[name="email"]').fill('review@example.com');
    await form.locator('[name="interest"]').selectOption({ label: 'Launch Visuals' });
    await form.locator('[name="message"]').fill('A vertical launch video for our new product.');
    assert.equal(await form.evaluate(el => el.checkValidity()), false); // Consent required.
    await form.locator('[name="contact-consent"]').check();
    assert.equal(await form.evaluate(el => el.checkValidity()), true);
    await page.goto('http://127.0.0.1:8000/guides/');
    assert.equal(await page.locator('#learn article').count(), 3);
    await page.goto('http://127.0.0.1:8000/faq/');
    await page.locator('#faq summary').first().focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#faq details').first().getAttribute('open'), '');
    for (const width of [1440, 1024, 820, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Page overflow at ${width}`);
      assert.equal(await page.locator('.assistant-toggle, #lora-assistant').count(), 0);
      assert.equal(await page.locator('script[src^="https://code.tidio.co/"]').count(), 1);
    }
    await page.locator('.menu-toggle').click();
    assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'true');
    await page.locator('nav a[href="/guides/"]').click();
    assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'false');
    await page.waitForURL('**/guides/');
    assert.equal(await page.locator('nav a[href="/guides/"][aria-current="page"]').count(), 1);
    await page.goto('http://127.0.0.1:8000/');
    const title = await page.locator('#hero-slide-title').textContent();
    await page.locator('.hero-next').click();
    assert.notEqual(await page.locator('#hero-slide-title').textContent(), title);
    for (const path of ['styles.css', 'script.js', 'success.html', 'assets/lora-logo.jpeg', 'assets/abala-ibrahim-founder.png']) {
      assert.equal((await page.request.get(`http://127.0.0.1:8000/${path}`)).status(), 200);
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('http://127.0.0.1:8000/');
    await page.screenshot({ path: '/tmp/lora-desktop.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: '/tmp/lora-mobile.png', fullPage: true });
    assert.deepEqual(errors, []);
    console.log('PASS: payment mappings on homepage; Netlify contract and form validation; guides and keyboard FAQ; Tidio as sole chat widget; six viewport widths; mobile navigation; carousel; local assets. No runtime errors.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
