/**
 * PDF des contenus, rangés dans Vercel Blob en mode privé (store créé « Private » sur Vercel).
 * Branché si l'intégration a ajouté BLOB_STORE_ID (connexion OIDC de Vercel) ou BLOB_READ_WRITE_TOKEN.
 * Les visiteurs les lisent par /api/pdf, qui ne sert que les PDF d'un contenu publié.
 */
export const stockagePdf = () => Boolean(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);

// Adresse d'un PDF de contenu dans notre stockage (et nulle part ailleurs).
export function urlPdfValide(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname.endsWith(".blob.vercel-storage.com") && u.pathname.startsWith("/contenus/") && u.pathname.endsWith(".pdf");
  } catch { return false; }
}
export const accesPdf = (url: string): "private" | "public" => (new URL(url).hostname.includes(".private.") ? "private" : "public");
export const lienPdf = (url: string) => `/api/pdf?u=${encodeURIComponent(url)}`;
