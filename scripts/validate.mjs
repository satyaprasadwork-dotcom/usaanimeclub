import assert from "node:assert/strict";
import {readFileSync,existsSync,readdirSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {runInNewContext} from "node:vm";
import {ARTICLES_PER_PAGE,getPageCount,getPageItems,paginationHtml} from "./pagination.mjs";

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
const mostRecent=[...articles].sort((a,b)=>b.date.localeCompare(a.date)||(b.publishSequence||0)-(a.publishSequence||0)||b.sourceDate.localeCompare(a.sourceDate)||a.title.localeCompare(b.title))[0];
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
 if(file.isDirectory()&&file.name!=="page"&&file.name!=="category")assert(sourceSlugs.has(file.name),"orphaned article page "+file.name);
}
const consentCode=read("assets/privacy.js");
assert(consentCode.includes("G-G0TNMR0FQL")&&consentCode.includes("yyqq9cryjc"),"Analytics IDs missing from shared consent");
for(const loc of urls){
 const html=read(localPath(loc));
 assert(html.includes("/assets/privacy.js"),"Shared analytics code missing from "+loc);
 assert(html.includes("/assets/site.js"),"Shared JS missing from "+loc);
}
assert(read("index.html").includes("/news/category/web-novels/"),"Web novel navigation missing");



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
const homePage=read("index.html");
const homeMain=homePage.slice(homePage.indexOf('<main id="main">'),homePage.indexOf("</main>"));
const homeFooter=homePage.slice(homePage.indexOf('<footer class="foot">'));
assert(!homeMain.includes(googlePreferred),"Preferred Sources button must not appear in landing page content");
assert(homeFooter.includes('href="'+googlePreferred+'"'),"Preferred Sources link must remain in homepage footer");

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
 const noteStart=html.indexOf('<div class="source-note">');
 const noteEnd=html.indexOf('</div>',noteStart);
 const note=noteStart>=0&&noteEnd>noteStart?html.slice(noteStart,noteEnd):"";
 assert(note&&note.includes("Primary source and reporting notes"),"Reporting notes missing: "+a.slug);
 assert(note.includes('class="source-primary-link"'),"Source button not inside reporting notes: "+a.slug);
 assert(note.includes('View primary source'),"Source button label missing: "+a.slug);
 assert(note.includes(a.source.replaceAll("&","&amp;")),"Source link mismatch: "+a.slug);
 assert(note.includes('datetime="'+a.sourceDate+'"'),"Source date/check note missing: "+a.slug);
 assert((html.match(/View primary source/g)||[]).length===1,"Duplicate source links: "+a.slug);
 assert(html.includes("IN THIS REPORT"),"Article table of contents was removed: "+a.slug);
}


for(const story of articles){
 const html=read("news/"+story.slug+"/index.html");
 const mainStart=html.indexOf('<main id="main">'),mainEnd=html.indexOf("</main>",mainStart);
 const main=html.slice(mainStart,mainEnd);
 const related=main.lastIndexOf('class="related-section"');
 const follow=main.lastIndexOf('class="article-preferred-source"');
 const footerEnd=main.lastIndexOf("</section>");
 assert(related>=0,"Related coverage missing in "+story.slug);
 assert(follow>related,"Preferred source CTA must be after related coverage in "+story.slug);
 assert(follow<footerEnd,"Preferred source CTA must be before the end of main in "+story.slug);
 const followMarkup=main.slice(follow);
 assert(followMarkup.includes('href="https://www.google.com/preferences/source?q=usaanimeclub.com"'),"Google Preferred Sources URL missing in "+story.slug);
 assert(followMarkup.includes('Add as a preferred source on Google'),"Follow button missing in "+story.slug);
 assert((main.match(/class="article-preferred-source"/g)||[]).length===1,"Expected exactly one article-end follow CTA in "+story.slug);
}


// The ticker is generated from the complete content set for every website page.
for(const pageUrl of urls){
 const html=read(localPath(pageUrl));
 const headerEnd=html.indexOf("</header>");
 const tickerStart=html.indexOf('<nav class="news-ticker"');
 const mainStart=html.indexOf('<main id="main">');
 assert(headerEnd>=0&&tickerStart>headerEnd&&tickerStart<mainStart,"Ticker missing below header: "+pageUrl);
 assert(html.includes('aria-label="Latest anime, manga, manhwa and web novel headlines"'),"Ticker accessibility label missing: "+pageUrl);
 const originalStart=html.indexOf('<div class="news-ticker-set">',tickerStart);
 const cloneStart=html.indexOf('<div class="news-ticker-set" aria-hidden="true">',originalStart);
 assert(originalStart>=0&&cloneStart>originalStart,"Ticker repeat groups missing: "+pageUrl);
 const accessible=html.slice(originalStart,cloneStart);
 const repeat=html.slice(cloneStart,mainStart);
 for(const a of articles){
   const link='/news/'+a.slug+'/';
   assert(accessible.includes('href="'+link+'"'),"Ticker omitted "+a.slug+" on "+pageUrl);
   assert(repeat.includes('href="'+link+'" tabindex="-1"'),"Ticker duplicate not hidden from tab order for "+a.slug);
 }
 assert((accessible.match(/class="news-ticker-link"/g)||[]).length===articles.length,"Ticker count doesn't match published stories: "+pageUrl);
}
const movingTickerCSS=read("assets/styles.css");
assert(movingTickerCSS.includes("@keyframes news-ticker-left"),"Ticker animation missing");
assert(movingTickerCSS.includes("translateX(-50%)"),"Ticker must move right to left");
assert(movingTickerCSS.includes("prefers-reduced-motion:reduce")&&movingTickerCSS.includes(".news-ticker-track{animation:none"),"Reduced-motion ticker fallback missing");
assert(movingTickerCSS.includes(".news-ticker-window:hover .news-ticker-track"),"Ticker must pause on hover");


// Filtering is restricted to archive cards: ticker headlines must never be
// hidden or included in the archive's visible-story count.
const runtime=read("assets/site.js");
assert(runtime.includes('.archive-grid .news-card[data-news-category]'),"Archive selector must be scoped to archive cards");
assert(!runtime.includes('querySelectorAll("[data-news-category]")'),"Global category selector would hide ticker headlines");
const sheet=read("assets/styles.css");
assert(sheet.includes('.edition-bar{display:block}'),"Mobile clock strip must remain visible");
assert(sheet.includes('.edition-inner{justify-content:flex-end}'),"Small mobile screens need clock-only layout");
for(const loc of urls){
  const html=read(localPath(loc));
  assert(html.includes('id="local-clock"'),"Device local clock absent on "+loc);
}


// Topic archives are complete, canonical, paginated collections, not
// query-parameter filters limited to the current 12-story page.
const routeNames={"Anime":"anime","Manga":"manga","Manhwa":"manhwa","Web Novels":"web-novels"};
for(const [category,slug] of Object.entries(routeNames)){
 const matching=articles.filter(a=>a.category===category);
 const count=getPageCount(matching.length);
 for(let number=1;number<=count;number++){
   const path=number===1?"/news/category/"+slug+"/":"/news/category/"+slug+"/page/"+number+"/";
   const canonical=base+path;
   assert(urls.includes(canonical),"Topic collection missing from sitemap "+path);
   const html=read(localPath(canonical));
   assert(html.includes('<h1>'+category+' news'),"Topic collection heading wrong "+path);
   assert(html.includes('rel="canonical" href="'+canonical+'"'),"Category canonical wrong "+path);
   const grid=html.slice(html.indexOf('class="grid archive-grid"'));
   for(const story of getPageItems(matching.sort((a,b)=>b.date.localeCompare(a.date)||(b.publishSequence||0)-(a.publishSequence||0)||b.sourceDate.localeCompare(a.sourceDate)||a.title.localeCompare(b.title)),number)){
     assert(grid.includes('href="/news/'+story.slug+'/"'),"Topic collection omitted "+story.slug);
   }
   assert((grid.match(/class="news-card"/g)||[]).length===getPageItems(matching,number).length,"Category card count wrong "+path);
   assert((grid.match(/class="news-card"/g)||[]).length<=ARTICLES_PER_PAGE,"More than 12 cards rendered on "+path);
   assert(html.includes('class="news-pagination"'),"Pagination missing on "+path);
   assert(html.includes('aria-current="page"'),"Current page missing from pagination on "+path);
   assert(html.includes("Page "+number+" of "+count),"Incorrect page count on "+path);
 }
 assert(homeHtml.includes('href="/news/category/'+slug+'/"'),"Homepage category path wrong "+slug);
}
assert(read("assets/site.js").includes('getElementById("category-all-link")'),"Archive filter lacks all-topic link");


// Regression test: the ticker must not be treated as archive-card content.
// Simulate archive interactions without a browser or external services.
function archiveInteractionHarness(){
 const categories=["All","Anime","Manga","Manhwa","Web Novels"];
 const buttons=categories.map(category=>({
   dataset:{category},attrs:{},handlers:{},setAttribute(k,value){this.attrs[k]=value},
   addEventListener(k,fn){this.handlers[k]=fn},
   click(){this.handlers.click?.()}
 }));
 const cards=[
   {dataset:{newsCategory:"Anime"},textContent:"Hirayasumi Netflix release",hidden:false},
   {dataset:{newsCategory:"Manga"},textContent:"One Piece volume 113",hidden:false},
   {dataset:{newsCategory:"Manga"},textContent:"Pokémon Adventures",hidden:false},
   {dataset:{newsCategory:"Manhwa"},textContent:"Omniscient Reader",hidden:false},
   {dataset:{newsCategory:"Web Novels"},textContent:"Royal Road Writathon",hidden:false}
 ];
 const tickerLinks=[{dataset:{newsCategory:"Anime"},textContent:"Ticker anime",hidden:false},{dataset:{newsCategory:"Manga"},textContent:"Ticker manga",hidden:false}];
 const status={textContent:""},empty={hidden:true},fullCategory={hidden:true,href:"",textContent:""};
 const search={value:"",handlers:{},addEventListener(k,fn){this.handlers[k]=fn},input(v){this.value=v;this.handlers.input?.()}};
 const tickerState={paused:false,classList:{toggle(){tickerState.paused=!tickerState.paused;return tickerState.paused}}};
 const tickerButton={attrs:{},textContent:"Pause",handlers:{},closest:()=>tickerState,setAttribute(k,v){this.attrs[k]=v},addEventListener(k,fn){this.handlers[k]=fn},click(){this.handlers.click?.()}};
 const document={
   getElementById(id){return({"filter-status":status,"no-results":empty,"category-all-link":fullCategory})[id]??null},
   querySelector(sel){return({"[data-news-search]":search,"[data-ticker-toggle]":tickerButton})[sel]??null},
   querySelectorAll(sel){return({
      "[data-category]":buttons,
      ".archive-grid .news-card[data-news-category]":cards,
      "[data-news-category]":[...cards,...tickerLinks]
   })[sel]??[]},
   addEventListener(){}
 };
 const location={search:"?category=Manga",href:"https://usaanimeclub.com/news/?category=Manga"};
 const history={replaceState(_s,_t,next){location.href=String(next);location.search=new URL(location.href).search}};
 runInNewContext(runtime,{document,location,history,window:{setInterval(){}},URL,URLSearchParams,Intl,Date});
 assert.equal(status.textContent,"2 stories shown on this page","Archive should count only archive cards");
 assert.equal(cards.filter(x=>!x.hidden).length,2,"Manga filter should show two cards");
 assert(tickerLinks.every(x=>!x.hidden),"Archive filter must not hide the ticker");
 assert.equal(fullCategory.href,"/news/category/manga/","Manga archive link incorrect");
 buttons.find(x=>x.dataset.category==="Anime").click();
 assert.equal(cards.filter(x=>!x.hidden).length,1,"Anime filter should show one card");
 assert.equal(fullCategory.href,"/news/category/anime/","Anime archive link incorrect");
 search.input("irrelevant match");
 assert.equal(status.textContent,"0 stories shown on this page","Archive search should update count");
 assert.equal(empty.hidden,false,"Archive empty state should show");
 assert(tickerLinks.every(x=>!x.hidden),"Search must not hide ticker links");
 buttons.find(x=>x.dataset.category==="All").click();
 search.input("");
 assert.equal(status.textContent,"5 stories shown on this page","Show-all filtering should restore all cards");
 assert.equal(fullCategory.hidden,true,"Full category link should hide when browsing all");
 tickerButton.click();
 assert.equal(tickerState.paused,true,"Ticker pause button did not stop animation");
 assert.equal(tickerButton.attrs["aria-pressed"],"true","Ticker pause state inaccessible");
 tickerButton.click();
 assert.equal(tickerState.paused,false,"Ticker resume button did not restart animation");
}
archiveInteractionHarness();
// Check all internal TOC anchors and duplicate element IDs for every canonical page.
for(const u of urls){
 const html=read(localPath(u));
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(new Set(ids).size,ids.length,"Duplicate element IDs on "+u);
 for(const href of [...html.matchAll(/\bhref="#([^"]+)"/g)].map(x=>x[1])){
   assert(ids.includes(href),"Broken in-page anchor #"+href+" on "+u);
 }
 assert(html.includes('data-ticker-toggle'),"Ticker pause control missing on "+u);
}
assert(read("assets/styles.css").includes(".news-ticker.is-paused .news-ticker-track"),"Pause-state CSS missing");


// Social cards use rasterized editions of the same original editorial artwork.
// SVG-only OG cards are unsupported by several social preview crawlers.
function checkPng(path,width,height){
 const data=readFileSync(resolve(root,path));
 assert(data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),"Invalid PNG signature "+path);
 assert.equal(data.readUInt32BE(16),width,"PNG width mismatch "+path);
 assert.equal(data.readUInt32BE(20),height,"PNG height mismatch "+path);
}
checkPng("assets/logo.png",256,256);
for(const a of articles){
 const image="/assets/news/"+a.slug+".png",canonical=base+image;
 checkPng("assets/news/"+a.slug+".png",1200,675);
 const html=read("news/"+a.slug+"/index.html");
 assert(html.includes('property="og:image" content="'+canonical+'"'),"Social OG image incorrect "+a.slug);
 assert(html.includes('name="twitter:image" content="'+canonical+'"'),"Social share image incorrect "+a.slug);
 const scripts=[...html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g)].map(x=>JSON.parse(x[1]));
 assert(scripts.some(x=>x["@type"]==="NewsArticle"&&x.image?.includes(canonical)),"Schema image not raster "+a.slug);
}
const firstArticle=articles.find(a=>read("index.html").includes('class="feature-card" data-news-category="'+a.category+'" href="/news/'+a.slug+'/'));
assert(firstArticle,"Cannot identify homepage feature article");
assert(read("index.html").includes('content="'+base+'/assets/news/'+firstArticle.slug+'.png"'),"Homepage OG social preview not raster");
for(const name of readdirSync(resolve(root,"assets/news"))){
 if(name.endsWith(".png"))assert(sourceSlugs.has(name.slice(0,-4)),"Orphaned PNG art "+name);
}


// A deterministic marker makes live deployment verifiable independent of cache.
// This is intentionally public, but source JSON and build scripts must not be served.
const info=JSON.parse(read("build-info.json"));
assert.equal(info.canonicalHost,base,"Build-info canonical host incorrect");
assert.equal(info.articleCount,articles.length,"Build-info article count wrong");
assert(/^[0-9a-f]{16}$/.test(info.buildId),"Invalid deterministic build identifier");
assert.equal(info.latestArticle,mostRecent.slug,"Build-info latest story out of sync");
for(const u of urls){
 assert(read(localPath(u)).includes('<meta name="site-build" content="'+info.buildId+'">'),"Deployment marker inconsistent on "+u);
}
const htaccess=read(".htaccess");
assert(htaccess.includes("RewriteRule ^(?:scripts|content|"),"Source directories accessible through hosting");
assert(htaccess.includes("build-info.json"),"Build marker cache policy missing");
for(const pageUrl of urls){
 const pageHtml=read(localPath(pageUrl));
 for(const [asset,attr] of [["styles.css","href"],["site.js","src"],["privacy.js","src"]]){
  assert(pageHtml.includes(attr+'="/assets/'+asset+'?v='+info.buildId+'"'),"Outdated cache revision for "+asset+" on "+pageUrl);
 }
}
assert(read("contact/index.html").includes('>Email USA Anime Club</a>'),"Contact CTA missing");
assert(read("corrections/index.html").includes('>Request a correction</a>'),"Corrections CTA missing");
assert(read("assets/styles.css").includes(".prose a.btn,.prose a.btn:visited,.prose a.btn:hover,.prose a.btn:focus-visible{color:#fff;text-decoration:none}"),"Prose call-to-action contrast regression");
assert(read("assets/styles.css").includes(".prose a.btn.alt,.prose a.btn.alt:visited{color:var(--text)}"),"Outlined prose button contrast regression");
assert(htaccess.includes('Header set CDN-Cache-Control "no-store"'),"No CDN anti-staleness header");
const htmlCachePolicy=htaccess.slice(htaccess.indexOf("<FilesMatch"),htaccess.indexOf("</FilesMatch>"));
assert(htmlCachePolicy.includes('Header set Cache-Control "no-store, max-age=0, must-revalidate"'),"HTML pages must not retain outdated versions");
assert(htmlCachePolicy.includes('Header set CDN-Cache-Control "no-store"'),"HTML must disable CDN caching where supported");
assert(htaccess.includes('RewriteRule ^press/?$ /contact/ [R=301,L]'),"Retired press URL must redirect to contact");



// Pagination routes left over after deleting articles would be indexable orphan
// pages. Check they all appear in the current generated sitemap.
const expectedPublishedPages=new Set(urls.map(localPath));
function checkLiveCollectionPageTree(dir){
 if(!existsSync(dir))return;
 for(const entry of readdirSync(dir,{withFileTypes:true})){
   const target=resolve(dir,entry.name);
   if(entry.isDirectory())checkLiveCollectionPageTree(target);
   else if(entry.isFile()&&entry.name==="index.html"){
     const rel=target.slice(root.length+1).replaceAll("\\","/");
     assert(expectedPublishedPages.has(rel),"Obsolete collection page remains "+rel);
   }
 }
}
for(const relativeDir of ["news/page","news/category"])checkLiveCollectionPageTree(resolve(root,relativeDir));


// Exercise the pagination component beyond today's small categories.
assert.equal(ARTICLES_PER_PAGE,12,"Category card limit changed");
for(const total of [0,1,3,12,13,24,25,100]){
 const sample=Array.from({length:total},(_,i)=>"story-"+i);
 const count=getPageCount(total);
 assert.equal(count,Math.max(1,Math.ceil(total/12)));
 let collected=[];
 for(let p=1;p<=count;p++){
   const items=getPageItems(sample,p);
   assert(items.length<=12,"More than 12 cards on page "+p);
   collected.push(...items);
   const html=paginationHtml({basePath:"/news/category/anime/",page:p,total,label:"Anime news"});
   assert(html.includes('aria-current="page"'),"No selected page in paginator");
   assert(html.includes("Page "+p+" of "+count),"Page indicator missing");
   if(p>1)assert(html.includes('rel="prev"'),"Previous page link absent");
   if(p<count)assert(html.includes('rel="next"'),"Next page link absent");
   if(p===1)assert(html.includes('href="/news/category/anime/" aria-label="Anime news page 1"'),"First-page canonical link wrong");
   if(p===2)assert(html.includes('href="/news/category/anime/page/2/" aria-label="Anime news page 2"'),"Second-page URL wrong");
 }
 assert.deepEqual(collected,sample,"Paginated content omitted or repeated stories");
}
assert.throws(()=>getPageItems([1,2,3],2),RangeError,"Out-of-range pagination should fail");
assert(paginationHtml({basePath:"/news/",page:1,total:25,label:"All news"}).includes('href="/news/page/2/"'),"Main archive page links incorrect");
const mainArchive=read("news/index.html");
assert(mainArchive.includes('class="news-pagination"'),"Main news archive pagination missing");
assert((mainArchive.match(/class="news-card"/g)||[]).length<=12,"Main news archive exceeds 12 cards");
assert(read("assets/styles.css").includes(".pagination-number[aria-current="),"Current pagination styling missing");


// Publishing order for same-day articles uses an explicit increasing sequence.
// It is not incorrectly based on the date of the original external announcement.
const sequenced=articles.filter(a=>a.publishSequence!==undefined);
assert(sequenced.every(a=>Number.isSafeInteger(a.publishSequence)&&a.publishSequence>0),"Invalid publishing sequence");
unique(sequenced.map(a=>a.publishSequence),"publishing sequences");
const orderedPublished=[...articles].sort((a,b)=>b.date.localeCompare(a.date)||(b.publishSequence||0)-(a.publishSequence||0)||b.sourceDate.localeCompare(a.sourceDate)||a.title.localeCompare(b.title));
const homeFeatured=read("index.html").match(/class="feature-card"[^>]*href="(\/news\/[^"]+\/)"/)?.[1];
assert(homeFeatured==="/news/"+orderedPublished[0].slug+"/","Hero did not select newest published article");
const archiveCards=[...read("news/index.html").matchAll(/class="news-card" href="(\/news\/[^"]+\/)"/g)].map(x=>x[1]);
assert.deepEqual(archiveCards,orderedPublished.slice(0,12).map(a=>"/news/"+a.slug+"/"),"Newest articles must precede older reports in first archive page");

console.log("PASS: "+urls.length+" pages; "+testedLinks+" internal references; "+schemas+" structured-data blocks; "+articles.length+" news items; privacy consent simulations; SEO uniqueness; sitemap freshness.");
