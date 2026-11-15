import {readFileSync,writeFileSync} from "node:fs";

// IndexNow is for newly added, published ARTICLE URLs only.
// Persistent ledger prevents site rebuilds, sitemap changes, schedule runs,
// or previously published articles from causing repeat submissions.
const domain="usaanimeclub.com",base="https://"+domain;
const key="05c970ca16a23e9256d8594bfad3a38f",keyPath=key+".txt";
const ledgerPath=".github/indexnow-submitted-articles.json";
const readJSON=path=>JSON.parse(readFileSync(path,"utf8"));
const articles=readJSON("content/articles.json");
const ledger=readJSON(ledgerPath);
const isArticleUrl=value=>{
  if(typeof value!=="string")return false;
  try{
    const parsed=new URL(value);
    return parsed.origin===base &&
      new RegExp("^/news/[a-z0-9]+(?:-[a-z0-9]+)*/$").test(parsed.pathname) &&
      !parsed.search&&!parsed.hash&&parsed.href===value;
  }catch{return false;}
};
if(!Array.isArray(articles)||!Array.isArray(ledger.submitted)||ledger.version!==1){
  throw Error("Missing or invalid article list / persistent IndexNow ledger");
}
const articleUrls=articles.map(article=>base+"/news/"+article.slug+"/");
if(new Set(articleUrls).size!==articleUrls.length||!articleUrls.every(isArticleUrl)){
  throw Error("Invalid or duplicate canonical article URL");
}
if(new Set(ledger.submitted).size!==ledger.submitted.length||!ledger.submitted.every(isArticleUrl)){
  throw Error("Invalid or duplicate URL in IndexNow submission ledger");
}
const sitemap=[...readFileSync("sitemap.xml","utf8").matchAll(new RegExp("<loc>([^<]+)</loc>","g"))]
  .map(match=>match[1].replaceAll("&amp;","&"));
const sitemapSet=new Set(sitemap);
if(!articleUrls.every(url=>sitemapSet.has(url))){
  throw Error("Article missing from generated sitemap; refusing to submit.");
}
if(readFileSync(keyPath,"utf8").trim()!==key){
  throw Error("Local IndexNow verification key mismatch.");
}
const submitted=new Set(ledger.submitted);
const pending=articleUrls.filter(url=>!submitted.has(url)).sort();
if(process.argv.includes("--dry-run")){
  console.log("DRY RUN: "+pending.length+" newly added article URL(s) pending; zero API requests.");
  for(const url of pending)console.log("NEW "+url);
  process.exit(0);
}
if(!pending.length){
  console.log("NO NEW ARTICLES: 0 URLs submitted. Existing articles and non-article pages are never resent.");
  process.exit(0);
}
const fetchWithTimeout=(url,options={})=>fetch(url,{
  ...options,
  signal:AbortSignal.timeout(12000),
  headers:{"User-Agent":"USAAnimeClub-IndexNow/2.0",...(options.headers||{})}
});
let liveUrls;
try{
  const [liveSitemap,liveKey]=await Promise.all([
    fetchWithTimeout(base+"/sitemap.xml",{cache:"no-store"}),
    fetchWithTimeout(base+"/"+keyPath,{cache:"no-store"})
  ]);
  if(!liveSitemap.ok||!liveKey.ok){
    throw Error("Live sitemap / key HTTP "+liveSitemap.status+" / "+liveKey.status);
  }
  if((await liveKey.text()).trim()!==key)throw Error("Live IndexNow verification key mismatch");
  liveUrls=new Set([...(await liveSitemap.text()).matchAll(new RegExp("<loc>([^<]+)</loc>","g"))]
    .map(match=>match[1].replaceAll("&amp;","&")));
}catch(error){
  console.log("DEFERRED: live website not verifiable ("+error.message+"); daily check will retry NEW articles only.");
  process.exit(0);
}
// Do not notify an article until its own canonical page is publicly available.
const ready=[];
for(const url of pending){
  if(!liveUrls.has(url)){
    console.log("DEFERRED (not on live sitemap): "+url);
    continue;
  }
  try{
    const response=await fetchWithTimeout(url,{cache:"no-store"});
    if(!response.ok)throw Error("HTTP "+response.status);
    const html=await response.text();
    if(!html.includes('rel="canonical" href="'+url+'"')){
      throw Error("live canonical does not match");
    }
    ready.push(url);
  }catch(error){
    console.log("DEFERRED (article not verified live): "+url+" — "+error.message);
  }
}
if(!ready.length){
  console.log("NO PUBLISHED NEW ARTICLES READY: 0 URLs submitted.");
  process.exit(0);
}
const payload={host:domain,key,keyLocation:base+"/"+keyPath,urlList:ready};
const response=await fetchWithTimeout("https://api.indexnow.org/indexnow",{
  method:"POST",
  headers:{"Content-Type":"application/json; charset=utf-8"},
  body:JSON.stringify(payload)
});
const detail=(await response.text()).slice(0,500);
if(response.status!==200&&response.status!==202){
  throw Error("IndexNow did not accept "+ready.length+" NEW article URL(s): HTTP "+response.status+" "+detail);
}
for(const url of ready)submitted.add(url);
ledger.submitted=[...submitted].sort();
writeFileSync(ledgerPath,JSON.stringify(ledger,null,2)+String.fromCharCode(10));
console.log("IndexNow HTTP "+response.status+": "+ready.length+" NEW article URL(s) accepted and recorded.");
if(response.status===202)console.log("Key verification remains pending at IndexNow; no automatic duplicate POST will be sent.");
console.log("Search indexing is never guaranteed by an IndexNow notification.");
