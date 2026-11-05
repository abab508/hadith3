#!/usr/bin/env python3
"""Construit les chapitres et sous-chapitres du site depuis l'index thématique de hadith-kg
(« موضوعات الحديث الشريف », emadjumaah/hadith-kg, CC BY 4.0), avec les hadiths de nos recueils sunnites.

Rien n'est inventé : titres arabes de la source, hadiths rattachés par la source (groupes de sens).
Usage : python -I scripts/exporter-chapitres-kg.py --db data/kg/hadith-kg.db --kg-vers-api <json> --sortie data/chapitres
(--kg-vers-api : produit par scripts/exporter-fiches-kg.py --kg-vers-api)
"""
import argparse, bisect, glob, importlib.util, json, os, sqlite3, sys

ICI = os.path.dirname(os.path.abspath(__file__))
LIVRES_API = {"bukhari": 1, "muslim": 2, "abudawud": 4, "tirmidhi": 3, "nasai": 5, "ibnmajah": 6, "malik": 8}
ORDRE_API = list(LIVRES_API)
# id de recueil du site (hadith-api) pour les liens /hadith/<id>/ara/<n>
ID_API = {"bukhari": "sahih-bukhari", "muslim": "sahih-muslim", "abudawud": "sunan-abi-dawud", "tirmidhi": "jami-tirmidhi",
          "nasai": "sunan-nasai", "ibnmajah": "sunan-ibn-majah", "malik": "muwatta"}

# Thème du site -> racines de l'index (noms exacts de la source). Les chapitres « fixes » gardent leur id.
THEMES = {
    "croyance": {"racines": ["الإيمان", "خلق الكون بما فيه"]},
    "adoration": {"racines": ["العبادات"]},
    "vie-du-prophete": {"racines": ["السيرة النبوية"]},
    "relations": {"racines": ["المجتمع والأسرة"]},
    "comportements": {"racines": ["الأخلاق والآداب"], "deplier": ["الأدب", "الاستئذان", "الرقاق"]},
    "fin-des-temps": {"fixes": {"signes-mineurs": "علامات الساعة الصغرى", "signes-majeurs": "علامات الساعة الكبرى",
                                "venue-de-dajjal": "خروج الدجال", "descente-de-issa": "نزول عيسى عليه السلام", "fin-du-monde": "الساعة حق"},
                      "racines": ["الفتن والملاحم"], "exclure": ["علامات الساعة"]},
    "science": {"racines": ["العلم"]},
    "maladies-et-remedes": {"noeuds": ["الطب والتداوي", "المرضى"]},
    "autres-themes": {"racines": ["القرآن الكريم", "قصص الأنبياء", "الفضائل والمناقب", "المعاملات", "الأقضية والأحكام"]},
}
MIN_CHAPITRE, MIN_SOUS = 1, 1  # Toute rubrique source ayant une référence navigable est conservée.


def compacter(refs):
    """["h/sahih-bukhari/3", "h/sahih-bukhari/7", "r/musnad-ahmad/12"] -> {"h/sahih-bukhari": [3, 7], "r/musnad-ahmad": [12]},
    dans l'ordre de priorité des recueils (l'ordre des clés est gardé)."""
    sortie = {}
    for x in refs:
        base, n = x.rsplit("/", 1)
        sortie.setdefault(base, []).append(int(n))
    return sortie


def main():
    a = argparse.ArgumentParser()
    a.add_argument("--db", required=True); a.add_argument("--kg-vers-api", required=True); a.add_argument("--sortie", required=True)
    o = a.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")
    c = sqlite3.connect(f"file:{o.db}?mode=ro&immutable=1", uri=True)
    sp = importlib.util.spec_from_file_location("r", os.path.join(ICI, "exporter-recueils-kg.py")); r = importlib.util.module_from_spec(sp); sp.loader.exec_module(r)

    # hadith-kg -> référence du site, dans l'ordre de priorité des recueils
    kg_api = json.load(open(o.kg_vers_api, encoding="utf8"))
    ref, rang = {}, {}
    for i, key in enumerate(ORDRE_API):
        for hid, num in kg_api.get(key, {}).items():
            if num != int(num):
                continue  # numéro à virgule (ex. 3604.08) : pas de page sur le site
            num = int(num)
            ref[int(hid)] = f"h/{ID_API[key]}/{num}"; rang[int(hid)] = (i, num)
    for j, (rid, livres) in enumerate(r.RECUEILS.items()):
        n = 0
        for b in livres:
            for (hid,) in c.execute("select id from hadiths where book_id=? order by no_inbook, id", (b,)):
                n += 1
                ref.setdefault(hid, f"r/{rid}/{n}"); rang.setdefault(hid, (100 + j, n))
    print("hadiths du site repérés dans hadith-kg :", len(ref))

    par_groupe = {}
    for hid, g in c.execute("select id, group_id from hadiths where group_id > 0"):
        if hid in ref:
            par_groupe.setdefault(g, []).append(hid)
    topics = c.execute("select id, name, parent_id, level, lft, rgt, group_id from topics").fetchall()
    enfants = {}
    for t in topics:
        enfants.setdefault(t[2], []).append(t)
    for v in enfants.values():
        v.sort(key=lambda t: t[4])
    feuilles = sorted((t[4], t[6]) for t in topics if t[6])
    lfts = [f[0] for f in feuilles]

    def hadiths(t):
        i, j = bisect.bisect_left(lfts, t[4]), bisect.bisect_right(lfts, t[5])
        vus = set()
        for _, g in feuilles[i:j]:
            vus.update(par_groupe.get(g, ()))
        return sorted(vus, key=lambda h: rang[h])

    def par_nom(nom, niveau=None):
        return [t for t in topics if t[1] == nom and (niveau is None or t[3] == niveau)]

    os.makedirs(os.path.join(o.sortie, "hadiths"), exist_ok=True)
    index = {"version": 1, "source": "« الجامع — Hadith Knowledge Graph » (emadjumaah/hadith-kg), licence CC BY 4.0 — index « موضوعات الحديث الشريف »",
             "themes": {}, "chapitres": {}}
    total_h = 0

    # Titres français (data/chapitres/titres-fr-*.tsv, traduction IA à relire) ; l'arabe de la source reste la référence.
    fr = {}
    for f in sorted(glob.glob(os.path.join(o.sortie, "titres-fr-*.tsv"))):
        for ligne in open(f, encoding="utf8"):
            if "\t" in ligne:
                a_, b_ = ligne.rstrip("\n").split("\t", 1); fr[a_.strip()] = b_.strip()

    def ajouter(theme, cid, t):
        nonlocal total_h
        if "موضوع" in t[1]:
            return  # chapitre de hadiths forgés (mawḍūʿ) : jamais présenté comme contenu
        tous = hadiths(t)
        if len(tous) < MIN_CHAPITRE and not cid.startswith(("signes", "venue", "descente", "fin-du")):
            return
        sous, contenu = [], {}
        for s in enfants.get(t[0], []):
            if "موضوع" in s[1]:
                continue  # Même exclusion documentaire que les chapitres parents.
            hs = hadiths(s)
            if len(hs) >= MIN_SOUS:
                sid = f"s{s[0]}"
                sous.append({"id": sid, "ar": s[1], "fr": fr.get(s[1]), "nombre": len(hs)})
                contenu[sid] = [ref[h] for h in hs]
        # Hadiths du chapitre qui ne sont dans aucun sous-chapitre retenu.
        dans_sous = {x for v in contenu.values() for x in v}
        autres = [ref[h] for h in tous if ref[h] not in dans_sous]
        index["chapitres"][cid] = {"theme": theme, "ar": t[1], "fr": fr.get(t[1]), "sujet": t[0], "nombre": len(tous), "sous": sous}
        index["themes"].setdefault(theme, []).append(cid)
        json.dump({"sous": {k: compacter(v) for k, v in contenu.items()}, "autres": compacter(autres)},
                  open(os.path.join(o.sortie, "hadiths", f"{cid}.json"), "w", encoding="utf8"), separators=(",", ":"))
        total_h += len(tous)

    for theme, regle in THEMES.items():
        for cid, nom in regle.get("fixes", {}).items():
            ajouter(theme, cid, par_nom(nom)[0])
        for nom in regle.get("noeuds", []):
            t = par_nom(nom)[0]; ajouter(theme, f"c{t[0]}", t)
        for racine in regle.get("racines", []):
            rac = par_nom(racine, 1)[0]
            for ch in enfants.get(rac[0], []):
                if ch[1] in regle.get("exclure", []):
                    continue
                if ch[1] in regle.get("deplier", []):
                    # Chapitre trop vaste : ses sous-thèmes deviennent des chapitres.
                    for s in enfants.get(ch[0], []):
                        ajouter(theme, f"c{s[0]}", s)
                else:
                    ajouter(theme, f"c{ch[0]}", ch)
    with open(os.path.join(o.sortie, "index.json"), "w", encoding="utf8", newline="\n") as f:
        json.dump(index, f, ensure_ascii=False, separators=(",", ":"))
    n_sous = sum(len(ch["sous"]) for ch in index["chapitres"].values())
    print(f"chapitres : {len(index['chapitres'])}, sous-chapitres : {n_sous}, références : {total_h}")
    for th, ids in index["themes"].items():
        print(f"  {th} : {len(ids)} chapitres")


if __name__ == "__main__":
    main()
