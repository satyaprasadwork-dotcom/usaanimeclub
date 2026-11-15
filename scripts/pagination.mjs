// Shared 12-item pagination for news archives, topic collections and review-series pages.
export const ARTICLES_PER_PAGE=12;

export function getPageCount(total){
  if(!Number.isInteger(total)||total<0)throw new RangeError("Invalid article count");
  return Math.max(1,Math.ceil(total/ARTICLES_PER_PAGE));
}

export function getPageItems(items,page){
  if(!Array.isArray(items))throw new TypeError("Items must be an array");
  const pageCount=getPageCount(items.length);
  if(!Number.isInteger(page)||page<1||page>pageCount)throw new RangeError("Invalid page number");
  return items.slice((page-1)*ARTICLES_PER_PAGE,page*ARTICLES_PER_PAGE);
}

export function paginationHtml({basePath,page,total,label="News"}){
  const pages=getPageCount(total);
  if(!Number.isInteger(page)||page<1||page>pages)throw new RangeError("Invalid pagination page");
  if(!/^\/(?:news\/(?:category\/[a-z-]+\/)?|reviews\/(?:anime|manga)\/[a-z0-9-]+\/)$/.test(basePath))throw new Error("Invalid pagination base path");
  const escape=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const pathFor=n=>n===1?basePath:basePath+"page/"+n+"/";
  const first=total===0?0:(page-1)*ARTICLES_PER_PAGE+1;
  const last=Math.min(page*ARTICLES_PER_PAGE,total);
  const numbers=new Set([1,pages]);
  for(let n=Math.max(1,page-2);n<=Math.min(pages,page+2);n++)numbers.add(n);
  const visible=[...numbers].sort((a,b)=>a-b);
  const pageLinks=[];
  for(let i=0;i<visible.length;i++){
    const n=visible[i];
    if(i&&n-visible[i-1]>1)pageLinks.push('<span class="pagination-ellipsis" aria-hidden="true">…</span>');
    pageLinks.push('<a class="pagination-number" href="'+pathFor(n)+'" aria-label="'+escape(label)+' page '+n+'"'+(n===page?' aria-current="page"':'')+'>'+n+'</a>');
  }
  const previous=page>1?'<a class="pagination-step" href="'+pathFor(page-1)+'" rel="prev">Previous</a>':'<span class="pagination-step is-disabled" aria-disabled="true">Previous</span>';
  const next=page<pages?'<a class="pagination-step" href="'+pathFor(page+1)+'" rel="next">Next</a>':'<span class="pagination-step is-disabled" aria-disabled="true">Next</span>';
  return '<nav class="news-pagination" aria-label="'+escape(label)+' pagination">'
    +'<p class="pagination-summary">Showing '+first+'–'+last+' of '+total+' '+(total===1?'article':'articles')+' <span aria-hidden="true">·</span> Page '+page+' of '+pages+'</p>'
    +'<div class="pagination-links">'+previous+pageLinks.join("")+next+'</div></nav>';
}

