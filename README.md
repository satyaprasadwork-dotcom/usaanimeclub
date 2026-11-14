# USA Anime Club — Anime, Manga, Manhwa & Web Novel News

Editorial home: https://usaanimeclub.com/. US-focused, verified updates with direct links to primary sources.

## Locked shared article template

All articles use the exact same markup in `scripts/build.mjs`. Its article body is protected by `scripts/article-template.lock.json` and CI. Do not edit the shared article template for ordinary publishing.

To publish 10, 20, 100 or more articles, edit **only `content/articles.json`** to add source-verified entries. Required data: unique slug, one of Anime/Manga/Manhwa/Web Novels, headline, description, SEO keywords, publication date, dated source or verification date, link, original summary and sections. Never invent dates, US licenses, staff or official announcements. Do not copy publisher text or licensed artwork.

Run `node scripts/build.mjs` then `node scripts/validate.mjs`. The generator creates indexable HTML article pages, original typography artwork, RSS, XML and Google News sitemaps, and removes generated pages/artwork for deleted stories.

Every HTML page includes the shared consent handler that conditionally loads GA4 `G-G0TNMR0FQL` and Clarity `yyqq9cryjc`; do not add duplicate tags. New stories inherit all canonical, SEO, article schema, footer, policies and consent code.

Build passing on GitHub does not itself establish successful Hostinger deployment, Google News inclusion or AdSense approval.

## Editorial depth and source transparency

The build enforces at least **1,000 body words** on each news article and rejects duplicated paragraphs inside an article; this is the publication's requested standard, **not** a Google or Bing ranking requirement. Google explicitly says there is no preferred word count. Material must still offer distinct value, source links, accurate dates, and independent editorial checks before publishing.

NewsArticle JSON-LD includes reported source citation, topical subject and accurate word count. The shared article HTML template stays locked; source content and artwork themes are data-driven.

AdSense approval cannot be inferred from article length or passing CI. Before applying, independently verify live deployment, content accuracy and image rights, privacy and consent behavior, site access, and AdSense account status. Do not add unverified AdSense publisher IDs or ads.txt declarations.

## Site identity and Google's Preferred Sources

Cards use a single folio-style component and a four-category color system. Site typography uses Fraunces headlines, IBM Plex Sans text and IBM Plex Mono editorial labels. The Google link is an official publisher deeplink to `https://www.google.com/preferences/source?q=usaanimeclub.com`; users must select the site themselves, and Google controls source eligibility. No third-party script is necessary for that link.

Editorial quality is assessed through primary-source attribution, editing and accuracy checks. Automated paragraph and similarity checks do not certify a zero-plagiarism score. Do not present generated content as independent eyewitness reporting or assert a human review that did not occur.
