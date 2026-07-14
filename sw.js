// ============================================================
// Service Worker لتطبيق "مَثَانِي" - يعمل بدون إنترنت بالكامل
// الإصدار النهائي v5.0 (يتحمّل الملفات الكبيرة ويعمل على جميع المتصفحات)
// ============================================================

const CACHE_NAME = 'mathani-static-v5';
const AUDIO_CACHE_NAME = 'mathani-audio-v5';

// ===== الملفات الأساسية (يجب تخزينها عند التثبيت) =====
const CORE_ASSETS = [
  './',
  'index.html',
  'offline.html',
  '404.html',
  'style.css',
  'animations.css',
  'recorder-ui.css',
  'constants.js',
  'dataManager.js',
  'progressTracker.js',
  'uiCore.js',
  'quranDisplay.js',
  'audioPlayer.js',
  'recorder.js',
  'pwa.js',
  'tutorial.js',
  'main.js',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'favicon.png'
  // تم استبعاد quran-uthmani.json وملف الخط لتجنب فشل التثبيت (سيتم تخزينهما عند الطلب)
];

// ===== تثبيت الـ Service Worker =====
self.addEventListener('install', (event) => {
  console.log('🔧 جاري تثبيت Service Worker الإصدار v5.0...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        console.log('⏳ جاري تخزين الملفات الأساسية...');
        // استخدام Promise.allSettled لضمان عدم فشل التثبيت بسبب ملف واحد
        const results = await Promise.allSettled(
          CORE_ASSETS.map(async (url) => {
            try {
              const response = await fetch(url);
              if (response && response.status === 200) {
                await cache.put(url, response);
                console.log(`✅ تم تخزين: ${url}`);
              } else {
                console.warn(`⚠️ الملف غير متاح (سيُطلب لاحقاً): ${url}`);
              }
            } catch (error) {
              console.warn(`⚠️ فشل تخزين (سيُطلب لاحقاً): ${url}`, error);
            }
          })
        );
        const failed = results.filter(r => r.status === 'rejected');
        if (failed.length > 0) {
          console.warn(`⚠️ فشل تخزين ${failed.length} ملفات، لكن التثبيت مستمر.`);
        } else {
          console.log('✅ تم تخزين جميع الملفات الأساسية بنجاح!');
        }
      })
      .catch((error) => {
        console.error('❌ خطأ أثناء فتح الكاش:', error);
      })
  );
  self.skipWaiting(); // تفعيل الـ SW فوراً
});

// ===== تفعيل وحذف الكاش القديم =====
self.addEventListener('activate', (event) => {
  const cacheAllowlist = [CACHE_NAME, AUDIO_CACHE_NAME];
  console.log('🔧 جاري تفعيل Service Worker وحذف الكاش القديم...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheAllowlist.includes(cacheName)) {
            console.log(`🧹 حذف الكاش القديم: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ تم حذف الكاش القديم، SW جاهز للاستخدام.');
      return self.clients.claim(); // السيطرة على الصفحات فوراً
    })
  );
});

// ===== دالة معالجة طلبات Range (لتشغيل الصوت على iOS) =====
async function returnRangeResponse(request, cachedResponse) {
  if (!cachedResponse || !cachedResponse.body) {
    throw new Error('Invalid cached response');
  }
  
  const arrayBuffer = await cachedResponse.arrayBuffer();
  const rangeHeader = request.headers.get('range');
  const match = rangeHeader?.match(/^bytes=(\d+)-(\d*)$/);
  
  if (match) {
    const start = parseInt(match[1], 10);
    const end = match[2] ? parseInt(match[2], 10) : arrayBuffer.byteLength - 1;
    
    const rangeBlob = new Blob([arrayBuffer.slice(start, end + 1)], { type: 'audio/mp3' });
    return new Response(rangeBlob, {
      status: 206,
      statusText: 'Partial Content',
      headers: {
        'Content-Type': 'audio/mp3',
        'Content-Range': `bytes ${start}-${end}/${arrayBuffer.byteLength}`,
        'Content-Length': rangeBlob.size
      }
    });
  }
  return cachedResponse;
}

// ===== معالجة جميع الطلبات =====
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1️⃣ الصوتيات (MP3): Network First + Cache Fallback + دعم Range
  if (url.pathname.endsWith('.mp3')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(AUDIO_CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) {
            if (event.request.headers.get('range')) {
              return returnRangeResponse(event.request, cached);
            }
            return cached;
          }
          return new Response('⚠️ الصوت غير متاح حالياً', { status: 503 });
        })
    );
    return;
  }

  // 2️⃣ ملفات JSON والخطوط (ثقيلة): Cache First (تُخزّن عند الطلب الأول)
  if (url.pathname.endsWith('.json') || url.pathname.endsWith('.otf')) {
    event.respondWith(
      caches.match(event.request)
        .then((cached) => {
          if (cached) {
            console.log(`✅ من الكاش: ${url.pathname}`);
            return cached;
          }
          return fetch(event.request)
            .then((response) => {
              if (response && response.status === 200) {
                const clone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, clone);
                  console.log(`✅ تم تخزين في الكاش: ${url.pathname}`);
                });
              }
              return response;
            })
            .catch(() => {
              return new Response('⚠️ المورد غير متاح', { status: 404 });
            });
        })
    );
    return;
  }

  // 3️⃣ باقي الملفات (HTML, CSS, JS, صور): Cache First
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, clone);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // إذا كان الطلب لصفحة (Navigation)، نقدم offline.html
            if (event.request.mode === 'navigate') {
              return caches.match('offline.html')
                .then(offlineResponse => offlineResponse || caches.match('index.html'));
            }
            return new Response('⚠️ تعذر تحميل المورد', { status: 404 });
          });
      })
  );
});

// ===== تسجيل نجاح التثبيت =====
console.log('✅ Service Worker v5.0 جاهز للعمل دون إنترنت!');