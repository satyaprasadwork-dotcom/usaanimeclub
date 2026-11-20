import assert from "node:assert/strict";
import {readFileSync,existsSync,readdirSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {runInNewContext} from "node:vm";
import {ARTICLES_PER_PAGE,getPageCount,getPageItems,paginationHtml} from "./pagination.mjs";
import {findNewEditorialUrls,isEditorialArticleUrl} from "./indexnow-urls.mjs";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>readFileSync(resolve(root,p),"utf8");
const articles=JSON.parse(read("content/articles.json"));
const editorialFormats=JSON.parse(read("content/editorial-formats.json"));
const featuredImages=JSON.parse(read("content/featured-images.json"));
const reviewFeaturedImages=JSON.parse(read("content/review-featured-images.json"));
const reviews=JSON.parse(read("content/reviews.json"));
for(const [slug,im] of Object.entries(reviewFeaturedImages)){
  assert.equal(im.webp,"assets/reviews/"+slug+".webp");
  assert.equal(im.jpg,"assets/reviews/"+slug+".jpg");
  assert.equal(im.source,"original-ai-generated-editorial");
  assert(im.alt.length>=30);
  assert(existsSync(resolve(root,im.webp))&&existsSync(resolve(root,im.jpg)),"Missing approved review image: "+slug);
  const review=reviews.find(r=>r.kind+"-"+r.seriesSlug+"-"+r.installmentSlug===slug);
  assert(review,"Featured review image has no published review: "+slug);
  const reviewPath="reviews/"+review.kind+"/"+review.seriesSlug+"/"+review.installmentSlug+"/index.html";
  const html=read(reviewPath);
  assert(html.includes('srcset="/'+im.webp+'"'),"WebP missing from "+reviewPath);
  assert(html.includes('src="/'+im.jpg+'"'),"JPEG fallback missing from "+reviewPath);
  assert(html.includes('alt="'+im.alt+'"'),"Alt text missing from "+reviewPath);
  assert(html.includes('property="og:image" content="https://usaanimeclub.com/'+im.jpg+'"'),"Social preview missing from "+reviewPath);
}
assert.deepEqual(Object.keys(editorialFormats).sort(),articles.map(a=>a.slug).sort(),"Every article needs a declared format");
for(const a of articles)assert(["news","feature"].includes(editorialFormats[a.slug]),"Invalid editorial type "+a.slug);
const base="https://usaanimeclub.com";
const sitemap=read("sitemap.xml");
const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
const unique=(values,label)=>assert.equal(new Set(values).size,values.length,"duplicate "+label);
assert(urls.length>=articles.length+8,"sitemap omits articles or trust pages");
unique(urls,"sitemap URLs");
unique(articles.map(a=>a.slug),"article slugs");
const chapter39LegacySlug="boruto-two-blue-vortex-chapter-39-release-date-preview-predictions"; const chapter39Path="/reviews/manga/boruto-two-blue-vortex/chapter-39/"; const articlePath=a=>"/news/"+a.slug+"/"; const newsArticles=articles; const expectedArticles=articles.map(a=>base+articlePath(a));
const series=JSON.parse(read("content/review-series.json"));

assert(series.length>=6,"The original review series must remain");
assert(Array.isArray(reviews),"Review records must be an array");

const boruto=series.find(s=>s.kind==="manga"&&s.slug==="boruto-two-blue-vortex");
assert(boruto,"Boruto: Two Blue Vortex must be listed under manga chapter reviews");
const borutoChapters=reviews.filter(r=>r.kind==="manga"&&r.seriesSlug===boruto.slug).sort((a,b)=>a.installmentNumber-b.installmentNumber);
assert(borutoChapters.length>=39,"At least thirty-nine published Boruto chapter reviews required");
assert.deepEqual(borutoChapters.map(r=>r.installmentNumber),Array.from({length:borutoChapters.length},(_,i)=>i+1),"Boruto chapter reviews must be sequential without gaps");
const chapter39Review=borutoChapters.find(r=>r.installmentNumber===39); assert(chapter39Review,"Chapter 39 published review missing"); assert.equal(chapter39Review.headline,"Sarada Turns the Rescue Into a Team Win","Unexpected Chapter 39 review headline"); assert.equal(chapter39Review.officialInstallmentUrl,"https://www.viz.com/shonenjump/boruto-two-blue-vortex-chapter-39/chapter/52195","Chapter 39 official English installment URL missing"); assert(chapter39Review.sections.flatMap(x=>x[1]).join(" ").trim().split(/\s+/).filter(Boolean).length>=1200,"Chapter 39 review needs original depth"); assert(chapter39Review.references.length>=4&&chapter39Review.references.some(r=>r.url===chapter39Review.officialInstallmentUrl),"Chapter 39 needs dated primary and independent sources"); assert(!articles.some(a=>a.slug===chapter39LegacySlug),"Chapter 39 preview should be replaced by the released review"); assert(urls.includes(base+chapter39Path),"Chapter 39 review missing from sitemap"); assert(!urls.includes(base+"/news/"+chapter39LegacySlug+"/"),"Legacy news URL must not remain canonical or in sitemap"); const currentBorutoHub=read("reviews/manga/boruto-two-blue-vortex/index.html"); assert(currentBorutoHub.includes(chapter39Path)&&currentBorutoHub.includes("Sarada Turns the Rescue Into a Team Win"),"Chapter 39 should appear in Boruto chapter archive"); assert(!currentBorutoHub.includes("Official Preview and What Could Happen")&&!currentBorutoHub.includes("Preview &amp; predictions"),"Stale Chapter 39 preview card remains"); assert(read("reviews/manga/boruto-two-blue-vortex/chapter-38/index.html").includes(chapter39Path),"Chapter 38 must link forward to the Chapter 39 review"); assert(existsSync(resolve(root,"assets/reviews/manga-boruto-two-blue-vortex-chapter-39.webp")),"Chapter 39 featured image missing from review assets"); for(const r of borutoChapters){
 const wordCount=r.sections.flatMap(x=>x[1]).join(" ").trim().split(/\s+/).filter(Boolean).length;
 assert(wordCount>=1000,"Boruto chapter criticism must contain 1000+ analysis words: "+r.installmentSlug);
 assert(r.reviewMode==="sourced"&&!r.firsthandConfirmed&&r.score===undefined,"No invented firsthand rating: "+r.installmentSlug);
 assert(r.references.length>=4,"Boruto chapter needs official and independent research: "+r.installmentSlug);
}

// The current five-chapter batch needs original 1,000+ word analyses, a
// publisher reference and dated independent research for every installment.
for(let n=26;n<=30;n++){
 const r=borutoChapters.find(r=>r.installmentNumber===n);
 assert(r,"Missing chapter "+n);
 assert(r.references.some(ref=>ref.url.includes("viz.com/shonenjump/boruto-two-blue-vortex-chapter-"+n+"/")),"Missing exact official VIZ chapter link "+n);
 assert(r.references.some(ref=>ref.url.includes("shueisha.co.jp/books/items/")),"Missing primary Shueisha volume source "+n);
 assert(r.references.some(ref=>ref.url.includes("thegeekiary.com/boruto-two-blue-vortex-manga-issue-"+n+"-review")),"Missing contemporary chapter-specific critical evidence "+n);
 assert(r.sections.length>=6,"Chapter "+n+" lacks substantial structured editorial critique");
}

// Chapters 31–35 are independently sourced retrospectives, not fabricated
// firsthand reviews. Every chapter must have substantive original analysis,
// an official English publication directory/link and a Shueisha reference.
for(let n=31;n<=35;n++){
 const r=borutoChapters.find(entry=>entry.installmentNumber===n);
 assert(r,"Missing Boruto Chapter "+n);
 const wordCount=r.sections.flatMap(section=>section[1]).join(" ").trim().split(/\s+/).filter(Boolean).length;
 assert(wordCount>=1200,"Chapter "+n+" must have substantive 1200+ word analysis");
 assert(r.sections.length>=6,"Chapter "+n+" missing structured article sections");
 assert(r.references.some(ref=>ref.url.startsWith("https://www.viz.com/shonenjump/")),"Missing VIZ publisher documentation "+n);
 assert(r.references.some(ref=>ref.url.includes("shueisha.co.jp/books/items/")),"Missing official Shueisha volume source "+n);
 assert(r.references.some(ref=>ref.url.includes("thegeekiary.com/boruto-two-blue-vortex-manga-issue-")),"Missing chapter-specific independent post-release review "+n);
 assert(r.reviewMode==="sourced"&&!r.firsthandConfirmed&&r.score===undefined,"Unsubstantiated rating or reading claim "+n);
}

// Chapter 36–38: verify publisher-linked retrospectives and keep these
// chapters as delta-only IndexNow targets (no archives or older URLs).
for(let n=36;n<=38;n++){
 const review=borutoChapters.find(r=>r.installmentNumber===n);
 assert(review,"Missing published Boruto chapter "+n);
 const words=review.sections.flatMap(s=>s[1]).join(" ").trim().split(/\s+/).filter(Boolean).length;
 assert(words>=1200,"Chapter "+n+" critical response below 1200 words");
 assert(review.sections.length>=7,"Chapter "+n+" lacks sufficient developed critical sections");
 assert(review.reviewMode==="sourced"&&review.score===undefined&&!review.firsthandConfirmed,"Fabricated review rating/firsthand claim "+n);
 assert(review.officialInstallmentUrl.startsWith("https://www.viz.com/shonenjump/boruto-two-blue-vortex-chapter-"+n+"/chapter/"),"Official chapter reading link missing "+n);
 assert(review.references.some(ref=>ref.url.includes("viz.com/shonenjump/boruto-two-blue-vortex-chapter-"+n+"/")),"Official VIZ citation missing "+n);
 assert(review.references.some(ref=>ref.url.startsWith("https://naruto-official.com/en/news")),"NARUTO official publisher/editorial evidence missing "+n);
 assert(review.references.some(ref=>ref.url.includes("kyodai.ghost.io/")||ref.url.includes("thegeekiary.com/")),"Chapter "+n+" lacks independent dated critical source");
}

assert.equal(series.filter(s=>s.kind==="anime").length,3,"Pilot needs three anime series");
assert(series.filter(s=>s.kind==="manga").length>=3,"Original manga review series must remain");
for(const s of series){
 const path="reviews/"+s.kind+"/"+s.slug+"/index.html";
 assert(existsSync(resolve(root,path)),"Review series hub missing: "+path);
 const html=read(path);
 assert(!html.includes("What US readers should know")&&!html.includes("review-series-context"),"Redundant series context must be removed "+path);
 assert(!html.includes("Critical responses and reviews"),"Redundant review heading must be removed "+path);
 if(reviews.some(r=>r.kind===s.kind&&r.seriesSlug===s.slug))assert(html.includes('class="review-published-card"'),"Cards missing from series hub "+path);
 assert(html.includes('rel="canonical" href="'+base+"/reviews/"+s.kind+"/"+s.slug+'/"'),"Incorrect review hub canonical "+path);
 if(s.slug!=="boruto-two-blue-vortex"&&s.hideOverviewCards!==true){
  assert(html.includes(s.officialUrl.replaceAll("&","&amp;")),"Official primary source missing from hub "+path);
  assert(html.includes('datetime="'+s.checkedOn+'"'),"Verification date missing "+path);
 }
 const activeReviews=reviews.filter(r=>r.kind===s.kind&&r.seriesSlug===s.slug);
 if(activeReviews.length===0)assert(html.includes('meta name="robots" content="noindex, nofollow"'),"Unreviewed release hub must be noindex "+path);
 else assert(!html.includes('meta name="robots" content="noindex, nofollow"'),"Reviewed hub must be indexable "+path);
 for(const newsSlug of s.relatedNewsSlugs)assert(html.includes('/news/'+newsSlug+'/'),"Source-linked related news missing "+path);
 if(s.slug==="boruto-two-blue-vortex"){
  assert(!html.includes("US platform / publisher"),"Boruto review hub must omit optional publisher metadata");
  assert(!html.includes("currently lists Chapter 38"),"Boruto review hub must omit latest-release paragraph");
  assert(!html.includes("LATEST VERIFIED ENTRY"),"Boruto archive should not display release status");
  assert(!html.includes("Read the chapters")&&!html.includes("Open the official chapter directory"),"Unwanted chapter-directory block must be absent from Boruto hub");
  const expectedCards=borutoChapters.length;
  const allBorutoCards=Array.from({length:getPageCount(expectedCards)},(_,i)=>i===0?html:read("reviews/manga/boruto-two-blue-vortex/page/"+(i+1)+"/index.html"))
    .reduce((total,pageHtml)=>total+(pageHtml.match(/class="review-published-card"/g)||[]).length,0);
  assert.equal(allBorutoCards,expectedCards,"Boruto series pagination must list every published chapter card");
 }

}
for(const page of ["reviews/index.html","reviews/anime/index.html","reviews/manga/index.html"]){
 const html=read(page);
 if(reviews.length===0)assert(html.includes('meta name="robots" content="noindex, nofollow"'),"Empty critical archive must not be indexed "+page);
 assert(html.includes("OFFICIAL")||html.includes("official"),"Review landing lacks source-backed context "+page);
 assert(!html.includes("Published criticism"),"Review archives should show cards without a redundant heading "+page);
 assert(!html.includes("review-introduction")&&!html.includes("USA Anime Club follows selected US anime episode"),"Redundant two-column explanation must be removed from review archives "+page);
 for(const navLabel of ["All tracked series","Anime episodes","Manga chapters"])assert(html.includes(navLabel),"Reviews navigation tab disappeared: "+navLabel+" on "+page);
 for(const [path,expected] of [["reviews/index.html",series.length],["reviews/anime/index.html",series.filter(s=>s.kind==="anime").length],["reviews/manga/index.html",series.filter(s=>s.kind==="manga").length]]){
  if(page!==path)continue;
  assert.equal((html.match(/class="review-series-card"/g)||[]).length,expected,"Review landing must show only its series cards "+page);
  assert(!html.includes('class="review-published-card"'),"Individual review cards belong only inside series hubs "+page);
 }
}

// Review series archives automatically paginate at twelve chapters or episodes.
// Validate the full partition, canonical URLs, sitemap, next/previous controls,
// newest-first sorting and an accessible current page marker.
for(const s of series){
 const items=reviews.filter(r=>r.kind===s.kind&&r.seriesSlug===s.slug)
  .sort((a,b)=>b.publishedOn.localeCompare(a.publishedOn)||b.installmentNumber-a.installmentNumber);
 const archiveItems=items;
  const basePath="/reviews/"+s.kind+"/"+s.slug+"/";
 const pageCount=getPageCount(archiveItems.length);
 const visited=[];
 for(let page=1;page<=pageCount;page++){
  const route=page===1?basePath:basePath+"page/"+page+"/";
  const path="reviews/"+s.kind+"/"+s.slug+"/"+(page===1?"":"page/"+page+"/")+"index.html";
  const html=read(path);
  assert(html.includes('rel="canonical" href="'+base+route+'"'),"Incorrect review pagination canonical "+route);
  if(items.length)assert(urls.includes(base+route),"Published review pagination omitted from sitemap "+route);
  const actual=[...html.matchAll(/class="review-published-card" href="([^"]+)"/g)].map(m=>m[1]);
  const expected=getPageItems(archiveItems,page).map(item=>basePath+item.installmentSlug+"/");
  assert(actual.length<=ARTICLES_PER_PAGE,"Review page exceeds twelve cards "+route);
  assert.deepEqual(actual,expected,"Review chapter order, overlap or missing cards "+route);
  visited.push(...actual);
  if(pageCount>1){
   assert(html.includes('class="news-pagination"'),"Review pagination missing "+route);
   assert(html.includes("Page "+page+" of "+pageCount),"Incorrect review page summary "+route);
   assert(html.includes('aria-current="page"'),"Review page selection not marked "+route);
   if(page<pageCount)assert(html.includes('href="'+basePath+"page/"+(page+1)+'/" rel="next"'),"Next page missing "+route);
   if(page>1)assert(html.includes('href="'+(page===2?basePath:basePath+"page/"+(page-1)+"/")+'" rel="prev"'),"Previous page missing "+route);
  }
 }
 assert.equal(visited.length,archiveItems.length,"Some chapter cards missing from series pages "+s.slug);
 assert.equal(new Set(visited).size,visited.length,"Duplicate reviews across series pages "+s.slug);
}
const borutoPageTwo="reviews/manga/boruto-two-blue-vortex/page/2/index.html";
assert(existsSync(resolve(root,borutoPageTwo)),"Boruto page two missing");

assert(read("index.html").includes('href="/reviews/"'),"Reviews navigation missing");
assert(read("index.html").includes('<li><a href="/reviews/">Reviews</a></li>'),"Reviews footer link missing");
if(reviews.length===0)assert(!urls.some(u=>u.includes("/reviews/")),"Noindex preview releases must not be in sitemap");
else {
  assert(reviews.length>=6,"Published critical responses must preserve the original review set");
  for(const r of reviews){
    const u=base+"/reviews/"+r.kind+"/"+r.seriesSlug+"/"+r.installmentSlug+"/";
    assert(urls.includes(u),"Published criticism missing from sitemap "+u);
    const path="reviews/"+r.kind+"/"+r.seriesSlug+"/"+r.installmentSlug+"/index.html";
    const html=read(path);
    const seriesInfo=series.find(s=>s.kind===r.kind&&s.slug===r.seriesSlug);
    const installmentLabel=r.installmentSlug.replace("-"," ").replace(/\b\w/g,ch=>ch.toUpperCase());
    const expectedReviewTitle=seriesInfo.title+" "+installmentLabel+" Review: "+r.headline;
    assert(html.includes("<title>"+expectedReviewTitle.replaceAll("&","&amp;")+" | USA Anime Club</title>"),"Review page title should use Review, not Critical Response: "+u);
    assert(html.includes("<h1>"+expectedReviewTitle.replaceAll("&","&amp;")+"</h1>"),"Review page H1 should use Review: "+u);
    assert(!html.includes(" Critical Response:"),"Legacy Critical Response label in review: "+u);
    const scripts=[...html.matchAll(new RegExp('<script type="application/ld[+]json">([^<]+)</script>','g'))].map(x=>JSON.parse(x[1]));
    const analysis=r.reviewMode==="sourced";
    const schema=scripts.find(s=>s["@type"]===(analysis?"Article":"Review"));
    assert(schema,"Incorrect critical analysis structured data "+u);
    assert.equal(schema.author?.name,r.reviewerName,"Author attribution mismatch "+u);
    assert.equal(schema.dateModified,r.updatedAt,"Review update timestamp stale "+u);
    assert(html.includes('datetime="'+r.updatedAt+'"'),"Visible updated date missing "+u);
    assert(html.includes('href="'+r.officialInstallmentUrl+'"'),"Official installment link absent "+u);
    assert(html.includes('class="review-cover"'),"Original preview artwork missing "+u);
    assert(existsSync(resolve(root,"assets/reviews/"+r.kind+"-"+r.seriesSlug+"-"+r.installmentSlug+".svg")),"Original review illustration missing "+u);
    assert(existsSync(resolve(root,"assets/reviews/"+r.kind+"-"+r.seriesSlug+"-"+r.installmentSlug+".png")),"Preview PNG missing "+u);
    if(analysis){
      assert(!r.firsthandConfirmed&&!r.watchedOrReadOn&&r.score===undefined,"Sourced critique must not imply firsthand reading or scoring "+u);
      assert(!html.includes("review-method-note")&&!html.includes("Our editorial desk has not independently streamed or read this complete installment"),"Removed review disclaimer panel must not reappear "+u);
      assert(html.includes("Source-based review by")&&html.includes("Research sources and release verification"),"Accurate byline or sources missing "+u);
      assert(schema.genre==="Source-based critical analysis","Sourced critique must use Article schema "+u);
      assert(!schema.reviewRating,"Sourced analysis incorrectly contains a rating "+u);
      assert.equal(schema.citation.length,r.references.length,"Citation count mismatch "+u);
      assert(html.includes('datetime="'+r.researchCheckedOn+'"'),"Research check date absent "+u);
      for(const ref of r.references){
        assert(html.includes('href="'+ref.url.replaceAll("&","&amp;")+'"'),"Visible cited research link missing "+u);
        assert(schema.citation.includes(ref.url),"Research link missing from structured data "+u);
        assert(html.includes('datetime="'+ref.date+'"'),"Dated reference missing "+u);
      }
    }else assert(schema.itemReviewed?.url===r.officialInstallmentUrl,"Firsthand review lacks linked official installment "+u);
    assert(html.includes('href="/corrections/"'),"Corrections route missing "+u);
  }
}
const narutoBatchSlugs=[
  "naruto-shadow-rising-kishimoto-new-manga-team-7-teaser-confirmed",
  "naruto-ninku-four-episode-anime-crossover-story-confirmed-details",
  "boruto-anime-part-2-production-status-return-date-confirmed",
  "naruto-live-action-movie-team-7-global-casting-director-confirmed",
  "project-rasengan-naruto-boruto-official-roadmap-explained",
  "naruto-2023-delayed-anniversary-episodes-vs-2026-ninku-crossover",
  "boruto-manga-reading-order-next-generations-two-blue-vortex-official",
  "kishimoto-vs-ikemoto-boruto-two-blue-vortex-creator-writing-art-credits",
  "naruto-card-game-june-2027-worldwide-starter-decks-official-guide",
  "naruto-mobile-worldwide-launch-us-release-status-official",
  "jump-festa-2027-naruto-shadow-rising-anime-official-stage-guide"
];
assert.equal(narutoBatchSlugs.length,11,"Eleven Naruto and Boruto guides expected");
for(let i=0;i<narutoBatchSlugs.length;i++){
 const slug=narutoBatchSlugs[i];
 const a=articles.find(x=>x.slug===slug);
 assert(a,"Missing Naruto/Boruto article "+slug);
 assert.equal(a.date,"2026-11-15","New publication date must be accurate "+slug);
 assert.equal(a.checkedOn,slug==="boruto-manga-reading-order-next-generations-two-blue-vortex-official"?"2026-11-20":"2026-11-15","Source recheck date missing "+slug);
 assert.equal(a.publishSequence,53+i,"Article ordering gap "+slug);
 assert(["Anime","Manga"].includes(a.category),"Article must reuse the approved category system "+slug);
 assert(a.sections.length>=8,"Original topic coverage too shallow "+slug);
 assert(a.sections.reduce((n,s)=>n+s[1].join(" ").trim().split(/\s+/).length,0)>=1000,"New article below 1000 words "+slug);
 assert(a.references.length>=3,"New article needs several independently useful official sources "+slug);
 assert(a.references.every(r=>r.label&&r.url.startsWith("https://")&&r.date),"Source metadata incomplete "+slug);
 const p="news/"+slug+"/index.html";
 assert(existsSync(resolve(root,p)),"Generated article missing "+p);
 const html=read(p);
 assert(html.includes('rel="canonical" href="'+base+"/news/"+slug+'/"'),"Bad new article canonical "+slug);
 assert(urls.includes(base+"/news/"+slug+"/"),"New article omitted from sitemap "+slug);
 assert(html.includes('class="supporting-sources"')&&html.includes("Additional primary records"),"Article must expose attributed primary research "+slug);
 assert(html.includes('class="related-section"')&&html.includes("Related coverage"),"Article must expose related reporting "+slug);
 const titleTag=(html.match(/<title>([^<]*)<\/title>/)||[])[1]||"";
 assert(titleTag.length>15,"New article has no SEO title "+slug);
}
const requiredNewStories=[
  "steel-ball-run-jojo-netflix-2nd-3rd-stage-episode-schedule-us",
  "frieren-season-3-october-2027-golden-land-arc-official-premiere",
  "delicious-in-dungeon-season-2-october-2027-netflix-us-confirmed",
  "frieren-manga-volume-15-viz-us-english-december-2026-edition",
  "blue-exorcist-volume-33-viz-english-december-2026-official-reading",
  "regression-of-the-close-combat-mage-english-webtoon-official-reading-guide"
];
for(const slug of requiredNewStories){
 const a=articles.find(a=>a.slug===slug);
 assert(a,"Required new article missing: "+slug);
 assert.equal(a.date,"2026-11-15","New article publication date mismatch "+slug);
 assert(a.references?.length>=2,"Expected multiple verified first-party records "+slug);
 assert(a.sections.reduce((n,s)=>n+s[1].join(" ").split(/\s+/).length,0)>=1000,"Article below editorial depth threshold "+slug);
}

for(const href of expectedArticles)assert(urls.includes(href),"missing article from sitemap "+href);

const localPath=url=>{
 const parsed=new URL(url,base);
 if(parsed.origin!==base)return null;
 const path=decodeURIComponent(parsed.pathname);
 return path.endsWith("/")?path.slice(1)+"index.html":path.slice(1);
};
const titles=[],descriptions=[],keywords=[];
let testedLinks=0,schemas=0;
for(const pageUrl of urls){
 const file=localPath(pageUrl);
 assert(existsSync(resolve(root,file)),"missing page "+file);
 const html=read(file);
 assert(html.includes('<html lang="en-US">'),"wrong site language "+file);
 assert(html.includes('<main id="main">'),"missing main landmark "+file);
 assert(html.includes("<h1>"),"missing h1 "+file);
 assert(html.includes('rel="canonical" href="'+pageUrl+'"'),"wrong canonical "+file);
 assert(html.includes("gtag/js?id=G-G0TNMR0FQL"),"GA4 tag missing "+file);
 assert(html.includes("/assets/site.js"),"shared runtime missing "+file);
 assert(!html.includes("data-analytics-choice")&&!html.includes("data-analytics-toggle"),"Analytics preference UI must not appear "+file);
 for(const [re,array,label] of [
   [/<title>([^<]+)<\/title>/,titles,"title"],
   [/<meta name="description" content="([^"]+)"/,descriptions,"description"],
   [/<meta name="keywords" content="([^"]+)"/,keywords,"keywords"]
 ]){
   const match=html.match(re);assert(match&&match[1].length>8,"missing "+label+" in "+file);array.push(match[1]);
 }
 const scripts=[...html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g)].map(m=>JSON.parse(m[1]));
 assert(scripts.length>0,"schema missing "+file);schemas+=scripts.length;
 for(const a of [...html.matchAll(/(?:href|src)="([^"]+)"/g)]){
   const link=a[1];if(!link.startsWith("/")&&!link.startsWith("#"))continue;
   if(link.startsWith("#")){
     if(link==="#main"||link==="#latest")assert(html.includes('id="'+link.slice(1)+'"'),"missing anchor "+link+" in "+file);
     continue;
   }
   const destination=localPath(link);
   assert(destination&&existsSync(resolve(root,destination)),"broken internal link "+file+" -> "+link);
   testedLinks++;
 }
 for(const img of [...html.matchAll(/<img\b[^>]*>/g)])assert(/\balt="/.test(img[0]),"missing image alternative "+file);
 const article=articles.find(a=>pageUrl===base+articlePath(a));
 if(article){
   const type=editorialFormats[article.slug]==="news"?"NewsArticle":"Article";
   const ld=scripts.find(x=>x["@type"]===type);
   assert(ld,type+" JSON-LD missing "+file);
   assert.equal(ld.datePublished,article.date,"Publication date must not invent a timestamp: "+file);
   const revision=JSON.parse(read("content/editorial-guides.json"))[article.slug];
   assert.equal(ld.dateModified,revision.updatedAt||(revision.updated||article.date),"Story-specific update date incorrect "+file);
   if(revision.updatedAt)assert(html.includes('datetime="'+revision.updatedAt+'"'),"Visible updated timestamp missing "+file);
   if(article.checkedOn)assert(html.includes('datetime="'+article.checkedOn+'"'),"Visible source recheck date missing "+file);
   assert(ld.editor?.name==="Satya Prasad","Editor-in-Chief not named in NewsArticle "+file);
   assert(ld.abstract===article.summary,"Article abstract differs from on-page short answer "+file);
   if(article.references?.length){
     assert(html.includes('class="supporting-sources"'),"Additional primary records block absent "+file);
     for(const record of article.references){
       assert(ld.citation.includes(record.url),"Supplementary citation missing from schema "+file);
       assert(html.includes('href="'+record.url.replaceAll("&","&amp;")+'"'),"Supplementary source not linked in article "+file);
       assert(html.includes('datetime="'+record.date+'"'),"Supplementary source date absent "+file);
     }
   }

   assert(html.includes('id="quick-answer"')&&html.includes('id="quick-answer-heading"'),"Source-linked quick answer missing "+file);
   assert(html.includes('id="primary-source"'),"Primary source anchor missing "+file);
   const answerStart=html.indexOf('<section class="tldr" id="quick-answer"');
   const answerEnd=html.indexOf('</section>',answerStart);
   const answer=html.slice(answerStart,answerEnd);
   assert(answer.includes(article.summary.replaceAll("&","&amp;").replaceAll("<","&lt;")),"Quick answer does not match summary "+file);
   assert(answer.includes('href="'+article.source.replaceAll("&","&amp;")+'"'),"Quick answer must cite original source "+file);
   assert(answer.includes('datetime="'+article.sourceDate+'"'),"Quick answer has no source record date "+file);
   assert(html.includes('href="#quick-answer"')&&html.includes('href="#primary-source"'),"Answer/source missing from contents "+file);

   assert(html.includes('href="/about/#editor-in-chief"'),"Editor-in-Chief credit absent "+file);
   assert(html.includes('class="reader-guide"'),"Reader guide absent "+file);
   assert(html.includes('datetime="'+article.sourceDate+'"'),"source date absent "+file);
   assert(html.includes(article.source.replaceAll("&","&amp;")),"primary source absent "+file);
   assert(existsSync(resolve(root,"assets/news/"+article.slug+".svg")),"image not generated "+file);
 }
}
unique(titles,"SEO titles");unique(descriptions,"SEO descriptions");unique(keywords,"SEO keywords");
const expectedNews=newsArticles.filter(a=>{
 const published=Date.parse(a.date+"T00:00:00Z");
 return editorialFormats[a.slug]==="news"&&published<=Date.now()&&Date.now()-published<=48*60*60*1000;
}).map(a=>base+"/news/"+a.slug+"/");
const newsXml=read("news-sitemap.xml");
const foundNews=[...newsXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
assert.deepEqual(foundNews.sort(),expectedNews.sort(),"Google News sitemap contains stale or missing URLs");
assert(foundNews.length<=1000,"Google News sitemap exceeds Google's 1,000-article limit");
assert.equal((newsXml.match(/<news:news>/g)||[]).length,foundNews.length,"Every Google News URL needs a news:news element");
assert.equal((newsXml.match(/<news:publication_date>/g)||[]).length,foundNews.length,"Every Google News URL needs a publication date");
assert.equal((newsXml.match(/<news:title>/g)||[]).length,foundNews.length,"Every Google News URL needs a news title");
for(const loc of foundNews){
 assert(urls.includes(loc),"Google News sitemap URL must also exist in main sitemap: "+loc);
 assert(loc.startsWith(base+"/news/"),"Google News sitemap must use canonical article URLs: "+loc);
}
assert(read("robots.txt").includes(base+"/sitemap.xml"),"robots.txt lacks sitemap");
const rss=read("feed.xml");
for(const a of newsArticles)assert(rss.includes('<guid isPermaLink="true">'+base+"/news/"+a.slug+"/</guid>"),"RSS omits "+a.slug);
assert(!rss.includes(base+"/news/"+chapter39LegacySlug+"/"),"Former Chapter 39 news URL remains in RSS");
const homepage=read("index.html");
const mostRecent=[...newsArticles].sort((a,b)=>b.date.localeCompare(a.date)||(b.publishSequence||0)-(a.publishSequence||0)||b.sourceDate.localeCompare(a.sourceDate)||a.title.localeCompare(b.title))[0];
const featured=homepage.match(/<a class="feature-card"[^>]* href="([^"]+)"/);
assert(featured&&featured[1]==="/news/"+mostRecent.slug+"/","featured headline should be latest source announcement");

// Legacy fallback remains for cached HTML; newly built pages use normal inline tags.
const legacyTracking=read("assets/privacy.js");
assert(legacyTracking.includes("G-G0TNMR0FQL")&&legacyTracking.includes("yyqq9cryjc"),"Legacy tracking IDs must match");
assert(!legacyTracking.includes("localStorage")&&!legacyTracking.includes('gtag("consent"'),"Legacy runtime must not read saved analytics choices");



const homeHtml=read("index.html");
const style=read("assets/styles.css");
const uiScript=read("assets/site.js");
assert(homeHtml.includes('id="local-clock"'),"visitor-local clock missing from masthead");
assert(!homeHtml.includes("YOUR LOCAL TIME"),"clock label should not be visible");
assert(homeHtml.includes("THE ANIME NEWS DESK"),"editorial left label missing");
assert(!homeHtml.includes("UNITED STATES EDITION"),"obsolete masthead text remains");
assert(!homeHtml.includes("INDEPENDENT ANIME JOURNALISM"),"obsolete strapline remains");
assert(style.includes("color-scheme:light"),"light theme required");
assert(style.includes("--teal:#089e98")&&style.includes("--violet:#6e54db"),"anime palette incomplete");
assert(uiScript.includes("Intl.DateTimeFormat")&&uiScript.includes("updateClock()"),"live local clock is not wired");
for(const path of ["assets/styles.css","assets/favicon.svg","scripts/build.mjs"]){
  assert(!/#(?:df496d|ff4f9a|d52e58|e45977|ffe9ef|fff0f2)\b/i.test(read(path)),"old pink palette remains in "+path);
}


const allHtml=urls.map(loc=>read(localPath(loc)));
const cardMarkup=allHtml.filter(html=>html.includes('class="news-card"'));
assert(cardMarkup.length>=2,"news card template not applied");
for(const html of cardMarkup){
  assert(html.includes('class="card-media"'),"card media must be enclosed");
  assert(html.includes('class="card-meta"'),"card category/date missing");
  assert(html.includes('class="card-footer"'),"card footer missing");
}
assert(read("index.html").includes('class="feature-media"'),"lead story media grouping missing");
assert(read("index.html").includes('class="rail-read"'),"latest rail article labels missing");
const designCss=read("assets/styles.css");
assert(designCss.includes("border-top:5px solid var(--accent)"),"story cards lack a category accent border");
assert(designCss.includes("--head:\"Fraunces\""),"editorial headline typeface missing");
assert(!read("index.html").includes('class="topic-icon"'),"decorative topic icons should be removed");
// Lock the common article markup against accidental changes.
const articleLock=JSON.parse(read("scripts/article-template.lock.json"));
const buildSource=read("scripts/build.mjs");
const templateStart=buildSource.indexOf('    const content=`<div class="post-layout">');
const templateEnd=buildSource.indexOf("    const schema=",templateStart);
assert(templateStart>=0&&templateEnd>templateStart,"article template missing");
const templateContent=buildSource.slice(templateStart,templateEnd);
let fnvHash=2166136261;for(let i=0;i<templateContent.length;i++){fnvHash^=templateContent.charCodeAt(i);fnvHash=Math.imul(fnvHash,16777619)}
assert.equal((fnvHash>>>0).toString(16).padStart(8,"0"),articleLock.templateHash,"shared article template changed");
assert(articles.length>=1,"At least one verified article is required");
for(const category of ["Anime","Manga","Manhwa","Web Novels"]){
 assert(articles.some(a=>a.category===category),"Missing topic "+category);
 assert(read("news/index.html").includes('data-category="'+category+'"'),"Missing browse filter "+category);
}
const sourceSlugs=new Set(articles.map(a=>a.slug));
for(const file of readdirSync(resolve(root,"assets/news"))){
 if(file.endsWith(".svg"))assert(sourceSlugs.has(file.slice(0,-4)),"orphaned artwork "+file);
}
for(const file of readdirSync(resolve(root,"news"),{withFileTypes:true})){
 if(file.isDirectory()&&file.name!=="page"&&file.name!=="category")assert(sourceSlugs.has(file.name),"orphaned article page "+file.name);
}
const legacyTag=read("assets/privacy.js");
assert(legacyTag.includes("G-G0TNMR0FQL")&&legacyTag.includes("yyqq9cryjc"),"Legacy tag IDs missing");
for(const loc of urls){
 const html=read(localPath(loc));
 assert(html.includes("gtag/js?id=G-G0TNMR0FQL")&&html.includes("clarity.ms/tag/"),"Shared analytics tags missing from "+loc);
 assert(html.includes("/assets/site.js"),"Shared JS missing from "+loc);
}
assert(read("index.html").includes("/news/category/web-novels/"),"Web novel navigation missing");



const wc=text=>String(text).trim().split(/\s+/).filter(Boolean).length;
for(const a of articles){
 const paragraphs=a.sections.flatMap(section=>section[1]);
 const count=paragraphs.reduce((total,p)=>total+wc(p),0);
 assert(count>=1000,a.slug+" has only "+count+" content words");
 assert(new Set(paragraphs).size===paragraphs.length,"Duplicate paragraphs in "+a.slug);
 const page=read(articlePath(a).slice(1)+"index.html");
 const blocks=[...page.matchAll(new RegExp('<script type="application/ld[+]json">([^<]+)</script>','g'))].map(x=>JSON.parse(x[1]));
 const expectedType=editorialFormats[a.slug]==="news"?"NewsArticle":"Article";
 const schema=blocks.find(s=>s["@type"]===expectedType);
 assert(schema,"Missing "+expectedType+" JSON-LD "+a.slug);
 assert.equal(schema.wordCount,count,"Schema word count mismatch "+a.slug);
 assert(schema.citation?.includes(a.source),"Source citation omitted from JSON-LD "+a.slug);
 assert.equal(schema.about?.name,a.category,"Article category inconsistent "+a.slug);
 assert(page.includes('class="tldr"'),"Answer-first summary missing "+a.slug);
}
// Itachi topic cluster provides real cross-guide navigation and a spoiler boundary.
const itachiGuides=["why-did-itachi-kill-uchiha-clan-danzo-coup-explained","how-did-itachi-die-illness-sasuke-fight-explained","itachi-powers-explained-tsukuyomi-amaterasu-susanoo-izanami","itachi-shisui-kotoamatsukami-crow-uchiha-plan-explained","itachi-watch-order-naruto-shippuden-episodes-novels-manga","was-itachi-a-hero-or-villain-naruto-moral-legacy","itachi-vs-obito-kakashi-minato-madara-who-wins-canon-analysis"];
for(const slug of itachiGuides){
 const html=read("news/"+slug+"/index.html");
 assert(html.includes('class="itachi-reading-map"'),"Itachi guide navigator missing: "+slug);
 for(const related of itachiGuides)assert(html.includes('href="/news/'+related+'/"'),"Itachi crosslink missing: "+slug+" -> "+related);
 assert(html.includes("All except the watch-order guide"),"Itachi spoiler guidance missing: "+slug);
}
assert(read("assets/styles.css").includes(".itachi-map-links"),"Itachi navigation mobile styles missing");
const categoryStyles=read("assets/styles.css");
for(const category of ["Anime","Manga","Manhwa","Web Novels"]){
 assert(categoryStyles.includes('[data-news-category="'+category+'"]'),"No color palette for "+category);
}
const front=read("index.html");
assert(front.includes('class="feature-card" data-news-category='),"Lead story color is not category-aware");
assert(front.includes('class="latest-item" data-news-category='),"Latest news color is not category-aware");


const googlePreferred="https://www.google.com/preferences/source?q=usaanimeclub.com";
const homePage=read("index.html");
const homeMain=homePage.slice(homePage.indexOf('<main id="main">'),homePage.indexOf("</main>"));
const homeFooter=homePage.slice(homePage.indexOf('<footer class="foot">'));
assert(!homeMain.includes(googlePreferred),"Preferred Sources button must not appear in landing page content");
assert(homeFooter.includes('href="'+googlePreferred+'"'),"Preferred Sources link must remain in homepage footer");

const htmlPages=urls.map(u=>read(localPath(u)));
for(const html of htmlPages){
 assert(html.includes('href="'+googlePreferred+'"'),"Google Preferred Source link missing on an indexable page");
 assert(html.includes("fonts.googleapis.com/css2?family=Fraunces"),"new site-wide headline font missing");
 assert(html.includes("family=IBM+Plex+Sans"),"new site-wide text font missing");
}
assert(read("index.html").includes('class="card-folio"'),"Folio header missing from cards");
assert(read("index.html").includes('class="feature-folio"'),"Lead folio header missing");
assert(!read("index.html").includes("DISPATCH"),"Card dispatch numbering or label still visible");
assert(!read("index.html").includes('class="card-number"'),"Card numbering still visible");
assert(read("assets/styles.css").includes("justify-content:flex-end;gap:1rem;background:var(--accent)"),"Category headers must align right");
const everyStory=JSON.parse(read("content/articles.json"));
const bylines=everyStory.flatMap(a=>a.sections.flatMap(s=>s[1]));
assert(!bylines.some(p=>p.includes("USA Anime Club is")||p.includes("USA Anime Club will")),"Self-referential story boilerplate remains");


// Detect verbatim long passages reused in different articles. This is an internal
// originality safeguard, NOT a claim that an external plagiarism scan has run.
const crossArticlePhrases=new Map();
for(const article of articles){
  const words=article.sections.flatMap(section=>section[1]).join(" ").toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu)||[];
  const localPhrases=new Set();
  for(let index=0;index<=words.length-12;index++)localPhrases.add(words.slice(index,index+12).join(" "));
  for(const phrase of localPhrases){
    const owner=crossArticlePhrases.get(phrase);
    assert(!owner||owner===article.slug,"Repeated twelve-word passage in "+owner+" and "+article.slug);
    crossArticlePhrases.set(phrase,article.slug);
  }
}


const fourColorPalette={"Anime":"#173A70","Manga":"#932B3B","Manhwa":"#F4C542","Web Novels":"#16744A"};
const fourColorCSS=read("assets/styles.css");
for(const [category,color] of Object.entries(fourColorPalette)){
 assert(fourColorCSS.includes('.news-card[data-news-category="'+category+'"]'),"Card theme missing "+category);
 assert(fourColorCSS.includes('--accent:'+color+';--accent-dark:'),"Card theme color mismatch "+category);
 const example=articles.find(a=>a.category===category);
 assert(example,"Missing test category "+category);
 assert(read("assets/news/"+example.slug+".svg").includes('fill="'+color+'"'),"Cover identity color missing "+category);
}
assert(fourColorCSS.includes("--accent-contrast:#22200E"),"Yellow header must use dark text");
assert(fourColorCSS.includes("color:var(--accent-contrast,#fff)"),"Category header must use contrast-aware text");


for(const a of articles){
 const html=read(articlePath(a).slice(1)+"index.html");
 assert(!html.includes("ORIGINAL ANNOUNCEMENT"),"Original announcement sidebar card not removed: "+a.slug);
 assert(!html.includes('class="sidebar-panel sidebar-source"'),"Old source sidebar remains: "+a.slug);
 const noteStart=html.indexOf('<div class="source-note" id="primary-source">');
 const noteEnd=html.indexOf('</div>',noteStart);
 const note=noteStart>=0&&noteEnd>noteStart?html.slice(noteStart,noteEnd):"";
 assert(note&&note.includes("Primary source and reporting notes"),"Reporting notes missing: "+a.slug);
 assert(note.includes('class="source-primary-link"'),"Source button not inside reporting notes: "+a.slug);
 assert(note.includes('View primary source'),"Source button label missing: "+a.slug);
 assert(note.includes(a.source.replaceAll("&","&amp;")),"Source link mismatch: "+a.slug);
 assert(note.includes('datetime="'+a.sourceDate+'"'),"Source date/check note missing: "+a.slug);
 assert((html.match(/View primary source/g)||[]).length===1,"Duplicate source links: "+a.slug);
 assert(html.includes("IN THIS REPORT"),"Article table of contents was removed: "+a.slug);
}


for(const story of articles){
 const html=read(articlePath(story).slice(1)+"index.html");
 const mainStart=html.indexOf('<main id="main">'),mainEnd=html.indexOf("</main>",mainStart);
 const main=html.slice(mainStart,mainEnd);
 const related=main.lastIndexOf('class="related-section"');
 const follow=main.lastIndexOf('class="article-preferred-source"');
 const footerEnd=main.lastIndexOf("</section>");
 assert(related>=0,"Related coverage missing in "+story.slug);
 assert(follow>related,"Preferred source CTA must be after related coverage in "+story.slug);
 assert(follow<footerEnd,"Preferred source CTA must be before the end of main in "+story.slug);
 const followMarkup=main.slice(follow);
 assert(followMarkup.includes('href="https://www.google.com/preferences/source?q=usaanimeclub.com"'),"Google Preferred Sources URL missing in "+story.slug);
 assert(followMarkup.includes('Add as a preferred source on Google'),"Follow button missing in "+story.slug);
 assert((main.match(/class="article-preferred-source"/g)||[]).length===1,"Expected exactly one article-end follow CTA in "+story.slug);
}


// The ticker is generated from the complete content set for every website page.
for(const pageUrl of urls){
 const html=read(localPath(pageUrl));
 const headerEnd=html.indexOf("</header>");
 const tickerStart=html.indexOf('<nav class="news-ticker"');
 const mainStart=html.indexOf('<main id="main">');
 assert(headerEnd>=0&&tickerStart>headerEnd&&tickerStart<mainStart,"Ticker missing below header: "+pageUrl);
 assert(html.includes('aria-label="Latest anime, manga, manhwa and web novel headlines"'),"Ticker accessibility label missing: "+pageUrl);
 const originalStart=html.indexOf('<div class="news-ticker-set">',tickerStart);
 const cloneStart=html.indexOf('<div class="news-ticker-set" aria-hidden="true">',originalStart);
 assert(originalStart>=0&&cloneStart>originalStart,"Ticker repeat groups missing: "+pageUrl);
 const accessible=html.slice(originalStart,cloneStart);
 const repeat=html.slice(cloneStart,mainStart);
 for(const a of newsArticles){
   const link='/news/'+a.slug+'/';
   assert(accessible.includes('href="'+link+'"'),"Ticker omitted "+a.slug+" on "+pageUrl);
   assert(repeat.includes('href="'+link+'" tabindex="-1"'),"Ticker duplicate not hidden from tab order for "+a.slug);
 }
 assert((accessible.match(/class="news-ticker-link"/g)||[]).length===newsArticles.length,"Ticker count doesn't match published stories: "+pageUrl);
}
const movingTickerCSS=read("assets/styles.css");
assert(movingTickerCSS.includes("@keyframes news-ticker-left"),"Ticker animation missing");
assert(movingTickerCSS.includes("translateX(-50%)"),"Ticker must move right to left");
assert(movingTickerCSS.includes("prefers-reduced-motion:reduce")&&movingTickerCSS.includes(".news-ticker-track{animation:none"),"Reduced-motion ticker fallback missing");
assert(movingTickerCSS.includes(".news-ticker-window:hover .news-ticker-track"),"Ticker must pause on hover");


// Filtering is restricted to archive cards: ticker headlines must never be
// hidden or included in the archive's visible-story count.
const runtime=read("assets/site.js");
assert(runtime.includes('.archive-grid .news-card[data-news-category]'),"Archive selector must be scoped to archive cards");
assert(!runtime.includes('querySelectorAll("[data-news-category]")'),"Global category selector would hide ticker headlines");
const sheet=read("assets/styles.css");
assert(sheet.includes('.edition-bar{display:block}'),"Mobile clock strip must remain visible");
assert(sheet.includes('.edition-inner{justify-content:flex-end}'),"Small mobile screens need clock-only layout");
for(const loc of urls){
  const html=read(localPath(loc));
  assert(html.includes('id="local-clock"'),"Device local clock absent on "+loc);
}


// Topic archives are complete, canonical, paginated collections, not
// query-parameter filters limited to the current 12-story page.
const routeNames={"Anime":"anime","Manga":"manga","Manhwa":"manhwa","Web Novels":"web-novels"};
for(const [category,slug] of Object.entries(routeNames)){
 const matching=newsArticles.filter(a=>a.category===category);
 const count=getPageCount(matching.length);
 for(let number=1;number<=count;number++){
   const path=number===1?"/news/category/"+slug+"/":"/news/category/"+slug+"/page/"+number+"/";
   const canonical=base+path;
   assert(urls.includes(canonical),"Topic collection missing from sitemap "+path);
   const html=read(localPath(canonical));
   assert(html.includes('<h1>'+category+' news'),"Topic collection heading wrong "+path);
   assert(html.includes('rel="canonical" href="'+canonical+'"'),"Category canonical wrong "+path);
   const grid=html.slice(html.indexOf('class="grid archive-grid"'));
   for(const story of getPageItems(matching.sort((a,b)=>b.date.localeCompare(a.date)||(b.publishSequence||0)-(a.publishSequence||0)||b.sourceDate.localeCompare(a.sourceDate)||a.title.localeCompare(b.title)),number)){
     assert(grid.includes('href="/news/'+story.slug+'/"'),"Topic collection omitted "+story.slug);
   }
   assert((grid.match(/class="news-card"/g)||[]).length===getPageItems(matching,number).length,"Category card count wrong "+path);
   assert((grid.match(/class="news-card"/g)||[]).length<=ARTICLES_PER_PAGE,"More than 12 cards rendered on "+path);
   assert(html.includes('class="news-pagination"'),"Pagination missing on "+path);
   assert(html.includes('aria-current="page"'),"Current page missing from pagination on "+path);
   assert(html.includes("Page "+number+" of "+count),"Incorrect page count on "+path);
 }
 assert(homeHtml.includes('href="/news/category/'+slug+'/"'),"Homepage category path wrong "+slug);
}
assert(read("assets/site.js").includes('getElementById("category-all-link")'),"Archive filter lacks all-topic link");


// Regression test: the ticker must not be treated as archive-card content.
// Simulate archive interactions without a browser or external services.
function archiveInteractionHarness(){
 const categories=["All","Anime","Manga","Manhwa","Web Novels"];
 const buttons=categories.map(category=>({
   dataset:{category},attrs:{},handlers:{},setAttribute(k,value){this.attrs[k]=value},
   addEventListener(k,fn){this.handlers[k]=fn},
   click(){this.handlers.click?.()}
 }));
 const cards=[
   {dataset:{newsCategory:"Anime"},textContent:"Hirayasumi Netflix release",hidden:false},
   {dataset:{newsCategory:"Manga"},textContent:"One Piece volume 113",hidden:false},
   {dataset:{newsCategory:"Manga"},textContent:"Pokémon Adventures",hidden:false},
   {dataset:{newsCategory:"Manhwa"},textContent:"Omniscient Reader",hidden:false},
   {dataset:{newsCategory:"Web Novels"},textContent:"Royal Road Writathon",hidden:false}
 ];
 const tickerLinks=[{dataset:{newsCategory:"Anime"},textContent:"Ticker anime",hidden:false},{dataset:{newsCategory:"Manga"},textContent:"Ticker manga",hidden:false}];
 const status={textContent:""},empty={hidden:true},fullCategory={hidden:true,href:"",textContent:""};
 const search={value:"",handlers:{},addEventListener(k,fn){this.handlers[k]=fn},input(v){this.value=v;this.handlers.input?.()}};
 const tickerState={paused:false,classList:{toggle(){tickerState.paused=!tickerState.paused;return tickerState.paused}}};
 const tickerButton={attrs:{},textContent:"Pause",handlers:{},closest:()=>tickerState,setAttribute(k,v){this.attrs[k]=v},addEventListener(k,fn){this.handlers[k]=fn},click(){this.handlers.click?.()}};
 const document={
   getElementById(id){return({"filter-status":status,"no-results":empty,"category-all-link":fullCategory})[id]??null},
   querySelector(sel){return({"[data-news-search]":search,"[data-ticker-toggle]":tickerButton})[sel]??null},
   querySelectorAll(sel){return({
      "[data-category]":buttons,
      ".archive-grid .news-card[data-news-category]":cards,
      "[data-news-category]":[...cards,...tickerLinks]
   })[sel]??[]},
   addEventListener(){}
 };
 const location={search:"?category=Manga",href:"https://usaanimeclub.com/news/?category=Manga"};
 const history={replaceState(_s,_t,next){location.href=String(next);location.search=new URL(location.href).search}};
 runInNewContext(runtime,{document,location,history,window:{setInterval(){}},URL,URLSearchParams,Intl,Date});
 assert.equal(status.textContent,"2 stories shown on this page","Archive should count only archive cards");
 assert.equal(cards.filter(x=>!x.hidden).length,2,"Manga filter should show two cards");
 assert(tickerLinks.every(x=>!x.hidden),"Archive filter must not hide the ticker");
 assert.equal(fullCategory.href,"/news/category/manga/","Manga archive link incorrect");
 buttons.find(x=>x.dataset.category==="Anime").click();
 assert.equal(cards.filter(x=>!x.hidden).length,1,"Anime filter should show one card");
 assert.equal(fullCategory.href,"/news/category/anime/","Anime archive link incorrect");
 search.input("irrelevant match");
 assert.equal(status.textContent,"0 stories shown on this page","Archive search should update count");
 assert.equal(empty.hidden,false,"Archive empty state should show");
 assert(tickerLinks.every(x=>!x.hidden),"Search must not hide ticker links");
 buttons.find(x=>x.dataset.category==="All").click();
 search.input("");
 assert.equal(status.textContent,"5 stories shown on this page","Show-all filtering should restore all cards");
 assert.equal(fullCategory.hidden,true,"Full category link should hide when browsing all");
 tickerButton.click();
 assert.equal(tickerState.paused,true,"Ticker pause button did not stop animation");
 assert.equal(tickerButton.attrs["aria-pressed"],"true","Ticker pause state inaccessible");
 tickerButton.click();
 assert.equal(tickerState.paused,false,"Ticker resume button did not restart animation");
}
archiveInteractionHarness();
// Check all internal TOC anchors and duplicate element IDs for every canonical page.
for(const u of urls){
 const html=read(localPath(u));
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(new Set(ids).size,ids.length,"Duplicate element IDs on "+u);
 for(const href of [...html.matchAll(/\bhref="#([^"]+)"/g)].map(x=>x[1])){
   assert(ids.includes(href),"Broken in-page anchor #"+href+" on "+u);
 }
 assert(html.includes('data-ticker-toggle'),"Ticker pause control missing on "+u);
}
assert(read("assets/styles.css").includes(".news-ticker.is-paused .news-ticker-track"),"Pause-state CSS missing");


// Approved article illustrations use original WebP artwork in cards and articles,
// plus JPEG social previews. Unlisted stories retain the generated SVG/PNG fallback.
function checkPng(path,width,height){
 const data=readFileSync(resolve(root,path));
 assert(data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),"Invalid PNG signature "+path);
 assert.equal(data.readUInt32BE(16),width,"PNG width mismatch "+path);
 assert.equal(data.readUInt32BE(20),height,"PNG height mismatch "+path);
}
function checkApprovedImage(path,type){
 const data=readFileSync(resolve(root,path));
 assert(data.length>40000,"Approved illustration unexpectedly small: "+path);
 if(type==="webp"){
   assert.equal(data.toString("ascii",0,4),"RIFF","Invalid WebP container "+path);
   assert.equal(data.toString("ascii",8,12),"WEBP","Invalid WebP signature "+path);
   assert.equal(data.toString("ascii",12,16),"VP8 ","Expected lossy WebP "+path);
   assert.equal(data.readUInt16LE(26)&0x3fff,1200,"WebP width mismatch "+path);
   assert.equal(data.readUInt16LE(28)&0x3fff,675,"WebP height mismatch "+path);
 }else{
   assert.equal(data.readUInt16BE(0),0xffd8,"Invalid JPEG signature "+path);
   assert.equal(data.readUInt16BE(data.length-2),0xffd9,"Invalid JPEG end marker "+path);
 }
}
checkPng("assets/logo.png",256,256);
assert(Object.keys(featuredImages).length>=5,"Approved image library must retain the original five images");
for(const slug of Object.keys(featuredImages))assert(articles.some(a=>a.slug===slug),"Orphaned approved image: "+slug);
for(const a of articles){
 const chosen=featuredImages[a.slug];
 const image=chosen?"/"+chosen.jpg:"/assets/news/"+a.slug+".png",canonical=base+image;
 checkPng("assets/news/"+a.slug+".png",1200,675);
 const html=read(articlePath(a).slice(1)+"index.html");
 assert(html.includes('property="og:image" content="'+canonical+'"'),"Social OG image incorrect "+a.slug);
 assert(html.includes('name="twitter:image" content="'+canonical+'"'),"Social share image incorrect "+a.slug);
 const scripts=[...html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g)].map(x=>JSON.parse(x[1]));
 assert(scripts.some(x=>x["@type"]===(editorialFormats[a.slug]==="news"?"NewsArticle":"Article")&&x.image?.includes(canonical)),"Schema image not raster "+a.slug);
 if(chosen){
  const revision=chosen.revision??0,suffix=revision?"-rev-"+revision:"";assert(Number.isSafeInteger(revision)&&revision>=0&&chosen.webp==="assets/editorial-images/"+a.slug+suffix+".webp"&&chosen.jpg==="assets/editorial-images/"+a.slug+suffix+".jpg","Invalid image manifest path "+a.slug);
  assert(chosen.source==="original-ai-generated-editorial"&&chosen.alt?.length>30,"Missing image provenance "+a.slug);
  checkApprovedImage(chosen.webp,"webp");checkApprovedImage(chosen.jpg,"jpeg");
  assert(html.includes('class="post-hero" src="/'+chosen.webp+'" width="1200" height="675" alt="'+chosen.alt.replaceAll("&","&amp;")+'"'),"Article hero must use approved artwork with descriptive alt text "+a.slug);
  assert(html.includes('property="og:image:alt" content="'+chosen.alt.replaceAll("&","&amp;")+'"'),"Open Graph image alt text missing "+a.slug);
  assert(html.includes('name="twitter:image:alt" content="'+chosen.alt.replaceAll("&","&amp;")+'"'),"Twitter image alt text missing "+a.slug);
  assert(html.includes('property="og:image:type" content="image/jpeg"'),"JPEG social MIME missing "+a.slug);
 }else{
  assert(html.includes('class="post-hero" src="/assets/news/'+a.slug+'.svg"'),"Generic article fallback missing "+a.slug);
 }
}
const firstArticle=articles.find(a=>read("index.html").includes('class="feature-card" data-news-category="'+a.category+'" href="/news/'+a.slug+'/'));
assert(firstArticle,"Cannot identify homepage feature article");
const cover=featuredImages[firstArticle.slug];
const homeImage=cover?"/"+cover.jpg:"/assets/news/"+firstArticle.slug+".png";
assert(read("index.html").includes('content="'+base+homeImage+'"'),"Homepage social image incorrect");
if(cover)assert(read("index.html").includes('src="/'+cover.webp+'"'),"Homepage must show the approved cover image");
for(const name of readdirSync(resolve(root,"assets/news"))){
 if(name.endsWith(".png"))assert(sourceSlugs.has(name.slice(0,-4)),"Orphaned PNG art "+name);
}


// A deterministic marker makes live deployment verifiable independent of cache.
// This is intentionally public, but source JSON and build scripts must not be served.
const info=JSON.parse(read("build-info.json"));
assert.equal(info.canonicalHost,base,"Build-info canonical host incorrect");
assert.equal(info.articleCount,articles.length,"Build-info article count wrong");
assert(/^[0-9a-f]{16}$/.test(info.buildId),"Invalid deterministic build identifier");
assert.equal(info.latestArticle,mostRecent.slug,"Build-info latest story out of sync");
for(const u of urls){
 assert(read(localPath(u)).includes('<meta name="site-build" content="'+info.buildId+'">'),"Deployment marker inconsistent on "+u);
}
const htaccess=read(".htaccess");
assert(htaccess.includes("RewriteRule ^(?:scripts|content|"),"Source directories accessible through hosting");
assert(htaccess.includes("build-info.json"),"Build marker cache policy missing");
assert(htaccess.includes("RewriteRule ^news/boruto-two-blue-vortex-chapter-39-release-date-preview-predictions/?$ /reviews/manga/boruto-two-blue-vortex/chapter-39/ [R=301,L]"),"Permanent redirect missing for former Chapter 39 URL");
assert(!existsSync(resolve(root,"news/"+chapter39LegacySlug+"/index.html")),"Old Chapter 39 news HTML must be removed to prevent duplicates");
for(const pageUrl of urls){
 const pageHtml=read(localPath(pageUrl));
 for(const [asset,attr] of [["styles.css","href"],["site.js","src"]]){
  assert(pageHtml.includes(attr+'="/assets/'+asset+'?v='+info.buildId+'"'),"Outdated cache revision for "+asset+" on "+pageUrl);
 }
}
assert(read("contact/index.html").includes('>Email USA Anime Club</a>'),"Contact CTA missing");
assert(read("corrections/index.html").includes('>Request a correction</a>'),"Corrections CTA missing");
assert(read("assets/styles.css").includes(".prose a.btn,.prose a.btn:visited,.prose a.btn:hover,.prose a.btn:focus-visible{color:#fff;text-decoration:none}"),"Prose call-to-action contrast regression");
assert(read("assets/styles.css").includes(".prose a.btn.alt,.prose a.btn.alt:visited{color:var(--text)}"),"Outlined prose button contrast regression");
assert(htaccess.includes('Header set CDN-Cache-Control "no-store"'),"No CDN anti-staleness header");
const htmlCachePolicy=htaccess.slice(htaccess.indexOf("<FilesMatch"),htaccess.indexOf("</FilesMatch>"));
assert(htmlCachePolicy.includes('Header set Cache-Control "no-store, max-age=0, must-revalidate"'),"HTML pages must not retain outdated versions");
assert(htmlCachePolicy.includes('Header set CDN-Cache-Control "no-store"'),"HTML must disable CDN caching where supported");
assert(htaccess.includes('RewriteRule ^press/?$ /contact/ [R=301,L]'),"Retired press URL must redirect to contact");



// Pagination routes left over after deleting articles would be indexable orphan
// pages. Check they all appear in the current generated sitemap.
const expectedPublishedPages=new Set(urls.map(localPath));
function checkLiveCollectionPageTree(dir){
 if(!existsSync(dir))return;
 for(const entry of readdirSync(dir,{withFileTypes:true})){
   const target=resolve(dir,entry.name);
   if(entry.isDirectory())checkLiveCollectionPageTree(target);
   else if(entry.isFile()&&entry.name==="index.html"){
     const rel=target.slice(root.length+1).replaceAll("\\","/");
     assert(expectedPublishedPages.has(rel),"Obsolete collection page remains "+rel);
   }
 }
}
for(const relativeDir of ["news/page","news/category"])checkLiveCollectionPageTree(resolve(root,relativeDir));


// Exercise the pagination component beyond today's small categories.
assert.equal(ARTICLES_PER_PAGE,12,"Category card limit changed");
for(const total of [0,1,3,12,13,24,25,100]){
 const sample=Array.from({length:total},(_,i)=>"story-"+i);
 const count=getPageCount(total);
 assert.equal(count,Math.max(1,Math.ceil(total/12)));
 let collected=[];
 for(let p=1;p<=count;p++){
   const items=getPageItems(sample,p);
   assert(items.length<=12,"More than 12 cards on page "+p);
   collected.push(...items);
   const html=paginationHtml({basePath:"/news/category/anime/",page:p,total,label:"Anime news"});
   assert(html.includes('aria-current="page"'),"No selected page in paginator");
   assert(html.includes("Page "+p+" of "+count),"Page indicator missing");
   if(p>1)assert(html.includes('rel="prev"'),"Previous page link absent");
   if(p<count)assert(html.includes('rel="next"'),"Next page link absent");
   if(p===1)assert(html.includes('href="/news/category/anime/" aria-label="Anime news page 1"'),"First-page canonical link wrong");
   if(p===2)assert(html.includes('href="/news/category/anime/page/2/" aria-label="Anime news page 2"'),"Second-page URL wrong");
 }
 assert.deepEqual(collected,sample,"Paginated content omitted or repeated stories");
}
assert.throws(()=>getPageItems([1,2,3],2),RangeError,"Out-of-range pagination should fail");
assert(paginationHtml({basePath:"/news/",page:1,total:25,label:"All news"}).includes('href="/news/page/2/"'),"Main archive page links incorrect");
const mainArchive=read("news/index.html");
assert(mainArchive.includes("Source-linked anime"),"Archive must not claim unrecorded independent verification");
assert(read("index.html").includes("Source-linked anime"),"Homepage metadata must not claim unrecorded source review");
assert(mainArchive.includes('class="news-pagination"'),"Main news archive pagination missing");
assert((mainArchive.match(/class="news-card"/g)||[]).length<=12,"Main news archive exceeds 12 cards");
assert(read("assets/styles.css").includes(".pagination-number[aria-current="),"Current pagination styling missing");


// Publishing order for same-day articles uses an explicit increasing sequence.
// It is not incorrectly based on the date of the original external announcement.
const sequenced=articles.filter(a=>a.publishSequence!==undefined);
assert(sequenced.every(a=>Number.isSafeInteger(a.publishSequence)&&a.publishSequence>0),"Invalid publishing sequence");
unique(sequenced.map(a=>a.publishSequence),"publishing sequences");
const orderedPublished=[...newsArticles].sort((a,b)=>b.date.localeCompare(a.date)||(b.publishSequence||0)-(a.publishSequence||0)||b.sourceDate.localeCompare(a.sourceDate)||a.title.localeCompare(b.title));
const homeFeatured=read("index.html").match(/class="feature-card"[^>]*href="(\/news\/[^"]+\/)"/)?.[1];
assert(homeFeatured==="/news/"+orderedPublished[0].slug+"/","Hero did not select newest published article");
const archiveCards=[...read("news/index.html").matchAll(/class="news-card" href="(\/news\/[^"]+\/)"/g)].map(x=>x[1]);
assert.deepEqual(archiveCards,orderedPublished.slice(0,12).map(a=>"/news/"+a.slug+"/"),"Newest articles must precede older reports in first archive page");

// Require standard GA4, Clarity and AdSense tags exactly once on every HTML route.
const ga4Id="G-G0TNMR0FQL";
const clarityId="yyqq9cryjc";
const adsPublisher="ca-pub-7937216909291905";
const adsSrc="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client="+adsPublisher;
const gaSrc="https://www.googletagmanager.com/gtag/js?id="+ga4Id;
assert(!read("assets/site.js").includes("Editorial interaction analytics"),"Do not duplicate native measurement with custom instrumentation");
// Validate EVERY committed and newly generated HTML file, even if intentionally
// noindexed and omitted from the sitemap. This prevents new standalone pages
// from silently missing the shared tag and privacy controls.
const documentPaths=[];
function collectHtml(relativeDir=""){
 for(const entry of readdirSync(resolve(root,relativeDir),{withFileTypes:true})){
  if(entry.isDirectory()){
   if(![".git","node_modules",".next","coverage","dist"].includes(entry.name)){
    collectHtml(relativeDir?relativeDir+"/"+entry.name:entry.name);
   }
  }else if(entry.isFile()&&entry.name.endsWith(".html")){
   documentPaths.push(relativeDir?relativeDir+"/"+entry.name:entry.name);
  }
 }
}
collectHtml();
documentPaths.sort();
for(const expected of [...urls.map(localPath),"404.html"]){
 assert(documentPaths.includes(expected),"Generated route is missing from the HTML audit: "+expected);
}
for(const filePath of documentPaths){
 const html=read(filePath);
 const count=fragment=>html.split(fragment).length-1;
 assert.equal(count('src="'+adsSrc+'"'),1,"AdSense code must occur once in "+filePath);
 assert.equal(count("adsbygoogle.js"),1,"Duplicate AdSense loader in "+filePath);
 assert(html.includes('name="google-adsense-account" content="'+adsPublisher+'"'),"AdSense account missing in "+filePath);
 const gaPos=html.indexOf('src="'+gaSrc+'"');
 const adPos=html.indexOf('src="'+adsSrc+'"');
 assert(gaPos>=0&&gaPos<html.indexOf("</head>"),"GA4 async tag missing from head: "+filePath);
 assert(adPos>=0&&adPos<html.indexOf("</head>"),"AdSense tag missing from head: "+filePath);
 assert.equal(count('src="'+gaSrc+'"'),1,"GA4 loader must appear once: "+filePath);
 assert.equal(count('window.gtag("config","'+ga4Id+'"'),1,"GA4 config must appear once: "+filePath);
 assert.equal(count('send_page_view:true'),1,"Automatic GA4 page_view must be on: "+filePath);
 assert.equal(count('})(window,document,"clarity","script","'+clarityId+'")'),1,"Clarity must appear once: "+filePath);
 assert.equal(count('www.clarity.ms/tag/'),1,"Clarity URL must appear once: "+filePath);
 assert.equal(count('gtag("consent"'),0,"Do not add custom GA4 consent defaults: "+filePath);
 assert.equal(count('src="/assets/privacy.js'),0,"Do not include the older tracking loader in new HTML: "+filePath);
 assert(!html.includes("data-analytics-choice")&&!html.includes("data-analytics-toggle"),"No analytics settings UI: "+filePath);
 assert.equal(count('src="/assets/site.js?v='+info.buildId+'"'),1,"Shared site JS must load once: "+filePath);
 assert.equal(count('name="google-adsense-account" content="'+adsPublisher+'"'),1,"AdSense metadata must occur once: "+filePath);
}
assert(read("ads.txt").trim()==="google.com, pub-7937216909291905, DIRECT, f08c47fec0942fa0","AdSense ads.txt seller entry missing");
for(const slug of ["us-state-privacy","european-privacy"]){
 const path=slug+"/index.html";
 const html=read(path);
 assert(urls.includes(base+"/"+slug+"/"),"Regional privacy page missing from XML sitemap: "+slug);
 assert(!html.includes('data-analytics-choice='),"No analytics setting buttons: "+slug);
 assert(html.includes('href="/privacy/"'),"Regional notice must link to Privacy Policy: "+slug);
 assert(read("index.html").includes('href="/'+slug+'/"'),"Regional privacy page must be linked in site footer: "+slug);
}
const privacyNotice=read("privacy/index.html");
assert(privacyNotice.includes("Google AdSense publisher script"),"Privacy policy must disclose AdSense");
assert(!read("assets/privacy.js").includes("localStorage")&&!read("assets/privacy.js").includes('gtag("consent"'),"Legacy runtime must have no local preference gates");
const robotsRules=read("robots.txt");
assert(robotsRules.includes("User-agent: *")&&robotsRules.includes("Allow: /"),"robots.txt must permit public pages");
assert(robotsRules.includes(base+"/sitemap.xml")&&robotsRules.includes(base+"/news-sitemap.xml"),"robots.txt must include both sitemaps");
const llmLinks=read("llms.txt");
for(const suffix of ["/news/","/news/category/anime/","/news/category/manga/","/news/category/manhwa/","/news/category/web-novels/","/editorial-policy/","/sitemap.xml"]){
 assert(llmLinks.includes(base+suffix),"llms.txt missing "+suffix);
}

// IndexNow must never resend the full sitemap or any previously existing URL.
// Only newly created editorial news/review pages are eligible; archives and
// review pagination stay in the sitemap but OUT of IndexNow submissions.
const indexNowBaseline=JSON.parse(read("content/indexnow-baseline.json"));
const indexNowLedger=JSON.parse(read("content/indexnow-notified.json"));
const incremental=findNewEditorialUrls(sitemap,indexNowBaseline,indexNowLedger);
const knownIndexNow=new Set([...indexNowBaseline.urls,...indexNowLedger.urls]);
const publishedEditorial=new Set([
 ...articles.map(a=>base+articlePath(a)),
 ...reviews.map(r=>base+"/reviews/"+r.kind+"/"+r.seriesSlug+"/"+r.installmentSlug+"/")
]);
assert.equal(indexNowBaseline.urls.length,93,"Do not rewrite the original pre-21 article baseline");
assert(indexNowBaseline.urls.every(isEditorialArticleUrl),"Baseline must contain only editorial URLs");
assert(indexNowLedger.urls.every(isEditorialArticleUrl),"Notification ledger must contain only editorial URLs");
assert(indexNowLedger.urls.every(u=>!indexNowBaseline.urls.includes(u)),"An old URL was marked as a new IndexNow notification");
assert(incremental.every(u=>isEditorialArticleUrl(u)&&publishedEditorial.has(u)&&!knownIndexNow.has(u)),"IndexNow should include new articles ONLY");
assert(!incremental.some(u=>u.includes("/page/")||u.includes("/category/")),"IndexNow selected a non-article URL");
for(let n=21;n<=38;n++){
 const u=base+"/reviews/manga/boruto-two-blue-vortex/chapter-"+n+"/";
 assert(!indexNowBaseline.urls.includes(u),"A new chapter was accidentally backfilled into the preexisting baseline");
 assert(incremental.includes(u)||indexNowLedger.urls.includes(u),"New Boruto chapter must be pending or successfully notified: "+n);
}
const synthetic="<urlset><url><loc>"+base+"/news/old-story/</loc></url><url><loc>"+base+"/news/new-story/</loc></url><url><loc>"+base+"/reviews/manga/example/page/2/</loc></url><url><loc>"+base+"/reviews/manga/example/chapter-2/</loc></url></urlset>";
assert.deepEqual(findNewEditorialUrls(synthetic,{urls:[base+"/news/old-story/"]},{urls:[]}),[base+"/news/new-story/",base+"/reviews/manga/example/chapter-2/"],"Incremental URL selection test failed");

const indexNowKey="05c970ca16a23e9256d8594bfad3a38f";
assert(read(indexNowKey+".txt").trim()===indexNowKey,"IndexNow verification key file absent");
assert(urls.every(u=>u.startsWith(base+"/")),"IndexNow must only submit same-host canonical URLs");

const briefs=JSON.parse(read("content/editorial-guides.json"));
assert.equal(Object.keys(briefs).length,articles.length,"Every article needs an original guide");
const validScenes=new Set(["books","compare","reader","screen","calendar","clock","cinema","trophy","portal"]);
for(const a of articles){
  const b=briefs[a.slug];
  assert(b&&validScenes.has(b.scene)&&b.label&&b.question&&b.action,"Missing story-specific guidance "+a.slug);
  const html=read(articlePath(a).slice(1)+"index.html");
  assert(html.includes(b.question.replaceAll("&","&amp;").replaceAll("<","&lt;")),"Question does not match story "+a.slug);
  assert(html.includes(b.action.replaceAll("&","&amp;").replaceAll("<","&lt;")),"Action does not match story "+a.slug);
  const svg=read("assets/news/"+a.slug+".svg");
  assert(svg.includes("ORIGINAL EDITORIAL CONCEPT ART"),"Old text-only cover still present "+a.slug);
  assert(!svg.includes(a.title),"Headline should not dominate preview image "+a.slug);
}
assert(read("about/index.html").includes('id="editor-in-chief"'),"Editor-in-Chief bio anchor absent");
assert(read("editorial-policy/index.html").includes("Satya Prasad"),"Editorial-policy leadership absent");

console.log("PASS: "+urls.length+" pages; "+testedLinks+" internal references; "+schemas+" structured-data blocks; "+articles.length+" news items; standard analytics tag checks; SEO uniqueness; sitemap freshness.");
