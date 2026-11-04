#!/usr/bin/env python3
"""Exporte, depuis la base locale hadith-kg (« الجامع — Hadith Knowledge Graph », emadjumaah, CC BY 4.0),
les recueils SUNNITES de la bibliothèque Milaghaiba qui n'ont pas d'édition hadith-api
(aucun recueil imamite ou ibadite : demande du patron) : texte arabe, chaînes
et fiches des transmetteurs, en petits fichiers JSON pour le dépôt de données public.

Usage : python -I scripts/exporter-recueils-kg.py --db data/kg/hadith-kg.db --sortie <dossier du dépôt de données>

Correspondance catalogue -> livres hadith-kg écrite à la main (aucune devinette par ressemblance de nom).
Les 7 recueils servis par hadith-api (Bukhārī, Muslim, Abū Dāwūd, Tirmidhī, Nasāʾī, Ibn Mājah, Mālik)
ne sont pas repris ici.
"""
import argparse, json, os, sqlite3, sys

# id du catalogue (data/recueils/catalogue-recueils.json) -> livres hadith-kg (id), dans l'ordre de lecture
RECUEILS = {
    "musnad-ahmad": [9], "sunan-darimi": [7], "sahih-ibn-khuzayma": [10], "sahih-ibn-hibban": [11],
    "mustadrak": [12], "musannaf-abd-al-razzaq": [61], "musannaf-ibn-abi-shayba": [62],
    "sunan-ad-daraqutni": [20], "sunan-kubra-bayhaqi": [22], "sunan-kubra-nasai": [17],
    "shuab-al-iman": [195], "marifat-as-sunan-wal-athar": [24], "sunan-said-ibn-mansur": [18],
    "kitab-al-athar-shaybani": [206], "kitab-al-athar-abi-yusuf": [205], "tahdhib-al-athar": [223],
    "musnad-at-tayalisi": [29], "musnad-al-humaydi": [31], "musnad-ash-shafii": [33],
    "musnad-ishaq-ibn-rahwayh": [30], "musnad-al-bazzar": [35, 36], "musnad-abi-yala": [37],
    "musnad-abi-awana": [13], "musnad-as-sarraj": [43], "musnad-abi-hanifa": [47],
    "mujam-kabir": [67], "al-mujam-al-awsat": [66], "al-mujam-as-saghir": [65],
    "al-adab-al-mufrad": [335], "ash-shama-il-al-muhammadiyya": [264],
    "amal-al-yawm-ibn-al-sunni": [387], "zuhd-ahmad": [332], "zuhd-ibn-al-mubarak": [323],
    "hilyat-al-awliya": [267], "al-matalib-al-aliya": [40], "ithaf-al-khiyara-al-mahara": [41],
    "sahifat-hammam-ibn-munabbih": [85], "al-marasil-d-abou-dawoud": [143],
    "al-muntakhab-min-musnad-abd-ibn-humayd": [52], "musnad-al-harith": [42],
    "sharh-maani-al-athar": [229], "sharh-mushkil-al-athar": [230],
}
BLOC = 100          # hadiths par fichier
SEAU = 1000         # transmetteurs par fichier (id // SEAU)
SOURCE = "« الجامع — Hadith Knowledge Graph » (emadjumaah/hadith-kg), licence CC BY 4.0"


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
    utilises = set(); index = []
    for rid, livres in RECUEILS.items():
        noms = [c.execute("select name from books where id=?", (b,)).fetchone()[0] for b in livres]
        hadiths = []
        for b in livres:
            for hid, no, nass in c.execute("select id, no_inbook, nass from hadiths where book_id=? order by no_inbook, id", (b,)):
                chaines, jugements = [], []
                for sid, hukum in c.execute("select id, hukum from sanads where hadith_id=? order by id", (hid,)):
                    ch = [r for (r,) in c.execute("select rawi_id from sanad_rawis where sanad_id=? order by pos", (sid,))]
                    if len(ch) >= 2:
                        chaines.append(ch); jugements.append(hukum or ""); utilises.update(ch)
                d = {"n": len(hadiths) + 1, "ref": no, "texte": (nass or "").strip()}
                if chaines:
                    d["chaines"] = chaines; d["hukm"] = jugements
                hadiths.append(d)
        for i in range(0, len(hadiths), BLOC):
            ecrire(os.path.join(o.sortie, "recueils", rid, f"{i // BLOC + 1}.json"), {"hadiths": hadiths[i:i + BLOC]})
        avec = sum(1 for h in hadiths if "chaines" in h)
        man = {"id": rid, "livres": noms, "nombre": len(hadiths), "avecChaine": avec, "bloc": BLOC, "source": SOURCE}
        # Auteur = premier maillon qui ouvre au moins 80 % des chaînes (sinon aucun : recueils de zawāʾid).
        premiers = {}
        for h in hadiths:
            for ch in h.get("chaines", []):
                premiers[ch[0]] = premiers.get(ch[0], 0) + 1
        if premiers:
            a, k = max(premiers.items(), key=lambda x: x[1])
            if k / sum(premiers.values()) >= 0.8:
                man["auteur"] = a
        ecrire(os.path.join(o.sortie, "recueils", rid, "manifeste.json"), man)
        index.append(man)
        print(f"{rid}: {len(hadiths)} hadiths, {avec} avec chaîne")
    seaux = {}
    for r in c.execute("select id,name,nickname,rank,tabaka,birth_year_raw,death_year_raw,nasab,iqama,death_place,riwaya_qty,has_tadlis,has_ikhtilat,is_stub from rawis"):
        if r[0] in utilises:
            seaux.setdefault(r[0] // SEAU, {})[str(r[0])] = {k: v for k, v in zip(["nom","kunya","rang","tabaqa","naissance","deces","nasab","residence","lieuDeces","riwayat","tadlis","ikhtilat","incomplet"], r[1:]) if v not in (None, "", 0)}
    for rid, critique, qawl in c.execute("select a.rawi_id, coalesce(al.shuhra, al.nickname, al.name), a.qawl from aqwal a join alems al on al.id=a.alem_id order by a.id"):
        f = seaux.get(rid // SEAU, {}).get(str(rid))
        if f is not None and qawl:
            f.setdefault("jugements", []).append([critique, qawl.strip()])
    for k, v in seaux.items():
        ecrire(os.path.join(o.sortie, "transmetteurs", f"{k}.json"), {"transmetteurs": v})
    ecrire(os.path.join(o.sortie, "index.json"), {"version": 1, "source": SOURCE, "bloc": BLOC, "seau": SEAU, "recueils": index})
    print(f"recueils: {len(index)}, hadiths: {sum(m['nombre'] for m in index)}, transmetteurs: {len(utilises)}")


if __name__ == "__main__":
    main()
