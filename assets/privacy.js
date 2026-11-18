/* Legacy compatibility for cached HTML generated before direct site-wide tags.
 * Current pages initialize GA4 and Clarity once in scripts/build.mjs.
 */
(()=>{
  "use strict";
  if(window.__usaAnimeClubLegacyTrackingLoaded)return;
  window.__usaAnimeClubLegacyTrackingLoaded=true;
  const GA_ID="G-G0TNMR0FQL",CLARITY_ID="yyqq9cryjc";
  window.dataLayer=window.dataLayer||[];
  window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};
  window.gtag("js",new Date());
  window.gtag("config",GA_ID,{send_page_view:true});
  const ga=document.createElement("script");
  ga.async=true;
  ga.src="https://www.googletagmanager.com/gtag/js?id="+GA_ID;
  document.head.appendChild(ga);
  (function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  })(window,document,"clarity","script",CLARITY_ID);
})();
