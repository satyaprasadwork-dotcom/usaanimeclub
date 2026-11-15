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
  const tickerButton=document.querySelector("[data-ticker-toggle]");
  if(tickerButton){
    const ticker=tickerButton.closest(".news-ticker");
    tickerButton.addEventListener("click",()=>{
      const paused=ticker?.classList.toggle("is-paused")||false;
      tickerButton.setAttribute("aria-pressed",String(paused));
      tickerButton.setAttribute("aria-label",paused?"Resume scrolling news headlines":"Pause scrolling news headlines");
      tickerButton.textContent=paused?"Resume":"Pause";
    });
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
      const fullCategory=document.getElementById("category-all-link");
      if(fullCategory){
        const categoryRoutes={"Anime":"anime","Manga":"manga","Manhwa":"manhwa","Web Novels":"web-novels"};
        fullCategory.hidden=category==="All"||!categoryRoutes[category];
        if(!fullCategory.hidden){
          fullCategory.href="/news/category/"+categoryRoutes[category]+"/";
          fullCategory.textContent="See all "+category+" reports";
        }
      }
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
}
  // Editorial interaction analytics (GA4 + Clarity).
  // These are additional first-party interactions, not replacements for either
  // provider's automatic page/scroll/click measurement. Never send search terms,
  // form fields, article text, email addresses, URL queries or personal data.
  // The consent-aware shared loader controls whether these calls are sent.
  if(typeof window.addEventListener==="function"&&typeof document.addEventListener==="function"){
    const pathname=location.pathname||"/";
    const pageGroup=pathname==="/"
      ?"home":pathname.startsWith("/reviews/manga/")?"manga_reviews"
      :pathname.startsWith("/reviews/anime/")?"anime_reviews"
      :pathname.startsWith("/reviews/")?"reviews"
      :pathname.startsWith("/news/")?"news":"site_pages";
    const readingPage=Boolean(document.querySelector(".article-primary, .review-article-prose"));
    window.usaAnimeAnalyticsContext={page_group:pageGroup,content_type:readingPage?"editorial":"collection"};
    const track=(name,params={})=>window.usaAnimeAnalytics?.track?.(name,{
      page_group:pageGroup,...params
    });
    const safePath=value=>{
      if(typeof value!=="string"||!value.startsWith("/"))return "";
      return value.slice(0,128);
    };
    const area=anchor=>anchor.closest(".news-ticker")?"ticker"
      :anchor.closest(".archive-grid")?"archive"
      :anchor.closest(".review-grid")?"chapter_grid"
      :anchor.closest(".related-section, .review-related")?"related"
      :anchor.closest(".latest-rail")?"latest_rail"
      :anchor.closest(".review-chapter-nav")?"chapter_navigation"
      :anchor.closest(".crumbs")?"breadcrumbs"
      :anchor.closest("header")?"header"
      :anchor.closest("footer")?"footer"
      :"main";
    document.addEventListener("click",event=>{
      const element=event.target;
      if(!element?.closest)return;
      const category=element.closest("[data-category]");
      if(category){
        const value=category.dataset.category;
        if(["All","Anime","Manga","Manhwa","Web Novels"].includes(value))
          track("category_filter_select",{category:value.toLowerCase().replaceAll(" ","_")});
        return;
      }
      if(element.closest("[data-ticker-toggle]")){
        track("ticker_control_click");
        return;
      }
      if(element.closest("[data-menu-toggle]")){
        track("mobile_menu_click");
        return;
      }
      if(element.closest("[data-analytics-toggle]"))return;
      const anchor=element.closest("a[href]");
      if(!anchor)return;
      const href=anchor.getAttribute("href");
      if(!href||href.startsWith("#")){
        if(href?.startsWith("#"))track("table_of_contents_click");
        return;
      }
      if(href.startsWith("mailto:")){
        track("contact_link_click",{source_area:area(anchor)});
        return;
      }
      if(href.startsWith("tel:"))return;
      let url;
      try{url=new URL(href,location.href)}catch{return}
      if(!["https:","http:"].includes(url.protocol))return;
      if(url.origin!==location.origin){
        track("outbound_reference_click",{
          source_area:area(anchor),
          destination_domain:url.hostname.slice(0,100)
        });
        return;
      }
      const kind=anchor.matches(".news-card, .feature-card, .latest-item, .review-published-card")
        ?"content_card_open"
        :anchor.matches(".review-series-card")?"series_open"
        :"site_navigation_click";
      track(kind,{
        source_area:area(anchor),
        destination_path:safePath(url.pathname)
      });
    },{passive:true});

    const searchInput=document.querySelector("[data-news-search]");
    if(searchInput){
      // Log only a completed search interaction, never the entered query.
      const noteSearch=()=>{
        const hasTerm=(searchInput.value||"").trim().length>=2;
        if(!hasTerm)return;
        const shown=[...document.querySelectorAll(".archive-grid .news-card")].filter(card=>!card.hidden).length;
        track("archive_search_used",{result_count:shown});
      };
      searchInput.addEventListener("change",noteSearch);
    }

    if(readingPage){
      const milestones=new Set();
      const checkDepth=()=>{
        const doc=document.documentElement;
        const max=Math.max(0,doc.scrollHeight-window.innerHeight);
        if(max<=0)return;
        const depth=Math.min(100,Math.floor(100*window.scrollY/max));
        for(const threshold of [25,50,75,100]){
          if(depth>=threshold&&!milestones.has(threshold)){
            milestones.add(threshold);
            track("editorial_read_depth",{percent_scrolled:threshold});
          }
        }
      };
      window.addEventListener("scroll",checkDepth,{passive:true});
      // Report engaged time while the page is visible. Avoid per-second events.
      let activeSeconds=0;
      const timed=new Set();
      window.setInterval(()=>{
        if(document.hidden)return;
        activeSeconds+=5;
        for(const threshold of [15,30,60,120]){
          if(activeSeconds>=threshold&&!timed.has(threshold)){
            timed.add(threshold);
            track("editorial_read_time",{engaged_seconds:threshold});
          }
        }
      },5000);
    }

    document.addEventListener("copy",()=>track("page_copy_action"));
    window.addEventListener("beforeprint",()=>track("page_print_action"));
    // Do not capture error messages, search text, input values or session IDs.
    window.addEventListener("error",()=>track("client_script_error"));
  }
})();
