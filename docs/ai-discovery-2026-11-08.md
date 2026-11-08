# AI discovery and crawler policy — USA Anime Club
Updated: 2026-11-08

## What is implemented
- `llms.txt` at the site root is generated from the **published** content catalog. It links to the homepage, hubs, all published guides, free tools, editorial information and policies. Drafts and the 404 page are excluded. It is regenerated on publishing changes.
- `robots.txt` retains `User-agent: * / Allow: /` and explicitly allows major AI search, assistant, and model-development user agents, including OpenAI, Anthropic, Perplexity, Google, Bing, Apple, Meta, Common Crawl, Amazon, and ByteDance agents. Allowing a crawler does not guarantee its visits, indexing or use.
- The existing JSON-LD generator continues to emit **one** valid graph per published HTML page. We have enriched its publisher with an editorial-policy link and contact point, identified publicly accessible content, and added BreadcrumbList references for non-homepage pages. Article and web-tool structured data remain grounded in visible content; no unsupported FAQ, reviews or ratings were created.
- The generator fingerprint now includes `scripts/build.mjs`, so changes to generated structured data trigger a new deployment build ID.
- GitHub Actions validates structured data, published `llms.txt` links, explicit robots.txt crawler rules, and live availability after deployment.

## Limitations
- `llms.txt` is an optional emerging convention, not a search indexing API or a ranking signal. Google Search does not use it for AI search visibility.
- AI search crawlers and model-training crawlers have different purposes. This configuration explicitly permits both as requested; review the policy if training permission is not desired.
- `robots.txt` is voluntary guidance. A hosting firewall, CDN, security rule, rate limit or blocked IP range can still prevent crawling; check Hostinger/CDN controls and real request logs if crawler access fails.
- Structured data provides machine-readable page context but does not guarantee rich results, citations, AdSense approval or ranking.

## Verification
Run `npm run build && npm run check && npm run audit:seo && npm run audit:integrations`, then `LIVE_AUDIT_ALL=1 npm run audit:live`. After deployment inspect:
- https://usaanimeclub.com/llms.txt
- https://usaanimeclub.com/robots.txt
- https://usaanimeclub.com/guides/choose-first-anime/
- https://usaanimeclub.com/tools/anime-starter-planner/

References: https://developers.openai.com/api/docs/bots · https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler · https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
