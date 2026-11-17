(()=>{
"use strict";
// Load GA4 and Clarity consistently for every page visit.
// Old localStorage choices were temporary development/test controls and are no longer used.
// Regional cookie and advertising consent remains independent of this loader.
const ID="G-G0TNMR0FQL",CLARITY="yyqq9cryjc";
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
    clarityConsent("denied");
    t=l.createElement(r);t.async=true;
    t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];
    y.parentNode.insertBefore(t,y);
  })(window,document,"clarity","script",CLARITY);
}
start();
})();
