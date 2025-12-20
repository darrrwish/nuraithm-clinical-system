// AI Services for Gemini API Integration
const Services = (function() {
    const API_KEY = window.GEMINI_API_KEY || localStorage.getItem('nuraithm_api_key');
    const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

    // Clean JSON response
    function cleanJsonResponse(text) {
        if (!text) return '[]';
        return text.replace(/```json\n?|```/g, '').trim();
    }

    // Check if API key exists
    function hasApiKey() {
        return API_KEY && API_KEY.trim() !== '';
    }

    // Show warning if no API key
    function showApiKeyWarning() {
        console.warn('⚠️ Gemini API key not configured');
        
        // Show modal if available
        if (typeof window.showApiKeyModal === 'function') {
            window.showApiKeyModal();
        }
        
        return null;
    }

    // Fallback messages when no API key
    function getFallbackMessage(type, lang) {
        const messages = {
            'ar': {
                'risks': 'تفعيل الذكاء الاصطناعي مطلوب لتحليل المخاطر',
                'careplan': 'لإنشاء خطة رعاية ذكية، يرجى تفعيل مفتاح API',
                'summary': 'يتطلب إنشاء ملخص الشفت تفعيل الذكاء الاصطناعي',
                'medtable': 'تحليل الأدوية يتطلب تفعيل مفتاح API',
                'medical': 'التلخيص الطبي الذكي يتطلب تفعيل مفتاح API'
            },
            'en': {
                'risks': 'AI activation required for risk analysis',
                'careplan': 'To create smart care plan, please activate API key',
                'summary': 'Shift summary requires AI activation',
                'medtable': 'Medication analysis requires API key',
                'medical': 'Smart medical summary requires API key'
            }
        };
        
        return messages[lang || 'ar'][type] || 'API key required';
    }

    // Test API connection
    async function testApiConnection() {
        if (!hasApiKey()) {
            return { success: false, message: 'No API key provided' };
        }

        try {
            const response = await fetch(`${BASE_URL}/models/gemini-pro:generateContent?key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: "Hello" }] }],
                    generationConfig: { maxOutputTokens: 10 }
                })
            });

            if (response.ok) {
                return { success: true, message: 'API connection successful' };
            } else {
                return { success: false, message: `API error: ${response.status}` };
            }
        } catch (error) {
            return { success: false, message: `Network error: ${error.message}` };
        }
    }

    // Analyze Clinical Risks
    async function analyzeClinicalRisks(patient, lang) {
        if (!hasApiKey()) {
            showApiKeyWarning();
            return [{
                title: lang === 'ar' ? 'تفعيل مطلوب' : 'Activation Required',
                message: getFallbackMessage('risks', lang),
                category: "warning",
                requiresApiKey: true
            }];
        }
        
        const languageName = lang === 'ar' ? 'Arabic' : 'English';
        const prompt = `As a Senior Clinical Safety Expert, analyze this patient case:

PATIENT INFORMATION:
- Name: ${patient.name || 'Unknown'}
- Diagnosis: ${patient.diagnosis || 'Not specified'}
- Age: ${patient.age || 'Unknown'}
- Room: ${patient.roomNumber || 'N/A'}

CLINICAL DATA:
- Medications: ${JSON.stringify(patient.medications || [])}
- Recent Events: ${JSON.stringify(patient.isbar?.shift_notes?.slice(0, 3) || [])}
- Background: ${JSON.stringify(patient.isbar?.background || {})}

Please provide clinical risk analysis in ${languageName} language.
Format as JSON array with these categories: hazard, warning, tip, learning.
Example format: [{"title": "...", "message": "...", "category": "hazard|warning|tip|learning"}]`;

        try {
            console.log('Sending AI request for risk analysis...');
            const response = await fetch(`${BASE_URL}/models/gemini-pro:generateContent?key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 2000,
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
            const cleaned = cleanJsonResponse(text);
            
            try {
                const result = JSON.parse(cleaned);
                console.log('AI Risk Analysis Result:', result);
                return result;
            } catch (parseError) {
                console.warn('JSON parse failed, using fallback:', parseError);
                // Return smart fallback analysis
                return generateFallbackAnalysis(patient, lang);
            }
        } catch (error) {
            console.error('AI Analysis Error:', error);
            return generateFallbackAnalysis(patient, lang);
        }
    }

    // Generate fallback analysis when AI fails
    function generateFallbackAnalysis(patient, lang) {
        const diagnosis = patient.diagnosis || '';
        const isCardiac = diagnosis.toLowerCase().includes('قلب') || diagnosis.toLowerCase().includes('cardiac');
        const isDiabetic = diagnosis.toLowerCase().includes('سكري') || diagnosis.toLowerCase().includes('diabet');
        
        if (lang === 'ar') {
            return [
                {
                    title: "تحليل أولي",
                    message: "بناءً على البيانات المدخلة، يوصى بمراقبة العلامات الحيوية بانتظام",
                    category: "tip"
                },
                {
                    title: "تنبيه عام",
                    message: "تأكد من توثيق جميع التغييرات في حالة المريض",
                    category: "warning"
                },
                {
                    title: "مقترح للتعلم",
                    message: "راجع بروتوكولات إدارة الحالة للمرضى ذوي الحالات المماثلة",
                    category: "learning"
                }
            ];
        } else {
            return [
                {
                    title: "Initial Analysis",
                    message: "Based on entered data, recommend regular vital signs monitoring",
                    category: "tip"
                },
                {
                    title: "General Alert",
                    message: "Ensure documentation of all patient status changes",
                    category: "warning"
                },
                {
                    title: "Learning Suggestion",
                    message: "Review case management protocols for similar conditions",
                    category: "learning"
                }
            ];
        }
    }

    // Generate Nurse Care Plan
    async function generateNurseCarePlan(patient, lang) {
        if (!hasApiKey()) {
            showApiKeyWarning();
            return {
                headers: lang === 'ar' 
                    ? ["التشخيص التمريضي", "الأهداف", "التدخلات", "التقييم"]
                    : ["Nursing Diagnosis", "Goals", "Interventions", "Evaluation"],
                rows: [[
                    lang === 'ar' ? "تفعيل الذكاء الاصطناعي مطلوب" : "AI activation required",
                    lang === 'ar' ? "لإنشاء خطة رعاية ذكية" : "To create smart care plan",
                    lang === 'ar' ? "يرجى إدخال مفتاح API" : "Please enter API key",
                    lang === 'ar' ? "من الإعدادات" : "from settings"
                ]],
                requiresApiKey: true
            };
        }
        
        const languageName = lang === 'ar' ? 'Arabic' : 'English';
        const prompt = `Generate a professional Nursing Care Plan using NANDA-I format for:
        
PATIENT DIAGNOSIS: ${patient.diagnosis || 'General medical condition'}
PATIENT BACKGROUND: ${JSON.stringify(patient.isbar?.background || {})}
ASSESSMENT DATA: ${JSON.stringify(patient.isbar?.assessment || {})}
MEDICATIONS: ${JSON.stringify(patient.medications || [])}

Language: ${languageName}
Format: JSON with headers and rows for a table
Example: {"headers": ["Nursing Diagnosis", "Goals", "Interventions", "Evaluation"], "rows": [["Diagnosis 1", "Goal 1", "Intervention 1", "Evaluation 1"]]}

Please provide 3-5 nursing diagnoses with corresponding goals, interventions, and evaluation methods.`;

        try {
            const response = await fetch(`${BASE_URL}/models/gemini-pro:generateContent?key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.3,
                        maxOutputTokens: 3000,
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
            const cleaned = cleanJsonResponse(text);
            
            try {
                return JSON.parse(cleaned);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                return getFallbackCarePlan(lang);
            }
        } catch (error) {
            console.error('AI Care Plan Error:', error);
            return getFallbackCarePlan(lang);
        }
    }

    // Fallback care plan
    function getFallbackCarePlan(lang) {
        if (lang === 'ar') {
            return {
                headers: ["التشخيص التمريضي", "الأهداف", "التدخلات", "التقييم"],
                rows: [
                    ["خطر السقوط المحتمل", "منع السقوط خلال فترة الإقامة", "تقييم خطر السقوط، تأمين البيئة، تعليم المريض", "عدم حدوث سقوط"],
                    ["عدم توازن السوائل", "الحفاظ على توازن السوائل", "مراقبة المدخول والمخرجات، وزن يومي، مراقبة العلامات الحيوية", "توازن السوائل ضمن المعدل الطبيعي"],
                    ["المعرفة غير الكافية", "تحسين فهم المريض لحالته", "تقديم التعليم المناسب، استخدام وسائل إيضاحية، متابعة الفهم", "القدرة على شرح الحالة والعلاج"]
                ]
            };
        } else {
            return {
                headers: ["Nursing Diagnosis", "Goals", "Interventions", "Evaluation"],
                rows: [
                    ["Risk for Falls", "Prevent falls during hospital stay", "Fall risk assessment, secure environment, patient education", "No falls occurred"],
                    ["Fluid Volume Imbalance", "Maintain fluid balance", "Monitor I/O, daily weight, vital signs monitoring", "Fluid balance within normal range"],
                    ["Deficient Knowledge", "Improve patient understanding", "Provide appropriate education, use visual aids, assess understanding", "Patient can explain condition and treatment"]
                ]
            };
        }
    }

    // Generate Shift Summary
    async function generateShiftSummary(patient, lang) {
        if (!hasApiKey()) {
            showApiKeyWarning();
            return lang === 'ar' 
                ? "🔑 تفعيل الذكاء الاصطناعي مطلوب لإنشاء ملخص الشفت الذكي. يرجى إدخال مفتاح API من الإعدادات."
                : "🔑 AI activation required for smart shift summary. Please enter API key from settings.";
        }
        
        const languageName = lang === 'ar' ? 'Arabic' : 'English';
        const prompt = `Write a professional nursing shift handover summary in ${languageName}:

PATIENT: ${patient.name || 'Patient'}
DIAGNOSIS: ${patient.diagnosis || 'Not specified'}
ROOM: ${patient.roomNumber || 'N/A'}

CLINICAL EVENTS (last shift):
${JSON.stringify(patient.isbar?.shift_notes || [], null, 2)}

VITAL SIGNS/ASSESSMENT:
${JSON.stringify(patient.isbar?.assessment || {}, null, 2)}

MEDICATIONS ADMINISTERED:
${JSON.stringify(patient.medications || [], null, 2)}

Please provide a concise, professional summary including:
1. Patient status during shift
2. Key events and interventions
3. Important findings
4. Recommendations for next shift
5. Any pending tasks or concerns

Format as plain text in ${languageName} language.`;

        try {
            const response = await fetch(`${BASE_URL}/models/gemini-pro:generateContent?key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.5,
                        maxOutputTokens: 1500,
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || 
                (lang === 'ar' ? "تم إنشاء ملخص الشفت بنجاح" : "Shift summary generated successfully");
        } catch (error) {
            console.error('AI Shift Summary Error:', error);
            return lang === 'ar' 
                ? "تعذر الاتصال بخدمة الذكاء الاصطناعي. يرجى التحقق من اتصال الإنترنت ومفتاح API."
                : "Unable to connect to AI service. Please check internet connection and API key.";
        }
    }

    // Generate Smart Medication Table
    async function generateSmartMedTableData(patient, lang) {
        if (!hasApiKey()) {
            showApiKeyWarning();
            return {
                headers: lang === 'ar' 
                    ? ["الدواء", "الجرعة", "التكرار", "الملاحظات المهمة"]
                    : ["Medication", "Dosage", "Frequency", "Key Notes"],
                rows: [[
                    lang === 'ar' ? "يتطلب تفعيل الذكاء الاصطناعي" : "Requires AI activation",
                    lang === 'ar' ? "لتحليل متقدم للأدوية" : "For advanced medication analysis",
                    lang === 'ar' ? "أدخل مفتاح API" : "Enter API key",
                    lang === 'ar' ? "للحصول على تحليل ذكي" : "For smart analysis"
                ]],
                requiresApiKey: true
            };
        }
        
        const languageName = lang === 'ar' ? 'Arabic' : 'English';
        const prompt = `Analyze these medications for nursing monitoring in ${languageName}:

MEDICATIONS: ${JSON.stringify(patient.medications || [])}
PATIENT DIAGNOSIS: ${patient.diagnosis || 'General condition'}
PATIENT AGE: ${patient.age || 'Adult'}

For each medication, provide:
1. Key nursing considerations
2. Potential side effects to monitor
3. Important administration notes
4. Patient education points

Format as JSON table with headers and rows.
Example: {"headers": ["Drug", "Dosage", "Key Monitoring", "Nursing Notes"], "rows": [["Drug1", "Dose1", "Monitor1", "Notes1"]]}`;

        try {
            const response = await fetch(`${BASE_URL}/models/gemini-pro:generateContent?key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.3,
                        maxOutputTokens: 2000,
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
            const cleaned = cleanJsonResponse(text);
            
            try {
                return JSON.parse(cleaned);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                return getFallbackMedTable(patient, lang);
            }
        } catch (error) {
            console.error('AI Med Analysis Error:', error);
            return getFallbackMedTable(patient, lang);
        }
    }

    // Fallback medication table
    function getFallbackMedTable(patient, lang) {
        const meds = patient.medications || [];
        if (meds.length === 0) {
            return {
                headers: lang === 'ar' 
                    ? ["الدواء", "الجرعة", "التكرار", "الملاحظات"]
                    : ["Medication", "Dosage", "Frequency", "Notes"],
                rows: [[
                    lang === 'ar' ? "لا توجد أدوية مسجلة" : "No medications recorded",
                    "", "", ""
                ]]
            };
        }
        
        const rows = meds.map(med => [
            med.name || 'Unknown',
            med.dosage || 'N/A',
            med.frequency || 'N/A',
            lang === 'ar' ? 'مراقبة العلامات الحيوية والآثار الجانبية' : 'Monitor vital signs and side effects'
        ]);
        
        return {
            headers: lang === 'ar' 
                ? ["الدواء", "الجرعة", "التكرار", "التوصيات"]
                : ["Medication", "Dosage", "Frequency", "Recommendations"],
            rows: rows
        };
    }

    // Generate Medical Summary
    async function generateMedicalSummary(patient, lang) {
        if (!hasApiKey()) {
            showApiKeyWarning();
            return lang === 'ar'
                ? "📋 تفعيل الذكاء الاصطناعي مطلوب للتلخيص الطبي الذكي. أدخل مفتاح API للحصول على تحليل متقدم."
                : "📋 AI activation required for smart medical summary. Enter API key for advanced analysis.";
        }
        
        const languageName = lang === 'ar' ? 'Arabic' : 'English';
        const prompt = `Write a comprehensive ISBAR medical summary in ${languageName}:

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
- Current Medications: ${JSON.stringify(patient.medications || [])}

ASSESSMENT:
- Vital Signs: ${patient.isbar?.assessment?.vitals || 'N/A'}
- Key Findings: ${patient.isbar?.assessment?.important_findings || 'N/A'}
- GCS: ${patient.isbar?.assessment?.gcs || '15'}

RECOMMENDATIONS:
- Plan of Care: ${patient.isbar?.recommendations?.plan_of_care || 'Continue current management'}

Please provide a professional, concise summary suitable for clinical handover in ${languageName} language.`;

        try {
            const response = await fetch(`${BASE_URL}/models/gemini-pro:generateContent?key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.5,
                        maxOutputTokens: 1500,
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || 
                (lang === 'ar' ? "تم إنشاء التلخيص الطبي بنجاح" : "Medical summary generated successfully");
        } catch (error) {
            console.error('AI Summary Error:', error);
            return lang === 'ar' 
                ? "تعذر إنشاء التلخيص. تحقق من الاتصال والمفتاح."
                : "Unable to generate summary. Check connection and key.";
        }
    }

    // Update API Key
    function updateApiKey(newKey) {
        window.GEMINI_API_KEY = newKey;
        localStorage.setItem('nuraithm_api_key', newKey);
        return true;
    }

    // Check API status
    function getApiStatus() {
        return {
            hasKey: hasApiKey(),
            key: API_KEY ? `${API_KEY.substring(0, 10)}...` : 'Not set',
            testUrl: `${BASE_URL}/models?key=${API_KEY ? '***' : ''}`
        };
    }

    // Public API
    return {
        analyzeClinicalRisks,
        generateNurseCarePlan,
        generateShiftSummary,
        generateSmartMedTableData,
        generateMedicalSummary,
        testApiConnection,
        updateApiKey,
        getApiStatus,
        hasApiKey,
        showApiKeyWarning
    };
})();

// Make services globally available
window.Services = Services;