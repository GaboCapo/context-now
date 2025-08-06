#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// Zentrale Konfiguration
const CONTEXT_NOW_DIR = path.join(os.homedir(), 'Code', 'context-now');
const CONFIG_FILE = path.join(CONTEXT_NOW_DIR, 'projects.json');
const TOOLS_DIR = path.join(CONTEXT_NOW_DIR, 'tools', 'context-tracker');

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

// Projekt-Konfiguration laden
function loadProjects() {
    if (!fs.existsSync(CONFIG_FILE)) {
        return {};
    }
    try {
        return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    } catch (e) {
        console.error(`${colors.red}Fehler beim Laden der Projekte:${colors.reset}`, e.message);
        return {};
    }
}

// Projekt-Konfiguration speichern
function saveProjects(projects) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(projects, null, 2));
}

// Projekt verbinden (symlinks erstellen) - MIT SICHERHEITS-CHECKS
function connectProject(projectPath) {
    const absolutePath = path.resolve(projectPath);
    
    if (!fs.existsSync(absolutePath)) {
        console.error(`${colors.red}❌ Projekt-Pfad existiert nicht: ${absolutePath}${colors.reset}`);
        return;
    }
    
    const projectName = path.basename(absolutePath);
    const projects = loadProjects();
    
    // NEUER NAMESPACE: /tools/context-now/ statt /tools/context-tracker/
    const projectToolsDir = path.join(absolutePath, 'tools', 'context-now');
    const legacyToolsDir = path.join(absolutePath, 'tools', 'context-tracker');
    
    // Prüfe auf existierende context-tracker Installation
    if (fs.existsSync(legacyToolsDir)) {
        console.log(`${colors.yellow}⚠️  Existierendes context-tracker Verzeichnis gefunden${colors.reset}`);
        
        // Prüfe ob es ein Symlink oder echte Dateien sind
        const contextTrackerPath = path.join(legacyToolsDir, 'context-tracker.js');
        if (fs.existsSync(contextTrackerPath)) {
            const stats = fs.lstatSync(contextTrackerPath);
            if (!stats.isSymbolicLink()) {
                console.error(`${colors.red}❌ WARNUNG: Existierende context-tracker Installation gefunden!${colors.reset}`);
                console.error(`${colors.red}   Das Projekt hat bereits eigene context-tracker Dateien.${colors.reset}`);
                console.error(`${colors.yellow}   Context-Now wird einen separaten Namespace verwenden: /tools/context-now/${colors.reset}`);
                
                // Backup erstellen
                const backupDir = path.join(absolutePath, 'tools', 'context-tracker.backup.' + Date.now());
                console.log(`${colors.cyan}📦 Erstelle Backup in: ${backupDir}${colors.reset}`);
                fs.cpSync(legacyToolsDir, backupDir, { recursive: true });
            }
        }
    }
    
    // Projekt in Konfiguration speichern
    projects[projectName] = {
        path: absolutePath,
        connected: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
        namespace: 'context-now' // Speichere verwendeten Namespace
    };
    
    // Context-Now Verzeichnis erstellen
    if (!fs.existsSync(projectToolsDir)) {
        fs.mkdirSync(projectToolsDir, { recursive: true });
        console.log(`${colors.green}✅ Context-Now Verzeichnis erstellt: /tools/context-now/${colors.reset}`);
    }
    
    // Symlink für context-tracker.js erstellen
    const scriptSource = path.join(TOOLS_DIR, 'context-tracker.js');
    const scriptTarget = path.join(projectToolsDir, 'context-tracker.js');
    
    if (fs.existsSync(scriptTarget)) {
        const stats = fs.lstatSync(scriptTarget);
        if (stats.isSymbolicLink()) {
            fs.unlinkSync(scriptTarget);
        } else {
            // Echte Datei gefunden - Backup erstellen
            const backupPath = scriptTarget + '.backup.' + Date.now();
            fs.renameSync(scriptTarget, backupPath);
            console.log(`${colors.yellow}⚠️  Backup erstellt: ${backupPath}${colors.reset}`);
        }
    }
    
    fs.symlinkSync(scriptSource, scriptTarget);
    console.log(`${colors.green}✅ Script verlinkt in /tools/context-now/${colors.reset}`);
    
    // Modules Verzeichnis verlinken (für Dependencies)
    const modulesSource = path.join(TOOLS_DIR, 'modules');
    const modulesTarget = path.join(projectToolsDir, 'modules');
    if (!fs.existsSync(modulesTarget)) {
        fs.symlinkSync(modulesSource, modulesTarget);
        console.log(`${colors.cyan}  → modules/ verlinkt${colors.reset}`);
    }
    
    // Templates verlinken (read-only)
    const templates = ['issues.template.json', 'prs.template.json', 'project-memory.template.json'];
    templates.forEach(template => {
        const templateSource = path.join(TOOLS_DIR, template);
        const templateTarget = path.join(projectToolsDir, template);
        
        if (fs.existsSync(templateTarget) && !fs.lstatSync(templateTarget).isSymbolicLink()) {
            // Backup wenn echte Datei
            const backupPath = templateTarget + '.backup.' + Date.now();
            fs.renameSync(templateTarget, backupPath);
            console.log(`${colors.yellow}  → Backup: ${path.basename(backupPath)}${colors.reset}`);
        }
        
        if (fs.existsSync(templateTarget)) {
            fs.unlinkSync(templateTarget);
        }
        if (fs.existsSync(templateSource)) {
            fs.symlinkSync(templateSource, templateTarget);
            console.log(`${colors.cyan}  → ${template} verlinkt${colors.reset}`);
        }
    });
    
    // Projekt-spezifische JSON-Dateien erstellen (wenn nicht vorhanden)
    const projectFiles = [
        { name: 'issues.json', content: loadTemplateContent('issues.template.json') },
        { name: 'prs.json', content: loadTemplateContent('prs.template.json') },
        { name: 'project-memory.json', content: loadTemplateContent('project-memory.template.json') },
        { name: 'github-branches.json', content: '["main", "develop"]' },
        { name: 'issue-relations.json', content: '{}' }
    ];
    
    projectFiles.forEach(file => {
        const filePath = path.join(projectToolsDir, file.name);
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, file.content);
            console.log(`${colors.green}  → ${file.name} erstellt${colors.reset}`);
        } else {
            console.log(`${colors.dim}  → ${file.name} bereits vorhanden${colors.reset}`);
        }
    });
    
    // Frage ob package.json aktualisiert werden soll
    console.log(`\n${colors.yellow}Möchten Sie NPM Scripts zur package.json hinzufügen?${colors.reset}`);
    console.log(`${colors.dim}Dies fügt folgende Scripts hinzu:${colors.reset}`);
    console.log(`${colors.dim}  - context-now (Status anzeigen)${colors.reset}`);
    console.log(`${colors.dim}  - context-now:sync (Repository synchronisieren)${colors.reset}`);
    console.log(`${colors.dim}  - context-now:update (Sync + Status)${colors.reset}`);
    console.log(`\n${colors.cyan}Führen Sie folgenden Befehl aus, wenn Sie die Scripts hinzufügen möchten:${colors.reset}`);
    console.log(`${colors.bright}  cn --update-scripts ${projectName}${colors.reset}`);
    
    saveProjects(projects);
    
    console.log(`\n${colors.bright}${colors.green}✅ Projekt '${projectName}' erfolgreich verbunden!${colors.reset}`);
    console.log(`${colors.cyan}Pfad: ${absolutePath}${colors.reset}`);
    console.log(`${colors.cyan}Namespace: /tools/context-now/${colors.reset}`);
    console.log(`\n${colors.yellow}Verwendung:${colors.reset}`);
    console.log(`  cd ${absolutePath}`);
    console.log(`  node tools/context-now/context-tracker.js status`);
}

// Template-Inhalt laden
function loadTemplateContent(templateName) {
    const templatePath = path.join(TOOLS_DIR, templateName);
    if (fs.existsSync(templatePath)) {
        return fs.readFileSync(templatePath, 'utf8');
    }
    return '[]';
}

// Package.json aktualisieren (mit neuem Namespace)
function updatePackageJson(projectPath, namespace = 'context-now') {
    const packageJsonPath = path.join(projectPath, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
        console.log(`${colors.yellow}⚠️  Keine package.json gefunden${colors.reset}`);
        return;
    }
    
    try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        if (!packageJson.scripts) {
            packageJson.scripts = {};
        }
        
        // Prüfe auf existierende context Scripts
        const existingContextScripts = Object.keys(packageJson.scripts).filter(script => 
            script.startsWith('context') && !script.startsWith('context-now')
        );
        
        if (existingContextScripts.length > 0) {
            console.log(`${colors.yellow}⚠️  Existierende context Scripts gefunden:${colors.reset}`);
            existingContextScripts.forEach(script => {
                console.log(`${colors.dim}  - ${script}: ${packageJson.scripts[script]}${colors.reset}`);
            });
            console.log(`${colors.cyan}Context-Now wird eigene Scripts mit 'context-now' Prefix verwenden${colors.reset}`);
        }
        
        // Use context-now namespace to avoid conflicts
        const toolPath = `tools/${namespace}/context-tracker.js`;
        packageJson.scripts['context-now'] = `node ${toolPath} status`;
        packageJson.scripts['context-now:sync'] = `node ${toolPath} sync`;
        packageJson.scripts['context-now:update'] = `node ${toolPath} update`;
        packageJson.scripts['context-now:handover'] = `node ${toolPath} handover`;
        
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        console.log(`${colors.green}✅ NPM Scripts zu package.json hinzugefügt (Namespace: ${namespace})${colors.reset}`);
    } catch (e) {
        console.error(`${colors.red}Fehler beim Update der package.json:${colors.reset}`, e.message);
    }
}

// Alle Projekte auflisten
function listProjects() {
    const projects = loadProjects();
    const projectNames = Object.keys(projects);
    
    if (projectNames.length === 0) {
        console.log(`${colors.yellow}Keine Projekte verbunden.${colors.reset}`);
        console.log(`Verwende: ${colors.cyan}context-now -c /pfad/zum/projekt${colors.reset}`);
        return;
    }
    
    console.log(`\n${colors.bright}📋 Verbundene Projekte:${colors.reset}\n`);
    
    projectNames.forEach((name, index) => {
        const project = projects[name];
        const exists = fs.existsSync(project.path);
        const statusIcon = exists ? '✅' : '❌';
        const statusColor = exists ? colors.green : colors.red;
        
        console.log(`${index + 1}. ${statusColor}${statusIcon} ${name}${colors.reset}`);
        console.log(`   ${colors.dim}Pfad: ${project.path}${colors.reset}`);
        console.log(`   ${colors.dim}Verbunden: ${new Date(project.connected).toLocaleDateString()}${colors.reset}`);
        
        if (!exists) {
            console.log(`   ${colors.red}⚠️  Projekt-Pfad existiert nicht mehr!${colors.reset}`);
        }
        console.log('');
    });
}

// In Projekt wechseln
function goToProject(projectName) {
    const projects = loadProjects();
    
    // Wenn Nummer angegeben
    if (/^\d+$/.test(projectName)) {
        const index = parseInt(projectName) - 1;
        const names = Object.keys(projects);
        if (index >= 0 && index < names.length) {
            projectName = names[index];
        }
    }
    
    if (!projects[projectName]) {
        console.error(`${colors.red}❌ Projekt '${projectName}' nicht gefunden${colors.reset}`);
        listProjects();
        return;
    }
    
    const projectPath = projects[projectName].path;
    
    if (!fs.existsSync(projectPath)) {
        console.error(`${colors.red}❌ Projekt-Pfad existiert nicht mehr: ${projectPath}${colors.reset}`);
        return;
    }
    
    // Update last accessed
    projects[projectName].lastAccessed = new Date().toISOString();
    saveProjects(projects);
    
    console.log(`${colors.green}📂 Wechsle zu: ${projectPath}${colors.reset}`);
    console.log(`\n${colors.cyan}cd ${projectPath}${colors.reset}`);
    console.log(`${colors.cyan}npm run context${colors.reset}\n`);
    
    // Versuche direkt zu wechseln (funktioniert nur in manchen Shells)
    try {
        process.chdir(projectPath);
        console.log(`${colors.green}✅ Erfolgreich gewechselt!${colors.reset}`);
    } catch (e) {
        console.log(`${colors.dim}Kopiere die Befehle oben um zum Projekt zu wechseln${colors.reset}`);
    }
}

// Projekt entfernen
function disconnectProject(projectName) {
    const projects = loadProjects();
    
    if (!projects[projectName]) {
        console.error(`${colors.red}❌ Projekt '${projectName}' nicht gefunden${colors.reset}`);
        return;
    }
    
    const projectPath = projects[projectName].path;
    
    // Symlinks entfernen (prüfe beide Namespaces)
    const namespace = projects[projectName].namespace || 'context-tracker';
    const projectToolsDir = path.join(projectPath, 'tools', namespace);
    const legacyToolsDir = path.join(projectPath, 'tools', 'context-tracker');
    
    // Entferne aus dem verwendeten Namespace
    if (fs.existsSync(projectToolsDir)) {
        const symlinks = ['context-tracker.js', 'issues.template.json', 'prs.template.json', 'project-memory.template.json'];
        symlinks.forEach(file => {
            const filePath = path.join(projectToolsDir, file);
            if (fs.existsSync(filePath) && fs.lstatSync(filePath).isSymbolicLink()) {
                fs.unlinkSync(filePath);
            }
        });
        console.log(`${colors.yellow}Symlinks entfernt${colors.reset}`);
    }
    
    delete projects[projectName];
    saveProjects(projects);
    
    console.log(`${colors.green}✅ Projekt '${projectName}' getrennt${colors.reset}`);
}

// Projekt-Status anzeigen
function showProjectStatus(projectName) {
    const projects = loadProjects();
    
    if (!projectName) {
        // Wenn kein Projekt angegeben, aktuelles Verzeichnis prüfen
        const currentDir = process.cwd();
        const currentProjectName = path.basename(currentDir);
        
        if (projects[currentProjectName] && projects[currentProjectName].path === currentDir) {
            projectName = currentProjectName;
        } else {
            console.error(`${colors.red}Kein Projekt angegeben und aktuelles Verzeichnis ist kein verbundenes Projekt${colors.reset}`);
            return;
        }
    }
    
    if (!projects[projectName]) {
        console.error(`${colors.red}❌ Projekt '${projectName}' nicht gefunden${colors.reset}`);
        return;
    }
    
    const projectPath = projects[projectName].path;
    
    // Wechsle ins Projekt und führe context aus (mit korrektem Namespace)
    const namespace = projects[projectName].namespace || 'context-now';
    try {
        const result = execSync(`cd "${projectPath}" && node tools/${namespace}/context-tracker.js status`, {
            encoding: 'utf8',
            stdio: 'inherit'
        });
    } catch (e) {
        console.error(`${colors.red}Fehler beim Ausführen:${colors.reset}`, e.message);
    }
}

// SSH-Key einrichten und verbinden
function setupSSHKey() {
    console.log(`${colors.bright}🔐 SSH-Deploy-Key Einrichtung${colors.reset}\n`);
    
    // Prüfe ob SSH-Keys existieren
    const sshDir = path.join(os.homedir(), '.ssh');
    let foundKeys = [];
    
    console.log(`${colors.cyan}Suche vorhandene SSH-Keys...${colors.reset}`);
    
    // Suche nach allen möglichen SSH-Keys im .ssh Verzeichnis
    if (fs.existsSync(sshDir)) {
        const files = fs.readdirSync(sshDir);
        
        // Suche nach Standard-Keys
        const standardKeys = ['id_rsa', 'id_ed25519', 'id_ecdsa', 'id_dsa'];
        for (const keyFile of standardKeys) {
            const keyPath = path.join(sshDir, keyFile);
            const pubKeyPath = `${keyPath}.pub`;
            if (fs.existsSync(keyPath) && fs.existsSync(pubKeyPath)) {
                foundKeys.push({ name: keyFile, type: 'standard' });
                console.log(`  ${colors.green}✓${colors.reset} ${keyFile} (Standard-Key)`);
            }
        }
        
        // Suche nach Deploy-Keys (alle Dateien die auf _deploy-key enden)
        const deployKeys = files.filter(f => f.endsWith('_deploy-key') && !f.endsWith('.pub'));
        for (const keyFile of deployKeys) {
            const keyPath = path.join(sshDir, keyFile);
            const pubKeyPath = `${keyPath}.pub`;
            if (fs.existsSync(pubKeyPath)) {
                foundKeys.push({ name: keyFile, type: 'deploy' });
                const projectName = keyFile.replace('_deploy-key', '');
                console.log(`  ${colors.green}✓${colors.reset} ${keyFile} (Deploy-Key für: ${colors.bright}${projectName}${colors.reset})`);
            }
        }
        
        // Suche nach anderen Keys (ohne .pub Endung und nicht in den obigen Kategorien)
        const otherKeys = files.filter(f => 
            !f.endsWith('.pub') && 
            !standardKeys.includes(f) && 
            !f.endsWith('_deploy-key') &&
            !['config', 'known_hosts', 'known_hosts.old', 'authorized_keys'].includes(f)
        );
        for (const keyFile of otherKeys) {
            const keyPath = path.join(sshDir, keyFile);
            const pubKeyPath = `${keyPath}.pub`;
            if (fs.existsSync(pubKeyPath)) {
                foundKeys.push({ name: keyFile, type: 'other' });
                console.log(`  ${colors.green}✓${colors.reset} ${keyFile} (Custom-Key)`);
            }
        }
    }
    
    if (foundKeys.length === 0) {
        console.log(`\n${colors.yellow}⚠️  Keine SSH-Keys gefunden!${colors.reset}`);
        console.log(`\n${colors.cyan}SSH-Key erstellen:${colors.reset}`);
        console.log(`  1. Führe aus: ${colors.bright}ssh-keygen -t ed25519 -C "deine-email@example.com"${colors.reset}`);
        console.log(`  2. Folge den Anweisungen (Enter für Standardpfad)`);
        console.log(`\n${colors.cyan}SSH-Key zu GitHub hinzufügen:${colors.reset}`);
        console.log(`  1. Kopiere den Public Key: ${colors.bright}cat ~/.ssh/id_ed25519.pub${colors.reset}`);
        console.log(`  2. Gehe zu: ${colors.blue}https://github.com/settings/keys${colors.reset}`);
        console.log(`  3. Klicke auf "New SSH key"`);
        console.log(`  4. Füge den kopierten Key ein`);
        console.log(`\n${colors.cyan}Nach der Einrichtung:${colors.reset}`);
        console.log(`  Führe erneut aus: ${colors.bright}cn -k${colors.reset}`);
        return;
    }
    
    // Teste SSH-Verbindung zu GitHub
    console.log(`\n${colors.cyan}Teste GitHub SSH-Verbindung...${colors.reset}`);
    
    // Prüfe ob SSH-Config existiert
    const sshConfigPath = path.join(sshDir, 'config');
    let hasSSHConfig = false;
    let configuredHosts = [];
    
    if (fs.existsSync(sshConfigPath)) {
        const configContent = fs.readFileSync(sshConfigPath, 'utf8');
        const hostMatches = configContent.match(/Host\s+(github-[\w-]+)/g);
        if (hostMatches) {
            hasSSHConfig = true;
            configuredHosts = hostMatches.map(h => h.replace('Host ', ''));
            console.log(`  ${colors.green}✓${colors.reset} SSH-Config gefunden mit Hosts:`);
            configuredHosts.forEach(host => {
                console.log(`    - ${colors.bright}${host}${colors.reset}`);
            });
        }
    }
    
    // Teste Verbindung
    let connectionSuccess = false;
    
    // Teste mit Standard github.com
    try {
        const result = execSync('ssh -T git@github.com 2>&1', { encoding: 'utf8' });
        console.log(`  ${colors.green}✓ SSH-Verbindung zu github.com erfolgreich!${colors.reset}`);
        connectionSuccess = true;
    } catch (e) {
        // SSH gibt Exit Code 1 zurück, aber die Nachricht zeigt erfolgreiche Authentifizierung
        if (e.stdout && e.stdout.includes('successfully authenticated')) {
            console.log(`  ${colors.green}✓ SSH-Verbindung zu github.com erfolgreich!${colors.reset}`);
            connectionSuccess = true;
        }
    }
    
    // Teste konfigurierte Hosts
    for (const host of configuredHosts) {
        try {
            const result = execSync(`ssh -T git@${host} 2>&1`, { encoding: 'utf8' });
            console.log(`  ${colors.green}✓ SSH-Verbindung zu ${host} erfolgreich!${colors.reset}`);
            connectionSuccess = true;
        } catch (e) {
            if (e.stdout && e.stdout.includes('successfully authenticated')) {
                console.log(`  ${colors.green}✓ SSH-Verbindung zu ${host} erfolgreich!${colors.reset}`);
                connectionSuccess = true;
            }
        }
    }
    
    if (!connectionSuccess) {
        console.log(`  ${colors.yellow}⚠️  SSH-Verbindung fehlgeschlagen${colors.reset}`);
        console.log(`\n${colors.cyan}Mögliche Lösungen:${colors.reset}`);
        console.log(`  1. SSH-Agent starten: ${colors.bright}eval "$(ssh-agent -s)"${colors.reset}`);
        console.log(`  2. Key hinzufügen: ${colors.bright}ssh-add ~/.ssh/${foundKeys[0].name}${colors.reset}`);
        console.log(`  3. Stelle sicher, dass der Key in GitHub hinterlegt ist`);
        console.log(`     ${colors.blue}https://github.com/settings/keys${colors.reset}`);
        return;
    }
    
    // Information über Git-Konfiguration
    console.log(`\n${colors.green}✅ SSH-Setup erfolgreich!${colors.reset}`);
    
    // Zeige Empfehlungen für SSH-Config
    if (hasSSHConfig && configuredHosts.length > 0) {
        console.log(`\n${colors.cyan}Git Remote URLs für deine Projekte:${colors.reset}`);
        console.log(`  Verwende die konfigurierten Hosts in deinen Remote-URLs:`);
        configuredHosts.forEach(host => {
            const projectName = host.replace('github-', '');
            console.log(`  ${colors.dim}Für ${projectName}:${colors.reset} git@${host}:owner/repo.git`);
        });
    }
    
    console.log(`\n${colors.cyan}Optional: Git global für SSH konfigurieren:${colors.reset}`);
    console.log(`  Für automatische HTTPS→SSH Umleitung:`);
    console.log(`  ${colors.bright}git config --global url."git@github.com:".insteadOf "https://github.com/"${colors.reset}`);
    
    console.log(`\n${colors.cyan}Nächste Schritte:${colors.reset}`);
    console.log(`  1. Verbinde dein Projekt: ${colors.bright}cn -c /pfad/zum/projekt${colors.reset}`);
    console.log(`  2. Prüfe den Status: ${colors.bright}cn -s${colors.reset}`);
}

// Hilfe anzeigen
function showHelp() {
    console.log(`
${colors.bright}🎯 Context-Now - Git Project Context Tracker${colors.reset}

${colors.cyan}Verwendung:${colors.reset}
  cn [OPTION] [ARGUMENT]
  context-now [OPTION] [ARGUMENT]

${colors.cyan}Optionen:${colors.reset}
  ${colors.green}-c, --connect <pfad>${colors.reset}     Projekt verbinden
  ${colors.green}-k, --key${colors.reset}                SSH-Deploy-Key verbinden
  ${colors.green}-l, --list${colors.reset}               Alle Projekte auflisten
  ${colors.green}-g, --go <name|nummer>${colors.reset}   Zu Projekt wechseln
  ${colors.green}-d, --disconnect <name>${colors.reset}  Projekt trennen
  ${colors.green}-s, --status [name]${colors.reset}      Projekt-Status anzeigen
  ${colors.green}--update-scripts <name>${colors.reset}  NPM Scripts zu package.json hinzufügen
  ${colors.green}-h, --help${colors.reset}               Diese Hilfe anzeigen

${colors.cyan}Beispiele:${colors.reset}
  cn -k                                      # SSH-Key einrichten
  cn -c /home/user/mein-projekt             # Projekt verbinden
  cn -l                                      # Projekte auflisten
  cn -g 1                                    # Zu Projekt 1 wechseln
  cn -g mein-projekt                         # Zu Projekt wechseln
  cn -s                                      # Status aktuelles Projekt
  cn -s mein-projekt                         # Status spezifisches Projekt
  cn -d mein-projekt                         # Projekt trennen

${colors.cyan}NPM Scripts (in verbundenen Projekten):${colors.reset}
  npm run context-now                       # Status anzeigen
  npm run context-now:sync                  # Repository synchronisieren  
  npm run context-now:update                # Sync + Status

${colors.yellow}⚠️  Bei privaten Repositories:${colors.reset}
  1. Richte zuerst einen SSH-Key ein: ${colors.bright}cn -k${colors.reset}
  2. Verbinde dann dein Projekt: cn -c /pfad/zum/projekt

${colors.dim}Context-Now verwaltet zentral alle deine Git-Projekt-Kontexte.${colors.reset}
${colors.dim}Dokumentation: https://github.com/GaboCapo/context-now${colors.reset}
`);
}

// CLI Entry Point
const args = process.argv.slice(2);

if (args.length === 0) {
    showHelp();
    process.exit(0);
}

const option = args[0];
const argument = args[1];

switch (option) {
    case '-c':
    case '--connect':
        if (!argument) {
            console.error(`${colors.red}Fehler: Projekt-Pfad erforderlich${colors.reset}`);
            console.log(`Verwendung: context-now -c /pfad/zum/projekt`);
        } else {
            connectProject(argument);
        }
        break;
    
    case '-k':
    case '--key':
        setupSSHKey();
        break;
        
    case '-l':
    case '--list':
        listProjects();
        break;
        
    case '-g':
    case '--go':
        if (!argument) {
            console.error(`${colors.red}Fehler: Projekt-Name oder Nummer erforderlich${colors.reset}`);
        } else {
            goToProject(argument);
        }
        break;
        
    case '-d':
    case '--disconnect':
        if (!argument) {
            console.error(`${colors.red}Fehler: Projekt-Name erforderlich${colors.reset}`);
        } else {
            disconnectProject(argument);
        }
        break;
        
    case '-s':
    case '--status':
        showProjectStatus(argument);
        break;
        
    case '--update-scripts':
        if (!argument) {
            console.error(`${colors.red}Fehler: Projekt-Name erforderlich${colors.reset}`);
            console.log(`Verwendung: context-now --update-scripts <projekt-name>`);
        } else {
            const projects = loadProjects();
            if (!projects[argument]) {
                console.error(`${colors.red}❌ Projekt '${argument}' nicht gefunden${colors.reset}`);
                listProjects();
            } else {
                const namespace = projects[argument].namespace || 'context-now';
                updatePackageJson(projects[argument].path, namespace);
            }
        }
        break;
        
    case '-h':
    case '--help':
        showHelp();
        break;
        
    default:
        console.error(`${colors.red}Unbekannte Option: ${option}${colors.reset}`);
        showHelp();
        break;
}