#!/usr/bin/env python3
"""Exporte, depuis la base locale hadith-kg (CC BY 4.0, emadjumaah/hadith-kg), les chaînes et les
fiches des transmetteurs des 7 grands recueils de l'index hadith-api.

Lien hadith-api -> hadith-kg : les numéros diffèrent entre les deux sources, donc on relie par le
TEXTE arabe (au moins 60 % des mots du hadith dans l'entrée), puis on choisit, parmi les chaînes de l'entrée,
celle dont les noms (positions données par la source) sont écrits dans le hadith (au moins 75 %,
et tous les noms si moins de 85 % des mots sont retrouvés). Un hadith non
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
CONTENANCE = 0.6   # part des mots du hadith retrouvés dans l'entrée hadith-kg
SURE = 0.85        # au-dessous, tous les noms de la chaîne doivent être écrits dans le hadith
NOMS = 0.75        # part des transmetteurs de la chaîne dont le nom est écrit dans le hadith
VOY = re.compile(r"[ً-ٰٟـۖ-ۭ]")


def norm(t):
    t = VOY.sub("", t or "")
    t = re.sub(r"[أإآٱ]", "ا", t).replace("ى", "ي").replace("ة", "ه")
    t = re.sub(r"[^ء-ي ]+", " ", t)
    return re.sub(r"\s+", " ", t).strip()


def abu(t):
    # « Abū » change de forme selon la phrase (أبو / أبي / أبا) : une seule forme pour comparer.
    return re.sub(r"(?<![^ ])اب[ويا](?![^ ])", "ابو", t)


_memo = {}
def mentions(c, hid, nass):
    """Formes écrites de chaque transmetteur dans le texte hadith-kg (positions données par la source)."""
    if hid not in _memo:
        f = {}
        for rid, a, b in c.execute("select rawi_id, start, end from hadith_rawis where hadith_id=?", (hid,)):
            n = abu(norm(nass[a:b]))
            for v in {n, n[1:] if n.startswith("و") and len(n) > 3 else n}:
                if len(v) >= 3:
                    f.setdefault(rid, set()).add(" " + v + " ")
        _memo[hid] = f
    return _memo[hid]


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
        kg = dict(c.execute("select id, nass from hadiths where book_id=?", (bid,)).fetchall())
        toks = {hid: set(norm(n).split()) for hid, n in kg.items()}
        inv = {}
        for hid, t in toks.items():
            for w in t:
                inv.setdefault(w, set()).add(hid)
        auteur = c.execute("select sr.rawi_id from sanad_rawis sr join sanads s on s.id=sr.sanad_id join hadiths h on h.id=s.hadith_id "
                           "where h.book_id=? and sr.pos=0 group by sr.rawi_id order by count(*) desc limit 1", (bid,)).fetchone()
        liens = {}; stats = {"chaine": 0, "mentions": 0}
        for h in api:
            texte = " " + abu(norm(h.get("text"))) + " "
            s = set(texte.split())
            if len(s) < 4:
                continue
            # Candidats : entrées hadith-kg qui partagent les mots les plus rares du texte.
            rares = sorted((w for w in s if w in inv and len(inv[w]) < 300), key=lambda w: len(inv[w]))[:10]
            cands = set().union(*(inv[w] for w in rares)) if rares else set()
            classes = sorted(((len(s & toks[x]) / len(s), x) for x in cands), reverse=True)[:3]
            meilleur = None  # (score, chaîne)
            for contenance, x in classes:
                if contenance < CONTENANCE:
                    break
                formes = mentions(c, x, kg[x])
                trouve = lambda rid: any(f in texte for f in formes.get(rid, ()))
                sanads = [[r[0] for r in c.execute("select rawi_id from sanad_rawis where sanad_id=? order by pos", (sid,))]
                          for (sid,) in c.execute("select id from sanads where hadith_id=? order by id", (x,))]
                for ch in sanads:
                    corps = ch[1:]
                    if len(corps) < 1:
                        continue
                    score = sum(map(trouve, corps)) / len(corps)
                    if score >= (NOMS if contenance >= SURE else 1) and (meilleur is None or score > meilleur[0]):
                        meilleur = (score, ch, "chaine")
                if not sanads and auteur and " ح " not in " " + norm(kg[x]) + " ":
                    # Entrée sans chaîne : les noms identifiés par la source dans le texte, s'ils sont tous présents ici.
                    ordre = [r for (r,) in c.execute("select rawi_id from hadith_rawis where hadith_id=? order by seq", (x,))]
                    ordre = [r for r in ordre if r != auteur[0]]
                    ch = [auteur[0]] + [r for i, r in enumerate(ordre) if i == 0 or r != ordre[i - 1]]
                    if len(ch) >= 2 and all(map(trouve, ch[1:])) and len(set(ch[1:])) == len(ch[1:]) and (meilleur is None or meilleur[0] < 1):
                        meilleur = (1.0, ch, "mentions")
                if meilleur and meilleur[0] == 1:
                    break
            if meilleur:
                liens[str(h["hadithnumber"])] = meilleur[1]  # pos 0 = auteur du recueil, puis vers le Compagnon
                utilises.update(meilleur[1]); stats[meilleur[2]] += 1
        json.dump({"version": 2, "source": "emadjumaah/hadith-kg (CC BY 4.0)", "edition": f"ara-{key}", "contenance": CONTENANCE, "noms": NOMS, "liens": liens},
                  open(os.path.join(o.sortie, f"liens-{key}.json"), "w", encoding="utf8"), ensure_ascii=False, separators=(",", ":"))
        rapport[key] = {"hadiths": len(api), "relies": len(liens), **stats}
        print(f"{key}: {len(liens)}/{len(api)} hadiths reliés {stats}")
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
    json.dump({"source": "emadjumaah/hadith-kg (CC BY 4.0)", "contenance": CONTENANCE, "noms": NOMS, "recueils": rapport, "transmetteurs": len(rawis), "avecJugements": len(aqwal)},
              open(os.path.join(o.sortie, "manifeste.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)
    print(f"transmetteurs: {len(rawis)}, avec jugements: {len(aqwal)}")


if __name__ == "__main__":
    main()
