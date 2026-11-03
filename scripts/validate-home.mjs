import fs from "node:fs";
import path from "node:path";
import {createHash} from "node:crypto";
const read=p=>fs.readFileSync(path.join(process.cwd(),p),"utf8");
const home=read("index.html"),css=read("assets/home-next-20261103.css"),motion=read("assets/home-motion.js");
const errors=[];
function ensure(ok,message){if(!ok)errors.push(message)}
ensure(home.includes('<main id="content">'),"Existing main element missing");
ensure((home.match(/<h1\b/g)||[]).length===1,"Homepage must contain one H1");
ensure(home.includes('id="hero-title"'),"Homepage headline missing");
ensure(home.includes("Every fan has a")&&home.includes("next chapter"),"Reference hero headline missing");
ensure(home.includes('class="uac-landing-header"'),"Homepage-only header missing");
ensure(home.includes('class="uac-feature-strip"'),"Four feature cards missing");
ensure((home.match(/class="uac-feature"/g)||[]).length===4,"Expected four linked feature cards");
ensure(home.includes('class="uac-hair-wind"'),"Layered wind-animated hair missing");
ensure(home.includes('class="uac-hair-crown"'),"Upper hair motion layer missing");
ensure(home.includes('data-hero-stage')&&home.includes('data-motion-toggle'),"Accessible motion control missing");
ensure(home.includes('aria-pressed="false"'),"Motion toggle state missing");
ensure(home.includes('srcset="/assets/home-concept-scene.avif"'),"Exact reference artwork missing");
ensure(home.includes('src="/assets/hero-sky-traveler.svg?v='),"Image fallback missing");
ensure(home.includes('class="uac-home-search"'),"Functional homepage search missing");
ensure(home.includes('name="google-adsense-account"'),"Publisher verification missing");
ensure(home.includes('src="/assets/tracking.js"'),"Shared tracking module missing");
ensure(home.includes('src="/assets/site.js"'),"Shared site module missing");
ensure(home.includes('src="/assets/home-motion.js"'),"Homepage-specific animation script missing");
ensure(home.includes('href="/assets/site.css?v='),"Shared stylesheet URL should be fingerprinted");
ensure(home.includes('href="/assets/home-next-20261103.css?v='),"Homepage stylesheet URL should be fingerprinted");
ensure(home.includes('id="home-layout-fallback"'),"First-paint fallback missing");
ensure(!home.includes("pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"),"Ad loader unexpectedly active");
ensure(css.includes("body:has(.uac-concept-home) .site-head{display:none}"),"Other pages must retain their shared header");
ensure(css.includes(".uac-showcase-shell.hero-next-grid"),"Two-column layout styling missing");
ensure(css.includes(".uac-hair-crown"),"Hair animation styling missing");
ensure(css.includes('data-motion="off"'),"Pause-state CSS missing");
ensure(css.includes("@media(prefers-reduced-motion:reduce)"),"OS reduced-motion support missing");
ensure(motion.includes("userPaused")&&motion.includes("reduced.matches"),"Motion toggle ignores preference");
ensure(motion.includes("requestAnimationFrame"),"Pointer feedback must be throttled");
ensure(motion.includes("showModal")&&motion.includes("filterSearch"),"Search modal must work");
ensure(!/https?:\/\/[^\s"'<>]*(three\.js|gsap|unpkg\.com|cdnjs)/i.test(home),"Unexpected animation CDN");
for(const href of ["/guides/","/guides/choose-first-anime/","/guides/find-anime-streaming-us/","/guides/manga-collecting-budget/","/guides/cosplay-budget-safety/","/guides/start-anime-club/","/tools/","/about/","/contact/"]){
 ensure(home.includes('href="'+href+'"'),"Homepage route missing "+href);
}
const bytes=fs.readFileSync("assets/home-concept-scene.avif");
const hash=createHash("sha256").update(bytes).digest("hex");
ensure(bytes.length===9277,"Unexpected scene image size");
ensure(hash==="4d745c77eb7d96cbd6075bbf2e1a04f4682a4e8a0c2cf2a504441dd0858436c8","Reference image content changed");
ensure(home.includes('<div class="guide-grid">')&&home.includes('id="community"'),"Existing editorial sections were removed");
if(errors.length){console.error(errors.join("\n"));process.exitCode=1;}
else console.log("Homepage fidelity checks passed: reference art, real links, accessible hair motion, search, and preserved shared shell.");
