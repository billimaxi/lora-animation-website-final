const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const base = 'http://127.0.0.1:8000';
// Deliberately labeled test-only content; never shipped as public headlines.
const items = [
  { title: 'Browser test fixture one', source: 'TechCrunch AI', url: 'https://techcrunch.com/test-one', date: '2026-10-23T10:00:00Z', image: 'https://images.example.com/valid.svg' },
  { title: 'Browser test fixture two', source: 'The Verge', url: 'https://www.theverge.com/test-two', date: null, image: null },
  { title: 'Browser test fixture three', source: 'Ars Technica', url: 'https://arstechnica.com/test-three', date: '2026-10-22T10:00:00Z', image: 'https://images.example.com/broken.jpg' }
];
(async () => {
 const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
 try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  let mode = 'live';
  await page.route('**/*', async route => {
   const url = route.request().url();
   if (url.endsWith('/.netlify/functions/tech-news')) return route.fulfill({ status: mode === 'failure' ? 503 : 200, contentType: 'application/json', body: JSON.stringify({ items: mode === 'empty' ? [] : items }) });
   if (url.endsWith('/valid.svg')) return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="640"><path fill="#254333" d="M0 0h960v640H0z"/></svg>' });
   if (url.startsWith(base)) return route.continue();
   return route.abort();
  });
  await page.clock.install();
  await page.goto(base);
  await page.waitForFunction(() => document.getElementById('news-state').textContent === 'PUBLISHER HEADLINES');
  const headline = page.locator('#news-headline');
  assert.equal(await headline.textContent(), items[0].title);
  assert.equal(await page.locator('#news-date').getAttribute('datetime'), items[0].date.replace('Z', '.000Z'));
  assert.equal(await page.locator('#news-image').getAttribute('src'), items[0].image);
  assert.equal(await page.locator('#news-read').getAttribute('href'), items[0].url);
  assert.equal(await page.locator('#news-read').getAttribute('target'), '_blank');
  assert.equal(await page.locator('#news-read').getAttribute('rel'), 'noopener noreferrer');
  await page.clock.fastForward(7001);
  assert.equal(await headline.textContent(), items[1].title);
  assert.equal(await page.locator('#news-date').isVisible(), false);
  assert.equal(await page.locator('#news-image').getAttribute('src'), '/assets/tech-radar-fallback.svg');
  await page.locator('#news-next').click();
  await page.waitForFunction(() => document.getElementById('news-image').getAttribute('src') === '/assets/tech-radar-fallback.svg');
  assert.equal(await headline.textContent(), items[2].title);
  assert.equal(await page.locator('#news-count').textContent(), '03 / 03');
  // Previous, pause, resume and timer restart with explicit Play.
  await page.locator('#news-prev').click();
  assert.equal(await headline.textContent(), items[1].title);
  await page.locator('#news-pause').click();
  await page.mouse.move(0, 0);
  await page.clock.fastForward(15000);
  assert.equal(await headline.textContent(), items[1].title);
  await page.locator('#news-pause').click();
  await page.mouse.move(0, 0);
  await page.clock.fastForward(7001);
  assert.equal(await headline.textContent(), items[2].title);
  // Focus pauses rotation, even when the visitor isn't hovering.
  await headline.focus();
  await page.clock.fastForward(15000);
  assert.equal(await headline.textContent(), items[2].title);
  for (const width of [1440, 1024, 768, 390, 320]) {
   await page.setViewportSize({ width, height: 900 });
   assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${width}`);
   assert.equal(await page.locator('#news-read').isVisible(), true);
   const hero = await page.locator('.hero').boundingBox(), radar = await page.locator('#lora-news-ticker').boundingBox();
   assert.ok(radar.y >= hero.y + hero.height - 1);
   assert.equal(await page.locator('#plans').count(), 1);
   assert.equal(await page.locator('#work').count(), 1);
  }
  mode = 'failure';
  await page.goto(base);
  await page.waitForFunction(() => document.getElementById('news-status').textContent.includes('Curated publisher links'));
  assert.equal(await page.locator('#news-read').textContent(), 'Explore publisher ↗');
  assert.equal(await page.locator('#news-image').getAttribute('src'), '/assets/tech-radar-fallback.svg');
  const links = ['https://techcrunch.com/category/artificial-intelligence/', 'https://www.theverge.com/ai-artificial-intelligence', 'https://arstechnica.com/ai/'];
  for (const url of links) {
   assert.equal(await page.locator('#news-read').getAttribute('href'), url);
   await page.locator('#news-next').click();
  }
  await page.mouse.move(0, 0); await page.locator('#news-next').blur();
  await page.clock.fastForward(7001);
  assert.equal(await page.locator('#news-count').textContent(), '02 / 03');
  await page.locator('#lora-news-ticker').screenshot({ path: '/tmp/lora-radar-mobile.png' });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator('#lora-news-ticker').screenshot({ path: '/tmp/lora-radar-desktop.png' });
  mode = 'empty'; await page.goto(base);
  assert.equal(await page.locator('#news-read').textContent(), 'Explore publisher ↗');
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto(base);
  await page.clock.fastForward(15000);
  assert.equal(await page.locator('#news-count').textContent(), '01 / 03');
  assert.equal(await page.locator('#news-pause').getAttribute('aria-label'), 'Play news slideshow');
  assert.deepEqual(errors, []);
  console.log('PASS: live article rendering, image/date, 7-second autoplay, previous/next, pause/play, focus pause, missing/broken images, desktop/mobile geometry, feed failure/empty fallback, reduced motion and original article links.');
 } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
