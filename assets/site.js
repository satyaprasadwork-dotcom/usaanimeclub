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
if(toggle)toggle.addEventListener("click",()=>{
 const dark=root.dataset.theme==="dark"||(!root.dataset.theme&&window.matchMedia?.("(prefers-color-scheme: dark)").matches);
 root.dataset.theme=dark?"light":"dark";store.set("uac-theme",root.dataset.theme);
});
const chooser=document.querySelector("[data-guide-filters]");
function choose(category){
 if(!chooser)return;
 chooser.querySelectorAll("[data-category]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.category===category)));
 document.querySelectorAll(".guide-card[data-category]").forEach(card=>{card.hidden=category!=="All"&&card.dataset.category!==category});
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
const panel=document.getElementById("consent-panel");
const accept=document.getElementById("accept-optional");
const decline=document.getElementById("reject-optional");
const privacy=document.getElementById("privacy-reopen");
function enableAnalytics(){
 if(window.__uacAnalyticsLoaded)return;
 window.__uacAnalyticsLoaded=true;
 window.dataLayer=window.dataLayer||[];
 window.gtag=function(){window.dataLayer.push(arguments)};
 window.gtag("consent","default",{analytics_storage:"denied",ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied"});
 window.gtag("consent","update",{analytics_storage:"granted"});
 window.gtag("js",new Date());
 window.gtag("config","G-G0TNMR0FQL");
 const g=document.createElement("script");g.async=true;g.src="https://www.googletagmanager.com/gtag/js?id=G-G0TNMR0FQL";document.head.appendChild(g);
 (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i+"?ref=bwt";y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script","yyqq9cryjc");
}
const choice=store.get("uac-analytics-consent");
if(choice==="yes")enableAnalytics();
else if(choice!=="no"&&panel)panel.hidden=false;
if(privacy&&panel)privacy.addEventListener("click",()=>{panel.hidden=false;accept?.focus()});
if(accept&&panel)accept.addEventListener("click",()=>{store.set("uac-analytics-consent","yes");panel.hidden=true;enableAnalytics()});
if(decline&&panel)decline.addEventListener("click",()=>{
 const wasAllowed=store.get("uac-analytics-consent")==="yes";
 store.set("uac-analytics-consent","no");panel.hidden=true;
 if(wasAllowed)location.reload();
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