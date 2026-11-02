import fs from "node:fs";
import path from "node:path";
const errors=[],root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const catalog=JSON.parse(read("content/catalog.json"));
const pages=catalog.filter(p=>p.status!=="draft"),urls=new Set();
const localExists=p=>p==="/"||fs.existsSync(path.join(root,p.slice(1)))||fs.existsSync(path.join(root,p.slice(1),"index.html"));
for(const page of pages){
 const rel=page.path==="/"? "index.html":page.path.slice(1)+"index.html";
 if(urls.has(page.path))errors.push("Duplicate URL: "+page.path);urls.add(page.path);
 const html=read(rel);
 const canonical="https://usaanimeclub.com"+page.path;
 if(!html.includes('rel="canonical" href="'+canonical+'"'))errors.push(rel+": canonical mismatch");
 if(!html.includes('name="description"'))errors.push(rel+": description absent");
 if(!html.includes('name="google-adsense-account"'))errors.push(rel+": publisher verification missing");
 if(html.includes("pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"))errors.push(rel+": advertising loader active before CMP");
 if(!html.includes('src="/assets/site.js"'))errors.push(rel+": site script absent");
 if(!html.includes('id="privacy-reopen"'))errors.push(rel+": cannot change privacy choice");
 for(const m of html.matchAll(/(?:href|src)="(\/[^"#?]*)/g)){if(!localExists(m[1]))errors.push(rel+": broken local link "+m[1]);}
 const matches=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
 if(matches.length!==1)errors.push(rel+": requires exactly one JSON-LD block");
 else{try{const graph=JSON.parse(matches[0][1])["@graph"]||[];if(page.kind==="article"&&!graph.some(x=>x["@type"]==="BlogPosting"))errors.push(rel+": missing BlogPosting");}catch{errors.push(rel+": invalid structured data");}}
 if(page.kind==="article"){
  const body=html.split('<article class="prose">')[1]?.split("</article>")[0]||"";
  if(body.replace(/<[^>]+>/g," ").trim().split(/\s+/).length<1000)errors.push(rel+": short guide");
  if(!body.includes('id="sources"'))errors.push(rel+": source section absent");
  if(!fs.existsSync(path.join(root,"assets","covers",page.cover+".svg")))errors.push(rel+": missing topic illustration");
 }
}
const xml=read("sitemap.xml"),listed=[...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map(m=>m[1]);
if(listed.length!==pages.length)errors.push("Sitemap does not match published page count");
for(const p of pages)if(!listed.includes("https://usaanimeclub.com"+p.path))errors.push("Sitemap missing "+p.path);
if(!read("templates/layout.html").includes("{{MAIN}}"))errors.push("Template has no body slot");

const tracking=read("assets/tracking.js"),shared=read("templates/layout.html");
for(const key of ["G-G0TNMR0FQL","yyqq9cryjc","ca-pub-7937216909291905"])
 if(!tracking.includes(key))errors.push("Central tracking config missing "+key);
if(!tracking.includes("analytics_storage:"))errors.push("Central tracking script missing analytics consent default");
if(!tracking.includes('preference()!=="yes"'))errors.push("Optional trackers are not gated by opt-in");
if(!shared.includes('src="/assets/tracking.js"'))errors.push("Shared template missing tracking module");
if(!shared.includes('name="google-adsense-account"'))errors.push("Shared template missing AdSense verification");
for(const item of pages){
 const relative=item.path==="/"? "index.html":item.path.slice(1)+"index.html";
 const markup=read(relative);
 const count=(needle)=>markup.split(needle).length-1;
 if(count('src="/assets/tracking.js"')!==1)errors.push(relative+": expected exactly one central tracking module");
 if(count('src="/assets/site.js"')!==1)errors.push(relative+": expected exactly one site module");
 if(count('name="google-adsense-account"')!==1)errors.push(relative+": expected exactly one AdSense meta tag");
 if(markup.includes("www.googletagmanager.com/gtag/js")||markup.includes("www.clarity.ms/tag/"))errors.push(relative+": duplicate hard-coded measurement loader");
}
const errorPage=read("404.html");
for(const marker of ['src="/assets/tracking.js"','src="/assets/site.js"','name="google-adsense-account"','id="privacy-reopen"'])
 if(!errorPage.includes(marker))errors.push("404 missing "+marker);

if(errors.length){console.error(errors.join("\n"));process.exitCode=1;}else console.log("Validated "+pages.length+" pages, "+pages.filter(p=>p.kind==="article").length+" articles, navigation, metadata and sitemap.");
