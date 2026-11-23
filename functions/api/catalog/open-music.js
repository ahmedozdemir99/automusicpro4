export async function onRequestGet({request,env}) {
const url=new URL(request.url),query=(url.searchParams.get("q")||"").trim().slice(0,140),categoryId=(url.searchParams.get("categoryId")||"turkuler").slice(0,40),language=(url.searchParams.get("language")||"Türkçe").slice(0,40),genre=(url.searchParams.get("genre")||"Müzik").slice(0,40),motif=(url.searchParams.get("motif")||"anatolia").slice(0,24);
if(!query)return Response.json({tracks:[],provider:"none",notice:"Arama sorgusu belirtilmedi."});
// Never label foreign-language recordings as Turkish just because the request says Türkçe.
const normalize = value => String(value || "").toLocaleLowerCase("tr-TR");
const categoryWords = {
  turkuler:["türkü","turku","halk müziği","folk","bağlama","saz","anatolian folk"],
  nostalji:["nostalji","nostalgia","eski türkçe","turkish oldies"],
  arabesk:["arabesk","arabesque","turkish arabesk"],
  karadeniz:["karadeniz","black sea","horon","kemençe","trabzon","rize"],
  pop:["pop","turkish pop","türkçe pop"],
  ilahi:["ilahi","ilahiler","tasavvuf","sufi","nasheed"],
  ezgi:["ezgi","özgün müzik","turkish folk"],
  nesid:["neşid","nesid","nasheed"],
  tasavvuf:["tasavvuf","sufi","mevlevi"]
};
const desired=normalize(language);
const isTurkish=desired.includes("türk");
const matchCategory=(title,artist,album)=>{const text=normalize([title,artist,album].join(" "));const words=categoryWords[normalize(categoryId)]||categoryWords[normalize(genre)]||[];return !words.length||words.some(word=>text.includes(normalize(word)))};
const turkishEvidence=(title,artist,album,tags="")=>{const text=normalize([title,artist,album,tags].join(" "));return /türkçe|turkish|türkiye|turkey|anatolian|anadolu|türkü|turku|bağlama|baglama|karadeniz|kemençe|horon|arabesk|ilahi|tasavvuf/.test(text)};
const tracks=[];let jamendoError=false;
if(env.JAMENDO_CLIENT_ID){try{
const u=new URL("https://api.jamendo.com/v3.0/tracks/");for(const [k,v]of Object.entries({client_id:env.JAMENDO_CLIENT_ID,format:"json",limit:"20",search:query,audioformat:"mp32"}))u.searchParams.set(k,v);
const res=await fetch(u.toString());if(!res.ok)throw Error("Jamendo HTTP "+res.status);const data=await res.json();
if(data.headers?.status==="failed")throw Error("Jamendo API error");
for(const item of data.results||[]){if(!item.audio||!item.audio.startsWith("https://"))continue;
if(isTurkish&&!turkishEvidence(item.name,item.artist_name,item.album_name,item.musicinfo?.tags?.genres?.join(" ")))continue;
if(!matchCategory(item.name,item.artist_name,item.album_name))continue;
tracks.push({contentId:"jamendo:"+item.id,title:item.name,artistId:"jamendo-artist:"+item.artist_id,artistName:item.artist_name,album:item.album_name||genre,categoryId,language,genre,durationSec:Number(item.duration)||0,streamUrl:item.audio,sourceProvider:"jamendo",downloadAllowed:Boolean(item.audiodownload_allowed),licenseName:item.license_ccurl?"Creative Commons (Jamendo)":"Jamendo Açık Dinleme",bitrateKbps:192,format:"MP3",motif})}
}catch{jamendoError=true}}
if(!tracks.length){try{
const u=new URL("https://archive.org/advancedsearch.php");u.searchParams.set("q",query+" AND mediatype:audio AND licenseurl:*");u.searchParams.append("fl[]","identifier");u.searchParams.append("fl[]","title");u.searchParams.append("fl[]","creator");u.searchParams.append("fl[]","licenseurl");u.searchParams.set("rows","6");u.searchParams.set("output","json");
const r=await fetch(u.toString(),{headers:{Accept:"application/json"}});if(r.ok){const data=await r.json();const docs=(data.response?.docs||[]).filter(x=>x.licenseurl&&(!isTurkish||turkishEvidence(x.title,x.creator,x.subject,x.description))).slice(0,4);
const results=await Promise.allSettled(docs.map(async doc=>{const resp=await fetch("https://archive.org/metadata/"+encodeURIComponent(doc.identifier)+"/files");if(!resp.ok)return [];const m=await resp.json();return(m.result||[]).filter(f=>f.name&&/\.(mp3|ogg)$/i.test(f.name)&&!f.name.includes("_64kb")).filter(f=>!isTurkish||turkishEvidence(f.title||f.name,f.artist||doc.creator,f.album||doc.title,doc.subject)).filter(f=>matchCategory(f.title||f.name,f.artist||doc.creator,f.album||doc.title)).slice(0,3).map(f=>({contentId:"ia:"+doc.identifier+":"+f.name,title:f.title||f.name,artistId:"ia:"+doc.identifier,artistName:f.artist||doc.creator||"Internet Archive",album:f.album||doc.title||"",categoryId,language,genre,durationSec:Number(f.length)||0,streamUrl:"https://archive.org/download/"+encodeURIComponent(doc.identifier)+"/"+f.name.split("/").map(encodeURIComponent).join("/"),sourceProvider:"internet_archive",downloadAllowed:true,licenseName:"Internet Archive · "+doc.licenseurl,format:"MP3",motif}))}));for(const result of results)if(result.status==="fulfilled")tracks.push(...result.value)}
}catch{}}
return Response.json({tracks,provider:tracks[0]?.sourceProvider||"empty",notice:tracks.length?undefined:jamendoError?"Jamendo yanıt vermedi veya uygun Türkçe kayıt bulunamadı.":"Bu kategoriye uygun Türkçe ve lisans bilgisi olan kayıt bulunamadı; yabancı müzik gösterilmiyor."},{headers:{"Cache-Control":"public, max-age=300"}})
}