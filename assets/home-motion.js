(function(){
"use strict";
// Navigation and search must initialize even if the optional animated hero is unavailable.
const stage=document.querySelector("[data-hero-stage]");
if(stage){
 const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
 const finePointer=window.matchMedia("(hover: hover) and (pointer: fine)");
 const button=stage.querySelector("[data-motion-toggle]");
 const label=stage.querySelector("[data-motion-label]");
 const icon=stage.querySelector(".hero-motion-icon");
 let userPaused=false,frame=0;
 const setMotion=()=>{
  const running=!userPaused&&!reduced.matches;
  stage.dataset.motion=running?"on":"off";
  if(button){
   button.setAttribute("aria-pressed",String(!running));
   button.setAttribute("aria-label",running?"Pause decorative animation":"Resume decorative animation");
  }
  if(label)label.textContent=running?"Pause motion":"Play motion";
  if(icon)icon.textContent=running?"Ⅱ":"▶";
 };
 button?.addEventListener("click",()=>{userPaused=!userPaused;setMotion()});
 reduced.addEventListener?.("change",setMotion);
 setMotion();
 if(finePointer.matches){
  stage.addEventListener("pointermove",event=>{
   if(stage.dataset.motion!=="on"||frame)return;
   frame=requestAnimationFrame(()=>{
    const rect=stage.getBoundingClientRect();
    stage.style.setProperty("--pointer-glow",Math.round((event.clientX-rect.left)/rect.width*100)+"%");
    frame=0;
   });
  },{passive:true});
  stage.addEventListener("pointerleave",()=>stage.style.removeProperty("--pointer-glow"),{passive:true});
 }
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
query?.addEventListener("input",filterSearch);
if(search&&openSearch){
 openSearch.addEventListener("click",()=>{
  if(typeof search.showModal!=="function"){window.location.assign("/guides/");return;}
  if(!search.open)search.showModal();
  filterSearch();query?.focus();
 });
 search.addEventListener("click",event=>{if(event.target===search)search.close()});
}
const drops=[...document.querySelectorAll(".uac-nav-drop")];
const hoverMenus=window.matchMedia("(hover: hover) and (pointer: fine)");
const closeMenus=(except=null)=>{
 for(const menu of drops)if(menu!==except)menu.open=false;
};
for(const menu of drops){
 const summary=menu.querySelector("summary");
 // The summary remains an ordinary clickable, keyboard-operable HTML control.
 // Hover is an enhancement, never a condition for opening navigation.
 menu.addEventListener("pointerenter",event=>{
  if(!hoverMenus.matches||event.pointerType!=="mouse")return;
  closeMenus(menu);menu.open=true;
 });
 menu.addEventListener("pointerleave",event=>{
  if(hoverMenus.matches&&event.pointerType==="mouse"&&!menu.contains(document.activeElement))menu.open=false;
 });
 menu.addEventListener("toggle",()=>{if(menu.open)closeMenus(menu)});
 menu.addEventListener("focusout",event=>{
  if(!menu.contains(event.relatedTarget)&&!menu.matches(":hover"))menu.open=false;
 });
 summary?.addEventListener("click",()=>{
  // On click allow native details toggling, including closing an open menu.
  // If opened by keyboard, the rest of the menu remains keyboard navigable.
  for(const other of drops)if(other!==menu)other.open=false;
 });
}
const mobile=document.querySelector(".uac-mobile-menu");
mobile?.addEventListener("toggle",()=>{if(mobile.open)closeMenus()});
document.addEventListener("pointerdown",event=>{
 if(!event.target.closest(".uac-header-nav, .uac-mobile-menu")){closeMenus();if(mobile)mobile.open=false;}
});
document.addEventListener("keydown",event=>{
 if(event.key!=="Escape")return;
 const active=drops.find(menu=>menu.open);
 closeMenus();
 if(mobile?.open){mobile.open=false;mobile.querySelector("summary")?.focus();}
 else if(active?.contains(document.activeElement))active.querySelector("summary")?.focus();
 if(search?.open)search.close();
});
})();
