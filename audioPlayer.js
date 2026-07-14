// ============================================================
// 🎵 audioPlayer.js - مشغل الصوت لتطبيق مَثَانِي
// ============================================================

// ----- الاستيرادات -----
import {
    surahsList,
    AUDIO_CACHE_NAME,
    generateAudioUrl
} from './constants.js';

import {
    loadCurrentReciter,
    saveCurrentReciter,
    loadCurrentSurah,
    saveCurrentSurah,
    markSurahAsListened
} from './dataManager.js';

import {
    showToast,
    updateMotivationalStats,
    refreshExistingCardsUI,
    updateAllCardsOfflineBadges
} from './uiCore.js';

import { updateTrackingUI, checkAndMarkSurahCompleted } from './progressTracker.js';

// =====================================================================
// 1. المتغيرات العامة
// =====================================================================
let currentSurahNumber = loadCurrentSurah();
let currentReciterId = loadCurrentReciter();
let loopCount = 0;
let downloadHandlerInitialized = false;
let isPlayerOpen = false;

let audioPlayer = null;
let reciterSelect = null;
let loopSelect = null;
let playerSection = null;
let currentPlayerSurah = null;
let closePlayerBtn = null;
let prevSurahBtn = null;
let nextSurahBtn = null;
let prevSurahName = null;
let nextSurahName = null;
let downloadOfflineBtn = null;
let quranTextArea = null;
let surahGrid = null;
let searchContainer = null;
let statsContainer = null;
let focusModeToggle = null;

// =====================================================================
// 2. تهيئة المراجع
// =====================================================================
function cacheAudioDomElements() {
    audioPlayer = document.getElementById('audioPlayer');
    reciterSelect = document.getElementById('reciterSelect');
    loopSelect = document.getElementById('loopSelect');
    playerSection = document.getElementById('playerSection');
    currentPlayerSurah = document.getElementById('currentPlayerSurah');
    closePlayerBtn = document.getElementById('closePlayerBtn');
    prevSurahBtn = document.getElementById('prevSurahBtn');
    nextSurahBtn = document.getElementById('nextSurahBtn');
    prevSurahName = document.getElementById('prevSurahName');
    nextSurahName = document.getElementById('nextSurahName');
    downloadOfflineBtn = document.getElementById('downloadOfflineBtn');
    quranTextArea = document.getElementById('quranTextArea');
    surahGrid = document.getElementById('surahGrid');
    searchContainer = document.getElementById('searchContainer');
    statsContainer = document.getElementById('statsContainer');
    focusModeToggle = document.getElementById('focusModeToggle');
}

// =====================================================================
// 3. تعبئة قائمة المقرئين
// =====================================================================
export function populateRecitersList() {
    if (!reciterSelect) return;
    
    import('./constants.js').then(({ recitersConfig }) => {
        let options = '';
        for (const key in recitersConfig) {
            options += `<option value="${key}">الشيخ ${recitersConfig[key].name}</option>`;
        }
        reciterSelect.innerHTML = options;
        reciterSelect.value = currentReciterId;
    });
}

// =====================================================================
// 4. التنقل بين السور
// =====================================================================
export function updateNavigationButtons(id) {
    if (prevSurahBtn) {
        if (id > 1) {
            prevSurahBtn.style.display = 'flex';
            if (prevSurahName) {
                prevSurahName.innerText = surahsList[id - 2].name;
            }
        } else {
            prevSurahBtn.style.display = 'none';
        }
    }

    if (nextSurahBtn) {
        if (id < 114) {
            nextSurahBtn.style.display = 'flex';
            if (nextSurahName) {
                nextSurahName.innerText = surahsList[id].name;
            }
        } else {
            nextSurahBtn.style.display = 'none';
        }
    }
}

// =====================================================================
// 5. تحديث واجهة المشغل
// =====================================================================
export function updatePlayerUI(id) {
    if (currentPlayerSurah) {
        currentPlayerSurah.innerText = `سورة ${surahsList[id - 1].name}`;
    }
    updateNavigationButtons(id);
}

// =====================================================================
// 6. تشغيل الصوت
// =====================================================================
export async function updateAudioSource(triggerPlay = false) {
    if (!audioPlayer || !reciterSelect) return;

    const reciterId = reciterSelect.value;
    currentReciterId = reciterId;
    saveCurrentReciter(reciterId);

    audioPlayer.pause();
    const newSrc = generateAudioUrl(reciterId, currentSurahNumber);
    if (audioPlayer.src !== newSrc) {
        audioPlayer.src = newSrc;
        audioPlayer.load();
    }

    if ('mediaSession' in navigator && navigator.mediaSession.metadata) {
        import('./constants.js').then(({ recitersConfig }) => {
            navigator.mediaSession.metadata.artist = recitersConfig[reciterId]?.name || "قارئ القرآن";
        });
    }

    if (triggerPlay) {
        try {
            await audioPlayer.play();
        } catch (error) {
            console.log("⏳ بانتظار تفاعل المستخدم لبدء الصوت.");
        }
    }

    updateDownloadButtonStatus(currentSurahNumber);
}

// =====================================================================
// 7. اختيار سورة
// =====================================================================
export function selectSurah(id, isInitialLoad = false) {
    currentSurahNumber = id;
    saveCurrentSurah(id);

    if (surahGrid) surahGrid.style.display = 'none';
    if (searchContainer) searchContainer.style.display = 'none';
    if (statsContainer) statsContainer.style.display = 'none';
    if (playerSection) playerSection.style.display = 'block';

    isPlayerOpen = true;
    document.body.classList.add('player-active');

    updatePlayerUI(id);

    if ('mediaSession' in navigator) {
        import('./constants.js').then(({ recitersConfig }) => {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: `سورة ${surahsList[id - 1].name}`,
                artist: recitersConfig[currentReciterId]?.name || "قارئ القرآن",
                album: "مَـثَـانِـي الحِفظ والتدبُّر",
                artwork: []
            });
        });
    }

    updateDownloadButtonStatus(id);
    updateAudioSource(!isInitialLoad);
    loopCount = 0;

    import('./quranDisplay.js').then(({ fetchSurahText, updateQuickNavBar }) => {
        fetchSurahText(id);
        updateQuickNavBar();
    });

    updateTrackingUI(id);

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// =====================================================================
// 8. إغلاق المشغل
// =====================================================================
export function closePlayer() {
    if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.src = "";
    }

    if (playerSection) playerSection.style.display = 'none';
    if (surahGrid) surahGrid.style.display = 'grid';
    if (searchContainer) searchContainer.style.display = 'block';
    if (statsContainer) statsContainer.style.display = 'flex';

    if (focusModeToggle) {
        focusModeToggle.checked = false;
        localStorage.setItem('quran_focus_mode', 'false');
        document.body.classList.remove('focus-mode-active');
    }

    isPlayerOpen = false;
    document.body.classList.remove('player-active');
    localStorage.removeItem('quran_current_surah');

    const reciterId = reciterSelect ? reciterSelect.value : "islam";
    import('./dataManager.js').then(({ loadColorStates, loadProgressData, loadLastPosition }) => {
        const colorStates = loadColorStates();
        const progressData = loadProgressData();
        const lastPosition = loadLastPosition();
        refreshExistingCardsUI(reciterId, colorStates, progressData, lastPosition);
    });
}

// =====================================================================
// 9. نهاية التشغيل (التكرار)
// =====================================================================
export function handleAudioEnded() {
    const surahId = currentSurahNumber;
    markSurahAsListened(surahId);
    checkAndMarkSurahCompleted(surahId);

    const loopMode = loopSelect ? loopSelect.value : 'none';
    if (loopMode === '3') {
        loopCount++;
        if (loopCount < 3) {
            if (audioPlayer) {
                audioPlayer.currentTime = 0;
                audioPlayer.play().catch(err => console.log(err));
            }
        } else {
            loopCount = 0;
            if (currentSurahNumber < 114) {
                selectSurah(currentSurahNumber + 1);
            }
        }
    } else if (loopMode === 'infinite') {
        if (audioPlayer) {
            audioPlayer.currentTime = 0;
            audioPlayer.play().catch(err => console.log(err));
        }
    } else {
        if (currentSurahNumber < 114) {
            selectSurah(currentSurahNumber + 1);
        }
    }
}

// =====================================================================
// 10. زر التحميل الأوفلاين
// =====================================================================
export function updateDownloadButtonStatus(id) {
    if (!downloadOfflineBtn || !reciterSelect) return;

    const reciterId = reciterSelect.value;
    const audioUrl = generateAudioUrl(reciterId, id);

    caches.open(AUDIO_CACHE_NAME).then(cache => {
        cache.match(audioUrl).then(response => {
            if (response) {
                downloadOfflineBtn.classList.add('completed');
                const textSpan = downloadOfflineBtn.querySelector('.texto');
                if (textSpan) textSpan.innerText = 'تم التحميل';
                downloadOfflineBtn.disabled = true;
            } else {
                downloadOfflineBtn.classList.remove('completed');
                const textSpan = downloadOfflineBtn.querySelector('.texto');
                if (textSpan) textSpan.innerText = 'تحميل دون انترنت';
                downloadOfflineBtn.disabled = false;
            }
            downloadOfflineBtn.classList.remove('loading');
        });
    });

    if (!downloadHandlerInitialized) {
        downloadHandlerInitialized = true;
        downloadOfflineBtn.onclick = async (e) => {
            e.preventDefault();
            if (downloadOfflineBtn.disabled || downloadOfflineBtn.classList.contains('loading')) return;

            const reciterId = reciterSelect.value;
            const audioUrl = generateAudioUrl(reciterId, currentSurahNumber);

            downloadOfflineBtn.classList.add('loading');
            downloadOfflineBtn.disabled = true;

            try {
                const cache = await caches.open(AUDIO_CACHE_NAME);
                await cache.add(audioUrl);
                showToast(`✅ تم حفظ سورة ${surahsList[currentSurahNumber - 1].name} أوفلاين بنجاح!`);
                updateAllCardsOfflineBadges(reciterId);
                downloadOfflineBtn.classList.remove('loading');
                downloadOfflineBtn.classList.add('completed');
                const textSpan = downloadOfflineBtn.querySelector('.texto');
                if (textSpan) textSpan.innerText = 'تم التحميل';
                downloadOfflineBtn.disabled = true;
            } catch (error) {
                showToast(`❌ تعذر التحميل، تحقق من اتصال الشبكة.`);
                downloadOfflineBtn.classList.remove('loading');
                downloadOfflineBtn.classList.remove('completed');
                const textSpan = downloadOfflineBtn.querySelector('.texto');
                if (textSpan) textSpan.innerText = 'تحميل دون انترنت';
                downloadOfflineBtn.disabled = false;
            }
        };
    }
}

// =====================================================================
// 11. Media Session API
// =====================================================================
export function setupMediaSession() {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.setActionHandler('play', () => {
        if (audioPlayer) audioPlayer.play();
    });

    navigator.mediaSession.setActionHandler('pause', () => {
        if (audioPlayer) audioPlayer.pause();
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
        if (currentSurahNumber > 1) selectSurah(currentSurahNumber - 1);
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
        if (currentSurahNumber < 114) selectSurah(currentSurahNumber + 1);
    });
}

// =====================================================================
// 12. ربط أحداث المشغل
// =====================================================================
export function bindAudioEvents() {
    if (audioPlayer) {
        audioPlayer.onended = handleAudioEnded;
    }

    if (reciterSelect) {
        reciterSelect.addEventListener('change', () => {
            updateAudioSource(true);
            updateDownloadButtonStatus(currentSurahNumber);
        });
    }

    if (prevSurahBtn) {
        prevSurahBtn.addEventListener('click', () => {
            if (currentSurahNumber > 1) selectSurah(currentSurahNumber - 1);
        });
    }

    if (nextSurahBtn) {
        nextSurahBtn.addEventListener('click', () => {
            if (currentSurahNumber < 114) selectSurah(currentSurahNumber + 1);
        });
    }

    if (closePlayerBtn) {
        closePlayerBtn.addEventListener('click', closePlayer);
    }
}

// =====================================================================
// 13. ربط زر التسجيل المدمج
// =====================================================================
export async function setupInlineRecorderButton() {
    const inlineRecordBtn = document.getElementById('inlineRecordBtn');
    if (!inlineRecordBtn) return;

    const { getRecorder } = await import('./recorder.js');
    const recorder = getRecorder();
    if (!recorder) {
        console.warn('⚠️ نظام التسجيل غير جاهز');
        return;
    }

    inlineRecordBtn.addEventListener('click', async () => {
        const surahId = currentSurahNumber;
        const { getSelectedAyah } = await import('./quranDisplay.js');
        let ayahNumber = getSelectedAyah();
        
        if (!ayahNumber) {
            ayahNumber = 1;
            showToast('📌 اضغط على آية لتحديدها للتسجيل، سيتم تسجيل الآية الأولى حالياً');
        }

        if (recorder.isCurrentlyRecording()) {
            await recorder.stopRecordingAyah();
            return;
        }

        await recorder.startRecordingAyah(surahId, ayahNumber);
    });
}

// =====================================================================
// 14. تهيئة المشغل
// =====================================================================
export function initAudioPlayer() {
    cacheAudioDomElements();
    populateRecitersList();
    setupMediaSession();
    bindAudioEvents();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupInlineRecorderButton);
    } else {
        setupInlineRecorderButton();
    }

    const savedSurahId = loadCurrentSurah();
    if (savedSurahId && savedSurahId !== 1) {
        selectSurah(parseInt(savedSurahId), true);
    }

    console.log('✅ تم تهيئة مشغل الصوت بنجاح');
}

// =====================================================================
// 15. دوال مساعدة
// =====================================================================
export function getCurrentSurahNumber() {
    return currentSurahNumber;
}

export function getCurrentReciterId() {
    return currentReciterId;
}

export function isPlayerOpenState() {
    return isPlayerOpen;
}

export function setCurrentSurahNumber(id) {
    currentSurahNumber = id;
    saveCurrentSurah(id);
}