import { describe, expect, it } from "vitest";
import {
  chercher, chercherDansLivre, livresParCategorie, normaliser, numeroDemande, recueils, type Mode,
} from "@/donnees/recherche";

const ids = (requete: string) => chercher(requete).map((h) => h.id);

describe("recherche dans le corpus", () => {
  it("ignore voyelles brèves, accents et variantes de alif", () => {
    expect(normaliser("الْأَعْمَالُ")).toBe("الاعمال");
    expect(normaliser("Ṣaḥīḥ al-Bukhārī")).toBe("sahih al bukhari");
  });

  it("trouve un hadith par son texte arabe, avec ou sans voyelles ni article", () => {
    expect(ids("إنما الأعمال بالنيات")).toEqual(["niyyat"]);
    expect(ids("الإيمان بضع")).toEqual(["bukhari-8"]);
    expect(ids("حب الانصار")).toEqual(["bukhari-16"]);
    // Sans l'article, le mot trouve aussi le transmetteur Yaḥyā ibn Saʿīd al-Anṣārī (hadith des intentions).
    expect(ids("انصار")).toEqual(["niyyat", "bukhari-16"]);
  });

  it("trouve un hadith par sa traduction, sa référence ou un transmetteur", () => {
    expect(ids("intentions")).toEqual(["niyyat"]);
    expect(ids("Bukhari 13")).toEqual(["bukhari-13"]);
    expect(ids("Abu Hurayra")).toEqual(["bukhari-8", "bukhari-13"]);
    expect(ids("عائشة")).toEqual(["bukhari-2"]);
  });

  it("ne confond pas un numéro avec un autre qui le contient", () => {
    expect(ids("Bukhari 1")).toEqual(["niyyat"]);
  });

  it("reconnaît un numéro seul, en chiffres latins ou arabes", () => {
    expect(numeroDemande("13")).toBe("13");
    expect(numeroDemande("١٣")).toBe("13");
    expect(numeroDemande("Bukhari 13")).toBeUndefined();
    expect(ids("1907")).toEqual(["niyyat"]);
    expect(ids("١٦")).toEqual(["bukhari-16"]);
  });

  it("limite chaque mode à son champ", () => {
    const parMode = (requete: string, mode: Mode) => chercher(requete, mode).map((h) => h.id);
    expect(parMode("Abu Hurayra", "transmetteur")).toEqual(["bukhari-8", "bukhari-13"]);
    expect(parMode("Abu Hurayra", "traduction")).toEqual([]);
    expect(parMode("intentions", "traduction")).toEqual(["niyyat"]);
    expect(parMode("الإيمان بضع وستون", "exacte")).toEqual(["bukhari-8"]);
    expect(parMode("الإيمان وستون", "exacte")).toEqual([]);
    expect(parMode("يمان", "fragment")).toContain("bukhari-8");
    expect(parMode("Imane", "collection")).toEqual([]);
    expect(parMode("Iman", "collection")).toEqual(["bukhari-8", "bukhari-10", "bukhari-13", "bukhari-16"]);
  });

  it("sépare les recueils de hadith des livres des autres catégories", () => {
    expect(recueils().map((r) => r.id)).toEqual(["sahih-bukhari", "sahih-muslim", "sunan-abi-dawud"]);
    const categories = livresParCategorie();
    expect(categories.map((c) => c.categorie)).toEqual(["rijal"]);
    expect(categories[0]?.livres.map((l) => l.id)).toContain("taqrib");
    expect(categories.flatMap((c) => c.livres).some((l) => l.id === "sahih-bukhari")).toBe(false);
  });

  it("cherche les transmetteurs d'un livre par nom", () => {
    const noms = (livre: string, requete: string) => chercherDansLivre(livre, requete).map((r) => r.transmetteur.id);
    expect(noms("taqrib", "")).toEqual(["alqama", "taymi", "yahya", "sufyan", "humaydi", "malik", "qanabi"]);
    expect(noms("taqrib", "Sufyan")).toEqual(["sufyan"]);
    expect(noms("siyar", "مالك")).toEqual(["malik"]);
    expect(noms("taqrib", "Abu Hurayra")).toEqual([]);
  });

  it("rend tout le corpus sans requête et rien pour un mot absent", () => {
    expect(ids("")).toHaveLength(6);
    expect(ids("zzzz")).toEqual([]);
  });
});
