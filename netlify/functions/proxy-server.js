// netlify/functions/deepseek-proxy.js
exports.handler = async function(event, context) {
    // السماح لجميع النطاقات (أو حدد نطاقك فقط)
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // معالجة طلب CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // فقط طلبات POST مسموحة
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { messages, temperature, max_tokens } = JSON.parse(event.body);
        const apiKey = event.headers.authorization?.replace('Bearer ', '');
        
        if (!apiKey) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'API key required' })
            };
        }

        // استدعاء DeepSeek API
        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages,
                temperature: temperature || 0.7,
                max_tokens: max_tokens || 2000,
                stream: false
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('DeepSeek API error:', response.status, errorText);
            
            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify({ 
                    error: `DeepSeek API error: ${response.status}`,
                    details: errorText 
                })
            };
        }

        const data = await response.json();
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error('Proxy error:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Internal server error',
                details: error.message 
            })
        };
    }
};