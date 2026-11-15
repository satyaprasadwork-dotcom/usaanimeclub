# USA Anime Club — Anime, Manga, Manhwa & Web Novel News

Editorial home: https://usaanimeclub.com/. US-focused, source-linked updates with direct links to primary sources. Automated source checks do not replace human editorial verification.

## Locked shared article template

All articles use the exact same markup in `scripts/build.mjs`. Its article body is protected by `scripts/article-template.lock.json` and CI. Do not edit the shared article template for ordinary publishing.

To publish 10, 20, 100 or more articles, edit **only `content/articles.json`** to add source-linked entries subject to independent editorial verification. Required data: unique slug, one of Anime/Manga/Manhwa/Web Novels, headline, description, SEO keywords, publication date, dated source or verification date, link, original summary and sections. Never invent dates, US licenses, staff or official announcements. Do not copy publisher text or licensed artwork.

Run `node scripts/build.mjs` then `node scripts/validate.mjs`. The generator creates indexable HTML article pages, original typography artwork, RSS, XML and Google News sitemaps, and removes generated pages/artwork for deleted stories.

Every HTML page includes the shared consent handler that conditionally loads GA4 `G-G0TNMR0FQL` and Clarity `yyqq9cryjc`; do not add duplicate tags. New stories inherit all canonical, SEO, article schema, footer, policies and consent code.

**Future-page tracking safeguard:** All generated HTML files—including future chapter reviews, new article templates, standalone policy pages, and noindex/404 pages—must include the same shared AdSense loader and versioned `assets/privacy.js` script exactly once. CI scans *all* HTML files, not just URLs in the sitemap, and fails when AdSense metadata, consent defaults, privacy choices or shared runtime scripts are missing or duplicated. GA4 and Clarity load once only after optional analytics consent; never paste the unconditional gtag/Clarity snippets directly into individual pages.

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

## Visual-first editorial upgrade (November 15, 2026)

All 40 current stories now have unique conceptual cover briefs and title-specific reader questions in `content/editorial-guides.json`.
The shared `scripts/editorial-art.mjs` generator produces original 1200x675 illustrative SVG/PNG image assets, avoiding text-heavy headline graphics and unauthorized character images. `scripts/build.mjs` retains the site design and locked article layout while adding a small reader-guidance box and topic-relevant internal links.

Satya Prasad is identified as Editor-in-Chief in the About, Editorial Policy, article bylines and NewsArticle editor metadata. The publication remains the author where individual reporting work is not established. Do not add a named fact-checker, named interviewer or firsthand reporter without documented evidence.

Original article publication dates remain unchanged; the actual substantive editorial upgrade date is shown separately as November 15, 2026. Verify live sources, distribution territories and rights manually before declaring a factual review complete. A passing generator check establishes structural consistency, not independent reporting verification.

When publishing a new story, add a new unique entry to both `content/articles.json` and `content/editorial-guides.json` before running the build. Record its actual latest substantive editorial update in the guide `updated` field; do not backdate or forward-date revisions.

## Source-linked short answers (November 2026)

Every article has a visible, accessible `Quick answer` section derived from its story-specific factual summary. The answer links directly to the primary source and names the source record date. The table of contents links to both the answer and the detailed primary-source note. `NewsArticle.abstract` matches the visible short answer, while publisher, byline, datePublished, dateModified, canonical, and NewsArticle citation metadata remain truthful.

These changes help human readers and crawlers locate attributed context. They **do not** constitute any special Google AI markup or promise Google AI Overview, ChatGPT, Gemini, or other citation placement. Before publication, an editor must inspect the official source and confirm individual factual statements, US-specific territory/date, media rights, and meaningful original value. Existing articles still await independent claim-by-claim human verification; a code test is not editorial fact-checking.

For research and title prioritization, see `.github/editorial/us-search-opportunities-2026-11-15.md`. Search predictions are hypotheses until measured in Google Trends Explore and verified against Search Console.

## November 15, 2026 — ten requested editorial upgrades

Six new source-linked articles, four substantively revised existing articles at the original canonical paths, 46 articles total. New multi-source articles list supplementary dated official records visibly under the original source and include the same URLs in NewsArticle citation JSON-LD. All titles are retained in one shared data file; adding future articles requires a reader-guide brief, primary HTTPS source and editorial validation. The source-checking checklist remains mandatory; automation cannot certify all external factual claims or live streaming access.

## Article update-date integrity

Every substantive change to an existing article must update its corresponding `content/editorial-guides.json` entry: the `updated` UTC date (YYYY-MM-DD) and a fresh `updatedAt` UTC timestamp (YYYY-MM-DDTHH:MM:SSZ). `datePublished` retains the original date. If two edits occur on the same day, the article visibly shows the new UTC time, rather than pretending the edit happened on a later date. `dateModified` in NewsArticle JSON-LD uses that same factual UTC timestamp. Use `checkedOn` in `content/articles.json` for the date the linked public source was rechecked; never confuse it with the article edit date or the source publication date. The new CI revision guard checks changes to existing article data and editorial briefs against Git’s previous version and rejects missing/stale update timestamps. Keep these details accurate: do not bump dates solely to make pages look fresh.

## November 15, 2026 — six additional verified anime and manga guides

Added six 1,200+ word source-attributed reports: Steel Ball Run JoJo 2nd–3rd STAGES; Frieren Season 3 Golden Land announcement; Delicious in Dungeon Season 2; Frieren English Volume 15; Blue Exorcist English Volume 33; and the completed English Regression of the Close Combat Mage WEBTOON. New article publication and modification dates are November 15. Every piece includes official source dates, additional primary records, source-linked quick answers, original concept cover images, and topical article suggestions. Franchise overlap is prioritized across article categories so Frieren anime and manga stories link appropriately. The WEBTOON title is categorized as a Japanese-created webcomic rather than being mislabeled Korean manhwa.

This website's editorial standard of 1,000+ article body words is a self-imposed publishing rule, not a Google ranking or AdSense requirement. Netflix or other rights holders may subsequently change the scheduled release dates; staff should revise source facts and the actual modified timestamp rather than assuming future arrangements.

## Original episode and manga chapter reviews (expandable series archive)

`/reviews/`, `/reviews/anime/`, `/reviews/manga/` and seven individual series hubs are generated from `content/review-series.json`. The series records contain independently verifiable official US release information (Netflix, Crunchyroll, VIZ), with a source date and a distinct editorial check date. They link to existing news articles instead of duplicating news content. Series tracked: Steel Ball Run, The Apothecary Diaries Season 3, Black Clover Season 2, Boruto: Two Blue Vortex, One Piece, Kagurabachi and Dandadan.

**No firsthand reviews have been published yet.** `content/reviews.json` contains source-based analyses explicitly identified as research-derived criticism. Firsthand episode or chapter reviews require an actual human reviewer who has watched/read the work. The review renderer in `scripts/review-experience.mjs` supports a *single* original review article per installment, stored with an exact verified installment URL, a named reviewer, genuine verdict, original observations and actual modified date. No material is derived from leaked scans or unauthorized episodes. Ratings are optional and must be assigned by the reviewer. Publish research-based commentary only with clear sources, genuine original analysis and proper attribution; do not mass-publish fake firsthand review placeholders. Hubs without published criticism stay noindex and out of the sitemap.

Current setup is a usable review desk and source-backed series tracker, not a claim that a reviewer has already evaluated the latest episodes or chapters. The site does not show fake ratings, manufactured reviews or unsupported plot analyses.

## First six sourced critical responses — 15 November 2026

Six substantial source-based critical analyses appear in `content/reviews.json`, one each for Steel Ball Run Episode 9, The Apothecary Diaries Season 3 Episode 7 (overall Episode 55), Black Clover continuation Episode 177 (Season 2 Episode 7), One Piece Chapter 1198, Kagurabachi Chapter 138, and Dandadan Chapter 252. All are dated November 15, 2026, written as original thematic synthesis of official episode/chapter listings, independent criticism and relevant community discussion, with visible links and dated research checks. **They are NOT firsthand viewing/reading reviews.** The writer has not independently watched the episodes or read the complete manga chapters. No numerical ratings or invented audiovisual/panel claims appear. They use `Article` structured data and explicitly state their research methodology; a true firsthand `Review` requires a named human reviewer, actual watched/read date and editorial attestation.

Every critical response has a source-linked research note, genuine opinion qualified as interpretation of documented events, original 16:9 concept artwork, an official installment link, a spoiler warning, unique title/description, and actual publication/updated dates. The six series hubs, two review category pages and main Reviews archive are now indexable, because the category has substantive source-transparent content. No reviews are added to the Google News sitemap, which is reserved for current news reporting.

## Compact reviews layout

Series hubs now show verified release facts, source links, review cards and related coverage, without the redundant “What US readers should know” explanatory text or “Critical responses and reviews” heading. The Reviews landing and category pages also omit the extra “Published criticism” heading above their published article cards. Review articles, attribution, source links, SEO and published/updated timestamps are unchanged.

## Reviews navigation: series only

The three Reviews landing/category pages (`/reviews/`, `/reviews/anime/`, `/reviews/manga/`) show only their relevant series cards, never a second grid of individual article cards. Individual critical responses are linked within each specific series hub (`/reviews/anime/<series>/`, `/reviews/manga/<series>/`), and their standalone article URLs remain unchanged. The generator and CI enforce this arrangement for future additions.

## Compact review archive intro cleanup

The shared `/reviews/`, `/reviews/anime/`, and `/reviews/manga/` archive template no longer renders the two-column introductory paragraphs. All three review navigation tabs and series-card grids remain; individual reviews still appear only inside the relevant series hub. The unused introduction CSS is removed, and CI checks prohibit its return.

## November 15, 2026 — Naruto and Boruto editorial expansion

Eleven original 1,000+ word source-attributed long-form reports and practical guides were added to the existing news engine: Naruto: Shadow Rising manga, Naruto × Ninkū crossover, Boruto anime Part 2 production status, Lionsgate live-action Naruto film, Project Rasengan roadmap, delayed 2023 episodes versus the 2026 crossover, Boruto manga reading order, Kishimoto/Ikemoto creative credits, Bandai Naruto Card Game, global Naruto Mobile expansion, and the official Jump Festa 2027 Naruto stage. Each story includes a confirmed-versus-unannounced distinction where appropriate, official first-party references, dated source checks, unique SEO fields and an automatically generated original concept-art cover. Naruto series news and Boruto reading stories use the existing Anime/Manga site categories to preserve navigation and templates; topics such as Movies and Games are editorial beats rather than new one-article categories. New article date and real modified timestamp are November 15, 2026; older original announcement dates remain separately identified. Keep public article research focused on actual release information, never unsupported premiere dates or artificial claims of firsthand use. CI asserts all eleven URLs, 1000+ words, sources, artwork-related template requirements, links, sitemap entries and exact publish sequence.

## Boruto: Two Blue Vortex first five chapters — November 15, 2026

The seventh tracked series lives at `/reviews/manga/boruto-two-blue-vortex/`. The first five individual source-based critical responses cover Chapter 1 `Boruto`, Chapter 2 `Tree`, Chapter 3 `Uzuhiko`, Chapter 4 `The Awakening`, and Chapter 5 `Target`. Each has 1,000+ words of original critical interpretation, VIZ/Shueisha references, independent review links, a spoiler disclosure, concept-art cover generated by the existing build, an accurate source-based byline, no fabricated score, and chapter-to-chapter navigation. The series hub shows current publisher release information, separate from this retrospective first batch. Chapters 6–10 can be added in the next batch without creating a new template or weakening the distinction between research synthesis and firsthand reading.

## Incremental IndexNow notifications for Bing — November 15, 2026

Only **newly created editorial article URLs** are submitted to IndexNow after the live website serves the matching build and verification key. These are `/news/{slug}/` and `/reviews/{anime|manga}/{series}/{episode|chapter}-{number}/`. The existing 93 editorial URLs are frozen in `content/indexnow-baseline.json` for exclusion; this baseline **does not claim those URLs were indexed or accepted**. Successful HTTP 200 notifications are recorded in `content/indexnow-notified.json` and committed by the workflow to avoid resubmitting them. HTTP 202, an unavailable live site, or a build mismatch leaves only the **new, pending URLs** eligible for later retry. Archive pages, policy pages, topic collections, pagination routes, unchanged articles and the complete sitemap are never posted in subsequent batches. The sitemap continues to include all indexable pages for normal search discovery. CI tests selection with synthetic examples and validates that all newly added chapters are either pending or successfully notified. IndexNow acknowledgement does not guarantee Bing search indexing.
