import type { Icone } from "@/donnees/themes";

// Pictogrammes dorés des thèmes (trait fin, dans un cercle), dessinés pour le site.
const traces: Record<Icone, string> = {
  livre: "M5 6h5.5A1.5 1.5 0 0 1 12 7.5V18a1.5 1.5 0 0 0-1.5-1.5H5zM19 6h-5.5A1.5 1.5 0 0 0 12 7.5V18a1.5 1.5 0 0 1 1.5-1.5H19zM7 9h3M7 11.5h3M14 9h3M14 11.5h3",
  kaaba: "M5 9l7-3 7 3v8l-7 3-7-3zM5 9l7 3 7-3M12 12v8M5 11.5l7 3 7-3",
  etoile: "M12 3l2.2 4.5L19 8l-3.5 3.3.9 4.9L12 13.9 7.6 16.2l.9-4.9L5 8l4.8-.5zM12 17v4",
  famille: "M8 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM16 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM12 13a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2zM4.5 19v-4a3.5 3.5 0 0 1 7 0M12.5 15a3.5 3.5 0 0 1 7 0v4M9.5 19v-2.5a2.5 2.5 0 0 1 5 0V19",
  arbre: "M12 21v-8M12 14l-3-2.5M12 15.5l3-2.5M12 3a5 5 0 0 0-5 5 4 4 0 0 0 1 7h8a4 4 0 0 0 1-7 5 5 0 0 0-5-5zM7 21h10",
  comete: "M15 5a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM12 12l-8 8M11 9.5L5 14M14.5 13L10 19",
  colonnes: "M4 9l8-5 8 5zM6 9v8M10 9v8M14 9v8M18 9v8M4 17h16M3 20h18",
  feuille: "M6 18c0-8 5-12 13-13-1 8-5 13-13 13zM6 18l7-7M9 21h6",
  lanterne: "M12 3v2M9 5h6l-1 2h-4zM9 7h6l2 6-2 5H9l-2-5zM10 18h4l-2 3zM12 10.5v4",
};

export default function IconeTheme({ icone, className }: { icone: Icone; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={traces[icone]} />
    </svg>
  );
}
