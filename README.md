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
- The original, self-owned illustration is `assets/hero-anime-scene.svg`; no copyrighted anime screenshots or third-party fonts or 3D libraries are required.
- `assets/home-motion.js` loads only from the homepage and adds bounded pointer-based CSS 3D depth on fine-pointer devices.
- Continuous floating animation can be paused with the visible motion toggle; system `prefers-reduced-motion` disables decorative movement automatically. No critical links or content depend on JavaScript.
- Homepage guides and cards still come from `content/catalog.json`. Run `npm run build && npm run check` and confirm desktop/mobile layout, focus, dark mode and reduced-motion behavior before treating the production domain as deployed.
