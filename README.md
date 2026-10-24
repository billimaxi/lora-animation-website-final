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
`form-name`, the `bot-field` honeypot and `/success.html` redirect. New fields are
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
