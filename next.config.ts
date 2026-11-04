import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Ne pas laisser Next.js modifier AGENTS.md (fichier de règles protégé du projet).
  agentRules: false,
  // L'index des recueils (data/search-index, ~11 Mo) est lu à l'exécution par le serveur :
  // il doit être embarqué dans les fonctions qui cherchent ou affichent un hadith.
  outputFileTracingIncludes: {
    "/[locale]/recherche": ["./data/search-index/**/*"],
    "/[locale]/chaine": ["./data/search-index/**/*"],
    "/[locale]/hadith/[recueil]/[langue]/[numero]": ["./data/search-index/**/*"],
    "/[locale]/hadith/[recueil]/[langue]/[numero]/rapport": ["./data/search-index/**/*", "./data/transmetteurs-kg/**/*"],
    "/[locale]/chapitres/[id]": ["./data/chapitres/hadiths/**/*"],
    "/[locale]/chapitres/[id]/[sous]": ["./data/chapitres/hadiths/**/*", "./data/search-index/**/*"],
  },
};

export default withNextIntl(nextConfig);
