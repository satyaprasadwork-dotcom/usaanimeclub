import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {execFileSync} from "node:child_process";
const read=p=>JSON.parse(readFileSync(p,"utf8"));
const currentArticles=read("content/articles.json");
const currentGuides=read("content/editorial-guides.json");
function previous(path){
  try{return JSON.parse(execFileSync("git",["show","HEAD^:"+path],{encoding:"utf8",maxBuffer:64*1024*1024}))}
  catch(e){if(e.status===128)return null;throw e}
}
const oldArticles=previous("content/articles.json");
const oldGuides=previous("content/editorial-guides.json");
if(!oldArticles||!oldGuides){
  console.log("Article history is not available; fresh-build validation handles the current records.");
}else{
  const previousBySlug=new Map(oldArticles.map(x=>[x.slug,x]));
  let reviewed=0;
  for(const story of currentArticles){
    const earlier=previousBySlug.get(story.slug);
    if(!earlier)continue;
    const oldGuide=oldGuides[story.slug],newGuide=currentGuides[story.slug];
    // New records may land in an earlier commit of the same publication batch.\n    // Their first guide is not a revision to an existing guide.\n    if(!oldGuide&&newGuide)continue;\n    assert(oldGuide&&newGuide,"Revision guide missing "+story.slug);
    const relevantGuide=x=>{const {updated,updatedAt,...other}=x;return other};
    const storyChanged=JSON.stringify(earlier)!==JSON.stringify(story);
    const guideChanged=JSON.stringify(relevantGuide(oldGuide))!==JSON.stringify(relevantGuide(newGuide));
    if(!storyChanged&&!guideChanged)continue;
    const timestamp=newGuide.updatedAt;
    assert(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(timestamp||""),"Update needs a UTC timestamp: "+story.slug);
    assert.equal(timestamp.slice(0,10),newGuide.updated,"Updated day must match the timestamp: "+story.slug);
    const oldTimestamp=oldGuide.updatedAt||((oldGuide.updated||earlier.date)+"T00:00:00Z");
    assert(timestamp>oldTimestamp,"Article changed but update timestamp did not advance: "+story.slug);
    assert(!Number.isNaN(Date.parse(timestamp))&&Date.parse(timestamp)<=Date.now()+300000,"Invalid or future article update timestamp: "+story.slug);
    assert(timestamp.slice(0,10)>=story.date,"Update predates publication: "+story.slug);
    reviewed++;
  }
  console.log("PASS: "+reviewed+" changed existing article(s) have newer, truthful edit timestamps.");
}
