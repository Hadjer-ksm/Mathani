// ============================================================
// 📲 pwa.js - إدارة تثبيت تطبيق مَثَانِي (PWA)
// يشمل: زر التثبيت، مراقبة حالة التثبيت، دعم iOS
// ============================================================

// ----- الاستيرادات -----
import { showToast } from './uiCore.js';

// =====================================================================
// 1. المتغيرات العامة
// =====================================================================
let deferredPrompt = null;
let pwaContainer = null;
let installBtn = null;

// =====================================================================
// 2. التحقق من تثبيت التطبيق
// =====================================================================
export function isAppInstalled() {
    // وضع العرض المستقل (standalone) يعني أن التطبيق مثبت
    if (window.matchMedia('(display-mode: standalone)').matches) {
        return true;
    }
    // على iOS، يمكن التحقق عبر navigator.standalone
    if (window.navigator.standalone === true) {
        return true;
    }
    return false;
}

// =====================================================================
// 3. تهيئة عناصر PWA
// =====================================================================
function cachePwaElements() {
    pwaContainer = document.getElementById('pwaInstallContainer');
    installBtn = document.getElementById('installPwaBtn');
}

// =====================================================================
// 4. إعداد زر التثبيت (لـ Android / Chrome)
// =====================================================================
export function setupPwaInstall() {
    cachePwaElements();

    // إذا كان التطبيق مثبتاً بالفعل، نخفي الزر
    if (isAppInstalled()) {
        if (pwaContainer) pwaContainer.style.display = 'none';
        return;
    }

    // الاستماع لحدث beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (pwaContainer) {
            pwaContainer.style.display = 'block';
        }
        // عرض إشعار للمستخدم
        showToast('📲 يمكنك تثبيت التطبيق على جهازك بالضغط على الزر الظاهر');
    });

    // ربط حدث النقر على زر التثبيت
    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                // عرض نافذة التثبيت الرسمية
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    showToast('✅ تم تثبيت التطبيق بنجاح! ستجده على شاشتك الرئيسية');
                    if (pwaContainer) pwaContainer.style.display = 'none';
                } else {
                    showToast('👍 يمكنك التثبيت لاحقاً من قائمة المتصفح');
                }
                deferredPrompt = null;
            } else {
                // في حال لم يظهر beforeinstallprompt (مثل iOS)
                showToast('📲 في iOS، اضغط على "مشاركة" ثم "إضافة إلى الشاشة الرئيسية"');
            }
        });
    }

    // مراقبة تغيير وضع العرض (إذا تم التثبيت لاحقاً)
    window.matchMedia('(display-mode: standalone)').addEventListener('change', (evt) => {
        if (evt.matches) {
            // تم التثبيت
            if (pwaContainer) pwaContainer.style.display = 'none';
            showToast('🎉 شكراً لتثبيت تطبيق مَثَانِي!');
        }
    });
}

// =====================================================================
// 5. دعم iOS (عرض تعليمات التثبيت)
// =====================================================================
export function setupIosPwaSupport() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    if (isIOS && !isAppInstalled()) {
        // تعديل زر التثبيت ليعرض تعليمات iOS
        if (installBtn) {
            installBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 5v14M5 12h14"/>
                </svg>
                <span>تثبيت (شارك ← أضف للشاشة)</span>
            `;
        }
        if (pwaContainer) {
            pwaContainer.style.display = 'block';
        }
        // عرض تلميح للمستخدمين الجدد
        setTimeout(() => {
            showToast('📲 لتثبيت التطبيق: اضغط "مشاركة" ثم "أضف للشاشة الرئيسية"');
        }, 3000);
    }
}

// =====================================================================
// 6. دالة التهيئة الشاملة
// =====================================================================
export function initPwa() {
    // تخزين المراجع
    cachePwaElements();

    // إعداد التثبيت للأندرويد والكروم
    setupPwaInstall();

    // إعداد دعم iOS
    setupIosPwaSupport();

    console.log('✅ تم تهيئة نظام PWA');
}

// =====================================================================
// 7. دوال مساعدة للاستخدام من خارج الملف
// =====================================================================

/**
 * إظهار زر التثبيت يدوياً (في حال الحاجة)
 */
export function showInstallButton() {
    if (pwaContainer) {
        pwaContainer.style.display = 'block';
    }
}

/**
 * إخفاء زر التثبيت يدوياً
 */
export function hideInstallButton() {
    if (pwaContainer) {
        pwaContainer.style.display = 'none';
    }
}

/**
 * التحقق من وجود زر التثبيت
 */
export function isInstallButtonVisible() {
    return pwaContainer && pwaContainer.style.display !== 'none';
}