"""Génère la voix off arabe (gratuite, edge-tts) scène par scène, avec le minutage de chaque mot.

Usage : python voix.py
Sortie : audio/scene-N.mp3, audio/durees.json, audio/mots.json
"""
import asyncio
import json
import re
import subprocess
from pathlib import Path

import edge_tts
import imageio_ffmpeg

ICI = Path(__file__).parent
AUDIO = ICI / "audio"
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


def duree(fichier: Path) -> float:
    sortie = subprocess.run([FFMPEG, "-i", str(fichier)], capture_output=True, text=True).stderr
    h, m, s = re.search(r"Duration: (\d+):(\d+):([\d.]+)", sortie).groups()
    return int(h) * 3600 + int(m) * 60 + float(s)


async def une_scene(scene: dict, voix: str, debit: str, fichier: Path) -> list:
    """Enregistre le MP3 et renvoie [{texte, debut, fin}] en secondes pour chaque mot."""
    mots = []
    com = edge_tts.Communicate(scene["ar"], voix, rate=debit, boundary="WordBoundary")
    with open(fichier, "wb") as f:
        async for morceau in com.stream():
            if morceau["type"] == "audio":
                f.write(morceau["data"])
            elif morceau["type"] == "WordBoundary":
                debut = morceau["offset"] / 1e7
                mots.append({"texte": morceau["text"], "debut": round(debut, 3),
                             "fin": round(debut + morceau["duration"] / 1e7, 3)})
    return mots


async def main() -> None:
    donnees = json.loads((ICI / "scenes.json").read_text(encoding="utf-8"))
    AUDIO.mkdir(exist_ok=True)
    durees, tous_mots = {}, {}
    for scene in donnees["scenes"]:
        fichier = AUDIO / f"scene-{scene['id']}.mp3"
        tous_mots[scene["id"]] = await une_scene(scene, donnees["voix"], donnees["debit"], fichier)
        durees[scene["id"]] = round(duree(fichier), 3)
        print(f"scène {scene['id']} : {durees[scene['id']]} s, {len(tous_mots[scene['id']])} mots")
    (AUDIO / "durees.json").write_text(json.dumps(durees, indent=2), encoding="utf-8")
    (AUDIO / "mots.json").write_text(json.dumps(tous_mots, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"total voix : {sum(durees.values()):.1f} s")


asyncio.run(main())
