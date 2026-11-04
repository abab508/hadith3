#!/usr/bin/env python3
"""Exporte, depuis la base locale hadith-kg (CC BY 4.0, emadjumaah/hadith-kg), les chaînes et les
fiches des transmetteurs des 7 grands recueils de l'index hadith-api.

Lien hadith-api -> hadith-kg : les numéros diffèrent entre les deux sources, donc on relie par le
TEXTE arabe (mêmes 6 premiers mots puis ressemblance >= 0,8 sur l'ensemble des mots). Un hadith non
relié n'a pas de chaîne exportée : on n'invente aucun transmetteur.

Usage : python -I scripts/exporter-fiches-kg.py --db data/kg/hadith-kg.db --cache <dossier> --sortie data/transmetteurs-kg
Les éditions arabes hadith-api sont téléchargées une fois dans --cache (jamais dans le dépôt).
"""
import argparse, json, os, re, sqlite3, sys, urllib.request

LIVRES = {  # clé hadith-api -> nom du livre dans hadith-kg
    "bukhari": "صحيح البخاري", "muslim": "صحيح مسلم", "abudawud": "سنن أبي داود",
    "tirmidhi": "جامع الترمذي", "nasai": "سنن النسائى الصغرى", "ibnmajah": "سنن ابن ماجه",
    "malik": "موطأ مالك رواية يحيى الليثي",
}
SEUIL = 0.8
VOY = re.compile(r"[ً-ٰٟـۖ-ۭ]")


def norm(t):
    t = VOY.sub("", t or "")
    t = re.sub(r"[أإآٱ]", "ا", t).replace("ى", "ي").replace("ة", "ه")
    t = re.sub(r"[^ء-ي ]+", " ", t)
    return re.sub(r"\s+", " ", t).strip()


def edition(cache, key):
    f = os.path.join(cache, f"ara-{key}.json")
    if not os.path.exists(f):
        urllib.request.urlretrieve(f"https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-{key}.min.json", f)
    return json.load(open(f, encoding="utf8"))["hadiths"]


def livre_id(c, nom):
    r = c.execute("select id from books where name = ? order by hadith_qty desc limit 1", (nom,)).fetchone()
    if not r:
        r = c.execute("select id from books where name like ? order by hadith_qty desc limit 1", (nom + "%",)).fetchone()
    return r[0] if r else None


def main():
    a = argparse.ArgumentParser()
    a.add_argument("--db", required=True); a.add_argument("--cache", required=True); a.add_argument("--sortie", required=True)
    o = a.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")
    c = sqlite3.connect(f"file:{o.db}?mode=ro", uri=True)
    os.makedirs(o.sortie, exist_ok=True); os.makedirs(o.cache, exist_ok=True)
    utilises = set(); rapport = {}
    for key, nom in LIVRES.items():
        bid = livre_id(c, nom)
        if bid is None:
            print(f"{key}: livre introuvable dans hadith-kg ({nom})"); continue
        api = edition(o.cache, key)
        kg = c.execute("select id, nass from hadiths where book_id=?", (bid,)).fetchall()
        toks = {hid: set(norm(n).split()) for hid, n in kg}
        par6 = {}
        for hid, n in kg:
            par6.setdefault(" ".join(norm(n).split()[:6]), []).append(hid)
        liens = {}
        for h in api:
            w = norm(h.get("text")).split(); s = set(w)
            cands = par6.get(" ".join(w[:6]), [])
            best = max(((len(s & toks[x]) / max(1, len(s | toks[x])), x) for x in cands), default=(0, None))
            if best[0] < SEUIL:
                continue
            sanad = c.execute("select id from sanads where hadith_id=? order by id limit 1", (best[1],)).fetchone()
            if not sanad:
                continue
            chaine = [r[0] for r in c.execute("select rawi_id from sanad_rawis where sanad_id=? order by pos", (sanad[0],))]
            if len(chaine) >= 2:
                liens[str(h["hadithnumber"])] = chaine  # pos 0 = auteur du recueil, puis vers le Compagnon
                utilises.update(chaine)
        json.dump({"version": 1, "source": "emadjumaah/hadith-kg (CC BY 4.0)", "edition": f"ara-{key}", "seuil": SEUIL, "liens": liens},
                  open(os.path.join(o.sortie, f"liens-{key}.json"), "w", encoding="utf8"), ensure_ascii=False, separators=(",", ":"))
        rapport[key] = {"hadiths": len(api), "relies": len(liens)}
        print(f"{key}: {len(liens)}/{len(api)} hadiths reliés")
    rawis = {}
    for r in c.execute("select id,name,nickname,rank,tabaka,birth_year_raw,death_year_raw,nasab,iqama,death_place,riwaya_qty,has_tadlis,has_ikhtilat,is_stub from rawis"):
        if r[0] in utilises:
            rawis[str(r[0])] = {k: v for k, v in zip(["nom","kunya","rang","tabaqa","naissance","deces","nasab","residence","lieuDeces","riwayat","tadlis","ikhtilat","incomplet"], r[1:]) if v not in (None, "", 0)}
    aqwal = {}
    for rid, critique, qawl in c.execute("select a.rawi_id, coalesce(al.shuhra, al.nickname, al.name), a.qawl from aqwal a join alems al on al.id=a.alem_id order by a.id"):
        if rid in utilises and qawl:
            aqwal.setdefault(str(rid), []).append([critique, qawl.strip()])
    json.dump({"version": 1, "source": "emadjumaah/hadith-kg (CC BY 4.0)", "transmetteurs": rawis},
              open(os.path.join(o.sortie, "transmetteurs.json"), "w", encoding="utf8"), ensure_ascii=False, separators=(",", ":"))
    json.dump({"version": 1, "source": "emadjumaah/hadith-kg (CC BY 4.0)", "jugements": aqwal},
              open(os.path.join(o.sortie, "jugements.json"), "w", encoding="utf8"), ensure_ascii=False, separators=(",", ":"))
    json.dump({"source": "emadjumaah/hadith-kg (CC BY 4.0)", "seuil": SEUIL, "recueils": rapport, "transmetteurs": len(rawis), "avecJugements": len(aqwal)},
              open(os.path.join(o.sortie, "manifeste.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)
    print(f"transmetteurs: {len(rawis)}, avec jugements: {len(aqwal)}")


if __name__ == "__main__":
    main()
