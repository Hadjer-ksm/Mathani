// ============================================================
// 🎨 uiCore.js - واجهة المستخدم الأساسية لتطبيق مَثَانِي
// (تم حذف تبويب التسجيلات ونظام التسجيل)
// ============================================================

// ----- الاستيرادات -----
import {
    surahsList,
    AUDIO_CACHE_NAME,
    generateAudioUrl,
    removeDiacritics
} from './constants.js';

import {
    loadColorStates,
    loadProgressData,
    loadLastPosition,
    saveColorStates,
    saveTheme,
    loadTheme,
    checkAudioInCache
} from './dataManager.js';

import { handleCardColorChange } from './progressTracker.js';

// =====================================================================
// 1. المراجع إلى عناصر DOM
// =====================================================================
let domElements = {};

function cacheDomElements() {
    domElements = {
        surahGrid: document.getElementById('surahGrid'),
        searchInput: document.getElementById('searchInput'),
        searchContainer: document.getElementById('searchContainer'),
        statsContainer: document.getElementById('statsContainer'),
        statsTitle: document.getElementById('statsTitle'),
        statsSubtitle: document.getElementById('statsSubtitle'),
        progressBarFill: document.getElementById('progressBarFill'),
        statsIcon: document.getElementById('statsIcon'),
        aboutModal: document.getElementById('aboutModal'),
        aboutModalBtn: document.getElementById('aboutModalBtn'),
        closeModalBtn: document.getElementById('closeModalBtn'),
        settingsModal: document.getElementById('settingsModal'),
        settingsBtn: document.getElementById('settingsBtn'),
        closeSettingsModalBtn: document.getElementById('closeSettingsModalBtn'),
        themeOptions: document.querySelectorAll('.theme-option-btn'),
        focusModeToggle: document.getElementById('focusModeToggle'),
        body: document.body,
        metaThemeColor: document.querySelector('meta[name="theme-color"]')
    };
}

// =====================================================================
// 2. نظام التوست (الإشعارات المنبثقة)
// =====================================================================
let toastElement = null;
let toastTimer = null;

export function showToast(message) {
    if (!message || typeof message !== 'string' || message.trim() === '') {
        if (toastTimer) {
            clearTimeout(toastTimer);
            toastTimer = null;
        }
        if (toastElement) {
            toastElement.classList.remove('show', 'hide');
        }
        return;
    }

    if (!toastElement) {
        toastElement = document.createElement('div');
        toastElement.className = 'toast-notification';
        document.body.appendChild(toastElement);
    }

    if (toastTimer) {
        clearTimeout(toastTimer);
        toastTimer = null;
        toastElement.classList.remove('show', 'hide');
    }

    toastElement.innerText = message;
    toastElement.classList.add('show');

    toastTimer = setTimeout(() => {
        toastElement.classList.add('hide');
        setTimeout(() => {
            toastElement.classList.remove('show', 'hide');
            toastTimer = null;
        }, 350);
    }, 2500);
}

// =====================================================================
// 3. الإحصائيات التحفيزية
// =====================================================================
export function updateMotivationalStats(progressData) {
    const {
        statsTitle, statsSubtitle, progressBarFill, statsIcon
    } = domElements;

    const totalSurahs = 114;
    const completedSet = new Set();

    Object.keys(progressData).forEach(id => {
        if (progressData[id] === 'completed' || progressData[id] === 'memorized') {
            completedSet.add(id);
        }
    });

    const currentCount = completedSet.size;
    const percentage = ((currentCount / totalSurahs) * 100).toFixed(1);

    if (progressBarFill) {
        progressBarFill.style.width = percentage + "%";
    }
    if (statsSubtitle) {
        statsSubtitle.innerText = `أنجزتَ ${currentCount} من أصل ${totalSurahs} سورة بنسبة (${percentage}%).`;
    }

    if (!statsTitle || !statsIcon) return;

    if (currentCount === 0) {
        statsTitle.innerText = "بداية مباركة مسدّدة! 🌱";
        statsIcon.innerText = "🌱";
    } else if (currentCount < 15) {
        statsTitle.innerText = "خطوات رائعة أولى نحو الهدف! 📖";
        statsIcon.innerText = "🏹";
    } else if (currentCount < 40) {
        statsTitle.innerText = "مستوى مذهل، حافظ على وردك! 🔥";
        statsIcon.innerText = "⚡";
    } else if (currentCount < 114) {
        statsTitle.innerText = "اقتربت جداً من التاج الأسمى! 👑";
        statsIcon.innerText = "👑";
    } else {
        statsTitle.innerText = "مبارك الختم والتثبيت التام! 🎉";
        statsIcon.innerText = "🎉";
    }
}

// =====================================================================
// 4. إدارة البطاقات (السور)
// =====================================================================
export let cachedCards = [];

export async function checkIndividualCardOfflineStatus(id, reciterId, badgeElement) {
    if (!badgeElement) return;
    try {
        const isCached = await checkAudioInCache(reciterId, id);
        badgeElement.style.display = isCached ? 'inline' : 'none';
    } catch {
        badgeElement.style.display = 'none';
    }
}

export function updateAllCardsOfflineBadges(reciterId) {
    cachedCards.forEach(card => {
        const id = card.getAttribute('data-id');
        const badge = card.querySelector(`#offline-badge-${id}`);
        checkIndividualCardOfflineStatus(id, reciterId, badge);
    });
}

export function refreshExistingCardsUI(reciterId, colorStates, progressData, lastPosition) {
    cachedCards.forEach(card => {
        const id = card.getAttribute('data-id');

        card.className = 'surah-card';
        if (colorStates[id] === 'started') card.classList.add('started');
        if (colorStates[id] === 'completed') card.classList.add('completed');

        const badge = card.querySelector(`#badge-${id}`);
        if (badge) {
            badge.className = `card-status-badge ${progressData[id] ? 'has-progress' : ''}`;
        }

        const offlineBadge = card.querySelector(`#offline-badge-${id}`);
        checkIndividualCardOfflineStatus(id, reciterId, offlineBadge);

        const nameSpan = card.querySelector('.surah-name');
        if (nameSpan) {
            const surahName = surahsList[id - 1].name;
            const hasSavedPosition = lastPosition && lastPosition.surah === parseInt(id);
            const positionMarker = hasSavedPosition ? ' 📌' : '';
            nameSpan.innerHTML = `${surahName}${positionMarker} <span class="offline-ready-badge" id="offline-badge-${id}" style="display:none;">✔️</span>`;
        }
    });
    updateMotivationalStats(progressData);
}

export function renderSurahs(reciterId, colorStates, progressData, lastPosition, onSelectSurah) {
    const { surahGrid } = domElements;
    if (!surahGrid) return;

    surahGrid.innerHTML = '';
    cachedCards = [];
    const fragment = document.createDocumentFragment();

    surahsList.forEach((surah) => {
        const id = surah.id;
        const card = document.createElement('div');
        card.className = 'surah-card';
        card.setAttribute('data-id', id);
        card.setAttribute('data-name', surah.name);

        if (colorStates[id] === 'started') card.classList.add('started');
        if (colorStates[id] === 'completed') card.classList.add('completed');

        const hasProgress = progressData[id] ? 'has-progress' : '';
        const hasSavedPosition = lastPosition && lastPosition.surah === id;
        const positionMarker = hasSavedPosition ? ' 📌' : '';

        card.innerHTML = `
            <div class="surah-info">
                <span class="surah-number">سورة رقم ${id}</span>
                <span class="surah-name">${surah.name}${positionMarker} <span class="offline-ready-badge" id="offline-badge-${id}" style="display:none;">✔️</span></span>
                <span class="surah-meta-info">آياتها: ${surah.verses} • ${surah.type}</span>
            </div>
            <div class="card-status-badge ${hasProgress}" id="badge-${id}"></div>
        `;

        const badgeElement = card.querySelector(`#offline-badge-${id}`);
        checkIndividualCardOfflineStatus(id, reciterId, badgeElement);

        card.addEventListener('click', () => {
            if (typeof onSelectSurah === 'function') {
                onSelectSurah(id);
            }
        });

        card.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            handleCardColorChange(card, id);
        });

        fragment.appendChild(card);
        cachedCards.push(card);
    });

    surahGrid.appendChild(fragment);
    updateMotivationalStats(progressData);
}

// =====================================================================
// 5. نظام البحث الذكي
// =====================================================================
export function setupSearch() {
    const { searchInput } = domElements;
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        const normalizedQuery = removeDiacritics(query);

        cachedCards.forEach(card => {
            const name = card.getAttribute('data-name');
            const id = card.getAttribute('data-id');
            const normalizedName = removeDiacritics(name);

            const matchesName = normalizedName.includes(normalizedQuery);
            const matchesId = id === query;
            const matchesNumber = query.length > 0 && id.toString().includes(query);

            card.style.display = (matchesName || matchesId || matchesNumber || query === '') ? '' : 'none';
        });
    });
}

// =====================================================================
// 6. نظام الثيمات
// =====================================================================
const themeNames = {
    'dark-obsidian': 'الأوبسيديان الداكن',
    'light-ivory': 'العاجي الدافئ',
    'dark-emerald': 'الزمردي الداكن',
    'light-azure': 'الأزرق السماوي'
};

export function applyTheme(themeName, silent = false, refreshCallback = null) {
    if (!themeNames[themeName]) return;

    document.body.className = themeName;
    saveTheme(themeName);

    const { metaThemeColor } = domElements;
    if (metaThemeColor) {
        const colorMap = {
            'dark-obsidian': '#121214',
            'light-ivory': '#faf8f5',
            'dark-emerald': '#0d1511',
            'light-azure': '#f0f6ff'
        };
        metaThemeColor.setAttribute('content', colorMap[themeName] || '#121214');
    }

    if (typeof refreshCallback === 'function') {
        refreshCallback();
    }

    if (!silent) {
        showToast(`🎨 تم التبديل إلى مظهر "${themeNames[themeName]}"`);
    }
}

// =====================================================================
// 7. نافذة الإعدادات (Settings Modal - بدون تسجيلات)
// =====================================================================
export function setupSettingsModal() {
    const {
        settingsModal,
        settingsBtn,
        closeSettingsModalBtn,
        themeOptions
    } = domElements;

    // فتح النافذة
    if (settingsBtn && settingsModal) {
        settingsBtn.addEventListener('click', () => {
            settingsModal.classList.add('active');
        });
    }

    // إغلاق النافذة
    if (closeSettingsModalBtn && settingsModal) {
        closeSettingsModalBtn.addEventListener('click', () => {
            settingsModal.classList.remove('active');
        });
    }

    if (settingsModal) {
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                settingsModal.classList.remove('active');
            }
        });
    }

    // ===== التبويبات =====
    const tabs = document.querySelectorAll('.settings-tab');
    const panels = {
        theme: document.getElementById('panel-theme')
        // تم حذف 'recordings' و 'contact'
    };

    // تفعيل التبويب الأول بشكل افتراضي
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const tabId = tab.getAttribute('data-tab');
            Object.keys(panels).forEach(key => {
                panels[key].classList.toggle('active', key === tabId);
            });
        });
    });

    // ===== أزرار الثيمات =====
    themeOptions.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.getAttribute('data-theme');
            if (theme) {
                applyTheme(theme, false, () => {
                    const reciterId = document.getElementById('reciterSelect')?.value || "islam";
                    const colorStates = loadColorStates();
                    const progressData = loadProgressData();
                    const lastPosition = loadLastPosition();
                    refreshExistingCardsUI(reciterId, colorStates, progressData, lastPosition);
                });
                if (settingsModal) settingsModal.classList.remove('active');
            }
        });
    });

    console.log('✅ تم تهيئة نافذة الإعدادات');
}

// =====================================================================
// 8. نافذة "عن التطبيق"
// =====================================================================
export function setupAboutModal() {
    const { aboutModal, aboutModalBtn, closeModalBtn } = domElements;

    if (aboutModalBtn && aboutModal) {
        aboutModalBtn.addEventListener('click', () => {
            aboutModal.classList.add('active');
        });
    }

    if (closeModalBtn && aboutModal) {
        closeModalBtn.addEventListener('click', () => {
            aboutModal.classList.remove('active');
        });
    }

    if (aboutModal) {
        aboutModal.addEventListener('click', (e) => {
            if (e.target === aboutModal) {
                aboutModal.classList.remove('active');
            }
        });
    }
}

// =====================================================================
// 9. وضع التركيز السينمائي
// =====================================================================
export function setupFocusMode() {
    const { focusModeToggle } = domElements;
    if (!focusModeToggle) return;

    const savedFocusMode = localStorage.getItem('quran_focus_mode') === 'true';
    focusModeToggle.checked = savedFocusMode;
    if (savedFocusMode) document.body.classList.add('focus-mode-active');

    focusModeToggle.addEventListener('change', (e) => {
        const isActive = e.target.checked;
        localStorage.setItem('quran_focus_mode', isActive);
        document.body.classList.toggle('focus-mode-active', isActive);
        showToast(isActive ? "📺 تم تفعيل وضع التركيز التام وتغبيش القوائم" : "📺 تم إلغاء وضع التركيز وإظهار القوائم");
    });
}

// =====================================================================
// 10. تهيئة جميع مكونات واجهة المستخدم
// =====================================================================
export function initUI(onSelectSurahCallback) {
    cacheDomElements();

    const savedTheme = loadTheme();
    applyTheme(savedTheme, true);

    setupSettingsModal();
    setupAboutModal();
    setupFocusMode();
    setupSearch();

    const reciterId = document.getElementById('reciterSelect')?.value || "islam";
    const colorStates = loadColorStates();
    const progressData = loadProgressData();
    const lastPosition = loadLastPosition();

    renderSurahs(reciterId, colorStates, progressData, lastPosition, onSelectSurahCallback);

    console.log('✅ تم تهيئة واجهة المستخدم الأساسية بنجاح');
}

// =====================================================================
// 11. دوال مساعدة
// =====================================================================
export function getDomElement(key) {
    return domElements[key] || null;
}

export function refreshStats() {
    const progressData = loadProgressData();
    updateMotivationalStats(progressData);
}

export function reRenderCards(reciterId) {
    const colorStates = loadColorStates();
    const progressData = loadProgressData();
    const lastPosition = loadLastPosition();
    refreshExistingCardsUI(reciterId, colorStates, progressData, lastPosition);
}