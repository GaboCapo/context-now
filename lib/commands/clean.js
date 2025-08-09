/**
 * Clean Command for Context-Now
 * ==============================
 * Removes invalid/corrupt project entries
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

/**
 * Clean corrupt project entries
 */
function cleanProjects(options = {}) {
    const configDir = path.join(os.homedir(), '.config', 'context-now');
    const projectsFile = path.join(configDir, 'projects.json');
    
    console.log(`${colors.cyan}🧹 Cleaning corrupt project entries...${colors.reset}\n`);
    
    if (!fs.existsSync(projectsFile)) {
        console.log(`${colors.yellow}No projects.json found${colors.reset}`);
        return { cleaned: 0, total: 0 };
    }
    
    let projects = {};
    try {
        const content = fs.readFileSync(projectsFile, 'utf8');
        projects = JSON.parse(content);
    } catch (error) {
        console.error(`${colors.red}Error reading projects.json: ${error.message}${colors.reset}`);
        
        if (options.backup) {
            const backupFile = `${projectsFile}.backup.${Date.now()}`;
            fs.copyFileSync(projectsFile, backupFile);
            console.log(`${colors.green}Backup created: ${backupFile}${colors.reset}`);
        }
        
        // Try to fix JSON
        console.log(`${colors.yellow}Attempting to recover data...${colors.reset}`);
        projects = {};
    }
    
    const cleaned = [];
    const valid = {};
    let totalCount = 0;
    
    for (const [name, project] of Object.entries(projects)) {
        totalCount++;
        
        // Check for valid project structure
        const isValid = project && 
                       project.path && 
                       typeof project.path === 'string' &&
                       project.path !== 'undefined' &&
                       project.connected &&
                       project.connected !== 'Invalid Date';
        
        if (isValid) {
            // Additional check: does path exist?
            if (fs.existsSync(project.path)) {
                valid[name] = project;
                console.log(`${colors.green}✅ ${name}: Valid${colors.reset}`);
            } else {
                cleaned.push(name);
                console.log(`${colors.yellow}⚠️  ${name}: Path not found (${project.path})${colors.reset}`);
                
                if (!options.force) {
                    // Keep it but mark as needs attention
                    valid[name] = {
                        ...project,
                        needsAttention: true,
                        lastChecked: new Date().toISOString()
                    };
                }
            }
        } else {
            cleaned.push(name);
            console.log(`${colors.red}❌ ${name}: Invalid configuration${colors.reset}`);
            
            if (project) {
                console.log(`   Path: ${project.path || 'undefined'}`);
                console.log(`   Connected: ${project.connected || 'undefined'}`);
            }
        }
    }
    
    // Save cleaned projects
    if (cleaned.length > 0) {
        if (options.dryRun) {
            console.log(`\n${colors.yellow}Dry run - no changes made${colors.reset}`);
            console.log(`Would remove ${cleaned.length} invalid entries`);
        } else {
            // Backup original
            const backupFile = `${projectsFile}.backup.${Date.now()}`;
            fs.copyFileSync(projectsFile, backupFile);
            console.log(`\n${colors.green}Backup created: ${backupFile}${colors.reset}`);
            
            // Save cleaned version
            fs.writeFileSync(projectsFile, JSON.stringify(valid, null, 2));
            console.log(`${colors.green}✅ Cleaned ${cleaned.length} invalid entries${colors.reset}`);
        }
    } else {
        console.log(`\n${colors.green}✅ All projects are valid${colors.reset}`);
    }
    
    return {
        cleaned: cleaned.length,
        total: totalCount,
        valid: Object.keys(valid).length,
        removedProjects: cleaned
    };
}

/**
 * Interactive clean with confirmation
 */
async function interactiveClean() {
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    const question = (prompt) => new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
    
    // First do a dry run
    console.log(`${colors.bright}Scanning for corrupt entries...${colors.reset}\n`);
    const dryRun = cleanProjects({ dryRun: true });
    
    if (dryRun.cleaned === 0) {
        rl.close();
        return;
    }
    
    const answer = await question(`\n${colors.yellow}Remove ${dryRun.cleaned} corrupt entries? (y/N): ${colors.reset}`);
    
    if (answer.toLowerCase() === 'y') {
        cleanProjects({ backup: true, force: false });
    } else {
        console.log(`${colors.yellow}Cancelled${colors.reset}`);
    }
    
    rl.close();
}

// Export for use as module or CLI
if (require.main === module) {
    // Running as script
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
Context-Now Clean Utility
========================

Usage: cn clean [options]

Options:
  --force     Remove entries even if path exists
  --dry-run   Show what would be cleaned without changes
  --backup    Create backup before cleaning (default: true)
  --help      Show this help

Examples:
  cn clean            # Interactive mode
  cn clean --dry-run  # Preview changes
  cn clean --force    # Remove all invalid entries
        `);
        process.exit(0);
    }
    
    if (args.includes('--dry-run')) {
        cleanProjects({ dryRun: true });
    } else if (args.includes('--force')) {
        cleanProjects({ backup: true, force: true });
    } else {
        interactiveClean();
    }
} else {
    module.exports = { cleanProjects, interactiveClean };
}