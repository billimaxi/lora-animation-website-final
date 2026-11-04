# LORA AI Studio installation

Installed from the supplied `LORA_AI_Studio_Install.zip` on the current original
main website, without incorporating the separate redesign branch. The add-on is
at `/studio/`: Brand Ad Adviser, Creative Brief Assistant, AI Video Learning Coach,
and a free browser-only project brief builder. Existing page changes are limited
to an AI Studio navigation link and the contact handoff script. Existing shared
styles, shared script, portfolio, prices, checkout URLs, forms and Tidio loader
remain intact. Tidio remains the sole floating live-support widget.

## Netlify runtime

The ESM Netlify Function at `/.netlify/functions/lora-ai` uses the existing
Functions-scoped `OPENAI_API_KEY` via `process.env`, never the frontend. This
installation does not read, copy, replace or commit the Netlify secret. Netlify
production and deploy-preview values/scopes can differ. The optional server-only
`LORA_AI_MODEL` defaults to `gpt-4.1-mini`. The function calls the Responses API,
sets `store: false`, limits output to 480 tokens, and uses a 19-second provider
timeout. No additional dependency or build step is required.

The GET endpoint reports configuration presence only, not successful provider
authentication. POST enforces same-origin requests when Origin is supplied, JSON,
allowed modes/roles, message sizes/counts and a 50 KB body limit. It returns safe
errors for missing configuration, malformed requests, provider failures and
empty replies. Throttling is 12 requests per client per ten minutes **per warm
function instance**; it is not a global quota. Before public release, review
Netlify edge/global rate limits and account spending controls. Origin checks
alone do not authenticate clients.

Only the function makes provider requests. Questions and recent conversation
are sent to OpenAI; the Studio page discloses this. Conversation history remains
in page memory and replies are rendered as plain text. No API key belongs in
static files, local browser storage, URLs or a committed environment file.

## Brief handoff

Generating/copying a brief requires no API. Only the visitor's explicit Continue
action saves a draft in same-origin sessionStorage and opens `/contact/`. It
prefills an empty message field, preserves existing visitor text, and neither
checks consent nor sends an inquiry. A stored draft survives navigation until a
successful manual form submission. The contact integration clears it after the
existing handler reports success. If storage is blocked, the visitor stays on
the Studio page and is prompted to copy the brief instead.

## Package corrections

- Safely reject null messages, including a null last message.
- Permit assistant history up to the server's 4,500-character reply cap while
  retaining the 1,400-character visitor question cap.
- Bound request-body reads and validate the JSON content type.
- Do not navigate away and lose the brief when sessionStorage is unavailable.
- Report configuration presence without claiming a successful OpenAI connection.
- Disclose the external AI provider in the chat form.

## Validation

Start `npm run dev` after `npm ci`; this serves both Netlify handlers locally.
Run `npm test` and `npm run test:browser`. Browser tests use Playwright and an
installed Chromium (`CHROMIUM_PATH`, default `/usr/bin/chromium`). Local HTTP
port 8000 is internal validation, not a hosted preview.

During installation, 21 Node tests and all six browser suites passed, including
all assistant modes, multi-turn conversations, safe response text, offline
recovery, brief copy/reset, explicit contact handoff, storage cleanup, six screen
widths, checkout mappings, Tidio integration and existing form/video behavior.
Provider, vendor and contact POST responses were mocked; no real inquiry or
payment was sent. The real local function returned `configured: false` and a
503 fallback without a local key. Original pages were compared byte-for-byte
after removing only the added link/script; shared styles and script were also
verified unchanged. An obsolete browser assertion was corrected to check the
current `__forms.html` Netlify registration rather than attributes no longer on
the visible contact form.

Live OpenAI/Tidio/Netlify verification remains pending: the key stored in Netlify
is not injected into this cloud workspace, and no Netlify management credential
is available here. Do not copy it into this repository or send it through chat.
From an authorized Netlify deploy preview with Functions access to the existing
key, ask each assistant a short question and verify a successful response; check
the brief handoff and real Tidio availability. Production deployment and merging
require the owner's approval. No preview or production deployment was performed
by this installation.
