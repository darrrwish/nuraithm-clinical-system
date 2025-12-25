// Main Application File - إصدار كامل مع إصلاحات
const NuraithmApp = (function() {
    // حالة التطبيق
    const state = {
        isAuthenticated: false,
        currentUser: null,
        patients: [],
        alerts: [],
        todos: [],
        currentView: 'dashboard',
        activeTab: 'active',
        searchQuery: '',
        lang: 'ar',
        aiLang: 'ar',
        darkMode: false,
        signature: '',
        selectedPatientId: null,
        isModalOpen: false,
        modalTab: 'id',
        apiKeyConfigured: false,
        isLoading: false,
        isSettingsOpen: false,
        tempPatientData: {} // تخزين البيانات المؤقتة للنماذج
    };

    // عناصر DOM
    let elements = {};

    // دالة الترجمة
    function translate(ar, en) {
        return state.lang === 'ar' ? ar : en;
    }

    // تهيئة التطبيق
    async function init() {
        console.log('تهيئة تطبيق نورعيظم...');
        
        // التحقق من المصادقة
        if (!state.isAuthenticated) {
            renderAuthRequired();
            return;
        }
        
        setupDOMReferences();
        await loadInitialData();
        setupEventListeners();
        setupLanguage();
        setupDarkMode();
        checkApiKeyStatus();
        render();
        
        // بدء الاشتراكات الفورية
        startRealtimeSubscriptions();
    }

    // إعداد مراجع DOM
    function setupDOMReferences() {
        elements = {
            app: document.getElementById('app')
        };
    }

    // تحميل البيانات الأولية
    async function loadInitialData() {
        console.log('جاري تحميل البيانات من PocketBase...');
        
        try {
            const data = await PocketBaseService.initialize();
            
            state.patients = data.patients || [];
            state.alerts = data.alerts || [];
            state.todos = data.todos || [];
            
            // تحميل التوقيع
            state.signature = localStorage.getItem('nuraithm_signature') || state.currentUser?.name || '';
            
            console.log(`تم تحميل ${state.patients.length} مريض، ${state.alerts.length} تنبيه، ${state.todos.length} مهمة`);
            
        } catch (error) {
            console.error('خطأ في تحميل البيانات:', error);
            state.patients = [];
            state.alerts = [];
            state.todos = [];
            state.signature = localStorage.getItem('nuraithm_signature') || '';
        }
    }

    // التحقق من حالة مفتاح API
    function checkApiKeyStatus() {
        if (window.DeepSeekService && window.DeepSeekService.hasApiKey()) {
            state.apiKeyConfigured = true;
            console.log('مفتاح DeepSeek API مضبوط وصالح');
        } else {
            state.apiKeyConfigured = false;
            console.log('مفتاح DeepSeek API غير مضبوط');
        }
    }

    // بدء الاشتراكات الفورية
    function startRealtimeSubscriptions() {
        try {
            PocketBaseService.RealtimeService.subscribeToPatients((e) => {
                console.log('تحديث المريض:', e);
                if (e.action === 'create' || e.action === 'update' || e.action === 'delete') {
                    loadInitialData().then(() => render());
                }
            });
            
            PocketBaseService.RealtimeService.subscribeToAlerts((e) => {
                console.log('تحديث التنبيه:', e);
                if (e.action === 'create') {
                    playNotificationSound();
                }
                loadInitialData().then(() => render());
            });
            
            PocketBaseService.RealtimeService.subscribeToTodos((e) => {
                console.log('تحديث المهمة:', e);
                loadInitialData().then(() => render());
            });
            
        } catch (error) {
            console.error('خطأ في الاشتراكات الفورية:', error);
        }
    }

    // تشغيل صوت التنبيه
    function playNotificationSound() {
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ');
            audio.play().catch(e => console.log('فشل تشغيل الصوت:', e));
        } catch (error) {
            console.log('خطأ صوت التنبيه:', error);
        }
    }

    // إعداد مستمعي الأحداث
    function setupEventListeners() {
        document.addEventListener('click', handleGlobalClick);
        document.addEventListener('input', handleGlobalInput);
        document.addEventListener('change', handleGlobalChange);
        
        // إغلاق القائمة المنسدلة عند النقر خارجها
        document.addEventListener('click', function(e) {
            const dropdown = document.getElementById('settings-dropdown');
            const toggle = document.getElementById('settings-toggle');
            
            if (dropdown && toggle) {
                if (!dropdown.contains(e.target) && !toggle.contains(e.target)) {
                    dropdown.classList.add('hidden');
                }
            }
        });
    }

    // معالجة النقرات العامة
    async function handleGlobalClick(e) {
        const target = e.target;
        
        // إضافة مهمة
        if (target.closest('[data-add-task]')) {
            e.preventDefault();
            showAddTaskModal();
            return;
        }
        
        // تبديل حالة المهمة
        if (target.closest('[data-task-id]')) {
            const taskId = target.closest('[data-task-id]').dataset.taskId;
            if (taskId) {
                toggleTask(taskId);
                return;
            }
        }
        
        // تسجيل الخروج
        if (target.closest('[data-logout]')) {
            e.preventDefault();
            await logout();
            return;
        }
        
        // الملف الشخصي
        if (target.closest('[data-profile]')) {
            e.preventDefault();
            showUserProfileModal();
            return;
        }
        
        // تبديل الإعدادات
        if (target.closest('#settings-toggle')) {
            e.preventDefault();
            const dropdown = document.getElementById('settings-dropdown');
            if (dropdown) {
                dropdown.classList.toggle('hidden');
            }
            return;
        }
        
        // إضافة مريض
        if (target.closest('[data-add-patient]')) {
            e.preventDefault();
            openPatientModal();
            return;
        }
        
        // تعديل مريض
        if (target.closest('[data-edit-patient]')) {
            e.preventDefault();
            const patientCard = target.closest('[data-patient-id]');
            if (patientCard) {
                const patientId = patientCard.dataset.patientId;
                openPatientModal(patientId);
            }
            return;
        }
        
        // إغلاق النافذة
        if (target.closest('[data-close-modal]')) {
            e.preventDefault();
            closeModal();
            return;
        }
        
        // حفظ المريض
        if (target.closest('[data-save-patient]')) {
            e.preventDefault();
            await savePatient();
            return;
        }
        
        // حذف المريض
        if (target.closest('[data-delete-patient]')) {
            e.preventDefault();
            const patientCard = target.closest('[data-patient-id]');
            if (patientCard) {
                const patientId = patientCard.dataset.patientId;
                await deletePatient(patientId);
            }
            return;
        }
        
        // تصدير PDF
        if (target.closest('[data-export-pdf]')) {
            e.preventDefault();
            await exportPatientPDF();
            return;
        }
        
        // تبديل المهمة
        if (target.closest('[data-toggle-todo]')) {
            e.preventDefault();
            const todoItem = target.closest('[data-todo-id]');
            if (todoItem) {
                const todoId = todoItem.dataset.todoId;
                await toggleTodo(todoId);
            }
            return;
        }
        
        // إضافة مهمة
        if (target.closest('[data-add-todo]')) {
            e.preventDefault();
            await addTodo();
            return;
        }
        
        // حذف مهمة
        if (target.closest('[data-delete-todo]')) {
            e.preventDefault();
            const todoItem = target.closest('[data-todo-id]');
            if (todoItem) {
                const todoId = todoItem.dataset.todoId;
                await deleteTodo(todoId);
            }
            return;
        }
        
        // تعليم التنبيه كمقروء
        if (target.closest('[data-mark-alert-read]')) {
            e.preventDefault();
            const alertItem = target.closest('[data-alert-id]');
            if (alertItem) {
                const alertId = alertItem.dataset.alertId;
                await markAlertAsRead(alertId);
            }
            return;
        }
        
        // حذف التنبيه
        if (target.closest('[data-delete-alert]')) {
            e.preventDefault();
            const alertItem = target.closest('[data-alert-id]');
            if (alertItem) {
                const alertId = alertItem.dataset.alertId;
                await deleteAlert(alertId);
            }
            return;
        }
        
        // مسح جميع التنبيهات
        if (target.closest('[data-clear-alerts]')) {
            e.preventDefault();
            await clearAllAlerts();
            return;
        }
        
        // تبديل العرض (الرئيسية/التنبيهات)
        if (target.closest('[data-view]')) {
            e.preventDefault();
            const view = target.closest('[data-view]').dataset.view;
            switchView(view);
            return;
        }
        
        // تبديل تبويب المرضى (نشطين/مسلمين)
        if (target.closest('[data-patient-tab]')) {
            e.preventDefault();
            const tab = target.closest('[data-patient-tab]').dataset.patientTab;
            switchPatientTab(tab);
            return;
        }
        
        // إضافة مهمة سريعة
        if (target.closest('[data-quick-add-todo]')) {
            e.preventDefault();
            await addQuickTodo();
            return;
        }
        
        // إضافة حدث سريع
        if (target.closest('[data-quick-add-event]')) {
            e.preventDefault();
            await addQuickEvent();
            return;
        }
        
        // نسخة احتياطية
        if (target.closest('[data-backup]')) {
            e.preventDefault();
            await backupData();
            return;
        }
        
        // استيراد البيانات
        if (target.closest('[data-import]')) {
            e.preventDefault();
            await importData();
            return;
        }
        
        // إجراءات المريض
        if (target.closest('[data-patient-action]')) {
            e.preventDefault();
            const actionBtn = target.closest('[data-patient-action]');
            const action = actionBtn.dataset.patientAction;
            const patientCard = actionBtn.closest('[data-patient-id]');
            if (patientCard) {
                const patientId = patientCard.dataset.patientId;
                await handlePatientAction(patientId, action);
            }
            return;
        }
        
        // تبديل تبويب النافذة
        if (target.closest('[data-tab]')) {
            e.preventDefault();
            const tab = target.closest('[data-tab]').dataset.tab;
            switchModalTab(tab);
            return;
        }
        
        // تكوين مفتاح API
        if (target.closest('[data-configure-api]')) {
            e.preventDefault();
            if (typeof window.showApiKeyModal === 'function') {
                window.showApiKeyModal();
            }
            return;
        }
        
        // تبديل اللغة
        if (target.closest('[data-lang-toggle]')) {
            e.preventDefault();
            toggleLanguage();
            return;
        }
        
        // تبديل لغة الذكاء الاصطناعي
        if (target.closest('[data-ai-lang-toggle]')) {
            e.preventDefault();
            toggleAiLanguage();
            return;
        }
        
        // تبديل الوضع الداكن
        if (target.closest('[data-dark-mode-toggle]')) {
            e.preventDefault();
            toggleDarkMode();
            return;
        }
        
        // إضافة دواء
        if (target.closest('[data-add-medication]')) {
            e.preventDefault();
            const patientCard = target.closest('[data-patient-id]');
            if (patientCard) {
                const patientId = patientCard.dataset.patientId;
                showMedicationModal(patientId);
            }
            return;
        }
        
        // إضافة تحليل
        if (target.closest('[data-add-lab]')) {
            e.preventDefault();
            const patientCard = target.closest('[data-patient-id]');
            if (patientCard) {
                const patientId = patientCard.dataset.patientId;
                showLabModal(patientId);
            }
            return;
        }
        
        // إضافة أشعة
        if (target.closest('[data-add-radiology]')) {
            e.preventDefault();
            const patientCard = target.closest('[data-patient-id]');
            if (patientCard) {
                const patientId = patientCard.dataset.patientId;
                showRadiologyModal(patientId);
            }
            return;
        }
        
        // توليد تنبيهات الذكاء الاصطناعي
        if (target.closest('[data-generate-alerts]')) {
            e.preventDefault();
            const patientCard = target.closest('[data-patient-id]');
            if (patientCard) {
                const patientId = patientCard.dataset.patientId;
                await generateAIAlerts(patientId);
            }
            return;
        }
        
        // تسليم المريض
        if (target.closest('[data-handover-patient]')) {
            e.preventDefault();
            const patientCard = target.closest('[data-patient-id]');
            if (patientCard) {
                const patientId = patientCard.dataset.patientId;
                await handoverPatient(patientId);
            }
            return;
        }
        
        // استلام المريض
        if (target.closest('[data-receive-patient]')) {
            e.preventDefault();
            const patientCard = target.closest('[data-patient-id]');
            if (patientCard) {
                const patientId = patientCard.dataset.patientId;
                await receivePatient(patientId);
            }
            return;
        }
        
        // تحديث التوقيع
        if (target.closest('[data-update-signature]')) {
            e.preventDefault();
            const signatureInput = document.getElementById('signature-input');
            if (signatureInput) {
                const newSignature = signatureInput.value.trim();
                if (newSignature) {
                    state.signature = newSignature;
                    localStorage.setItem('nuraithm_signature', newSignature);
                    showNotification(translate('تم حفظ التوقيع', 'Signature saved'), 'success');
                }
            }
            return;
        }
        
        // فتح نافذة التوقيع
        if (target.closest('[data-signature-settings]')) {
            e.preventDefault();
            showSignatureModal();
            return;
        }
        
        // حفظ البيانات المؤقتة
        if (target.closest('[data-save-temp]')) {
            e.preventDefault();
            saveTempFormData();
            return;
        }
    }

    // معالجة الإدخال العام
    function handleGlobalInput(e) {
        // البحث المؤجل
        if (e.target.closest('[data-search]')) {
            clearTimeout(window.searchTimeout);
            window.searchTimeout = setTimeout(() => {
                state.searchQuery = e.target.value;
                render();
            }, 300);
        }
        
        // حفظ البيانات المؤقتة في الحقول
        if (e.target.closest('.patient-field')) {
            const fieldId = e.target.id;
            const value = e.target.value;
            if (!state.tempPatientData[state.selectedPatientId]) {
                state.tempPatientData[state.selectedPatientId] = {};
            }
            state.tempPatientData[state.selectedPatientId][fieldId] = value;
        }
    }

    // معالجة التغييرات العامة
    function handleGlobalChange(e) {
        const target = e.target;
        
        // حفظ التوقيع
        if (target.closest('[data-signature]')) {
            state.signature = target.value;
            localStorage.setItem('nuraithm_signature', state.signature);
        }
        
        // حفظ البيانات المؤقتة في القوائم المنسدلة
        if (target.closest('.patient-field')) {
            const fieldId = target.id;
            const value = target.value;
            if (!state.tempPatientData[state.selectedPatientId]) {
                state.tempPatientData[state.selectedPatientId] = {};
            }
            state.tempPatientData[state.selectedPatientId][fieldId] = value;
        }
    }

    // إدارة الحالة
    function toggleLanguage() {
        state.lang = state.lang === 'ar' ? 'en' : 'ar';
        localStorage.setItem('nuraithm_lang', state.lang);
        setupLanguage();
        render();
    }

    function toggleAiLanguage() {
        state.aiLang = state.aiLang === 'ar' ? 'en' : 'ar';
        localStorage.setItem('nuraithm_ai_lang', state.aiLang);
        render();
    }

    function toggleDarkMode() {
        state.darkMode = !state.darkMode;
        localStorage.setItem('nuraithm_theme', state.darkMode ? 'dark' : 'light');
        setupDarkMode();
        render();
    }

    function setupLanguage() {
        document.documentElement.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = state.lang;
    }

    function setupDarkMode() {
        if (state.darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }

    function switchView(view) {
        state.currentView = view;
        render();
    }

    function switchPatientTab(tab) {
        state.activeTab = tab;
        render();
    }

    function switchModalTab(tab) {
        state.modalTab = tab;
        render();
        
        // تحميل البيانات المحفوظة للتبويب الحالي
        loadTempFormData();
    }

    // حفظ البيانات المؤقتة للنموذج
    function saveTempFormData() {
        if (!state.selectedPatientId) return;
        
        const patientData = collectFormData();
        if (!state.tempPatientData[state.selectedPatientId]) {
            state.tempPatientData[state.selectedPatientId] = {};
        }
        
        // دمج البيانات الجديدة مع القديمة
        state.tempPatientData[state.selectedPatientId] = {
            ...state.tempPatientData[state.selectedPatientId],
            ...patientData
        };
        
        showNotification(translate('تم حفظ البيانات مؤقتاً', 'Data saved temporarily'), 'success');
    }

    // تحميل البيانات المؤقتة للنموذج
    function loadTempFormData() {
        if (!state.selectedPatientId || !state.tempPatientData[state.selectedPatientId]) return;
        
        const tempData = state.tempPatientData[state.selectedPatientId];
        setTimeout(() => {
            Object.keys(tempData).forEach(key => {
                const element = document.getElementById(key);
                if (element) {
                    element.value = tempData[key];
                }
            });
        }, 100);
    }

    // جمع بيانات النموذج
    function collectFormData() {
        const data = {};
        
        // جمع البيانات من جميع الحقول
        const fields = document.querySelectorAll('.patient-field');
        fields.forEach(field => {
            if (field.id) {
                data[field.id] = field.value;
            }
        });
        
        return data;
    }

    // إدارة المهام
    function showAddTaskModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full">
                <div class="bg-gradient-to-r from-primary to-secondary p-6 text-white flex justify-between items-center rounded-t-3xl">
                    <h3 class="text-xl font-black">إضافة مهمة جديدة</h3>
                    <button onclick="this.closest('.fixed').remove()" class="w-10 h-10 rounded-xl hover:bg-white/20 flex items-center justify-center">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div class="p-6 space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">وصف المهمة</label>
                        <textarea id="task-text" class="w-full p-3 border rounded-lg dark:bg-slate-800 dark:border-slate-700" rows="3" placeholder="أدخل وصف المهمة..."></textarea>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">المريض</label>
                            <select id="task-patient" class="w-full p-3 border rounded-lg dark:bg-slate-800 dark:border-slate-700">
                                <option value="">عام (غير مرتبط بمريض)</option>
                                ${state.patients.filter(p => p.status === 'active').map(p => 
                                    `<option value="${p.id}">${p.name} (${p.roomNumber})</option>`
                                ).join('')}
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">الأولوية</label>
                            <select id="task-priority" class="w-full p-3 border rounded-lg dark:bg-slate-800 dark:border-slate-700">
                                <option value="low">منخفضة</option>
                                <option value="medium" selected>متوسطة</option>
                                <option value="high">عالية</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">موعد التسليم</label>
                            <input type="date" id="task-dueDate" class="w-full p-3 border rounded-lg dark:bg-slate-800 dark:border-slate-700">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">التذكير</label>
                            <input type="datetime-local" id="task-reminder" class="w-full p-3 border rounded-lg dark:bg-slate-800 dark:border-slate-700">
                        </div>
                    </div>
                </div>
                
                <div class="p-6 border-t dark:border-slate-800 flex justify-end gap-3">
                    <button onclick="this.closest('.fixed').remove()" class="px-6 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                        إلغاء
                    </button>
                    <button onclick="saveNewTask()" class="px-6 py-2 bg-primary text-white rounded-xl">
                        حفظ المهمة
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        window.saveNewTask = async function() {
            const text = document.getElementById('task-text').value;
            const patientId = document.getElementById('task-patient').value;
            const priority = document.getElementById('task-priority').value;
            const dueDate = document.getElementById('task-dueDate').value;
            const reminder = document.getElementById('task-reminder').value;
            
            if (!text.trim()) {
                alert('الرجاء إدخال وصف المهمة');
                return;
            }
            
            const taskData = {
                text: text.trim(),
                patientId: patientId || null,
                patientName: patientId ? state.patients.find(p => p.id === patientId)?.name : '',
                priority: priority,
                dueDate: dueDate || null,
                reminder: reminder || null,
                completed: false
            };
            
            try {
                await PocketBaseService.TodoService.createTodo(taskData);
                showNotification('تمت إضافة المهمة بنجاح', 'success');
                modal.remove();
                await loadInitialData();
                render();
            } catch (error) {
                console.error('Error saving task:', error);
                showNotification('حدث خطأ في حفظ المهمة', 'error');
            }
        };
    }

    async function toggleTask(taskId) {
        try {
            await PocketBaseService.TodoService.toggleTodo(taskId);
            await loadInitialData();
            render();
        } catch (error) {
            console.error('Toggle task error:', error);
        }
    }

    async function deleteTask(taskId) {
        if (!confirm(translate('هل تريد حذف هذه المهمة؟', 'Delete this task?'))) {
            return;
        }
        
        try {
            await PocketBaseService.TodoService.deleteTodo(taskId);
            await loadInitialData();
            render();
        } catch (error) {
            console.error('Delete task error:', error);
        }
    }

    // تسجيل الخروج
    async function logout() {
        try {
            PocketBaseService.UserService.logout();
            state.isAuthenticated = false;
            state.currentUser = null;
            window.location.reload();
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    // عرض الملف الشخصي
    function showUserProfileModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full">
                <div class="bg-gradient-to-r from-primary to-secondary p-6 text-white flex justify-between items-center rounded-t-3xl">
                    <h3 class="text-xl font-black">${translate('الملف الشخصي', 'Profile')}</h3>
                    <button onclick="this.closest('.fixed').remove()" class="w-10 h-10 rounded-xl hover:bg-white/20 flex items-center justify-center">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                
                <div class="p-6 space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">${translate('الاسم', 'Name')}</label>
                        <input type="text" id="profile-name" value="${state.currentUser?.name || ''}"
                            class="w-full p-3 border rounded-lg dark:bg-slate-800 dark:border-slate-700">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">${translate('اسم المستخدم', 'Username')}</label>
                        <input type="text" value="${state.currentUser?.username || ''}"
                            class="w-full p-3 border rounded-lg dark:bg-slate-800 dark:border-slate-700" readonly>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">${translate('البريد الإلكتروني', 'Email')}</label>
                        <input type="email" id="profile-email" value="${state.currentUser?.email || ''}"
                            class="w-full p-3 border rounded-lg dark:bg-slate-800 dark:border-slate-700">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">${translate('التوقيع', 'Signature')}</label>
                        <input type="text" id="profile-signature" value="${state.signature || ''}"
                            class="w-full p-3 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                            placeholder="${translate('أدخل توقيعك للملفات', 'Enter your signature for documents')}">
                    </div>
                </div>
                
                <div class="p-6 border-t dark:border-slate-800 flex justify-end gap-3">
                    <button onclick="this.closest('.fixed').remove()" class="px-6 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                        ${translate('إلغاء', 'Cancel')}
                    </button>
                    <button onclick="updateProfile()" class="px-6 py-2 bg-primary text-white rounded-xl">
                        ${translate('حفظ التغييرات', 'Save Changes')}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        window.updateProfile = async function() {
            const name = document.getElementById('profile-name').value;
            const email = document.getElementById('profile-email').value;
            const signature = document.getElementById('profile-signature').value;
            
            try {
                if (name) {
                    await PocketBaseService.UserService.updateProfile({
                        name,
                        email
                    });
                }
                
                if (signature) {
                    state.signature = signature;
                    localStorage.setItem('nuraithm_signature', signature);
                }
                
                showNotification(translate('تم تحديث الملف الشخصي', 'Profile updated'), 'success');
                modal.remove();
                state.currentUser = PocketBaseService.UserService.getCurrentUser();
                render();
                
            } catch (error) {
                showNotification(translate('خطأ في تحديث الملف الشخصي', 'Error updating profile'), 'error');
            }
        };
    }

    // عرض نافذة التوقيع
    function showSignatureModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full">
                <div class="bg-gradient-to-r from-primary to-secondary p-6 text-white flex justify-between items-center rounded-t-3xl">
                    <h3 class="text-xl font-black">${translate('إعدادات التوقيع', 'Signature Settings')}</h3>
                    <button onclick="this.closest('.fixed').remove()" class="w-10 h-10 rounded-xl hover:bg-white/20 flex items-center justify-center">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                
                <div class="p-6 space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">${translate('التوقيع المعتمد', 'Official Signature')}</label>
                        <input type="text" id="signature-input" value="${state.signature}"
                            class="w-full p-3 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                            placeholder="${translate('مثال: Nurse. Ahmed Khaled', 'Example: Nurse. Ahmed Khaled')}">
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            ${translate('سيظهر هذا التوقيع على جميع الملفات المصدرة', 'This signature will appear on all exported documents')}
                        </p>
                    </div>
                </div>
                
                <div class="p-6 border-t dark:border-slate-800 flex justify-end gap-3">
                    <button onclick="this.closest('.fixed').remove()" class="px-6 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                        ${translate('إلغاء', 'Cancel')}
                    </button>
                    <button onclick="saveSignature()" class="px-6 py-2 bg-primary text-white rounded-xl">
                        ${translate('حفظ التوقيع', 'Save Signature')}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        window.saveSignature = function() {
            const signature = document.getElementById('signature-input').value.trim();
            if (signature) {
                state.signature = signature;
                localStorage.setItem('nuraithm_signature', signature);
                showNotification(translate('تم حفظ التوقيع', 'Signature saved'), 'success');
                modal.remove();
            }
        };
    }

    // فتح نافذة المريض
    function openPatientModal(patientId = null) {
        state.selectedPatientId = patientId;
        state.isModalOpen = true;
        state.modalTab = 'id';
        
        // مسح البيانات المؤقتة القديمة
        if (patientId && state.tempPatientData[patientId]) {
            delete state.tempPatientData[patientId];
        }
        
        render();
    }

    function closeModal() {
        // حفظ أي بيانات مؤقتة قبل الإغلاق
        if (state.selectedPatientId && state.tempPatientData[state.selectedPatientId]) {
            saveTempFormData();
        }
        
        state.isModalOpen = false;
        state.selectedPatientId = null;
        render();
    }

    // حفظ المريض
    async function savePatient() {
        // جمع البيانات من جميع التبويبات
        const patientData = collectPatientFormData();
        
        try {
            if (state.selectedPatientId) {
                // تحديث مريض موجود
                await PocketBaseService.PatientService.updatePatient(state.selectedPatientId, patientData);
                showNotification(translate('تم تحديث بيانات المريض', 'Patient updated'), 'success');
            } else {
                // إضافة مريض جديد
                const result = await PocketBaseService.PatientService.createPatient(patientData);
                state.selectedPatientId = result.id;
                showNotification(translate('تم إضافة المريض بنجاح', 'Patient added successfully'), 'success');
            }
            
            // مسح البيانات المؤقتة
            if (state.tempPatientData[state.selectedPatientId]) {
                delete state.tempPatientData[state.selectedPatientId];
            }
            
            await loadInitialData();
            closeModal();
            render();
        } catch (error) {
            console.error('Error saving patient:', error);
            showNotification(translate('حدث خطأ في حفظ المريض', 'Error saving patient'), 'error');
        }
    }

    // جمع بيانات نموذج المريض من جميع التبويبات
    function collectPatientFormData() {
        const tempData = state.tempPatientData[state.selectedPatientId] || {};
        const selectedPatient = state.selectedPatientId 
            ? state.patients.find(p => p.id === state.selectedPatientId)
            : null;
        
        const isbar = {
            identification: {
                room_no: tempData.roomNumber || selectedPatient?.isbar?.identification?.room_no || '',
                patient_name: tempData.patientName || selectedPatient?.name || 'مريض جديد',
                mrn: tempData.fileNumber || selectedPatient?.fileNumber || `MRN${Date.now().toString().slice(-6)}`,
                age: tempData.age || selectedPatient?.age || '',
                admission_date: tempData.admissionDate || selectedPatient?.isbar?.identification?.admission_date || new Date().toISOString().split('T')[0],
                admitted_from: tempData.admittedFrom || selectedPatient?.isbar?.identification?.admitted_from || 'ER',
                consultant: tempData.consultant || selectedPatient?.isbar?.identification?.consultant || ''
            },
            situation: {
                current_complaints: tempData.currentComplaints || selectedPatient?.isbar?.situation?.current_complaints || '',
                diagnosis: tempData.diagnosis || selectedPatient?.diagnosis || '',
                diet: tempData.diet || selectedPatient?.isbar?.situation?.diet || ''
            },
            background: {
                past_medical_history: tempData.pastMedicalHistory || selectedPatient?.isbar?.background?.past_medical_history || '',
                chief_complaint: tempData.chiefComplaint || selectedPatient?.isbar?.background?.chief_complaint || '',
                allergy: tempData.allergy || selectedPatient?.isbar?.background?.allergy || 'لا يوجد',
                infections_isolation: tempData.isolation || selectedPatient?.isbar?.background?.infections_isolation || 'لا يوجد'
            },
            assessment: {
                gcs: tempData.gcs || selectedPatient?.isbar?.assessment?.gcs || '15',
                fall_risk: tempData.fallRisk || selectedPatient?.isbar?.assessment?.fall_risk || 'low',
                vitals: tempData.vitals || selectedPatient?.isbar?.assessment?.vitals || '',
                ventilation: tempData.ventilation || selectedPatient?.isbar?.assessment?.ventilation || 'Room Air',
                bed_sore: tempData.bedSore || selectedPatient?.isbar?.assessment?.bed_sore || 'no',
                physical_restraint: tempData.restraint || selectedPatient?.isbar?.assessment?.physical_restraint || 'no',
                important_findings: tempData.findings || selectedPatient?.isbar?.assessment?.important_findings || ''
            },
            recommendations: {
                plan_of_care: tempData.planOfCare || selectedPatient?.isbar?.recommendations?.plan_of_care || '',
                risks: tempData.risks || selectedPatient?.isbar?.recommendations?.risks || ''
            },
            shift_notes: selectedPatient?.isbar?.shift_notes || []
        };

        return {
            name: tempData.patientName || selectedPatient?.name || 'مريض جديد',
            fileNumber: tempData.fileNumber || selectedPatient?.fileNumber || `MRN${Date.now().toString().slice(-6)}`,
            age: tempData.age || selectedPatient?.age || '',
            roomNumber: tempData.roomNumber || selectedPatient?.roomNumber || '',
            diagnosis: tempData.diagnosis || selectedPatient?.diagnosis || '',
            status: 'active',
            isbar: isbar,
            medications: selectedPatient?.medications || [],
            labs: selectedPatient?.labs || [],
            radiology: selectedPatient?.radiology || [],
            todos: selectedPatient?.todos || []
        };
    }

    // حذف المريض
    async function deletePatient(patientId) {
        if (!confirm(translate('هل تريد حذف هذا المريض؟', 'Delete this patient?'))) {
            return;
        }
        
        try {
            await PocketBaseService.PatientService.deletePatient(patientId);
            showNotification(translate('تم حذف المريض', 'Patient deleted'), 'success');
            
            // مسح البيانات المؤقتة
            if (state.tempPatientData[patientId]) {
                delete state.tempPatientData[patientId];
            }
            
            await loadInitialData();
            render();
        } catch (error) {
            console.error('Delete patient error:', error);
            showNotification(translate('خطأ في حذف المريض', 'Error deleting patient'), 'error');
        }
    }

    // تصدير PDF
    async function exportPatientPDF() {
        try {
            const patient = state.patients.find(p => p.id === state.selectedPatientId);
            if (patient && window.PDFExport && window.PDFExport.exportHandoverPDF) {
                const receivingNurse = prompt(translate('أدخل اسم الممرض/الممرضة المستقبل:', 'Enter receiving nurse name:'), '___________________');
                
                if (receivingNurse === null) {
                    return; // تم إلغاء العملية
                }
                
                window.PDFExport.exportHandoverPDF(patient, state.signature, receivingNurse);
                showNotification(translate('تم تصدير PDF', 'PDF exported'), 'success');
            }
        } catch (error) {
            console.error('PDF export error:', error);
            showNotification(translate('خطأ في تصدير PDF', 'Error exporting PDF'), 'error');
        }
    }

    // إدارة المهام
    async function toggleTodo(todoId) {
        try {
            await PocketBaseService.TodoService.toggleTodo(todoId);
            await loadInitialData();
            render();
        } catch (error) {
            console.error('Toggle todo error:', error);
        }
    }

    async function addTodo() {
        const text = prompt(translate('المهمة:', 'Task:'));
        if (!text) return;
        
        try {
            await PocketBaseService.TodoService.createTodo({
                text,
                completed: false
            });
            
            showNotification(translate('تم إضافة المهمة', 'Task added'), 'success');
            await loadInitialData();
            render();
        } catch (error) {
            console.error('Add todo error:', error);
            showNotification(translate('خطأ في إضافة المهمة', 'Error adding task'), 'error');
        }
    }

    async function deleteTodo(todoId) {
        try {
            await PocketBaseService.TodoService.deleteTodo(todoId);
            await loadInitialData();
            render();
        } catch (error) {
            console.error('Delete todo error:', error);
        }
    }

    // إدارة التنبيهات
    async function markAlertAsRead(alertId) {
        try {
            await PocketBaseService.AlertService.markAsRead(alertId);
            await loadInitialData();
            render();
        } catch (error) {
            console.error('Mark alert read error:', error);
        }
    }

    async function deleteAlert(alertId) {
        try {
            await PocketBaseService.AlertService.deleteAlert(alertId);
            await loadInitialData();
            render();
        } catch (error) {
            console.error('Delete alert error:', error);
        }
    }

    async function clearAllAlerts() {
        if (!confirm(translate('هل تريد مسح جميع التنبيهات المقروءة؟', 'Clear all read alerts?'))) {
            return;
        }
        
        try {
            await PocketBaseService.AlertService.clearReadAlerts();
            await loadInitialData();
            render();
        } catch (error) {
            console.error('Clear alerts error:', error);
            showNotification(translate('خطأ في مسح التنبيهات', 'Error clearing alerts'), 'error');
        }
    }

    // إضافة مهمة سريعة
    async function addQuickTodo() {
        const activePatients = state.patients.filter(p => p.status === 'active');
        if (activePatients.length === 0) {
            showNotification(translate('لا يوجد مرضى نشطين', 'No active patients'), 'warning');
            return;
        }

        const patientName = prompt(translate('اسم المريض للمهمة:', 'Patient for task:'), activePatients[0].name);
        if (!patientName) return;
        
        const patient = activePatients.find(p => p.name.includes(patientName));
        if (!patient) {
            showNotification(translate('المريض غير موجود', 'Patient not found'), 'error');
            return;
        }

        const taskText = prompt(translate('المهمة المطلوبة:', 'Task:'));
        if (!taskText) return;

        try {
            await PocketBaseService.TodoService.createTodo({
                text: taskText,
                completed: false,
                patientId: patient.id,
                patientName: patient.name
            });
            
            showNotification(translate('تم إضافة المهمة', 'Task added'), 'success');
            await loadInitialData();
            render();
        } catch (error) {
            console.error('Add quick todo error:', error);
            showNotification(translate('خطأ في إضافة المهمة', 'Error adding task'), 'error');
        }
    }

    // إضافة حدث سريع
    async function addQuickEvent() {
        const activePatients = state.patients.filter(p => p.status === 'active');
        if (activePatients.length === 0) {
            showNotification(translate('لا يوجد مرضى نشطين', 'No active patients'), 'warning');
            return;
        }

        const patientName = prompt(translate('اسم المريض للحدث:', 'Patient for event:'), activePatients[0].name);
        if (!patientName) return;
        
        const patient = activePatients.find(p => p.name.includes(patientName));
        if (!patient) {
            showNotification(translate('المريض غير موجود', 'Patient not found'), 'error');
            return;
        }

        const eventText = prompt(translate('ما هو الحدث السريري؟', 'Clinical event:'));
        if (!eventText) return;

        const event = {
            id: Date.now().toString(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            event: eventText,
            category: 'clinical'
        };

        try {
            const updatedIsbar = { ...patient.isbar };
            updatedIsbar.shift_notes = [event, ...(updatedIsbar.shift_notes || [])];
            
            await PocketBaseService.PatientService.updatePatient(patient.id, {
                isbar: updatedIsbar
            });
            
            showNotification(translate('تم تسجيل الحدث', 'Event logged'), 'success');
            await loadInitialData();
            render();
        } catch (error) {
            console.error('Add event error:', error);
            showNotification(translate('خطأ في تسجيل الحدث', 'Error logging event'), 'error');
        }
    }

    // نسخة احتياطية
    async function backupData() {
        try {
            const data = {
                patients: state.patients,
                alerts: state.alerts,
                todos: state.todos,
                signature: state.signature,
                timestamp: new Date().toISOString(),
                version: '2.0.0'
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `nuraithm_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            showNotification(translate('تم إنشاء نسخة احتياطية', 'Backup created'), 'success');
        } catch (error) {
            console.error('Backup error:', error);
            showNotification(translate('خطأ في إنشاء النسخة الاحتياطية', 'Error creating backup'), 'error');
        }
    }

    // استيراد البيانات
    async function importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const imported = JSON.parse(event.target.result);
                    
                    // استيراد التوقيع
                    if (imported.signature) {
                        state.signature = imported.signature;
                        localStorage.setItem('nuraithm_signature', imported.signature);
                    }
                    
                    // استيراد المرضى
                    if (imported.patients && Array.isArray(imported.patients)) {
                        for (const patient of imported.patients) {
                            await PocketBaseService.PatientService.createPatient(patient);
                        }
                    }
                    
                    showNotification(translate('تم استيراد البيانات', 'Data imported'), 'success');
                    await loadInitialData();
                    render();
                } catch (error) {
                    console.error('Import error:', error);
                    showNotification(translate('خطأ في استيراد البيانات', 'Error importing data'), 'error');
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }

    // معالجة إجراءات المريض
    async function handlePatientAction(patientId, action) {
        const patient = state.patients.find(p => p.id === patientId);
        if (!patient) {
            showNotification(translate('المريض غير موجود', 'Patient not found'), 'error');
            return;
        }

        try {
            switch (action) {
                case 'handover':
                    if (window.PDFExport && window.PDFExport.exportHandoverPDF) {
                        const receivingNurse = prompt(translate('أدخل اسم الممرض/الممرضة المستقبل:', 'Enter receiving nurse name:'), '___________________');
                        
                        if (receivingNurse === null) {
                            return; // تم إلغاء العملية
                        }
                        
                        window.PDFExport.exportHandoverPDF(patient, state.signature, receivingNurse);
                        showNotification(translate('جاري تصدير PDF...', 'Exporting PDF...'), 'info');
                    }
                    break;
                    
                case 'careplan':
                    showNotification(translate('جاري إنشاء خطة الرعاية...', 'Creating care plan...'), 'info');
                    const carePlan = await DeepSeekService.generateCarePlan(patient, state.aiLang);
                    if (carePlan && carePlan.success) {
                        showNotification(translate('تم إنشاء خطة الرعاية', 'Care plan generated'), 'success');
                        showCarePlanModal(carePlan, patient.name);
                    } else if (carePlan && carePlan.requiresApiKey) {
                        showNotification(translate('مفتاح API مطلوب', 'API key required'), 'warning');
                        window.showApiKeyModal();
                    }
                    break;
                    
                case 'shift':
                    showNotification(translate('جاري إنشاء ملخص الشفت...', 'Creating shift summary...'), 'info');
                    const shiftSummary = await DeepSeekService.generateShiftSummary(patient, state.aiLang);
                    if (shiftSummary && shiftSummary.success) {
                        showNotification(translate('تم إنشاء ملخص الشفت', 'Shift summary generated'), 'success');
                        showShiftSummaryModal(shiftSummary, patient.name);
                    } else if (shiftSummary && shiftSummary.requiresApiKey) {
                        showNotification(translate('مفتاح API مطلوب', 'API key required'), 'warning');
                        window.showApiKeyModal();
                    }
                    break;
                    
                case 'medtable':
                    showNotification(translate('جاري تحليل الأدوية...', 'Analyzing medications...'), 'info');
                    const medTable = await DeepSeekService.generateMedicationTable(patient, state.aiLang);
                    if (medTable && medTable.success) {
                        showNotification(translate('تم إنشاء جدول الأدوية', 'Medication table generated'), 'success');
                        showMedTableModal(medTable, patient.name);
                    } else if (medTable && medTable.requiresApiKey) {
                        showNotification(translate('مفتاح API مطلوب', 'API key required'), 'warning');
                        window.showApiKeyModal();
                    }
                    break;
                    
                case 'report':
                    showNotification(translate('جاري إنشاء التقرير...', 'Generating report...'), 'info');
                    const report = await DeepSeekService.generatePatientReport(patient, state.aiLang);
                    if (report && report.success) {
                        showNotification(translate('تم إنشاء التقرير', 'Report generated'), 'success');
                        showReportModal(report, patient.name);
                    } else if (report && report.requiresApiKey) {
                        showNotification(translate('مفتاح API مطلوب', 'API key required'), 'warning');
                        window.showApiKeyModal();
                    }
                    break;
            }
        } catch (error) {
            console.error('Action error:', error);
            showNotification(translate('حدث خطأ أثناء المعالجة', 'Error processing action'), 'error');
        }
    }

    // توليد تنبيهات الذكاء الاصطناعي
    async function generateAIAlerts(patientId) {
        const patient = state.patients.find(p => p.id === patientId);
        if (!patient) {
            showNotification(translate('المريض غير موجود', 'Patient not found'), 'error');
            return;
        }

        try {
            showNotification(translate('جاري تحليل المخاطر...', 'Analyzing risks...'), 'info');
            const alerts = await DeepSeekService.generateClinicalAlerts(patient, state.aiLang);
            
            if (alerts && !alerts.requiresApiKey && Array.isArray(alerts)) {
                // حفظ التنبيهات في PocketBase
                for (const alert of alerts) {
                    await PocketBaseService.AlertService.createAlert({
                        title: alert.title,
                        message: alert.message,
                        category: alert.category,
                        priority: alert.priority,
                        read: false,
                        patientId: patient.id,
                        patientName: patient.name,
                        source: 'ai'
                    });
                }
                
                showNotification(translate('تم توليد التنبيهات', 'Alerts generated'), 'success');
                await loadInitialData();
                render();
            } else if (alerts && alerts.requiresApiKey) {
                showNotification(translate('مفتاح API مطلوب', 'API key required'), 'warning');
                window.showApiKeyModal();
            }
        } catch (error) {
            console.error('Generate alerts error:', error);
            showNotification(translate('خطأ في توليد التنبيهات', 'Error generating alerts'), 'error');
        }
    }

    // تسليم المريض
    async function handoverPatient(patientId) {
        const patient = state.patients.find(p => p.id === patientId);
        if (!patient) {
            showNotification(translate('المريض غير موجود', 'Patient not found'), 'error');
            return;
        }

        const receivingNurse = prompt(translate('اسم الممرض/الممرضة المستقبل:', 'Receiving nurse:'));
        if (!receivingNurse) return;

        try {
            const updatedIsbar = { ...patient.isbar };
            updatedIsbar.nursing = {
                outgoing_nurse: state.signature,
                receiving_nurse: receivingNurse,
                handover_date: new Date().toISOString().split('T')[0],
                handover_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            
            await PocketBaseService.PatientService.updatePatient(patient.id, {
                isbar: updatedIsbar,
                status: 'discharged'
            });
            
            showNotification(translate('تم تسليم المريض', 'Patient handed over'), 'success');
            await loadInitialData();
            render();
        } catch (error) {
            console.error('Handover error:', error);
            showNotification(translate('خطأ في تسليم المريض', 'Error handing over patient'), 'error');
        }
    }

    // استلام المريض
    async function receivePatient(patientId) {
        const patient = state.patients.find(p => p.id === patientId);
        if (!patient) {
            showNotification(translate('المريض غير موجود', 'Patient not found'), 'error');
            return;
        }

        try {
            await PocketBaseService.PatientService.updatePatient(patient.id, {
                status: 'active'
            });
            
            showNotification(translate('تم استلام المريض', 'Patient received'), 'success');
            await loadInitialData();
            render();
        } catch (error) {
            console.error('Receive patient error:', error);
            showNotification(translate('خطأ في استلام المريض', 'Error receiving patient'), 'error');
        }
    }

    // دوال مساعدة
    function showNotification(message, type = 'info') {
        const existingNotification = document.getElementById('app-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.id = 'app-notification';
        notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg transform transition-all duration-300 ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            type === 'warning' ? 'bg-yellow-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        notification.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="material-symbols-outlined">${
                    type === 'success' ? 'check_circle' :
                    type === 'error' ? 'error' :
                    type === 'warning' ? 'warning' : 'info'
                }</span>
                <span class="font-bold">${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 3000);
    }
    
    function showCarePlanModal(carePlan, patientName) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <div class="bg-gradient-to-r from-primary to-secondary p-6 text-white flex justify-between items-center rounded-t-3xl">
                    <h3 class="text-xl font-black">${translate('خطة الرعاية التمريضية', 'Nursing Care Plan')} - ${patientName}</h3>
                    <button onclick="this.closest('.fixed').remove()" class="w-10 h-10 rounded-xl hover:bg-white/20 flex items-center justify-center">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                
                <div class="p-6 overflow-auto max-h-[70vh]">
                    <div class="prose dark:prose-invert max-w-none">
                        <pre class="whitespace-pre-wrap font-cairo text-sm text-slate-900 dark:text-white">${carePlan.content}</pre>
                    </div>
                </div>
                
                <div class="p-6 border-t dark:border-slate-800 flex justify-end gap-3">
                    <button onclick="exportCarePlanPDF()" class="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl">
                        ${translate('تصدير PDF', 'Export PDF')}
                    </button>
                    <button onclick="this.closest('.fixed').remove()" class="px-6 py-2 bg-primary text-white rounded-xl">
                        ${translate('إغلاق', 'Close')}
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        window.exportCarePlanPDF = function() {
            if (window.PDFExport && window.PDFExport.exportReportPDF) {
                window.PDFExport.exportReportPDF(
                    translate('خطة الرعاية التمريضية', 'Nursing Care Plan'),
                    carePlan.content,
                    `CarePlan_${patientName}_${Date.now()}`,
                    state.signature
                );
            }
        };
    }
    
    function showShiftSummaryModal(summary, patientName) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                <div class="bg-gradient-to-r from-primary to-secondary p-6 text-white flex justify-between items-center rounded-t-3xl">
                    <h3 class="text-xl font-black">${translate('ملخص الشفت', 'Shift Summary')} - ${patientName}</h3>
                    <button onclick="this.closest('.fixed').remove()" class="w-10 h-10 rounded-xl hover:bg-white/20 flex items-center justify-center">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                
                <div class="p-6 overflow-auto max-h-[70vh]">
                    <div class="prose dark:prose-invert max-w-none">
                        <pre class="whitespace-pre-wrap font-cairo text-sm text-slate-900 dark:text-white">${summary.content}</pre>
                    </div>
                </div>
                
                <div class="p-6 border-t dark:border-slate-800 flex justify-end gap-3">
                    <button onclick="copyToClipboard('${summary.content.replace(/'/g, "\\'")}')" class="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl">
                        ${translate('نسخ', 'Copy')}
                    </button>
                    <button onclick="exportShiftSummaryPDF()" class="px-6 py-2 bg-primary text-white rounded-xl">
                        ${translate('تصدير PDF', 'Export PDF')}
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        window.exportShiftSummaryPDF = function() {
            if (window.PDFExport && window.PDFExport.exportReportPDF) {
                window.PDFExport.exportReportPDF(
                    translate('ملخص الشفت', 'Shift Summary'),
                    summary.content,
                    `ShiftSummary_${patientName}_${Date.now()}`,
                    state.signature
                );
            }
        };
    }
    
    function showMedTableModal(medTable, patientName) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
                <div class="bg-gradient-to-r from-primary to-secondary p-6 text-white flex justify-between items-center rounded-t-3xl">
                    <h3 class="text-xl font-black">${translate('جدول الأدوية الذكي', 'Smart Medication Table')} - ${patientName}</h3>
                    <button onclick="this.closest('.fixed').remove()" class="w-10 h-10 rounded-xl hover:bg-white/20 flex items-center justify-center">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                
                <div class="p-6 overflow-auto max-h-[70vh]">
                    ${medTable.tableData && medTable.tableData.headers ? `
                        <table class="w-full border-collapse">
                            <thead>
                                <tr class="bg-primary text-white">
                                    ${medTable.tableData.headers.map(header => `<th class="p-3 text-right">${header}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${medTable.tableData.rows.map(row => `
                                    <tr class="border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        ${row.map(cell => `<td class="p-3">${cell}</td>`).join('')}
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : `
                        <div class="prose dark:prose-invert max-w-none">
                            <pre class="whitespace-pre-wrap font-cairo text-sm text-slate-900 dark:text-white">${medTable.content}</pre>
                        </div>
                    `}
                </div>
                
                <div class="p-6 border-t dark:border-slate-800 flex justify-end gap-3">
                    <button onclick="exportMedTablePDF()" class="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl">
                        ${translate('تصدير PDF', 'Export PDF')}
                    </button>
                    <button onclick="this.closest('.fixed').remove()" class="px-6 py-2 bg-primary text-white rounded-xl">
                        ${translate('إغلاق', 'Close')}
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        window.exportMedTablePDF = function() {
            if (window.PDFExport && window.PDFExport.exportMedicationTablePDF) {
                window.PDFExport.exportMedicationTablePDF(
                    state.patients.find(p => p.name === patientName),
                    medTable.tableData,
                    state.signature
                );
            }
        };
    }
    
    function showReportModal(report, patientName) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <div class="bg-gradient-to-r from-primary to-secondary p-6 text-white flex justify-between items-center rounded-t-3xl">
                    <h3 class="text-xl font-black">${translate('تقرير طبي شامل', 'Comprehensive Medical Report')} - ${patientName}</h3>
                    <button onclick="this.closest('.fixed').remove()" class="w-10 h-10 rounded-xl hover:bg-white/20 flex items-center justify-center">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                
                <div class="p-6 overflow-auto max-h-[70vh]">
                    <div class="prose dark:prose-invert max-w-none">
                        <pre class="whitespace-pre-wrap font-cairo text-sm text-slate-900 dark:text-white">${report.content}</pre>
                    </div>
                </div>
                
                <div class="p-6 border-t dark:border-slate-800 flex justify-end gap-3">
                    <button onclick="exportReportPDF()" class="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl">
                        ${translate('تصدير PDF', 'Export PDF')}
                    </button>
                    <button onclick="this.closest('.fixed').remove()" class="px-6 py-2 bg-primary text-white rounded-xl">
                        ${translate('إغلاق', 'Close')}
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        window.exportReportPDF = function() {
            if (window.PDFExport && window.PDFExport.exportReportPDF) {
                window.PDFExport.exportReportPDF(
                    translate('تقرير طبي شامل', 'Comprehensive Medical Report'),
                    report.content,
                    `MedicalReport_${patientName}_${Date.now()}`,
                    state.signature
                );
            }
        };
    }

    // النوافذ المنبثقة للأدوية والتحاليل والأشعة
    function showMedicationModal(patientId) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full">
                <div class="bg-gradient-to-r from-primary to-secondary p-6 text-white flex justify-between items-center rounded-t-3xl">
                    <h3 class="text-xl font-black">إضافة دواء جديد</h3>
                    <button onclick="this.closest('.fixed').remove()" class="w-10 h-10 rounded-xl hover:bg-white/20 flex items-center justify-center">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                
                <div class="p-6 space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">اسم الدواء</label>
                        <input type="text" id="med-name" class="w-full p-3 border rounded-lg dark:bg-slate-800 dark:border-slate-700">
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">الجرعة</label>
                            <input type="text" id="med-dosage" class="w-full p-3 border rounded-lg dark:bg-slate-800 dark:border-slate-700" placeholder="500mg">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">التكرار</label>
                            <input type="text" id="med-frequency" class="w-full p-3 border rounded-lg dark:bg-slate-800 dark:border-slate-700" placeholder="كل 8 ساعات">
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">طريقة الاستعمال</label>
                        <select id="med-route" class="w-full p-3 border rounded-lg dark:bg-slate-800 dark:border-slate-700">
                            <option value="oral">فموي</option>
                            <option value="iv">وريدي</option>
                            <option value="im">عضلي</option>
                            <option value="sc">تحت الجلد</option>
                            <option value="topical">موضعي</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">ملاحظات</label>
                        <textarea id="med-notes" class="w-full p-3 border rounded-lg dark:bg-slate-800 dark:border-slate-700" rows="2"></textarea>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">تاريخ البدء</label>
                        <input type="date" id="med-start-date" class="w-full p-3 border rounded-lg dark:bg-slate-800 dark:border-slate-700">
                    </div>
                </div>
                
                <div class="p-6 border-t dark:border-slate-800 flex justify-end gap-3">
                    <button onclick="this.closest('.fixed').remove()" class="px-6 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                        إلغاء
                    </button>
                    <button onclick="saveMedication('${patientId}')" class="px-6 py-2 bg-primary text-white rounded-xl">
                        حفظ الدواء
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    async function saveMedication(patientId) {
        const medication = {
            name: document.getElementById('med-name').value,
            dosage: document.getElementById('med-dosage').value,
            frequency: document.getElementById('med-frequency').value,
            route: document.getElementById('med-route').value,
            notes: document.getElementById('med-notes').value,
            startDate: document.getElementById('med-start-date').value,
            createdAt: new Date().toISOString()
        };
        
        if (!medication.name || !medication.dosage) {
            showNotification('الرجاء إدخال اسم الدواء والجرعة', 'warning');
            return;
        }
        
        try {
            const patient = state.patients.find(p => p.id === patientId);
            const updatedMedications = [...(patient.medications || []), medication];
            
            await PocketBaseService.PatientService.updatePatient(patientId, {
                medications: updatedMedications
            });
            
            showNotification('تم إضافة الدواء بنجاح', 'success');
            await loadInitialData();
            render();
            
            const modal = document.querySelector('.fixed.inset-0.z-50');
            if (modal) modal.remove();
            
        } catch (error) {
            console.error('Error saving medication:', error);
            showNotification('خطأ في حفظ الدواء', 'error');
        }
    }

    function showLabModal(patientId) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full">
                <div class="bg-gradient-to-r from-primary to-secondary p-6 text-white flex justify-between items-center rounded-t-3xl">
                    <h3 class="text-xl font-black">إضافة تحليل جديد</h3>
                    <button onclick="this.closest('.fixed').remove()" class="w-10 h-10 rounded-xl hover:bg-white/20 flex items-center justify-center">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                
                <div class="p-6 space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">نوع التحليل</label>
                        <input type="text" id="lab-type" class="w-full p-3 border rounded-lg dark:bg-slate-800 dark:border-slate-700" placeholder="CBC, Creatinine, etc.">
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">القيمة</label>
                            <input type="text" id="lab-value" class="w-full p-3 border rounded-lg dark:bg-slate-800 dark:border-slate-700">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">الوحدة</label>
                            <input type="text" id="lab-unit" class="w-full p-3 border rounded-lg dark:bg-slate-800 dark:border-slate-700" placeholder="mg/dL, mmol/L">
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">النطاق المرجعي</label>
                        <input type="text" id="lab-range" class="w-full p-3 border rounded-lg dark:bg-slate-800 dark:border-slate-700" placeholder="3.5-5.5">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">التاريخ</label>
                        <input type="datetime-local" id="lab-date" class="w-full p-3 border rounded-lg dark:bg-slate-800 dark:border-slate-700">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">ملاحظات</label>
                        <textarea id="lab-notes" class="w-full p-3 border rounded-lg dark:bg-slate-800 dark:border-slate-700" rows="2"></textarea>
                    </div>
                </div>
                
                <div class="p-6 border-t dark:border-slate-800 flex justify-end gap-3">
                    <button onclick="this.closest('.fixed').remove()" class="px-6 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                        إلغاء
                    </button>
                    <button onclick="saveLabTest('${patientId}')" class="px-6 py-2 bg-primary text-white rounded-xl">
                        حفظ التحليل
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    async function saveLabTest(patientId) {
        const labTest = {
            type: document.getElementById('lab-type').value,
            value: document.getElementById('lab-value').value,
            unit: document.getElementById('lab-unit').value,
            range: document.getElementById('lab-range').value,
            date: document.getElementById('lab-date').value || new Date().toISOString(),
            notes: document.getElementById('lab-notes').value,
            createdAt: new Date().toISOString()
        };
        
        if (!labTest.type || !labTest.value) {
            showNotification('الرجاء إدخال نوع التحليل والقيمة', 'warning');
            return;
        }
        
        try {
            const patient = state.patients.find(p => p.id === patientId);
            const updatedLabs = [...(patient.labs || []), labTest];
            
            await PocketBaseService.PatientService.updatePatient(patientId, {
                labs: updatedLabs
            });
            
            showNotification('تم إضافة التحليل بنجاح', 'success');
            await loadInitialData();
            render();
            
            const modal = document.querySelector('.fixed.inset-0.z-50');
            if (modal) modal.remove();
            
        } catch (error) {
            console.error('Error saving lab test:', error);
            showNotification('خطأ في حفظ التحليل', 'error');
        }
    }

    function showRadiologyModal(patientId) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full">
                <div class="bg-gradient-to-r from-primary to-secondary p-6 text-white flex justify-between items-center rounded-t-3xl">
                    <h3 class="text-xl font-black">إضافة أشعة جديدة</h3>
                    <button onclick="this.closest('.fixed').remove()" class="w-10 h-10 rounded-xl hover:bg-white/20 flex items-center justify-center">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                
                <div class="p-6 space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">نوع الأشعة</label>
                        <select id="rad-type" class="w-full p-3 border rounded-lg dark:bg-slate-800 dark:border-slate-700">
                            <option value="xray">أشعة سينية</option>
                            <option value="ct">أشعة مقطعية</option>
                            <option value="mri">رنين مغناطيسي</option>
                            <option value="ultrasound">سونار</option>
                            <option value="echo">إيكو</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">المنطقة</label>
                        <input type="text" id="rad-area" class="w-full p-3 border rounded-lg dark:bg-slate-800 dark:border-slate-700" placeholder="الصدر، البطن، الدماغ">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">النتيجة</label>
                        <textarea id="rad-result" class="w-full p-3 border rounded-lg dark:bg-slate-800 dark:border-slate-700" rows="3" placeholder="تقرير الأشعة..."></textarea>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">الطبيب المشخص</label>
                        <input type="text" id="rad-doctor" class="w-full p-3 border rounded-lg dark:bg-slate-800 dark:border-slate-700">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">التاريخ</label>
                        <input type="date" id="rad-date" class="w-full p-3 border rounded-lg dark:bg-slate-800 dark:border-slate-700">
                    </div>
                </div>
                
                <div class="p-6 border-t dark:border-slate-800 flex justify-end gap-3">
                    <button onclick="this.closest('.fixed').remove()" class="px-6 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                        إلغاء
                    </button>
                    <button onclick="saveRadiology('${patientId}')" class="px-6 py-2 bg-primary text-white rounded-xl">
                        حفظ الأشعة
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    async function saveRadiology(patientId) {
        const radiology = {
            type: document.getElementById('rad-type').value,
            area: document.getElementById('rad-area').value,
            result: document.getElementById('rad-result').value,
            doctor: document.getElementById('rad-doctor').value,
            date: document.getElementById('rad-date').value || new Date().toISOString(),
            createdAt: new Date().toISOString()
        };
        
        if (!radiology.type || !radiology.area) {
            showNotification('الرجاء إدخال نوع الأشعة والمنطقة', 'warning');
            return;
        }
        
        try {
            const patient = state.patients.find(p => p.id === patientId);
            const updatedRadiology = [...(patient.radiology || []), radiology];
            
            await PocketBaseService.PatientService.updatePatient(patientId, {
                radiology: updatedRadiology
            });
            
            showNotification('تم إضافة الأشعة بنجاح', 'success');
            await loadInitialData();
            render();
            
            const modal = document.querySelector('.fixed.inset-0.z-50');
            if (modal) modal.remove();
            
        } catch (error) {
            console.error('Error saving radiology:', error);
            showNotification('خطأ في حفظ الأشعة', 'error');
        }
    }

    // دالة النسخ إلى الحافظة
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('تم النسخ إلى الحافظة', 'success');
        }).catch(err => {
            console.error('Failed to copy:', err);
            showNotification('فشل النسخ', 'error');
        });
    }

    // الحصول على الإحصائيات
    function getStats() {
        return {
            total: state.patients.length,
            active: state.patients.filter(p => p.status === 'active').length,
            discharged: state.patients.filter(p => p.status === 'discharged').length,
            alerts: state.alerts.filter(a => !a.read).length,
            todos: state.todos.filter(t => !t.completed).length
        };
    }

    // الحصول على المرضى المفلترة
    function getFilteredPatients() {
        return state.patients.filter(patient => {
            const matchesStatus = patient.status === state.activeTab;
            const matchesSearch = !state.searchQuery || 
                (patient.name && patient.name.toLowerCase().includes(state.searchQuery.toLowerCase())) ||
                (patient.fileNumber && patient.fileNumber.toLowerCase().includes(state.searchQuery.toLowerCase())) ||
                (patient.diagnosis && patient.diagnosis.toLowerCase().includes(state.searchQuery.toLowerCase()));
            return matchesStatus && matchesSearch;
        });
    }

    // دوال العرض
    function renderAuthRequired() {
        elements.app.innerHTML = `
            <div class="flex flex-col items-center justify-center min-h-screen p-4">
                <div class="text-center max-w-md">
                    <div class="w-24 h-24 bg-gradient-orange rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <span class="material-symbols-outlined text-white text-4xl">medical_services</span>
                    </div>
                    <h1 class="text-2xl font-black text-slate-900 dark:text-white mb-3">Nuraithm</h1>
                    <p class="text-slate-600 dark:text-slate-400 mb-8">
                        ${translate('نظام التسليم السريري الذكي باستخدام الذكاء الاصطناعي', 'AI-powered clinical handover system')}
                    </p>
                    <button onclick="window.showAuthModal()" class="bg-gradient-orange text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:opacity-90 transition-all w-full">
                        ${translate('تسجيل الدخول للبدء', 'Login to Start')}
                    </button>
                    <p class="text-sm text-slate-500 mt-4">
                        ${translate('يمكنك استخدام: demodar / demodar', 'You can use: demodar / demodar')}
                    </p>
                </div>
            </div>
        `;
    }

    function render() {
        if (!state.isAuthenticated) {
            renderAuthRequired();
            return;
        }

        const stats = getStats();
        const filteredPatients = getFilteredPatients();
        const selectedPatient = state.selectedPatientId 
            ? state.patients.find(p => p.id === state.selectedPatientId)
            : null;

        try {
            elements.app.innerHTML = renderApp({
                state,
                stats,
                filteredPatients,
                selectedPatient,
                translate
            });
        } catch (error) {
            console.error('Render error:', error);
            elements.app.innerHTML = `
                <div class="flex items-center justify-center min-h-screen">
                    <div class="text-center p-8">
                        <div class="text-red-500 text-4xl mb-4">⚠️</div>
                        <h1 class="text-2xl font-bold text-gray-800 dark:text-white mb-2">خطأ في العرض</h1>
                        <p class="text-gray-600 dark:text-gray-300 mb-4">${error.message}</p>
                        <button onclick="location.reload()" class="px-6 py-2 bg-primary text-white rounded-lg">
                            إعادة تحميل الصفحة
                        </button>
                    </div>
                </div>
            `;
        }
    }

    // دالة العرض الرئيسية
    function renderApp(props) {
        const { state, stats, filteredPatients, translate } = props;
        
        return `
            ${renderHeader(state, stats, translate)}
            
            <main class="max-w-7xl mx-auto px-4 py-6">
                ${state.currentView === 'alerts' 
                    ? renderAlertsPage(state, translate) 
                    : renderDashboard(state, stats, filteredPatients, translate)
                }
            </main>
            
            ${state.isModalOpen ? renderPatientModal(state, props.selectedPatient, translate) : ''}
            
            <!-- شريط حالة مفتاح API -->
            ${!state.apiKeyConfigured ? `
                <div class="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-40">
                    <div class="bg-gradient-to-r from-primary to-secondary text-white p-4 rounded-2xl shadow-xl flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-2xl">auto_awesome</span>
                            <div>
                                <p class="font-bold">${translate('تفعيل الذكاء الاصطناعي', 'Activate AI Features')}</p>
                                <p class="text-sm opacity-90">${translate('أدخل مفتاح API للميزات الذكية', 'Enter API key for smart features')}</p>
                            </div>
                        </div>
                        <button onclick="window.showApiKeyModal()" 
                                class="px-4 py-2 bg-white text-primary rounded-xl font-bold hover:opacity-90 transition-all">
                            ${translate('تفعيل الآن', 'Activate Now')}
                        </button>
                    </div>
                </div>
            ` : ''}
        `;
    }

    function renderHeader(state, stats, translate) {
        return `
            <header class="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 py-3 shadow-sm">
                <div class="max-w-7xl mx-auto flex justify-between items-center">
                    <!-- الشعار والمستخدم -->
                    <div class="flex items-center gap-4">
                        <div class="flex items-center gap-3">
                            <div class="w-11 h-11 bg-gradient-orange rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 transform transition-transform hover:rotate-6 cursor-pointer border-2 border-accent/50">
                                <span class="text-white text-2xl font-black font-inter">N</span>
                            </div>
                            <div>
                                <h1 class="text-lg font-black text-primary dark:text-white tracking-tight leading-none">Nuraithm</h1>
                                <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                                    ${translate('الذكاء السريري المتقدم', 'ADVANCED CLINICAL INTELLIGENCE')}
                                </p>
                            </div>
                        </div>
                        
                        <!-- معلومات المستخدم -->
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                <span class="material-symbols-outlined text-primary text-sm">person</span>
                            </div>
                            <div class="hidden md:block">
                                <p class="text-xs font-bold text-slate-700 dark:text-slate-300">${state.currentUser?.name || state.currentUser?.username || 'User'}</p>
                                <p class="text-[10px] text-slate-500">${translate('ممرض', 'Nurse')}</p>
                            </div>
                        </div>
                    </div>

                    <!-- الإجراءات -->
                    <div class="flex items-center gap-3">
                        <!-- زر التنبيهات -->
                        <button data-view="alerts" class="relative w-11 h-11 flex items-center justify-center bg-slate-100 dark:bg-slate-900 rounded-xl group transition-all hover:bg-red-50 dark:hover:bg-red-950/20">
                            <span class="material-symbols-outlined transition-colors ${stats.alerts > 0 ? 'text-red-500 animate-pulse' : 'text-slate-600 dark:text-slate-400'}">
                                notifications
                            </span>
                            ${stats.alerts > 0 ? `
                                <span class="absolute -top-1 -right-1 flex h-5 w-5">
                                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span class="relative inline-flex rounded-full h-5 w-5 bg-red-600 border-2 border-white dark:border-slate-900 text-[9px] font-black text-white items-center justify-center shadow-md">
                                        ${stats.alerts}
                                    </span>
                                </span>
                            ` : ''}
                        </button>

                        <!-- قائمة المستخدم -->
                        <div class="relative">
                            <button id="settings-toggle" class="w-11 h-11 flex items-center justify-center bg-slate-100 dark:bg-slate-900 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-all">
                                <span class="material-symbols-outlined text-slate-600 dark:text-white">person</span>
                            </button>
                            
                            <!-- القائمة المنسدلة للإعدادات -->
                            <div id="settings-dropdown" class="hidden absolute top-14 ${state.lang === 'ar' ? 'left-0' : 'right-0'} w-72 bg-white dark:bg-slate-900 p-5 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 z-50">
                                <div class="space-y-4">
                                    <!-- معلومات المستخدم -->
                                    <div class="text-center pb-4 border-b dark:border-slate-800">
                                        <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                            <span class="material-symbols-outlined text-primary text-2xl">person</span>
                                        </div>
                                        <h4 class="font-bold text-slate-900 dark:text-white">${state.currentUser?.name || state.currentUser?.username || 'User'}</h4>
                                        <p class="text-xs text-slate-500">${state.currentUser?.email || ''}</p>
                                    </div>
                                    
                                    <!-- إجراءات المستخدم -->
                                    <div class="space-y-2">
                                        <button data-profile class="w-full py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                                            <span class="material-symbols-outlined text-lg">manage_accounts</span>
                                            ${translate('الملف الشخصي', 'Profile')}
                                        </button>
                                        
                                        <!-- إعدادات التوقيع -->
                                        <button data-signature-settings class="w-full py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all">
                                            <span class="material-symbols-outlined text-lg">edit_document</span>
                                            ${translate('إعدادات التوقيع', 'Signature Settings')}
                                        </button>
                                        
                                        <!-- إعدادات اللغة -->
                                        <div class="pt-2 border-t dark:border-slate-800 space-y-2">
                                            <div class="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-2 rounded-xl">
                                                <span class="text-[10px] font-black text-slate-500 uppercase">
                                                    ${translate('لغة الواجهة', 'UI LANG')}
                                                </span>
                                                <button data-lang-toggle class="px-3 py-1 bg-white dark:bg-slate-700 rounded-lg text-[10px] font-black shadow-sm">
                                                    ${state.lang === 'ar' ? 'English' : 'العربية'}
                                                </button>
                                            </div>
                                            <div class="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-2 rounded-xl">
                                                <span class="text-[10px] font-black text-slate-500 uppercase">
                                                    ${translate('لغة الذكاء', 'AI LANG')}
                                                </span>
                                                <button data-ai-lang-toggle class="px-3 py-1 bg-white dark:bg-slate-700 rounded-lg text-[10px] font-black shadow-sm">
                                                    ${state.aiLang === 'ar' ? 'English' : 'العربية'}
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <!-- تبديل الوضع الداكن -->
                                        <button data-dark-mode-toggle class="w-full py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                                            <span class="material-symbols-outlined text-lg">
                                                ${state.darkMode ? 'light_mode' : 'dark_mode'}
                                            </span>
                                            ${state.darkMode 
                                                ? translate('الوضع المضيء', 'LIGHT MODE') 
                                                : translate('الوضع المظلم', 'DARK MODE')
                                            }
                                        </button>
                                        
                                        <!-- تكوين مفتاح API -->
                                        <button onclick="window.showApiKeyModal()" 
                                                class="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:opacity-90 transition-all">
                                            <span class="material-symbols-outlined text-lg">key</span>
                                            ${translate('تكوين مفتاح API', 'Configure API Key')}
                                        </button>
                                        
                                        <!-- تسجيل الخروج -->
                                        <button data-logout class="w-full py-3 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-red-200 dark:hover:bg-red-900/40 transition-all">
                                            <span class="material-symbols-outlined text-lg">logout</span>
                                            ${translate('تسجيل الخروج', 'Logout')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
        `;
    }

    function renderDashboard(state, stats, filteredPatients, translate) {
        return `
            <div class="space-y-6">
                <!-- شبكة الإحصائيات -->
                <div class="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4">
                    ${renderStatCard('group', translate('إجمالي المرضى', 'Total Patients'), stats.total, 'bg-blue-500')}
                    ${renderStatCard('clinical_notes', translate('نشطين', 'Active'), stats.active, 'bg-green-500')}
                    ${renderStatCard('transfer_within_a_station', translate('مسلمين', 'Discharged'), stats.discharged, 'bg-orange-500')}
                    ${renderStatCard('warning', translate('تنبيهات', 'Alerts'), stats.alerts, 'bg-red-500')}
                    ${renderStatCard('task_alt', translate('مهام', 'Tasks'), stats.todos, 'bg-purple-500')}
                </div>
                
                <!-- تبويبات المرضى -->
                <div class="flex bg-slate-200 dark:bg-slate-900 p-1.5 rounded-2xl w-full max-w-md">
                    <button data-patient-tab="active" class="flex-1 py-3 text-xs font-black transition-all rounded-xl ${state.activeTab === 'active' ? 'bg-primary text-white shadow-lg' : 'text-slate-500'}">
                        ${translate('المرضى الحاليين', 'ACTIVE PATIENTS')} (${stats.active})
                    </button>
                    <button data-patient-tab="discharged" class="flex-1 py-3 text-xs font-black transition-all rounded-xl ${state.activeTab === 'discharged' ? 'bg-primary text-white shadow-lg' : 'text-slate-500'}">
                        ${translate('المُسَلَّمون', 'DISCHARGED')} (${stats.discharged})
                    </button>
                </div>

                <!-- البحث والإجراءات -->
                <div class="flex flex-wrap items-center gap-4">
                    <div class="relative flex-1 min-w-[300px]">
                        <span class="material-symbols-outlined absolute ${state.lang === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-400">
                            search
                        </span>
                        <input 
                            type="text" 
                            data-search
                            placeholder="${translate('بحث بالاسم أو الرقم أو التشخيص...', 'Search by name, number, or diagnosis...')}"
                            value="${state.searchQuery}"
                            class="w-full ${state.lang === 'ar' ? 'pr-12 pl-6' : 'pl-12 pr-6'} py-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 ring-primary/20 text-slate-950 dark:text-white font-bold"
                        />
                    </div>
                    
                    <div class="flex gap-2">
                        <button data-quick-add-todo title="${translate('إضافة مهمة', 'Add Task')}" class="bg-orange-500 text-white w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center hover:scale-105 transition-all">
                            <span class="material-symbols-outlined">add_task</span>
                        </button>
                        <button data-quick-add-event title="${translate('تسجيل حدث', 'Log Event')}" class="bg-blue-500 text-white w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center hover:scale-105 transition-all">
                            <span class="material-symbols-outlined">event_note</span>
                        </button>
                        <button data-add-patient class="bg-primary text-white px-8 h-14 rounded-2xl shadow-xl flex items-center gap-2 hover:scale-105 transition-all">
                            <span class="material-symbols-outlined">person_add</span>
                            <span class="font-black text-xs uppercase">
                                ${translate('إضافة مريض', 'ADD PATIENT')}
                            </span>
                        </button>
                    </div>
                </div>

                <!-- شبكة المرضى -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${filteredPatients.length > 0 
                        ? filteredPatients.map(patient => renderPatientCard(patient, state, translate)).join('')
                        : renderEmptyState(
                            translate('لا توجد سجلات', 'No records found'),
                            translate('قم بإضافة مريض جديد لبدء العمل', 'Add a new patient to get started')
                          )
                    }
                </div>
                
                <!-- قسم المهام -->
                <div class="mt-8">
                    ${renderTasksSection()}
                </div>
            </div>
        `;
    }

    function renderStatCard(icon, label, value, color) {
        return `
            <div class="glass-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm flex flex-col justify-between overflow-hidden relative group h-full">
                <div class="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 ${color} opacity-10 rounded-full -mr-4 sm:-mr-8 -mt-4 sm:-mt-8 transition-transform group-hover:scale-125"></div>
                <span class="material-symbols-outlined ${color.replace('bg-', 'text-')} mb-3 sm:mb-4 text-2xl sm:text-3xl">
                    ${icon}
                </span>
                <div>
                    <h3 class="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-black uppercase tracking-widest">
                        ${label}
                    </h3>
                    <p class="text-2xl sm:text-3xl font-black dark:text-white mt-1">${value}</p>
                </div>
            </div>
        `;
    }

    function renderPatientCard(patient, state, translate) {
        const hasAlerts = state.alerts.some(a => a.patientId === patient.id && !a.read);
        const isActive = patient.status === 'active';
        const medsCount = patient.medications?.length || 0;
        const todosCount = patient.todos?.filter(t => !t.completed).length || 0;

        return `
            <div data-patient-id="${patient.id}" class="patient-card p-6 relative overflow-hidden">
                
                <!-- شارة الحالة -->
                <div class="absolute top-4 left-4">
                    <div class="inline-block px-4 py-1.5 rounded-full text-[10px] font-black ${isActive ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}">
                        ${isActive ? translate('نشط', 'ACTIVE') : translate('مسلم', 'DISCHARGED')}
                    </div>
                </div>
                
                <!-- مؤشرات المخاطر -->
                <div class="absolute top-4 right-4 flex gap-2">
                    ${patient.isbar?.background?.allergy && patient.isbar.background.allergy.toLowerCase() !== 'لا يوجد' && patient.isbar.background.allergy.toLowerCase() !== 'none' ? `
                        <div class="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg flex items-center justify-center" title="${translate('حساسية', 'Allergy')}">
                            <span class="material-symbols-outlined text-sm">warning</span>
                        </div>
                    ` : ''}
                    
                    ${patient.isbar?.background?.infections_isolation && patient.isbar.background.infections_isolation.toLowerCase() !== 'لا يوجد' && patient.isbar.background.infections_isolation.toLowerCase() !== 'none' ? `
                        <div class="w-8 h-8 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center" title="${translate('عزل', 'Isolation')}">
                            <span class="material-symbols-outlined text-sm">masks</span>
                        </div>
                    ` : ''}
                    
                    ${hasAlerts ? `
                        <div class="w-8 h-8 bg-red-600 text-white rounded-lg flex items-center justify-center animate-pulse" title="${translate('تحذير سريري', 'Clinical Hazard')}">
                            <span class="material-symbols-outlined text-sm">priority_high</span>
                        </div>
                    ` : ''}
                </div>

                <!-- معلومات المريض -->
                <div class="mb-6">
                    <h3 class="text-2xl font-black text-slate-950 dark:text-white mb-1 hover:text-primary cursor-pointer" data-edit-patient>
                        ${patient.name}
                    </h3>
                    <p class="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                        MRN: ${patient.fileNumber} • ${translate('غرفة', 'ROOM')}: ${patient.roomNumber}
                    </p>
                </div>

                <!-- التشخيص -->
                <div class="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl mb-6 border dark:border-slate-800">
                    <p class="text-xs font-bold text-slate-700 dark:text-slate-300 line-clamp-2">
                        ${patient.diagnosis || translate('لا يوجد تشخيص مسجل', 'No diagnosis recorded')}
                    </p>
                    <div class="flex gap-4 mt-3 text-[10px] font-black">
                        <span class="flex items-center gap-1 text-slate-500">
                            <span class="material-symbols-outlined text-xs">medication</span>
                            ${medsCount} ${translate('دواء', 'meds')}
                        </span>
                        <span class="flex items-center gap-1 text-slate-500">
                            <span class="material-symbols-outlined text-xs">task_alt</span>
                            ${todosCount} ${translate('مهمة', 'tasks')}
                        </span>
                    </div>
                </div>

                <!-- أزرار الإجراءات -->
                <div class="grid grid-cols-5 gap-2 mb-6">
                    <button data-patient-action="careplan" class="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 p-3 rounded-xl flex flex-col items-center gap-1 hover:scale-105 transition-all shadow-sm" title="${translate('خطة الرعاية', 'Care Plan')}">
                        <span class="material-symbols-outlined text-lg">analytics</span>
                        <span class="text-[8px] font-black uppercase">${translate('خطة', 'Plan')}</span>
                    </button>
                    <button data-patient-action="shift" class="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 p-3 rounded-xl flex flex-col items-center gap-1 hover:scale-105 transition-all shadow-sm" title="${translate('تقرير الشفت', 'Shift Report')}">
                        <span class="material-symbols-outlined text-lg">history_edu</span>
                        <span class="text-[8px] font-black uppercase">${translate('تقرير', 'Report')}</span>
                    </button>
                    <button data-patient-action="medtable" class="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 p-3 rounded-xl flex flex-col items-center gap-1 hover:scale-105 transition-all shadow-sm" title="${translate('جدول الأدوية', 'Med Table')}">
                        <span class="material-symbols-outlined text-lg">medication</span>
                        <span class="text-[8px] font-black uppercase">${translate('أدوية', 'Meds')}</span>
                    </button>
                    <button data-generate-alerts class="bg-blue-500 text-white p-3 rounded-xl flex flex-col items-center gap-1 hover:scale-105 transition-all shadow-sm" title="${translate('توليد تنبيهات', 'Generate Alerts')}">
                        <span class="material-symbols-outlined text-lg">auto_awesome</span>
                        <span class="text-[8px] font-black uppercase">${translate('تنبيهات', 'Alerts')}</span>
                    </button>
                    <button data-patient-action="handover" class="bg-primary text-white p-3 rounded-xl flex flex-col items-center gap-1 hover:scale-105 transition-all shadow-sm" title="${translate('تسليم', 'Handover')}">
                        <span class="material-symbols-outlined text-lg">picture_as_pdf</span>
                        <span class="text-[8px] font-black uppercase">${translate('تسليم', 'PDF')}</span>
                    </button>
                </div>

                <!-- إجراءات التذييل -->
                <div class="flex justify-between items-center pt-6 border-t dark:border-slate-800">
                    <div class="flex gap-2">
                        <button data-edit-patient class="text-xs font-black text-primary flex items-center gap-2">
                            <span class="material-symbols-outlined text-lg">folder_open</span>
                            ${translate('فتح الملف', 'OPEN CHART')}
                        </button>
                        ${!isActive ? `
                            <button data-receive-patient class="text-xs font-black text-green-600 flex items-center gap-2">
                                <span class="material-symbols-outlined text-lg">arrow_back</span>
                                ${translate('استلام', 'Receive')}
                            </button>
                        ` : `
                            <button data-handover-patient class="text-xs font-black text-orange-600 flex items-center gap-2">
                                <span class="material-symbols-outlined text-lg">arrow_forward</span>
                                ${translate('تسليم', 'Handover')}
                            </button>
                        `}
                    </div>
                    
                    <button data-delete-patient class="w-10 h-10 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all" title="${translate('حذف', 'Delete')}">
                        <span class="material-symbols-outlined text-sm">delete</span>
                    </button>
                </div>
            </div>
        `;
    }

    function renderTasksSection() {
        const activeTodos = state.todos.filter(t => !t.completed);
        const completedTodos = state.todos.filter(t => t.completed);
        
        return `
            <section class="mt-8">
                <div class="bg-white dark:bg-gray-800 rounded-2xl shadow">
                    
                    <!-- الرأس -->
                    <div class="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h3 class="text-xl font-bold flex items-center gap-2">
                            <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v14l-5-3-5 3V6a2 2 0 00-2-2z"/>
                            </svg>
                            قائمة المهام
                        </h3>

                        <button data-add-task
                            class="px-4 py-2 bg-primary text-white rounded-lg text-sm flex items-center gap-2">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                            </svg>
                            إضافة مهمة
                        </button>
                    </div>

                    <!-- المحتوى -->
                    <div class="p-6">
                        ${state.todos.length === 0 ? `
                            <div class="text-center py-8">
                                <p class="text-gray-500 mb-4">لا توجد مهام حالياً</p>
                                <button data-add-task
                                    class="px-6 py-2 bg-primary text-white rounded-lg flex items-center gap-2 mx-auto">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                                    </svg>
                                    إضافة أول مهمة
                                </button>
                            </div>
                        ` : `
                            <div class="space-y-3">
                                ${activeTodos.map(todo => `
                                    <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                        data-task-id="${todo.id}">
                                        
                                        <div class="flex items-start gap-3">
                                            <input type="checkbox"
                                                class="h-5 w-5 mt-1"
                                                ${todo.completed ? 'checked' : ''}
                                                onchange="window.NuraithmApp.toggleTask('${todo.id}')">

                                            <div>
                                                <p class="${todo.completed ? 'line-through text-gray-500' : ''}">
                                                    ${todo.text}
                                                </p>

                                                ${todo.patientName ? `
                                                    <p class="text-sm text-primary mt-1 flex items-center gap-1">
                                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                                            <path stroke-linecap="round" stroke-linejoin="round"
                                                                d="M15 7a3 3 0 11-6 0 3 3 0 016 0zM4 21a8 8 0 0116 0"/>
                                                        </svg>
                                                        ${todo.patientName}
                                                    </p>
                                                ` : ''}

                                                ${todo.dueDate ? `
                                                    <p class="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                                            <path stroke-linecap="round" stroke-linejoin="round"
                                                                d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                                        </svg>
                                                        ${new Date(todo.dueDate).toLocaleDateString('ar-EG')}
                                                    </p>
                                                ` : ''}
                                            </div>
                                        </div>

                                        <button onclick="window.NuraithmApp.deleteTask('${todo.id}')"
                                            class="text-red-500 hover:text-red-700">
                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round"
                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4m-6 4h8"/>
                                            </svg>
                                        </button>
                                    </div>
                                `).join('')}

                                ${completedTodos.length > 0 ? `
                                    <div class="mt-6">
                                        <h4 class="font-bold mb-3">
                                            المهام المنتهية (${completedTodos.length})
                                        </h4>

                                        <div class="space-y-3">
                                            ${completedTodos.map(todo => `
                                                <div class="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-600 rounded-lg"
                                                    data-task-id="${todo.id}">
                                                    
                                                    <div class="flex items-center gap-3">
                                                        <input type="checkbox" checked disabled class="h-5 w-5">
                                                        <p class="line-through text-gray-500">${todo.text}</p>
                                                    </div>

                                                    <button onclick="window.NuraithmApp.deleteTask('${todo.id}')"
                                                        class="text-red-500 hover:text-red-700">
                                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                                            <path stroke-linecap="round" stroke-linejoin="round"
                                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4m-6 4h8"/>
                                                        </svg>
                                                    </button>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        `}
                    </div>
                </div>
            </section>
        `;
    }

    function renderAlertsPage(state, translate) {
        const unreadAlerts = state.alerts.filter(a => !a.read);
        const readAlerts = state.alerts.filter(a => a.read);
        
        return `
            <div class="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                <!-- الرأس -->
                <div class="flex items-center justify-between mb-8">
                    <div class="flex items-center gap-4">
                        <button data-view="dashboard" class="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white transition-all hover:bg-slate-200">
                            <span class="material-symbols-outlined">arrow_back</span>
                        </button>
                        <div>
                            <h1 class="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white">
                                ${translate('مركز التحليل الذكي', 'Clinical AI Center')}
                            </h1>
                            <p class="text-sm text-slate-500 dark:text-slate-400">
                                ${translate('التنبيهات والتحذيرات والنصائح السريرية', 'Clinical alerts, warnings and advice')}
                            </p>
                        </div>
                    </div>
                    
                    <div class="flex gap-2">
                        ${unreadAlerts.length > 0 ? `
                            <button data-clear-alerts class="px-6 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-xs font-black transition-all hover:bg-red-600 hover:text-white">
                                ${translate('مسح المقروء', 'CLEAR READ')}
                            </button>
                        ` : ''}
                        <button onclick="window.showApiKeyModal()" 
                                class="px-6 py-2 bg-primary text-white rounded-xl text-xs font-black transition-all hover:bg-primary/80">
                            ${translate('إعدادات الذكاء', 'AI Settings')}
                        </button>
                    </div>
                </div>

                <!-- الإحصائيات -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                                <span class="material-symbols-outlined text-red-600 dark:text-red-400">gpp_maybe</span>
                            </div>
                            <div>
                                <p class="text-2xl font-black">${state.alerts.filter(a => a.category === 'hazard').length}</p>
                                <p class="text-sm text-slate-500">${translate('مخاطر', 'Hazards')}</p>
                            </div>
                        </div>
                    </div>
                    <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                                <span class="material-symbols-outlined text-orange-600 dark:text-orange-400">notifications_active</span>
                            </div>
                            <div>
                                <p class="text-2xl font-black">${state.alerts.filter(a => a.category === 'warning').length}</p>
                                <p class="text-sm text-slate-500">${translate('تنبيهات', 'Warnings')}</p>
                            </div>
                        </div>
                    </div>
                    <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                <span class="material-symbols-outlined text-blue-600 dark:text-blue-400">lightbulb</span>
                            </div>
                            <div>
                                <p class="text-2xl font-black">${state.alerts.filter(a => a.category === 'tip').length}</p>
                                <p class="text-sm text-slate-500">${translate('نصائح', 'Tips')}</p>
                            </div>
                        </div>
                    </div>
                    <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                                <span class="material-symbols-outlined text-emerald-600 dark:text-emerald-400">menu_book</span>
                            </div>
                            <div>
                                <p class="text-2xl font-black">${state.alerts.filter(a => a.category === 'learning').length}</p>
                                <p class="text-sm text-slate-500">${translate('تعلم', 'Learning')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- شبكة التنبيهات -->
                <div class="space-y-8">
                    <!-- التنبيهات غير المقروءة -->
                    ${unreadAlerts.length > 0 ? `
                        <section>
                            <h3 class="text-lg font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                <span class="material-symbols-outlined text-red-500">notifications_unread</span>
                                ${translate('التنبيهات الجديدة', 'New Alerts')}
                                <span class="bg-red-500 text-white text-xs px-2 py-1 rounded-full">${unreadAlerts.length}</span>
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                ${unreadAlerts.map(alert => renderAlertItem(alert, translate)).join('')}
                            </div>
                        </section>
                    ` : ''}
                    
                    <!-- التنبيهات المقروءة -->
                    ${readAlerts.length > 0 ? `
                        <section>
                            <h3 class="text-lg font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                <span class="material-symbols-outlined text-slate-500">notifications</span>
                                ${translate('التنبيهات المقروءة', 'Read Alerts')}
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                ${readAlerts.map(alert => renderAlertItem(alert, translate)).join('')}
                            </div>
                        </section>
                    ` : ''}
                    
                    ${state.alerts.length === 0 ? `
                        <div class="text-center py-20">
                            <div class="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span class="material-symbols-outlined text-slate-400 text-4xl">check_circle</span>
                            </div>
                            <h3 class="text-xl font-black text-slate-400 mb-2">${translate('لا توجد تنبيهات', 'No alerts')}</h3>
                            <p class="text-slate-500 max-w-md mx-auto">
                                ${translate('جميع الأمور تحت السيطرة! سيظهر هنا أي تحذيرات أو نصائح سريرية جديدة.', 'All clear! Any new clinical warnings or tips will appear here.')}
                            </p>
                            ${state.patients.length > 0 ? `
                                <button onclick="window.NuraithmApp.generateAIAlerts('${state.patients[0]?.id || ''}')" class="mt-6 px-6 py-3 bg-primary text-white rounded-xl font-bold">
                                    ${translate('توليد تنبيهات ذكية', 'Generate Smart Alerts')}
                                </button>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    function renderAlertItem(alert, translate) {
        const bgColor = alert.category === 'hazard' ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800' :
                       alert.category === 'warning' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800' :
                       alert.category === 'tip' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800' :
                       'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800';
        
        const icon = alert.category === 'hazard' ? 'error' :
                    alert.category === 'warning' ? 'warning' :
                    alert.category === 'tip' ? 'lightbulb' : 'school';
        
        const iconColor = alert.category === 'hazard' ? 'text-red-600 dark:text-red-400' :
                         alert.category === 'warning' ? 'text-orange-600 dark:text-orange-400' :
                         alert.category === 'tip' ? 'text-blue-600 dark:text-blue-400' :
                         'text-emerald-600 dark:text-emerald-400';

        return `
            <div data-alert-id="${alert.id}" class="${bgColor} border p-6 rounded-2xl relative group animate-in zoom-in-95 duration-300 transition-all hover:shadow-lg">
                <div class="flex gap-4">
                    <div class="w-12 h-12 rounded-xl ${iconColor.replace('text-', 'bg-').replace('dark:', 'dark:bg-')}${iconColor.includes('dark:') ? '/20' : ' bg-opacity-20'} flex items-center justify-center flex-shrink-0">
                        <span class="material-symbols-outlined ${iconColor}">${icon}</span>
                    </div>
                    <div class="flex-1">
                        <div class="flex justify-between items-start mb-2">
                            <h4 class="text-[15px] font-black text-slate-900 dark:text-white leading-tight">${alert.title}</h4>
                            <div class="flex gap-2">
                                ${!alert.read ? `
                                    <button data-mark-alert-read class="text-[10px] font-black text-primary uppercase bg-white dark:bg-slate-800 px-3 py-1 rounded-lg border shadow-sm transition-all hover:scale-105">
                                        ${translate('تم', 'DONE')}
                                    </button>
                                ` : ''}
                                <button data-delete-alert class="text-[10px] font-black text-red-600 uppercase bg-white dark:bg-slate-800 px-3 py-1 rounded-lg border shadow-sm transition-all hover:scale-105">
                                    ${translate('حذف', 'DELETE')}
                                </button>
                            </div>
                        </div>
                        <p class="text-[13px] font-bold text-slate-600 dark:text-slate-400 leading-relaxed mb-3">${alert.message}</p>
                        <div class="flex justify-between items-center text-[11px] font-black text-slate-400 uppercase tracking-widest">
                            <span class="bg-white dark:bg-slate-800 px-3 py-1 rounded-lg">${translate('مريض', 'PT')}: ${alert.patientName}</span>
                            <span>${new Date(alert.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function renderPatientModal(state, patient, translate) {
        const isNew = !patient;
        const tempData = state.tempPatientData[state.selectedPatientId] || {};
        
        return `
            <div class="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-950">
                <!-- الرأس -->
                <div class="bg-gradient-to-r from-primary to-secondary p-6 text-white flex justify-between items-center shadow-lg">
                    <div class="flex items-center gap-4">
                        <button data-close-modal class="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-all">
                            <span class="material-symbols-outlined">close</span>
                        </button>
                        <div>
                            <h2 class="text-lg font-black">${isNew ? translate('ملف مريض جديد', 'NEW PATIENT CHART') : patient.name}</h2>
                            <p class="text-[10px] opacity-70 font-black tracking-widest uppercase">Nuraithm Clinical System</p>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button data-save-temp class="bg-white/10 px-6 py-2 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-white/20 transition-all">
                            <span class="material-symbols-outlined text-sm">save</span> ${translate('حفظ مؤقت', 'Save Temp')}
                        </button>
                        <button data-export-pdf class="bg-white/10 px-6 py-2 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-white/20 transition-all">
                            <span class="material-symbols-outlined text-sm">picture_as_pdf</span> PDF
                        </button>
                        <button data-save-patient class="bg-accent text-primary px-8 py-2 rounded-xl text-xs font-black shadow-xl hover:scale-105 active:scale-95 transition-all">
                            ${isNew ? translate('إضافة المريض', 'ADD PATIENT') : translate('حفظ التغييرات', 'SAVE CHANGES')}
                        </button>
                    </div>
                </div>

                <!-- التبويبات -->
                <div class="flex bg-white dark:bg-slate-900 border-b dark:border-slate-800 overflow-x-auto no-scrollbar shrink-0 px-4">
                    ${['id', 'situation', 'background', 'assess', 'recs', 'meds', 'labs', 'rad', 'events'].map(tab => `
                        <button data-tab="${tab}" class="flex-shrink-0 px-6 py-4 flex flex-col items-center gap-1 border-b-4 transition-all duration-300 ${state.modalTab === tab ? 'border-primary text-primary' : 'border-transparent text-slate-400'}">
                            <span class="material-symbols-outlined text-xl">${getTabIcon(tab)}</span>
                            <span class="text-[9px] font-black uppercase tracking-tighter">${getTabLabel(tab, translate)}</span>
                        </button>
                    `).join('')}
                </div>

                <!-- المحتوى -->
                <div class="flex-1 overflow-y-auto p-6">
                    <div class="max-w-4xl mx-auto">
                        ${renderModalTabContent(state.modalTab, patient, tempData, translate)}
                    </div>
                </div>
            </div>
        `;
    }

    function getTabIcon(tab) {
        const icons = {
            'id': 'badge',
            'situation': 'medical_information',
            'background': 'history',
            'assess': 'stethoscope',
            'recs': 'pending_actions',
            'meds': 'medication',
            'labs': 'biotech',
            'rad': 'radiology',
            'events': 'timeline'
        };
        return icons[tab] || 'info';
    }

    function getTabLabel(tab, translate) {
        const labels = {
            'id': translate('هوية', 'Identity'),
            'situation': translate('حالة', 'Situation'),
            'background': translate('خلفية', 'Background'),
            'assess': translate('تقييم', 'Assessment'),
            'recs': translate('توصيات', 'Recommendations'),
            'meds': translate('أدوية', 'Medications'),
            'labs': translate('تحاليل', 'Labs'),
            'rad': translate('أشعة', 'Radiology'),
            'events': translate('أحداث', 'Events')
        };
        return labels[tab] || tab;
    }

    function renderModalTabContent(tab, patient, tempData, translate) {
        const isbar = patient?.isbar || {};
        
        switch(tab) {
            case 'id':
                return `
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${renderFormInput('patientName', translate('اسم المريض', 'Patient Name'), 
                            tempData.patientName || patient?.name || '', 'text', true, 'patient-field')}
                        ${renderFormInput('fileNumber', 'MRN', 
                            tempData.fileNumber || patient?.fileNumber || `MRN${Date.now().toString().slice(-6)}`, 'text', false, 'patient-field')}
                        ${renderFormInput('age', translate('العمر', 'Age'), 
                            tempData.age || patient?.age || '', 'text', false, 'patient-field')}
                        ${renderFormInput('roomNumber', translate('رقم الغرفة', 'Room No'), 
                            tempData.roomNumber || isbar.identification?.room_no || '', 'text', false, 'patient-field')}
                        ${renderFormInput('admissionDate', translate('تاريخ القبول', 'Admission Date'), 
                            tempData.admissionDate || isbar.identification?.admission_date || new Date().toISOString().split('T')[0], 'date', false, 'patient-field')}
                        ${renderFormInput('admittedFrom', translate('قادم من', 'Admitted From'), 
                            tempData.admittedFrom || isbar.identification?.admitted_from || 'ER', 'text', false, 'patient-field')}
                        ${renderFormInput('consultant', translate('الطبيب المعالج', 'Consultant'), 
                            tempData.consultant || isbar.identification?.consultant || '', 'text', false, 'patient-field')}
                    </div>
                `;
                
            case 'situation':
                return `
                    <div class="space-y-6">
                        ${renderFormTextarea('diagnosis', translate('التشخيص', 'Diagnosis'), 
                            tempData.diagnosis || patient?.diagnosis || isbar.situation?.diagnosis || '', 'patient-field')}
                        ${renderFormTextarea('currentComplaints', translate('الشكوى الحالية', 'Current Complaints'), 
                            tempData.currentComplaints || isbar.situation?.current_complaints || '', 'patient-field')}
                        ${renderFormInput('diet', translate('الحمية الغذائية', 'Diet'), 
                            tempData.diet || isbar.situation?.diet || '', 'text', false, 'patient-field')}
                    </div>
                `;
                
            case 'background':
                return `
                    <div class="space-y-6">
                        ${renderFormTextarea('pastMedicalHistory', translate('التاريخ المرضي', 'Past Medical History'), 
                            tempData.pastMedicalHistory || isbar.background?.past_medical_history || '', 'patient-field')}
                        ${renderFormTextarea('chiefComplaint', translate('سبب القبول', 'Chief Complaint'), 
                            tempData.chiefComplaint || isbar.background?.chief_complaint || '', 'patient-field')}
                        ${renderFormInput('allergy', translate('الحساسية', 'Allergies'), 
                            tempData.allergy || isbar.background?.allergy || translate('لا يوجد', 'None'), 'text', false, 'patient-field')}
                        ${renderFormInput('isolation', translate('العزل', 'Isolation'), 
                            tempData.isolation || isbar.background?.infections_isolation || translate('لا يوجد', 'None'), 'text', false, 'patient-field')}
                    </div>
                `;
                
            case 'assess':
                return `
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${renderFormInput('gcs', 'GCS', 
                            tempData.gcs || isbar.assessment?.gcs || '15', 'number', false, 'patient-field')}
                        ${renderFormSelect('fallRisk', translate('خطر السقوط', 'Fall Risk'), ['low', 'medium', 'high'], 
                            tempData.fallRisk || isbar.assessment?.fall_risk || 'low', 'patient-field')}
                        ${renderFormTextarea('vitals', translate('العلامات الحيوية', 'Vital Signs'), 
                            tempData.vitals || isbar.assessment?.vitals || '', 'patient-field')}
                        ${renderFormInput('ventilation', translate('الدعم التنفسي', 'Ventilation'), 
                            tempData.ventilation || isbar.assessment?.ventilation || 'Room Air', 'text', false, 'patient-field')}
                        ${renderFormSelect('bedSore', translate('قرحة الفراش', 'Bed Sore'), ['no', 'yes'], 
                            tempData.bedSore || isbar.assessment?.bed_sore || 'no', 'patient-field')}
                        ${renderFormSelect('restraint', translate('التقييد البدني', 'Physical Restraint'), ['no', 'yes'], 
                            tempData.restraint || isbar.assessment?.physical_restraint || 'no', 'patient-field')}
                        ${renderFormTextarea('findings', translate('الملاحظات الهامة', 'Important Findings'), 
                            tempData.findings || isbar.assessment?.important_findings || '', 'patient-field')}
                    </div>
                `;
                
            case 'recs':
                return `
                    <div class="space-y-6">
                        ${renderFormTextarea('planOfCare', translate('خطة الرعاية', 'Plan of Care'), 
                            tempData.planOfCare || isbar.recommendations?.plan_of_care || '', 'patient-field')}
                        ${renderFormTextarea('risks', translate('المخاطر', 'Risks'), 
                            tempData.risks || isbar.recommendations?.risks || '', 'patient-field')}
                    </div>
                `;
                
            case 'events':
                return `
                    <div class="space-y-4">
                        <div class="flex justify-between items-center">
                            <h3 class="font-bold text-lg">📝 الأحداث السريرية</h3>
                            <button onclick="addClinicalEvent('${patient?.id || ''}')" class="px-4 py-2 bg-primary text-white rounded-lg text-sm">
                                + إضافة حدث
                            </button>
                        </div>
                        
                        ${patient?.isbar?.shift_notes?.length > 0 ? `
                            <div class="space-y-3">
                                ${patient.isbar.shift_notes.map((event, index) => `
                                    <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                        <div class="flex justify-between items-start">
                                            <div>
                                                <p class="font-medium">${event.event}</p>
                                                <p class="text-sm text-gray-500">${event.time}</p>
                                                ${event.category ? `<span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">${event.category}</span>` : ''}
                                            </div>
                                            <button onclick="deleteEvent('${patient?.id || ''}', ${index})" class="text-red-500 hover:text-red-700">
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <p class="text-gray-500 text-center py-8">لا توجد أحداث مسجلة</p>
                        `}
                    </div>
                `;
                
            case 'labs':
                return `
                    <div class="space-y-4">
                        <div class="flex justify-between items-center">
                            <h3 class="font-bold text-lg">🧪 التحاليل المخبرية</h3>
                            <button data-add-lab class="px-4 py-2 bg-primary text-white rounded-lg text-sm">
                                + إضافة تحليل
                            </button>
                        </div>
                        
                        ${patient?.labs?.length > 0 ? `
                            <div class="overflow-x-auto">
                                <table class="w-full border-collapse">
                                    <thead>
                                        <tr class="bg-gray-100 dark:bg-gray-800">
                                            <th class="p-3 text-right">التحليل</th>
                                            <th class="p-3 text-right">القيمة</th>
                                            <th class="p-3 text-right">الوحدة</th>
                                            <th class="p-3 text-right">التاريخ</th>
                                            <th class="p-3 text-right">الإجراء</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${patient.labs.map((lab, index) => `
                                            <tr class="border-b dark:border-gray-800">
                                                <td class="p-3">${lab.type}</td>
                                                <td class="p-3">${lab.value}</td>
                                                <td class="p-3">${lab.unit}</td>
                                                <td class="p-3">${new Date(lab.date).toLocaleDateString('ar-EG')}</td>
                                                <td class="p-3">
                                                    <button onclick="deleteLabTest('${patient?.id || ''}', ${index})" class="px-3 py-1 bg-red-100 text-red-600 rounded text-sm">
                                                        حذف
                                                    </button>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        ` : `
                            <p class="text-gray-500 text-center py-8">لا توجد تحاليل مسجلة</p>
                        `}
                    </div>
                `;
                
            case 'rad':
                return `
                    <div class="space-y-4">
                        <div class="flex justify-between items-center">
                            <h3 class="font-bold text-lg">📷 الأشعة والتصوير</h3>
                            <button data-add-radiology class="px-4 py-2 bg-primary text-white rounded-lg text-sm">
                                + إضافة أشعة
                            </button>
                        </div>
                        
                        ${patient?.radiology?.length > 0 ? `
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                ${patient.radiology.map((rad, index) => `
                                    <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                        <div class="flex justify-between items-start mb-2">
                                            <h4 class="font-bold">${rad.type}</h4>
                                            <button onclick="deleteRadiology('${patient?.id || ''}', ${index})" class="px-3 py-1 bg-red-100 text-red-600 rounded text-sm">
                                                حذف
                                            </button>
                                        </div>
                                        <p class="text-sm mb-2">${rad.result || 'لا توجد نتائج'}</p>
                                        <p class="text-xs text-gray-500">
                                            ${new Date(rad.date).toLocaleDateString('ar-EG')}
                                            ${rad.doctor ? ` | ${rad.doctor}` : ''}
                                        </p>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <p class="text-gray-500 text-center py-8">لا توجد أشعة مسجلة</p>
                        `}
                    </div>
                `;
                
            default:
                return `
                    <div class="text-center py-20">
                        <p class="text-gray-500">قيد التطوير</p>
                    </div>
                `;
        }
    }

    function renderFormInput(id, label, value, type = 'text', required = false, className = '') {
        return `
            <div class="flex flex-col gap-2">
                <label for="${id}" class="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-2">
                    ${label} ${required ? '*' : ''}
                </label>
                <input 
                    type="${type}" 
                    id="${id}"
                    value="${value}"
                    ${required ? 'required' : ''}
                    class="w-full p-3 border rounded-lg dark:bg-slate-800 dark:border-slate-700 focus:ring-2 ring-primary/20 outline-none transition-all ${className}"
                />
            </div>
        `;
    }

    function renderFormTextarea(id, label, value, className = '') {
        return `
            <div class="flex flex-col gap-2">
                <label for="${id}" class="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-2">
                    ${label}
                </label>
                <textarea 
                    id="${id}"
                    class="w-full p-3 border rounded-lg dark:bg-slate-800 dark:border-slate-700 h-32 focus:ring-2 ring-primary/20 outline-none transition-all ${className}"
                >${value}</textarea>
            </div>
        `;
    }

    function renderFormSelect(id, label, options, value, className = '') {
        return `
            <div class="flex flex-col gap-2">
                <label for="${id}" class="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-2">
                    ${label}
                </label>
                <select 
                    id="${id}"
                    class="w-full p-3 border rounded-lg dark:bg-slate-800 dark:border-slate-700 focus:ring-2 ring-primary/20 outline-none transition-all ${className}"
                >
                    ${options.map(option => `
                        <option value="${option}" ${option === value ? 'selected' : ''}>
                            ${translate(option, option)}
                        </option>
                    `).join('')}
                </select>
            </div>
        `;
    }

    function renderEmptyState(title, description) {
        return `
            <div class="col-span-3">
                <div class="text-center py-16 px-4">
                    <div class="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span class="material-symbols-outlined text-slate-400 text-4xl">folder_off</span>
                    </div>
                    <h3 class="text-xl font-black text-slate-400 mb-2">${title}</h3>
                    <p class="text-slate-500 max-w-md mx-auto mb-8">${description}</p>
                    <button data-add-patient class="bg-primary text-white px-8 py-3 rounded-xl font-black shadow-lg hover:scale-105 transition-all">
                        ${translate('إضافة مريض جديد', 'Add New Patient')}
                    </button>
                </div>
            </div>
        `;
    }

    // دوال إضافية للمودالات
    function addClinicalEvent(patientId) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full">
                <div class="bg-gradient-to-r from-primary to-secondary p-6 text-white flex justify-between items-center rounded-t-3xl">
                    <h3 class="text-xl font-black">إضافة حدث سريري</h3>
                    <button onclick="this.closest('.fixed').remove()" class="w-10 h-10 rounded-xl hover:bg-white/20 flex items-center justify-center">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                
                <div class="p-6 space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">الحدث</label>
                        <textarea id="event-text" class="w-full p-3 border rounded-lg dark:bg-slate-800 dark:border-slate-700" rows="3" placeholder="وصف الحدث السريري..."></textarea>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">التصنيف</label>
                        <select id="event-category" class="w-full p-3 border rounded-lg dark:bg-slate-800 dark:border-slate-700">
                            <option value="assessment">تقييم</option>
                            <option value="intervention">تدخل</option>
                            <option value="medication">دواء</option>
                            <option value="procedure">إجراء</option>
                            <option value="note">ملاحظة</option>
                        </select>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">التاريخ</label>
                            <input type="date" id="event-date" class="w-full p-3 border rounded-lg dark:bg-slate-800 dark:border-slate-700" value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">الوقت</label>
                            <input type="time" id="event-time" class="w-full p-3 border rounded-lg dark:bg-slate-800 dark:border-slate-700" value="${new Date().toTimeString().slice(0,5)}">
                        </div>
                    </div>
                </div>
                
                <div class="p-6 border-t dark:border-slate-800 flex justify-end gap-3">
                    <button onclick="this.closest('.fixed').remove()" class="px-6 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                        إلغاء
                    </button>
                    <button onclick="saveClinicalEvent('${patientId}')" class="px-6 py-2 bg-primary text-white rounded-xl">
                        حفظ الحدث
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    async function saveClinicalEvent(patientId) {
        const event = {
            event: document.getElementById('event-text').value,
            category: document.getElementById('event-category').value,
            date: document.getElementById('event-date').value,
            time: document.getElementById('event-time').value,
            createdAt: new Date().toISOString()
        };
        
        if (!event.event) {
            showNotification('الرجاء إدخال وصف الحدث', 'warning');
            return;
        }
        
        try {
            const patient = state.patients.find(p => p.id === patientId);
            const updatedEvents = [{ ...event, id: Date.now().toString() }, ...(patient.isbar?.shift_notes || [])];
            
            const updatedIsbar = { ...patient.isbar, shift_notes: updatedEvents };
            
            await PocketBaseService.PatientService.updatePatient(patientId, {
                isbar: updatedIsbar
            });
            
            showNotification('تم إضافة الحدث', 'success');
            await loadInitialData();
            render();
            
            const modal = document.querySelector('.fixed.inset-0.z-50');
            if (modal) modal.remove();
            
        } catch (error) {
            console.error('Error saving event:', error);
            showNotification('خطأ في حفظ الحدث', 'error');
        }
    }

    async function deleteEvent(patientId, index) {
        if (!confirm('هل تريد حذف هذا الحدث؟')) return;
        
        try {
            const patient = state.patients.find(p => p.id === patientId);
            const updatedEvents = patient.isbar?.shift_notes?.filter((_, i) => i !== index) || [];
            
            const updatedIsbar = { ...patient.isbar, shift_notes: updatedEvents };
            
            await PocketBaseService.PatientService.updatePatient(patientId, {
                isbar: updatedIsbar
            });
            
            showNotification('تم حذف الحدث', 'success');
            await loadInitialData();
            render();
            
        } catch (error) {
            console.error('Error deleting event:', error);
            showNotification('خطأ في حذف الحدث', 'error');
        }
    }

    async function deleteLabTest(patientId, index) {
        if (!confirm('هل تريد حذف هذا التحليل؟')) return;
        
        try {
            const patient = state.patients.find(p => p.id === patientId);
            const updatedLabs = patient.labs.filter((_, i) => i !== index);
            
            await PocketBaseService.PatientService.updatePatient(patientId, {
                labs: updatedLabs
            });
            
            showNotification('تم حذف التحليل', 'success');
            await loadInitialData();
            render();
            
        } catch (error) {
            console.error('Error deleting lab test:', error);
            showNotification('خطأ في حذف التحليل', 'error');
        }
    }

    async function deleteRadiology(patientId, index) {
        if (!confirm('هل تريد حذف هذه الأشعة؟')) return;
        
        try {
            const patient = state.patients.find(p => p.id === patientId);
            const updatedRadiology = patient.radiology.filter((_, i) => i !== index);
            
            await PocketBaseService.PatientService.updatePatient(patientId, {
                radiology: updatedRadiology
            });
            
            showNotification('تم حذف الأشعة', 'success');
            await loadInitialData();
            render();
            
        } catch (error) {
            console.error('Error deleting radiology:', error);
            showNotification('خطأ في حذف الأشعة', 'error');
        }
    }

    // API العامة
    return {
        init,
        state,
        translate,
        showNotification,
        generateAIAlerts,
        render,
        toggleTask,
        deleteTask,
        toggleTodo,
        deleteTodo,
        addTodo
    };
})();

// جعل التطبيق متاحاً عالمياً
window.NuraithmApp = NuraithmApp;

// جعل الدوال الإضافية متاحة عالمياً
window.addClinicalEvent = addClinicalEvent;
window.saveClinicalEvent = saveClinicalEvent;
window.deleteEvent = deleteEvent;
window.deleteLabTest = deleteLabTest;
window.deleteRadiology = deleteRadiology;
window.copyToClipboard = copyToClipboard;