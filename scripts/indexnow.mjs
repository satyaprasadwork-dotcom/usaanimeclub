import {readFileSync,writeFileSync} from "node:fs";
import {findNewEditorialUrls} from "./indexnow-urls.mjs";

const domain="usaanimeclub.com",base="https://"+domain;
const key="05c970ca16a23e9256d8594bfad3a38f",keyPath=key+".txt";
const info=JSON.parse(readFileSync("build-info.json","utf8"));
const sitemap=readFileSync("sitemap.xml","utf8");
const baseline=JSON.parse(readFileSync("content/indexnow-baseline.json","utf8"));
const ledgerPath="content/indexnow-notified.json";
const ledger=JSON.parse(readFileSync(ledgerPath,"utf8"));
const pending=findNewEditorialUrls(sitemap,baseline,ledger);
if(readFileSync(keyPath,"utf8").trim()!==key)throw new Error("Local IndexNow key file mismatch");
console.log("New editorial URLs pending IndexNow: "+pending.length);
if(process.argv.includes("--dry-run")){
 for(const url of pending)console.log("NEW "+url);
 process.exit(0);
}
if(!pending.length){
 console.log("NO CHANGE: existing articles and archive pages are never resubmitted.");
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
 console.log("PENDING: IndexNow HTTP 202 for "+pending.length+" NEW editorial URLs; key verification pending. No old URL was sent. Will retry new pending URLs only.");
 process.exit(0);
}
if(response.status!==200)throw new Error("IndexNow rejected "+pending.length+" NEW URLs, HTTP "+response.status+": "+detail);
ledger.urls.push(...pending);
ledger.urls.sort();
writeFileSync(ledgerPath,JSON.stringify(ledger,null,2)+"\n");
console.log("RECEIVED: HTTP 200 for "+pending.length+" NEW editorial URLs. State ledger updated; existing articles and all category/landing/pagination URLs were excluded. Indexing is not guaranteed.");
