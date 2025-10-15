const axios = require('axios');

const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5000';

const callFlaskApi = async (endpoint, data) => {
    try {
        const response = await axios.post(`${FLASK_API_URL}${endpoint}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error calling Flask API endpoint ${endpoint}:`, error.message);
        throw new Error(`Flask API error: ${error.message}`);
    }
};

module.exports = { callFlaskApi };
