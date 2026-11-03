(function(){
"use strict";
const stage=document.querySelector("[data-hero-stage]");
if(!stage)return;
const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer=window.matchMedia("(hover: hover) and (pointer: fine)");
const motionButton=stage.querySelector("[data-motion-toggle]");
const motionLabel=stage.querySelector("[data-motion-label]");
const motionIcon=stage.querySelector(".hero-motion-icon");
let userPaused=false;
let frame=0;
const setMotion=()=>{
 const running=!userPaused&&!reduced.matches;
 stage.dataset.motion=running?"on":"off";
 if(motionButton){
  motionButton.setAttribute("aria-pressed",String(!running));
  motionButton.setAttribute("aria-label",running?"Pause decorative animation":"Resume decorative animation");
 }
 if(motionLabel)motionLabel.textContent=running?"Pause motion":"Play motion";
 if(motionIcon)motionIcon.textContent=running?"Ⅱ":"▶";
};
if(motionButton)motionButton.addEventListener("click",()=>{userPaused=!userPaused;setMotion()});
if(reduced.addEventListener)reduced.addEventListener("change",setMotion);
setMotion();
// Move only a faint specular highlight, not the original illustration.
// The image, cropped hair layers and clickable labels always remain aligned.
if(finePointer.matches){
 stage.addEventListener("pointermove",event=>{
  if(stage.dataset.motion!=="on"||frame)return;
  frame=requestAnimationFrame(()=>{
   const rect=stage.getBoundingClientRect();
   const x=(event.clientX-rect.left)/rect.width;
   stage.style.setProperty("--pointer-glow",Math.round(x*100)+"%");
   frame=0;
  });
 },{passive:true});
 stage.addEventListener("pointerleave",()=>stage.style.removeProperty("--pointer-glow"),{passive:true});
}
const search=document.querySelector("[data-home-search]");
const openSearch=document.querySelector("[data-home-search-open]");
const query=search?.querySelector("[data-home-query]");
const items=[...(search?.querySelectorAll("[data-search-item]")||[])];
const empty=search?.querySelector("[data-home-search-empty]");
function filterSearch(){
 const term=(query?.value||"").trim().toLocaleLowerCase();
 let count=0;
 for(const item of items){
  const visible=item.textContent.toLocaleLowerCase().includes(term);
  item.hidden=!visible;
  if(visible)count++;
 }
 if(empty)empty.hidden=count>0;
}
if(query)query.addEventListener("input",filterSearch);
if(openSearch&&search){
 openSearch.addEventListener("click",()=>{
  if(typeof search.showModal==="function"){search.showModal();filterSearch();query?.focus();}
  else window.location.href="/guides/";
 });
 search.addEventListener("click",event=>{if(event.target===search)search.close()});
}
const drops=document.querySelectorAll(".uac-nav-drop");
document.addEventListener("click",event=>{
 for(const el of drops)if(!el.contains(event.target))el.open=false;
});
document.addEventListener("keydown",event=>{
 if(event.key==="Escape")for(const el of drops)el.open=false;
});
})();
