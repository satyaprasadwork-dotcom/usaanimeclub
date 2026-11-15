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
    if(!s.officialUrl.startsWith("https://")||!s.sourceDate||!s.checkedOn||!Array.isArray(s.context)||s.context.length!==3||!Array.isArray(s.reviewFocus)||s.reviewFocus.length!==3)throw Error("Unverified review series "+s.slug);
    if(s.context.join(" ").trim().split(/\s+/).length<135)throw Error("Series needs useful editorial release context "+s.slug);
    if(!s.relatedNewsSlugs?.length||s.relatedNewsSlugs.some(slug=>!news.has(slug)))throw Error("Invalid related reporting "+s.slug);
  }
  if(series.length!==6||group("anime").length!==3||group("manga").length!==3)throw Error("Pilot scope requires three anime and three manga");
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
  const seriesCard=s=>'<a class="review-series-card" href="'+seriesUrl(s)+'"><div class="review-card-top">'+pill(s.kind)+'<span class="review-arrow" aria-hidden="true">↗</span></div><h3>'+e(s.title)+'</h3><p class="review-subtitle">'+e(s.subtitle)+'</p><p class="review-card-excerpt">'+e(s.summary)+'</p><div class="review-card-bottom"><span>'+e(s.platform)+'</span><strong>'+reviewed.get(s.kind+":"+s.slug).length+' original reviews</strong></div></a>';
  const reviewCard=r=>'<a class="review-published-card" href="'+renderLink(r)+'"><span class="review-kind-tag">'+e(r.installmentSlug.replace("-"," ").toUpperCase())+'</span><h3>'+e(r.headline)+'</h3><p>'+e(r.verdict)+'</p><span class="review-card-foot">'+(r.reviewMode==="sourced"?"Source-based analysis by ":"Review by ")+e(r.reviewerName)+' · '+dateFmt(r.publishedOn)+'</span></a>';
  const crosslinks=s=>'<ul class="review-related-list">'+s.relatedNewsSlugs.map(slug=>{const a=news.get(slug);return '<li><a href="/news/'+e(a.slug)+'/">'+e(a.title)+'</a></li>'}).join("")+'</ul>';
  const intro='<div class="review-introduction"><p>USA Anime Club follows selected US anime episode and official English manga chapter releases. Each series is linked to its original distributor or publisher and to our relevant reporting. A release record is not a review: research-based criticism explicitly identifies its sources and does not claim firsthand viewing. Firsthand reviews require a named person who watched or read the installment.</p><p>For anime, dates describe the distributor’s advertised US schedule; for manga, chapter numbers identify the newest entry confirmed on the cited English publisher page. Recheck the official listing before watching or reading. We do not invent ratings, summaries of unseen material or future installment dates.</p></div>';
  const archives=[
    {path:"/reviews/",name:"Reviews",title:"Anime Episode & Manga Chapter Reviews | USA Anime Club",desc:"Follow six US anime and manga series, official release updates and original episode-by-episode or chapter-by-chapter reviews after firsthand editorial checks.",kw:"anime episode reviews, manga chapter reviews, official US release tracker, critical review archive",listing:series},
    {path:"/reviews/anime/",name:"Anime Episode Reviews",title:"Anime Episode Reviews & Verified US Schedules | USA Anime Club",desc:"Follow Steel Ball Run, The Apothecary Diaries Season 3 and Black Clover Season 2 with official US episode schedules and independent reviews.",kw:"Steel Ball Run review episodes, Apothecary Diaries season 3 episode reviews, Black Clover season 2 reviews",listing:group("anime")},
    {path:"/reviews/manga/",name:"Manga Chapter Reviews",title:"Manga Chapter Reviews & Official English Releases | USA Anime Club",desc:"Track official English One Piece, Kagurabachi and Dandadan chapters and read original critical reviews after release.",kw:"One Piece chapter reviews, Kagurabachi chapter reviews, Dandadan chapter reviews, official VIZ US chapters",listing:group("manga")}
  ];
  for(const a of archives){
    const path=a.path;
    const nav='<nav class="review-subnav" aria-label="Browse review categories"><a href="/reviews/"'+(path==="/reviews/"?' aria-current="page"':'')+'>All tracked series</a><a href="/reviews/anime/"'+(path==="/reviews/anime/"?' aria-current="page"':'')+'>Anime episodes</a><a href="/reviews/manga/"'+(path==="/reviews/manga/"?' aria-current="page"':'')+'>Manga chapters</a></nav>';
    const reviewEntries=reviews.filter(r=>a.path==="/reviews/"||(a.path==="/reviews/anime/"&&r.kind==="anime")||(a.path==="/reviews/manga/"&&r.kind==="manga"));
    const cards='<div class="review-grid">'+a.listing.map(seriesCard).join("")+'</div>';
    const latest=reviewEntries.length?'<section class="review-feed" aria-labelledby="review-feed-h"><div class="review-section-heading"><h2 id="review-feed-h">Published criticism</h2><p>Original episode and chapter assessments, credited to their reviewers.</p></div><div class="review-grid">'+reviewEntries.map(reviewCard).join("")+'</div></section>':'';
    const main='<div class="review-page wrap">'+bread([["Home","/"],["Reviews","/reviews/"],...(a.path==="/reviews/"?[]:[[a.name,path]])])+'<header class="review-hero"><span class="eyebrow">THE REVIEW DESK / USA ANIME CLUB</span><h1>'+e(a.name)+'</h1><p class="lead">'+e(a.desc)+'</p></header>'+nav+intro+'<section aria-labelledby="tracked-series-h"><div class="review-section-heading"><span class="eyebrow">RELEASES WITH PRIMARY SOURCES</span><h2 id="tracked-series-h">'+a.listing.length+' series on our watchlist</h2><p>Confirmed publication and streaming information, separate from opinions.</p></div>'+cards+'</section>'+latest+'<section class="review-method"><h2>Our review standard</h2><p>We publish one critical article per installment, with accurate attribution, evidence links, genuine original interpretation and truthful publication and revision dates. Source-based critical responses are explicitly distinguished from reviews by someone who watched or read the release. We never present a press synopsis as firsthand viewing or reading.</p><a href="/editorial-policy/">Read the editorial policy</a></section></div>';
    files[path.slice(1)+"index.html"]=shell({path,title:a.title,desc:a.desc,kw:a.kw,main,noindex:!hasAny,schemas:[pageLd(path,a.title,a.desc,"CollectionPage"),bc([["Home","/"],["Reviews","/reviews/"],...(path==="/reviews/"?[]:[[a.name,path]])]),{"@context":"https://schema.org","@type":"ItemList",itemListElement:a.listing.map((s,i)=>({"@type":"ListItem",position:i+1,name:s.title,url:BASE+seriesUrl(s)}))}]});
  }
  for(const s of series){
    const path=seriesUrl(s),kindLabel=label(s.kind),list=reviewed.get(s.kind+":"+s.slug);
    const relevant='<section class="review-related"><h2>Related USA Anime Club reporting</h2>'+crosslinks(s)+'</section>';
    const published=list.length?'<section class="review-feed"><h2>Critical responses and reviews</h2><div class="review-grid">'+list.map(reviewCard).join("")+'</div></section>':'';
    const focus='<ul class="review-focus-list">'+s.reviewFocus.map(x=>'<li>'+e(x)+'</li>').join("")+'</ul>';
    const main='<div class="review-page wrap">'+bread([["Home","/"],["Reviews","/reviews/"],[kindLabel,"/reviews/"+s.kind+"/"],[s.title,path]])+'<header class="review-series-hero">'+pill(s.kind)+'<span class="eyebrow">OFFICIAL US RELEASE RECORD</span><h1>'+e(s.title)+'</h1><p class="lead">'+e(s.subtitle)+'</p><p>'+e(s.summary)+'</p></header><div class="review-facts-grid"><section class="review-verified"><span class="eyebrow">LATEST VERIFIED ENTRY</span><h2>'+e(s.latestLabel)+'</h2><p>'+e(s.schedule)+'</p><div class="review-fact-pair"><span>US platform / publisher</span><strong>'+e(s.platform)+'</strong></div><div class="review-fact-pair"><span>Source checked</span><time datetime="'+s.checkedOn+'">'+dateFmt(s.checkedOn)+'</time></div><p class="review-original-source"><a href="'+e(s.officialUrl)+'" target="_blank" rel="noopener noreferrer">Check official '+(s.kind==="anime"?"streaming announcement":"English chapter directory")+'</a></p><p class="review-evidence-date">Source: '+e(s.sourceLabel)+' · <time datetime="'+s.sourceDate+'">'+dateFmt(s.sourceDate)+'</time></p></section><section class="review-lens"><span class="eyebrow">WHAT AN ORIGINAL REVIEW WILL ASSESS</span><h2>The critical lens</h2>'+focus+'<p>These are editorial questions, not judgments about unseen releases.</p></section></div><section class="review-series-context" aria-labelledby="review-context-h"><h2 id="review-context-h">What US readers should know</h2>'+s.context.map(t=>'<p>'+e(t)+'</p>').join("")+'</section>'+published+relevant+'<p class="review-reviewer-note">Critical commentary identifies its research sources. Personal ratings or firsthand reviews require actual viewing or reading. <a href="/contact/">Contact the editorial desk</a> about corrections or contributions.</p></div>';
    const desc=s.title+" official US "+(s.kind==="anime"?"episode":"English chapter")+" release record: "+s.latestLabel+". "+s.platform+" schedule and source-backed review coverage.";
    files[path.slice(1)+"index.html"]=shell({path,title:s.title+" "+(s.kind==="anime"?"Episode":"Chapter")+" Reviews & Official US Releases | USA Anime Club",desc,kw:s.title+" "+(s.kind==="anime"?"episode reviews USA, anime schedule":"manga chapter reviews, official English chapters")+", "+s.platform,noindex:list.length===0,main,schemas:[pageLd(path,s.title+" Release & Review Guide",desc,"CollectionPage"),bc([["Home","/"],["Reviews","/reviews/"],[kindLabel,"/reviews/"+s.kind+"/"],[s.title,path]])]});
  }
  for(const r of reviews){
    const s=series.find(s=>s.kind===r.kind&&s.slug===r.seriesSlug);
    const path=renderLink(r);
    const sourced=r.reviewMode==="sourced";
    const installmentName=r.installmentSlug.replace("-"," ").replace(/\b\w/g,c=>c.toUpperCase());
    const fullTitle=s.title+" "+installmentName+(sourced?" Critical Response: ":" Review: ")+r.headline;
    const body=r.sections.map(([h,ps],i)=>'<section aria-labelledby="review-point-'+i+'"><h2 id="review-point-'+i+'">'+e(h)+'</h2>'+ps.map(p=>'<p>'+e(p)+'</p>').join("")+'</section>').join("");
    const score=sourced||r.score===undefined?"":'<p class="review-score">Reviewer rating: <strong>'+r.score+'/10</strong></p>';
    const researchNotice=sourced
      ?'<aside class="review-method-note"><strong>Research-based critical analysis — not a firsthand review</strong><p>Our editorial desk has not independently streamed or read this complete installment. This assessment offers original interpretation of verified release facts, published criticism and attributed reader discussion. It is not an eyewitness opinion or a rating.</p></aside>'
      :'<aside class="review-method-note"><strong>Original firsthand review</strong><p>This article was written by an identified reviewer who watched or read the installment. Any opinion or optional score is the reviewer’s own.</p></aside>';
    const sources=sourced?'<section class="review-sources" aria-labelledby="review-sources-heading"><h2 id="review-sources-heading">Research sources and release verification</h2><p>Research checked <time datetime="'+r.researchCheckedOn+'">'+dateFmt(r.researchCheckedOn)+'</time>. The publisher establishes release facts; independent sources inform the analysis above.</p><ul>'+r.references.map(x=>'<li><a href="'+e(x.url)+'" target="_blank" rel="noopener noreferrer">'+e(x.label)+'</a> <time datetime="'+x.date+'">'+dateFmt(x.date)+'</time></li>').join("")+'</ul></section>':'';
    const meta=sourced
      ?'Source-based commentary by <strong>'+e(r.reviewerName)+'</strong> · Research checked <time datetime="'+r.researchCheckedOn+'">'+dateFmt(r.researchCheckedOn)+'</time>'
      :'Firsthand review by <strong>'+e(r.reviewerName)+'</strong> · Read/watched <time datetime="'+r.watchedOrReadOn+'">'+dateFmt(r.watchedOrReadOn)+'</time>';
    const coverSlug=r.kind+"-"+r.seriesSlug+"-"+r.installmentSlug;
    const img="/assets/reviews/"+coverSlug+".svg";
    const coverArt=editorialCover({category:r.kind==="anime"?"Anime":"Manga",slug:coverSlug,title:fullTitle},{scene:r.kind==="anime"?"screen":"reader",label:sourced?"SOURCED CRITIQUE":"ORIGINAL REVIEW"});
    files["assets/reviews/"+coverSlug+".svg"]=coverArt;
    files["assets/reviews/"+coverSlug+".png"]=new Resvg(coverArt).render().asPng();
    const main='<article class="review-page review-article wrap">'+bread([["Home","/"],["Reviews","/reviews/"],[label(s.kind),"/reviews/"+s.kind+"/"],[s.title,seriesUrl(s)],[r.headline,path]])+'<header class="review-series-hero">'+pill(s.kind)+'<h1>'+e(fullTitle)+'</h1><p class="lead">'+e(r.description)+'</p><p class="review-article-meta">'+meta+' · Published <time datetime="'+r.publishedOn+'">'+dateFmt(r.publishedOn)+'</time> · Updated <time datetime="'+r.updatedAt+'">'+dateFmt(r.updatedAt.slice(0,10))+'</time></p><p class="editor-credit">Editor-in-Chief: <a href="/about/#editor-in-chief">Satya Prasad</a></p></header>'+researchNotice+'<img class="review-cover" src="'+img+'" width="1200" height="675" alt="Original conceptual illustration for '+e(s.title)+' '+e(installmentName)+' criticism"><p class="review-spoiler-note">Spoiler notice: this article discusses released installment events described by the sources.</p><div class="review-verdict"><span class="eyebrow">'+(sourced?"THE SOURCED TAKEAWAY":"THE VERDICT")+'</span><p>'+e(r.verdict)+'</p>'+score+'</div><div class="prose review-article-prose">'+body+'</div>'+sources+'<section class="source-note"><strong>Official '+(r.kind==="anime"?"episode":"chapter")+' source</strong><p>Only the publisher or authorized streaming service controls access, release times and language options.</p><a href="'+e(r.officialInstallmentUrl)+'" target="_blank" rel="noopener noreferrer">Open the official installment listing</a></section><p class="review-reviewer-note"><a href="/corrections/">Request a factual correction</a> · <a href="'+seriesUrl(s)+'">More '+e(s.title)+' coverage</a></p></article>';
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
