// Include with <script defer src="/contact/lora-studio-brief.js"></script>
// on the EXISTING /contact/ page; this does NOT change its design or submission handler.
(() => {
  'use strict';
  const form = document.querySelector('form[name="lora-contact"]');
  const textarea = form?.querySelector('textarea[name="message"]');
  if (!form || !textarea) return;
  let brief;
  try { brief = sessionStorage.getItem('lora-studio-brief'); }
  catch { return; }
  if (!brief || brief.length > 5000) return;
  // Do not overwrite anything the visitor has already written.
  if (!textarea.value.trim()) textarea.value = brief;
  // Keep the draft if the user navigates back; clear only on an actual success.
  const status = document.getElementById('lora-form-status');
  if (status) {
    const observer = new MutationObserver(() => {
      if (status.dataset.state === 'success') {
        try { sessionStorage.removeItem('lora-studio-brief'); }
        catch { /* Browser storage unavailable. */ }
        observer.disconnect();
      }
    });
    observer.observe(status, { attributes: true, attributeFilter: ['data-state'] });
  }
})();
