import assert from "node:assert/strict";
import {readFileSync,existsSync,readdirSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {runInNewContext} from "node:vm";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>readFileSync(resolve(root,p),"utf8");
const articles=JSON.parse(read("content/articles.json"));
const base="https://usaanimeclub.com";
const sitemap=read("sitemap.xml");
const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
const unique=(values,label)=>assert.equal(new Set(values).size,values.length,"duplicate "+label);
assert(urls.length>=articles.length+8,"sitemap omits articles or trust pages");
unique(urls,"sitemap URLs");
unique(articles.map(a=>a.slug),"article slugs");
const expectedArticles=articles.map(a=>base+"/news/"+a.slug+"/");
for(const href of expectedArticles)assert(urls.includes(href),"missing article from sitemap "+href);

const localPath=url=>{
 const parsed=new URL(url,base);
 if(parsed.origin!==base)return null;
 const path=decodeURIComponent(parsed.pathname);
 return path.endsWith("/")?path.slice(1)+"index.html":path.slice(1);
};
const titles=[],descriptions=[],keywords=[];
let testedLinks=0,schemas=0;
for(const pageUrl of urls){
 const file=localPath(pageUrl);
 assert(existsSync(resolve(root,file)),"missing page "+file);
 const html=read(file);
 assert(html.includes('<html lang="en-US">'),"wrong site language "+file);
 assert(html.includes('<main id="main">'),"missing main landmark "+file);
 assert(html.includes("<h1>"),"missing h1 "+file);
 assert(html.includes('rel="canonical" href="'+pageUrl+'"'),"wrong canonical "+file);
 assert(html.includes("/assets/privacy.js"),"privacy controls missing "+file);
 assert(html.includes("/assets/site.js"),"shared runtime missing "+file);
 assert(html.includes("data-privacy-choices"),"privacy choice inaccessible "+file);
 for(const [re,array,label] of [
   [/<title>([^<]+)<\/title>/,titles,"title"],
   [/<meta name="description" content="([^"]+)"/,descriptions,"description"],
   [/<meta name="keywords" content="([^"]+)"/,keywords,"keywords"]
 ]){
   const match=html.match(re);assert(match&&match[1].length>8,"missing "+label+" in "+file);array.push(match[1]);
 }
 const scripts=[...html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g)].map(m=>JSON.parse(m[1]));
 assert(scripts.length>0,"schema missing "+file);schemas+=scripts.length;
 for(const a of [...html.matchAll(/(?:href|src)="([^"]+)"/g)]){
   const link=a[1];if(!link.startsWith("/")&&!link.startsWith("#"))continue;
   if(link.startsWith("#")){
     if(link==="#main"||link==="#latest")assert(html.includes('id="'+link.slice(1)+'"'),"missing anchor "+link+" in "+file);
     continue;
   }
   const destination=localPath(link);
   assert(destination&&existsSync(resolve(root,destination)),"broken internal link "+file+" -> "+link);
   testedLinks++;
 }
 for(const img of [...html.matchAll(/<img\b[^>]*>/g)])assert(/\balt="/.test(img[0]),"missing image alternative "+file);
 const article=articles.find(a=>pageUrl===base+"/news/"+a.slug+"/");
 if(article){
   const ld=scripts.find(x=>x["@type"]==="NewsArticle");
   assert(ld,"NewsArticle JSON-LD missing "+file);
   assert(ld.datePublished.startsWith(article.date),"incorrect publish date "+file);
   assert(ld.dateModified.startsWith(article.modified||article.date),"incorrect modified date "+file);
   assert(html.includes('datetime="'+article.sourceDate+'"'),"source date absent "+file);
   assert(html.includes(article.source.replaceAll("&","&amp;")),"primary source absent "+file);
   assert(existsSync(resolve(root,"assets/news/"+article.slug+".svg")),"image not generated "+file);
 }
}
unique(titles,"SEO titles");unique(descriptions,"SEO descriptions");unique(keywords,"SEO keywords");
const expectedNews=articles.filter(a=>{
 const published=Date.parse(a.date+"T12:00:00Z");
 return published<=Date.now()&&Date.now()-published<=48*60*60*1000;
}).map(a=>base+"/news/"+a.slug+"/");
const newsXml=read("news-sitemap.xml");
const foundNews=[...newsXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
assert.deepEqual(foundNews.sort(),expectedNews.sort(),"Google News sitemap contains stale or missing URLs");
assert(read("robots.txt").includes(base+"/sitemap.xml"),"robots.txt lacks sitemap");
const rss=read("feed.xml");
for(const a of articles)assert(rss.includes("<guid isPermaLink=\"true\">"+base+"/news/"+a.slug+"/</guid>"),"RSS omits "+a.slug);
const homepage=read("index.html");
const mostRecent=[...articles].sort((a,b)=>b.sourceDate.localeCompare(a.sourceDate)||b.date.localeCompare(a.date)||a.title.localeCompare(b.title))[0];
const featured=homepage.match(/<a class="feature-card"[^>]* href="([^"]+)"/);
assert(featured&&featured[1]==="/news/"+mostRecent.slug+"/","featured headline should be latest source announcement");

// Simulate optional analytics consent without loading any third-party scripts.
function consentHarness(previous){
 const saved=new Map(previous?[["usa-anime-club-analytics-consent-v1",previous]]:[]);
 const loaded=[];
 const controls={};
 const element=()=>({handlers:{},addEventListener(name,fn){this.handlers[name]=fn},click(){this.handlers.click?.()}});
 const accept=element(),decline=element(),choice=element(),focusButton=element();
 focusButton.focus=()=>{}; // Browser buttons expose focus(); the test double must too.
 const banner={hidden:true,querySelector:()=>focusButton};
 const head={appendChild(x){loaded.push(x.src)}};
 const document={
   getElementById:id=>id==="privacy-banner"?banner:null,
   querySelectorAll:sel=>sel==="[data-consent-accept]"?[accept]:sel==="[data-consent-decline]"?[decline]:sel==="[data-privacy-choices]"?[choice]:[],
   createElement:()=>({}),
   getElementsByTagName:()=>[{parentNode:{insertBefore:x=>loaded.push(x.src)}}],
   head
 };
 let reloads=0;
 const window={dataLayer:[],location:{reload:()=>reloads++}};
 const localStorage={getItem:key=>saved.get(key)||null,setItem:(key,value)=>saved.set(key,value)};
 runInNewContext(read("assets/privacy.js"),{document,window,localStorage,Date,encodeURIComponent});
 return {accept,decline,choice,banner,loaded,saved,window,getReloads:()=>reloads};
}
const newVisitor=consentHarness();
assert.equal(newVisitor.loaded.length,0,"analytics loaded without consent");
assert.equal(newVisitor.banner.hidden,false,"new visitor sees no privacy choice");
newVisitor.decline.click();
assert.equal(newVisitor.loaded.length,0,"declining loaded analytics");
const accepted=consentHarness();
accepted.accept.click();
assert(accepted.loaded.some(x=>x.includes("gtag/js?id=G-G0TNMR0FQL")),"GA4 not loaded on accept");
assert(accepted.loaded.some(x=>x.includes("clarity.ms/tag/yyqq9cryjc")),"Clarity not loaded on accept");
accepted.choice.click();accepted.decline.click();
assert.equal(accepted.getReloads(),1,"revocation should reload page");
const returningDeclined=consentHarness("declined");
assert.equal(returningDeclined.loaded.length,0,"declined visitor should remain untracked");
const returningAccepted=consentHarness("accepted");
assert.equal(returningAccepted.loaded.length,2,"accepted visitor should load both analytics scripts");


const homeHtml=read("index.html");
const style=read("assets/styles.css");
const uiScript=read("assets/site.js");
assert(homeHtml.includes('id="local-clock"'),"visitor-local clock missing from masthead");
assert(!homeHtml.includes("YOUR LOCAL TIME"),"clock label should not be visible");
assert(homeHtml.includes("THE ANIME NEWS DESK"),"editorial left label missing");
assert(!homeHtml.includes("UNITED STATES EDITION"),"obsolete masthead text remains");
assert(!homeHtml.includes("INDEPENDENT ANIME JOURNALISM"),"obsolete strapline remains");
assert(style.includes("color-scheme:light"),"light theme required");
assert(style.includes("--teal:#089e98")&&style.includes("--violet:#6e54db"),"anime palette incomplete");
assert(uiScript.includes("Intl.DateTimeFormat")&&uiScript.includes("updateClock()"),"live local clock is not wired");
for(const path of ["assets/styles.css","assets/favicon.svg","scripts/build.mjs"]){
  assert(!/#(?:df496d|ff4f9a|d52e58|e45977|ffe9ef|fff0f2)\b/i.test(read(path)),"old pink palette remains in "+path);
}


const allHtml=urls.map(loc=>read(localPath(loc)));
const cardMarkup=allHtml.filter(html=>html.includes('class="news-card"'));
assert(cardMarkup.length>=2,"news card template not applied");
for(const html of cardMarkup){
  assert(html.includes('class="card-media"'),"card media must be enclosed");
  assert(html.includes('class="card-meta"'),"card category/date missing");
  assert(html.includes('class="card-footer"'),"card footer missing");
}
assert(read("index.html").includes('class="feature-media"'),"lead story media grouping missing");
assert(read("index.html").includes('class="rail-read"'),"latest rail article labels missing");
const designCss=read("assets/styles.css");
assert(designCss.includes("border-top:5px solid var(--accent)"),"story cards lack a category accent border");
assert(designCss.includes("--head:\"Fraunces\""),"editorial headline typeface missing");
assert(!read("index.html").includes('class="topic-icon"'),"decorative topic icons should be removed");
// Lock the common article markup against accidental changes.
const articleLock=JSON.parse(read("scripts/article-template.lock.json"));
const buildSource=read("scripts/build.mjs");
const templateStart=buildSource.indexOf('    const content=`<div class="post-layout">');
const templateEnd=buildSource.indexOf("    const schema=",templateStart);
assert(templateStart>=0&&templateEnd>templateStart,"article template missing");
const templateContent=buildSource.slice(templateStart,templateEnd);
let fnvHash=2166136261;for(let i=0;i<templateContent.length;i++){fnvHash^=templateContent.charCodeAt(i);fnvHash=Math.imul(fnvHash,16777619)}
assert.equal((fnvHash>>>0).toString(16).padStart(8,"0"),articleLock.templateHash,"shared article template changed");
assert(articles.length>=1,"At least one verified article is required");
for(const category of ["Anime","Manga","Manhwa","Web Novels"]){
 assert(articles.some(a=>a.category===category),"Missing topic "+category);
 assert(read("news/index.html").includes('data-category="'+category+'"'),"Missing browse filter "+category);
}
const sourceSlugs=new Set(articles.map(a=>a.slug));
for(const file of readdirSync(resolve(root,"assets/news"))){
 if(file.endsWith(".svg"))assert(sourceSlugs.has(file.slice(0,-4)),"orphaned artwork "+file);
}
for(const file of readdirSync(resolve(root,"news"),{withFileTypes:true})){
 if(file.isDirectory()&&file.name!=="page")assert(sourceSlugs.has(file.name),"orphaned article page "+file.name);
}
const consentCode=read("assets/privacy.js");
assert(consentCode.includes("G-G0TNMR0FQL")&&consentCode.includes("yyqq9cryjc"),"Analytics IDs missing from shared consent");
for(const loc of urls){
 const html=read(localPath(loc));
 assert(html.includes("/assets/privacy.js"),"Shared analytics code missing from "+loc);
 assert(html.includes("/assets/site.js"),"Shared JS missing from "+loc);
}
assert(read("index.html").includes("category=Web%20Novels"),"Web novel navigation missing");



const wc=text=>String(text).trim().split(/\s+/).filter(Boolean).length;
for(const a of articles){
 const paragraphs=a.sections.flatMap(section=>section[1]);
 const count=paragraphs.reduce((total,p)=>total+wc(p),0);
 assert(count>=1000,a.slug+" has only "+count+" content words");
 assert(new Set(paragraphs).size===paragraphs.length,"Duplicate paragraphs in "+a.slug);
 const page=read("news/"+a.slug+"/index.html");
 const blocks=[...page.matchAll(new RegExp('<script type="application/ld[+]json">([^<]+)</script>','g'))].map(x=>JSON.parse(x[1]));
 const schema=blocks.find(s=>s["@type"]==="NewsArticle");
 assert(schema,"Missing news JSON-LD "+a.slug);
 assert.equal(schema.wordCount,count,"Schema word count mismatch "+a.slug);
 assert(schema.citation?.includes(a.source),"Source citation omitted from JSON-LD "+a.slug);
 assert.equal(schema.about?.name,a.category,"Article category inconsistent "+a.slug);
 assert(page.includes('class="tldr"'),"Answer-first summary missing "+a.slug);
}
const categoryStyles=read("assets/styles.css");
for(const category of ["Anime","Manga","Manhwa","Web Novels"]){
 assert(categoryStyles.includes('[data-news-category="'+category+'"]'),"No color palette for "+category);
}
const front=read("index.html");
assert(front.includes('class="feature-card" data-news-category='),"Lead story color is not category-aware");
assert(front.includes('class="latest-item" data-news-category='),"Latest news color is not category-aware");


const googlePreferred="https://www.google.com/preferences/source?q=usaanimeclub.com";
const htmlPages=urls.map(u=>read(localPath(u)));
for(const html of htmlPages){
 assert(html.includes('href="'+googlePreferred+'"'),"Google Preferred Source link missing on an indexable page");
 assert(html.includes("fonts.googleapis.com/css2?family=Fraunces"),"new site-wide headline font missing");
 assert(html.includes("family=IBM+Plex+Sans"),"new site-wide text font missing");
}
assert(read("index.html").includes('class="card-folio"'),"Folio header missing from cards");
assert(read("index.html").includes('class="feature-folio"'),"Lead folio header missing");
assert(!read("index.html").includes("DISPATCH"),"Card dispatch numbering or label still visible");
assert(!read("index.html").includes('class="card-number"'),"Card numbering still visible");
assert(read("assets/styles.css").includes("justify-content:flex-end;gap:1rem;background:var(--accent)"),"Category headers must align right");
const everyStory=JSON.parse(read("content/articles.json"));
const bylines=everyStory.flatMap(a=>a.sections.flatMap(s=>s[1]));
assert(!bylines.some(p=>p.includes("USA Anime Club is")||p.includes("USA Anime Club will")),"Self-referential story boilerplate remains");


// Detect verbatim long passages reused in different articles. This is an internal
// originality safeguard, NOT a claim that an external plagiarism scan has run.
const crossArticlePhrases=new Map();
for(const article of articles){
  const words=article.sections.flatMap(section=>section[1]).join(" ").toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu)||[];
  const localPhrases=new Set();
  for(let index=0;index<=words.length-12;index++)localPhrases.add(words.slice(index,index+12).join(" "));
  for(const phrase of localPhrases){
    const owner=crossArticlePhrases.get(phrase);
    assert(!owner||owner===article.slug,"Repeated twelve-word passage in "+owner+" and "+article.slug);
    crossArticlePhrases.set(phrase,article.slug);
  }
}


const fourColorPalette={"Anime":"#173A70","Manga":"#932B3B","Manhwa":"#F4C542","Web Novels":"#16744A"};
const fourColorCSS=read("assets/styles.css");
for(const [category,color] of Object.entries(fourColorPalette)){
 assert(fourColorCSS.includes('.news-card[data-news-category="'+category+'"]'),"Card theme missing "+category);
 assert(fourColorCSS.includes('--accent:'+color+';--accent-dark:'),"Card theme color mismatch "+category);
 const example=articles.find(a=>a.category===category);
 assert(example,"Missing test category "+category);
 assert(read("assets/news/"+example.slug+".svg").includes('fill="'+color+'"'),"Cover identity color missing "+category);
}
assert(fourColorCSS.includes("--accent-contrast:#22200E"),"Yellow header must use dark text");
assert(fourColorCSS.includes("color:var(--accent-contrast,#fff)"),"Category header must use contrast-aware text");


for(const a of articles){
 const html=read("news/"+a.slug+"/index.html");
 assert(!html.includes("ORIGINAL ANNOUNCEMENT"),"Original announcement sidebar card not removed: "+a.slug);
 assert(!html.includes('class="sidebar-panel sidebar-source"'),"Old source sidebar remains: "+a.slug);
 const note=html.match(/<div class="source-note">([\\s\\S]*?)<\\/div>/);
 assert(note&&note[1].includes("Primary source and reporting notes"),"Reporting notes missing: "+a.slug);
 assert(note[1].includes('class="source-primary-link"'),"Source button not inside reporting notes: "+a.slug);
 assert(note[1].includes('View primary source'),"Source button label missing: "+a.slug);
 assert(note[1].includes(a.source.replaceAll("&","&amp;")),"Source link mismatch: "+a.slug);
 assert(note[1].includes('datetime="'+a.sourceDate+'"'),"Source date/check note missing: "+a.slug);
 assert((html.match(/View primary source/g)||[]).length===1,"Duplicate source links: "+a.slug);
 assert(html.includes("IN THIS REPORT"),"Article table of contents was removed: "+a.slug);
}

console.log("PASS: "+urls.length+" pages; "+testedLinks+" internal references; "+schemas+" structured-data blocks; "+articles.length+" news items; privacy consent simulations; SEO uniqueness; sitemap freshness.");
