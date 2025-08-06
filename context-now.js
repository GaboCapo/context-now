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

// Projekt verbinden (symlinks erstellen)
function connectProject(projectPath) {
    const absolutePath = path.resolve(projectPath);
    
    if (!fs.existsSync(absolutePath)) {
        console.error(`${colors.red}❌ Projekt-Pfad existiert nicht: ${absolutePath}${colors.reset}`);
        return;
    }
    
    const projectName = path.basename(absolutePath);
    const projects = loadProjects();
    
    // Projekt in Konfiguration speichern
    projects[projectName] = {
        path: absolutePath,
        connected: new Date().toISOString(),
        lastAccessed: new Date().toISOString()
    };
    
    // Tools-Verzeichnis im Projekt erstellen
    const projectToolsDir = path.join(absolutePath, 'tools', 'context-tracker');
    if (!fs.existsSync(projectToolsDir)) {
        fs.mkdirSync(projectToolsDir, { recursive: true });
        console.log(`${colors.green}✅ Tools-Verzeichnis erstellt${colors.reset}`);
    }
    
    // Symlink für context-tracker.js erstellen
    const scriptSource = path.join(TOOLS_DIR, 'context-tracker.js');
    const scriptTarget = path.join(projectToolsDir, 'context-tracker.js');
    
    if (fs.existsSync(scriptTarget)) {
        fs.unlinkSync(scriptTarget);
    }
    fs.symlinkSync(scriptSource, scriptTarget);
    console.log(`${colors.green}✅ Script verlinkt${colors.reset}`);
    
    // Templates verlinken (read-only)
    const templates = ['issues.template.json', 'prs.template.json', 'project-memory.template.json'];
    templates.forEach(template => {
        const templateSource = path.join(TOOLS_DIR, template);
        const templateTarget = path.join(projectToolsDir, template);
        
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
    
    // Package.json Scripts hinzufügen
    updatePackageJson(absolutePath);
    
    saveProjects(projects);
    
    console.log(`\n${colors.bright}${colors.green}✅ Projekt '${projectName}' erfolgreich verbunden!${colors.reset}`);
    console.log(`${colors.cyan}Pfad: ${absolutePath}${colors.reset}`);
    console.log(`\n${colors.yellow}Verwendung:${colors.reset}`);
    console.log(`  cd ${absolutePath}`);
    console.log(`  npm run context-now`);
}

// Template-Inhalt laden
function loadTemplateContent(templateName) {
    const templatePath = path.join(TOOLS_DIR, templateName);
    if (fs.existsSync(templatePath)) {
        return fs.readFileSync(templatePath, 'utf8');
    }
    return '[]';
}

// Package.json aktualisieren
function updatePackageJson(projectPath) {
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
        
        // Use context-now instead of context to avoid conflicts
        packageJson.scripts['context-now'] = 'node tools/context-tracker/context-tracker.js status';
        packageJson.scripts['context-now:sync'] = 'node tools/context-tracker/context-tracker.js sync';
        packageJson.scripts['context-now:update'] = 'node tools/context-tracker/context-tracker.js update';
        packageJson.scripts['context-now:handover'] = 'node tools/context-tracker/context-tracker.js handover';
        
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        console.log(`${colors.green}✅ NPM Scripts zu package.json hinzugefügt${colors.reset}`); else {
            console.log(`${colors.dim}  → NPM Scripts bereits vorhanden${colors.reset}`);
        }
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
    
    // Symlinks entfernen
    const projectToolsDir = path.join(projectPath, 'tools', 'context-tracker');
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
    
    // Wechsle ins Projekt und führe context aus
    try {
        const result = execSync(`cd "${projectPath}" && node tools/context-tracker/context-tracker.js status`, {
            encoding: 'utf8',
            stdio: 'inherit'
        });
    } catch (e) {
        console.error(`${colors.red}Fehler beim Ausführen:${colors.reset}`, e.message);
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
  ${colors.green}-l, --list${colors.reset}               Alle Projekte auflisten
  ${colors.green}-g, --go <name|nummer>${colors.reset}   Zu Projekt wechseln
  ${colors.green}-d, --disconnect <name>${colors.reset}  Projekt trennen
  ${colors.green}-s, --status [name]${colors.reset}      Projekt-Status anzeigen
  ${colors.green}-h, --help${colors.reset}               Diese Hilfe anzeigen

${colors.cyan}Beispiele:${colors.reset}
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
        
    case '-h':
    case '--help':
        showHelp();
        break;
        
    default:
        console.error(`${colors.red}Unbekannte Option: ${option}${colors.reset}`);
        showHelp();
        break;
}