import { describe,expect,it } from "vitest";
import { extraireChaineArabe } from "@/donnees/chaine-distante";

const bukhari1961="حَدَّثَنَا مُسَدَّدٌ، قَالَ حَدَّثَنِي يَحْيَى، عَنْ شُعْبَةَ، قَالَ حَدَّثَنِي قَتَادَةُ، عَنْ أَنَسٍ ـ رضى الله عنه ـ عَنِ النَّبِيِّ صلى الله عليه وسلم قَالَ ‏ لاَ تُوَاصِلُوا";
const bukhari1804="حَدَّثَنَا عَبْدُ اللَّهِ بْنُ مَسْلَمَةَ، حَدَّثَنَا مَالِكٌ، عَنْ سُمَىٍّ، عَنْ أَبِي صَالِحٍ، عَنْ أَبِي هُرَيْرَةَ ـ رضى الله عنه ـ عَنِ النَّبِيِّ صلى الله عليه وسلم قَالَ السَّفَرُ قِطْعَةٌ";
const bukhari1="حَدَّثَنَا الْحُمَيْدِيُّ عَبْدُ اللَّهِ بْنُ الزُّبَيْرِ ، قَالَ : حَدَّثَنَا سُفْيَانُ ، قَالَ : حَدَّثَنَا يَحْيَى بْنُ سَعِيدٍ الْأَنْصَارِيُّ ، قَالَ : أَخْبَرَنِي مُحَمَّدُ بْنُ إِبْرَاهِيمَ التَّيْمِيُّ ، أَنَّهُ سَمِعَ عَلْقَمَةَ بْنَ وَقَّاصٍ اللَّيْثِيَّ ، يَقُولُ : سَمِعْتُ عُمَرَ بْنَ الْخَطَّابِ رَضِيَ اللَّهُ عَنْهُ عَلَى الْمِنْبَرِ، قَالَ : سَمِعْتُ رَسُولَ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ";
describe("Extraction prudente des noms depuis la source arabe du hadith",()=>{
 it("1961 : retrouve les cinq noms cités et la source, sans note inventée",()=>{
  const r=extraireChaineArabe(bukhari1961,"sahih-bukhari",1961,"test");
  expect(r.etat).toBe("complete-apparente");
  expect(r.maillons.map(x=>x.nomAr)).toEqual(["النبي ﷺ","انس","قتادة","شعبة","يحيي","مسدد"]);
  expect(r.maillons.filter(x=>x.verdict==="thiqa")).toHaveLength(4);
  expect(r.maillons.find(x=>x.nomAr==="انس")?.verdict).toBe("compagnon");
  expect(r.maillons.find(x=>x.nomAr==="يحيي")?.referenceUrl).toContain("القطان");
 });
 it("1804 : n'invente pas de fiabilité pour les homonymes",()=>{
  const r=extraireChaineArabe(bukhari1804,"sahih-bukhari",1804,"test");
  expect(r.etat).toBe("complete-apparente");
  expect(r.maillons.map(x=>x.nomAr)).toEqual(["النبي ﷺ","ابي هريرة","ابي صالح","سمي","مالك","عبد الله بن مسلمة"]);
  expect(r.maillons.find(x=>x.nomAr==="ابي هريرة")?.verdict).toBe("compagnon");
  expect(r.maillons.find(x=>x.nomAr==="ابي صالح")?.verdict).toBe("non-evalue");
 });
 it("ne transforme pas un renvoi à un sanad antérieur en chaîne complète",()=>{
  const r=extraireChaineArabe("وَحَدَّثَنَاهُ عُبَيْدُ اللَّهِ بْنُ مُعَاذٍ، حَدَّثَنَا أَبِي، حَدَّثَنَا شُعْبَةُ، بِهَذَا الإِسْنَادِ مِثْلَهُ ‏.‏","sahih-muslim",1907,"test");
  expect(r.etat).toBe("partielle");
  expect(r.mentionRenvoi).toBe(true);
 });
 it("un texte sans marqueurs ne génère pas de faux rapporteurs",()=>{
  expect(extraireChaineArabe("الاسلام بني على خمس","sahih-bukhari",10,"test").maillons).toEqual([]);
 });
 it("ne déduit aucun jugement des données d'une autre narration",()=>{
  const r=extraireChaineArabe(bukhari1804,"sahih-bukhari",1805,"test");
  expect(r.maillons.find(x=>x.nomAr==="ابي هريرة")?.verdict).toBe("non-evalue");
  expect(extraireChaineArabe(bukhari1961,"sahih-bukhari",1962,"test").maillons.filter(x=>x.verdict==="thiqa")).toHaveLength(0);
 });
 it("reconnaît la source dans le hadith des intentions",()=>{
  const r=extraireChaineArabe(bukhari1,"sahih-bukhari",1,"test");
  expect(r.maillons.length).toBeGreaterThanOrEqual(6);
  expect(r.maillons[0]?.verdict).toBe("source");
 });
});
