#!/usr/bin/env python3
"""Exporter un rapport documentaire réel depuis Hadith KG (lecture seule).

python scripts/export-kg-report.py data/kg/hadith-kg.db --hadith-id 123 --output rapport-kg.json
python scripts/export-kg-report.py data/kg/hadith-kg.db --book-id 1 --number 22 --output rapport-kg.json

Aucune déduction d'authenticité ni identification par homonymie.
"""
import argparse
import json
import sqlite3
from pathlib import Path


def rows(db, sql, args=()):
    return [dict(r) for r in db.execute(sql, args)]


def build(db, hadith_id=None, book_id=None, number=None):
    if hadith_id is not None:
        found = rows(db, "SELECT * FROM hadiths WHERE id = ? LIMIT 1", (hadith_id,))
    else:
        found = rows(db, "SELECT * FROM hadiths WHERE book_id = ? AND CAST(no_inbook AS TEXT) = ? ORDER BY id LIMIT 2", (book_id, str(number)))
        if len(found) > 1:
            raise ValueError("Plusieurs hadiths correspondent à ce recueil/numéro : indiquer --hadith-id")
    if not found:
        raise ValueError("Hadith introuvable dans ce corpus")
    hadith = found[0]
    book = rows(db, "SELECT * FROM books WHERE id = ?", (hadith["book_id"],))
    chains = rows(db, "SELECT * FROM sanads WHERE hadith_id = ? ORDER BY id", (hadith["id"],))
    output_chains = []
    rawi_ids = set()
    for chain in chains:
        members = rows(db, """SELECT sr.pos, sr.rawi_id, r.* FROM sanad_rawis sr
            LEFT JOIN rawis r ON r.id = sr.rawi_id
            WHERE sr.sanad_id = ? ORDER BY sr.pos ASC""", (chain["id"],))
        for member in members:
            if member["rawi_id"] is not None:
                rawi_ids.add(member["rawi_id"])
        output_chains.append({"sanad": chain, "members": members, "order": "pos ASC, as recorded in source"})
    judgments = {}
    for rawi_id in sorted(rawi_ids):
        opinions = rows(db, """SELECT a.id, a.rawi_id, a.alem_id, a.qawl,
            e.name AS scholar_name, e.nickname AS scholar_nickname, e.shuhra AS scholar_shuhra
            FROM aqwal a LEFT JOIN alems e ON e.id=a.alem_id
            WHERE a.rawi_id=? ORDER BY a.id""", (rawi_id,))
        judgments[str(rawi_id)] = opinions
    return {
        "source": "emadjumaah/hadith-kg",
        "status": "raw-source-data-not-independently-verified",
        "hadith": hadith,
        "book": book[0] if book else None,
        "chains": output_chains,
        "judgments_by_rawi_id": judgments,
        "notice": "Individual quotations are attributed to their authors. Chain order follows the source pos field. No global authenticity judgment is inferred."
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("db", type=Path)
    choice = parser.add_mutually_exclusive_group(required=True)
    choice.add_argument("--hadith-id", type=int)
    choice.add_argument("--book-id", type=int)
    parser.add_argument("--number")
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.book_id is not None and not args.number:
        parser.error("--number est obligatoire avec --book-id")
    if not args.db.is_file():
        parser.error("Base SQLite introuvable")
    with sqlite3.connect(f"file:{args.db.resolve()}?mode=ro", uri=True) as db:
        db.row_factory = sqlite3.Row
        try:
            report = build(db, args.hadith_id, args.book_id, args.number)
        except (sqlite3.Error, ValueError) as error:
            parser.exit(1, f"Erreur : {error}\n")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8") as file:
        json.dump(report, file, ensure_ascii=False, indent=2)
    print(f"Rapport écrit : {args.output} ; {len(report['chains'])} chaînes")


if __name__ == "__main__":
    main()
