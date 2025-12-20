// PocketBase Service
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
        },
        
        // Change password
        async changePassword(oldPassword, newPassword, confirmPassword) {
            try {
                const user = pb.authStore.model;
                return await pb.collection('users').update(user.id, {
                    oldPassword,
                    password: newPassword,
                    passwordConfirm: confirmPassword
                });
            } catch (error) {
                console.error('Change password error:', error);
                throw error;
            }
        }
    };
    
    // Patients Management
    const PatientService = {
        // Get all patients for current user
        async getPatients(filter = {}) {
            try {
                // Send with auth token in headers
                return await pb.collection('patients').getFullList({
                    sort: '-created'
                });
            } catch (error) {
                console.error('Get patients error:', error);
                // Return empty array instead of throwing error
                return [];
            }
        },
        
        // Get single patient
        async getPatient(id) {
            try {
                return await pb.collection('patients').getOne(id);
            } catch (error) {
                console.error('Get patient error:', error);
                throw error;
            }
        },
        
        // Create patient
        async createPatient(data) {
            try {
                const user = pb.authStore.model;
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
                return await pb.collection('patients').update(id, data);
            } catch (error) {
                console.error('Update patient error:', error);
                throw error;
            }
        },
        
        // Delete patient
        async deletePatient(id) {
            try {
                return await pb.collection('patients').delete(id);
            } catch (error) {
                console.error('Delete patient error:', error);
                throw error;
            }
        },
        
        // Search patients
        async searchPatients(query) {
            try {
                return await pb.collection('patients').getList(1, 50, {
                    filter: `name ~ "${query}" || fileNumber ~ "${query}" || diagnosis ~ "${query}"`,
                    sort: '-created'
                });
            } catch (error) {
                console.error('Search patients error:', error);
                throw error;
            }
        }
    };
    
    // Alerts Management
    const AlertService = {
        // Get all alerts for current user
        async getAlerts(filter = {}) {
            try {
                return await pb.collection('alerts').getFullList({
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
                const user = pb.authStore.model;
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
                return await pb.collection('alerts').update(id, { read: true });
            } catch (error) {
                console.error('Mark alert read error:', error);
                throw error;
            }
        },
        
        // Delete alert
        async deleteAlert(id) {
            try {
                return await pb.collection('alerts').delete(id);
            } catch (error) {
                console.error('Delete alert error:', error);
                throw error;
            }
        },
        
        // Clear all read alerts
        async clearReadAlerts() {
            try {
                const readAlerts = await pb.collection('alerts').getFullList({
                    filter: `read = true`
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
        async getTodos(filter = {}) {
            try {
                return await pb.collection('todos').getFullList({
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
                const user = pb.authStore.model;
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
                return await pb.collection('todos').update(id, data);
            } catch (error) {
                console.error('Update todo error:', error);
                throw error;
            }
        },
        
        // Delete todo
        async deleteTodo(id) {
            try {
                return await pb.collection('todos').delete(id);
            } catch (error) {
                console.error('Delete todo error:', error);
                throw error;
            }
        },
        
        // Toggle todo completion
        async toggleTodo(id) {
            try {
                const todo = await pb.collection('todos').getOne(id);
                return await pb.collection('todos').update(id, {
                    completed: !todo.completed
                });
            } catch (error) {
                console.error('Toggle todo error:', error);
                throw error;
            }
        }
    };
    
    // File Upload Service
    const FileService = {
        // Upload file
        async uploadFile(file, collectionName, recordId, fieldName = 'file') {
            try {
                const formData = new FormData();
                formData.append(fieldName, file);
                
                const record = await pb.collection(collectionName).update(recordId, formData);
                return record;
            } catch (error) {
                console.error('Upload file error:', error);
                throw error;
            }
        },
        
        // Get file URL
        getFileUrl(record, fileName) {
            return pb.files.getUrl(record, fileName);
        }
    };
    
    // Realtime subscriptions
    const RealtimeService = {
        subscribeToPatients(callback) {
            return pb.collection('patients').subscribe('*', callback);
        },
        
        subscribeToAlerts(callback) {
            return pb.collection('alerts').subscribe('*', callback);
        },
        
        subscribeToTodos(callback) {
            return pb.collection('todos').subscribe('*', callback);
        },
        
        unsubscribe(subscription) {
            subscription.unsubscribe();
        }
    };
    
    // Public API
    return {
        UserService,
        PatientService,
        AlertService,
        TodoService,
        FileService,
        RealtimeService,
        
        // Helper functions
        get pb() {
            return pb;
        },
        
        // Initialize service
        async initialize() {
            try {
                // Check if user is authenticated
                if (!this.UserService.isAuthenticated()) {
                    throw new Error('User not authenticated');
                }
                
                // Load initial data
                const [patients, alerts, todos] = await Promise.all([
                    this.PatientService.getPatients(),
                    this.AlertService.getAlerts(),
                    this.TodoService.getTodos()
                ]);
                
                // Filter data by current user (client-side filtering)
                const user = this.UserService.getCurrentUser();
                const filteredPatients = patients.filter(p => p.user === user.id);
                const filteredAlerts = alerts.filter(a => a.user === user.id);
                const filteredTodos = todos.filter(t => t.user === user.id);
                
                return {
                    patients: filteredPatients,
                    alerts: filteredAlerts,
                    todos: filteredTodos
                };
                
            } catch (error) {
                console.error('Service initialization error:', error);
                // Return empty data instead of throwing error
                return {
                    patients: [],
                    alerts: [],
                    todos: []
                };
            }
        }
    };
})();

// Make service globally available
window.PocketBaseService = PocketBaseService;