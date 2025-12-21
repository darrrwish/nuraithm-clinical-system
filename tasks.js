// tasks.js - نظام المهام الكامل
const TasksSystem = (function() {
    let tasks = JSON.parse(localStorage.getItem('nuraithm_tasks')) || [];
    let taskListeners = [];

    // إضافة مهمة جديدة
    function addTask(taskData) {
        const newTask = {
            id: Date.now().toString(),
            text: taskData.text,
            patientId: taskData.patientId || null,
            patientName: taskData.patientName || '',
            completed: false,
            priority: taskData.priority || 'medium', // high, medium, low
            dueDate: taskData.dueDate || null,
            reminder: taskData.reminder || null,
            category: taskData.category || 'general',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        tasks.push(newTask);
        saveTasks();
        notifyListeners();
        
        // تفعيل التذكير إذا كان موجوداً
        if (taskData.reminder) {
            scheduleReminder(newTask);
        }

        return newTask;
    }

    // تحديث مهمة
    function updateTask(taskId, updates) {
        const index = tasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
            tasks[index] = {
                ...tasks[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            saveTasks();
            notifyListeners();
            return tasks[index];
        }
        return null;
    }

    // حذف مهمة
    function deleteTask(taskId) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveTasks();
        notifyListeners();
    }

    // تبديل حالة المهمة
    function toggleTask(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.updatedAt = new Date().toISOString();
            saveTasks();
            notifyListeners();
        }
    }

    // الحصول على جميع المهام
    function getAllTasks() {
        return [...tasks];
    }

    // الحصول على مهام مريض معين
    function getPatientTasks(patientId) {
        return tasks.filter(t => t.patientId === patientId);
    }

    // الحصول على المهام النشطة
    function getActiveTasks() {
        return tasks.filter(t => !t.completed);
    }

    // الحصول على المهام المنتهية
    function getCompletedTasks() {
        return tasks.filter(t => t.completed);
    }

    // تصفية المهام حسب الأولوية
    function getTasksByPriority(priority) {
        return tasks.filter(t => t.priority === priority);
    }

    // إضافة مستمع للتغييرات
    function addListener(callback) {
        taskListeners.push(callback);
    }

    // إزالة مستمع
    function removeListener(callback) {
        taskListeners = taskListeners.filter(listener => listener !== callback);
    }

    // إشعار المستمعين بالتغييرات
    function notifyListeners() {
        taskListeners.forEach(callback => callback(tasks));
    }

    // حفظ المهام في localStorage
    function saveTasks() {
        try {
            localStorage.setItem('nuraithm_tasks', JSON.stringify(tasks));
        } catch (error) {
            console.error('Error saving tasks:', error);
        }
    }

    // جدولة تذكير
    function scheduleReminder(task) {
        if (!task.reminder) return;

        const reminderTime = new Date(task.reminder).getTime();
        const now = Date.now();
        
        if (reminderTime > now) {
            setTimeout(() => {
                if (!task.completed) {
                    showNotification(`تذكير بالمهمة: ${task.text}`);
                }
            }, reminderTime - now);
        }
    }

    // عرض إشعار
    function showNotification(message) {
        // طلب الإذن للإشعارات
        if (!("Notification" in window)) {
            console.log("This browser does not support desktop notification");
            return;
        }

        if (Notification.permission === "granted") {
            new Notification("Nuraithm - تذكير", {
                body: message,
                icon: '/favicon.ico'
            });
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    new Notification("Nuraithm - تذكير", {
                        body: message,
                        icon: '/favicon.ico'
                    });
                }
            });
        }
    }

    // طلب إذن الإشعارات
    function requestNotificationPermission() {
        if (!("Notification" in window)) {
            return Promise.reject("Notifications not supported");
        }

        return Notification.requestPermission();
    }

    // تصدير المهام
    function exportTasks() {
        const dataStr = JSON.stringify(tasks, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `nuraithm_tasks_${Date.now()}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    // استيراد المهام
    function importTasks(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const importedTasks = JSON.parse(e.target.result);
                    tasks = importedTasks;
                    saveTasks();
                    notifyListeners();
                    resolve(tasks);
                } catch (error) {
                    reject('خطأ في تحليل ملف المهام');
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    // تهيئة التذكيرات القديمة
    function initializeReminders() {
        tasks.forEach(task => {
            if (task.reminder && !task.completed) {
                scheduleReminder(task);
            }
        });
    }

    // تشغيل عند التحميل
    document.addEventListener('DOMContentLoaded', () => {
        initializeReminders();
        requestNotificationPermission();
    });

    return {
        addTask,
        updateTask,
        deleteTask,
        toggleTask,
        getAllTasks,
        getPatientTasks,
        getActiveTasks,
        getCompletedTasks,
        getTasksByPriority,
        addListener,
        removeListener,
        exportTasks,
        importTasks,
        requestNotificationPermission
    };
})();

// جعل النظام متاحاً عالمياً
window.TasksSystem = TasksSystem;