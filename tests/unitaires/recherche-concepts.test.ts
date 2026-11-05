import { describe, expect, it } from "vitest";
import { readIndex, searchIndex } from "@/donnees/index-leger";

describe("recherche par mots du quotidien absents des traductions", () => {
  it("« migraine » et « mal de tête » retrouvent des hadiths sur les maux de tête", async () => {
    const index = await readIndex("fra", "bukhari");
    expect(index).not.toBeNull();
    const migraine = searchIndex(index!, "migraine");
    expect(migraine.length).toBeGreaterThan(0);
    expect(searchIndex(index!, "mal de tête").length).toBeGreaterThan(0);
    expect(searchIndex(index!, "Migraine")).toEqual(migraine);
  });
  it("en arabe, « صداع » retrouve aussi « وجع الرأس »", async () => {
    const index = await readIndex("ara", "ibnmajah");
    expect(searchIndex(index!, "صداع").length).toBeGreaterThan(0);
  });
});
