# USA Anime Club — production deployment & search visibility (November 5, 2026)

## Confirmed deployment gap

At the last recorded production audit in GitHub Actions, the repository contained **50 generated pages**, including 20 new tool URLs, but Hostinger responded with **404 for those 20 tools**. The live `sitemap.xml` contained **30 URLs**. GitHub generated the pages successfully and committed them to `main`, but the live host had not published that version. This is a **hosting deployment sync issue**, not proof that the new tool files are absent.

The original workflow ran production checks as *advisory* before committing the new generated files. The current workflow instead commits the new build first and makes an explicit, retried live verification. A red live-verification check means publication is not confirmed, even when all code and SEO tests pass.

## What to inspect in Hostinger hPanel

Follow Hostinger's current Git deployment documentation:
https://www.hostinger.com/support/1583302-how-to-deploy-a-git-repository-in-hostinger/

1. Sign into **hPanel → Websites → Manage** for **usaanimeclub.com**.
2. Open **Advanced → Git** (or search for Git in the sidebar).
3. Confirm **GitHub repository** is `satyaprasadwork-dotcom/usaanimeclub`, **branch** is `main`, and deployment **root directory** is the domain's active document root (typically `public_html`). Do not target a nested folder accidentally.
4. Confirm **Auto-deployment** is **On**, and inspect **All deployments** for the recent GitHub `main` commit. If the deployment is queued or failed, check its logs.
5. Choose **Redeploy** to pull the latest `main` commit. Hostinger's modern GitHub OAuth integration can automatically deploy later pushes; verify the GitHub app has access to this repository.
6. If a different site or old checkout occupies `public_html`, **back up existing files** before changing or reconnecting a repository. Do not delete user data or switch document roots until checked.
7. Purge Hostinger cache, LiteSpeed cache, and any external CDN (including Cloudflare if used), then retry with a hard browser refresh.

A hosting-account owner must complete the hPanel settings if they are wrong. This repository cannot reveal or change Hostinger account deployment settings.

## Verify the actual live version

After a successful hosting deployment, inspect:

- `https://usaanimeclub.com/tools/` — lists **23** tool cards.
- `https://usaanimeclub.com/tools/anime-release-time-converter/` — **200 OK** with a working form.
- `https://usaanimeclub.com/tools/us-anime-convention-finder/` — **200 OK**.
- `https://usaanimeclub.com/deployment-version.json` — `publishedPages: 50` and a `buildId` matching `main`.
- `https://usaanimeclub.com/sitemap.xml` — **50** canonical `<loc>` entries.
- `https://usaanimeclub.com/robots.txt` — sitemap pointer and open crawl directive.
- `https://usaanimeclub.com/ads.txt` — publisher ID `pub-7937216909291905`.
- An intentionally fake URL should return a real HTTP **404**, not a 200 homepage fallback.
- Homepage dropdowns, search, mobile menu and tool submit buttons should work in a real browser.

Use `LIVE_AUDIT_ALL=1 npm run audit:live` from a networked shell. The GitHub Actions workflow checks production after committing generated HTML and reports a failure if the fingerprint is missing, routes are 404, or the sitemap is stale.

## SEO, AEO, GEO: generated site practices

- Every public path has its own descriptive title, meta description, small set of topic-relevant meta keywords, canonical URL, `en-US` language, social sharing tags, structured data, and publication URL. Google **does not use the keywords meta tag for web ranking**; the tag is provided for editorial completeness, not to game search.
- Guides have one visible H1, original explanatory content, a short answer-first summary, internal links, dated authorship metadata, referenced primary sources and BlogPosting structured data.
- Tool pages have usable input forms, textual outputs, visible source restrictions, internal guide links and WebApplication metadata. The tools that open third-party sources do **not** claim unverified live databases.
- The guides and tools hubs have CollectionPage and ItemList markup matching their visible links.
- Search visibility depends on **real content and source reliability**, not schema alone. Fifteen article claim-by-claim human reviews remain pending in the research register. These cannot be replaced by automatic SEO checks.
- The official Google preferred-source deeplink is `https://www.google.com/preferences/source?q=usaanimeclub.com`. It appears in the shared footer and near article headers. Readers may still need to confirm their choice in Google, and whether the source appears is controlled by Google.

Google Preferred Sources documentation: https://developers.google.com/search/docs/appearance/preferred-sources

## Analytics and advertising

- GA4 ID `G-G0TNMR0FQL` and Microsoft Clarity ID `yyqq9cryjc` live only in `assets/tracking.js` and are loaded after a visitor accepts analytics via the consent interface. No separate tracking fragments are copied across individual pages.
- AdSense ownership verification meta ID `ca-pub-7937216909291905` is emitted once on all generated pages from `templates/layout.html`. `ads.txt` contains the corresponding publisher declaration.
- Ad serving is still **disabled pending approval and consent requirements**; this prevents prematurely starting advertising in regions where a Google-certified CMP is needed. Shared verification code is **not** an approved ads-serving or monetization setup.
- GA4, Clarity, AdSense site access, Google Search Console and Bing Webmaster Tools require their respective account-level verification. Repository changes cannot confirm those account dashboards.

## What constitutes release completion

1. GitHub's source validations and the 20 tool interaction tests pass.
2. The output commit containing all generated HTML is present on `main`.
3. Hostinger shows the matching branch deployment as **Completed**.
4. The live build fingerprint matches the generated source, all 50 public URLs are present, and the smoke audit passes.
5. Search Console and Bing receive the live sitemap and report crawl/index information; indexation is not guaranteed.

**Important:** do not describe a green GitHub generation job as a successful Hostinger deployment unless steps 3 and 4 also pass.
