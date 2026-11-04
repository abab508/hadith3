import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import TexteMixte, { decouperUrls } from "@/composants/TexteMixte";

// Exigence 02 : un rapport peut mêler arabe, français, références numériques et URL.
const arabe = "انظر المصدر https://sunnah.com/bukhari:1، الحديث رقم 1.";
const francais = "Voir https://example.org/hadith?id=2&page=13). Fin";

describe("textes mixtes avec adresses web", () => {
  it("isole l'URL sans la ponctuation arabe ou latine qui la suit", () => {
    expect(decouperUrls(arabe)).toEqual([
      { type: "texte", valeur: "انظر المصدر " },
      { type: "url", valeur: "https://sunnah.com/bukhari:1" },
      { type: "texte", valeur: "، الحديث رقم 1." },
    ]);
    expect(decouperUrls(francais).find((s) => s.type === "url")?.valeur).toBe("https://example.org/hadith?id=2&page=13");
  });

  it("ne change rien à un texte sans URL, ni à l'arabe (NFC conservé, jamais inversé)", () => {
    const texte = "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ";
    expect(decouperUrls(texte)).toEqual([{ type: "texte", valeur: texte }]);
    const html = renderToStaticMarkup(createElement(TexteMixte, { texte }));
    expect(html).toBe(texte);
  });

  it("rend l'URL dans un <bdi dir=\"ltr\">, entière, et le texte arabe autour à l'identique", () => {
    const html = renderToStaticMarkup(createElement(TexteMixte, { texte: arabe }));
    expect(html).toContain('<bdi dir="ltr" class="url-isolee"><a href="https://sunnah.com/bukhari:1"');
    expect(html).toContain(">https://sunnah.com/bukhari:1</a></bdi>");
    expect(html.startsWith("انظر المصدر ")).toBe(true);
    expect(html.endsWith("، الحديث رقم 1.")).toBe(true);
  });

  it("gère plusieurs URL et des chiffres dans le même texte", () => {
    const segments = decouperUrls("1) http://a.test/x et 2) https://b.test/y; fin 3");
    expect(segments.filter((s) => s.type === "url").map((s) => s.valeur)).toEqual(["http://a.test/x", "https://b.test/y"]);
    expect(segments.map((s) => s.valeur).join("")).toBe("1) http://a.test/x et 2) https://b.test/y; fin 3");
  });
});
