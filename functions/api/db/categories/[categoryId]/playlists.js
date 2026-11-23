import {onRequestGet as getOpenMusic} from "../../../catalog/open-music.js";
import {defaultCategories} from "../../categories.js";

const json=(data,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store"}});
export async function onRequestGet({env,params,request}){
  const categoryId=String(params.categoryId||"");
  if(!/^[a-zA-Z0-9_-]{1,80}$/.test(categoryId))return json({error:"Invalid category"},400);
  const category=defaultCategories.find(c=>c.id===categoryId);
  let cached=[];
  let dbError=null;
  if(env.DB){
    try{
      const r=await env.DB.prepare("SELECT payload FROM catalog_tracks WHERE category_id=? ORDER BY updated_at DESC LIMIT 250").bind(categoryId).all();
      cached=(r.results||[]).map(x=>{try{return JSON.parse(x.payload)}catch{return null}}).filter(Boolean);
    }catch(e){dbError=String(e?.message||e).slice(0,180);console.error("catalog D1 read",e);}
  }else dbError="D1 binding missing";
  if(cached.length && new URL(request.url).searchParams.get("refresh")!=="1")
    return json({playlists:[],tracks:cached,source:"d1",notice:"D1 önbelleğinden lisanslı kayıtlar."});
  if(!category || category.isQuran)return json({playlists:[],tracks:cached,source:"d1",notice:"Bu kategori için açık katalog yok."});
  let discovered=[];
  let providerError=null;
  let providerNotice="";
  try{
    const refresh=new URL(request.url).searchParams.get("refresh")==="1";
    // A refresh searches different term batches, not the same first results repeatedly.
    const pages=refresh?[0,1,2]:[0];
    const results=await Promise.allSettled(pages.map(async page=>{
      const url=new URL("/api/catalog/open-music",request.url);
      for(const [key,value] of Object.entries({categoryId,language:category.language,genre:category.genre,motif:category.motif,page:String(page)}))url.searchParams.set(key,value);
      const upstream=await getOpenMusic({request:new Request(url.toString()),env});
      if(!upstream.ok)throw Error("Catalog returned HTTP "+upstream.status);
      return upstream.json();
    }));
    const successful=results.filter(r=>r.status==="fulfilled").map(r=>r.value);
    if(!successful.length)throw Error("All catalog searches failed");
    const unique=new Set();
    discovered=successful.flatMap(data=>Array.isArray(data.tracks)?data.tracks:[]).filter(t=>{
      if(t.categoryId!==categoryId||!t.contentId||!t.streamUrl||unique.has(t.contentId))return false;
      unique.add(t.contentId);return true;
    });
    providerNotice=successful.map(d=>d.notice).find(Boolean)||"";
    if(results.some(r=>r.status==="rejected"))console.warn("Partial catalog search failure",categoryId);
  }catch(e){providerError=String(e?.message||e).slice(0,180);console.error("catalog provider",e);}
  let saved=0;
  let writeError=null;
  if(env.DB && discovered.length){
    try{
      const statements=discovered.map(t=>env.DB.prepare("INSERT INTO catalog_tracks(content_id,category_id,payload,updated_at) VALUES (?,?,?,unixepoch()) ON CONFLICT(content_id) DO UPDATE SET payload=excluded.payload,category_id=excluded.category_id,updated_at=excluded.updated_at").bind(t.contentId,categoryId,JSON.stringify(t)));
      for(let i=0;i<statements.length;i+=20)await env.DB.batch(statements.slice(i,i+20));
      saved=discovered.length;
    }catch(e){writeError=String(e?.message||e).slice(0,180);console.error("catalog D1 write",e);}
  }
  const ids=new Set();
  const tracks=[...discovered,...cached].filter(t=>{if(ids.has(t.contentId))return false;ids.add(t.contentId);return true;});
  return json({
    playlists:[],tracks,source:discovered.length?"open_catalog":cached.length?"d1":"none",
    diagnostics:{d1ReadError:dbError,providerError,d1WriteError:writeError,discovered:discovered.length,cached:cached.length,saved},
    notice:tracks.length?"Açık lisanslı katalog kayıtları listeleniyor.":providerNotice||"Bu kategori için doğrulanmış lisanslı ses kaydı bulunamadı."
  });
}
