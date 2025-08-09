#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// Zentrale Konfiguration - nutze Installations-Verzeichnis ODER Source-Verzeichnis
const INSTALL_DIR = path.join(os.homedir(), '.context-now');
const SOURCE_DIR = __dirname;  // Verzeichnis wo dieses Script liegt

// Prüfe ob wir aus Installation oder Source laufen
const isInstalled = fs.existsSync(INSTALL_DIR) && __dirname.includes('.context-now');
const CONTEXT_NOW_DIR = isInstalled ? INSTALL_DIR : SOURCE_DIR;

// Config immer im Installations-Verzeichnis (falls vorhanden) oder Source
const CONFIG_DIR = fs.existsSync(path.join(os.homedir(), '.config', 'context-now')) 
    ? path.join(os.homedir(), '.config', 'context-now')
    : CONTEXT_NOW_DIR;
const CONFIG_FILE = path.join(CONFIG_DIR, 'projects.json');
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

// Hilfsfunktion: Füge Context-Now zu .gitignore hinzu
function updateProjectGitignore(projectPath) {
    const gitignorePath = path.join(projectPath, '.gitignore');
    const entriesToAdd = [
        '',
        '# Context-Now (auto-generated - do not remove)',
        'context-now/',
        'context-now-logs/',
        'tools/context-now/*.json',
        '!tools/context-now/*.template.json',
        'tools/context-now/*.json',
        '!tools/context-now/*.template.json',
        '',
        '# Prevent accidental context-now repository commits',
        '.context-now/',
        'context-now/.git/',
        'tools/context-now/.git/',
        ''
    ];
    
    // Lese existierende .gitignore oder erstelle neue
    let gitignoreContent = '';
    let hasContextNowSection = false;
    
    if (fs.existsSync(gitignorePath)) {
        gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
        hasContextNowSection = gitignoreContent.includes('# Context-Now (auto-generated');
    }
    
    if (!hasContextNowSection) {
        // Füge Context-Now Sektion hinzu
        const newContent = gitignoreContent + 
            (gitignoreContent && !gitignoreContent.endsWith('\n') ? '\n' : '') +
            entriesToAdd.join('\n');
        
        fs.writeFileSync(gitignorePath, newContent);
        console.log(`${colors.green}✅ .gitignore aktualisiert mit Context-Now Einträgen${colors.reset}`);
        return true;
    }
    
    return false;
}

// Hilfsfunktion: Bereinige potenzielle Git-Probleme
function cleanupGitIssues(projectPath) {
    try {
        // Prüfe ob context-now bereits im Git-Index ist
        const gitStatus = execSync('git status --porcelain', { 
            cwd: projectPath, 
            encoding: 'utf8',
            stdio: 'pipe'
        });
        
        // Suche nach context-now im Git-Status
        if (gitStatus.includes('context-now/') || gitStatus.includes('tools/context-now/')) {
            console.log(`${colors.yellow}⚠️  Context-Now Dateien im Git-Index gefunden${colors.reset}`);
            
            // Entferne aus Git-Cache
            try {
                execSync('git rm --cached -rf context-now 2>/dev/null', { 
                    cwd: projectPath,
                    stdio: 'pipe'
                });
                console.log(`${colors.green}✅ context-now/ aus Git-Cache entfernt${colors.reset}`);
            } catch (e) {
                // Ignoriere Fehler wenn Dateien nicht existieren
            }
            
            try {
                execSync('git rm --cached -rf tools/context-now 2>/dev/null', { 
                    cwd: projectPath,
                    stdio: 'pipe' 
                });
                console.log(`${colors.green}✅ tools/context-now/ aus Git-Cache entfernt${colors.reset}`);
            } catch (e) {
                // Ignoriere Fehler wenn Dateien nicht existieren
            }
            
            try {
                execSync('git rm --cached -rf tools/context-now 2>/dev/null', { 
                    cwd: projectPath,
                    stdio: 'pipe'
                });
                console.log(`${colors.green}✅ tools/context-now/ aus Git-Cache entfernt${colors.reset}`);
            } catch (e) {
                // Ignoriere Fehler wenn Dateien nicht existieren
            }
        }
    } catch (e) {
        // Projekt ist möglicherweise kein Git-Repository
        // Das ist OK - kein Fehler
    }
}

// Projekt verbinden (symlinks erstellen) - MIT SICHERHEITS-CHECKS
function connectProject(projectPath) {
    const absolutePath = path.resolve(projectPath);
    
    if (!fs.existsSync(absolutePath)) {
        console.error(`${colors.red}❌ Projekt-Pfad existiert nicht: ${absolutePath}${colors.reset}`);
        return;
    }
    
    // KRITISCH: Prüfe ob context-now INNERHALB des Zielprojekts geklont wurde
    const contextNowInProject = path.join(absolutePath, 'context-now');
    if (fs.existsSync(contextNowInProject) && fs.existsSync(path.join(contextNowInProject, '.git'))) {
        console.error(`${colors.red}❌ WARNUNG: Context-Now Repository innerhalb des Projekts gefunden!${colors.reset}`);
        console.error(`${colors.red}   Dies verursacht Git-Submodule-Probleme.${colors.reset}`);
        console.log(`${colors.yellow}   Lösung: Context-Now sollte außerhalb des Projekts installiert werden.${colors.reset}`);
        console.log(`${colors.cyan}   Empfehlung: Verschiebe context-now nach ~/Code/context-now${colors.reset}`);
        
        // Biete automatische Bereinigung an
        console.log(`\n${colors.yellow}🔧 Automatische Bereinigung wird durchgeführt...${colors.reset}`);
        
        // Entferne .git Verzeichnis aus context-now im Projekt
        const gitDir = path.join(contextNowInProject, '.git');
        if (fs.existsSync(gitDir)) {
            fs.rmSync(gitDir, { recursive: true, force: true });
            console.log(`${colors.green}✅ .git Verzeichnis aus context-now/ entfernt${colors.reset}`);
        }
    }
    
    const projectName = path.basename(absolutePath);
    const projects = loadProjects();
    
    // Aktualisiere .gitignore BEVOR wir Dateien erstellen
    const gitignoreUpdated = updateProjectGitignore(absolutePath);
    
    // Bereinige potenzielle Git-Probleme
    cleanupGitIssues(absolutePath);
    
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
            // Prüfe ob Symlink bereits auf die richtige Quelle zeigt
            const currentTarget = fs.readlinkSync(scriptTarget);
            if (currentTarget === scriptSource) {
                console.log(`${colors.cyan}✓ Script bereits korrekt verlinkt${colors.reset}`);
            } else {
                fs.unlinkSync(scriptTarget);
                fs.symlinkSync(scriptSource, scriptTarget);
                console.log(`${colors.green}✅ Script-Link aktualisiert${colors.reset}`);
            }
        } else {
            // Echte Datei gefunden - Backup erstellen
            const backupPath = scriptTarget + '.backup.' + Date.now();
            fs.renameSync(scriptTarget, backupPath);
            console.log(`${colors.yellow}⚠️  Backup erstellt: ${backupPath}${colors.reset}`);
            fs.symlinkSync(scriptSource, scriptTarget);
            console.log(`${colors.green}✅ Script verlinkt in /tools/context-now/${colors.reset}`);
        }
    } else {
        fs.symlinkSync(scriptSource, scriptTarget);
        console.log(`${colors.green}✅ Script verlinkt in /tools/context-now/${colors.reset}`);
    }
    
    // Modules Verzeichnis verlinken (für Dependencies)
    const modulesSource = path.join(TOOLS_DIR, 'modules');
    const modulesTarget = path.join(projectToolsDir, 'modules');
    if (!fs.existsSync(modulesTarget)) {
        fs.symlinkSync(modulesSource, modulesTarget);
        console.log(`${colors.cyan}  → modules/ verlinkt${colors.reset}`);
    } else if (fs.lstatSync(modulesTarget).isSymbolicLink()) {
        const currentTarget = fs.readlinkSync(modulesTarget);
        if (currentTarget === modulesSource) {
            console.log(`${colors.cyan}  → modules/ bereits korrekt verlinkt${colors.reset}`);
        } else {
            fs.unlinkSync(modulesTarget);
            fs.symlinkSync(modulesSource, modulesTarget);
            console.log(`${colors.cyan}  → modules/ Link aktualisiert${colors.reset}`);
        }
    }
    
    // Templates verlinken (read-only)
    const templates = ['issues.template.json', 'prs.template.json', 'project-memory.template.json'];
    templates.forEach(template => {
        const templateSource = path.join(TOOLS_DIR, template);
        const templateTarget = path.join(projectToolsDir, template);
        
        if (!fs.existsSync(templateSource)) {
            return; // Skip wenn Template nicht existiert
        }
        
        if (fs.existsSync(templateTarget)) {
            const stats = fs.lstatSync(templateTarget);
            if (stats.isSymbolicLink()) {
                const currentTarget = fs.readlinkSync(templateTarget);
                if (currentTarget === templateSource) {
                    console.log(`${colors.cyan}  → ${template} bereits korrekt verlinkt${colors.reset}`);
                    return;
                }
                fs.unlinkSync(templateTarget);
            } else {
                // Backup wenn echte Datei
                const backupPath = templateTarget + '.backup.' + Date.now();
                fs.renameSync(templateTarget, backupPath);
                console.log(`${colors.yellow}  → Backup: ${path.basename(backupPath)}${colors.reset}`);
            }
        }
        
        fs.symlinkSync(templateSource, templateTarget);
        console.log(`${colors.cyan}  → ${template} verlinkt${colors.reset}`);
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

// Run doctor command
function runDoctorCommand() {
    try {
        const runDoctor = require('./lib/commands/doctor');
        runDoctor({ verbose: false });
    } catch (e) {
        console.error(`${colors.red}Fehler beim Ausführen der Diagnose:${colors.reset}`, e.message);
    }
}

// Show storage information
function showStorageInfo() {
    const projects = loadProjects();
    const storage = require('./lib/commands/storage');
    
    console.log(`${colors.bright}${colors.cyan}📦 Storage-Konfiguration${colors.reset}\n`);
    
    if (Object.keys(projects).length === 0) {
        console.log(`${colors.yellow}Keine Projekte verbunden${colors.reset}`);
        return;
    }
    
    for (const [name, project] of Object.entries(projects)) {
        const mode = storage.getStorageMode(name, project.path);
        const dataDir = storage.getDataDirectory(name, project.path, mode);
        
        console.log(`${colors.green}${name}${colors.reset}`);
        console.log(`  Modus: ${mode}`);
        
        if (typeof dataDir === 'string') {
            console.log(`  Verzeichnis: ${dataDir}`);
        } else {
            console.log(`  Config: ${dataDir.config}`);
            console.log(`  Runtime: ${dataDir.runtime}`);
        }
        console.log('');
    }
    
    console.log(`${colors.dim}Verfügbare Modi:${colors.reset}`);
    console.log(`  ${colors.green}embedded${colors.reset} - Dateien im Projekt (mit Symlinks)`);
    console.log(`  ${colors.green}local${colors.reset} - Alle Dateien in ~/.config/context-now`);
    console.log(`  ${colors.green}hybrid${colors.reset} - Config lokal, Cache im Projekt`);
    console.log('');
    console.log(`${colors.dim}Modus ändern: cn --storage <modus> <projekt>${colors.reset}`);
}

// Set storage mode for current project
function setStorageMode(mode) {
    const projects = loadProjects();
    const currentDir = process.cwd();
    
    // Find current project
    let currentProject = null;
    for (const [name, data] of Object.entries(projects)) {
        if (data.path === currentDir) {
            currentProject = name;
            break;
        }
    }
    
    if (!currentProject) {
        console.error(`${colors.red}Kein Projekt im aktuellen Verzeichnis gefunden${colors.reset}`);
        return;
    }
    
    const storage = require('./lib/commands/storage');
    
    try {
        const currentMode = storage.getStorageMode(currentProject, currentDir);
        
        if (currentMode === mode) {
            console.log(`${colors.yellow}Projekt '${currentProject}' verwendet bereits Modus '${mode}'${colors.reset}`);
            return;
        }
        
        console.log(`${colors.cyan}Ändere Storage-Modus für '${currentProject}' von '${currentMode}' zu '${mode}'...${colors.reset}`);
        
        // Migrate if necessary
        storage.migrateStorage(currentProject, currentMode, mode).then(() => {
            console.log(`${colors.green}✅ Storage-Modus erfolgreich geändert!${colors.reset}`);
        }).catch(err => {
            console.error(`${colors.red}Fehler bei der Migration:${colors.reset}`, err.message);
        });
        
    } catch (e) {
        console.error(`${colors.red}Fehler:${colors.reset}`, e.message);
    }
}

// Migrate project storage
function migrateProjectStorage(projectName) {
    const projects = loadProjects();
    
    if (!projectName) {
        console.error(`${colors.red}Projekt-Name erforderlich${colors.reset}`);
        console.log(`Verwendung: cn --migrate-storage <projekt-name>`);
        return;
    }
    
    if (!projects[projectName]) {
        console.error(`${colors.red}Projekt '${projectName}' nicht gefunden${colors.reset}`);
        listProjects();
        return;
    }
    
    const storage = require('./lib/commands/storage');
    const project = projects[projectName];
    const currentMode = storage.getStorageMode(projectName, project.path);
    
    console.log(`${colors.cyan}Aktueller Modus für '${projectName}': ${currentMode}${colors.reset}`);
    console.log(`Wählen Sie den Ziel-Modus:`);
    console.log(`  1) local - Alle Dateien in ~/.config/context-now`);
    console.log(`  2) embedded - Dateien im Projekt`);
    console.log(`  3) hybrid - Config lokal, Cache im Projekt`);
    
    // In a real implementation, this would be interactive
    console.log(`${colors.yellow}Verwenden Sie: cn --storage <modus>${colors.reset}`);
}

// Run stats command for large repositories
function runStatsCommand(projectName) {
    const projects = loadProjects();
    const performance = require('./lib/commands/performance');
    
    // Determine which project to use
    let targetProject = null;
    let targetPath = null;
    
    if (projectName) {
        if (projects[projectName]) {
            targetProject = projectName;
            targetPath = projects[projectName].path;
        } else {
            console.error(`${colors.red}❌ Projekt '${projectName}' nicht gefunden${colors.reset}`);
            return;
        }
    } else {
        const currentDir = process.cwd();
        for (const [name, data] of Object.entries(projects)) {
            if (data.path === currentDir) {
                targetProject = name;
                targetPath = data.path;
                break;
            }
        }
        
        if (!targetProject) {
            console.error(`${colors.red}❌ Kein Projekt im aktuellen Verzeichnis${colors.reset}`);
            return;
        }
    }
    
    console.log(`${colors.cyan}📊 Generating statistics for ${targetProject}...${colors.reset}\n`);
    
    try {
        // Load project data
        const namespace = projects[targetProject].namespace || 'context-now';
        const dataPath = path.join(targetPath, 'tools', namespace);
        
        let issues = [];
        let prs = [];
        let branches = [];
        
        // Try to load JSON files
        const issuesFile = path.join(dataPath, 'issues.json');
        const prsFile = path.join(dataPath, 'prs.json');
        const branchesFile = path.join(dataPath, 'github-branches.json');
        
        if (fs.existsSync(issuesFile)) {
            issues = JSON.parse(fs.readFileSync(issuesFile, 'utf8'));
        }
        if (fs.existsSync(prsFile)) {
            prs = JSON.parse(fs.readFileSync(prsFile, 'utf8'));
        }
        if (fs.existsSync(branchesFile)) {
            branches = JSON.parse(fs.readFileSync(branchesFile, 'utf8'));
        }
        
        // Check performance
        const analysis = performance.analyzeRepositoryScale(issues, prs, branches);
        
        // Show performance warnings
        if (analysis.requiresOptimization) {
            console.log(analysis.recommendations);
            console.log('');
        }
        
        // Generate statistics
        if (issues.length > 0) {
            console.log(performance.generateStats(issues, 'issues'));
            console.log('');
        }
        
        if (prs.length > 0) {
            console.log(performance.generateStats(prs, 'pull requests'));
            console.log('');
        }
        
        // Summary
        console.log(`${colors.bright}Overall Repository Scale${colors.reset}`);
        console.log('─'.repeat(50));
        console.log(`Issues: ${analysis.scale.issues.message}`);
        console.log(`PRs: ${analysis.scale.prs.message}`);
        console.log(`Branches: ${analysis.scale.branches.message}`);
        
    } catch (e) {
        console.error(`${colors.red}Error generating statistics:${colors.reset}`, e.message);
    }
}

// Run performance test
function runPerformanceTest(repoName) {
    const performance = require('./lib/commands/performance');
    
    if (!repoName) {
        console.log(`${colors.cyan}📊 Known Large Repositories for Testing:${colors.reset}\n`);
        
        Object.entries(performance.EXAMPLE_REPOS).forEach(([key, repo]) => {
            console.log(`${colors.green}${key}${colors.reset}`);
            console.log(`  ${repo.name} - ${repo.issues}`);
            console.log(`  Complexity: ${repo.complexity}`);
            console.log('');
        });
        
        console.log(`${colors.dim}Usage: cn performance-test <repo-name>${colors.reset}`);
        return;
    }
    
    // Generate example analysis
    console.log(performance.generateExampleAnalysis(repoName));
}

// Run structure command
function runStructureCommand(projectName) {
    const projects = loadProjects();
    
    // Determine which project to use
    let targetProject = null;
    let targetPath = null;
    
    if (projectName) {
        // Specific project requested
        if (projects[projectName]) {
            targetProject = projectName;
            targetPath = projects[projectName].path;
        } else {
            console.error(`${colors.red}❌ Projekt '${projectName}' nicht gefunden${colors.reset}`);
            listProjects();
            return;
        }
    } else {
        // Try to find current project
        const currentDir = process.cwd();
        for (const [name, data] of Object.entries(projects)) {
            if (data.path === currentDir) {
                targetProject = name;
                targetPath = data.path;
                break;
            }
        }
        
        if (!targetProject) {
            // No project in current dir, use current dir directly
            targetPath = currentDir;
            console.log(`${colors.cyan}📂 Analysiere aktuelles Verzeichnis...${colors.reset}`);
        } else {
            console.log(`${colors.cyan}🎯 Projekt: ${targetProject}${colors.reset}`);
        }
    }
    
    console.log(`${colors.dim}Pfad: ${targetPath}${colors.reset}\n`);
    
    try {
        const generateProjectStructure = require('./lib/commands/structure');
        generateProjectStructure(targetPath, {
            maxLevel: 4,
            format: 'narrative',
            output: 'console'
        });
    } catch (e) {
        console.error(`${colors.red}Fehler beim Generieren der Struktur:${colors.reset}`, e.message);
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

// Focused commands runner
function runFocusedCommand(command, projectName) {
    const projects = loadProjects();
    
    // Determine which project to use
    let targetProject = null;
    let targetPath = null;
    
    if (projectName) {
        // Specific project requested
        if (projects[projectName]) {
            targetProject = projectName;
            targetPath = projects[projectName].path;
        } else {
            console.error(`${colors.red}❌ Projekt '${projectName}' nicht gefunden${colors.reset}`);
            listProjects();
            return;
        }
    } else {
        // Try to find current project
        const currentDir = process.cwd();
        for (const [name, data] of Object.entries(projects)) {
            if (data.path === currentDir) {
                targetProject = name;
                targetPath = data.path;
                break;
            }
        }
        
        if (!targetProject) {
            console.error(`${colors.red}❌ Kein Projekt im aktuellen Verzeichnis gefunden${colors.reset}`);
            console.log(`${colors.yellow}Verwende: cn ${command} <projekt-name>${colors.reset}`);
            listProjects();
            return;
        }
    }
    
    // Get the namespace for this project
    const namespace = projects[targetProject].namespace || 'context-now';
    const trackerPath = path.join(targetPath, 'tools', namespace, 'context-tracker.js');
    
    if (!fs.existsSync(trackerPath)) {
        console.error(`${colors.red}❌ Context-Tracker nicht gefunden für '${targetProject}'${colors.reset}`);
        console.log(`${colors.yellow}Pfad: ${trackerPath}${colors.reset}`);
        return;
    }
    
    // Execute the command with the context-tracker
    console.log(`${colors.cyan}🎯 Projekt: ${targetProject}${colors.reset}`);
    console.log(`${colors.dim}Pfad: ${targetPath}${colors.reset}\n`);
    
    try {
        const { execSync } = require('child_process');
        execSync(`node "${trackerPath}" ${command}`, { 
            stdio: 'inherit',
            cwd: targetPath
        });
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error(`${colors.red}❌ Node.js nicht gefunden${colors.reset}`);
        } else if (error.status !== null) {
            // Command executed but returned non-zero exit code
            process.exit(error.status);
        }
    }
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
  ${colors.green}--storage [mode]${colors.reset}         Storage-Modus anzeigen/ändern
  ${colors.green}--migrate-storage <name>${colors.reset} Projekt-Storage migrieren
  ${colors.green}-h, --help${colors.reset}               Diese Hilfe anzeigen

${colors.cyan}Fokussierte Ansichten:${colors.reset}
  ${colors.green}branches [name]${colors.reset}          Alle Branches anzeigen (ohne Kürzung)
  ${colors.green}issues [name]${colors.reset}            Alle Issues anzeigen (ohne Kürzung)
  ${colors.green}prs [name]${colors.reset}               Alle Pull Requests anzeigen
  ${colors.green}relations [name]${colors.reset}         Issue-Beziehungen anzeigen
  ${colors.green}critical [name]${colors.reset}          Nur kritische Issues anzeigen
  ${colors.green}structure [name]${colors.reset}         Projektstruktur als narrative Beschreibung
  ${colors.green}doctor${colors.reset}                   Diagnose der Installation und Konfiguration
  ${colors.green}stats [name]${colors.reset}             Statistiken für große Repositories
  ${colors.green}performance-test [repo]${colors.reset}  Performance-Test für Repository

${colors.cyan}Beispiele:${colors.reset}
  cn -k                                      # SSH-Key einrichten
  cn -c /home/user/mein-projekt             # Projekt verbinden
  cn -l                                      # Projekte auflisten
  cn -g 1                                    # Zu Projekt 1 wechseln
  cn -g mein-projekt                         # Zu Projekt wechseln
  cn -s                                      # Status aktuelles Projekt
  cn -s mein-projekt                         # Status spezifisches Projekt
  cn -d mein-projekt                         # Projekt trennen
  
  cn branches                                # Alle Branches (aktuelles Projekt)
  cn issues mein-projekt                     # Alle Issues eines Projekts
  cn critical                                # Nur kritische Issues anzeigen

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
        
    case 'branches':
    case 'issues':
    case 'prs':
    case 'relations':
    case 'critical':
        runFocusedCommand(option, argument);
        break;
        
    case 'structure':
        runStructureCommand(argument);
        break;
        
    case 'doctor':
    case '--doctor':
        runDoctorCommand();
        break;
        
    case 'stats':
        runStatsCommand(argument);
        break;
        
    case 'performance-test':
        runPerformanceTest(argument);
        break;
        
    case '--storage':
        if (!argument) {
            showStorageInfo();
        } else if (argument === 'local' || argument === 'embedded' || argument === 'hybrid') {
            setStorageMode(argument);
        } else {
            console.error(`${colors.red}Ungültiger Storage-Modus: ${argument}${colors.reset}`);
            console.log(`Verfügbare Modi: local, embedded, hybrid`);
        }
        break;
        
    case '--migrate-storage':
        migrateProjectStorage(argument);
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