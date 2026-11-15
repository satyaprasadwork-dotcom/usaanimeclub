/** Original editorial concept art. No licensed anime imagery, logos, photos or invented charts. */
const palettes={
 Anime:["#071C36","#205998","#7ACCEB","#D4F3FF"],
 Manga:["#301722","#963E55","#F3A684","#FFE3D7"],
 Manhwa:["#342409","#A0732A","#F7C868","#FFF2C9"],
 "Web Novels":["#0B302B","#20735D","#78D9B7","#D6F9EA"]
};
const categoryIdentity={Anime:"#173A70",Manga:"#932B3B",Manhwa:"#F4C542","Web Novels":"#16744A"};
const scenes={
 books:'<g transform="translate(484 132) rotate(-6 160 190)"><rect x="12" y="240" width="427" height="92" rx="18" fill="url(#paper)" stroke="#fff" stroke-width="5"/><path d="M40 280h330" stroke="#142333" opacity=".28" stroke-width="10"/><rect x="65" y="140" width="390" height="91" rx="18" fill="url(#accent)" stroke="#fff" stroke-width="5"/><path d="M103 181h260" stroke="#fff" opacity=".65" stroke-width="11"/><rect x="27" y="31" width="410" height="95" rx="18" fill="url(#paper)" stroke="#fff" stroke-width="5"/><path d="M72 75h280" stroke="#173858" opacity=".32" stroke-width="10"/></g>',
 compare:'<g transform="translate(467 119)"><rect x="3" y="25" width="240" height="372" rx="28" fill="url(#paper)" stroke="#fff" stroke-width="5"/><path d="M124 34v340 M23 155h200 M23 260h200" fill="none" stroke="#193950" opacity=".28" stroke-width="11"/><rect x="287" y="0" width="238" height="396" rx="36" fill="#102437" stroke="#fff" stroke-width="6"/><rect x="311" y="41" width="189" height="303" rx="17" fill="url(#paper)"/><rect x="326" y="67" width="160" height="105" rx="10" fill="url(#accent)"/><path d="M330 209h150 M330 241h109 M330 276h150" stroke="#193950" opacity=".27" stroke-width="12"/><path d="M244 194h44" stroke="#fff" stroke-width="10" stroke-dasharray="13 12"/></g>',
 reader:'<g transform="translate(555 99)"><rect x="54" y="3" width="326" height="474" rx="48" fill="#101E2D" stroke="#fff" stroke-width="6"/><rect x="80" y="47" width="275" height="376" rx="18" fill="url(#paper)"/><rect x="105" y="70" width="226" height="127" rx="14" fill="url(#accent)"/><circle cx="162" cy="131" r="42" fill="#fff" opacity=".68"/><path d="M215 173l35-49 55 49" stroke="#fff" stroke-width="13" fill="none"/><path d="M106 240h220 M106 272h190 M106 307h220 M106 338h166" stroke="#193950" stroke-width="11" opacity=".3"/><circle cx="215" cy="447" r="11" fill="#fff"/></g>',
 screen:'<g transform="translate(478 141)"><rect x="0" y="7" width="533" height="317" rx="28" fill="#0A1B2C" stroke="#fff" stroke-width="7"/><rect x="22" y="31" width="490" height="269" rx="13" fill="url(#paper)"/><rect x="46" y="63" width="261" height="207" rx="12" fill="url(#accent)"/><circle cx="168" cy="167" r="71" fill="#fff" opacity=".6"/><path d="M150 120v90l78-45z" fill="#14344A"/><path d="M330 94h158 M330 127h114 M330 177h158 M330 207h113" stroke="#193950" stroke-width="12" opacity=".29"/><path d="M266 329v59 M174 391h186" stroke="#fff" stroke-width="17" stroke-linecap="round"/></g>',
 calendar:'<g transform="translate(482 101)"><rect x="6" y="46" width="510" height="416" rx="28" fill="url(#paper)" stroke="#fff" stroke-width="7"/><path d="M7 79q0-33 33-33h442q34 0 34 34v88H7z" fill="url(#accent)"/><path d="M130 16v95 M390 16v95" stroke="#fff" stroke-width="20" stroke-linecap="round"/><g fill="#14344A" opacity=".22"><rect x="60" y="202" width="106" height="65" rx="8"/><rect x="208" y="202" width="106" height="65" rx="8"/><rect x="356" y="202" width="106" height="65" rx="8"/><rect x="60" y="297" width="106" height="65" rx="8"/><rect x="208" y="297" width="106" height="65" rx="8"/><rect x="356" y="297" width="106" height="65" rx="8"/></g><rect x="208" y="297" width="106" height="65" rx="8" fill="url(#accent)"/><path d="M228 330l21 18 41-42" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round"/></g>',
 clock:'<g transform="translate(566 149)"><circle cx="210" cy="190" r="195" fill="url(#paper)" stroke="#fff" stroke-width="8"/><circle cx="210" cy="190" r="154" fill="none" stroke="#153C58" stroke-width="17" stroke-dasharray="15 25" opacity=".26"/><path d="M210 85v105l91 62" stroke="#183A53" stroke-width="20" fill="none" stroke-linecap="round"/><circle cx="210" cy="190" r="18" fill="#183A53"/><rect x="-20" y="10" width="138" height="89" rx="14" fill="url(#accent)" stroke="#fff" stroke-width="5"/></g>',
 cinema:'<g transform="translate(477 134)"><rect x="7" y="11" width="530" height="356" rx="28" fill="#101D30" stroke="#fff" stroke-width="7"/><rect x="43" y="50" width="457" height="283" rx="11" fill="url(#paper)"/><path d="M84 299l120-164 91 101 83-127 94 190z" fill="url(#accent)" opacity=".88"/><circle cx="196" cy="137" r="51" fill="#fff" opacity=".75"/><path d="M245 125l120 70-120 70z" fill="#14364F" opacity=".79"/><path d="M35 0h482 M35 380h482" stroke="#fff" stroke-opacity=".6" stroke-width="15" stroke-dasharray="38 25"/></g>',
 trophy:'<g transform="translate(535 130)"><path d="M145 23h254v130c0 118-65 190-127 190s-127-72-127-190z" fill="url(#paper)" stroke="#fff" stroke-width="9"/><path d="M145 81H73c-30 0-24 128 90 144 M399 81h73c30 0 25 128-90 144" fill="none" stroke="#fff" stroke-width="21"/><path d="M273 341v73 M179 425h186" stroke="#fff" stroke-width="20" stroke-linecap="round"/><path d="M270 95l31 60 66 9-47 48 11 68-61-32-60 32 10-68-49-48 67-9z" fill="url(#accent)"/></g>',
 portal:'<g transform="translate(547 100)"><path d="M38 469V198Q38 2 224 2T410 198v271z" fill="#0C2130" stroke="#fff" stroke-width="8"/><path d="M78 468V199q0-143 146-143t147 143v269z" fill="url(#paper)"/><circle cx="222" cy="230" r="122" fill="url(#accent)"/><path d="M222 111l107 120-107 119-107-119z" fill="#fff" opacity=".7"/><path d="M12 465h426" stroke="#fff" stroke-width="19" stroke-linecap="round"/></g>'
};
const escapeSvg=s=>String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
export function editorialCover(article,spec){
 const p=palettes[article.category]||palettes.Anime;
 let seed=2166136261;
 for(const ch of article.slug){seed^=ch.charCodeAt(0);seed=Math.imul(seed,16777619)}
 const off=(seed>>>0)%115;
 return '<svg xmlns="http://www.w3.org/2000/svg" role="img" width="1200" height="675" viewBox="0 0 1200 675" aria-label="Original conceptual illustration for '+escapeSvg(spec.label)+'">'+
 '<defs><linearGradient id="sky" x2="1" y2="1"><stop stop-color="'+p[0]+'"/><stop offset=".65" stop-color="'+p[1]+'"/><stop offset="1" stop-color="'+p[0]+'"/></linearGradient>'+
 '<linearGradient id="paper" x2="1" y2="1"><stop stop-color="'+p[3]+'"/><stop offset="1" stop-color="'+p[2]+'"/></linearGradient>'+
 '<linearGradient id="accent" x2="1" y2="1"><stop stop-color="'+p[1]+'"/><stop offset="1" stop-color="'+p[2]+'"/></linearGradient></defs>'+
 '<rect width="1200" height="675" fill="url(#sky)"/>'+
 '<rect x="0" y="0" width="14" height="675" fill="'+categoryIdentity[article.category]+'"/>'+
 '<g fill="none" stroke="'+p[3]+'" stroke-opacity=".19" stroke-width="2"><circle cx="'+(847+off)+'" cy="335" r="310"/><circle cx="'+(847+off)+'" cy="335" r="390"/><circle cx="'+(847+off)+'" cy="335" r="465"/>'+
 '<path d="M-70 468L420 -20 M-70 545L505 -32"/></g>'+
 '<g fill="'+p[2]+'" opacity=".8"><circle cx="'+(540+off)+'" cy="119" r="9"/><circle cx="1110" cy="562" r="8"/><circle cx="'+(492+off)+'" cy="519" r="12"/></g>'+
 (scenes[spec.scene]||scenes.screen)+
 '<rect x="66" y="70" width="75" height="7" rx="3" fill="'+p[2]+'"/>'+
 '<text x="66" y="131" font-family="Arial,sans-serif" font-weight="700" letter-spacing="2.2" font-size="22" fill="#fff">USA ANIME CLUB</text>'+
 '<text x="66" y="181" font-family="Arial,sans-serif" letter-spacing="2.3" font-size="17" fill="'+p[2]+'">'+escapeSvg(article.category.toUpperCase())+' / US EDITION</text>'+
 '<path d="M67 492h300" stroke="'+p[2]+'" stroke-width="3"/>'+
 '<text x="66" y="548" font-family="Arial,sans-serif" font-weight="700" font-size="29" fill="#fff">'+escapeSvg(spec.label)+'</text>'+
 '<path d="M66 598h1067" stroke="'+p[3]+'" opacity=".28"/>'+
 '<text x="66" y="638" font-family="Arial,sans-serif" letter-spacing="1.5" font-size="14" fill="'+p[3]+'">ORIGINAL EDITORIAL CONCEPT ART</text>'+
 '</svg>\n';
}
