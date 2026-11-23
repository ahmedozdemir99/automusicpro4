const DEFINITIONS = {
  nostalji:{terms:["Turkish vintage music","Turkish classical","Türk sanat müziği"],hints:["turkish","türk","osman","ottoman","makam","nostal","fasıl"]},
  karadeniz:{terms:["Karadeniz kemençe","Turkish Black Sea folk","horon tulum"],hints:["karadeniz","kemençe","kemence","horon","tulum","trabzon","rize","black sea"]},
  turkuler:{terms:["Turkish folk baglama","Anatolian folk music","türkü bağlama"],hints:["folk","türkü","turku","bağlama","baglama","anatol","anadolu","aşık","asik"]},
  arabesk:{terms:["Turkish arabesk","arabesk müzik"],hints:["arabesk","arabesque"]},
  turk_sanat:{terms:["Turkish classical makam","Turkish fasıl kanun","Ottoman classical music"],hints:["makam","fasıl","fasil","kanun","ud","tanbur","turkish classical","ottoman"]},
  turk_pop:{terms:["Turkish pop","Türkçe pop","Istanbul pop"],hints:["turkish pop","türkçe pop","pop"]},
  turk_rock:{terms:["Anatolian rock","Turkish rock"],hints:["anatolian rock","turkish rock","türk rock","anadolu rock"]},
  ozgun:{terms:["Özgün müzik","Turkish acoustic folk"],hints:["özgün","ozgun","acoustic folk","türk"]},
  ilahi:{terms:["Turkish ilahi","Türkçe ilahi","sufi hymn"],hints:["ilahi","hymn","sufi","tasavvuf"]},
  ezgi:{terms:["Turkish ezgi","özgün ezgi"],hints:["ezgi","özgün","ozgun","ilahi"]},
  tasavvuf:{terms:["Turkish sufi ney","Mevlevi music","tasavvuf"],hints:["sufi","tasavvuf","mevlevi","ney","sema"]},
  nesid:{terms:["Turkish nasheed","nasheed"],hints:["nasheed","neşid","nesid","anasheed"]},
  zikirli_ilahiler:{terms:["Turkish zikr ilahi","Sufi dhikr"],hints:["zikir","zikr","dhikr","ilahi","sufi"]},
  arapca:{terms:["Arabic oud music","Arabic classical music"],hints:["arabic","oud","arab","maqam"]},
  azerice:{terms:["Azerbaijan mugham","Azerbaijani folk tar"],hints:["azer","mugham","muğam","tar"]},
  lazca:{terms:["Lazuri folk","Laz music tulum"],hints:["laz","lazuri","tulum"]}
};
const normalize=s=>String(s||"").toLocaleLowerCase("tr-TR");
const hasAny=(s,terms)=>terms.some(term=>normalize(s).includes(normalize(term)));
const isTurkish=lang=>normalize(lang).includes("türk");
const nonTurkish=new Set(["en","fr","es","de","it","ru","pt","ar","fa"]);
function validCategory(meta,category,lang){
  const text=[meta.title,meta.artist,meta.album,meta.tags].filter(Boolean).join(" ");
  if(!text.trim())return false;
  if(category==="search")return !isTurkish(lang)||meta.lang==="tr"||hasAny(text,["turkish","türk","anatol","anadolu"]);
  const def=DEFINITIONS[category];
  if(!def)return false;
  if(!hasAny(text,def.hints))return false;
  if(isTurkish(lang)){
    if(meta.lang && nonTurkish.has(normalize(meta.lang)))return false;
    // A language tag is strong evidence; title/artist metadata is weaker evidence.
    return meta.lang==="tr"||hasAny(text,["turkish","türk","anatol","anadolu","karadeniz","türkü","bağlama","makam","fasıl","arabesk","tasavvuf","mevlevi","ilahi","ezgi","zikir","horon","kemençe","laz"]);
  }
  return true;
}
const safeString=(s,n=160)=>String(s||"").replace(/<[^>]+>/g,"").slice(0,n);
async function jamendo(env,terms,category,lang,genre,motif,offset){
  if(!env.JAMENDO_CLIENT_ID)return [];
  const queries=terms.slice(0,3);
  const responses=await Promise.allSettled(queries.map(async query=>{
    const u=new URL("https://api.jamendo.com/v3.0/tracks/");
    for(const [k,v] of Object.entries({client_id:env.JAMENDO_CLIENT_ID,format:"json",limit:"60",offset:String(offset),search:query,audioformat:"mp32",include:"musicinfo+licenses",type:"single albumtrack"}))u.searchParams.set(k,v);
    // Jamendo's lang filter refers to lyrics language; use it for Turkish vocal catalog.
    if(isTurkish(lang))u.searchParams.set("lang","tr");
    const res=await fetch(u.toString());if(!res.ok)throw Error("Jamendo "+res.status);
    const data=await res.json();if(data.headers?.status==="failed")throw Error("Jamendo rejected request");
    return(data.results||[]).flatMap(item=>{
      if(!item.audio?.startsWith("https://"))return[];
      const meta={title:item.name,artist:item.artist_name,album:item.album_name,lang:normalize(item.musicinfo?.lang),tags:(item.musicinfo?.tags?.genres||[]).join(" ")};
      if(!validCategory(meta,category,lang))return[];
      return[{contentId:"jamendo:"+item.id,title:item.name,artistId:"jamendo-artist:"+item.artist_id,artistName:item.artist_name,album:item.album_name||genre,categoryId:category,language:lang,genre,durationSec:Number(item.duration)||0,streamUrl:item.audio,sourceProvider:"jamendo",downloadAllowed:Boolean(item.audiodownload_allowed),licenseName:item.license_ccurl||"Jamendo",bitrateKbps:192,format:"MP3",motif,coverUrl:item.image||item.album_image||undefined}];
    });
  }));
  return responses.flatMap(r=>r.status==="fulfilled"?r.value:[]);
}
async function archive(terms,category,lang,genre,motif){
  const searches=terms.slice(0,3);
  const results=await Promise.allSettled(searches.map(async term=>{
    const u=new URL("https://archive.org/advancedsearch.php");
    // Search metadata; do not trust a broad OR expression as proof of language.
    u.searchParams.set("q",'mediatype:audio AND licenseurl:* AND ('+term.split(/\s+/).filter(Boolean).map(w=>'"'+w.replace(/[^\p{L}\p{N}-]/gu,"")+'"').filter(w=>w!=='""').join(" AND ")+')');
    for(const field of ["identifier","title","creator","licenseurl","subject","language"])u.searchParams.append("fl[]",field);
    u.searchParams.set("rows","12");u.searchParams.set("output","json");
    const response=await fetch(u.toString());if(!response.ok)return[];
    const data=await response.json();
    const docs=(data.response?.docs||[]).filter(d=>d.licenseurl).filter(d=>validCategory({title:d.title,artist:d.creator,tags:Array.isArray(d.subject)?d.subject.join(" "):d.subject,lang:Array.isArray(d.language)?d.language[0]:d.language},category,lang)).slice(0,5);
    const items=await Promise.allSettled(docs.map(async doc=>{
      const r=await fetch("https://archive.org/metadata/"+encodeURIComponent(doc.identifier)+"/files");if(!r.ok)return[];
      const d=await r.json();return(d.result||[]).filter(f=>/\.(mp3|ogg)$/i.test(f.name||"")&&!/_64kb/i.test(f.name||"")).filter(f=>validCategory({title:f.title||doc.title,artist:f.artist||doc.creator,album:f.album||doc.title,tags:Array.isArray(doc.subject)?doc.subject.join(" "):doc.subject,lang:Array.isArray(doc.language)?doc.language[0]:doc.language},category,lang)).slice(0,4).map(f=>({contentId:"ia:"+doc.identifier+":"+f.name,title:safeString(f.title||f.name),artistId:"ia:"+doc.identifier,artistName:safeString(f.artist||doc.creator||"Internet Archive"),album:safeString(f.album||doc.title),categoryId:category,language:lang,genre,durationSec:Number(f.length)||0,streamUrl:"https://archive.org/download/"+encodeURIComponent(doc.identifier)+"/"+f.name.split("/").map(encodeURIComponent).join("/"),sourceProvider:"internet_archive",downloadAllowed:false,licenseName:safeString(doc.licenseurl,240),format:/\.ogg$/i.test(f.name)?"OGG":"MP3",motif})));
    }));
    return items.flatMap(x=>x.status==="fulfilled"?x.value:[]);
  }));
  return results.flatMap(r=>r.status==="fulfilled"?r.value:[]);
}
export async function onRequestGet({request,env}){
  const url=new URL(request.url);
  const category=(url.searchParams.get("categoryId")||"turkuler").slice(0,40);
  const lang=(url.searchParams.get("language")||"Türkçe").slice(0,40);
  const genre=(url.searchParams.get("genre")||"Müzik").slice(0,40);
  const motif=(url.searchParams.get("motif")||"anatolia").slice(0,30);
  const q=(url.searchParams.get("q")||"").trim().slice(0,100);
  const offset=Math.min(180,Math.max(0,Number(url.searchParams.get("offset"))||0));
  const def=DEFINITIONS[category];
  const terms=def?def.terms:q?[q]:[];
  if(!terms.length)return Response.json({tracks:[],notice:"Arama terimi bulunamadı."});
  const [j,a]=await Promise.allSettled([jamendo(env,terms,category,lang,genre,motif,offset),archive(terms,category,lang,genre,motif)]);
  const merged=[...(j.status==="fulfilled"?j.value:[]),...(a.status==="fulfilled"?a.value:[])];
  const seen=new Set(),tracks=merged.filter(t=>{const id=t.contentId;if(seen.has(id))return false;seen.add(id);return true}).slice(0,80);
  return Response.json({tracks,provider:tracks.length?"jamendo+internet_archive":"empty",notice:tracks.length?undefined:"Bu kategoride dili ve türü doğrulanabilen lisanslı kayıt bulunamadı. Yanlış veya yabancı kayıt gösterilmiyor.",total:tracks.length,categoryId:category},{headers:{"Cache-Control":"public, max-age=300"}});
}
