const axios = require('axios');

const DEFAULT_BASE_URL = 'https://enrichlayer.com';
const TIMEOUT_MS = 30000;

/**
 * Make an authenticated GET request to the Enrich Layer API.
 *
 * @param {object} configNode - The enrichlayer-config node instance
 * @param {string} path - API path (e.g. "/api/v2/company")
 * @param {object} params - Query string parameters
 * @returns {Promise<object>} Parsed JSON response
 */
async function makeRequest(configNode, path, params) {
    const baseUrl = (configNode.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
    const apiKey = configNode.credentials && configNode.credentials.apiKey;

    if (!apiKey) {
        throw new Error('Enrich Layer API key is not configured');
    }

    // Remove empty/undefined params
    const cleanParams = {};
    if (params) {
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null && value !== '') {
                cleanParams[key] = value;
            }
        }
    }

    try {
        const response = await axios.get(`${baseUrl}${path}`, {
            params: cleanParams,
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/json',
            },
            timeout: TIMEOUT_MS,
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;
            const message = (data && (data.message || data.detail || data.error)) || error.message;
            throw new Error(`Enrich Layer API error (${status}): ${message}`);
        }
        if (error.code === 'ECONNABORTED') {
            throw new Error('Enrich Layer API request timed out');
        }
        throw new Error(`Enrich Layer API request failed: ${error.message}`);
    }
}

module.exports = { makeRequest, DEFAULT_BASE_URL };
