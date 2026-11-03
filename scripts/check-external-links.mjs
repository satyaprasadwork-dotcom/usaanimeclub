/* Advisory online checks for cited source URLs. They do not verify factual claims.
   Run with an Internet connection: npm run audit:external */
import fs from "node:fs";
const catalog=JSON.parse(fs.readFileSync("content/catalog.json","utf8")).filter(p=>p.status!=="draft");
const urls=new Map();
for(const page of catalog){
 const html=fs.readFileSync(page.source,"utf8");
 for(const m of html.matchAll(/href="(https?:\/\/[^"]+)"/g)){
  const url=m[1].replace(/&amp;/g,"&");
  if(new URL(url).hostname.endsWith("usaanimeclub.com"))continue;
  if(!urls.has(url))urls.set(url,[]);
  urls.get(url).push(page.path);
 }
}
let checked=0,blocked=0,errors=0;
const entries=[...urls.entries()];
for(let i=0;i<entries.length;i+=3){
 await Promise.all(entries.slice(i,i+3).map(async ([url,paths])=>{
  const controller=new AbortController(); const timeout=setTimeout(()=>controller.abort(),12000);
  try{
   let response=await fetch(url,{method:"HEAD",redirect:"follow",signal:controller.signal,headers:{"User-Agent":"USAAnimeClub-EditorialLinkAudit/1.0"}});
   if([403,405,429].includes(response.status))response=await fetch(url,{method:"GET",redirect:"follow",signal:controller.signal,headers:{"User-Agent":"USAAnimeClub-EditorialLinkAudit/1.0"}});
   const status=response.status;
   console.log((status>=200&&status<400?"OK":status===403||status===429?"REVIEW":"BROKEN")+" "+status+" "+url+" used in "+paths.join(", "));
   checked++;
   if(status===403||status===429)blocked++;else if(status>=400)errors++;
  }catch(e){console.log("UNVERIFIED "+url+" "+e.message+" used in "+paths.join(", "));blocked++;}
  finally{clearTimeout(timeout)}
 }));
}
console.log("URLs checked: "+checked+"; blocked/unverified: "+blocked+"; HTTP failures: "+errors);
if(errors)process.exitCode=1;
// Hosts may reject bots even for working URLs. Manually inspect blocked/failed links.
