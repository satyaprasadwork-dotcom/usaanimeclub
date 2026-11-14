import {readFileSync,writeFileSync,mkdirSync,existsSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),"..");
function buildSite(articles){
  const BASE="https://usaanimeclub.com",EMAIL="satyaprasadwork@gmail.com",BRAND="USA Anime Club",TODAY="2026-11-14",files={};
  const items=[...articles].sort((a,b)=>b.date.localeCompare(a.date)||a.title.localeCompare(b.title));
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
    const nav=[["Latest","/"],["News","/news/"],["About","/about/"],["Contact","/contact/"]].map(([n,p])=>`<a href="${p}"${n===selected?' aria-current="page"':""}>${n}</a>`).join("");
    return `<!doctype html>
<html lang="en-US"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${e(title)}</title><meta name="description" content="${e(desc)}"><meta name="keywords" content="${e(kw)}">
<meta name="robots" content="${noindex?"noindex, nofollow":"index, follow, max-image-preview:large"}">
<meta name="author" content="${BRAND}"><meta name="theme-color" content="#0c0b1e">
<link rel="canonical" href="${absolute}"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="alternate" type="application/rss+xml" title="USA Anime Club news" href="/feed.xml">
<meta property="og:site_name" content="${BRAND}"><meta property="og:type" content="${article?"article":"website"}"><meta property="og:locale" content="en_US">
<meta property="og:url" content="${absolute}"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(desc)}">
<meta name="twitter:card" content="${image?"summary_large_image":"summary"}"><meta name="twitter:title" content="${e(title)}"><meta name="twitter:description" content="${e(desc)}">${ogimage}
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Outfit:wght@400;500;600;700;800&display=swap">
<link rel="stylesheet" href="/assets/styles.css">
${schemas.map(s=>`<script type="application/ld+json">${ld(s)}</script>`).join("\n")}
</head><body>
<a class="skip" href="#main">Skip to content</a>
<header class="top"><div class="wrap bar"><a class="logo" href="/"><i aria-hidden="true">桜</i> USA Anime Club</a>
<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="main-nav" data-menu-toggle>☰ Menu</button>
<nav class="nav" aria-label="Primary navigation" id="main-nav" data-nav>${nav}</nav></div></header>
<main id="main">${main}</main>
<footer class="foot"><div class="wrap foot-grid">
<div><a href="/" class="logo"><i aria-hidden="true">桜</i> USA Anime Club</a>
<p style="margin-top:1rem">Independent, verified anime news for readers in the United States. Streaming, theaters and new seasons, always sourced.</p>
<p><a href="mailto:${EMAIL}">${EMAIL}</a></p><small>Not affiliated with studios, rights holders or streaming companies.</small></div>
<div><strong>Newsroom &amp; policies</strong><nav aria-label="Footer links"><ul>
<li><a href="/news/">News Archive</a></li><li><a href="/about/">About</a></li><li><a href="/contact/">Contact</a></li>
<li><a href="/editorial-policy/">Editorial Policy</a></li><li><a href="/corrections/">Corrections</a></li><li><a href="/privacy/">Privacy Policy</a></li>
<li><a href="/disclaimer/">Disclaimer</a></li><li><a href="/terms/">Terms &amp; Conditions</a></li></ul></nav>
<button type="button" data-privacy-choices>Privacy choices</button><p class="meta" style="margin-top:1.5rem">© 2026 USA Anime Club</p></div></div></footer>
<div class="privacy-banner" id="privacy-banner" role="region" aria-label="Optional analytics choices" hidden>
<strong>Your privacy choices</strong>
<p>Optional Google Analytics and Microsoft Clarity load only when you accept analytics. Declining leaves them off. <a href="/privacy/">Privacy details</a>.</p>
<div class="btns"><button type="button" class="btn alt" data-consent-decline>Decline analytics</button><button type="button" class="btn" data-consent-accept>Accept analytics</button></div></div>
<script src="/assets/site.js" defer></script><script src="/assets/privacy.js" defer></script></body></html>\n`;
  }
  function card(a){return `<a class="news-card" href="${url(a)}" data-news-category="${e(a.category)}">
<img src="/assets/news/${a.slug}.svg" width="1200" height="675" loading="lazy" alt="Original editorial illustration for ${e(a.title)}">
<div class="tx"><div class="meta">${e(a.category)} · <time datetime="${a.date}">${fmt(a.date)}</time></div><h3>${e(a.title)}</h3><p>${e(a.description)}</p></div></a>`}
  const first=items[0];
  const tkr=items.map(a=>`<a href="${url(a)}">${e(a.title)} ✦</a>`).join("");
  const home=`<section class="hero"><div class="wrap"><div><span class="eyebrow">INDEPENDENT ANIME NEWS · UNITED STATES</span><p class="bubble">New stories, verified.</p>
<h1>Anime news that matters to US fans.</h1><p class="lead">What is confirmed, where it is releasing, and what US viewers should know. No rumor mill — just sourced anime reporting.</p>
<div class="btns"><a class="btn" href="#latest">Read the latest</a><a class="btn alt" href="/editorial-policy/">Our editorial standards</a></div></div>
<div class="stage" aria-hidden="true"><div class="page3d" id="pg"><i class="pn">新</i><i class="pn">報</i><i class="pn">桜</i></div></div></div></section>
<div class="ticker"><div class="ticker-track">${tkr}${tkr}</div></div>
<section class="blk" id="latest"><div class="wrap"><div class="section-head"><div><span class="eyebrow">THE NEWS DESK / 01</span><h2>Latest confirmed stories</h2></div><a href="/news/">View all news →</a></div>
<a class="feature-card" href="${url(first)}"><img src="/assets/news/${first.slug}.svg" width="1200" height="675" alt="Original illustration for ${e(first.title)}">
<div class="tx"><span class="eyebrow">TOP STORY · ${e(first.category)}</span><h2>${e(first.title)}</h2><p>${e(first.description)}</p><span class="meta">${fmt(first.date)} · Read story →</span></div></a>
<div class="grid">${items.slice(1,7).map(card).join("")}</div></div></section>
<section class="blk" style="background:var(--bg2)"><div class="wrap"><span class="eyebrow">HOW WE REPORT / 02</span><h2>Source first. US context always.</h2>
<p class="muted" style="max-width:780px">We link the announcement, distinguish confirmed facts from unknown details, and check US streaming territories, theater dates and language availability.</p>
<div class="btns"><a class="btn alt" href="/editorial-policy/">Editorial policy</a><a class="btn alt" href="/contact/">Send a verified news tip</a></div></div></section>`;
  const homeTitle="USA Anime Club | US Anime News, Streaming & Movie Releases";
  const homeDesc="Verified US anime news: Crunchyroll announcements, upcoming anime movies, streaming updates and new television seasons, each linked to its original source.";
  files["index.html"]=shell({path:"/",title:homeTitle,desc:homeDesc,kw:"USA anime news, anime releases United States, Crunchyroll news USA, anime film dates 2027, upcoming anime seasons",main:home,image:`/assets/news/${first.slug}.svg`,schemas:[
{"@context":"https://schema.org",...org},
{"@context":"https://schema.org","@type":"WebSite","@id":BASE+"/#website",url:BASE+"/",name:BRAND,inLanguage:"en-US",publisher:{"@id":BASE+"/#organization"}},
pageLd("/",homeTitle,homeDesc)]});
  const archiveTotal=Math.max(1,Math.ceil(items.length/12));
  for(let p=1;p<=archiveTotal;p++){
    const sub=items.slice((p-1)*12,p*12),path=p===1?"/news/":`/news/page/${p}/`;
    const cats=["All",...new Set(sub.map(a=>a.category))];
    const chips=p===1?`<div class="chips" role="group" aria-label="Filter news">${cats.map((c,i)=>`<button class="chip" type="button" data-category="${e(c)}" aria-pressed="${i===0}">${e(c)}</button>`).join("")}</div><p class="meta" id="filter-status" role="status" aria-live="polite">${sub.length} stories shown</p>`:"";
    const pag=`<nav class="btns" aria-label="Archive pages">${p>1?`<a class="btn alt" href="${p===2?"/news/":"/news/page/"+(p-1)+"/"}">← Newer</a>`:""}${p<archiveTotal?`<a class="btn alt" href="/news/page/${p+1}/">Older →</a>`:""}</nav>`;
    const title=`Anime News Archive${p===1?"":" — Page "+p} | USA Anime Club`,desc=`Browse verified anime streaming, theater and TV season news for US fans, archive page ${p}.`;
    const main=`<section class="blk"><div class="wrap">${bread([["Home","/"],["News Archive",path]])}<span class="eyebrow">NEWS ARCHIVE / ${p}</span><h1>Anime news archive</h1>
<p class="muted">Official announcements with clear United States context, dates and source links.</p>${chips}<div class="grid">${sub.map(card).join("")}</div>${pag}</div></section>`;
    files[path.slice(1)+"index.html"]=shell({path,title,desc,kw:`anime news archive page ${p}, US anime streaming, theatrical anime release news, upcoming TV anime`,main,schemas:[pageLd(path,title,desc,"CollectionPage"),bc([["Home","/"],["News Archive",path]])]});
  }
  for(const a of items){
    const path=url(a),pic=`/assets/news/${a.slug}.svg`,title=a.title+" | USA Anime Club";
    const content=`<div class="post-layout">${bread([["Home","/"],["News","/news/"],[a.title,path]])}
<article><header class="post-head"><span class="eyebrow">${e(a.category)} · VERIFIED NEWS</span><h1>${e(a.title)}</h1><p class="lead">${e(a.description)}</p>
<p class="meta">By <a href="/about/">USA Anime Club Editorial</a> · Published <time datetime="${a.date}">${fmt(a.date)}</time> · Updated <time datetime="${a.date}">${fmt(a.date)}</time></p></header>
<img class="post-hero" src="${pic}" width="1200" height="675" alt="Original USA Anime Club typographic news illustration for ${e(a.title)}">
<div class="tldr"><strong>In brief:</strong> ${e(a.summary)}</div><div class="prose">${a.sections.map(([h,paras])=>`<section><h2>${e(h)}</h2>${paras.map(t=>`<p>${e(t)}</p>`).join("")}</section>`).join("")}</div>
<div class="source-note"><strong>Primary announcement and verification</strong><p>This report is based on <a href="${e(a.source)}" target="_blank" rel="noopener noreferrer">${e(a.sourceLabel)}</a>. We summarize this publisher/distributor announcement and add US context; we do not claim a separate release confirmation.</p>
<p class="meta">Have a correction? <a href="mailto:${EMAIL}?subject=${encodeURIComponent("Correction: "+a.title)}">Email the news desk</a>.</p></div></article>
<section aria-labelledby="related-news"><h2 id="related-news">More anime news</h2><div class="grid">${items.filter(x=>x.slug!==a.slug).slice(0,3).map(card).join("")}</div></section></div>`;
    const schema={"@context":"https://schema.org","@type":"NewsArticle","@id":BASE+path+"#article",mainEntityOfPage:{"@type":"WebPage","@id":BASE+path},headline:a.title,description:a.description,image:[BASE+pic],datePublished:a.date+"T12:00:00Z",dateModified:a.date+"T12:00:00Z",author:{"@type":"Organization",name:"USA Anime Club Editorial",url:BASE+"/about/"},publisher:org,inLanguage:"en-US",articleSection:a.category,isAccessibleForFree:true,keywords:a.keywords};
    files[path.slice(1)+"index.html"]=shell({path,title,desc:a.description,kw:a.keywords,main:content,article:true,image:pic,schemas:[schema,bc([["Home","/"],["News","/news/"],[a.title,path]])]});
    const hue=Number(a.hue)||220,words=a.title.split(" "),lines=[];let line="";
    for(const w of words){if((line+" "+w).trim().length>24&&line){lines.push(line);line=w}else line=(line+" "+w).trim()}if(line)lines.push(line);
    const text=lines.slice(0,4).map((l,i)=>`<text x="76" y="${306+(i*62)}" fill="#fff" font-family="Arial,sans-serif" font-weight="800" font-size="43">${e(l)}</text>`).join("");
    files["assets/news/"+a.slug+".svg"]=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675"><defs>
<linearGradient id="g" x2="1" y2="1"><stop stop-color="#0c0b1e"/><stop offset=".6" stop-color="hsl(${hue} 70% 30%)"/><stop offset="1" stop-color="#18123a"/></linearGradient>
<pattern id="p" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="2" fill="white" opacity=".12"/></pattern></defs>
<rect width="1200" height="675" fill="url(#g)"/><rect width="1200" height="675" fill="url(#p)"/>
<g opacity=".6"><circle cx="1010" cy="180" r="185" stroke="#3de8ff" fill="none" stroke-width="12"/><circle cx="1035" cy="270" r="110" fill="#ff4f9a"/>
<path d="M730 610L1180 95" stroke="#ffd166" stroke-width="27"/></g>
<rect x="50" y="48" width="1100" height="576" rx="24" fill="none" stroke="#fff" stroke-opacity=".65" stroke-width="5"/>
<text x="76" y="122" fill="#3de8ff" font-family="Arial,sans-serif" font-weight="800" font-size="26" letter-spacing="3">USA ANIME CLUB · ${e(a.category.toUpperCase())}</text>${text}
<path d="M76 554h530" stroke="#ff4f9a" stroke-width="11"/><text x="76" y="599" fill="#e9e4ff" font-family="Arial,sans-serif" font-size="21" font-weight="700">US ANIME NEWS · ${a.date}</text>
<text x="1030" y="565" fill="#fff" font-size="105" font-family="Arial,sans-serif" text-anchor="middle">${e(a.symbol)}</text></svg>\n`;
  }
  const pages=[
["about","About Us","About USA Anime Club | Independent US Anime News","Learn about USA Anime Club, an independent fan-run publication covering verified anime news for audiences in the United States.","about USA Anime Club, independent anime newsroom, verified US anime news",`<p>USA Anime Club is an independent fan-run publication about anime developments that matter to viewers in the United States.</p><p>We focus on sourced release announcements, North American streaming rights, movie screenings and production updates. We do not publish unrelated lifestyle material or general anime guides on this site.</p><h2>Our editorial approach</h2><p>Every news report links to an original dated announcement and states what remains unconfirmed. We never claim to have conducted interviews or attended events without actually doing so.</p><p>USA Anime Club Editorial is our publication byline. Questions: <a href="mailto:${EMAIL}">${EMAIL}</a>. Our <a href="/editorial-policy/">editorial policy</a> explains how we verify claims.</p>`],
["contact","Contact Us","Contact USA Anime Club | Anime News Tips & Corrections","Email USA Anime Club about official anime announcements, US release news, corrections and editorial feedback.","anime news contact, USA Anime Club email, send anime press release, editorial corrections",`<p>For anime news tips, correction requests, press announcements and questions, write to <strong><a href="mailto:${EMAIL}">${EMAIL}</a></strong>.</p><div class="btns"><a class="btn" href="mailto:${EMAIL}?subject=USA%20Anime%20Club%20News%20Tip">Email the news desk</a></div><h2>What to include</h2><ul><li>A link to the original official announcement</li><li>The announcement date and relevant US territory details</li><li>Any relevant release schedule or press contact</li></ul><p>Submissions are reviewed. Coverage is not automatic, and a submitted release is not an editorial endorsement.</p>`],
["editorial-policy","Editorial Policy","Editorial Policy | USA Anime Club News Verification","How USA Anime Club verifies anime announcements, US streaming rights and movie screenings, with primary sources and correction practices.","anime news editorial policy, US anime fact check, announcement source standards, news corrections",`<p>We distinguish verified announcements from unconfirmed claims. Our first choice is a dated primary statement from a distributor, production company, licensor, publisher or event organizer.</p><h2>United States relevance</h2><p>We check the announced US or North American territory, premiere dates, time zones, language versions and theater availability. A Japanese premiere is not automatically a US release.</p><h2>Original reporting and attribution</h2><p>We produce original summaries and context with direct links to source materials. We do not fabricate interviews, attendance, viewership figures or exclusives. Site artwork is original typographic editorial illustration, not unlicensed promotional art.</p><h2>Corrections and independence</h2><p>We update a substantive change's date and disclose material factual corrections. Sponsorship, if introduced, will be disclosed; payment cannot buy editorial inclusion. Contact <a href="mailto:${EMAIL}">${EMAIL}</a> or review our <a href="/corrections/">corrections process</a>.</p>`],
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
  files["sitemap.xml"]=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map(p=>`<url><loc>${xml(BASE+p)}</loc><lastmod>${items.find(a=>url(a)===p)?.date||TODAY}</lastmod></url>`).join("\n")}\n</urlset>\n`;
  const recent=items.filter(a=>a.date>= "2026-11-12" &&a.date<=TODAY);
  files["news-sitemap.xml"]=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n${recent.map(a=>`<url><loc>${xml(BASE+url(a))}</loc><news:news><news:publication><news:name>USA Anime Club</news:name><news:language>en</news:language></news:publication><news:publication_date>${a.date}T12:00:00Z</news:publication_date><news:title>${xml(a.title)}</news:title></news:news></url>`).join("\n")}\n</urlset>\n`;
  files["robots.txt"]="User-agent: *\nAllow: /\n\nSitemap: "+BASE+"/sitemap.xml\nSitemap: "+BASE+"/news-sitemap.xml\n";
  files["llms.txt"]=`# USA Anime Club\n> Independent US-focused anime news, sourced to official announcements.\n\nWebsite: ${BASE}/\nContact: ${EMAIL}\n\n## Pages\n- [Latest news](${BASE}/)\n- [News archive](${BASE}/news/)\n- [Editorial standards](${BASE}/editorial-policy/)\n- [Corrections](${BASE}/corrections/)\n- [RSS feed](${BASE}/feed.xml)\n- [XML sitemap](${BASE}/sitemap.xml)\n\n## Recent reports\n${items.map(a=>`- [${a.title}](${BASE+url(a)})`).join("\n")}\n\nReporting links to original source announcements; no rights-holder affiliation is implied.\n`;
  files["feed.xml"]=`<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>USA Anime Club — US Anime News</title><link>${BASE}/</link><description>Source-verified US anime streaming and theatrical news.</description><language>en-us</language>${items.slice(0,40).map(a=>`<item><title>${xml(a.title)}</title><link>${BASE+url(a)}</link><guid isPermaLink="true">${BASE+url(a)}</guid><pubDate>${new Date(a.date+"T12:00:00Z").toUTCString()}</pubDate><description>${xml(a.description)}</description><category>${xml(a.category)}</category></item>`).join("")}</channel></rss>\n`;
  files[".htaccess"]="# Apache / Hostinger static-site defaults\nDirectoryIndex index.html\nErrorDocument 404 /404.html\nOptions -MultiViews\n";
  if(new Set(paths).size!==paths.length)throw Error("Duplicate URLs");
  for(const p of paths){const name=p==="/ "?"index.html":p.slice(1)+"index.html";const html=files[name]||files["index.html"];if(!html.includes(`<link rel="canonical" href="${BASE+p}">`))throw Error("Missing canonical "+p)}
  const ts=paths.map(p=>(files[p.slice(1)+"index.html"]||files["index.html"]).match(/<title>(.*?)<\/title>/)?.[1]);
  if(new Set(ts).size!==ts.length)throw Error("Duplicate titles");
  const ds=paths.map(p=>(files[p.slice(1)+"index.html"]||files["index.html"]).match(/<meta name="description" content="([^"]+)"/)?.[1]);
  if(new Set(ds).size!==ds.length)throw Error("Duplicate descriptions");
  return files;
}
const input=JSON.parse(readFileSync(resolve(ROOT,"content/articles.json"),"utf8"));
const results=buildSite(input);const check=process.argv.includes("--check");let errors=0;
for(const [path,content] of Object.entries(results)){const dst=resolve(ROOT,path);if(check){if(!existsSync(dst)||readFileSync(dst,"utf8")!==content){console.error("Outdated:",path);errors++}}else{mkdirSync(dirname(dst),{recursive:true});writeFileSync(dst,content,"utf8")}}
if(errors){process.exitCode=1}else console.log((check?"Validated ":"Generated ")+Object.keys(results).length+" website files.");
