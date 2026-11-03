import fs from "node:fs";
import path from "node:path";

function renderPage(page,main,layout,catalog){
 const escape=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const url="https://usaanimeclub.com"+page.path;
 const published=catalog.filter(p=>p.kind==="article"&&p.status!=="draft");
 const card=p=>`<article class="guide-card" data-category="${escape(p.category)}"><a href="${p.path}" aria-label="Read ${escape(p.title)}"><img src="/assets/covers/${p.cover}.svg" width="800" height="450" decoding="async" loading="lazy" alt="Original editorial artwork for ${escape(p.title)}"></a><div class="guide-card-body"><span class="topic">${escape(p.category)}</span><h3><a href="${p.path}">${escape(p.title)}</a></h3><p>${escape(p.description)}</p><a class="read" href="${p.path}">Read guide →</a></div></article>`;
 if(page.path==="/")main=main.replace(/(<div class="guide-grid">)[\s\S]*?(<\/div><\/div><\/section>)/,(_m,open,close)=>open+published.slice(0,9).map(card).join("")+close);
 if(page.path==="/guides/"){
  const cats=["All",...new Set(published.map(p=>p.category))];
  main=main.replace(/<div class="pills" data-guide-filters[^>]*>[\s\S]*?<\/div>/,`<div class="pills" data-guide-filters role="group" aria-label="Filter guides by category">${cats.map((cat,i)=>`<button type="button" class="pill" data-category="${escape(cat)}" aria-pressed="${i===0}">${escape(cat)}</button>`).join("")}</div>`);
  main=main.replace(/(<div class="guide-grid">)[\s\S]*?(<\/div><\/div><\/section>)/,(_m,open,close)=>open+published.map(card).join("")+close);
 }
 let html=layout.replace("{{MAIN}}",main.trim());
 html=html.replace(/<title>[\s\S]*?<\/title>/,`<title>${escape(page.title)} | USA Anime Club</title>`);
 html=html.replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="${escape(page.description)}">`);
 html=html.replace(/<link rel="canonical" href="[^"]*">/,`<link rel="canonical" href="${url}">`);
 const og={"og:title":page.title,"og:description":page.description,"og:url":url,"og:type":page.kind==="article"?"article":"website"};
 for(const [tag,value] of Object.entries(og))html=html.replace(new RegExp(`<meta property="${tag}" content="[^"]*">`),`<meta property="${tag}" content="${escape(value)}">`);
 const graph=[{"@type":"WebSite","@id":"https://usaanimeclub.com/#website","url":"https://usaanimeclub.com/","name":"USA Anime Club","inLanguage":"en-US"},{"@type":"Organization","@id":"https://usaanimeclub.com/#publisher","name":"USA Anime Club","url":"https://usaanimeclub.com/","email":"contact@usaanimeclub.com"},{"@type":"WebPage","@id":url+"#webpage","url":url,"name":page.title,"description":page.description,"inLanguage":"en-US","isPartOf":{"@id":"https://usaanimeclub.com/#website"}}];
 if(page.kind==="article"){
  graph.push({"@type":"BlogPosting","@id":url+"#article","headline":page.title,"description":page.description,"author":{"@type":"Organization","name":"USA Anime Club","url":"https://usaanimeclub.com/about/"},"publisher":{"@id":"https://usaanimeclub.com/#publisher"},"mainEntityOfPage":url,"datePublished":page.published,"dateModified":page.modified||page.published,"image":"https://usaanimeclub.com/assets/covers/"+page.cover+".svg","inLanguage":"en-US","articleSection":page.category});
  graph.push({"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://usaanimeclub.com/"},{"@type":"ListItem","position":2,"name":"Guides","item":"https://usaanimeclub.com/guides/"},{"@type":"ListItem","position":3,"name":page.title,"item":url}]});
  html=html.replace(/<meta name="twitter:card" content="[^"]*">/,`<meta name="twitter:card" content="summary_large_image"><meta property="og:image" content="https://usaanimeclub.com/assets/covers/${page.cover}.svg"><meta property="og:image:alt" content="${escape(page.title)}"><meta name="twitter:image" content="https://usaanimeclub.com/assets/covers/${page.cover}.svg"><meta property="article:published_time" content="${page.published}"><meta property="article:modified_time" content="${page.modified||page.published}">`);
 }
 html=html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/,`<script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@graph":graph}).replace(/</g,"\\u003c")}</script>`);
 return html.endsWith("\n")?html:html+"\n";
}

const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const catalog=JSON.parse(read("content/catalog.json"));
const layout=read("templates/layout.html");
const outputs=new Map();
for(const page of catalog){
 if(page.status==="draft")continue;
 const main=read(page.source);
 const out=page.path==="/"? "index.html":path.join(page.path.slice(1),"index.html");
 outputs.set(out,renderPage(page,main,layout,catalog));
}
const included=catalog.filter(p=>p.status!=="draft");
const xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+included.map(p=>'  <url><loc>https://usaanimeclub.com'+p.path+'</loc><lastmod>'+(p.modified||p.published||"2026-11-03")+'</lastmod></url>').join("\n")+'\n</urlset>\n';
outputs.set("sitemap.xml",xml);
// The 404 page is generated from the same shared header, footer and tracking shell.
// It is deliberately omitted from the content catalog and sitemap.
const notFoundPage={path:"/404/",kind:"page",title:"Page Not Found",description:"This URL could not be found on USA Anime Club."};
const notFoundHtml=renderPage(notFoundPage,read("content/pages/404.html"),layout,catalog)
 .replace('<meta name="robots" content="index,follow,max-image-preview:large">','<meta name="robots" content="noindex,follow">')
 .replace('<link rel="canonical" href="https://usaanimeclub.com/404/">',"");
outputs.set("404.html",notFoundHtml);
const failures=[];
for(const [rel,content] of outputs){
 const dest=path.join(root,rel);
 const old=fs.existsSync(dest)?fs.readFileSync(dest,"utf8"):null;
 if(process.argv.includes("--check")){if(old!==content)failures.push(rel);}
 else if(old!==content){fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,content);}
}
if(failures.length){console.error("Generated pages are stale:",failures.join(", "));process.exitCode=1;}
else console.log((process.argv.includes("--check")?"Verified":"Built")+" "+included.length+" pages and sitemap from catalog and shared layout.");
