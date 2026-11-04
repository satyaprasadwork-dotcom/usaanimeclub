import fs from "node:fs";
import vm from "node:vm";
const script=fs.readFileSync("assets/tool-suite.js","utf8");
const catalog=JSON.parse(fs.readFileSync("content/catalog.json","utf8"));
const samples={
 "anime-release-time-converter":{start:"2026-11-05T19:00",zone:"America/New_York"},
 "cosplay-build-countdown":{deadline:"2027-07-12",budget:"200"},
 "anime-watch-party-scheduler":{date:"2026-11-07",zone:"America/New_York",guest1:"America/Chicago",guest2:"America/Los_Angeles",start:"18",end:"23",guestFrom:"18",guestTo:"23"},
 "convention-day-planner":{events:"09:00|10:00|Opening panel\n09:30|10:30|Workshop"},
 "convention-packing-checklist":{days:"2",cosplay:true,overnight:true,access:true},
 "spoiler-safe-episode-tracker":{title:"Sample fan watchlist",total:"24",seen:"8"},
 "anime-recommendation-matchmaker":{genre:"sports",mood:"energy",length:"medium"},
 "anime-club-starter-kit":{club:"Sample Club",place:"Dallas, TX",meetings:"2"},
 "cosplay-merch-buying-checklist":{price:"100",shipping:"20",tax:"10",seller:"unknown"},
 "us-anime-convention-finder":{state:"Texas",city:"Houston"},
 "us-manga-release-calendar":{month:"2026-11",entries:"2026-11-10|Confirmed Sample Title|Publisher"},
 "anime-movie-release-tracker":{title:"Sample Anime Film",date:"2027-01-20",place:"New York"},
 "english-dub-sub-calendar":{entries:"2026-11-05|Sample Anime|DUB|Official Publisher"},
 "where-to-watch-anime-us":{title:"Cowboy Bebop",audio:"either"},
 "manga-isbn-edition-explorer":{isbn:"9781974704439"},
 "convention-rules-explorer":{event:"Sample Convention",site:"https://example.com"},
 "local-anime-club-finder":{city:"Austin",state:"Texas"},
 "library-manga-finder":{title:"Naruto",zip:"78701"},
 "watch-party-rights-accessibility-helper":{venue:"public",size:"20",paid:true,captions:true},
 "press-release-submission-checker":{headline:"Sample Release",organization:"Anime Org",date:"2026-11-04",us:"US",source:"https://example.com",contact:"satyaprasadwork@gmail.com",rights:"Approved"}
};
const errors=[];
for(const [id,fields] of Object.entries(samples)){
 const path="content/pages/tools--"+id+".html";
 if(!fs.existsSync(path)){errors.push("Source page missing "+path);continue;}
 const html=fs.readFileSync(path,"utf8");
 if(!html.includes('data-tool="'+id+'"')||!html.includes('src="/assets/tool-suite.js"'))errors.push(id+": missing tool wiring");
 if(!html.includes('data-tool-result')||!html.includes('type="submit"'))errors.push(id+": missing usable UI");
 if(!catalog.some(p=>p.path==="/tools/"+id+"/"))errors.push(id+": no catalog route");
 let listener=null;
 const result={children:[],hidden:true,replaceChildren(){this.children=[]},append(node){this.children.push(node)}};
 const form={elements:{namedItem(name){return {value:String(fields[name]===true?"on":fields[name]||""),checked:fields[name]===true}}},reportValidity(){return true},addEventListener(name,fn){if(name==="submit")listener=fn}};
 const app={dataset:{tool:id},querySelector(sel){return sel==="form"?form:sel==="[data-tool-result]"?result:null}};
 const element=(tag)=>({tagName:tag,textContent:"",children:[],append(node){this.children.push(node)}});
 const document={querySelector(sel){return sel==="[data-tool-app]"?app:null},createElement:element};
 try{
  vm.runInNewContext(script,{document,localStorage:{setItem(){}},Intl,Date,Number,Math,console},{timeout:1000});
  if(typeof listener!=="function"){errors.push(id+": submission handler missing");continue;}
  listener({preventDefault(){}});
  if(result.hidden||result.children.length<2)errors.push(id+": no meaningful result");
  if(result.children[0]?.textContent==="Check your inputs")errors.push(id+": sample input rejected: "+result.children[1]?.textContent);
 }catch(error){errors.push(id+": script error: "+error.message);}
}
const hub=fs.readFileSync("content/pages/tools.html","utf8");
if((hub.match(/data-tool-card/g)||[]).length!==23)errors.push("Tool directory must show 23 searchable cards");
if(!hub.includes("data-tool-filter"))errors.push("Tool directory filtering UI missing");
const home=fs.readFileSync("content/pages/home.html","utf8");
if(!home.includes('href="/tools/anime-release-time-converter/"')||!home.includes('href="/tools/us-anime-convention-finder/"'))errors.push("Header tool shortcuts missing");
const motion=fs.readFileSync("assets/home-motion.js","utf8");
if(motion.includes('if(!stage)return'))errors.push("Header must work without the animated hero");
if(!motion.includes('summary?.addEventListener("click"'))errors.push("Header dropdowns require native mouse/touch/keyboard clicks");
if(errors.length){console.error(errors.join("\n"));process.exitCode=1}
else console.log("All 20 new anime tools passed sample interactions; 23-tool hub and header navigation present.");
