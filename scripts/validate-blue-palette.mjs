import fs from "node:fs";
const read=p=>fs.readFileSync(p,"utf8");
const files=["assets/site.css","assets/home-next-20261103.css","assets/logo.svg","favicon.svg"];
const site=read(files[0]),hero=read(files[1]),home=read("content/pages/home.html"),layout=read("templates/layout.html");
const failures=[];
const ensure=(ok,message)=>{if(!ok)failures.push(message)};
ensure(site.includes("--bg:#FFF9F0")&&site.includes("--accent:#A83F0A"),"Warm ivory and vermilion palette missing");
for(const color of ["--anime-ember:#F97316","--anime-gold:#FFC857","--anime-jade:#078E87","--anime-indigo:#6647C7","--anime-cyan:#3263D6"])ensure(site.includes(color),"Palette missing "+color);
ensure(site.includes("--bg:#151D2B")&&site.includes('data-theme="dark"'),"Accessible dark-mode palette missing");
ensure(hero.includes("FESTIVAL INK HOMEPAGE")&&hero.includes(".uac-desk-grid")&&hero.includes("linear-gradient(118deg,#382474,#5136A0"),"Home editorial palette missing");
ensure(hero.includes("aspect-ratio:800 / 499")&&hero.includes("height:auto!important"),"Responsive hero art dimensions missing");
ensure(hero.includes("object-fit:fill!important"),"Image and hair masks must remain aligned");
ensure(home.includes('id="press-desk"')&&home.includes('href="/press/"'),"Press desk navigation missing");
ensure(layout.includes('href="/press/"'),"Shared press navigation missing");
ensure(layout.includes('name="theme-color" content="#FFF9F0"'),"Browser chrome must match editorial palette");
ensure(home.includes("/assets/home-concept-scene-hd-2x.webp"),"Existing anime artwork missing");
ensure(read("assets/logo.svg").includes("#F97316")&&read("favicon.svg").includes("#F97316"),"Logo and favicon must match vermilion palette");
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

// High-impact text/background pairs must meet WCAG 2.2 AA (4.5:1 for normal text).
const linear=v=>{const c=v/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;};
const lum=h=>{const [r,g,b]=rgb(h).map(linear);return .2126*r+.7152*g+.0722*b;};
const contrast=(one,two)=>{const a=lum(one),b=lum(two);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);};
for(const [foreground,background,label] of [
 ["#1B2330","#FFF9F0","body ink on paper"],
 ["#1B2330","#F97316","hero orange CTA"],
 ["#FFFFFF","#6647C7","violet header tab"],
 ["#FFFFFF","#5136A0","press desk"],
 ["#FFFFFF","#A83F0A","site button"],
 ["#4934A5","#FFFFFF","article links"],
 ["#1B2330","#FFC857","sun-gold labels"],
]){
 ensure(contrast(foreground,background)>=4.5,label+" insufficient contrast "+contrast(foreground,background).toFixed(2));
}
if(failures.length){console.error(failures.join("\n"));process.exit(1)}
console.log("Verified a pink-free, Festival Ink: orange, violet, jade, gold and cobalt anime identity across shared styles, hero, logo and favicon.");
