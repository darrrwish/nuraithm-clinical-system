// netlify/functions/deepseek-proxy.js
exports.handler = async function(event, context) {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
        'Content-Type': 'application/json'
    };
    
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }
    
    // Only POST allowed
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed. Use POST.' })
        };
    }
    
    try {
        // Parse request body
        let requestBody;
        try {
            requestBody = JSON.parse(event.body);
        } catch (parseError) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Invalid JSON in request body' })
            };
        }
        
        const { messages, temperature = 0.7, max_tokens = 2000 } = requestBody;
        
        // Get API key from Authorization header
        const authHeader = event.headers.authorization || event.headers.Authorization;
        if (!authHeader) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'API key required. Add Authorization: Bearer YOUR_KEY' })
            };
        }
        
        const apiKey = authHeader.replace('Bearer ', '');
        
        // Validate inputs
        if (!messages || !Array.isArray(messages)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Messages array is required' })
            };
        }
        
        // Log request (without exposing full API key)
        console.log('🌐 DeepSeek Proxy Request:', {
            messagesCount: messages.length,
            hasApiKey: !!apiKey,
            apiKeyPreview: apiKey ? apiKey.substring(0, 8) + '...' : 'none',
            temperature,
            max_tokens
        });
        
        // Call DeepSeek API
        const deepseekResponse = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: messages,
                temperature: temperature,
                max_tokens: max_tokens,
                stream: false
            })
        });
        
        // Handle DeepSeek API response
        if (!deepseekResponse.ok) {
            const errorText = await deepseekResponse.text();
            console.error('❌ DeepSeek API Error:', deepseekResponse.status, errorText);
            
            return {
                statusCode: deepseekResponse.status,
                headers,
                body: JSON.stringify({
                    error: `DeepSeek API error: ${deepseekResponse.status}`,
                    details: errorText.substring(0, 200)
                })
            };
        }
        
        const data = await deepseekResponse.json();
        
        // Log successful response
        console.log('✅ DeepSeek Proxy Success:', {
            status: deepseekResponse.status,
            hasChoices: !!data.choices,
            responseLength: data.choices?.[0]?.message?.content?.length || 0
        });
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data)
        };
        
    } catch (error) {
        console.error('🔥 Proxy Server Error:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal server error in proxy',
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            })
        };
    }
};