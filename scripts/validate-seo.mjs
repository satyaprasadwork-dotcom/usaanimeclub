import fs from "node:fs";
import path from "node:path";
const read=p=>fs.readFileSync(path.join(process.cwd(),p),"utf8");
const catalog=JSON.parse(read("content/catalog.json")).filter(x=>x.status!=="draft");
const failures=[],base="https://usaanimeclub.com";
const assert=(v,m)=>{if(!v)failures.push(m)};
let articles=0,tools=0;
const descriptions=new Set(),titles=new Set(),metaKeywords=new Set();
for(const page of catalog){
 const file=page.path==="/"
  ?"index.html":path.posix.join(page.path.slice(1),"index.html");
 const html=read(file),head=html.split("</head>")[0]||"";
 const count=s=>html.split(s).length-1;
 const canonical=base+page.path;
 const graphMatch=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
 let graph=[];
 if(graphMatch.length===1){try{graph=JSON.parse(graphMatch[0][1])["@graph"]||[];}catch{failures.push(page.path+": invalid JSON-LD")}}
 const find=t=>graph.find(x=>x["@type"]===t);
 const webPage=find("WebPage")||find("CollectionPage");
 const title=head.match(/<title>([^<]+)<\/title>/)?.[1]||"";
 assert(count('<h1')===1,page.path+": needs one visible H1");
 assert(count('rel="canonical"')===1&&html.includes('rel="canonical" href="'+canonical+'"'),page.path+": canonical mismatch/duplicate");
 assert(count('name="description"')===1&&title.length>12,page.path+": missing useful title/description");
 const desc=head.match(/<meta name="description" content="([^"]*)"/)?.[1]||"";
 const keys=head.match(/<meta name="keywords" content="([^"]*)"/)?.[1]||"";
 assert(desc.length>=70&&desc.length<=185,page.path+": meta description should be descriptive and readable");
 assert(keys.length>=20&&keys.split(",").length<=8,page.path+": missing concise on-topic meta keywords");
 assert(count('name="keywords"')===1,page.path+": duplicate or missing keywords");
 assert(!descriptions.has(desc),page.path+": duplicate description");descriptions.add(desc);
 assert(!titles.has(title),page.path+": duplicate title");titles.add(title);
 assert(head.includes('name="twitter:title"')&&head.includes('name="twitter:description"'),page.path+": social text metadata missing");
 assert(head.includes('hreflang="en-US" href="'+canonical+'"'),page.path+": US locale URL missing");
 assert(head.includes('name="uac-build-id"'),page.path+": deployment fingerprint not published");
 assert(html.includes('https://www.google.com/preferences/source?q=usaanimeclub.com'),page.path+": Preferred Sources action missing");

 assert(title.includes((page.seoTitle||page.title).replaceAll("&","&amp;")),page.path+": search title mismatch");
 assert(count('property="og:image"')===1&&count('name="twitter:image"')===1,page.path+": social image missing/duplicated");
 assert(count('property="og:url"')===1&&html.includes('property="og:url" content="'+canonical+'"'),page.path+": Open Graph URL mismatch");
 assert(graphMatch.length===1,page.path+": expected exactly one structured data graph");
 assert(!!find("WebSite")&&!!find("Organization")&&!!webPage,page.path+": core structured entities missing");
 assert(webPage?.url===canonical,page.path+": schema WebPage URL mismatch");
 assert(!graph.some(x=>["FAQPage","HowTo"].includes(x["@type"])),page.path+": misleading/ineligible FAQ or HowTo markup");
 assert(!html.includes('name="robots" content="noindex'),page.path+": public page noindexed");
 if(page.kind==="article"){
  assert(html.includes('class="container preferred-source-inline"'),page.path+": article preferred source link is not near content");

  articles++;
  const post=find("BlogPosting"),crumb=find("BreadcrumbList");
  const summary=html.match(/<section class="guide-summary" aria-labelledby="quick-answer"><h2 id="quick-answer">([^<]+)<\/h2><p>([\s\S]*?)<\/p><\/section>/);
  assert(!!summary,page.path+": missing visible answer-first paragraph");
  assert(count('id="quick-answer"')===1&&html.includes('href="#quick-answer"'),page.path+": quick-answer anchor problem");
  assert(!!post&&post.headline===page.title,page.path+": BlogPosting headline missing or ungrounded");
  assert(post?.datePublished===page.published&&post?.dateModified===(page.modified||page.published),page.path+": schema dates mismatch");
  assert(html.includes('<time datetime="'+page.published+'">'),page.path+": publication date not visible");
  if(page.modified&&page.modified!==page.published)assert(html.includes('<time datetime="'+page.modified+'">'),page.path+": modification date not visible");
  assert(post?.author?.url===base+"/about/"&&post?.author?.name==="USA Anime Club editorial project",page.path+": author markup not grounded to visible byline");
  assert((post?.abstract||"").length>45,page.path+": answer summary absent from schema");
  assert(Array.isArray(post?.citation)&&post.citation.length>=1,page.path+": lacks identifiable on-page source citations");
  for(const cite of post?.citation||[])assert(html.includes('href="'+cite+'"'),page.path+": schema claims an invisible citation "+cite);
  assert(crumb?.itemListElement?.length===3,page.path+": article breadcrumb missing");
  assert(!post?.review&&!post?.aggregateRating,page.path+": unearned user ratings or review");
  assert(title.length<=83,page.path+": unusually long title needs review");
 }
 if(page.path==="/guides/"||page.path==="/tools/"){
  const items=find("ItemList");
  assert(webPage?.["@type"]==="CollectionPage",page.path+": should identify a collection");
  assert(items?.itemListElement?.length===catalog.filter(x=>x.path.startsWith(page.path)&&x.path!==page.path&&(page.path==="/tools/"||x.kind==="article")).length,page.path+": collection entries mismatch");
  for(const link of items?.itemListElement||[])assert(html.includes('href="'+link.url.replace(base,"")+'"'),page.path+": JSON-LD lists a guide/tool not linked visibly");
 }
 if(page.path==="/guides/"){
  assert(count('class="note-panel topic-journey"')===4,page.path+": four reader clusters missing");
  assert(html.includes('id="reader-paths"'),page.path+": topic journey section heading missing");
 }
 if(page.path.startsWith("/tools/")&&page.path!=="/tools/"){
  tools++;
  const app=find("WebApplication");
  assert(app?.url===canonical&&app?.isAccessibleForFree===true,page.path+": web app metadata mismatch");
  assert(app?.offers?.price===0,page.path+": tools should be marked as free");
  assert(!app?.aggregateRating&&!app?.review,page.path+": cannot claim unverified ratings");
  assert(find("BreadcrumbList")?.itemListElement?.length===3,page.path+": missing tool breadcrumbs");
 }
}
const missing=read("404.html");
assert(missing.includes('name="robots" content="noindex,follow"'),"404 page should be noindex");
assert(!missing.includes('rel="canonical"'),"404 must not claim a canonical URL");
assert(articles===15,"Expected 15 verified guide structures, got "+articles);
assert(tools===23,"Expected 23 functional reader tools, got "+tools);
if(failures.length){console.error(failures.join("\n"));process.exitCode=1}
else console.log("SEO/AEO/GEO checks passed: "+catalog.length+" canonical pages, "+articles+" visible answers, dated and sourced articles, four topic journeys and "+tools+" honest tools.");
