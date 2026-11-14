# USA Anime Club — anime news publication

This repository powers **https://usaanimeclub.com/**. It is deliberately focused on verified anime news with US-specific streaming, theatrical, and release information.

## Edit and publish
- Add a news object to `content/articles.json` using the existing schema. Use independently verified primary sources. Never invent announcements, publication dates or release details.
- Run `node scripts/build.mjs`. This regenerates crawlable article pages, archives, feeds and sitemaps. No npm dependencies are needed.
- Commit the changed content and generated HTML. The repository alone does not guarantee the Hostinger production domain is deployed; configure hosting/deployment separately.
- Run `node scripts/build.mjs --check` to verify generated HTML is current (the CI workflow also does this).

## Features
Static page URLs, common article template, per-page SEO metadata/canonicals, JSON-LD structured data, XML sitemap, fresh-only Google News sitemap, RSS, robots.txt, llms.txt, unique original editorial SVG artwork, accessibility, responsive layout, and privacy-gated Google Analytics + Microsoft Clarity.

Analytics IDs: `G-G0TNMR0FQL` and `yyqq9cryjc`. Analytics are optional: scripts load only after the visitor accepts and privacy choices are available from every footer.

**Editorial note:** The supplied older guides were intentionally not republished because this website now covers anime news only. External sources listed under each article are third-party announcements, not claims of exclusive reporting. No AdSense code is installed.
