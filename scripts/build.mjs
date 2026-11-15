import {readFileSync,writeFileSync,mkdirSync,existsSync,readdirSync,rmSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {Resvg} from "@resvg/resvg-js";
import {createHash} from "node:crypto";
import {ARTICLES_PER_PAGE,getPageCount,getPageItems,paginationHtml} from "./pagination.mjs";
import {editorialCover} from "./editorial-art.mjs";
import {buildReviewExperience} from "./review-experience.mjs";
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),"..");
function buildSite(articles){
  const BASE="https://usaanimeclub.com",EMAIL="satyaprasadwork@gmail.com",BRAND="USA Anime Club",TODAY=new Date().toISOString().slice(0,10),SITE_START="2026-11-14",files={};
  if(!Array.isArray(articles)||articles.length===0)throw Error("A news site needs at least one publishable article");
  const reviewSeries=JSON.parse(readFileSync(resolve(ROOT,"content/review-series.json"),"utf8"));
  const publishedReviews=JSON.parse(readFileSync(resolve(ROOT,"content/reviews.json"),"utf8"));
  // Deterministic build ID: changes whenever generator, content, CSS or runtime changes.
  // No changing timestamps/commit SHA are embedded, so CI regeneration stays stable.
  const buildId=createHash("sha256")
    .update(readFileSync(fileURLToPath(import.meta.url)))
    .update(readFileSync(resolve(ROOT,"assets/styles.css")))
    .update(readFileSync(resolve(ROOT,"scripts/editorial-art.mjs")))
    .update(readFileSync(resolve(ROOT,"assets/site.js")))
    .update(readFileSync(resolve(ROOT,"assets/privacy.js")))
    .update(readFileSync(resolve(ROOT,"content/site-pages.json")))
    .update(readFileSync(resolve(ROOT,"content/review-series.json")))
    .update(readFileSync(resolve(ROOT,"content/reviews.json")))
    .update(readFileSync(resolve(ROOT,"scripts/review-experience.mjs")))
    .update(readFileSync(resolve(ROOT,"scripts/pagination.mjs")))
    .update(JSON.stringify(articles))
    .digest("hex").slice(0,16);
  const seenSlugs=new Set();
  for(const a of articles){
    if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(a.slug)||seenSlugs.has(a.slug))throw Error("Duplicate or invalid article slug: "+a.slug);
    seenSlugs.add(a.slug);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(a.date)||Number.isNaN(Date.parse(a.date+"T12:00:00Z")))throw Error("Invalid publish date: "+a.slug);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(a.sourceDate)||Number.isNaN(Date.parse(a.sourceDate+"T12:00:00Z")))throw Error("Missing or invalid sourceDate: "+a.slug);
    if(a.sourceDate>a.date)throw Error("Original source announcement cannot postdate site article: "+a.slug);
    if(a.date>TODAY)throw Error("Future publication date: "+a.slug);
    if(a.publishSequence!==undefined&&(!Number.isSafeInteger(a.publishSequence)||a.publishSequence<1))throw Error("Invalid publication sequence: "+a.slug);
    if(typeof a.title!=="string"||typeof a.description!=="string"||!a.title.trim()||!a.description.trim())throw Error("Missing title or description: "+a.slug);
    if(!a.source?.startsWith("https://")||!Array.isArray(a.sections)||a.sections.length===0)throw Error("Article requires HTTPS source and sections: "+a.slug);
  }
  // Enforce the publication's long-form threshold on the actual article paragraphs.
  // Google/Bing do not mandate a word count; this is an editorial publishing preference.
  const countWords=text=>String(text).trim().split(/\s+/).filter(Boolean).length;
  const articleWordCount=a=>a.sections.reduce((n,[heading,paragraphs])=>n+paragraphs.reduce((m,p)=>m+countWords(p),0),0);
  for(const a of articles){
    if(articleWordCount(a)<1000)throw Error("Article has fewer than 1,000 body words: "+a.slug+" ("+articleWordCount(a)+")");
    const paragraphs=a.sections.flatMap(section=>section[1]);
    if(new Set(paragraphs.map(p=>p.trim())).size!==paragraphs.length)throw Error("Article contains duplicate paragraphs: "+a.slug);
  }
  const items=[...articles].sort((a,b)=>b.date.localeCompare(a.date)||(b.publishSequence||0)-(a.publishSequence||0)||b.sourceDate.localeCompare(a.sourceDate)||a.title.localeCompare(b.title));
  const e=s=>String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const url=a=>"/news/"+a.slug+"/";
  const fmt=d=>new Date(d+"T12:00:00Z").toLocaleDateString("en-US",{timeZone:"UTC",month:"long",day:"numeric",year:"numeric"});
  const fmtUpdate=t=>new Date(t).toLocaleString("en-US",{timeZone:"UTC",month:"long",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit",hour12:true})+" UTC";
  const ld=x=>JSON.stringify(x).replace(/</g,"\\u003c");
  const org={"@type":"Organization","@id":BASE+"/#organization",name:BRAND,url:BASE+"/",email:EMAIL,logo:{"@type":"ImageObject",url:BASE+"/assets/logo.png"}};
  function bc(links){return {"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:links.map(([name,path],i)=>({"@type":"ListItem",position:i+1,name,item:BASE+path}))}}
  function bread(links){return '<nav class="crumbs" aria-label="Breadcrumb">'+links.map(([name,path],i)=>i===links.length-1?`<span aria-current="page">${e(name)}</span>`:`<a href="${path}">${e(name)}</a> <span aria-hidden="true">/</span> `).join("")+"</nav>"}
  function pageLd(path,name,desc,type="WebPage"){return {"@context":"https://schema.org","@type":type,"@id":BASE+path+"#webpage",url:BASE+path,name,description:desc,inLanguage:"en-US",publisher:{"@id":BASE+"/#organization"}}}
  // Every new article appears here automatically on the next site build.
  // The repeated visual set is hidden from assistive technology and tab navigation.
  const tickerLink=(a,duplicate=false)=>'<a class="news-ticker-link" data-news-category="'+e(a.category)+'" href="'+url(a)+'"'+(duplicate?' tabindex="-1"':'')+'><span class="news-ticker-category">'+e(a.category)+'</span><span class="news-ticker-title">'+e(a.title)+'</span></a>';
  const tickerSpeed=Math.max(42,Math.round(items.reduce((sum,a)=>sum+a.title.length,0)*0.17));
  const newsTicker='<nav class="news-ticker" aria-label="Latest anime, manga, manhwa and web novel headlines">'
    +'<div class="news-ticker-inner"><span class="news-ticker-label">LATEST NEWS</span>'
    +'<div class="news-ticker-window"><div class="news-ticker-track" style="--ticker-duration:'+tickerSpeed+'s" aria-live="off">'
    +'<div class="news-ticker-set">'+items.map(a=>tickerLink(a)).join("")+'</div>'
    +'<div class="news-ticker-set" aria-hidden="true">'+items.map(a=>tickerLink(a,true)).join("")+'</div>'
    +'</div></div><button class="news-ticker-toggle" type="button" data-ticker-toggle aria-pressed="false" aria-label="Pause scrolling news headlines">Pause</button></div></nav>';
  function shell({path,title,desc,kw,main,schemas=[],image,article=false,noindex=false}){
    const absolute=BASE+path,ogimage=image?`<meta property="og:image" content="${BASE+image}"><meta property="og:image:type" content="image/png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="675"><meta name="twitter:image" content="${BASE+image}"><meta name="twitter:image:alt" content="${e(title)}">`:"";
    const selected=path.startsWith("/news/category/")?({"anime":"Anime","manga":"Manga","manhwa":"Manhwa","web-novels":"Web Novels"}[path.split("/")[3]]||"News"):path.startsWith("/news/")?"News":path.startsWith("/reviews/")?"Reviews":path.startsWith("/about/")?"About":path.startsWith("/contact/")?"Contact":"Latest";
    const nav=[["Latest","/"],["News","/news/"],["Anime","/news/category/anime/"],["Manga","/news/category/manga/"],["Manhwa","/news/category/manhwa/"],["Web Novels","/news/category/web-novels/"],["Reviews","/reviews/"],["About","/about/"]].map(([n,p])=>`<a href="${p}"${n===selected?' aria-current="page"':""}>${n}</a>`).join("");
    return `<!doctype html>
<html lang="en-US"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${e(title)}</title><meta name="description" content="${e(desc)}"><meta name="keywords" content="${e(kw)}">
<meta name="robots" content="${noindex?"noindex, nofollow":"index, follow, max-image-preview:large"}">
<meta name="author" content="${article?"USA Anime Club Editorial":BRAND}"><meta name="theme-color" content="#ffffff"><meta name="site-build" content="${buildId}"><meta name="google-adsense-account" content="ca-pub-7937216909291905">
<link rel="canonical" href="${absolute}"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="alternate" type="application/rss+xml" title="USA Anime Club news" href="/feed.xml">
<meta property="og:site_name" content="${BRAND}"><meta property="og:type" content="${article?"article":"website"}"><meta property="og:locale" content="en_US">
<meta property="og:url" content="${absolute}"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(desc)}">
<meta name="twitter:card" content="${image?"summary_large_image":"summary"}"><meta name="twitter:title" content="${e(title)}"><meta name="twitter:description" content="${e(desc)}">${ogimage}
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap">
<link rel="stylesheet" href="/assets/styles.css?v=${buildId}">
<script>
window.dataLayer=window.dataLayer||[];
window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};
window.gtag("consent","default",{analytics_storage:"denied",ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied"});
</script>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7937216909291905" crossorigin="anonymous"></script>
${schemas.map(s=>`<script type="application/ld+json">${ld(s)}</script>`).join("\n")}
</head><body>
<a class="skip" href="#main">Skip to content</a>
<header class="top">
<div class="edition-bar"><div class="wrap edition-inner"><div class="edition-left"><span>THE ANIME NEWS DESK</span></div><div class="edition-right"><time id="local-clock" aria-label="Your current local time">--:--</time></div></div></div>
<div class="wrap bar"><a class="logo" href="/" aria-label="USA Anime Club homepage"><i aria-hidden="true">桜</i><span class="logo-title">USA <strong>ANIME</strong> CLUB<span class="logo-caption">ANIME NEWS &amp; CULTURE</span></span></a>
<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="main-nav" data-menu-toggle>☰ Menu</button>
<nav class="nav" aria-label="Primary navigation" id="main-nav" data-nav>${nav}</nav></div></header>
${newsTicker}
<main id="main">${main}</main>
<footer class="foot"><div class="wrap foot-grid">
<div><a href="/" class="logo"><i aria-hidden="true">桜</i> USA Anime Club</a>
<p style="margin-top:1rem">Independent news for US fans of anime, manga, manhwa and online-serialized fiction. Original reports with primary sources.</p>
<p><a href="mailto:${EMAIL}">${EMAIL}</a></p><small>Not affiliated with studios, rights holders or streaming companies.</small></div>
<div><strong>Newsroom &amp; policies</strong><nav aria-label="Footer links"><ul>
<li><a href="/news/">News Archive</a></li><li><a href="/reviews/">Reviews</a></li><li><a href="/about/">About</a></li><li><a href="/contact/">Contact</a></li>
<li><a href="/editorial-policy/">Editorial Policy</a></li><li><a href="/corrections/">Corrections</a></li><li><a href="/privacy/">Privacy Policy</a></li>
<li><a href="/disclaimer/">Disclaimer</a></li><li><a href="/terms/">Terms &amp; Conditions</a></li></ul></nav>
<div class="google-source-footer"><span>Follow our reporting on Google</span><a class="preferred-google-link" href="https://www.google.com/preferences/source?q=usaanimeclub.com" target="_blank" rel="noopener noreferrer">Add as a preferred source on Google</a></div><button type="button" data-privacy-choices>Privacy choices</button><p class="meta" style="margin-top:1.5rem">© ${new Date().getUTCFullYear()} USA Anime Club</p></div></div></footer>
<div class="privacy-banner" id="privacy-banner" role="region" aria-label="Optional analytics choices" hidden>
<strong>Your privacy choices</strong>
<p>Optional Google Analytics and Microsoft Clarity load only with your analytics permission. Advertising consent is handled separately where required. <a href="/privacy/">Privacy details</a>.</p>
<div class="btns"><button type="button" class="btn alt" data-consent-decline>Decline analytics</button><button type="button" class="btn" data-consent-accept>Accept analytics</button></div></div>
<script src="/assets/site.js?v=${buildId}" defer></script><script src="/assets/privacy.js?v=${buildId}" defer></script></body></html>\n`;
  }
  function card(a){
    return `<a class="news-card" href="${url(a)}" data-news-category="${e(a.category)}">
<div class="card-folio"><span class="card-category">${e(a.category)}</span></div>
<div class="card-media"><img src="/assets/news/${a.slug}.svg" width="1200" height="675" loading="lazy" alt="Original editorial title graphic for ${e(a.title)}"></div>
<div class="tx"><div class="card-meta"><span>Published</span><time datetime="${a.date}">${fmt(a.date)}</time></div>
<h3>${e(a.title)}</h3><p class="card-summary">${e(a.description)}</p>
<div class="card-footer"><span>USA ANIME CLUB</span><span class="card-read">READ STORY</span></div></div></a>`;
  }
  const first=items[0];
  const shortItem=a=>`<a class="latest-item" data-news-category="${e(a.category)}" href="${url(a)}">
<span class="story-kicker">${e(a.category)} <span aria-hidden="true">·</span> <time datetime="${a.date}">${fmt(a.date)}</time></span>
<strong>${e(a.title)}</strong><span class="rail-read">Read article</span></a>`;
  const home=`<section class="front-intro"><div class="wrap">
<div><span class="eyebrow"><span class="red-dot" aria-hidden="true"></span> THE ANIME NEWS DESK</span><h1>Latest anime news<span class="headline-period">.</span></h1>
<p class="lead">Anime, manga, manhwa and web-novel news for US readers: dated announcements, credited sources and clear release information.</p></div>
<a class="text-link" href="/news/">Explore the news archive</a>
</div></section>
<section class="front-lead" id="latest"><div class="wrap lead-grid">
<a class="feature-card" data-news-category="${e(first.category)}" href="${url(first)}"><div class="feature-folio"><span class="card-category">${e(first.category)}</span></div><div class="feature-media"><img src="/assets/news/${first.slug}.svg" width="1200" height="675" alt="USA Anime Club editorial graphic for ${e(first.title)}" fetchpriority="high"></div>
<div class="feature-copy"><span class="story-kicker"><span class="lead-label">LEAD STORY</span> ${e(first.category)} · ${fmt(first.date)}</span>
<h2>${e(first.title)}</h2><p>${e(first.description)}</p><span class="read-story">Read the report</span></div></a>
<aside class="latest-rail" aria-label="More recent anime reports"><div class="rail-title"><div><span class="eyebrow">THE WIRE</span><h2>Latest updates</h2></div><span class="rail-count">${Math.min(3,items.length-1)} STORIES</span></div>
<div class="latest-list">${items.slice(1,4).map(shortItem).join("")}</div>
<a class="rail-footer" href="/news/">See every report</a></aside>
</div></section>
<section class="blk news-section"><div class="wrap"><div class="section-head"><div><span class="eyebrow">THE LATEST / REPORTING</span><h2>More from the desk</h2></div><a class="text-link" href="/news/">All news</a></div>
<div class="grid">${items.slice(1,10).map(card).join("")}</div></div></section>
<section class="topic-section"><div class="wrap"><div class="section-head"><div><span class="eyebrow">FIND YOUR BEAT</span><h2>Follow a story type</h2></div><p class="muted">Filter the news by what matters to you.</p></div>
<div class="topic-grid">
<a href="/news/category/anime/"><span class="topic-eyebrow">COVERAGE</span><strong>Anime</strong><span>Adaptations, broadcasts and streaming news</span><small>${items.filter(a=>a.category==="Anime").length} reports</small></a>
<a href="/news/category/manga/"><span class="topic-eyebrow">COVERAGE</span><strong>Manga</strong><span>English manga releases and licensing</span><small>${items.filter(a=>a.category==="Manga").length} reports</small></a>
<a href="/news/category/manhwa/"><span class="topic-eyebrow">COVERAGE</span><strong>Manhwa</strong><span>Korean comics, webtoons and editions</span><small>${items.filter(a=>a.category==="Manhwa").length} reports</small></a>
<a href="/news/category/web-novels/"><span class="topic-eyebrow">COVERAGE</span><strong>Web Novels</strong><span>Online fiction and serialized translations</span><small>${items.filter(a=>a.category==="Web Novels").length} reports</small></a></div></div></section>
<section class="standards-section"><div class="wrap standards-inner"><div><span class="eyebrow">INDEPENDENT BY DESIGN</span><h2>Source first. <em>Readers first.</em></h2><p>We separate confirmed announcements from unanswered questions, identify whether US availability is confirmed, and link to original sources.</p></div>
<a class="btn alt" href="/editorial-policy/">Our editorial policy</a></div></section>`;
  const homeTitle="USA Anime Club | Anime, Manga, Manhwa & Web Novel News";
  const homeDesc="Source-linked anime, manga, manhwa and web-novel reporting for US readers, with release dates and publisher announcements.";
  files["index.html"]=shell({path:"/",title:homeTitle,desc:homeDesc,kw:"anime news USA, new manga releases, manhwa webtoons, web novels, English releases, official announcements",main:home,image:`/assets/news/${first.slug}.png`,schemas:[
{"@context":"https://schema.org",...org},
{"@context":"https://schema.org","@type":"WebSite","@id":BASE+"/#website",url:BASE+"/",name:BRAND,inLanguage:"en-US",publisher:{"@id":BASE+"/#organization"}},
pageLd("/",homeTitle,homeDesc)]});
  const archiveTotal=getPageCount(items.length);
  for(let p=1;p<=archiveTotal;p++){
    const sub=getPageItems(items,p),path=p===1?"/news/":`/news/page/${p}/`;
    const cats=["All","Anime","Manga","Manhwa","Web Novels"];
    const chips=`<div class="chips" role="group" aria-label="Filter news on this archive page">${cats.map((c,i)=>`<button class="chip" type="button" data-category="${e(c)}" aria-pressed="${i===0}">${e(c)}</button>`).join("")}</div><p class="meta" id="filter-status" role="status" aria-live="polite">${sub.length} stories shown on this page</p>`;
    const pag=paginationHtml({basePath:"/news/",page:p,total:items.length,label:"All news"});
    const title=`Anime News Archive${p===1?"":" — Page "+p} | USA Anime Club`,desc=`Browse anime, manga, manhwa and online-fiction updates for US readers, archive page ${p}.`;
    const main=`<section class="archive-page"><div class="wrap">${bread([["Home","/"],["News Archive",path]])}
<header class="archive-intro"><span class="eyebrow">THE NEWS ARCHIVE / PAGE ${p}</span><h1>All anime news<span class="headline-period">.</span></h1>
<p>Source-linked anime, manga, manhwa and online-fiction reporting, ordered by publication date. Each story identifies a primary source.</p></header>
<div class="archive-toolbar"><div><h2>Browse stories</h2><p>Choose a topic or search the headlines on this page.</p></div>
<div class="archive-search"><label for="news-search">Search this page</label><input type="search" id="news-search" data-news-search placeholder="Search headlines..." autocomplete="off"></div></div>
${chips}<a class="category-all-link" id="category-all-link" href="/news/" hidden>See all stories in this category</a><div class="grid archive-grid">${sub.map(card).join("")}</div><p class="no-results" id="no-results" hidden>No matches on this page. Try another topic or search term.</p>
${pag}</div></section>`;
    files[path.slice(1)+"index.html"]=shell({path,title,desc,kw:`anime manga manhwa web novel news page ${p}, US comics and serial fiction releases`,main,schemas:[pageLd(path,title,desc,"CollectionPage"),bc([["Home","/"],["News Archive",path]])]});
  }
  // Topic landing pages are complete archives, even when content exceeds one page.
  // Article URLs themselves remain unique and canonical.
  const categoryRoutes=[["Anime","anime"],["Manga","manga"],["Manhwa","manhwa"],["Web Novels","web-novels"]];
  const categoryDescriptions={
    Anime:"Source-linked anime adaptation, television and streaming developments for US readers.",
    Manga:"English-language manga volume releases, licensing notices and publisher updates.",
    Manhwa:"Korean comics, webtoon releases, official awards and English editions.",
    "Web Novels":"Serial fiction platforms, translated light novels and online reading updates."
  };
  for(const [category,slug] of categoryRoutes){
    const group=items.filter(a=>a.category===category);
    if(!group.length)continue;
    const pageCount=getPageCount(group.length);
    for(let n=1;n<=pageCount;n++){
      const path=n===1?"/news/category/"+slug+"/":"/news/category/"+slug+"/page/"+n+"/";
      const shown=getPageItems(group,n);
      const name=category+" News"+(n>1?" — Page "+n:"");
      const title=name+" | USA Anime Club";
      const desc=categoryDescriptions[category]+" "+(n>1?"Browse page "+n+" of "+pageCount+".":"Browse "+group.length+" source-linked reports.");
      const choices='<nav class="category-directory" aria-label="Browse all news categories">'
        +'<a href="/news/">All news</a>'
        +categoryRoutes.map(([label,route])=>'<a href="/news/category/'+route+'/"'+(label===category?' aria-current="page"':'')+'>'+e(label)+'</a>').join("")
        +'</nav>';
      const navPages=paginationHtml({basePath:"/news/category/"+slug+"/",page:n,total:group.length,label:category+" news"});
      const main='<section class="archive-page category-archive"><div class="wrap">'
        +bread([["Home","/"],["News Archive","/news/"],[category,path]])
        +'<header class="archive-intro"><span class="eyebrow">BROWSE STORIES / '+e(category.toUpperCase())+'</span>'
        +'<h1>'+e(category)+' news<span class="headline-period">.</span></h1>'
        +'<p>'+e(categoryDescriptions[category])+' '+group.length+' '+(group.length===1?"report":"reports")+' in this category.</p></header>'
        +choices+'<div class="grid archive-grid">'+shown.map(card).join("")+'</div>'
        +navPages+'</div></section>';
      files[path.slice(1)+"index.html"]=shell({path,title,desc,kw:category.toLowerCase()+" news USA, "+slug.replaceAll("-"," ")+" official announcements, USA Anime Club archive"+(n>1?", page "+n:""),main,
        schemas:[pageLd(path,title,desc,"CollectionPage"),bc([["Home","/"],["News Archive","/news/"],[category,path]])]});
    }
  }

  const ignoredTerms=new Set(["the","and","with","from","into","guide","official","english","november","december","2026","2027","edition","release","anime","manga","manhwa","novel","webtoon","season","volume","status","streaming","reader","read","what","how","where","current","usa","vs","us"]);
  const titleTerms=a=>new Set(a.title.toLowerCase().split(/[^a-z0-9]+/).filter(w=>w.length>=4&&!ignoredTerms.has(w)));
  function relatedTo(a){
    const terms=titleTerms(a);
    return items.filter(b=>b.slug!==a.slug).map(b=>({story:b,score:(b.category===a.category?4:0)+[...titleTerms(b)].filter(w=>terms.has(w)).length*20}))
      .sort((x,y)=>y.score-x.score||items.indexOf(x.story)-items.indexOf(y.story)).slice(0,3).map(x=>x.story);
  }
  for(const a of items){
    const relatedStories=relatedTo(a);
    const evidence=(a.references||[]).filter(r=>r.url&&r.label);
    for(const r of evidence){if(!r.url.startsWith("https://")||!/^\d{4}-\d{2}-\d{2}$/.test(r.date))throw Error("Invalid article reference "+a.slug);}
    const path=url(a),pic=`/assets/news/${a.slug}.svg`,title=a.title+" | USA Anime Club";
    const sectionId=h=>"section-"+h.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
    const contents=`<a href="#quick-answer">Quick answer</a>`+a.sections.map(([h])=>`<a href="#${sectionId(h)}">${e(h)}</a>`).join("")+`<a href="#primary-source">Primary source</a>`;
    const content=`<div class="post-layout">${bread([["Home","/"],["News","/news/"],[a.title,path]])}
<article><header class="post-head"><span class="story-kicker">${e(a.category)} <span aria-hidden="true">/</span> US ANIME NEWS</span>
<h1>${e(a.title)}</h1><p class="lead">${e(a.description)}</p>
<div class="article-byline"><span class="byline-badge" aria-hidden="true">桜</span><div><strong><a href="/about/">USA Anime Club Editorial</a></strong>
<p class="editor-credit">Editor-in-Chief: <a href="/about/#editor-in-chief">Satya Prasad</a></p>
<p>Published <time datetime="${a.date}">${fmt(a.date)}</time> <span aria-hidden="true">·</span> Updated <time datetime="${a.modifiedAt||a.modified||a.date}">${a.modifiedAt?fmtUpdate(a.modifiedAt):fmt(a.modified||a.date)}</time></p></div></div></header>
<div class="article-columns"><div class="article-primary">
<img class="post-hero" src="${pic}" width="1200" height="675" alt="Original conceptual illustration for ${e(a.title)}">
<section class="tldr" id="quick-answer" aria-labelledby="quick-answer-heading"><h2 class="tldr-label" id="quick-answer-heading">QUICK ANSWER</h2><p>${e(a.summary)}</p><p class="answer-source">Source record: <time datetime="${a.sourceDate}">${fmt(a.sourceDate)}</time> <span aria-hidden="true">·</span> <cite><a href="${e(a.source)}" target="_blank" rel="noopener noreferrer">Read the original source</a></cite></p></section>
<aside class="reader-guide" aria-label="Reader decision guide"><span class="reader-guide-kicker">WHAT TO CHECK NEXT</span><h2>${e(a.readerGuide.question)}</h2><p>${e(a.readerGuide.action)}</p></aside>
<div class="prose">${a.sections.map(([h,paras])=>`<section aria-labelledby="${sectionId(h)}"><h2 id="${sectionId(h)}">${e(h)}</h2>${paras.map(t=>`<p>${e(t)}</p>`).join("")}</section>`).join("")}</div>
<div class="source-note" id="primary-source"><strong>Primary source and reporting notes</strong>
<p>Based on ${e(a.sourceLabel)}. This report distinguishes confirmed details from information not established by the original source.</p>
<p class="source-link-row"><a class="source-primary-link" href="${e(a.source)}" target="_blank" rel="noopener noreferrer">View primary source</a><span>Source date / checked: <time datetime="${a.sourceDate}">${fmt(a.sourceDate)}</time>${a.checkedOn?` <span class="source-rechecked">· Rechecked <time datetime="${a.checkedOn}">${fmt(a.checkedOn)}</time></span>`:""}</span></p>
${evidence.length?`<div class="supporting-sources"><strong>Additional primary records</strong><ul>${evidence.map(ref=>`<li><a href="${e(ref.url)}" target="_blank" rel="noopener noreferrer">${e(ref.label)}</a> <time datetime="${ref.date}">${fmt(ref.date)}</time></li>`).join("")}</ul></div>`:""}
<p>Found a factual error? <a href="mailto:${EMAIL}?subject=${encodeURIComponent("Correction: "+a.title)}">Contact the editorial desk</a>.</p></div>
</div><aside class="article-sidebar"><div class="sidebar-panel"><span class="eyebrow">IN THIS REPORT</span>
<nav aria-label="Article sections" class="contents-list">${contents}</nav></div>
<div class="sidebar-panel sidebar-note"><strong>Editorial standard</strong><p>Independent summary, source linked, US availability distinguished from other territories.</p><a href="/editorial-policy/">How we verify news</a></div></aside></div></article>
<section class="related-section" aria-labelledby="related-news"><div class="section-head"><div><span class="eyebrow">KEEP READING</span><h2 id="related-news">Related coverage</h2></div><a class="text-link" href="/news/">All reports</a></div>
<div class="grid">${relatedStories.map(card).join("")}</div></section>
<section class="article-preferred-source" aria-label="Google Preferred Sources"><div class="article-preferred-source-copy"><strong>Follow USA Anime Club on Google</strong><p>Choose USA Anime Club as a preferred source for eligible news results.</p></div><a class="preferred-google-link" href="https://www.google.com/preferences/source?q=usaanimeclub.com" target="_blank" rel="noopener noreferrer">Add as a preferred source on Google</a></section></div>`;
    const schema={"@context":"https://schema.org","@type":"NewsArticle","@id":BASE+path+"#article",mainEntityOfPage:{"@type":"WebPage","@id":BASE+path},headline:a.title,description:a.description,abstract:a.summary,image:[BASE+pic.replace(/\.svg$/,".png")],datePublished:a.date+"T12:00:00Z",dateModified:a.modifiedAt||(a.modified||a.date)+"T12:00:00Z",wordCount:articleWordCount(a),citation:[a.source,...evidence.map(ref=>ref.url)],about:{"@type":"Thing",name:a.category},author:{"@type":"Organization",name:"USA Anime Club Editorial",url:BASE+"/about/"},editor:{"@type":"Person",name:"Satya Prasad",url:BASE+"/about/#editor-in-chief"},publisher:org,inLanguage:"en-US",articleSection:a.category,isAccessibleForFree:true,keywords:a.keywords};
    files[path.slice(1)+"index.html"]=shell({path,title,desc:a.description,kw:a.keywords,main:content,article:true,image:pic.replace(/\.svg$/,".png"),schemas:[schema,bc([["Home","/"],["News","/news/"],[a.title,path]])]});
    // Original 16:9 concept imagery from each story-specific editorial visual brief.
    files["assets/news/"+a.slug+".svg"]=editorialCover(a,a.readerGuide);
    files["assets/news/"+a.slug+".png"]=new Resvg(files["assets/news/"+a.slug+".svg"]).render().asPng();
  }
  files["assets/logo.png"]=new Resvg(readFileSync(resolve(ROOT,"assets/favicon.svg"),"utf8"),{fitTo:{mode:"width",value:256}}).render().asPng();
  Object.assign(files,buildReviewExperience({BASE,series:reviewSeries,reviews:publishedReviews,articles,files,shell,pageLd,bc,bread,e,fmt,org,editorialCover,Resvg}));
  const pages=JSON.parse(readFileSync(resolve(ROOT,"content/site-pages.json"),"utf8"));
  for(const {slug,name,title,desc,kw,content} of pages){
    const path="/"+slug+"/",main=`<section class="wrap page">${bread([["Home","/"],[name,path]])}<span class="eyebrow">USA ANIME CLUB</span><h1>${e(name)}</h1><div class="prose">${content}</div></section>`;
    files[slug+"/index.html"]=shell({path,title,desc,kw,main,schemas:[pageLd(path,title,desc,slug==="about"?"AboutPage":slug==="contact"?"ContactPage":"WebPage"),bc([["Home","/"],[name,path]])]});
  }
  files["404.html"]=shell({path:"/404.html",title:"Page Not Found | USA Anime Club",desc:"This page is not available. Browse the USA Anime Club US anime news archive.",kw:"anime news page not found",noindex:true,main:`<section class="wrap page not-found"><h1>Page not found</h1><p>That page may have moved.</p><a class="btn" href="/news/">Browse anime news</a></section>`});
  const xml=s=>e(s).replace(/'/g,"&apos;");
  const allPaths=Object.keys(files).filter(k=>k==="index.html"||k.endsWith("/index.html")).map(k=>"/"+k.replace(/index\.html$/,""));
  // No-index only those review hubs without any evidence-supported critical response or firsthand review.
  const paths=allPaths.filter(p=>!files[p==="/"?"index.html":p.slice(1)+"index.html"].includes('<meta name="robots" content="noindex, nofollow">'));
  const reviewLastmod=publishedReviews.reduce((m,r)=>r.updatedAt.slice(0,10)>m?r.updatedAt.slice(0,10):m,SITE_START);
  files["sitemap.xml"]=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map(p=>`<url><loc>${xml(BASE+p)}</loc><lastmod>${items.find(a=>url(a)===p)?.modified||items.find(a=>url(a)===p)?.date||(p.startsWith("/reviews/")?reviewLastmod:(p==="/"||p.startsWith("/news/")?items.reduce((m,a)=>a.date>m?a.date:m,SITE_START):SITE_START))}</lastmod></url>`).join("\n")}\n</urlset>\n`;
  // Google News requires a rolling 48-hour window; CI refreshes this file daily.
  const recent=items.filter(a=>{const published=Date.parse(a.date+"T12:00:00Z");return published<=Date.now()&&Date.now()-published<=48*60*60*1000});
  files["news-sitemap.xml"]=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n${recent.map(a=>`<url><loc>${xml(BASE+url(a))}</loc><news:news><news:publication><news:name>USA Anime Club</news:name><news:language>en</news:language></news:publication><news:publication_date>${a.date}T12:00:00Z</news:publication_date><news:title>${xml(a.title)}</news:title></news:news></url>`).join("\n")}\n</urlset>\n`;
  files["robots.txt"]="# USA Anime Club: public editorial content may be crawled.\nUser-agent: *\nAllow: /\n\nSitemap: "+BASE+"/sitemap.xml\nSitemap: "+BASE+"/news-sitemap.xml\n";
  files["llms.txt"]=`# USA Anime Club\n> Independent US-focused coverage of anime, manga, manhwa and web novels with dated reports and cited original sources.\n\nOfficial website: ${BASE}/\nContact: ${EMAIL}\n\n## Main pages\n- [Homepage](${BASE}/)\n- [Complete news archive](${BASE}/news/)\n- [Episode and chapter review desk](${BASE}/reviews/)\n- [About](${BASE}/about/)\n- [Editorial policy](${BASE}/editorial-policy/)\n- [Corrections policy](${BASE}/corrections/)\n- [Privacy policy](${BASE}/privacy/)\n- [Contact](${BASE}/contact/)\n\n## Topic collections\n- [Anime](${BASE}/news/category/anime/)\n- [Manga](${BASE}/news/category/manga/)\n- [Manhwa](${BASE}/news/category/manhwa/)\n- [Web novels](${BASE}/news/category/web-novels/)\n- [Anime review schedule](${BASE}/reviews/anime/)\n- [Manga chapter review schedule](${BASE}/reviews/manga/)\n\n## Discovery feeds\n- [RSS](${BASE}/feed.xml)\n- [XML sitemap](${BASE}/sitemap.xml)\n- [Google News sitemap](${BASE}/news-sitemap.xml)\n\n## Recent reports\n${items.map(a=>`- [${a.title}](${BASE+url(a)})`).join("\n")}\n\nReports distinguish confirmed US access from announcements in other territories. Check each report's source date and linked original publisher or platform for later changes. USA Anime Club is independent of the studios and companies it covers. This text file is a navigational aid, not a replacement for structured data, robots.txt or editorial verification.\n`;
  files["feed.xml"]=`<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>USA Anime Club — US Anime News</title><link>${BASE}/</link><description>Source-linked US anime, manga, manhwa and web-fiction reporting.</description><language>en-us</language>${items.map(a=>`<item><title>${xml(a.title)}</title><link>${BASE+url(a)}</link><guid isPermaLink="true">${BASE+url(a)}</guid><pubDate>${new Date(a.date+"T12:00:00Z").toUTCString()}</pubDate><description>${xml(a.description)}</description><category>${xml(a.category)}</category></item>`).join("")}</channel></rss>\n`;
  files["build-info.json"]=JSON.stringify({site:BRAND,canonicalHost:BASE,buildId,articleCount:articles.length,reviewSeriesCount:reviewSeries.length,publishedReviewCount:publishedReviews.length,latestArticle:items[0].slug,categories:[...new Set(articles.map(a=>a.category))].sort()},null,2)+"\n";
  files[".htaccess"]="# Apache / Hostinger static-site defaults\nDirectoryIndex index.html\nErrorDocument 404 /404.html\nOptions -MultiViews\n<IfModule mod_headers.c>\n  <FilesMatch \"\\.html$\">\n    Header set Cache-Control \"no-store, max-age=0, must-revalidate\"\n    Header set CDN-Cache-Control \"no-store\"\n    Header set Surrogate-Control \"no-store\"\n  </FilesMatch>\n</IfModule>\n";
  // Keep source/configuration files private from the served static site.
  files[".htaccess"]+=String.raw`<IfModule mod_rewrite.c>
  RewriteEngine On
  # The retired press desk now uses the contact page.
  RewriteRule ^press/?$ /contact/ [R=301,L]
  RewriteRule ^(?:scripts|content|node_modules|\.github|\.git)(?:/|$) - [F,L]
  RewriteRule ^(?:\.env(?:\.[^/]*)?|package(?:-lock)?\.json|README\.md|DEPLOYMENT\.md|\.gitignore)$ - [F,L]
</IfModule>
`;
  files[".htaccess"]+=`<IfModule mod_headers.c>
  <Files "build-info.json">
    Header set Cache-Control "no-store, max-age=0, must-revalidate"
    Header set CDN-Cache-Control "no-store"
    Header set Surrogate-Control "no-store"
    Header set X-Robots-Tag "noindex"
  </Files>
</IfModule>
`;
  if(new Set(allPaths).size!==allPaths.length)throw Error("Duplicate URLs");
  for(const p of allPaths){const name=p==="/"?"index.html":p.slice(1)+"index.html";const html=files[name]||files["index.html"];if(!html.includes(`<link rel="canonical" href="${BASE+p}">`))throw Error("Missing canonical "+p)}
  const ts=allPaths.map(p=>(files[p.slice(1)+"index.html"]||files["index.html"]).match(/<title>(.*?)<\/title>/)?.[1]);
  if(new Set(ts).size!==ts.length)throw Error("Duplicate titles");
  const ds=allPaths.map(p=>(files[p.slice(1)+"index.html"]||files["index.html"]).match(/<meta name="description" content="([^"]+)"/)?.[1]);
  if(new Set(ds).size!==ds.length)throw Error("Duplicate descriptions");
  return files;
}
const input=JSON.parse(readFileSync(resolve(ROOT,"content/articles.json"),"utf8"));
const editorialGuides=JSON.parse(readFileSync(resolve(ROOT,"content/editorial-guides.json"),"utf8"));
if(Object.keys(editorialGuides).length!==input.length)throw Error("Every article needs a curated editorial guide");
for(const a of input){
  const brief=editorialGuides[a.slug];
  if(!brief||!["books","compare","reader","screen","calendar","clock","cinema","trophy","portal"].includes(brief.scene)||!brief.label||!brief.question||!brief.action)throw Error("Missing editorial guide "+a.slug);
  a.readerGuide=brief;
  a.modified=brief.updated||a.modified||a.date; // Publication date remains unchanged.
  a.modifiedAt=brief.updatedAt||null; // Explicit UTC timestamp for actual same-day substantive revisions.
  if(a.modified<a.date)throw Error("Update date precedes publication: "+a.slug);
  if(a.modifiedAt&&(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(a.modifiedAt)||a.modifiedAt.slice(0,10)!==a.modified))throw Error("Timestamp must match actual modified date: "+a.slug);
  if(a.checkedOn&&(!/^\d{4}-\d{2}-\d{2}$/.test(a.checkedOn)||a.checkedOn>new Date().toISOString().slice(0,10)))throw Error("Invalid source recheck date: "+a.slug);
}
const results=buildSite(input);const check=process.argv.includes("--check");let errors=0;
for(const [path,content] of Object.entries(results)){const dst=resolve(ROOT,path),expected=typeof content==="string"?Buffer.from(content,"utf8"):Buffer.from(content);if(check){if(!existsSync(dst)||!readFileSync(dst).equals(expected)){console.error("Outdated:",path);errors++}}else{mkdirSync(dirname(dst),{recursive:true});writeFileSync(dst,expected)}}
// Purge only obsolete generated article routes and associated SVGs.
const slugs=new Set(input.map(a=>a.slug));
for(const entry of readdirSync(resolve(ROOT,"news"),{withFileTypes:true})){
  if(!entry.isDirectory()||entry.name==="page"||entry.name==="category"||slugs.has(entry.name))continue;
  if(check){console.error("Stale article:",entry.name);errors++}
  else rmSync(resolve(ROOT,"news",entry.name),{recursive:true,force:true});
}
for(const entry of readdirSync(resolve(ROOT,"assets/news"),{withFileTypes:true})){
  if(!entry.isFile()||!(entry.name.endsWith(".svg")||entry.name.endsWith(".png"))||slugs.has(entry.name.slice(0,-4)))continue;
  if(check){console.error("Stale illustration:",entry.name);errors++}
  else rmSync(resolve(ROOT,"assets/news",entry.name),{force:true});
}

// Remove only generated pagination routes that are no longer referenced.
// A site shrinking from 13 to 12 stories must not keep an obsolete /page/2/.
function checkObsoleteCollectionPages(folder){
 if(!existsSync(folder))return;
 for(const entry of readdirSync(folder,{withFileTypes:true})){
   const target=resolve(folder,entry.name);
   if(entry.isDirectory())checkObsoleteCollectionPages(target);
   else if(entry.isFile()&&entry.name==="index.html"){
     const rel=target.slice(ROOT.length+1).replaceAll("\\","/");
     if(Object.prototype.hasOwnProperty.call(results,rel))continue;
     if(check){console.error("Obsolete generated archive:",rel);errors++}
     else rmSync(target,{force:true});
   }
 }
}
for(const route of ["news/page","news/category","reviews"])checkObsoleteCollectionPages(resolve(ROOT,route));
if(errors){process.exitCode=1}else console.log((check?"Validated ":"Generated ")+Object.keys(results).length+" website files.");
