// PocketBase Service - المحدث
const PocketBaseService = (function() {
    const pb = window.PB;
    
    const UserService = {
        getCurrentUser() {
            return pb.authStore.model;
        },
        
        isAuthenticated() {
            return pb.authStore.isValid;
        },
        
        logout() {
            pb.authStore.clear();
        },
        
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
    
    const PatientService = {
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
        
        async updatePatient(id, data) {
            try {
                const user = UserService.getCurrentUser();
                await pb.collection('patients').getOne(id, {
                    filter: `user = "${user.id}"`
                });
                
                return await pb.collection('patients').update(id, data);
            } catch (error) {
                console.error('Update patient error:', error);
                throw error;
            }
        },
        
        async deletePatient(id) {
            try {
                const user = UserService.getCurrentUser();
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
    
    const AlertService = {
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
        
        async markAsRead(id) {
            try {
                const user = UserService.getCurrentUser();
                await pb.collection('alerts').getOne(id, {
                    filter: `user = "${user.id}"`
                });
                
                return await pb.collection('alerts').update(id, { read: true });
            } catch (error) {
                console.error('Mark alert read error:', error);
                throw error;
            }
        },
        
        async deleteAlert(id) {
            try {
                const user = UserService.getCurrentUser();
                await pb.collection('alerts').getOne(id, {
                    filter: `user = "${user.id}"`
                });
                
                return await pb.collection('alerts').delete(id);
            } catch (error) {
                console.error('Delete alert error:', error);
                throw error;
            }
        },
        
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
    
    const TodoService = {
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
        
        async updateTodo(id, data) {
            try {
                const user = UserService.getCurrentUser();
                await pb.collection('todos').getOne(id, {
                    filter: `user = "${user.id}"`
                });
                
                return await pb.collection('todos').update(id, data);
            } catch (error) {
                console.error('Update todo error:', error);
                throw error;
            }
        },
        
        async deleteTodo(id) {
            try {
                const user = UserService.getCurrentUser();
                await pb.collection('todos').getOne(id, {
                    filter: `user = "${user.id}"`
                });
                
                return await pb.collection('todos').delete(id);
            } catch (error) {
                console.error('Delete todo error:', error);
                throw error;
            }
        },
        
        async toggleTodo(id) {
            try {
                const user = UserService.getCurrentUser();
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
    
    const RealtimeService = {
        subscribeToPatients(callback) {
            const user = UserService.getCurrentUser();
            return pb.collection('patients').subscribe('*', (e) => {
                if (e.record.user === user.id) {
                    callback(e);
                }
            });
        },
        
        subscribeToAlerts(callback) {
            const user = UserService.getCurrentUser();
            return pb.collection('alerts').subscribe('*', (e) => {
                if (e.record.user === user.id) {
                    callback(e);
                }
            });
        },
        
        subscribeToTodos(callback) {
            const user = UserService.getCurrentUser();
            return pb.collection('todos').subscribe('*', (e) => {
                if (e.record.user === user.id) {
                    callback(e);
                }
            });
        }
    };
    
    async function initialize() {
        try {
            if (!UserService.isAuthenticated()) {
                console.log('User not authenticated');
                return { patients: [], alerts: [], todos: [] };
            }
            
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
    
    return {
        UserService,
        PatientService,
        AlertService,
        TodoService,
        RealtimeService,
        initialize
    };
})();

window.PocketBaseService = PocketBaseService;