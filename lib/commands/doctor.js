/**
 * Context-Now Doctor
 * ==================
 * Diagnostic tool for checking Context-Now configuration,
 * file locations, and health status
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

// Color codes for terminal output
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

// Icons for status
const icons = {
    success: '✅',
    warning: '⚠️',
    error: '❌',
    info: 'ℹ️',
    folder: '📁',
    file: '📄',
    config: '⚙️',
    memory: '🧠',
    project: '📦',
    symlink: '🔗',
    local: '💾',
    global: '🌍'
};

/**
 * Check if path exists and get stats
 */
function checkPath(filepath) {
    try {
        if (!fs.existsSync(filepath)) {
            return { exists: false };
        }
        
        const stats = fs.lstatSync(filepath);
        const realPath = stats.isSymbolicLink() ? fs.realpathSync(filepath) : filepath;
        
        return {
            exists: true,
            isDirectory: stats.isDirectory(),
            isFile: stats.isFile(),
            isSymlink: stats.isSymbolicLink(),
            size: stats.size,
            modified: stats.mtime,
            realPath: realPath,
            permissions: (stats.mode & parseInt('777', 8)).toString(8)
        };
    } catch (error) {
        return {
            exists: false,
            error: error.message
        };
    }
}

/**
 * Format file size
 */
function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check Git repository status
 */
function checkGitStatus(projectPath) {
    try {
        const result = execFileSync('git', ['status', '--porcelain'], {
            cwd: projectPath,
            encoding: 'utf8'
        });
        
        const branch = execFileSync('git', ['branch', '--show-current'], {
            cwd: projectPath,
            encoding: 'utf8'
        }).trim();
        
        return {
            isGitRepo: true,
            branch: branch,
            hasChanges: result.length > 0,
            changes: result.split('\n').filter(l => l).length
        };
    } catch (error) {
        return {
            isGitRepo: false,
            error: error.message
        };
    }
}

/**
 * Analyze Context-Now installation
 */
function analyzeInstallation() {
    const analysis = {
        installation: {},
        configuration: {},
        storage: {},
        projects: []
    };
    
    // Check installation locations
    const installPaths = {
        homeInstall: path.join(os.homedir(), '.context-now'),
        configDir: path.join(os.homedir(), '.config', 'context-now'),
        npmGlobal: execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim(),
        currentDir: process.cwd()
    };
    
    // Check main installation
    console.log(`\n${colors.bright}${icons.folder} Installation Locations${colors.reset}`);
    console.log('─'.repeat(50));
    
    // Home installation
    const homeCheck = checkPath(installPaths.homeInstall);
    if (homeCheck.exists) {
        console.log(`${icons.success} Home Installation: ${colors.green}${installPaths.homeInstall}${colors.reset}`);
        analysis.installation.home = installPaths.homeInstall;
    } else {
        console.log(`${icons.info} Home Installation: ${colors.dim}Not found${colors.reset}`);
    }
    
    // Config directory
    const configCheck = checkPath(installPaths.configDir);
    if (configCheck.exists) {
        console.log(`${icons.success} Config Directory: ${colors.green}${installPaths.configDir}${colors.reset}`);
        analysis.configuration.dir = installPaths.configDir;
        
        // Check for projects.json
        const projectsFile = path.join(installPaths.configDir, 'projects.json');
        const projectsCheck = checkPath(projectsFile);
        if (projectsCheck.exists) {
            const projects = JSON.parse(fs.readFileSync(projectsFile, 'utf8'));
            const projectCount = Object.keys(projects).length;
            console.log(`  ${icons.file} projects.json: ${projectCount} projects (${formatSize(projectsCheck.size)})`);
            analysis.configuration.projectsFile = projectsFile;
            analysis.configuration.projectCount = projectCount;
            analysis.projects = projects;
        }
    } else {
        console.log(`${icons.warning} Config Directory: ${colors.yellow}Not found${colors.reset}`);
    }
    
    // NPM global installation
    const npmPackage = path.join(installPaths.npmGlobal, '@gabocapo', 'context-now');
    const npmCheck = checkPath(npmPackage);
    if (npmCheck.exists) {
        console.log(`${icons.success} NPM Global: ${colors.green}${npmPackage}${colors.reset}`);
        analysis.installation.npm = npmPackage;
    } else {
        console.log(`${icons.info} NPM Global: ${colors.dim}Not installed${colors.reset}`);
    }
    
    // Check executables
    console.log(`\n${colors.bright}${icons.config} Executables${colors.reset}`);
    console.log('─'.repeat(50));
    
    const binPaths = [
        path.join(os.homedir(), '.local', 'bin', 'cn'),
        path.join(os.homedir(), '.local', 'bin', 'context'),
        path.join(os.homedir(), '.local', 'bin', 'kontext'),
        '/usr/local/bin/cn',
        '/usr/bin/cn'
    ];
    
    let foundExecutable = false;
    for (const binPath of binPaths) {
        const binCheck = checkPath(binPath);
        if (binCheck.exists) {
            foundExecutable = true;
            const type = binCheck.isSymlink ? `${icons.symlink} Symlink → ${binCheck.realPath}` : `${icons.file} File`;
            console.log(`${icons.success} ${path.basename(binPath)}: ${colors.green}${binPath}${colors.reset}`);
            console.log(`  ${type}`);
        }
    }
    
    if (!foundExecutable) {
        console.log(`${icons.warning} No executables found in PATH`);
    }
    
    return analysis;
}

/**
 * Analyze project storage
 */
function analyzeProjectStorage(projects) {
    console.log(`\n${colors.bright}${icons.memory} Project Data Storage${colors.reset}`);
    console.log('─'.repeat(50));
    
    if (!projects || Object.keys(projects).length === 0) {
        console.log(`${icons.info} No projects connected`);
        return;
    }
    
    for (const [name, project] of Object.entries(projects)) {
        console.log(`\n${icons.project} ${colors.cyan}${name}${colors.reset}`);
        console.log(`  Path: ${project.path}`);
        
        // Check if project path exists
        const projectCheck = checkPath(project.path);
        if (!projectCheck.exists) {
            console.log(`  ${icons.error} ${colors.red}Project path not found!${colors.reset}`);
            continue;
        }
        
        // Check Git status
        const gitStatus = checkGitStatus(project.path);
        if (gitStatus.isGitRepo) {
            console.log(`  ${icons.info} Git: ${gitStatus.branch} branch${gitStatus.hasChanges ? ` (${gitStatus.changes} changes)` : ''}`);
        }
        
        // Check for embedded files (symlink approach)
        const namespace = project.namespace || 'context-now';
        const embeddedPath = path.join(project.path, 'tools', namespace);
        const embeddedCheck = checkPath(embeddedPath);
        
        if (embeddedCheck.exists) {
            console.log(`  ${icons.folder} Embedded Storage: ${colors.yellow}${embeddedPath}${colors.reset}`);
            
            // Check individual files
            const files = [
                'context-tracker.js',
                'issues.json',
                'prs.json',
                'project-memory.json',
                'github-branches.json',
                'issue-relations.json'
            ];
            
            let dataFiles = 0;
            let symlinks = 0;
            let totalSize = 0;
            
            for (const file of files) {
                const filePath = path.join(embeddedPath, file);
                const fileCheck = checkPath(filePath);
                if (fileCheck.exists) {
                    if (fileCheck.isSymlink) {
                        symlinks++;
                        console.log(`    ${icons.symlink} ${file} → ${colors.dim}${fileCheck.realPath}${colors.reset}`);
                    } else if (file.endsWith('.json')) {
                        dataFiles++;
                        totalSize += fileCheck.size;
                        console.log(`    ${icons.file} ${file} (${formatSize(fileCheck.size)})`);
                    }
                }
            }
            
            console.log(`  ${icons.info} Summary: ${dataFiles} data files (${formatSize(totalSize)}), ${symlinks} symlinks`);
        }
        
        // Check for local storage (future feature)
        const localStoragePath = path.join(os.homedir(), '.config', 'context-now', 'projects', name);
        const localCheck = checkPath(localStoragePath);
        
        if (localCheck.exists) {
            console.log(`  ${icons.local} Local Storage: ${colors.green}${localStoragePath}${colors.reset}`);
            
            // List files in local storage
            const localFiles = fs.readdirSync(localStoragePath);
            let localSize = 0;
            for (const file of localFiles) {
                const filePath = path.join(localStoragePath, file);
                const fileStats = fs.statSync(filePath);
                localSize += fileStats.size;
            }
            console.log(`    ${icons.info} ${localFiles.length} files (${formatSize(localSize)})`);
        } else {
            console.log(`  ${icons.local} Local Storage: ${colors.dim}Not configured${colors.reset}`);
        }
    }
}

/**
 * Check system dependencies
 */
function checkDependencies() {
    console.log(`\n${colors.bright}${icons.config} System Dependencies${colors.reset}`);
    console.log('─'.repeat(50));
    
    const dependencies = [
        { name: 'git', command: ['--version'], required: true },
        { name: 'gh', command: ['--version'], required: false },
        { name: 'node', command: ['--version'], required: true },
        { name: 'npm', command: ['--version'], required: true }
    ];
    
    for (const dep of dependencies) {
        try {
            const result = execFileSync(dep.name, dep.command, { encoding: 'utf8' }).trim();
            const version = result.split('\n')[0];
            console.log(`${icons.success} ${dep.name}: ${colors.green}${version}${colors.reset}`);
        } catch (error) {
            if (dep.required) {
                console.log(`${icons.error} ${dep.name}: ${colors.red}Not found (REQUIRED)${colors.reset}`);
            } else {
                console.log(`${icons.warning} ${dep.name}: ${colors.yellow}Not found (optional)${colors.reset}`);
            }
        }
    }
}

/**
 * Generate recommendations
 */
function generateRecommendations(analysis) {
    console.log(`\n${colors.bright}${icons.info} Recommendations${colors.reset}`);
    console.log('─'.repeat(50));
    
    const recommendations = [];
    
    // Check for mixed storage
    let hasEmbedded = false;
    let hasLocal = false;
    
    for (const [name, project] of Object.entries(analysis.projects || {})) {
        const namespace = project.namespace || 'context-now';
        const embeddedPath = path.join(project.path, 'tools', namespace);
        const localPath = path.join(os.homedir(), '.config', 'context-now', 'projects', name);
        
        if (fs.existsSync(embeddedPath)) hasEmbedded = true;
        if (fs.existsSync(localPath)) hasLocal = true;
    }
    
    if (hasEmbedded && !hasLocal) {
        recommendations.push({
            type: 'info',
            message: 'All projects use embedded storage (symlinks in project directories)',
            action: 'Consider using local storage for cleaner project directories: cn --storage local'
        });
    }
    
    if (hasEmbedded && hasLocal) {
        recommendations.push({
            type: 'warning',
            message: 'Mixed storage modes detected (both embedded and local)',
            action: 'Run "cn --migrate-storage" to consolidate storage'
        });
    }
    
    // Check for old installations
    if (analysis.installation.home && analysis.installation.npm) {
        recommendations.push({
            type: 'info',
            message: 'Both home and NPM installations found',
            action: 'Consider removing home installation if using NPM package'
        });
    }
    
    // Display recommendations
    if (recommendations.length === 0) {
        console.log(`${icons.success} No issues found - everything looks good!`);
    } else {
        for (const rec of recommendations) {
            const icon = rec.type === 'warning' ? icons.warning : icons.info;
            const color = rec.type === 'warning' ? colors.yellow : colors.cyan;
            console.log(`${icon} ${color}${rec.message}${colors.reset}`);
            console.log(`   → ${rec.action}`);
        }
    }
}

/**
 * Main doctor function
 */
async function runDoctor(options = {}) {
    console.log(`${colors.bright}${colors.cyan}🩺 Context-Now Doctor${colors.reset}`);
    console.log(`${colors.dim}Analyzing your Context-Now installation...${colors.reset}`);
    
    // Run analysis
    const analysis = analyzeInstallation();
    
    // Check dependencies
    checkDependencies();
    
    // Analyze project storage
    analyzeProjectStorage(analysis.projects);
    
    // Generate recommendations
    generateRecommendations(analysis);
    
    // Summary
    console.log(`\n${colors.bright}Summary${colors.reset}`);
    console.log('─'.repeat(50));
    
    const projectCount = Object.keys(analysis.projects || {}).length;
    console.log(`${icons.info} Projects connected: ${projectCount}`);
    
    if (analysis.installation.home) {
        console.log(`${icons.info} Installation type: Home directory`);
    } else if (analysis.installation.npm) {
        console.log(`${icons.info} Installation type: NPM global`);
    } else {
        console.log(`${icons.warning} Installation type: Source/Development`);
    }
    
    // Storage mode detection
    let storageMode = 'unknown';
    if (projectCount > 0) {
        const firstProject = Object.values(analysis.projects)[0];
        const namespace = firstProject.namespace || 'context-now';
        const embeddedPath = path.join(firstProject.path, 'tools', namespace);
        const projectName = Object.keys(analysis.projects)[0];
        const localPath = path.join(os.homedir(), '.config', 'context-now', 'projects', projectName);
        
        if (fs.existsSync(embeddedPath) && !fs.existsSync(localPath)) {
            storageMode = 'embedded (symlinks in projects)';
        } else if (!fs.existsSync(embeddedPath) && fs.existsSync(localPath)) {
            storageMode = 'local (~/.config/context-now)';
        } else if (fs.existsSync(embeddedPath) && fs.existsSync(localPath)) {
            storageMode = 'mixed (needs cleanup)';
        }
    }
    
    console.log(`${icons.info} Storage mode: ${storageMode}`);
    
    if (options.verbose) {
        console.log(`\n${colors.dim}Full analysis:${colors.reset}`);
        console.log(JSON.stringify(analysis, null, 2));
    }
    
    return analysis;
}

module.exports = runDoctor;