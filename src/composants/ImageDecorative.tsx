import Image from "next/image";

type ProprietesImageDecorative = {
  src: string;
  sizes: string;
  className?: string;
  preload?: boolean;
};

// Le cadre positionné et ses dimensions restent dans le CSS de chaque scène.
// Next fournit les tailles responsives, jusqu'à 3840 px, sans changer le décor.
export default function ImageDecorative({ src, sizes, className, preload = false }: ProprietesImageDecorative) {
  return (
    <Image
      src={src}
      alt=""
      aria-hidden="true"
      fill
      sizes={sizes}
      className={className}
      preload={preload}
    />
  );
}
