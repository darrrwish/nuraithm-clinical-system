// ✅ Components Library - ENHANCED with Tasks Section
// مكونات واجهة المستخدم الكاملة

const Components = (function() {

    // ✅ رأس التطبيق
    function renderHeader(state, stats, translate) {
        return `
            <header class="app-header">
                <div class="header-container">
                    <div class="header-left">
                        <h1 class="app-title">Nuraithm</h1>
                        <p class="app-subtitle">${translate('نظام تسليم المرضى الذكي', 'Smart Patient Handover')}</p>
                    </div>
                    <div class="header-right">
                        <div class="header-stats">
                            <div class="stat-item">
                                <span class="stat-label">${translate('المرضى النشطين', 'Active Patients')}</span>
                                <span class="stat-value">${stats.activePatients}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">${translate('التنبيهات', 'Alerts')}</span>
                                <span class="stat-value alert-badge">${stats.alerts}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">${translate('المهام', 'Tasks')}</span>
                                <span class="stat-value task-badge">${stats.tasks}</span>
                            </div>
                        </div>
                        <button id="settings-toggle" class="btn-icon" title="${translate('الإعدادات', 'Settings')}">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m2.12 2.12l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m2.12-2.12l4.24-4.24M19.78 19.78l-4.24-4.24m-2.12-2.12l-4.24-4.24"></path>
                            </svg>
                        </button>
                        <div id="settings-dropdown" class="settings-dropdown hidden">
                            <button data-lang-toggle class="dropdown-item">🌐 ${state.lang === 'ar' ? 'English' : 'العربية'}</button>
                            <button data-dark-mode-toggle class="dropdown-item">🌙 ${translate('الوضع الليلي', 'Dark Mode')}</button>
                            <button data-profile class="dropdown-item">👤 ${translate('ملفي الشخصي', 'My Profile')}</button>
                            <button data-logout class="dropdown-item danger">🚪 ${translate('تسجيل الخروج', 'Logout')}</button>
                        </div>
                    </div>
                </div>
            </header>
        `;
    }

    // ✅ شريط التنقل بين الأقسام
    function renderNavigation(state, translate) {
        return `
            <nav class="app-nav">
                <button class="nav-item ${state.currentView === 'dashboard' ? 'active' : ''}" data-view="dashboard">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                    </svg>
                    ${translate('لوحة التحكم', 'Dashboard')}
                </button>
                <button class="nav-item ${state.currentView === 'patients' ? 'active' : ''}" data-view="patients">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    ${translate('المرضى', 'Patients')}
                </button>
                <button class="nav-item ${state.currentView === 'tasks' ? 'active' : ''}" data-view="tasks">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 11l3 3L22 4"></path>
                        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    ${translate('المهام', 'Tasks')}
                </button>
                <button class="nav-item ${state.currentView === 'alerts' ? 'active' : ''}" data-view="alerts">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    ${translate('التنبيهات', 'Alerts')}
                </button>
            </nav>
        `;
    }

    // ✅ قسم المهام الرئيسي - الميزة الجديدة
    function renderTasksSection(tasks, translate) {
        return `
            <section class="tasks-section">
                <div class="section-header">
                    <h2>${translate('قائمة المهام', 'Tasks List')}</h2>
                    <button data-add-todo class="btn btn-primary btn-sm">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        ${translate('إضافة مهمة', 'Add Task')}
                    </button>
                </div>

                <div class="tasks-container">
                    ${tasks.length === 0 ? `
                        <div class="empty-state">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                            </svg>
                            <p>${translate('لا توجد مهام حالياً', 'No tasks yet')}</p>
                            <p class="hint">${translate('أضف مهمة جديدة للبدء', 'Add a new task to get started')}</p>
                        </div>
                    ` : `
                        <div class="tasks-list">
                            ${tasks.map(task => `
                                <div class="task-item ${task.completed ? 'completed' : ''}" data-todo-id="${task.id}">
                                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} data-toggle-todo>
                                    <div class="task-content">
                                        <p class="task-text">${task.text}</p>
                                        <p class="task-time">${new Date(task.created).toLocaleDateString('ar-EG')}</p>
                                    </div>
                                    <button data-delete-todo class="btn-icon btn-danger btn-sm" title="${translate('حذف', 'Delete')}">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                                        </svg>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </section>
        `;
    }

    // ✅ قسم المهام داخل ملف المريض
    function renderPatientTasks(patientId, tasks, translate) {
        const patientTasks = tasks.filter(t => t.patientId === patientId);
        
        return `
            <div class="patient-tasks-section">
                <h3 class="section-title">${translate('المهام المتعلقة بهذا المريض', 'Patient-Related Tasks')}</h3>
                
                ${patientTasks.length === 0 ? `
                    <p class="text-muted">${translate('لا توجد مهام لهذا المريض', 'No tasks for this patient')}</p>
                ` : `
                    <div class="tasks-list compact">
                        ${patientTasks.map(task => `
                            <div class="task-item-compact ${task.completed ? 'done' : 'pending'}">
                                <input type="checkbox" ${task.completed ? 'checked' : ''} data-toggle-todo data-todo-id="${task.id}">
                                <span>${task.text}</span>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        `;
    }

    // ✅ بطاقة المريض الكاملة
    function renderPatientCard(patient, tasks, translate) {
        const patientTasks = tasks.filter(t => t.patientId === patient.id);
        const activeTasks = patientTasks.filter(t => !t.completed).length;

        return `
            <div class="patient-card" data-patient-id="${patient.id}">
                <div class="card-header">
                    <div class="patient-info">
                        <h3 class="patient-name">${patient.name}</h3>
                        <p class="patient-meta">
                            ${translate('الملف', 'File')}: ${patient.fileNumber} • ${translate('الغرفة', 'Room')}: ${patient.roomNumber}
                        </p>
                    </div>
                    <div class="card-actions">
                        <button data-edit-patient class="btn-icon" title="${translate('تحرير', 'Edit')}">✏️</button>
                        <button data-delete-patient class="btn-icon btn-danger" title="${translate('حذف', 'Delete')}">🗑️</button>
                    </div>
                </div>

                <div class="card-body">
                    <p class="diagnosis">${translate('التشخيص', 'Diagnosis')}: ${patient.diagnosis}</p>
                    
                    <div class="card-section">
                        <h4>${translate('مهام المريض', 'Patient Tasks')} (${activeTasks})</h4>
                        ${patientTasks.length === 0 ? `
                            <p class="text-muted">${translate('لا توجد مهام', 'No tasks')}</p>
                        ` : `
                            <ul class="tasks-mini-list">
                                ${patientTasks.slice(0, 3).map(task => `
                                    <li class="${task.completed ? 'done' : ''}">${task.text}</li>
                                `).join('')}
                            </ul>
                            ${patientTasks.length > 3 ? `<p class="text-sm">${translate('و', 'and')} ${patientTasks.length - 3} ${translate('أخرى', 'more')}</p>` : ''}
                        `}
                    </div>
                </div>

                <div class="card-footer">
                    <button data-patient-action="careplan" class="btn btn-sm btn-secondary">📋 ${translate('خطة الرعاية', 'Care Plan')}</button>
                    <button data-patient-action="shift_report" class="btn btn-sm btn-secondary">📝 ${translate('تقرير الشفت', 'Shift Report')}</button>
                    <button data-export-pdf class="btn btn-sm btn-primary">📄 PDF</button>
                </div>
            </div>
        `;
    }

    // ✅ نافذة تفاصيل المريض الكاملة
    function renderPatientModal(patient, tasks, recommendations, translate) {
        const patientTasks = tasks.filter(t => t.patientId === patient.id);

        return `
            <div class="modal" id="patient-modal">
                <div class="modal-content large">
                    <div class="modal-header">
                        <h2>${patient.id ? translate('تحرير المريض', 'Edit Patient') : translate('مريض جديد', 'New Patient')}</h2>
                        <button data-close-modal class="btn-close">×</button>
                    </div>

                    <div class="modal-tabs">
                        <button class="tab-button active" data-tab="id">${translate('البيانات الأساسية', 'Basic Info')}</button>
                        <button class="tab-button" data-tab="clinical">${translate('البيانات الطبية', 'Clinical Data')}</button>
                        <button class="tab-button" data-tab="recommendations">${translate('التوصيات', 'Recommendations')}</button>
                        <button class="tab-button" data-tab="tasks">${translate('المهام', 'Tasks')}</button>
                        <button class="tab-button" data-tab="labs">${translate('الفحوصات', 'Labs')}</button>
                    </div>

                    <div class="modal-body">
                        <!-- علامة البيانات الأساسية -->
                        <div class="tab-content active" id="tab-id">
                            <form class="patient-form">
                                <div class="form-group">
                                    <label>${translate('الاسم', 'Name')}</label>
                                    <input type="text" id="patient-name" value="${patient.name || ''}" placeholder="${translate('أدخل الاسم', 'Enter name')}">
                                </div>
                                <div class="form-group">
                                    <label>${translate('رقم الملف', 'File Number')}</label>
                                    <input type="text" id="patient-file" value="${patient.fileNumber || ''}" placeholder="MRN">
                                </div>
                                <div class="form-group">
                                    <label>${translate('رقم الغرفة', 'Room Number')}</label>
                                    <input type="text" id="patient-room" value="${patient.roomNumber || ''}" placeholder="Room">
                                </div>
                                <div class="form-group">
                                    <label>${translate('التشخيص', 'Diagnosis')}</label>
                                    <input type="text" id="patient-diagnosis" value="${patient.diagnosis || ''}" placeholder="${translate('التشخيص الرئيسي', 'Main diagnosis')}">
                                </div>
                                <div class="form-group">
                                    <label>${translate('العمر', 'Age')}</label>
                                    <input type="number" id="patient-age" value="${patient.age || ''}" placeholder="25">
                                </div>
                            </form>
                        </div>

                        <!-- علامة البيانات الطبية -->
                        <div class="tab-content" id="tab-clinical">
                            <div class="clinical-data">
                                <h3>${translate('الأدوية', 'Medications')}</h3>
                                <div id="medications-list" class="medications-list">
                                    ${(patient.medications || []).map((med, idx) => `
                                        <div class="medication-item">
                                            <p><strong>${med.name}</strong></p>
                                            <p>${med.dose} - ${med.frequency}</p>
                                        </div>
                                    `).join('')}
                                </div>

                                <h3 style="margin-top: 20px;">${translate('التاريخ الطبي', 'Medical History')}</h3>
                                <p>${patient.medicalHistory || translate('لا يوجد', 'None')}</p>

                                <h3 style="margin-top: 20px;">${translate('الحساسيات', 'Allergies')}</h3>
                                <p>${patient.allergies || translate('لا توجد حساسيات معروفة', 'No known allergies')}</p>
                            </div>
                        </div>

                        <!-- علامة التوصيات -->
                        <div class="tab-content" id="tab-recommendations">
                            <div class="recommendations-section">
                                <h3>${translate('خطة الرعاية', 'Care Plan')}</h3>
                                <p>${recommendations?.carePlan || translate('لم يتم إنشاء خطة رعاية بعد', 'No care plan created yet')}</p>

                                <h3>${translate('أوامر الطبيب', 'Physician Orders')}</h3>
                                <p>${recommendations?.orders || translate('لا توجد أوامر محددة', 'No specific orders')}</p>

                                <h3>${translate('الاستشارات', 'Consultations')}</h3>
                                <p>${recommendations?.consultations || translate('لا توجد استشارات', 'No consultations')}</p>

                                <h3>${translate('المخاطر المحددة', 'Identified Risks')}</h3>
                                <p>${recommendations?.risks || translate('لا توجد مخاطر محددة', 'No risks identified')}</p>
                            </div>
                        </div>

                        <!-- علامة المهام -->
                        <div class="tab-content" id="tab-tasks">
                            <div class="patient-tasks">
                                <h3>${translate('مهام المريض', 'Patient Tasks')} (${patientTasks.filter(t => !t.completed).length})</h3>
                                ${patientTasks.length === 0 ? `
                                    <p class="text-muted">${translate('لا توجد مهام', 'No tasks')}</p>
                                ` : `
                                    <ul class="full-tasks-list">
                                        ${patientTasks.map(task => `
                                            <li class="${task.completed ? 'done' : ''}" data-todo-id="${task.id}">
                                                <input type="checkbox" ${task.completed ? 'checked' : ''} data-toggle-todo>
                                                <span>${task.text}</span>
                                            </li>
                                        `).join('')}
                                    </ul>
                                `}
                            </div>
                        </div>

                        <!-- علامة الفحوصات -->
                        <div class="tab-content" id="tab-labs">
                            <div class="labs-section">
                                <h3>${translate('الفحوصات المختبرية', 'Laboratory Tests')}</h3>
                                ${(patient.labs || []).length === 0 ? `
                                    <p class="text-muted">${translate('لا توجد فحوصات مسجلة', 'No labs recorded')}</p>
                                ` : `
                                    <table class="labs-table">
                                        <thead>
                                            <tr>
                                                <th>${translate('الاسم', 'Test Name')}</th>
                                                <th>${translate('القيمة', 'Value')}</th>
                                                <th>${translate('الوحدة', 'Unit')}</th>
                                                <th>${translate('التاريخ', 'Date')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${(patient.labs || []).map(lab => `
                                                <tr>
                                                    <td>${lab.name}</td>
                                                    <td>${lab.value}</td>
                                                    <td>${lab.unit}</td>
                                                    <td>${new Date(lab.date).toLocaleDateString('ar-EG')}</td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                `}
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button data-close-modal class="btn btn-secondary">${translate('إلغاء', 'Cancel')}</button>
                        <button data-save-patient class="btn btn-primary">${translate('حفظ', 'Save')}</button>
                    </div>
                </div>
            </div>
        `;
    }

    // ✅ قسم التنبيهات
    function renderAlertsSection(alerts, translate) {
        return `
            <section class="alerts-section">
                <div class="section-header">
                    <h2>${translate('التنبيهات والإشعارات', 'Alerts & Notifications')}</h2>
                    ${alerts.filter(a => !a.read).length > 0 ? `
                        <button data-clear-alerts class="btn btn-sm btn-secondary">
                            ${translate('تحديد الكل كمقروء', 'Mark All as Read')}
                        </button>
                    ` : ''}
                </div>

                <div class="alerts-container">
                    ${alerts.length === 0 ? `
                        <div class="empty-state">
                            <p>${translate('لا توجد تنبيهات', 'No alerts')}</p>
                        </div>
                    ` : `
                        <div class="alerts-list">
                            ${alerts.map(alert => `
                                <div class="alert-item ${alert.severity || 'info'} ${alert.read ? 'read' : 'unread'}" data-alert-id="${alert.id}">
                                    <div class="alert-icon">
                                        ${alert.severity === 'critical' ? '🚨' : alert.severity === 'warning' ? '⚠️' : 'ℹ️'}
                                    </div>
                                    <div class="alert-content">
                                        <h4>${alert.title}</h4>
                                        <p>${alert.message}</p>
                                        <small>${new Date(alert.created).toLocaleString('ar-EG')}</small>
                                    </div>
                                    <div class="alert-actions">
                                        ${!alert.read ? `<button data-mark-alert-read class="btn-icon">✓</button>` : ''}
                                        <button data-delete-alert class="btn-icon btn-danger">✕</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </section>
        `;
    }

    // ✅ Public API
    return {
        renderHeader,
        renderNavigation,
        renderTasksSection,
        renderPatientTasks,
        renderPatientCard,
        renderPatientModal,
        renderAlertsSection
    };

})();

// جعل المكونات متاحة عالمياً
window.Components = Components;