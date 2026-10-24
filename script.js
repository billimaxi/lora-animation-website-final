const menu=document.querySelector(".menu-toggle"),nav=document.querySelector("nav");
menu?.addEventListener("click",()=>{
  menu.setAttribute("aria-expanded", String(nav.classList.toggle("open")));
});
nav?.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{
  nav.classList.remove("open");
  menu.setAttribute("aria-expanded", "false");
}));
if(document.getElementById("year")) document.getElementById("year").textContent=new Date().getFullYear();

document.querySelectorAll("[data-plan]").forEach(a=>a.addEventListener("click",()=>{
  const interest=document.getElementById("interest");
  const planMap={
    "Essential":"Essential Plan — $150/month",
    "Growth":"Growth Plan — $250/month",
    "Studio Retainer":"Studio Retainer — $500/month"
  };
  if (interest) interest.value=planMap[a.dataset.plan] || "";
  const m=document.getElementById("message");
  if(m && !m.value)m.value="I'd like to discuss the "+a.dataset.plan+" plan.";
}));

const motionSlides=document.querySelectorAll(".motion-slide");
const motionDots=document.querySelectorAll(".motion-dots span");
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if(motionSlides.length && !reduceMotion){
  let motionIndex=0;
  setInterval(()=>{
    motionSlides[motionIndex].classList.remove("active");
    if(motionDots[motionIndex]) motionDots[motionIndex].classList.remove("active");
    motionIndex=(motionIndex+1)%motionSlides.length;
    motionSlides[motionIndex].classList.add("active");
    if(motionDots[motionIndex]) motionDots[motionIndex].classList.add("active");
  },3500);
}

// Hero reel: alternate featured videos every five seconds.
const heroSlides=[...document.querySelectorAll('.hero-slide')];
if(heroSlides.length>1){
  let heroIndex=0;
  const title=document.getElementById('hero-slide-title');
  const count=document.querySelector('.hero-slide-count');
  function showHeroSlide(next){
    heroIndex=(next+heroSlides.length)%heroSlides.length;
    heroSlides.forEach((slide,i)=>slide.classList.toggle('active',i===heroIndex));
    if(title) title.textContent=heroSlides[heroIndex].dataset.title;
    if(count) count.textContent=`0${heroIndex+1} / 0${heroSlides.length}`;
  }
  document.querySelector('.hero-next')?.addEventListener('click',()=>showHeroSlide(heroIndex+1));
  document.querySelector('.hero-prev')?.addEventListener('click',()=>showHeroSlide(heroIndex-1));
  if (!reduceMotion) setInterval(()=>showHeroSlide(heroIndex+1),5000);
}


// Local, rule-based guidance only. No API, free-text collection or storage.
const assistantToggle = document.querySelector('.assistant-toggle');
const assistantPanel = document.getElementById('lora-assistant');
const assistantClose = document.querySelector('.assistant-close');
const assistantAnswer = document.getElementById('assistant-answer');
const assistantTopics = {
  services: '<p>LORA creates launch visuals, sales and promotional content, brand stories, music-video visuals and cultural animation.</p><a href="/services/">Explore services →</a>',
  plans: '<p>Essential: $150 USD/month, 4 AI videos per month. Growth: $250 USD/month, 3 per week (up to 12/month). Studio Retainer: $500 USD/month, 4 per week (up to 16/month). Agree length, revisions and scheduling with LORA before subscribing.</p><a href="/plans/">Compare packages and subscription options →</a>',
  brief: '<p>Share your audience, goal, video formats, brand assets, reference links, budget and deadline. You do not need a finished script to start.</p><a href="/guides/">Read the beginner guides →</a>',
  payments: '<p>Subscription buttons open Flutterwave. Review its billing terms before paying. For cancellations, changes or payment issues, contact LORA with your transaction reference. This guide cannot access accounts, take payments or cancel subscriptions.</p><a href="/faq/">Read payment and cancellation FAQs →</a>',
  contact: '<p>Ready to discuss a project? Send a brief or contact the team directly. Never share passwords or card details.</p><a href="/contact/">Project inquiry form →</a><p><a href="mailto:info@loraanimations.online">Email LORA</a> · <a href="https://wa.me/2349048200012" target="_blank" rel="noopener noreferrer">WhatsApp LORA ↗</a></p>'
};
function setAssistantOpen(open) {
  assistantPanel.hidden = !open;
  assistantToggle.setAttribute('aria-expanded', String(open));
  if (open) assistantClose.focus();
  else assistantToggle.focus();
}
assistantToggle?.addEventListener('click', () => setAssistantOpen(assistantPanel.hidden));
assistantClose?.addEventListener('click', () => setAssistantOpen(false));
assistantPanel?.addEventListener('keydown', event => {
  if (event.key === 'Escape') setAssistantOpen(false);
});
assistantPanel?.querySelectorAll('[data-topic]').forEach(button => {
  button.addEventListener('click', () => {
    // Only author-controlled templates are rendered; no visitor input is interpolated.
    assistantAnswer.innerHTML = assistantTopics[button.dataset.topic];
  });
});
assistantAnswer?.addEventListener('click', event => {
  const link = event.target.closest('a[href^="#"]');
  if (link) {
    setAssistantOpen(false);
    const target = document.querySelector(link.getAttribute('href'));
    if(target){target.setAttribute('tabindex', '-1');target.focus();}
  }
});

// LORA Tech Radar: visible carousel. Rotates source-discovery slides even when
// publisher RSS feeds are blocked or temporarily unavailable. Never invent headlines.
(() => {
 const root=document.getElementById('lora-news-ticker');
 if(!root)return;
 const title=document.getElementById('news-headline'),read=document.getElementById('news-read');
 const source=document.getElementById('news-source'),count=document.getElementById('news-count');
 const state=document.getElementById('news-state'),status=document.getElementById('news-status');
 const progress=document.getElementById('news-progress');
 const previous=document.getElementById('news-prev'),next=document.getElementById('news-next');
 const pause=document.getElementById('news-pause');
 // Explicitly labeled source links, not presented as current headlines.
 const fallback=[
  {title:'Explore the latest artificial intelligence coverage',url:'https://techcrunch.com/category/artificial-intelligence/',source:'TECHCRUNCH · EXPLORE'},
  {title:'Discover technology and AI reporting',url:'https://www.theverge.com/ai-artificial-intelligence',source:'THE VERGE · EXPLORE'},
  {title:'Browse research and science technology stories',url:'https://arstechnica.com/ai/',source:'ARS TECHNICA · EXPLORE'}
 ];
 let items=fallback,current=0,paused=false,timer=null;
 const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 function show(n){
  current=(n+items.length)%items.length;
  const item=items[current];
  title.textContent=item.title+' ↗';title.href=item.url;
  read.href=item.url; source.textContent=item.source;
  count.textContent=String(current+1).padStart(2,'0')+' / '+String(items.length).padStart(2,'0');
  root.classList.remove('news-slide-enter');void root.offsetWidth;root.classList.add('news-slide-enter');
  if(progress){progress.style.animation='none';void progress.offsetWidth;progress.style.animation=(!paused&&!reduceMotion)?'loraNewsProgress 7s linear forwards':'none';}
 }
 function schedule(){
  if(timer)clearInterval(timer);
  if(!paused&&!reduceMotion&&items.length>1) timer=setInterval(()=>show(current+1),7000);
 }
 previous?.addEventListener('click',()=>{show(current-1);schedule();});
 next?.addEventListener('click',()=>{show(current+1);schedule();});
 pause?.addEventListener('click',()=>{
  paused=!paused;pause.textContent=paused?'▶':'Ⅱ';
  pause.setAttribute('aria-pressed',String(paused));
  pause.setAttribute('aria-label',paused?'Play news slideshow':'Pause news slideshow');
  status.textContent=paused?'Slideshow paused':(state.dataset.live?'Fresh publisher headlines':'Explore technology sources');
  show(current);schedule();
 });
 root.addEventListener('mouseenter',()=>{if(timer)clearInterval(timer);});
 root.addEventListener('mouseleave',schedule);
 root.addEventListener('focusin',()=>{if(timer)clearInterval(timer);});
 root.addEventListener('focusout',e=>{if(!root.contains(e.relatedTarget))schedule();});
 // Show useful rotating links immediately while the RSS function loads.
 show(0);schedule();
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),8000);
 fetch('/.netlify/functions/tech-news',{headers:{Accept:'application/json'},signal:controller.signal})
  .then(r=>{if(!r.ok)throw new Error('Feed unavailable');return r.json();})
  .then(data=>{
   if(!Array.isArray(data.items))return;
   const fresh=data.items.filter(item=>item&&typeof item.title==='string'&&item.title.length>8&&/^https:\/\//.test(item.url)&&typeof item.source==='string').slice(0,12);
   if(!fresh.length)return;
   items=fresh;current=0;state.textContent='PUBLISHER HEADLINES';state.dataset.live='1';
   status.textContent='Headlines from external publishers · Open original story';
   show(0);schedule();
  }).catch(()=>{state.textContent='EXPLORE TECH NEWS';status.textContent='Live feed temporarily unavailable · Browse publisher links';})
  .finally(()=>clearTimeout(timeout));
})();