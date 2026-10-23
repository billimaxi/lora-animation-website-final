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

// AI & Tech news ticker. Headlines are loaded from a Netlify server-side RSS proxy;
// no unverified or invented "latest" headlines are presented.
(() => {
  const bar = document.getElementById('lora-news-ticker');
  if (!bar) return;
  const title = document.getElementById('news-headline');
  const source = document.getElementById('news-source');
  const previous = document.getElementById('news-prev');
  const next = document.getElementById('news-next');
  const close = document.getElementById('news-close');
  let headlines = [];
  let current = 0;
  let rotation;
  if (sessionStorage.getItem('lora-news-hidden') === '1') { bar.hidden = true; return; }
  function show(index) {
    if (!headlines.length) return;
    current = (index + headlines.length) % headlines.length;
    const story = headlines[current];
    title.textContent = story.title + ' ↗';
    title.href = story.url;
    source.textContent = story.source;
  }
  function rotate() {
    if (rotation) clearInterval(rotation);
    if (headlines.length > 1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      rotation = setInterval(() => show(current + 1), 8500);
    }
  }
  previous?.addEventListener('click', () => { show(current - 1); rotate(); });
  next?.addEventListener('click', () => { show(current + 1); rotate(); });
  close?.addEventListener('click', () => { bar.hidden = true; clearInterval(rotation); sessionStorage.setItem('lora-news-hidden','1'); });
  fetch('/.netlify/functions/tech-news', {headers:{Accept:'application/json'}, signal:AbortSignal.timeout(9000)})
    .then(response => {if (!response.ok) throw new Error('News feed unavailable');return response.json();})
    .then(data => {
      if (!Array.isArray(data.items)) return;
      headlines = data.items.filter(item => item && typeof item.title === 'string' && /^https:\/\//.test(item.url) && typeof item.source === 'string').slice(0,12);
      if(headlines.length) { show(0); rotate(); }
    })
    .catch(() => {source.textContent = 'AI & TECH'; /* Keep the explicit topic link as a graceful fallback. */});
})();
