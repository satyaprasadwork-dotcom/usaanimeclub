# USA Anime Club — production verification and deployment

This is the current **custom static HTML** site from [GitHub](https://github.com/satyaprasadwork-dotcom/usaanimeclub). GitHub Actions builds and validates its generated pages but **does not deploy to Hostinger**.

## Check live versus repository

1. Open the [live homepage](https://usaanimeclub.com/) and the public [build marker](https://usaanimeclub.com/build-info.json).
2. Compare `buildId` to the file of the same name on the GitHub `main` branch. A missing or different value means Hostinger is not serving the current generated build, or a cache is serving an older copy.
3. The current homepage should have **Anime, Manga, Manhwa and Web Novels** navigation, a scrolling **Latest News** bar with Pause, and the newest story from the current GitHub article inventory. It must not show old **Streaming / TV Anime / Movies** zero-count tiles.

## Hostinger Git deployment (requires site-owner access)

Per Hostinger's official documentation, go to **hPanel → Websites → Manage site → Advanced → Git**. Confirm the connected GitHub repository is `satyaprasadwork-dotcom/usaanimeclub`, the branch is `main`, and the deployment root matches the website's actual `public_html` directory. Check that auto-deployment is enabled, then inspect the most recent deployment history and commit. **Redeploy** from the connected repository if the latest generated commit is missing.

**Important:** Do not disconnect/reconnect or change the deployment destination without confirming the correct production root and making a backup. Reconnecting another repository can overwrite files in the hosting directory.

The site is a **static HTML deployment**, not a long-running Node server. The Node renderer and `node_modules` are only build-time dependencies. The generated HTML/CSS/JS/images and `build-info.json` are the public assets.

## If Hostinger says the current commit is deployed

Use **No cache preview** to bypass caching. If it shows the correct build, clear the server cache using **Cache Manager → Purge All** (if enabled). For Hostinger CDN, use **Manage site → Performance → CDN → Flush cache**. If another CDN is connected, purge it separately. Hard-refresh an incognito browser and compare `build-info.json` again.

If No cache preview still shows the old homepage, investigate the **connected repository/branch, deployment root and last deploy status** before treating it as a cache problem.

## Final production acceptance checks

- [ ] Home, all four category pages, every generated article page, About, Contact, policy pages, and 404 respond as intended
- [ ] A newly published article appears in the archive, its category page, RSS, sitemap and news ticker after GitHub Actions completes
- [ ] All PNG share images load from the live site
- [ ] Mobile menu, local time and ticker Pause/Resume work on real devices
- [ ] Analytics acceptance loads only the configured GA4 and Clarity IDs; rejection prevents both; revocation reloads
- [ ] Verify regional consent requirements and advertising CMP separately before activating ads
- [ ] Check the exact live source URLs, publication dates, image rights, Search Console and Bing indexing as appropriate

## References

- Hostinger Git deployment: https://www.hostinger.com/support/1583302-how-to-deploy-a-git-repository-in-hostinger/
- Hostinger clear cache: https://www.hostinger.com/support/1583501-how-to-clear-cache-in-hostinger/

## Live content consistency and stale caches

- Compare the current GitHub `build-info.json` to the live `https://usaanimeclub.com/build-info.json`, and confirm the first headline and article count match the source inventory. Inspect the homepage, `/news/`, and a recent article URL separately: a different set of articles across these paths indicates a partial deployment or stale CDN response.
- Shared CSS and JS URLs now contain the deterministic build ID. HTML responses request no-store and CDN no-store, where supported. Clear the Hostinger/CDN cache if an old HTML document or stylesheet remains visible after the deployment.
- The old `/press/` page should return HTTP 301 to `/contact/` after the latest Apache `.htaccess` is deployed. Do not retain old layouts at retired URLs.
- Before removing legacy orphan files from hosting, back up production and inventory URLs that remain useful. Confirm whether an old URL should redirect, return 404/410 or be restored rather than blindly deleting previous content.
- GitHub Actions can validate generated files but **cannot certify Hostinger deployment or live browser behavior**. Verify against both mobile and desktop after deployment.
