// ============================================================
// 📊 progressTracker.js - إدارة تقدم الحفظ والتتبع
// يشمل: تحديث الإحصائيات، أزرار التتبع، تغيير لون البطاقات، إكمال السور
// ============================================================

// ----- الاستيرادات -----
import { surahsList } from './constants.js';
import {
    loadProgressData,
    saveProgressData,
    loadColorStates,
    saveColorStates,
    loadLastPosition,
    isSurahListened,
    markSurahAsListened
} from './dataManager.js';

import {
    showToast,
    updateMotivationalStats,
    refreshExistingCardsUI,
    cachedCards,
    refreshStats
} from './uiCore.js';

// =====================================================================
// 1. المتغيرات العامة
// =====================================================================
let currentSurahNumber = parseInt(localStorage.getItem('quran_current_surah')) || 1;

// =====================================================================
// 2. تحديث واجهة أزرار التتبع (قراءة، استماع، مراجعة)
// =====================================================================
export function updateTrackingUI(surahId) {
    const trackingOptions = document.getElementById('trackingOptions');
    if (!trackingOptions) return;

    const progressData = loadProgressData();
    const savedLevel = progressData[surahId] || null;

    trackingOptions.querySelectorAll('.track-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-level') === savedLevel);
    });
}

// =====================================================================
// 3. ربط أحداث أزرار التتبع
// =====================================================================
export function setupTrackingButtons() {
    const trackingOptions = document.getElementById('trackingOptions');
    if (!trackingOptions) return;

    // تعيين رقم السورة الحالية
    currentSurahNumber = parseInt(localStorage.getItem('quran_current_surah')) || 1;

    trackingOptions.addEventListener('click', (e) => {
        if (!e.target.classList.contains('track-btn')) return;

        const clickedBtn = e.target;
        const level = clickedBtn.getAttribute('data-level');
        const progressData = loadProgressData();

        if (clickedBtn.classList.contains('active')) {
            // إلغاء التحديد
            clickedBtn.classList.remove('active');
            delete progressData[currentSurahNumber];
        } else {
            // تحديد الزر الجديد وإلغاء الباقي
            trackingOptions.querySelectorAll('.track-btn').forEach(b => b.classList.remove('active'));
            clickedBtn.classList.add('active');
            progressData[currentSurahNumber] = level;
        }

        saveProgressData(progressData);
        refreshStats();
        showToast(`✅ تم تحديث مستوى الحفظ: ${getLevelName(level)}`);
    });
}

// =====================================================================
// 4. الحصول على اسم المستوى بالعربية
// =====================================================================
function getLevelName(level) {
    const map = {
        'read': 'قراءة 📖',
        'listen': 'استماع 🎧',
        'memorized': 'مراجعة وتثبيت 🎯'
    };
    return map[level] || level;
}

// =====================================================================
// 5. تغيير لون البطاقة (الضغط المطول)
// =====================================================================
export function handleCardColorChange(card, id) {
    const colorStates = loadColorStates();

    if (!card.classList.contains('started') && !card.classList.contains('completed')) {
        card.className = 'surah-card started';
        colorStates[id] = 'started';
    } else if (card.classList.contains('started')) {
        card.className = 'surah-card completed';
        colorStates[id] = 'completed';
    } else {
        card.className = 'surah-card';
        delete colorStates[id];
    }

    saveColorStates(colorStates);
    refreshStats();
}

// =====================================================================
// 6. التحقق من إكمال السورة (استماع + موضع محفوظ)
// =====================================================================
export function checkAndMarkSurahCompleted(surahId) {
    const listened = isSurahListened(surahId);
    const lastPosition = loadLastPosition();
    const hasPosition = lastPosition && lastPosition.surah === surahId;
    const progressData = loadProgressData();

    if (listened && hasPosition && progressData[surahId] !== 'completed') {
        progressData[surahId] = 'completed';
        saveProgressData(progressData);
        refreshStats();
        showToast(`🎉 تم إنجاز سورة ${surahsList[surahId - 1].name}!`);
        return true;
    }
    return false;
}

// =====================================================================
// 7. تحديث حالة الاستماع للسورة (تُستدعى عند نهاية التشغيل)
// =====================================================================
export function markSurahListenedAndCheckCompletion(surahId) {
    markSurahAsListened(surahId);
    // التحقق من الإكمال بعد وضع علامة الاستماع
    setTimeout(() => {
        checkAndMarkSurahCompleted(surahId);
    }, 100);
}

// =====================================================================
// 8. دالة مساعدة للحصول على عدد السور المكتملة
// =====================================================================
export function getCompletedSurahsCount() {
    const progressData = loadProgressData();
    const completedSet = new Set();
    Object.keys(progressData).forEach(id => {
        if (progressData[id] === 'completed' || progressData[id] === 'memorized') {
            completedSet.add(id);
        }
    });
    return completedSet.size;
}

// =====================================================================
// 9. دالة لإعادة تعيين التقدم بالكامل (للمطورين)
// =====================================================================
export function resetAllProgress() {
    if (!confirm('⚠️ هل أنت متأكد من إعادة تعيين جميع بيانات التقدم؟')) return;

    localStorage.removeItem('quran_progress_tracker');
    localStorage.removeItem('quran_color_states');
    localStorage.removeItem('quran_last_position');

    // حذف علامات الاستماع لجميع السور
    for (let i = 1; i <= 114; i++) {
        localStorage.removeItem(`surah_listened_${i}`);
    }

    refreshStats();
    // إعادة عرض البطاقات
    const reciterId = document.getElementById('reciterSelect')?.value || "islam";
    const colorStates = loadColorStates();
    const progressData = loadProgressData();
    const lastPosition = loadLastPosition();
    refreshExistingCardsUI(reciterId, colorStates, progressData, lastPosition);

    showToast('🗑️ تم إعادة تعيين جميع بيانات التقدم');
}

// =====================================================================
// 10. دالة تهيئة نظام التتبع (تُستدعى من main.js)
// =====================================================================
export function initProgressTracker() {
    // ربط أزرار التتبع
    setupTrackingButtons();

    // تحديث واجهة التتبع للسورة الحالية
    const currentSurah = parseInt(localStorage.getItem('quran_current_surah')) || 1;
    updateTrackingUI(currentSurah);

    console.log('✅ تم تهيئة نظام تتبع التقدم');
}

// =====================================================================
// 11. دوال للاستخدام من خارج الملف
// =====================================================================

/**
 * تحديث واجهة التتبع يدوياً (للاستخدام من audioPlayer بعد تغيير السورة)
 */
export function refreshTrackingUI(surahId) {
    updateTrackingUI(surahId);
}

/**
 * الحصول على رقم السورة الحالية
 */
export function getCurrentSurahForTracking() {
    return currentSurahNumber;
}

/**
 * تعيين رقم السورة الحالية (للاستخدام من audioPlayer)
 */
export function setCurrentSurahForTracking(id) {
    currentSurahNumber = id;
    localStorage.setItem('quran_current_surah', id);
}