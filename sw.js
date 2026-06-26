const CACHE_NAME = 'mathani-quran-v1';
const AUDIO_CACHE_NAME = 'mathani-audio-v1';

// الأسماء الصحيحة للملفات الأساسية
const ASSETS_TO_CACHE = [
  './',
  'index.html',
  'style.css',
  'script.js',
  'manifest.json',
  'icon-192.png',
  'icon-512.png'
];

// === التثبيت ===
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('✅ تم حفظ ملفات تطبيق مثاني بنجاح! 📦');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// === التنشيط ===
self.addEventListener('activate', (event) => {
  const cacheAllowlist = [CACHE_NAME, AUDIO_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (!cacheAllowlist.includes(cache)) {
            console.log('🧹 تطهير الكاش القديم:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// === وظيفة مساعدة لمعرفة إذا كان الطلب يدعم Range ===
function isRangeRequest(request) {
  return request.headers.get('range') !== null;
}

// === دالة معالجة Range Requests للملفات المخزنة (لتوافق iOS) ===
async function returnRangeResponse(request, cachedResponse) {
  if (!cachedResponse || !cachedResponse.body) {
    throw new Error('Invalid cached response');
  }
  
  const arrayBuffer = await cachedResponse.arrayBuffer();
  const rangeHeader = request.headers.get('range');
  const match = rangeHeader.match(/^bytes=(\d+)-(\d*)$/);
  
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

// === معالجة جميع الطلبات ===
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // ========================
  // استراتيجية ملفات الصوت MP3 (ذكية وآمنة لـ iOS)
  // ========================
  if (requestUrl.pathname.endsWith('.mp3')) {
    event.respondWith(
      caches.open(AUDIO_CACHE_NAME).then(async (cache) => {
        // 1️⃣ حاول جلب الاستجابة من الكاش أولاً
        const cachedResponse = await cache.match(event.request);
        
        if (cachedResponse) {
          // ✅ موجود في الكاش
          if (isRangeRequest(event.request)) {
            try {
              return await returnRangeResponse(event.request, cachedResponse);
            } catch (error) {
              console.error('❌ فشل معالجة Range Request من الكاش', error);
              return cachedResponse; // fallback للاستجابة الكاملة
            }
          }
          return cachedResponse;
        }
        
        // 2️⃣ غير موجود في الكاش → نحاول الجلب من الشبكة
        //    (محاولة CORS أولاً، ثم no-cors مع عدم الحفظ)
        try {
          // المحاولة الأولى: وضع CORS (نستطيع حفظها إذا نجحت)
          const corsResponse = await fetch(event.request, {
            mode: 'cors',
            credentials: 'omit'
          });
          
          if (corsResponse && corsResponse.status === 200) {
            // حفظ نسخة في الكاش للاستخدام الأوفلاين لاحقاً
            const responseToCache = corsResponse.clone();
            cache.put(event.request, responseToCache);
            return corsResponse;
          }
        } catch (corsError) {
          console.warn('⚠️ فشل جلب الصوت بوضع CORS (طبيعي لبعض الخوادم)، ننتقل لوضع no-cors');
        }
        
        // 3️⃣ المحاولة الثانية: وضع no-cors (لا يمكن حفظها، لكن تشتغل مباشرة)
        try {
          const noCorsResponse = await fetch(event.request, {
            mode: 'no-cors',
            credentials: 'omit'
          });
          // لا نحفظ الـ opaque response في الكاش (لأنها لن تدعم Range على iOS)
          // لكن نرجعها لتشغيل الصوت أونلاين بدون مشاكل
          return noCorsResponse;
        } catch (networkError) {
          console.error('❌ فشل جلب الصوت من الشبكة تماماً:', networkError);
          return new Response("⚠️ لا يمكن تشغيل الصوت الآن، يرجى التحقق من الاتصال.", { status: 503 });
        }
      })
    );
    return;
  }

  // ========================
  // ملفات API (quran.com) - نصوص الآيات
  // ========================
  if (requestUrl.host.includes('quran.com')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        }).catch(() => {
          return new Response("⚠️ النص القرآني غير متوفر أوفلاين بعد، يرجى الاتصال بالإنترنت أول مرة.", { status: 503 });
        });
      })
    );
    return;
  }

  // ========================
  // باقي الملفات (HTML, CSS, JS, الصور)
  // ========================
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});