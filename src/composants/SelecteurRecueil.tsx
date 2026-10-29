"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Recueil } from "@/donnees/recherche";
import styles from "@/composants/SelecteurRecueil.module.css";

// Deux listes liées : le recueil, puis un livre (kitāb) de ce recueil.
// Sans recueil choisi, les livres sont groupés par recueil, ce qui reste utilisable sans JavaScript.
export default function SelecteurRecueil({
  recueils,
  recueilInitial = "",
  livreInitial = "",
}: {
  recueils: Recueil[];
  recueilInitial?: string;
  livreInitial?: string;
}) {
  const t = useTranslations("recherche.selection");
  const [recueil, setRecueil] = useState(recueilInitial);
  const [livre, setLivre] = useState(livreInitial);
  const choisi = recueils.find((r) => r.id === recueil);

  const option = (l: Recueil["livres"][number]) => (
    <option key={l.valeur} value={l.valeur}>{l.nomAr} — {l.nom}</option>
  );

  return (
    <div className={styles.selection}>
      <label className={styles.champ}>
        <span>{t("recueil")}</span>
        <select
          name="recueil"
          aria-describedby="aide-recueil"
          value={recueil}
          onChange={(e) => {
            const id = e.currentTarget.value;
            setRecueil(id);
            const suivant = recueils.find((r) => r.id === id);
            if (suivant && !suivant.livres.some((l) => l.valeur === livre)) setLivre("");
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
        <select name="livre" value={livre} onChange={(e) => setLivre(e.currentTarget.value)}>
          <option value="">{t("tousLivres")}</option>
          {choisi
            ? choisi.livres.map(option)
            : recueils.map((r) => (
              <optgroup key={r.id} label={`${r.nomAr} — ${r.nom}`}>{r.livres.map(option)}</optgroup>
            ))}
        </select>
      </label>
      <p id="aide-recueil" className={styles.aide}>{t("aide")}</p>
    </div>
  );
}
