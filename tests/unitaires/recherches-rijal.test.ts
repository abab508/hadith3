import { describe,expect,it } from "vitest";
import { corpus } from "@/donnees/corpus";
import { noticeRijal, referenceHadithRijal, traduireNotice } from "@/donnees/recherches-rijal";
describe("Recherches biographiques liées à la bonne voie",()=>{
  const chain=corpus.hadiths.find(h=>h.id==="bukhari-8")!.chaine;
  const ids=[...chain.tronc,...chain.voies.flatMap(v=>v.transmetteurs)];
  it("référence six rapporteurs distincts du hadith importé",()=>{
    for(const id of ids.filter(id=>id!=="prophete"&&id!=="bukhari")){
      const dossier=noticeRijal("bukhari-8",id);
      expect(dossier,id).toBeDefined();
      expect(dossier?.source.url).toMatch(/^https:\/\//);
      expect(dossier?.critics.length).toBeGreaterThan(0);
      expect(dossier?.identity.fr.length).toBeGreaterThan(40);
    }
    expect(noticeRijal("bukhari-8","prophete")).toBeUndefined();
  });
  it("ne copie jamais un jugement sur une chaîne ou un homonyme distinct",()=>{
    expect(noticeRijal("bukhari-2","b8-6")).toBeUndefined();
    expect(noticeRijal("niyyat","umar")).toBeUndefined();
    expect(noticeRijal("bukhari-8","b2-1")).toBeUndefined();
  });
  it("distingue la numérotation publique 9 et l'identifiant importé 8",()=>{
    expect(referenceHadithRijal("bukhari-8")).toEqual({
      ouvrage:"Ṣaḥīḥ al-Bukhārī",numeroExterne:"9",numeroCorpus:"8",
      url:"https://sunnah.com/bukhari:9"
    });
  });
  it("ne remplace pas les valeurs générales non évaluées du corpus",()=>{
    expect(corpus.transmetteurs.find(t=>t.id==="b8-5")?.categorie).toBe("non-evalue");
    expect(noticeRijal("bukhari-8","b8-5")?.classification).toBe("thiqa");
    expect(noticeRijal("bukhari-8","b8-6")?.classification).toBe("compagnon");
  });
  it("retourne le texte avec une direction de lecture adéquate",()=>{
    const d=noticeRijal("bukhari-8","b8-2")!;
    expect(traduireNotice(d.assessment,"ar").dir).toBe("rtl");
    expect(traduireNotice(d.assessment,"fr").dir).toBe("ltr");
  });
});
