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
There is no build step or runtime dependency installation. The website guide uses
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

## Homepage and AI/Tech News ticker
The homepage retains all three subscription cards and the full selected-projects portfolio, while navigation links still point to dedicated pages. The fixed bottom news bar reads public RSS through the Netlify function at `/.netlify/functions/tech-news` (TechCrunch AI and The Verge). If the external feeds are unavailable, it displays an explicitly labeled topic link; never fabricated headlines. The bar can be closed per browser tab/session. Review production function logs and headline linking after deploy. External RSS availability cannot be guaranteed.
