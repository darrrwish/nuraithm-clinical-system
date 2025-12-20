// LocalStorage Management
const Storage = (function() {
    const PREFIX = 'nuraithm_';
    const KEYS = {
        PATIENTS: `${PREFIX}patients`,
        ALERTS: `${PREFIX}alerts`,
        LANG: `${PREFIX}lang`,
        AI_LANG: `${PREFIX}ai_lang`,
        THEME: `${PREFIX}theme`,
        SIGNATURE: `${PREFIX}signature`,
        SETTINGS: `${PREFIX}settings`
    };

    // Save data to localStorage
    function save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Storage save error:', error);
            return false;
        }
    }

    // Load data from localStorage
    function get(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('Storage get error:', error);
            return defaultValue;
        }
    }

    // Remove data from localStorage
    function remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    }

    // Clear all app data
    function clearAll() {
        Object.values(KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        return true;
    }

    // Export all data
    function exportData() {
        const data = {};
        Object.entries(KEYS).forEach(([name, key]) => {
            data[name.toLowerCase()] = get(key);
        });
        data.timestamp = new Date().toISOString();
        data.version = '2.0.0';
        return data;
    }

    // Import data
    function importData(importedData) {
        try {
            Object.entries(importedData).forEach(([key, value]) => {
                const storageKey = KEYS[key.toUpperCase()];
                if (storageKey && value !== undefined) {
                    save(storageKey, value);
                }
            });
            return true;
        } catch (error) {
            console.error('Import error:', error);
            return false;
        }
    }

    // Check storage availability
    function isAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            console.error('LocalStorage not available:', error);
            return false;
        }
    }

    // Get storage usage
    function getUsage() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length * 2; // UTF-16 chars are 2 bytes
            }
        }
        return {
            bytes: total,
            kilobytes: (total / 1024).toFixed(2),
            megabytes: (total / (1024 * 1024)).toFixed(2)
        };
    }

    // Public API
    return {
        save,
        get,
        remove,
        clearAll,
        exportData,
        importData,
        isAvailable,
        getUsage,
        KEYS
    };
})();