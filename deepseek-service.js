// DeepSeek AI Service - FIXED & OPTIMIZED
const DeepSeekService = (function() {
    const API_URL = 'https://api.deepseek.com/chat/completions';

    // Get API Key securely
    function getApiKey() {
        return localStorage.getItem('nuraithm_deepseek_key');
    }

    // Generic Fetch Wrapper with Better Error Handling
    async function callDeepSeek(messages, temperature = 0.7) {
        const apiKey = getApiKey();
        if (!apiKey) throw new Error('API Key missing');

        try {
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
                    stream: false
                })
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`API Error ${response.status}: ${err}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('DeepSeek Call Failed:', error);
            throw error;
        }
    }

    return {
        // 1. SHIFT REPORT
        generateShiftSummary: async (patient, lang = 'ar') => {
            const prompt = `
                ACT AS A SENIOR NURSE. Generate a professional SHIFT HANDOVER REPORT for:
                Patient: ${patient.name}
                Diagnosis: ${patient.diagnosis}
                Age: ${patient.age}
                
                Data:
                ${JSON.stringify(patient.isbar || {})}
                
                REQUIREMENTS:
                - Use ISBAR format.
                - Highlight critical events.
                - Concise and professional tone.
                - Language: ${lang === 'ar' ? 'Arabic' : 'English'}.
                - NO MARKDOWN, just plain text.
            `;
            return await callDeepSeek([{ role: 'user', content: prompt }]);
        },

        // 2. ALL DATA REPORT
        generatePatientReport: async (patient, lang = 'ar') => {
            const prompt = `
                ACT AS A MEDICAL CONSULTANT. Analyze ALL patient data and write a COMPREHENSIVE MEDICAL REPORT.
                
                Patient Data:
                ${JSON.stringify(patient)}
                
                SECTIONS:
                1. Executive Summary
                2. Clinical History & Background
                3. Current Assessment & Vitals Analysis
                4. Medication Review
                5. Lab & Radiology Interpretation
                6. Recommendations & Care Plan
                
                Language: ${lang === 'ar' ? 'Arabic' : 'English'}.
            `;
            return await callDeepSeek([{ role: 'user', content: prompt }]);
        },

        // 3. MEDICATION TABLE (JSON OUTPUT)
        generateMedicationTable: async (patient, lang = 'ar') => {
            const prompt = `
                Analyze these medications: ${JSON.stringify(patient.medications || [])}.
                Return a JSON ARRAY ONLY. Do not include markdown formatting like \`\`\`json.
                
                Format:
                [
                    {
                        "name": "Medication Name",
                        "generic": "Generic Name",
                        "uses": "Primary uses for this patient",
                        "notes": "Nursing considerations/Side effects"
                    }
                ]
                
                Language: ${lang === 'ar' ? 'Arabic' : 'English'} for values.
            `;
            
            const raw = await callDeepSeek([{ role: 'user', content: prompt }], 0.3);
            
            // Clean cleanup to ensure valid JSON
            const cleanRaw = raw.replace(/``````/g, '').trim();
            try {
                return JSON.parse(cleanRaw);
            } catch (e) {
                console.error("JSON Parse Error", e);
                return [{ name: "Error", notes: "Could not parse AI response" }];
            }
        }
    };
})();
