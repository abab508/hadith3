"use client";

import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { IMPORT_COLUMNS, parseCsv, validateRows, summaryRows, type CsvRow, type ImportedNotice } from "@/donnees/import-csv";
import styles from "./ImportStudio.module.css";

type Existing=Pick<ImportedNotice,"id"|"recueil"|"numero">;
type Status={configured:boolean;authenticated:boolean};
type Locale="fr"|"ar";
const labels={
  fr:{
    title:"Studio d'importation",subtitle:"Importez vos hadiths en toute sécurité, sans remplacer le corpus existant.",
    admin:"ADMINISTRATION DOCUMENTAIRE",protected:"Accès sécurisé", login:"Connexion administrateur",
    password:"Mot de passe administrateur",connect:"Se connecter",logout:"Déconnexion",
    unconfigured:"Configuration nécessaire : les trois secrets d'administration et de sauvegarde GitHub doivent être installés sur Vercel.",
    source:"Dépôt GitHub",existing:"Entrées déjà présentes",mode:"Mode d'importation",append:"Ajout uniquement · aucun écrasement",
    file:"Fichier CSV",select:"Choisir un CSV UTF-8",hint:"200 lignes maximum par opération · 500 Ko maximum · virgule ou point-virgule",
    preview:"Prévisualisation",previewHelp:"Le fichier est analysé localement. Rien n'est envoyé avant votre confirmation.",
    ready:"Prêtes",blocked:"Bloquées",total:"Lignes",errors:"Anomalies",
    save:"Confirmer et sauvegarder sur GitHub",loading:"Enregistrement…",connected:"Connecté · session temporaire",
    note:"Le contrôle porte sur les colonnes, les doublons et la présence des références. Il ne valide pas scientifiquement un hadith.",
    importDone:"Hadiths ajoutés sur GitHub. Leur apparition sur le site dépend du prochain déploiement Vercel.",
    template:"Télécharger le modèle CSV", refresh:"Actualiser les références existantes", report:"Télécharger le rapport JSON",
    noFile:"Choisissez un fichier CSV pour voir les lignes ici.",pending:"Chargement du statut…",offline:"Impossible de contacter le serveur.",
    retry:"Réessayer",badFile:"Fichier invalide ou trop volumineux.",line:"Ligne",state:"État",good:"Nouvelle",bad:"À corriger",
    book:"Recueil",num:"Numéro",text:"Texte arabe",reason:"Contrôles",empty:"Aucune donnée",
    sourceNeeded:"Origine HTTPS requise pour chaque hadith.",
    disabled:"Sauvegarde indisponible tant que l'administration n'est pas correctement configurée.",
    saveError:"L'enregistrement a échoué.",success:"Enregistrés",cancel:"Annuler le chargement",
    docs:"Procédure de configuration dans docs/import-administration.md",
  },
  ar:{
    title:"استوديو استيراد الأحاديث",subtitle:"أضف نصوصًا جديدة بأمان دون استبدال البيانات الموجودة.",
    admin:"إدارة المصادر",protected:"وصول آمن",login:"تسجيل دخول المسؤول",
    password:"كلمة مرور المسؤول",connect:"دخول",logout:"خروج",
    unconfigured:"يلزم إعداد ثلاثة أسرار للإدارة والحفظ في GitHub ضمن إعدادات Vercel.",
    source:"مستودع GitHub",existing:"السجلات الموجودة",mode:"طريقة الاستيراد",append:"إضافة فقط · دون استبدال",
    file:"ملف CSV",select:"اختر ملف CSV بصيغة UTF-8",hint:"حتى ٢٠٠ سطر لكل عملية · ٥٠٠ كيلوبايت · فاصلة أو فاصلة منقوطة",
    preview:"معاينة",previewHelp:"يتم فحص الملف داخل المتصفح، ولا يرسل شيء قبل تأكيد الحفظ.",
    ready:"صالحة",blocked:"مرفوضة",total:"أسطر",errors:"أخطاء",
    save:"تأكيد الحفظ في GitHub",loading:"جاري الحفظ…",connected:"تم الدخول · جلسة مؤقتة",
    note:"الفحص للشكل والتكرار والمصدر الموثق، ولا يُعد حكمًا علميًا على صحة الحديث.",
    importDone:"أُضيفت البيانات إلى GitHub، ويتطلب ظهورها بالموقع نشر إصدار Vercel جديد.",
    template:"تنزيل نموذج CSV",refresh:"تحديث السجلات الموجودة",report:"تنزيل تقرير JSON",
    noFile:"اختر ملف CSV لعرض السجلات.",pending:"جارِ تحميل الحالة…",offline:"تعذّر الاتصال بالخادم.",
    retry:"حاول ثانية",badFile:"ملف غير صالح أو حجمه كبير.",line:"سطر",state:"الحالة",good:"جديد",bad:"يحتاج تصحيحًا",
    book:"المصنّف",num:"الرقم",text:"النص العربي",reason:"الفحص",empty:"لا توجد بيانات",
    sourceNeeded:"يجب إرفاق رابط مصدر HTTPS لكل حديث.",
    disabled:"الحفظ معطّل حتى تكتمل إعدادات الإدارة الآمنة.",saveError:"فشلت عملية الحفظ.",
    success:"حُفظت",cancel:"إلغاء الملف",docs:"دليل الإعداد في docs/import-administration.md"
  }
} as const;
const template=IMPORT_COLUMNS.join(",")+"\r\n";
async function jsonApi(url:string, options?:RequestInit){
  const r=await fetch(url,{...options,credentials:"same-origin",cache:"no-store"});
  const body=await r.json();
  if(!r.ok)throw Error(typeof body.error==="string"?body.error:"Erreur serveur ("+r.status+")");
  return body;
}
function download(name:string,text:string,type:string){
  const url=URL.createObjectURL(new Blob([text],{type}));
  const a=document.createElement("a");
  a.href=url;a.download=name;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1200);
}
export default function ImportStudio({lang}:{lang:string}){
  const t=labels[lang==="ar"?"ar":"fr"];
  const [status,setStatus]=useState<Status|null>(null);
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  const [existing,setExisting]=useState<Existing[]|null>(null);
  const [rows,setRows]=useState<CsvRow[]>([]);
  const [fileName,setFileName]=useState("");
  const [fileErrors,setFileErrors]=useState<string[]>([]);
  const [saved,setSaved]=useState<{added:number;total:number;commit:string}|null>(null);
  const [active,setActive]=useState(0);
  const refresh=useCallback(async()=>{
    try{
      const s=await jsonApi("/api/admin/import/status") as Status;
      setStatus(s);setError("");
      if(s.authenticated){
        const d=await jsonApi("/api/admin/import/current") as {existing:Existing[];total:number};
        setExisting(d.existing);
      }else setExisting(null);
    }catch(e){setError(e instanceof Error?e.message:labels.fr.offline);setExisting(null);}
  },[]);
  useEffect(()=>{void refresh();},[refresh]);

  async function login(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy(true);setError("");
    try{
      await jsonApi("/api/admin/import/login",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({password})
      });
      setPassword("");await refresh();
    }catch(e){setError(e instanceof Error?e.message:t.offline);}
    finally{setBusy(false);}
  }
  async function logout(){
    setBusy(true);
    try{await jsonApi("/api/admin/import/logout",{method:"POST"});setRows([]);setFileName("");setSaved(null);setExisting(null);await refresh();}
    catch(e){setError(e instanceof Error?e.message:t.offline);}
    finally{setBusy(false);}
  }
  async function onFile(e:ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0];e.target.value="";
    if(!file)return;
    setSaved(null);setError("");setFileName(file.name);setActive(0);
    if(!file.name.toLowerCase().endsWith(".csv")||file.size>500_000||file.size===0){
      setFileErrors([t.badFile]);setRows([]);return;
    }
    try{
      const content=await file.text();
      const parsed=parseCsv(content);
      setFileErrors(parsed.errors);setRows(parsed.rows);
    }catch{setFileErrors([t.badFile]);setRows([]);}
  }
  const checked=validateRows(rows,existing??[]);
  const summary=summaryRows(checked);
  const show=checked.slice(active*12,active*12+12);
  const canSave=Boolean(status?.authenticated&&status.configured&&existing!==null&&rows.length>0&&summary.blocked===0&&fileErrors.length===0&&!busy);
  async function submit(){
    if(!canSave)return;
    setBusy(true);setError("");setSaved(null);
    try{
      const result=await jsonApi("/api/admin/import/save",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({rows})
      }) as {added:number;total:number;commit:string};
      setSaved(result);setRows([]);setFileName("");setFileErrors([]);await refresh();
    }catch(e){setError(e instanceof Error?e.message:t.saveError);await refresh();}
    finally{setBusy(false);}
  }
  const downloadReport=()=>download("milaghaiba-import-verification.json",JSON.stringify({
    file:fileName,generatedAt:new Date().toISOString(),summary,
    globalErrors:fileErrors,items:checked.map(x=>({line:x.line,id:x.notice?.id,errors:x.errors}))
  },null,2),"application/json");
  return (
    <div className={styles.world}>
      <div className={styles.orb} aria-hidden="true"/>
      <div className={styles.frame}>
        <header className={styles.hero}>
          <div className={styles.kicker}><span className={styles.spark}>✦</span> {t.admin}<span className={styles.secure}>{t.protected} · <span aria-hidden>⌁</span></span></div>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
          <div className={styles.tags}><span>CSV UTF-8</span><span>GitHub main</span><span>01 — {t.append}</span></div>
        </header>

        <div className={styles.workspace}>
          <aside className={styles.sidebar}>
            <div className={styles.asideHeader}><span aria-hidden>◈</span><strong>{t.protected}</strong></div>
            <div className={styles.statusInfo}>
              <span className={styles.statusDot} data-ok={!!status?.authenticated}/>
              <span>{status===null?t.pending:status.authenticated?t.connected:t.login}</span>
            </div>
            {status && !status.configured && <p className={styles.warning}>{t.unconfigured}</p>}
            {status?.configured && !status.authenticated && <form onSubmit={login} className={styles.form}>
              <label htmlFor="import-admin-password">{t.password}</label>
              <input type="password" autoComplete="current-password" minLength={1}
                id="import-admin-password" value={password} onChange={e=>setPassword(e.target.value)} required/>
              <button disabled={busy||!password} type="submit" className={styles.primary}>{t.connect}</button>
            </form>}
            {status?.authenticated && <button type="button" onClick={logout} disabled={busy} className={styles.outline}>{t.logout}</button>}
            <div className={styles.asideDivider}/>
            <p className={styles.asideLabel}>{t.source}</p>
            <strong className={styles.repo}>◉ abab508/hadith3</strong>
            <p className={styles.asideLabel}>{t.existing}</p>
            <strong className={styles.metric}>{existing?.length??"—"}</strong>
            {status?.authenticated && <button type="button" onClick={()=>void refresh()} className={styles.linkBtn} disabled={busy}>{t.refresh} ↻</button>}
            <div className={styles.asideDivider}/>
            <p className={styles.asideLabel}>{t.mode}</p>
            <div className={styles.mode}><span aria-hidden="true">✓</span>{t.append}</div>
            <p className={styles.help}>{t.note}</p>
          </aside>

          <div className={styles.content}>
            <section className={styles.upload} aria-labelledby="csv-upload-title">
              <div className={styles.sectionLine}><div><span className={styles.step}>01 / CSV</span><h2 id="csv-upload-title">{t.file}</h2></div>
                <button type="button" className={styles.linkBtn} onClick={()=>download("modele-hadiths.csv","\uFEFF"+template,"text/csv;charset=utf-8")}>{t.template} ↓</button>
              </div>
              <label className={styles.drop} data-disabled={!status?.authenticated}>
                <input type="file" accept=".csv,text/csv" onChange={onFile} disabled={!status?.authenticated||busy}/>
                <span className={styles.uploadGlyph} aria-hidden>↑</span>
                <strong>{t.select}</strong>
                <small>{t.hint}</small>
              </label>
              {fileName && <div className={styles.fileLine}><span>▤ {fileName}</span><button type="button" onClick={()=>{setRows([]);setFileErrors([]);setFileName("");setSaved(null);}}>{t.cancel} ×</button></div>}
            </section>

            <section className={styles.review} aria-labelledby="csv-preview-title">
              <div className={styles.sectionLine}>
                <div><span className={styles.step}>02 / CHECK</span><h2 id="csv-preview-title">{t.preview}</h2></div>
                {rows.length>0&&<button type="button" className={styles.linkBtn} onClick={downloadReport}>{t.report} ↓</button>}
              </div>
              <p className={styles.muted}>{t.previewHelp}</p>
              <div className={styles.metrics}>
                <div><strong>{summary.total}</strong><span>{t.total}</span></div>
                <div><strong className={styles.good}>{summary.ready}</strong><span>{t.ready}</span></div>
                <div><strong className={styles.bad}>{summary.blocked+fileErrors.length}</strong><span>{t.blocked}</span></div>
              </div>
              {fileErrors.length>0&&<div className={styles.problems} role="alert">{fileErrors.map((e,i)=><p key={i}>⚠ {e}</p>)}</div>}
              <div className={styles.tableWrap}>
                {rows.length===0?<p className={styles.empty}>{t.noFile}</p>:
                <table><thead><tr><th>{t.line}</th><th>{t.book}</th><th>{t.num}</th><th>{t.text}</th><th>{t.state}</th></tr></thead>
                  <tbody>{show.map(row=><tr key={row.line}>
                    <td>{row.line}</td><td>{rows[row.line-2]?.recueil??"—"}</td><td><bdi dir="ltr">{rows[row.line-2]?.numero??"—"}</bdi></td>
                    <td><span lang="ar" dir="rtl" className={styles.arabic}>{(rows[row.line-2]?.texteAr??"").slice(0,120)}</span></td>
                    <td><span className={row.errors.length?styles.badgeError:styles.badgeOk}>{row.errors.length?t.bad:t.good}</span>
                      {row.errors.map((msg,i)=><small key={i} className={styles.errorText}>{msg}</small>)}</td>
                  </tr>)}</tbody>
                </table>}
              </div>
              {checked.length>12&&<div className={styles.pager}>
                <button type="button" disabled={active===0} onClick={()=>setActive(p=>p-1)}>‹</button>
                <span>{active+1} / {Math.ceil(checked.length/12)}</span>
                <button type="button" disabled={(active+1)*12>=checked.length} onClick={()=>setActive(p=>p+1)}>›</button>
              </div>}
            </section>

            <section className={styles.confirm} aria-labelledby="csv-save-title">
              <div><span className={styles.step}>03 / GITHUB</span><h2 id="csv-save-title">{t.save}</h2>
                <p>{t.note}</p></div>
              <button type="button" className={styles.save} onClick={()=>void submit()} disabled={!canSave}>
                <span aria-hidden>✦</span> {busy?t.loading:t.save}
              </button>
            </section>
            {!status?.configured&&<p className={styles.subtleWarning}>{t.disabled}</p>}
            {error&&<p role="alert" className={styles.problems}>⚠ {error}</p>}
            {saved&&<div className={styles.success} role="status"><strong>✓ {t.success} : {saved.added}</strong>
              <p>{t.importDone}</p>{saved.commit&&<a target="_blank" rel="noopener noreferrer" href={"https://github.com/abab508/hadith3/commit/"+saved.commit}>GitHub · {saved.commit.slice(0,9)} ↗</a>}
            </div>}
          </div>
        </div>
      </div>
    </div>
  );
}
