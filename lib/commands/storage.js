/**
 * Storage Management for Context-Now
 * ===================================
 * Manages different storage modes for project data
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

// Storage modes
const STORAGE_MODES = {
    EMBEDDED: 'embedded',  // Symlinks in project directories (current default)
    LOCAL: 'local',        // All data in ~/.config/context-now/projects/
    HYBRID: 'hybrid'       // Config local, temporary files in project
};

/**
 * Get current storage mode for a project
 */
function getStorageMode(projectName, projectPath) {
    const configDir = path.join(os.homedir(), '.config', 'context-now');
    const projectsFile = path.join(configDir, 'projects.json');
    
    if (!fs.existsSync(projectsFile)) {
        return STORAGE_MODES.EMBEDDED; // Default
    }
    
    try {
        const projects = JSON.parse(fs.readFileSync(projectsFile, 'utf8'));
        const project = projects[projectName];
        
        if (project && project.storageMode) {
            return project.storageMode;
        }
        
        // Auto-detect based on existing files
        const namespace = project?.namespace || 'context-now';
        const embeddedPath = path.join(projectPath, 'tools', namespace);
        const localPath = path.join(configDir, 'projects', projectName);
        
        if (fs.existsSync(embeddedPath)) {
            return STORAGE_MODES.EMBEDDED;
        } else if (fs.existsSync(localPath)) {
            return STORAGE_MODES.LOCAL;
        }
        
        return STORAGE_MODES.EMBEDDED; // Default
    } catch (error) {
        return STORAGE_MODES.EMBEDDED;
    }
}

/**
 * Set storage mode for a project
 */
function setStorageMode(projectName, mode) {
    const configDir = path.join(os.homedir(), '.config', 'context-now');
    const projectsFile = path.join(configDir, 'projects.json');
    
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }
    
    let projects = {};
    if (fs.existsSync(projectsFile)) {
        projects = JSON.parse(fs.readFileSync(projectsFile, 'utf8'));
    }
    
    if (!projects[projectName]) {
        throw new Error(`Project '${projectName}' not found`);
    }
    
    projects[projectName].storageMode = mode;
    fs.writeFileSync(projectsFile, JSON.stringify(projects, null, 2));
}

/**
 * Get data directory based on storage mode
 */
function getDataDirectory(projectName, projectPath, storageMode) {
    const configDir = path.join(os.homedir(), '.config', 'context-now');
    
    switch (storageMode) {
        case STORAGE_MODES.LOCAL:
            return path.join(configDir, 'projects', projectName, 'data');
            
        case STORAGE_MODES.EMBEDDED:
            const namespace = 'context-now'; // Could be from config
            return path.join(projectPath, 'tools', namespace);
            
        case STORAGE_MODES.HYBRID:
            // Config in local, runtime in project
            return {
                config: path.join(configDir, 'projects', projectName, 'config'),
                runtime: path.join(projectPath, '.context-now-cache')
            };
            
        default:
            throw new Error(`Unknown storage mode: ${storageMode}`);
    }
}

/**
 * Migrate project from one storage mode to another
 */
async function migrateStorage(projectName, fromMode, toMode) {
    const configDir = path.join(os.homedir(), '.config', 'context-now');
    const projectsFile = path.join(configDir, 'projects.json');
    
    if (!fs.existsSync(projectsFile)) {
        throw new Error('No projects configuration found');
    }
    
    const projects = JSON.parse(fs.readFileSync(projectsFile, 'utf8'));
    const project = projects[projectName];
    
    if (!project) {
        throw new Error(`Project '${projectName}' not found`);
    }
    
    const projectPath = project.path;
    const namespace = project.namespace || 'context-now';
    
    console.log(`Migrating '${projectName}' from ${fromMode} to ${toMode}...`);
    
    // Define source and destination paths
    const embeddedPath = path.join(projectPath, 'tools', namespace);
    const localPath = path.join(configDir, 'projects', projectName, 'data');
    
    let sourcePath, destPath;
    
    if (fromMode === STORAGE_MODES.EMBEDDED && toMode === STORAGE_MODES.LOCAL) {
        sourcePath = embeddedPath;
        destPath = localPath;
        
        // Create local directory
        fs.mkdirSync(destPath, { recursive: true });
        
        // Copy data files (not symlinks or templates)
        const dataFiles = [
            'issues.json',
            'prs.json',
            'project-memory.json',
            'github-branches.json',
            'issue-relations.json',
            'closed-branches.json'
        ];
        
        for (const file of dataFiles) {
            const sourceFile = path.join(sourcePath, file);
            const destFile = path.join(destPath, file);
            
            if (fs.existsSync(sourceFile)) {
                const stats = fs.lstatSync(sourceFile);
                if (!stats.isSymbolicLink()) {
                    console.log(`  Copying ${file}...`);
                    fs.copyFileSync(sourceFile, destFile);
                }
            }
        }
        
        // Remove embedded directory (but keep backup)
        const backupPath = `${embeddedPath}.backup.${Date.now()}`;
        console.log(`  Creating backup at ${backupPath}...`);
        fs.renameSync(embeddedPath, backupPath);
        
        // Update project configuration
        setStorageMode(projectName, toMode);
        
        console.log(`✅ Migration complete!`);
        console.log(`  Data now stored in: ${destPath}`);
        console.log(`  Backup kept at: ${backupPath}`);
        
    } else if (fromMode === STORAGE_MODES.LOCAL && toMode === STORAGE_MODES.EMBEDDED) {
        sourcePath = localPath;
        destPath = embeddedPath;
        
        // Create embedded directory structure
        fs.mkdirSync(destPath, { recursive: true });
        
        // Create symlinks to shared files
        const contextNowDir = path.join(os.homedir(), '.context-now') || process.cwd();
        const sharedFiles = [
            'context-tracker.js',
            'issues.template.json',
            'prs.template.json',
            'project-memory.template.json'
        ];
        
        for (const file of sharedFiles) {
            const target = path.join(contextNowDir, 'tools', 'context-tracker', file);
            const link = path.join(destPath, file);
            if (fs.existsSync(target) && !fs.existsSync(link)) {
                console.log(`  Creating symlink for ${file}...`);
                fs.symlinkSync(target, link);
            }
        }
        
        // Copy data files back
        const dataFiles = fs.readdirSync(sourcePath).filter(f => f.endsWith('.json') && !f.includes('template'));
        for (const file of dataFiles) {
            console.log(`  Copying ${file}...`);
            fs.copyFileSync(path.join(sourcePath, file), path.join(destPath, file));
        }
        
        // Remove local directory
        const backupPath = `${sourcePath}.backup.${Date.now()}`;
        console.log(`  Creating backup at ${backupPath}...`);
        fs.renameSync(sourcePath, backupPath);
        
        // Update project configuration
        setStorageMode(projectName, toMode);
        
        console.log(`✅ Migration complete!`);
        console.log(`  Data now embedded in: ${destPath}`);
        console.log(`  Backup kept at: ${backupPath}`);
        
    } else {
        throw new Error(`Migration from ${fromMode} to ${toMode} not implemented yet`);
    }
}

/**
 * Create proxy functions for file access that work with any storage mode
 */
class StorageProxy {
    constructor(projectName, projectPath) {
        this.projectName = projectName;
        this.projectPath = projectPath;
        this.storageMode = getStorageMode(projectName, projectPath);
        this.dataDir = getDataDirectory(projectName, projectPath, this.storageMode);
    }
    
    /**
     * Read a data file
     */
    readFile(filename) {
        let filepath;
        
        if (this.storageMode === STORAGE_MODES.HYBRID) {
            // Check both locations
            const configFile = path.join(this.dataDir.config, filename);
            const runtimeFile = path.join(this.dataDir.runtime, filename);
            
            if (filename.includes('memory') || filename.includes('relations')) {
                filepath = configFile;
            } else {
                filepath = runtimeFile;
            }
        } else {
            filepath = path.join(this.dataDir, filename);
        }
        
        if (!fs.existsSync(filepath)) {
            return null;
        }
        
        return fs.readFileSync(filepath, 'utf8');
    }
    
    /**
     * Write a data file
     */
    writeFile(filename, content) {
        let filepath;
        
        if (this.storageMode === STORAGE_MODES.HYBRID) {
            // Determine location based on file type
            if (filename.includes('memory') || filename.includes('relations')) {
                filepath = path.join(this.dataDir.config, filename);
                fs.mkdirSync(this.dataDir.config, { recursive: true });
            } else {
                filepath = path.join(this.dataDir.runtime, filename);
                fs.mkdirSync(this.dataDir.runtime, { recursive: true });
            }
        } else {
            filepath = path.join(this.dataDir, filename);
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
        
        fs.writeFileSync(filepath, content, 'utf8');
    }
    
    /**
     * Check if file exists
     */
    exists(filename) {
        if (this.storageMode === STORAGE_MODES.HYBRID) {
            const configFile = path.join(this.dataDir.config, filename);
            const runtimeFile = path.join(this.dataDir.runtime, filename);
            return fs.existsSync(configFile) || fs.existsSync(runtimeFile);
        } else {
            return fs.existsSync(path.join(this.dataDir, filename));
        }
    }
    
    /**
     * List all data files
     */
    listFiles() {
        const files = [];
        
        if (this.storageMode === STORAGE_MODES.HYBRID) {
            if (fs.existsSync(this.dataDir.config)) {
                files.push(...fs.readdirSync(this.dataDir.config).map(f => ({
                    name: f,
                    location: 'config',
                    path: path.join(this.dataDir.config, f)
                })));
            }
            if (fs.existsSync(this.dataDir.runtime)) {
                files.push(...fs.readdirSync(this.dataDir.runtime).map(f => ({
                    name: f,
                    location: 'runtime',
                    path: path.join(this.dataDir.runtime, f)
                })));
            }
        } else {
            if (fs.existsSync(this.dataDir)) {
                files.push(...fs.readdirSync(this.dataDir).map(f => ({
                    name: f,
                    location: this.storageMode,
                    path: path.join(this.dataDir, f)
                })));
            }
        }
        
        return files;
    }
}

module.exports = {
    STORAGE_MODES,
    getStorageMode,
    setStorageMode,
    getDataDirectory,
    migrateStorage,
    StorageProxy
};