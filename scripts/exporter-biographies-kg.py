#!/usr/bin/env python3
"""Exporte les séries de biographies du site depuis la base locale hadith-kg
(« الجامع — Hadith Knowledge Graph », emadjumaah/hadith-kg, CC BY 4.0).

Rien n'est rédigé ni deviné : chaque fiche reprend les champs de la source (noms, dates, lieux, rang,
génération), les jugements des critiques cités tels quels, et les maîtres / élèves déduits des chaînes
de la source (voisins directs dans une chaîne, avec le nombre de chaînes).

Séries (seuils = nombre de récits indiqué par la source) :
  compagnons  : rang « صحابي », au moins 5 récits
  successeurs : générations 2 à 5 de la source, au moins 20 récits
  atba        : générations 6 à 9 de la source, au moins 50 récits
  auteurs     : auteur d'un recueil de la bibliothèque (premier maillon d'au moins 80 % des chaînes)
  critiques   : critiques de la source, au moins 50 jugements (sans fiche : liste seulement)

Usage : python -I scripts/exporter-biographies-kg.py --db data/kg/hadith-kg.db --sortie data/biographies
"""
import argparse, json, os, sqlite3, sys
from collections import Counter, defaultdict

# Livres hadith-kg -> id du catalogue du site (les 7 grands + les recueils lus depuis hadith-kg).
LIVRES = {
    1: "sahih-bukhari", 2: "sahih-muslim", 4: "sunan-abi-dawud", 3: "jami-tirmidhi", 5: "sunan-nasai",
    6: "sunan-ibn-majah", 8: "muwatta",
    9: "musnad-ahmad", 7: "sunan-darimi", 10: "sahih-ibn-khuzayma", 11: "sahih-ibn-hibban", 12: "mustadrak",
    61: "musannaf-abd-al-razzaq", 62: "musannaf-ibn-abi-shayba", 20: "sunan-ad-daraqutni", 22: "sunan-kubra-bayhaqi",
    17: "sunan-kubra-nasai", 195: "shuab-al-iman", 24: "marifat-as-sunan-wal-athar", 18: "sunan-said-ibn-mansur",
    206: "kitab-al-athar-shaybani", 205: "kitab-al-athar-abi-yusuf", 223: "tahdhib-al-athar", 29: "musnad-at-tayalisi",
    31: "musnad-al-humaydi", 33: "musnad-ash-shafii", 30: "musnad-ishaq-ibn-rahwayh", 35: "musnad-al-bazzar",
    36: "musnad-al-bazzar", 37: "musnad-abi-yala", 13: "musnad-abi-awana", 43: "musnad-as-sarraj", 47: "musnad-abi-hanifa",
    67: "mujam-kabir", 66: "al-mujam-al-awsat", 65: "al-mujam-as-saghir", 335: "al-adab-al-mufrad",
    264: "ash-shama-il-al-muhammadiyya", 387: "amal-al-yawm-ibn-al-sunni", 332: "zuhd-ahmad", 323: "zuhd-ibn-al-mubarak",
    267: "hilyat-al-awliya", 40: "al-matalib-al-aliya", 41: "ithaf-al-khiyara-al-mahara", 85: "sahifat-hammam-ibn-munabbih",
    143: "al-marasil-d-abou-dawoud", 52: "al-muntakhab-min-musnad-abd-ibn-humayd", 42: "musnad-al-harith",
    229: "sharh-maani-al-athar", 230: "sharh-mushkil-al-athar",
}
SEAU = 2000      # fiches par fichier (id // SEAU)
VOISINS = 8      # maîtres et élèves gardés par fiche
SOURCE = "« الجامع — Hadith Knowledge Graph » (emadjumaah/hadith-kg), licence CC BY 4.0"
CHAMPS = ["nom", "kunya", "rang", "tabaqa", "naissance", "deces", "age", "metier", "nasab", "residence", "lieuDeces",
          "riwayat", "tadlis", "ikhtilat"]


def ecrire(chemin, donnees):
    os.makedirs(os.path.dirname(chemin), exist_ok=True)
    with open(chemin, "w", encoding="utf8", newline="\n") as f:
        json.dump(donnees, f, ensure_ascii=False, separators=(",", ":"))


def main():
    a = argparse.ArgumentParser()
    a.add_argument("--db", required=True); a.add_argument("--sortie", required=True)
    o = a.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")
    c = sqlite3.connect(f"file:{o.db}?mode=ro", uri=True)

    ligne = "select id from rawis where is_stub=0 and "
    series = {
        "compagnons": [r for (r,) in c.execute(ligne + "rank='صحابي' and riwaya_qty>=5 order by riwaya_qty desc, id")],
        "successeurs": [r for (r,) in c.execute(ligne + "tabaka between 2 and 5 and rank<>'صحابي' and riwaya_qty>=20 order by riwaya_qty desc, id")],
        "atba": [r for (r,) in c.execute(ligne + "tabaka between 6 and 9 and riwaya_qty>=50 order by riwaya_qty desc, id")],
    }

    # Auteurs des recueils : premier maillon (pos 0) d'au moins 80 % des chaînes du livre.
    hadith_livre = {}
    for hid, bid in c.execute(f"select id, book_id from hadiths where book_id in ({','.join(map(str, LIVRES))})"):
        hadith_livre[hid] = bid
    sanad_livre = {}
    for sid, hid in c.execute("select id, hadith_id from sanads"):
        b = hadith_livre.get(hid)
        if b is not None:
            sanad_livre[sid] = b
    print(f"chaînes des recueils : {len(sanad_livre)}")

    # Un seul passage sur toutes les chaînes : voisins directs et premier maillon.
    voisins_m, voisins_e = defaultdict(Counter), defaultdict(Counter)
    premiers = defaultdict(Counter)
    courant, chaine = None, []

    def traiter(sid, ch):
        if len(ch) < 2:
            return
        b = sanad_livre.get(sid)
        if b is not None:
            premiers[b][ch[0]] += 1
        # pos croissante = de l'auteur vers le Compagnon : le maillon suivant est le maître.
        for i in range(len(ch) - 1):
            eleve, maitre = ch[i], ch[i + 1]
            if eleve != maitre:
                voisins_m[eleve][maitre] += 1
                voisins_e[maitre][eleve] += 1

    for sid, rid in c.execute("select sanad_id, rawi_id from sanad_rawis order by sanad_id, pos"):
        if sid != courant:
            if courant is not None:
                traiter(courant, chaine)
            courant, chaine = sid, []
        chaine.append(rid)
    if courant is not None:
        traiter(courant, chaine)

    auteurs = defaultdict(list)
    for b, compte in premiers.items():
        rid, n = compte.most_common(1)[0]
        if n / sum(compte.values()) >= 0.8:
            if LIVRES[b] not in auteurs[rid]:
                auteurs[rid].append(LIVRES[b])
    series["auteurs"] = sorted(auteurs, key=lambda r: min(list(LIVRES.values()).index(x) for x in auteurs[r]))

    retenus = set().union(*series.values())
    fiches = {}
    for r in c.execute("select id,name,nickname,rank,tabaka,birth_year_raw,death_year_raw,age_raw,profession,nasab,iqama,death_place,riwaya_qty,has_tadlis,has_ikhtilat from rawis"):
        if r[0] in retenus:
            fiches[r[0]] = {k: v for k, v in zip(CHAMPS, r[1:]) if v not in (None, "", 0)}
    for rid, critique, qawl in c.execute("select a.rawi_id, coalesce(al.shuhra, al.nickname, al.name), a.qawl from aqwal a join alems al on al.id=a.alem_id order by a.id"):
        f = fiches.get(rid)
        if f is not None and qawl and qawl.strip():
            f.setdefault("jugements", []).append([critique, qawl.strip()])
    noms = {}
    besoin = {v for rid in retenus for d in (voisins_m[rid], voisins_e[rid]) for v, _ in d.most_common(VOISINS)}
    for rid, nom, kunya in c.execute("select id, name, nickname from rawis"):
        if rid in besoin:
            noms[rid] = kunya or nom
    for rid, f in fiches.items():
        f["maitres"] = [[v, noms.get(v, ""), n] for v, n in voisins_m[rid].most_common(VOISINS)]
        f["eleves"] = [[v, noms.get(v, ""), n] for v, n in voisins_e[rid].most_common(VOISINS)]
        if rid in auteurs:
            f["recueils"] = auteurs[rid]

    seaux = defaultdict(dict)
    for rid, f in fiches.items():
        seaux[rid // SEAU][str(rid)] = f
    for k, v in seaux.items():
        ecrire(os.path.join(o.sortie, "fiches", f"{k}.json"), {"fiches": v})

    def entree(rid):
        f = fiches[rid]
        return [rid, f.get("kunya") or f["nom"], f["nom"], f.get("deces", ""), f.get("riwayat", 0)]

    critiques = [[i, s or n, n, d or 0, rg or "", q] for i, s, n, d, rg, q in
                 c.execute("select id, shuhra, name, death_year, rank, aqwal_qty from alems where aqwal_qty>=50 and name<>'تعليق' order by aqwal_qty desc, id")]
    ecrire(os.path.join(o.sortie, "series.json"), {
        "version": 1, "source": SOURCE, "seau": SEAU,
        "series": {nom: [entree(r) for r in ids] for nom, ids in series.items()},
        "recueilsAuteurs": {str(r): auteurs[r] for r in series["auteurs"]},
        "critiques": critiques,
    })
    for nom, ids in series.items():
        print(f"{nom}: {len(ids)}")
    print(f"critiques: {len(critiques)}, fiches: {len(fiches)}")


if __name__ == "__main__":
    main()
