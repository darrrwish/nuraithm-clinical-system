// deepseek-service.js - إصدار كامل يعمل
const DeepSeekService = (function() {
    console.log('🔧 DeepSeek Service Initializing...');
    
    // إعدادات الـ API
    const API_URL = 'https://api.deepseek.com/chat/completions';
    
    // الحصول على مفتاح API
    function getApiKey() {
        return localStorage.getItem('nuraithm_deepseek_key');
    }
    
    // التحقق من وجود مفتاح API
    function hasApiKey() {
        return !!getApiKey();
    }
    
    // عرض تحذير إذا لم يكن هناك مفتاح API
    function showApiKeyWarning() {
        return {
            error: 'API_KEY_REQUIRED',
            message: 'يرجى إدخال مفتاح DeepSeek API من الإعدادات',
            requiresApiKey: true
        };
    }
    
    // الاتصال بـ DeepSeek API
    async function callDeepSeek(messages, temperature = 0.7) {
        const apiKey = getApiKey();
        if (!apiKey) {
            throw new Error('API Key غير موجود. يرجى إدخال مفتاح DeepSeek API من الإعدادات.');
        }
        
        try {
            console.log('🔄 Sending request to DeepSeek API...');
            
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: messages,
                    temperature: temperature,
                    max_tokens: 4000,
                    stream: false
                })
            });
            
            console.log('📥 API Response Status:', response.status);
            
            if (!response.ok) {
                let errorMessage = `خطأ في الـ API: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error?.message || errorData.details || errorMessage;
                } catch (e) {
                    const textError = await response.text();
                    if (textError) errorMessage = textError.substring(0, 100);
                }
                
                throw new Error(errorMessage);
            }
            
            const data = await response.json();
            console.log('✅ API Response received successfully');
            
            if (data.choices && data.choices[0] && data.choices[0].message) {
                return data.choices[0].message.content;
            } else if (data.error) {
                throw new Error(data.error);
            } else {
                throw new Error('تنسيق الاستجابة غير متوقع من خدمة الذكاء الاصطناعي');
            }
            
        } catch (error) {
            console.error('❌ DeepSeek API call failed:', error);
            
            let userMessage = error.message;
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                userMessage = 'فشل الاتصال بالخادم. تأكد من اتصال الإنترنت.';
            } else if (error.message.includes('401') || error.message.includes('403')) {
                userMessage = 'مفتاح API غير صالح أو منتهي الصلاحية. يرجى التحقق من المفتاح على platform.deepseek.com';
            }
            
            throw new Error(userMessage);
        }
    }
    
    // اختبار الاتصال
    async function testConnection() {
        console.log('🧪 Testing API connection...');
        
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
            
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
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
                    ? '✅ اتصال ناجح!' 
                    : `❌ فشل الاتصال (Status: ${status})`
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
    
    // ========== خدمة توليد التنبيهات السريرية ==========
    
    async function generateClinicalAlerts(patient, lang = 'ar') {
        console.log('🚨 Generating clinical alerts for:', patient.name);
        
        if (!hasApiKey()) {
            return showApiKeyWarning();
        }
        
        const language = lang === 'ar' ? 'Arabic' : 'English';
        const prompt = `You are a Senior Clinical Safety Expert. Analyze this patient case and generate clinical alerts:

PATIENT PROFILE:
- Name: ${patient.name || 'Unknown'}
- Age: ${patient.age || 'Unknown'}
- Diagnosis: ${patient.diagnosis || 'Not specified'}
- Room: ${patient.roomNumber || 'N/A'}

CLINICAL DATA:
- Allergies: ${patient.isbar?.background?.allergy || 'None'}
- Isolation: ${patient.isbar?.background?.infections_isolation || 'None'}
- Current Medications: ${JSON.stringify(patient.medications || [])}
- Assessment: GCS ${patient.isbar?.assessment?.gcs || '15'}, Fall Risk: ${patient.isbar?.assessment?.fall_risk || 'low'}
- Recent Events: ${JSON.stringify(patient.isbar?.shift_notes?.slice(0, 3) || [])}

REQUIREMENTS:
Generate 4-6 clinical alerts in JSON array format. Each alert should have:
1. "title": Short alert title in ${language} (3-5 words)
2. "message": Detailed explanation in ${language} (2-3 sentences)
3. "category": One of ["hazard", "warning", "tip", "learning"]
4. "priority": One of ["high", "medium", "low"]

CATEGORY DEFINITIONS:
- "hazard": Critical safety issue requiring immediate attention
- "warning": Important concern requiring monitoring
- "tip": Helpful suggestion for better care
- "learning": Educational point for staff development

PRIORITY GUIDELINES:
- "high": Life-threatening or critical situation
- "medium": Important but not immediately critical
- "low": General recommendation or best practice

FOCUS ON:
1. Medication safety and interactions
2. Fall prevention strategies
3. Infection control measures
4. Vital sign monitoring needs
5. Patient education gaps
6. Care coordination requirements

IMPORTANT: Return ONLY valid JSON array, no additional text.
LANGUAGE: All text must be in ${language}.`;

        const messages = [
            { role: 'system', content: 'You are a clinical safety officer. Always return valid JSON array only, no markdown, no explanations.' },
            { role: 'user', content: prompt }
        ];
        
        try {
            const response = await callDeepSeek(messages, 0.5);
            
            // تنظيف وتفسير JSON
            const cleaned = response.replace(/```json|```/g, '').trim();
            
            try {
                const alerts = JSON.parse(cleaned);
                console.log(`✅ Generated ${alerts.length} clinical alerts`);
                
                // إضافة معرف فريد لكل تنبيه
                return alerts.map((alert, index) => ({
                    ...alert,
                    id: `alert_${Date.now()}_${index}`,
                    patientId: patient.id,
                    patientName: patient.name,
                    generatedAt: new Date().toISOString()
                }));
                
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                console.log('Raw response:', cleaned);
                
                // استجابة بديلة عند فشل التحليل
                return generateFallbackAlerts(patient, lang);
            }
            
        } catch (error) {
            console.error('Clinical alerts error:', error);
            return generateFallbackAlerts(patient, lang);
        }
    }
    
    // توليد تنبيهات بديلة
    function generateFallbackAlerts(patient, lang) {
        const diagnosis = patient.diagnosis || '';
        const medsCount = patient.medications?.length || 0;
        const hasAllergy = patient.isbar?.background?.allergy && 
                          !patient.isbar.background.allergy.toLowerCase().includes('none') &&
                          !patient.isbar.background.allergy.toLowerCase().includes('لا يوجد');
        
        if (lang === 'ar') {
            return [
                {
                    id: `alert_${Date.now()}_1`,
                    title: "مراقبة العلامات الحيوية",
                    message: "يوصى بمراقبة العلامات الحيوية كل 4 ساعات، خاصة ضغط الدم ومعدل التنفس. سجل جميع القراءات بدقة في ملف المريض.",
                    category: "tip",
                    priority: "medium",
                    patientId: patient.id,
                    patientName: patient.name,
                    generatedAt: new Date().toISOString()
                },
                {
                    id: `alert_${Date.now()}_2`,
                    title: "سلامة الأدوية",
                    message: `لدى المريض ${medsCount} دواءً موصوفًا. تحقق من التفاعلات الدوائية المحتملة وتأكد من إعطاء الجرعات في الأوقات المحددة.`,
                    category: "warning",
                    priority: "high",
                    patientId: patient.id,
                    patientName: patient.name,
                    generatedAt: new Date().toISOString()
                }
            ];
        } else {
            return [
                {
                    id: `alert_${Date.now()}_1`,
                    title: "Vital Signs Monitoring",
                    message: "Recommend monitoring vital signs every 4 hours, especially blood pressure and respiratory rate. Record all readings accurately in patient file.",
                    category: "tip",
                    priority: "medium",
                    patientId: patient.id,
                    patientName: patient.name,
                    generatedAt: new Date().toISOString()
                },
                {
                    id: `alert_${Date.now()}_2`,
                    title: "Medication Safety",
                    message: `Patient has ${medsCount} prescribed medications. Check for potential drug interactions and ensure doses are given at scheduled times.`,
                    category: "warning",
                    priority: "high",
                    patientId: patient.id,
                    patientName: patient.name,
                    generatedAt: new Date().toISOString()
                }
            ];
        }
    }
    
    // ========== خدمة توليد خطة الرعاية التمريضية ==========
    
    async function generateCarePlan(patient, lang = 'ar') {
        console.log('📈 Generating care plan for:', patient.name);
        
        if (!hasApiKey()) {
            return {
                success: false,
                message: lang === 'ar' ? 'مفتاح API مطلوب' : 'API key required',
                requiresApiKey: true
            };
        }
        
        const language = lang === 'ar' ? 'Arabic' : 'English';
        const prompt = `You are a Nursing Care Planning Specialist. Create a comprehensive nursing care plan using NANDA-I format:

PATIENT INFORMATION:
- Name: ${patient.name || 'Patient'}
- Age: ${patient.age || 'Unknown'}
- Diagnosis: ${patient.diagnosis || 'Medical condition'}
- Room: ${patient.roomNumber || 'N/A'}

CLINICAL ASSESSMENT:
- Medical History: ${patient.isbar?.background?.past_medical_history || 'Not specified'}
- Allergies: ${patient.isbar?.background?.allergy || 'None'}
- Current Status: ${patient.isbar?.assessment?.important_findings || 'Stable'}
- Medications: ${JSON.stringify(patient.medications || [])}

REQUIREMENTS:
Create 3-5 nursing diagnoses with complete care plan.
For EACH diagnosis, provide:
1. Nursing Diagnosis (NANDA-I format)
2. Related Factors/Etiology
3. Defining Characteristics/Evidence
4. Expected Outcomes (SMART goals)
5. Nursing Interventions (4-5 interventions with rationales)
6. Evaluation Criteria

FORMAT:
Return as a well-structured text report in ${language}.
Use clear headings and bullet points.
Focus on evidence-based practice.
Include patient education points.
Consider cultural competence aspects.

LANGUAGE: Write entire report in ${language}.
STYLE: Professional, concise, clinically accurate.`;

        const messages = [
            { role: 'system', content: 'You are an experienced nursing educator specialized in care planning. Provide detailed, evidence-based care plans.' },
            { role: 'user', content: prompt }
        ];
        
        try {
            const response = await callDeepSeek(messages, 0.4);
            return {
                success: true,
                content: response,
                patientId: patient.id,
                patientName: patient.name,
                generatedAt: new Date().toISOString(),
                type: 'careplan'
            };
            
        } catch (error) {
            console.error('Care plan error:', error);
            return {
                success: false,
                message: lang === 'ar' 
                    ? `خطأ في إنشاء خطة الرعاية: ${error.message}`
                    : `Error generating care plan: ${error.message}`
            };
        }
    }
    
    // ========== خدمة توليد تقرير الحالة ==========
    
    async function generatePatientReport(patient, lang = 'ar') {
        console.log('🏥 Generating patient report for:', patient.name);
        
        if (!hasApiKey()) {
            return {
                success: false,
                message: lang === 'ar' ? 'مفتاح API مطلوب' : 'API key required',
                requiresApiKey: true
            };
        }
        
        const language = lang === 'ar' ? 'Arabic' : 'English';
        const prompt = `You are a Senior Medical Consultant. Write a comprehensive medical report:

PATIENT DETAILS:
- Name: ${patient.name || 'Patient'}
- MRN: ${patient.fileNumber || 'N/A'}
- Age: ${patient.age || 'Unknown'}
- Room: ${patient.roomNumber || 'N/A'}
- Admission Date: ${patient.isbar?.identification?.admission_date || 'N/A'}

CLINICAL SUMMARY:
- Primary Diagnosis: ${patient.diagnosis || 'Not specified'}
- Chief Complaint: ${patient.isbar?.background?.chief_complaint || 'N/A'}
- Medical History: ${patient.isbar?.background?.past_medical_history || 'N/A'}
- Allergies: ${patient.isbar?.background?.allergy || 'None'}

CURRENT STATUS:
- Vital Signs: ${patient.isbar?.assessment?.vitals || 'N/A'}
- GCS: ${patient.isbar?.assessment?.gcs || '15'}
- Fall Risk: ${patient.isbar?.assessment?.fall_risk || 'low'}
- Key Findings: ${patient.isbar?.assessment?.important_findings || 'N/A'}

MEDICATIONS:
${JSON.stringify(patient.medications || [], null, 2)}

RECENT EVENTS:
${JSON.stringify(patient.isbar?.shift_notes?.slice(0, 5) || [], null, 2)}

REPORT REQUIREMENTS:
1. Executive Summary (2-3 sentences)
2. Clinical History & Background
3. Current Assessment & Analysis
4. Medication Review
5. Diagnostic Findings Interpretation
6. Treatment Plan & Recommendations
7. Follow-up & Monitoring Plan

FORMAT: Professional medical report style.
LANGUAGE: ${language}.
LENGTH: Comprehensive but concise (800-1200 words).
ACCURACY: Clinically appropriate and evidence-based.`;

        const messages = [
            { role: 'system', content: 'You are a senior medical consultant with extensive clinical experience. Write detailed, professional medical reports.' },
            { role: 'user', content: prompt }
        ];
        
        try {
            const response = await callDeepSeek(messages, 0.3);
            return {
                success: true,
                content: response,
                patientId: patient.id,
                patientName: patient.name,
                generatedAt: new Date().toISOString(),
                type: 'medical_report'
            };
            
        } catch (error) {
            console.error('Patient report error:', error);
            return {
                success: false,
                message: lang === 'ar' 
                    ? `خطأ في إنشاء التقرير: ${error.message}`
                    : `Error generating report: ${error.message}`
            };
        }
    }
    
    // ========== خدمة توليد جدول الأدوية ==========
    
    async function generateMedicationTable(patient, lang = 'ar') {
        console.log('💊 Generating medication table for:', patient.name);
        
        if (!hasApiKey()) {
            return {
                success: false,
                message: lang === 'ar' ? 'مفتاح API مطلوب' : 'API key required',
                requiresApiKey: true
            };
        }
        
        const language = lang === 'ar' ? 'Arabic' : 'English';
        const medications = patient.medications || [];
        
        if (medications.length === 0) {
            return {
                success: true,
                content: lang === 'ar' 
                    ? 'لا توجد أدوية مسجلة لهذا المريض.'
                    : 'No medications recorded for this patient.',
                tableData: {
                    headers: lang === 'ar' 
                        ? ["الدواء", "الجرعة", "التكرار", "الملاحظات"]
                        : ["Medication", "Dosage", "Frequency", "Notes"],
                    rows: []
                }
            };
        }
        
        const prompt = `You are a Clinical Pharmacist. Analyze these medications for a medication administration record:

PATIENT: ${patient.name}
DIAGNOSIS: ${patient.diagnosis || 'General condition'}
AGE: ${patient.age || 'Adult'}

MEDICATIONS TO ANALYZE:
${JSON.stringify(medications, null, 2)}

ANALYSIS REQUIREMENTS:
For each medication, provide:
1. Generic/Brand name classification
2. Therapeutic category
3. Mechanism of action (brief)
4. Key monitoring parameters
5. Common side effects
6. Nursing considerations
7. Patient education points

FORMAT:
Create a comprehensive analysis in ${language}.
Use clear sections for each medication.
Include clinical pearls and safety tips.
Focus on practical nursing implications.

OUTPUT:
First, provide detailed text analysis.
Then, create a summary table with:
- Medication Name
- Dosage & Frequency
- Key Monitoring
- Special Instructions

LANGUAGE: ${language}
CLINICAL ACCURACY: Ensure information is up-to-date and evidence-based.`;

        const messages = [
            { role: 'system', content: 'You are a clinical pharmacist specialized in medication safety and patient education.' },
            { role: 'user', content: prompt }
        ];
        
        try {
            const response = await callDeepSeek(messages, 0.3);
            
            // استخراج وتحليل الاستجابة
            const tableData = extractTableFromResponse(response, medications, lang);
            
            return {
                success: true,
                content: response,
                tableData: tableData,
                patientId: patient.id,
                patientName: patient.name,
                generatedAt: new Date().toISOString(),
                type: 'medication_analysis'
            };
            
        } catch (error) {
            console.error('Medication table error:', error);
            
            // جدول بديل
            const fallbackTable = {
                headers: lang === 'ar' 
                    ? ["الدواء", "الجرعة", "التكرار", "التوصيات"]
                    : ["Medication", "Dosage", "Frequency", "Recommendations"],
                rows: medications.map(med => [
                    med.name || 'Unknown',
                    med.dosage || 'N/A',
                    med.frequency || 'N/A',
                    lang === 'ar' 
                        ? 'مراقبة العلامات الحيوية والآثار الجانبية'
                        : 'Monitor vital signs and side effects'
                ])
            };
            
            return {
                success: false,
                message: lang === 'ar' 
                    ? `خطأ في التحليل: ${error.message}`
                    : `Analysis error: ${error.message}`,
                tableData: fallbackTable
            };
        }
    }
    
    // استخراج الجدول من الاستجابة
    function extractTableFromResponse(response, medications, lang) {
        try {
            // محاولة العثور على جدول في الاستجابة
            const lines = response.split('\n');
            let tableStart = -1;
            let tableEnd = -1;
            
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes('|') && lines[i].includes('-')) {
                    tableStart = i - 1; // السطر السابق هو العناوين
                    break;
                }
            }
            
            if (tableStart !== -1) {
                for (let i = tableStart + 2; i < lines.length; i++) {
                    if (!lines[i].includes('|') || lines[i].trim() === '') {
                        tableEnd = i;
                        break;
                    }
                }
                
                if (tableEnd === -1) tableEnd = lines.length;
                
                const tableRows = lines.slice(tableStart, tableEnd)
                    .filter(line => line.includes('|'))
                    .map(line => line.split('|')
                        .map(cell => cell.trim())
                        .filter(cell => cell !== '')
                    );
                
                if (tableRows.length > 1) {
                    const headers = tableRows[0];
                    const rows = tableRows.slice(1);
                    
                    return { headers, rows };
                }
            }
            
            // إذا لم يتم العثور على جدول، إنشاء جدول أساسي
            return {
                headers: lang === 'ar' 
                    ? ["الدواء", "الجرعة", "التكرار", "ملاحظات السريرية"]
                    : ["Medication", "Dosage", "Frequency", "Clinical Notes"],
                rows: medications.map(med => [
                    med.name || 'Unknown',
                    med.dosage || 'N/A',
                    med.frequency || 'N/A',
                    lang === 'ar' 
                        ? 'تأكد من الجرعة والتفاعلات'
                        : 'Verify dosage and interactions'
                ])
            };
            
        } catch (error) {
            console.error('Table extraction error:', error);
            
            // جدول بديل
            return {
                headers: lang === 'ar' 
                    ? ["الدواء", "الجرعة", "التكرار", "توصيات"]
                    : ["Medication", "Dosage", "Frequency", "Recommendations"],
                rows: medications.map(med => [
                    med.name || 'Unknown',
                    med.dosage || 'N/A',
                    med.frequency || 'N/A',
                    lang === 'ar' ? 'مراقبة مستمرة' : 'Continuous monitoring'
                ])
            };
        }
    }
    
    // ========== خدمة توليد ملخص الشفت ==========
    
    async function generateShiftSummary(patient, lang = 'ar') {
        console.log('📋 Generating shift summary for:', patient.name);
        
        if (!hasApiKey()) {
            return {
                success: false,
                message: lang === 'ar' ? 'مفتاح API مطلوب' : 'API key required',
                requiresApiKey: true
            };
        }
        
        const language = lang === 'ar' ? 'Arabic' : 'English';
        const prompt = `You are a Charge Nurse. Create a professional shift handover report using ISBAR format:

IDENTIFICATION:
- Patient: ${patient.name || 'Unknown'}
- MRN: ${patient.fileNumber || 'N/A'}
- Age: ${patient.age || 'Unknown'}
- Room: ${patient.roomNumber || 'N/A'}

SITUATION:
- Primary Diagnosis: ${patient.diagnosis || 'Not specified'}
- Chief Complaint: ${patient.isbar?.background?.chief_complaint || 'N/A'}

BACKGROUND:
- Medical History: ${patient.isbar?.background?.past_medical_history || 'N/A'}
- Allergies: ${patient.isbar?.background?.allergy || 'None'}
- Isolation: ${patient.isbar?.background?.infections_isolation || 'None'}

ASSESSMENT:
- Vital Signs: ${patient.isbar?.assessment?.vitals || 'N/A'}
- GCS: ${patient.isbar?.assessment?.gcs || '15'}
- Fall Risk: ${patient.isbar?.assessment?.fall_risk || 'low'}
- Key Findings: ${patient.isbar?.assessment?.important_findings || 'N/A'}

MEDICATIONS ADMINISTERED:
${JSON.stringify(patient.medications || [], null, 2)}

RECENT EVENTS (LAST SHIFT):
${JSON.stringify(patient.isbar?.shift_notes?.slice(0, 5) || [], null, 2)}

RECOMMENDATIONS:
- Current Plan: ${patient.isbar?.recommendations?.plan_of_care || 'Continue management'}
- Pending Tasks: ${patient.todos?.filter(t => !t.completed).length || 0} tasks pending

REPORT REQUIREMENTS:
Use ISBAR format clearly.
Include specific times for events.
Note any changes in condition.
Highlight concerns for next shift.
Provide clear action items.
Use professional nursing terminology.

LANGUAGE: ${language}
LENGTH: 300-500 words
STYLE: Concise, organized, clinically focused.`;

        const messages = [
            { role: 'system', content: 'You are an experienced charge nurse skilled at shift handovers. Be precise, thorough, and professional.' },
            { role: 'user', content: prompt }
        ];
        
        try {
            const response = await callDeepSeek(messages, 0.4);
            return {
                success: true,
                content: response,
                patientId: patient.id,
                patientName: patient.name,
                generatedAt: new Date().toISOString(),
                type: 'shift_summary'
            };
            
        } catch (error) {
            console.error('Shift summary error:', error);
            return {
                success: false,
                message: lang === 'ar' 
                    ? `خطأ في إنشاء ملخص الشفت: ${error.message}`
                    : `Error generating shift summary: ${error.message}`
            };
        }
    }
    
    // ========== تحديث مفتاح API ==========
    
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
    
    // ========== API العامة ==========
    
    const publicAPI = {
        // دوال الخدمة الرئيسية
        generateClinicalAlerts,
        generateCarePlan,
        generatePatientReport,
        generateMedicationTable,
        generateShiftSummary,
        
        // دوال المساعدة
        testConnection,
        updateApiKey,
        hasApiKey,
        
        // الحصول على الإعدادات
        getConfig: function() {
            return {
                hasApiKey: hasApiKey(),
                apiKeyPreview: hasApiKey() ? getApiKey().substring(0, 8) + '...' : 'None',
                serviceStatus: 'Active'
            };
        }
    };
    
    console.log('✅ DeepSeek Service initialized successfully');
    console.log('📊 Config:', publicAPI.getConfig());
    
    return publicAPI;
})();

window.DeepSeekService = DeepSeekService;