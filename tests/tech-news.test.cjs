const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseFeed, getNews, FEEDS } = require('../netlify/functions/tech-news');
const now = Date.parse('2026-10-23T12:00:00Z');
const date = 'Fri, 23 Oct 2026 10:00:00 GMT';
const rss = body => `<rss xmlns:media="http://search.yahoo.com/mrss/" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel>${body}</channel></rss>`;
const item = (extra = '', link = 'https://techcrunch.com/test-story/') => `<item><title>Parser fixture &amp; safety</title><link>${link}</link><pubDate>${date}</pubDate>${extra}</item>`;
test('RSS titles, publisher, date and every supported image path', () => {
  for (const markup of [
    '<media:content url="https://images.example.com/photo.jpg" type="image/jpeg"/>',
    '<media:thumbnail url="https://images.example.com/photo.jpg"/>',
    '<enclosure url="https://images.example.com/photo.jpg" type="image/jpeg"/>',
    '<media:group><media:thumbnail url="https://images.example.com/photo.jpg"/></media:group>',
    '<content:encoded><![CDATA[<p><img src="https://images.example.com/photo.jpg"></p>]]></content:encoded>',
    '<description><![CDATA[<img alt="test" src="https://images.example.com/photo.jpg">]]></description>'
  ]) {
    const [story] = parseFeed(rss(item(markup)), FEEDS[0], now);
    assert.equal(story.title, 'Parser fixture & safety');
    assert.equal(story.source, 'TechCrunch AI');
    assert.equal(story.date, '2026-10-23T10:00:00.000Z');
    assert.equal(story.image, 'https://images.example.com/photo.jpg');
  }
});
test('Atom alternate links, XHTML-safe title and HTML content image', () => {
  const xml = `<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Atom fixture</title><link rel="self" href="https://www.theverge.com/feed/1"/><link rel="alternate" href="https://www.theverge.com/test-story"/><published>2026-10-22T12:00:00Z</published><content type="html">&lt;img src=&quot;https://cdn.example.com/photo.jpg&quot;&gt;</content></entry></feed>`;
  const [story] = parseFeed(xml, FEEDS[1], now);
  assert.equal(story.url, 'https://www.theverge.com/test-story');
  assert.equal(story.image, 'https://cdn.example.com/photo.jpg');
});
test('missing images/dates, relative image, video enclosure and unsafe URLs', () => {
  const [story] = parseFeed(rss(item('<enclosure type="video/mp4" url="https://example.com/movie.mp4"/>')), FEEDS[0], now);
  assert.equal(story.image, null);
  assert.equal(parseFeed(rss(item('<media:thumbnail url="/photo.jpg"/>')), FEEDS[0], now)[0].image, 'https://techcrunch.com/photo.jpg');
  for (const url of ['javascript:alert(1)', 'https://evil.example.com/', 'https://techcrunch.com@evil.com/', '']) {
    assert.deepEqual(parseFeed(rss(item('', url)), FEEDS[0], now), []);
  }
  assert.equal(parseFeed(rss(item('<media:content url="javascript:alert(1)"/>')), FEEDS[0], now)[0].image, null);
  const undated = rss('<item><title>No date fixture</title><link>https://techcrunch.com/no-date</link></item>');
  assert.equal(parseFeed(undated, FEEDS[0], now)[0].date, null);
});
test('rejects stale, future-dated, invalid XML and DTD/entity input', () => {
  assert.deepEqual(parseFeed(rss(item()).replace(date, 'Fri, 01 Jan 2021 10:00:00 GMT'), FEEDS[0], now), []);
  assert.deepEqual(parseFeed(rss(item()).replace(date, 'Fri, 01 Jan 2027 10:00:00 GMT'), FEEDS[0], now), []);
  assert.throws(() => parseFeed('<rss><broken></rss>', FEEDS[0], now));
  assert.throws(() => parseFeed('<!DOCTYPE rss [<!ENTITY x "bad">]><rss/>', FEEDS[0], now));
});
test('partial publisher failure, deduplication and newest-first sorting', async () => {
  const result = await getNews(async url => {
    if (url.includes('theverge')) throw new Error('Offline');
    if (url.includes('arstechnica')) return new Response(rss(item('', 'https://arstechnica.com/test-story').replace(date, 'Fri, 23 Oct 2026 11:00:00 GMT')));
    return new Response(rss(item() + item()));
  }, now);
  assert.equal(result.items.length, 2);
  assert.equal(result.items[0].source, 'Ars Technica');
});
test('all publishers down, malformed and oversized feeds gracefully return no stories', async () => {
  assert.deepEqual(await getNews(async () => { throw new Error('Offline'); }, now), { items: [] });
  assert.deepEqual(await getNews(async () => new Response('not xml'), now), { items: [] });
  assert.deepEqual(await getNews(async () => new Response('x', { headers: { 'content-length': '3000000' } }), now), { items: [] });
});
