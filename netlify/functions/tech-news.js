'use strict';

// Pulls public publisher RSS feeds server-side. No user data, keys or cookies.
const FEEDS = [
  {url:'https://techcrunch.com/category/artificial-intelligence/feed/', source:'TECHCRUNCH AI'},
  {url:'https://www.theverge.com/rss/index.xml',source:'THE VERGE'}
];
const decode = str => str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1')
 .replace(/&#(\d+);/g, (_,n)=>String.fromCodePoint(Number(n)))
 .replace(/&#x([0-9a-f]+);/gi, (_,n)=>String.fromCodePoint(parseInt(n,16)))
 .replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&apos;/g,"'")
 .replace(/&lt;/g,'<').replace(/&gt;/g,'>');
function value(block,tag) {
 const match=block.match(new RegExp('<'+tag+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+tag+'>','i'));
 return match ? decode(match[1]).replace(/<[^>]+>/g,'').trim() : '';
}
async function load(feed) {
 const response=await fetch(feed.url,{headers:{'User-Agent':'LORA-Animations-News/1.0 (+https://loraanimations.online)','Accept':'application/rss+xml, application/xml, text/xml'}, signal:AbortSignal.timeout(5500)});
 if(!response.ok) throw new Error('Feed unavailable');
 const xml=await response.text();
 const blocks=xml.match(/<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi)||[];
 return blocks.slice(0,12).map(block=>({
  title:value(block,'title'),url:value(block,'link'),source:feed.source,date:value(block,'pubDate')
 })).filter(item=>item.title && /^https:\/\//.test(item.url));
}
exports.handler=async()=>{
 const results=await Promise.allSettled(FEEDS.map(load));
 const items=results.flatMap(r=>r.status==='fulfilled'?r.value:[]);
 const unique=[...new Map(items.map(x=>[x.url,x])).values()];
 unique.sort((a,b)=>Date.parse(b.date||0)-Date.parse(a.date||0));
 return {statusCode:200,headers:{'content-type':'application/json; charset=utf-8','cache-control':'public, max-age=900, s-maxage=1800','access-control-allow-origin':'https://loraanimations.online'},body:JSON.stringify({items:unique.slice(0,12)})};
};
