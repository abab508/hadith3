#!/usr/bin/env python3
"""Contrôle non destructif de cohérence du corpus Hadith KG.
Vérifie les clés déclarées et l'existence des références sans inventer de relations.
Usage: python scripts/check-kg-integrity.py /data/hadith-kg.db
"""
import argparse
import json
import sqlite3
from pathlib import Path

def inspect(path:Path)->dict:
    if not path.is_file(): raise FileNotFoundError(path)
    with sqlite3.connect(f"file:{path.resolve()}?mode=ro",uri=True) as con:
        con.row_factory=sqlite3.Row
        tables={r[0] for r in con.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        result={"source":"emadjumaah/hadith-kg","tables":{},"foreign_key_violations":[]}
        for name in sorted(tables):
            if name.startswith("sqlite_"):continue
            quoted='"'+name.replace('"','""')+'"'
            n=con.execute(f"SELECT COUNT(*) FROM {quoted}").fetchone()[0]
            fks=[dict(r) for r in con.execute(f"PRAGMA foreign_key_list({quoted})")]
            result["tables"][name]={"rows":n,"declared_foreign_keys":fks}
        # Attention : ce test ne vérifie QUE les clés étrangères déclarées,
        # pas les relations implicites de la base, qui nécessitent un audit dédié.
        failures=[tuple(r) for r in con.execute("PRAGMA foreign_key_check").fetchmany(100)]
        result["foreign_key_violations"]=failures
        result["violations_truncated"]=len(failures)==100
        return result

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("database",type=Path)
    args=p.parse_args()
    try:
        print(json.dumps(inspect(args.database),ensure_ascii=False,indent=2))
    except (OSError,sqlite3.Error) as exc:
        p.exit(1,f"Erreur de vérification : {exc}\n")
