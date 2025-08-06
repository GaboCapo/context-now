#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');
const os = require('os');

// Konfigurationsdateien
const CONFIG_DIR = path.join(os.homedir(), '.config', 'context-tracker');
const DEPLOY_KEYS_CONFIG = path.join(CONFIG_DIR, 'deploy-keys.json');
const DEFAULT_SSH_PATH = path.join(os.homedir(), '.ssh');

// Farben für Terminal-Output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

// Konfigurationsverzeichnis erstellen
function ensureConfigDir() {
    if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
}

// Deploy Keys Konfiguration laden
function loadDeployKeysConfig() {
    ensureConfigDir();
    
    if (!fs.existsSync(DEPLOY_KEYS_CONFIG)) {
        const defaultConfig = {
            sshPath: DEFAULT_SSH_PATH,
            deployKeys: [],
            activeKey: null
        };
        fs.writeFileSync(DEPLOY_KEYS_CONFIG, JSON.stringify(defaultConfig, null, 2));
        return defaultConfig;
    }
    
    try {
        return JSON.parse(fs.readFileSync(DEPLOY_KEYS_CONFIG, 'utf8'));
    } catch (e) {
        console.error(`${colors.red}Fehler beim Laden der Konfiguration:${colors.reset}`, e.message);
        return { sshPath: DEFAULT_SSH_PATH, deployKeys: [], activeKey: null };
    }
}

// Deploy Keys Konfiguration speichern
function saveDeployKeysConfig(config) {
    ensureConfigDir();
    fs.writeFileSync(DEPLOY_KEYS_CONFIG, JSON.stringify(config, null, 2));
}

// SSH Keys im Verzeichnis scannen
function scanSSHKeys(sshPath) {
    if (!fs.existsSync(sshPath)) {
        console.error(`${colors.red}SSH-Verzeichnis existiert nicht: ${sshPath}${colors.reset}`);
        return [];
    }
    
    const files = fs.readdirSync(sshPath);
    const keys = [];
    
    // Suche nach privaten Schlüsseln (ohne .pub Endung)
    files.forEach(file => {
        const filePath = path.join(sshPath, file);
        const stats = fs.statSync(filePath);
        
        // Prüfe ob es ein privater Schlüssel ist
        if (stats.isFile() && !file.endsWith('.pub') && !file.endsWith('.old')) {
            // Prüfe ob eine .pub Datei existiert
            const pubKeyPath = `${filePath}.pub`;
            if (fs.existsSync(pubKeyPath)) {
                // Lese die öffentliche Schlüssel-Info
                try {
                    const pubKeyContent = fs.readFileSync(pubKeyPath, 'utf8').trim();
                    const keyInfo = {
                        name: file,
                        path: filePath,
                        pubPath: pubKeyPath,
                        // Extrahiere den Kommentar (normalerweise am Ende)
                        comment: pubKeyContent.split(' ').slice(2).join(' ') || file
                    };
                    
                    // Prüfe ob es ein Deploy Key ist (enthält normalerweise "deploy" im Namen)
                    if (file.toLowerCase().includes('deploy')) {
                        keyInfo.type = 'deploy';
                    } else {
                        keyInfo.type = 'standard';
                    }
                    
                    keys.push(keyInfo);
                } catch (e) {
                    console.warn(`${colors.yellow}Warnung: Konnte ${file} nicht lesen${colors.reset}`);
                }
            }
        }
    });
    
    return keys;
}

// Interaktives Setup
async function setupDeployKeys() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));
    
    console.log(`\n${colors.bright}🔐 Deploy Key Setup${colors.reset}\n`);
    
    // Aktuelle Konfiguration laden
    const config = loadDeployKeysConfig();
    
    // SSH-Pfad abfragen
    const sshPathInput = await question(
        `SSH-Verzeichnis (Enter für Standard: ${config.sshPath}): `
    );
    const sshPath = sshPathInput.trim() || config.sshPath;
    
    // Keys scannen
    console.log(`\n${colors.cyan}Scanne SSH-Keys in ${sshPath}...${colors.reset}`);
    const availableKeys = scanSSHKeys(sshPath);
    
    if (availableKeys.length === 0) {
        console.log(`${colors.red}Keine SSH-Keys gefunden!${colors.reset}`);
        rl.close();
        return;
    }
    
    // Verfügbare Keys anzeigen
    console.log(`\n${colors.bright}Gefundene SSH-Keys:${colors.reset}`);
    availableKeys.forEach((key, index) => {
        const typeIcon = key.type === 'deploy' ? '🔐' : '🔑';
        const typeColor = key.type === 'deploy' ? colors.green : colors.dim;
        
        console.log(`${index + 1}. ${typeIcon} ${typeColor}${key.name}${colors.reset}`);
        console.log(`   ${colors.dim}${key.comment}${colors.reset}`);
    });
    
    // Deploy Keys auswählen
    console.log(`\n${colors.yellow}Welche Keys sollen als Deploy Keys verwendet werden?${colors.reset}`);
    console.log(`${colors.dim}(Komma-getrennte Nummern, z.B. 1,3 oder 'all' für alle Deploy Keys)${colors.reset}`);
    
    const selection = await question('Auswahl: ');
    
    let selectedKeys = [];
    if (selection.toLowerCase() === 'all') {
        selectedKeys = availableKeys.filter(k => k.type === 'deploy');
    } else {
        const indices = selection.split(',').map(s => parseInt(s.trim()) - 1);
        selectedKeys = indices
            .filter(i => i >= 0 && i < availableKeys.length)
            .map(i => availableKeys[i]);
    }
    
    if (selectedKeys.length === 0) {
        console.log(`${colors.yellow}Keine Keys ausgewählt.${colors.reset}`);
        rl.close();
        return;
    }
    
    // Repository-Zuordnung
    console.log(`\n${colors.bright}Repository-Zuordnung:${colors.reset}`);
    
    for (const key of selectedKeys) {
        console.log(`\n${colors.cyan}Key: ${key.name}${colors.reset}`);
        
        // Versuche Repository aus Key-Namen zu extrahieren
        let defaultRepo = '';
        if (key.name.includes('_deploy')) {
            defaultRepo = key.name.split('_deploy')[0];
        }
        
        const owner = await question(`GitHub Owner/Organisation (z.B. GaboCapo): `);
        const repo = await question(`Repository Name (${defaultRepo ? `Enter für: ${defaultRepo}` : ''}): `);
        
        const repoName = repo.trim() || defaultRepo;
        
        if (owner && repoName) {
            // Füge Key zur Konfiguration hinzu
            const deployKey = {
                name: key.name,
                path: key.path,
                pubPath: key.pubPath,
                owner: owner.trim(),
                repo: repoName,
                addedAt: new Date().toISOString()
            };
            
            // Prüfe ob Key bereits existiert
            const existingIndex = config.deployKeys.findIndex(k => k.path === key.path);
            if (existingIndex >= 0) {
                config.deployKeys[existingIndex] = deployKey;
                console.log(`${colors.yellow}Key aktualisiert${colors.reset}`);
            } else {
                config.deployKeys.push(deployKey);
                console.log(`${colors.green}✅ Key hinzugefügt${colors.reset}`);
            }
        }
    }
    
    // Aktiven Key auswählen
    if (config.deployKeys.length > 0) {
        console.log(`\n${colors.bright}Welcher Key soll standardmäßig verwendet werden?${colors.reset}`);
        config.deployKeys.forEach((key, index) => {
            console.log(`${index + 1}. ${key.name} → ${key.owner}/${key.repo}`);
        });
        
        const activeSelection = await question('Nummer (Enter für ersten): ');
        const activeIndex = (parseInt(activeSelection) || 1) - 1;
        
        if (activeIndex >= 0 && activeIndex < config.deployKeys.length) {
            config.activeKey = config.deployKeys[activeIndex].name;
            console.log(`${colors.green}✅ Aktiver Key: ${config.activeKey}${colors.reset}`);
        }
    }
    
    // Konfiguration speichern
    config.sshPath = sshPath;
    saveDeployKeysConfig(config);
    
    console.log(`\n${colors.green}✅ Setup abgeschlossen!${colors.reset}`);
    console.log(`Konfiguration gespeichert in: ${DEPLOY_KEYS_CONFIG}`);
    
    rl.close();
}

// Deploy Keys auflisten
function listDeployKeys() {
    const config = loadDeployKeysConfig();
    
    if (config.deployKeys.length === 0) {
        console.log(`${colors.yellow}Keine Deploy Keys konfiguriert.${colors.reset}`);
        console.log(`Verwende: ${colors.cyan}context-tracker-ssh -s${colors.reset} zum Einrichten`);
        return;
    }
    
    console.log(`\n${colors.bright}🔐 Konfigurierte Deploy Keys:${colors.reset}\n`);
    
    config.deployKeys.forEach((key, index) => {
        const isActive = key.name === config.activeKey;
        const statusIcon = isActive ? '✅' : '  ';
        const statusColor = isActive ? colors.green : colors.reset;
        
        console.log(`${statusIcon} ${statusColor}${key.name}${colors.reset}`);
        console.log(`   Repository: ${colors.cyan}${key.owner}/${key.repo}${colors.reset}`);
        console.log(`   Pfad: ${colors.dim}${key.path}${colors.reset}`);
        console.log(`   Hinzugefügt: ${colors.dim}${new Date(key.addedAt).toLocaleDateString()}${colors.reset}`);
        console.log('');
    });
    
    if (config.activeKey) {
        console.log(`${colors.green}Aktiver Key: ${config.activeKey}${colors.reset}`);
    }
}

// GitHub Branches via SSH abrufen
function fetchBranchesViaSSH(deployKey) {
    try {
        // SSH-Befehl mit spezifischem Key
        const sshCommand = `ssh -i "${deployKey.path}" -o StrictHostKeyChecking=no`;
        
        // Git ls-remote um Branches abzurufen
        const gitUrl = `git@github.com:${deployKey.owner}/${deployKey.repo}.git`;
        const command = `GIT_SSH_COMMAND='${sshCommand}' git ls-remote --heads ${gitUrl}`;
        
        console.log(`${colors.cyan}  → Hole Branches via SSH für ${deployKey.owner}/${deployKey.repo}...${colors.reset}`);
        
        const output = execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
        
        // Parse die Branches aus der Ausgabe
        const branches = output
            .split('\n')
            .filter(line => line.trim())
            .map(line => {
                const parts = line.split('\t');
                if (parts.length >= 2) {
                    return parts[1].replace('refs/heads/', '');
                }
                return null;
            })
            .filter(branch => branch);
        
        return branches;
        
    } catch (error) {
        console.error(`${colors.red}SSH-Fehler: ${error.message}${colors.reset}`);
        return null;
    }
}

// Branches für aktuelles Repository abrufen
function fetchCurrentRepoBranches() {
    const config = loadDeployKeysConfig();
    
    if (config.deployKeys.length === 0) {
        console.log(`${colors.yellow}Keine Deploy Keys konfiguriert. Verwende 'context-tracker-ssh -s' zum Setup.${colors.reset}`);
        return null;
    }
    
    // Versuche Repository aus Remote URL zu ermitteln
    const remoteUrl = execSync('git config --get remote.origin.url', { encoding: 'utf8' }).trim();
    
    // Finde passenden Deploy Key
    let deployKey = null;
    
    // Parse Repository Info aus URL
    const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)(\.git)?$/);
    if (match) {
        const owner = match[1];
        const repo = match[2];
        
        // Suche passenden Deploy Key
        deployKey = config.deployKeys.find(k => 
            k.owner.toLowerCase() === owner.toLowerCase() && 
            k.repo.toLowerCase() === repo.toLowerCase()
        );
    }
    
    // Falls kein passender Key gefunden, verwende aktiven Key
    if (!deployKey && config.activeKey) {
        deployKey = config.deployKeys.find(k => k.name === config.activeKey);
        console.log(`${colors.yellow}Verwende aktiven Key: ${deployKey.name}${colors.reset}`);
    }
    
    if (!deployKey) {
        console.log(`${colors.red}Kein passender Deploy Key gefunden!${colors.reset}`);
        return null;
    }
    
    return fetchBranchesViaSSH(deployKey);
}

// Export für andere Module
module.exports = {
    loadDeployKeysConfig,
    fetchCurrentRepoBranches,
    fetchBranchesViaSSH
};

// CLI Entry Point
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];
    
    switch (command) {
        case '-s':
        case '--setup':
            setupDeployKeys();
            break;
            
        case '-l':
        case '--list':
            listDeployKeys();
            break;
            
        case '-t':
        case '--test':
            // Test-Funktion
            const branches = fetchCurrentRepoBranches();
            if (branches) {
                console.log(`\n${colors.green}✅ ${branches.length} Branches gefunden:${colors.reset}`);
                branches.forEach(b => console.log(`  - ${b}`));
            }
            break;
            
        case '-h':
        case '--help':
        default:
            console.log(`
${colors.bright}🔐 Context-Tracker SSH Deploy Key Manager${colors.reset}

${colors.cyan}Verwendung:${colors.reset}
  context-tracker-ssh [OPTION]

${colors.cyan}Optionen:${colors.reset}
  ${colors.green}-s, --setup${colors.reset}   Deploy Keys einrichten
  ${colors.green}-l, --list${colors.reset}    Konfigurierte Keys anzeigen
  ${colors.green}-t, --test${colors.reset}    Verbindung testen
  ${colors.green}-h, --help${colors.reset}    Diese Hilfe anzeigen

${colors.dim}Deploy Keys ermöglichen sicheren Zugriff auf private GitHub Repos${colors.reset}
${colors.dim}ohne Personal Access Tokens zu verwenden.${colors.reset}
`);
            break;
    }
}