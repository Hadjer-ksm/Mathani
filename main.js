// ============================================================
// 🚀 main.js - الملف الرئيسي (بعد إضافة نافذة الإعدادات)
// ============================================================

// ----- الاستيرادات -----
import { loadQuranData } from './dataManager.js';
import { initUI } from './uiCore.js';
import { initAudioPlayer, selectSurah, closePlayer, getCurrentSurahNumber } from './audioPlayer.js';
import { initQuranDisplay, saveCurrentAyaPosition, refreshQuranDisplay } from './quranDisplay.js';
import { initRecorder } from './recorder.js';
import { initPwa } from './pwa.js';
import { initTutorial } from './tutorial.js';
import { showToast } from './uiCore.js';
import { initProgressTracker } from './progressTracker.js';

// =====================================================================
// 1. المتغيرات العامة
// =====================================================================
let audioControls = null;
let quranControls = null;
let recorderInstance = null;

// =====================================================================
// 2. دالة التهيئة الرئيسية
// =====================================================================
async function initApp() {
    console.log('🔄 جاري تهيئة تطبيق مَثَانِي...');

    try {
        // ----- الخطوة 1: تحميل البيانات القرآنية -----
        await loadQuranData();
        fetch('quran-uthmani.json');
        fetch('KFGQPC Uthmanic Script HAFS Regular.otf');
        console.log('✅ تم تحميل البيانات القرآنية');

        // ----- الخطوة 2: تهيئة واجهة المستخدم الأساسية -----
        initUI((surahId) => {
            handleSurahSelection(surahId);
        });
        console.log('✅ تم تهيئة واجهة المستخدم');

        // ----- الخطوة 3: تهيئة نظام تتبع التقدم -----
        initProgressTracker();
        console.log('✅ تم تهيئة نظام تتبع التقدم');

        // ----- الخطوة 4: تهيئة مشغل الصوت -----
        audioControls = initAudioPlayer();
        console.log('✅ تم تهيئة مشغل الصوت');

        // ----- الخطوة 5: تهيئة عرض القرآن والآيات -----
        quranControls = initQuranDisplay((surahId, ayaNumber) => {
            handleAyaClick(surahId, ayaNumber);
        });
        console.log('✅ تم تهيئة عرض القرآن');

        // ----- الخطوة 6: تهيئة نظام التسجيل -----
        recorderInstance = initRecorder();
        console.log('✅ تم تهيئة نظام التسجيل');

        // ----- الخطوة 7: تهيئة PWA (التثبيت) -----
        initPwa();
        console.log('✅ تم تهيئة نظام PWA');

        // ----- الخطوة 8: تهيئة الجولة التعريفية -----
        initTutorial();
        console.log('✅ تم تهيئة الجولة التعريفية');

        // ----- الخطوة 9: استعادة الحالة المحفوظة -----
        restoreSavedState();

        console.log('🎉 تم تهيئة تطبيق مَثَانِي بالكامل بنجاح!');
    } catch (error) {
        console.error('❌ فشل تهيئة التطبيق:', error);
        showToast('⚠️ حدث خطأ أثناء تهيئة التطبيق، يرجى تحديث الصفحة');
    }
}

// =====================================================================
// 3. معالجة اختيار سورة من القائمة
// =====================================================================
function handleSurahSelection(surahId) {
    if (audioControls && typeof audioControls.selectSurah === 'function') {
        audioControls.selectSurah(surahId);
    } else {
        selectSurah(surahId);
    }

    if (quranControls && typeof quranControls.refreshQuranDisplay === 'function') {
        quranControls.refreshQuranDisplay(surahId);
    } else {
        refreshQuranDisplay(surahId);
    }
}

// =====================================================================
// 4. معالجة النقر على آية (تثبيت الموضع)
// =====================================================================
function handleAyaClick(surahId, ayaNumber) {
    if (quranControls && typeof quranControls.saveCurrentAyaPosition === 'function') {
        quranControls.saveCurrentAyaPosition(surahId, ayaNumber);
    } else {
        saveCurrentAyaPosition(surahId, ayaNumber);
    }
}

// =====================================================================
// 5. استعادة الحالة المحفوظة
// =====================================================================
function restoreSavedState() {
    const savedSurahId = localStorage.getItem('quran_current_surah');
    if (savedSurahId) {
        const id = parseInt(savedSurahId, 10);
        if (id >= 1 && id <= 114) {
            console.log(`📖 استعادة السورة المحفوظة: ${id}`);
            if (audioControls && typeof audioControls.selectSurah === 'function') {
                audioControls.selectSurah(id, true);
            } else {
                selectSurah(id, true);
            }
            if (quranControls && typeof quranControls.refreshQuranDisplay === 'function') {
                quranControls.refreshQuranDisplay(id);
            } else {
                refreshQuranDisplay(id);
            }
        }
    }
    console.log('✅ تم استعادة الحالة المحفوظة');
}

// =====================================================================
// 6. دوال مساعدة للاستخدام من وحدة التحكم
// =====================================================================
window.__mathani = {
    getQuranData: () => import('./dataManager.js').then(m => m.quranData),
    getSurahsList: () => import('./constants.js').then(m => m.surahsList),

    selectSurah: (id) => handleSurahSelection(id),
    closePlayer: () => {
        if (audioControls && typeof audioControls.closePlayer === 'function') {
            audioControls.closePlayer();
        } else {
            closePlayer();
        }
    },
    getCurrentSurah: () => {
        if (audioControls && typeof audioControls.getCurrentSurahNumber === 'function') {
            return audioControls.getCurrentSurahNumber();
        }
        return getCurrentSurahNumber();
    },

    getRecorder: () => recorderInstance,

    installApp: () => {
        import('./pwa.js').then(m => {
            if (m.showInstallButton) m.showInstallButton();
        });
    },

    showTutorial: () => {
        import('./tutorial.js').then(m => {
            if (m.forceShowTutorial) m.forceShowTutorial();
        });
    },

    clearAllData: () => {
        if (confirm('⚠️ هل أنت متأكد من حذف جميع البيانات المحفوظة؟')) {
            localStorage.clear();
            showToast('🗑️ تم حذف جميع البيانات، سيتم تحديث الصفحة');
            setTimeout(() => location.reload(), 1500);
        }
    },

    resetProgress: () => {
        import('./progressTracker.js').then(m => {
            if (m.resetAllProgress) m.resetAllProgress();
        });
    }
};

// =====================================================================
// 7. تشغيل التطبيق عند تحميل الصفحة
// =====================================================================
document.addEventListener('DOMContentLoaded', () => {
    initApp();

    window.addEventListener('error', (event) => {
        console.error('⚠️ خطأ عام في التطبيق:', event.error || event.message);
    });

    window.addEventListener('unhandledrejection', (event) => {
        console.error('⚠️ خطأ في Promise غير معالج:', event.reason);
    });
});

// =====================================================================
// 8. إخفاء شاشة البداية
// =====================================================================
window.addEventListener('load', function() {
    const splash = document.getElementById('splashScreen');
    if (splash) {
        setTimeout(() => {
            splash.style.opacity = '0';
            setTimeout(() => {
                splash.style.display = 'none';
            }, 500);
        }, 800);
    }
});

// =====================================================================
// 9. تصدير الدوال الأساسية
// =====================================================================
export {
    initApp,
    handleSurahSelection,
    handleAyaClick,
    restoreSavedState,
    audioControls,
    quranControls,
    recorderInstance
};