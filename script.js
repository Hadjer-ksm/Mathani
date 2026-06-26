/* ==========================================================================
   تطبيق مثاني - المحرك البرمجي الشامل (الإصدار الأسطوري v4.0)
   تمت الإضافة: تذكر آخر آية + تحسين اللمس + Media Session API
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // إعداد النوافذ المنبثقة
    const aboutModal = document.getElementById('aboutModal');
    const aboutModalBtn = document.getElementById('aboutModalBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');

    if (aboutModalBtn && aboutModal) aboutModalBtn.addEventListener('click', () => aboutModal.classList.add('active'));
    if (closeModalBtn && aboutModal) closeModalBtn.addEventListener('click', () => aboutModal.classList.remove('active'));
    if (aboutModal) aboutModal.addEventListener('click', (e) => { if (e.target === aboutModal) aboutModal.classList.remove('active'); });

  // ========================
// نظام الثيمات المتقدم (يدعم 4 ثيمات)
// ========================
const themeNames = {
    'dark-obsidian': 'الأوبسيديان الداكن',
    'light-ivory': 'العاجي الدافئ',
    'dark-emerald': 'الزمردي الداكن',
    'light-azure': 'الأزرق السماوي'
};

// دالة تغيير الثيم
function setTheme(themeName) {
    if (!themeNames[themeName]) return;
    document.body.className = themeName;
    localStorage.setItem('quran_theme', themeName);
    
    // تغيير لون شريط الحالة (theme-color)
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
        let color = '#121214'; // افتراضي
        if (themeName === 'light-ivory') color = '#faf8f5';
        else if (themeName === 'dark-emerald') color = '#0d1511';
        else if (themeName === 'light-azure') color = '#f0f6ff';
        else color = '#121214'; // dark-obsidian
        metaThemeColor.setAttribute('content', color);
    }
    
    refreshExistingCardsUI();
    showToast(`🎨 تم التبديل إلى مظهر "${themeNames[themeName]}"`);
}

// عند تحميل الصفحة، استعادة الثيم المحفوظ
const savedTheme = localStorage.getItem('quran_theme') || 'dark-obsidian';
setTheme(savedTheme);

// فتح وإغلاق نافذة الثيمات
const settingsBtn = document.getElementById('settingsBtn');
const themeModal = document.getElementById('themeModal');
const closeThemeModalBtn = document.getElementById('closeThemeModalBtn');

if (settingsBtn && themeModal) {
    settingsBtn.addEventListener('click', () => {
        themeModal.classList.add('active');
    });
}
if (closeThemeModalBtn && themeModal) {
    closeThemeModalBtn.addEventListener('click', () => {
        themeModal.classList.remove('active');
    });
}
// إغلاق النافذة عند الضغط خارجها
if (themeModal) {
    themeModal.addEventListener('click', (e) => {
        if (e.target === themeModal) themeModal.classList.remove('active');
    });
}

// اختيار ثيم من الأزرار
const themeOptions = document.querySelectorAll('.theme-option-btn');
themeOptions.forEach(btn => {
    btn.addEventListener('click', () => {
        const theme = btn.getAttribute('data-theme');
        if (theme) {
            setTheme(theme);
            if (themeModal) themeModal.classList.remove('active');
        }
    });
});

    // ربط ميزة وضع التركيز السينمائي وتغبيش الواجهة الجديدة
    const focusModeToggle = document.getElementById('focusModeToggle');
    if (focusModeToggle) {
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

    renderSurahs();

    const savedSurahId = localStorage.getItem('quran_current_surah');
    if (savedSurahId) {
        selectSurah(parseInt(savedSurahId), true);
    }
});

// مصفوفة كائنات السور المتقدمة الشاملة (الرقم، الاسم، الآيات، النوع) لتلبية التنسيق المطور
const surahsList = [
    { id: 1, name: "الفاتحة", verses: 7, type: "مكية" },
    { id: 2, name: "البقرة", verses: 286, type: "مدنية" },
    { id: 3, name: "آل عمران", verses: 200, type: "مدنية" },
    { id: 4, name: "النساء", verses: 176, type: "مدنية" },
    { id: 5, name: "المائدة", verses: 120, type: "مدنية" },
    { id: 6, name: "الأنعام", verses: 165, type: "مكية" },
    { id: 7, name: "الأعراف", verses: 206, type: "مكية" },
    { id: 8, name: "الأنفال", verses: 75, type: "مدنية" },
    { id: 9, name: "التوبة", verses: 129, type: "مدنية" },
    { id: 10, name: "يونس", verses: 109, type: "مكية" },
    { id: 11, name: "هود", verses: 123, type: "مكية" },
    { id: 12, name: "يوسف", verses: 111, type: "مكية" },
    { id: 13, name: "الرعد", verses: 43, type: "مدنية" },
    { id: 14, name: "إبراهيم", verses: 52, type: "مكية" },
    { id: 15, name: "الحجر", verses: 99, type: "مكية" },
    { id: 16, name: "النحل", verses: 128, type: "مكية" },
    { id: 17, name: "الإسراء", verses: 111, type: "مكية" },
    { id: 18, name: "الكهف", verses: 110, type: "مكية" },
    { id: 19, name: "مريم", verses: 98, type: "مكية" },
    { id: 20, name: "طه", verses: 135, type: "مكية" },
    { id: 21, name: "الأنبياء", verses: 112, type: "مكية" },
    { id: 22, name: "الحج", verses: 78, type: "مدنية" },
    { id: 23, name: "المؤمنون", verses: 118, type: "مكية" },
    { id: 24, name: "النور", verses: 64, type: "مدنية" },
    { id: 25, name: "الفرقان", verses: 77, type: "مكية" },
    { id: 26, name: "الشعراء", verses: 227, type: "مكية" },
    { id: 27, name: "النمل", verses: 93, type: "مكية" },
    { id: 28, name: "القصص", verses: 88, type: "مكية" },
    { id: 29, name: "العنكبوت", verses: 69, type: "مكية" },
    { id: 30, name: "الروم", verses: 60, type: "مكية" },
    { id: 31, name: "لقمان", verses: 34, type: "مكية" },
    { id: 32, name: "السجدة", verses: 30, type: "مكية" },
    { id: 33, name: "الأحزاب", verses: 73, type: "مدنية" },
    { id: 34, name: "سبأ", verses: 54, type: "مكية" },
    { id: 35, name: "فاطر", verses: 45, type: "مكية" },
    { id: 36, name: "يس", verses: 83, type: "مكية" },
    { id: 37, name: "الصافات", verses: 182, type: "مكية" },
    { id: 38, name: "ص", verses: 88, type: "مكية" },
    { id: 39, name: "الزمر", verses: 75, type: "مكية" },
    { id: 40, name: "غافر", verses: 85, type: "مكية" },
    { id: 41, name: "فصلت", verses: 54, type: "مكية" },
    { id: 42, name: "الشورى", verses: 53, type: "مكية" },
    { id: 43, name: "الزخرف", verses: 89, type: "مكية" },
    { id: 44, name: "الدخان", verses: 59, type: "مكية" },
    { id: 45, name: "الجاثية", verses: 37, type: "مكية" },
    { id: 46, name: "الأحقاف", verses: 35, type: "مكية" },
    { id: 47, name: "محمد", verses: 38, type: "مدنية" },
    { id: 48, name: "الفتح", verses: 29, type: "مدنية" },
    { id: 49, name: "الحجرات", verses: 18, type: "مدنية" },
    { id: 50, name: "ق", verses: 45, type: "مكية" },
    { id: 51, name: "الذاريات", verses: 60, type: "مكية" },
    { id: 52, name: "الطور", verses: 49, type: "مكية" },
    { id: 53, name: "النجم", verses: 62, type: "مكية" },
    { id: 54, name: "القمر", verses: 55, type: "مكية" },
    { id: 55, name: "الرحمن", verses: 78, type: "مدنية" },
    { id: 56, name: "الواقعة", verses: 96, type: "مكية" },
    { id: 57, name: "الحديد", verses: 29, type: "مدنية" },
    { id: 58, name: "المجادلة", verses: 22, type: "مدنية" },
    { id: 59, name: "الحشر", verses: 24, type: "مدنية" },
    { id: 60, name: "الممتحنة", verses: 13, type: "مدنية" },
    { id: 61, name: "الصف", verses: 14, type: "مدنية" },
    { id: 62, name: "الجمعة", verses: 11, type: "مدنية" },
    { id: 63, name: "المنافقون", verses: 11, type: "مدنية" },
    { id: 64, name: "التغابن", verses: 18, type: "مدنية" },
    { id: 65, name: "الطلاق", verses: 12, type: "مدنية" },
    { id: 66, name: "التحريم", verses: 12, type: "مدنية" },
    { id: 67, name: "الملك", verses: 30, type: "مكية" },
    { id: 68, name: "القلم", verses: 52, type: "مكية" },
    { id: 69, name: "الحاقة", verses: 52, type: "مكية" },
    { id: 70, name: "المعارج", verses: 44, type: "مكية" },
    { id: 71, name: "نوح", verses: 28, type: "مكية" },
    { id: 72, name: "الجن", verses: 28, type: "مكية" },
    { id: 73, name: "المزمل", verses: 20, type: "مكية" },
    { id: 74, name: "المدثر", verses: 56, type: "مكية" },
    { id: 75, name: "القيامة", verses: 40, type: "مكية" },
    { id: 76, name: "الإنسان", verses: 31, type: "مدنية" },
    { id: 77, name: "المرسلات", verses: 50, type: "مكية" },
    { id: 78, name: "النبأ", verses: 40, type: "مكية" },
    { id: 79, name: "النازعات", verses: 46, type: "مكية" },
    { id: 80, name: "عبس", verses: 42, type: "مكية" },
    { id: 81, name: "التكوير", verses: 29, type: "مكية" },
    { id: 82, name: "الانفطار", verses: 19, type: "مكية" },
    { id: 83, name: "المطففين", verses: 36, type: "مكية" },
    { id: 84, name: "الانشقاق", verses: 25, type: "مكية" },
    { id: 85, name: "البروج", verses: 22, type: "مكية" },
    { id: 86, name: "الطارق", verses: 17, type: "مكية" },
    { id: 87, name: "الأعلى", verses: 19, type: "مكية" },
    { id: 88, name: "الغاشية", verses: 26, type: "مكية" },
    { id: 89, name: "الفجر", verses: 30, type: "مكية" },
    { id: 90, name: "البلد", verses: 20, type: "مكية" },
    { id: 91, name: "الشمس", verses: 15, type: "مكية" },
    { id: 92, name: "الليل", verses: 21, type: "مكية" },
    { id: 93, name: "الضحى", verses: 11, type: "مكية" },
    { id: 94, name: "الشرح", verses: 8, type: "مكية" },
    { id: 95, name: "التين", verses: 8, type: "مكية" },
    { id: 96, name: "العلق", verses: 19, type: "مكية" },
    { id: 97, name: "القدر", verses: 5, type: "مكية" },
    { id: 98, name: "البينة", verses: 8, type: "مدنية" },
    { id: 99, name: "الزلزلة", verses: 8, type: "مدنية" },
    { id: 100, name: "العاديات", verses: 11, type: "مكية" },
    { id: 101, name: "القارعة", verses: 11, type: "مكية" },
    { id: 102, name: "التكاثر", verses: 8, type: "مكية" },
    { id: 103, name: "العصر", verses: 3, type: "مكية" },
    { id: 104, name: "الهمزة", verses: 9, type: "مكية" },
    { id: 105, name: "الفيل", verses: 5, type: "مكية" },
    { id: 106, name: "قريش", verses: 4, type: "مكية" },
    { id: 107, name: "الماعون", verses: 7, type: "مكية" },
    { id: 108, name: "الكوثر", verses: 3, type: "مكية" },
    { id: 109, name: "الكافرون", verses: 6, type: "مكية" },
    { id: 110, name: "النصر", verses: 3, type: "مدنية" },
    { id: 111, name: "المسد", verses: 5, type: "مكية" },
    { id: 112, name: "الإخلاص", verses: 4, type: "مكية" },
    { id: 113, name: "الفلق", verses: 5, type: "مكية" },
    { id: 114, name: "الناس", verses: 6, type: "مكية" }
];

const recitersConfig = {
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

const AUDIO_CACHE_NAME = 'mathani-audio-v1';  // موحد مع sw.js

function getThreeDigitString(number) { return String(number).padStart(3, '0'); }
function generateAudioUrl(reciterId, surahId) {
    const config = recitersConfig[reciterId];
    if (!config) return "";
    return config.server + config.folder + getThreeDigitString(surahId) + ".mp3";
}

let currentSurahNumber = parseInt(localStorage.getItem('quran_current_surah')) || 1;
let currentReciterId = localStorage.getItem('quran_current_reciter') || "islam"; 
let progressData = JSON.parse(localStorage.getItem('quran_progress_tracker')) || {};
let colorStates = JSON.parse(localStorage.getItem('quran_color_states')) || {};
let isPlayerOpen = false; 

let loopCount = 0;
let isBlindTestMode = localStorage.getItem('quran_blind_test') === 'true';
let warningShownForCurrentSurah = false;   // <--- أضف هذا
let cachedCards = []; 
let apiAbortController = null;

// ✅ خاصية تذكر آخر آية
let lastPosition = JSON.parse(localStorage.getItem('quran_last_position')) || null;
let autoScrollEnabled = localStorage.getItem('quran_auto_scroll') !== 'false'; // مفعل افتراضياً

const surahGrid = document.getElementById('surahGrid');
const searchInput = document.getElementById('searchInput');
const searchContainer = document.getElementById('searchContainer');
const playerSection = document.getElementById('playerSection');
const currentPlayerSurah = document.getElementById('currentPlayerSurah');
const audioPlayer = document.getElementById('audioPlayer');
const reciterSelect = document.getElementById('reciterSelect');
const quranTextArea = document.getElementById('quranTextArea');
const trackingOptions = document.getElementById('trackingOptions');
const closePlayerBtn = document.getElementById('closePlayerBtn');
const prevSurahBtn = document.getElementById('prevSurahBtn');
const nextSurahBtn = document.getElementById('nextSurahBtn');
const prevSurahName = document.getElementById('prevSurahName');
const nextSurahName = document.getElementById('nextSurahName');
const loopSelect = document.getElementById('loopSelect');
const testModeToggle = document.getElementById('testModeToggle'); 
const statsTitle = document.getElementById('statsTitle');
const statsSubtitle = document.getElementById('statsSubtitle');
const progressBarFill = document.getElementById('progressBarFill');
const statsIcon = document.getElementById('statsIcon');
const statsContainer = document.getElementById('statsContainer');
const downloadOfflineBtn = document.getElementById('downloadOfflineBtn');

// ✅ تهيئة الـ Media Session API للتحكم من شاشة القفل
if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', () => { if(audioPlayer) audioPlayer.play(); });
    navigator.mediaSession.setActionHandler('pause', () => { if(audioPlayer) audioPlayer.pause(); });
    navigator.mediaSession.setActionHandler('previoustrack', () => { if (currentSurahNumber > 1) selectSurah(currentSurahNumber - 1); });
    navigator.mediaSession.setActionHandler('nexttrack', () => { if (currentSurahNumber < 114) selectSurah(currentSurahNumber + 1); });
}

if (reciterSelect) {
    let reciterOptions = "";
    for (let key in recitersConfig) {
        reciterOptions += `<option value="${key}">الشيخ ${recitersConfig[key].name}</option>`;
    }
    reciterSelect.innerHTML = reciterOptions;
    reciterSelect.value = currentReciterId;
}

const toastElement = document.createElement('div');
toastElement.className = 'toast-notification';
document.body.appendChild(toastElement);

function showToast(message) {
    toastElement.innerText = message;
    toastElement.classList.add('show');
    setTimeout(() => { toastElement.classList.remove('show'); }, 3500);
}

function updateMotivationalStats() {
    const totalSurahs = 114;
    const completedSet = new Set();
    Object.keys(progressData).forEach(id => completedSet.add(id));
    Object.keys(colorStates).forEach(id => { if (colorStates[id] === 'completed') completedSet.add(id); });

    const currentCount = completedSet.size;
    const percentage = ((currentCount / totalSurahs) * 100).toFixed(1);
    
    if(progressBarFill) progressBarFill.style.width = percentage + "%";
    if(statsSubtitle) statsSubtitle.innerText = `أنجزتَ ${currentCount} من أصل ${totalSurahs} سورة بنسبة (${percentage}%).`;

    if (!statsTitle || !statsIcon) return;
    if (currentCount === 0) { statsTitle.innerText = "بداية مباركة مسدّدة! 🌱"; statsIcon.innerText = "🌱"; }
    else if (currentCount < 15) { statsTitle.innerText = "خطوات رائعة أولى نحو الهدف! 📖"; statsIcon.innerText = "🏹"; }
    else if (currentCount < 40) { statsTitle.innerText = "مستوى مذهل، حافظ على وردك! 🔥"; statsIcon.innerText = "⚡"; }
    else if (currentCount < 114) { statsTitle.innerText = "اقتربت جداً من التاج الأسمى! 👑"; statsIcon.innerText = "👑"; }
    else { statsTitle.innerText = "مبارك الختم والتثبيت التام! 🎉"; statsIcon.innerText = "🎉"; }
}

function handleCardColorChange(card, id) {
    if (!card.classList.contains('started') && !card.classList.contains('completed')) {
        card.className = 'surah-card started'; colorStates[id] = 'started';
    } else if (card.classList.contains('started')) {
        card.className = 'surah-card completed'; colorStates[id] = 'completed';
    } else {
        card.className = 'surah-card'; delete colorStates[id];
    }
    localStorage.setItem('quran_color_states', JSON.stringify(colorStates));
    updateMotivationalStats();
}

async function checkIndividualCardOfflineStatus(id, reciterId, badgeElement) {
    if (!badgeElement) return;
    const audioUrl = generateAudioUrl(reciterId, id);
    try {
        const cache = await caches.open(AUDIO_CACHE_NAME);
        const cachedResponse = await cache.match(audioUrl);
        badgeElement.style.display = cachedResponse ? 'inline' : 'none';
    } catch {
        badgeElement.style.display = 'none';
    }
}

function updateAllCardsOfflineBadges() {
    const currentReciter = reciterSelect ? reciterSelect.value : "islam";
    cachedCards.forEach(card => {
        const id = card.getAttribute('data-id');
        const badge = card.querySelector(`#offline-badge-${id}`);
        checkIndividualCardOfflineStatus(id, currentReciter, badge);
    });
}

function refreshExistingCardsUI() {
    const currentReciter = reciterSelect ? reciterSelect.value : "islam";
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
        checkIndividualCardOfflineStatus(id, currentReciter, offlineBadge);
    });
    updateMotivationalStats();
}

function renderSurahs() {
    if (!surahGrid) return;
    surahGrid.innerHTML = ''; cachedCards = [];
    const currentReciter = reciterSelect ? reciterSelect.value : "islam";
    const fragment = document.createDocumentFragment();
    
    surahsList.forEach((surah) => {
        const id = surah.id;
        const card = document.createElement('div');
        card.className = 'surah-card';
        card.setAttribute('data-id', id); card.setAttribute('data-name', surah.name);

        if (colorStates[id] === 'started') card.classList.add('started');
        if (colorStates[id] === 'completed') card.classList.add('completed');

        const hasProgress = progressData[id] ? 'has-progress' : '';
        card.innerHTML = `
            <div class="surah-info">
                <span class="surah-number">سورة رقم ${id}</span>
                <span class="surah-name">${surah.name} <span class="offline-ready-badge" id="offline-badge-${id}" style="display:none;">✔️</span></span>
                <span class="surah-meta-info">آياتها: ${surah.verses} • ${surah.type}</span>
            </div>
            <div class="card-status-badge ${hasProgress}" id="badge-${id}"></div>
        `;

        const badgeElement = card.querySelector(`#offline-badge-${id}`);
        checkIndividualCardOfflineStatus(id, currentReciter, badgeElement);

        card.addEventListener('click', () => selectSurah(id));
        card.addEventListener('contextmenu', (e) => { e.preventDefault(); handleCardColorChange(card, id); });

        // ✅ تحسين اللمس على iOS - تقليل زمن الاستجابة إلى 300ms
        let touchTimer;
        let touchStarted = false;
        
        card.addEventListener('touchstart', (e) => {
            touchStarted = true;
            touchTimer = setTimeout(() => { 
                if(touchStarted) {
                    handleCardColorChange(card, id);
                    if(window.navigator && window.navigator.vibrate) {
                        window.navigator.vibrate(30);
                    }
                }
            }, 300);
        }, { passive: true });
        
        card.addEventListener('touchend', () => {
            touchStarted = false;
            clearTimeout(touchTimer);
        }, { passive: true });
        
        card.addEventListener('touchcancel', () => {
            touchStarted = false;
            clearTimeout(touchTimer);
        }, { passive: true });

        fragment.appendChild(card); 
        cachedCards.push(card);
    });
    
    surahGrid.appendChild(fragment);
    updateMotivationalStats();
}

// ✅ تحسين البحث: البحث بالاسم أو الرقم مع دعم البحث الجزئي
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        cachedCards.forEach(card => {
            const name = card.getAttribute('data-name');
            const id = card.getAttribute('data-id');
            const matchesName = name.includes(query);
            const matchesId = id === query;
            const matchesNumber = query.length > 0 && id.toString().includes(query);
            card.style.display = (matchesName || matchesId || matchesNumber || query === '') ? '' : 'none';
        });
    });
}

// ✅ دالة حفظ موضع الآية الجديدة
function saveCurrentAyaPosition(surahId, ayaNumber) {
    if (isBlindTestMode) return; // لا نحفظ في وضع الاختبار
    const position = { surah: surahId, aya: ayaNumber, timestamp: Date.now() };
    localStorage.setItem('quran_last_position', JSON.stringify(position));
    lastPosition = position;
}

// ✅ دالة التمرير التلقائي إلى آخر آية
function scrollToLastAya() {
    if (!autoScrollEnabled || !lastPosition || lastPosition.surah !== currentSurahNumber) return;
    
    const targetAya = lastPosition.aya;
    const ayaElements = quranTextArea.querySelectorAll('.quran-item');
    
    if (ayaElements[targetAya - 1]) {
        setTimeout(() => {
            ayaElements[targetAya - 1].scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
            
            // تأثير بصري جميل
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

// ✅ تحديث دالة زر التحميل (إصلاح مشكلة التعطيل الأبدي)
let downloadHandlerInitialized = false;
const downloadBtn = document.getElementById('downloadOfflineBtn');

function updateDownloadButtonStatus(id) {
    if (!downloadBtn || !reciterSelect) return;
    const reciterId = reciterSelect.value;
    const audioUrl = generateAudioUrl(reciterId, id);
    
    caches.open(AUDIO_CACHE_NAME).then(cache => {
        cache.match(audioUrl).then(response => {
            if (response) {
                downloadBtn.classList.add('completed');
                downloadBtn.querySelector('.texto').innerText = 'تم التحميل';
                downloadBtn.disabled = true;
            } else {
                downloadBtn.classList.remove('completed');
                downloadBtn.querySelector('.texto').innerText = 'تحميل دون انترنت';
                downloadBtn.disabled = false;
            }
            downloadBtn.classList.remove('loading');
        });
    });

    if (!downloadHandlerInitialized) {
        downloadHandlerInitialized = true;
        downloadBtn.onclick = async (e) => {
            e.preventDefault();
            if (downloadBtn.disabled || downloadBtn.classList.contains('loading')) return;
            
            const currentAudioUrl = generateAudioUrl(reciterSelect.value, currentSurahNumber);
            
            downloadBtn.classList.add('loading');
            downloadBtn.disabled = true;
            
            try {
                const cache = await caches.open(AUDIO_CACHE_NAME);
                await cache.add(currentAudioUrl);
                showToast(`✅ تم حفظ سورة ${surahsList[currentSurahNumber - 1].name} أوفلاين بنجاح!`);
                updateAllCardsOfflineBadges();
                downloadBtn.classList.remove('loading');
                downloadBtn.classList.add('completed');
                downloadBtn.querySelector('.texto').innerText = 'تم التحميل';
                downloadBtn.disabled = true;
            } catch (error) {
                showToast(`❌ تعذر التحميل، تحقق من اتصال الشبكة.`);
                downloadBtn.classList.remove('loading');
                downloadBtn.classList.remove('completed');
                downloadBtn.querySelector('.texto').innerText = 'تحميل دون انترنت';
                downloadBtn.disabled = false;
            }
        };
    }
}

function selectSurah(id, isInitialLoad = false) {
    currentSurahNumber = id;
      warningShownForCurrentSurah = false;   // <--- أضف هذا السطر

    localStorage.setItem('quran_current_surah', id);
    
    if(surahGrid) surahGrid.style.display = 'none';
    if(searchContainer) searchContainer.style.display = 'none';
    if(statsContainer) statsContainer.style.display = 'none'; 
    if(playerSection) playerSection.style.display = 'block'; 
    
    isPlayerOpen = true;
    document.body.classList.add('player-active');
    if(currentPlayerSurah) currentPlayerSurah.innerText = "سورة " + surahsList[id - 1].name;

    // ✅ تحديث معلومات Media Session
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: `سورة ${surahsList[id - 1].name}`,
            artist: recitersConfig[currentReciterId]?.name || "قارئ القرآن",
            album: "مَـثَـانِـي الحِفظ والتدبُّر",
            artwork: []
        });
    }

    updateDownloadButtonStatus(id);
    updateAudioSource(!isInitialLoad); 
    loopCount = 0;
    fetchSurahText(id);
    updateTrackingUI(id);
    updateNavigationButtons(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateNavigationButtons(id) {
    if(prevSurahBtn) { prevSurahBtn.style.display = (id > 1) ? 'flex' : 'none'; if (id > 1) prevSurahName.innerText = surahsList[id - 2].name; }
    if(nextSurahBtn) { nextSurahBtn.style.display = (id < 114) ? 'flex' : 'none'; if (id < 114) nextSurahName.innerText = surahsList[id].name; }
}

if(prevSurahBtn) prevSurahBtn.addEventListener('click', () => { if (currentSurahNumber > 1) selectSurah(currentSurahNumber - 1); });
if(nextSurahBtn) nextSurahBtn.addEventListener('click', () => { if (currentSurahNumber < 114) selectSurah(currentSurahNumber + 1); });

if(closePlayerBtn) {
    closePlayerBtn.addEventListener('click', () => {
        if(audioPlayer) { audioPlayer.pause(); audioPlayer.src = ""; }
        if(playerSection) playerSection.style.display = 'none';
        if(surahGrid) surahGrid.style.display = 'grid';
        if(searchContainer) searchContainer.style.display = 'block';
        if(statsContainer) statsContainer.style.display = 'flex'; 
        
        const focusModeToggle = document.getElementById('focusModeToggle');
        if (focusModeToggle) {
            focusModeToggle.checked = false;
            localStorage.setItem('quran_focus_mode', false);
            document.body.classList.remove('focus-mode-active');
        }

        isPlayerOpen = false;
        document.body.classList.remove('player-active');
        localStorage.removeItem('quran_current_surah');
        refreshExistingCardsUI();
    });
}

async function updateAudioSource(triggerPlay = false) {
    if(!audioPlayer || !reciterSelect) return;
    const reciterId = reciterSelect.value;
    currentReciterId = reciterId;
    localStorage.setItem('quran_current_reciter', reciterId);
    
    audioPlayer.pause();
    audioPlayer.src = generateAudioUrl(reciterId, currentSurahNumber);
    audioPlayer.load();

    if ('mediaSession' in navigator && navigator.mediaSession.metadata) {
        navigator.mediaSession.metadata.artist = recitersConfig[reciterId]?.name || "قارئ القرآن";
    }

    if (triggerPlay) {
        audioPlayer.play().catch(() => console.log("بانتظار تفاعل المستخدم لبدء الصوت."));
    }
}

if(audioPlayer) {
    audioPlayer.onended = function() {
        const loopMode = loopSelect ? loopSelect.value : 'none';
        if (loopMode === '3') {
            loopCount++;
            if (loopCount < 3) {
                audioPlayer.currentTime = 0; audioPlayer.play().catch(err => console.log(err));
            } else {
                loopCount = 0; if (currentSurahNumber < 114) selectSurah(currentSurahNumber + 1);
            }
        } else if (loopMode === 'infinite') {
            audioPlayer.currentTime = 0; audioPlayer.play().catch(err => console.log(err));
        } else {
            if (currentSurahNumber < 114) selectSurah(currentSurahNumber + 1);
        }
    };
}

function applyBlindTestUI() {
    if(testModeToggle) testModeToggle.checked = isBlindTestMode;
    if(quranTextArea) quranTextArea.classList.toggle('blind-test-mode', isBlindTestMode);
}

if(testModeToggle) {
    testModeToggle.addEventListener('change', (e) => {
        isBlindTestMode = e.target.checked;
        localStorage.setItem('quran_blind_test', isBlindTestMode);
        if(quranTextArea) quranTextArea.classList.toggle('blind-test-mode', isBlindTestMode);
        showToast(isBlindTestMode ? "👁️ تم تفعيل وضع الاختبار وعزل الكلمات" : "👁️ تم إلغاء وضع الاختبار وإظهار النص");
    });
}

const revealItem = (e) => { 
    const item = e.target.closest('.quran-item'); 
    if (item && isBlindTestMode) item.classList.add('revealed'); 
};
const hideItem = () => { 
    if (quranTextArea) {
        quranTextArea.querySelectorAll('.quran-item.revealed').forEach(item => item.classList.remove('revealed'));
    }
};

if(quranTextArea) {
    quranTextArea.addEventListener('mousedown', revealItem); 
    quranTextArea.addEventListener('mouseup', hideItem); 
    quranTextArea.addEventListener('mouseleave', hideItem);
    quranTextArea.addEventListener('touchstart', revealItem, { passive: true }); 
    quranTextArea.addEventListener('touchend', hideItem, { passive: true });
}

async function fetchSurahText(id) {
    if(!quranTextArea) return;
    if (apiAbortController) { apiAbortController.abort(); }
    apiAbortController = new AbortController();
    const signal = apiAbortController.signal;

    quranTextArea.innerHTML = '<span class="loading-text">جاري تحميل الآيات بالرسم العثماني...</span>';
    try {
        const response = await fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${id}`, { signal });
        const data = await response.json();
        if (data && data.verses) {
            let htmlContent = '';
            if (id !== 1 && id !== 9) {
                htmlContent += '<div class="basmala">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>';
            }
            data.verses.forEach((verse, idx) => {
                const ayaNum = verse.verse_key.split(':')[1];
                htmlContent += `<span class="quran-item" data-aya-index="${idx + 1}">${verse.text_uthmani} <span class="aya-num">﴿${ayaNum}﴾</span></span> `;
            });
            quranTextArea.innerHTML = htmlContent;
            applyBlindTestUI();
            
            // ✅ إضافة مستمعي الأحداث للآيات (خاصية تذكر الموضع + تحذير الاختبار مرة واحدة)
const ayaElements = quranTextArea.querySelectorAll('.quran-item');
ayaElements.forEach((element, idx) => {
    element.style.cursor = 'pointer';
    
    // النقر العادي: تثبيت الموضع (أو إظهار تحذير الاختبار مرة واحدة)
    element.addEventListener('click', (e) => {
        e.stopPropagation();
        
        if (isBlindTestMode) {
            // إظهار التحذير مرة واحدة فقط لكل سورة
            if (!warningShownForCurrentSurah) {
                showToast("👁️ في وضع الاختبار، اضغط مطولاً لإظهار الآية");
                warningShownForCurrentSurah = true;
            }
            return;
        }
        
        const ayaNumber = idx + 1;
        saveCurrentAyaPosition(currentSurahNumber, ayaNumber);
        showToast(`📌 تم تثبيت الموضع عند الآية ${ayaNumber}`);
        
        element.style.transition = 'all 0.3s';
        element.style.backgroundColor = 'var(--accent-glow)';
        setTimeout(() => {
            element.style.backgroundColor = '';
        }, 500);
    });
    
    // الضغط المطول (كليك يمين): كشف الآية في وضع الاختبار
    element.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (isBlindTestMode) {
            element.classList.add('revealed');
            setTimeout(() => {
                element.classList.remove('revealed');
            }, 1000);
        }
    });
    
    // اللمس الطويل (للهواتف)
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
    
    element.addEventListener('touchend', () => {
        clearTimeout(touchTimer);
    });
});
            
            // ✅ التمرير إلى آخر آية محفوظة (إذا كانت السورة هي نفسها)
            scrollToLastAya();
        }
    } catch (error) {
        if (error.name !== 'AbortError') {
            quranTextArea.innerHTML = 'تعذر جلب النص القرآني، يرجى التحقق من الاتصال.';
        }
    }
}

function updateTrackingUI(id) {
    if(!trackingOptions) return;
    const savedLevel = progressData[id] || null;
    trackingOptions.querySelectorAll('.track-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-level') === savedLevel);
    });
}

if(trackingOptions) {
    trackingOptions.addEventListener('click', (e) => {
        if (!e.target.classList.contains('track-btn')) return;
        const clickedBtn = e.target;
        const level = clickedBtn.getAttribute('data-level');

        if (clickedBtn.classList.contains('active')) {
            clickedBtn.classList.remove('active'); delete progressData[currentSurahNumber];
        } else {
            trackingOptions.querySelectorAll('.track-btn').forEach(b => b.classList.remove('active'));
            clickedBtn.classList.add('active'); progressData[currentSurahNumber] = level;
        }
        localStorage.setItem('quran_progress_tracker', JSON.stringify(progressData));
        updateMotivationalStats();
    });
}

if(reciterSelect) {
    reciterSelect.addEventListener('change', () => { 
        updateAudioSource(true); 
        updateDownloadButtonStatus(currentSurahNumber);
    });
}
function showBottomTip() {
    const tipShown = localStorage.getItem('mathani_bottom_tip_shown');
    if (tipShown) return;
    
    // نصيحة عشوائية أو ثابتة
    const tips = [
        "💡 جرب وضع الاختبار (العين) لاختبار حفظك",
        "📲 يمكنك تثبيت التطبيق على شاشة هاتفك الرئيسية لاستخدام أسرع",
        "🎨 غيّر المظهر من زر الإعدادات ⚙️، هناك 4 ثيمات جميلة",
        "🤲 لا تنسنا من صالح دعائك، جزاك الله خيراً"
    ];
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    
    // استخدام الـ toast الموجود
    showToast(randomTip);
    localStorage.setItem('mathani_bottom_tip_shown', 'true');
}
// ========================
// PWA Install Prompt (يدعم جميع الأجهزة)
// ========================
let deferredPrompt;
const pwaContainer = document.getElementById('pwaInstallContainer');
const installBtn = document.getElementById('installPwaBtn');

// التحقق مما إذا كان التطبيق مثبتاً بالفعل (لنظام iOS والعادي)
function isAppInstalled() {
    // في iOS و Android إذا كان التطبيق مفتوحاً في وضع standalone
    if (window.matchMedia('(display-mode: standalone)').matches) {
        return true;
    }
    // للهواتف التي تدعم قبل beforeinstallprompt (نفحص لو كان التطبيق مثبتاً عبر localStorage اختياري)
    // هنا نعتمد على أننا لن نعرض الزر إذا كان display-mode standalone
    return false;
}

// إظهار الحاوية فقط إذا لم يكن التطبيق مثبتاً
if (!isAppInstalled()) {
    // حدث beforeinstallprompt للأجهزة التي تدعمه (Android/Chrome)
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (pwaContainer) pwaContainer.style.display = 'block';
        showToast("📲 يمكنك تثبيت التطبيق على جهازك بالضغط على الزر الظاهر في اليسار");
    });
    
    // للأجهزة التي لا تدعم beforeinstallprompt (iOS Safari) نعرض الزر مباشرة (مع توجيه المستخدم)
    // نفحص إذا كان المتصفح هو Safari على iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS && !isAppInstalled()) {
        if (pwaContainer) pwaContainer.style.display = 'block';
        // تعديل النص ليتناسب مع iOS
        if (installBtn) {
            installBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg><span>تثبيت (شارك ← أضف للشاشة)</span>`;
        }
    }
} else {
    // إذا كان مثبتاً، نخفي الحاوية تماماً
    if (pwaContainer) pwaContainer.style.display = 'none';
}

// عند الضغط على زر التثبيت
if (installBtn) {
    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            // الحالة العادية (Android / Chrome)
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                showToast("✅ تم تثبيت التطبيق بنجاح! ستجده على شاشتك الرئيسية");
                // إخفاء الزر بعد التثبيت
                if (pwaContainer) pwaContainer.style.display = 'none';
            } else {
                showToast("👍 يمكنك التثبيت لاحقاً من قائمة المتصفح");
            }
            deferredPrompt = null;
        } else {
            // حالة iOS: نوجه المستخدم إلى الطريقة اليدوية
            showToast("في iOS، اضغط على 'مشاركة' ثم 'إضافة إلى الشاشة الرئيسية'");
        }
    });
}
// Tutorial Popup - يظهر مرة واحدة فقط
const tutorialPopup = document.getElementById('tutorialPopup');
const tutorialShown = localStorage.getItem('mathani_tutorial_shown');

if (tutorialPopup && !tutorialShown) {
    setTimeout(() => {
        tutorialPopup.classList.add('active');
    }, 500);
}

// إغلاق tutorial
const closeTutorial = document.getElementById('closeTutorial');
const remindLater = document.getElementById('remindLater');

if (closeTutorial) {
    closeTutorial.addEventListener('click', () => {
        tutorialPopup.classList.remove('active');
        localStorage.setItem('mathani_tutorial_shown', 'true');
        showToast("🎉 رحلة ممتعة مع القرآن!");
        
        // عرض نصيحة إضافية بعد ثانية من إغلاق التوتوريال
        setTimeout(() => {
            showBottomTip();
        }, 1000);
    });
}

if (remindLater) {
    remindLater.addEventListener('click', () => {
        tutorialPopup.classList.remove('active');
        showToast("📖 ستظهر لك الجولة مرة أخرى قريباً");
    });
}
// إخفاء شاشة البداية بعد تحميل المحتوى بالكامل
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