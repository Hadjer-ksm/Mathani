// ============================================================
// 📦 constants.js - الثوابت والدوال المساعدة العامة
// لتطبيق مَثَانِي
// ============================================================

// =====================================================================
// قائمة السور (114 سورة)
// =====================================================================
export const surahsList = [
  { id: 1, name: "ٱلْفَاتِحَةُ", verses: 7, type: "مكية" },
  { id: 2, name: "الْبَقَرَةُ", verses: 286, type: "مدنية" },
  { id: 3, name: "آلُ عِمْرَانَ", verses: 200, type: "مدنية" },
  { id: 4, name: "النِّسَاءُ", verses: 176, type: "مدنية" },
  { id: 5, name: "الْمَائِدَةُ", verses: 120, type: "مدنية" },
  { id: 6, name: "الْأَنْعَامُ", verses: 165, type: "مكية" },
  { id: 7, name: "الْأَعْرَافُ", verses: 206, type: "مكية" },
  { id: 8, name: "الْأَنْفَالُ", verses: 75, type: "مدنية" },
  { id: 9, name: "التَّوْبَةُ", verses: 129, type: "مدنية" },
  { id: 10, name: "يُونُسَ", verses: 109, type: "مكية" },
  { id: 11, name: "هُودٍ", verses: 123, type: "مكية" },
  { id: 12, name: "يُوسُفَ", verses: 111, type: "مكية" },
  { id: 13, name: "الرَّعْدُ", verses: 43, type: "مدنية" },
  { id: 14, name: "إِبْرَاهِيمَ", verses: 52, type: "مكية" },
  { id: 15, name: "الْحِجْرُ", verses: 99, type: "مكية" },
  { id: 16, name: "النَّحْلُ", verses: 128, type: "مكية" },
  { id: 17, name: "الْإِسْرَاءُ", verses: 111, type: "مكية" },
  { id: 18, name: "الْكَهْفُ", verses: 110, type: "مكية" },
  { id: 19, name: "مَرْيَمَ", verses: 98, type: "مكية" },
  { id: 20, name: "طه", verses: 135, type: "مكية" },
  { id: 21, name: "الْأَنْبِيَاءُ", verses: 112, type: "مكية" },
  { id: 22, name: "الْحَجُّ", verses: 78, type: "مدنية" },
  { id: 23, name: "الْمُؤْمِنُونَ", verses: 118, type: "مكية" },
  { id: 24, name: "النُّورُ", verses: 64, type: "مدنية" },
  { id: 25, name: "الْفُرْقَانُ", verses: 77, type: "مكية" },
  { id: 26, name: "الشُّعَرَاءُ", verses: 227, type: "مكية" },
  { id: 27, name: "النَّمْلُ", verses: 93, type: "مكية" },
  { id: 28, name: "الْقَصَصُ", verses: 88, type: "مكية" },
  { id: 29, name: "الْعَنْكَبُوتُ", verses: 69, type: "مكية" },
  { id: 30, name: "الرُّومُ", verses: 60, type: "مكية" },
  { id: 31, name: "لُقْمَانَ", verses: 34, type: "مكية" },
  { id: 32, name: "السَّجْدَةُ", verses: 30, type: "مكية" },
  { id: 33, name: "الْأَحْزَابُ", verses: 73, type: "مدنية" },
  { id: 34, name: "سَبَإٍ", verses: 54, type: "مكية" },
  { id: 35, name: "فَاطِرُ", verses: 45, type: "مكية" },
  { id: 36, name: "يس", verses: 83, type: "مكية" },
  { id: 37, name: "الصَّافَّاتُ", verses: 182, type: "مكية" },
  { id: 38, name: "ص", verses: 88, type: "مكية" },
  { id: 39, name: "الزُّمَرُ", verses: 75, type: "مكية" },
  { id: 40, name: "غَافِرُ", verses: 85, type: "مكية" },
  { id: 41, name: "فُصِّلَتْ", verses: 54, type: "مكية" },
  { id: 42, name: "الشُّورَى", verses: 53, type: "مكية" },
  { id: 43, name: "الزُّخْرُفُ", verses: 89, type: "مكية" },
  { id: 44, name: "الدُّخَانُ", verses: 59, type: "مكية" },
  { id: 45, name: "الْجَاثِيَةُ", verses: 37, type: "مكية" },
  { id: 46, name: "الْأَحْقَافُ", verses: 35, type: "مكية" },
  { id: 47, name: "مُحَمَّدٍ", verses: 38, type: "مدنية" },
  { id: 48, name: "الْفَتْحُ", verses: 29, type: "مدنية" },
  { id: 49, name: "الْحُجُرَاتُ", verses: 18, type: "مدنية" },
  { id: 50, name: "ق", verses: 45, type: "مكية" },
  { id: 51, name: "الذَّارِيَاتُ", verses: 60, type: "مكية" },
  { id: 52, name: "الطُّورُ", verses: 49, type: "مكية" },
  { id: 53, name: "النَّجْمُ", verses: 62, type: "مكية" },
  { id: 54, name: "الْقَمَرُ", verses: 55, type: "مكية" },
  { id: 55, name: "الرَّحْمَٰنُ", verses: 78, type: "مدنية" },
  { id: 56, name: "الْوَاقِعَةُ", verses: 96, type: "مكية" },
  { id: 57, name: "الْحَدِيدُ", verses: 29, type: "مدنية" },
  { id: 58, name: "الْمُجَادِلَةُ", verses: 22, type: "مدنية" },
  { id: 59, name: "الْحَشْرُ", verses: 24, type: "مدنية" },
  { id: 60, name: "الْمُمْتَحَنَةُ", verses: 13, type: "مدنية" },
  { id: 61, name: "الصَّفُّ", verses: 14, type: "مدنية" },
  { id: 62, name: "الْجُمُعَةُ", verses: 11, type: "مدنية" },
  { id: 63, name: "الْمُنَافِقُونَ", verses: 11, type: "مدنية" },
  { id: 64, name: "التَّغَابُنُ", verses: 18, type: "مدنية" },
  { id: 65, name: "الطَّلَاقُ", verses: 12, type: "مدنية" },
  { id: 66, name: "التَّحْرِيمُ", verses: 12, type: "مدنية" },
  { id: 67, name: "الْمُلْكُ", verses: 30, type: "مكية" },
  { id: 68, name: "الْقَلَمُ", verses: 52, type: "مكية" },
  { id: 69, name: "الْحَاقَّةُ", verses: 52, type: "مكية" },
  { id: 70, name: "الْمَعَارِجُ", verses: 44, type: "مكية" },
  { id: 71, name: "نُوحٍ", verses: 28, type: "مكية" },
  { id: 72, name: "الْجِنُّ", verses: 28, type: "مكية" },
  { id: 73, name: "الْمُزَّمِّلُ", verses: 20, type: "مكية" },
  { id: 74, name: "الْمُدَّثِّرُ", verses: 56, type: "مكية" },
  { id: 75, name: "الْقِيَامَةُ", verses: 40, type: "مكية" },
  { id: 76, name: "الْإِنْسَانُ", verses: 31, type: "مدنية" },
  { id: 77, name: "الْمُرْسَلَاتُ", verses: 50, type: "مكية" },
  { id: 78, name: "النَّبَأُ", verses: 40, type: "مكية" },
  { id: 79, name: "النَّازِعَاتُ", verses: 46, type: "مكية" },
  { id: 80, name: "عَبَسَ", verses: 42, type: "مكية" },
  { id: 81, name: "التَّكْوِيرُ", verses: 29, type: "مكية" },
  { id: 82, name: "الانْفِطَارُ", verses: 19, type: "مكية" },
  { id: 83, name: "الْمُطَفِّفُونَ", verses: 36, type: "مكية" },
  { id: 84, name: "الانْشِقَاقُ", verses: 25, type: "مكية" },
  { id: 85, name: "الْبُرُوجُ", verses: 22, type: "مكية" },
  { id: 86, name: "الطَّارِقُ", verses: 17, type: "مكية" },
  { id: 87, name: "الْأَعْلَى", verses: 19, type: "مكية" },
  { id: 88, name: "الْغَاشِيَةُ", verses: 26, type: "مكية" },
  { id: 89, name: "الْفَجْرُ", verses: 30, type: "مكية" },
  { id: 90, name: "الْبَلَدُ", verses: 20, type: "مكية" },
  { id: 91, name: "الشَّمْسُ", verses: 15, type: "مكية" },
  { id: 92, name: "اللَّيْلُ", verses: 21, type: "مكية" },
  { id: 93, name: "الضُّحَى", verses: 11, type: "مكية" },
  { id: 94, name: "الشَّرْحُ", verses: 8, type: "مكية" },
  { id: 95, name: "التِّينُ", verses: 8, type: "مكية" },
  { id: 96, name: "الْعَلَقُ", verses: 19, type: "مكية" },
  { id: 97, name: "الْقَدْرُ", verses: 5, type: "مكية" },
  { id: 98, name: "الْبَيِّنَةُ", verses: 8, type: "مدنية" },
  { id: 99, name: "الزَّلْزَلَةُ", verses: 8, type: "مدنية" },
  { id: 100, name: "الْعَادِيَاتُ", verses: 11, type: "مكية" },
  { id: 101, name: "الْقَارِعَةُ", verses: 11, type: "مكية" },
  { id: 102, name: "التَّكَاثُرُ", verses: 8, type: "مكية" },
  { id: 103, name: "الْعَصْرُ", verses: 3, type: "مكية" },
  { id: 104, name: "الْهُمَزَةُ", verses: 9, type: "مكية" },
  { id: 105, name: "الْفِيلُ", verses: 5, type: "مكية" },
  { id: 106, name: "قُرَيْشٌ", verses: 4, type: "مكية" },
  { id: 107, name: "الْمَاعُونُ", verses: 7, type: "مكية" },
  { id: 108, name: "الْكَوْثَرُ", verses: 3, type: "مكية" },
  { id: 109, name: "الْكَافِرُونَ", verses: 6, type: "مكية" },
  { id: 110, name: "النَّصْرُ", verses: 3, type: "مدنية" },
  { id: 111, name: "الْمَسَدُ", verses: 5, type: "مكية" },
  { id: 112, name: "الْإِخْلَاصُ", verses: 4, type: "مكية" },
  { id: 113, name: "الْفَلَقُ", verses: 5, type: "مكية" },
  { id: 114, name: "النَّاسُ", verses: 6, type: "مكية" }
];

// =====================================================================
// قائمة المقرئين مع روابط الصوت
// =====================================================================
export const recitersConfig = {
    "yasser": { name: "ياسر الدوسري", server: "https://server11.mp3quran.net/yasser/", folder: "" },
    "frs_a": { name: "فارس عباد", server: "https://server8.mp3quran.net/frs_a/", folder: "" },
    "maher": { name: "ماهر المعيقلي", server: "https://server12.mp3quran.net/maher/", folder: "" },
    "afs": { name: "مشاري العفاسي", server: "https://server8.mp3quran.net/afs/", folder: "" },
    "hazza": { name: "هزاع البلوشي", server: "https://server11.mp3quran.net/hazza/", folder: "" },
    "islam": { name: "إسلام صبحي", server: "https://server14.mp3quran.net/islam/", folder: "Rewayat-Hafs-A-n-Assem/" },
    "sds": { name: "عبد الرحمن السديس", server: "https://server11.mp3quran.net/sds/", folder: "" },
    "shur": { name: "سعود الشريم", server: "https://server7.mp3quran.net/shur/", folder: "" },
    "kurdi": { name: "رعد الكردي", server: "https://server6.mp3quran.net/kurdi/", folder: "" },
    "fawaz": { name: "فواز الدخيل", server: "https://server8.mp3quran.net/fawaz/", folder: "" },
    "qtm": { name: "ناصر القطامي", server: "https://server6.mp3quran.net/qtm/", folder: "" },
    "a_sheim": { name: "عبد العزيز سحيم", server: "https://server16.mp3quran.net/a_sheim/", folder: "Rewayat-Warsh-A-n-Nafi/" },
    "shoraimy": { name: "خالد الشريمي", server: "https://server12.mp3quran.net/shoraimy/", folder: "" },
    "qht": { name: "خالد القحطاني", server: "https://server10.mp3quran.net/qht/", folder: "" },
    "s_gmd": { name: "سعد الغامدي", server: "https://server7.mp3quran.net/s_gmd/", folder: "" },
    "minsh": { name: "محمد صديق المنشاوي ", server: "https://server10.mp3quran.net/minsh/", folder: "" },
    "alheidan": { name: "محمد اللحيدان ", server: "https://server8.mp3quran.net/lhdan/", folder: "" }
};

// =====================================================================
// أسماء الكاش للتخزين المؤقت
// =====================================================================
export const AUDIO_CACHE_NAME = 'mathani-audio-v1.1.1';

// =====================================================================
// دوال مساعدة عامة
// =====================================================================

/**
 * إزالة التشكيل من النص العربي
 */
export function removeDiacritics(text) {
    return text.normalize('NFKD').replace(/[\u064B-\u065F\u0670]/g, '');
}

/**
 * تحويل رقم إلى ثلاث خانات (للروابط الصوتية)
 */
export function getThreeDigitString(number) {
    return String(number).padStart(3, '0');
}

/**
 * توليد رابط الصوت حسب المقرئ ورقم السورة
 */
export function generateAudioUrl(reciterId, surahId) {
    const config = recitersConfig[reciterId];
    if (!config) return "";
    return config.server + config.folder + getThreeDigitString(surahId) + ".mp3";
}