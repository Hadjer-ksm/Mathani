// ============================================================
// 🎓 tutorial.js - الجولة التعريفية والنصائح لتطبيق مَثَانِي
// يشمل: نافذة الترحيب، النصائح الذكية، التذكيرات
// ============================================================

// ----- الاستيرادات -----
import { showToast } from './uiCore.js';

// =====================================================================
// 1. المتغيرات العامة
// =====================================================================
let tutorialPopup = null;
let closeTutorialBtn = null;
let remindLaterBtn = null;

// =====================================================================
// 2. تهيئة عناصر الجولة التعريفية
// =====================================================================
function cacheTutorialElements() {
    tutorialPopup = document.getElementById('tutorialPopup');
    closeTutorialBtn = document.getElementById('closeTutorial');
    remindLaterBtn = document.getElementById('remindLater');
}

// =====================================================================
// 3. عرض الجولة التعريفية (مرة واحدة فقط)
// =====================================================================
export function showTutorial() {
    const tutorialShown = localStorage.getItem('mathani_tutorial_shown');

    // إذا ظهرت الجولة سابقاً، لا نعرضها
    if (tutorialShown) {
        // لكن قد نعرض نصائح متأخرة
        setTimeout(() => {
            showBottomTip();
        }, 2000);
        return;
    }

    // نعرض الجولة بعد نصف ثانية من تحميل الصفحة
    if (tutorialPopup) {
        setTimeout(() => {
            tutorialPopup.classList.add('active');
        }, 500);
    }
}

// =====================================================================
// 4. إغلاق الجولة
// =====================================================================
export function closeTutorial() {
    if (tutorialPopup) {
        tutorialPopup.classList.remove('active');
    }
    // حفظ أن الجولة ظهرت
    localStorage.setItem('mathani_tutorial_shown', 'true');

    // عرض تحية
    showToast('🎉 رحلة ممتعة مع القرآن!');

    // عرض نصائح إضافية بعد قليل
    setTimeout(() => {
        showBottomTip();
    }, 1000);
}

// =====================================================================
// 5. تذكير لاحق (إغلاق مؤقت)
// =====================================================================
export function remindLater() {
    if (tutorialPopup) {
        tutorialPopup.classList.remove('active');
    }
    // لا نحفظ أن الجولة ظهرت، لذا ستظهر مرة أخرى في الجلسة القادمة
    showToast('📖 ستظهر لك الجولة مرة أخرى قريباً');
}

// =====================================================================
// 6. ربط أحداث أزرار الجولة
// =====================================================================
export function bindTutorialEvents() {
    if (closeTutorialBtn) {
        closeTutorialBtn.addEventListener('click', closeTutorial);
    }
    if (remindLaterBtn) {
        remindLaterBtn.addEventListener('click', remindLater);
    }
}

// =====================================================================
// 7. نصائح ذكية تظهر بعد الاستخدام
// =====================================================================
export function showBottomTip() {
    const tipShown = localStorage.getItem('mathani_bottom_tip_shown');
    if (tipShown) return;

    const tips = [
        "💡 جرب وضع الاختبار (العين) لاختبار حفظك",
        "📲 يمكنك تثبيت التطبيق على شاشة هاتفك الرئيسية لاستخدام أسرع",
        "🎨 غيّر المظهر من زر الإعدادات ⚙️، هناك 4 ثيمات جميلة",
        "🎤 سجّل تلاوتك وقارنها مع الشيخ لتطوير أدائك",
        "🤲 لا تنسنا من صالح دعائك، جزاك الله خيراً"
    ];

    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    showToast(randomTip);
    localStorage.setItem('mathani_bottom_tip_shown', 'true');
}

// =====================================================================
// 8. دالة التهيئة الشاملة
// =====================================================================
export function initTutorial() {
    // تخزين المراجع
    cacheTutorialElements();

    // ربط الأحداث
    bindTutorialEvents();

    // عرض الجولة
    showTutorial();

    console.log('✅ تم تهيئة نظام الجولة التعريفية');
}

// =====================================================================
// 9. دوال مساعدة للاستخدام من خارج الملف
// =====================================================================

/**
 * إعادة تعيين حالة الجولة (للمطورين أو للاختبار)
 */
export function resetTutorial() {
    localStorage.removeItem('mathani_tutorial_shown');
    localStorage.removeItem('mathani_bottom_tip_shown');
    showToast('🔄 تم إعادة تعيين الجولة التعريفية');
}

/**
 * عرض نافذة الجولة يدوياً
 */
export function forceShowTutorial() {
    if (tutorialPopup) {
        tutorialPopup.classList.add('active');
    }
}

/**
 * إخفاء نافذة الجولة يدوياً
 */
export function forceHideTutorial() {
    if (tutorialPopup) {
        tutorialPopup.classList.remove('active');
    }
}