"""Prépare l'exemple 2 (OpenMontage, moteur Remotion, scènes « modèles » d'OpenMontage).

Même script, même voix et même minutage que l'exemple HyperFrames (repris de construire_hyperframes.py).
Usage : python construire_openmontage.py
Écrit dans ~/videos-milaghaiba/OpenMontage/projects/abou-bakr-siddiq/ (ou MILAGHAIBA_VIDEOS) :
  assets/audio/narration.mp3            la voix des 8 scènes, mixée au bon moment
  artifacts/composition_props.json      la composition Remotion « Explainer » (scènes, sous-titres, thème)
  artifacts/apercu_props.json           la même sans l'audio, pour les images d'aperçu
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

import imageio_ffmpeg

sys.dont_write_bytecode = True  # pas de __pycache__ dans le dépôt
import construire_hyperframes as hf  # minutage commun (aucun fichier n'est écrit à l'import)

# Le clone d'OpenMontage est à côté du dossier de travail : ~/videos-milaghaiba/OpenMontage.
PROJET = hf.TRAVAIL.parent / "OpenMontage" / "projects" / hf.TRAVAIL.name
# FFmpeg du PATH, sinon celui fourni par imageio-ffmpeg (comme voix.py) : marche sous Windows, macOS et Linux.
FFMPEG = shutil.which("ffmpeg") or imageio_ffmpeg.get_ffmpeg_exe()

THEME_NUIT_OR = {
    "primaryColor": "#E3B866", "accentColor": "#F0C96F", "backgroundColor": "#0A1222",
    "surfaceColor": "#111C31", "textColor": "#F3EAD8", "mutedTextColor": "#B8AE9A",
    "headingFont": "Space Grotesk", "bodyFont": "Inter", "monoFont": "JetBrains Mono",
    "chartColors": ["#E3B866", "#F6D995", "#B9852F", "#8FB3EA", "#EEBC6A", "#F3EAD8"],
    "springConfig": {"damping": 18, "stiffness": 70, "mass": 1}, "transitionDuration": 0.5,
    "captionHighlightColor": "#F0C96F", "captionBackgroundColor": "rgba(4, 8, 18, 0.72)",
}

SCENES = [  # une scène « modèle » d'OpenMontage par scène du script
    {"type": "hero_title", "text": "أبو بكر الصديق", "heroSubtitle": "عبد الله بن عثمان · رضي الله عنه"},
    {"type": "callout", "callout_type": "info", "title": "القرشي التيمي",
     "text": "عبد الله بن عثمان بن عامر بن عمرو بن كعب بن سعد بن تيم بن مرة"},
    {"type": "callout", "callout_type": "quote", "title": "ابن الجوزي · «كشف النقاب»", "text": "«لقبه عتيق»"},
    {"type": "callout", "callout_type": "quote", "title": "ابن أبي حاتم الرازي · «الجرح والتعديل»",
     "text": "«صاحب رسول الله ﷺ»"},
    {"type": "callout", "callout_type": "quote", "title": "ابن حجر العسقلاني · «تقريب التهذيب»",
     "text": "«صحابي، خليفة رسول الله ﷺ، وثاني اثنين في الغار»"},
    {"type": "stat_card", "stat": "358", "subtitle": "رواية في قاعدة ميلاغايبا · سكن المدينة · الطبقة الأولى"},
    {"type": "callout", "callout_type": "info", "title": "روى عنه",
     "text": "أنس بن مالك · عائشة · علي بن أبي طالب · أبو هريرة · قيس بن أبي حازم"},
    {"type": "kpi_grid", "title": "تُوفّي بالمدينة", "columns": 2,
     "chartData": [{"label": "سنة الوفاة (هـ)", "value": 13}, {"label": "سنة من العمر", "value": 63}]},
]
FIN = {"type": "hero_title", "text": "El Milaghaiba",
       "heroSubtitle": "Source : fiche transmetteur n° 4945 · hadith-kg (CC BY 4.0) — Contenu documentaire, pas un avis religieux."}


def narration() -> Path:
    sortie = PROJET / "assets/audio/narration.mp3"
    sortie.parent.mkdir(parents=True, exist_ok=True)
    cmd = [str(FFMPEG), "-y", "-loglevel", "error"]
    filtres, noms = [], []
    for i, s in enumerate(hf.scenes):
        cmd += ["-i", str(hf.TRAVAIL / f"audio/scene-{s['id']}.mp3")]
        ms = int(hf.voix_debut[i] * 1000)
        filtres.append(f"[{i}:a]adelay={ms}|{ms}[a{i}]")
        noms.append(f"[a{i}]")
    filtres.append(f"{''.join(noms)}amix=inputs={len(noms)}:normalize=0,apad=whole_dur={hf.TOTAL}[m]")
    cmd += ["-filter_complex", ";".join(filtres), "-map", "[m]", "-t", str(hf.TOTAL), "-b:a", "192k", str(sortie)]
    subprocess.run(cmd, check=True)
    return sortie


def sous_titres() -> list:
    """Les mêmes groupes de sous-titres français, découpés en mots (format WordCaption de Remotion)."""
    mots = []
    for i, s in enumerate(hf.scenes):
        groupes = s["sous_titres"]
        for j, (n, texte) in enumerate(groupes):
            debut = hf.voix_debut[i] + hf.mots[s["id"]][n]["debut"] - 0.1
            fin = (hf.voix_debut[i] + hf.mots[s["id"]][groupes[j + 1][0]]["debut"] - 0.12 if j + 1 < len(groupes)
                   else hf.voix_debut[i] + hf.mots[s["id"]][-1]["fin"] + 0.3)
            liste = texte.replace("ʿ", "‘").replace("ʾ", "’").split()
            poids = [len(m) + 2 for m in liste]
            t = debut
            for k, m in enumerate(liste):
                d = (fin - debut) * poids[k] / sum(poids)
                mots.append({"word": m, "startMs": round(t * 1000), "endMs": round((t + d) * 1000),
                             "pageBreakAfter": k == len(liste) - 1})
                t += d
    return mots


def main() -> None:
    audio = narration()
    coupes = []
    for i, (scene, (debut, duree)) in enumerate(zip(SCENES, hf.creneaux)):
        coupes.append({"id": f"s{i + 1}", "source": "", "in_seconds": debut, "out_seconds": round(debut + duree, 3), **scene})
    coupes.append({"id": "fin", "source": "", "in_seconds": hf.fin_debut, "out_seconds": hf.TOTAL, **FIN})
    props = {"renderer_family": "explainer-data", "themeConfig": THEME_NUIT_OR, "cuts": coupes,
             "overlays": [], "captions": sous_titres(),
             "audio": {"narration": {"src": str(audio).replace("\\", "/"), "volume": 1}}}
    (PROJET / "artifacts").mkdir(exist_ok=True)
    (PROJET / "artifacts/composition_props.json").write_text(json.dumps(props, ensure_ascii=False, indent=1), encoding="utf-8")
    apercu = {**props, "audio": {}}
    (PROJET / "artifacts/apercu_props.json").write_text(json.dumps(apercu, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{len(coupes)} scènes, {len(props['captions'])} mots de sous-titres, durée {hf.TOTAL} s")


if __name__ == "__main__":
    main()
