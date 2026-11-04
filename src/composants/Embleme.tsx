import styles from "@/composants/Embleme.module.css";

// Emblème « Milaghaiba » de la capture du patron : dôme ornemental, nom latin doré en relief,
// nom arabe en Ruqʿa entre deux losanges, et mention en petites capitales.
export default function Embleme({ nomLatin, nomArabe, mention, taille = "grand" }: { nomLatin: string; nomArabe: string; mention?: string; taille?: "grand" | "petit" }) {
  return (
    <span className={styles.embleme} data-taille={taille}>
      {taille === "grand" && (
        <svg className={styles.dome} viewBox="0 0 120 34" aria-hidden="true">
          <path d="M60 2v6M60 8c-8 3-14 10-15 20h30C74 18 68 11 60 8zM30 30h60M36 30c4-6 10-9 15-9M84 30c-4-6-10-9-15-9M10 31h18M92 31h18" />
          <circle cx="60" cy="2.5" r="1.8" />
        </svg>
      )}
      <span className={styles.nomLatin}>{nomLatin}</span>
      <span className={styles.ligneArabe}>
        <span className={styles.losange} aria-hidden="true" />
        <span lang="ar" dir="rtl" className={styles.nomArabe}>{nomArabe}</span>
        <span className={styles.losange} aria-hidden="true" />
      </span>
      {mention && <span className={styles.mention}>{mention}</span>}
    </span>
  );
}
