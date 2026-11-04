"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Donne de la profondeur à la scène d'accueil : chaque plan bouge selon la souris
// (--px, --py entre -1 et 1, --cx/--cy en %) et le défilement (--defil entre 0 et 1).
// Rien ne bouge si le visiteur a réduit les animations (système ou réglage du site).
export default function SceneImmersive({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = ref.current;
    if (!scene) return;
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)");
    const actif = () => !reduit.matches && document.documentElement.dataset.motion !== "off";
    let cible = { x: 0, y: 0 };
    let courant = { x: 0, y: 0 };
    let image = 0;

    const dessiner = () => {
      image = 0;
      courant = { x: courant.x + (cible.x - courant.x) * 0.08, y: courant.y + (cible.y - courant.y) * 0.08 };
      scene.style.setProperty("--px", courant.x.toFixed(4));
      scene.style.setProperty("--py", courant.y.toFixed(4));
      if (Math.abs(cible.x - courant.x) > 0.001 || Math.abs(cible.y - courant.y) > 0.001) image = requestAnimationFrame(dessiner);
    };
    const relancer = () => { if (!image) image = requestAnimationFrame(dessiner); };

    const bouger = (e: PointerEvent) => {
      if (!actif()) return;
      const r = scene.getBoundingClientRect();
      if (e.clientY > r.bottom) return;
      cible = { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: ((e.clientY - r.top) / r.height) * 2 - 1 };
      scene.style.setProperty("--cx", `${((e.clientX - r.left) / r.width) * 100}%`);
      scene.style.setProperty("--cy", `${((e.clientY - r.top) / r.height) * 100}%`);
      relancer();
    };
    const defiler = () => {
      if (!actif()) return;
      const r = scene.getBoundingClientRect();
      scene.style.setProperty("--defil", Math.min(1, Math.max(0, -r.top / r.height)).toFixed(3));
    };

    window.addEventListener("pointermove", bouger, { passive: true });
    window.addEventListener("scroll", defiler, { passive: true });
    defiler();
    return () => {
      window.removeEventListener("pointermove", bouger);
      window.removeEventListener("scroll", defiler);
      cancelAnimationFrame(image);
    };
  }, []);

  return <div ref={ref} className={className}>{children}</div>;
}
