// ============================================================
// 🛠️ sw.js - Service Worker لتطبيق مَثَانِي
// الإصدار المُحسَّن: تخزين ديناميكي لسور القرآن (فردي) من alquran.cloud
// ============================================================

// -----------------------------------------------------------
// 1. إدارة الإصدارات (Cache Versioning)
// -----------------------------------------------------------
const CACHE_VERSION = 'v2'; // غيّر الرقم لتحديث الكاش
const STATIC_CACHE = `${CACHE_VERSION}-quran-app-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-quran-app-dynamic`;
const QURAN_API_CACHE = `${CACHE_VERSION}-quran-api-cache`; // كاش خاص بالسور

// اسم صفحة عدم الاتصال التي ستظهر عند فقدان الإنترنت
const OFFLINE_PAGE = 'offline.html';

// -----------------------------------------------------------
// 2. قائمة الملفات الأساسية (بدون quran-uthmani.json)
// -----------------------------------------------------------
const PRECACHE_ASSETS = [
    '/',
    'index.html',
    'offline.html',
    '404.html',
    'style.css',
    'animations.css',
    'recorder-ui.css',
    'main.js',
    'audioPlayer.js',
    'constants.js',
    'dataManager.js',
    'progressTracker.js',
    'pwa.js',
    'quranDisplay.js',
    'recorder.js',
    'tutorial.js',
    'uiCore.js',
    // تم إزالة 'quran-uthmani.json' من هنا
    'KFGQPC Uthmanic Script HAFS Regular.otf',
    'favicon.png',
    'icon-192.png',
    'icon-512.png',
    'manifest.json'
];

// أنواع الملفات الثابتة: Cache First
const STATIC_EXTENSIONS = ['.css', '.otf', '.ttf', '.woff', '.woff2', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.gif'];

// أنواع الملفات التي تحتاج تحديث: Stale-While-Revalidate
const SWR_EXTENSIONS = ['.js', '.json'];

// -----------------------------------------------------------
// 3. دوال مساعدة للتحقق من نوع الطلب
// -----------------------------------------------------------
function isStaticAsset(url) {
    return STATIC_EXTENSIONS.some((ext) => url.pathname.endsWith(ext));
}

function isSwrAsset(url) {
    return SWR_EXTENSIONS.some((ext) => url.pathname.endsWith(ext));
}

function isHtmlRequest(request) {
    return request.mode === 'navigate' ||
        (request.headers.get('accept') && request.headers.get('accept').includes('text/html'));
}

// ✅ دالة للتحقق من طلب API لسورة فردية
function isQuranSurahApiRequest(url) {
    return url.hostname === 'alquran.cloud' &&
           url.pathname.startsWith('/api/surah/') &&
           /^\/api\/surah\/\d+$/.test(url.pathname);
}

// -----------------------------------------------------------
// 4. أحداث التثبيت والتفعيل
// -----------------------------------------------------------
self.addEventListener('install', (event) => {
    console.log('⚙️ [SW] جاري التثبيت...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('📦 [SW] تخزين الملفات الأساسية مسبقاً');
                return Promise.all(
                    PRECACHE_ASSETS.map((url) =>
                        cache.add(url).catch((err) =>
                            console.warn(`⚠️ [SW] تعذر تخزين الملف: ${url}`, err)
                        )
                    )
                );
            })
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    console.log('⚙️ [SW] جاري التفعيل...');
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== STATIC_CACHE &&
                                         name !== DYNAMIC_CACHE &&
                                         name !== QURAN_API_CACHE)
                        .map((name) => {
                            console.log(`🗑️ [SW] حذف كاش قديم: ${name}`);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// -----------------------------------------------------------
// 5. استراتيجية Stale-While-Revalidate لطلبات API للسور
// -----------------------------------------------------------
async function staleWhileRevalidateForQuran(request) {
    const cache = await caches.open(QURAN_API_CACHE);
    const cachedResponse = await cache.match(request);

    const networkFetch = fetch(request)
        .then((res) => {
            if (res && res.ok) {
                cache.put(request, res.clone());
            }
            return res;
        })
        .catch(() => null);

    if (cachedResponse) {
        networkFetch.catch(() => {});
        return cachedResponse;
    }

    const networkResponse = await networkFetch;
    if (networkResponse) return networkResponse;

    // لا يوجد اتصال ولا نسخة مخزنة
    return new Response(
        JSON.stringify({ error: 'السورة غير متاحة حالياً' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
}

// -----------------------------------------------------------
// 6. استراتيجيات أخرى (Cache First, Stale-While-Revalidate)
// -----------------------------------------------------------
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;
    try {
        const networkResponse = await fetch(request);
        const cache = await caches.open(DYNAMIC_CACHE);
        cache.put(request, networkResponse.clone());
        return networkResponse;
    } catch (error) {
        throw error;
    }
}

async function staleWhileRevalidate(request) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    const networkFetch = fetch(request)
        .then((res) => {
            if (res && res.ok) {
                cache.put(request, res.clone());
            }
            return res;
        })
        .catch(() => null);
    if (cachedResponse) {
        networkFetch.catch(() => {});
        return cachedResponse;
    }
    const networkResponse = await networkFetch;
    if (networkResponse) return networkResponse;
    throw new Error('تعذر جلب الملف');
}

async function handleHtmlRequest(request) {
    try {
        const networkResponse = await fetch(request);
        const cache = await caches.open(DYNAMIC_CACHE);
        cache.put(request, networkResponse.clone());
        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) return cachedResponse;
        const offlineResponse = await caches.match(OFFLINE_PAGE);
        if (offlineResponse) return offlineResponse;
        return new Response(
            '<h1>غير متصل بالإنترنت</h1><p>يرجى التحقق من اتصالك.</p>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
    }
}

// -----------------------------------------------------------
// 7. حدث الجلب (Fetch) - نقطة التحكم الرئيسية
// -----------------------------------------------------------
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    if (request.method !== 'GET') return;

    // طلبات API للسور من alquran.cloud
    if (isQuranSurahApiRequest(url)) {
        event.respondWith(staleWhileRevalidateForQuran(request));
        return;
    }

    // الطلبات من نطاقات أخرى (مثل الصوتيات) نتركها تمر
    if (url.origin !== self.location.origin) {
        return;
    }

    // طلبات HTML
    if (isHtmlRequest(request)) {
        event.respondWith(handleHtmlRequest(request));
        return;
    }

    // الملفات الثابتة
    if (isStaticAsset(url)) {
        event.respondWith(cacheFirst(request));
        return;
    }

    // ملفات JS و JSON
    if (isSwrAsset(url)) {
        event.respondWith(staleWhileRevalidate(request));
        return;
    }

    // أي طلب آخر
    event.respondWith(
        fetch(request)
            .then((networkResponse) => {
                const cache = caches.open(DYNAMIC_CACHE);
                cache.then(c => c.put(request, networkResponse.clone()));
                return networkResponse;
            })
            .catch(() => caches.match(request))
    );
});

// -----------------------------------------------------------
// 8. رسائل لتحديث السيرفس ووركر
// -----------------------------------------------------------
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});