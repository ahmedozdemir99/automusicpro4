// Metadata only. MusicBrainz does not grant streaming rights.
const ARTISTS={
 arabesk:["Müslüm Gürses","Orhan Gencebay","İbrahim Tatlıses","Ferdi Tayfur","Bergen"],
 turk_pop:["Sezen Aksu","Tarkan","Ajda Pekkan","Sertab Erener","Kenan Doğulu"],
 nostalji:["Barış Manço","Cem Karaca","Erkin Koray","Zeki Müren","Müzeyyen Senar"],
 turkuler:["Neşet Ertaş","Aşık Veysel","Arif Sağ","Musa Eroğlu","Sabahat Akkiraz"],
 karadeniz:["Kazım Koyuncu","Volkan Konak","Resul Dindar","Selçuk Balcı","İsmail Türüt"]
};
const clean=s=>String(s||"").trim().slice(0,100);
export async function onRequestGet({request}){
 const url=new URL(request.url),category=clean(url.searchParams.get("categoryId"));
 const names=ARTISTS[category]||[];
 if(!names.length)return Response.json({artists:[],albums:[],notice:"Bu kategori için doğrulanmış sanatçı seçkisi henüz hazırlanmadı."});
 const requested=clean(url.searchParams.get("artist"));
 if(!requested)return Response.json({artists:names,albums:[],metadataOnly:true});
 if(!names.includes(requested))return Response.json({error:"Sanatçı bu seçkide yok."},{status:400});
 const q='artist:"'+requested.replace(/["\\]/g,"")+'" AND primarytype:album';
 const endpoint=new URL("https://musicbrainz.org/ws/2/release-group/");
 endpoint.searchParams.set("query",q);endpoint.searchParams.set("fmt","json");endpoint.searchParams.set("limit","35");
 try{
 const res=await fetch(endpoint.toString(),{headers:{"User-Agent":"AutoMusicPro4/1.0 (https://automusicpro4.pages.dev/)","Accept":"application/json"},cf:{cacheTtl:3600,cacheEverything:true}});
 if(!res.ok)throw Error("MusicBrainz "+res.status);
 const data=await res.json();
 const norm=s=>String(s||"").toLocaleLowerCase("tr-TR").trim();
 const albums=(data["release-groups"]||[]).filter(x=>(x["artist-credit"]||[]).some(a=>norm(a.artist?.name||a.name)===norm(requested))&&x["primary-type"]==="Album").map(x=>({id:x.id,title:x.title,year:(x["first-release-date"]||"").slice(0,4),artist:requested,coverUrl:"https://coverartarchive.org/release-group/"+encodeURIComponent(x.id)+"/front-250",sourceUrl:"https://musicbrainz.org/release-group/"+encodeURIComponent(x.id)}));
 return Response.json({artists:names,albums,metadataOnly:true,notice:"Albüm bilgileri MusicBrainz kaynağındandır. Bu albümler uygulama içinde çalınamaz."},{headers:{"Cache-Control":"public, max-age=3600"}});
 }catch{return Response.json({artists:names,albums:[],metadataOnly:true,notice:"Albüm veritabanına şu anda ulaşılamıyor. Daha sonra yeniden deneyin."});}
}