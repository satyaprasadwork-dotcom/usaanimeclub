(function(){"use strict";
const usd=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"});
const lab=document.getElementById("manga-form");
if(lab){
 const n=k=>Number(lab.elements.namedItem(k).value);
 function calculate(){
  if(!lab.reportValidity())return;
  const count=n("target"),a=Math.ceil(count/n("coverageA"))*n("priceA")+n("extraA"),b=Math.ceil(count/n("coverageB"))*n("priceB")+n("extraB");
  if(!Number.isFinite(a)||!Number.isFinite(b))return;
  document.getElementById("manga-total-a").textContent=usd.format(a);
  document.getElementById("manga-total-b").textContent=usd.format(b);
  document.getElementById("manga-result").textContent=Math.abs(a-b)<.005?"Both options cost the same under these assumptions.":(a<b?"Option A":"Option B")+" costs "+usd.format(Math.abs(a-b))+" less under these assumptions.";
 }
 lab.addEventListener("submit",e=>{e.preventDefault();calculate()});
 lab.addEventListener("reset",()=>requestAnimationFrame(calculate));calculate();
}
const planner=document.getElementById("anime-plan-form");
if(planner){
 const advice={calm:"Sample a character-led story and check whether the tone suits you.",energy:"Try an action or sports story and check its age guidance.",mystery:"Find a spoiler-safe synopsis before trying a mystery episode.",funny:"Test whether the series' humor fits the kind of evening you want."};
 function calculate(){
  if(!planner.reportValidity())return;
  const total=Number(planner.elements.namedItem("episodes").value)*Number(planner.elements.namedItem("duration").value);
  const weekly=Number(planner.elements.namedItem("weekly").value);
  if(!Number.isFinite(total)||!Number.isFinite(weekly)||weekly<=0)return;
  const weeks=Math.ceil(total/weekly);
  document.getElementById("anime-weeks").textContent=weeks+" "+(weeks===1?"week":"weeks");
  document.getElementById("anime-hours").textContent="Approximately "+(total/60).toFixed(1)+" hours of episodes in total.";
  document.getElementById("anime-advice").textContent=advice[planner.elements.namedItem("mood").value]||advice.calm;
 }
 planner.addEventListener("submit",e=>{e.preventDefault();calculate()});
 planner.addEventListener("reset",()=>requestAnimationFrame(calculate));calculate();
}
})();
