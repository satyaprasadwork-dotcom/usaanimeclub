# USA Anime Club SEO, AEO and GEO implementation
Updated: November 4, 2026

## Scope
SEO means search-engine crawlability and meaningful search-result presentation. AEO means providing clear, useful direct responses to legitimate reader questions. GEO here means being eligible for retrieval and citation in generative-search experiences, **not** manipulating or promising AI-model citations. Google explicitly says no special AI-search tags, dedicated llms.txt files, or invented GEO schemas are needed for Google AI Overviews or AI Mode.

## Changes implemented
- All fifteen substantive guides have a real reader question as an H2 and a concise answer grounded in their existing visible article content. The table of contents links directly to that answer. These are regular HTML sections, *not* unsupported FAQPage or HowTo rich-result tricks.
- Each guide now has a concise search-result title separate from its unchanged full editorial headline. Canonical URLs, page descriptions, clean paths, and the author/publisher remain consistent.
- The static generator prints real publication and editorial modification dates visibly, aligned with article JSON-LD and the dated sitemap. Do not update modification dates merely to appear fresh.
- BlogPosting schema now identifies the publicly credited editorial project, links its About page, includes a visible-answer abstract, and uses source URLs actually linked on the article page. This does not mean all article facts have completed human review.
- Guides and Tools hubs have CollectionPage plus ItemList metadata that corresponds to actual linked pages. The guides hub includes four useful topical reading pathways, not fabricated category tags.
- Three real in-browser calculators have WebApplication descriptions with price 0 (they are free), but **no** invented ratings or reviews. Google's SoftwareApplication rich result generally requires real ratings/reviews; do not promise rich eligibility based solely on this markup.
- The existing non-article pages now use the actual site hero image for social preview cards; article pages preserve their relevant existing cover illustrations. Large article preview raster images remain a possible later enhancement to verify with external card tools.
- Added a dedicated SEO/AEO/GEO regression test in GitHub Actions, alongside existing page, source, metadata, analytics, AdSense-verification, canonical and sitemap checks.
- All 29 published canonical URLs stay listed in the automatically generated sitemap. The 404 remains noindex and out of the sitemap.
- Existing HTML/CSS/JS behavior, homepage animation, consent and tracking are preserved.

## What not to claim
- Rich results, Google Discover, featured snippets, AI Overviews, Bing Copilot citations, top rankings, Search Console indexing or AdSense approval are **not** automatic consequences.
- A source URL in JSON-LD is not an independently completed human claim verification. Human editorial review is tracked separately and is still pending until a real reviewer signs off.
- A US-focused editorial site is not thereby a physical US business; do not add unverified LocalBusiness, address, office or reviews schema.
- Do not fabricate question/answer markup or expose FAQPage only for search engines.
- Do not add a fabricated site search SearchAction or hidden content; users must be able to read the same answers as crawlers.

## Verification and monitoring
- Source and generated HTML: \`npm run build && npm run audit:seo && npm run validate && npm run audit:integrations\`.
- Live HTTP: \`LIVE_AUDIT_ALL=1 npm run audit:live\`. This checks accessibility, canonical URLs and deployed assets, not indexing.
- Validate representative article, guides hub and calculator URLs with Google's Rich Results Test and Schema Markup Validator.
- Use Google Search Console's URL Inspection, Page indexing and Performance reports, plus Bing Webmaster Tools, to confirm discovery and monitor real outcomes.
- Check Google Search Console's AI Features reports if available for the site's account. Availability and metrics cannot be inferred from public HTML.
- Fix any valid source/revision/indexing errors seen in the accounts; do not create new pages merely to chase generic keywords.
- Continue real editorial fact-checking, original research, image-rights review and mailbox verification before AdSense resubmission.

## Primary references
- https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- https://developers.google.com/search/docs/appearance/ai-features
- https://developers.google.com/search/docs/appearance/structured-data/article
- https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
- https://developers.google.com/search/docs/appearance/structured-data/software-app
- https://www.bing.com/webmasters/help/bing-webmaster-guidelines-30fba23a
