(()=>{
"use strict";
// No analytics-consent banner. New visitors receive only cookieless measurement.
// Preserve the choices visitors explicitly made before this change.
const LEGACY_KEY="usa-anime-club-analytics-consent-v1";
const OPT_OUT_KEY="usa-anime-club-analytics-opt-out-v1";
const ID="G-G0TNMR0FQL",CLARITY="yyqq9cryjc";
const control=document.querySelector("[data-analytics-toggle]");
const acceptControl=document.querySelector("[data-analytics-accept]");
const read=key=>{try{return localStorage.getItem(key)}catch(e){return null}};
const write=(key,value)=>{try{localStorage.setItem(key,value);return true}catch(e){return false}};
const legacy=read(LEGACY_KEY),disabled=read(OPT_OUT_KEY)==="true"||legacy==="declined";
const previouslyAccepted=!disabled&&legacy==="accepted";
// Consent Mode defaults (including analytics_storage: denied) are set synchronously
// in the shared page head before any Google tags or AdSense scripts execute.
window.dataLayer=window.dataLayer||[];
window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};
function clarityConsent(state){
  if(typeof window.clarity==="function"){
    window.clarity("consentv2",{ad_Storage:"denied",analytics_Storage:state});
  }
}
function start(){
  if(previouslyAccepted)window.gtag("consent","update",{analytics_storage:"granted"});
  window.gtag("js",new Date());
  window.gtag("config",ID,{anonymize_ip:true,send_page_view:true});
  const ga=document.createElement("script");
  ga.async=true;
  ga.src="https://www.googletagmanager.com/gtag/js?id="+encodeURIComponent(ID);
  document.head.appendChild(ga);

  // Clarity automatically measures navigation, interaction and session behavior.
  // Restricted mode remains cookieless without affirmative analytics consent.
  // Neither provider needs a second, hand-built event collector for standard tracking.
  (function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    clarityConsent(previouslyAccepted?"granted":"denied");
    t=l.createElement(r);t.async=true;
    t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];
    y.parentNode.insertBefore(t,y);
  })(window,document,"clarity","script",CLARITY);
}
if(control){
  control.textContent=disabled?"Enable basic analytics":"Disable analytics";
  control.setAttribute("aria-pressed",String(disabled));
  control.addEventListener("click",()=>{
    const nextDisabled=!disabled;
    // Persist the opt-out before reloading so GA4 and Clarity do not start.
    // On re-enable, use the cookieless mode, never restore a prior cookie grant.
    if(!write(OPT_OUT_KEY,nextDisabled?"true":"false")||!write(LEGACY_KEY,nextDisabled?"declined":"basic")){
      control.textContent="Privacy settings unavailable";
      return;
    }
    if(nextDisabled){
      window.gtag("consent","update",{analytics_storage:"denied"});
      clarityConsent("denied");
    }
    window.location.reload();
  });
}
if(acceptControl){
  acceptControl.disabled=previouslyAccepted;
  acceptControl.textContent=previouslyAccepted?"Full analytics enabled":"Enable full analytics";
  acceptControl.addEventListener("click",()=>{
    if(!write(LEGACY_KEY,"accepted")||!write(OPT_OUT_KEY,"false")){
      acceptControl.textContent="Privacy settings unavailable";return;
    }
    window.gtag("consent","update",{analytics_storage:"granted"});
    clarityConsent("granted");
    window.location.reload();
  });
}
if(!disabled)start();
})();
