// Utility Functions
const Utils = (function() {
    // Debounce function
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Format date
    function formatDate(date, format = 'short') {
        const d = new Date(date);
        if (format === 'short') {
            return d.toLocaleDateString();
        } else if (format === 'long') {
            return d.toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } else if (format === 'time') {
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (format === 'datetime') {
            return d.toLocaleString();
        }
        return d.toISOString();
    }

    // Generate unique ID
    function generateId(prefix = '') {
        return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    // Deep clone object
    function deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    // Validate email
    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Format number with commas
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    // Capitalize first letter
    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Truncate text
    function truncate(text, length = 100) {
        if (text.length <= length) return text;
        return text.substr(0, length) + '...';
    }

    // Copy to clipboard
    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('Copy failed:', error);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                return true;
            } catch (err) {
                return false;
            } finally {
                document.body.removeChild(textArea);
            }
        }
    }

    // Download file
    function downloadFile(content, fileName, type = 'text/plain') {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Get query parameters
    function getQueryParams() {
        const params = {};
        const queryString = window.location.search.substring(1);
        const pairs = queryString.split('&');
        
        pairs.forEach(pair => {
            const [key, value] = pair.split('=');
            if (key) {
                params[decodeURIComponent(key)] = decodeURIComponent(value || '');
            }
        });
        
        return params;
    }

    // Check if element is in viewport
    function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    // Safe parse JSON
    function safeParse(json, defaultValue = {}) {
        try {
            return JSON.parse(json);
        } catch (error) {
            console.error('JSON parse error:', error);
            return defaultValue;
        }
    }

    // Format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Generate random color
    function getRandomColor() {
        const colors = [
            '#434E78', '#607B8F', '#E97F4A', '#10b981', '#3b82f6', 
            '#8b5cf6', '#ef4444', '#f59e0b', '#06b6d4'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // Delay function
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Validate required fields
    function validateRequired(fields) {
        for (const [key, value] of Object.entries(fields)) {
            if (!value || value.toString().trim() === '') {
                return { valid: false, field: key, message: `${key} is required` };
            }
        }
        return { valid: true };
    }

    // Public API
    return {
        debounce,
        formatDate,
        generateId,
        deepClone,
        isValidEmail,
        formatNumber,
        capitalize,
        truncate,
        copyToClipboard,
        downloadFile,
        getQueryParams,
        isInViewport,
        safeParse,
        formatFileSize,
        getRandomColor,
        delay,
        validateRequired
    };
})();

// Make utils globally available
window.Utils = Utils;