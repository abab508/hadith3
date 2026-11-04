#!/usr/bin/env python3
"""Exporte un échantillon contrôlé de transmetteurs depuis hadith-kg.db.
Usage: python scripts/export-kg-rawis.py /chemin/hadith-kg.db --limit 100
Sortie JSONL sur stdout; aucun jugement n'est reconstruit ou deviné.
La structure des colonnes est détectée : l'export échoue clairement si incompatible.
"""
import argparse
import json
import sqlite3
import sys
from pathlib import Path

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("db", type=Path)
    parser.add_argument("--limit", type=int, default=100)
    args = parser.parse_args()
    if not args.db.is_file():
        parser.error("Fichier SQLite introuvable")
    if not 1 <= args.limit <= 10000:
        parser.error("--limit doit être compris entre 1 et 10000")
    connection = sqlite3.connect(f"file:{args.db.resolve()}?mode=ro", uri=True)
    connection.row_factory = sqlite3.Row
    try:
        cols = {row["name"] for row in connection.execute("PRAGMA table_info(rawis)")}
        if "id" not in cols:
            raise RuntimeError("Table rawis ou colonne id absente")
        # N'importe quel champ publié reste dans son format original,
        # pour conserver la provenance et éviter de fausses traductions.
        rows = connection.execute("SELECT * FROM rawis ORDER BY id LIMIT ?", (args.limit,))
        for row in rows:
            values = dict(row)
            for key, value in list(values.items()):
                if isinstance(value, bytes):
                    values[key] = None
            print(json.dumps({"source": "emadjumaah/hadith-kg", "type": "rawi",
                              "data": values}, ensure_ascii=False))
    finally:
        connection.close()

if __name__ == "__main__":
    try:
        main()
    except (sqlite3.Error, RuntimeError) as error:
        print(f"Échec de l'extraction : {error}", file=sys.stderr)
        raise SystemExit(1)
