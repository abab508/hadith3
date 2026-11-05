import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import IllustrationChapitre from "@/composants/IllustrationChapitre";
import { chapitreKg, hadithsDuSous, hadithsHorsSous, lienHadith, motifsDe, sousChapitreKg, titreKg, type RefHadith } from "@/donnees/chapitres-kg";
import { hadithKg, recueilsKg } from "@/donnees/recueils-kg";
import { loadDetail } from "@/donnees/fiche-distante";
import { nomRecueil } from "@/donnees/noms-recueils";
import styles from "@/app/[locale]/hadith/[recueil]/[langue]/[numero]/Hadith.module.css";
import liste from "@/app/[locale]/recueil/[id]/Recueil.module.css";

type Parametres = { locale: string; id: string; sous: string };
const PAR_PAGE = 10;
const coupe = (t: string, n = 420) => (t.length <= n ? t : `${t.slice(0, t.lastIndexOf(" ", n) > 0 ? t.lastIndexOf(" ", n) : n)}…`);

// Texte d'un hadith pour la liste : recueil hadith-kg (dépôt de données) ou édition hadith-api (arabe + français si présent).
async function texteDe(r: RefHadith): Promise<{ ar: string; fr?: string } | null> {
  try {
    if (r.type === "r") {
      const rec = recueilsKg.get(r.recueil);
      const h = rec ? await hadithKg(rec, r.numero) : null;
      return h ? { ar: h.texte } : null;
    }
    const d = await loadDetail(r.recueil, "ara", String(r.numero));
    if (!d) return null;
    return { ar: d.hadith.text, fr: d.other?.language === "fra" ? d.other.hadith.text : undefined };
  } catch { return null; }
}

async function titres(id: string, sid: string, locale: string, tk: (k: string) => string) {
  const c = chapitreKg(id);
  if (!c) return null;
  if (sid === "autres") return { c, titre: { texte: c.sous.length ? tk("autres") : tk("tousLesHadiths"), langue: locale }, ar: null as string | null };
  const s = sousChapitreKg(c, sid);
  return s ? { c, titre: titreKg(s, locale), ar: s.ar } : null;
}

export async function generateMetadata({ params }: { params: Promise<Parametres> }): Promise<Metadata> {
  const { locale, id, sous } = await params;
  const tk = await getTranslations({ locale, namespace: "chapitreKg" });
  const r = await titres(id, sous, locale, tk);
  return r ? { title: r.titre.texte, robots: { index: false, follow: true } } : {};
}

export default async function PageSousChapitre({ params, searchParams }: { params: Promise<Parametres>; searchParams: Promise<{ page?: string }> }) {
  const { locale, id, sous } = await params;
  const { page } = await searchParams;
  setRequestLocale(locale);
  const tk = await getTranslations("chapitreKg");
  const r = await titres(id, sous, locale, tk);
  if (!r) notFound();
  const titreChapitre = titreKg(r.c, locale);
  const refs = sous === "autres" ? await hadithsHorsSous(id) : await hadithsDuSous(id, sous);
  const total = Math.max(1, Math.ceil(refs.length / PAR_PAGE));
  const courant = Math.min(Math.max(1, Number.parseInt(page ?? "1", 10) || 1), total);
  const morceau = refs.slice((courant - 1) * PAR_PAGE, courant * PAR_PAGE);
  const textes = await Promise.all(morceau.map(texteDe));
  const motifs = motifsDe(r.titre.langue === "fr" ? r.titre.texte : (r.c.fr ?? r.c.ar), r.c.theme);

  const pagination = total > 1 && (
    <nav className={liste.pagination} aria-label={tk("pages")}>
      {courant > 1 ? <Link href={`/chapitres/${id}/${sous}?page=${courant - 1}`}>← {tk("precedente")}</Link> : <span />}
      <span>{tk("page", { page: courant, total })}</span>
      {courant < total ? <Link href={`/chapitres/${id}/${sous}?page=${courant + 1}`}>{tk("suivante")} →</Link> : <span />}
    </nav>
  );

  return (
    <main id="contenu" tabIndex={-1} className={styles.page}>
      <p className={styles.retour}><Link href={`/chapitres/${id}`}>← <bdi lang={titreChapitre.langue}>{titreChapitre.texte}</bdi></Link></p>
      <header className={styles.entete}>
        <p className={styles.surtitre}>{tk("sousChapitre")}</p>
        <h1 className={styles.titre}><bdi lang={r.titre.langue} dir="auto">{r.titre.texte}</bdi></h1>
        {r.ar && r.titre.langue !== "ar" && <p lang="ar" dir="rtl" className={`texte-arabe ${liste.nomAr}`}>{r.ar}</p>}
        <p className={styles.reference}>{tk("nbHadiths", { count: refs.length })}</p>
      </header>
      <div className={liste.bandeauIllustration}><IllustrationChapitre motif={motifs[0]!} second={motifs[1]} graine={`${id}-${sous}`} /></div>

      {pagination}
      {refs.length === 0 ? <p>{tk("aucunHadith")}</p> : (
        <ol className={liste.liste}>
          {morceau.map((ref, i) => {
            const tx = textes[i];
            return (
              <li key={`${ref.type}-${ref.recueil}-${ref.numero}`} className={styles.cadre}>
                <p className={liste.marque}><bdi>{nomRecueil(ref.type, ref.recueil)}</bdi> · {tk("numero", { n: ref.numero })}</p>
                {tx ? (
                  <>
                    <p lang="ar" dir="rtl" className={`texte-arabe ${styles.arabe}`}>{coupe(tx.ar)}</p>
                    {tx.fr && <p lang="fr" className={styles.prose}>{coupe(tx.fr, 360)}</p>}
                  </>
                ) : <p className={styles.mention}>{tk("indisponible")}</p>}
                <p className={styles.boutons}>
                  <Link href={lienHadith(ref)} className={styles.bouton}>{tk("ouvrir")} <span aria-hidden="true">→</span></Link>
                </p>
              </li>
            );
          })}
        </ol>
      )}
      {pagination}
      <p className={styles.mention}>{tk("source")}</p>
    </main>
  );
}
