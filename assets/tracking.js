/* USA Anime Club: one shared analytics integration for every page.
   AdSense site ownership verification is the meta tag in templates/layout.html.
   Do not enable ad serving here until AdSense review and applicable CMP setup. */
(function(window,document){
"use strict";
const CONFIG=Object.freeze({
  adsensePublisher:"ca-pub-7937216909291905",
  ga4MeasurementId:"G-G0TNMR0FQL",
  clarityProjectId:"yyqq9cryjc"
});
const CONSENT_KEY="uac-analytics-consent";
let initialized=false;
function preference(){try{return localStorage.getItem(CONSENT_KEY)}catch{return null}}
function save(value){try{localStorage.setItem(CONSENT_KEY,value)}catch{}}
function loadOnce(service,src){
  if(document.querySelector('script[data-uac-service="'+service+'"]'))return;
  const script=document.createElement("script");
  script.setAttribute("data-uac-service",service);
  script.async=true;
  script.src=src;
  document.head.appendChild(script);
}
function init(){
  if(initialized||preference()!=="yes")return;
  initialized=true;
  window.dataLayer=window.dataLayer||[];
  window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};
  window.gtag("consent","default",{
    analytics_storage:"denied",
    ad_storage:"denied",
    ad_user_data:"denied",
    ad_personalization:"denied"
  });
  window.gtag("consent","update",{analytics_storage:"granted"});
  window.gtag("js",new Date());
  window.gtag("config",CONFIG.ga4MeasurementId);
  loadOnce("ga4","https://www.googletagmanager.com/gtag/js?id="+CONFIG.ga4MeasurementId);
  (function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;
    t.setAttribute("data-uac-service","clarity");
    t.src="https://www.clarity.ms/tag/"+i+"?ref=bwt";
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  })(window,document,"clarity","script",CONFIG.clarityProjectId);
}
const api=Object.freeze({
  ids:CONFIG,
  preference,
  init,
  accept(){save("yes");init()},
  decline(){const hadConsent=preference()==="yes";save("no");return hadConsent}
});
window.UACTracking=api;
if(preference()==="yes")init();
})(window,document);
