/**
 * Dossier de rijāl ciblé sur Ṣaḥīḥ al-Bukhārī 79.
 * Chaque nom est identifié d'après ʿUmdat al-Qārī, commentaire du n° 79 :
 * https://www.islamarchive.cc/hadith/173411
 * Ces avis portent sur les personnes, non sur l'authenticité de toute la voie.
 * Les maîtres et élèves listés sont des EXEMPLES, jamais un inventaire complet.
 */
export type TraductionRijal={fr:string;ar:string;en:string};
export type CritiqueRijal={auteur:string;appreciation:TraductionRijal;ouvrage:string;url?:string};
export type NoticeRijalExterne={
 verdict:"thiqa"|"compagnon"|"divergent";
 nomCompletAr:string;nomLatin:string;
 qualification:TraductionRijal;bio:TraductionRijal;
 critique:string;reference:string;referenceUrl:string;
 maitres:string[];eleves:string[];jugements:CritiqueRijal[];
};
const src={
 musa:"https://ar.wikisource.org/wiki/أبي_موسى_الأشعري",
 burda:"https://islamweb.net/ar/library/content/60/570/أبو-بردة",
 burayd:"https://ar.wikisource.org/wiki/سير_أعلام_النبلاء/بريد_بن_عبد_الله",
 hammad:"https://islamweb.net/ar/library/content/60/1519/أبو-أسامة",
 kurayb:"https://www.islamweb.net/ar/library/content/60/2047/أبو-كريب",
 taqribBurda:"https://sunna.alifta.gov.sa/BookToc/ViewServicePage?bookId=51&mainId=525144",
 tahdhibBurayd:"https://sunna.alifta.gov.sa/BookToc/ViewServicePage?bookId=52&mainId=532701"
};
const cite=(auteur:string,fr:string,ar:string,en:string,ouvrage:string,url:string):CritiqueRijal=>({auteur,appreciation:{fr,ar,en},ouvrage,url});
const fiches:Record<string,NoticeRijalExterne>={
 "ابي موسي":{
  verdict:"compagnon",nomCompletAr:"أبو موسى الأشعري — عبد الله بن قيس",nomLatin:"Abū Mūsā al-Ashʿarī (ʿAbd Allāh ibn Qays)",
  qualification:{fr:"Compagnon du Prophète ﷺ (probité admise dans la méthode sunnite).",ar:"صحابي، عدالته مقررة في منهج أهل السنّة.",en:"Companion of the Prophet, presumed upright in Sunni hadith methodology."},
  bio:{fr:"ʿAbd Allāh ibn Qays al-Ashʿarī fut Compagnon, récitant du Coran et enseignant. Il exerça des responsabilités à Bassora et à Koufa. Ici, son fils Abū Burda transmet son récit.",ar:"عبد الله بن قيس الأشعري صحابي قارئ فقيه تولى مناصب في البصرة والكوفة. نقل عنه ابنه أبو بردة.",en:"A Companion, Qurʾan reciter and teacher who served in Basra and Kufa. His son Abu Burda narrates from him here."},
  critique:"al-Dhahabī",reference:"Siyar Aʿlām al-Nubalāʾ, notice Abū Mūsā al-Ashʿarī",referenceUrl:src.musa,
  maitres:["Le Prophète ﷺ"],eleves:["Abū Burda (son fils)","Anas ibn Mālik","Ṭāriq ibn Shihāb"],
  jugements:[cite("al-Dhahabī","Grand Compagnon, lecteur du Coran et savant.","صحابي جليل قارئ وفقيه.","An eminent Companion, Qur'an reciter and scholar.","Siyar Aʿlām al-Nubalāʾ — Abū Mūsā",src.musa)]
 },
 "ابي بردة":{
  verdict:"thiqa",nomCompletAr:"أبو بردة بن أبي موسى الأشعري",nomLatin:"Abū Burda ibn Abī Mūsā al-Ashʿarī",
  qualification:{fr:"Fiable : juriste qualifié de thabt par al-Dhahabī ; thiqa chez Ibn Ḥajar.",ar:"الفقيه الثبت، وثقه ابن حجر.",en:"Dependable jurist (thabt); rated thiqa by Ibn Hajar."},
  bio:{fr:"Fils d’Abū Mūsā, juriste et juge à Koufa. Les sources divergent sur son prénom personnel (ʿĀmir ou al-Ḥārith). Dans ce sanad, son petit-fils Burayd transmet de lui.",ar:"ابن أبي موسى، فقيه وقاضي الكوفة. اختلف في اسمه فقيل عامر أو الحارث. روى عنه حفيده بريد.",en:"Son of Abu Musa, a jurist and judge in Kufa. His personal name is reported as ʿAmir or al-Harith. His grandson Burayd narrated from him."},
  critique:"al-Dhahabī et Ibn Ḥajar",reference:"Siyar Aʿlām al-Nubalāʾ, vol. 4 ; Taqrīb al-Tahdhīb, n° 8009",referenceUrl:src.burda,
  maitres:["Abū Mūsā al-Ashʿarī","ʿĀʾisha","ʿAlī ibn Abī Ṭālib"],
  eleves:["Burayd ibn ʿAbd Allāh (petit-fils)","Saʿīd ibn Abī Burda","Qatāda"],
  jugements:[
   cite("al-Dhahabī","Juriste solide dans la transmission (thabt).","الفقيه الثبت.","Dependable jurist.","Siyar Aʿlām al-Nubalāʾ — Abū Burda",src.burda),
   cite("Ibn Ḥajar","Fiable (thiqa).","ثقة من الثالثة.","Trustworthy (thiqa).","Taqrīb al-Tahdhīb, n° 8009",src.taqribBurda)
  ]
 },
 "بريد بن عبد الله":{
  verdict:"divergent",nomCompletAr:"بريد بن عبد الله بن أبي بردة الأشعري",nomLatin:"Burayd ibn ʿAbd Allāh ibn Abī Burda",
  qualification:{fr:"Jugements divergents : fiable pour Ibn Maʿīn et al-ʿIjlī ; réserves chez Abū Ḥātim et al-Nasāʾī.",ar:"مختلف فيه: وثقه ابن معين والعجلي، وتحفظ أبو حاتم والنسائي.",en:"Disputed: trustworthy per Ibn Maʿin and al-ʿIjli; reservations from Abu Hatim and al-Nasaʾi."},
  bio:{fr:"Traditionniste de Koufa et petit-fils d’Abū Burda, dont il rapporte. Ḥammād ibn Usāma (Abū Usāma) compte parmi ses élèves. Les critiques divergent sur sa précision.",ar:"راوٍ كوفي حفيد أبي بردة، روى عن جده، وروى عنه أبو أسامة. اختلف النقاد في ضبطه.",en:"Kufan transmitter and grandson of Abu Burda, whom he narrated from. Abu Usama was among his students. Critics disagreed on his accuracy."},
  critique:"Ibn Maʿīn ; al-ʿIjlī ; Abū Ḥātim ; al-Nasāʾī",reference:"Siyar Aʿlām al-Nubalāʾ, notice Burayd ; Ikmāl Tahdhīb al-Kamāl, vol. 2, p. 371",referenceUrl:src.burayd,
  maitres:["Abū Burda (grand-père)","al-Ḥasan al-Baṣrī","ʿAṭāʾ ibn Abī Rabāḥ"],
  eleves:["Ḥammād ibn Usāma (Abū Usāma)","Sufyān al-Thawrī","Ibn al-Mubārak"],
  jugements:[
   cite("Ibn Maʿīn et al-ʿIjlī","Le jugent thiqa (fiable).","ثقة.","Trustworthy (thiqa).","Siyar Aʿlām al-Nubalāʾ — Burayd",src.burayd),
   cite("Abū Ḥātim","Pas pleinement solide : ses récits peuvent être consignés.","ليس بالمتين، يكتب حديثه.","Not sufficiently firm; reports can be recorded with caution.","Siyar Aʿlām al-Nubalāʾ — Burayd",src.burayd),
   cite("al-Nasāʾī","« Pas très fort » dans une notice ; une autre transmission rapporte « pas de mal ».","ليس بذاك القوي، وورد أيضًا: ليس به بأس.","One source reports 'not very strong', another 'no harm in him'.","Ikmāl Tahdhīb al-Kamāl, vol. 2, p. 371",src.tahdhibBurayd)
  ]
 },
 "حماد بن اسامة":{
  verdict:"thiqa",nomCompletAr:"حماد بن أسامة بن زيد — أبو أسامة",nomLatin:"Ḥammād ibn Usāma (Abū Usāma)",
  qualification:{fr:"Fiable et précis (thiqa, thabt) selon Aḥmad ibn Ḥanbal et Ibn Maʿīn.",ar:"ثقة ثبت عند أحمد وابن معين.",en:"Trustworthy and accurate (thiqa, thabt) per Ahmad and Ibn Maʿin."},
  bio:{fr:"Mémorisateur du hadith à Koufa, surnommé Abū Usāma. Il transmet de Burayd et d’autres maîtres ; al-Dhahabī situe sa mort en 201 H.",ar:"الحافظ أبو أسامة الكوفي، روى عن بريد وغيره، وتوفي سنة 201 هـ.",en:"Kufan hadith memorizer known as Abu Usama. He narrated from Burayd and others, and died in 201 AH."},
  critique:"Aḥmad ibn Ḥanbal et Ibn Maʿīn",reference:"Siyar Aʿlām al-Nubalāʾ, vol. 9, p. 277, Abū Usāma",referenceUrl:src.hammad,
  maitres:["Burayd ibn ʿAbd Allāh","Hishām ibn ʿUrwa","al-Aʿmash"],eleves:["Muḥammad ibn al-ʿAlāʾ (dans ce sanad)","Aḥmad ibn Ḥanbal","al-Shāfiʿī"],
  jugements:[
   cite("Aḥmad ibn Ḥanbal","Fiable et particulièrement précis.","ثقة، ثبت لا يكاد يخطئ.","Trustworthy and very precise.","Siyar Aʿlām al-Nubalāʾ — Abū Usāma",src.hammad),
   cite("Ibn Maʿīn","Fiable (thiqa).","ثقة.","Trustworthy.","Siyar Aʿlām al-Nubalāʾ — Abū Usāma",src.hammad)
  ]
 },
 "محمد بن العلاء":{
  verdict:"thiqa",nomCompletAr:"محمد بن العلاء بن كريب — أبو كريب",nomLatin:"Muḥammad ibn al-ʿAlāʾ (Abū Kurayb)",
  qualification:{fr:"Fiable et mémorisateur (thiqa, ḥāfiẓ) chez al-Dhahabī.",ar:"الحافظ الثقة الإمام عند الذهبي.",en:"Trustworthy hadith memorizer (thiqa, hafiz) per al-Dhahabi."},
  bio:{fr:"Traditionniste de Koufa, né vers 161 H. Il enseigna aux compilateurs des recueils et rapporte ici de Ḥammād ibn Usāma.",ar:"محمد بن العلاء الكوفي الحافظ، ولد سنة 161 هـ، ومن شيوخ أصحاب الكتب. روى هنا عن حماد بن أسامة.",en:"Kufan traditionist born c. 161 AH, teacher of hadith compilers, who narrates here from Hammad ibn Usama."},
  critique:"al-Dhahabī",reference:"Siyar Aʿlām al-Nubalāʾ, vol. 11, pp. 394–398, Abū Kurayb",referenceUrl:src.kurayb,
  maitres:["Ḥammād ibn Usāma (dans ce sanad)","Ibn al-Mubārak","Sufyān ibn ʿUyayna"],eleves:["al-Bukhārī","Muslim","Abū Dāwūd","Abū Ḥātim al-Rāzī"],
  jugements:[cite("al-Dhahabī","Imam, mémorisateur et maître des traditionnistes, fiable.","الحافظ الثقة الإمام، شيخ المحدثين.","Trustworthy imam, memorizer and teacher of traditionists.","Siyar Aʿlām al-Nubalāʾ, vol. 11, pp. 394–398",src.kurayb)]
 }
};
export function noticeHadith79(recueil:string,numero:number,nomAr:string):NoticeRijalExterne|undefined{
 if(recueil!=="sahih-bukhari"||numero!==79)return undefined;
 return Object.hasOwn(fiches,nomAr)?fiches[nomAr]:undefined;
}
