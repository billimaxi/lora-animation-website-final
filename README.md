# LORA Animation Website

Responsive static website for GitHub + Netlify.

## Publish
1. Extract this ZIP.
2. Upload the **contents** (index.html, styles.css, script.js, success.html, and assets folder) to the root of your GitHub repository.
3. In Netlify, import/connect that repository. Leave build command blank and use the repository root as publish directory.
4. Enable Netlify Forms / form detection in site settings, then redeploy so the `lora-contact` form is detected.
5. Test the contact form and check Netlify's Forms area.

## Before launch
- Dee's Bite is shown as a client project with a designed preview card and WhatsApp request link. Upload the commercial to YouTube (unlisted is fine) or another host to make it playable on-site. Avoid committing the large original video to GitHub.
- Subscription buttons open the supplied Flutterwave checkouts. Confirm each checkout's USD amount, monthly billing configuration, cancellation/refund terms and business ownership before launch; recurring billing is configured in Flutterwave, not this repository. Confirm creative scope with each client before work begins.
- Facebook is intentionally omitted for now.
- Check the YouTube links and social handles before publishing.

Includes Home, Services, Plans, Our Work, Founder, Contact, and founder portrait.

## LORA pricing
- Essential: $150 USD / month — 4 AI videos/month
- Growth: $250 USD / month — 3 AI videos/week (up to 12/month)
- Studio Retainer: $500 USD / month — 4 AI videos/week (up to 16/month)
- Billing: Monthly

The footer social links are represented by clickable Instagram, TikTok, YouTube, and LinkedIn icons. LinkedIn points to the founder profile supplied for the website. The homepage also includes an automatic rotating motion showcase and subtle animated hero graphics.


Hero stock photo: “Team Collaboration in Modern Office Setting” by Ninthgrid on Pexels (Lagos, Nigeria), photo 30688909. Pexels lists the image as free to use. The hero loads the optimized image from images.pexels.com.


## Local development and review
Serve the repository root with `python3 -m http.server 8000 --bind 0.0.0.0`.
The static pages have no build step. Run `npm ci` to install the server-side RSS parser and browser test tools (Node.js 22+). The website guide uses
preset responses in `script.js`; it is explicitly rule-based and makes no API calls
or chat storage requests. No API keys are required.

The inquiry form retains `name="lora-contact"`, POST, `data-netlify="true"`,
`form-name`, the `bot-field` honeypot and an extensionless `/success` redirect (served from `success.html`). New fields are
statically present for Netlify form detection. After an approved deployment,
verify form detection and a real submission in Netlify; a local static server
cannot accept submissions. Do not enter card details in the inquiry form.

### Review checks
- Verify each plan's Subscribe button opens the assigned Flutterwave URL in a new tab.
  Do not complete a payment during testing.
- Exercise the guide topics, close button, Escape, and links back to page sections.
- Check FAQ keyboard expansion, required form fields, email validation and plan prefills.
- Check mobile menu, hero controls and page overflow at mobile and desktop widths.
- Check YouTube playback and Google Fonts with browser network access.
- Deployment, payment setup and real form delivery require separate review; a pull
  request does not publish the website.

## LORA Tech Radar
The homepage places a one-story image carousel directly below the hero, with
previous/next, Play/Pause, a slide counter and seven-second rotation. Plans and
Our Work remain on the homepage. Dedicated pages reuse the same Radar component.
Rotation pauses on hover, keyboard focus, hidden tabs or explicit Pause; reduced
motion starts paused, with Play available. Dates are displayed in UTC. Article
links open the original publisher in a new tab.

`netlify/functions/tech-news.js` fetches public TechCrunch AI, The Verge and Ars
Technica feeds concurrently, with five-second timeouts and a 2 MB per-feed limit.
It parses RSS and Atom using the pinned `fast-xml-parser` dependency, accepts only
HTTPS publisher article links, deduplicates and sorts by publication date, and
returns up to 12 items with `title`, `url`, `source`, `date` and `image`. Dates or
images can be null. Dated entries older than 30 days or more than a day into the
future are omitted. One failed publisher does not discard the others. Responses
are cached for five minutes in browsers and fifteen minutes at the edge.

Images are extracted from media content/thumbnail/group, image enclosures and
image tags in feed content/description. Remote HTML is never rendered. Missing
or failed images use the local LORA-branded SVG. No keys or credentials are needed.
If all feeds fail, are empty or time out, the carousel shows clearly labeled
publisher discovery links with that SVG; these are not presented as news headlines.

### Local validation
- `npm ci` then `npm run dev`: serves the site and the real Netlify function on
  port 8000. Python's static server still works for layout but cannot execute the
  news function, so it will show publisher discovery cards.
- `npm test`: feed parser/aggregation tests with explicit fixtures, including
  RSS, Atom, supported image fields, bad URLs/XML, stale dates, partial failures
  and total feed failure.
- `npm run test:browser`: start the local server first. Requires Chromium at
  `/usr/bin/chromium`, or set `CHROMIUM_PATH` to your installed Chromium executable.
  Uses Playwright and controlled fixture responses, without sending payments or
  inquiries. Checks article URLs, autoplay, controls, focus pause, missing/broken
  images, feed-failure cards, mobile/desktop widths, existing payments and form
  validation. The original site suite also covers dedicated-page navigation.

The cloud proxy blocked all three external feed hosts during this review. The
actual handler was exercised locally and returned `{ "items": [] }` gracefully;
fixture-based parser and browser tests verify article rendering independently.
Fresh live-feed ingestion still needs verification from a network that allows
`techcrunch.com`, `www.theverge.com`, and `feeds.arstechnica.com` (plus any publisher
redirect destinations). Browser article images need access to publisher image
CDNs. Feed URLs and availability are outside this site's control.

`netlify.toml` registers the function directory and Node.js 22. Netlify installs
locked dependencies; no API-key setup or static build command is required. This
branch does not authorize a deploy or a merge. Verify the function response on an
approved deployment before claiming live-news availability.


## Form submission troubleshooting (deploy previews)
1. In Netlify, open **Forms → Form detection** and verify detection is **enabled**. If you enabled it now, trigger a **new deploy**; it does not apply retroactively.
2. After the deploy completes, confirm that Netlify lists the **lora-contact** form under **Forms → Active forms**. If it is absent, the form is NOT registered, and browser submissions cannot be trusted.
3. The contact form is statically present in `contact/index.html` with `data-netlify="true"`, `name="lora-contact"`, matching `form-name`, and a honeypot. The client submits URL-encoded data via POST to `/`, a static route, and now shows errors inline instead of redirecting to a 404.
4. Retry a realistic test inquiry, then confirm it is recorded in Netlify's **Forms → lora-contact** verified or spam submissions. Do not claim successful delivery solely because the browser shows a success message.
5. If detection is enabled and no form appears after a fresh deploy, review the Netlify deploy logs/form post-processing and support guide; this requires access to the Netlify dashboard.


### Explicit form registration endpoint
Form detection now uses a single static form blueprint in `/__forms.html` with every field submitted by `/contact/`. The visible form no longer declares a second independent Netlify form. The browser submits to the explicit static endpoint `/__forms.html` instead of `/`, and includes HTTP error details for troubleshooting. **You must enable Netlify Forms detection in the dashboard and deploy again**: source changes alone cannot turn on a disabled site setting. A 404 after that indicates an unregistered form or blocked POST; confirm `lora-contact` is listed in Netlify's Active forms, and review deploy form detection logs. Local tests mock responses; a browser success message does not prove Netlify stored the inquiry.

## Tidio live chat (single chat widget)
The official Tidio widget is installed once on every public HTML page. The custom LORA Guide has been removed, so Tidio is the only chat launcher. The public widget key is supplied by LORA; the site applies the LORA gold color via the documented widget API. The website does **not** inject its own welcome into Tidio, preventing a duplicate/conflicting greeting.

### Set LORA's welcome and offline replies in Tidio
In the Tidio account: **Settings > Live Chat > Appearance > Content**. Under **Home**, personalize Header, Message, Online status and Offline status; under **Chat**, customize the **Offline message**. In particular, Tidio's default "Hi there. We are currently offline ..." is a provider-managed offline message, not site copy. Set clear branded wording and do not claim agents are online when offline. Tidio's agent status can be changed from the account panel; keep the widget visible when agents are offline so customers can still leave inquiries. Save the account settings, then test in an incognito/private browser. This dashboard content is **not** editable from GitHub.

If an automatic proactive message is desired when visitors land on the website (instead of only seeing the widget's Home/Chat content), use an optional Tidio Flow in its account. Configure just one welcome method; review Tidio's current flow entitlements.

PR #2 is a review-only change. Existing pricing, About Us, framed founder, Tech Radar and Netlify contact form are unchanged.


## Search discoverability / SEO foundations (review branch)
Public canonical host: `https://loraanimations.online`. A new `sitemap.xml` lists eight principal, indexable landing pages; `robots.txt` announces the sitemap. Every page has a distinct, commercial-intent title and meta description, self-referencing canonical URL and social-sharing tags. Inner-page hero headings are semantic `h1` elements while preserving the design. The homepage contains Schema.org Organization and WebSite JSON-LD with factual contact and official social profiles. An older standalone /founder/ URL stays reachable but is marked noindex because founder information is on the homepage. Form-success and internal Netlify registration pages are noindex.

After approval/production deployment: verify that https://loraanimations.online/sitemap.xml and https://loraanimations.online/robots.txt return 200; connect the domain in Google Search Console (DNS TXT verification for a domain property); submit sitemap.xml; use URL Inspection for key pages; inspect indexing, search queries and click-through rate. SEO metadata does not guarantee indexing, clicks or rankings. Do not claim Google registration has happened until confirmed in the Search Console property.

Run `npm test` for existing tech-news and new SEO regression tests. This work does not change payment links, Netlify form POST behavior or Tidio chat code.


## Dee's Bite Cakes case study (draft)
Adds a dedicated video watch page at `/work/dees-bite-cakes/`, showcasing LORA's already-published real client commercial for a cake business. Includes a video embed, commercial service positioning, internal links, contact CTA and an updated XML sitemap. No unsupported client outcomes or testimonials are claimed. Review content and player before publishing. Existing Tidio, Flutterwave and Netlify contact flows remain untouched. Google indexing and video appearance are not guaranteed.


## Inline video portfolio (draft review)
All four existing LORA work samples (Africa In My Veins, African Spirit Anthem, Argungu Fishing Festival, Dee's Bite Cakes Ads) can be played *directly on the homepage and Our Work page* by selecting their thumbnail. A privacy-enhanced YouTube embed loads **only after the user clicks**; one video plays at a time to limit simultaneous audio and resources. The Close button stops playback and restores the preview. Direct YouTube watch links remain for fallback and for visitors who prefer YouTube; without JavaScript the thumbnails link to YouTube as before. The standalone Dee's Bite Cakes case study video is unchanged. The hover/thumbnail treatment fits the current brand and is responsive. Video hosting stays on YouTube, not Netlify. Run `npm run test:browser` with the existing dev server to exercise both galleries. Payment links, Netlify Forms, Tidio, SEO metadata, and sitemap are unchanged. Publish only with approval.
