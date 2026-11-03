import fs from "node:fs";
const read=file=>fs.readFileSync(file,"utf8");
const catalog=JSON.parse(read("content/catalog.json"));
const articles=catalog.filter(p=>p.kind==="article"&&p.status!=="draft");
const evidence=JSON.parse(read("content/source-evidence.json")).guides;
const manual=JSON.parse(read("content/review-register.json")).guides;
const errors=[],paragraphs=new Map();
const verify=(value,message)=>{if(!value)errors.push(message)};
verify(evidence.length===articles.length,"Evidence inventory must cover every article");
verify(manual.length===articles.length,"Human-review register must cover every article");
for(const item of articles){
 const source=read(item.source);
 const body=source.split('<article class="prose">')[1]?.split("</article>")[0]||"";
 const words=body.replace(/<[^>]+>/g," ").replace(/&(?:[a-z]+|#[0-9]+);/g," ").trim().split(/\s+/).filter(Boolean);
 const entry=evidence.find(x=>x.path===item.path);
 const record=manual.find(x=>x.path===item.path);
 verify(words.length>=1000,item.path+": guide body below publishing floor");
 verify((source.match(/rel="author"/g)||[]).length===1,item.path+": expected one linked editorial byline");
 verify(source.includes('<h2 id="sources">'),item.path+": sources section missing");
 verify(source.includes("How to use this guide:"),item.path+": article-specific research scope missing");
 verify(source.includes("/editorial-review/"),item.path+": research transparency link missing");
 verify(!!entry&&!!record,item.path+": incomplete evidence/review register");
 verify(!entry?.complete_claim_by_claim_review||record?.status==="reviewed",item.path+": cannot claim complete fact review without a human record");
 verify(!!entry?.source_url&&source.includes('href="'+entry.source_url+'"'),item.path+": evidence URL missing from article");
 verify(!!entry?.limitations&&!!entry?.claim,item.path+": evidence scope or limitations missing");
 const list=[...body.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)]
  .map(m=>m[1].replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim())
  .filter(p=>p.length>=250);
 for(const paragraph of list){const found=paragraphs.get(paragraph)||[];found.push(item.path);paragraphs.set(paragraph,found);}
}
const known=new Set(articles.map(a=>a.path));
for(const x of evidence)verify(known.has(x.path),"Unpublished article in evidence file: "+x.path);
for(const x of manual)verify(known.has(x.path),"Unpublished article in review file: "+x.path);
for(const [p,locations] of paragraphs)if(locations.length>1)errors.push("Repeated long-form paragraph: "+locations.join(", ")+" / "+p.slice(0,70));
if(errors.length){console.error(errors.join("\n"));process.exitCode=1;}
else console.log("Editorial checks passed: "+articles.length+" linked author bylines, 1000+ words, unique substantial paragraphs and honest source/review status.");
