import type { ReactNode } from "react";
import ImageDecorative from "@/composants/ImageDecorative";
import styles from "@/composants/EntetePatrimoine.module.css";

const decors = {
  recherche: "/images/sections/recherche.webp",
  biographies: "/images/sections/biographies.webp",
  glossaire: "/images/sections/glossaire.webp",
  memorisation: "/images/sections/memorisation.webp",
  lecture: "/images/bibliotheque/salle-lecture.webp",
  langues: "/images/hd/themes.png",
  reglages: "/images/chapitres/lanterne.png",
} as const;

export default function EntetePatrimoine({ scene, children, className = "", compacte = false }: {
  scene: keyof typeof decors;
  children: ReactNode;
  className?: string;
  compacte?: boolean;
}) {
  return (
    <header className={`${styles.entete} ${className}`} data-decor={scene} data-compacte={compacte}>
      <div className={styles.decor} aria-hidden="true">
        <ImageDecorative src={decors[scene]} sizes="(max-width: 1280px) calc(100vw - 2rem), 78rem" className={styles.image} preload />
        <span className={styles.rayon} />
        <span className={styles.poussiere} />
      </div>
      <div className={styles.contenu}>{children}</div>
    </header>
  );
}
