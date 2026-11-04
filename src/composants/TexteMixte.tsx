import { Fragment } from "react";

// Texte rédigé pouvant mêler arabe, latin, chiffres et adresses web (exigence 02 : direction gérée par bloc).
// Chaque URL est isolée en LTR dans un <bdi>, jamais traduite ni raccourcie ; le reste du texte est rendu tel quel.

export type Segment = { type: "texte" | "url"; valeur: string };

// Une URL s'arrête au premier espace ; la ponctuation finale (latine ou arabe) reste hors du lien.
const motifUrl = /https?:\/\/[^\s<>"«»]+/gu;
const ponctuationFinale = /[.,;:!?)\]}،؛؟»”’'"]+$/u;

export function decouperUrls(texte: string): Segment[] {
  const segments: Segment[] = [];
  let curseur = 0;
  for (const trouve of texte.matchAll(motifUrl)) {
    const debut = trouve.index ?? 0;
    const brute = trouve[0];
    const url = brute.replace(ponctuationFinale, "");
    if (debut > curseur) segments.push({ type: "texte", valeur: texte.slice(curseur, debut) });
    segments.push({ type: "url", valeur: url });
    curseur = debut + url.length;
  }
  if (curseur < texte.length) segments.push({ type: "texte", valeur: texte.slice(curseur) });
  return segments.length > 0 ? segments : [{ type: "texte", valeur: texte }];
}

export default function TexteMixte({ texte }: { texte: string }) {
  return (
    <>
      {decouperUrls(texte).map((s, i) =>
        s.type === "url" ? (
          <bdi key={i} dir="ltr" className="url-isolee">
            <a href={s.valeur} rel="noopener noreferrer" target="_blank" lang="und-Latn">{s.valeur}</a>
          </bdi>
        ) : (
          <Fragment key={i}>{s.valeur}</Fragment>
        )
      )}
    </>
  );
}
