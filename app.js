// Main Application File
const NuraithmApp = (function() {
    // Application State
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
        isSettingsOpen: false
    };

    // DOM Elements
    let elements = {};

    // Translation function
    function translate(ar, en) {
        return state.lang === 'ar' ? ar : en;
    }

    // Initialize Application
    async function init() {
        console.log('Initializing Nuraithm App...');
        
        // Check authentication
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
        
        // Start realtime subscriptions
        startRealtimeSubscriptions();
    }

    // Setup DOM References
    function setupDOMReferences() {
        elements = {
            app: document.getElementById('app')
        };
    }

    // Load Initial Data from PocketBase
    async function loadInitialData() {
        console.log('Loading data from PocketBase...');
        
        try {
            const data = await PocketBaseService.initialize();
            
            state.patients = data.patients || [];
            state.alerts = data.alerts || [];
            state.todos = data.todos || [];
            
            // Load signature
            state.signature = localStorage.getItem('nuraithm_signature') || state.currentUser?.name || '';
            
            console.log(`Loaded ${state.patients.length} patients, ${state.alerts.length} alerts, ${state.todos.length} todos`);
            
        } catch (error) {
            console.error('Error loading data:', error);
            // Initialize with empty arrays
            state.patients = [];
            state.alerts = [];
            state.todos = [];
            state.signature = localStorage.getItem('nuraithm_signature') || '';
        }
    }

    // Check API key status
    function checkApiKeyStatus() {
        if (window.DeepSeekService && window.DeepSeekService.hasApiKey()) {
            state.apiKeyConfigured = true;
            console.log('DeepSeek API key is configured and valid');
        } else {
            state.apiKeyConfigured = false;
            console.log('DeepSeek API key not configured');
        }
    }

    // Start realtime subscriptions
    function startRealtimeSubscriptions() {
        try {
            // Subscribe to patients
            PocketBaseService.RealtimeService.subscribeToPatients((e) => {
                console.log('Patient update:', e);
                if (e.action === 'create' || e.action === 'update' || e.action === 'delete') {
                    loadInitialData().then(() => render());
                }
            });
            
            // Subscribe to alerts
            PocketBaseService.RealtimeService.subscribeToAlerts((e) => {
                console.log('Alert update:', e);
                if (e.action === 'create') {
                    // Play notification sound for new alerts
                    playNotificationSound();
                }
                loadInitialData().then(() => render());
            });
            
            // Subscribe to todos
            PocketBaseService.RealtimeService.subscribeToTodos((e) => {
                console.log('Todo update:', e);
                loadInitialData().then(() => render());
            });
            
        } catch (error) {
            console.error('Realtime subscription error:', error);
        }
    }

    // Play notification sound
    function playNotificationSound() {
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ');
            audio.play().catch(e => console.log('Audio play failed:', e));
        } catch (error) {
            console.log('Notification sound error:', error);
        }
    }

    // Setup Event Listeners
    function setupEventListeners() {
        document.addEventListener('click', handleGlobalClick);
        document.addEventListener('input', handleGlobalInput);
        document.addEventListener('change', handleGlobalChange);
        
        // Close settings dropdown when clicking outside
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

    // Handle Global Clicks
    async function handleGlobalClick(e) {
        const target = e.target;
        
        // Add task button
        if (target.closest('[data-add-task]')) {
            e.preventDefault();
            showAddTaskModal();
            return;
        }
        
        // Toggle task
        if (target.closest('[data-task-id]')) {
            const taskId = target.closest('[data-task-id]').dataset.taskId;
            if (taskId) {
                toggleTask(taskId);
                return;
            }
        }
        
        // Logout
        if (target.closest('[data-logout]')) {
            e.preventDefault();
            await logout();
            return;
        }
        
        // User profile
        if (target.closest('[data-profile]')) {
            e.preventDefault();
            showUserProfileModal();
            return;
        }
        
        // Settings toggle
        if (target.closest('#settings-toggle')) {
            e.preventDefault();
            const dropdown = document.getElementById('settings-dropdown');
            if (dropdown) {
                dropdown.classList.toggle('hidden');
            }
            return;
        }
        
        // Add patient button
        if (target.closest('[data-add-patient]')) {
            e.preventDefault();
            openPatientModal();
            return;
        }
        
        // Edit patient button
        if (target.closest('[data-edit-patient]')) {
            e.preventDefault();
            const patientCard = target.closest('[data-patient-id]');
            if (patientCard) {
                const patientId = patientCard.dataset.patientId;
                openPatientModal(patientId);
            }
            return;
        }
        
        // Close modal button
        if (target.closest('[data-close-modal]')) {
            e.preventDefault();
            closeModal();
            return;
        }
        
        // Save patient button
        if (target.closest('[data-save-patient]')) {
            e.preventDefault();
            await savePatient();
            return;
        }
        
        // Delete patient button
        if (target.closest('[data-delete-patient]')) {
            e.preventDefault();
            const patientCard = target.closest('[data-patient-id]');
            if (patientCard) {
                const patientId = patientCard.dataset.patientId;
                await deletePatient(patientId);
            }
            return;
        }
        
        // Export PDF button
        if (target.closest('[data-export-pdf]')) {
            e.preventDefault();
            await exportPatientPDF();
            return;
        }
        
        // Toggle todo
        if (target.closest('[data-toggle-todo]')) {
            e.preventDefault();
            const todoItem = target.closest('[data-todo-id]');
            if (todoItem) {
                const todoId = todoItem.dataset.todoId;
                await toggleTodo(todoId);
            }
            return;
        }
        
        // Add todo
        if (target.closest('[data-add-todo]')) {
            e.preventDefault();
            await addTodo();
            return;
        }
        
        // Delete todo
        if (target.closest('[data-delete-todo]')) {
            e.preventDefault();
            const todoItem = target.closest('[data-todo-id]');
            if (todoItem) {
                const todoId = todoItem.dataset.todoId;
                await deleteTodo(todoId);
            }
            return;
        }
        
        // Mark alert as read
        if (target.closest('[data-mark-alert-read]')) {
            e.preventDefault();
            const alertItem = target.closest('[data-alert-id]');
            if (alertItem) {
                const alertId = alertItem.dataset.alertId;
                await markAlertAsRead(alertId);
            }
            return;
        }
        
        // Delete alert
        if (target.closest('[data-delete-alert]')) {
            e.preventDefault();
            const alertItem = target.closest('[data-alert-id]');
            if (alertItem) {
                const alertId = alertItem.dataset.alertId;
                await deleteAlert(alertId);
            }
            return;
        }
        
        // Clear all alerts
        if (target.closest('[data-clear-alerts]')) {
            e.preventDefault();
            await clearAllAlerts();
            return;
        }
        
        // Switch view (dashboard/alerts)
        if (target.closest('[data-view]')) {
            e.preventDefault();
            const view = target.closest('[data-view]').dataset.view;
            switchView(view);
            return;
        }
        
        // Switch patient tab (active/discharged)
        if (target.closest('[data-patient-tab]')) {
            e.preventDefault();
            const tab = target.closest('[data-patient-tab]').dataset.patientTab;
            switchPatientTab(tab);
            return;
        }
        
        // Add quick todo
        if (target.closest('[data-quick-add-todo]')) {
            e.preventDefault();
            await addQuickTodo();
            return;
        }
        
        // Add quick event
        if (target.closest('[data-quick-add-event]')) {
            e.preventDefault();
            await addQuickEvent();
            return;
        }
        
        // Backup data
        if (target.closest('[data-backup]')) {
            e.preventDefault();
            await backupData();
            return;
        }
        
        // Import data
        if (target.closest('[data-import]')) {
            e.preventDefault();
            await importData();
            return;
        }
        
        // Patient action (careplan, shift report, etc.)
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
        
        // Modal tab switch
        if (target.closest('[data-tab]')) {
            e.preventDefault();
            const tab = target.closest('[data-tab]').dataset.tab;
            switchModalTab(tab);
            return;
        }
        
        // Configure API key
        if (target.closest('[data-configure-api]')) {
            e.preventDefault();
            if (typeof window.showApiKeyModal === 'function') {
                window.showApiKeyModal();
            }
            return;
        }
        
        // Language toggle
        if (target.closest('[data-lang-toggle]')) {
            e.preventDefault();
            toggleLanguage();
            return;
        }
        
        // AI Language toggle
        if (target.closest('[data-ai-lang-toggle]')) {
            e.preventDefault();
            toggleAiLanguage();
            return;
        }
        
        // Dark mode toggle
        if (target.closest('[data-dark-mode-toggle]')) {
            e.preventDefault();
            toggleDarkMode();
            return;
        }
        // إضافة دواء
if (target.closest('[data-add-medication]')) {
    e.preventDefault();
    const patientId = target.closest('[data-patient-id]')?.dataset.patientId;
    if (patientId) {
        addMedication(patientId);
    }
    return;
}

// إضافة تحليل
if (target.closest('[data-add-lab]')) {
    e.preventDefault();
    const patientId = target.closest('[data-patient-id]')?.dataset.patientId;
    if (patientId) {
        addLabTest(patientId);
    }
    return;
}

// إضافة أشعة
if (target.closest('[data-add-radiology]')) {
    e.preventDefault();
    const patientId = target.closest('[data-patient-id]')?.dataset.patientId;
    if (patientId) {
        addRadiology(patientId);
    }
    return;
}
        // Generate AI alerts
        if (target.closest('[data-generate-alerts]')) {
            e.preventDefault();
            const patientCard = target.closest('[data-patient-id]');
            if (patientCard) {
                const patientId = patientCard.dataset.patientId;
                await generateAIAlerts(patientId);
            }
            return;
        }
        
        // Handover patient
        if (target.closest('[data-handover-patient]')) {
            e.preventDefault();
            const patientCard = target.closest('[data-patient-id]');
            if (patientCard) {
                const patientId = patientCard.dataset.patientId;
                await handoverPatient(patientId);
            }
            return;
        }
        
        // Receive patient
        if (target.closest('[data-receive-patient]')) {
            e.preventDefault();
            const patientCard = target.closest('[data-patient-id]');
            if (patientCard) {
                const patientId = patientCard.dataset.patientId;
                await receivePatient(patientId);
            }
            return;
        }
        
        // Update signature
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
        
        // Open signature modal
        if (target.closest('[data-signature-settings]')) {
            e.preventDefault();
            showSignatureModal();
            return;
        }
    }

    // Handle Global Input
    function handleGlobalInput(e) {
        // Debounced search
        if (e.target.closest('[data-search]')) {
            clearTimeout(window.searchTimeout);
            window.searchTimeout = setTimeout(() => {
                state.searchQuery = e.target.value;
                render();
            }, 300);
        }
    }

    // Handle Global Changes
    function handleGlobalChange(e) {
        const target = e.target;
        
        // Signature input
        if (target.closest('[data-signature]')) {
            state.signature = target.value;
            localStorage.setItem('nuraithm_signature', state.signature);
        }
    }

    // State Management Functions
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
    }

    // Task Management Functions
    function showAddTaskModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full">
                <div class="bg-primary text-white p-6 rounded-t-2xl flex justify-between items-center">
                    <h2 class="text-xl font-bold">إضافة مهمة جديدة</h2>
                    <button onclick="this.closest('.fixed').remove()" class="text-white text-2xl">&times;</button>
                </div>
                <div class="p-6">
                    <div class="form-group mb-4">
                        <label class="block text-sm font-medium mb-2">وصف المهمة</label>
                        <textarea id="task-text" class="w-full p-3 border rounded-lg" rows="3" placeholder="أدخل وصف المهمة..."></textarea>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div class="form-group">
                            <label class="block text-sm font-medium mb-2">المريض</label>
                            <select id="task-patient" class="w-full p-3 border rounded-lg">
                                <option value="">عام (غير مرتبط بمريض)</option>
                                ${state.patients.filter(p => p.status === 'active').map(p => 
                                    `<option value="${p.id}">${p.name} (${p.roomNumber})</option>`
                                ).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label class="block text-sm font-medium mb-2">الأولوية</label>
                            <select id="task-priority" class="w-full p-3 border rounded-lg">
                                <option value="low">منخفضة</option>
                                <option value="medium" selected>متوسطة</option>
                                <option value="high">عالية</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div class="form-group">
                            <label class="block text-sm font-medium mb-2">موعد التسليم</label>
                            <input type="date" id="task-dueDate" class="w-full p-3 border rounded-lg">
                        </div>
                        
                        <div class="form-group">
                            <label class="block text-sm font-medium mb-2">التذكير</label>
                            <input type="datetime-local" id="task-reminder" class="w-full p-3 border rounded-lg">
                        </div>
                    </div>
                    
                    <div class="flex justify-end gap-3">
                        <button onclick="this.closest('.fixed').remove()" class="px-6 py-2 bg-gray-200 rounded-lg">إلغاء</button>
                        <button onclick="saveNewTask()" class="px-6 py-2 bg-primary text-white rounded-lg">حفظ المهمة</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        window.saveNewTask = function() {
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
                completed: false,
                createdAt: new Date().toISOString()
            };
            
            // Save to PocketBase
            PocketBaseService.TodoService.createTodo(taskData).then(() => {
                showNotification('تمت إضافة المهمة بنجاح', 'success');
                modal.remove();
                loadInitialData().then(() => render());
            }).catch(error => {
                console.error('Error saving task:', error);
                showNotification('حدث خطأ في حفظ المهمة', 'error');
            });
        };
    }

    function toggleTask(taskId) {
        const todo = state.todos.find(t => t.id === taskId);
        if (todo) {
            PocketBaseService.TodoService.toggleTodo(taskId).then(() => {
                loadInitialData().then(() => render());
            });
        }
    }

    function deleteTask(taskId) {
        if (confirm('هل تريد حذف هذه المهمة؟')) {
            PocketBaseService.TodoService.deleteTodo(taskId).then(() => {
                loadInitialData().then(() => render());
            });
        }
    }

    // Render Tasks Section
    function renderTasksSection() {
        const activeTodos = state.todos.filter(t => !t.completed);
        const completedTodos = state.todos.filter(t => t.completed);
        
        return `
            <section class="mt-8">
                <div class="bg-white dark:bg-gray-800 rounded-2xl shadow">
                    <div class="p-6 border-b flex justify-between items-center">
                        <h3 class="text-xl font-bold">📋 قائمة المهام</h3>
                        <button data-add-task class="px-4 py-2 bg-primary text-white rounded-lg text-sm">
                            + إضافة مهمة
                        </button>
                    </div>
                    
                    <div class="p-6">
                        ${state.todos.length === 0 ? `
                            <div class="text-center py-8">
                                <p class="text-gray-500 mb-4">لا توجد مهام حالياً</p>
                                <button data-add-task class="px-6 py-2 bg-primary text-white rounded-lg">
                                    إضافة أول مهمة
                                </button>
                            </div>
                        ` : `
                            <div class="space-y-3">
                                ${activeTodos.map(todo => `
                                    <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg" data-task-id="${todo.id}">
                                        <div class="flex items-center gap-3">
                                            <input type="checkbox" 
                                                   class="h-5 w-5"
                                                   ${todo.completed ? 'checked' : ''}
                                                   onchange="toggleTask('${todo.id}')">
                                            <div>
                                                <p class="${todo.completed ? 'line-through text-gray-500' : ''}">
                                                    ${todo.text}
                                                </p>
                                                ${todo.patientName ? `
                                                    <p class="text-sm text-primary mt-1">
                                                        👤 ${todo.patientName}
                                                    </p>
                                                ` : ''}
                                                ${todo.dueDate ? `
                                                    <p class="text-xs text-gray-500 mt-1">
                                                        📅 ${new Date(todo.dueDate).toLocaleDateString('ar-EG')}
                                                    </p>
                                                ` : ''}
                                            </div>
                                        </div>
                                        <button onclick="deleteTask('${todo.id}')" class="text-red-500 hover:text-red-700">
                                            🗑️
                                        </button>
                                    </div>
                                `).join('')}
                                
                                ${completedTodos.length > 0 ? `
                                    <div class="mt-6">
                                        <h4 class="font-bold mb-3">المهام المنتهية (${completedTodos.length})</h4>
                                        <div class="space-y-3">
                                            ${completedTodos.map(todo => `
                                                <div class="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-600 rounded-lg" data-task-id="${todo.id}">
                                                    <div class="flex items-center gap-3">
                                                        <input type="checkbox" checked disabled class="h-5 w-5">
                                                        <div>
                                                            <p class="line-through text-gray-500">${todo.text}</p>
                                                        </div>
                                                    </div>
                                                    <button onclick="deleteTask('${todo.id}')" class="text-red-500 hover:text-red-700">
                                                        🗑️
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

    // Logout function
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

    // Show user profile modal
    function showUserProfileModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full max-h-[90vh] overflow-hidden">
                <div class="p-6 border-b dark:border-slate-800 flex justify-between items-center">
                    <h3 class="text-xl font-black text-white">${translate('الملف الشخصي', 'Profile')}</h3>
                    <button onclick="this.closest('.fixed').remove()" class="w-10 h-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center">
                        <span class="material-symbols-outlined text-white">close</span>
                    </button>
                </div>
                <div class="p-6 space-y-4">
                    <div>
                        <label class="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">
                            ${translate('الاسم', 'Name')}
                        </label>
                        <input type="text" id="profile-name" value="${state.currentUser?.name || ''}"
                            class="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-white">
                    </div>
                    <div>
                        <label class="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">
                            ${translate('اسم المستخدم', 'Username')}
                        </label>
                        <input type="text" value="${state.currentUser?.username || ''}"
                            class="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-white" readonly>
                    </div>
                    <div>
                        <label class="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">
                            ${translate('البريد الإلكتروني', 'Email')}
                        </label>
                        <input type="email" id="profile-email" value="${state.currentUser?.email || ''}"
                            class="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-white">
                    </div>
                    <div>
                        <label class="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">
                            ${translate('التوقيع', 'Signature')}
                        </label>
                        <input type="text" id="profile-signature" value="${state.signature || ''}"
                            class="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-white"
                            placeholder="${translate('أدخل توقيعك للملفات', 'Enter your signature for documents')}">
                    </div>
                </div>
                <div class="p-6 border-t dark:border-slate-800 flex justify-between gap-3">
                    <button onclick="this.closest('.fixed').remove()" class="px-6 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-white">
                        ${translate('إلغاء', 'Cancel')}
                    </button>
                    <button onclick="updateProfile()" class="px-6 py-2 bg-primary text-white rounded-xl font-bold">
                        ${translate('حفظ التغييرات', 'Save Changes')}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add update profile function
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

    // Show signature modal
    function showSignatureModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full max-h-[90vh] overflow-hidden">
                <div class="bg-primary p-6 text-white flex justify-between items-center">
                    <h3 class="text-xl font-black">${translate('إعدادات التوقيع', 'Signature Settings')}</h3>
                    <button onclick="this.closest('.fixed').remove()" class="w-10 h-10 rounded-xl hover:bg-white/20 flex items-center justify-center">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div class="p-6 space-y-4">
                    <div>
                        <label class="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">
                            ${translate('التوقيع المعتمد', 'Official Signature')}
                        </label>
                        <input type="text" id="signature-input" value="${state.signature}"
                            class="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 ring-primary/20 text-slate-900 dark:text-white"
                            placeholder="${translate('مثال: Nurse. Ahmed Khaled', 'Example: Nurse. Ahmed Khaled')}">
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            ${translate('سيظهر هذا التوقيع على جميع الملفات المصدرة', 'This signature will appear on all exported documents')}
                        </p>
                    </div>
                </div>
                <div class="p-6 border-t dark:border-slate-800 flex justify-end gap-3">
                    <button onclick="this.closest('.fixed').remove()" class="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold">
                        ${translate('إلغاء', 'Cancel')}
                    </button>
                    <button data-update-signature class="px-6 py-2 bg-primary text-white rounded-xl font-bold">
                        ${translate('حفظ التوقيع', 'Save Signature')}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    // Open patient modal
    function openPatientModal(patientId = null) {
        state.selectedPatientId = patientId;
        state.isModalOpen = true;
        state.modalTab = 'id';
        render();
    }

    function closeModal() {
        state.isModalOpen = false;
        state.selectedPatientId = null;
        render();
    }

    // Save patient
    async function savePatient() {
        const patientData = collectPatientFormData();
        
        try {
            if (state.selectedPatientId) {
                // Update existing patient
                await PocketBaseService.PatientService.updatePatient(state.selectedPatientId, patientData);
                showNotification(translate('تم تحديث بيانات المريض', 'Patient updated'), 'success');
            } else {
                // Create new patient
                await PocketBaseService.PatientService.createPatient(patientData);
                showNotification(translate('تم إضافة المريض بنجاح', 'Patient added successfully'), 'success');
            }
            
            await loadInitialData();
            closeModal();
            render();
        } catch (error) {
            console.error('Error saving patient:', error);
            showNotification(translate('حدث خطأ في حفظ المريض', 'Error saving patient'), 'error');
        }
    }

    // Collect patient form data
  function collectPatientFormData() {
    const isbar = {
        identification: {
            room_no: document.getElementById('roomNumber')?.value || '',
            patient_name: document.getElementById('patientName')?.value || '',
            mrn: document.getElementById('fileNumber')?.value || '',
            age: document.getElementById('age')?.value || '',
            admission_date: document.getElementById('admissionDate')?.value || '',
            admitted_from: document.getElementById('admittedFrom')?.value || '',
            consultant: document.getElementById('consultant')?.value || ''
        },
        situation: {
            current_complaints: document.getElementById('currentComplaints')?.value || '',
            diagnosis: document.getElementById('diagnosis')?.value || '',
            connections: [],
            infusions: [],
            diet: document.getElementById('diet')?.value || ''
        },
        background: {
            past_medical_history: document.getElementById('pastMedicalHistory')?.value || '',
            chief_complaint: document.getElementById('chiefComplaint')?.value || '',
            allergy: document.getElementById('allergy')?.value || '',
            infections_isolation: document.getElementById('isolation')?.value || ''
        },
        assessment: {
            gcs: document.getElementById('gcs')?.value || '15',
            fall_risk: document.getElementById('fallRisk')?.value || 'low',
            vitals: document.getElementById('vitals')?.value || '',
            ventilation: document.getElementById('ventilation')?.value || 'Room Air',
            bed_sore: document.getElementById('bedSore')?.value || 'no',
            physical_restraint: document.getElementById('restraint')?.value || 'no',
            important_findings: document.getElementById('findings')?.value || ''
        },
        recommendations: {
            plan_of_care: document.getElementById('planOfCare')?.value || '',
            physician_orders: [],
            cultures: [],
            consultations: [],
            risks: document.getElementById('risks')?.value || ''
        },
        nursing: {
            outgoing_nurse: state.signature,
            receiving_nurse: '',
            handover_date: '',
            handover_time: ''
        },
        shift_notes: patient?.isbar?.shift_notes || []
    };

    return {
        name: document.getElementById('patientName')?.value || 'مريض جديد',
        fileNumber: document.getElementById('fileNumber')?.value || `MRN${Date.now().toString().slice(-6)}`,
        age: document.getElementById('age')?.value || '',
        roomNumber: document.getElementById('roomNumber')?.value || '',
        diagnosis: document.getElementById('diagnosis')?.value || '',
        status: 'active',
        isbar: isbar,
        medications: patient?.medications || [],
        labs: patient?.labs || [],
        radiology: patient?.radiology || [],
        todos: patient?.todos || []
    };
}
async function savePatient() {
    try {
        // حفظ البيانات الحالية أولاً
        updatePatientFormData();
        
        const patientData = collectPatientFormData();
        
        if (state.selectedPatientId) {
            // تحديث المريض الموجود
            await PocketBaseService.PatientService.updatePatient(state.selectedPatientId, patientData);
            showNotification(translate('تم تحديث بيانات المريض', 'Patient updated'), 'success');
        } else {
            // إضافة مريض جديد
            const result = await PocketBaseService.PatientService.createPatient(patientData);
            state.selectedPatientId = result.id; // تعيين ID جديد
            showNotification(translate('تم إضافة المريض بنجاح', 'Patient added successfully'), 'success');
        }
        
        // تحديث البيانات من السيرفر
        await loadInitialData();
        
        // إعادة عرض البيانات مع الحفاظ على النافذة المفتوحة
        render();
        
    } catch (error) {
        console.error('Error saving patient:', error);
        showNotification(translate('حدث خطأ في حفظ المريض', 'Error saving patient'), 'error');
    }
}
    // Delete patient
    async function deletePatient(patientId) {
        if (!confirm(translate('هل تريد حذف هذا المريض؟', 'Delete this patient?'))) {
            return;
        }
        
        try {
            await PocketBaseService.PatientService.deletePatient(patientId);
            showNotification(translate('تم حذف المريض', 'Patient deleted'), 'success');
            await loadInitialData();
            render();
        } catch (error) {
            console.error('Delete patient error:', error);
            showNotification(translate('خطأ في حذف المريض', 'Error deleting patient'), 'error');
        }
    }

    // Export PDF
    async function exportPatientPDF() {
        try {
            const patient = state.patients.find(p => p.id === state.selectedPatientId);
            if (patient && window.PDFExport && window.PDFExport.exportHandoverPDF) {
                window.PDFExport.exportHandoverPDF(patient, state.signature);
                showNotification(translate('تم تصدير PDF', 'PDF exported'), 'success');
            }
        } catch (error) {
            console.error('PDF export error:', error);
            showNotification(translate('خطأ في تصدير PDF', 'Error exporting PDF'), 'error');
        }
    }

    // Toggle todo
    async function toggleTodo(todoId) {
        try {
            await PocketBaseService.TodoService.toggleTodo(todoId);
            await loadInitialData();
            render();
        } catch (error) {
            console.error('Toggle todo error:', error);
        }
    }

    // Add todo
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

    // Delete todo
    async function deleteTodo(todoId) {
        try {
            await PocketBaseService.TodoService.deleteTodo(todoId);
            await loadInitialData();
            render();
        } catch (error) {
            console.error('Delete todo error:', error);
        }
    }

    // Mark alert as read
    async function markAlertAsRead(alertId) {
        try {
            await PocketBaseService.AlertService.markAsRead(alertId);
            await loadInitialData();
            render();
        } catch (error) {
            console.error('Mark alert read error:', error);
        }
    }

    // Delete alert
    async function deleteAlert(alertId) {
        try {
            await PocketBaseService.AlertService.deleteAlert(alertId);
            await loadInitialData();
            render();
        } catch (error) {
            console.error('Delete alert error:', error);
        }
    }

    // Clear all alerts
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

    // Add quick todo
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

    // Add quick event
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

    // Backup data
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

    // Import data
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
                    
                    // Import signature
                    if (imported.signature) {
                        state.signature = imported.signature;
                        localStorage.setItem('nuraithm_signature', imported.signature);
                    }
                    
                    // Import patients
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

    // Handle patient actions
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
                        window.PDFExport.exportHandoverPDF(patient, state.signature);
                        showNotification(translate('جاري تصدير PDF...', 'Exporting PDF...'), 'info');
                    }
                    break;
                    
                case 'careplan':
                    showNotification(translate('جاري إنشاء خطة الرعاية...', 'Creating care plan...'), 'info');
                    const carePlan = await DeepSeekService.generateCarePlan?.(patient, state.aiLang);
                    if (carePlan && !carePlan.requiresApiKey) {
                        showNotification(translate('تم إنشاء خطة الرعاية', 'Care plan generated'), 'success');
                        showCarePlanModal(carePlan, patient.name);
                    }
                    break;
                    
                case 'shift':
                    showNotification(translate('جاري إنشاء ملخص الشفت...', 'Creating shift summary...'), 'info');
                    const shiftSummary = await DeepSeekService.generateShiftSummary?.(patient, state.aiLang);
                    if (shiftSummary) {
                        showNotification(translate('تم إنشاء ملخص الشفت', 'Shift summary generated'), 'success');
                        showShiftSummaryModal(shiftSummary, patient.name);
                    }
                    break;
                    
                case 'medtable':
                    showNotification(translate('جاري تحليل الأدوية...', 'Analyzing medications...'), 'info');
                    const medTable = await DeepSeekService.generateMedicationTable?.(patient, state.aiLang);
                    if (medTable && !medTable.requiresApiKey) {
                        showNotification(translate('تم إنشاء جدول الأدوية', 'Medication table generated'), 'success');
                        showMedTableModal(medTable, patient.name);
                    }
                    break;
                    
                case 'report':
                    showNotification(translate('جاري إنشاء التقرير...', 'Generating report...'), 'info');
                    const report = await DeepSeekService.generatePatientReport?.(patient, state.aiLang);
                    if (report) {
                        showNotification(translate('تم إنشاء التقرير', 'Report generated'), 'success');
                        showReportModal(report, patient.name);
                    }
                    break;
            }
        } catch (error) {
            console.error('Action error:', error);
            showNotification(translate('حدث خطأ أثناء المعالجة', 'Error processing action'), 'error');
        }
    }

    // Generate AI alerts
    async function generateAIAlerts(patientId) {
        const patient = state.patients.find(p => p.id === patientId);
        if (!patient) {
            showNotification(translate('المريض غير موجود', 'Patient not found'), 'error');
            return;
        }

        try {
            showNotification(translate('جاري تحليل المخاطر...', 'Analyzing risks...'), 'info');
            const alerts = await DeepSeekService.generateClinicalAlerts?.(patient, state.aiLang);
            
            if (alerts && Array.isArray(alerts)) {
                // Save alerts to PocketBase
                for (const alert of alerts) {
                    await PocketBaseService.AlertService.createAlert({
                        title: alert.title,
                        message: alert.message,
                        category: alert.category,
                        read: false,
                        patientId: patient.id,
                        patientName: patient.name
                    });
                }
                
                showNotification(translate('تم توليد التنبيهات', 'Alerts generated'), 'success');
                await loadInitialData();
                render();
            }
        } catch (error) {
            console.error('Generate alerts error:', error);
            showNotification(translate('خطأ في توليد التنبيهات', 'Error generating alerts'), 'error');
        }
    }

    // Handover patient
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

    // Receive patient
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

    // Helper Functions
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
        modal.className = 'fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <div class="bg-primary p-6 text-white flex justify-between items-center">
                    <h3 class="text-xl font-black">${translate('خطة الرعاية التمريضية', 'Nursing Care Plan')} - ${patientName}</h3>
                    <button onclick="this.closest('.fixed').remove()" class="w-10 h-10 rounded-xl hover:bg-white/20 flex items-center justify-center">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div class="p-6 overflow-auto max-h-[70vh]">
                    <table class="w-full border-collapse">
                        <thead>
                            <tr class="bg-primary text-white">
                                ${carePlan.headers.map(header => `<th class="p-3 text-right">${header}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${carePlan.rows.map(row => `
                                <tr class="border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    ${row.map(cell => `<td class="p-3">${cell}</td>`).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="p-6 border-t dark:border-slate-800 flex justify-end gap-3">
                    <button onclick="exportCarePlanPDF()" class="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold">
                        ${translate('تصدير PDF', 'Export PDF')}
                    </button>
                    <button onclick="this.closest('.fixed').remove()" class="px-6 py-2 bg-primary text-white rounded-xl font-bold">
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
                    '',
                    `CarePlan_${patientName}_${Date.now()}`,
                    state.signature,
                    carePlan
                );
            }
        };
    }
    
    function showShiftSummaryModal(summary, patientName) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                <div class="bg-primary p-6 text-white flex justify-between items-center">
                    <h3 class="text-xl font-black">${translate('ملخص الشفت', 'Shift Summary')} - ${patientName}</h3>
                    <button onclick="this.closest('.fixed').remove()" class="w-10 h-10 rounded-xl hover:bg-white/20 flex items-center justify-center">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div class="p-6 overflow-auto max-h-[70vh]">
                    <div class="prose dark:prose-invert max-w-none">
                        <pre class="whitespace-pre-wrap font-cairo text-sm text-slate-900 dark:text-white">${summary}</pre>
                    </div>
                </div>
                <div class="p-6 border-t dark:border-slate-800 flex justify-end gap-3">
                    <button onclick="copyToClipboard('${summary.replace(/'/g, "\\'")}')" class="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold">
                        ${translate('نسخ', 'Copy')}
                    </button>
                    <button onclick="exportShiftSummaryPDF()" class="px-6 py-2 bg-primary text-white rounded-xl font-bold">
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
                    summary,
                    `ShiftSummary_${patientName}_${Date.now()}`,
                    state.signature
                );
            }
        };
    }
    
    function showMedTableModal(medTable, patientName) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
                <div class="bg-primary p-6 text-white flex justify-between items-center">
                    <h3 class="text-xl font-black">${translate('جدول الأدوية الذكي', 'Smart Medication Table')} - ${patientName}</h3>
                    <button onclick="this.closest('.fixed').remove()" class="w-10 h-10 rounded-xl hover:bg-white/20 flex items-center justify-center">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div class="p-6 overflow-auto max-h-[70vh]">
                    <table class="w-full border-collapse">
                        <thead>
                            <tr class="bg-primary text-white">
                                ${medTable.headers.map(header => `<th class="p-3 text-right">${header}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${medTable.rows.map(row => `
                                <tr class="border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    ${row.map(cell => `<td class="p-3">${cell}</td>`).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="p-6 border-t dark:border-slate-800 flex justify-end gap-3">
                    <button onclick="exportMedTablePDF()" class="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold">
                        ${translate('تصدير PDF', 'Export PDF')}
                    </button>
                    <button onclick="this.closest('.fixed').remove()" class="px-6 py-2 bg-primary text-white rounded-xl font-bold">
                        ${translate('إغلاق', 'Close')}
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        window.exportMedTablePDF = function() {
            if (window.PDFExport && window.PDFExport.exportReportPDF) {
                window.PDFExport.exportReportPDF(
                    translate('جدول الأدوية الذكي', 'Smart Medication Table'),
                    '',
                    `MedTable_${patientName}_${Date.now()}`,
                    state.signature,
                    medTable
                );
            }
        };
    }
    
    function showReportModal(report, patientName) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <div class="bg-primary p-6 text-white flex justify-between items-center">
                    <h3 class="text-xl font-black">${translate('تقرير طبي شامل', 'Comprehensive Medical Report')} - ${patientName}</h3>
                    <button onclick="this.closest('.fixed').remove()" class="w-10 h-10 rounded-xl hover:bg-white/20 flex items-center justify-center">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div class="p-6 overflow-auto max-h-[70vh]">
                    <div class="prose dark:prose-invert max-w-none">
                        <pre class="whitespace-pre-wrap font-cairo text-sm text-slate-900 dark:text-white">${report}</pre>
                    </div>
                </div>
                <div class="p-6 border-t dark:border-slate-800 flex justify-end gap-3">
                    <button onclick="exportReportPDF()" class="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold">
                        ${translate('تصدير PDF', 'Export PDF')}
                    </button>
                    <button onclick="this.closest('.fixed').remove()" class="px-6 py-2 bg-primary text-white rounded-xl font-bold">
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
                    report,
                    `MedicalReport_${patientName}_${Date.now()}`,
                    state.signature
                );
            }
        };
    }

    function getStats() {
        return {
            total: state.patients.length,
            active: state.patients.filter(p => p.status === 'active').length,
            discharged: state.patients.filter(p => p.status === 'discharged').length,
            alerts: state.alerts.filter(a => !a.read).length,
            todos: state.todos.filter(t => !t.completed).length
        };
    }

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

    // Render Functions
    function renderAuthRequired() {
        elements.app.innerHTML = `
            <div class="flex flex-col items-center justify-center min-h-screen p-4">
                <div class="text-center max-w-md">
                    <div class="w-24 h-24 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <span class="material-symbols-outlined text-primary text-4xl">medical_services</span>
                    </div>
                    <h1 class="text-2xl font-black text-slate-900 dark:text-white mb-3">Nuraithm</h1>
                    <p class="text-slate-600 dark:text-slate-400 mb-8">
                        ${translate('نظام التسليم السريري الذكي باستخدام الذكاء الاصطناعي', 'AI-powered clinical handover system')}
                    </p>
                    <button onclick="window.showAuthModal()" class="bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-primary/90 transition-all w-full">
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
                        <h1 class="text-2xl font-bold text-gray-800 dark:text-white mb-2">Render Error</h1>
                        <p class="text-gray-600 dark:text-gray-300 mb-4">${error.message}</p>
                        <button onclick="location.reload()" class="px-6 py-2 bg-primary text-white rounded-lg">
                            Reload Page
                        </button>
                    </div>
                </div>
            `;
        }
    }

    // Main render function
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
            
            <!-- API Key Status Bar -->
            ${!state.apiKeyConfigured ? `
                <div class="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-40">
                    <div class="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-2xl">auto_awesome</span>
                            <div>
                                <p class="font-bold">${translate('تفعيل الذكاء الاصطناعي', 'Activate AI Features')}</p>
                                <p class="text-sm opacity-90">${translate('أدخل مفتاح API للميزات الذكية', 'Enter API key for smart features')}</p>
                            </div>
                        </div>
                        <button onclick="window.showApiKeyModal()" 
                                class="px-4 py-2 bg-white text-orange-600 rounded-xl font-bold hover:bg-orange-50 transition-all">
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
                    <!-- Logo and User -->
                    <div class="flex items-center gap-4">
                        <div class="flex items-center gap-3">
                            <div class="w-11 h-11 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 transform transition-transform hover:rotate-6 cursor-pointer border-2 border-accent-yellow/50">
                                <span class="text-white text-2xl font-black font-inter">N</span>
                            </div>
                            <div>
                                <h1 class="text-lg font-black text-primary dark:text-white tracking-tight leading-none">Nuraithm</h1>
                                <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                                    ${translate('الذكاء السريري المتقدم', 'ADVANCED CLINICAL INTELLIGENCE')}
                                </p>
                            </div>
                        </div>
                        
                        <!-- User Info -->
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

                    <!-- Actions -->
                    <div class="flex items-center gap-3">
                        <!-- Alerts Button -->
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

                        <!-- User Menu -->
                        <div class="relative">
                            <button id="settings-toggle" class="w-11 h-11 flex items-center justify-center bg-slate-100 dark:bg-slate-900 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-all">
                                <span class="material-symbols-outlined text-slate-600 dark:text-white">person</span>
                            </button>
                            
                            <!-- Settings Dropdown -->
                            <div id="settings-dropdown" class="hidden absolute top-14 ${state.lang === 'ar' ? 'left-0' : 'right-0'} w-72 bg-white dark:bg-slate-900 p-5 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 z-50">
                                <div class="space-y-4">
                                    <!-- User Info -->
                                    <div class="text-center pb-4 border-b dark:border-slate-800">
                                        <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                            <span class="material-symbols-outlined text-primary text-2xl">person</span>
                                        </div>
                                        <h4 class="font-bold text-slate-900 dark:text-white">${state.currentUser?.name || state.currentUser?.username || 'User'}</h4>
                                        <p class="text-xs text-slate-500">${state.currentUser?.email || ''}</p>
                                    </div>
                                    
                                    <!-- User Actions -->
                                    <div class="space-y-2">
                                        <button data-profile class="w-full py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                                            <span class="material-symbols-outlined text-lg">manage_accounts</span>
                                            ${translate('الملف الشخصي', 'Profile')}
                                        </button>
                                        
                                        <!-- Signature Settings -->
                                        <button data-signature-settings class="w-full py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all">
                                            <span class="material-symbols-outlined text-lg">edit_document</span>
                                            ${translate('إعدادات التوقيع', 'Signature Settings')}
                                        </button>
                                        
                                        <!-- Language Settings -->
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
                                        
                                        <!-- Dark Mode Toggle -->
                                        <button data-dark-mode-toggle class="w-full py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                                            <span class="material-symbols-outlined text-lg">
                                                ${state.darkMode ? 'light_mode' : 'dark_mode'}
                                            </span>
                                            ${state.darkMode 
                                                ? translate('الوضع المضيء', 'LIGHT MODE') 
                                                : translate('الوضع المظلم', 'DARK MODE')
                                            }
                                        </button>
                                        
                                        <!-- API Key Configuration -->
                                        <button onclick="window.showApiKeyModal()" 
                                                class="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:opacity-90 transition-all">
                                            <span class="material-symbols-outlined text-lg">key</span>
                                            ${translate('تكوين مفتاح API', 'Configure API Key')}
                                        </button>
                                        
                                        <!-- Logout -->
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
                <!-- Stats Grid - متجاوب للهواتف -->
                <div class="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4">
                    ${renderStatCard('group', translate('إجمالي المرضى', 'Total Patients'), stats.total, 'bg-blue-500')}
                    ${renderStatCard('clinical_notes', translate('نشطين', 'Active'), stats.active, 'bg-green-500')}
                    ${renderStatCard('transfer_within_a_station', translate('مسلمين', 'Discharged'), stats.discharged, 'bg-orange-500')}
                    ${renderStatCard('warning', translate('تنبيهات', 'Alerts'), stats.alerts, 'bg-red-500')}
                    ${renderStatCard('task_alt', translate('مهام', 'Tasks'), stats.todos, 'bg-purple-500')}
                </div>
                
                <!-- Patient Tabs -->
                <div class="flex bg-slate-200 dark:bg-slate-900 p-1.5 rounded-2xl w-full max-w-md">
                    <button data-patient-tab="active" class="flex-1 py-3 text-xs font-black transition-all rounded-xl ${state.activeTab === 'active' ? 'bg-primary text-white shadow-lg' : 'text-slate-500'}">
                        ${translate('المرضى الحاليين', 'ACTIVE PATIENTS')} (${stats.active})
                    </button>
                    <button data-patient-tab="discharged" class="flex-1 py-3 text-xs font-black transition-all rounded-xl ${state.activeTab === 'discharged' ? 'bg-primary text-white shadow-lg' : 'text-slate-500'}">
                        ${translate('المُسَلَّمون', 'DISCHARGED')} (${stats.discharged})
                    </button>
                </div>

                <!-- Search and Actions -->
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
 
                
                <!-- Tasks Section - يأخذ مسافة واحدة -->
                <div class="lg:col-span-1">
                    ${renderTasksSection()}
                </div>
            </div>
        </div>
                <!-- Patients Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${filteredPatients.length > 0 
                        ? filteredPatients.map(patient => renderPatientCard(patient, state, translate)).join('')
                        : renderEmptyState(
                            translate('لا توجد سجلات', 'No records found'),
                            translate('قم بإضافة مريض جديد لبدء العمل', 'Add a new patient to get started')
                          )
                    }
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
            <div data-patient-id="${patient.id}" class="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                
                <!-- Status Badge -->
                <div class="absolute top-4 left-4">
                    <div class="inline-block px-4 py-1.5 rounded-full text-[10px] font-black ${isActive ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}">
                        ${isActive ? translate('نشط', 'ACTIVE') : translate('مسلم', 'DISCHARGED')}
                    </div>
                </div>
                
                <!-- Risk Indicators -->
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

                <!-- Patient Info -->
                <div class="mb-6">
                    <h3 class="text-2xl font-black text-slate-950 dark:text-white mb-1 hover:text-primary cursor-pointer" data-edit-patient>
                        ${patient.name}
                    </h3>
                    <p class="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                        MRN: ${patient.fileNumber} • ${translate('غرفة', 'ROOM')}: ${patient.roomNumber}
                    </p>
                </div>

                <!-- Diagnosis -->
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

                <!-- Action Buttons -->
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

                <!-- Footer Actions -->
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

    function renderAlertsPage(state, translate) {
        const unreadAlerts = state.alerts.filter(a => !a.read);
        const readAlerts = state.alerts.filter(a => a.read);
        
        return `
            <div class="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                <!-- Header -->
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

                <!-- Stats -->
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

                <!-- Alerts Grid -->
                <div class="space-y-8">
                    <!-- Unread Alerts -->
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
                    
                    <!-- Read Alerts -->
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
                            <button onclick="window.NuraithmApp.generateAIAlerts('${state.patients[0]?.id || ''}')" class="mt-6 px-6 py-3 bg-primary text-white rounded-xl font-bold">
                                ${translate('توليد تنبيهات ذكية', 'Generate Smart Alerts')}
                            </button>
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
        const isbar = patient?.isbar || {
            identification: {},
            situation: {},
            background: {},
            assessment: {},
            recommendations: {},
            nursing: {}
        };
        
        return `
            <div class="fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-950">
                <!-- Header -->
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
                        <button data-export-pdf class="bg-white/10 px-6 py-2 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-white/20 transition-all">
                            <span class="material-symbols-outlined text-sm">picture_as_pdf</span> PDF
                        </button>
                        <button data-save-patient class="bg-accent-yellow text-primary px-8 py-2 rounded-xl text-xs font-black shadow-xl hover:scale-105 active:scale-95 transition-all">
                            ${isNew ? translate('إضافة المريض', 'ADD PATIENT') : translate('حفظ التغييرات', 'SAVE CHANGES')}
                        </button>
                    </div>
                </div>

                <!-- Tabs -->
                <div class="flex bg-white dark:bg-slate-900 border-b dark:border-slate-800 overflow-x-auto no-scrollbar shrink-0 px-4">
                    ${['id', 'situation', 'background', 'assess', 'recs', 'meds', 'labs', 'rad', 'events'].map(tab => `
                        <button data-tab="${tab}" class="flex-shrink-0 px-6 py-4 flex flex-col items-center gap-1 border-b-4 transition-all duration-300 ${state.modalTab === tab ? 'border-primary text-primary' : 'border-transparent text-slate-400'}">
                            <span class="material-symbols-outlined text-xl">${getTabIcon(tab)}</span>
                            <span class="text-[9px] font-black uppercase tracking-tighter">${getTabLabel(tab, translate)}</span>
                        </button>
                    `).join('')}
                </div>

                <!-- Content -->
                <div class="flex-1 overflow-y-auto p-6">
                    <div class="max-w-4xl mx-auto">
                        ${renderModalTabContent(state.modalTab, isbar, patient, translate)}
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

    function renderModalTabContent(tab, isbar, patient, translate) {
        switch(tab) {
            case 'id':
                return `
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${renderFormInput('patientName', translate('اسم المريض', 'Patient Name'), patient?.name || '', 'text', true)}
                        ${renderFormInput('fileNumber', 'MRN', patient?.fileNumber || `MRN${Date.now().toString().slice(-6)}`, 'text')}
                        ${renderFormInput('age', translate('العمر', 'Age'), patient?.age || '', 'text')}
                        ${renderFormInput('roomNumber', translate('رقم الغرفة', 'Room No'), isbar.identification?.room_no || '', 'text')}
                        ${renderFormInput('admissionDate', translate('تاريخ القبول', 'Admission Date'), isbar.identification?.admission_date || new Date().toISOString().split('T')[0], 'date')}
                        ${renderFormInput('admittedFrom', translate('قادم من', 'Admitted From'), isbar.identification?.admitted_from || 'ER', 'text')}
                        ${renderFormInput('consultant', translate('الطبيب المعالج', 'Consultant'), isbar.identification?.consultant || '', 'text')}
                    </div>
                `;
                
            case 'situation':
                return `
                    <div class="space-y-6">
                        ${renderFormTextarea('diagnosis', translate('التشخيص', 'Diagnosis'), isbar.situation?.diagnosis || patient?.diagnosis || '')}
                        ${renderFormTextarea('currentComplaints', translate('الشكوى الحالية', 'Current Complaints'), isbar.situation?.current_complaints || '')}
                        ${renderFormInput('diet', translate('الحمية الغذائية', 'Diet'), isbar.situation?.diet || '', 'text')}
                    </div>
                `;
                
            case 'background':
                return `
                    <div class="space-y-6">
                        ${renderFormTextarea('pastMedicalHistory', translate('التاريخ المرضي', 'Past Medical History'), isbar.background?.past_medical_history || '')}
                        ${renderFormTextarea('chiefComplaint', translate('سبب القبول', 'Chief Complaint'), isbar.background?.chief_complaint || '')}
                        ${renderFormInput('allergy', translate('الحساسية', 'Allergies'), isbar.background?.allergy || translate('لا يوجد', 'None'), 'text')}
                        ${renderFormInput('isolation', translate('العزل', 'Isolation'), isbar.background?.infections_isolation || translate('لا يوجد', 'None'), 'text')}
                    </div>
                `;
                
            case 'assess':
                return `
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${renderFormInput('gcs', 'GCS', isbar.assessment?.gcs || '15', 'number')}
                        ${renderFormSelect('fallRisk', translate('خطر السقوط', 'Fall Risk'), ['low', 'medium', 'high'], isbar.assessment?.fall_risk || 'low')}
                        ${renderFormTextarea('vitals', translate('العلامات الحيوية', 'Vital Signs'), isbar.assessment?.vitals || '')}
                        ${renderFormInput('ventilation', translate('الدعم التنفسي', 'Ventilation'), isbar.assessment?.ventilation || 'Room Air', 'text')}
                        ${renderFormSelect('bedSore', translate('قرحة الفراش', 'Bed Sore'), ['no', 'yes'], isbar.assessment?.bed_sore || 'no')}
                        ${renderFormSelect('restraint', translate('التقييد البدني', 'Physical Restraint'), ['no', 'yes'], isbar.assessment?.physical_restraint || 'no')}
                        ${renderFormTextarea('findings', translate('الملاحظات الهامة', 'Important Findings'), isbar.assessment?.important_findings || '')}
                    </div>
                `;
                
            case 'recs':
                return `
                    <div class="space-y-6">
                        ${renderFormTextarea('planOfCare', translate('خطة الرعاية', 'Plan of Care'), isbar.recommendations?.plan_of_care || '')}
                        ${renderFormTextarea('risks', translate('المخاطر', 'Risks'), isbar.recommendations?.risks || '')}
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
                            <button onclick="addLabTest('${patient?.id || ''}')" class="px-4 py-2 bg-primary text-white rounded-lg text-sm">
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
                                                <td class="p-3">${lab.name}</td>
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
                            <button onclick="addRadiology('${patient?.id || ''}')" class="px-4 py-2 bg-primary text-white rounded-lg text-sm">
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

    function renderFormInput(id, label, value, type = 'text', required = false) {
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
                    class="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-2 ring-primary/20 outline-none transition-all dark:text-white shadow-sm"
                />
            </div>
        `;
    }

    function renderFormTextarea(id, label, value) {
        return `
            <div class="flex flex-col gap-2">
                <label for="${id}" class="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-2">
                    ${label}
                </label>
                <textarea 
                    id="${id}"
                    class="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold h-32 focus:ring-2 ring-primary/20 outline-none transition-all dark:text-white shadow-sm"
                >${value}</textarea>
            </div>
        `;
    }

    function renderFormSelect(id, label, options, value) {
        return `
            <div class="flex flex-col gap-2">
                <label for="${id}" class="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-2">
                    ${label}
                </label>
                <select 
                    id="${id}"
                    class="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-2 ring-primary/20 outline-none transition-all dark:text-white shadow-sm"
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

    // Public API
    return {
        init,
        state,
        translate,
        showNotification,
        generateAIAlerts,
        render,
        toggleTask,
        deleteTask
    };
})();

// Make app globally available
window.NuraithmApp = NuraithmApp;