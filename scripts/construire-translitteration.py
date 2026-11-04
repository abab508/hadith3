#!/usr/bin/env python3
"""Assemble les tables de translittération (data/translitteration/*.tsv, écrites à la main avec l'aide
de l'IA, à relire) en un seul fichier JSON lu par le site, et mesure la couverture des fiches.

Usage : python -I scripts/construire-translitteration.py [dossier de fiches supplémentaires]
Système : translittération savante courante (ʿ ʾ ā ī ū ḥ ṣ ḍ ṭ ẓ, article « al- » partout).
"""
import glob, json, os, re, sys

ICI = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "translitteration")
SEP_MOTS = re.compile(r"[\s،,]+")
SEP_LIEUX = re.compile(r"\s*[،,]\s*")


def lire_tsv(motif):
    table = {}
    for f in sorted(glob.glob(os.path.join(ICI, motif))):
        for ligne in open(f, encoding="utf8"):
            if "\t" in ligne:
                ar, lat = ligne.rstrip("\n").split("\t", 1)
                table[ar.strip()] = lat.strip()
    return table


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    mots, lieux = lire_tsv("mots-*.tsv"), lire_tsv("lieux.tsv")
    with open(os.path.join(ICI, "translitteration.json"), "w", encoding="utf8", newline="\n") as f:
        json.dump({"origine": "ia", "statut": "à relire", "mots": mots, "lieux": lieux}, f, ensure_ascii=False, separators=(",", ":"))
    print(f"mots: {len(mots)}, lieux: {len(lieux)}")
    fiches = {}
    for f in [os.path.join(ICI, "..", "transmetteurs-kg", "transmetteurs.json")] + glob.glob(os.path.join(sys.argv[1], "*.json")) if len(sys.argv) > 1 else [os.path.join(ICI, "..", "transmetteurs-kg", "transmetteurs.json")]:
        fiches.update(json.load(open(f, encoding="utf8"))["transmetteurs"])
    for champ, sep, table in (("nom", SEP_MOTS, mots), ("kunya", SEP_MOTS, mots), ("nasab", SEP_MOTS, mots), ("residence", SEP_LIEUX, lieux), ("lieuDeces", SEP_LIEUX, lieux)):
        vals = [v[champ] for v in fiches.values() if v.get(champ)]
        ok = sum(all(t in table for t in sep.split(x.strip()) if t) for x in vals)
        print(f"{champ}: {ok}/{len(vals)} entièrement translittérés ({round(ok / max(1, len(vals)) * 100, 1)} %)")


if __name__ == "__main__":
    main()
