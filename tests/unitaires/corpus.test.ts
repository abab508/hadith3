import { describe, expect, it } from "vitest";
import bibliotheques from "../../data/bibliotheques/bibliotheques.json";
import hadiths from "../../data/hadiths/exemples.json";
import transmetteurs from "../../data/transmetteurs/transmetteurs.json";
import { chargerCorpus, corpus, texteDans, verifierReferences } from "@/donnees/corpus";

describe("corpus d'exemple", () => {
  it("se charge sans erreur", () => {
    expect(() => chargerCorpus(bibliotheques, transmetteurs, hadiths)).not.toThrow();
    expect(verifierReferences(corpus)).toEqual([]);
  });

  it("n'attribue aucun jugement ni aucune donnée inventée aux transmetteurs non évalués", () => {
    const nonEvalues = corpus.transmetteurs.filter((t) => t.categorie === "non-evalue");
    expect(nonEvalues.length).toBeGreaterThan(0);
    for (const t of nonEvalues) {
      expect(t.jugements).toEqual([]);
      expect([t.verdictAr, t.deces, t.ville, t.generation]).toEqual([null, null, null, null]);
    }
  });

  it("cite Sanadset 650K et sa licence pour chaque hadith importé", () => {
    const sanadset = corpus.bibliotheques.find((b) => b.id === "sanadset");
    expect(sanadset?.description.fr).toContain("CC BY 4.0");
    const importes = corpus.hadiths.filter((h) => h.occurrences.some((o) => o.bibliotheque === "sanadset"));
    expect(importes.length).toBe(5);
    for (const h of importes) {
      expect(h.statutTerme).toBe("ghayr-muhaddad");
      expect(h.particularite.fr).toContain("Sanadset 650K");
    }
  });

  it("ne commence aucun texte par un reste de chaîne (« رضي الله عنه ، » ou une virgule)", () => {
    const textes = corpus.hadiths.flatMap((h) => [h.texteAr, ...h.occurrences.map((o) => o.texteAr)]);
    for (const texte of textes) {
      if (texte === null) continue;
      expect(texte, texte.slice(0, 40)).not.toMatch(/^\s*،/);
      expect(texte, texte.slice(0, 40)).not.toMatch(/^[^،]{0,40}رَضِيَ اللَّهُ عَنْ\S*\s*،/);
    }
  });

  it("n'affiche aucun texte provisoire entre crochets dans les noms de bibliothèque ni les références", () => {
    for (const b of corpus.bibliotheques) expect([b.nom, b.nomAr].join(" "), b.id).not.toMatch(/\[.*\]/);
    for (const t of corpus.transmetteurs) {
      for (const s of t.sources) expect(s.reference ?? "", `${t.id} · ${s.ouvrage}`).not.toMatch(/^\[.*\]$/);
    }
  });

  it("contient al-Maktaba al-Shāmila avec des recueils de hadith et des ouvrages sur les transmetteurs", () => {
    const shamila = corpus.bibliotheques.find((b) => b.id === "shamila");
    expect(shamila?.nomAr).toBe("المكتبة الشاملة");
    expect(shamila?.ouvrages.some((o) => o.categorie === "hadith")).toBe(true);
    expect(shamila?.ouvrages.some((o) => o.categorie === "rijal")).toBe(true);
  });

  it("donne une fiche à chaque transmetteur de chaque chaîne", () => {
    for (const h of corpus.hadiths) {
      const ids = [...h.chaine.tronc, ...h.chaine.voies.flatMap((v) => v.transmetteurs)];
      for (const id of ids) {
        expect(corpus.transmetteurs.some((t) => t.id === id), id).toBe(true);
      }
    }
  });

  it("signale une traduction IA comme telle, jamais comme publiée sans source", () => {
    for (const h of corpus.hadiths) {
      for (const t of h.traductions) {
        if (t.origine === "publiee") expect(t.source, `${h.id}/${t.langue}`).not.toBeNull();
      }
    }
  });

  it("refuse un transmetteur inconnu dans une chaîne", () => {
    const copie = structuredClone(hadiths);
    copie.hadiths[0]!.chaine.tronc.push("inconnu");
    expect(() => chargerCorpus(bibliotheques, transmetteurs, copie)).toThrow(/transmetteur inconnu/);
  });

  it("refuse un texte arabe non NFC sans le modifier", () => {
    const copie = structuredClone(transmetteurs);
    copie.transmetteurs[1]!.nomAr = "عمر".normalize("NFD") + "َّ";
    const avant = structuredClone(copie);
    expect(() => chargerCorpus(bibliotheques, copie, hadiths)).toThrow();
    expect(copie).toEqual(avant);
  });

  it("suit la chaîne de repli pour les textes rédigés", () => {
    expect(texteDans({ ar: "عربي", fr: "français" }, "fr")).toEqual({ tag: "fr", texte: "français" });
    expect(texteDans({ ar: "عربي", en: "english" }, "es")).toEqual({ tag: "en", texte: "english" });
    expect(texteDans({ ar: "عربي" }, "tr")).toEqual({ tag: "ar", texte: "عربي" });
  });
});
