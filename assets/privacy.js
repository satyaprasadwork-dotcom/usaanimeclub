(()=>{
"use strict";
const KEY="usa-anime-club-analytics-consent-v1";
const ID="G-G0TNMR0FQL",CLARITY="yyqq9cryjc";
const banner=document.getElementById("privacy-banner");
if(!banner)return;
let accepted=false,loaded=false;

// The page head establishes Google Consent Mode v2 defaults before AdSense.
// Never call "consent","default" again here: this file runs after page parsing.
// Analytics permission never grants advertising consent.
window.dataLayer=window.dataLayer||[];
window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};

function clarityConsent(analytics){
  if(typeof window.clarity==="function"){
    window.clarity("consentv2",{
      ad_Storage:"denied",
      analytics_Storage:analytics
    });
  }
}

function start(){
  if(loaded)return;
  loaded=true;
  accepted=true;
  window.gtag("consent","update",{analytics_storage:"granted"});
  window.gtag("js",new Date());
  window.gtag("config",ID,{anonymize_ip:true});

  const ga=document.createElement("script");
  ga.async=true;
  ga.src="https://www.googletagmanager.com/gtag/js?id="+encodeURIComponent(ID);
  document.head.appendChild(ga);

  // Create Clarity's queue first, pass Consent V2 before loading its script,
  // and leave ad storage denied because this banner grants analytics only.
  (function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    clarityConsent("granted");
    t=l.createElement(r);
    t.async=true;
    t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];
    y.parentNode.insertBefore(t,y);
  })(window,document,"clarity","script",CLARITY);
}

function save(value){
  try{localStorage.setItem(KEY,value)}catch(e){}
  banner.hidden=true;
  if(value==="accepted"){
    start();
  }else{
    window.gtag("consent","update",{analytics_storage:"denied"});
    clarityConsent("denied");
    // Existing analytics scripts cannot be safely unloaded in-place.
    // A reload stops further collection once a previous opt-in is revoked.
    if(accepted)window.location.reload();
  }
}

let stored=null;
try{stored=localStorage.getItem(KEY)}catch(e){}
if(stored==="accepted")start();
else if(stored!=="declined")banner.hidden=false;

document.querySelectorAll("[data-consent-accept]").forEach(button=>button.addEventListener("click",()=>save("accepted")));
document.querySelectorAll("[data-consent-decline]").forEach(button=>button.addEventListener("click",()=>save("declined")));
document.querySelectorAll("[data-privacy-choices]").forEach(button=>button.addEventListener("click",()=>{
  banner.hidden=false;
  banner.querySelector("button")?.focus();
}));
})();
