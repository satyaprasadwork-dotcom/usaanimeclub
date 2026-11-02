(function(){
"use strict";
const root=document.documentElement;
const toggle=document.getElementById("theme-toggle");
const storedTheme=localStorage.getItem("uac-theme");
if(storedTheme==="dark"||storedTheme==="light")root.dataset.theme=storedTheme;
if(toggle)toggle.addEventListener("click",()=>{const dark=root.dataset.theme==="dark"||(!root.dataset.theme&&matchMedia("(prefers-color-scheme:dark)").matches);root.dataset.theme=dark?"light":"dark";localStorage.setItem("uac-theme",root.dataset.theme)});
const chooser=document.querySelector("[data-guide-filters]");
if(chooser)chooser.addEventListener("click",(e)=>{const b=e.target.closest("button[data-category]");if(!b)return;const selected=b.dataset.category;chooser.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));document.querySelectorAll(".guide-card[data-category]").forEach(card=>{card.hidden=selected!=="All"&&card.dataset.category!==selected})});
if(chooser&&location.hash){const cat=decodeURIComponent(location.hash.slice(1));const b=Array.from(chooser.querySelectorAll("button[data-category]")).find(x=>x.dataset.category.toLowerCase()===cat.toLowerCase());if(b)b.click();}
const panel=document.getElementById("consent-panel");const accepted=localStorage.getItem("uac-analytics-consent");
function enableMeasurement(){if(window.uacMeasurementLoaded)return;window.uacMeasurementLoaded=true;gtag("consent","update",{analytics_storage:"granted"});const ga=document.createElement("script");ga.async=true;ga.src="https://www.googletagmanager.com/gtag/js?id=G-G0TNMR0FQL";document.head.appendChild(ga);gtag("js",new Date());gtag("config","G-G0TNMR0FQL",{anonymize_ip:true});(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i+"?ref=bwt";y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script","yyqq9cryjc")}
if(accepted==="yes")enableMeasurement();else if(accepted!=="no"&&panel)panel.hidden=false;
const privacyReopen=document.getElementById("privacy-reopen");
if(privacyReopen&&panel)privacyReopen.addEventListener("click",()=>{panel.hidden=false;document.getElementById("accept-optional")?.focus()});
const accept=document.getElementById("accept-optional");const decline=document.getElementById("reject-optional");
if(accept)accept.addEventListener("click",()=>{localStorage.setItem("uac-analytics-consent","yes");panel.hidden=true;enableMeasurement()});
if(decline)decline.addEventListener("click",()=>{const wasAllowed=localStorage.getItem("uac-analytics-consent")==="yes";localStorage.setItem("uac-analytics-consent","no");panel.hidden=true;if(wasAllowed)location.reload()});
})();