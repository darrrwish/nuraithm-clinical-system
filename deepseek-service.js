// deepseek-service.js - COMPLETE & WORKING VERSION
// Updated for Netlify Functions Proxy

const DeepSeekService = (function() {
    console.log('🔧 DeepSeek Service Initializing...');
    
    // Proxy Configuration
    const PROXY_URL = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8888/.netlify/functions/deepseek-proxy'  // Local development
        : '/.netlify/functions/deepseek-proxy';  // Production on Netlify
    
    console.log('🔗 Using Proxy URL:', PROXY_URL);
    
    // Demo mode toggle - set to true for testing without API
    const DEMO_MODE = false;
    
    // Get API Key from localStorage
    function getApiKey() {
        const key = localStorage.getItem('nuraithm_deepseek_key');
        console.log('🔑 API Key check:', key ? 'Found (' + key.substring(0, 8) + '...)' : 'Not found');
        return key;
    }
    
    // Check if API key exists
    function hasApiKey() {
        return !!getApiKey();
    }
    
    // Show warning if no API key
    function showApiKeyWarning() {
        console.warn('⚠️ DeepSeek API key not configured');
        return {
            error: 'API_KEY_REQUIRED',
            message: 'يرجى إدخال مفتاح DeepSeek API من الإعدادات'
        };
    }
    
    // Main API call function with Netlify Proxy
    async function callDeepSeek(messages, temperature = 0.7) {
        // Demo mode response
        if (DEMO_MODE) {
            console.log('🎭 Using DEMO mode (no API calls)');
            await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay
            
            const userMessage = messages.find(m => m.role === 'user')?.content || '';
            const systemMessage = messages.find(m => m.role === 'system')?.content || '';
            
            if (systemMessage.includes('nurse') || userMessage.includes('nursing')) {
                return `📋 **استجابة تجريبية من النظام الذكي**
                
تمت معالجة طلبك بنجاح في الوضع التجريبي.

**البيانات المستلمة:**
- نوع الطلب: ${systemMessage.includes('nurse') ? 'تقرير تمريضي' : 'استشارة عامة'}
- محتوى الطلب: ${userMessage.substring(0, 50)}...

**لمعاينة الذكاء الاصطناعي الحقيقي:**
1. أدخل مفتاح DeepSeek API الصحيح
2. عطّل الوضع التجريبي (DEMO_MODE = false)
3. استخدم الخادم الوسيط (Netlify Function)`;

            } else if (systemMessage.includes('pharmacist') || userMessage.includes('medication')) {
                return `💊 **تحليل الأدوية (وضع تجريبي)**
                
| الدواء | الجرعة | التكرار | الملاحظات |
|--------|--------|---------|-----------|
| باراسيتامول | 500mg | كل 6 ساعات عند اللزوم | للصداع والحمى |
| أموكسيسيلين | 500mg | كل 8 ساعات | مضاد حيوي، مع الطعام |
| لوزارتان | 50mg | مرة يومياً | لضغط الدم، في الصباح |

**التفاعلات:** لا توجد تفاعلات خطيرة بين هذه الأدوية.
**التعليمات:** تناول جميع الأدوية حسب التعليمات.`;
            }
            
            return '✅ هذا رد تجريبي. لتفعيل الذكاء الاصطناعي الحقيقي، أدخل مفتاح API وصحح إعدادات CORS.';
        }
        
        // Real API call
        const apiKey = getApiKey();
        if (!apiKey) {
            console.error('❌ No API key found');
            throw new Error('API Key غير موجود. يرجى إدخال مفتاح DeepSeek API من الإعدادات.');
        }
        
        console.log('🔄 Sending request to DeepSeek via Netlify Proxy...', {
            url: PROXY_URL,
            messagesCount: messages.length,
            temperature: temperature
        });
        
        try {
            // Validate proxy URL
            if (!PROXY_URL) {
                throw new Error('Proxy URL غير مضبوط. تأكد من إعدادات Netlify.');
            }
            
            const response = await fetch(PROXY_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    messages: messages,
                    temperature: temperature,
                    max_tokens: 2000,
                    stream: false
                })
            });
            
            console.log('📥 Proxy Response Status:', response.status);
            
            if (!response.ok) {
                let errorMessage = `خطأ في الوكيل: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorData.details || errorMessage;
                } catch (e) {
                    // If response is not JSON
                    const textError = await response.text();
                    if (textError) errorMessage = textError.substring(0, 100);
                }
                
                throw new Error(errorMessage);
            }
            
            const data = await response.json();
            console.log('✅ Proxy Response received successfully');
            
            if (data.choices && data.choices[0] && data.choices[0].message) {
                return data.choices[0].message.content;
            } else if (data.error) {
                throw new Error(data.error);
            } else {
                console.warn('⚠️ Unexpected response format:', data);
                throw new Error('تنسيق الاستجابة غير متوقع من خدمة الذكاء الاصطناعي');
            }
            
        } catch (error) {
            console.error('❌ DeepSeek API call failed:', error);
            
            // Friendly error messages
            let userMessage = error.message;
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                userMessage = 'فشل الاتصال بالخادم الوسيط. تأكد من تشغيل Netlify Dev أو نشر الموقع على Netlify.';
            } else if (error.message.includes('401') || error.message.includes('403')) {
                userMessage = 'مفتاح API غير صالح أو منتهي الصلاحية. يرجى التحقق من المفتاح على platform.deepseek.com';
            } else if (error.message.includes('CORS')) {
                userMessage = 'مشكلة في صلاحيات CORS. تأكد من إعدادات الخادم الوسيط.';
            }
            
            throw new Error(userMessage);
        }
    }
    
    // Test API connection
    async function testConnection() {
        console.log('🧪 Testing API connection...');
        
        if (DEMO_MODE) {
            await new Promise(resolve => setTimeout(resolve, 500));
            return {
                success: true,
                message: '✅ الوضع التجريبي يعمل (DEMO_MODE = true)',
                demoMode: true
            };
        }
        
        const apiKey = getApiKey();
        if (!apiKey) {
            return {
                success: false,
                message: '❌ لم يتم إدخال مفتاح API',
                requiresApiKey: true
            };
        }
        
        try {
            const testMessages = [
                { role: 'system', content: 'You are a helpful assistant.' },
                { role: 'user', content: 'Say "Connection Test OK" in Arabic.' }
            ];
            
            const response = await fetch(PROXY_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    messages: testMessages,
                    max_tokens: 10,
                    temperature: 0.1
                })
            });
            
            const success = response.ok;
            const status = response.status;
            
            return {
                success: success,
                status: status,
                message: success 
                    ? '✅ اتصال ناجح عبر Netlify Proxy!' 
                    : `❌ فشل الاتصال (Status: ${status})`,
                proxyUrl: PROXY_URL
            };
            
        } catch (error) {
            console.error('Connection test error:', error);
            return {
                success: false,
                message: `❌ خطأ في الاتصال: ${error.message}`,
                error: error.message
            };
        }
    }
    
    // ========== SERVICE FUNCTIONS ==========
    
    // 1. Generate Shift Summary
    async function generateShiftSummary(patient, lang = 'ar') {
        console.log('📋 Generating shift summary for:', patient.name);
        
        if (!hasApiKey() && !DEMO_MODE) {
            return showApiKeyWarning();
        }
        
        const language = lang === 'ar' ? 'Arabic' : 'English';
        const prompt = `ACT AS A SENIOR NURSE. Generate a professional SHIFT HANDOVER REPORT in ${language}:

PATIENT INFORMATION:
- Name: ${patient.name || 'Unknown'}
- Age: ${patient.age || 'N/A'}
- Room: ${patient.roomNumber || 'N/A'}
- File: ${patient.fileNumber || 'N/A'}
- Diagnosis: ${patient.diagnosis || 'Not specified'}

CLINICAL DATA:
${JSON.stringify(patient.isbar || {}, null, 2)}

REQUIREMENTS:
1. Use ISBAR format (Identification, Situation, Background, Assessment, Recommendation)
2. Include vital signs summary if available
3. List medications administered
4. Note any critical events
5. Provide clear recommendations for next shift
6. Use professional nursing terminology
7. Language: ${language}

Generate concise but comprehensive report.`;
        
        const messages = [
            { role: 'system', content: 'You are an experienced charge nurse writing shift handover reports. Be precise, professional, and thorough.' },
            { role: 'user', content: prompt }
        ];
        
        try {
            return await callDeepSeek(messages, 0.5);
        } catch (error) {
            console.error('Shift summary error:', error);
            return `⚠️ خطأ في إنشاء ملخص الشفت: ${error.message}`;
        }
    }
    
    // 2. Generate Patient Report
    async function generatePatientReport(patient, lang = 'ar') {
        console.log('🏥 Generating patient report for:', patient.name);
        
        if (!hasApiKey() && !DEMO_MODE) {
            return showApiKeyWarning();
        }
        
        const language = lang === 'ar' ? 'Arabic' : 'English';
        const prompt = `ACT AS A MEDICAL CONSULTANT. Write a COMPREHENSIVE MEDICAL REPORT in ${language}:

PATIENT: ${patient.name}
MRN: ${patient.fileNumber}
AGE: ${patient.age}
ROOM: ${patient.roomNumber}

FULL CLINICAL DATA:
${JSON.stringify(patient, null, 2)}

REPORT STRUCTURE:
1. EXECUTIVE SUMMARY (2-3 sentences)
2. CLINICAL HISTORY & BACKGROUND
3. CURRENT ASSESSMENT & VITALS ANALYSIS
4. MEDICATION REVIEW & RECOMMENDATIONS
5. LAB & DIAGNOSTIC INTERPRETATION
6. NURSING CARE PLAN
7. PHYSICIAN ORDERS & FOLLOW-UP
8. RISK ASSESSMENT & SAFETY CONSIDERATIONS

SPECIAL INSTRUCTIONS:
- Use professional medical terminology
- Be thorough but organized
- Highlight critical findings
- Provide actionable recommendations
- Language: ${language}`;
        
        const messages = [
            { role: 'system', content: 'You are a senior medical consultant with 20+ years experience. Write detailed, professional medical reports.' },
            { role: 'user', content: prompt }
        ];
        
        try {
            return await callDeepSeek(messages, 0.4);
        } catch (error) {
            console.error('Patient report error:', error);
            return `⚠️ خطأ في إنشاء التقرير الطبي: ${error.message}`;
        }
    }
    
    // 3. Generate Medication Table (JSON output)
    async function generateMedicationTable(patient, lang = 'ar') {
        console.log('💊 Generating medication table for:', patient.name);
        
        if (!hasApiKey() && !DEMO_MODE) {
            return showApiKeyWarning();
        }
        
        const language = lang === 'ar' ? 'Arabic' : 'English';
        const medications = patient.medications || [];
        
        const prompt = `Analyze these medications for a clinical nursing table in ${language}:

PATIENT: ${patient.name}, ${patient.age || 'Adult'}, Diagnosis: ${patient.diagnosis || 'General'}

MEDICATIONS TO ANALYZE:
${JSON.stringify(medications, null, 2)}

FORMAT REQUIREMENTS:
Return a VALID JSON ARRAY ONLY. Each object should have:
- "name": Medication name (Brand/Generic)
- "dose": Dosage with unit
- "frequency": Administration schedule
- "route": PO/IV/IM/SC etc.
- "indication": Why prescribed for this patient
- "side_effects": Common side effects to monitor
- "nursing_considerations": Special nursing notes
- "patient_education": What to teach patient

LANGUAGE: ${language} for all text values.
MEDICAL ACCURACY: Ensure information is clinically appropriate.
JSON ONLY: No markdown, no explanations, just JSON array.`;
        
        const messages = [
            { role: 'system', content: 'You are a clinical pharmacist. Return ONLY valid JSON array, no other text.' },
            { role: 'user', content: prompt }
        ];
        
        try {
            const response = await callDeepSeek(messages, 0.3); // Low temperature for consistent JSON
            
            // Clean and parse JSON
            const cleaned = response.replace(/```json|```/g, '').trim();
            console.log('📊 Raw medication response:', cleaned.substring(0, 200) + '...');
            
            try {
                const parsed = JSON.parse(cleaned);
                console.log('✅ Medication table parsed successfully:', parsed.length, 'items');
                return parsed;
            } catch (parseError) {
                console.error('JSON parse error:', parseError, 'Raw:', cleaned);
                
                // Fallback table
                return medications.map(med => ({
                    name: med.name || 'Unknown',
                    dose: med.dosage || 'N/A',
                    frequency: med.frequency || 'N/A',
                    route: 'PO',
                    indication: 'As prescribed',
                    side_effects: 'Monitor for adverse reactions',
                    nursing_considerations: 'Verify patient identity before administration',
                    patient_education: 'Take as directed, report any side effects'
                }));
            }
        } catch (error) {
            console.error('Medication table error:', error);
            return [];
        }
    }
    
    // 4. Generate Care Plan
    async function generateCarePlan(patient, lang = 'ar') {
        console.log('📈 Generating care plan for:', patient.name);
        
        if (!hasApiKey() && !DEMO_MODE) {
            return showApiKeyWarning();
        }
        
        const language = lang === 'ar' ? 'Arabic' : 'English';
        const prompt = `CREATE A NURSING CARE PLAN using NANDA-I format in ${language}:

PATIENT: ${patient.name}
DIAGNOSIS: ${patient.diagnosis || 'Medical condition'}
AGE: ${patient.age || 'Adult'}
BACKGROUND: ${JSON.stringify(patient.isbar?.background || {}, null, 2)}

CARE PLAN REQUIREMENTS:
1. Minimum 3 nursing diagnoses
2. For each diagnosis: Expected outcomes, Nursing interventions, Evaluation criteria
3. Use SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound)
4. Include patient education points
5. Consider cultural and ethical aspects
6. Language: ${language}

FORMAT EACH DIAGNOSIS AS:
- Nursing Diagnosis: [NANDA diagnosis]
- Related To: [Etiology]
- As Evidenced By: [Signs/symptoms]
- Expected Outcomes: [List 2-3]
- Nursing Interventions: [List 4-5 with rationale]
- Evaluation: [How to measure success]`;
        
        const messages = [
            { role: 'system', content: 'You are a nursing care planning specialist. Create comprehensive, evidence-based care plans.' },
            { role: 'user', content: prompt }
        ];
        
        try {
            return await callDeepSeek(messages, 0.4);
        } catch (error) {
            console.error('Care plan error:', error);
            return `⚠️ خطأ في إنشاء خطة الرعاية: ${error.message}`;
        }
    }
    
    // 5. Generate Clinical Alerts
    async function generateClinicalAlerts(patient, lang = 'ar') {
        console.log('🚨 Generating clinical alerts for:', patient.name);
        
        if (!hasApiKey() && !DEMO_MODE) {
            return showApiKeyWarning();
        }
        
        const language = lang === 'ar' ? 'Arabic' : 'English';
        const prompt = `ANALYZE CLINICAL RISKS and generate alerts in ${language}:

PATIENT PROFILE:
- Name: ${patient.name}
- Age: ${patient.age}
- Diagnosis: ${patient.diagnosis}
- Room: ${patient.roomNumber}

CLINICAL DATA:
${JSON.stringify(patient.isbar || {}, null, 2)}

ALERT REQUIREMENTS:
Generate 3-5 clinical alerts in JSON array format. Each alert should have:
- "title": Alert title (max 10 words)
- "message": Detailed explanation (2-3 sentences)
- "category": "hazard", "warning", "tip", or "learning"
- "priority": "high", "medium", or "low"
- "recommendation": Action to take

FOCUS ON:
1. Medication safety
2. Fall prevention
3. Infection control
4. Vital sign monitoring
5. Patient education gaps

FORMAT: Valid JSON array only. Language: ${language}`;
        
        const messages = [
            { role: 'system', content: 'You are a clinical safety officer. Return ONLY valid JSON array of alerts.' },
            { role: 'user', content: prompt }
        ];
        
        try {
            const response = await callDeepSeek(messages, 0.5);
            
            // Clean and parse JSON
            const cleaned = response.replace(/```json|```/g, '').trim();
            
            try {
                return JSON.parse(cleaned);
            } catch {
                // Fallback alerts
                return [
                    {
                        title: lang === 'ar' ? 'مراقبة العلامات الحيوية' : 'Vital Signs Monitoring',
                        message: lang === 'ar' ? 'تأكد من تسجيل العلامات الحيوية كل 4 ساعات' : 'Ensure vital signs are recorded every 4 hours',
                        category: 'tip',
                        priority: 'medium',
                        recommendation: lang === 'ar' ? 'استخدام جدول منتظم للمراقبة' : 'Use regular monitoring schedule'
                    },
                    {
                        title: lang === 'ar' ? 'سلامة الأدوية' : 'Medication Safety',
                        message: lang === 'ar' ? 'تحقق من هوية المريض قبل إعطاء أي دواء' : 'Verify patient identity before medication administration',
                        category: 'warning',
                        priority: 'high',
                        recommendation: lang === 'ar' ? 'اتباع بروتوكول التحقق المزدوج' : 'Follow double-check protocol'
                    }
                ];
            }
        } catch (error) {
            console.error('Clinical alerts error:', error);
            return [];
        }
    }
    
    // 6. Update API Key
    function updateApiKey(newKey) {
        if (!newKey || newKey.trim() === '') {
            console.error('❌ Empty API key provided');
            return false;
        }
        
        try {
            localStorage.setItem('nuraithm_deepseek_key', newKey.trim());
            console.log('✅ API key updated successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to save API key:', error);
            return false;
        }
    }
    
    // 7. Remove API Key
    function removeApiKey() {
        localStorage.removeItem('nuraithm_deepseek_key');
        console.log('🗑️ API key removed');
        return true;
    }
    
    // ========== PUBLIC API ==========
    
    const publicAPI = {
        // Main service functions
        generateShiftSummary,
        generatePatientReport,
        generateMedicationTable,
        generateCarePlan,
        generateClinicalAlerts,
        
        // Utility functions
        testConnection,
        updateApiKey,
        removeApiKey,
        hasApiKey,
        
        // Configuration
        getConfig: function() {
            return {
                demoMode: DEMO_MODE,
                hasApiKey: hasApiKey(),
                proxyUrl: PROXY_URL,
                apiKeyPreview: hasApiKey() ? getApiKey().substring(0, 8) + '...' : 'None'
            };
        },
        
        // Toggle demo mode (for testing)
        toggleDemoMode: function() {
            console.log(`🔁 Demo mode was ${DEMO_MODE ? 'ON' : 'OFF'}`);
            // Note: DEMO_MODE is constant, you need to reload page with different value
            alert(`DEMO_MODE is currently ${DEMO_MODE ? 'ON' : 'OFF'}. To change, edit DEMO_MODE constant in deepseek-service.js`);
            return DEMO_MODE;
        }
    };
    
    console.log('✅ DeepSeek Service initialized successfully');
    console.log('📊 Config:', publicAPI.getConfig());
    
    return publicAPI;
})();

// Make it globally available
window.DeepSeekService = DeepSeekService;

// Auto-initialization check
document.addEventListener('DOMContentLoaded', function() {
    console.log('🌐 DeepSeek Service Status:', window.DeepSeekService ? 'Loaded' : 'Failed');
    
    // Optional: Auto-test on load (uncomment if needed)
    // setTimeout(() => {
    //     window.DeepSeekService.testConnection().then(result => {
    //         console.log('🧪 Auto-connection test:', result);
    //     });
    // }, 2000);
});