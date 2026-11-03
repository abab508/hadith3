import {Link} from "@/i18n/navigation";

/** En-tête visuel partagé : aucun contenu documentaire ni statut n'est modifié. */
export default function BannierePrestige({locale}:{locale:string}){
 const label=locale==="ar"?"مكتبة الحديث":locale==="en"?"Hadith library":"Bibliothèque de hadiths";
 return <div className="prestige-banniere" aria-label={label}>
   <span className="prestige-marque">Milaghaiba</span>
   <span className="prestige-nom-ar" lang="ar" dir="rtl">الملة الغائبة</span>
   <span className="prestige-legende">✧ {label} ✧</span>
   <nav className="prestige-raccourcis" aria-label={label}>
      <Link href="/">{locale==="ar"?"الرئيسية":locale==="en"?"Home":"Accueil"}</Link>
      <Link href="/themes">{locale==="ar"?"الموضوعات":locale==="en"?"Themes":"Thèmes"}</Link>
      <Link href="/recherche">{locale==="ar"?"البحث":locale==="en"?"Search":"Recherche"}</Link>
   </nav>
 </div>;
}
