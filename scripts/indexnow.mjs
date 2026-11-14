import {readFileSync,writeFileSync,existsSync} from "node:fs";
const domain="usaanimeclub.com",base="https://"+domain;
const key="05c970ca16a23e9256d8594bfad3a38f",keyPath=key+".txt",marker=".indexnow-submitted";
const info=JSON.parse(readFileSync("build-info.json","utf8"));
const urls=[...readFileSync("sitemap.xml","utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1].replaceAll("&amp;","&"));
if(!urls.length||new Set(urls).size!==urls.length||!urls.every(u=>u.startsWith(base+"/")))throw Error("Sitemap must contain distinct canonical URLs from the target host");
if(readFileSync(keyPath,"utf8").trim()!==key)throw Error("Local IndexNow key file mismatch");
if(existsSync(marker)&&readFileSync(marker,"utf8").trim()===info.buildId){console.log("Already submitted build "+info.buildId);process.exit(0)}
const fetchWithTimeout=(url,options={})=>fetch(url,{...options,signal:AbortSignal.timeout(12000),headers:{"User-Agent":"USAAnimeClub-IndexNow/1.0",...(options.headers||{})}});
let liveInfo,liveKey;
try{
 const response=await fetchWithTimeout(base+"/build-info.json",{cache:"no-store"});
 if(!response.ok)throw Error("Live build-info status "+response.status);
 liveInfo=await response.json();
 const keyResponse=await fetchWithTimeout(base+"/"+keyPath,{cache:"no-store"});
 if(!keyResponse.ok)throw Error("Live key file status "+keyResponse.status);
 liveKey=(await keyResponse.text()).trim();
}catch(error){
 console.log("SKIPPED: site not yet verifiable ("+error.message+"); retry on the daily schedule.");
 process.exit(0);
}
if(liveInfo.buildId!==info.buildId||liveInfo.articleCount!==info.articleCount||liveKey!==key){
 console.log("SKIPPED: live site is not serving the current build and verification key; retry later.");
 process.exit(0);
}
const payload={host:domain,key,keyLocation:base+"/"+keyPath,urlList:urls};
const response=await fetchWithTimeout("https://api.indexnow.org/indexnow",{method:"POST",headers:{"Content-Type":"application/json; charset=utf-8"},body:JSON.stringify(payload)});
const detail=(await response.text()).slice(0,500);
if(![200,202].includes(response.status))throw Error("IndexNow rejected "+urls.length+" URLs; HTTP "+response.status+" "+detail);
writeFileSync(marker,info.buildId+"\n");
console.log("SUBMITTED "+urls.length+" distinct canonical URLs; IndexNow HTTP "+response.status+"; build "+info.buildId+". Receipt is not a guarantee of indexing.");
