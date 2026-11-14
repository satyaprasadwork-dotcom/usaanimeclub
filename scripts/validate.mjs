import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
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
const featured=homepage.match(/<a class="feature-card" href="([^"]+)"/);
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
const cardMarkup=allHtml.filter(html=>html.includes("news-card"));
assert(cardMarkup.length>=2,"news card template not applied");
for(const html of cardMarkup){
  assert(html.includes('class="card-media"'),"card media must be enclosed");
  assert(html.includes('class="card-meta"'),"card category/date missing");
  assert(html.includes('class="card-footer"'),"card footer missing");
}
assert(read("index.html").includes('class="feature-media"'),"lead story media grouping missing");
assert(read("index.html").includes('class="rail-read"'),"latest rail article labels missing");
const designCss=read("assets/styles.css");
assert(designCss.includes("border:1px solid #cfdbe7"),"story cards lack visible enclosing borders");
assert(designCss.includes("--head:\"Literata\""),"editorial headline typeface missing");
assert(!read("index.html").includes('class="topic-icon"'),"decorative topic icons should be removed");

console.log("PASS: "+urls.length+" pages; "+testedLinks+" internal references; "+schemas+" structured-data blocks; "+articles.length+" news items; privacy consent simulations; SEO uniqueness; sitemap freshness.");
