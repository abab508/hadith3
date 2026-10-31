/** Premier dossier KG importé depuis l'export SQLite fourni.
 * Ne relie que Bukhari 1, contrôlé par recueil/numéro/extrait arabe.
 * Les avis aqwal n'indiquent pas toujours le volume et la page d'origine.
 */
import dossier from "../../data/hadiths/kg-bukhari-1.json";
import type { ChaineExterneResult, MaillonExterne } from "@/donnees/chaine-distante";
import { normaliser } from "@/donnees/recherche";

const bio=(r:Record<string,unknown>)=>{
 const pieces=[
  r.nickname&&"Surnom : "+r.nickname,
  r.rank&&"Appréciation présente dans le corpus : "+r.rank,
  r.birth_year&&"Naissance (H) : "+r.birth_year,
  r.death_year&&"Décès (H) : "+r.death_year,
  r.profession&&"Fonction : "+r.profession,
  r.nasab&&"Nisba : "+r.nasab,
  r.iqama&&"Lieux de résidence rapportés : "+r.iqama,
  r.death_place&&"Lieu de décès : "+r.death_place,
 ].filter(Boolean).join(" · ");
 return {fr:pieces,ar:pieces,en:pieces};
};
export function rapportKgBukhariUn(recueil:string,numero:number,texteArabe:string|null,sourceArabe:string):ChaineExterneResult|null{
 if(recueil!=="sahih-bukhari"||numero!==1||!texteArabe)return null;
 const a=normaliser(texteArabe),sample=normaliser(dossier.hadith.taraf_nass);
 if(!a.includes(sample.slice(0,25)))return null;
 const members=dossier.chains[0].members;
 const m:MaillonExterne[]=members.filter(r=>r.pos!==0).slice().reverse().map((r,i)=>{
  const opinions=dossier.judgments_by_rawi_id[String(r.rawi_id) as keyof typeof dossier.judgments_by_rawi_id]??[];
  const verdict:MaillonExterne["verdict"]=r.rank==="صحابي"?"compagnon":opinions.length&&r.rank?.includes("ثقة")?"thiqa":"non-evalue";
  return {
    id:"kg-rawi-"+r.rawi_id,nomAr:r.nickname??r.name,nomCompletAr:r.name,fragment:r.nickname??r.name,rang:i+2,
    verdict,qualification:{ar:r.rank??"غير محدد",fr:r.rank??"Non déterminé",en:r.rank??"Undetermined"},
    bio:bio(r),
    reference:"Hadith Knowledge Graph : rawis #"+r.rawi_id+" ; aqwal (références d'ouvrages à vérifier)",
    jugements:opinions.map(j=>({
      auteur:j.scholar_shuhra??j.scholar_name??"Auteur non identifié",
      appreciation:{ar:j.qawl,fr:j.qawl,en:j.qawl},
      ouvrage:"Hadith KG · aqwal #"+j.id+" (texte arabe original)",
    })),
  };
 });
 return {etat:"complete-apparente",maillons:[
  {id:"kg-prophete",nomAr:"النبي ﷺ",fragment:"النبي ﷺ",rang:1,verdict:"source"},
  ...m
 ],mentionRenvoi:false,extrait:texteArabe.slice(0,620),sourceArabe};
}
