// ============================================================
// 📦 dataManager.js - إدارة البيانات والتخزين المحلي
// الآن: تحميل السور من api.alquran.cloud بشكل فردي
// ============================================================

import { AUDIO_CACHE_NAME, generateAudioUrl } from './constants.js';

// =====================================================================
// 1. متغير عام لتخزين السور المحملة مؤقتاً (في الذاكرة)
// =====================================================================
export const cachedSurahs = {};

// =====================================================================
// 2. تحميل سورة واحدة من API (api.alquran.cloud)
// =====================================================================
export async function loadSurahData(surahId) {
    // إذا كانت السورة محملة مسبقاً في الذاكرة، نعيدها فوراً
    if (cachedSurahs[surahId]) {
        return cachedSurahs[surahId];
    }

    try {
        console.log(`🌐 جلب سورة ${surahId} من api.alquran.cloud...`);
        const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahId}`);
        if (!response.ok) throw new Error('API request failed');
        const json = await response.json();

        if (json && json.data) {
            // حفظ السورة في الذاكرة
            cachedSurahs[surahId] = json.data;
            console.log(`✅ تم تحميل سورة ${surahId} بنجاح`);
            return json.data;
        } else {
            throw new Error('Invalid API response structure');
        }
    } catch (error) {
        console.error(`❌ فشل تحميل سورة ${surahId}:`, error);
        throw new Error(`تعذر تحميل سورة ${surahId}`);
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
    // ✅ تغيير القارئ الافتراضي إلى ماهر المعيقلي (maher)
    return localStorage.getItem('quran_current_reciter') || "maher";
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