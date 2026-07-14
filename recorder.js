// ============================================================
// 🎤 recorder.js - نظام التسجيل الذكي لتطبيق مَثَانِي
// يشمل: تسجيل الصوت، Waveform، تخزين IndexedDB، مقارنة ذكية
// تم التعديل: دعم التسجيل من زر مدمج مع تحديد الآية
// ============================================================

// ----- الاستيرادات -----
import { showToast } from './uiCore.js';
import { surahsList } from './constants.js';

// =====================================================================
// 1. مدير التخزين IndexedDB للتسجيلات الصوتية
// =====================================================================
class AudioStorage {
    constructor() {
        this.dbName = 'QuranRecordingsDB';
        this.storeName = 'audioFiles';
        this.db = null;
        this.initPromise = this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    store.createIndex('surah', 'surah', { unique: false });
                    store.createIndex('ayah', 'ayah', { unique: false });
                    store.createIndex('date', 'date', { unique: false });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('✅ IndexedDB جاهزة للتسجيلات');
                resolve();
            };

            request.onerror = (event) => {
                console.error('❌ فشل فتح IndexedDB:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    async saveRecording(audioBlob, metadata) {
        await this.initPromise;
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('IndexedDB غير جاهزة'));
                return;
            }

            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);

            const record = {
                ...metadata,
                audioBlob: audioBlob,
                size: audioBlob.size,
                type: audioBlob.type
            };

            const request = store.add(record);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllRecordingsMetadata() {
        await this.initPromise;
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('IndexedDB غير جاهزة'));
                return;
            }

            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                const records = request.result.map(record => ({
                    id: record.id,
                    surah: record.surah,
                    ayah: record.ayah,
                    duration: record.duration,
                    date: record.date,
                    quality: record.quality,
                    size: record.size,
                    type: record.type
                }));
                resolve(records);
            };

            request.onerror = () => reject(request.error);
        });
    }

    async getAudioBlob(id) {
        await this.initPromise;
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('IndexedDB غير جاهزة'));
                return;
            }

            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(id);

            request.onsuccess = () => {
                if (request.result) {
                    resolve(request.result.audioBlob);
                } else {
                    reject(new Error('التسجيل غير موجود'));
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    async deleteRecording(id) {
        await this.initPromise;
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('IndexedDB غير جاهزة'));
                return;
            }

            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async clearAll() {
        await this.initPromise;
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('IndexedDB غير جاهزة'));
                return;
            }

            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

// =====================================================================
// 2. الفئة الرئيسية QuranRecorder
// =====================================================================
export class QuranRecorder {
    constructor() {
        this.storage = new AudioStorage();
        this.recordingsMetadata = [];
        this.mediaRecorder = null;
        this.audioContext = null;
        this.analyser = null;
        this.isRecording = false;
        this.recordedChunks = [];
        this.recordedBlob = null;
        this.currentAyahRange = null;
        this.recordingStartTime = null;

        // تحميل البيانات الوصفية المخزنة مسبقاً
        this.loadRecordingsMetadata();

        // وعد بتهيئة الميكروفون
        this.initPromise = this.initRecorder();

        // عناصر DOM (سيتم تعيينها في initUI)
        this.dom = {
            waveformCanvas: null,
            recordingsList: null,
            recordBtn: null,
            stopBtn: null,
            timerDisplay: null,
            recorderPanel: null,
            ayahInput: null,
            surahInput: null
        };
    }

    // ==================== التهيئة ====================

    async initRecorder() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;

            const source = this.audioContext.createMediaStreamSource(stream);
            source.connect(this.analyser);

            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            this.setupMediaRecorderListeners();
            console.log('✅ تم تهيئة التسجيل بنجاح');
            return true;
        } catch (error) {
            console.error('❌ خطأ في الوصول للميكروفون:', error);
            showToast('❌ يجب السماح بالوصول للميكروفون لاستخدام هذه الميزة');
            return false;
        }
    }

    setupMediaRecorderListeners() {
        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.recordedChunks.push(event.data);
            }
        };

        this.mediaRecorder.onstop = () => {
            this.recordedBlob = new Blob(this.recordedChunks, {
                type: 'audio/webm;codecs=opus'
            });
            this.isRecording = false;
            this.updateUI();
            this.saveRecording();
            // تحديث واجهة الزر المدمج
            this.updateRecordingButtonUI(false);
        };
    }

    // ==================== تحميل البيانات الوصفية ====================

    async loadRecordingsMetadata() {
        try {
            this.recordingsMetadata = await this.storage.getAllRecordingsMetadata();
        } catch (error) {
            console.warn('⚠️ فشل تحميل البيانات الوصفية:', error);
            this.recordingsMetadata = [];
        }
        this.updateUI();
    }

    // ==================== ربط واجهة المستخدم ====================

    initUI() {
        this.dom.waveformCanvas = document.getElementById('waveformCanvas');
        this.dom.recordingsList = document.getElementById('recordingsList');
        this.dom.recordBtn = document.getElementById('recordBtn');
        this.dom.stopBtn = document.getElementById('stopBtn');
        this.dom.timerDisplay = document.getElementById('recordingTimerDisplay');
        this.dom.recorderPanel = document.querySelector('.recorder-panel');
        this.dom.ayahInput = document.getElementById('recordingAyah');
        this.dom.surahInput = document.getElementById('recordingSurah');

        // تعبئة حقل السورة تلقائياً بالسورة الحالية
        const currentSurah = parseInt(localStorage.getItem('quran_current_surah')) || 1;
        if (this.dom.surahInput) {
            this.dom.surahInput.value = currentSurah;
            this.dom.surahInput.max = 114;
        }
        if (this.dom.ayahInput) {
            this.dom.ayahInput.value = 1;
        }

        // ربط الأحداث
        this.bindEvents();
        this.updateUI();
    }

    bindEvents() {
        if (this.dom.recordBtn) {
            this.dom.recordBtn.addEventListener('click', () => this.startRecording());
        }
        if (this.dom.stopBtn) {
            this.dom.stopBtn.addEventListener('click', () => this.stopRecording());
        }
    }

    // ==================== التسجيل من الزر المدمج ====================

    /**
     * بدء تسجيل الآية المحددة (من داخل المشغل)
     * @param {number} surahId - رقم السورة
     * @param {number} ayahNumber - رقم الآية
     */
    async startRecordingAyah(surahId, ayahNumber) {
        if (this.isRecording) {
            showToast('⏳ التسجيل قيد التشغيل بالفعل');
            return;
        }

        // التأكد من تهيئة الميكروفون
        const ready = await this.initPromise;
        if (!ready) return;

        // التحقق من صحة المدخلات
        if (surahId < 1 || surahId > 114) {
            showToast('⚠️ رقم السورة غير صحيح');
            return;
        }
        if (ayahNumber < 1) {
            showToast('⚠️ رقم الآية غير صحيح');
            return;
        }

        this.recordedChunks = [];
        this.recordedBlob = null;
        this.currentAyahRange = { surah: surahId, ayah: ayahNumber };
        this.recordingStartTime = Date.now();
        this.isRecording = true;

        this.mediaRecorder.start();
        this.updateUI();
        this.drawWaveform();

        // تحديث واجهة زر التسجيل المدمج
        this.updateRecordingButtonUI(true);

        const surahName = surahsList[surahId - 1]?.name || surahId;
        showToast(`🎤 جاري تسجيل الآية ${ayahNumber} من سورة ${surahName}`);
    }

    /**
     * إيقاف التسجيل الحالي
     */
    async stopRecordingAyah() {
        if (!this.isRecording) {
            showToast('⚠️ لا يوجد تسجيل قيد التشغيل');
            return;
        }

        this.mediaRecorder.stop();
        this.updateRecordingButtonUI(false);
        showToast('✅ تم إيقاف التسجيل وحفظه');
    }

    /**
     * تحديث واجهة زر التسجيل المدمج
     */
    updateRecordingButtonUI(isRecording) {
        const btn = document.getElementById('inlineRecordBtn');
        const frame = document.getElementById('recordingControlFrame');
        if (btn) {
            btn.classList.toggle('recording', isRecording);
            btn.setAttribute('aria-label', isRecording ? 'إيقاف التسجيل' : 'تسجيل الآية');
        }
        if (frame) {
            frame.classList.toggle('recording-active', isRecording);
        }
    }

    /**
     * التحقق من حالة التسجيل
     */
    isCurrentlyRecording() {
        return this.isRecording;
    }

    // ==================== بدء التسجيل (من اللوحة المنفصلة - اختياري) ====================

    async startRecording() {
        if (this.isRecording) {
            showToast('⏳ التسجيل قيد التشغيل بالفعل');
            return;
        }

        const ready = await this.initPromise;
        if (!ready) return;

        const surah = parseInt(this.dom.surahInput?.value) || 1;
        const ayah = parseInt(this.dom.ayahInput?.value) || 1;

        if (surah < 1 || surah > 114) {
            showToast('⚠️ رقم السورة يجب أن يكون بين 1 و 114');
            return;
        }
        if (ayah < 1) {
            showToast('⚠️ رقم الآية يجب أن يكون أكبر من 0');
            return;
        }

        this.recordedChunks = [];
        this.recordedBlob = null;
        this.currentAyahRange = { surah, ayah };
        this.recordingStartTime = Date.now();
        this.isRecording = true;

        this.mediaRecorder.start();
        this.updateUI();
        this.drawWaveform();

        const surahName = surahsList[surah - 1]?.name || surah;
        showToast(`🎤 جاري التسجيل: الآية ${ayah} من سورة ${surahName}`);
    }

    // ==================== إيقاف التسجيل (من اللوحة المنفصلة) ====================

    stopRecording() {
        if (!this.isRecording) {
            showToast('⚠️ لا يوجد تسجيل قيد التشغيل');
            return;
        }

        this.mediaRecorder.stop();
        showToast('✅ تم إيقاف التسجيل وحفظه');
    }

    // ==================== حفظ التسجيل ====================

    async saveRecording() {
        if (!this.recordedBlob) return;

        const metadata = {
            surah: this.currentAyahRange.surah,
            ayah: this.currentAyahRange.ayah,
            duration: Math.round((Date.now() - this.recordingStartTime) / 1000),
            date: new Date().toLocaleDateString('ar-SA'),
            quality: this.analyzeAudioQuality()
        };

        try {
            const id = await this.storage.saveRecording(this.recordedBlob, metadata);
            this.recordingsMetadata.push({ id, ...metadata });
            this.updateUI();
            showToast(`💾 تم حفظ التسجيل (${metadata.duration} ثانية)`);
        } catch (error) {
            console.error('❌ فشل حفظ التسجيل:', error);
            showToast('❌ فشل حفظ التسجيل');
        }
    }

    // ==================== تحليل جودة الصوت ====================

    analyzeAudioQuality() {
        const duration = (Date.now() - this.recordingStartTime) / 1000;
        if (duration < 2) return '⚠️ قصير جداً';
        if (duration > 120) return '⚠️ طويل جداً';
        return '✅ جودة جيدة';
    }

    // ==================== رسم Waveform ====================

    drawWaveform() {
        const canvas = this.dom.waveformCanvas;
        if (!canvas || !this.isRecording) return;

        const canvasCtx = canvas.getContext('2d');
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

        const draw = () => {
            if (!this.isRecording) return;

            this.analyser.getByteFrequencyData(dataArray);

            canvasCtx.fillStyle = 'var(--bg-card)';
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

            canvasCtx.lineWidth = 2;
            canvasCtx.strokeStyle = 'var(--accent-color)';
            canvasCtx.shadowColor = 'var(--accent-glow)';
            canvasCtx.shadowBlur = 10;

            canvasCtx.beginPath();
            const sliceWidth = (canvas.width * 1.0) / dataArray.length;
            let x = 0;

            for (let i = 0; i < dataArray.length; i++) {
                const v = dataArray[i] / 128.0;
                const y = (v * canvas.height) / 2;

                if (i === 0) {
                    canvasCtx.moveTo(x, y);
                } else {
                    canvasCtx.lineTo(x, y);
                }
                x += sliceWidth;
            }

            canvasCtx.lineTo(canvas.width, canvas.height / 2);
            canvasCtx.stroke();

            requestAnimationFrame(draw);
        };

        draw();
    }

    // ==================== تشغيل تسجيل ====================

    async playRecording(recordingId) {
        try {
            const blob = await this.storage.getAudioBlob(recordingId);
            const audioUrl = URL.createObjectURL(blob);
            const audio = new Audio(audioUrl);
            audio.play();
            showToast('🔊 تشغيل التسجيل');
        } catch (error) {
            console.error('❌ فشل تشغيل التسجيل:', error);
            showToast('❌ التسجيل غير موجود');
        }
    }

    // ==================== حذف تسجيل ====================

    async deleteRecording(recordingId) {
        try {
            await this.storage.deleteRecording(recordingId);
            this.recordingsMetadata = this.recordingsMetadata.filter(r => r.id !== recordingId);
            this.updateUI();
            showToast('🗑️ تم حذف التسجيل');
        } catch (error) {
            console.error('❌ فشل حذف التسجيل:', error);
            showToast('❌ فشل حذف التسجيل');
        }
    }

    // ==================== تحميل التسجيل كملف ====================

    async downloadRecording(recordingId) {
        try {
            const blob = await this.storage.getAudioBlob(recordingId);
            const recording = this.recordingsMetadata.find(r => r.id === recordingId);
            if (!recording) return;

            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `quran_recording_surah${recording.surah}_ayah${recording.ayah}.webm`;
            link.click();

            showToast('📥 جاري تحميل التسجيل');
        } catch (error) {
            console.error('❌ فشل تحميل التسجيل:', error);
            showToast('❌ فشل تحميل التسجيل');
        }
    }

    // ==================== حذف جميع التسجيلات ====================

    async clearAllRecordings() {
        if (!confirm('⚠️ هل أنت متأكد من حذف جميع التسجيلات؟')) return;

        try {
            await this.storage.clearAll();
            this.recordingsMetadata = [];
            this.updateUI();
            showToast('🗑️ تم حذف جميع التسجيلات');
        } catch (error) {
            console.error('❌ فشل حذف جميع التسجيلات:', error);
            showToast('❌ فشل حذف جميع التسجيلات');
        }
    }

    // ==================== تحديث واجهة المستخدم ====================

    updateUI() {
        // تحديث حالة الأزرار
        if (this.dom.recordBtn) {
            this.dom.recordBtn.disabled = this.isRecording;
        }
        if (this.dom.stopBtn) {
            this.dom.stopBtn.disabled = !this.isRecording;
        }
        if (this.dom.recorderPanel) {
            this.dom.recorderPanel.classList.toggle('recording', this.isRecording);
        }

        // تحديث العداد
        if (this.dom.timerDisplay) {
            if (this.isRecording) {
                const elapsed = Math.floor((Date.now() - this.recordingStartTime) / 1000);
                const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
                const seconds = String(elapsed % 60).padStart(2, '0');
                this.dom.timerDisplay.textContent = `${minutes}:${seconds}`;
                if (this.timerInterval) clearInterval(this.timerInterval);
                this.timerInterval = setInterval(() => {
                    if (!this.isRecording) {
                        clearInterval(this.timerInterval);
                        return;
                    }
                    const el = Math.floor((Date.now() - this.recordingStartTime) / 1000);
                    const m = String(Math.floor(el / 60)).padStart(2, '0');
                    const s = String(el % 60).padStart(2, '0');
                    if (this.dom.timerDisplay) {
                        this.dom.timerDisplay.textContent = `${m}:${s}`;
                    }
                }, 1000);
            } else {
                if (this.timerInterval) {
                    clearInterval(this.timerInterval);
                    this.timerInterval = null;
                }
                this.dom.timerDisplay.textContent = '00:00';
            }
        }

        // تحديث قائمة التسجيلات
        this.renderRecordingsList();
    }

    renderRecordingsList() {
        const list = this.dom.recordingsList;
        if (!list) return;

        if (this.recordingsMetadata.length === 0) {
            list.innerHTML = '<p class="no-recordings">📭 لم تقم بأي تسجيلات بعد</p>';
            return;
        }

        list.innerHTML = this.recordingsMetadata.map(rec => `
            <div class="recording-item" data-id="${rec.id}">
                <div class="recording-info">
                    <span class="recording-title">
                        🎤 السورة ${rec.surah} - الآية ${rec.ayah}
                    </span>
                    <span class="recording-meta">
                        ${rec.duration}ث • ${rec.date} • ${rec.quality}
                    </span>
                </div>
                <div class="recording-actions">
                    <button class="icon-btn" data-action="play" title="تشغيل">▶️</button>
                    <button class="icon-btn" data-action="download" title="تحميل">📥</button>
                    <button class="icon-btn danger" data-action="delete" title="حذف">🗑️</button>
                </div>
            </div>
        `).join('');

        list.querySelectorAll('.recording-item').forEach(item => {
            const id = parseInt(item.dataset.id);
            item.querySelector('[data-action="play"]')?.addEventListener('click', () => {
                this.playRecording(id);
            });
            item.querySelector('[data-action="download"]')?.addEventListener('click', () => {
                this.downloadRecording(id);
            });
            item.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
                this.deleteRecording(id);
            });
        });
    }

    // ==================== مقارنة ذكية مع التلاوة الأصلية ====================

    async compareWithOriginal(recordingId, originalAudioUrl) {
        showToast('🔄 جاري المقارنة الذكية...');

        try {
            const blob = await this.storage.getAudioBlob(recordingId);
            const recording = this.recordingsMetadata.find(r => r.id === recordingId);
            if (!recording) return;

            const originalResponse = await fetch(originalAudioUrl);
            const originalBuffer = await originalResponse.arrayBuffer();

            const originalAnalysis = await this.analyzeAudioCharacteristics(originalBuffer);
            const recordingAnalysis = await this.analyzeAudioFromBlob(blob);

            const comparison = this.performComparison(originalAnalysis, recordingAnalysis);
            this.displayComparisonResults(comparison);
        } catch (error) {
            console.error('❌ خطأ في المقارنة:', error);
            showToast('❌ فشلت المقارنة');
        }
    }

    async analyzeAudioCharacteristics(audioBuffer) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const audioData = await audioContext.decodeAudioData(audioBuffer);
        const rawData = audioData.getChannelData(0);

        return {
            duration: audioData.duration,
            sampleRate: audioData.sampleRate,
            rms: this.calculateRMS(rawData),
            peak: Math.max(...Array.from(rawData).map(Math.abs)),
            clarity: this.calculateClarity(rawData)
        };
    }

    async analyzeAudioFromBlob(blob) {
        const buffer = await blob.arrayBuffer();
        return this.analyzeAudioCharacteristics(buffer);
    }

    calculateRMS(audioData) {
        let sum = 0;
        for (let i = 0; i < audioData.length; i++) {
            sum += audioData[i] * audioData[i];
        }
        return Math.sqrt(sum / audioData.length);
    }

    calculateClarity(audioData) {
        let peaks = 0;
        for (let i = 1; i < audioData.length - 1; i++) {
            if (audioData[i] > audioData[i - 1] && audioData[i] > audioData[i + 1]) {
                peaks++;
            }
        }
        return (peaks / audioData.length) * 100;
    }

    performComparison(original, recording) {
        return {
            durationMatch: Math.abs(original.duration - recording.duration) < 3,
            durationDifference: Math.abs(original.duration - recording.duration),
            volumeComparison: {
                original: original.rms,
                recording: recording.rms,
                match: Math.abs(original.rms - recording.rms) < 0.1
            },
            clarityScore: recording.clarity,
            overallScore: this.calculateOverallScore(original, recording),
            feedback: this.generateFeedback(original, recording)
        };
    }

    calculateOverallScore(original, recording) {
        let score = 100;
        const durationDiff = Math.abs(original.duration - recording.duration);
        score -= Math.min(durationDiff * 5, 30);
        const volumeDiff = Math.abs(original.rms - recording.rms);
        score -= Math.min(volumeDiff * 50, 20);
        score += Math.min(recording.clarity / 5, 15);
        return Math.max(Math.round(score), 0);
    }

    generateFeedback(original, recording) {
        const feedback = [];

        if (recording.duration < original.duration * 0.8) {
            feedback.push('⚡ قراءتك سريعة جداً - حاول التأني أكثر');
        } else if (recording.duration > original.duration * 1.2) {
            feedback.push('🐢 قراءتك بطيئة جداً - حاول السرعة قليلاً');
        } else {
            feedback.push('✅ السرعة جيدة جداً');
        }

        if (recording.rms < original.rms * 0.7) {
            feedback.push('🔊 صوتك منخفض جداً - تحدث بصوت أعلى');
        } else if (recording.rms > original.rms * 1.3) {
            feedback.push('📢 صوتك عالي جداً - حاول تخفيفه قليلاً');
        } else {
            feedback.push('✅ مستوى الصوت متوازن');
        }

        if (recording.clarity > 5) {
            feedback.push('🎤 وضوح الصوت ممتاز');
        } else if (recording.clarity < 2) {
            feedback.push('⚠️ حاول التقليل من الضوضاء المحيطة');
        }

        return feedback;
    }

    displayComparisonResults(comparison) {
        const modal = document.createElement('div');
        modal.className = 'comparison-modal active';
        modal.innerHTML = `
            <div class="comparison-content">
                <h2>📊 نتائج المقارنة الذكية</h2>
                <div class="score-display">
                    <div class="score-circle ${comparison.overallScore >= 80 ? 'excellent' : comparison.overallScore >= 60 ? 'good' : 'needs-work'}">
                        <span>${comparison.overallScore}%</span>
                    </div>
                </div>
                <div class="comparison-details">
                    <h3>تفاصيل المقارنة:</h3>
                    <div class="metric">
                        <span>⏱️ المدة:</span>
                        <span>${comparison.durationMatch ? '✅ متطابق' : `⚠️ فارق ${comparison.durationDifference}ث`}</span>
                    </div>
                    <div class="metric">
                        <span>🔊 مستوى الصوت:</span>
                        <span>${comparison.volumeComparison.match ? '✅ متطابق' : '⚠️ يحتاج تعديل'}</span>
                    </div>
                    <div class="metric">
                        <span>🎤 وضوح الصوت:</span>
                        <span>${Math.round(comparison.clarityScore)}%</span>
                    </div>
                </div>
                <div class="feedback-section">
                    <h3>💡 الملاحظات:</h3>
                    <ul class="feedback-list">
                        ${comparison.feedback.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-primary" onclick="this.closest('.comparison-modal').remove()">✅ حسناً</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
}

// =====================================================================
// 3. دالة التهيئة الشاملة (للاستدعاء من main.js)
// =====================================================================
let recorderInstance = null;

export function initRecorder() {
    if (recorderInstance) return recorderInstance;

    recorderInstance = new QuranRecorder();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            recorderInstance.initUI();
        });
    } else {
        recorderInstance.initUI();
    }

    console.log('🎤 تم تهيئة نظام التسجيل');
    return recorderInstance;
}

// =====================================================================
// 4. تصدير دالة للحصول على المثيل (للاستخدام من مكان آخر)
// =====================================================================
export function getRecorder() {
    return recorderInstance;
}