// Separate, future-proof critical review renderer. No syndicated synopsis may be presented as firsthand criticism.
export function buildReviewExperience({BASE,series,reviews,articles,shell,pageLd,bc,bread,e,fmt,org,editorialCover,Resvg}){
  const files={};
  if(!Array.isArray(series)||!Array.isArray(reviews))throw Error("Reviews content must be arrays");
  const kinds=new Set(["anime","manga"]);
  const key=new Set();
  const news=new Map(articles.map(a=>[a.slug,a]));
  const group=kind=>series.filter(s=>s.kind===kind);
  const seriesUrl=s=>"/reviews/"+s.kind+"/"+s.slug+"/";
  const dateFmt=d=>fmt(d);
  const label=k=>k==="anime"?"Anime Episode Reviews":"Manga Chapter Reviews";
  for(const s of series){
    if(!kinds.has(s.kind)||!/^[a-z0-9-]+$/.test(s.slug)||key.has(s.kind+":"+s.slug))throw Error("Invalid review series slug or kind "+s.slug);
    key.add(s.kind+":"+s.slug);
    if(!s.title||!s.subtitle||!s.schedule||!s.summary||!s.platform||!s.latestLabel||!s.latestDate)throw Error("Incomplete review series "+s.slug);
    if(!s.officialUrl.startsWith("https://")||!s.sourceDate||!s.checkedOn||!Array.isArray(s.reviewFocus)||s.reviewFocus.length!==3)throw Error("Unverified review series "+s.slug);
    if(!s.relatedNewsSlugs?.length||s.relatedNewsSlugs.some(slug=>!news.has(slug)))throw Error("Invalid related reporting "+s.slug);
  }
  if(group("anime").length<3||group("manga").length<3)throw Error("Review archive must preserve the original anime and manga series");
  const reviewed=new Map(series.map(s=>[s.kind+":"+s.slug,[]]));
  const reviewPaths=new Set();
  for(const r of reviews){
    const found=series.find(s=>s.kind===r.kind&&s.slug===r.seriesSlug);
    const slug="/reviews/"+r.kind+"/"+r.seriesSlug+"/"+r.installmentSlug+"/";
    const prefix=r.kind==="anime"?"episode-":"chapter-";
    if(!found||!r.installmentSlug?.startsWith(prefix)||!/^((episode|chapter)-[0-9]+)$/.test(r.installmentSlug)||r.installmentSlug!==prefix+r.installmentNumber||reviewPaths.has(slug))throw Error("Invalid or duplicate review installment "+slug);
    reviewPaths.add(slug);
    if(!r.reviewerName||r.reviewerName.trim().length<3||!r.publishedOn||!r.updatedAt||r.updatedAt.slice(0,10)<r.publishedOn||!r.headline||!r.verdict||!r.description||!r.officialInstallmentUrl?.startsWith("https://"))throw Error("Review metadata missing "+slug);
    if(!Array.isArray(r.sections)||r.sections.length<3||r.sections.reduce((n,x)=>n+x[1].join(" ").trim().split(/\s+/).length,0)<500)throw Error("Critical analysis requires 500+ original words "+slug);
    const sourceBased=r.reviewMode==="sourced";
    if(sourceBased){
      if(r.firsthandConfirmed||r.watchedOrReadOn||r.score!==undefined||r.reviewerName!=="USA Anime Club Editorial")throw Error("Sourced analysis cannot claim firsthand reading, viewing or personal scores: "+slug);
      if(!r.researchCheckedOn||r.researchCheckedOn>r.publishedOn||!Array.isArray(r.references)||r.references.length<3)throw Error("Sourced criticism needs dated research and 3 references "+slug);
      for(const ref of r.references)if(!ref.label||!ref.url?.startsWith("https://")||!ref.date||ref.date>r.publishedOn)throw Error("Invalid dated research source "+slug);
      if(!r.references.some(ref=>ref.url===r.officialInstallmentUrl||ref.url.includes(found.officialUrl.split("/")[2])))throw Error("A publisher or platform source must support sourced analysis "+slug);
    }else if(r.reviewMode==="firsthand"){
      if(!r.firsthandConfirmed||!r.watchedOrReadOn||r.publishedOn<r.watchedOrReadOn||r.reviewerName==="USA Anime Club Editorial")throw Error("Firsthand review requires a real individual reviewer and verified reading or viewing "+slug);
      if(r.score!==undefined&&(!Number.isInteger(r.score)||r.score<1||r.score>10))throw Error("Invalid reviewer score "+slug);
    }else throw Error("Unrecognized review evidence mode "+slug);
    reviewed.get(found.kind+":"+found.slug).push(r);
  }
  for(const list of reviewed.values())list.sort((a,b)=>b.publishedOn.localeCompare(a.publishedOn)||b.installmentNumber-a.installmentNumber);
  const renderLink=r=>"/reviews/"+r.kind+"/"+r.seriesSlug+"/"+r.installmentSlug+"/";
  const hasAny=reviews.length>0;
  const pill=k=>'<span class="review-kind-tag">'+(k==="anime"?"ANIME EPISODES":"MANGA CHAPTERS")+'</span>';
  const seriesCard=s=>'<a class="review-series-card" href="'+seriesUrl(s)+'"><div class="review-card-top">'+pill(s.kind)+'<span class="review-arrow" aria-hidden="true">↗</span></div><h3>'+e(s.title)+'</h3><p class="review-subtitle">'+e(s.subtitle)+'</p><p class="review-card-excerpt">'+e(s.summary)+'</p><div class="review-card-bottom">'+(s.slug==="boruto-two-blue-vortex"?'':'<span>'+e(s.platform)+'</span>')+'<strong>'+reviewed.get(s.kind+":"+s.slug).length+' original reviews</strong></div></a>';
  const reviewCard=r=>'<a class="review-published-card" href="'+renderLink(r)+'"><span class="review-kind-tag">'+e(r.installmentSlug.replace("-"," ").toUpperCase())+'</span><h3>'+e(r.headline)+'</h3><p>'+e(r.verdict)+'</p><span class="review-card-foot">'+(r.reviewMode==="sourced"?"Source-based analysis by ":"Review by ")+e(r.reviewerName)+' · '+dateFmt(r.publishedOn)+'</span></a>';
  const crosslinks=s=>'<ul class="review-related-list">'+s.relatedNewsSlugs.map(slug=>{const a=news.get(slug);return '<li><a href="/news/'+e(a.slug)+'/">'+e(a.title)+'</a></li>'}).join("")+'</ul>';
  const archives=[
    {path:"/reviews/",name:"Reviews",title:"Anime Episode & Manga Chapter Reviews | USA Anime Club",desc:"Explore anime and manga series with official release sources and spoiler-labeled original episode and chapter criticism.",kw:"anime episode reviews, manga chapter reviews, official US release tracker, critical review archive",listing:series},
    {path:"/reviews/anime/",name:"Anime Episode Reviews",title:"Anime Episode Reviews & Verified US Schedules | USA Anime Club",desc:"Follow Steel Ball Run, The Apothecary Diaries Season 3 and Black Clover Season 2 with official US episode schedules and independent reviews.",kw:"Steel Ball Run review episodes, Apothecary Diaries season 3 episode reviews, Black Clover season 2 reviews",listing:group("anime")},
    {path:"/reviews/manga/",name:"Manga Chapter Reviews",title:"Manga Chapter Reviews & Official English Releases | USA Anime Club",desc:"Explore Boruto: Two Blue Vortex, One Piece, Kagurabachi and Dandadan chapter criticism, official US editions and sourced commentary.",kw:"Boruto Two Blue Vortex chapter reviews, One Piece chapter reviews, Kagurabachi reviews, Dandadan chapter reviews, VIZ manga USA",listing:group("manga")}
  ];
  for(const a of archives){
    const path=a.path;
    const nav='<nav class="review-subnav" aria-label="Browse review categories"><a href="/reviews/"'+(path==="/reviews/"?' aria-current="page"':'')+'>All tracked series</a><a href="/reviews/anime/"'+(path==="/reviews/anime/"?' aria-current="page"':'')+'>Anime episodes</a><a href="/reviews/manga/"'+(path==="/reviews/manga/"?' aria-current="page"':'')+'>Manga chapters</a></nav>';
    const cards='<div class="review-grid">'+a.listing.map(seriesCard).join("")+'</div>';
    const main='<div class="review-page wrap">'+bread([["Home","/"],["Reviews","/reviews/"],...(a.path==="/reviews/"?[]:[[a.name,path]])])+'<header class="review-hero"><span class="eyebrow">THE REVIEW DESK / USA ANIME CLUB</span><h1>'+e(a.name)+'</h1><p class="lead">'+e(a.desc)+'</p></header>'+nav+'<section aria-labelledby="tracked-series-h"><div class="review-section-heading"><span class="eyebrow">RELEASES WITH PRIMARY SOURCES</span><h2 id="tracked-series-h">'+a.listing.length+' series on our watchlist</h2><p>Confirmed publication and streaming information, separate from opinions.</p></div>'+cards+'</section><section class="review-method"><h2>Our review standard</h2><p>We publish one critical article per installment, with accurate attribution, evidence links, genuine original interpretation and truthful publication and revision dates. Source-based critical responses are explicitly distinguished from reviews by someone who watched or read the release. We never present a press synopsis as firsthand viewing or reading.</p><a href="/editorial-policy/">Read the editorial policy</a></section></div>';
    files[path.slice(1)+"index.html"]=shell({path,title:a.title,desc:a.desc,kw:a.kw,main,noindex:!hasAny,schemas:[pageLd(path,a.title,a.desc,"CollectionPage"),bc([["Home","/"],["Reviews","/reviews/"],...(path==="/reviews/"?[]:[[a.name,path]])]),{"@context":"https://schema.org","@type":"ItemList",itemListElement:a.listing.map((s,i)=>({"@type":"ListItem",position:i+1,name:s.title,url:BASE+seriesUrl(s)}))}]});
  }
  for(const s of series){
    const path=seriesUrl(s),kindLabel=label(s.kind),list=reviewed.get(s.kind+":"+s.slug);
    const relevant='<section class="review-related"><h2>Related USA Anime Club reporting</h2>'+crosslinks(s)+'</section>';
    const published=list.length?'<section class="review-feed" aria-label="Articles"><div class="review-grid">'+list.map(reviewCard).join("")+'</div></section>':'';
    const focus='<ul class="review-focus-list">'+s.reviewFocus.map(x=>'<li>'+e(x)+'</li>').join("")+'</ul>';
    const reviewOnly=s.kind==="manga"&&s.slug==="boruto-two-blue-vortex";
    const chapterHub='<div class="review-page wrap">'+bread([["Home","/"],["Reviews","/reviews/"],[kindLabel,"/reviews/"+s.kind+"/"],[s.title,path]])+'<header class="review-series-hero">'+pill(s.kind)+'<h1>'+e(s.title)+'</h1><p class="lead">'+e(s.subtitle)+'</p><p>'+e(s.summary)+'</p></header><section class="review-method" aria-label="Reading and editorial sources"><h2>Read the chapters</h2><p>Our analyses discuss the released story, with spoilers. Read the original manga before reviewing our interpretation.</p><p><a href="'+e(s.officialUrl)+'" target="_blank" rel="noopener noreferrer">Open the official chapter directory</a></p><p class="review-evidence-date">Official link checked <time datetime="'+s.checkedOn+'">'+dateFmt(s.checkedOn)+'</time></p></section>'+published+relevant+'<p class="review-reviewer-note">Our analysis identifies research sources and does not claim firsthand reading of restricted chapters. <a href="/corrections/">Request a correction</a>.</p></div>';
    const main=reviewOnly?chapterHub:'<div class="review-page wrap">'+bread([["Home","/"],["Reviews","/reviews/"],[kindLabel,"/reviews/"+s.kind+"/"],[s.title,path]])+'<header class="review-series-hero">'+pill(s.kind)+'<span class="eyebrow">OFFICIAL US RELEASE RECORD</span><h1>'+e(s.title)+'</h1><p class="lead">'+e(s.subtitle)+'</p><p>'+e(s.summary)+'</p></header><div class="review-facts-grid"><section class="review-verified"><span class="eyebrow">LATEST VERIFIED ENTRY</span><h2>'+e(s.latestLabel)+'</h2><p>'+e(s.schedule)+'</p><div class="review-fact-pair"><span>US platform / publisher</span><strong>'+e(s.platform)+'</strong></div><div class="review-fact-pair"><span>Source checked</span><time datetime="'+s.checkedOn+'">'+dateFmt(s.checkedOn)+'</time></div><p class="review-original-source"><a href="'+e(s.officialUrl)+'" target="_blank" rel="noopener noreferrer">Check official '+(s.kind==="anime"?"streaming announcement":"English chapter directory")+'</a></p><p class="review-evidence-date">Source: '+e(s.sourceLabel)+' · <time datetime="'+s.sourceDate+'">'+dateFmt(s.sourceDate)+'</time></p></section><section class="review-lens"><span class="eyebrow">WHAT AN ORIGINAL REVIEW WILL ASSESS</span><h2>The critical lens</h2>'+focus+'<p>These are editorial questions, not judgments about unseen releases.</p></section></div>'+published+relevant+'<p class="review-reviewer-note">Critical commentary identifies its research sources. Personal ratings or firsthand reviews require actual viewing or reading. <a href="/contact/">Contact the editorial desk</a> about corrections or contributions.</p></div>';
    const desc=reviewOnly?"Boruto: Two Blue Vortex chapter reviews: original spoiler-labeled story analysis, character development, themes and official reading links.":s.title+" official US "+(s.kind==="anime"?"episode":"English chapter")+" release record: "+s.latestLabel+". "+s.platform+" schedule and source-backed review coverage.";
    files[path.slice(1)+"index.html"]=shell({path,title:s.title+" "+(s.kind==="anime"?"Episode":"Chapter")+" Reviews & Official US Releases | USA Anime Club",desc,kw:s.title+" "+(s.kind==="anime"?"episode reviews USA, anime schedule":"manga chapter reviews, official English chapters")+", "+s.platform,noindex:list.length===0,main,schemas:[pageLd(path,s.title+" Release & Review Guide",desc,"CollectionPage"),bc([["Home","/"],["Reviews","/reviews/"],[kindLabel,"/reviews/"+s.kind+"/"],[s.title,path]])]});
  }
  for(const r of reviews){
    const s=series.find(s=>s.kind===r.kind&&s.slug===r.seriesSlug);
    const path=renderLink(r);
    const sourced=r.reviewMode==="sourced";
    const installmentName=r.installmentSlug.replace("-"," ").replace(/\b\w/g,c=>c.toUpperCase());
    const fullTitle=s.title+" "+installmentName+(sourced?" Critical Response: ":" Review: ")+r.headline;
    const body=r.sections.map(([h,ps],i)=>'<section aria-labelledby="review-point-'+i+'"><h2 id="review-point-'+i+'">'+e(h)+'</h2>'+ps.map(p=>'<p>'+e(p)+'</p>').join("")+'</section>').join("");
    const chapterPeers=reviewed.get(s.kind+":"+s.slug);
    const previousChapter=chapterPeers.find(q=>q.installmentNumber===r.installmentNumber-1);
    const followingChapter=chapterPeers.find(q=>q.installmentNumber===r.installmentNumber+1);
    const chapterNav=r.kind==="manga"&&(previousChapter||followingChapter)?'<nav class="review-chapter-nav" aria-label="Read adjacent chapter reviews"><h2>Continue through the chapters</h2><div class="review-chapter-links">'+(previousChapter?'<a href="'+renderLink(previousChapter)+'">← Chapter '+previousChapter.installmentNumber+' analysis</a>':"")+(followingChapter?'<a href="'+renderLink(followingChapter)+'">Chapter '+followingChapter.installmentNumber+' analysis →</a>':"")+'</div><p><a href="'+seriesUrl(s)+'">Browse every '+e(s.title)+' chapter review</a></p></nav>':"";
    const score=sourced||r.score===undefined?"":'<p class="review-score">Reviewer rating: <strong>'+r.score+'/10</strong></p>';
    const sources=sourced?'<section class="review-sources" aria-labelledby="review-sources-heading"><h2 id="review-sources-heading">Research sources and release verification</h2><p>Research checked <time datetime="'+r.researchCheckedOn+'">'+dateFmt(r.researchCheckedOn)+'</time>. The publisher establishes release facts; independent sources inform the analysis above.</p><ul>'+r.references.map(x=>'<li><a href="'+e(x.url)+'" target="_blank" rel="noopener noreferrer">'+e(x.label)+'</a> <time datetime="'+x.date+'">'+dateFmt(x.date)+'</time></li>').join("")+'</ul></section>':'';
    const meta=sourced
      ?'Source-based commentary by <strong>'+e(r.reviewerName)+'</strong> · Research checked <time datetime="'+r.researchCheckedOn+'">'+dateFmt(r.researchCheckedOn)+'</time>'
      :'Firsthand review by <strong>'+e(r.reviewerName)+'</strong> · Read/watched <time datetime="'+r.watchedOrReadOn+'">'+dateFmt(r.watchedOrReadOn)+'</time>';
    const coverSlug=r.kind+"-"+r.seriesSlug+"-"+r.installmentSlug;
    const img="/assets/reviews/"+coverSlug+".svg";
    const coverArt=editorialCover({category:r.kind==="anime"?"Anime":"Manga",slug:coverSlug,title:fullTitle},{scene:r.kind==="anime"?"screen":"reader",label:sourced?"SOURCED CRITIQUE":"ORIGINAL REVIEW"});
    files["assets/reviews/"+coverSlug+".svg"]=coverArt;
    files["assets/reviews/"+coverSlug+".png"]=new Resvg(coverArt).render().asPng();
    const main='<article class="review-page review-article wrap">'+bread([["Home","/"],["Reviews","/reviews/"],[label(s.kind),"/reviews/"+s.kind+"/"],[s.title,seriesUrl(s)],[r.headline,path]])+'<header class="review-series-hero">'+pill(s.kind)+'<h1>'+e(fullTitle)+'</h1><p class="lead">'+e(r.description)+'</p><p class="review-article-meta">'+meta+' · Published <time datetime="'+r.publishedOn+'">'+dateFmt(r.publishedOn)+'</time> · Updated <time datetime="'+r.updatedAt+'">'+dateFmt(r.updatedAt.slice(0,10))+'</time></p><p class="editor-credit">Editor-in-Chief: <a href="/about/#editor-in-chief">Satya Prasad</a></p></header><img class="review-cover" src="'+img+'" width="1200" height="675" alt="Original conceptual illustration for '+e(s.title)+' '+e(installmentName)+' criticism"><p class="review-spoiler-note">Spoiler notice: this article discusses released installment events described by the sources.</p><div class="review-verdict"><span class="eyebrow">'+(sourced?"THE SOURCED TAKEAWAY":"THE VERDICT")+'</span><p>'+e(r.verdict)+'</p>'+score+'</div><div class="prose review-article-prose">'+body+'</div>'+chapterNav+sources+'<section class="source-note"><strong>Official '+(r.kind==="anime"?"episode":"chapter")+' source</strong><p>Only the publisher or authorized streaming service controls access, release times and language options.</p><a href="'+e(r.officialInstallmentUrl)+'" target="_blank" rel="noopener noreferrer">Open the official installment listing</a></section><p class="review-reviewer-note"><a href="/corrections/">Request a factual correction</a> · <a href="'+seriesUrl(s)+'">More '+e(s.title)+' coverage</a></p></article>';
    const common={"@context":"https://schema.org",mainEntityOfPage:{"@type":"WebPage","@id":BASE+path},headline:fullTitle,name:fullTitle,description:r.description,datePublished:r.publishedOn+"T12:00:00Z",dateModified:r.updatedAt,editor:{"@type":"Person",name:"Satya Prasad",url:BASE+"/about/#editor-in-chief"},publisher:org,image:BASE+img.replace(/\.svg$/,".png"),inLanguage:"en-US"};
    let schema;
    if(sourced){
      schema={...common,"@type":"Article",genre:"Source-based critical analysis",author:{"@type":"Organization",name:"USA Anime Club Editorial",url:BASE+"/about/"},articleBody:r.sections.flatMap(x=>x[1]).join(" "),citation:r.references.map(x=>x.url),isBasedOn:r.officialInstallmentUrl};
    }else{
      schema={...common,"@type":"Review",reviewBody:r.verdict+" "+r.sections.flatMap(x=>x[1]).join(" "),author:{"@type":"Person",name:r.reviewerName},itemReviewed:r.kind==="anime"?{"@type":"TVEpisode",name:s.title+" "+r.installmentSlug,episodeNumber:r.installmentNumber,partOfSeries:{"@type":"TVSeries",name:s.title},url:r.officialInstallmentUrl}:{"@type":"Chapter",name:s.title+" "+r.installmentSlug,position:r.installmentNumber,isPartOf:{"@type":"CreativeWorkSeries",name:s.title},url:r.officialInstallmentUrl}};
      if(r.score!==undefined)schema.reviewRating={"@type":"Rating",ratingValue:r.score,bestRating:10,worstRating:1};
    }
    files[path.slice(1)+"index.html"]=shell({path,title:fullTitle+" | USA Anime Club",desc:r.description,kw:s.title+", "+r.installmentSlug+" critical analysis, official "+r.kind+" release, source-based commentary",main,article:true,image:img.replace(/\.svg$/,".png"),schemas:[schema,bc([["Home","/"],["Reviews","/reviews/"],[s.title,seriesUrl(s)],[fullTitle,path]])]});
  }
  return files;
}
