import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PreferencesLangues from "@/composants/PreferencesLangues";
import { isAdminAuthenticated } from "@/lib/admin-import-auth";

export default async function Parametres({params}:{params:Promise<{locale:string}>}){
  const {locale}=await params;
  setRequestLocale(locale);
  const connected=await isAdminAuthenticated();
  return (
    <>
      <PreferencesLangues />
      {connected && (
        <aside style={{maxWidth:"60rem",margin:"2rem auto",padding:"1.4rem",border:"1px solid var(--bordure)",borderRadius:"1rem",background:"var(--surface)"}}>
          <h2>{locale==="ar"?"إدارة استيراد الأحاديث":"Administration des hadiths"}</h2>
          <p>{locale==="ar"?"أضف بيانات CSV الجديدة دون حذف الموجود.":"Ajouter de nouvelles données CSV sans supprimer l'existant."}</p>
          <Link href="/admin/import">{locale==="ar"?"فتح إدارة CSV":"Ouvrir le studio d'import CSV"} ↗</Link>
        </aside>
      )}
    </>
  );
}
