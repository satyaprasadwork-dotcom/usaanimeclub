(function(){
"use strict";
const stage=document.querySelector("[data-hero-stage]");
if(!stage)return;
const toggle=stage.querySelector("[data-motion-toggle]");
const label=stage.querySelector("[data-motion-label]");
const icon=stage.querySelector(".hero-motion-icon");
const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer=window.matchMedia("(hover: hover) and (pointer: fine)");
let userPaused=false, frame=0, x=0, y=0;
const update=()=>{
 const playing=!userPaused&&!reduced.matches;
 stage.dataset.motion=playing?"on":"off";
 if(toggle){toggle.setAttribute("aria-pressed",String(!playing));toggle.setAttribute("aria-label",playing?"Pause decorative animation":"Resume decorative animation");}
 if(label)label.textContent=playing?"Pause motion":"Play motion";
 if(icon)icon.textContent=playing?"Ⅱ":"▶";
 if(!playing){stage.style.setProperty("--hero-tilt-x","0deg");stage.style.setProperty("--hero-tilt-y","0deg");}
};
const move=event=>{
 if(stage.dataset.motion!=="on"||!finePointer.matches)return;
 const bounds=stage.getBoundingClientRect();
 x=Math.max(-1,Math.min(1,(event.clientX-bounds.left)/bounds.width*2-1));
 y=Math.max(-1,Math.min(1,(event.clientY-bounds.top)/bounds.height*2-1));
 if(frame)return;
 frame=requestAnimationFrame(()=>{
  stage.style.setProperty("--hero-tilt-x",(x*4.2).toFixed(2)+"deg");
  stage.style.setProperty("--hero-tilt-y",(-y*3.3).toFixed(2)+"deg");
  frame=0;
 });
};
stage.addEventListener("pointermove",move,{passive:true});
stage.addEventListener("pointerleave",()=>{
 if(frame){cancelAnimationFrame(frame);frame=0;}
 stage.style.setProperty("--hero-tilt-x","0deg");
 stage.style.setProperty("--hero-tilt-y","0deg");
},{passive:true});
if(toggle)toggle.addEventListener("click",()=>{userPaused=!userPaused;update()});
if(reduced.addEventListener)reduced.addEventListener("change",update);
update();
const revealItems=document.querySelectorAll(".home-path");
if("IntersectionObserver" in window&&!reduced.matches){
 const observer=new IntersectionObserver(entries=>{
  for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add("is-visible");observer.unobserve(entry.target);}
 },{threshold:.12,rootMargin:"0px 0px 24px 0px"});
 revealItems.forEach(item=>{item.classList.add("reveal-ready");observer.observe(item)});
 // Do not hide content if the document was restored with the viewport already below it.
 window.addEventListener("pageshow",()=>{for(const item of revealItems){if(item.getBoundingClientRect().top<window.innerHeight)item.classList.add("is-visible");}},{once:true});
}
})();