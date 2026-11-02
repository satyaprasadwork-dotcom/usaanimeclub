# USA Anime Club

Independent US-focused anime editorial site. Static HTML, CSS and JavaScript; no package installation or build framework needed.

## Structure
- `index.html` homepage
- `guides/index.html` article directory with client-side filtering
- `guides/<slug>/index.html` crawlable canonical editorial pages
- `assets/site.css`, `assets/site.js` shared layout, theme and opt-in analytics behavior
- `assets/covers/*.svg` original geometric artwork; no copyrighted character images
- Separate About, Contact, Privacy, Terms, Editorial Policy, Community Guidelines and Disclaimer pages
- `robots.txt`, `sitemap.xml` and `ads.txt`

## Hosting
Deploy **all** repository files and directories to the public document root for `https://usaanimeclub.com/`. Configure clean directory-index routing (each folder has `index.html`). Verify that pages return HTTP 200, missing routes return genuine HTTP 404, and HTTPS/canonical redirects work. The repository has **no automatic Hostinger deployment** configured.

## Publishing a guide
1. Write an original, fact-checked article with meaningful sources and a unique page at `guides/<slug>/index.html`.
2. Add an original cover in `assets/covers/`, and a card in both `index.html` (if featured) and `guides/index.html`.
3. Add the canonical URL to `sitemap.xml` with the real updated date.
4. Check title, description, canonical, Article/BreadcrumbList JSON-LD, internal links, mobile layout and source URLs.
5. Validate with `node scripts/validate.mjs` before uploading.

## Analytics and ads
- Google Analytics: `G-G0TNMR0FQL` and Microsoft Clarity: `yyqq9cryjc`. Optional measurement is initialized only after the visitor accepts analytics in the simple site preference panel; the choice is saved in browser local storage.
- Google AdSense loader is present for publisher `ca-pub-7937216909291905`. A script does **not** mean the site is approved and no ads are forcibly injected into articles.
- **Action required:** configure Google-certified TCF CMP through AdSense Privacy & Messaging or another certified provider before serving personalized advertising in the EEA, UK or Switzerland. The built-in preference panel is for analytics only and does not satisfy that advertising CMP requirement.
- **Action required:** verify `ads.txt` publisher relationship, account status, AdSense privacy messages, and actual domain/app configuration.
- **Action required:** review the live privacy notice for host log handling and privacy-law compliance with the actual website operator.

## No fabricated activity
The old form showed a success message without submitting anything; it has been removed. There is no sign-up database or email automation. The former sample schedule was removed. Until the operator provides a real events workflow and confirmed details, no event bookings or memberships are promised.

## Post-deployment checklist
- Confirm contact@usaanimeclub.com receives mail (the repository cannot validate mailbox delivery).
- Check live URLs, certificates, hosting redirects, 404 behavior, all analytics preferences and Search Console/Bing verification.
- Test Lighthouse mobile Core Web Vitals and screen-reader navigation.
- Submit the updated sitemap via Google Search Console and Bing Webmaster Tools.
- Review all content for changes to streaming, legal or organizer policies.
- Obtain any legally necessary privacy/consent arrangements and audit rights to third-party images before enabling ads.
- Google AdSense approval is solely at Google's discretion and cannot be guaranteed.
