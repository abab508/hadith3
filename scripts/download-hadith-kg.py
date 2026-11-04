#!/usr/bin/env python3
"""Téléchargement reproductible du fichier canonique KG (~1,6 Go).

Source officielle : https://huggingface.co/datasets/emadjumaah/hadith-kg
Usage: python scripts/download-hadith-kg.py --destination /data/hadith-kg.db
Télécharge dans un fichier .part, contrôle le SHA256 Git LFS officiel, puis
renomme atomiquement. Ne copie jamais la base dans le dépôt Git.
"""
import argparse
import hashlib
import os
from pathlib import Path
from urllib.request import Request, urlopen

URL = "https://huggingface.co/datasets/emadjumaah/hadith-kg/resolve/main/hadith-kg.db?download=true"
SHA256 = "d528084321e715006712e0e2461809a3afc9408065a1d1af90238c8b723815a6"
SIZE = 1634877440

def sha256(path):
    digest=hashlib.sha256()
    with path.open("rb") as stream:
        while block:=stream.read(4*1024*1024):
            digest.update(block)
    return digest.hexdigest()

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--destination",type=Path,required=True)
    args=ap.parse_args()
    target=args.destination.resolve()
    target.parent.mkdir(parents=True,exist_ok=True)
    if target.exists() and target.stat().st_size==SIZE and sha256(target)==SHA256:
        print(f"Base déjà vérifiée : {target}")
        return
    partial=target.with_name(target.name+".part")
    if partial.exists():
        partial.unlink()
    request=Request(URL,headers={"User-Agent":"Milaghaiba-KG-Installer/1.0"})
    try:
        with urlopen(request,timeout=120) as response,partial.open("wb") as output:
            digest=hashlib.sha256()
            total=0
            while data:=response.read(4*1024*1024):
                output.write(data)
                digest.update(data)
                total+=len(data)
        if total!=SIZE or digest.hexdigest()!=SHA256:
            raise ValueError(f"Contrôle d'intégrité échoué: taille={total}, SHA256={digest.hexdigest()}")
        os.replace(partial,target)
        print(f"Base KG authentifiée et enregistrée : {target}")
    except Exception:
        if partial.exists():
            partial.unlink()
        raise

if __name__=="__main__":
    main()
