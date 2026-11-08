import fs from "node:fs";
const origin="https://usaanimeclub.com";
const key="a99279cddbc75641ba78c909daa82457",keyUrl=origin+"/"+key+".txt";
const pages=JSON.parse(fs.readFileSync("content/catalog.json","utf8")).filter(p=>p.status!=="draft");
const urls=pages.map(p=>origin+p.path);
if(!urls.length||new Set(urls).size!==urls.length)throw Error("Invalid published URLs");
const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
try{
 const check=await fetch(keyUrl,{signal:controller.signal,cache:"no-store"});
 if(!check.ok||(await check.text()).trim()!==key)throw Error("IndexNow ownership key is not deployed");
 const body={host:"usaanimeclub.com",key,keyLocation:keyUrl,urlList:urls};
 const response=await fetch("https://www.bing.com/indexnow",{method:"POST",headers:{"Content-Type":"application/json; charset=utf-8"},body:JSON.stringify(body),signal:controller.signal});
 console.log("IndexNow HTTP "+response.status+"; URLs notified: "+urls.length);
 if(![200,202].includes(response.status))throw Error("Bing rejected IndexNow notification: HTTP "+response.status+" "+(await response.text()).slice(0,400));
 console.log("Notification received; indexing is NOT guaranteed.");
}finally{clearTimeout(timer)}
