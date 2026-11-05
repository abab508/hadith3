import Image from "next/image";
import { imageMotif, type Motif } from "@/donnees/illustrations-chapitres";
import styles from "@/composants/IllustrationChapitre.module.css";

export type { Motif } from "@/donnees/illustrations-chapitres";

// API conservée pour les cartes, la galerie et la présentation du chapitre.
// variante : autre cadrage de la même scène (0 = cadrage d'origine), pour qu'une image qui revient ne soit pas identique.
export default function IllustrationChapitre({ motif, graine, titre, className, sizes, variante = 0 }: {
  motif: Motif; second?: Motif; graine: string; titre?: string; className?: string; instance?: string; sizes?: string; variante?: number;
}) {
  return (
    <span className={`${styles.illustration} ${className ?? ""}`} data-motif={motif} data-scene={graine} data-variante={variante}
      role={titre ? "img" : undefined} aria-label={titre}>
      <Image src={imageMotif(motif)} alt="" aria-hidden="true" fill
        sizes={sizes ?? "(max-width: 760px) calc(100vw - 2.5rem), 30rem"} className={styles.image} />
      <span className={styles.lueur} aria-hidden="true" />
    </span>
  );
}
