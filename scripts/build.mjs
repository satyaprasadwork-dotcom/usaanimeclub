import {readFileSync,writeFileSync,mkdirSync,existsSync,readdirSync,rmSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),"..");
function buildSite(articles){
  const BASE="https://usaanimeclub.com",EMAIL="satyaprasadwork@gmail.com",BRAND="USA Anime Club",TODAY=new Date().toISOString().slice(0,10),SITE_START="2026-11-14",files={};
  if(!Array.isArray(articles)||articles.length===0)throw Error("A news site needs at least one verified article");
  const seenSlugs=new Set();
  for(const a of articles){
    if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(a.slug)||seenSlugs.has(a.slug))throw Error("Duplicate or invalid article slug: "+a.slug);
    seenSlugs.add(a.slug);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(a.date)||Number.isNaN(Date.parse(a.date+"T12:00:00Z")))throw Error("Invalid publish date: "+a.slug);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(a.sourceDate)||Number.isNaN(Date.parse(a.sourceDate+"T12:00:00Z")))throw Error("Missing or invalid sourceDate: "+a.slug);
    if(a.sourceDate>a.date)throw Error("Original source announcement cannot postdate site article: "+a.slug);
    if(a.date>TODAY)throw Error("Future publication date: "+a.slug);
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
  const items=[...articles].sort((a,b)=>b.sourceDate.localeCompare(a.sourceDate)||b.date.localeCompare(a.date)||a.title.localeCompare(b.title));
  const e=s=>String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const url=a=>"/news/"+a.slug+"/";
  const fmt=d=>new Date(d+"T12:00:00Z").toLocaleDateString("en-US",{timeZone:"UTC",month:"long",day:"numeric",year:"numeric"});
  const ld=x=>JSON.stringify(x).replace(/</g,"\\u003c");
  const org={"@type":"Organization","@id":BASE+"/#organization",name:BRAND,url:BASE+"/",email:EMAIL,logo:{"@type":"ImageObject",url:BASE+"/assets/favicon.svg"}};
  function bc(links){return {"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:links.map(([name,path],i)=>({"@type":"ListItem",position:i+1,name,item:BASE+path}))}}
  function bread(links){return '<nav class="crumbs" aria-label="Breadcrumb">'+links.map(([name,path],i)=>i===links.length-1?`<span aria-current="page">${e(name)}</span>`:`<a href="${path}">${e(name)}</a> <span aria-hidden="true">/</span> `).join("")+"</nav>"}
  function pageLd(path,name,desc,type="WebPage"){return {"@context":"https://schema.org","@type":type,"@id":BASE+path+"#webpage",url:BASE+path,name,description:desc,inLanguage:"en-US",publisher:{"@id":BASE+"/#organization"}}}
  function shell({path,title,desc,kw,main,schemas=[],image,article=false,noindex=false}){
    const absolute=BASE+path,ogimage=image?`<meta property="og:image" content="${BASE+image}"><meta name="twitter:image" content="${BASE+image}">`:"";
    const selected=path.startsWith("/news/")?"News":path.startsWith("/about/")?"About":path.startsWith("/contact/")?"Contact":"Latest";
    const nav=[["Latest","/"],["News","/news/"],["Anime","/news/?category=Anime"],["Manga","/news/?category=Manga"],["Manhwa","/news/?category=Manhwa"],["Web Novels","/news/?category=Web%20Novels"],["About","/about/"]].map(([n,p])=>`<a href="${p}"${n===selected?' aria-current="page"':""}>${n}</a>`).join("");
    return `<!doctype html>
<html lang="en-US"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${e(title)}</title><meta name="description" content="${e(desc)}"><meta name="keywords" content="${e(kw)}">
<meta name="robots" content="${noindex?"noindex, nofollow":"index, follow, max-image-preview:large"}">
<meta name="author" content="${BRAND}"><meta name="theme-color" content="#ffffff">
<link rel="canonical" href="${absolute}"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="alternate" type="application/rss+xml" title="USA Anime Club news" href="/feed.xml">
<meta property="og:site_name" content="${BRAND}"><meta property="og:type" content="${article?"article":"website"}"><meta property="og:locale" content="en_US">
<meta property="og:url" content="${absolute}"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(desc)}">
<meta name="twitter:card" content="${image?"summary_large_image":"summary"}"><meta name="twitter:title" content="${e(title)}"><meta name="twitter:description" content="${e(desc)}">${ogimage}
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800&family=Barlow+Condensed:wght@600;700;800&family=Literata:opsz,wght@7..72,400;7..72,500;7..72,600;7..72,700&display=swap">
<link rel="stylesheet" href="/assets/styles.css?v=news-cards-20261114">
${schemas.map(s=>`<script type="application/ld+json">${ld(s)}</script>`).join("\n")}
</head><body>
<a class="skip" href="#main">Skip to content</a>
<header class="top">
<div class="edition-bar"><div class="wrap edition-inner"><div class="edition-left"><span>THE ANIME NEWS DESK</span></div><div class="edition-right"><time id="local-clock" aria-label="Your current local time">--:--</time></div></div></div>
<div class="wrap bar"><a class="logo" href="/" aria-label="USA Anime Club homepage"><i aria-hidden="true">桜</i><span class="logo-title">USA <strong>ANIME</strong> CLUB<span class="logo-caption">ANIME NEWS &amp; CULTURE</span></span></a>
<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="main-nav" data-menu-toggle>☰ Menu</button>
<nav class="nav" aria-label="Primary navigation" id="main-nav" data-nav>${nav}</nav></div></header>
<main id="main">${main}</main>
<footer class="foot"><div class="wrap foot-grid">
<div><a href="/" class="logo"><i aria-hidden="true">桜</i> USA Anime Club</a>
<p style="margin-top:1rem">Independent news for US fans of anime, manga, manhwa and online-serialized fiction. Original reports with primary sources.</p>
<p><a href="mailto:${EMAIL}">${EMAIL}</a></p><small>Not affiliated with studios, rights holders or streaming companies.</small></div>
<div><strong>Newsroom &amp; policies</strong><nav aria-label="Footer links"><ul>
<li><a href="/news/">News Archive</a></li><li><a href="/about/">About</a></li><li><a href="/contact/">Contact</a></li>
<li><a href="/editorial-policy/">Editorial Policy</a></li><li><a href="/corrections/">Corrections</a></li><li><a href="/privacy/">Privacy Policy</a></li>
<li><a href="/disclaimer/">Disclaimer</a></li><li><a href="/terms/">Terms &amp; Conditions</a></li></ul></nav>
<button type="button" data-privacy-choices>Privacy choices</button><p class="meta" style="margin-top:1.5rem">© ${new Date().getUTCFullYear()} USA Anime Club</p></div></div></footer>
<div class="privacy-banner" id="privacy-banner" role="region" aria-label="Optional analytics choices" hidden>
<strong>Your privacy choices</strong>
<p>Optional Google Analytics and Microsoft Clarity load only when you accept analytics. Declining leaves them off. <a href="/privacy/">Privacy details</a>.</p>
<div class="btns"><button type="button" class="btn alt" data-consent-decline>Decline analytics</button><button type="button" class="btn" data-consent-accept>Accept analytics</button></div></div>
<script src="/assets/site.js?v=news-cards-20261114" defer></script><script src="/assets/privacy.js?v=news-cards-20261114" defer></script></body></html>\n`;
  }
  function card(a){
    return `<a class="news-card" href="${url(a)}" data-news-category="${e(a.category)}">
<div class="card-media"><img src="/assets/news/${a.slug}.svg" width="1200" height="675" loading="lazy" alt="USA Anime Club editorial graphic for ${e(a.title)}"></div>
<div class="tx"><div class="card-meta"><span class="card-category">${e(a.category)}</span><time datetime="${a.sourceDate}">${fmt(a.sourceDate)}</time></div>
<h3>${e(a.title)}</h3><p class="card-summary">${e(a.description)}</p>
<div class="card-footer"><span>USA Anime Club</span><span class="card-read">Read article</span></div></div></a>`;
  }
  const first=items[0];
  const shortItem=a=>`<a class="latest-item" data-news-category="${e(a.category)}" href="${url(a)}">
<span class="story-kicker">${e(a.category)} <span aria-hidden="true">·</span> <time datetime="${a.sourceDate}">${fmt(a.sourceDate)}</time></span>
<strong>${e(a.title)}</strong><span class="rail-read">Read article</span></a>`;
  const home=`<section class="front-intro"><div class="wrap">
<div><span class="eyebrow"><span class="red-dot" aria-hidden="true"></span> THE ANIME NEWS DESK</span><h1>Latest anime news<span class="headline-period">.</span></h1>
<p class="lead">Anime, manga, manhwa and web-novel news for US readers: dated announcements, credited sources and clear release information.</p></div>
<a class="text-link" href="/news/">Explore the news archive</a>
</div></section>
<section class="front-lead" id="latest"><div class="wrap lead-grid">
<a class="feature-card" data-news-category="${e(first.category)}" href="${url(first)}"><div class="feature-media"><img src="/assets/news/${first.slug}.svg" width="1200" height="675" alt="USA Anime Club editorial graphic for ${e(first.title)}" fetchpriority="high"></div>
<div class="feature-copy"><span class="story-kicker"><span class="lead-label">LEAD STORY</span> ${e(first.category)} · ${fmt(first.sourceDate)}</span>
<h2>${e(first.title)}</h2><p>${e(first.description)}</p><span class="read-story">Read the report</span></div></a>
<aside class="latest-rail" aria-label="More recent anime reports"><div class="rail-title"><div><span class="eyebrow">THE WIRE</span><h2>Latest updates</h2></div><span class="rail-count">${Math.min(3,items.length-1)} STORIES</span></div>
<div class="latest-list">${items.slice(1,4).map(shortItem).join("")}</div>
<a class="rail-footer" href="/news/">See every report</a></aside>
</div></section>
<section class="blk news-section"><div class="wrap"><div class="section-head"><div><span class="eyebrow">THE LATEST / REPORTING</span><h2>More from the desk</h2></div><a class="text-link" href="/news/">All news</a></div>
<div class="grid">${items.slice(1,10).map(card).join("")}</div></div></section>
<section class="topic-section"><div class="wrap"><div class="section-head"><div><span class="eyebrow">FIND YOUR BEAT</span><h2>Follow a story type</h2></div><p class="muted">Filter the news by what matters to you.</p></div>
<div class="topic-grid">
<a href="/news/?category=Anime"><span class="topic-eyebrow">COVERAGE</span><strong>Anime</strong><span>Adaptations, broadcasts and streaming news</span><small>${items.filter(a=>a.category==="Anime").length} reports</small></a>
<a href="/news/?category=Manga"><span class="topic-eyebrow">COVERAGE</span><strong>Manga</strong><span>English manga releases and licensing</span><small>${items.filter(a=>a.category==="Manga").length} reports</small></a>
<a href="/news/?category=Manhwa"><span class="topic-eyebrow">COVERAGE</span><strong>Manhwa</strong><span>Korean comics, webtoons and editions</span><small>${items.filter(a=>a.category==="Manhwa").length} reports</small></a>
<a href="/news/?category=Web%20Novels"><span class="topic-eyebrow">COVERAGE</span><strong>Web Novels</strong><span>Online fiction and serialized translations</span><small>${items.filter(a=>a.category==="Web Novels").length} reports</small></a></div></div></section>
<section class="standards-section"><div class="wrap standards-inner"><div><span class="eyebrow">INDEPENDENT BY DESIGN</span><h2>Source first. <em>Readers first.</em></h2><p>We separate confirmed announcements from what remains unknown, verify US availability, and identify the original reporting source in every article.</p></div>
<a class="btn alt" href="/editorial-policy/">Our editorial policy</a></div></section>`;
  const homeTitle="USA Anime Club | Anime, Manga, Manhwa & Web Novel News";
  const homeDesc="Verified anime, manga, manhwa and web-novel news for US readers, with release dates, publisher announcements and primary sources.";
  files["index.html"]=shell({path:"/",title:homeTitle,desc:homeDesc,kw:"anime news USA, new manga releases, manhwa webtoons, web novels, English releases, official announcements",main:home,image:`/assets/news/${first.slug}.svg`,schemas:[
{"@context":"https://schema.org",...org},
{"@context":"https://schema.org","@type":"WebSite","@id":BASE+"/#website",url:BASE+"/",name:BRAND,inLanguage:"en-US",publisher:{"@id":BASE+"/#organization"}},
pageLd("/",homeTitle,homeDesc)]});
  const archiveTotal=Math.max(1,Math.ceil(items.length/12));
  for(let p=1;p<=archiveTotal;p++){
    const sub=items.slice((p-1)*12,p*12),path=p===1?"/news/":`/news/page/${p}/`;
    const cats=["All","Anime","Manga","Manhwa","Web Novels"];
    const chips=`<div class="chips" role="group" aria-label="Filter news on this archive page">${cats.map((c,i)=>`<button class="chip" type="button" data-category="${e(c)}" aria-pressed="${i===0}">${e(c)}</button>`).join("")}</div><p class="meta" id="filter-status" role="status" aria-live="polite">${sub.length} stories shown on this page</p>`;
    const pag=`<nav class="btns" aria-label="Archive pages">${p>1?`<a class="btn alt" href="${p===2?"/news/":"/news/page/"+(p-1)+"/"}">← Newer</a>`:""}${p<archiveTotal?`<a class="btn alt" href="/news/page/${p+1}/">Older →</a>`:""}</nav>`;
    const title=`Anime News Archive${p===1?"":" — Page "+p} | USA Anime Club`,desc=`Browse anime, manga, manhwa and online-fiction updates for US readers, archive page ${p}.`;
    const main=`<section class="archive-page"><div class="wrap">${bread([["Home","/"],["News Archive",path]])}
<header class="archive-intro"><span class="eyebrow">THE NEWS ARCHIVE / PAGE ${p}</span><h1>All anime news<span class="headline-period">.</span></h1>
<p>Verified anime, manga, manhwa and online-fiction news, ordered by the announcement date or date the source was checked.</p></header>
<div class="archive-toolbar"><div><h2>Browse stories</h2><p>Choose a topic or search the headlines on this page.</p></div>
<div class="archive-search"><label for="news-search">Search this page</label><input type="search" id="news-search" data-news-search placeholder="Search headlines..." autocomplete="off"></div></div>
${chips}<div class="grid archive-grid">${sub.map(card).join("")}</div><p class="no-results" id="no-results" hidden>No matches on this page. Try another topic or search term.</p>
${pag}</div></section>`;
    files[path.slice(1)+"index.html"]=shell({path,title,desc,kw:`anime manga manhwa web novel news page ${p}, US comics and serial fiction releases`,main,schemas:[pageLd(path,title,desc,"CollectionPage"),bc([["Home","/"],["News Archive",path]])]});
  }
  for(const a of items){
    const path=url(a),pic=`/assets/news/${a.slug}.svg`,title=a.title+" | USA Anime Club";
    const sectionId=h=>"section-"+h.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
    const contents=a.sections.map(([h])=>`<a href="#${sectionId(h)}">${e(h)}</a>`).join("");
    const content=`<div class="post-layout">${bread([["Home","/"],["News","/news/"],[a.title,path]])}
<article><header class="post-head"><span class="story-kicker">${e(a.category)} <span aria-hidden="true">/</span> US ANIME NEWS</span>
<h1>${e(a.title)}</h1><p class="lead">${e(a.description)}</p>
<div class="article-byline"><span class="byline-badge" aria-hidden="true">桜</span><div><strong><a href="/about/">USA Anime Club Editorial</a></strong>
<p>Published <time datetime="${a.date}">${fmt(a.date)}</time> <span aria-hidden="true">·</span> Updated <time datetime="${a.modified||a.date}">${fmt(a.modified||a.date)}</time></p></div></div></header>
<div class="article-columns"><div class="article-primary">
<img class="post-hero" src="${pic}" width="1200" height="675" alt="Original typographic editorial illustration for ${e(a.title)}">
<div class="tldr"><span class="tldr-label">THE STORY AT A GLANCE</span><p>${e(a.summary)}</p></div>
<div class="prose">${a.sections.map(([h,paras])=>`<section aria-labelledby="${sectionId(h)}"><h2 id="${sectionId(h)}">${e(h)}</h2>${paras.map(t=>`<p>${e(t)}</p>`).join("")}</section>`).join("")}</div>
<div class="source-note"><strong>Primary source and reporting notes</strong><p>Based on <a href="${e(a.source)}" target="_blank" rel="noopener noreferrer">${e(a.sourceLabel)}</a>. We report the original announcement with context for US fans; details not confirmed by the source are identified as such.</p>
<p>Found a factual error? <a href="mailto:${EMAIL}?subject=${encodeURIComponent("Correction: "+a.title)}">Contact the editorial desk</a>.</p></div>
</div><aside class="article-sidebar"><div class="sidebar-panel"><span class="eyebrow">IN THIS REPORT</span>
<nav aria-label="Article sections" class="contents-list">${contents}</nav></div>
<div class="sidebar-panel sidebar-source"><span class="eyebrow">ORIGINAL ANNOUNCEMENT</span><p>Released <time datetime="${a.sourceDate}">${fmt(a.sourceDate)}</time></p>
<a href="${e(a.source)}" target="_blank" rel="noopener noreferrer">View primary source</a></div>
<div class="sidebar-panel sidebar-note"><strong>Editorial standard</strong><p>Independent summary, source linked, US availability distinguished from other territories.</p><a href="/editorial-policy/">How we verify news</a></div></aside></div></article>
<section class="related-section" aria-labelledby="related-news"><div class="section-head"><div><span class="eyebrow">KEEP READING</span><h2 id="related-news">Related coverage</h2></div><a class="text-link" href="/news/">All reports</a></div>
<div class="grid">${items.filter(x=>x.slug!==a.slug).slice(0,3).map(card).join("")}</div></section></div>`;
    const schema={"@context":"https://schema.org","@type":"NewsArticle","@id":BASE+path+"#article",mainEntityOfPage:{"@type":"WebPage","@id":BASE+path},headline:a.title,description:a.description,image:[BASE+pic],datePublished:a.date+"T12:00:00Z",dateModified:(a.modified||a.date)+"T12:00:00Z",wordCount:articleWordCount(a),citation:[a.source],about:{"@type":"Thing",name:a.category},author:{"@type":"Organization",name:"USA Anime Club Editorial",url:BASE+"/about/"},publisher:org,inLanguage:"en-US",articleSection:a.category,isAccessibleForFree:true,keywords:a.keywords};
    files[path.slice(1)+"index.html"]=shell({path,title,desc:a.description,kw:a.keywords,main:content,article:true,image:pic,schemas:[schema,bc([["Home","/"],["News","/news/"],[a.title,path]])]});
    // Restrained publisher-owned editorial cover art, not AI-styled imagery or licensed anime artwork.
    const palette=({
      Anime:{paper:"#e4eeff",edge:"#235fd5",ink:"#173d94"},
      Manga:{paper:"#ffeddb",edge:"#dd791d",ink:"#83400d"},
      Manhwa:{paper:"#f0e6ff",edge:"#7749c6",ink:"#482b80"},
      "Web Novels":{paper:"#def7f0",edge:"#068f7e",ink:"#075f55"}
    })[a.category]||{paper:"#eaf1fb",edge:"#3263a2",ink:"#244675"};
    const words=a.title.split(/\s+/),lines=[];let line="";
    for(const word of words){
      if((line+" "+word).trim().length>27&&line){lines.push(line);line=word}
      else line=(line+" "+word).trim();
    }
    if(line)lines.push(line);
    const categoryText=({Anime:"ANIME NEWS",Manga:"MANGA NEWS",Manhwa:"KOREAN COMICS","Web Novels":"ONLINE FICTION"})[a.category]||"PUBLISHING NEWS";
    const artworkLines=lines.slice(0,4).map((line,i)=>
      `<text x="76" y="${278+i*66}" fill="${palette.ink}" font-family="Georgia,serif" font-weight="700" font-size="43">${e(line)}</text>`
    ).join("");
    files["assets/news/"+a.slug+".svg"]=`<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Editorial cover: ${e(a.title)}" width="1200" height="675" viewBox="0 0 1200 675">
<rect width="1200" height="675" fill="${palette.paper}"/>
<rect x="0" y="0" width="1200" height="168" fill="${palette.edge}"/><rect x="0" y="0" width="14" height="675" fill="${palette.ink}"/>
<path d="M76 167H1125" stroke="#ffffff" stroke-width="2" opacity=".7"/>
<path d="M76 573H1125" stroke="${palette.edge}" stroke-width="2" opacity=".45"/>
<text x="76" y="101" fill="#ffffff" font-family="Arial,sans-serif" font-weight="700" font-size="26" letter-spacing="3">USA ANIME CLUB</text>
<text x="76" y="137" fill="#ffffff" font-family="Arial,sans-serif" font-weight="600" font-size="17" letter-spacing="2.2">${e(categoryText)}</text>
${artworkLines}
<text x="76" y="613" fill="${palette.ink}" font-family="Arial,sans-serif" font-size="22" font-weight="600">SOURCE DATE / CHECKED  ·  ${a.sourceDate}</text>
<text x="1119" y="611" text-anchor="end" fill="${palette.edge}" font-family="Georgia,serif" font-style="italic" font-size="22">U.S. edition</text>
</svg>\n`;
  }
  const pages=[
["about","About Us","About USA Anime Club | Independent US Anime News","Learn about USA Anime Club, an independent fan-run publication covering verified anime news for audiences in the United States.","about USA Anime Club, independent anime newsroom, verified US anime news",`<p>USA Anime Club is an independent editorial publication covering anime, Japanese manga, Korean manhwa and online fiction for readers in the United States.</p><p>We cover adaptations, US streaming releases, official English-language book editions, Korean webtoon industry developments and online-serialized fiction. We do not publish unrelated filler or unverified rumors.</p><h2>Our editorial approach</h2><p>Every news report links to an original dated announcement and states what remains unconfirmed. We never claim to have conducted interviews or attended events without actually doing so.</p><p>USA Anime Club Editorial is our publication byline. Questions: <a href="mailto:${EMAIL}">${EMAIL}</a>. Our <a href="/editorial-policy/">editorial policy</a> explains how we verify claims.</p>`],
["contact","Contact Us","Contact USA Anime Club | Anime News Tips & Corrections","Email USA Anime Club about official anime announcements, US release news, corrections and editorial feedback.","anime news contact, USA Anime Club email, send anime press release, editorial corrections",`<p>For anime news tips, correction requests, press announcements and questions, write to <strong><a href="mailto:${EMAIL}">${EMAIL}</a></strong>.</p><div class="btns"><a class="btn" href="mailto:${EMAIL}?subject=USA%20Anime%20Club%20News%20Tip">Email the news desk</a></div><h2>What to include</h2><ul><li>A link to the original official announcement</li><li>The announcement date and relevant US territory details</li><li>Any relevant release schedule or press contact</li></ul><p>Submissions are reviewed. Coverage is not automatic, and a submitted release is not an editorial endorsement.</p>`],
["editorial-policy","Editorial Policy","Editorial Policy | USA Anime Club News Verification","How USA Anime Club verifies anime announcements, US streaming rights and movie screenings, with primary sources and correction practices.","anime news editorial policy, US anime fact check, announcement source standards, news corrections",`<p>We distinguish verified announcements from unconfirmed claims. Our first choice is a dated primary statement from a distributor, production company, licensor, publisher or event organizer.</p><h2>United States relevance</h2><p>We check US or North American distribution rights, release formats, source dates, language editions and regional availability. Japanese broadcasts, Korean webtoon awards and English-language book releases are separate events with different verification requirements.</p><h2>Original reporting and attribution</h2><p>We produce original summaries and context with direct links to source materials. We do not fabricate interviews, attendance, viewership figures or exclusives. Site artwork is original typographic editorial illustration, not unlicensed promotional art.</p><h2>Corrections and independence</h2><p>We update a substantive change's date and disclose material factual corrections. Sponsorship, if introduced, will be disclosed; payment cannot buy editorial inclusion. Contact <a href="mailto:${EMAIL}">${EMAIL}</a> or review our <a href="/corrections/">corrections process</a>.</p>`],
["corrections","Corrections Policy","Corrections Policy | USA Anime Club News Accuracy","Request factual corrections to USA Anime Club reporting about US anime premieres, streaming rights and theatrical releases.","USA Anime Club corrections, report anime news error, anime release verification, correct news article",`<p>Send the article URL, the factual issue and a reliable source to <a href="mailto:${EMAIL}">${EMAIL}</a>.</p><h2>Review and updates</h2><p>We compare each request with primary or otherwise reliable evidence. When an error is established, we correct the article; for a significant factual mistake we add a correction note and update the modified date.</p><p>When an external source changes its announced plans, we explain the later development instead of silently treating the original statement as a fabrication.</p>`],
["privacy","Privacy Policy","Privacy Policy | USA Anime Club Optional Analytics & Cookies","Details about optional Google Analytics and Microsoft Clarity, reader email, browser storage and privacy choices at USA Anime Club.","USA Anime Club privacy, GA4 analytics consent, Microsoft Clarity tracking, cookie controls",`<p class="meta">Last updated: November 14, 2026</p><p>We do not require accounts or process payment information.</p><h2>Optional audience measurement</h2><p>Google Analytics 4 (G-G0TNMR0FQL) and Microsoft Clarity (yyqq9cryjc) only load after a visitor chooses <strong>Accept analytics</strong>. You can choose <strong>Decline analytics</strong> instead. Analytics may process site interactions, device data, cookies, approximate network location and session interaction recordings subject to provider masking. We use this for aggregate understanding of the site, not individual identification.</p><h2>Changing consent</h2><p>We save your choice in the browser's local storage. Select <strong>Privacy choices</strong> in any footer to change it. Declining after a previous acceptance reloads the page to stop further tracking; it does not automatically erase prior records held by providers.</p><h2>Other services</h2><p>Google Fonts receives basic connection data when font files are requested. Articles link to third-party sites with their own policies. Read <a href="https://policies.google.com/privacy" rel="noopener noreferrer">Google's privacy policy</a> and <a href="https://privacy.microsoft.com/en-us/privacystatement" rel="noopener noreferrer">Microsoft's privacy statement</a>.</p><h2>Email and reader requests</h2><p>When you contact us by email, we use the message to handle the request. We do not sell reader data or run targeted ads on this version of the site. Depending on applicable law you may have access and deletion rights. Write to <a href="mailto:${EMAIL}">${EMAIL}</a>.</p><h2>Children</h2><p>This site is not directed to children under 13. Please do not send personal information about children.</p>`],
["disclaimer","Disclaimer","Disclaimer | USA Anime Club Independent Anime News","USA Anime Club non-affiliation, anime trademark credits and limitations on third-party release dates, links and streaming details.","anime news disclaimer, independent fan publication, streaming accuracy, anime trademarks",`<p>USA Anime Club is an independent fan publication, not affiliated with or endorsed by anime studios, distributors, streaming services or theaters unless explicitly stated.</p><p>Titles, names, logos and trademarks belong to their respective owners. Our original editorial graphics are not official key art.</p><p>Release dates, catalogs, screening availability, prices and language options can change. Please check official providers before making purchases or travel plans. We do not control external websites linked for citation.</p>`],
["terms","Terms & Conditions","Terms and Conditions | USA Anime Club","Terms for reading and sharing USA Anime Club anime news, original editorial content, copyright and external links.","USA Anime Club terms, anime news copyright, website conditions, original news content",`<p class="meta">Last updated: November 14, 2026</p><h2>Website use</h2><p>Reading and sharing ordinary article links is permitted. Do not impersonate USA Anime Club, disrupt the service, or reproduce large amounts of copyrighted original content without permission except where law permits.</p><h2>Rights and trademarks</h2><p>Original site text, illustrations and design belong to the publication. Third-party anime trademarks remain the property of their owners.</p><h2>Availability</h2><p>We provide editorial information without guaranteeing uninterrupted availability or that every release detail stays unchanged. Mandatory statutory rights remain unaffected.</p><p>Questions: <a href="mailto:${EMAIL}">${EMAIL}</a>.</p>`]
  ];
  for(const [slug,name,title,desc,kw,content] of pages){
    const path="/"+slug+"/",main=`<section class="wrap page">${bread([["Home","/"],[name,path]])}<span class="eyebrow">USA ANIME CLUB</span><h1>${e(name)}</h1><div class="prose">${content}</div></section>`;
    files[slug+"/index.html"]=shell({path,title,desc,kw,main,schemas:[pageLd(path,title,desc,slug==="about"?"AboutPage":slug==="contact"?"ContactPage":"WebPage"),bc([["Home","/"],[name,path]])]});
  }
  files["404.html"]=shell({path:"/404.html",title:"Page Not Found | USA Anime Club",desc:"This page is not available. Browse the USA Anime Club US anime news archive.",kw:"anime news page not found",noindex:true,main:`<section class="wrap page not-found"><h1>Page not found</h1><p>That page may have moved.</p><a class="btn" href="/news/">Browse anime news</a></section>`});
  const xml=s=>e(s).replace(/'/g,"&apos;");
  const paths=Object.keys(files).filter(k=>k==="index.html"||k.endsWith("/index.html")).map(k=>"/"+k.replace(/index\.html$/,""));
  files["sitemap.xml"]=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map(p=>`<url><loc>${xml(BASE+p)}</loc><lastmod>${items.find(a=>url(a)===p)?.modified||items.find(a=>url(a)===p)?.date||(p==="/"||p.startsWith("/news/")?items.reduce((m,a)=>a.date>m?a.date:m,SITE_START):SITE_START)}</lastmod></url>`).join("\n")}\n</urlset>\n`;
  // Google News requires a rolling 48-hour window; CI refreshes this file daily.
  const recent=items.filter(a=>{const published=Date.parse(a.date+"T12:00:00Z");return published<=Date.now()&&Date.now()-published<=48*60*60*1000});
  files["news-sitemap.xml"]=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n${recent.map(a=>`<url><loc>${xml(BASE+url(a))}</loc><news:news><news:publication><news:name>USA Anime Club</news:name><news:language>en</news:language></news:publication><news:publication_date>${a.date}T12:00:00Z</news:publication_date><news:title>${xml(a.title)}</news:title></news:news></url>`).join("\n")}\n</urlset>\n`;
  files["robots.txt"]="User-agent: *\nAllow: /\n\nSitemap: "+BASE+"/sitemap.xml\nSitemap: "+BASE+"/news-sitemap.xml\n";
  files["llms.txt"]=`# USA Anime Club\n> Independent anime, manga, manhwa and online-fiction news for US readers, linked to primary sources.\n\nWebsite: ${BASE}/\nContact: ${EMAIL}\n\n## Pages\n- [Latest news](${BASE}/)\n- [News archive](${BASE}/news/)\n- [Editorial standards](${BASE}/editorial-policy/)\n- [Corrections](${BASE}/corrections/)\n- [RSS feed](${BASE}/feed.xml)\n- [XML sitemap](${BASE}/sitemap.xml)\n\n## Recent reports\n${items.map(a=>`- [${a.title}](${BASE+url(a)})`).join("\n")}\n\nReporting links to original source announcements; no rights-holder affiliation is implied.\n`;
  files["feed.xml"]=`<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>USA Anime Club — US Anime News</title><link>${BASE}/</link><description>Source-verified US anime, manga, manhwa and web-fiction news.</description><language>en-us</language>${items.slice(0,40).map(a=>`<item><title>${xml(a.title)}</title><link>${BASE+url(a)}</link><guid isPermaLink="true">${BASE+url(a)}</guid><pubDate>${new Date(a.date+"T12:00:00Z").toUTCString()}</pubDate><description>${xml(a.description)}</description><category>${xml(a.category)}</category></item>`).join("")}</channel></rss>\n`;
  files[".htaccess"]="# Apache / Hostinger static-site defaults\nDirectoryIndex index.html\nErrorDocument 404 /404.html\nOptions -MultiViews\n<IfModule mod_headers.c>\n  <FilesMatch \"\\.html$\">\n    Header set Cache-Control \"no-cache, must-revalidate\"\n  </FilesMatch>\n</IfModule>\n";
  if(new Set(paths).size!==paths.length)throw Error("Duplicate URLs");
  for(const p of paths){const name=p==="/"?"index.html":p.slice(1)+"index.html";const html=files[name]||files["index.html"];if(!html.includes(`<link rel="canonical" href="${BASE+p}">`))throw Error("Missing canonical "+p)}
  const ts=paths.map(p=>(files[p.slice(1)+"index.html"]||files["index.html"]).match(/<title>(.*?)<\/title>/)?.[1]);
  if(new Set(ts).size!==ts.length)throw Error("Duplicate titles");
  const ds=paths.map(p=>(files[p.slice(1)+"index.html"]||files["index.html"]).match(/<meta name="description" content="([^"]+)"/)?.[1]);
  if(new Set(ds).size!==ds.length)throw Error("Duplicate descriptions");
  return files;
}
const input=JSON.parse(readFileSync(resolve(ROOT,"content/articles.json"),"utf8"));
const results=buildSite(input);const check=process.argv.includes("--check");let errors=0;
for(const [path,content] of Object.entries(results)){const dst=resolve(ROOT,path);if(check){if(!existsSync(dst)||readFileSync(dst,"utf8")!==content){console.error("Outdated:",path);errors++}}else{mkdirSync(dirname(dst),{recursive:true});writeFileSync(dst,content,"utf8")}}
// Purge only obsolete generated article routes and associated SVGs.
const slugs=new Set(input.map(a=>a.slug));
for(const entry of readdirSync(resolve(ROOT,"news"),{withFileTypes:true})){
  if(!entry.isDirectory()||entry.name==="page"||slugs.has(entry.name))continue;
  if(check){console.error("Stale article:",entry.name);errors++}
  else rmSync(resolve(ROOT,"news",entry.name),{recursive:true,force:true});
}
for(const entry of readdirSync(resolve(ROOT,"assets/news"),{withFileTypes:true})){
  if(!entry.isFile()||!entry.name.endsWith(".svg")||slugs.has(entry.name.slice(0,-4)))continue;
  if(check){console.error("Stale illustration:",entry.name);errors++}
  else rmSync(resolve(ROOT,"assets/news",entry.name),{force:true});
}
if(errors){process.exitCode=1}else console.log((check?"Validated ":"Generated ")+Object.keys(results).length+" website files.");
