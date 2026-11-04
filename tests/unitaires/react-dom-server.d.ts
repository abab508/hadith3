// Déclaration minimale (sans nouvelle dépendance) de la seule fonction de react-dom/server utilisée par les tests.
declare module "react-dom/server" {
  import type { ReactNode } from "react";
  export function renderToStaticMarkup(element: ReactNode): string;
}
