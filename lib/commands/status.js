/**
 * Status Command
 * =============
 * Sicherer Status-Command mit Input-Validation
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { safeGit, safeGH, safeJSON, safePath } = require('../security/safe-exec');

// ANSI Colors
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

/**
 * Zeigt den Status eines Projekts
 * @param {string} projectName - Optional: Projektname
 * @returns {Promise<Object>} Status-Objekt
 */
async function status(projectName = null) {
    try {
        // Lade Projekte sicher
        const projectsFile = safePath('projects.json', path.dirname(__dirname));
        
        if (!fs.existsSync(projectsFile)) {
            console.log(`${colors.yellow}Keine Projekte verbunden.${colors.reset}`);
            console.log(`Verwende: ${colors.cyan}cn -c /pfad/zum/projekt${colors.reset}`);
            return { success: false, message: 'No projects connected' };
        }
        
        const projects = safeJSON(fs.readFileSync(projectsFile, 'utf8'));
        
        // Bestimme Zielprojekt
        let targetProject = null;
        let targetPath = null;
        
        if (projectName) {
            // Validiere Projektname (verhindert Injection)
            if (!/^[a-zA-Z0-9\-_]+$/.test(projectName)) {
                throw new Error('Invalid project name');
            }
            
            if (!projects[projectName]) {
                throw new Error(`Project not found: ${projectName}`);
            }
            
            targetProject = projectName;
            targetPath = projects[projectName].path;
        } else {
            // Versuche aktuelles Verzeichnis
            const currentDir = process.cwd();
            
            for (const [name, data] of Object.entries(projects)) {
                if (data.path === currentDir) {
                    targetProject = name;
                    targetPath = currentDir;
                    break;
                }
            }
            
            if (!targetProject) {
                // Zeige erstes Projekt
                const firstProject = Object.keys(projects)[0];
                if (firstProject) {
                    targetProject = firstProject;
                    targetPath = projects[firstProject].path;
                }
            }
        }
        
        if (!targetProject) {
            console.log(`${colors.yellow}Kein Projekt gefunden.${colors.reset}`);
            return { success: false, message: 'No project found' };
        }
        
        console.log(`${colors.cyan}🎯 Projekt: ${targetProject}${colors.reset}`);
        console.log(`${colors.dim}Pfad: ${targetPath}${colors.reset}\n`);
        
        // Git Status sicher abrufen
        const gitStatus = await getGitStatus(targetPath);
        const branches = await getBranches(targetPath);
        const issues = await getIssues(targetPath, targetProject);
        
        // Zeige Status
        console.log(`${colors.bright}📊 Projektübersicht:${colors.reset}`);
        console.log(`- 🌿 Branch: ${colors.green}${gitStatus.branch}${colors.reset}`);
        console.log(`- 📝 ${gitStatus.modified} geänderte Dateien`);
        console.log(`- 🌳 ${branches.local.length} lokale Branches`);
        console.log(`- 📋 ${issues.open} offene Issues`);
        
        return {
            success: true,
            project: targetProject,
            status: {
                branch: gitStatus.branch,
                modified: gitStatus.modified,
                branches: branches.local.length,
                issues: issues.open
            }
        };
        
    } catch (error) {
        console.error(`${colors.red}Fehler: ${error.message}${colors.reset}`);
        return { success: false, error: error.message };
    }
}

/**
 * Git Status sicher abrufen
 */
async function getGitStatus(projectPath) {
    try {
        // Wechsle sicher ins Projektverzeichnis
        const originalDir = process.cwd();
        process.chdir(projectPath);
        
        // Sichere Git-Commands ohne Shell
        const branch = safeGit(['branch', '--show-current']);
        const status = safeGit(['status', '--porcelain']);
        
        // Zurück zum Original-Verzeichnis
        process.chdir(originalDir);
        
        const modifiedFiles = status ? status.split('\n').length : 0;
        
        return {
            branch: branch || 'main',
            modified: modifiedFiles,
            clean: modifiedFiles === 0
        };
    } catch (error) {
        return {
            branch: 'unknown',
            modified: 0,
            clean: true
        };
    }
}

/**
 * Branches sicher abrufen
 */
async function getBranches(projectPath) {
    try {
        const originalDir = process.cwd();
        process.chdir(projectPath);
        
        // Sichere Git-Commands
        const localBranches = safeGit(['branch', '--format=%(refname:short)']);
        const remoteBranches = safeGit(['branch', '-r', '--format=%(refname:short)']);
        
        process.chdir(originalDir);
        
        return {
            local: localBranches ? localBranches.split('\n').filter(b => b) : [],
            remote: remoteBranches ? remoteBranches.split('\n').filter(b => b) : []
        };
    } catch (error) {
        return { local: [], remote: [] };
    }
}

/**
 * Issues sicher abrufen
 */
async function getIssues(projectPath, projectName) {
    try {
        // Lade Issues aus sicherer JSON-Datei
        const namespace = projects[projectName]?.namespace || 'context-now';
        const issuesFile = safePath(
            path.join(projectPath, 'tools', namespace, 'issues.json'),
            projectPath
        );
        
        if (fs.existsSync(issuesFile)) {
            const issues = safeJSON(fs.readFileSync(issuesFile, 'utf8'));
            const openIssues = issues.filter(i => i.state === 'open' || i.status === 'open');
            
            return {
                total: issues.length,
                open: openIssues.length
            };
        }
        
        return { total: 0, open: 0 };
    } catch (error) {
        return { total: 0, open: 0 };
    }
}

module.exports = status;