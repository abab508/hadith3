import { describe,it,expect } from "vitest";
import { IMPORT_COLUMNS,parseCsv,validateRows,stableNoticeId,summaryRows } from "@/donnees/import-csv";

function csv(values:string[]){
  return IMPORT_COLUMNS.join(",")+"\n"+
    values.map(v=>'"'+v.replaceAll('"','""')+'"').join(",");
}
const fields=[
  "sahih-bukhari","صحيح البخاري","Sahih al-Bukhari","112233","1",
  "حَدَّثَنَا زَيْدٌ بِالْخَبَرِ لِلْبَيَانِ وَلَا نَنْسُبُ حُكْمًا", "reference-editeur-v1",
  "https://github.com/fawazahmed0/hadith-api/blob/1/editions/ara-bukhari/sections/1.json"
];
describe("import CSV sans écrasement",()=>{
  it("accepte BOM, cellules citées et ponctuation, et fixe le statut",()=>{
    const input="\uFEFF"+csv(fields);
    const parsed=parseCsv(input);
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows).toHaveLength(1);
    const checks=validateRows(parsed.rows);
    expect(checks[0]?.errors).toEqual([]);
    expect(checks[0]?.notice?.statut).toBe("importe-non-verifie");
    expect(checks[0]?.notice?.id).toBe("bukhari-112233");
    expect(summaryRows(checks)).toEqual({total:1,ready:1,blocked:0});
  });
  it("gère un point-virgule et un texte arabe sur plusieurs lignes",()=>{
    const values=[...fields];values[5]="حديث طويل؛\nفي سطر آخر يُنقل كما هو دون اختراع سند";
    const input=IMPORT_COLUMNS.join(";")+"\n"+values.map(v=>'"'+v+'"').join(";");
    const parsed=parseCsv(input);
    expect(parsed.rows[0]?.texteAr).toContain("\n");
    expect(validateRows(parsed.rows)[0]?.notice).toBeDefined();
  });
  it("bloque les doublons du dépôt et du fichier sans modifier les données",()=>{
    const existing=[{id:"bukhari-112233",recueil:"sahih-bukhari",numero:"112233"}];
    const parsed=parseCsv(csv(fields));
    expect(validateRows(parsed.rows,existing)[0]?.errors.join(" ")).toMatch(/Doublon/);
    const duplicates=parseCsv(csv(fields)+"\n"+fields.map(v=>'"'+v+'"').join(","));
    expect(validateRows(duplicates.rows)[1]?.errors.join(" ")).toMatch(/Doublon/);
  });
  it("rejette source non HTTPS et texte non arabe",()=>{
    const bad=[...fields];bad[5]="Du texte non arabe 000000000";bad[7]="http://example.com/hadith";
    const errors=validateRows(parseCsv(csv(bad)).rows)[0]?.errors.join(" ");
    expect(errors).toContain("Texte arabe");
    expect(errors).toContain("HTTPS");
  });
  it("refuse les en-têtes incomplets et les guillemets ouverts",()=>{
    expect(parseCsv("recueil,numero\nabc,1").errors.join(" ")).toContain("Colonnes");
    expect(parseCsv(IMPORT_COLUMNS.join(",")+"\n\"texte cassé").errors.join(" ")).toContain("guillemets");
  });
  it("identifiants stables pour les 7 principaux recueils",()=>{
    expect(stableNoticeId("sahih-bukhari","10")).toBe("bukhari-10");
    expect(stableNoticeId("sahih-muslim","10")).toBe("muslim-10");
    expect(stableNoticeId("muwatta","37")).toBe("malik-37");
  });
});
