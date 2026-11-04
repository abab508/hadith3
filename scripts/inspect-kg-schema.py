#!/usr/bin/env python3
"""Inspecte sans modification le schéma SQLite Hadith Knowledge Graph.

Usage: python scripts/inspect-kg-schema.py /data/hadith-kg.db > kg-schema.json
N'infère aucune relation à partir du nom des colonnes.
"""
import argparse
import json
import sqlite3
from pathlib import Path


def inspect_database(path: Path) -> dict:
    if not path.is_file():
        raise FileNotFoundError(str(path))
    with sqlite3.connect(f"file:{path.resolve()}?mode=ro", uri=True) as db:
        db.row_factory = sqlite3.Row
        tables = [row["name"] for row in db.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
        )]
        output = {"source": "emadjumaah/hadith-kg", "tables": {}}
        for table in tables:
            quoted = '"' + table.replace('"', '""') + '"'
            columns = [dict(row) for row in db.execute(f"PRAGMA table_info({quoted})")]
            relations = [dict(row) for row in db.execute(f"PRAGMA foreign_key_list({quoted})")]
            output["tables"][table] = {"columns": columns, "foreign_keys": relations}
        return output


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("db", type=Path)
    args = parser.parse_args()
    try:
        print(json.dumps(inspect_database(args.db), ensure_ascii=False, indent=2))
    except (sqlite3.Error, OSError) as error:
        parser.exit(1, f"Erreur d'inspection : {error}\n")
