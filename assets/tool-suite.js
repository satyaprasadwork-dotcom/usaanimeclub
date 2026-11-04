(function(){"use strict";
const app=document.querySelector("[data-tool-app]");
if(!app)return;
const form=app.querySelector("form"),out=app.querySelector("[data-tool-result]"),tool=app.dataset.tool;
const dollar=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"});
const number=name=>Number(value(name)||0);
const value=name=>String(form.elements.namedItem(name)?.value||"").trim();
const checked=name=>!!form.elements.namedItem(name)?.checked;
const safeLink=(label,url)=>({label,url});
const search=(term)=>"https://www.google.com/search?q="+encodeURIComponent(term);
const doc=(name,url)=>safeLink(name,url);
const lines=text=>text.split("\n").map(s=>s.trim()).filter(Boolean);
const listed=text=>lines(text).map(s=>s.split("|").map(x=>x.trim()));
const dateString=d=>new Intl.DateTimeFormat("en-US",{year:"numeric",month:"short",day:"numeric",timeZone:"UTC"}).format(new Date(d+"T12:00:00Z"));
const offset=(date,tz)=>{
 const v=new Intl.DateTimeFormat("en-US",{timeZone:tz,timeZoneName:"shortOffset"}).formatToParts(date).find(x=>x.type==="timeZoneName")?.value||"GMT";
 const m=v.match(/^GMT([+-])(\d{1,2})(?::(\d{2}))?$/);
 return m?(m[1]==="-"?-1:1)*(Number(m[2])*60+Number(m[3]||0)):0;
};
const zonedDate=(datetime,tz)=>{
 const t=Date.parse(datetime+":00Z");
 if(!Number.isFinite(t))throw Error("Enter a valid date and time.");
 let guess=t;
 for(let i=0;i<4;i++)guess=t-offset(new Date(guess),tz)*60000;
 const confirmed=new Intl.DateTimeFormat("sv-SE",{timeZone:tz,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(new Date(guess)).replace(" ","T");
 if(confirmed!==datetime)throw Error("That wall-clock time is missing or ambiguous during a US daylight-saving change. Choose another time.");
 return new Date(guess);
};
const displayTime=(date,tz)=>new Intl.DateTimeFormat("en-US",{timeZone:tz,weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit",timeZoneName:"short"}).format(date);
const timezones=[["Eastern","America/New_York"],["Central","America/Chicago"],["Mountain","America/Denver"],["Pacific","America/Los_Angeles"],["Alaska","America/Anchorage"],["Hawaii","Pacific/Honolulu"]];
const msDay=86400000;
const diffDays=(a,b)=>Math.ceil((Date.parse(a+"T12:00:00Z")-Date.parse(b+"T12:00:00Z"))/msDay);
const fmtDate=d=>new Date(d).toISOString().slice(0,10);
const addDays=(date,n)=>fmtDate(Date.parse(date+"T12:00:00Z")+n*msDay);
const esc=v=>String(v||"").slice(0,250).trim();
const result=(title,paragraphs=[],items=[],links=[])=>{
 out.replaceChildren();
 const h=document.createElement("h2");h.textContent=title;out.append(h);
 for(const p of paragraphs){const node=document.createElement("p");node.textContent=p;out.append(node);}
 if(items.length){const ul=document.createElement("ul");ul.className="tool-result-list";for(const i of items){const li=document.createElement("li");li.textContent=i;ul.append(li);}out.append(ul);}
 if(links.length){const nav=document.createElement("div");nav.className="tool-source-links";const head=document.createElement("h3");head.textContent="Verified-source next steps";nav.append(head);for(const l of links){if(!/^https:\/\//.test(l.url))continue;const a=document.createElement("a");a.href=l.url;a.target="_blank";a.rel="noopener noreferrer";a.textContent=l.label+" ↗";nav.append(a);}out.append(nav);}
 out.hidden=false;
};
const validUS=/^(?:\d{5})(?:-\d{4})?$/;
const first=(v)=>v||"(not supplied)";
function execute(){
 switch(tool){
 case "anime-release-time-converter":{
  const start=value("start"),zone=value("zone");if(!start)throw Error("Enter the confirmed premiere time.");
  const utc=zonedDate(start,zone);
  result("US premiere times",["Converted from "+start.replace("T"," ")+" in "+timezones.find(x=>x[1]===zone)?.[0]+". The input must be an officially confirmed local time."],timezones.map(([name,tz])=>name+": "+displayTime(utc,tz)),[doc("How simulcast timing works","https://www.crunchyroll.com/news/")]);
  break;
 }
 case "cosplay-build-countdown":{
  const deadline=value("deadline");if(!deadline)throw Error("Pick the event date.");
  const today=fmtDate(Date.now()),days=diffDays(deadline,today);if(days<0)throw Error("Choose a future event date.");
  const tasks=["Confirm venue prop and safety rules","Finalize concept, measurements and references","Source or reuse materials","Cut, assemble and fit-test","Practice mobility and finish details","Pack repair kit and check event schedule"];
  const n=tasks.length,plan=tasks.map((name,i)=>addDays(today,Math.floor(Math.max(0,days-1)*i/n))+" — "+name);
  result(days+" days until your event",["Estimated project budget: "+dollar.format(number("budget"))+". Suggested checkpoint dates are planning estimates, not guaranteed completion times."],plan);
  break;
 }
 case "anime-watch-party-scheduler":{
  const date=value("date"),host=value("zone");if(!date)throw Error("Choose a date.");
  const guests=[value("guest1"),value("guest2")].filter(Boolean),start=number("start"),end=number("end");
  const choices=[];for(let hour=start;hour<end;hour++){
   const dateTime=date+"T"+String(hour).padStart(2,"0")+":00";
   let utc;try{utc=zonedDate(dateTime,host)}catch{continue;}
   const times=guests.map(tz=>{const localHour=Number(new Intl.DateTimeFormat("en-US",{timeZone:tz,hour:"2-digit",hourCycle:"h23"}).format(utc));return {tz,hour:localHour};});
   if(times.every(x=>x.hour>=number("guestFrom")&&x.hour<number("guestTo")))choices.push(displayTime(utc,host)+" | "+times.map(t=>t.tz.split("/")[1].replace("_"," ")+": "+displayTime(utc,t.tz)).join(" | "));
  }
  result("Time-zone overlap",["Matching hourly start slots: "+choices.length+". Guest availability is assumed from the common window you entered; confirm their actual schedules."],choices.slice(0,15).length?choices.slice(0,15):["No overlapping hourly slots under these assumptions. Change dates or available hours."]);
  break;
 }
 case "convention-day-planner":{
  const rows=listed(value("events")).filter(x=>x.length>=3);
  const parse=x=>{const m=x?.match(/^([01]\d|2[0-3]):([0-5]\d)$/);return m?Number(m[1])*60+Number(m[2]):NaN;};
  const schedule=rows.map(([start,end,title])=>({start,end,title:esc(title),a:parse(start),b:parse(end)}));
  if(schedule.some(x=>!Number.isFinite(x.a)||!Number.isFinite(x.b)||x.b<=x.a))throw Error("Use START|END|EVENT with 24-hour HH:MM times; each end must be later.");
  schedule.sort((a,b)=>a.a-b.a);
  const conflicts=[];for(let i=0;i<schedule.length;i++)for(let j=i+1;j<schedule.length;j++)if(schedule[j].a<schedule[i].b&&schedule[j].b>schedule[i].a)conflicts.push(schedule[i].title+" overlaps "+schedule[j].title);
  result("Your day at the convention",[(conflicts.length?conflicts.length+" potential schedule conflicts.":"No overlapping event times.")+" Allow extra time for queues, transfers and accessibility breaks."],schedule.map(x=>x.start+"–"+x.end+"  "+x.title).concat(conflicts.map(s=>"Conflict: "+s)));
  break;
 }
 case "convention-packing-checklist":{
  const items=["Ticket or QR code","Photo ID if required","Phone and power bank","Water bottle permitted by venue","Comfortable shoes","Prescription medicines and essentials","Transit, hotel and emergency contacts","Cashless payment plus backup","Earplugs and personal comfort items"];
  if(checked("cosplay"))items.push("Costume, wig, adhesives and repair kit","Venue-approved props","Cosplay mobility test");
  if(checked("overnight"))items.push("Hotel confirmation","Change of clothes","Chargers and toiletries");
  if(checked("access"))items.push("Accessibility arrangements confirmation","Needed assistive items","Rest and quiet-space plan");
  const days=number("days");items.push("Daily meals and hydration plan for "+days+" day(s)");
  result("Packing list",["Review the host convention's official bag, prop and accessibility policies before travel."],items);
  break;
 }
 case "spoiler-safe-episode-tracker":{
  const title=esc(value("title")),total=number("total"),seen=number("seen");
  if(!title||total<=0||seen<0||seen>total)throw Error("Enter a title and a watched count between zero and total episodes.");
  try{localStorage.setItem("uac-spoiler-"+title.toLowerCase(),JSON.stringify({title,total,seen}))}catch{}
  result("Progress: "+title,[seen+"/"+total+" episodes watched ("+Math.round(seen/total*100)+"%). Saved locally in this browser only."],["Safe discussion boundary: episodes 1–"+seen,"Still to watch: "+(total-seen)+" episode(s)","Tell friends your latest completed episode; avoid browsing episode summaries past that point."]);
  break;
 }
 case "anime-recommendation-matchmaker":{
  const options=[
   ["Haikyu!!","sports","energy","medium"],["Mob Psycho 100","action","energy","medium"],["Fullmetal Alchemist: Brotherhood","action","mystery","long"],
   ["Cowboy Bebop","science-fiction","mystery","medium"],["SPY x FAMILY","comedy","fun","medium"],["Yuru Camp","slice-of-life","calm","short"],
   ["A Place Further Than the Universe","slice-of-life","energy","short"],["Death Note","mystery","mystery","medium"],["K-On!","slice-of-life","fun","medium"],
   ["Violet Evergarden","drama","calm","short"],["Frieren: Beyond Journey's End","fantasy","calm","medium"],["One Punch Man","action","fun","short"],
   ["Steins;Gate","science-fiction","mystery","medium"],["Your Lie in April","drama","calm","medium"],["Silver Spoon","slice-of-life","fun","medium"]
  ];
  const genre=value("genre"),mood=value("mood"),time=value("length");
  const picks=options.map(a=>({a,score:(a[1]===genre?3:0)+(a[2]===mood?2:0)+(a[3]===time?1:0)})).sort((a,b)=>b.score-a.score).slice(0,5);
  result("Try one of these series",["Human-curated suggestions ranked against your inputs; genre and length categories are approximate. Not a rating, age classification or streaming availability claim."],picks.map(x=>x.a[0]+" — "+x.a[1]+", "+x.a[2]+" mood; "+x.a[3]+" commitment."),[doc("Check official US availability",search("site:crunchyroll.com "+picks[0].a[0]))]);
  break;
 }
 case "anime-club-starter-kit":{
  const club=esc(value("club")),place=esc(value("place")),meetings=Math.max(1,Math.min(12,number("meetings")));
  if(!club||!place)throw Error("Enter your club name and city.");
  result(club+" starter plan",["Planning area: "+place+". Suggested cadence: "+meetings+" meeting(s) per month."],[
   "Mission: an accessible, welcoming space for US anime and manga fans.",
   "First meeting (60 minutes): 10m introductions, 15m interest poll, 20m spoiler-safe discussion, 10m future plans, 5m close.",
   "Rules: be respectful; clarify spoiler boundaries; no harassment; share only media you are allowed to screen.",
   "Accessibility: ask about captions, quieter areas, seating, remote options and budget before choosing a venue.",
   "Operations: name two volunteer hosts, choose a communication channel, publish a clear code of conduct.",
   "Next month: rotate manga discussions, studio history, fan-art workshops and permitted group viewing."
  ],[doc("Club planning guide","https://usaanimeclub.com/guides/start-anime-club/")]);
  break;
 }
 case "cosplay-merch-buying-checklist":{
  const price=number("price"),shipping=number("shipping"),tax=number("tax"),status=value("seller");
  if([price,shipping,tax].some(n=>n<0))throw Error("Amounts cannot be negative.");
  const risks=["Check the retailer identity, physical contact and return policy","Compare official licensed product images, manufacturer and packaging","Verify payment protection and avoid irreversible transfers","Check shipping, tax, cancellation and damaged-item terms","Screenshot the listing before purchase"];
  if(status!=="verified")risks.unshift("Seller not independently verified: confirm legitimacy before payment");
  result("Estimated checkout total: "+dollar.format(price+shipping+tax),["All costs are your entered quotes, not verified live prices."],risks,[doc("Safe-buying guide","https://usaanimeclub.com/guides/buy-anime-merch-safely/")]);
  break;
 }
 case "us-anime-convention-finder":{
  const state=value("state"),city=esc(value("city"));if(!state)throw Error("Choose a US state.");
  const term=(city?city+", ":"")+state+" anime convention";
  result("Research conventions in "+state,["These links take you to external directories or search results; USA Anime Club does not claim any event listing is currently confirmed. Verify dates, address, accessibility and tickets on each organizer's official website."],["Search area: "+term,"Check whether the event is anime-specific and whether its next edition has been announced.","Avoid third-party ticket links unless the event organizer explicitly authorizes them."],[doc("US convention directory","https://conally.org/cons/in/us"),doc("Anime event directory","https://www.fandommap.com/events/anime/united-states/"),doc("Search events for "+state,search(term))]);
  break;
 }
 case "us-manga-release-calendar":{
  const month=value("month"),entries=listed(value("entries")).filter(x=>x.length>=2);
  if(!month)throw Error("Choose a calendar month.");
  const resultRows=entries.filter(([date])=>/^\d{4}-\d{2}-\d{2}$/.test(date)&&date.startsWith(month)).sort((a,b)=>a[0].localeCompare(b[0]));
  const [year,mo]=month.split("-");
  result("Manga release worksheet: "+month,["The entries below come only from the dates and titles you enter; the page does not claim to import all US releases automatically."],resultRows.length?resultRows.map(([date,title,publisher])=>date+" — "+esc(title)+(publisher?" ("+esc(publisher)+")":"")):["No confirmed releases entered for this month yet. Add dates from official publisher calendars."],[doc("Official VIZ "+month+" calendar","https://www.viz.com/calendar/"+year+"/"+mo),doc("Kodansha US publisher","https://kodansha.us/")]);
  break;
 }
 case "anime-movie-release-tracker":{
  const title=esc(value("title")),date=value("date"),place=esc(value("place"));if(!title)throw Error("Enter the film title.");
  result("Research US screenings: "+title,[date?"Date to verify: "+date:"No confirmed theatrical date supplied.","Area: "+first(place)+". This is a source finder, not a live showtimes or ticket-availability service."],["Check the distributor's US theatrical announcement","Check local theaters for subtitled and dubbed showtimes","Confirm age classification, accessibility, ticket conditions and travel"],[doc("Search official US distributors",search(title+" official US theatrical release anime")),doc("Find local showtimes",search(title+" movie showtimes "+place+" site:fandango.com"))]);
  break;
 }
 case "english-dub-sub-calendar":{
  const entries=listed(value("entries")).filter(x=>x.length>=3);
  const valid=entries.filter(([date,title,kind])=>/^\d{4}-\d{2}-\d{2}$/.test(date)&&title&&/dub|sub/i.test(kind)).sort((a,b)=>a[0].localeCompare(b[0]));
  result("Your dub / sub watchlist",["Calendar rows are supplied by you; episodes, titles and audio-track availability are not fetched from streamers."],valid.length?valid.map(([date,title,kind,source])=>date+" — "+esc(title)+" ("+esc(kind)+")"+(source?" · Source: "+esc(source):"")):["Enter TITLE, date and dub/sub status from an official provider."],[doc("Crunchyroll official news","https://www.crunchyroll.com/news/"),doc("Check official dubbing information",search("site:crunchyroll.com/news dubbed anime release schedule"))]);
  break;
 }
 case "where-to-watch-anime-us":{
  const title=esc(value("title")),audio=value("audio");if(!title)throw Error("Enter the anime title.");
  result("Legal US availability checks for "+title,["Choose an official provider below and confirm that the correct season, US territory and "+audio+" audio or subtitle option are available to your account. These are search shortcuts, not availability confirmations."],["Some seasons may be split between providers or purchase-only.","Catalogs and dubbing rights can change without notice."],[doc("Search Crunchyroll",search("site:crunchyroll.com/series "+title)),doc("Search Netflix US",search("site:netflix.com/title "+title)),doc("Search HIDIVE",search("site:hidive.com "+title)),doc("Search Hulu",search("site:hulu.com "+title))]);
  break;
 }
 case "manga-isbn-edition-explorer":{
  const raw=value("isbn").replace(/[ -]/g,"").toUpperCase();
  const isbn10=/^\d{9}[\dX]$/.test(raw)&&raw.split("").reduce((sum,x,i)=>sum+(10-i)*(x==="X"?10:Number(x)),0)%11===0;
  const isbn13=/^\d{13}$/.test(raw)&&raw.split("").reduce((sum,x,i)=>sum+Number(x)*(i%2?3:1),0)%10===0;
  result("ISBN "+(isbn10||isbn13?"checksum valid":"needs correction"),["Entered: "+raw+". A valid checksum confirms only the number's structure, not its publication, edition, language or availability."],["Match the exact volume, translation, publisher and format on the publisher or retailer record.","Compare trim size and paper/ebook format before buying.","Check library holdings separately."],[doc("Look up ISBN with WorldCat",search("site:search.worldcat.org "+raw)),doc("Search publisher records",search("manga ISBN "+raw+" publisher"))]);
  break;
 }
 case "convention-rules-explorer":{
  const event=esc(value("event")),site=esc(value("site"));if(!event)throw Error("Enter the convention name.");
  const checks=["Allowed cosplay prop materials and security screening","Bag dimensions, storage and prohibited items","Photography, consent and harassment rules","Accessibility accommodations and quiet-room availability","Refunds, transfers and badge pickup","Minor attendee and guardian policies"];
  const links=[doc("Search organizer policy",search(event+" official convention cosplay prop bag accessibility policy"))];
  if(/^https:\/\//i.test(site))links.unshift(doc("Open the organizer website",site));
  result("Policy audit: "+event,["Check each category directly with the organizer. This page does not automatically inspect or certify the venue's live policies."],checks,links);
  break;
 }
 case "local-anime-club-finder":{
  const city=esc(value("city")),state=value("state");if(!city||!state)throw Error("Enter a city and state.");
  const place=city+", "+state;
  result("Find clubs around "+place,["Open these searches to find independently published groups. The site does not store or endorse any club and does not claim that a group currently meets."],["Confirm current meeting times directly with the organizer.","Check age limits, accessibility, venue and community rules.","Don't assume a college club accepts people who are not students."],[doc("Meetups in your area",search("anime club meetup "+place)),doc("Library programs",search("public library anime manga club "+place)),doc("Campus anime groups",search("university anime club "+place))]);
  break;
 }
 case "library-manga-finder":{
  const title=esc(value("title")),zip=value("zip");
  if(!title)throw Error("Enter a manga title.");
  if(zip&&!validUS.test(zip))throw Error("Enter a valid US ZIP code.");
  result("Library search plan: "+title,["WorldCat indexes participating library holdings, but is not an instant local-availability confirmation. Check edition, waitlists and library card rules with your library."],["Search by exact title and original creator.","Check the English volume number and ISBN if possible.","Ask about interlibrary loan and digital borrowing."],[doc("Search WorldCat catalogs","https://search.worldcat.org/"),doc("Search libraries near "+first(zip),search("library catalog manga "+title+" "+zip)),doc("How to find libraries in WorldCat","https://help.oclc.org/Discovery_and_Reference/WorldCat-org/Search/Search_WorldCat_org_libraries/Perform_a_library_search")]);
  break;
 }
 case "watch-party-rights-accessibility-helper":{
  const venue=value("venue"),size=number("size"),ticket=checked("paid"),captions=checked("captions");
  const notes=["Verify the screening license or permission with the actual rights holder.","Choose an accessible venue, seating layout and rest breaks.","Use a spoiler policy and respectful photography rules.","Confirm provider terms; a personal subscription does not automatically authorize public exhibition."];
  if(venue==="public")notes.unshift("Public/venue screening: seek explicit permission from the rights holder before advertising.");
  if(ticket)notes.unshift("Tickets or donations: ask for permission covering the paid/public nature of the event.");
  if(captions)notes.push("Test captions on the actual device, screen and audio setup.");
  result("Watch-party preparation",["Scenario: "+venue+", "+size+" expected attendee(s); "+(ticket?"tickets or paid admission":"no paid admission")+". This checklist is informational, not a legal clearance or a license."],notes,[doc("Host a watch-party guide","https://usaanimeclub.com/guides/host-anime-watch-party/")]);
  break;
 }
 case "press-release-submission-checker":{
  const fields=[["headline","Specific news headline"],["organization","Named organization or creator"],["date","Confirmed announcement date"],["us","US audience, city or distribution context"],["source","Original source or official website"],["contact","Named media contact"],["rights","Confirmed image and text rights"]];
  const completed=fields.filter(([key])=>value(key)).length;
  const missing=fields.filter(([key])=>!value(key)).map(([key,label])=>label);
  const source=value("source");
  const warnings=[];if(source&&!/^https:\/\//i.test(source))warnings.push("Provide a valid HTTPS source link.");if(value("contact")&&!/@/.test(value("contact")))warnings.push("Provide an email address for the media contact.");
  result("Submission readiness: "+completed+"/"+fields.length+" essentials",["This checklist does not submit, publish or approve a press release. Editorial review and sourcing remain required."],missing.length?missing.map(x=>"Missing: "+x).concat(warnings):["All basic fields supplied. Check factual claims, source rights, originality and disclosure before sending."].concat(warnings),[doc("Official submission policy","https://usaanimeclub.com/press/"),doc("Editorial policy","https://usaanimeclub.com/editorial-policy/")]);
  break;
 }
 default:throw Error("Tool is not configured.");
 }
}
if(!form||!out)return;
form.addEventListener("submit",e=>{e.preventDefault();if(!form.reportValidity())return;try{execute()}catch(err){result("Check your inputs",[err.message||"Unable to calculate from these fields."])}});
form.addEventListener("reset",()=>{out.hidden=true;out.replaceChildren()});
})();
