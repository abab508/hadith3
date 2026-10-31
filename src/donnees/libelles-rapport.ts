export const traductionsRapport = {
 fr:{home:"Accueil",search:"Recherche",print:"Imprimer / enregistrer en PDF",report:"Voir le rapport",back:"Retour au hadith"},
 ar:{home:"الرئيسية",search:"البحث",print:"طباعة / حفظ PDF",report:"عرض التقرير",back:"العودة إلى الحديث"},
 en:{home:"Home",search:"Search",print:"Print / save as PDF",report:"Open the report",back:"Back to hadith"}
} as const;
export function libellesRapport(locale:string){
 return locale==="ar"?traductionsRapport.ar:locale==="fr"?traductionsRapport.fr:traductionsRapport.en;
}
