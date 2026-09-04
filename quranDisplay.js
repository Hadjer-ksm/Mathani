// ============================================================
// 📖 quranDisplay.js - عرض النص القرآني والآيات (الحل النهائي)
// ============================================================

// ----- الاستيرادات -----
import { surahsList, removeDiacritics } from './constants.js';
import {
    loadSurahData,
    loadLastPosition,
    saveLastPosition,
    clearLastPosition
} from './dataManager.js';
import {
    showToast,
    refreshExistingCardsUI,
    cachedCards,
    refreshStats
} from './uiCore.js';
import { checkAndMarkSurahCompleted } from './progressTracker.js';

// =====================================================================
// 1. المتغيرات الخاصة بعرض القرآن
// =====================================================================
let currentSurahNumber = 1;
let isBlindTestMode = false;
let warningShownForCurrentSurah = false;
let lastPosition = null;
let autoScrollEnabled = true;
let selectedAyahNumber = null;

let quranTextArea = null;
let testModeToggle = null;
let quickNavBar = null;
let goToSavedAyaBtn = null;
let clearSavedPositionBtn = null;
let savedAyaNumber = null;

// =====================================================================
// 2. تهيئة المراجع الداخلية
// =====================================================================
function cacheQuranElements() {
    quranTextArea = document.getElementById('quranTextArea');
    testModeToggle = document.getElementById('testModeToggle');
    quickNavBar = document.getElementById('quickNavBar');
    goToSavedAyaBtn = document.getElementById('goToSavedAyaBtn');
    clearSavedPositionBtn = document.getElementById('clearSavedPositionBtn');
    savedAyaNumber = document.getElementById('savedAyaNumber');
}

// =====================================================================
// 3. ✅ الحل القاطع: حذف أول 4 كلمات من الآية الأولى (البسملة)
// =====================================================================
function removeBasmalah(text) {
    // نقوم بتقسيم النص إلى كلمات
    const words = text.trim().split(/\s+/);
    
    // البسملة هي دائماً 4 كلمات: بسم الله الرحمن الرحيم
    // إذا كان عدد الكلمات أكبر من 4، نحذف أول 4 كلمات
    if (words.length > 4) {
        return words.slice(4).join(' ');
    }
    
    // إذا كان النص يحتوي على 4 كلمات فقط (مثل سورة الفاتحة)، نعيده كما هو
    return text;
}

// =====================================================================
// 4. وضع الاختبار (Blind Test)
// =====================================================================
export function applyBlindTestUI() {
    if (!quranTextArea) return;
    if (testModeToggle) testModeToggle.checked = isBlindTestMode;
    quranTextArea.classList.toggle('blind-test-mode', isBlindTestMode);
    warningShownForCurrentSurah = false;
}

export function toggleBlindTest() {
    isBlindTestMode = !isBlindTestMode;
    localStorage.setItem('quran_blind_test', isBlindTestMode);
    applyBlindTestUI();
    showToast(isBlindTestMode ? "👁️ تم تفعيل وضع الاختبار وعزل الكلمات" : "👁️ تم إلغاء وضع الاختبار وإظهار النص");
}

export function setupBlindTestToggle() {
    if (!testModeToggle) return;
    isBlindTestMode = localStorage.getItem('quran_blind_test') === 'true';
    applyBlindTestUI();
    testModeToggle.addEventListener('change', (e) => {
        isBlindTestMode = e.target.checked;
        localStorage.setItem('quran_blind_test', isBlindTestMode);
        applyBlindTestUI();
        showToast(isBlindTestMode ? "👁️ تم تفعيل وضع الاختبار وعزل الكلمات" : "👁️ تم إلغاء وضع الاختبار وإظهار النص");
    });
}

// =====================================================================
// 5. ربط المستمعات بالآيات
// =====================================================================
export function attachAyahListeners(onAyaClickCallback) {
    if (!quranTextArea) return;
    const ayaElements = quranTextArea.querySelectorAll('.quran-item');
    ayaElements.forEach((element) => {
        element.replaceWith(element.cloneNode(true));
    });
    const newAyaElements = quranTextArea.querySelectorAll('.quran-item');
    newAyaElements.forEach((element, idx) => {
        const ayaNumber = parseInt(element.dataset.ayaIndex) || (idx + 1);
        element.style.cursor = 'pointer';

        element.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isBlindTestMode) {
                if (!warningShownForCurrentSurah) {
                    showToast("👁️ في وضع الاختبار، اضغط مطولاً لإظهار الآية");
                    warningShownForCurrentSurah = true;
                }
                return;
            }
            selectedAyahNumber = ayaNumber;
            if (typeof onAyaClickCallback === 'function') {
                onAyaClickCallback(currentSurahNumber, ayaNumber);
            }
            element.style.transition = 'all 0.3s';
            element.style.backgroundColor = 'var(--accent-glow)';
            setTimeout(() => {
                element.style.backgroundColor = '';
            }, 500);
        });

        element.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (isBlindTestMode) {
                element.classList.add('revealed');
                setTimeout(() => {
                    element.classList.remove('revealed');
                }, 1000);
            }
        });

        let touchTimer;
        element.addEventListener('touchstart', () => {
            if (isBlindTestMode) {
                touchTimer = setTimeout(() => {
                    element.classList.add('revealed');
                    setTimeout(() => {
                        element.classList.remove('revealed');
                    }, 1000);
                }, 300);
            }
        });
        element.addEventListener('touchend', () => clearTimeout(touchTimer));
        element.addEventListener('touchmove', () => clearTimeout(touchTimer));
    });
}

// =====================================================================
// 6. جلب وعرض النص القرآني
// =====================================================================
export async function fetchSurahText(id, onAyaClick) {
    if (!quranTextArea) return;
    currentSurahNumber = id;
    selectedAyahNumber = null;

    quranTextArea.innerHTML = '<span class="loading-text">جاري تحميل السورة...</span>';

    try {
        const surahData = await loadSurahData(id);
        if (!surahData || !surahData.ayahs) {
            throw new Error('لم يتم العثور على السورة');
        }

        let htmlContent = '';
        // نضيف البسملة كعنصر منفصل لجميع السور عدا الفاتحة (1) والتوبة (9)
        if (id !== 1 && id !== 9) {
            htmlContent += '<div class="basmala">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>';
        }

        surahData.ayahs.forEach((ayah) => {
            let ayahText = ayah.text;
            
            // ✅ التعديل الجديد: حذف البسملة من الآية الأولى
            if (ayah.numberInSurah === 1 && id !== 1 && id !== 9) {
                ayahText = removeBasmalah(ayahText);
            }
            
            const ayaNum = ayah.numberInSurah;
            htmlContent +=
                `<span class="quran-item" data-aya-index="${ayah.numberInSurah}">${ayahText} <span class="aya-num">﴿${ayaNum}﴾</span></span> `;
        });

        quranTextArea.innerHTML = htmlContent;
        applyBlindTestUI();
        attachAyahListeners(onAyaClick);
        updateQuickNavBar();
        scrollToLastAya();

    } catch (error) {
        console.error('❌ فشل تحميل السورة:', error);
        quranTextArea.innerHTML = `<span class="loading-text">⚠️ تعذر تحميل السورة. تأكد من اتصالك بالإنترنت.</span>`;
        showToast('⚠️ فشل تحميل السورة، حاول مرة أخرى');
    }
}

// =====================================================================
// 7. إدارة الموضع المحفوظ
// =====================================================================
export function saveCurrentAyaPosition(surahId, ayaNumber) {
    if (isBlindTestMode) return;
    const position = { surah: surahId, aya: ayaNumber, timestamp: Date.now() };
    saveLastPosition(position);
    lastPosition = position;
    checkAndMarkSurahCompleted(surahId);
    const reciterId = document.getElementById('reciterSelect')?.value || "islam";
    const colorStates = JSON.parse(localStorage.getItem('quran_color_states')) || {};
    const progressData = JSON.parse(localStorage.getItem('quran_progress_tracker')) || {};
    refreshExistingCardsUI(reciterId, colorStates, progressData, lastPosition);
    updateQuickNavBar();
    showToast(`📌 تم تثبيت الموضع عند الآية ${ayaNumber}`);
}

export function loadPositionFromStorage() {
    lastPosition = loadLastPosition();
    return lastPosition;
}

export function scrollToLastAya() {
    if (!autoScrollEnabled || !lastPosition || lastPosition.surah !== currentSurahNumber) return;
    const targetAya = lastPosition.aya;
    if (!quranTextArea) return;
    const ayaElements = quranTextArea.querySelectorAll('.quran-item');
    if (ayaElements[targetAya - 1]) {
        setTimeout(() => {
            ayaElements[targetAya - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
            ayaElements[targetAya - 1].style.transition = 'background 0.5s, box-shadow 0.3s';
            ayaElements[targetAya - 1].style.background = 'var(--accent-glow)';
            ayaElements[targetAya - 1].style.boxShadow = '0 0 15px var(--accent-color)';
            setTimeout(() => {
                ayaElements[targetAya - 1].style.background = '';
                ayaElements[targetAya - 1].style.boxShadow = '';
            }, 1000);
            showToast(`📖 تم العودة إلى الآية ${targetAya}`);
        }, 400);
    }
}

// =====================================================================
// 8. شريط التنقل السريع
// =====================================================================
export function updateQuickNavBar() {
    if (!quickNavBar) return;
    const hasPosition = lastPosition && lastPosition.surah === currentSurahNumber;
    if (hasPosition) {
        quickNavBar.style.display = 'flex';
        if (savedAyaNumber) savedAyaNumber.innerText = lastPosition.aya;
    } else {
        quickNavBar.style.display = 'none';
    }
}

export function goToSavedAya() {
    if (!lastPosition || lastPosition.surah !== currentSurahNumber) {
        showToast('📌 لا يوجد موضع محفوظ لهذه السورة');
        return;
    }
    const targetAya = lastPosition.aya;
    if (!quranTextArea) return;
    const ayaElements = quranTextArea.querySelectorAll('.quran-item');
    if (ayaElements[targetAya - 1]) {
        ayaElements[targetAya - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
        ayaElements[targetAya - 1].style.transition = 'background 0.5s, box-shadow 0.3s';
        ayaElements[targetAya - 1].style.background = 'var(--accent-glow)';
        ayaElements[targetAya - 1].style.boxShadow = '0 0 15px var(--accent-color)';
        setTimeout(() => {
            ayaElements[targetAya - 1].style.background = '';
            ayaElements[targetAya - 1].style.boxShadow = '';
        }, 1200);
        showToast(`📖 تم العودة إلى الآية ${targetAya}`);
    }
}

export function clearSavedPosition() {
    if (lastPosition && lastPosition.surah === currentSurahNumber) {
        clearLastPosition();
        lastPosition = null;
        updateQuickNavBar();
        const card = cachedCards.find(c => c.getAttribute('data-id') == currentSurahNumber);
        if (card) {
            const nameSpan = card.querySelector('.surah-name');
            if (nameSpan) {
                nameSpan.innerHTML = nameSpan.innerHTML.replace(' 📌', '');
            }
        }
        showToast('🗑️ تم مسح الموضع المحفوظ');
    } else {
        showToast('📌 لا يوجد موضع محفوظ لهذه السورة');
    }
}

export function setupQuickNavButtons() {
    if (goToSavedAyaBtn) goToSavedAyaBtn.addEventListener('click', goToSavedAya);
    if (clearSavedPositionBtn) clearSavedPositionBtn.addEventListener('click', clearSavedPosition);
}

// =====================================================================
// 9. دوال عامة
// =====================================================================
export function getSelectedAyah() {
    return selectedAyahNumber;
}

export function setSelectedAyah(ayah) {
    selectedAyahNumber = ayah;
}

export function refreshQuranDisplay(surahId, onAyaClick) {
    if (surahId) currentSurahNumber = surahId;
    fetchSurahText(currentSurahNumber, onAyaClick);
}

export function toggleAutoScroll() {
    autoScrollEnabled = !autoScrollEnabled;
    localStorage.setItem('quran_auto_scroll', autoScrollEnabled);
    showToast(autoScrollEnabled ? "✅ تم تفعيل التمرير التلقائي" : "⏸️ تم إلغاء التمرير التلقائي");
}

export function getCurrentSurahNumber() {
    return currentSurahNumber;
}

export function getBlindTestMode() {
    return isBlindTestMode;
}

// =====================================================================
// 10. تهيئة جميع مكونات عرض القرآن
// =====================================================================
export function initQuranDisplay(onAyaClickCallback) {
    cacheQuranElements();
    loadPositionFromStorage();
    setupBlindTestToggle();
    setupQuickNavButtons();
    console.log('✅ تم تهيئة نظام عرض القرآن بنجاح');
    return {
        fetchSurahText: (id) => fetchSurahText(id, onAyaClickCallback),
        refreshQuranDisplay: (id) => refreshQuranDisplay(id, onAyaClickCallback),
        saveCurrentAyaPosition,
        goToSavedAya,
        clearSavedPosition,
        toggleAutoScroll,
        getCurrentSurahNumber,
        getBlindTestMode,
        getSelectedAyah,
        setSelectedAyah
    };
}