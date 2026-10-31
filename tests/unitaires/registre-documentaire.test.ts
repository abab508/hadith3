import { describe, it, expect } from "vitest";
import { noticeLocaleExacte } from "@/donnees/registre-rijal";

describe("registre documentaire", () => {
  it("ne devine pas un transmetteur depuis un nom court", () => {
    expect(noticeLocaleExacte("مالك")).toBeNull();
  });
  it("ne fabrique pas de fiche pour un nom absent", () => {
    expect(noticeLocaleExacte("شخص مجهول غير مسجل")).toBeNull();
  });
});
