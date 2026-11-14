(()=>{"use strict";
const toggle=document.querySelector("[data-menu-toggle]"),nav=document.querySelector("[data-nav]");
if(toggle&&nav){toggle.addEventListener("click",()=>{const expanded=toggle.getAttribute("aria-expanded")==="true";toggle.setAttribute("aria-expanded",String(!expanded));nav.classList.toggle("is-open",!expanded)});nav.addEventListener("click",e=>{if(e.target.closest("a")){toggle.setAttribute("aria-expanded","false");nav.classList.remove("is-open")}})}
const buttons=[...document.querySelectorAll("[data-category]")],cards=[...document.querySelectorAll("[data-news-category]")];
buttons.forEach(button=>button.addEventListener("click",()=>{const cat=button.dataset.category;buttons.forEach(b=>b.setAttribute("aria-pressed",String(b===button)));cards.forEach(card=>{card.hidden=cat!=="All"&&card.dataset.newsCategory!==cat});const count=cards.filter(c=>!c.hidden).length;const status=document.getElementById("filter-status");if(status)status.textContent=count+" stor"+(count===1?"y":"ies")+" shown"}));
const hero=document.querySelector(".hero"),panel=document.getElementById("pg");
if(hero&&panel&&matchMedia("(prefers-reduced-motion: no-preference)").matches){hero.addEventListener("pointermove",e=>{if(e.pointerType==="touch")return;const r=hero.getBoundingClientRect();panel.style.setProperty("--ry",((e.clientX-r.left)/r.width-.5)*24+"deg");panel.style.setProperty("--rx",-((e.clientY-r.top)/r.height-.5)*16+"deg")},{passive:true})}
})();
