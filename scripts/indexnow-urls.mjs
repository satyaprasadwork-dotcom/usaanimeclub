// Pure, testable IndexNow selection. Editorial article URLs only:
// no sitemap, archive, category, author, policy or pagination resubmissions.
const ROOT="https://usaanimeclub.com";
const NEWS=/^https:\/\/usaanimeclub\.com\/news\/[a-z0-9-]+\/$/;
const REVIEW=/^https:\/\/usaanimeclub\.com\/reviews\/(?:anime|manga)\/[a-z0-9-]+\/(?:episode|chapter)-[1-9][0-9]*\/$/;
export function isEditorialArticleUrl(url){return NEWS.test(url)||REVIEW.test(url);}
export function canonicalSitemapUrls(xml){
 const urls=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1].replaceAll("&amp;","&"));
 if(!urls.length||new Set(urls).size!==urls.length||urls.some(url=>!url.startsWith(ROOT+"/")))
  throw new Error("Sitemap must contain distinct canonical URLs on "+ROOT);
 return urls;
}
export function findNewEditorialUrls(sitemapXml,baseline,notified){
 const urls=canonicalSitemapUrls(sitemapXml);
 const list=record=>{
  if(!record||!Array.isArray(record.urls)||record.urls.some(url=>!isEditorialArticleUrl(url)))
   throw new Error("Malformed or noneditorial IndexNow baseline/ledger");
  if(new Set(record.urls).size!==record.urls.length)throw new Error("Duplicate URL in IndexNow baseline/ledger");
  return record.urls;
 };
 const known=new Set([...list(baseline),...list(notified)]);
 return urls.filter(url=>isEditorialArticleUrl(url)&&!known.has(url));
}
