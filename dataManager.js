// ============================================================
// 📦 dataManager.js - إدارة البيانات والتخزين المحلي
// لتطبيق مَثَانِي
// ============================================================

import { AUDIO_CACHE_NAME, generateAudioUrl } from './constants.js';

// =====================================================================
// 1. متغير عام للبيانات القرآنية المحلية
// =====================================================================
export let quranData = null;

// =====================================================================
// 2. تحميل ملف JSON المحلي
// =====================================================================
export async function loadQuranData() {
    if (quranData) return;
    try {
        const response = await fetch('quran-uthmani.json');
        if (!response.ok) throw new Error('الملف غير موجود');
        const json = await response.json();
        quranData = json.data.surahs;
        console.log('✅ تم تحميل النص القرآني المحلي بنجاح');
    } catch (error) {
        console.error('❌ فشل تحميل النص القرآني المحلي:', error);
        // سيتم إظهار التوست من مكان آخر
    }
}

// =====================================================================
// 3. إدارة بيانات التقدم (progressData)
// =====================================================================
export function loadProgressData() {
    return JSON.parse(localStorage.getItem('quran_progress_tracker')) || {};
}

export function saveProgressData(data) {
    localStorage.setItem('quran_progress_tracker', JSON.stringify(data));
}

// =====================================================================
// 4. إدارة بيانات الألوان (colorStates)
// =====================================================================
export function loadColorStates() {
    return JSON.parse(localStorage.getItem('quran_color_states')) || {};
}

export function saveColorStates(data) {
    localStorage.setItem('quran_color_states', JSON.stringify(data));
}

// =====================================================================
// 5. إدارة الموضع المحفوظ (lastPosition)
// =====================================================================
export function loadLastPosition() {
    return JSON.parse(localStorage.getItem('quran_last_position')) || null;
}

export function saveLastPosition(position) {
    localStorage.setItem('quran_last_position', JSON.stringify(position));
}

export function clearLastPosition() {
    localStorage.removeItem('quran_last_position');
}

// =====================================================================
// 6. إدارة السورة الحالية والمقرئ
// =====================================================================
export function loadCurrentSurah() {
    return parseInt(localStorage.getItem('quran_current_surah')) || 1;
}

export function saveCurrentSurah(id) {
    localStorage.setItem('quran_current_surah', id);
}

export function loadCurrentReciter() {
    return localStorage.getItem('quran_current_reciter') || "yasser";
}

export function saveCurrentReciter(reciterId) {
    localStorage.setItem('quran_current_reciter', reciterId);
}

// =====================================================================
// 7. إدارة وضع الاختبار (Blind Test)
// =====================================================================
export function loadBlindTestMode() {
    return localStorage.getItem('quran_blind_test') === 'true';
}

export function saveBlindTestMode(isActive) {
    localStorage.setItem('quran_blind_test', isActive);
}

// =====================================================================
// 8. إدارة التركيز (Focus Mode)
// =====================================================================
export function loadFocusMode() {
    return localStorage.getItem('quran_focus_mode') === 'true';
}

export function saveFocusMode(isActive) {
    localStorage.setItem('quran_focus_mode', isActive);
}

// =====================================================================
// 9. إدارة الثيمات
// =====================================================================
export function loadTheme() {
    return localStorage.getItem('quran_theme') || 'dark-obsidian';
}

export function saveTheme(themeName) {
    localStorage.setItem('quran_theme', themeName);
}

// =====================================================================
// 10. إدارة حالة الاستماع للسورة
// =====================================================================
export function markSurahAsListened(surahId) {
    localStorage.setItem(`surah_listened_${surahId}`, 'true');
}

export function isSurahListened(surahId) {
    return localStorage.getItem(`surah_listened_${surahId}`) === 'true';
}

// =====================================================================
// 11. التحقق من وجود الصوت في الكاش (للأوفلاين)
// =====================================================================
export async function checkAudioInCache(reciterId, surahId) {
    const audioUrl = generateAudioUrl(reciterId, surahId);
    try {
        const cache = await caches.open(AUDIO_CACHE_NAME);
        const cachedResponse = await cache.match(audioUrl);
        return !!cachedResponse;
    } catch {
        return false;
    }
}