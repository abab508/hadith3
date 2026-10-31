/** Validateur strict de documents KG avant toute liaison aux rapports.
 * Les noms seuls ne doivent jamais produire une identité fiable.
 */
export type RawiImport = {
 source:"emadjumaah/hadith-kg";
 type:"rawi";
 data:Record<string,unknown>;
};
export type RawiControle = {ok:true;id:string;data:Record<string,unknown>}|{ok:false;reason:string};
export function verifierRawiImport(value:unknown):RawiControle{
 if(!value||typeof value!=="object"||Array.isArray(value))return {ok:false,reason:"Document invalide"};
 const doc=value as Partial<RawiImport>;
 if(doc.source!=="emadjumaah/hadith-kg"||doc.type!=="rawi"||!doc.data||typeof doc.data!=="object"||Array.isArray(doc.data))
   return {ok:false,reason:"Provenance ou format incorrect"};
 const id=doc.data.id;
 if((typeof id!=="number"||!Number.isSafeInteger(id)||id<1)&&(typeof id!=="string"||!/^[1-9][0-9]{0,15}$/.test(id)))
   return {ok:false,reason:"Identifiant source absent ou invalide"};
 const serial=JSON.stringify(doc.data);
 if(serial.length>64000)return {ok:false,reason:"Fiche trop volumineuse"};
 return {ok:true,id:String(id),data:doc.data};
}
