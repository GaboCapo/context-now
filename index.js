/**
 * Context-Now Programmatic API
 * ============================
 * Exportiert Funktionen für programmatische Nutzung
 */

'use strict';

const { safeGit, safeGH, safePath } = require('./lib/security/safe-exec');

/**
 * Context-Now API
 */
const contextNow = {
    /**
     * Verbinde ein Projekt
     * @param {string} projectPath - Pfad zum Projekt
     * @returns {Promise<Object>} Verbindungsstatus
     */
    connect: async function(projectPath) {
        const connect = require('./lib/commands/connect');
        return await connect(projectPath);
    },
    
    /**
     * Status eines Projekts abrufen
     * @param {string} projectName - Optional: Projektname
     * @returns {Promise<Object>} Projektstatus
     */
    status: async function(projectName = null) {
        const status = require('./lib/commands/status');
        return await status(projectName);
    },
    
    /**
     * Liste alle Projekte
     * @returns {Promise<Array>} Liste der Projekte
     */
    list: async function() {
        const list = require('./lib/commands/list');
        return await list();
    },
    
    /**
     * Branches eines Projekts abrufen
     * @param {string} projectName - Optional: Projektname
     * @returns {Promise<Object>} Branch-Informationen
     */
    branches: async function(projectName = null) {
        const branches = require('./lib/commands/branches');
        return await branches(projectName);
    },
    
    /**
     * Issues eines Projekts abrufen
     * @param {string} projectName - Optional: Projektname
     * @returns {Promise<Array>} Issue-Liste
     */
    issues: async function(projectName = null) {
        const issues = require('./lib/commands/issues');
        return await issues(projectName);
    },
    
    /**
     * Pull Requests eines Projekts abrufen
     * @param {string} projectName - Optional: Projektname
     * @returns {Promise<Array>} PR-Liste
     */
    pullRequests: async function(projectName = null) {
        const prs = require('./lib/commands/prs');
        return await prs(projectName);
    },
    
    /**
     * Kritische Issues abrufen
     * @param {string} projectName - Optional: Projektname
     * @returns {Promise<Array>} Kritische Issues
     */
    critical: async function(projectName = null) {
        const critical = require('./lib/commands/critical');
        return await critical(projectName);
    },
    
    /**
     * Projekt trennen
     * @param {string} projectName - Projektname
     * @returns {Promise<boolean>} Erfolg
     */
    disconnect: async function(projectName) {
        const disconnect = require('./lib/commands/disconnect');
        return await disconnect(projectName);
    },
    
    /**
     * Utility functions
     */
    utils: {
        safeGit,
        safeGH,
        safePath
    }
};

// CommonJS Export
module.exports = contextNow;

// Named exports für ES6
module.exports.connect = contextNow.connect;
module.exports.status = contextNow.status;
module.exports.list = contextNow.list;
module.exports.branches = contextNow.branches;
module.exports.issues = contextNow.issues;
module.exports.pullRequests = contextNow.pullRequests;
module.exports.critical = contextNow.critical;
module.exports.disconnect = contextNow.disconnect;
module.exports.utils = contextNow.utils;