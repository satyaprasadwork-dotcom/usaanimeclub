(()=>{"use strict";
const KEY="usa-anime-club-analytics-consent-v1",ID="G-G0TNMR0FQL",CLARITY="yyqq9cryjc";
const banner=document.getElementById("privacy-banner");if(!banner)return;
let accepted=false,loaded=false;
const consent={analytics_storage:"denied",ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied"};
window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments)};
window.gtag("consent","default",consent);
function start(){if(loaded)return;loaded=true;accepted=true;
window.gtag("consent","update",{analytics_storage:"granted",ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied"});
window.gtag("js",new Date());window.gtag("config",ID,{anonymize_ip:true});
const g=document.createElement("script");g.async=true;g.src="https://www.googletagmanager.com/gtag/js?id="+encodeURIComponent(ID);document.head.appendChild(g);
(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script",CLARITY);
}
function save(value){try{localStorage.setItem(KEY,value)}catch(e){}banner.hidden=true;if(value==="accepted")start();else{window.gtag("consent","update",consent);if(accepted){window.location.reload()}}}
let stored=null;try{stored=localStorage.getItem(KEY)}catch(e){}
if(stored==="accepted")start();else if(stored!=="declined")banner.hidden=false;
document.querySelectorAll("[data-consent-accept]").forEach(x=>x.addEventListener("click",()=>save("accepted")));
document.querySelectorAll("[data-consent-decline]").forEach(x=>x.addEventListener("click",()=>save("declined")));
document.querySelectorAll("[data-privacy-choices]").forEach(x=>x.addEventListener("click",()=>{banner.hidden=false;banner.querySelector("button")?.focus()}));
})();
