#!/usr/bin/env node
// Construire des index inversés légers à partir des éditions distantes @1.
// AUCUN texte intégral dans les index ; seul un couple numéro/référence + postings est conservé.
// node scripts/build-hadith-search-index.mjs [--book=bukhari] [--language=fra]
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
const BOOKS=["bukhari","muslim","abudawud","tirmidhi","nasai","ibnmajah","malik"];
const LANGUAGES=["fra","ara"]; // FR + arabe en priorité. Les autres langues conservent le moteur distant existant.
const FRENCH=new Set(["bukhari","muslim","abudawud","nasai","ibnmajah","malik"]);
const SOURCE="fawazahmed0/hadith-api@1";
const bases=[
  "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/",
  "https://raw.githubusercontent.com/fawazahmed0/hadith-api/1/editions/"
];
const dir=join(process.cwd(),"data/search-index");
const args=Object.fromEntries(process.argv.slice(2).filter(x=>x.startsWith("--")&&x.includes("=")).map(x=>x.slice(2).split("=")));
const books=args.book?BOOKS.filter(x=>x===args.book):BOOKS;
const languages=args.language?LANGUAGES.filter(x=>x===args.language):LANGUAGES;
if(!books.length||!languages.length)throw Error("Unknown --book or --language");

function normaliser(texte){
 return texte.normalize("NFD").replace(/[\p{M}\p{Lm}ـ]/gu,"")
  .replace(/[أإآٱ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه")
  .replace(/ؤ/g,"و").replace(/ئ/g,"ي").toLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu," ").trim();
}
const PREFIXES=["وبال","فبال","وال","فال","بال","كال","لل","ال","و","ف","ب","ك","ل"];
function tokens(text){
 const words=normaliser(text).split(" ").filter(x=>x.length>=2&&x.length<=55);
 const seen=new Set();
 for(const word of words){
  seen.add(word);
  if(/[\u0600-\u06ff]/u.test(word)){
   for(const pre of PREFIXES)if(word.startsWith(pre)&&word.length-pre.length>=3)seen.add(word.slice(pre.length));
  }
 }
 return seen;
}
function encodedPosting(arr){
 const bytes=[];let prev=0;
 for(const n of arr){
  let d=n-prev;prev=n;
  while(d>=128){bytes.push((d&127)|128);d=Math.floor(d/128);}
  bytes.push(d);
 }
 return Buffer.from(bytes).toString("base64");
}
async function download(language,book){
 const file=language+"-"+book+".min.json";
 for(const base of bases)for(let attempt=0;attempt<2;attempt++){
  try{
   const r=await fetch(base+file,{headers:{"User-Agent":"Milaghaiba-Index-Builder/1.0"},signal:AbortSignal.timeout(90000)});
   if(!r.ok)throw Error("HTTP "+r.status);
   const obj=await r.json();
   if(!Array.isArray(obj.hadiths)||obj.hadiths.length<10)throw Error("Invalid upstream edition");
   return obj;
  }catch(error){console.warn("Retry",file,error instanceof Error?error.message:String(error));}
 }
 throw Error("Failed downloading "+file);
}
async function build(language,book){
 const upstream=await download(language,book);
 const docs=[];const posts=new Map();
 for(const row of upstream.hadiths){
  if(!Number.isSafeInteger(row.hadithnumber)||row.hadithnumber<=0||typeof row.text!=="string")continue;
  const no=row.hadithnumber,section=Number(row.reference?.book??0),inBook=Number(row.reference?.hadith??0);
  if(!Number.isSafeInteger(section)||section<=0)continue; // no safe section mapping
  if(!Number.isSafeInteger(inBook)||inBook<=0)continue;
  const id=docs.length;docs.push([no,section,inBook]);
  for(const word of tokens(row.text)){
   if(!posts.has(word))posts.set(word,[]);
   posts.get(word).push(id);
  }
 }
 if(docs.length<10)throw Error("Too few indexed hadiths for "+language+"-"+book);
 const terms={};
 for(const [word,ids] of [...posts.entries()].sort((a,b)=>a[0].localeCompare(b[0],"en"))){
  // posting ordinals always increasing since each doc is visited once
  terms[word]=encodedPosting(ids);
 }
 const payload={version:1,source:SOURCE,edition:language+"-"+book,
  language,book,total:docs.length,docs,terms};
 const file=language+"-"+book+".json";
 await writeFile(join(dir,file),JSON.stringify(payload));
 const size=(Buffer.byteLength(JSON.stringify(payload))/1024/1024).toFixed(2);
 console.log("Indexed",file,docs.length,"hadiths,",posts.size,"terms,",size,"MiB");
 return {language,book,count:docs.length,terms:posts.size,file};
}
await mkdir(dir,{recursive:true});
const entries=[];
for(const lang of languages)for(const book of books){
 if(lang==="fra"&&!FRENCH.has(book))continue;
 entries.push(await build(lang,book));
}
const manifestPath=join(dir,"manifest.json");
if(!args.book&&!args.language){
 await writeFile(manifestPath,JSON.stringify({version:1,source:SOURCE,generatedAt:new Date().toISOString(),entries},null,2)+"\n");
 console.log("Manifest",entries.length,"editions.");
}else{
 console.log("Partial run: manifest intentionally unchanged.");
}
