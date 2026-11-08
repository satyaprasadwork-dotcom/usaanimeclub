(function(){
"use strict";
const root=document.documentElement;
const store={
 get(key){try{return localStorage.getItem(key)}catch{return null}},
 set(key,val){try{localStorage.setItem(key,val)}catch{}}
};
const toggle=document.getElementById("theme-toggle");
const saved=store.get("uac-theme");
if(saved==="dark"||saved==="light")root.dataset.theme=saved;
function reflectTheme(){
 if(!toggle)return;
 const dark=root.dataset.theme==="dark"||(!root.dataset.theme&&window.matchMedia?.("(prefers-color-scheme: dark)").matches);
 toggle.setAttribute("aria-pressed",String(dark));
 toggle.setAttribute("aria-label",dark?"Switch to light theme":"Switch to dark theme");
}
reflectTheme();
if(toggle)toggle.addEventListener("click",()=>{
 const dark=root.dataset.theme==="dark"||(!root.dataset.theme&&window.matchMedia?.("(prefers-color-scheme: dark)").matches);
 root.dataset.theme=dark?"light":"dark";store.set("uac-theme",root.dataset.theme);reflectTheme();
});
window.matchMedia?.("(prefers-color-scheme: dark)")?.addEventListener?.("change",reflectTheme);
const chooser=document.querySelector("[data-guide-filters]");
function choose(category){
 if(!chooser)return;
 chooser.querySelectorAll("[data-category]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.category===category)));
 let count=0;
 document.querySelectorAll(".guide-card[data-category]").forEach(card=>{
  card.hidden=category!=="All"&&card.dataset.category!==category;
  if(!card.hidden)count++;
 });
 const status=document.querySelector("[data-guide-count]");
 if(status)status.textContent=count+" "+(count===1?"guide":"guides")+" "+(category==="All"?"available":"in "+category);
}
if(chooser){
 chooser.addEventListener("click",event=>{
  const b=event.target.closest("button[data-category]");
  if(!b||!chooser.contains(b))return;
  choose(b.dataset.category);
  if(history.replaceState)history.replaceState(null,"",b.dataset.category==="All"?location.pathname:"#"+encodeURIComponent(b.dataset.category));
 });
 if(location.hash){let cat;try{cat=decodeURIComponent(location.hash.slice(1))}catch{cat=""}
  const b=Array.from(chooser.querySelectorAll("button[data-category]")).find(x=>x.dataset.category.toLowerCase()===cat.toLowerCase());
  if(b)choose(b.dataset.category);
 }
}
/* Instant, client-side search across all 23 real tool cards. */
const toolFilter=document.querySelector("[data-tool-filter]");
const toolCards=[...document.querySelectorAll("[data-tool-card]")];
const toolCount=document.querySelector("[data-tool-count]");
if(toolFilter&&toolCards.length){
 const filter=()=>{
  const q=toolFilter.value.trim().toLocaleLowerCase();
  let count=0;
  for(const item of toolCards){
   const visible=item.dataset.title.includes(q);
   item.hidden=!visible;
   if(visible)count++;
  }
  if(toolCount)toolCount.textContent=count+" "+(count===1?"tool":"tools")+" match";
 };
 toolFilter.addEventListener("input",filter);filter();
}
/* UI for the single, consent-aware tracking service. No tracker is loaded here. */
const panel=document.getElementById("consent-panel");
const accept=document.getElementById("accept-optional");
const decline=document.getElementById("reject-optional");
const privacy=document.getElementById("privacy-reopen");
const measurement=window.UACTracking;
if(panel&&measurement&&measurement.preference()===null)panel.hidden=false;
let privacyInvoked=false;
function closePrivacy(){panel.hidden=true;if(privacyInvoked){privacy?.focus();privacyInvoked=false}}
if(panel)panel.addEventListener("keydown",event=>{
 if(event.key==="Escape"&&measurement?.preference()!==null){event.preventDefault();closePrivacy()}
});
if(privacy&&panel)privacy.addEventListener("click",()=>{
  panel.hidden=false;
  privacyInvoked=true;
  accept?.focus();
});
if(accept&&panel)accept.addEventListener("click",()=>{
  measurement?.accept();
  closePrivacy();
});
if(decline&&panel)decline.addEventListener("click",()=>{
  const wasActive=measurement?.decline()??false;
  closePrivacy();
  if(wasActive)location.reload();
});
const budget=document.getElementById("budget-form");
if(budget){
 const money=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"});
 const display=document.getElementById("budget-total");
 const summary=document.getElementById("budget-summary");
 function calculate(){
  let total=0;
  for(const field of budget.querySelectorAll('input[type="number"]')){
   const num=Number(field.value);
   if(!Number.isFinite(num)||num<0||num>100000){
    field.setCustomValidity("Enter an amount between $0 and $100,000.");
    field.reportValidity();return;
   }
   field.setCustomValidity("");total+=num;
  }
  display.textContent=money.format(total);
  summary.textContent=total?"A planning estimate, not a live price. Check current costs at the source.":"Enter your expected costs to see the total.";
 }
 budget.addEventListener("submit",e=>{e.preventDefault();calculate()});
 budget.addEventListener("input",e=>{if(e.target.matches('input[type="number"]'))e.target.setCustomValidity("")});
 budget.addEventListener("reset",()=>{requestAnimationFrame(calculate)});
}
})();