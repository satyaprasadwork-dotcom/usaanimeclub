import fs from "node:fs";
const files=["scripts/build.mjs","assets/site.css","assets/home-next-20261103.css","assets/logo.svg","favicon.svg",...fs.readdirSync("assets/covers").filter(p=>p.endsWith(".svg")).map(p=>"assets/covers/"+p)];
let bad=[];
if(fs.existsSync("assets/hero-anime-scene.svg"))bad.push("Obsolete purple headphone illustration remains");
for(const file of files){
 const value=fs.readFileSync(file,"utf8");
 for(const match of value.matchAll(/#[0-9a-fA-F]{6}(?![a-fA-F0-9])/g)){
   const hex=match[0].slice(1),[r,g,b]=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16));
   const max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min;
   if(delta<28||max<70)continue;
   // Hot-pink, purple, orange or green should not occur in visual theme assets.
   if(r>g+34&&r>b+26||r>b+35&&b>g+25||g>r+40&&g>b+30)bad.push(file+": "+match[0]);
 }
}
const light=fs.readFileSync("assets/site.css","utf8"),hero=fs.readFileSync("content/pages/home.html","utf8");
if(!light.includes("--bg:#f3faff"))bad.push("Light theme background not set");
if(!hero.includes("/assets/hero-sky-traveler.svg"))bad.push("New hero image not linked");
if(bad.length){console.error(bad.slice(0,40).join("\n"));process.exit(1)}
console.log("Blue palette verified in both stylesheets, logo, favicon, and "+(files.length-5)+" editorial covers and fallback styles.");
