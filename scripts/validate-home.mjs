import fs from "node:fs";
import path from "node:path";
const read=p=>fs.readFileSync(path.join(process.cwd(),p),"utf8");
const home=read("index.html"),source=read("content/pages/home.html"),css=read("assets/site.css"),motion=read("assets/home-motion.js");
const errors=[];
function assert(ok,message){if(!ok)errors.push(message);}
assert(home.includes('id="hero-title"'),"Homepage hero heading missing");
assert(home.includes('id="home-layout-fallback"'),"Critical homepage layout fallback missing");
assert(home.includes('href="/assets/site.css?v='),"Shared CSS must be content fingerprinted");
assert(home.includes('href="/assets/home-next-20261103.css?v='),"Versioned homepage CSS link missing");
assert(read("assets/home-next-20261103.css").includes(".hero-next-grid"),"Homepage CSS file missing grid rules");
assert(!read("assets/site.css").includes("/* USA Anime Club: Next Chapter homepage."),"Homepage-specific CSS must not be bundled with shared styles");

assert(home.includes('data-hero-stage'),"3D stage missing");
assert(home.includes('data-motion-toggle'),"Motion pause control missing");
assert(home.includes('aria-pressed="false"'),"Motion state semantics missing");
assert(home.includes('src="/assets/hero-sky-traveler.svg"'),"Original hero illustration missing");
assert(home.includes('src="/assets/home-motion.js"'),"Homepage-only animation missing");
assert(home.includes('rel="canonical" href="https://usaanimeclub.com/"'),"Home canonical absent");
assert(home.includes('name="google-adsense-account"'),"AdSense verification missing");
assert(home.includes('src="/assets/tracking.js"'),"Shared analytics module missing");
assert(!home.includes('pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'),"Ad-serving script unexpectedly active");
assert(/prefers-reduced-motion:\s*reduce/.test(css),"Reduced-motion rules missing");
assert(motion.includes('reduced.matches'),"Motion code does not honor OS preference");
assert(motion.includes('requestAnimationFrame'),"Pointer parallax is not animation-frame throttled");
assert(motion.includes('userPaused'),"Pause logic missing");
assert(read("assets/home-next-20261103.css").includes(".hero-stage[data-motion=\"off\"]"),"Pause state missing stylesheet rules");
assert(!/https?:\/\/[^\s"'<>]*(three\.js|gsap|unpkg\.com|cdnjs)/i.test(source),"Unexpected external animation library");
for(const href of ["/guides/","/guides/choose-first-anime/","/guides/find-anime-streaming-us/","/guides/manga-collecting-budget/","/guides/cosplay-budget-safety/","/guides/#Streaming","/guides/#Manga","/guides/#Cosplay","/guides/#Community","/tools/manga-value-lab/"]){
 assert(home.includes('href="'+href+'"'),"Homepage missing destination "+href);
}
const main=home.split('<main id="content">')[1]?.split("</main>")[0]||"";
assert((main.match(/<h1\b/g)||[]).length===1,"Homepage should have one H1");
const localLinks=[...main.matchAll(/href="(\/[^"#?]+)(?:#[^"]*)?"/g)].map(x=>x[1]);
for(const url of localLinks){assert(url==="/"||fs.existsSync(path.join(process.cwd(),url.slice(1),"index.html")),"Missing linked page "+url);}
const illustration=read("assets/hero-sky-traveler.svg");
assert(illustration.length<20000,"Hero illustration unusually large");
assert(illustration.startsWith("<svg"),"Hero image is not an SVG");
assert(motion.length<6000,"Motion script is too large for the intended effect");
if(errors.length){console.error(errors.join("\n"));process.exitCode=1;}else console.log("Homepage checked: original artwork, controls, reduced motion, links, metadata and lightweight scripts.");
