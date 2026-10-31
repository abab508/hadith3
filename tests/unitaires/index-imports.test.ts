import { describe, expect, it } from "vitest";
import { indexImporte, chercherNoticesImportees, recueilsImportes } from "@/donnees/index-imports";
import { normaliser } from "@/donnees/recherche";

describe("index arabe importé et transparent",()=>{
  it("245 hadiths issus de 7 recueils, sans note de fiabilité inventée",()=>{
    expect(indexImporte.hadiths).toHaveLength(245);
    expect(recueilsImportes).toHaveLength(7);
    expect(new Set(indexImporte.hadiths.map(h=>h.id)).size).toBe(245);
    for(const h of indexImporte.hadiths) {
      expect(h.texteAr.length).toBeGreaterThan(10);
      expect(h.texteAr.normalize("NFC")).toBe(h.texteAr);
      expect(h.statut).toBe("importe-non-verifie");
      expect(h.fichierSource.startsWith("https://github.com/fawazahmed0/hadith-api/blob/1/")).toBe(true);
      expect(normaliser(h.texteAr).length).toBeGreaterThan(8);
    }
  });
  it("sépare le recueil, la recherche par mot et la pagination",()=>{
    const tous=chercherNoticesImportees("",undefined,1);
    expect(tous.total).toBe(245);
    expect(tous.items).toHaveLength(10);
    expect(tous.pageTotal).toBe(25);
    expect(chercherNoticesImportees("",undefined,99).page).toBe(25);
    const seul=chercherNoticesImportees("","sahih-muslim",1);
    expect(seul.total).toBe(35);
    expect(seul.items.every(h=>h.recueil==="sahih-muslim")).toBe(true);
    expect(chercherNoticesImportees("mot-introuvable-exemple",undefined,1).total).toBe(0);
  });
  it("une référence numérique recherche un numéro entier dans le recueil",()=>{
    const res=chercherNoticesImportees("1","sahih-bukhari",1);
    expect(res.items.every(h=>h.numero==="1")).toBe(true);
  });
});
