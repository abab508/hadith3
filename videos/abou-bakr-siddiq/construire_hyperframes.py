"""Construit le projet HyperFrames (exemple 1) à partir de scenes.json et de la voix.

Usage : python construire_hyperframes.py
Écrit HORS du dépôt, dans le dossier de travail TRAVAIL (par défaut ~/videos-milaghaiba/<nom du dossier>) :
  hyperframes/index.html, hyperframes/compositions/*.html, les réglages HyperFrames,
  les polices (copiées depuis public/polices du site) et l'audio (copié depuis TRAVAIL/audio).
Tout est déterministe (aucun hasard non fixé) : même entrée, même vidéo.
"""
import json
import os
import random
import shutil
from pathlib import Path
from string import Template

ICI = Path(__file__).parent
RACINE = ICI.parents[1]  # racine du dépôt (pour public/polices)
# Les fichiers fabriqués (MP3, projet HyperFrames, MP4) restent hors du dépôt.
TRAVAIL = Path(os.environ.get("MILAGHAIBA_VIDEOS", Path.home() / "videos-milaghaiba")) / ICI.name
PROJET = TRAVAIL / "hyperframes"
COMPOS = PROJET / "compositions"
FICHIERS_POLICES = {"ArefRuqaa": ["aref-ruqaa-arabic-400", "aref-ruqaa-arabic-700"],
           "NotoNaskhArabic": ["noto-naskh-arabic-arabic-400-normal", "noto-naskh-arabic-arabic-700-normal"],
           "Alegreya": ["alegreya-latin-400-normal", "alegreya-latin-ext-400-normal", "alegreya-latin-500-normal",
                        "alegreya-latin-ext-500-normal", "alegreya-latin-400-italic", "alegreya-latin-ext-400-italic"],
           "Cinzel": ["cinzel-latin-700-normal", "cinzel-latin-ext-700-normal"]}
REGLAGES = {  # fichiers de projet créés par « hyperframes init », version figée
    "package.json": {"name": "hyperframes", "private": True, "type": "module", "scripts": {
        "dev": "npx --yes hyperframes@0.9.19 preview", "check": "npx --yes hyperframes@0.9.19 check",
        "render": "npx --yes hyperframes@0.9.19 render", "publish": "npx --yes hyperframes@0.9.19 publish"}},
    "hyperframes.json": {"$schema": "https://hyperframes.heygen.com/schema/hyperframes.json",
                         "registry": "https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry",
                         "paths": {"blocks": "compositions", "components": "compositions/components", "assets": "assets"},
                         "media": {"autoProxy": True}},
    "meta.json": {"id": "hyperframes", "name": "hyperframes", "createdAt": "2026-11-06T10:00:50.582Z"},
}
L, H = 1080, 1920

AVANCE, ECART, AVANT = 0.3, 0.4, 0.25   # début de la voix, silence entre phrases, avance de l'image
CARTE_FIN = 4.6

donnees = json.loads((ICI / "scenes.json").read_text(encoding="utf-8"))
durees = {int(k): v for k, v in json.loads((ICI / "audio/durees.json").read_text()).items()}
mots = {int(k): v for k, v in json.loads((ICI / "audio/mots.json").read_text(encoding="utf-8")).items()}
scenes = donnees["scenes"]

# ---------- minutage global ----------
voix_debut = []
t = AVANCE
for s in scenes:
    voix_debut.append(round(t, 3))
    t += mots[s["id"]][-1]["fin"] + ECART
fin_voix = voix_debut[-1] + mots[scenes[-1]["id"]][-1]["fin"]
creneaux = []
for i, s in enumerate(scenes):
    debut = 0.0 if i == 0 else voix_debut[i] - AVANT
    fin = voix_debut[i + 1] - AVANT if i + 1 < len(scenes) else fin_voix + 0.7
    creneaux.append((round(debut, 3), round(fin - debut, 3)))
fin_debut = round(creneaux[-1][0] + creneaux[-1][1], 3)
TOTAL = round(fin_debut + CARTE_FIN, 3)


def mot(i: int, n: int) -> float:
    """Heure locale (dans le créneau de la scène i) où commence le mot n."""
    decalage = voix_debut[i] - creneaux[i][0]
    return round(decalage + mots[scenes[i]["id"]][n]["debut"], 3)


def chiffres_arabes(n) -> str:
    return str(n).translate(str.maketrans("0123456789", "٠١٢٣٤٥٦٧٨٩"))


# ---------- styles communs ----------
POLICES = """
@font-face{font-family:"Aref Ruqaa";src:url("assets/fonts/aref-ruqaa-arabic-400.woff2") format("woff2");font-weight:400}
@font-face{font-family:"Aref Ruqaa";src:url("assets/fonts/aref-ruqaa-arabic-700.woff2") format("woff2");font-weight:700}
@font-face{font-family:"Noto Naskh Arabic";src:url("assets/fonts/noto-naskh-arabic-arabic-400-normal.woff2") format("woff2");font-weight:400}
@font-face{font-family:"Noto Naskh Arabic";src:url("assets/fonts/noto-naskh-arabic-arabic-700-normal.woff2") format("woff2");font-weight:700}
@font-face{font-family:"Alegreya";src:url("assets/fonts/alegreya-latin-400-normal.woff2") format("woff2");font-weight:400;unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2212,U+FEFF,U+FFFD}
@font-face{font-family:"Alegreya";src:url("assets/fonts/alegreya-latin-ext-400-normal.woff2") format("woff2");font-weight:400;unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1E00-1E9F,U+1EF2-1EFF,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Alegreya";src:url("assets/fonts/alegreya-latin-500-normal.woff2") format("woff2");font-weight:500;unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2212,U+FEFF,U+FFFD}
@font-face{font-family:"Alegreya";src:url("assets/fonts/alegreya-latin-ext-500-normal.woff2") format("woff2");font-weight:500;unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1E00-1E9F,U+1EF2-1EFF,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Alegreya";src:url("assets/fonts/alegreya-latin-400-italic.woff2") format("woff2");font-weight:400;font-style:italic;unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+2000-206F}
@font-face{font-family:"Alegreya";src:url("assets/fonts/alegreya-latin-ext-400-italic.woff2") format("woff2");font-weight:400;font-style:italic;unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1E00-1E9F}
@font-face{font-family:"Cinzel";src:url("assets/fonts/cinzel-latin-700-normal.woff2") format("woff2");font-weight:700}
"""

COMMUN = POLICES + """
#root{position:absolute;inset:0;overflow:hidden}
.plein{position:absolute;inset:0}
.ligne{position:absolute;inset-inline:60px;text-align:center;direction:rtl}
.ruqaa{font-family:"Aref Ruqaa",serif}
.naskh{font-family:"Noto Naskh Arabic",serif}
.or{background:linear-gradient(180deg,#fff1c7 0%,#f0c96f 42%,#b9852f 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.creme{color:#f3ead8}
.discret{color:#b8ae9a}
.lueur{filter:drop-shadow(0 0 22px rgba(227,184,102,.45))}
"""

SCENE_MODELE = Template("""<template>
  <style>$styles</style>
  <div id="root" data-composition-id="$id" data-width="1080" data-height="1920" data-layout-allow-overlap>
    <div id="$id-scene" class="plein">
$corps
    </div>
  </div>
  <script>
    const tl = gsap.timeline({ paused: true });
    tl.fromTo("#$id-scene", { opacity: $opacite_depart }, { opacity: 1, duration: 0.35, ease: "power2.out" }, 0);
$anim
    tl.to("#$id-scene", { opacity: 0, duration: 0.3, ease: "power2.in" }, $sortie);
    window.__timelines["$id"] = tl;
  </script>
</template>
""")


def scene_html(sid: str, corps: str, anim: str, duree: float, styles: str = "", premiere: bool = False) -> str:
    return SCENE_MODELE.substitute(id=sid, corps=corps, anim=anim, styles=COMMUN + styles,
                                   sortie=round(duree - 0.33, 3), opacite_depart=1 if premiere else 0)


def apparition(sel: str, t: float, dy: int = 24, duree: float = 0.6) -> str:
    return (f'    tl.fromTo("{sel}", {{ opacity: 0, y: {dy} }}, '
            f'{{ opacity: 1, y: 0, duration: {duree}, ease: "power3.out" }}, {t});\n')


def trace(sel: str, t: float, duree: float = 1.2) -> str:
    return (f'    tl.fromTo("{sel}", {{ strokeDashoffset: 1 }}, '
            f'{{ strokeDashoffset: 0, duration: {duree}, ease: "power2.inOut" }}, {t});\n')


ETOILE8 = """<g fill="none" stroke="#e3b866" stroke-width="{w}" stroke-linejoin="round">
<rect x="{a}" y="{a}" width="{c}" height="{c}" pathLength="1" stroke-dasharray="1" {cls1}/>
<rect x="{a}" y="{a}" width="{c}" height="{c}" transform="rotate(45 {m} {m})" pathLength="1" stroke-dasharray="1" {cls2}/>
</g>"""


def etoile8(taille: int, w: float = 3, id1: str = "", id2: str = "") -> str:
    m = taille / 2
    c = taille * 0.64
    return ETOILE8.format(a=round(m - c / 2, 1), c=round(c, 1), m=m, w=w,
                          cls1=f'id="{id1}"' if id1 else "", cls2=f'id="{id2}"' if id2 else "")


# ---------- les scènes ----------
def s_nom(i, s, d):
    sid = f"s{s['id']}"
    corps = f"""
      <svg id="{sid}-etoile" width="720" height="720" viewBox="0 0 720 720" style="position:absolute;inset-inline-start:180px;top:330px">
        {etoile8(720, 3, sid + '-c1', sid + '-c2')}
        <circle cx="360" cy="360" r="214" fill="none" stroke="#e3b866" stroke-width="1.5" opacity=".55" pathLength="1" stroke-dasharray="1" id="{sid}-cercle"/>
      </svg>
      <div id="{sid}-nasab" class="ligne naskh creme" style="top:200px;font-size:60px;font-weight:700">عبدُ الله بنُ عثمان</div>
      <div id="{sid}-halo" data-layout-ignore style="position:absolute;inset-inline-start:140px;top:560px;width:800px;height:240px;border-radius:50%;background:radial-gradient(closest-side,rgba(240,201,111,.55),rgba(240,201,111,0));opacity:.35"></div>
      <div class="ligne lueur" style="top:560px"><div id="{sid}-nom" class="ruqaa or" style="font-size:158px;font-weight:700;line-height:1.4">أبو بكر الصديق</div></div>
      <div id="{sid}-rda" class="ligne ruqaa or" style="top:1075px;font-size:62px">رضي الله عنه</div>"""
    anim = trace(f"#{sid}-c1", 0, 1.6) + trace(f"#{sid}-c2", 0.25, 1.6) + trace(f"#{sid}-cercle", 0.6, 1.4)
    anim += f'    tl.fromTo("#{sid}-etoile", {{ rotation: 0 }}, {{ rotation: 22.5, duration: {d}, ease: "none", transformOrigin: "50% 50%" }}, 0);\n'
    anim += apparition(f"#{sid}-nasab", mot(i, 1))
    anim += f'    tl.fromTo("#{sid}-nom", {{ scale: 1 }}, {{ scale: 1.07, duration: 0.5, ease: "power2.out", yoyo: true, repeat: 1 }}, {mot(i, 5)});\n'
    anim += f'    tl.fromTo("#{sid}-halo", {{ opacity: .35 }}, {{ opacity: .9, duration: 0.6, ease: "sine.inOut", yoyo: true, repeat: 1 }}, {mot(i, 5)});\n'
    anim += apparition(f"#{sid}-rda", mot(i, 8))
    return scene_html(sid, corps, anim, d, premiere=(i == 0))


def s_nasab(i, s, d):
    sid = f"s{s['id']}"
    noms = [("عبدُ الله", 0), ("عثمان", 3), ("عامر", 5), ("عمرو", 7), ("كعب", 9), ("سعد", 11), ("تيم", 13), ("مُرّة", 15)]
    pas, haut0 = 98, 230
    corps = f"""
      <svg width="1080" height="1000" viewBox="0 0 1080 1000" style="position:absolute;inset-inline-start:0;top:0">
        <line id="{sid}-fil" x1="830" y1="{haut0 + 36}" x2="830" y2="{haut0 + 36 + pas * 7}" stroke="#e3b866" stroke-width="3" pathLength="1" stroke-dasharray="1" opacity=".8"/>
      </svg>"""
    anim = trace(f"#{sid}-fil", mot(i, 0), mots[s['id']][15]['debut'] + 0.4)
    for k, (nom, n) in enumerate(noms):
        y = haut0 + k * pas
        prefixe = "" if k == 0 else '<span class="discret" style="font-size:40px;font-weight:400">بنُ </span>'
        corps += f"""
      <svg id="{sid}-pt{k}" width="40" height="40" viewBox="0 0 40 40" style="position:absolute;inset-inline-start:810px;top:{y + 16}px">{etoile8(40, 2.5)}</svg>
      <div id="{sid}-n{k}" class="naskh creme" style="position:absolute;inset-inline-start:300px;inset-inline-end:60px;top:{y}px;text-align:start;direction:rtl;font-size:56px;font-weight:700">{prefixe}{nom}</div>"""
        anim += apparition(f"#{sid}-pt{k}", mot(i, n), 0, 0.3)
        anim += (f'    tl.fromTo("#{sid}-n{k}", {{ opacity: 0, x: -40 }}, '
                 f'{{ opacity: 1, x: 0, duration: 0.45, ease: "power3.out" }}, {mot(i, n)});\n')
    corps += f"""
      <div id="{sid}-tribu" class="ligne ruqaa or lueur" style="top:1030px;font-size:72px;font-weight:700">القُرَشيّ · التَّيْميّ</div>"""
    anim += apparition(f"#{sid}-tribu", mot(i, 16))
    return scene_html(sid, corps, anim, d)


def cadre_livre(sid: str, haut: int, hauteur: int) -> str:
    return f"""
      <svg width="940" height="{hauteur}" viewBox="0 0 940 {hauteur}" style="position:absolute;inset-inline-start:70px;top:{haut}px;overflow:visible" data-layout-allow-overflow>
        <rect id="{sid}-cadre1" x="6" y="6" width="928" height="{hauteur - 12}" rx="34" fill="rgba(10,18,34,.72)" stroke="#e3b866" stroke-width="3" pathLength="1" stroke-dasharray="1"/>
        <rect id="{sid}-cadre2" x="22" y="22" width="896" height="{hauteur - 44}" rx="24" fill="none" stroke="#e3b866" stroke-width="1.2" opacity=".6" pathLength="1" stroke-dasharray="1"/>
        <g transform="translate(450 -14)">{etoile8(40, 2.5)}</g>
        <g transform="translate(450 {hauteur - 26})">{etoile8(40, 2.5)}</g>
      </svg>"""


def s_citation(i, s, d):
    sid = f"s{s['id']}"
    n_cit = {3: 6, 4: 8}[s["id"]]
    taille = 96 if len(s["citation"]) < 12 else 80
    corps = cadre_livre(sid, 330, 700) + f"""
      <div id="{sid}-livre" class="ligne ruqaa or lueur" style="top:400px;font-size:84px;font-weight:700">«{s['livre']}»</div>
      <div id="{sid}-auteur" class="ligne naskh discret" style="top:530px;font-size:48px">{s['auteur']}</div>
      <svg id="{sid}-sep" width="500" height="40" viewBox="0 0 500 40" style="position:absolute;inset-inline-start:290px;top:625px">
        <line x1="0" y1="20" x2="225" y2="20" stroke="#e3b866" stroke-width="1.5"/><line x1="275" y1="20" x2="500" y2="20" stroke="#e3b866" stroke-width="1.5"/>
        <g transform="translate(232 2) scale(.9)">{etoile8(40, 2.5)}</g>
      </svg>
      <div id="{sid}-citation" class="ligne naskh creme" style="top:705px;font-size:{taille}px;font-weight:700;line-height:1.5">«{s['citation']}»</div>"""
    anim = trace(f"#{sid}-cadre1", 0, 1.1) + trace(f"#{sid}-cadre2", 0.15, 1.1)
    anim += apparition(f"#{sid}-livre", mot(i, 3 if s["id"] == 3 else 4))
    anim += apparition(f"#{sid}-auteur", mot(i, 1))
    anim += apparition(f"#{sid}-sep", mot(i, n_cit) - 0.3, 0, 0.4)
    anim += (f'    tl.fromTo("#{sid}-citation", {{ opacity: 0, scale: .92 }}, '
             f'{{ opacity: 1, scale: 1, duration: 0.7, ease: "power3.out" }}, {mot(i, n_cit)});\n')
    return scene_html(sid, corps, anim, d)


def s_grotte(i, s, d):
    sid = f"s{s['id']}"
    corps = f"""
      <div id="{sid}-ref" class="ligne naskh discret" style="top:215px;font-size:44px">ابن حجر العسقلاني · «تقريب التهذيب»</div>
      <div id="{sid}-p1" class="ligne naskh creme" style="top:300px;font-size:76px;font-weight:700">صحابيّ</div>
      <div id="{sid}-p2" class="ligne naskh creme" style="top:405px;font-size:76px;font-weight:700">خليفةُ رسولِ الله ﷺ</div>
      <div class="ligne lueur" style="top:520px"><div id="{sid}-p3" class="ruqaa or" style="font-size:108px;font-weight:700;line-height:1.4">وثاني اثنين في الغار</div></div>
      <svg width="1080" height="910" viewBox="0 0 1080 910" style="position:absolute;inset-inline-start:0;top:700px" data-layout-allow-overflow>
        <defs><radialGradient id="{sid}-gl" cx="50%" cy="60%" r="50%"><stop offset="0" stop-color="#f6d995" stop-opacity=".95"/><stop offset="1" stop-color="#e3b866" stop-opacity="0"/></radialGradient></defs>
        <g id="{sid}-lune" transform="translate(860 70)"><circle r="44" fill="#f3e2b4"/><circle cx="18" cy="-10" r="40" fill="#0b1426"/></g>
        <path d="M0 910 L0 300 L140 230 L260 270 L380 170 L470 215 L560 120 L680 205 L790 160 L920 245 L1080 200 L1080 910 Z" fill="#0d1830" opacity=".9"/>
        <path d="M0 910 L0 360 L120 320 L250 350 L360 280 L470 330 L540 250 L640 315 L760 290 L880 345 L1080 310 L1080 910 Z" fill="#060c18" stroke="#e3b866" stroke-width="2" stroke-opacity=".55"/>
        <ellipse id="{sid}-feu" cx="540" cy="425" rx="78" ry="74" fill="url(#{sid}-gl)" opacity=".25"/>
        <path d="M478 470 L478 415 Q478 345 540 345 Q602 345 602 415 L602 470 Z" fill="#02040a" stroke="#e3b866" stroke-width="2" stroke-opacity=".7"/>
      </svg>"""
    anim = apparition(f"#{sid}-ref", 0.15, 12)
    anim += apparition(f"#{sid}-p1", mot(i, 6))
    anim += apparition(f"#{sid}-p2", mot(i, 7))
    anim += (f'    tl.fromTo("#{sid}-p3", {{ opacity: 0, scale: .9 }}, '
             f'{{ opacity: 1, scale: 1, duration: 0.8, ease: "power3.out" }}, {mot(i, 14)});\n')
    anim += f'    tl.fromTo("#{sid}-feu", {{ opacity: .25 }}, {{ opacity: 1, duration: 0.9, ease: "sine.inOut" }}, {mot(i, 17)});\n'
    anim += f'    tl.fromTo("#{sid}-lune", {{ y: 10 }}, {{ y: -6, duration: {d}, ease: "none" }}, 0);\n'
    return scene_html(sid, corps, anim, d)


def palmier(x: int, y: int, h: int) -> str:
    feuilles = "".join(
        f'<path d="M{x} {y - h} q{dx * 0.5} {-28 + abs(dx) * 0.1} {dx} {18 + abs(dx) * 0.25}" stroke="#060c18" stroke-width="9" fill="none" stroke-linecap="round"/>'
        for dx in (-70, -45, -20, 25, 50, 75))
    return f'<path d="M{x - 5} {y} Q{x + 8} {y - h / 2} {x} {y - h}" stroke="#060c18" stroke-width="11" fill="none"/>{feuilles}'


def s_medine(i, s, d):
    sid = f"s{s['id']}"
    maisons = "".join(f'<rect x="{x}" y="{270 - h}" width="{w}" height="{h}" fill="#060c18" stroke="#e3b866" stroke-opacity=".35" stroke-width="1.5"/>'
                      for x, w, h in ((40, 120, 70), (175, 90, 95), (300, 140, 60), (610, 110, 85), (740, 150, 65), (905, 120, 90)))
    corps = f"""
      <div class="ligne" style="top:210px"><span id="{sid}-tabaqa" class="naskh or" style="display:inline-block;font-size:48px;font-weight:700;padding:6px 40px;border:2px solid #e3b866;border-radius:60px">الطبقة الأولى</span></div>
      <div class="ligne lueur" style="top:320px"><div id="{sid}-ville" class="ruqaa or" style="font-size:160px;font-weight:700;line-height:1.4">المدينة</div></div>
      <div id="{sid}-compteur" class="ligne naskh creme" style="top:560px;font-size:190px;font-weight:700;line-height:1.3">٠</div>
      <div id="{sid}-label" class="ligne naskh discret" style="top:815px;font-size:46px">رواية في قاعدة «ميلاغايبا»</div>
      <svg width="1080" height="710" viewBox="0 0 1080 710" style="position:absolute;inset-inline-start:0;top:900px" data-layout-allow-overflow>
        <path d="M0 710 L0 150 Q180 60 380 95 Q560 40 760 85 Q930 55 1080 120 L1080 710 Z" fill="#0d1830" stroke="#e3b866" stroke-width="1.5" stroke-opacity=".45"/>
        <rect x="0" y="268" width="1080" height="442" fill="#060c18"/>
        {maisons}{palmier(470, 270, 170)}{palmier(560, 270, 135)}{palmier(1000, 190, 120)}
      </svg>"""
    anim = apparition(f"#{sid}-tabaqa", mot(i, 1), 16)
    anim += apparition(f"#{sid}-ville", mot(i, 4))
    anim += apparition(f"#{sid}-compteur", mot(i, 9) - 0.2, 0, 0.3)
    fin_compte = round(mot(i, 12) - mot(i, 9) + 0.2, 3)
    anim += ("    const compte = { v: 0 };\n"
             f'    tl.fromTo(compte, {{ v: 0 }}, {{ v: 358, duration: {fin_compte}, ease: "power2.out", onUpdate: () => {{\n'
             f'      document.querySelector("#{sid}-compteur").textContent = String(Math.round(compte.v)).replace(/[0-9]/g, (c) => "٠١٢٣٤٥٦٧٨٩"[c]);\n'
             f'    }} }}, {mot(i, 9)});\n')
    anim += apparition(f"#{sid}-label", mot(i, 8))
    return scene_html(sid, corps, anim, d)


def s_eleves(i, s, d):
    sid = f"s{s['id']}"
    cx, cy = 540, 700
    points = [(540, 330), (856, 585), (736, 990), (344, 990), (224, 585)]
    reperes = [2, 5, 6, 10, 12]
    lignes, noeuds, anim = "", "", ""
    for k, ((x, y), nom) in enumerate(zip(points, s["noms"])):
        lignes += f'<line id="{sid}-l{k}" x1="{cx}" y1="{cy}" x2="{x}" y2="{y}" stroke="#e3b866" stroke-width="2" opacity=".7" pathLength="1" stroke-dasharray="1"/>'
        noeuds += f"""
      <svg id="{sid}-e{k}" width="56" height="56" viewBox="0 0 56 56" style="position:absolute;inset-inline-start:{x - 28}px;top:{y - 28}px">{etoile8(56, 3)}<circle cx="28" cy="28" r="7" fill="#f6d995"/></svg>
      <div id="{sid}-t{k}" class="naskh creme" style="position:absolute;inset-inline-end:{x - 200}px;width:400px;top:{y + 30}px;text-align:center;direction:rtl;font-size:46px;font-weight:700">{nom}</div>"""
        t = mot(i, reperes[k])
        anim += trace(f"#{sid}-l{k}", t - 0.25, 0.5)
        anim += (f'    tl.fromTo("#{sid}-e{k}", {{ opacity: 0, scale: .3 }}, '
                 f'{{ opacity: 1, scale: 1, duration: 0.45, ease: "back.out(2)" }}, {t});\n')
        anim += apparition(f"#{sid}-t{k}", t + 0.05, 14, 0.45)
    corps = f"""
      <div id="{sid}-titre" class="ligne ruqaa or lueur" style="top:190px;font-size:76px;font-weight:700">روى عنه</div>
      <svg width="1080" height="1200" viewBox="0 0 1080 1200" style="position:absolute;inset-inline-start:0;top:0">{lignes}
        <circle cx="{cx}" cy="{cy}" r="150" fill="rgba(10,18,34,.85)" stroke="#e3b866" stroke-width="3"/>
        <circle cx="{cx}" cy="{cy}" r="136" fill="none" stroke="#e3b866" stroke-width="1" opacity=".6"/>
      </svg>
      <div id="{sid}-centre" class="ruqaa or" style="position:absolute;inset-inline-end:390px;width:300px;top:{cy - 95}px;text-align:center;direction:rtl;font-size:72px;font-weight:700;line-height:1.25">أبو بكر الصديق</div>{noeuds}"""
    anim = apparition(f"#{sid}-titre", mot(i, 0), 14) + anim
    return scene_html(sid, corps, anim, d)


def s_deces(i, s, d):
    sid = f"s{s['id']}"
    corps = f"""
      <div class="ligne lueur" style="top:220px"><div id="{sid}-titre" class="ruqaa or" style="font-size:118px;font-weight:700;line-height:1.4">تُوُفِّيَ بالمدينة</div></div>
      <div id="{sid}-annee" class="ligne naskh creme" style="top:450px;font-size:180px;font-weight:700;line-height:1.3">{chiffres_arabes(13)} هـ</div>
      <div id="{sid}-annee-l" class="ligne naskh discret" style="top:690px;font-size:46px">سنة الوفاة</div>
      <svg id="{sid}-sep" width="500" height="40" viewBox="0 0 500 40" style="position:absolute;inset-inline-start:290px;top:770px">
        <line x1="0" y1="20" x2="225" y2="20" stroke="#e3b866" stroke-width="1.5"/><line x1="275" y1="20" x2="500" y2="20" stroke="#e3b866" stroke-width="1.5"/>
        <g transform="translate(232 2) scale(.9)">{etoile8(40, 2.5)}</g>
      </svg>
      <div id="{sid}-age" class="ligne naskh creme" style="top:810px;font-size:180px;font-weight:700;line-height:1.3">{chiffres_arabes(63)}</div>
      <div id="{sid}-age-l" class="ligne naskh discret" style="top:1050px;font-size:46px">سنةً من العمر</div>"""
    anim = apparition(f"#{sid}-titre", mot(i, 0))
    anim += apparition(f"#{sid}-annee", mot(i, 3)) + apparition(f"#{sid}-annee-l", mot(i, 3) + 0.2, 10)
    anim += apparition(f"#{sid}-sep", mot(i, 6), 0, 0.4)
    anim += apparition(f"#{sid}-age", mot(i, 7)) + apparition(f"#{sid}-age-l", mot(i, 7) + 0.2, 10)
    return scene_html(sid, corps, anim, d)


def s_fin(d):
    sid = "fin"
    corps = f"""
      <svg id="{sid}-etoile" width="110" height="110" viewBox="0 0 110 110" style="position:absolute;inset-inline-start:485px;top:300px">{etoile8(110, 3, sid + '-c1', sid + '-c2')}</svg>
      <div class="ligne lueur" style="top:420px"><div id="{sid}-nom" class="ruqaa or" style="font-size:150px;font-weight:700;line-height:1.4">ميلاغايبا</div></div>
      <div id="{sid}-latin" style="position:absolute;inset-inline:60px;top:650px;text-align:center;font-family:Cinzel,serif;font-weight:700;font-size:58px;letter-spacing:.12em;color:#e3b866">EL MILAGHAIBA</div>
      <div id="{sid}-sources" style="position:absolute;inset-inline:90px;top:790px;text-align:center;font-family:Alegreya,serif;font-size:36px;line-height:1.5;color:#f3ead8">
        Source : fiche transmetteur n° 4945<br>Données hadith-kg (CC BY 4.0)<br>Taqrîb at-Tahdhîb · al-Jarh wa at-Ta‘dîl · Kashf an-Niqâb
      </div>
      <div id="{sid}-avis" style="position:absolute;inset-inline:90px;top:1080px;text-align:center;font-family:Alegreya,serif;font-style:italic;font-size:34px;color:#b8ae9a">Contenu documentaire, pas un avis religieux.</div>"""
    anim = trace(f"#{sid}-c1", 0, 0.9) + trace(f"#{sid}-c2", 0.1, 0.9)
    anim += apparition(f"#{sid}-nom", 0.1) + apparition(f"#{sid}-latin", 0.2, 14)
    anim += apparition(f"#{sid}-sources", 0.3, 14, 0.4) + apparition(f"#{sid}-avis", 0.4, 10, 0.4)
    # la carte de fin reste affichée jusqu'à la dernière image (pas de fondu de sortie)
    html = SCENE_MODELE.substitute(id=sid, corps=corps, anim=anim, styles=COMMUN, sortie=d + 5, opacite_depart=0)
    return html


TYPES = {"nom": s_nom, "nasab": s_nasab, "citation": s_citation, "grotte": s_grotte,
         "medine": s_medine, "eleves": s_eleves, "deces": s_deces}


# ---------- sous-titres ----------
def sous_titres() -> str:
    groupes, anim = "", ""
    liste = []
    for i, s in enumerate(scenes):
        for j, (n, texte) in enumerate(s["sous_titres"]):
            debut = voix_debut[i] + mots[s["id"]][n]["debut"] - 0.1
            if j + 1 < len(s["sous_titres"]):
                fin = voix_debut[i] + mots[s["id"]][s["sous_titres"][j + 1][0]]["debut"] - 0.12
            else:
                fin = voix_debut[i] + mots[s["id"]][-1]["fin"] + 0.3
            liste.append((max(debut, 0.15), fin, texte))
    for k, (debut, fin, texte) in enumerate(liste):
        if k + 1 < len(liste):
            fin = min(fin, liste[k + 1][0] - 0.05)
        debut, fin = round(debut, 3), round(fin, 3)
        texte = texte.replace("ʿ", "‘").replace("ʾ", "’")  # la police n'a pas ʿ ni ʾ
        groupes += f'\n      <div id="st-{k}" class="groupe"><span class="bande">{texte}</span></div>'
        anim += (f'    tl.fromTo("#st-{k}", {{ opacity: 0, y: 14 }}, {{ opacity: 1, y: 0, duration: 0.2, ease: "power2.out" }}, {debut});\n'
                 f'    tl.to("#st-{k}", {{ opacity: 0, duration: 0.12, ease: "power2.in" }}, {round(fin - 0.12, 3)});\n'
                 f'    tl.set("#st-{k}", {{ opacity: 0, visibility: "hidden" }}, {fin});\n')
    styles = POLICES + """
#root{position:absolute;inset:0}
.groupe{position:absolute;inset-inline:0;top:1170px;padding:0 90px;text-align:center;opacity:0;overflow:visible}
.bande{display:inline;font-family:"Alegreya","Noto Naskh Arabic",serif;font-weight:500;font-size:48px;line-height:1.45;color:#f3ead8;
background:rgba(4,8,18,.62);padding:4px 18px;border-radius:12px;-webkit-box-decoration-break:clone;box-decoration-break:clone}
"""
    return f"""<template>
  <style>{styles}</style>
  <div id="root" data-composition-id="soustitres" data-width="1080" data-height="1920" data-layout-allow-caption-zone>{groupes}
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
{anim}    window.__timelines["soustitres"] = tl;
  </script>
</template>
"""


# ---------- fond et racine ----------
def racine() -> str:
    hasard = random.Random(4945)
    etoiles = ["", "", ""]
    for k in range(96):
        x, y, r = hasard.uniform(20, 1060), hasard.uniform(20, 1550), hasard.choice((1.2, 1.6, 2.2, 2.8))
        etoiles[k % 3] += f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r}" fill="#f6e7c0"/>'
    poussiere = "".join(
        f'<circle id="pou-{k}" cx="{hasard.uniform(60, 1020):.0f}" cy="{hasard.uniform(900, 1900):.0f}" r="{hasard.uniform(1.5, 3.5):.1f}" fill="#f0c96f" opacity=".55"/>'
        for k in range(26))
    # arcades en fer à cheval (touche maghrébine) en bas de l'écran
    ouvertures = "".join(
        f"M{x0 + 30} 1920 L{x0 + 30} 1745 A84 84 0 1 1 {x0 + 186} 1745 L{x0 + 186} 1920 Z "
        for x0 in range(0, 1080, 216))
    arcades = f'<path d="M0 1610 L1080 1610 L1080 1920 L0 1920 Z {ouvertures}" fill="#03060d" fill-rule="evenodd" stroke="#e3b866" stroke-opacity=".5" stroke-width="2"/>'
    motif = """<pattern id="zellige" width="180" height="180" patternUnits="userSpaceOnUse">
  <g fill="none" stroke="#e3b866" stroke-width="1.6">
    <rect x="32" y="32" width="116" height="116"/>
    <rect x="32" y="32" width="116" height="116" transform="rotate(45 90 90)"/>
    <circle cx="90" cy="90" r="26"/>
    <path d="M0 0 L32 32 M180 0 L148 32 M180 180 L148 148 M0 180 L32 148 M90 0 L90 8 M180 90 L172 90 M90 180 L90 172 M0 90 L8 90"/>
  </g></pattern>"""
    hotes = ""
    for i, s in enumerate(scenes):
        debut, duree = creneaux[i]
        hotes += f"""
      <div id="s{s['id']}" data-composition-id="s{s['id']}" data-composition-src="compositions/s{s['id']}.html" data-start="{debut}" data-duration="{duree}" data-track-index="{2 + i % 2}" data-track-kind="graphics" data-width="1080" data-height="1920" style="z-index:5"></div>"""
    hotes += f"""
      <div id="fin" data-composition-id="fin" data-composition-src="compositions/fin.html" data-start="{fin_debut}" data-duration="{CARTE_FIN}" data-track-index="2" data-track-kind="graphics" data-width="1080" data-height="1920" style="z-index:5"></div>
      <div id="soustitres" data-composition-id="soustitres" data-composition-src="compositions/soustitres.html" data-start="0" data-duration="{TOTAL}" data-track-index="4" data-track-kind="captions" data-width="1080" data-height="1920" style="z-index:8"></div>"""
    audios = "".join(f"""
      <audio id="voix-{s['id']}" class="clip" data-start="{voix_debut[i]}" data-duration="{durees[s['id']]}" data-track-index="{10 + i % 2}" data-volume="1" src="assets/audio/scene-{s['id']}.mp3"></audio>"""
                     for i, s in enumerate(scenes))
    scintille = "".join(
        f'      tl.fromTo("#etoiles-{g}", {{ opacity: 1 }}, {{ opacity: .3, duration: {1.4 + g * 0.5}, ease: "sine.inOut", yoyo: true, repeat: {int(TOTAL / (1.4 + g * 0.5))} }}, {g * 0.6});\n'
        for g in range(3))
    montee = "".join(
        f'      tl.fromTo("#pou-{k}", {{ y: 0, opacity: .0 }}, {{ y: -{360 + (k * 37) % 300}, opacity: .6, duration: {TOTAL}, ease: "none" }}, 0);\n'
        for k in range(26))
    trajet = [(300, 500), (800, 700), (260, 1100), (760, 420), (540, 900)]
    lueur = "".join(
        f'      tl.to("#lueur-c", {{ attr: {{ cx: {x}, cy: {y} }}, duration: {round(TOTAL / len(trajet) - 0.05, 2)}, ease: "sine.inOut" }}, {round(k * TOTAL / len(trajet), 2)});\n'
        for k, (x, y) in enumerate(trajet))
    return f"""<!doctype html>
<html lang="ar" dir="ltr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <title>{donnees['titre']} — El Milaghaiba</title>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ width: 1080px; height: 1920px; overflow: hidden; background: #050a14; }}
      #fond {{ position: absolute; inset: 0; background: radial-gradient(120% 75% at 50% 32%, #16264a 0%, #0a1222 48%, #03060d 100%); }}
      #ciel, #motif, #arcades, #vignette, #cadre {{ position: absolute; inset-inline-start: 0; top: 0; width: 1080px; height: 1920px; }}
      #vignette {{ background: radial-gradient(90% 70% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,.55) 100%); }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="1080" data-height="1920">
      <div id="fond"></div>
      <svg id="motif" viewBox="0 0 1080 1920" data-layout-allow-overflow>
        <defs>{motif}
          <radialGradient id="lueur-g"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
          <mask id="lueur-m"><circle id="lueur-c" cx="540" cy="700" r="520" fill="url(#lueur-g)"/></mask>
        </defs>
        <g id="motif-base" opacity=".08"><rect x="0" y="0" width="1080" height="2300" fill="url(#zellige)"/></g>
        <g mask="url(#lueur-m)"><g id="motif-lumiere" opacity=".3"><rect x="0" y="0" width="1080" height="2300" fill="url(#zellige)"/></g></g>
      </svg>
      <svg id="ciel" viewBox="0 0 1080 1920">
        <g id="etoiles-0">{etoiles[0]}</g><g id="etoiles-1">{etoiles[1]}</g><g id="etoiles-2">{etoiles[2]}</g>
        {poussiere}
      </svg>
      <svg id="arcades" viewBox="0 0 1080 1920">{arcades}</svg>
      <div id="vignette"></div>
      <svg id="cadre" viewBox="0 0 1080 1920">
        <rect x="26" y="26" width="1028" height="1868" rx="30" fill="none" stroke="#e3b866" stroke-width="2.5" opacity=".75"/>
        <rect x="40" y="40" width="1000" height="1840" rx="22" fill="none" stroke="#e3b866" stroke-width="1" opacity=".45"/>
      </svg>{hotes}{audios}
    </div>
    <script>
      const tl = gsap.timeline({{ paused: true }});
      tl.fromTo("#motif-base", {{ y: 0 }}, {{ y: -180, duration: {TOTAL}, ease: "none" }}, 0);
      tl.fromTo("#motif-lumiere", {{ y: 0 }}, {{ y: -180, duration: {TOTAL}, ease: "none" }}, 0);
{scintille}{montee}{lueur}      window.__timelines = window.__timelines || {{}};
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
"""


def main() -> None:
    COMPOS.mkdir(parents=True, exist_ok=True)
    (PROJET / "assets/audio").mkdir(parents=True, exist_ok=True)
    (PROJET / "assets/fonts").mkdir(parents=True, exist_ok=True)
    for nom, contenu in REGLAGES.items():
        (PROJET / nom).write_text(json.dumps(contenu, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for dossier, fichiers in FICHIERS_POLICES.items():
        for f in fichiers:
            shutil.copy(RACINE / f"public/polices/{dossier}/{f}.woff2", PROJET / f"assets/fonts/{f}.woff2")
    for s in scenes:
        shutil.copy(TRAVAIL / f"audio/scene-{s['id']}.mp3", PROJET / f"assets/audio/scene-{s['id']}.mp3")
    for i, s in enumerate(scenes):
        html = TYPES[s["type"]](i, s, creneaux[i][1])
        (COMPOS / f"s{s['id']}.html").write_text(html, encoding="utf-8")
    (COMPOS / "fin.html").write_text(s_fin(CARTE_FIN), encoding="utf-8")
    (COMPOS / "soustitres.html").write_text(sous_titres(), encoding="utf-8")
    (PROJET / "index.html").write_text(racine(), encoding="utf-8")
    print(f"projet écrit dans {PROJET}")
    print(f"durée totale : {TOTAL} s")
    for i, s in enumerate(scenes):
        print(f"  scène {s['id']} : {creneaux[i][0]} s → {round(creneaux[i][0] + creneaux[i][1], 2)} s")
    print(f"  carte de fin : {fin_debut} s → {TOTAL} s")


if __name__ == "__main__":
    main()
