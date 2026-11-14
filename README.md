# USA Anime Club — Anime, Manga, Manhwa & Web Novel News

Editorial home: https://usaanimeclub.com/. US-focused, source-linked updates with direct links to primary sources. Automated source checks do not replace human editorial verification.

## Locked shared article template

All articles use the exact same markup in `scripts/build.mjs`. Its article body is protected by `scripts/article-template.lock.json` and CI. Do not edit the shared article template for ordinary publishing.

To publish 10, 20, 100 or more articles, edit **only `content/articles.json`** to add source-linked entries subject to independent editorial verification. Required data: unique slug, one of Anime/Manga/Manhwa/Web Novels, headline, description, SEO keywords, publication date, dated source or verification date, link, original summary and sections. Never invent dates, US licenses, staff or official announcements. Do not copy publisher text or licensed artwork.

Run `node scripts/build.mjs` then `node scripts/validate.mjs`. The generator creates indexable HTML article pages, original typography artwork, RSS, XML and Google News sitemaps, and removes generated pages/artwork for deleted stories.

Every HTML page includes the shared consent handler that conditionally loads GA4 `G-G0TNMR0FQL` and Clarity `yyqq9cryjc`; do not add duplicate tags. New stories inherit all canonical, SEO, article schema, footer, policies and consent code.

Build passing on GitHub does not itself establish successful Hostinger deployment, Google News inclusion or AdSense approval.

## Editorial depth and source transparency

The build enforces at least **1,000 body words** on each news article and rejects duplicated paragraphs inside an article; this is the publication's requested standard, **not** a Google or Bing ranking requirement. Google explicitly says there is no preferred word count. Material must still offer distinct value, source links, accurate dates, and independent editorial checks before publishing.

NewsArticle JSON-LD includes reported source citation, topical subject and accurate word count. The shared article HTML template stays locked; source content and artwork themes are data-driven.

AdSense approval cannot be inferred from article length or passing CI. Before applying, independently verify live deployment, content accuracy and image rights, privacy and consent behavior, site access, and AdSense account status. Do not add unverified AdSense publisher IDs or ads.txt declarations.

## Site identity and Google's Preferred Sources

Cards use a shared category-header component with the category name right-aligned and a four-category color system; there are no dispatch labels or numbers. Site typography uses Fraunces headlines, IBM Plex Sans text and IBM Plex Mono editorial labels. The Google link is an official publisher deeplink to `https://www.google.com/preferences/source?q=usaanimeclub.com`; users must select the site themselves, and Google controls source eligibility. No third-party script is necessary for that link.

Editorial quality is assessed through primary-source attribution, editing and accuracy checks. Automated paragraph and similarity checks do not certify a zero-plagiarism score. Do not present generated content as independent eyewitness reporting or assert a human review that did not occur.

## Article card palette

Anime: dark blue `#173A70`; Manga: dark red `#932B3B`; Manhwa: yellow `#F4C542` with dark text; Web Novels: green `#16744A`. Cards, topic links and original SVG artwork share those category colors. The article layout remains locked.

## Source links

The shared article template was intentionally revised so that each report shows a single **View primary source** link under **Primary source and reporting notes**, alongside the date the source was announced or checked. The former **Original Announcement** sidebar card has been removed from all article pages. The table of contents and editorial policy sidebar remain unchanged. Template lock version: 2.

## End-of-article Preferred Sources action

Every news article inherits the same bottom-of-page **Add as a preferred source on Google** link, appearing after related coverage and before the global footer. It opens `https://www.google.com/preferences/source?q=usaanimeclub.com` in a new tab. Users choose whether to add the site; eligibility and search presentation are controlled by Google. Shared article template lock updated to version 3.

## Automatically updated news ticker

All pages display a right-to-left scrolling headline strip directly below the header. It comes from **every article in `content/articles.json`**, sorted newest first. New articles automatically join the scroller on site rebuild, with clickable canonical article links and category badges. The ticker pauses when hovered or focused, repeats a hidden-from-assistive-technology visual copy for seamless movement, and becomes manually scrollable when reduced motion is preferred. No external news service or script is required.

## Audit fixes: archive and mobile clock

News-card filtering is scoped to `.archive-grid` and never counts or hides the always-visible headline ticker. The mobile header retains the browser-local time strip; on very narrow screens it hides the decorative newsroom label instead of the clock. The lead story, headline ticker and archive order by **site publication date**, then source date, so future newly published articles surface correctly.

## Complete topic archives

The four categories have independent, indexable collection pages under `/news/category/` and automatic 12-article pagination. The main news archive retains its in-page filters but offers a separate link to the complete selected category. Main navigation and homepage category tiles lead to the full archives; publication URLs and the shared article layout remain unchanged.

## Interactive accessibility checks

The headline ticker has an explicit Pause/Resume control (in addition to hover/focus pause and reduced-motion fallback). CI runs a small simulated-browser test of archive filtering, search, category links and the ticker pause/resume behavior. It also checks internal article anchors and duplicate HTML IDs on every canonical page.

## PNG social and search preview images

The site continues using the editable SVG covers inside the article pages. During the build, `@resvg/resvg-js` 2.6.2 rasterizes each existing SVG to a 1200×675 PNG for Open Graph, Twitter/X cards and NewsArticle schema, with a 256×256 raster organization logo. After cloning the repo run `npm install --no-package-lock` before `npm run build` and `npm run validate`. The GitHub Actions workflow installs the pinned renderer before generating/validating the images. Generated PNG files are stored under `assets/news/`, maintained alongside SVGs, and old variants are cleaned up when stories are removed.

## Deployment mismatch diagnostics

Every HTML page includes the same deterministic `site-build` meta tag and a public `build-info.json` file with a source fingerprint, article count and newest article slug. Use `DEPLOYMENT.md` to compare the live site with GitHub, check Hostinger Git integration and safely clear caches. Source directories and repository configuration are denied in the generated Apache `.htaccess`; do not assume these rules apply on non-Apache hosting or external CDN layers.

## Stale archive cleanup

On every generator run, obsolete paginated pages under `news/page/` and `news/category/` are removed when articles are deleted or categories shrink, avoiding indexable orphaned archive pages. CI verifies remaining category and archive indexes are present in the current sitemap. Other manually maintained directories are not swept.

## Numbered pagination for every category

The main news archive and all four topic pages use the same 12-article pagination utility in `scripts/pagination.mjs`. Navigation shows numbered pages, Previous/Next controls, and a clear "Showing X–Y of Z articles · Page N of M" indicator, even when a category has only one page. Each page has its own canonical URL and appears in the regenerated sitemap. When the thirteenth article enters a category, `/news/category/<category>/page/2/` is created automatically; stale pages disappear if content is later removed. Tests cover categories containing 12, 13, 24, 25 and 100 articles without introducing demo articles into production.

## Same-day publishing order

Each new article published on a date already used by an existing article should include an increasing positive integer `publishSequence` (higher numbers are newer). The generator sorts by publication date, then `publishSequence`, then original announcement date. This prevents a freshly written article about an older official announcement from appearing beneath an older article. Category pages, featured story, ticker and archive inherit the same order. Do not modify the original source date to manipulate order.

## AdSense, analytics, Clarity and Bing IndexNow (November 2026)

The shared generator inserts **one** Google AdSense publisher tag for `ca-pub-7937216909291905` in the `<head>` of every generated HTML page, including the 404 page. A default-denied Google consent signal appears before it. Analytics `G-G0TNMR0FQL` and Clarity `yyqq9cryjc` load via the shared consent runtime only after an analytics choice; that choice does **not** grant advertising consent. `ads.txt` declares the supplied AdSense seller ID. Google must review the site, and a Google-certified, TCF-integrated CMP is required where applicable to serve personalized ads in EEA, UK, and Switzerland. Configure this separately in AdSense → Privacy & messaging; code alone does not establish policy compliance or approval. Validate real browser/network consent behavior before enabling ads.

The index of **canonical URL pages** is generated from `content/articles.json` and the page templates into `sitemap.xml`; `robots.txt`, `llms.txt`, RSS and the 48-hour Google News sitemap are regenerated on each build. IndexNow uses a domain-verification key file in the public root. The `.github/workflows/indexnow.yml` workflow runs following a successful build and on a daily retry. It checks the live `build-info.json` build ID and publicly hosted key before submitting **every canonical URL individually in a bulk IndexNow payload**, then caches the build ID only after an HTTP 200 receipt to prevent resubmission (HTTP 202 means key verification is still pending and will be retried). A queued, skipped, or failed job is not proof of submission. Inspect the workflow logs and Bing Webmaster Tools IndexNow page to verify receipt and note that submission does not guarantee indexing. Hostinger deployment must actually serve the latest generated files.
