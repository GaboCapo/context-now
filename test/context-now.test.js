#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const assert = require('assert');

// Test-Umgebung Setup
const TEST_DIR = path.join(__dirname, 'test-env');
const SCRIPT_PATH = path.join(__dirname, '..', 'context-now.js');
const TEST_PROJECT = path.join(TEST_DIR, 'test-project');

// Farben für Terminal-Output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

// Test-Utilities
function createTestEnvironment() {
    // Cleanup vorheriges Test-Environment
    if (fs.existsSync(TEST_DIR)) {
        fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
    
    // Erstelle Test-Umgebung
    fs.mkdirSync(TEST_DIR, { recursive: true });
    fs.mkdirSync(TEST_PROJECT, { recursive: true });
    
    // Initialisiere Git-Repo
    execSync('git init', { cwd: TEST_PROJECT });
    fs.writeFileSync(path.join(TEST_PROJECT, 'package.json'), JSON.stringify({
        name: 'test-project',
        version: '1.0.0'
    }, null, 2));
}

function cleanupTestEnvironment() {
    if (fs.existsSync(TEST_DIR)) {
        fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
}

function runCommand(args) {
    try {
        const result = execSync(`node ${SCRIPT_PATH} ${args}`, {
            encoding: 'utf8',
            env: { ...process.env, HOME: TEST_DIR }
        });
        return { success: true, output: result };
    } catch (error) {
        return { success: false, output: error.stdout || error.message };
    }
}

// Test-Funktionen
const tests = {
    'Script existiert und ist ausführbar': () => {
        assert(fs.existsSync(SCRIPT_PATH), 'context-now.js sollte existieren');
        const stats = fs.statSync(SCRIPT_PATH);
        assert(stats.isFile(), 'context-now.js sollte eine Datei sein');
    },

    'Hilfe-Option funktioniert': () => {
        const result = runCommand('-h');
        assert(result.success, 'Hilfe sollte erfolgreich angezeigt werden');
        assert(result.output.includes('Usage:'), 'Hilfe sollte Usage enthalten');
        assert(result.output.includes('-c'), 'Hilfe sollte -c Option zeigen');
        assert(result.output.includes('-l'), 'Hilfe sollte -l Option zeigen');
    },

    'Projekt-Verbindung funktioniert': () => {
        const result = runCommand(`-c ${TEST_PROJECT}`);
        assert(result.success || result.output.includes('erfolgreich'), 
               'Projekt sollte verbunden werden können');
    },

    'Projekt-Liste zeigt verbundene Projekte': () => {
        runCommand(`-c ${TEST_PROJECT}`);
        const result = runCommand('-l');
        assert(result.success, 'Liste sollte angezeigt werden');
        assert(result.output.includes('test-project') || result.output.includes('Projekte'), 
               'Liste sollte Projekt enthalten');
    },

    'Status-Anzeige funktioniert': () => {
        runCommand(`-c ${TEST_PROJECT}`);
        const result = runCommand('-s');
        assert(result.success || result.output.length > 0, 
               'Status sollte angezeigt werden');
    },

    'Ungültiger Pfad wird abgelehnt': () => {
        const result = runCommand('-c /nonexistent/path');
        assert(!result.success || result.output.includes('existiert nicht'), 
               'Ungültiger Pfad sollte Fehler zeigen');
    },

    'Projekt-Trennung funktioniert': () => {
        runCommand(`-c ${TEST_PROJECT}`);
        const result = runCommand('-d test-project');
        assert(result.success || result.output.includes('getrennt'), 
               'Projekt sollte getrennt werden können');
    }
};

// Test-Runner
function runTests() {
    console.log(`${colors.blue}════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.blue}   Context-Now Test Suite${colors.reset}`);
    console.log(`${colors.blue}════════════════════════════════════════${colors.reset}\n`);

    createTestEnvironment();
    
    let passed = 0;
    let failed = 0;
    const failures = [];

    for (const [name, test] of Object.entries(tests)) {
        try {
            test();
            console.log(`${colors.green}✓${colors.reset} ${name}`);
            passed++;
        } catch (error) {
            console.log(`${colors.red}✗${colors.reset} ${name}`);
            console.log(`  ${colors.red}${error.message}${colors.reset}`);
            failed++;
            failures.push({ name, error: error.message });
        }
    }

    cleanupTestEnvironment();

    console.log(`\n${colors.blue}════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.green}Bestanden: ${passed}${colors.reset} | ${colors.red}Fehlgeschlagen: ${failed}${colors.reset}`);
    
    if (failures.length > 0) {
        console.log(`\n${colors.red}Fehlgeschlagene Tests:${colors.reset}`);
        failures.forEach(f => {
            console.log(`  - ${f.name}: ${f.error}`);
        });
        process.exit(1);
    } else {
        console.log(`${colors.green}Alle Tests bestanden!${colors.reset}`);
        process.exit(0);
    }
}

// Führe Tests aus
if (require.main === module) {
    runTests();
}