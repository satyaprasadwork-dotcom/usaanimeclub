import fs from "node:fs";
const read=p=>fs.readFileSync(p,"utf8");
const shared=read("assets/site.css"),heroCss=read("assets/home-next-20261103.css"),home=read("content/pages/home.html"),layout=read("templates/layout.html"),logo=read("assets/logo.svg");
const problems=[];
const check=(value,message)=>{if(!value)problems.push(message)};
check(shared.includes("--bg:#fff9f6")&&shared.includes("--accent:#d73365"),"Colorful editorial palette absent");
check(shared.includes("--anime-violet:#7657d7")&&shared.includes("--anime-sun:#f6b943")&&shared.includes("--anime-mint:#12a99c"),"Multicolor anime accents missing");
check(shared.includes(':root[data-theme="dark"]')&&shared.includes("--bg:#211e30"),"Dark-mode contrast palette absent");
check(heroCss.includes("COLORFUL ANIME EDITION")&&heroCss.includes(".uac-desk-grid"),"Colorful homepage styling absent");
check(heroCss.includes("aspect-ratio:800 / 499")&&heroCss.includes("height:auto!important"),"Intrinsic image geometry repair missing");
check(heroCss.includes("object-fit:fill!important"),"Image and animated mask no longer share the same frame");
check(home.includes('id="press-desk"')&&home.includes('href="/press/"'),"Press desk is not linked on the homepage");
check(layout.includes('href="/press/"'),"Press desk not linked in shared navigation");
check(home.includes("/assets/home-concept-scene-hd-2x.webp"),"Accessible homepage art missing");
check(logo.includes("#C83F43")&&read("favicon.svg").includes("#C83F43"),"Consistent editorial logo/favicon missing");
check(!fs.existsSync("assets/hero-anime-scene.svg"),"Obsolete artwork remains");
if(problems.length){console.error(problems.join("\n"));process.exit(1)}
console.log("Editorial identity checked: colorful anime palette, intrinsic hero ratio, contrasting dark mode, press links and art.");
