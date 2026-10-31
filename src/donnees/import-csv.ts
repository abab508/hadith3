/* Import de notices en lecture seule côté navigateur, vérifié à nouveau côté serveur.
 * On ajoute des entrées à l'index documentaire; aucune chaîne de transmission
 * ni validation religieuse n'est déduite automatiquement. */
export const IMPORT_COLUMNS = ["recueil","recueilAr","recueilLatin","numero","livreNumero","texteAr","source","fichierSource"] as const;
export type ImportedNotice = {
  id:string; recueil:string; recueilAr:string; recueilLatin:string;
  numero:string; livreNumero:string; texteAr:string; source:string;
  fichierSource:string; statut:"importe-non-verifie";
};
export type CsvRow = Record<string,string>;
export type RowResult = {line:number; notice?:ImportedNotice; errors:string[]};
const PREFIXES:Record<string,string>={
  "sahih-bukhari":"bukhari","sahih-muslim":"muslim",
  "sunan-abi-dawud":"abudawud","jami-tirmidhi":"tirmidhi",
  "sunan-nasai":"nasai","sunan-ibn-majah":"ibnmajah","muwatta":"malik",
};
export function stableNoticeId(recueil:string,numero:string):string {
  const prefix=PREFIXES[recueil]??recueil;
  return prefix+"-"+numero.trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
}
export function referenceKey(item:Pick<ImportedNotice,"recueil"|"numero">):string{
  return item.recueil.trim().toLowerCase()+"\u0000"+item.numero.trim().toLowerCase();
}
export function parseCsv(csv:string) {
  const raw=csv.replace(/^\uFEFF/,"");
  const header=raw.split(/\r?\n/,1)[0]??"";
  const delimiter=(header.match(/;/g)??[]).length>(header.match(/,/g)??[]).length?";":",";
  const cells:string[][]=[];
  let row:string[]=[],cell="",inside=false;
  const errors:string[]=[];
  for(let i=0;i<raw.length;i++){
    const c=raw[i]!;
    if(c==='"'){
      if(inside&&raw[i+1]==='"'){cell+='"';i++;}
      else if(!inside && cell.trim()===""){inside=true;}
      else if(inside){inside=false;}
      else {errors.push("Guillemets mal placés dans le CSV.");}
    } else if(!inside&&c===delimiter){row.push(cell);cell="";}
    else if(!inside&&(c==="\n"||c==="\r")){
      if(c==="\r"&&raw[i+1]==="\n")i++;
      row.push(cell);cell="";
      if(row.some(x=>x.trim()))cells.push(row);
      row=[];
    } else cell+=c;
    if(cells.length>201){errors.push("Limite de 200 lignes de données par import.");break;}
  }
  if(inside)errors.push("Un champ CSV possède des guillemets non fermés.");
  row.push(cell);
  if(row.some(x=>x.trim()))cells.push(row);
  if(!cells.length)return {headers:[] as string[],rows:[] as CsvRow[],errors:["Le CSV est vide."]};
  const headers=cells[0]!.map(v=>v.trim());
  if(new Set(headers).size!==headers.length)errors.push("En-têtes CSV dupliqués.");
  const missing=IMPORT_COLUMNS.filter(key=>!headers.includes(key));
  if(missing.length)errors.push("Colonnes obligatoires manquantes : "+missing.join(", "));
  const rows=cells.slice(1).map((values,i)=>{
    if(values.length!==headers.length) errors.push("Ligne "+(i+2)+" : nombre de colonnes différent des en-têtes.");
    return Object.fromEntries(headers.map((k,j)=>[k,values[j]??""])) as CsvRow;
  });
  return {headers,rows,errors};
}
function asText(row:CsvRow,key:string){return (row[key]??"").trim().normalize("NFC");}
export function validateRows(rows:readonly CsvRow[], existing:readonly Pick<ImportedNotice,"id"|"recueil"|"numero">[]=[]):RowResult[]{
  const ids=new Set(existing.map(x=>x.id)),refs=new Set(existing.map(referenceKey));
  const seenIds=new Set<string>(),seenRefs=new Set<string>();
  return rows.map((raw,index)=>{
    const errors:string[]=[];
    const recueil=asText(raw,"recueil"),numero=asText(raw,"numero");
    const id=asText(raw,"id") || stableNoticeId(recueil,numero);
    const recueilAr=asText(raw,"recueilAr"),recueilLatin=asText(raw,"recueilLatin");
    const livreNumero=asText(raw,"livreNumero"),texteAr=asText(raw,"texteAr");
    const source=asText(raw,"source"),fichierSource=asText(raw,"fichierSource");
    if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)||id.length>110)errors.push("Identifiant invalide.");
    if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(recueil)||recueil.length>100)errors.push("Code du recueil invalide.");
    if(!numero||numero.length>60)errors.push("Numéro de hadith manquant ou trop long.");
    if(!recueilAr||recueilAr.length>150)errors.push("Nom arabe du recueil manquant.");
    if(!recueilLatin||recueilLatin.length>150)errors.push("Nom latin du recueil manquant.");
    if(!livreNumero||livreNumero.length>60)errors.push("Numéro du livre manquant.");
    if(texteAr.length<10||texteAr.length>12000||!/\p{Script=Arabic}/u.test(texteAr))errors.push("Texte arabe obligatoire (10 à 12 000 caractères).");
    if(source.length<3||source.length>180)errors.push("Source de données manquante.");
    try{
      const url=new URL(fichierSource);
      if(url.protocol!=="https:"||!url.hostname.includes(".")||url.username||url.password||fichierSource.length>500)
        errors.push("URL de source HTTPS invalide.");
    }catch{errors.push("URL de source HTTPS invalide.");}
    const ref=referenceKey({recueil,numero});
    if(ids.has(id)||refs.has(ref))errors.push("Doublon dans l'index existant : même identifiant ou référence.");
    if(seenIds.has(id)||seenRefs.has(ref))errors.push("Doublon dans le fichier : même identifiant ou référence.");
    seenIds.add(id);seenRefs.add(ref);
    return {line:index+2, errors, notice: errors.length===0?{
      id,recueil,recueilAr,recueilLatin,numero,livreNumero,texteAr,source,fichierSource,statut:"importe-non-verifie"
    }:undefined};
  });
}
export function summaryRows(rows:readonly RowResult[]){
  return {total:rows.length,ready:rows.filter(x=>x.notice).length,blocked:rows.filter(x=>x.errors.length>0).length};
}
