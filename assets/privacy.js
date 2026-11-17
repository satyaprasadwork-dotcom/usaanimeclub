(()=>{
"use strict";
// Shared GA4/Clarity loader. The document head sets Google's global default
// and region-specific consent defaults before this deferred file executes.
// Never use a GA4 G- measurement ID in a GTM container (gtm.js) URL.
const ID="G-G0TNMR0FQL",CLARITY="yyqq9cryjc";
const CHOICE="usa-anime-club-analytics-choice-v2";
const LEGACY="usa-anime-club-analytics-consent-v1";
const LEGACY_OPT="usa-anime-club-analytics-opt-out-v1";
window.dataLayer=window.dataLayer||[];
window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};
function getChoice(){
  try {
    const current=localStorage.getItem(CHOICE);
    if(current==="granted"||current==="denied")return current;
    if(localStorage.getItem(LEGACY_OPT)==="true"||["declined","basic"].includes(localStorage.getItem(LEGACY)))return "denied";
  } catch (_) { /* Browser storage may be unavailable. */ }
  return null;
}
function clarityConsent(choice){
  if(typeof window.clarity==="function")
    window.clarity("consentv2",{ad_Storage:"denied",analytics_Storage:choice});
}
const saved=getChoice();
// An explicit current browser choice overrides the region-specific default;
// silence never grants optional analytics in EEA/UK/CH regions.
if(saved)window.gtag("consent","update",{analytics_storage:saved});
window.gtag("js",new Date());
window.gtag("config",ID,{anonymize_ip:true,send_page_view:true});
const ga=document.createElement("script");
ga.async=true;
ga.src="https://www.googletagmanager.com/gtag/js?id="+encodeURIComponent(ID);
document.head.appendChild(ga);
(function(c,l,a,r,i,t,y){
  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
  if(saved)clarityConsent(saved);
  t=l.createElement(r);t.async=true;
  t.src="https://www.clarity.ms/tag/"+i;
  y=l.getElementsByTagName(r)[0];
  y.parentNode.insertBefore(t,y);
})(window,document,"clarity","script",CLARITY);
function initChoiceControls(){
  const message=document.querySelector("[data-analytics-status]");
  const buttons=Array.from(document.querySelectorAll("[data-analytics-choice]"));
  if(!message||!buttons.length)return;
  const status=()=>{
    const choice=getChoice();
    message.textContent=choice==="granted"
      ?"Optional analytics allowed on this browser."
      :choice==="denied"
      ?"Optional analytics rejected on this browser."
      :"No explicit choice saved. Applicable regional defaults apply.";
    buttons.forEach(b=>b.setAttribute("aria-pressed",String(b.getAttribute("data-analytics-choice")===choice)));
  };
  status();
  buttons.forEach(b=>b.addEventListener("click",()=>{
    const choice=b.getAttribute("data-analytics-choice");
    if(choice!=="granted"&&choice!=="denied")return;
    let savedChoice=false;
    try {
      localStorage.setItem(CHOICE,choice);
      // A new affirmative choice supersedes earlier testing-era preferences.
      localStorage.removeItem(LEGACY);
      localStorage.removeItem(LEGACY_OPT);
      savedChoice=true;
    } catch (_) {}
    window.gtag("consent","update",{analytics_storage:choice});
    clarityConsent(choice);
    if(savedChoice)window.location.reload();
    else {
      message.textContent="Choice applied for this visit. Your browser did not allow saving this preference.";
    }
  }));
}
if(typeof document.addEventListener==="function"){
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initChoiceControls);
  else initChoiceControls();
}
})();
