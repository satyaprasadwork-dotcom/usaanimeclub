import fs from "node:fs";
const read=p=>fs.readFileSync(p,"utf8");
const shared=read("assets/site.css"),heroCss=read("assets/home-next-20261103.css"),home=read("content/pages/home.html"),layout=read("templates/layout.html"),logo=read("assets/logo.svg");
const problems=[];
const check=(value,message)=>{if(!value)problems.push(message)};
check(shared.includes("--bg:#faf6ef")&&shared.includes("--accent:#b33d40"),"Warm print editorial palette absent");
check(shared.includes(':root[data-theme="dark"]')&&shared.includes("--bg:#211e23"),"Dark-mode contrast palette absent");
check(heroCss.includes("2026 editorial front page")&&heroCss.includes(".uac-desk-grid"),"Editorial home styling absent");
check(home.includes('id="press-desk"')&&home.includes('href="/press/"'),"Press desk is not linked on the homepage");
check(layout.includes('href="/press/"'),"Press desk not linked in shared navigation");
check(home.includes("/assets/home-concept-scene-hd-2x.webp"),"Accessible homepage art missing");
check(logo.includes("#C83F43")&&read("favicon.svg").includes("#C83F43"),"Consistent editorial logo/favicon missing");
check(!fs.existsSync("assets/hero-anime-scene.svg"),"Obsolete artwork remains");
if(problems.length){console.error(problems.join("\n"));process.exit(1)}
console.log("Editorial identity checked: warm paper palette, contrasting dark mode, press navigation, logo and preserved art.");
