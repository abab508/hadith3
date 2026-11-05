import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import brut from "../../data/chapitres/index.json";
import { chapitreKg, chapitresDuThemeKg, lienHadith, motifsDe, titreKg, tousLesChapitresKg } from "@/donnees/chapitres-kg";
import { imageMotif, motifsIllustrations } from "@/donnees/illustrations-chapitres";
import { EXTERNAL_COLLECTIONS } from "@/donnees/recherche-distante";
import { recueilsKg } from "@/donnees/recueils-kg";
import { themes } from "@/donnees/themes";

type IndexChapitres = { themes: Record<string, string[]> };
const index = brut as unknown as IndexChapitres;
const chapitres = tousLesChapitresKg();
const anciens = ["signes-mineurs", "signes-majeurs", "venue-de-dajjal", "descente-de-issa", "fin-du-monde"];
const objet = (valeur: unknown): valeur is Record<string, unknown> => typeof valeur === "object" && valeur !== null && !Array.isArray(valeur);

describe("catalogue complet des chapitres illustrés", () => {
  it("rend chaque sujet accessible depuis son thème avec son arabe et un titre de repli utilisable", () => {
    const idsThemes = new Set(themes.map((theme) => theme.id));
    const rattaches = new Map<string, number>();
    for (const [theme, ids] of Object.entries(index.themes)) {
      expect(idsThemes.has(theme), `Thème inconnu : ${theme}`).toBe(true);
      expect(new Set(ids).size, `Doublon dans le thème ${theme}`).toBe(ids.length);
      for (const id of ids) {
        expect(chapitreKg(id)?.theme, `${theme}/${id}`).toBe(theme);
        rattaches.set(id, (rattaches.get(id) ?? 0) + 1);
      }
    }
    for (const theme of themes) expect(chapitresDuThemeKg(theme.id).length, theme.id).toBeGreaterThan(0);
    for (const chapitre of chapitres) {
      expect(chapitre.id, "Identifiant routable").toMatch(/^(?:c\d+|[a-z]+(?:-[a-z]+)+)$/);
      expect(rattaches.get(chapitre.id), `Sujet inaccessible ou rattaché deux fois : ${chapitre.id}`).toBe(1);
      expect(Number.isSafeInteger(chapitre.sujet) && chapitre.sujet > 0, chapitre.id).toBe(true);
      expect(Number.isSafeInteger(chapitre.nombre) && chapitre.nombre >= 0, chapitre.id).toBe(true);
      expect(chapitre.ar, `${chapitre.id} : arabe source absent`).toMatch(/\p{Script=Arabic}/u);
      expect(new Set(chapitre.sous.map((sous) => sous.id)).size, `${chapitre.id} : sous-chapitre en double`).toBe(chapitre.sous.length);
      for (const entree of [chapitre, ...chapitre.sous]) {
        expect(entree.ar.trim(), `${chapitre.id}/${entree.id}`).not.toBe("");
        expect(entree.ar, `${chapitre.id}/${entree.id}`).toMatch(/\p{Script=Arabic}/u);
        expect(entree.fr === null || (typeof entree.fr === "string" && entree.fr.trim().length > 0), `${chapitre.id}/${entree.id} : français vide`).toBe(true);
        expect(Number.isSafeInteger(entree.nombre) && entree.nombre >= 0, `${chapitre.id}/${entree.id}`).toBe(true);
        expect(titreKg(entree, "ar")).toEqual({ texte: entree.ar, langue: "ar" });
        expect(titreKg(entree, "fr")).toEqual(entree.fr ? { texte: entree.fr, langue: "fr" } : { texte: entree.ar, langue: "ar" });
      }
      for (const sous of chapitre.sous) expect(sous.id, `${chapitre.id}/${sous.id}`).toMatch(/^s\d+$/);
    }
  });

  it("conserve la navigation existante et couvre croyance, famille, mariage, justice, savoir et jihād", () => {
    expect(chapitresDuThemeKg("fin-des-temps").slice(0, anciens.length).map((c) => c.id)).toEqual(anciens);
    const sujets = [
      { id: "c3", theme: "croyance", titre: /foi/i },
      { id: "c48596", theme: "relations", titre: /famille/i },
      { id: "c48886", theme: "relations", titre: /mariage/i },
      { id: "c46937", theme: "autres-themes", titre: /jugement/i },
      { id: "c11954", theme: "science", titre: /savant|étudiant/i },
      { id: "c38359", theme: "adoration", titre: /jihād|expédition/i },
    ];
    for (const sujet of sujets) {
      const chapitre = chapitreKg(sujet.id);
      expect(chapitre, `Sujet attendu absent : ${sujet.id}`).toBeDefined();
      expect(chapitre?.theme).toBe(sujet.theme);
      expect(chapitre?.fr).toMatch(sujet.titre);
      expect(chapitre?.sous.length, `${sujet.id} : classement absent`).toBeGreaterThan(0);
    }
    expect(motifsDe("Le mariage et la famille", "relations")).toContain("maison");
    expect(motifsDe("La justice et les droits", "autres-themes")).toContain("balance");
    expect(motifsDe("La science et le savoir", "science")).toContain("plume");
    expect(motifsDe("Le jihād et le combat", "adoration")).toContain("etendard");
  });

  it("diagnostique les références absentes, hors recueil ou non routables sans confondre nombre source et références dédoublonnées", () => {
    const erreurs: string[] = [];
    const recueilsApi = new Set<string>(EXTERNAL_COLLECTIONS.map((recueil) => recueil.id));
    for (const chapitre of chapitres) {
      let fichier: unknown;
      try { fichier = JSON.parse(readFileSync(join(process.cwd(), "data", "chapitres", "hadiths", `${chapitre.id}.json`), "utf8")); }
      catch (erreur) { erreurs.push(`${chapitre.id} : fichier de références absent ou invalide (${String(erreur)})`); continue; }
      if (!objet(fichier) || !objet(fichier.sous) || !objet(fichier.autres)) {
        erreurs.push(`${chapitre.id} : structure attendue { sous, autres } absente`);
        continue;
      }
      const sousDeclares = new Set(chapitre.sous.map((sous) => sous.id));
      for (const id of Object.keys(fichier.sous)) if (!sousDeclares.has(id)) erreurs.push(`${chapitre.id}/${id} : sous-chapitre non déclaré dans l’index`);
      for (const id of sousDeclares) if (!(id in fichier.sous)) erreurs.push(`${chapitre.id}/${id} : références du sous-chapitre manquantes`);
      const uniques = new Set<string>();
      for (const [sid, refs] of [...Object.entries(fichier.sous), ["autres", fichier.autres] as const]) {
        if (!objet(refs)) { erreurs.push(`${chapitre.id}/${sid} : références invalides`); continue; }
        for (const [base, numeros] of Object.entries(refs)) {
          const correspondance = /^(h|r)\/([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(base);
          if (!correspondance || !Array.isArray(numeros)) { erreurs.push(`${chapitre.id}/${sid}/${base} : type, recueil ou liste invalide`); continue; }
          const type = correspondance[1] as "h" | "r";
          const recueil = correspondance[2]!;
          const connu = type === "h" ? recueilsApi.has(recueil) : recueilsKg.has(recueil);
          if (!connu) erreurs.push(`${chapitre.id}/${sid} : recueil inconnu ${base}`);
          for (const numero of numeros as unknown[]) {
            if (typeof numero !== "number" || !Number.isSafeInteger(numero) || numero < 1) {
              erreurs.push(`${chapitre.id}/${sid}/${base} : numéro invalide ${String(numero)}`);
              continue;
            }
            if (type === "r" && connu && numero > recueilsKg.get(recueil)!.nombre) erreurs.push(`${chapitre.id}/${sid}/${base}/${numero} : numéro au-delà du recueil`);
            uniques.add(`${base}/${numero}`);
            const lien = lienHadith({ type, recueil, numero });
            if (!/^\/(?:hadith\/[a-z0-9-]+\/ara|recueil\/[a-z0-9-]+)\/[1-9]\d*$/.test(lien)) erreurs.push(`${chapitre.id}/${sid} : lien invalide ${lien}`);
          }
        }
      }
      if (chapitre.nombre > 0 && uniques.size === 0) erreurs.push(`${chapitre.id} : aucun hadith consultable malgré un sujet annoncé non vide`);
    }
    expect(erreurs, erreurs.slice(0, 50).join("\n")).toEqual([]);
  }, 20_000);

  it("associe chaque sujet à une véritable scène PNG existante et lisible", () => {
    const motifs = new Set<string>(motifsIllustrations);
    for (const chapitre of chapitres) {
      const choix = motifsDe(chapitre.fr ?? chapitre.ar, chapitre.theme);
      expect(choix.length, chapitre.id).toBeGreaterThan(0);
      expect(new Set(choix).size, chapitre.id).toBe(choix.length);
      for (const motif of choix) expect(motifs.has(motif), `${chapitre.id}/${motif}`).toBe(true);
    }
    for (const motif of motifsIllustrations) {
      const chemin = join(process.cwd(), "public", imageMotif(motif).slice(1));
      const png = readFileSync(chemin);
      expect([...png.subarray(0, 8)], `PNG invalide : ${motif}`).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
      expect(png.readUInt32BE(16), `${motif} : largeur`).toBeGreaterThanOrEqual(640);
      expect(png.readUInt32BE(20), `${motif} : hauteur`).toBeGreaterThanOrEqual(360);
    }
  });
});
