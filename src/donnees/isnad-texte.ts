// Découpage AUTOMATIQUE de la chaîne (isnād) telle qu'elle est écrite au début d'un texte arabe.
// Ce n'est pas une analyse : aucun transmetteur n'est identifié ni jugé. Les noms sont rendus
// sans voyelles brèves, dans l'ordre du texte (du compilateur vers le Prophète ﷺ).

export type ChaineTexte = { maillons: string[]; jusquAuProphete: boolean };

const voyelles = /[ً-ٰٟۖ-ۭـ]/gu;
// Formules de transmission qui séparent deux maillons.
const marqueurs = /(?:^|\s)(?:و?حدثنا|و?حدثني|و?أخبرنا|و?أخبرني|أنبأنا|أنبأني|سمعت|سمعنا|سمع|عن|يقول|تقول|قال|قالت|أنه|أنها|أن|يحدث|يخبر)(?=\s|$|[،,:؛])/gu;
// Fin de la chaîne : mention du Prophète ﷺ.
const prophete = /(?:رسول الله|النبي|نبي الله)/u;
// Formules de respect et apartés retirés des noms.
const formules = /رض[يى] الله عن(?:هما|هم|ها|ه)|عليه السلام|صلى الله عليه وسلم|ﷺ|\([^)]*\)|-[^-]{0,40}-|ـ/gu;
// Après le nom, le texte passe parfois au récit : on coupe à ces mots.
const coupure = /\s(?:على|في|وهو|وهي|يخطب|إذ|قدم|سأل|فقال|أخبره|حين|بينما)\s/u;

// Mots de récit (verbes, conjonctions) qui n'apparaissent pas dans un nom de transmetteur.
const recit = new Set([
  "كنت", "كان", "كانت", "كانوا", "لما", "إذا", "إن", "إنه", "أتى", "أتوا", "أتيت", "جاء", "جاءت", "دخل", "دخلت", "خرج", "خرجت",
  "رأيت", "رأى", "بينا", "بينما", "يجلس", "يجلسني", "أقعد", "جلس", "ثم", "حتى", "وفد", "يا", "هل", "ما", "من", "إلى", "مع", "لنا", "له", "لي",
  "فقال", "فقالت", "قلت", "قالوا", "سألت", "سألنا", "نزل", "قام", "صلى", "بعث", "أمر", "نهى", "كتب", "ذكر", "حدث",
]);

export function sansVoyelles(texte: string): string {
  return texte.normalize("NFC").replace(voyelles, "").replace(/\s+/gu, " ").trim();
}

export function extraireChaine(texteAr: string): ChaineTexte {
  const texte = sansVoyelles(texteAr);
  const fin = texte.search(prophete);
  const isnad = (fin >= 0 ? texte.slice(0, fin) : texte.slice(0, 400)).replace(formules, " ");
  const maillons: string[] = [];
  let complet = fin >= 0;
  for (const brut of isnad.split(marqueurs)) {
    let nom = brut.replace(/[،,:؛.‏]/gu, " ").replace(/\s+/gu, " ").trim();
    const c = (" " + nom + " ").search(coupure);
    if (c >= 0) nom = (" " + nom + " ").slice(0, c).trim();
    nom = nom.replace(/^و\s*/u, "").trim();
    const mots = nom.split(" ").filter(Boolean);
    if (mots.length === 0 || !/[ء-ي]/u.test(nom)) continue;
    // Le texte passe au récit : on s'arrête plutôt que de prendre une phrase pour un nom.
    if (mots.length > 12 || mots.some((m) => recit.has(m))) { complet = false; break; }
    if (maillons[maillons.length - 1] !== nom) maillons.push(nom);
  }
  return { maillons, jusquAuProphete: complet };
}
