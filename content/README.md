# Publishing workflow

Edit `content/pages/*.html` and `content/catalog.json`. Rendered website HTML, cards, JSON-LD, guide directory, and sitemap are generated from the catalog and shared layout.

1. Write original, cited work in a new `content/pages/guides--slug.html` with a real <main> element, article, byline, sources, and useful takeaways.
2. Add metadata to `content/catalog.json`: path, source, kind=article, title, description, category, cover, published, modified, and status="draft". Drafts are not rendered or indexed.
3. Add an owned or appropriately licensed image in `assets/covers/<cover>.svg`; check alt text, cropping, visual relevance, and ownership.
4. Review primary sources and every important factual claim; be especially careful with dates, streaming availability, rights and prices. Do not invent experience, quotes, testing, partners or event attendance.
5. Change status to "published" only after review; run `npm run build` and `npm run check`. Commit the sources and generated output together.
6. GitHub Actions checks the published site for stale generated files, links, metadata, and article structure.

Do not treat a 1,000-word count or a passing automated test as proof an article is original or factually correct. The separate editorial review register tracks remaining manual work.

**AdSense:** The site uses an account verification meta tag without loading ads. Before ad serving, enable a Google-certified CMP where required; the site's analytics preference widget is not a TCF-certified CMP.
