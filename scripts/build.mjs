import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

// Fingerprint CSS content, so an updated HTML page cannot silently reuse an old CDN stylesheet.
// Homepage-only styles use an independent URL; the small inline layout fallback protects against
// a late or failed CSS response. All other pages keep using the shared site stylesheet.
const fingerprint=file=>createHash("sha256").update(fs.readFileSync(path.join(process.cwd(),file))).digest("hex").slice(0,12);
const CRITICAL_HOMEPAGE_CSS=`/* Defensive first-paint layout, independent of CDN CSS cache */
.hero-next-grid{display:grid;grid-template-columns:minmax(0,1.07fr) minmax(0,.93fr);gap:32px;align-items:center;min-height:580px}
.hero-next-copy h1{font-size:clamp(3rem,5.1vw,5.65rem);line-height:1.055;letter-spacing:-.067em;margin:0 0 26px}
.hero-next{padding:38px 0 24px;overflow:clip}
.hero-next-copy{min-width:0}.hero-next-lead{max-width:50ch;line-height:1.7}
.hero-next-actions{display:flex;align-items:center;flex-wrap:wrap;gap:18px;margin:25px 0}
.hero-primary{display:inline-flex;align-items:center;gap:15px;padding:13px 20px;border-radius:16px;background:#A84313;color:#fff;text-decoration:none;font-weight:800}
.hero-quick-links{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:20px 0}
.hero-stage{position:relative;min-width:0;height:560px;border-radius:30px;background:linear-gradient(145deg,#FFF0CC,#D9F4EB);overflow:visible}
.hero-poster-front{position:absolute;inset:10% 17% 12% 16%;transform:rotate(-7deg)}
.hero-poster-frame,.hero-poster-frame img{display:block;width:100%;height:100%;object-fit:cover;border-radius:20px}
.hero-float{position:absolute;display:flex;gap:7px;align-items:center;z-index:3;padding:10px;background:#fff;color:#1d5478;border-radius:12px;text-decoration:none;box-shadow:0 5px 0 #3175a2}
.hero-float-watch{top:17%;left:-4%}.hero-float-read{bottom:24%;right:-4%}.hero-float-create{bottom:8%;left:-4%}
.topic-grid-next{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px}
.topic-grid-next .topic-box{display:flex;flex-direction:column;gap:12px;padding:22px;min-height:200px}
.home-path-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}
@media(max-width:750px){.hero-next-grid{grid-template-columns:1fr;min-height:0}.hero-stage{height:min(560px,88vw);min-height:340px;width:min(100% - 14px,530px);margin:15px auto}.topic-grid-next{grid-template-columns:repeat(2,minmax(0,1fr))}.home-path-grid{grid-template-columns:1fr 1fr}}
@media(max-width:560px){.hero-next-copy h1{font-size:clamp(2.8rem,11vw,4.1rem)}.hero-stage{height:410px;min-height:0}.home-path-grid{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){.hero-stage *{animation:none!important}}
`;
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

 if(page.kind==="article"){
  const displayDate=date=>new Date(date+"T00:00:00Z").toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric",timeZone:"UTC"});
  const visible='<span>Published <time datetime="'+page.published+'">'+displayDate(page.published)+'</time></span>'+
    (page.modified&&page.modified!==page.published?'<span>Updated <time datetime="'+page.modified+'">'+displayDate(page.modified)+'</time></span>':'');
  main=main.replace(/<span>Published [^<]*<\/span>/,visible);
 }
 if(page.path==="/guides/"){
  const pathways=[
   {title:"Start watching",description:"Choose anime, understand release labels and check US viewing options.",links:[["/guides/choose-first-anime/","Choose a first series"],["/guides/anime-season-terms/","Understand seasons and simulcasts"],["/guides/find-anime-streaming-us/","Check legal streaming"]]},
   {title:"Read and collect",description:"Compare manga formats and discover borrowing or buying options.",links:[["/guides/manga-editions-translations/","Compare editions and ISBNs"],["/guides/manga-collecting-budget/","Plan your collecting budget"],["/guides/anime-manga-public-library/","Explore library options"]]},
   {title:"Create and cosplay",description:"Prepare a practical costume and understand rights and safe buying.",links:[["/guides/cosplay-budget-safety/","Budget cosplay and event rules"],["/guides/fan-art-permission-credit/","Fan-art permissions"],["/guides/buy-anime-merch-safely/","Shop more safely"]]},
   {title:"Find your people",description:"Plan gatherings with accessibility, courtesy and screening rights in mind.",links:[["/guides/start-anime-club/","Start an anime club"],["/guides/host-anime-watch-party/","Host a watch party"],["/guides/spoiler-etiquette/","Avoid spoilers"]]}
  ];
  const journeys='<section class="section topic-journeys" aria-labelledby="reader-paths"><div class="container"><h2 id="reader-paths">Find a path through the guides</h2><p>Follow the question that brought you here, then explore the next practical step.</p><div class="topic-journey-grid">'+
   pathways.map(x=>'<article class="note-panel topic-journey"><h3>'+x.title+'</h3><p>'+x.description+'</p><ul>'+x.links.map(l=>'<li><a href="'+l[0]+'">'+l[1]+'</a></li>').join("")+'</ul></article>').join("")+
   '</div></div></section>';
  main=main.replace("</main>",journeys+"</main>");
 }
 let html=layout.replace("{{MAIN}}",main.trim());
 // Changes to the shared stylesheet produce a new URL for every HTML page.
 html=html.replace('href="/assets/site.css"',`href="/assets/site.css?v=${fingerprint("assets/site.css")}"`);
 html=html.replace('src="/assets/tracking.js"',`src="/assets/tracking.js?v=${fingerprint("assets/tracking.js")}"`);
 // A new artwork version must not reuse an old pink/purple logo, favicon or cover.
 html=html.replace(/((?:src|href)=")(\/(?:assets\/(?:logo|hero-sky-traveler)\.svg|assets\/covers\/[a-z0-9-]+\.svg|favicon\.svg))(")/g,
  (match,start,url,end)=>{const file=url.slice(1);return fs.existsSync(path.join(process.cwd(),file))?start+url+"?v="+fingerprint(file)+end:match;});
 if(page.path==="/"){
  // Bust stale homepage interaction code after dropdown/menu changes.
  html=html.replace('src="/assets/home-motion.js"',`src="/assets/home-motion.js?v=${fingerprint("assets/home-motion.js")}"`);
  const homeVersion=fingerprint("assets/home-next-20261103.css");
  const extra=`<style id="home-layout-fallback">${CRITICAL_HOMEPAGE_CSS}</style><link rel="stylesheet" href="/assets/home-next-20261103.css?v=${homeVersion}">`;
  html=html.replace("</head>",extra+"</head>");
 }

 html=html.replace(/<title>[\s\S]*?<\/title>/,`<title>${escape(page.seoTitle||page.title)} | USA Anime Club</title>`);
 html=html.replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="${escape(page.description)}">`);
 html=html.replace(/<link rel="canonical" href="[^"]*">/,`<link rel="canonical" href="${url}">`);
 const og={"og:title":page.title,"og:description":page.description,"og:url":url,"og:type":page.kind==="article"?"article":"website"};
 for(const [tag,value] of Object.entries(og))html=html.replace(new RegExp(`<meta property="${tag}" content="[^"]*">`),`<meta property="${tag}" content="${escape(value)}">`);

 const absolute=p=>"https://usaanimeclub.com"+p;
 const plain=str=>str.replace(/<[^>]*>/g," ").replace(/&amp;/g,"&").replace(/&#39;|&apos;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g," ").trim();
 const quick=page.kind==="article"?main.match(/<section class="guide-summary" aria-labelledby="quick-answer"><h2 id="quick-answer">([^<]+)<\/h2><p>([\s\S]*?)<\/p><\/section>/):null;
 const sourceList=page.kind==="article"?(main.split('<h2 id="sources">')[1]||"").split("</ul>")[0]:"";
 const citations=[...new Set([...sourceList.matchAll(/<a href="(https?:\/\/[^"]+)"/g)].map(m=>m[1]))].slice(0,15);
 const isHub=page.path==="/guides/"||page.path==="/tools/";
 const website={"@type":"WebSite","@id":"https://usaanimeclub.com/#website","url":"https://usaanimeclub.com/","name":"USA Anime Club","inLanguage":"en-US"};
 const publisher={"@type":"Organization","@id":"https://usaanimeclub.com/#publisher","name":"USA Anime Club","url":"https://usaanimeclub.com/","logo":{"@type":"ImageObject","url":absolute("/assets/logo.svg")},"email":"contact@usaanimeclub.com"};
 const webPage={"@type":isHub?"CollectionPage":"WebPage","@id":url+"#webpage","url":url,"name":page.title,"description":page.description,"inLanguage":"en-US","isPartOf":{"@id":"https://usaanimeclub.com/#website"}};
 const graph=[website,publisher,webPage];
 if(page.kind==="article"){
  const post={"@type":"BlogPosting","@id":url+"#article","headline":page.title,"description":page.description,"author":{"@type":"Organization","name":"USA Anime Club editorial project","url":absolute("/about/")},"publisher":{"@id":"https://usaanimeclub.com/#publisher"},"mainEntityOfPage":{"@id":url+"#webpage"},"datePublished":page.published,"dateModified":page.modified||page.published,"image":absolute("/assets/covers/"+page.cover+".svg"),"inLanguage":"en-US","articleSection":page.category};
  if(quick){post.abstract=plain(quick[2]);post.about={"@type":"Thing","name":plain(quick[1])};}
  if(citations.length)post.citation=citations;
  graph.push(post);
  webPage.mainEntity={"@id":url+"#article"};
  graph.push({"@type":"BreadcrumbList","@id":url+"#breadcrumbs","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":absolute("/")},{"@type":"ListItem","position":2,"name":"Guides","item":absolute("/guides/")},{"@type":"ListItem","position":3,"name":page.title,"item":url}]});
  const image=absolute("/assets/covers/"+page.cover+".svg");
  html=html.replace(/<meta name="twitter:card" content="[^"]*">/,'<meta name="twitter:card" content="summary_large_image"><meta property="og:image" content="'+image+'"><meta property="og:image:alt" content="'+escape(page.title)+'"><meta name="twitter:image" content="'+image+'"><meta property="article:published_time" content="'+page.published+'"><meta property="article:modified_time" content="'+(page.modified||page.published)+'">');
 }else{
  const image=absolute("/assets/home-concept-scene-hd-2x.webp");
  html=html.replace(/<meta name="twitter:card" content="[^"]*">/,'<meta name="twitter:card" content="summary_large_image"><meta property="og:image" content="'+image+'"><meta property="og:image:type" content="image/webp"><meta property="og:image:width" content="1600"><meta property="og:image:height" content="1010"><meta property="og:image:alt" content="Anime-inspired illustration for USA Anime Club"><meta name="twitter:image" content="'+image+'">');
 }
 if(isHub){
  const listed=page.path==="/guides/"?published:catalog.filter(p=>p.path.startsWith("/tools/")&&p.path!=="/tools/"&&p.status!=="draft");
  webPage.mainEntity={"@id":url+"#items"};
  graph.push({"@type":"ItemList","@id":url+"#items","name":page.title,"itemListElement":listed.map((x,i)=>({"@type":"ListItem","position":i+1,"name":x.title,"url":absolute(x.path)}))});
 }
 if(page.path.startsWith("/tools/")&&page.path!=="/tools/"){
  webPage.mainEntity={"@id":url+"#tool"};
  graph.push({"@type":"WebApplication","@id":url+"#tool","name":page.title,"description":page.description,"url":url,"applicationCategory":"UtilitiesApplication","operatingSystem":"Web browser","inLanguage":"en-US","isAccessibleForFree":true,"offers":{"@type":"Offer","price":0,"priceCurrency":"USD"},"publisher":{"@id":"https://usaanimeclub.com/#publisher"}});
  graph.push({"@type":"BreadcrumbList","@id":url+"#breadcrumbs","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":absolute("/")},{"@type":"ListItem","position":2,"name":"Tools","item":absolute("/tools/")},{"@type":"ListItem","position":3,"name":page.title,"item":url}]});
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
const canonicalOrigin="https://usaanimeclub.com";
const sortedPages=[...included].sort((a,b)=>a.path==="/"?-1:b.path==="/"?1:a.path.localeCompare(b.path));
const escapeXml=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c]));
const xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+
 sortedPages.map(p=>'  <url>\n    <loc>'+escapeXml(canonicalOrigin+p.path)+'</loc>\n    <lastmod>'+escapeXml(p.modified||p.published||"2026-11-03")+'</lastmod>\n  </url>').join("\n")+
 '\n</urlset>\n';
outputs.set("sitemap.xml",xml);
const robots=['# USA Anime Club crawling directives (generated by scripts/build.mjs)',
 'User-agent: *','Allow: /','', 'Sitemap: '+canonicalOrigin+'/sitemap.xml',''].join("\n");
outputs.set("robots.txt",robots);
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
