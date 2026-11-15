# USA Anime Club — Internal Google and Bing indexing audit (2026-11-15)

This is a repository-level technical/content preflight, **not** an indexing guarantee or search-engine approval. Do not publish as a public page.

## Scope and findings

- Current repository: 67 editorial articles, 31 source-based critical responses, and 129 canonical URLs in the most recently inspected XML sitemap.
- robots.txt allows crawling; the static template generates self-referential canonicals, SSR text, headings, trust links, structured data, sitemap, RSS and original editorial concept artwork. Existing validation checks links and unique SEO metadata.
- Risk 1: Every news report **and** evergreen guide was emitted as NewsArticle and included in the rolling Google News sitemap.
- Risk 2: Artificial 12:00 UTC precision appeared in publication metadata when only a genuine publication *date* was recorded.
- Risk 3: Generic sitemap freshness dates were assigned to category, archive and trust pages, and a site-wide maximum timestamp was reused for individual review pages.
- Editorial review queue: 34 articles have one primary source and no additional structured supporting records. This alone violates no numerical source-count rule; claims need source-by-source checking, not invented citations.
- Source-based critiques must remain labeled accurately and must not claim firsthand viewership, readership, or fabricated ratings.

## Code remediation scope

1. Explicit news/feature classification for all articles; missing classification blocks new publishing instead of placing a guide into the Google News feed.
2. NewsArticle schema reserved for classified news; Article schema for guides and features. Both remain canonical and indexable.
3. Google News XML restricted to news published within two days.
4. Article publication dates emitted as genuine dates unless a precise timestamp is available; retain true per-edit UTC update timestamps.
5. Sitemap lastmod set only for articles and reviews with per-item revision dates; omit unverifiable freshness claims for collection and trust pages.
6. A generated-site-wide indexing audit is added to CI so regressions block publication. Existing new-only Bing IndexNow and consent-aware tracking remain untouched.

## Verified implementation result (GitHub Actions, November 15, 2026)

- PASS: `node scripts/build.mjs`, revision checks, existing site validator, new `node scripts/indexability-audit.mjs`, and generator reproducibility.
- PASS: **131 canonical pages**, **67 editorial articles**, **31 source-based critical responses**, **22,586 internal references**, **275 JSON-LD blocks**.
- The standard XML sitemap contains 131 canonical URLs. 98 article/critical-response URLs have per-item truthful `lastmod`; other archive/trust pages omit unverified date assertions.
- The separate Google News sitemap contains **30 classified news URLs**, rather than all 67 features and guides. No evergreen feature was included.
- No regressions to website design, shared GA4, Clarity, AdSense integration, or the new-only Bing IndexNow workflow.
- CI reported 0 pending new editorial URLs; **no repeat Bing submission was necessary**.
- The resulting regenerated files were committed to the GitHub `main` branch; this verifies source/build output, not live Hostinger delivery.

## Live verification still required

- Inspect representative templates and failed URLs in Google Search Console URL Inspection, Page Indexing, Manual Actions and Crawl Stats. Confirm live HTTP 200/404, Googlebot HTML, selected canonical and indexing reason.
- Inspect Bing Webmaster Tools URL Inspection for crawl behavior and selection. IndexNow HTTP 200 is **not** proof of indexing.
- Check Hostinger edge responses for HTTPS/www redirects, live XML access, X-Robots-Tag, valid 404 status and stale cache.
- Validate rich-result candidates in Google Rich Results Test; check live consent/advertising against current regional requirements with a certified CMP where applicable.
- Verify third-party sources actually support claims and that illustration/media rights are documented. A repository source URL is not a completed independent fact-check.
- Avoid making changes solely to simulate freshness. Google does not require 1,000 words or a specific number of supporting sources.

## Official references
- Google technical requirements: https://developers.google.com/search/docs/essentials/technical
- Google people-first guidance: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Google News sitemap: https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
- Google Article structured data: https://developers.google.com/search/docs/appearance/structured-data/article
- Google sitemap lastmod: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Bing Webmaster Guidelines: https://www.bing.com/webmasters/help/bing-webmaster-guidelines-30fba23a
