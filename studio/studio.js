(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const names = { brand: 'Brand Ad Adviser', brief: 'Creative Brief Assistant', learn: 'AI Video Learning Coach' };
  const intros = {
    brand: 'Hello! Tell me about your business and what you want your video to achieve. I can suggest a practical concept.',
    brief: 'Let’s shape your idea into a workable creative brief. What are you promoting, and who is it for?',
    learn: 'Welcome! Ask me how to plan, produce or improve an AI-powered video with responsible creative direction.'
  };
  const examples = {
    brand: ['Suggest a 20-second Instagram ad for a small skincare brand.', 'What should a startup include in a brand introduction video?'],
    brief: ['Create a brief for a 30-second restaurant commercial.', 'What information do you need before producing a music video?'],
    learn: ['Explain how to storyboard a 20-second advert.', 'How can I keep a character consistent in AI animation?']
  };
  let mode = 'brand';
  let conversation = [];
  let running = false;
  const chatLog = $('studio-messages');
  const input = $('studio-question');
  const feedback = $('studio-feedback');
  const submit = $('studio-send');
  function appendMessage(role, message) {
    const el = document.createElement('div');
    el.className = 'studio-message ' + role;
    const label = document.createElement('strong');
    label.textContent = role === 'user' ? 'YOU' : 'LORA AI';
    const body = document.createElement('p');
    body.textContent = message;
    el.append(label, body);
    chatLog.append(el);
    chatLog.scrollTop = chatLog.scrollHeight;
  }
  function clearChat() {
    conversation = [];
    chatLog.replaceChildren();
    appendMessage('assistant', intros[mode]);
    feedback.hidden = true;
    input.value = '';
  }
  function renderExamples() {
    const root = $('studio-examples');
    root.replaceChildren();
    examples[mode].forEach(text => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = text;
      btn.addEventListener('click', () => { input.value = text; input.focus(); });
      root.append(btn);
    });
  }
  document.querySelectorAll('.studio-mode').forEach(button => button.addEventListener('click', () => {
    if (running) return;
    mode = button.dataset.mode;
    if (!Object.hasOwn(names, mode)) return;
    document.querySelectorAll('.studio-mode').forEach(item => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    $('active-mode-name').textContent = names[mode];
    renderExamples();
    clearChat();
  }));
  $('chat-clear').addEventListener('click', () => { if (!running) clearChat(); });
  async function checkAI() {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      let response;
      try { response = await fetch('/.netlify/functions/lora-ai', { headers: { Accept: 'application/json' }, signal: controller.signal }); }
      finally { clearTimeout(timeout); }
      if (!response.ok) throw new Error();
      const data = await response.json();
      $('studio-status').textContent = data.configured ? 'AI configured · Ask a question to connect' : 'AI setup pending · Brief builder ready';
    } catch {
      $('studio-status').textContent = 'AI service offline · Brief builder ready';
    }
  }
  $('studio-chat-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (running) return;
    const question = input.value.trim();
    if (!question || question.length > 1400) return;
    const previous = conversation.slice();
    conversation.push({ role: 'user', content: question });
    appendMessage('user', question);
    feedback.hidden = false;
    feedback.textContent = 'Preparing a response…';
    input.value = '';
    running = true;
    submit.disabled = true;
    submit.textContent = 'Thinking…';
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 24000);
      let response;
      try {
        response = await fetch('/.netlify/functions/lora-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ mode, messages: conversation.slice(-8) }),
          signal: controller.signal
        });
      } finally { clearTimeout(timeout); }
      const result = await response.json();
      if (!response.ok || typeof result.reply !== 'string') throw new Error(result.error || 'Unable to connect to the AI service.');
      conversation.push({ role: 'assistant', content: result.reply });
      appendMessage('assistant', result.reply);
      feedback.hidden = true;
    } catch (error) {
      conversation = previous;
      appendMessage('assistant', 'I cannot answer just now. The free brief builder below still works, and you can contact the LORA team using the enquiry form or live chat.');
      feedback.textContent = error.message;
    } finally { running = false; submit.disabled = false; submit.textContent = 'Ask LORA AI ↗'; }
  });
  renderExamples();
  checkAI();

  // Privacy: generated drafts are written only into DOM and, on explicit continue,
  // into the user's own same-origin sessionStorage for the existing contact form.
  let briefText = '';
  const fields = ['brand', 'goal', 'audience', 'message', 'video', 'platform', 'style', 'cta', 'deadline'];
  function clean(v) { return String(v || '').trim().replace(/[\r\n]+/g, ' ').slice(0, 550); }
  function getFields() {
    return Object.fromEntries(fields.map(field => [field, clean($('brief-' + field).value)]));
  }
  $('brief-generate').addEventListener('click', () => {
    const b = getFields();
    briefText = [
      'LORA ANIMATIONS — PROJECT CREATIVE BRIEF',
      'Business / project: ' + (b.brand || 'To be confirmed'),
      'Main objective: ' + b.goal,
      'Target audience: ' + (b.audience || 'To be confirmed'),
      'Core message: ' + (b.message || 'To be confirmed'),
      'Video type: ' + b.video,
      'Primary platform: ' + b.platform,
      'Visual direction: ' + (b.style || 'Open to LORA recommendations'),
      'Desired CTA: ' + (b.cta || 'To be confirmed'),
      'Preferred timeline: ' + (b.deadline || 'To be discussed'),
      '',
      'Production scope, budget, revisions and delivery date require agreement with LORA.',
      'This is a draft only. Generating this brief does not send it to LORA.'
    ].join('\n');
    $('brief-preview').textContent = briefText;
    $('brief-copy').disabled = false;
    $('brief-contact').disabled = false;
    $('brief-feedback').textContent = 'Your draft is ready. Copy it or continue to the existing enquiry form.';
  });
  $('brief-form').addEventListener('reset', () => {
    briefText = '';
    $('brief-preview').textContent = 'Fill in the fields and select “Generate brief” to see your draft here.';
    $('brief-copy').disabled = true;
    $('brief-contact').disabled = true;
    $('brief-feedback').textContent = '';
  });
  $('brief-copy').addEventListener('click', async () => {
    if (!briefText) return;
    try { await navigator.clipboard.writeText(briefText); $('brief-feedback').textContent = 'Brief copied. Paste it into an email or enquiry.'; }
    catch { $('brief-feedback').textContent = 'Clipboard access unavailable. Select and copy the brief above.'; }
  });
  $('brief-contact').addEventListener('click', () => {
    if (!briefText) return;
    try { sessionStorage.setItem('lora-studio-brief', briefText); }
    catch { $('brief-feedback').textContent = 'Browser storage is unavailable. Copy the brief, then use Contact LORA below.'; return; }
    window.location.assign('/contact/');
  });
})();
