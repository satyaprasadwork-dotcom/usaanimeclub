# USA Anime Club

An independent, US-focused anime editorial site built from source content into fast, crawlable static HTML. The public site is not a membership system, ticketing service, or authorized screening organizer.

## Architecture

- `content/catalog.json`: single source for URLs, titles, descriptions, categories, dates and publication status
- `content/pages/*.html`: page body sources (including 15 existing editorial guides)
- `templates/layout.html`: one shared page shell for nav, footer, consent, analytics and metadata
- `scripts/build.mjs`: generates static pages, article cards, structured data, filters and sitemap
- `scripts/validate.mjs`: verifies content structure, local links, sitemap, metadata and disabled advertising
- `assets/site.css`, `assets/site.js`: shared styles and interface functionality
- `assets/tracking.js`: **one** consent-aware Google Analytics / Microsoft Clarity implementation on every page (including the 404 page)
- `assets/covers/*.svg`, `assets/logo.svg`: original owned topic illustrations and logo
- `content/review-register.json`: manual fact/source-review status; **not a completed fact check**
- `tools/`: three browser-only calculators for convention costs, manga edition comparisons, and anime viewing commitment
- `assets/tools.js`: privacy-friendly calculator logic (inputs never leave the browser)

## Edit and publish

1. Edit a page in `content/pages/`, or run `npm run new:guide -- slug "Title" "Description" "Category"` to create a draft scaffold.
2. Add or update the corresponding entry in `content/catalog.json`. Set `status: "draft"` until the article has been checked; never insert placeholders into published pages.
3. Add an original cover image, verify claims and link primary sources. Distinguish hypotheticals from tested information.
4. Set status to published, update dates to reflect actual editing, then run `npm run build` and `npm run check`.
5. Commit source plus generated output. GitHub Actions can regenerate published output on pushes to `main`; review the workflow result before assuming deployment.

Do **not** hand-edit generated `guides/*/index.html`, `index.html`, article-directory cards or `sitemap.xml`.

## Analytics and advertising

- Google Analytics GA4: `G-G0TNMR0FQL` and Microsoft Clarity: `yyqq9cryjc` are configured once in `assets/tracking.js`, imported by the shared layout. Both load **only** after an affirmative analytics choice; denying consent keeps their external scripts unloaded. The preference is changeable via the footer on every page, including the 404 page.
- AdSense publisher verification meta tag: `ca-pub-7937216909291905`, included once in the shared layout on every published page (and the 404 page). Google allows meta-tag verification during review. The AdSense **ad-serving script** is deliberately not loaded until the site is approved and the relevant certified CMP is configured.
- A Google-certified CMP integrated with the IAB TCF is required when serving personalized ads in the EEA, UK and Switzerland. The native analytics preference control is **not** a certified CMP. Configure a certified solution via AdSense Privacy & messaging (or a certified third party) before activating ads where required.
- Verify actual hosting/log policies, regional privacy obligations, `ads.txt` ownership and contact email delivery against the live service. None can be proved from GitHub alone.

## Production deployment

The repository does not prove Hostinger deploys automatically. Set the hosting document root to the generated static site, including nested `index.html` files. Validate HTTPS, root and www redirects, 404 response codes, sitemap, mobile performance and real email delivery on the production domain. Submit the live sitemap to Google Search Console and Bing Webmaster Tools. AdSense and Discover approval are not guaranteed.

Run `npm run check` before publishing, then review GitHub Actions logs and live paths. For detailed contributor guidance, see [content/README.md](content/README.md).

## Work that cannot be verified from repository code

- All fifteen published guides still have **uncompleted manual claim reviews** in `content/review-register.json`. Added sources or calculations do not mean every claim was verified.
- Confirm the live domain is reachable, TLS is valid, hosting deploys nested paths and missing URLs return a true 404. Run `npm run audit:live` on a machine with public Internet access.
- Confirm the real editorial contact mailbox, ownership identity, hosting logs and retention policy before declaring trust and privacy review complete.
- Do not claim attendance, interviews, first-hand tests, live product prices or relationships with any providers without records. AdSense approval cannot be guaranteed.

## Test before publishing

- `npm run check` tests generated pages, internal navigation, meta tags, publishing records and the sitemap.
- `npm run audit:external` checks external reference URLs from a networked environment. A reachable URL is **not** proof that it supports the article's factual claims.
- `npm run audit:live` checks the public origin, important routes, sitemap and 404 response codes. It will fail if the domain is unreachable or Hostinger has not received generated files.
- `404.html` is generated from `content/pages/404.html` and `templates/layout.html`; do not edit the generated file directly.
- Existing 15 published guides remain in the manual review backlog; newly added guides that explicitly use `status: "published"` require a completed and named review record. Keep new pages at `status: "draft"` until review is genuine.

## Homepage: Next Chapter motion system
- Editable source: `content/pages/home.html`; visual styles are scoped in `assets/site.css`.
- The original, self-owned illustration is `assets/hero-sky-traveler.svg`; no copyrighted anime screenshots or third-party fonts or 3D libraries are required.
- `assets/home-motion.js` loads only from the homepage and adds bounded pointer-based CSS 3D depth on fine-pointer devices.
- Continuous floating animation can be paused with the visible motion toggle; system `prefers-reduced-motion` disables decorative movement automatically. No critical links or content depend on JavaScript.
- Homepage guides and cards still come from `content/catalog.json`. Run `npm run build && npm run check` and confirm desktop/mobile layout, focus, dark mode and reduced-motion behavior before treating the production domain as deployed.

## Homepage CSS cache regression fix (November 3, 2026)

The homepage previously referenced one unversioned `/assets/site.css` while its new HTML was already being served. This could produce an unstyled full-width hero when a hosting cache still held the older CSS. `scripts/build.mjs` now writes a content hash into the shared stylesheet URL on **every** generated page. It also injects a separately fingerprinted `/assets/home-next-20261103.css` on the homepage only. A minimal critical inline stylesheet keeps the layout in two columns even if an external CSS file is delayed or stale. New homepage changes should update `assets/home-next-20261103.css`, then run `npm run build && npm run test:home && npm run validate && npm run build:check`. Deploy the new stylesheet asset along with the HTML, not just `index.html`.

## Sky blue refresh — November 2026
The visual system uses icy blue, cyan and ocean-blue variants on a deliberately light default background. The header, cards, themes, logo, favicon and hero effects share the new palette. The original headphone image was replaced with `assets/hero-sky-traveler.svg` (original illustrated rooftop traveler). Motion remains the same and supports reduced motion and pause controls.

## Visual asset cache versioning
The static generator adds content-hash query strings to the logo, favicon, replacement hero and all 15 SVG covers, in addition to the existing stylesheet hashes. This prevents mixed-version purple/pink assets appearing with the new blue HTML when browser or CDN caches retain old files.

## AdSense quality and live-site smoke checks

The homepage header now links to actual community guides rather than implying an unimplemented membership system. The About and editorial pages explain what the independent publication does, who is credited, how AI-assisted drafting is disclosed, and why these are not personal event reports. `npm run audit:live` performs read-only production probes of crucial page routes, publisher metadata, the generated sitemap, `robots.txt`, `ads.txt`, hero-image availability and real HTTP 404 behavior. Run `LIVE_AUDIT_ALL=1 npm run audit:live` for every published URL. GitHub Actions also executes the representative production smoke probe as an **advisory** step; a green build is not proof the domain is deployed or the site is approved by Google. Editorial claim verification and confirmation of mailbox delivery still require the operator.

## Hostinger AVIF MIME repair

The production audit on 2026-11-03 returned HTTP 200 for the hero `.avif` but identified `Content-Type: text/plain`. Hostinger documents `.htaccess` `AddType` directives for custom MIME associations. The repository includes a deliberately **nested** `assets/.htaccess` to set `image/avif` for AVIF and `image/svg+xml` for SVG without replacing any Hostinger root redirect or security directives. Deploy hidden files along with `assets/`; if the host or CDN ignores the nested rule, configure the MIME type in the hosting/CDN dashboard. Re-run the production audit and check the actual response header before marking this fixed.

## Human review and image rights gate

The site's human verification status remains **pending** for every existing guide; automated assistance and link checks cannot sign off factual claims. The review procedure is `docs/human-editor-review-gate.md`; current source references are in `content/source-evidence.json` and individual review records in `content/review-register.json`. Asset origin and independent rights checks are recorded in `content/asset-provenance.json`. Claims of completed personal interviews, hands-on testing or human review must not be published until documented. The original publication dates remain unchanged; substantive editing dates are updated only on modified pages.

## Reliable hero delivery
GitHub Actions creates `assets/home-concept-scene-hd-2x.webp` from the existing high-resolution AVIF source using ffmpeg and commits the output. The homepage and all three animated hair overlays reference the WebP image to avoid Hostinger's inconsistent AVIF response MIME type. Existing original source assets remain in the repository. Live MIME is checked by `npm run audit:live` and is a deployment test, not proof of desktop/mobile fidelity.

## Search, answer and AI-search visibility (November 2026)

The site now publishes question-led HTML answer sections, more descriptive SERP titles, visible editorial update dates and source-aligned Article, CollectionPage, ItemList and WebApplication structured data. The guides hub includes four reader pathways. GitHub Actions runs `npm run audit:seo` on every content/build change. Details, limitations and account-level verification: `docs/seo-aeo-geo-2026-11-04.md`. No specific position in Google AI Overviews or Bing Copilot is guaranteed.
