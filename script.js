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
// LORA Guide: preset question-and-answer flow; only explicit human handoff loads a chat UI.
const assistantToggle = document.querySelector('.assistant-toggle');
const assistantPanel = document.getElementById('lora-assistant');
const assistantClose = document.querySelector('.assistant-close');
const assistantAnswer = document.getElementById('assistant-answer');
const assistantTopics = {
  services: {
    question: 'What services does LORA offer?',
    answer: '<p>We create AI animation, promotional commercials, product and launch visuals, brand storytelling, and music-video or cultural animations.</p><a href="/services/">Explore our services →</a>'
  },
  plans: {
    question: 'How much do your plans cost?',
    answer: '<p>Essential: $150 USD/month for 4 AI videos monthly. Growth: $250 USD/month for up to 12 AI videos monthly. Studio Retainer: $500 USD/month for up to 16 AI videos monthly. Final deliverables, length and revisions are agreed with LORA.</p><a href="/plans/">See the full plans →</a>'
  },
  brief: {
    question: 'How do I start a project?',
    answer: '<p>Tell us about your business, who you want to reach, your goal, preferred video style, budget and target date. References are helpful, but you do not need a finished script.</p><a href="/guides/">Read our project guides →</a>'
  },
  payments: {
    question: 'How do subscriptions and payments work?',
    answer: '<p>Our Subscribe Now buttons open Flutterwave for monthly billing. Review the amount and payment terms before confirming. For changes, cancellations or payment concerns, contact the LORA team. The Guide cannot access accounts, take payment details or cancel a plan.</p><a href="/faq/">Read the payment FAQs →</a>'
  },
  contact: {
    question: 'How can I contact LORA?',
    answer: '<p>Send a project inquiry or speak to us directly. Please do not share passwords or card details here.</p><a href="/contact/">Send a project inquiry →</a><p>Email: <a href="mailto:info@loraanimations.online">info@loraanimations.online</a></p>'
  },
  support: {
    question: "I'd like to speak to a person",
    answer: '<p>Of course! Select <strong>Talk to LORA Support</strong> below. The live-chat window opens only when you choose it. If our team is offline, you can leave a message for a later reply.</p>'
  }
};
function setAssistantOpen(open) {
  if (!assistantPanel || !assistantToggle) return;
  assistantPanel.hidden = !open;
  assistantToggle.setAttribute('aria-expanded', String(open));
  if (open) assistantClose?.focus();
  else assistantToggle.focus();
}
assistantToggle?.addEventListener('click', () => setAssistantOpen(assistantPanel.hidden));
assistantClose?.addEventListener('click', () => setAssistantOpen(false));
assistantPanel?.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    event.stopPropagation();
    setAssistantOpen(false);
  }
});
assistantPanel?.querySelectorAll('[data-topic]').forEach(button => {
  button.addEventListener('click', () => {
    const topic = assistantTopics[button.dataset.topic];
    if (!topic || !assistantAnswer) return;
    const visitorBubble = document.createElement('div');
    visitorBubble.className = 'assistant-bubble assistant-bubble-visitor';
    const visitorTitle = document.createElement('span');
    visitorTitle.className = 'assistant-speaker';
    visitorTitle.textContent = 'YOUR QUESTION';
    const visitorText = document.createElement('p');
    visitorText.textContent = topic.question;
    visitorBubble.append(visitorTitle, visitorText);
    const guideBubble = document.createElement('div');
    guideBubble.className = 'assistant-bubble assistant-bubble-guide';
    const guideTitle = document.createElement('span');
    guideTitle.className = 'assistant-speaker';
    guideTitle.textContent = 'LORA GUIDE';
    const guideResponse = document.createElement('div');
    // These are author-controlled templates; no visitor-supplied HTML is inserted.
    guideResponse.innerHTML = topic.answer;
    guideBubble.append(guideTitle, guideResponse);
    assistantAnswer.replaceChildren(visitorBubble, guideBubble);
    const handoff = assistantPanel.querySelector('.assistant-handoff');
    if (handoff) handoff.hidden = false;
    assistantPanel.querySelectorAll('[data-topic]').forEach(option =>
      option.setAttribute('aria-pressed', String(option === button)));
  });
});

// One chat launcher: LORA Guide. The actual human chat is powered by Tidio
// only after the visitor explicitly selects the handoff.
(() => {
  if (!assistantPanel) return;
  const topics = assistantPanel.querySelector('.assistant-topics');
  if (!topics) return;
  const handoff = document.createElement('div');
  handoff.className = 'assistant-handoff';
  handoff.hidden = true; // Guide replies appear before the support handoff.
  handoff.innerHTML = '<span class="assistant-handoff-step">STEP 2 · HUMAN SUPPORT</span><p>Need more than a quick answer?</p><a class="assistant-human-link" href="https://wa.me/2349048200012?text=Hello%20LORA%2C%20I%20would%20like%20to%20speak%20with%20your%20team." target="_blank" rel="noopener noreferrer">Chat with LORA on WhatsApp ↗</a><small class="assistant-handoff-note">This opens WhatsApp if live chat is unavailable. A team member will reply when available.</small>';
  topics.insertAdjacentElement('afterend', handoff);
  const link = handoff.querySelector('.assistant-human-link');
  const note = handoff.querySelector('.assistant-handoff-note');
  const tidioIsReady = () => {
    const api = window.tidioChatApi;
    return Boolean(api && typeof api.open === 'function' &&
      typeof api.getStatus === 'function' && api.getStatus() !== null);
  };
  const updateHandoff = () => {
    if (!tidioIsReady()) {
      link.textContent = 'Chat with LORA on WhatsApp ↗';
      note.textContent = 'Live chat is loading or unavailable. WhatsApp opens in a new tab and our team will reply when available.';
      return;
    }
    link.textContent = 'Talk to LORA Support ↗';
    link.setAttribute('aria-label', 'Open LORA live support chat');
    const available = window.tidioChatApi.getStatus() === 'online';
    note.textContent = available
      ? 'Team members are currently online. This will open the live-support chat.'
      : 'Our team may be offline. Open the support chat to leave a message for a later reply.';
  };
  link.addEventListener('click', event => {
    if (!tidioIsReady()) return; // Preserve the working WhatsApp fallback.
    event.preventDefault();
    setAssistantOpen(false);
    const api = window.tidioChatApi;
    if (typeof api.show === 'function') api.show();
    api.open();
  });
  // Hide Tidio's separate launcher: visitors should see only LORA Guide.
  let listenersAdded = false;
  const onTidioReady = () => {
    if (!tidioIsReady()) return;
    const api = window.tidioChatApi;
    if (typeof api.hide === 'function') api.hide();
    if (!listenersAdded && typeof api.on === 'function') {
      listenersAdded = true;
      api.on('close', () => {
        if (typeof api.hide === 'function') api.hide();
      });
      api.on('setStatus', updateHandoff);
    }
    updateHandoff();
  };
  if (tidioIsReady()) onTidioReady();
  else if (window.tidioChatApi?.on) window.tidioChatApi.on('ready', onTidioReady);
  else document.addEventListener('tidioChat-ready', onTidioReady);
  updateHandoff();
})();

assistantAnswer?.addEventListener('click', event => {
  const link = event.target.closest('a[href^="#"]');
  if (link) {
    setAssistantOpen(false);
    const target = document.querySelector(link.getAttribute('href'));
    if (target) { target.setAttribute('tabindex', '-1'); target.focus(); }
  }
});


// Reliable Netlify Forms submission: POST URL-encoded data to an existing static path.
// Show success/error on the same page so failed form processing never navigates to a 404.
// This still requires Form detection to be enabled in Netlify before deploying.
(() => {
  const form = document.querySelector('form[name="lora-contact"]');
  if (!form) return;
  const status = document.getElementById('lora-form-status');
  const submit = form.querySelector('button[type="submit"]');
  if (!status || !submit) return;
  const originalLabel = submit.textContent;
  let sending = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || !form.reportValidity()) return;
    sending = true;
    submit.disabled = true;
    submit.textContent = 'Sending inquiry…';
    status.hidden = false;
    status.dataset.state = 'pending';
    status.textContent = 'Sending your inquiry securely…';
    try {
      const data = new URLSearchParams(new FormData(form));
      // The form-name field identifies the registered Netlify form.
      if (data.get('form-name') !== 'lora-contact') throw new Error('Missing form name');
      // Send to a static file registered with Netlify form detection, avoiding
      // ambiguous root redirects and preview routing behavior.
      const response = await fetch('/__forms.html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: data.toString()
      });
      if (!response.ok) throw new Error('Netlify returned HTTP ' + response.status);
      status.dataset.state = 'success';
      status.textContent = 'Thank you! Your inquiry has been submitted. LORA will contact you using the details you provided.';
      form.reset();
      // Netlify stores the actual submission; the frontend stores no details.
    } catch (error) {
      status.dataset.state = 'error';
      const code = error.message.match(/HTTP \d{3}/)?.[0] || 'network or configuration error';
      status.textContent = 'We could not submit your inquiry (' + code + '). Please check that Netlify Forms detection is enabled and the lora-contact form is registered. Your details are still here. Alternatively, email info@loraanimations.online or WhatsApp +234 904 820 0012.';
    } finally {
      sending = false;
      submit.disabled = false;
      submit.textContent = originalLabel;
    }
  });
})();

// LORA Tech Radar: server-fetched articles; explicitly labeled publisher links on failure.
(() => {
 const root = document.getElementById('lora-news-ticker');
 if (!root) return;
 const get = id => document.getElementById(id);
 const title = get('news-headline'), read = get('news-read'), image = get('news-image');
 const source = get('news-source'), date = get('news-date'), count = get('news-count');
 const state = get('news-state'), status = get('news-status'), context = get('news-context');
 const slide = get('news-slide'), pause = get('news-pause');
 const fallbackImage = '/assets/tech-radar-fallback.svg';
 const fallback = [
  { title: 'Explore artificial intelligence coverage', url: 'https://techcrunch.com/category/artificial-intelligence/', source: 'TechCrunch AI' },
  { title: 'Discover technology and AI reporting', url: 'https://www.theverge.com/ai-artificial-intelligence', source: 'The Verge' },
  { title: 'Browse AI research and technology stories', url: 'https://arstechnica.com/ai/', source: 'Ars Technica' }
 ];
 const safeUrl = value => {
  try {
   const url = new URL(value);
   return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
 };
 let items = fallback, current = 0, live = false, timer = null;
 let paused = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 let hovering = false, focused = false;
 function canRotate() { return !paused && !hovering && !focused && !document.hidden && items.length > 1; }
 function schedule() {
  clearTimeout(timer);
  timer = canRotate() ? setTimeout(() => { show(current + 1); schedule(); }, 7000) : null;
  pause.textContent = paused ? 'Play' : 'Pause';
  pause.setAttribute('aria-pressed', String(paused));
  pause.setAttribute('aria-label', paused ? 'Play news slideshow' : 'Pause news slideshow');
  slide.setAttribute('aria-live', canRotate() ? 'off' : 'polite');
  status.textContent = (live ? 'Publisher headlines' : 'Live feed unavailable · Curated publisher links') +
   (canRotate() ? ' · Rotating every 7 seconds' : ' · Slideshow paused');
 }
 function show(index) {
  current = (index + items.length) % items.length;
  const item = items[current];
  title.textContent = item.title;
  title.href = read.href = item.url;
  source.textContent = item.source;
  read.textContent = live ? 'Read Story ↗' : 'Explore publisher ↗';
  read.setAttribute('aria-label', (live ? 'Read story: ' : 'Explore publisher: ') + item.title + ' (opens in a new tab)');
  context.textContent = live ? 'Reporting from ' + item.source + '. Read the full story on the original publisher’s website.' :
   'A curated publisher link, not a live headline. Browse the source’s latest reporting.';
  const published = item.date && new Date(item.date);
  date.hidden = !published || !Number.isFinite(published.getTime());
  if (!date.hidden) {
   date.dateTime = published.toISOString();
   date.textContent = published.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
  } else { date.removeAttribute('datetime'); date.textContent = ''; }
  image.alt = live && item.image ? 'Article image from ' + item.source + ': ' + item.title : 'LORA Tech Radar — AI and technology';
  image.src = live && item.image ? item.image : fallbackImage;
  count.textContent = String(current + 1).padStart(2, '0') + ' / ' + String(items.length).padStart(2, '0');
  slide.setAttribute('aria-label', (current + 1) + ' of ' + items.length);
  slide.classList.remove('news-slide-enter');
  void slide.offsetWidth;
  slide.classList.add('news-slide-enter');
 }
 image.addEventListener('error', () => {
  // No retry loop if the local fallback itself is unavailable.
  if (image.getAttribute('src') !== fallbackImage) {
   image.alt = 'LORA Tech Radar — AI and technology';
   image.src = fallbackImage;
  }
 });
 get('news-prev').addEventListener('click', () => { show(current - 1); schedule(); });
 get('news-next').addEventListener('click', () => { show(current + 1); schedule(); });
 pause.addEventListener('click', () => {
  paused = !paused;
  // Explicit Play can start rotation while this button retains keyboard focus.
  if (!paused) focused = hovering = false;
  schedule();
 });
 root.addEventListener('mouseenter', () => { hovering = true; schedule(); });
 root.addEventListener('mouseleave', () => { hovering = false; schedule(); });
 root.addEventListener('focusin', () => { focused = true; schedule(); });
 root.addEventListener('focusout', event => { if (!root.contains(event.relatedTarget)) { focused = false; schedule(); } });
 document.addEventListener('visibilitychange', schedule);
 show(0); schedule();
 const controller = new AbortController();
 const timeout = setTimeout(() => controller.abort(), 8000);
 fetch('/.netlify/functions/tech-news', { headers: { Accept: 'application/json' }, signal: controller.signal })
  .then(response => { if (!response.ok) throw new Error('Feed unavailable'); return response.json(); })
  .then(data => {
   if (!Array.isArray(data.items)) return;
   const fresh = data.items.filter(item => item && typeof item.title === 'string' && item.title.trim() &&
    safeUrl(item.url) && typeof item.source === 'string' && item.source.trim()).slice(0, 12)
    .map(item => ({ ...item, url: safeUrl(item.url), image: safeUrl(item.image) }));
   if (!fresh.length) return;
   items = fresh; live = true;
   state.textContent = 'PUBLISHER HEADLINES';
   show(0); schedule();
  }).catch(() => { /* The useful, clearly labeled publisher carousel is already displayed. */ })
  .finally(() => clearTimeout(timeout));
})();
