"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Categorie, Ouvrage } from "@/donnees/recherche";
import styles from "@/composants/SelecteurRecueil.module.css";

const libellesCategories = {
  rijal: "categories.rijal",
} as const satisfies Record<Categorie["categorie"], string>;

// Deux choix exclusifs : un recueil de hadith, ou un livre d'une autre catégorie (biographies…).
// Choisir l'un vide l'autre ; sans JavaScript, le livre l'emporte côté serveur.
export default function SelecteurRecueil({
  recueils,
  categories,
  recueilInitial = "",
  livreInitial = "",
}: {
  recueils: Ouvrage[];
  categories: Categorie[];
  recueilInitial?: string;
  livreInitial?: string;
}) {
  const t = useTranslations("recherche.selection");
  const [recueil, setRecueil] = useState(livreInitial ? "" : recueilInitial);
  const [livre, setLivre] = useState(livreInitial);

  return (
    <div className={styles.selection}>
      <label className={styles.champ}>
        <span>{t("recueil")}</span>
        <select
          name="recueil"
          aria-describedby="aide-recueil"
          value={recueil}
          onChange={(e) => {
            setRecueil(e.currentTarget.value);
            if (e.currentTarget.value) setLivre("");
          }}
        >
          <option value="">{t("tousRecueils")}</option>
          {recueils.map((r) => (
            <option key={r.id} value={r.id}>{r.nomAr} — {r.nom}</option>
          ))}
        </select>
      </label>
      <label className={styles.champ}>
        <span>{t("livre")}</span>
        <select
          name="livre"
          aria-describedby="aide-recueil"
          value={livre}
          onChange={(e) => {
            setLivre(e.currentTarget.value);
            if (e.currentTarget.value) setRecueil("");
          }}
        >
          <option value="">{t("tousLivres")}</option>
          {categories.map((c) => (
            <optgroup key={c.categorie} label={t(libellesCategories[c.categorie])}>
              {c.livres.map((l) => (
                <option key={l.id} value={l.id}>{l.nomAr} — {l.nom}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
      <p id="aide-recueil" className={styles.aide}>{t("aide")}</p>
    </div>
  );
}
