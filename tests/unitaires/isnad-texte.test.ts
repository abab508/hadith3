import { describe, expect, it } from "vitest";
import { extraireChaine, sansVoyelles } from "@/donnees/isnad-texte";

// Débuts réels de textes de l'édition hadith-api (ara-bukhari n° 1, 2, 13).
const bukhari1 = "حَدَّثَنَا الْحُمَيْدِيُّ عَبْدُ اللَّهِ بْنُ الزُّبَيْرِ ، قَالَ : حَدَّثَنَا سُفْيَانُ ، قَالَ : حَدَّثَنَا يَحْيَى بْنُ سَعِيدٍ الْأَنْصَارِيُّ ، قَالَ : أَخْبَرَنِي مُحَمَّدُ بْنُ إِبْرَاهِيمَ التَّيْمِيُّ ، أَنَّهُ سَمِعَ عَلْقَمَةَ بْنَ وَقَّاصٍ اللَّيْثِيَّ ، يَقُولُ : سَمِعْتُ عُمَرَ بْنَ الْخَطَّابِ رَضِيَ اللَّهُ عَنْهُ عَلَى الْمِنْبَرِ ، قَالَ : سَمِعْتُ رَسُولَ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ يَقُولُ : إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ";
const bukhari2 = "حَدَّثَنَا عَبْدُ اللَّهِ بْنُ يُوسُفَ، قَالَ أَخْبَرَنَا مَالِكٌ، عَنْ هِشَامِ بْنِ عُرْوَةَ، عَنْ أَبِيهِ، عَنْ عَائِشَةَ أُمِّ الْمُؤْمِنِينَ ـ رضى الله عنها ـ أَنَّ الْحَارِثَ بْنَ هِشَامٍ ـ رضى الله عنه ـ سَأَلَ رَسُولَ اللَّهِ صلى الله عليه وسلم";
const bukhari13 = "حَدَّثَنَا مُسَدَّدٌ، قَالَ حَدَّثَنَا يَحْيَى، عَنْ شُعْبَةَ، عَنْ قَتَادَةَ، عَنْ أَنَسٍ ـ رضى الله عنه ـ عَنِ النَّبِيِّ صلى الله عليه وسلم‏.‏ وَعَنْ حُسَيْنٍ الْمُعَلِّمِ";

describe("découpage automatique de la chaîne écrite dans le texte arabe", () => {
  it("retrouve les maillons de Ṣaḥīḥ al-Bukhārī n° 1, du compilateur au Compagnon", () => {
    const c = extraireChaine(bukhari1);
    expect(c.jusquAuProphete).toBe(true);
    expect(c.maillons).toEqual([
      "الحميدي عبد الله بن الزبير",
      "سفيان",
      "يحيى بن سعيد الأنصاري",
      "محمد بن إبراهيم التيمي",
      "علقمة بن وقاص الليثي",
      "عمر بن الخطاب",
    ]);
  });

  it("retire les formules de respect et s'arrête au Prophète ﷺ (n° 2 et 13)", () => {
    expect(extraireChaine(bukhari2).maillons).toEqual(["عبد الله بن يوسف", "مالك", "هشام بن عروة", "أبيه", "عائشة أم المؤمنين", "الحارث بن هشام"]);
    const c13 = extraireChaine(bukhari13);
    expect(c13.maillons).toEqual(["مسدد", "يحيى", "شعبة", "قتادة", "أنس"]);
    expect(c13.maillons).not.toContain("حسين المعلم");
  });

  it("s'arrête quand le texte passe au récit, plutôt que de prendre une phrase pour un nom (n° 53)", () => {
    const bukhari53 = "حَدَّثَنَا عَلِيُّ بْنُ الْجَعْدِ، قَالَ أَخْبَرَنَا شُعْبَةُ، عَنْ أَبِي جَمْرَةَ، قَالَ كُنْتُ أَقْعُدُ مَعَ ابْنِ عَبَّاسٍ، يُجْلِسُنِي عَلَى سَرِيرِهِ فَقَالَ أَقِمْ عِنْدِي حَتَّى أَجْعَلَ لَكَ سَهْمًا مِنْ مَالِي، فَأَقَمْتُ مَعَهُ شَهْرَيْنِ، ثُمَّ قَالَ إِنَّ وَفْدَ عَبْدِ الْقَيْسِ لَمَّا أَتَوُا النَّبِيَّ صلى الله عليه وسلم";
    const c = extraireChaine(bukhari53);
    expect(c.maillons).toEqual(["علي بن الجعد", "شعبة", "أبي جمرة"]);
    expect(c.jusquAuProphete).toBe(false);
  });

  it("ne fabrique rien sans formule de transmission ni mention du Prophète", () => {
    const c = extraireChaine("إنما الأعمال بالنيات");
    expect(c.jusquAuProphete).toBe(false);
    expect(c.maillons.length).toBeLessThanOrEqual(1);
    expect(sansVoyelles("حَدَّثَنَا")).toBe("حدثنا");
  });
});
