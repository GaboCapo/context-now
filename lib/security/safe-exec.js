/**
 * Safe Execution Utilities
 * ========================
 * Sichere Wrapper für Shell-Commands um Injection-Angriffe zu verhindern
 */

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Validiert Branch-Namen gegen gefährliche Zeichen
 * @param {string} branchName - Der zu validierende Branch-Name
 * @returns {boolean} true wenn sicher
 */
function isValidBranchName(branchName) {
    // Erlaubt: Buchstaben, Zahlen, -, _, /, .
    // Verhindert: Spaces, Shell-Metazeichen, etc.
    const validPattern = /^[a-zA-Z0-9\-_\/\.]+$/;
    const maxLength = 255;
    
    return validPattern.test(branchName) && 
           branchName.length <= maxLength &&
           !branchName.startsWith('.') &&  // Keine versteckten Branches
           !branchName.includes('..') &&   // Kein Path Traversal
           !branchName.startsWith('/');    // Kein absoluter Pfad
}

/**
 * Validiert Issue-Titel und entfernt gefährliche Zeichen
 * @param {string} title - Der zu bereinigende Titel
 * @returns {string} Sicherer Titel
 */
function sanitizeIssueTitle(title) {
    // Entfernt Shell-Metazeichen und Control Characters
    return title
        .replace(/[`$(){}[\]|&;<>'"\\]/g, '')  // Shell-Metazeichen entfernen
        .replace(/[\x00-\x1F\x7F]/g, '')       // Control Characters entfernen  
        .replace(/\s+/g, ' ')                  // Multiple Spaces zu einem
        .trim()                                // Trim whitespace
        .substring(0, 200);                    // Max Länge
}

/**
 * Validiert Pfade gegen Path Traversal
 * @param {string} userPath - Der zu prüfende Pfad
 * @param {string} basePath - Der erlaubte Basis-Pfad
 * @returns {string} Der sichere, absolute Pfad
 * @throws {Error} Bei Path Traversal Versuch
 */
function safePath(userPath, basePath) {
    // Resolve zu absolutem Pfad
    const resolvedPath = path.resolve(basePath, userPath);
    const resolvedBase = path.resolve(basePath);
    
    // Prüfe ob der Pfad innerhalb der Basis bleibt
    if (!resolvedPath.startsWith(resolvedBase)) {
        throw new Error(`Path traversal detected: ${userPath}`);
    }
    
    return resolvedPath;
}

/**
 * Führt Git-Commands sicher aus
 * @param {Array<string>} args - Git command arguments
 * @param {Object} options - Execution options
 * @returns {string} Command output
 */
function safeGit(args, options = {}) {
    // Validiere alle Argumente
    args.forEach(arg => {
        if (typeof arg !== 'string') {
            throw new Error('Git argument must be a string');
        }
    });
    
    try {
        return execFileSync('git', args, {
            encoding: 'utf8',
            maxBuffer: 1024 * 1024 * 10, // 10MB max
            timeout: 30000, // 30 Sekunden timeout
            ...options
        }).trim();
    } catch (error) {
        // Sichere Fehlerbehandlung ohne Shell-Output
        if (error.code === 'ENOENT') {
            throw new Error('Git is not installed');
        }
        throw new Error(`Git command failed: ${error.message}`);
    }
}

/**
 * Führt GitHub CLI Commands sicher aus
 * @param {Array<string>} args - gh command arguments
 * @param {Object} options - Execution options  
 * @returns {string} Command output
 */
function safeGH(args, options = {}) {
    // Validiere alle Argumente
    args.forEach(arg => {
        if (typeof arg !== 'string') {
            throw new Error('GH argument must be a string');
        }
    });
    
    try {
        return execFileSync('gh', args, {
            encoding: 'utf8',
            maxBuffer: 1024 * 1024 * 10, // 10MB max
            timeout: 30000, // 30 Sekunden timeout
            ...options
        }).trim();
    } catch (error) {
        if (error.code === 'ENOENT') {
            throw new Error('GitHub CLI (gh) is not installed');
        }
        throw new Error(`GH command failed: ${error.message}`);
    }
}

/**
 * Führt beliebige Commands sicher aus (ohne Shell)
 * @param {string} command - Der auszuführende Befehl
 * @param {Array<string>} args - Command arguments
 * @param {Object} options - Execution options
 * @returns {string} Command output
 */
function safeExec(command, args = [], options = {}) {
    // Whitelist für erlaubte Commands
    const allowedCommands = ['git', 'gh', 'npm', 'node', 'ls', 'pwd'];
    
    const cmdName = path.basename(command);
    if (!allowedCommands.includes(cmdName)) {
        throw new Error(`Command not allowed: ${cmdName}`);
    }
    
    try {
        return execFileSync(command, args, {
            encoding: 'utf8',
            maxBuffer: 1024 * 1024 * 10,
            timeout: 30000,
            ...options
        }).trim();
    } catch (error) {
        throw new Error(`Command failed: ${error.message}`);
    }
}

/**
 * Validiert JSON-Input sicher
 * @param {string} jsonString - Der zu parsende JSON-String
 * @param {Object} schema - Optional: Erwartete Struktur
 * @returns {Object} Geparster JSON
 */
function safeJSON(jsonString, schema = null) {
    try {
        const parsed = JSON.parse(jsonString);
        
        // Optional: Schema-Validierung
        if (schema) {
            validateSchema(parsed, schema);
        }
        
        return parsed;
    } catch (error) {
        throw new Error('Invalid JSON input');
    }
}

/**
 * Einfache Schema-Validierung
 * @param {Object} data - Zu validierende Daten
 * @param {Object} schema - Erwartete Struktur
 */
function validateSchema(data, schema) {
    for (const [key, type] of Object.entries(schema)) {
        if (!(key in data)) {
            throw new Error(`Missing required field: ${key}`);
        }
        if (typeof data[key] !== type) {
            throw new Error(`Invalid type for ${key}: expected ${type}`);
        }
    }
}

/**
 * Sicheres Schreiben von Dateien
 * @param {string} filePath - Ziel-Pfad
 * @param {string} content - Zu schreibender Inhalt
 * @param {string} basePath - Erlaubter Basis-Pfad
 */
function safeWriteFile(filePath, content, basePath) {
    const safeDest = safePath(filePath, basePath);
    
    // Verhindere Überschreiben von wichtigen Dateien
    const protectedFiles = ['.git', '.gitignore', 'package.json', 'package-lock.json'];
    const fileName = path.basename(safeDest);
    
    if (protectedFiles.includes(fileName)) {
        throw new Error(`Cannot overwrite protected file: ${fileName}`);
    }
    
    fs.writeFileSync(safeDest, content, 'utf8');
    return safeDest;
}

module.exports = {
    isValidBranchName,
    sanitizeIssueTitle,
    safePath,
    safeGit,
    safeGH,
    safeExec,
    safeJSON,
    safeWriteFile,
    validateSchema
};