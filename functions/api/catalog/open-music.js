const DEFINITIONS = {
  nostalji:{terms:["Turkish vintage music","Zeki Müren taş plak","Müzeyyen Senar","Safiye Ayla","Turkish 78rpm","Türkçe nostalji","Turkish oldies","Türk sanat müziği eski kayıt"],hints:["turkish","türk","osman","ottoman","makam","nostal","fasıl"]},
  karadeniz:{terms:["Karadeniz kemençe","Birol Topaloğlu","Kazım Koyuncu","Volkan Konak","Karadeniz türkü","horon tulum","Turkish Black Sea folk","Trabzon Rize Artvin müzik"],hints:["karadeniz","kemençe","kemence","horon","tulum","trabzon","rize","black sea"]},
  turkuler:{terms:["Turkish folk baglama","Neşet Ertaş","Aşık Veysel","Türk halk müziği","Anadolu türkü","bozlak","deyiş bağlama","Anatolian folk music"],hints:["folk","türkü","turku","bağlama","baglama","anatol","anadolu","aşık","asik"]},
  arabesk:{terms:["Turkish arabesk","Orhan Gencebay","Ferdi Tayfur","Müslüm Gürses","İbrahim Tatlıses","arabesk müzik","Türkçe arabesk"],hints:["arabesk","arabesque"]},
  turk_sanat:{terms:["Turkish classical makam","Türk sanat müziği","Münir Nurettin Selçuk","Tanburi Cemil Bey","fasıl kanun","Türk musikisi","Ottoman classical music"],hints:["makam","fasıl","fasil","kanun","ud","tanbur","turkish classical","ottoman"]},
  turk_pop:{terms:["Turkish pop","Türkçe pop","Turkish indie pop","Istanbul pop","Türk pop akustik","Turkish pop music"],hints:["turkish pop","türkçe pop","pop"]},
  turk_rock:{terms:["Anatolian rock","Turkish rock","Anadolu rock","Türkçe rock","Turkish psychedelic rock","Anatolian psychedelic"],hints:["anatolian rock","turkish rock","türk rock","anadolu rock"]},
  ozgun:{terms:["Özgün müzik","Turkish acoustic folk","özgün müzik sanatçı","Anadolu özgün","Turkish singer songwriter"],hints:["özgün","ozgun","acoustic folk","türk"]},
  ilahi:{terms:["Turkish ilahi","Türkçe ilahi","sufi hymn","dini musiki ilahi","Turkish islamic hymn","ilahiler"],hints:["ilahi","hymn","sufi","tasavvuf"]},
  ezgi:{terms:["Turkish ezgi","özgün ezgi","Türkçe ezgi","Anadolu ezgileri","ezgi müzik"],hints:["ezgi","özgün","ozgun","ilahi"]},
  tasavvuf:{terms:["Turkish sufi ney","Mevlevi music","tasavvuf","sema ney","sufi music Turkey","Mevlana ney"],hints:["sufi","tasavvuf","mevlevi","ney","sema"]},
  nesid:{terms:["Turkish nasheed","nasheed","Türkçe neşid","islami neşid","anasheed Turkish"],hints:["nasheed","neşid","nesid","anasheed"]},
  zikirli_ilahiler:{terms:["Turkish zikr ilahi","Sufi dhikr","zikirli ilahi","zikir müziği","dhikr sufi"],hints:["zikir","zikr","dhikr","ilahi","sufi"]},
  arapca:{terms:["Arabic oud music","Arabic classical music","Fairuz","Umm Kulthum","Arabic maqam","Arabic folk music","oud taqsim"],hints:["arabic","oud","arab","maqam"]},
  azerice:{terms:["Azerbaijan mugham","Azerbaijani folk tar","Azerice müzik","Alim Qasimov","Azerbaijan ashug","Azerbaycan muğam"],hints:["azer","mugham","muğam","tar"]},
  lazca:{terms:["Birol Topaloğlu","Lazuri","Lazca müzik","Laz music tulum","Kazım Koyuncu Lazca","Laz halk müziği","Lazuri folk","Lazona"],hints:["laz","lazuri","tulum"]}
};
const normalize=s=>String(s||"").toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ı/g,"i");
const hasAny=(s,terms)=>terms.some(term=>normalize(s).includes(normalize(term)));
const isTurkish=lang=>normalize(lang).includes("turk");
const foreignLanguages=new Set(["en","fr","es","de","it","ru","pt","ar","fa","az"]);
const RULES={
  nostalji:{positive:["nostalji","nostalgia","oldies","vintage","78rpm","gramofon","tas plak"],negative:["pop","rock","hiphop","electronic"]},
  karadeniz:{positive:["karadeniz","black sea","horon","kemence","tulum","trabzon","rize","artvin","birol topaloglu","kazim koyuncu","volkan konak"],negative:["arabesk","pop","rock"]},
  turkuler:{positive:["turku","folk","baglama","halk muzigi","asik","anatolian folk"],negative:["pop","rock","arabesk","electronic"]},
  arabesk:{positive:["arabesk","arabesque"],negative:["pop","rock","folk"]},
  turk_sanat:{positive:["turk sanat","turkish classical","ottoman classical","fasil","makam","tanbur","kanun"],negative:["pop","rock","electronic"]},
  turk_pop:{positive:["pop"],negative:["rock","arabesk","folk","metal","hiphop","electronic","classical"]},
  turk_rock:{positive:["rock","anatolian rock","anadolu rock"],negative:["pop","arabesk","folk","metal"]},
  ozgun:{positive:["ozgun","singer songwriter","acoustic folk"],negative:["pop","rock","arabesk"]},
  ilahi:{positive:["ilahi","islamic hymn","turkish hymn"],negative:["pop","rock","arabesk"]},
  ezgi:{positive:["ezgi","ozgun ezgi"],negative:["pop","rock","arabesk"]},
  tasavvuf:{positive:["tasavvuf","sufi","mevlevi","sema","ney"],negative:["pop","rock","arabesk"]},
  nesid:{positive:["nasheed","nesid","anasheed"],negative:["pop","rock"]},
  zikirli_ilahiler:{positive:["zikir","zikr","dhikr"],negative:["pop","rock"]},
  arapca:{positive:["arabic","arab","oud","maqam"],negative:["turkish pop","turkish rock"]},
  azerice:{positive:["azerbaijan","azerbaijani","azerice","mugham","mugam"],negative:["turkish pop"]},
  lazca:{positive:["lazuri","lazca","laz music","birol topaloglu","birol topaloğlu","lazona"],negative:["turkish pop"]}
};
function validCategory(meta,category,lang){
  const rule=RULES[category];if(!rule)return false;
  const title=normalize(meta.title),artist=normalize(meta.artist),album=normalize(meta.album);
  const tags=normalize(meta.tags),description=normalize(meta.description);
  const text=[title,artist,album,tags,description].join(" ");
  // Talks, podcasts and magazine interviews are not music tracks.
  if(hasAny([title,album,tags].join(" "),["dergi","konuk","podcast","interview","röportaj","roportaj","söyleşi","soylesi","lecture","speech","konuşma","konusma"]))return false;
  const songLang=normalize(meta.lang);
  if(!title||!artist||artist==="unknown"||artist==="internet archive")return false;
  if(isTurkish(lang)){
    if(songLang&&foreignLanguages.has(songLang))return false;
    // No evidence of Turkish origin/lyrics => no claim that the recording is Turkish.
    const origin= songLang==="tr"||hasAny(text,["turkish","turkce","turkiye","turkey","istanbul","anatolian","anadolu","karadeniz","turku","baglama","osmanli","ottoman","mevlevi","birol topaloglu","kazim koyuncu","volkan konak"]);
    if(!origin)return false;
  }
  if(category==="arapca"&&songLang&&songLang!=="ar"&&!hasAny(text,["arabic","arab"]))return false;
  if(category==="azerice"&&songLang&&songLang!=="az"&&!hasAny(text,["azer","mugham","mugam"]))return false;
  // Category evidence must describe the recording, not merely the query used to find it.
  if(!hasAny([title,artist,album,tags,description].join(" "),rule.positive))return false;
  if(hasAny(tags,rule.negative))return false;
  return true;
}
const safeString=(s,n=160)=>String(s||"").replace(/<[^>]+>/g,"").slice(0,n);
async function jamendo(env,terms,category,lang,genre,motif,offset){
  if(!env.JAMENDO_CLIENT_ID)return {tracks:[],diagnostics:{configured:false}};
  const queries=terms;
  const responses=await Promise.allSettled(queries.map(async query=>{
    const u=new URL("https://api.jamendo.com/v3.0/tracks/");
    for(const [k,v] of Object.entries({client_id:env.JAMENDO_CLIENT_ID,format:"json",limit:"60",offset:String(offset),search:query,audioformat:"mp32",include:"musicinfo+licenses",type:"single albumtrack",imagesize:"300"}))u.searchParams.set(k,v);
    // Jamendo's lang filter refers to lyrics language; use it for Turkish vocal catalog.
    // Do not filter instrumental music by lyrics language; verify origin in metadata below.
    const res=await fetch(u.toString());if(!res.ok)throw Error("Jamendo HTTP "+res.status);
    const data=await res.json();if(data.headers?.status==="failed")throw Error("Jamendo: "+String(data.headers?.error_message||"request rejected"));
    const raw=Array.isArray(data.results)?data.results:[];
    const tracks=raw.flatMap(item=>{
      if(!item.audio?.startsWith("https://"))return[];
      const meta={title:item.name,artist:item.artist_name,album:item.album_name,lang:normalize(item.musicinfo?.lang),tags:[...(item.musicinfo?.tags?.genres||[]),...(item.musicinfo?.tags?.vartags||[])].join(" ")};
      if(!validCategory(meta,category,lang))return[];
      return[{contentId:"jamendo:"+item.id,title:item.name,artistId:"jamendo-artist:"+item.artist_id,artistName:item.artist_name,album:item.album_name||genre,categoryId:category,language:lang,genre,durationSec:Number(item.duration)||0,streamUrl:item.audio,sourceProvider:"jamendo",downloadAllowed:Boolean(item.audiodownload_allowed),licenseName:item.license_ccurl||"Jamendo",bitrateKbps:192,format:"MP3",motif,coverUrl:item.image||item.album_image||undefined}];
    });
    return {query,rawCount:raw.length,acceptedCount:tracks.length,tracks};
  }));
  const successful=responses.filter(r=>r.status==="fulfilled").map(r=>r.value);
  return {tracks:successful.flatMap(x=>x.tracks),diagnostics:{configured:true,queries:responses.map((r,i)=>r.status==="fulfilled"?{term:queries[i],raw:r.value.rawCount,accepted:r.value.acceptedCount}:{term:queries[i],error:String(r.reason).slice(0,140)})}};
}
async function archive(terms,category,lang,genre,motif){
  const searches=terms;
  const results=await Promise.allSettled(searches.map(async term=>{
    const u=new URL("https://archive.org/advancedsearch.php");
    // Search metadata; do not trust a broad OR expression as proof of language.
    const phrase=term.replace(/[^\p{L}\p{N} -]/gu," ").trim();
    u.searchParams.set("q",'mediatype:audio AND licenseurl:* AND (title:"'+phrase+'" OR subject:"'+phrase+'" OR description:"'+phrase+'" OR creator:"'+phrase+'")');
    for(const field of ["identifier","title","creator","licenseurl","subject","language","description"])u.searchParams.append("fl[]",field);
    u.searchParams.set("rows","30");u.searchParams.set("output","json");
    const response=await fetch(u.toString());if(!response.ok)return[];
    const data=await response.json();
    const docs=(data.response?.docs||[]).filter(d=>d.licenseurl).filter(d=>validCategory({title:d.title,artist:d.creator,tags:Array.isArray(d.subject)?d.subject.join(" "):d.subject,lang:Array.isArray(d.language)?d.language[0]:d.language,description:d.description},category,lang)).slice(0,10);
    const items=await Promise.allSettled(docs.map(async doc=>{
      const r=await fetch("https://archive.org/metadata/"+encodeURIComponent(doc.identifier)+"/files");if(!r.ok)return[];
      const d=await r.json();return(d.result||[]).filter(f=>/\.(mp3|ogg)$/i.test(f.name||"")&&!/_64kb/i.test(f.name||"")&&!/(_meta|spectrogram|sample|preview)/i.test(f.name||"")).filter(f=>validCategory({title:f.title||doc.title,artist:f.artist||doc.creator,album:f.album||doc.title,tags:Array.isArray(doc.subject)?doc.subject.join(" "):doc.subject,lang:Array.isArray(doc.language)?doc.language[0]:doc.language,description:doc.description},category,lang)).slice(0,4).map(f=>({contentId:"ia:"+doc.identifier+":"+f.name,title:safeString(f.title||f.name),artistId:"ia:"+doc.identifier,artistName:safeString(f.artist||doc.creator||"Internet Archive"),album:safeString(f.album||doc.title),categoryId:category,language:lang,genre,durationSec:Number(f.length)||0,streamUrl:"https://archive.org/download/"+encodeURIComponent(doc.identifier)+"/"+f.name.split("/").map(encodeURIComponent).join("/"),sourceProvider:"internet_archive",downloadAllowed:false,licenseName:safeString(doc.licenseurl,240),format:/\.ogg$/i.test(f.name)?"OGG":"MP3",motif,coverUrl:"https://archive.org/services/img/"+encodeURIComponent(doc.identifier)}));
    }));
    return items.flatMap(x=>x.status==="fulfilled"?x.value:[]);
  }));
  return results.flatMap(r=>r.status==="fulfilled"?r.value:[]);
}

async function openverse(terms,category,lang,genre,motif,env){
  let token="";
  let authError=null;
  if(env.OPENVERSE_CLIENT_ID&&env.OPENVERSE_CLIENT_SECRET){
    try{
      const body=new URLSearchParams({grant_type:"client_credentials",client_id:env.OPENVERSE_CLIENT_ID,client_secret:env.OPENVERSE_CLIENT_SECRET});
      const res=await fetch("https://api.openverse.org/v1/auth_tokens/token/",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:body.toString()});
      if(!res.ok)throw Error("OAuth HTTP "+res.status);
      token=String((await res.json()).access_token||"");
    }catch(e){authError=String(e).slice(0,130);}
  }
  const results=await Promise.allSettled(terms.map(async term=>{
    const url=new URL("https://api.openverse.org/v1/audio/");
    url.searchParams.set("q",term);
    url.searchParams.set("category","music");
    url.searchParams.set("page_size",token?"30":"20");
    const headers={"Accept":"application/json"};
    if(token)headers.Authorization="Bearer "+token;
    const response=await fetch(url.toString(),{headers});
    if(!response.ok)throw Error("Openverse HTTP "+response.status);
    const data=await response.json();
    return (data.results||[]).flatMap(item=>{
      const license=String(item.license||"").toLowerCase();
      const audio=String(item.url||"");
      const artist=String(item.creator||"");
      const title=String(item.title||"");
      if(!["by","by-sa","by-nc","by-nc-sa","cc0","pdm"].includes(license))return[];
      if(!/^https:\/\//i.test(audio)||!/^audio\//i.test(String(item.filetype||"audio/unknown"))&& !/\.(mp3|ogg|oga|opus|wav|flac)(?:\?|$)/i.test(audio))return[];
      if(!validCategory({title,artist,album:"",tags:String(item.tags?.map(t=>t.name||t).join(" ")||""),description:String(item.description||""),lang:""},category,lang))return[];
      const id=String(item.id||"");if(!id)return[];
      return [{contentId:"openverse:"+id,title:safeString(title),artistId:"openverse:"+normalize(artist),artistName:safeString(artist),album:genre,categoryId:category,language:lang,genre,durationSec:Number(item.duration)||0,streamUrl:audio,sourceProvider:"openverse",downloadAllowed:false,licenseName:safeString(item.license_url||license,240),format:/\.ogg|\.oga|\.opus/i.test(audio)?"OGG":"MP3",motif,coverUrl:item.thumbnail||undefined}];
    });
  }));
  return {tracks:results.flatMap(r=>r.status==="fulfilled"?r.value:[]),diagnostics:{authenticated:Boolean(token),credentialsConfigured:Boolean(env.OPENVERSE_CLIENT_ID&&env.OPENVERSE_CLIENT_SECRET),authError,queries:results.map((r,i)=>r.status==="fulfilled"?{term:terms[i],accepted:r.value.length}:{term:terms[i],error:String(r.reason).slice(0,130)})}};
}


async function wikimedia(terms,category,lang,genre,motif){
  const batches=await Promise.allSettled(terms.map(async term=>{
    const u=new URL("https://commons.wikimedia.org/w/api.php");
    for(const [k,v] of Object.entries({action:"query",generator:"search",gsrsearch:term+" filetype:audio",gsrnamespace:"6",gsrlimit:"20",prop:"imageinfo",iiprop:"url|mime|extmetadata",format:"json",formatversion:"2",origin:"*"}))u.searchParams.set(k,v);
    const res=await fetch(u.toString(),{headers:{"Accept":"application/json","Api-User-Agent":"AutoMusicPro4/1.0 (licensed audio discovery)"}});
    if(!res.ok)throw Error("Wikimedia HTTP "+res.status);
    const data=await res.json();
    if(data.error)throw Error(String(data.error.info||data.error.code).slice(0,100));
    const pages=data.query?.pages||[];
    const tracks=pages.flatMap(p=>{
      const info=p.imageinfo?.[0];if(!info)return[];
      const audio=String(info.url||""),mime=String(info.mime||"");
      if(!/^https:\/\//.test(audio)||!/^audio\//.test(mime)||!(/\.(mp3|ogg|oga|opus)(?:\?|$)/i.test(audio)))return[];
      const meta=info.extmetadata||{};
      const license=String(meta.LicenseShortName?.value||"");
      const licenseUrl=String(meta.LicenseUrl?.value||"");
      if(!/^(CC BY(?:-SA|-NC|-NC-SA)?(?: |$)|CC0|Public domain|PD-)/i.test(license))return[];
      const title=String(p.title||"").replace(/^File:/,"").replace(/\.(mp3|ogg|oga|opus)$/i,"").replace(/_/g," ");
      const artist=String(meta.Artist?.value||"").replace(/<[^>]+>/g," ").trim()||"";
      const description=String(meta.ImageDescription?.value||"").replace(/<[^>]+>/g," ").trim();
      if(!artist||!validCategory({title,artist,album:"",tags:"",description,lang:""},category,lang))return[];
      return [{contentId:"commons:"+p.pageid,title:safeString(title),artistId:"commons:"+normalize(artist),artistName:safeString(artist),album:genre,categoryId:category,language:lang,genre,durationSec:0,streamUrl:audio,sourceProvider:"wikimedia_commons",downloadAllowed:false,licenseName:safeString(licenseUrl||license,240),format:/\.(ogg|oga|opus)$/i.test(audio)?"OGG":"MP3",motif}];
    });
    return {raw:pages.length,tracks};
  }));
  return {tracks:batches.flatMap(r=>r.status==="fulfilled"?r.value.tracks:[]),diagnostics:{queries:batches.map((r,i)=>r.status==="fulfilled"?{term:terms[i],raw:r.value.raw,accepted:r.value.tracks.length}:{term:terms[i],error:String(r.reason).slice(0,120)})}};
}

async function audius(env,terms,category,lang,genre,motif){
  const batches=await Promise.allSettled(terms.map(async term=>{
    const u=new URL("https://api.audius.co/v1/tracks/search");
    u.searchParams.set("query",term);u.searchParams.set("limit","30");
    const headers={Accept:"application/json"};
    if(env.AUDIUS_API_KEY)headers["x-api-key"]=env.AUDIUS_API_KEY;
    const res=await fetch(u,{headers,signal:AbortSignal.timeout(8000)});
    if(!res.ok)throw Error("Audius HTTP "+res.status);
    const data=await res.json();
    return (Array.isArray(data.data)?data.data:[]).flatMap(t=>{
      if(t.is_streamable!==true||t.is_stream_gated||t.is_unlisted||t.is_scheduled_release||t.access?.stream===false||!t.id||!t.user?.name||!t.title||!(Number(t.duration)>0))return [];
      const artist=t.user.name,album=t.album_backlink?.playlist_name||"";
      if(!validCategory({title:t.title,artist,album,tags:[t.genre,t.tags].join(" "),description:t.description},category,lang))return [];
      return [{contentId:"audius:"+t.id,title:safeString(t.title),artistId:"audius:"+t.user.id,artistName:safeString(artist),album:safeString(album||"Tekli"),categoryId:category,language:lang,genre,durationSec:Number(t.duration),streamUrl:"https://api.audius.co/v1/tracks/"+encodeURIComponent(t.id)+"/stream",sourceProvider:"audius",downloadAllowed:false,licenseName:"Audius – public streaming",format:"MP3",motif,coverUrl:t.artwork?.["480x480"]||undefined}];
    });
  }));
  return {tracks:batches.flatMap(b=>b.status==="fulfilled"?b.value:[]),diagnostics:batches.map((b,i)=>b.status==="fulfilled"?{term:terms[i],accepted:b.value.length}:{term:terms[i],error:String(b.reason).slice(0,120)})};
}

export async function onRequestGet({request,env}){
  const url=new URL(request.url);
  const category=(url.searchParams.get("categoryId")||"turkuler").slice(0,40);
  const lang=(url.searchParams.get("language")||"Türkçe").slice(0,40);
  const genre=(url.searchParams.get("genre")||"Müzik").slice(0,40);
  const motif=(url.searchParams.get("motif")||"anatolia").slice(0,30);
  const q=(url.searchParams.get("q")||"").trim().slice(0,100);
  const offset=Math.min(180,Math.max(0,Number(url.searchParams.get("offset"))||0));
  const page=Math.min(3,Math.max(0,Math.floor(Number(url.searchParams.get("page"))||0)));
  const def=DEFINITIONS[category];
  const terms=q && (!def || url.searchParams.get("searchMode")==="1") ? [q] : def ? def.terms : [];
  if(!terms.length)return Response.json({tracks:[],notice:"Arama terimi bulunamadı."});
  // Rotate independent search terms instead of repeating the same six on every refresh.
  const selected=q?[...terms]:Array.from({length:Math.min(4,terms.length)},(_,i)=>terms[(page*4+i)%terms.length]);
  const [j,a,o,w,au]=await Promise.allSettled([jamendo(env,selected,category,lang,genre,motif,offset),archive(selected,category,lang,genre,motif),openverse(selected,category,lang,genre,motif,env),wikimedia(selected,category,lang,genre,motif),audius(env,selected,category,lang,genre,motif)]);
  const jamendoTracks=j.status==="fulfilled"?j.value.tracks:[];
  const archiveTracks=a.status==="fulfilled"?a.value:[];
  const openverseTracks=o.status==="fulfilled"?o.value.tracks:[];
  const wikimediaTracks=w.status==="fulfilled"?w.value.tracks:[];
  const audiusTracks=au.status==='fulfilled'?au.value.tracks:[];
  const merged=[...jamendoTracks,...archiveTracks,...openverseTracks,...wikimediaTracks,...audiusTracks];
  const seen=new Set(),tracks=merged.filter(t=>{const id=t.contentId;if(seen.has(id))return false;seen.add(id);return true}).sort((a,b)=>a.artistName.localeCompare(b.artistName,"tr")||a.album.localeCompare(b.album,"tr")||a.title.localeCompare(b.title,"tr")).slice(0,80);
  return Response.json({tracks,provider:tracks.length?(tracks.some(t=>t.sourceProvider==="jamendo")?"jamendo":tracks.some(t=>t.sourceProvider==="openverse")?"openverse":tracks.some(t=>t.sourceProvider==="wikimedia_commons")?"wikimedia_commons":tracks.some(t=>t.sourceProvider==="internet_archive")?"internet_archive":"audius"):"empty",notice:tracks.length?undefined:"Bu kategoride dili ve türü doğrulanabilen lisanslı kayıt bulunamadı. Yanlış veya yabancı kayıt gösterilmiyor.",total:tracks.length,categoryId:category,page,searchTerms:selected,diagnostics:{audiusCount:audiusTracks.length,audiusDetails:au.status==='fulfilled'?au.value.diagnostics:null,jamendoConfigured:Boolean(env.JAMENDO_CLIENT_ID),jamendoCount:jamendoTracks.length,archiveCount:archiveTracks.length,openverseCount:openverseTracks.length,wikimediaCount:wikimediaTracks.length,wikimediaDetails:w.status==="fulfilled"?w.value.diagnostics:{error:String(w.reason).slice(0,140)},openverseDetails:o.status==="fulfilled"?o.value.diagnostics:null,jamendoError:j.status==="rejected"?String(j.reason).slice(0,150):null,jamendoDetails:j.status==="fulfilled"?j.value.diagnostics:null,archiveError:a.status==="rejected"?String(a.reason).slice(0,150):null}},{headers:{"Cache-Control":"public, max-age=300"}});
}
