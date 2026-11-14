# USA Anime Club — Anime, Manga, Manhwa & Web Novel News

Editorial home: https://usaanimeclub.com/. US-focused, verified updates with direct links to primary sources.

## Locked shared article template

All articles use the exact same markup in `scripts/build.mjs`. Its article body is protected by `scripts/article-template.lock.json` and CI. Do not edit the shared article template for ordinary publishing.

To publish 10, 20, 100 or more articles, edit **only `content/articles.json`** to add source-verified entries. Required data: unique slug, one of Anime/Manga/Manhwa/Web Novels, headline, description, SEO keywords, publication date, dated source or verification date, link, original summary and sections. Never invent dates, US licenses, staff or official announcements. Do not copy publisher text or licensed artwork.

Run `node scripts/build.mjs` then `node scripts/validate.mjs`. The generator creates indexable HTML article pages, original typography artwork, RSS, XML and Google News sitemaps, and removes generated pages/artwork for deleted stories.

Every HTML page includes the shared consent handler that conditionally loads GA4 `G-G0TNMR0FQL` and Clarity `yyqq9cryjc`; do not add duplicate tags. New stories inherit all canonical, SEO, article schema, footer, policies and consent code.

Build passing on GitHub does not itself establish successful Hostinger deployment, Google News inclusion or AdSense approval.
