/* Read-only production readiness probe; never changes site or Google accounts.
   SITE_ORIGIN=https://usaanimeclub.com LIVE_AUDIT_ALL=1 npm run audit:live
   Failures identify production blockers; GitHub build success is not a live deployment. */
import fs from "node:fs";
const origin=(process.env.SITE_ORIGIN||"https://usaanimeclub.com").replace(/\/$/,"");
const catalog=JSON.parse(fs.readFileSync("content/catalog.json","utf8")).filter(x=>x.status!=="draft");
const all=process.env.LIVE_AUDIT_ALL==="1";
const critical=["/","/guides/","/guides/find-anime-streaming-us/","/guides/choose-first-anime/","/tools/","/tools/manga-value-lab/","/tools/anime-starter-planner/","/about/","/contact/","/privacy/","/editorial-policy/"];
const pagePaths=all?catalog.map(x=>x.path):critical;
const paths=[...new Set([...pagePaths,"/sitemap.xml","/robots.txt","/ads.txt","/assets/site.css","/assets/tracking.js","/assets/home-concept-scene-hd-2x.avif","/a-page-that-must-return-real-404-2026/"])];
const pathIsPage=p=>catalog.some(x=>x.path===p);
const publisher="ca-pub-7937216909291905";
const failures=[],warnings=[];
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
  }else if(route==="/sitemap.xml"){
   const xml=await r.text(); const count=(xml.match(/<loc>/g)||[]).length;
   if(count!==catalog.length)failures.push("sitemap.xml: "+count+" URLs live, expected "+catalog.length);
  }else if(route==="/robots.txt"){
   const robots=await r.text();
   if(!robots.includes("Sitemap: "+origin+"/sitemap.xml"))failures.push("robots.txt: canonical sitemap reference missing");
  }else if(route==="/ads.txt"){
   const ads=await r.text();
   if(!ads.includes("google.com, pub-7937216909291905, DIRECT, f08c47fec0942fa0"))failures.push("ads.txt: wrong or missing publisher entry");
  }else if(route.includes(".avif")){
   const type=r.headers.get("content-type")||"";
   if(!type.includes("image/avif")&&!type.includes("application/octet-stream"))warnings.push("Hero asset served with unusual type: "+type);
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
