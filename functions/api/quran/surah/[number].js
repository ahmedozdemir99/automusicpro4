export async function onRequestGet({params}) {
const number=Number(params.number);if(!Number.isInteger(number)||number<1||number>114)return Response.json({error:"Geçersiz sure numarası"},{status:400});
try {const upstream=await fetch("https://api.alquran.cloud/v1/surah/"+number+"/editions/quran-uthmani,tr.diyanet");if(!upstream.ok)throw Error("upstream");
const payload=await upstream.json();const ar=payload.data?.[0],tr=payload.data?.[1];if(!ar||!tr)throw Error("missing");
const ayahs=ar.ayahs.map((a,i)=>({numberInSurah:a.numberInSurah,globalNumber:a.number,arabicText:a.text,turkishMeal:tr.ayahs[i]?.text||""}));
return Response.json({surahNumber:number,arabicName:ar.name,ayahCount:ayahs.length,source:"AlQuran Cloud (Diyanet İşleri Meali)",ayahs},{headers:{"Cache-Control":"public, max-age=3600"}})
}catch{return Response.json({error:"Kur'an metni servisine ulaşılamıyor."},{status:502})}}