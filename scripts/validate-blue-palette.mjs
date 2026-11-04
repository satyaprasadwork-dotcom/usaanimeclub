import fs from "node:fs";
const read=p=>fs.readFileSync(p,"utf8");
const files=["assets/site.css","assets/home-next-20261103.css","assets/logo.svg","favicon.svg"];
const site=read(files[0]),hero=read(files[1]),home=read("content/pages/home.html"),layout=read("templates/layout.html");
const failures=[];
const ensure=(ok,message)=>{if(!ok)failures.push(message)};
ensure(site.includes("--bg:#FFFAF1")&&site.includes("--accent:#A84313"),"Warm ivory and vermilion palette missing");
for(const color of ["--anime-ember:#E66A2C","--anime-gold:#E7AD35","--anime-jade:#0B9076","--anime-indigo:#4C55A6"])ensure(site.includes(color),"Palette missing "+color);
ensure(site.includes("--bg:#17232C")&&site.includes('data-theme="dark"'),"Accessible dark-mode palette missing");
ensure(hero.includes("SAFFRON INK HOMEPAGE")&&hero.includes(".uac-desk-grid"),"Home editorial palette missing");
ensure(hero.includes("aspect-ratio:800 / 499")&&hero.includes("height:auto!important"),"Responsive hero art dimensions missing");
ensure(hero.includes("object-fit:fill!important"),"Image and hair masks must remain aligned");
ensure(home.includes('id="press-desk"')&&home.includes('href="/press/"'),"Press desk navigation missing");
ensure(layout.includes('href="/press/"'),"Shared press navigation missing");
ensure(layout.includes('name="theme-color" content="#FFFAF1"'),"Browser chrome must match editorial palette");
ensure(home.includes("/assets/home-concept-scene-hd-2x.webp"),"Existing anime artwork missing");
ensure(read("assets/logo.svg").includes("#E66A2C")&&read("favicon.svg").includes("#E66A2C"),"Logo and favicon must match vermilion palette");
ensure(!fs.existsSync("assets/hero-anime-scene.svg"),"Obsolete art remains");
// Reject magenta and pink-style UI hexadecimal colors, including light pink shades.
// Gently warm ivory/sand hues and cool indigo are intentional and do not qualify.
const rgb=(hex)=>{
 const h=hex.slice(1);
 if(h.length===3||h.length===4)return [0,1,2].map(i=>parseInt(h[i]+h[i],16));
 return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16));
};
const isPink=(hex)=>{
 const [r,g,b]=rgb(hex),R=r/255,G=g/255,B=b/255;
 const max=Math.max(R,G,B),min=Math.min(R,G,B),d=max-min;
 if(d<.015)return false;
 let hue;
 if(max===R)hue=((G-B)/d+6)%6;
 else if(max===G)hue=(B-R)/d+2;
 else hue=(R-G)/d+4;
 hue*=60;
 const light=(max+min)/2, sat=d/(1-Math.abs(2*light-1));
 return hue>=314&&hue<360&&sat>.15&&r>g*1.04&&b>g*1.06;
};
for(const file of files){
 const raw=read(file);
 for(const m of raw.matchAll(/#[0-9a-fA-F]{3,8}\b/g)){
  const hex=m[0],length=hex.length-1;
  if(![3,4,6,8].includes(length))continue;
  if(isPink(hex))failures.push(file+": prohibited pink-tone "+hex);
 }
}
if(failures.length){console.error(failures.join("\n"));process.exit(1)}
console.log("Verified a pink-free, vibrant vermilion–indigo–jade–gold anime identity across shared styles, hero, logo and favicon.");
