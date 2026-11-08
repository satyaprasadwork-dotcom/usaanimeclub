# USA Anime Club remediation register — November 8, 2026

## Code-level improvements
- Adds visible screen-reader status for the guide filters, an accessible pressed state for the theme switch, and focus restoration when reopening/closing analytics preferences. Does not change the approved theme or layout.
- Fixes one citation-ledger mismatch: the anime convention guide's public-accommodation claim now cites the corresponding ADA Title III regulation, not general web accessibility guidance.
- Adds the WebP hero derivative to the existing artwork provenance inventory; strengthens continuous checks against undocumented human reviewer sign-off or unverified copyright approval.
- Validates a public IndexNow key and notifies Bing/participating engines of all 50 published URLs after a successful live deployment check. HTTP 200/202 means received, not indexed.
- Verifies the published Gmail contact account was able to send a self-test message into its own inbox. Does not establish delivery from outside providers.

## Owner-controlled gates still pending
1. Human claim-by-claim editorial review of 15 guides, with actual reviewer, dated evidence, corrections and review register update.
2. Independent rights/identity verification and artwork provenance approval. Do not infer copyright permissions merely from generated artwork.
3. AdSense account-level status, policy rejection reasons, payments/identity requirements, and actual approved state.
4. Google Search Console indexed URLs and individual URL Inspection/Request Indexing. The Indexing API is limited to certain JobPosting and BroadcastEvent pages, not ordinary anime guides.
5. Bing Webmaster Tools indexed page counts and eventual IndexNow reporting.
6. Confirm GA4/Clarity, hosting and email retention policies and any required Google-certified IAB TCF CMP before personalized ad serving where applicable.
7. Independent browser/device/screen-reader and field Core Web Vitals testing, including LCP, INP and CLS.

## Validation
`npm run check`, `npm run audit:seo`, `npm run audit:integrations`, `node scripts/validate-editorial.mjs`, `LIVE_AUDIT_ALL=1 npm run audit:live`.

Official IndexNow: https://www.indexnow.org/documentation
Google Indexing API eligibility: https://developers.google.com/search/apis/indexing-api/v3/quickstart

Do not claim AdSense approval, confirmed Google indexing, human fact verification, or copyrights cleared without account records and actual human sign-off.
