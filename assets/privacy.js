(()=>{
"use strict";
// Load GA4 and Clarity consistently for every page visit.
// The page head sets region-specific consent before tags are loaded.
// Any recorded analytics opt-out remains in force.
const ID="G-G0TNMR0FQL",CLARITY="yyqq9cryjc";
// Consent Mode defaults (including analytics_storage: denied) are set synchronously
// in the shared page head before any Google tags or AdSense scripts execute.
window.dataLayer=window.dataLayer||[];
window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};
function optedOut(){
  try {
    return localStorage.getItem("usa-anime-club-analytics-opt-out-v1")==="true"
      || ["declined","basic"].includes(localStorage.getItem("usa-anime-club-analytics-consent-v1"));
  } catch (_) { return false; }
}
function start(){
  const denied=optedOut();
  if(denied)window.gtag("consent","update",{analytics_storage:"denied"});
  window.gtag("js",new Date());
  window.gtag("config",ID,{anonymize_ip:true,send_page_view:true});
  const ga=document.createElement("script");
  ga.async=true;
  ga.src="https://www.googletagmanager.com/gtag/js?id="+encodeURIComponent(ID);
  document.head.appendChild(ga);

  // Clarity uses normal measurement except where its regional consent rules apply.
  // Honor any recorded decline; avoid duplicating its built-in event collection.
  (function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    if(denied)c[a]("consentv2",{ad_Storage:"denied",analytics_Storage:"denied"});
    t=l.createElement(r);t.async=true;
    t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];
    y.parentNode.insertBefore(t,y);
  })(window,document,"clarity","script",CLARITY);
}
start();
})();
