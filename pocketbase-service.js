// PocketBase Service - المحدث
const PocketBaseService = (function() {
    const pb = window.PB;
    
    // User Management
    const UserService = {
        // Get current user
        getCurrentUser() {
            return pb.authStore.model;
        },
        
        // Check if user is authenticated
        isAuthenticated() {
            return pb.authStore.isValid;
        },
        
        // Logout
        logout() {
            pb.authStore.clear();
        },
        
        // Update profile
        async updateProfile(data) {
            try {
                const user = pb.authStore.model;
                const updated = await pb.collection('users').update(user.id, data);
                pb.authStore.save(pb.authStore.token, updated);
                return updated;
            } catch (error) {
                console.error('Update profile error:', error);
                throw error;
            }
        }
    };
    
    // Patients Management
    const PatientService = {
        // Get all patients for current user
        async getPatients() {
            try {
                const user = UserService.getCurrentUser();
                return await pb.collection('patients').getFullList({
                    filter: `user = "${user.id}"`,
                    sort: '-created'
                });
            } catch (error) {
                console.error('Get patients error:', error);
                return [];
            }
        },
        
        // Get single patient
        async getPatient(id) {
            try {
                const user = UserService.getCurrentUser();
                return await pb.collection('patients').getOne(id, {
                    filter: `user = "${user.id}"`
                });
            } catch (error) {
                console.error('Get patient error:', error);
                throw error;
            }
        },
        
        // Create patient
        async createPatient(data) {
            try {
                const user = UserService.getCurrentUser();
                const patientData = {
                    ...data,
                    user: user.id
                };
                return await pb.collection('patients').create(patientData);
            } catch (error) {
                console.error('Create patient error:', error);
                throw error;
            }
        },
        
        // Update patient
        async updatePatient(id, data) {
            try {
                const user = UserService.getCurrentUser();
                // تأكد من أن المستخدم يملك السجل
                await pb.collection('patients').getOne(id, {
                    filter: `user = "${user.id}"`
                });
                
                // تحديث البيانات
                return await pb.collection('patients').update(id, data);
            } catch (error) {
                console.error('Update patient error:', error);
                throw error;
            }
        },
        
        // Delete patient
        async deletePatient(id) {
            try {
                const user = UserService.getCurrentUser();
                // تأكد من أن المستخدم يملك السجل
                await pb.collection('patients').getOne(id, {
                    filter: `user = "${user.id}"`
                });
                
                return await pb.collection('patients').delete(id);
            } catch (error) {
                console.error('Delete patient error:', error);
                throw error;
            }
        }
    };
    
    // Alerts Management
    const AlertService = {
        // Get all alerts for current user
        async getAlerts() {
            try {
                const user = UserService.getCurrentUser();
                return await pb.collection('alerts').getFullList({
                    filter: `user = "${user.id}"`,
                    sort: '-created'
                });
            } catch (error) {
                console.error('Get alerts error:', error);
                return [];
            }
        },
        
        // Create alert
        async createAlert(data) {
            try {
                const user = UserService.getCurrentUser();
                const alertData = {
                    ...data,
                    user: user.id
                };
                return await pb.collection('alerts').create(alertData);
            } catch (error) {
                console.error('Create alert error:', error);
                throw error;
            }
        },
        
        // Mark alert as read
        async markAsRead(id) {
            try {
                const user = UserService.getCurrentUser();
                // تأكد من أن المستخدم يملك السجل
                await pb.collection('alerts').getOne(id, {
                    filter: `user = "${user.id}"`
                });
                
                return await pb.collection('alerts').update(id, { read: true });
            } catch (error) {
                console.error('Mark alert read error:', error);
                throw error;
            }
        },
        
        // Delete alert
        async deleteAlert(id) {
            try {
                const user = UserService.getCurrentUser();
                // تأكد من أن المستخدم يملك السجل
                await pb.collection('alerts').getOne(id, {
                    filter: `user = "${user.id}"`
                });
                
                return await pb.collection('alerts').delete(id);
            } catch (error) {
                console.error('Delete alert error:', error);
                throw error;
            }
        },
        
        // Clear all read alerts
        async clearReadAlerts() {
            try {
                const user = UserService.getCurrentUser();
                const readAlerts = await pb.collection('alerts').getFullList({
                    filter: `user = "${user.id}" && read = true`
                });
                
                for (const alert of readAlerts) {
                    await this.deleteAlert(alert.id);
                }
                
                return { success: true, count: readAlerts.length };
            } catch (error) {
                console.error('Clear read alerts error:', error);
                throw error;
            }
        }
    };
    
    // Todos Management
    const TodoService = {
        // Get all todos for current user
        async getTodos() {
            try {
                const user = UserService.getCurrentUser();
                return await pb.collection('todos').getFullList({
                    filter: `user = "${user.id}"`,
                    sort: '-created'
                });
            } catch (error) {
                console.error('Get todos error:', error);
                return [];
            }
        },
        
        // Create todo
        async createTodo(data) {
            try {
                const user = UserService.getCurrentUser();
                const todoData = {
                    ...data,
                    user: user.id
                };
                return await pb.collection('todos').create(todoData);
            } catch (error) {
                console.error('Create todo error:', error);
                throw error;
            }
        },
        
        // Update todo
        async updateTodo(id, data) {
            try {
                const user = UserService.getCurrentUser();
                // تأكد من أن المستخدم يملك السجل
                await pb.collection('todos').getOne(id, {
                    filter: `user = "${user.id}"`
                });
                
                return await pb.collection('todos').update(id, data);
            } catch (error) {
                console.error('Update todo error:', error);
                throw error;
            }
        },
        
        // Delete todo
        async deleteTodo(id) {
            try {
                const user = UserService.getCurrentUser();
                // تأكد من أن المستخدم يملك السجل
                await pb.collection('todos').getOne(id, {
                    filter: `user = "${user.id}"`
                });
                
                return await pb.collection('todos').delete(id);
            } catch (error) {
                console.error('Delete todo error:', error);
                throw error;
            }
        },
        
        // Toggle todo completion
        async toggleTodo(id) {
            try {
                const user = UserService.getCurrentUser();
                // تأكد من أن المستخدم يملك السجل
                const todo = await pb.collection('todos').getOne(id, {
                    filter: `user = "${user.id}"`
                });
                
                return await pb.collection('todos').update(id, {
                    completed: !todo.completed
                });
            } catch (error) {
                console.error('Toggle todo error:', error);
                throw error;
            }
        }
    };
    
    // Realtime subscriptions
    const RealtimeService = {
        subscribeToPatients(callback) {
            const user = UserService.getCurrentUser();
            return pb.collection('patients').subscribe('*', (e) => {
                // تصفية الأحداث حسب المستخدم
                if (e.record.user === user.id) {
                    callback(e);
                }
            });
        },
        
        subscribeToAlerts(callback) {
            const user = UserService.getCurrentUser();
            return pb.collection('alerts').subscribe('*', (e) => {
                // تصفية الأحداث حسب المستخدم
                if (e.record.user === user.id) {
                    callback(e);
                }
            });
        },
        
        subscribeToTodos(callback) {
            const user = UserService.getCurrentUser();
            return pb.collection('todos').subscribe('*', (e) => {
                // تصفية الأحداث حسب المستخدم
                if (e.record.user === user.id) {
                    callback(e);
                }
            });
        }
    };
    
    // Initialize service
    async function initialize() {
        try {
            // Check if user is authenticated
            if (!UserService.isAuthenticated()) {
                console.log('User not authenticated');
                return { patients: [], alerts: [], todos: [] };
            }
            
            // Load data in parallel
            const [patients, alerts, todos] = await Promise.all([
                PatientService.getPatients(),
                AlertService.getAlerts(),
                TodoService.getTodos()
            ]);
            
            console.log('Data loaded:', { 
                patients: patients.length, 
                alerts: alerts.length, 
                todos: todos.length 
            });
            
            return { patients, alerts, todos };
            
        } catch (error) {
            console.error('Service initialization error:', error);
            return {
                patients: [],
                alerts: [],
                todos: []
            };
        }
    }
    
    // Public API
    return {
        UserService,
        PatientService,
        AlertService,
        TodoService,
        RealtimeService,
        initialize
    };
})();

// Make service globally available
window.PocketBaseService = PocketBaseService;