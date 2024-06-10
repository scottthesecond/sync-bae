const fs = require('fs');
const path = require('path');

function loadConfig() {
    const configPath = path.join(__dirname, '../../config.json');
    if (!fs.existsSync(configPath)) {
        throw new Error('Config file not found');
    }
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    validateConfig(config);
    return config;
}

function validateConfig(config) {
    if (!config.keys || !Array.isArray(config.keys)) {
        throw new Error('Invalid config: keys must be an array');
    }
    if (!config.jobs || !Array.isArray(config.jobs)) {
        throw new Error('Invalid config: jobs must be an array');
    }
}

module.exports = { loadConfig };