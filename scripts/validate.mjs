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
if(errors.length){console.error(errors.join("\n"));process.exitCode=1;}else console.log("Validated "+pages.length+" pages, "+pages.filter(p=>p.kind==="article").length+" articles, navigation, metadata and sitemap.");
