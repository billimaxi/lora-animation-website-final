const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const pagePaths = [{"file":"index.html","url":"/"},{"file":"services/index.html","url":"/services/"},{"file":"plans/index.html","url":"/plans/"},{"file":"work/index.html","url":"/work/"},{"file":"work/dees-bite-cakes/index.html","url":"/work/dees-bite-cakes/"},{"file":"about/index.html","url":"/about/"},{"file":"contact/index.html","url":"/contact/"},{"file":"guides/index.html","url":"/guides/"},{"file":"faq/index.html","url":"/faq/"}];
const base='https://loraanimations.online';
test('SEO: unique descriptive titles, descriptions, canonical URLs and h1',()=>{
 const titles=new Set();
 for(const item of pagePaths){
  const html=fs.readFileSync(path.join(root,item.file),'utf8');
  const title=html.match(/<title>([^<]+)<\/title>/)?.[1];
  const description=html.match(/<meta name="description" content="([^"]+)"/)?.[1];
  assert.ok(title && title.length>30 && title.length<78, item.file+' title');
  assert.ok(description && description.length>90 && description.length<190, item.file+' description');
  assert.ok(!titles.has(title),item.file+' title must be unique');titles.add(title);
  assert.ok(html.includes('<link rel="canonical" href="'+base+item.url+'">'),item.file+' canonical');
  assert.ok(html.includes('<meta property="og:url" content="'+base+item.url+'">'),item.file+' social URL');
  assert.ok(html.includes('<meta property="og:image"'),item.file+' social image');
  assert.ok(html.includes('name="twitter:card"'),item.file+' twitter card');
  const main=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1];
  assert.ok(main && (main.match(/<h1\b/g)||[]).length===1,item.file+' must have one main h1');
  assert.ok(!html.includes('name="robots" content="noindex'),item.file+' should be indexable');
 }
});
test('SEO: crawl files enumerate only relevant pages',()=>{
 const xml=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
 const robots=fs.readFileSync(path.join(root,'robots.txt'),'utf8');
 const entries=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1]);
 assert.deepEqual(entries,pagePaths.map(x=>base+x.url));
 assert.match(robots,/Sitemap: https:\/\/loraanimations\.online\/sitemap\.xml/);
 assert.ok(!entries.some(x=>x.includes('/founder/')||x.includes('/success')));
 for(const p of ['founder/index.html','success.html','__forms.html']){
  assert.match(fs.readFileSync(path.join(root,p),'utf8'),/name="robots" content="noindex,(?:follow|nofollow)"/,p);
 }
});
test('SEO: organization metadata accurately identifies LORA',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const str=html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
 assert.ok(str,'organization JSON-LD present');
 const data=JSON.parse(str);
 const org=data['@graph'].find(x=>x['@type']==='Organization');
 assert.equal(org.name,'LORA Animations');
 assert.equal(org.url,base+'/');
 assert.equal(org.telephone,'+2349048200012');
 assert.ok(Array.isArray(org.sameAs));
});

test('Case study has a public video, internal CTA, Tidio and portfolio link',()=>{
 const listing=fs.readFileSync(path.join(root,'work/index.html'),'utf8');
 const html=fs.readFileSync(path.join(root,'work/dees-bite-cakes/index.html'),'utf8');
 assert.ok(listing.includes('href="/work/dees-bite-cakes/"'));
 assert.ok(html.includes('youtube.com/embed/n64X16gVrXE'));
 assert.ok(html.includes('href="/contact/"'));
 assert.ok(html.includes('href="/services/"'));
 assert.ok(html.includes('code.tidio.co/9hmxhxqgu4ngeksux6hsezml5klhmyap.js'));
 assert.ok(!html.includes('guaranteed sales'));
});

test('LORA global positioning is exact and visible, with existing integrations preserved',()=>{
 const tagline='LORA Animations — An African-born creative studio producing AI-powered video advertising, animation, and brand storytelling for businesses worldwide.';
 for(const path of ['index.html','about/index.html']){
  const html=fs.readFileSync(require('node:path').join(root,path),'utf8');
  assert.ok(html.includes('<p class="lead">'+tagline+'</p>')||html.includes('<p class="lead small">'+tagline+'</p>'),path+' global positioning is in visible lead');
  assert.ok(html.includes('name="description" content="'+tagline+'"'),path+' metadata global positioning');
  assert.ok(html.includes('code.tidio.co/9hmxhxqgu4ngeksux6hsezml5klhmyap.js'),path+' Tidio retained');
 }
 const home=fs.readFileSync(require('node:path').join(root,'index.html'),'utf8');
 assert.ok(home.includes('flutterwave.com/pay/bcocgfguehfr'),'Essential checkout retained');
 assert.ok(home.includes('flutterwave.com/pay/ynkttbsoqk4d'),'Growth checkout retained');
 assert.ok(home.includes('flutterwave.com/pay/aigfn8ttglc2'),'Studio checkout retained');
 assert.ok(home.includes('data-inline-video="Sq4zTReSyBY"'),'portfolio player retained');
 const contact=fs.readFileSync(require('node:path').join(root,'contact/index.html'),'utf8');
 assert.ok(contact.includes('form name="lora-contact"'),'Netlify contact form retained');
});
