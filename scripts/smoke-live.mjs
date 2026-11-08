/* Read-only production readiness probe; never changes site or Google accounts.
   SITE_ORIGIN=https://usaanimeclub.com LIVE_AUDIT_ALL=1 npm run audit:live
   Failures identify production blockers; GitHub build success is not a live deployment. */
import fs from "node:fs";
import {createHash} from "node:crypto";
const origin=(process.env.SITE_ORIGIN||"https://usaanimeclub.com").replace(/\/$/,"");
const catalog=JSON.parse(fs.readFileSync("content/catalog.json","utf8")).filter(x=>x.status!=="draft");
const all=process.env.LIVE_AUDIT_ALL==="1";
const critical=["/","/guides/","/guides/find-anime-streaming-us/","/guides/choose-first-anime/","/tools/","/tools/manga-value-lab/","/tools/anime-starter-planner/","/about/","/contact/","/privacy/","/editorial-policy/"];
const pagePaths=all?catalog.map(x=>x.path):critical;
const paths=[...new Set([...pagePaths,"/deployment-version.json","/sitemap.xml","/robots.txt","/llms.txt","/a99279cddbc75641ba78c909daa82457.txt","/ads.txt","/assets/site.css","/assets/tracking.js","/assets/home-concept-scene-hd-2x.webp","/a-page-that-must-return-real-404-2026/"])];
const pathIsPage=p=>catalog.some(x=>x.path===p);
const publisher="ca-pub-7937216909291905";
const failures=[],warnings=[];
const expectedBuild=createHash("sha256").update(
 ["content/catalog.json","scripts/build.mjs","templates/layout.html","assets/site.css","assets/home-next-20261103.css","assets/tool-suite.js","assets/home-motion.js"]
 .map(file=>fs.readFileSync(file)).join("\n")
).digest("hex").slice(0,16);

async function probe(route){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),13000);
 try{
  const r=await fetch(origin+route,{redirect:"follow",headers:{"User-Agent":"USAAnimeClub-LiveSiteQualityAudit/1.0"},signal:controller.signal});
  const expected=route.includes("must-return-real-404")?404:200;
  if(r.status!==expected){failures.push(route+": HTTP "+r.status+" (expected "+expected+")");return;}
  if(!r.url.startsWith(origin+"/")&&r.url!==origin){failures.push(route+": unexpected redirect to "+r.url);return;}
  if(pathIsPage(route)||route==="/"){
   const html=await r.text();
   if(!html.includes('<meta name="google-adsense-account" content="'+publisher+'">'))failures.push(route+": AdSense meta missing on production");
   if(!html.includes('src="/assets/tracking.js?v='))failures.push(route+": latest versioned tracking module missing on production");
   if(!html.includes('rel="canonical" href="'+origin+route+'"'))failures.push(route+": canonical URL mismatch");
   if(!html.includes('id="privacy-reopen"'))failures.push(route+": privacy controls missing");
   // These checks distinguish a reachable but stale website from the newest source.
   if(!html.includes('<meta name="uac-build-id" content="'+expectedBuild+'">'))failures.push(route+": live HTML has wrong build version (newest "+expectedBuild+")");
   if(!html.includes('name="keywords"')||!html.includes('name="twitter:description"'))failures.push(route+": latest page-specific SEO metadata absent");
   if(!html.includes('https://www.google.com/preferences/source?q=usaanimeclub.com'))failures.push(route+": Google Preferred Sources link absent");
   if(route==="/"&&!html.includes('src="/assets/home-motion.js?v='))failures.push(route+": stale unversioned homepage interaction script");
   if(route==="/about/"&&!html.includes("How the editorial desk works"))failures.push(route+": latest About trust section not yet deployed");
  }else if(route==="/deployment-version.json"){
   let data;
   try{data=await r.json()}catch{failures.push("deployment-version.json: missing or invalid build manifest");return;}
   if(data.buildId!==expectedBuild)failures.push("deployment-version.json: Hostinger is serving "+(data.buildId||"unknown")+" but GitHub generated "+expectedBuild);
   if(data.publishedPages!==catalog.length)failures.push("deployment-version.json: site has "+data.publishedPages+" pages but GitHub has "+catalog.length);
  }else if(route==="/sitemap.xml"){
   const xml=await r.text(); const count=(xml.match(/<loc>/g)||[]).length;
   if(count!==catalog.length)failures.push("sitemap.xml: "+count+" URLs live, expected "+catalog.length);
  }else if(route==="/robots.txt"){
   const robotsRaw=await r.text();
   const robots=robotsRaw.replace(/\r\n/g,"\n");
   if(!robots.includes("Sitemap: "+origin+"/sitemap.xml"))failures.push("robots.txt: canonical sitemap reference missing");
   const missingBots=["OAI-SearchBot","GPTBot","Claude-SearchBot","ClaudeBot","PerplexityBot"].filter(bot=>!robots.includes("User-agent: "+bot+"\nAllow: /"));
   if(missingBots.length){
    failures.push("robots.txt: missing explicit allowances for "+missingBots.join(", "));
    console.warn("LIVE ROBOTS TEXT: "+JSON.stringify(robotsRaw.slice(0,1200)));
    console.warn("LIVE ROBOTS CACHE HEADERS: "+JSON.stringify({cacheControl:r.headers.get("cache-control"),age:r.headers.get("age"),etag:r.headers.get("etag")}));
   }
  }else if(route==="/llms.txt"){
   const directory=await r.text();
   if(!directory.startsWith("# USA Anime Club\n"))failures.push("llms.txt: directory heading missing");
   for(const path of ["/","/guides/","/tools/","/editorial-policy/"])
    if(!directory.includes("]("+origin+path+")"))failures.push("llms.txt: missing "+path);
  }else if(route==="/a99279cddbc75641ba78c909daa82457.txt"){
   if((await r.text()).trim()!=="a99279cddbc75641ba78c909daa82457")failures.push("IndexNow verification key content mismatch");
  }else if(route==="/ads.txt"){
   const ads=await r.text();
   if(!ads.includes("google.com, pub-7937216909291905, DIRECT, f08c47fec0942fa0"))failures.push("ads.txt: wrong or missing publisher entry");
  }else if(route.includes(".webp")){
   const type=r.headers.get("content-type")||"";
   if(!type.includes("image/webp"))warnings.push("Hero asset served with unusual type: "+type);
  }
  console.log("PASS "+r.status+" "+route);
 }catch(e){failures.push(route+": "+String(e.message||e));}
 finally{clearTimeout(timer)}
}
for(let start=0;start<paths.length;start+=4)await Promise.all(paths.slice(start,start+4).map(probe));
console.log("Production paths checked: "+paths.length+"; failures: "+failures.length+"; warnings: "+warnings.length);
for(const warning of warnings)console.warn("WARN "+warning);
for(const error of failures)console.error("FAIL "+error);
if(failures.length)process.exitCode=1;
