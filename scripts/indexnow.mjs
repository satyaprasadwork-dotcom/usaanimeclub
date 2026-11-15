import {readFileSync,writeFileSync} from "node:fs";
import {findNewEditorialUrls,canonicalSitemapUrls} from "./indexnow-urls.mjs";

const domain="usaanimeclub.com",base="https://"+domain;
const key="05c970ca16a23e9256d8594bfad3a38f",keyPath=key+".txt";
const info=JSON.parse(readFileSync("build-info.json","utf8"));
const sitemap=readFileSync("sitemap.xml","utf8");
const baseline=JSON.parse(readFileSync("content/indexnow-baseline.json","utf8"));
const ledgerPath="content/indexnow-notified.json";
const ledger=JSON.parse(readFileSync(ledgerPath,"utf8"));
const fresh=findNewEditorialUrls(sitemap,baseline,ledger);
const backfillPath="content/indexnow-boruto-backfill.json";
const backfill=JSON.parse(readFileSync(backfillPath,"utf8"));
if(backfill.targetChapterStart!==1||backfill.targetChapterEnd!==20||!Array.isArray(backfill.confirmed))
 throw new Error("Unexpected Boruto backfill configuration");
const target=Array.from({length:20},(_,i)=>base+"/reviews/manga/boruto-two-blue-vortex/chapter-"+(i+1)+"/");
const liveSitemapUrls=new Set(canonicalSitemapUrls(sitemap));
if(target.some(url=>!liveSitemapUrls.has(url)||!baseline.urls.includes(url)))
 throw new Error("Backfill may only contain baseline Boruto reviews present in the sitemap");
if(backfill.confirmed.some(url=>!target.includes(url))||new Set(backfill.confirmed).size!==backfill.confirmed.length)
 throw new Error("Backfill confirmation ledger contains unexpected or duplicate URLs");
const backfillPending=target.filter(url=>!backfill.confirmed.includes(url));
const pending=[...fresh,...backfillPending];
if(readFileSync(keyPath,"utf8").trim()!==key)throw new Error("Local IndexNow key file mismatch");
console.log("IndexNow pending: "+fresh.length+" new articles, "+backfillPending.length+" one-time Boruto chapter backfill URLs.");
if(process.argv.includes("--dry-run")){
 for(const url of pending)console.log("NEW "+url);
 process.exit(0);
}
if(!pending.length){
 console.log("NO CHANGE: all new article and targeted historical review URLs are already recorded; no repeated submissions.");
 process.exit(0);
}
const fetchWithTimeout=(url,options={})=>fetch(url,{...options,signal:AbortSignal.timeout(12000),headers:{"User-Agent":"USAAnimeClub-IndexNow/2.0",...(options.headers||{})}});
let liveInfo,liveKey;
try{
 const response=await fetchWithTimeout(base+"/build-info.json",{cache:"no-store"});
 if(!response.ok)throw Error("Live build-info HTTP "+response.status);
 liveInfo=await response.json();
 const keyResponse=await fetchWithTimeout(base+"/"+keyPath,{cache:"no-store"});
 if(!keyResponse.ok)throw Error("Live key HTTP "+keyResponse.status);
 liveKey=(await keyResponse.text()).trim();
}catch(error){
 console.log("DEFERRED: live deployment or verification key could not be checked ("+error.message+"). New URLs only will be retried on the scheduled run.");
 process.exit(0);
}
if(liveInfo.buildId!==info.buildId||liveInfo.articleCount!==info.articleCount||liveInfo.publishedReviewCount!==info.publishedReviewCount||liveKey!==key){
 console.log("DEFERRED: live site does not match this generated build and verification key. No URLs were submitted.");
 process.exit(0);
}
const payload={host:domain,key,keyLocation:base+"/"+keyPath,urlList:pending};
const response=await fetchWithTimeout("https://api.indexnow.org/indexnow",{method:"POST",headers:{"Content-Type":"application/json; charset=utf-8"},body:JSON.stringify(payload)});
const detail=(await response.text()).slice(0,500);
if(response.status===202){
 console.log("PENDING: IndexNow HTTP 202 for "+pending.length+" selected URLs; key verification pending. Will retry only these unconfirmed URLs.");
 process.exit(0);
}
if(response.status!==200)throw new Error("IndexNow rejected "+pending.length+" selected URLs, HTTP "+response.status+": "+detail);
if(fresh.length){
 ledger.urls.push(...fresh);
 ledger.urls.sort();
 writeFileSync(ledgerPath,JSON.stringify(ledger,null,2)+"\n");
}
if(backfillPending.length){
 backfill.confirmed.push(...backfillPending);
 backfill.confirmed.sort();
 writeFileSync(backfillPath,JSON.stringify(backfill,null,2)+"\n");
}
console.log("RECEIVED: HTTP 200 for "+fresh.length+" new articles and "+backfillPending.length+" one-time Boruto historical reviews. Ledgers updated; all other old URLs, archive and pagination URLs were excluded. Indexing is not guaranteed.");
