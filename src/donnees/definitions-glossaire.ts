/**
 * Définitions pédagogiques pour le glossaire public uniquement.
 * Elles expliquent le vocabulaire et ne classent aucun hadith du corpus.
 * Les données éditoriales / décisions de contrôle restent inchangées.
 */
export const definitionsGlossaire: Record<string, { fr: string; ar: string; en: string }> = {
  "sahih": {
    "fr": "Hadith dont la chaîne est continue, dont les transmetteurs sont fiables et précis, et dont le texte ne présente ni anomalie majeure ni défaut caché invalidant.",
    "ar": "حديث اتصل سنده برواة عدول ضابطين، وسلم من الشذوذ والعلة القادحة.",
    "en": "A hadith with an uninterrupted chain of upright, precise narrators, free from serious irregularities and hidden defects."
  },
  "hasan": {
    "fr": "Hadith recevable répondant aux conditions essentielles du hadith authentique, mais dont la précision d'au moins un transmetteur est légèrement moindre.",
    "ar": "حديث استوفى شروط القبول، مع ضبط أخف لبعض رواته مقارنة بالحديث الصحيح.",
    "en": "An acceptable hadith meeting the main conditions of authenticity, though one or more narrators have somewhat lesser precision."
  },
  "daif-hadith": {
    "fr": "Hadith qui ne remplit pas une ou plusieurs conditions du ṣaḥīḥ ou du ḥasan, par exemple en raison d'une rupture de chaîne ou d'un problème de transmission. Faible ne signifie pas nécessairement inventé.",
    "ar": "حديث لم يستوف شرطًا أو أكثر من شروط الصحيح أو الحسن، كوجود انقطاع في السند أو ضعف في الرواية، ولا يعني ذلك بالضرورة أنه موضوع.",
    "en": "A hadith lacking one or more requirements of sound or good transmission, such as a gap in its chain. Weak does not necessarily mean fabricated."
  },
  "mawdu": {
    "fr": "Récit fabriqué puis faussement attribué au Prophète. Il ne s'agit pas simplement d'un hadith dont la transmission est faible.",
    "ar": "خبر مختلق نُسب كذبًا إلى النبي ﷺ، وليس مجرد حديث ضعيف الإسناد.",
    "en": "A fabricated report falsely attributed to the Prophet, rather than merely a report with weak transmission."
  },
  "ghayr-muhaddad": {
    "fr": "Indique que l'application n'a pas établi de classement pour ce récit. Ce n'est pas une catégorie traditionnelle d'authenticité.",
    "ar": "يعني أن التطبيق لم يحدد حكمًا لهذه الرواية، وليس مرتبة اصطلاحية من مراتب صحة الحديث.",
    "en": "Indicates that the app has not established a classification for this report; it is not a traditional hadith grade."
  },
  "al-sanad": {
    "fr": "Suite des transmetteurs par lesquels le récit a été rapporté jusqu'à celui qui l'a consigné.",
    "ar": "سلسلة الرواة الذين نقلوا الخبر بعضهم عن بعض حتى وصل إلى من دوّنه.",
    "en": "The chain of narrators through whom a report was passed down to the compiler."
  },
  "al-riwaya": {
    "fr": "Transmission d'un récit par un narrateur, ou version précise de ce récit telle qu'elle a été rapportée.",
    "ar": "نقل الخبر عن راوٍ، أو صيغة معينة من الخبر كما رواها طريق من طرق النقل.",
    "en": "The transmission of a report, or a particular version of it passed on through a route."
  },
  "al-rawi": {
    "fr": "Personne qui reçoit puis transmet un hadith à d'autres.",
    "ar": "الشخص الذي يتلقى الحديث ثم يرويه وينقله إلى غيره.",
    "en": "A person who receives and passes on a hadith."
  },
  "ittisal-al-sanad": {
    "fr": "Continuité de la chaîne : chaque transmetteur a pu recevoir le récit de celui qui le précède selon les critères retenus.",
    "ar": "اتصال السند بحيث يثبت تلقي كل راوٍ عن شيخه وفق شروط أهل الحديث.",
    "en": "Continuity of the chain, with transmission between successive narrators established under the relevant criteria."
  },
  "munqati": {
    "fr": "Hadith dont la chaîne comporte une interruption ou un transmetteur manquant.",
    "ar": "حديث في سنده انقطاع أو سقوط راوٍ في موضع من مواضع الإسناد.",
    "en": "A hadith whose chain has a break or an omitted narrator."
  },
  "mursal": {
    "fr": "Récit qu'un Successeur (tābiʿī) attribue directement au Prophète sans citer le Compagnon intermédiaire.",
    "ar": "ما رفعه التابعي إلى النبي ﷺ من غير ذكر الصحابي الذي بينهما.",
    "en": "A report attributed directly to the Prophet by a Successor without naming the intermediary Companion."
  },
  "mudal": {
    "fr": "Hadith dont au moins deux transmetteurs successifs ont été omis d'un même endroit de la chaîne.",
    "ar": "حديث سقط من إسناده راويان متتاليان فأكثر من موضع واحد.",
    "en": "A hadith with two or more consecutive narrators omitted from a single point in the chain."
  },
  "muallaq": {
    "fr": "Hadith dont un ou plusieurs transmetteurs ont été omis au début de la chaîne, du côté de l'auteur qui le cite.",
    "ar": "حديث حُذف من أول سنده راوٍ أو أكثر من جهة المصنّف.",
    "en": "A report whose chain omits one or more narrators at its beginning, nearest the compiler."
  },
  "mudallas": {
    "fr": "Transmission dans laquelle un narrateur dissimule un élément de la chaîne ou la manière dont il a reçu le récit.",
    "ar": "رواية يخفي فيها الراوي أمرًا يتعلق بمن نقل عنه أو بكيفية تحمّله للخبر.",
    "en": "A transmission in which a narrator conceals an aspect of the chain or how the report was received."
  },
  "muttasil": {
    "fr": "Chaîne reliée sans rupture apparente entre ses transmetteurs, selon la forme de transmission étudiée.",
    "ar": "إسناد اتصل رواته بعضهم ببعض من غير انقطاع ظاهر.",
    "en": "A chain whose narrators are connected without an apparent break."
  },
  "marfu": {
    "fr": "Parole, acte, approbation ou description attribué au Prophète, quelle que soit par ailleurs l'évaluation de sa chaîne.",
    "ar": "ما أُضيف إلى النبي ﷺ من قول أو فعل أو تقرير أو صفة، بغض النظر عن درجة إسناده.",
    "en": "A statement, action, approval or description attributed to the Prophet, regardless of the chain's grade."
  },
  "mawquf": {
    "fr": "Parole ou acte attribué à un Compagnon, sans être présenté comme une parole du Prophète.",
    "ar": "ما أُضيف إلى الصحابي من قول أو فعل، ولم يُرفع إلى النبي ﷺ.",
    "en": "A statement or action attributed to a Companion rather than to the Prophet."
  },
  "maqtu": {
    "fr": "Parole ou acte attribué à un Successeur (tābiʿī) ou à une personne d'une génération ultérieure.",
    "ar": "ما أُضيف إلى التابعي أو من بعده من قول أو فعل.",
    "en": "A statement or action attributed to a Successor or a later figure."
  },
  "al-adala": {
    "fr": "Probité du transmetteur : intégrité et conduite permettant de considérer son témoignage religieux comme digne de confiance.",
    "ar": "استقامة الراوي ودينه ومروءته على نحو يجعله أهلًا لقبول روايته.",
    "en": "A narrator's upright character and integrity, which form part of assessing trustworthiness."
  },
  "al-dabt": {
    "fr": "Capacité d'un transmetteur à conserver et restituer fidèlement ce qu'il a entendu, de mémoire ou à partir de ses notes.",
    "ar": "إتقان الراوي لما يحفظه أو يكتبه، وقدرته على أدائه كما تلقاه.",
    "en": "A narrator's accuracy in retaining and faithfully conveying a report, from memory or written records."
  },
  "al-jarh": {
    "fr": "Critique qui signale chez un transmetteur un défaut susceptible d'affecter la fiabilité de ses récits.",
    "ar": "بيان ما في الراوي من سبب يقدح في عدالته أو ضبطه ويؤثر في قبول روايته.",
    "en": "An adverse assessment of a narrator identifying a flaw affecting reliability."
  },
  "al-tadil": {
    "fr": "Appréciation favorable portée sur la probité ou la précision d'un transmetteur.",
    "ar": "الحكم للراوي بالعدالة أو الضبط وما يدل على قبول روايته.",
    "en": "A favorable evaluation of a narrator's integrity or precision."
  },
  "ilm-al-rijal": {
    "fr": "Étude biographique des transmetteurs : identité, époque, maîtres, élèves et appréciations de leur fiabilité.",
    "ar": "علم يدرس أحوال رواة الحديث وتراجمهم وشيوخهم وتلاميذهم وتقييم رواياتهم.",
    "en": "The biographical study of hadith narrators, their lives, teachers, students and reliability."
  },
  "thiqa": {
    "fr": "Qualification positive d'un transmetteur jugé à la fois intègre et précis dans la transmission.",
    "ar": "وصف للراوي الذي اجتمعت فيه العدالة والضبط بحسب حكم الناقد.",
    "en": "A narrator graded trustworthy for both uprightness and accuracy."
  },
  "saduq": {
    "fr": "Transmetteur généralement reconnu sincère, dont la précision peut être inférieure à celle d'un transmetteur qualifié de thiqa.",
    "ar": "راوٍ عُرف بالصدق، وقد يكون ضبطه دون مرتبة الثقة بحسب اصطلاح الناقد.",
    "en": "A narrator regarded as truthful, though potentially less precise than one graded thiqa."
  },
  "daif-transmetteur": {
    "fr": "Transmetteur dont les récits inspirent des réserves en raison de problèmes de mémoire, de précision ou d'autres motifs de critique.",
    "ar": "راوٍ وُصفت روايته بالضعف لخلل في الحفظ أو الضبط أو لسبب نقدي آخر.",
    "en": "A narrator whose reports are considered weak because of poor accuracy, memory or another critical concern."
  },
  "majhul": {
    "fr": "Transmetteur dont l'identité ou la fiabilité est insuffisamment connue pour permettre une évaluation assurée.",
    "ar": "راوٍ لم تُعرف عينه أو حاله معرفة كافية للحكم على روايته.",
    "en": "A narrator whose identity or reliability is insufficiently known for a firm assessment."
  },
  "al-matn": {
    "fr": "Contenu ou texte du hadith, par opposition à la chaîne des personnes qui l'ont transmis.",
    "ar": "ألفاظ الحديث ومضمونه الذي ينتهي إليه الإسناد، مقابل سلسلة الرواة.",
    "en": "The wording and content of a hadith, distinct from its chain of transmission."
  },
  "al-shudhudh": {
    "fr": "Anomalie dans laquelle une version rapportée par un transmetteur fiable contredit une version transmise par des personnes plus fiables.",
    "ar": "مخالفة الراوي المقبول لمن هو أوثق منه في رواية الحديث.",
    "en": "An irregularity where a generally reliable narrator contradicts a stronger transmission."
  },
  "al-illa": {
    "fr": "Défaut subtil, parfois invisible au premier examen, susceptible de remettre en cause l'authenticité d'une transmission.",
    "ar": "سبب خفي يقدح في صحة الحديث مع أن ظاهره قد يبدو سليمًا.",
    "en": "A subtle hidden defect that can undermine a report even when it initially appears sound."
  },
  "ilal-al-hadith": {
    "fr": "Étude des défauts discrets révélés par l'examen des chaînes et la comparaison minutieuse des variantes d'un hadith.",
    "ar": "دراسة العلل الخفية في الأحاديث من خلال فحص الأسانيد ومقارنة الروايات.",
    "en": "The study of subtle hidden defects discovered through examining chains and comparing reports."
  },
  "al-muqarana-bayna-al-riwayat": {
    "fr": "Examen comparatif de plusieurs versions d'un même récit afin de repérer les différences de texte et de transmission.",
    "ar": "مقابلة طرق الحديث وألفاظه المختلفة لمعرفة مواضع الاتفاق والاختلاف.",
    "en": "Comparison of multiple versions of a report to identify differences in wording and transmission."
  },
  "ikhtilaf-al-riwayat": {
    "fr": "Différences observées entre les versions d'un même récit, dans leur texte, leur chaîne ou leurs détails.",
    "ar": "وجود اختلاف بين طرق الحديث في الألفاظ أو الأسانيد أو بعض التفاصيل.",
    "en": "Differences among versions of the same report in wording, chain or detail."
  },
  "al-itibar-wa-l-mutabaat-wa-l-shawahid": {
    "fr": "Recherche d'autres chaînes ou récits apparentés permettant de comparer les versions et parfois de renforcer une transmission.",
    "ar": "تتبع الطرق الأخرى والمتابعات والشواهد لمقارنة الروايات وقد يقوّي بعضها بعضًا وفق الشروط.",
    "en": "Tracing corroborating chains and related reports to compare versions and, in some cases, strengthen transmission."
  },
  "al-jarh-wa-l-tadil": {
    "fr": "Discipline qui étudie les appréciations favorables ou défavorables des transmetteurs pour évaluer la fiabilité de leurs récits.",
    "ar": "علم يبحث في أحوال الرواة جرحًا وتعديلًا لمعرفة مدى قبول رواياتهم.",
    "en": "The discipline of assessing narrators positively or negatively to evaluate the reliability of their reports."
  },
  "ilm-al-ilal": {
    "fr": "Branche de la critique du hadith consacrée aux défauts cachés qui ne se voient pas toujours dans une première lecture.",
    "ar": "علم يبحث في العلل الخفية التي قد تؤثر في صحة الحديث رغم سلامة ظاهره.",
    "en": "The branch of hadith criticism concerned with hidden defects not apparent on first inspection."
  },
  "ikhtilaf-al-ulama": {
    "fr": "Divergence entre savants dans l'analyse ou l'évaluation d'une narration, de sa chaîne ou de ses transmetteurs.",
    "ar": "اختلاف اجتهاد العلماء في دراسة رواية أو إسنادها أو رواتها أو حكمها.",
    "en": "Differences among scholars in assessing a narration, its chain or its narrators."
  },
  "hadith-sahih": {
    "fr": "Hadith classé authentique parce que sa chaîne est continue, ses transmetteurs fiables et précis, et qu'aucune anomalie ou défaut caché invalidant n'a été relevé.",
    "ar": "حديث حُكم بصحته لاتصال سنده وعدالة رواته وضبطهم وسلامته من الشذوذ والعلة القادحة.",
    "en": "A hadith graded sound due to a connected chain, reliable and precise narrators, and the absence of disqualifying irregularities or hidden defects."
  }
};

export function definitionGlossaire(id: string, locale: string) {
  const traduction = definitionsGlossaire[id];
  if (!traduction) return undefined;
  const langue = locale === "ar" ? "ar" : locale === "en" ? "en" : "fr";
  return { texte: traduction[langue], langue, direction: langue === "ar" ? "rtl" : "ltr" } as const;
}
