'use strict';

const { XMLParser, XMLValidator } = require('fast-xml-parser');
// Fixed public endpoints only: callers cannot supply URLs or credentials.
const FEEDS = [
  { url: 'https://techcrunch.com/category/artificial-intelligence/feed/', source: 'TechCrunch AI', host: 'techcrunch.com' },
  { url: 'https://www.theverge.com/rss/index.xml', source: 'The Verge', host: 'theverge.com' },
  { url: 'https://feeds.arstechnica.com/arstechnica/index', source: 'Ars Technica', host: 'arstechnica.com' }
];
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', parseTagValue: false, processEntities: true });
const array = value => value == null ? [] : Array.isArray(value) ? value : [value];
const text = value => typeof value === 'string' ? value : value?.['#text'] || '';
const plain = value => text(value).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
function httpsUrl(value, base) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value, base);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}
function imageFrom(item, base) {
  const candidates = [];
  const collect = node => {
    for (const media of array(node)) {
      if (!media || typeof media !== 'object') continue;
      const type = media['@_type'] || '';
      if (!type || type.startsWith('image/')) candidates.push(media['@_url']);
    }
  };
  collect(item['media:content']); collect(item['media:thumbnail']);
  for (const group of array(item['media:group'])) {
    collect(group['media:content']); collect(group['media:thumbnail']);
  }
  for (const enclosure of array(item.enclosure)) {
    if (/^image\//i.test(enclosure['@_type'] || '')) candidates.push(enclosure['@_url']);
  }
  for (const link of array(item.link)) {
    if (link?.['@_rel'] === 'enclosure' && /^image\//i.test(link['@_type'] || '')) candidates.push(link['@_href']);
  }
  for (const content of [item['content:encoded'], item.content, item.description, item.summary]) {
    // Extract URLs only. Feed HTML is never returned or inserted into the DOM.
    for (const match of text(content).matchAll(/<img\b[^>]*?\bsrc\s*=\s*(["'])(.*?)\1/gi)) {
      candidates.push(match[2].replace(/&amp;/g, '&'));
    }
  }
  return candidates.map(value => value && httpsUrl(value, base)).find(Boolean) || null;
}
function parseFeed(xml, feed, now = Date.now()) {
  // Do not process DTD/entity declarations from remote documents.
  if (/<!DOCTYPE|<!ENTITY/i.test(xml) || XMLValidator.validate(xml) !== true) throw new Error('Invalid feed');
  const document = parser.parse(xml);
  const entries = document.rss?.channel?.item || document.feed?.entry;
  return array(entries).slice(0, 40).flatMap(item => {
    const title = plain(item.title).slice(0, 400);
    const alternate = array(item.link).find(link => typeof link === 'object' && (!link['@_rel'] || link['@_rel'] === 'alternate'));
    const url = httpsUrl(alternate?.['@_href'] || text(item.link), feed.url);
    if (!title || !url) return [];
    const host = new URL(url).hostname;
    if (host !== feed.host && !host.endsWith('.' + feed.host)) return [];
    const timestamp = Date.parse(text(item.pubDate || item.published || item.updated));
    // Only dated recent stories are promoted as live news; undated entries remain supported.
    if (Number.isFinite(timestamp) && (timestamp < now - 30 * 86400000 || timestamp > now + 86400000)) return [];
    return [{ title, url, source: feed.source, date: Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null, image: imageFrom(item, url) }];
  });
}
async function load(feed, fetcher, now) {
  const response = await fetcher(feed.url, {
    headers: { 'User-Agent': 'LORA-Animations-News/2.0 (+https://loraanimations.online)', Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml' },
    signal: AbortSignal.timeout(5000)
  });
  if (!response.ok) throw new Error('Publisher unavailable');
  if (Number(response.headers.get('content-length')) > 2_000_000) throw new Error('Feed too large');
  // Stream with a bound so a bad endpoint cannot exhaust function memory.
  let xml = '', size = 0;
  const decoder = new TextDecoder();
  for await (const chunk of response.body) {
    size += chunk.byteLength;
    if (size > 2_000_000) throw new Error('Feed too large');
    xml += decoder.decode(chunk, { stream: true });
  }
  xml += decoder.decode();
  return parseFeed(xml, feed, now);
}
async function getNews(fetcher = fetch, now = Date.now()) {
  const results = await Promise.allSettled(FEEDS.map(feed => load(feed, fetcher, now)));
  const unique = [...new Map(results.flatMap(result => result.status === 'fulfilled' ? result.value : []).map(item => [item.url, item])).values()];
  unique.sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0));
  return { items: unique.slice(0, 12) };
}
exports.handler = async () => ({
  statusCode: 200,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=300, s-maxage=900' },
  body: JSON.stringify(await getNews())
});
// Exported pure parsing/loading helpers for fixture tests (not additional endpoints).
exports.parseFeed = parseFeed;
exports.getNews = getNews;
exports.FEEDS = FEEDS;
