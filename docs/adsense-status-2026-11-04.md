# USA Anime Club AdSense readiness — code and human gates (November 4, 2026)

## Completed and committed
- All 15 published guides now contain a topic-specific, documented reader decision or primary-source comparison; the source examples do not assert attendance, purchases or device testing.
- Repetitive generic checklist titles have been replaced with article-specific titles; table-of-contents anchors remain stable.
- Analytics and Clarity use one consent-aware module across generated pages; AdSense site verification uses the correct publisher meta tag and ads.txt.
- Sitemap/robots generation, canonical URLs, article metadata, non-indexable 404, internal links and site-wide editorial/source checks are automated.
- A high-resolution WebP hero and hair-animation layers were generated from the original art, bypassing unreliable AVIF MIME handling on Hostinger. Latest live-status validation must still be checked.
- The review register has 15 open human-source-review tasks; no fictitious reviewer or completed date was invented.
- The 20-asset origin inventory exists, with external rights sign-off still pending. Missing rights documentation must not be presented as obtained.

## Owner-controlled release gates — NOT completed by the code changes
1. A real person verifies each material factual claim, its original source, editorial improvements and image permissions; records name and date in content/review-register.json. Current completion is **0/15**.
2. Test that satyaprasadwork@gmail.com actually receives and sends correspondence; the website's published address alone does not prove operation.
3. In Google AdSense > Sites, confirm account eligibility, site ownership detection, precise review status, any policy notices and any identity/payment requirements. Submit only when ready.
4. In Search Console and Bing Webmaster Tools, confirm sitemap submission, indexing, manual actions, security and individual URL inspection. HTTP 200 does not imply indexing.
5. Confirm hosting and email data retention policies match the published privacy notice. For applicable ad serving, configure a **Google-certified IAB TCF CMP** through an authorized provider/account; analytics consent is not equivalent to ads consent.
6. Independently review original artwork against protected characters/trademarks and retain the provenance/usage evidence. Project-generated media isn't automatically proof of third-party rights.
7. Run and record responsive-browser testing, keyboard menu navigation and mobile field Core Web Vitals; the source-level CI checks cannot prove the live visual experience.

## How to check
- GitHub Actions site-validation workflow builds the generated site and commits generated HTML, robots and sitemap.
- `npm run audit:live` (with `LIVE_AUDIT_ALL=1`) checks all published routes, live canonical metadata, tracking verification, actual 404 and media delivery. It is advisory because a Hosting/CDN update can lag GitHub's source push.
- Human sign-off instructions: docs/human-editor-review-gate.md
- Primary evidence ledger: content/source-evidence.json
- Asset inventory: content/asset-provenance.json

**No technical checklist can guarantee Google AdSense approval; Google judges the published site and its account separately.**
