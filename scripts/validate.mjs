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
 const publicEmails=[...new Set([...html.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)].map(m=>m[0].toLowerCase()))];
 if(publicEmails.length!==1||publicEmails[0]!=="satyaprasadwork@gmail.com")errors.push(rel+": only official email may appear, found "+publicEmails.join(", "));
 if(!html.includes('mailto:satyaprasadwork@gmail.com'))errors.push(rel+": footer must link the official email");

 const canonical="https://usaanimeclub.com"+page.path;
 if(!html.includes('rel="canonical" href="'+canonical+'"'))errors.push(rel+": canonical mismatch");
 if(!html.includes('name="description"'))errors.push(rel+": description absent");
 if(!html.includes('name="google-adsense-account"'))errors.push(rel+": publisher verification missing");
 if(html.includes("pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"))errors.push(rel+": advertising loader active before CMP");
 if(!html.includes('src="/assets/site.js"'))errors.push(rel+": site script absent");
 if(!html.includes('src="/assets/tools.js"'))errors.push(rel+": tool script absent");
 if(!html.includes('id="privacy-reopen"'))errors.push(rel+": cannot change privacy choice");
 for(const m of html.matchAll(/(?:href|src)="(\/[^"#?]*)/g)){if(!localExists(m[1]))errors.push(rel+": broken local link "+m[1]);}
 const matches=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
 if(matches.length!==1)errors.push(rel+": requires exactly one JSON-LD block");
 else{try{const graph=JSON.parse(matches[0][1])["@graph"]||[];if(page.kind==="article"&&!graph.some(x=>x["@type"]==="BlogPosting"))errors.push(rel+": missing BlogPosting");}catch{errors.push(rel+": invalid structured data");}}
 if(page.kind==="article"){
  const body=html.split('<article class="prose">')[1]?.split("</article>")[0]||"";
  if(body.replace(/<[^>]+>/g," ").trim().split(/\s+/).length<1000)errors.push(rel+": short guide");
  if(!body.includes('id="sources"'))errors.push(rel+": source section absent");
  if(!body.includes('id="apply-guide"'))errors.push(rel+": missing topic-specific practical section");
  if(body.includes("Choose a practical approach, verify details with current sources")||body.includes("Start by verifying the current information at its source"))errors.push(rel+": repeated generic introduction remains");
  if(!fs.existsSync(path.join(root,"assets","covers",page.cover+".svg")))errors.push(rel+": missing topic illustration");
 }
}
const xml=read("sitemap.xml"),listed=[...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map(m=>m[1]);
if(listed.length!==pages.length)errors.push("Sitemap does not match published page count");
for(const p of pages)if(!listed.includes("https://usaanimeclub.com"+p.path))errors.push("Sitemap missing "+p.path);
if(!read("templates/layout.html").includes("{{MAIN}}"))errors.push("Template has no body slot");
if(!read("robots.txt").includes("Sitemap: https://usaanimeclub.com/sitemap.xml"))errors.push("robots.txt sitemap directive missing");

const tracking=read("assets/tracking.js"),shared=read("templates/layout.html");
for(const toolPath of ["/tools/","/tools/convention-budget/","/tools/manga-value-lab/","/tools/anime-starter-planner/","/tools/anime-release-time-converter/","/tools/cosplay-build-countdown/","/tools/anime-watch-party-scheduler/","/tools/convention-day-planner/","/tools/convention-packing-checklist/","/tools/spoiler-safe-episode-tracker/","/tools/anime-recommendation-matchmaker/","/tools/anime-club-starter-kit/","/tools/cosplay-merch-buying-checklist/","/tools/us-anime-convention-finder/","/tools/us-manga-release-calendar/","/tools/anime-movie-release-tracker/","/tools/english-dub-sub-calendar/","/tools/where-to-watch-anime-us/","/tools/manga-isbn-edition-explorer/","/tools/convention-rules-explorer/","/tools/local-anime-club-finder/","/tools/library-manga-finder/","/tools/watch-party-rights-accessibility-helper/","/tools/press-release-submission-checker/"])if(!urls.has(toolPath))errors.push("Missing expected tool page "+toolPath);
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
 if(count('src="/assets/tracking.js?v=')!==1)errors.push(relative+": expected exactly one central tracking module");
 if(count('src="/assets/site.js"')!==1)errors.push(relative+": expected exactly one site module");
 if(count('name="google-adsense-account"')!==1)errors.push(relative+": expected exactly one AdSense meta tag");
 if(markup.includes("www.googletagmanager.com/gtag/js")||markup.includes("www.clarity.ms/tag/"))errors.push(relative+": duplicate hard-coded measurement loader");
}

for(const slug of ["anime-release-time-converter","cosplay-build-countdown","anime-watch-party-scheduler","convention-day-planner","convention-packing-checklist","spoiler-safe-episode-tracker","anime-recommendation-matchmaker","anime-club-starter-kit","cosplay-merch-buying-checklist","us-anime-convention-finder","us-manga-release-calendar","anime-movie-release-tracker","english-dub-sub-calendar","where-to-watch-anime-us","manga-isbn-edition-explorer","convention-rules-explorer","local-anime-club-finder","library-manga-finder","watch-party-rights-accessibility-helper","press-release-submission-checker"]) {
 const html=read("tools/"+slug+"/index.html");
 if(!html.includes('data-tool="'+slug+'"')||!html.includes('src="/assets/tool-suite.js"'))errors.push(slug+": missing interactive tool engine");
 if(!html.includes("data-tool-result")||!html.includes("aria-live="))errors.push(slug+": missing accessible results");
}
const review=JSON.parse(read("content/review-register.json"));
for(const item of pages.filter(p=>p.kind==="article")){
 const record=review.guides.find(x=>x.path===item.path);
 if(!record)errors.push(item.path+": missing editorial claim-review register entry");
 if(item.status==="published"&&(!record||record.status!=="reviewed"||!record.reviewer||!record.reviewedAt))
  errors.push(item.path+": explicitly published new article must first receive verified human review");
}
const errorPage=read("404.html");
const missingEmails=[...new Set([...errorPage.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)].map(m=>m[0].toLowerCase()))];
if(missingEmails.length!==1||missingEmails[0]!=="satyaprasadwork@gmail.com")errors.push("404 must show only the official email");

if(!errorPage.includes('name="robots" content="noindex,follow"'))errors.push("404 must have noindex");
if(errorPage.includes('rel="canonical"'))errors.push("404 should not have a canonical URL");
const headerOf=html=>{
 const begin=html.indexOf('<header class="site-head" role="banner">');
 const end=html.indexOf('<!-- /site-head -->',begin);
 return begin<0||end<0?null:html.slice(begin,end+'<!-- /site-head -->'.length);
};
const head=headerOf(read("index.html"));
const errorHead=headerOf(errorPage);
if(!head||head!==errorHead)errors.push("404 header must match homepage header");
for(const page of pages){
 const rel=page.path==="/"? "index.html":page.path.slice(1)+"index.html";
 const html=read(rel);
 if(headerOf(html)!==head)errors.push(rel+": shared header differs from homepage");
 if((html.match(/<header class="site-head" role="banner">/g)||[]).length!==1)errors.push(rel+": duplicate or missing shared header");
 if((html.match(/data-home-search><form/g)||[]).length!==1)errors.push(rel+": global search dialog missing or duplicated");
 if((html.match(/data-home-search-open/g)||[]).length!==1)errors.push(rel+": global search opener missing or duplicated");
 if(!html.includes('src="/assets/home-motion.js?v='))errors.push(rel+": shared search/mobile script not fingerprinted");
}
if(!errorPage.includes('src="/assets/home-motion.js?v=')||!errorPage.includes('class="uac-home-search"'))errors.push("404 must have consistent global header search");
for(const marker of ['src="/assets/tracking.js?v=','src="/assets/site.js"','src="/assets/tools.js"','name="google-adsense-account"','id="privacy-reopen"'])
 if(!errorPage.includes(marker))errors.push("404 missing "+marker);

if(errors.length){console.error(errors.join("\n"));process.exitCode=1;}else console.log("Validated "+pages.length+" pages, "+pages.filter(p=>p.kind==="article").length+" articles, navigation, metadata and sitemap.");
