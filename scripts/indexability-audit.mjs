import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
const root=new URL("../",import.meta.url),read=p=>readFileSync(new URL(p,root),"utf8");
const base="https://usaanimeclub.com";
const articles=JSON.parse(read("content/articles.json"));
const reviews=JSON.parse(read("content/reviews.json"));
const formats=JSON.parse(read("content/editorial-formats.json"));
const xml=read("sitemap.xml"),news=read("news-sitemap.xml"),robots=read("robots.txt");
const rows=[...xml.matchAll(/<url><loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?<\/url>/g)].map(m=>({url:m[1],lastmod:m[2]}));
assert(rows.length===((xml.match(/<loc>/g)||[]).length),"Malformed sitemap entries");
assert.equal(new Set(rows.map(x=>x.url)).size,rows.length,"Duplicate canonical URL");
assert(robots.includes("User-agent: *")&&robots.includes("Allow: /"),"Public robots policy blocks crawling");
assert(robots.includes(base+"/sitemap.xml")&&robots.includes(base+"/news-sitemap.xml"),"Sitemap discovery missing");
const articleMap=new Map(articles.map(a=>[base+(a.slug==="boruto-two-blue-vortex-chapter-39-release-date-preview-predictions"?"/reviews/manga/boruto-two-blue-vortex/chapter-39/":"/news/"+a.slug+"/"),a]));
const reviewMap=new Map(reviews.map(r=>[base+"/reviews/"+r.kind+"/"+r.seriesSlug+"/"+r.installmentSlug+"/",r]));
assert.deepEqual(Object.keys(formats).sort(),articles.map(a=>a.slug).sort(),"Editorial format missing");
let articleCount=0,reviewCount=0,lastmods=0;
for(const entry of rows){
 const u=new URL(entry.url);
 assert(u.origin===base&&!u.search&&!u.hash&&u.pathname.endsWith("/"),"Noncanonical URL: "+entry.url);
 const path=u.pathname==="/"?"index.html":u.pathname.slice(1)+"index.html";
 assert(existsSync(new URL(path,root)),"Missing generated page: "+path);
 const h=read(path);
 assert(h.includes('<html lang="en-US">')&&h.includes('<main id="main">'),"Missing SSR body or language: "+path);
 assert.equal((h.match(/<h1\b/g)||[]).length,1,"Main heading must be unique: "+path);
 assert.equal((h.match(/rel="canonical"/g)||[]).length,1,"Missing or repeated canonical: "+path);
 assert(h.includes('rel="canonical" href="'+entry.url+'"'),"Canonical mismatch: "+path);
 const robot=h.match(/<meta name="robots" content="([^"]+)"/)?.[1]||"";
 assert(!/noindex|noarchive|nosnippet|nocache/i.test(robot),"Sitemap URL has index-restricting directive: "+path);
 assert(h.includes('property="og:url" content="'+entry.url+'"'),"OpenGraph URL mismatch: "+path);
 assert(h.includes('href="/editorial-policy/"')&&h.includes('href="/corrections/"'),"Trust links missing: "+path);
 assert(h.includes('gtag/js?id=G-G0TNMR0FQL')&&h.includes('clarity.ms/tag/')&&h.includes('ca-pub-7937216909291905'),"Standard GA4, Clarity or AdSense missing: "+path);
 const title=h.match(/<title>([^<]+)<\/title>/)?.[1],desc=h.match(/<meta name="description" content="([^"]+)"/)?.[1];
 assert(title?.length>12&&desc?.length>40,"Missing meaningful title or description: "+path);
 const schemas=[...h.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g)].map(m=>JSON.parse(m[1]));
 assert(schemas.length,"Structured data missing: "+path);
 const a=articleMap.get(entry.url),review=reviewMap.get(entry.url);
 if(a){
   const type=formats[a.slug]==="news"?"NewsArticle":"Article";
   const s=schemas.find(x=>x["@type"]===type);
   assert(s&&s.headline===a.title&&s.datePublished===a.date,"Article schema type/headline/date mismatch: "+path);
   assert(Array.isArray(s.citation)&&s.citation.includes(a.source),"Primary source missing from JSON-LD: "+path);
   assert(h.includes('datetime="'+a.date+'"')&&h.includes('class="prose"'),"Visible article text/date missing: "+path);
   assert.equal(entry.lastmod,(s.dateModified||s.datePublished).slice(0,10),"Article lastmod inaccurate: "+path);
   assert(existsSync(new URL("assets/news/"+a.slug+".png",root)),"Article image missing: "+path);
   articleCount++;
 }else if(review){
   const s=schemas.find(x=>x["@type"]==="Article"||x["@type"]==="Review");
   assert(s&&s.datePublished.startsWith(review.publishedOn),"Critical response schema date mismatch: "+path);
   if(review.reviewMode==="sourced")assert(s["@type"]==="Article"&&!s.reviewRating,"Sourced critique misrepresented as a firsthand review: "+path);
   assert.equal(entry.lastmod,review.updatedAt.slice(0,10),"Critical response lastmod inaccurate: "+path);
   reviewCount++;
 }else{
   assert(!entry.lastmod,"Collection/policy page claims unverifiable artificial lastmod: "+path);
 }
 if(entry.lastmod){assert(entry.lastmod<=new Date().toISOString().slice(0,10),"Future modification date: "+path);lastmods++;}
}
const newsUrls=[...news.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
const newsExpected=articles.filter(a=>{
 const published=Date.parse(a.date+"T12:00:00Z");
 return formats[a.slug]==="news"&&published<=Date.now()&&Date.now()-published<=48*60*60*1000;
}).map(a=>base+"/news/"+a.slug+"/");
assert.deepEqual(newsUrls.sort(),newsExpected.sort(),"Google News XML includes features/stale URLs or misses news");
const notFound=read("404.html");
assert(notFound.includes('name="robots" content="noindex, nofollow"'),"404 requires noindex");
assert(!rows.some(x=>x.url===base+"/404.html"),"404 must not be in sitemap");
console.log("PASS Search preflight: "+rows.length+" canonical pages; "+articleCount+" editorials; "+reviewCount+" critical responses; "+lastmods+" truthful lastmod tags; "+newsUrls.length+" news entries.");
console.log("Live HTTP status, search-engine-selected canonical, source accuracy and CMP compliance require separate account/browser verification.");
