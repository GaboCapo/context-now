/**
 * Context-Now CLI
 * ===============
 * Sichere CLI-Implementation mit Input-Validation
 */

'use strict';

const path = require('path');
const fs = require('fs');
const { safeGit, safeGH, isValidBranchName, sanitizeIssueTitle, safePath } = require('./security/safe-exec');

// Lade Commands
const commands = {
    connect: require('./commands/connect'),
    status: require('./commands/status'),
    list: require('./commands/list'),
    go: require('./commands/go'),
    disconnect: require('./commands/disconnect'),
    branches: require('./commands/branches'),
    issues: require('./commands/issues'),
    prs: require('./commands/prs'),
    critical: require('./commands/critical'),
    help: require('./commands/help')
};

// ANSI Colors (sicher, keine Injection möglich)
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

/**
 * Parse und validiere CLI Argumente
 * @param {Array} argv - Process argv
 * @returns {Object} Parsed arguments
 */
function parseArguments(argv) {
    const args = argv.slice(2);
    
    if (args.length === 0) {
        return { command: 'help' };
    }
    
    const command = args[0];
    const options = {};
    
    // Validiere Command gegen Whitelist
    const validCommands = [
        '-c', '--connect',
        '-s', '--status',
        '-l', '--list',
        '-g', '--go',
        '-d', '--disconnect',
        '-h', '--help',
        'branches', 'issues', 'prs', 'critical', 'relations'
    ];
    
    if (!validCommands.includes(command)) {
        throw new Error(`Unknown command: ${command}`);
    }
    
    // Parse weitere Argumente
    for (let i = 1; i < args.length; i++) {
        const arg = args[i];
        
        // Validiere Argument-Länge
        if (arg.length > 1000) {
            throw new Error('Argument too long');
        }
        
        // Speichere als option
        if (i === 1) {
            options.target = arg;
        } else {
            options[`arg${i}`] = arg;
        }
    }
    
    return {
        command: command,
        options: options
    };
}

/**
 * Hauptfunktion
 */
async function main() {
    try {
        // Parse Argumente mit Validation
        const { command, options } = parseArguments(process.argv);
        
        // Route zu entsprechendem Command
        switch (command) {
            case '-c':
            case '--connect':
                if (!options.target) {
                    throw new Error('Project path required');
                }
                // Validiere Pfad
                const projectPath = safePath(options.target, process.cwd());
                await commands.connect(projectPath);
                break;
                
            case '-s':
            case '--status':
                await commands.status(options.target);
                break;
                
            case '-l':
            case '--list':
                await commands.list();
                break;
                
            case '-g':
            case '--go':
                if (!options.target) {
                    throw new Error('Project name or number required');
                }
                await commands.go(options.target);
                break;
                
            case '-d':
            case '--disconnect':
                if (!options.target) {
                    throw new Error('Project name required');
                }
                await commands.disconnect(options.target);
                break;
                
            case 'branches':
            case 'issues':
            case 'prs':
            case 'critical':
                await commands[command](options.target);
                break;
                
            case '-h':
            case '--help':
            case 'help':
            default:
                await commands.help();
                break;
        }
    } catch (error) {
        // Sichere Fehlerausgabe
        console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
        
        if (process.env.DEBUG) {
            console.error(colors.dim, error.stack, colors.reset);
        }
        
        process.exit(1);
    }
}

// Error Handler für unbehandelte Promises
process.on('unhandledRejection', (error) => {
    console.error(`${colors.red}Unhandled error: ${error.message}${colors.reset}`);
    process.exit(1);
});

// Verhindere zu viele Listeners (Memory Leak Schutz)
process.setMaxListeners(10);

// Starte CLI
main();