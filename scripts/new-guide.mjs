import fs from "node:fs";
import path from "node:path";
const [slug,title,description,category="Viewing"]=process.argv.slice(2);
if(!slug||!title||!description||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)){
 console.error('Usage: npm run new:guide -- slug "Title" "Description" "Category"');
 process.exit(1);
}
const root=process.cwd(),file="content/catalog.json",catalog=JSON.parse(fs.readFileSync(file,"utf8"));
const url="/guides/"+slug+"/",source="content/pages/guides--"+slug+".html";
if(catalog.some(x=>x.path===url)||fs.existsSync(source))throw Error("Guide already exists");
const esc=s=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const main='<main id="content"><header class="page-top container"><span class="eyebrow"><a href="/guides/">Guides</a> / '+esc(category)+'</span><h1>'+esc(title)+'</h1><p class="lead">'+esc(description)+'</p><div class="article-meta"><span>By USA Anime Club</span><span>Draft: not publicly accessible until reviewed</span></div></header><article class="prose"><!-- Replace this entire draft body with original, sourced editorial content. Include an on-page image, topic-specific sections, a dated research record and a Sources heading. Never publish TODO placeholders. --></article></main>\n';
fs.mkdirSync(path.dirname(source),{recursive:true});fs.writeFileSync(source,main);
catalog.push({path:url,source,kind:"article",title,description,category,cover:slug,published:null,modified:null,status:"draft"});
fs.writeFileSync(file,JSON.stringify(catalog,null,2)+"\n");
console.log("Created unpublished draft: "+source+". Add original cover and verified content before publishing.");
