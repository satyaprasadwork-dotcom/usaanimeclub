(()=>{
  "use strict";
  // Visitor-local clock: browser timezone, no location permission or external time service.
  const clock=document.getElementById("local-clock");
  if(clock){
    const formatter=new Intl.DateTimeFormat("en-US",{hour:"numeric",minute:"2-digit",timeZoneName:"short"});
    const updateClock=()=>{
      const now=new Date();
      clock.dateTime=now.toISOString();
      clock.textContent=formatter.format(now);
      clock.title="Current time in your device's local time zone";
    };
    updateClock();
    window.setInterval(updateClock,30_000);
    document.addEventListener("visibilitychange",()=>{if(!document.hidden)updateClock()});
  }
  const toggle=document.querySelector("[data-menu-toggle]");
  const nav=document.querySelector("[data-nav]");
  const closeMenu=()=>{if(toggle&&nav){toggle.setAttribute("aria-expanded","false");nav.classList.remove("is-open")}};
  if(toggle&&nav){
    toggle.addEventListener("click",()=>{
      const next=toggle.getAttribute("aria-expanded")!=="true";
      toggle.setAttribute("aria-expanded",String(next));
      nav.classList.toggle("is-open",next);
    });
    nav.addEventListener("click",e=>{if(e.target.closest("a"))closeMenu()});
    document.addEventListener("click",e=>{if(!nav.contains(e.target)&&!toggle.contains(e.target))closeMenu()});
    document.addEventListener("keydown",e=>{if(e.key==="Escape"&&nav.classList.contains("is-open")){closeMenu();toggle.focus()}});
  }
  const buttons=[...document.querySelectorAll("[data-category]")];
  // Only archive story cards belong to the archive filter. The ticker and lead
  // story also carry category data and must never be hidden or counted here.
  const cards=[...document.querySelectorAll(".archive-grid .news-card[data-news-category]")];
  const search=document.querySelector("[data-news-search]");
  if(cards.length&&buttons.length){
    const available=buttons.map(b=>b.dataset.category);
    const params=new URLSearchParams(location.search);
    let category=available.includes(params.get("category"))?params.get("category"):"All";
    function apply(){
      const query=(search?.value||"").trim().toLocaleLowerCase();
      let count=0;
      buttons.forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.category===category)));
      cards.forEach(card=>{
        const visible=(category==="All"||card.dataset.newsCategory===category)&&(!query||card.textContent.toLocaleLowerCase().includes(query));
        card.hidden=!visible;if(visible)count++;
      });
      const status=document.getElementById("filter-status");
      if(status)status.textContent=count+" stor"+(count===1?"y":"ies")+" shown on this page";
      const empty=document.getElementById("no-results");if(empty)empty.hidden=count>0;
    }
    buttons.forEach(button=>button.addEventListener("click",()=>{
      category=button.dataset.category;
      const url=new URL(location.href);
      if(category==="All")url.searchParams.delete("category");else url.searchParams.set("category",category);
      history.replaceState(null,"",url);
      apply();
    }));
    if(search)search.addEventListener("input",apply);
    apply();
  }
})();
