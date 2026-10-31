// Notices vérifiées à partir d'ouvrages biographiques accessibles en ligne.
// Reliées à une chaîne et à un identifiant précis : aucune déduction pour les autres hadiths.
// Ces citations documentent les appréciations attribuées aux critiques, sans certifier la chaîne entière.
export type RijalTexte = {fr:string;ar:string;en:string};
export type RijalSource = {book:string;locator:string;url:string};
export type RijalNotice = {classification:"compagnon"|"thiqa";qualification:RijalTexte;identity:RijalTexte;assessment:RijalTexte;critics:{name:string;statement:RijalTexte}[];source:RijalSource;otherSources?:RijalSource[]};
const notes:Record<string,Record<string,RijalNotice>> = {
  "bukhari-8": {
    "b8-6": {
      "classification": "compagnon",
      "qualification": {
        "fr": "Compagnon — probité présumée dans la méthode sunnite",
        "ar": "صحابي — عدالته مقررة في منهج المحدّثين من أهل السنّة",
        "en": "Companion — presumed upright within Sunni hadith methodology"
      },
      "identity": {
        "fr": "Abū Hurayra, célèbre Compagnon et transmetteur de nombreux hadiths. Son nom personnel a fait l'objet de diverses traditions biographiques.",
        "ar": "أبو هريرة من كبار رواة الحديث من الصحابة، وقد اختلف المؤرخون في اسمه الشخصي.",
        "en": "Abu Hurayra was a Companion known for narrating many hadiths. His personal name is reported differently in the biographical literature."
      },
      "assessment": {
        "fr": "Al-Dhahabī rapporte la règle sunnite selon laquelle les Compagnons sont tenus pour intègres dans la transmission. Cela ne dispense pas d'examiner les autres maillons du sanad.",
        "ar": "يذكر الذهبي القاعدة السنّية القائلة بعدالة الصحابة، ولا يغني ذلك عن دراسة بقية رجال الإسناد وعلله.",
        "en": "Al-Dhahabi states the Sunni principle of Companion uprightness; the remaining chain and possible defects still require study."
      },
      "critics": [
        {
          "name": "al-Dhahabī",
          "statement": {
            "fr": "Compagnon ; principe d'admissibilité selon la tradition sunnite.",
            "ar": "صحابي، وتُقبل عدالته وفق منهج أهل السنة.",
            "en": "Companion; uprightness accepted within the Sunni tradition."
          }
        }
      ],
      "source": {
        "book": "al-Dhahabī — Siyar Aʿlām al-Nubalāʾ",
        "locator": "Vol. 2, notice Abū Hurayra",
        "url": "https://www.islamweb.net/ar/library/content/60/264/أبو-هريرة"
      }
    },
    "b8-5": {
      "classification": "thiqa",
      "qualification": {
        "fr": "Fiable (thiqa) selon Aḥmad et Abū Ḥātim",
        "ar": "ثقة عند أحمد وأبي حاتم",
        "en": "Trustworthy (thiqa) according to Ahmad and Abu Hatim"
      },
      "identity": {
        "fr": "Abū Ṣāliḥ al-Sammān, nommé Dhakwān, savant médinois. Il a transmis directement d'Abū Hurayra ; ʿAbd Allāh ibn Dīnār figure parmi ceux qui ont rapporté de lui.",
        "ar": "أبو صالح السمّان، واسمه ذكوان، من علماء المدينة، لازم أبا هريرة وروى عنه، وروى عنه عبد الله بن دينار.",
        "en": "Abu Salih al-Samman (Dhakwan) was a Medinan transmitter who learned from Abu Hurayra; Abd Allah ibn Dinar transmitted from him."
      },
      "assessment": {
        "fr": "Aḥmad ibn Ḥanbal le qualifie de « thiqa, thiqa ». Abū Ḥātim le décrit comme digne de confiance et utilisable comme preuve.",
        "ar": "قال أحمد بن حنبل فيه ثقة ثقة، ووصفه أبو حاتم بأنه ثقة صالح الحديث يحتج بحديثه.",
        "en": "Ahmad ibn Hanbal called him thiqa twice; Abu Hatim considered his reports reliable evidence."
      },
      "critics": [
        {
          "name": "Aḥmad ibn Ḥanbal",
          "statement": {
            "fr": "Très fiable (thiqa, thiqa).",
            "ar": "ثقة ثقة.",
            "en": "Very trustworthy."
          }
        },
        {
          "name": "Abū Ḥātim al-Rāzī",
          "statement": {
            "fr": "Fiable, ses récits sont recevables.",
            "ar": "ثقة صالح الحديث يحتج بحديثه.",
            "en": "Reliable; his reports may serve as evidence."
          }
        }
      ],
      "source": {
        "book": "al-Dhahabī — Siyar Aʿlām al-Nubalāʾ",
        "locator": "Vol. 5, notice Abū Ṣāliḥ al-Sammān",
        "url": "https://www.islamweb.net/ar/library/content/60/709/أبو-صالح-السمان"
      }
    },
    "b8-4": {
      "classification": "thiqa",
      "qualification": {
        "fr": "Fiable (thiqa) selon plusieurs critiques",
        "ar": "ثقة عند عدد من النقّاد",
        "en": "Trustworthy according to several hadith critics"
      },
      "identity": {
        "fr": "ʿAbd Allāh ibn Dīnār al-ʿAdawī, transmetteur médinois et affranchi d'Ibn ʿUmar. Les notices citent Abū Ṣāliḥ al-Sammān parmi ses maîtres et Sulaymān ibn Bilāl parmi ses élèves.",
        "ar": "عبد الله بن دينار العدوي المدني، مولى ابن عمر؛ روى عن أبي صالح السمّان وروى عنه سليمان بن بلال.",
        "en": "Abd Allah ibn Dinar al-Adawi was a Medinan transmitter associated with Ibn Umar. His teachers included Abu Salih, and Sulayman ibn Bilal transmitted from him."
      },
      "assessment": {
        "fr": "Dans Tahdhīb al-Kamāl, Aḥmad le qualifie de fiable et régulier ; Ibn Maʿīn, Abū Zurʿa, Abū Ḥātim et al-Nasāʾī le classent également thiqa.",
        "ar": "نقل المزي عن أحمد قوله ثقة مستقيم الحديث، وعن ابن معين وأبي زرعة وأبي حاتم والنسائي توثيقه.",
        "en": "Al-Mizzi records Ahmad's assessment of him as reliable and consistent; Ibn Ma'in, Abu Zur'a, Abu Hatim and al-Nasa'i also graded him thiqa."
      },
      "critics": [
        {
          "name": "Aḥmad ibn Ḥanbal",
          "statement": {
            "fr": "Fiable, régulier dans le hadith.",
            "ar": "ثقة مستقيم الحديث.",
            "en": "Trustworthy and consistent in transmission."
          }
        },
        {
          "name": "Yaḥyā ibn Maʿīn, Abū Zurʿa, Abū Ḥātim, al-Nasāʾī",
          "statement": {
            "fr": "Fiable (thiqa).",
            "ar": "ثقة.",
            "en": "Trustworthy."
          }
        }
      ],
      "source": {
        "book": "al-Mizzī — Tahdhīb al-Kamāl",
        "locator": "Vol. 14, p. 472–473",
        "url": "https://www.islamweb.net/ar/library/content/1001/3523/عبد-الله-بن-دينار-القرشي-العدوي"
      }
    },
    "b8-3": {
      "classification": "thiqa",
      "qualification": {
        "fr": "Fiable (thiqa) selon Ibn Maʿīn et al-Nasāʾī",
        "ar": "ثقة عند ابن معين والنسائي",
        "en": "Trustworthy according to Ibn Ma'in and al-Nasa'i"
      },
      "identity": {
        "fr": "Sulaymān ibn Bilāl, transmetteur médinois connu pour ses nombreuses narrations. Il reçut de ʿAbd Allāh ibn Dīnār et transmit notamment à Abū ʿĀmir al-ʿAqadī.",
        "ar": "سليمان بن بلال المدني، روى عن عبد الله بن دينار، وروى عنه أبو عامر العقدي وغيرهما.",
        "en": "Sulayman ibn Bilal was a Medinan transmitter who learned from Abd Allah ibn Dinar and whose students included Abu Amir al-Aqadi."
      },
      "assessment": {
        "fr": "Al-Mizzī rapporte l'appréciation « thiqa » d'Ibn Maʿīn et d'al-Nasāʾī. Ibn Saʿd le décrit comme fiable et transmettant beaucoup de hadiths.",
        "ar": "نقل المزي توثيق ابن معين والنسائي له، ووصفه ابن سعد بأنه ثقة كثير الحديث.",
        "en": "Al-Mizzi records Ibn Ma'in's and al-Nasa'i's trustworthiness assessments; Ibn Sa'd calls him trustworthy and prolific."
      },
      "critics": [
        {
          "name": "Yaḥyā ibn Maʿīn",
          "statement": {
            "fr": "Fiable (thiqa).",
            "ar": "ثقة صالح.",
            "en": "Trustworthy."
          }
        },
        {
          "name": "Muḥammad ibn Saʿd",
          "statement": {
            "fr": "Fiable, abondant en hadiths.",
            "ar": "ثقة كثير الحديث.",
            "en": "Trustworthy and prolific."
          }
        }
      ],
      "source": {
        "book": "al-Mizzī — Tahdhīb al-Kamāl",
        "locator": "Vol. 11, p. 374–375",
        "url": "https://www.islamweb.net/ar/library/content/1001/2692/سليمان-بن-بلال-القرشي"
      }
    },
    "b8-2": {
      "classification": "thiqa",
      "qualification": {
        "fr": "Fiable selon Ibn Maʿīn et al-Nasāʾī ; ṣadūq selon Abū Ḥātim",
        "ar": "ثقة عند ابن معين والنسائي، وصدوق عند أبي حاتم",
        "en": "Trustworthy according to Ibn Ma'in and al-Nasa'i; saduq according to Abu Hatim"
      },
      "identity": {
        "fr": "Abū ʿĀmir al-ʿAqadī est le surnom de ʿAbd al-Malik ibn ʿAmr al-Qaysī, transmetteur de Sulaymān ibn Bilāl.",
        "ar": "أبو عامر العقدي هو عبد الملك بن عمرو القيسي، وروى عن سليمان بن بلال.",
        "en": "Abu Amir al-Aqadi is Abd al-Malik ibn Amr al-Qaysi, a transmitter from Sulayman ibn Bilal."
      },
      "assessment": {
        "fr": "Tahdhīb al-Kamāl conserve des appréciations distinctes : Ibn Maʿīn dit thiqa, al-Nasāʾī « thiqa maʾmūn », et Abū Ḥātim « ṣadūq ». Elles sont présentées séparément plutôt que comme une note inventée.",
        "ar": "ذكر المزي أقوالًا مختلفة: ابن معين ثقة، والنسائي ثقة مأمون، وأبو حاتم صدوق؛ وتُعرض الأقوال دون اختزالها في درجة مخترعة.",
        "en": "Al-Mizzi records distinct judgments: Ibn Ma'in thiqa, al-Nasa'i thiqa ma'mun, and Abu Hatim saduq. They should not be collapsed into a fabricated score."
      },
      "critics": [
        {
          "name": "Yaḥyā ibn Maʿīn",
          "statement": {
            "fr": "Fiable (thiqa).",
            "ar": "ثقة.",
            "en": "Trustworthy."
          }
        },
        {
          "name": "al-Nasāʾī",
          "statement": {
            "fr": "Fiable et digne de confiance.",
            "ar": "ثقة مأمون.",
            "en": "Trustworthy and dependable."
          }
        },
        {
          "name": "Abū Ḥātim al-Rāzī",
          "statement": {
            "fr": "Sincère (ṣadūq).",
            "ar": "صدوق.",
            "en": "Truthful (saduq)."
          }
        }
      ],
      "source": {
        "book": "al-Mizzī — Tahdhīb al-Kamāl",
        "locator": "Vol. 18, p. 367–369",
        "url": "https://www.islamweb.net/ar/library/content/1001/4532/عبد-الملك-بن-عمرو-القيسي-أبو-عامر-العقدي"
      }
    },
    "b8-1": {
      "classification": "thiqa",
      "qualification": {
        "fr": "Fiable, mémorisateur (thiqa ḥāfiẓ) selon Ibn Ḥajar",
        "ar": "ثقة حافظ عند ابن حجر",
        "en": "Trustworthy memorizer (thiqa hafiz) according to Ibn Hajar"
      },
      "identity": {
        "fr": "ʿAbd Allāh ibn Muḥammad al-Juʿfī, appelé al-Musnadī (m. 229 H), maître d'al-Bukhārī et transmetteur d'Abū ʿĀmir al-ʿAqadī.",
        "ar": "عبد الله بن محمد الجعفي المعروف بالمسندي (ت 229 هـ)، من شيوخ البخاري، روى عن أبي عامر العقدي.",
        "en": "Abd Allah ibn Muhammad al-Ju'fi, known as al-Musnadi (d. 229 AH), was a teacher of al-Bukhari and narrated from Abu Amir."
      },
      "assessment": {
        "fr": "Ibn Ḥajar le décrit « thiqa ḥāfiẓ » dans Taqrīb al-Tahdhīb. La notice d'al-Mizzī confirme son identité et ses transmissions.",
        "ar": "قال ابن حجر في تقريب التهذيب: ثقة حافظ. وتذكر ترجمة المزي هويته وشيوخه وروايته.",
        "en": "Ibn Hajar grades him thiqa hafiz in Taqrib al-Tahdhib; al-Mizzi's entry corroborates his identity and teacher relationships."
      },
      "critics": [
        {
          "name": "Ibn Ḥajar al-ʿAsqalānī",
          "statement": {
            "fr": "Fiable, mémorisateur.",
            "ar": "ثقة حافظ.",
            "en": "Trustworthy, hadith memorizer."
          }
        }
      ],
      "source": {
        "book": "al-Mizzī — Tahdhīb al-Kamāl",
        "locator": "Vol. 16, notice al-Musnadī",
        "url": "https://www.islamweb.net/ar/library/content/1001/3831/عبد-الله-بن-محمد-بن-عبد-الله-أبو-جعفر-البخاري-المسندي"
      },
      "otherSources": [
        {
          "book": "Ibn Ḥajar — Taqrīb al-Tahdhīb",
          "locator": "Notice 3610, via hadith.dev",
          "url": "https://hadith.dev/narrator/3902"
        }
      ]
    }
  }
};
export function noticeRijal(hadithId:string,transmetteurId:string):RijalNotice|undefined{return notes[hadithId]?.[transmetteurId];}
export function traduireNotice(texte:RijalTexte,locale:string){const lang=locale==="ar"?"ar":locale==="fr"?"fr":"en";return {text:texte[lang],lang,dir:lang==="ar"?"rtl" as const:"ltr" as const};}
export function referenceHadithRijal(hadithId:string){return hadithId==="bukhari-8"?{numeroExterne:"9",numeroCorpus:"8",url:"https://sunnah.com/bukhari:9",ouvrage:"Ṣaḥīḥ al-Bukhārī"}:undefined;}
