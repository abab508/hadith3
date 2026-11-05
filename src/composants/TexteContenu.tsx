// Texte d'un contenu de l'administrateur, affiché sans HTML brut : paragraphes (ligne vide), « ## » intertitre,
// **gras** et liens https:// cliquables. Rien d'autre n'est interprété.
import type { ReactNode } from "react";

function enLigne(texte: string): ReactNode[] {
  return texte.split(/(\*\*[^*]+\*\*|https:\/\/[^\s<>"')]+)/g).filter(Boolean).map((m, i) => {
    if (m.startsWith("**") && m.endsWith("**") && m.length > 4) return <strong key={i}>{m.slice(2, -2)}</strong>;
    if (m.startsWith("https://")) return <a key={i} href={m} target="_blank" rel="noopener noreferrer nofollow">{m}</a>;
    return m;
  });
}

export default function TexteContenu({ texte, className }: { texte: string; className?: string }) {
  const blocs = texte.replace(/\r\n?/g, "\n").split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className={className} dir="auto">
      {blocs.map((b, i) =>
        b.startsWith("## ") ? <h2 key={i} dir="auto">{enLigne(b.slice(3))}</h2>
          : <p key={i} dir="auto">{b.split("\n").flatMap((l, j) => (j ? [<br key={`b${j}`} />, ...enLigne(l)] : enLigne(l)))}</p>,
      )}
    </div>
  );
}
