import { Link } from "@/i18n/navigation";
import ImageDecorative from "@/composants/ImageDecorative";
import styles from "@/composants/Pages.module.css";

type Carte = { id: string; href: string; titre: string; description?: string; image: string };

export default function CartesIllustrees({ cartes, libelle }: { cartes: Carte[]; libelle: string }) {
  return (
    <ul className={styles.grilleCartes} aria-label={libelle}>
      {cartes.map((carte) => (
        <li key={carte.id} className={styles.carteChapitre}>
          <Link href={carte.href}>
            <span className={styles.cadreImageChapitre}>
              <ImageDecorative src={carte.image} sizes="(max-width: 600px) calc(100vw - 2.5rem), (max-width: 1000px) 45vw, 25rem" />
            </span>
            <span className={styles.corpsCarte}>
              <span className={styles.titreCarte}>{carte.titre}</span>
              {carte.description && <span className={styles.sousTitreCarte}>{carte.description}</span>}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
