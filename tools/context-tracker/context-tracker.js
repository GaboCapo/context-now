#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths zu den JSON-Dateien
const ISSUES_FILE = path.join(__dirname, 'issues.json');
const PRS_FILE = path.join(__dirname, 'prs.json');
const MEMORY_FILE = path.join(__dirname, 'project-memory.json');

// Farben für Terminal-Output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

// JSON-Dateien laden (oder leere erstellen)
function loadJSON(filepath, defaultValue = []) {
    if (!fs.existsSync(filepath)) {
        fs.writeFileSync(filepath, JSON.stringify(defaultValue, null, 2));
        return defaultValue;
    }
    try {
        return JSON.parse(fs.readFileSync(filepath, 'utf8'));
    } catch (e) {
        console.error(`⚠️  Fehler beim Lesen von ${filepath}:`, e.message);
        return defaultValue;
    }
}

// Git-Befehle sicher ausführen
function gitCommand(command, defaultValue = '') {
    try {
        return execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    } catch (e) {
        return defaultValue;
    }
}

// Aktuellen Git-Branch ermitteln
function getCurrentBranch() {
    return gitCommand('git rev-parse --abbrev-ref HEAD', 'main');
}

// Alle lokalen Branches abrufen
function getLocalBranches() {
    const output = gitCommand('git branch', '');
    if (!output) return [];
    
    return output.split('\n')
        .map(line => line.replace(/^\*?\s+/, '').trim())
        .filter(branch => branch && !branch.includes('->'));
}

// Alle remote Branches abrufen
function getRemoteBranches() {
    const output = gitCommand('git branch -r', '');
    if (!output) return [];
    
    return output.split('\n')
        .map(line => line.trim())
        .filter(branch => branch && !branch.includes('HEAD'))
        .map(branch => branch.replace('origin/', ''));
}

// Git Status prüfen (uncommitted changes, etc.)
function getGitStatus() {
    const status = gitCommand('git status --porcelain', '');
    const ahead = gitCommand('git rev-list --count @{u}..HEAD', '0');
    const behind = gitCommand('git rev-list --count HEAD..@{u}', '0');
    
    return {
        hasChanges: status.length > 0,
        ahead: parseInt(ahead) || 0,
        behind: parseInt(behind) || 0,
        needsPull: parseInt(behind) > 0,
        needsPush: parseInt(ahead) > 0
    };
}

// Remote Status abrufen
function fetchRemoteStatus() {
    console.log(`${colors.cyan}🔄 Prüfe Remote-Status...${colors.reset}`);
    gitCommand('git fetch --all --quiet');
}
// Dynamische Branch-Analyse
function analyzeBranches() {
    const localBranches = getLocalBranches();
    const remoteBranches = getRemoteBranches();
    
    // Branches die nur lokal existieren
    const localOnly = localBranches.filter(b => !remoteBranches.includes(b));
    
    // Branches die nur remote existieren  
    const remoteOnly = remoteBranches.filter(b => !localBranches.includes(b));
    
    // Feature/Bugfix Branches
    const featureBranches = [...new Set([...localBranches, ...remoteBranches])]
        .filter(b => b.startsWith('feat') || b.startsWith('bugfix') || b.startsWith('fix'));
    
    return {
        local: localBranches,
        remote: remoteBranches,
        localOnly,
        remoteOnly,
        feature: featureBranches,
        total: [...new Set([...localBranches, ...remoteBranches])].length
    };
}

// Status-Command mit dynamischen Daten
function showStatus() {
    // Remote-Status abrufen
    fetchRemoteStatus();
    
    const issues = loadJSON(ISSUES_FILE);
    const prs = loadJSON(PRS_FILE);
    const memory = loadJSON(MEMORY_FILE, {});
    const currentBranch = getCurrentBranch();
    const gitStatus = getGitStatus();
    const branches = analyzeBranches();
    
    console.log(`\n${colors.bright}📊 Projektübersicht:${colors.reset}`);
    console.log(`- 🌿 Aktueller Branch: ${colors.green}${currentBranch}${colors.reset}`);
    
    // Git Status Warnungen
    if (gitStatus.hasChanges) {
        console.log(`- ⚠️  ${colors.yellow}Uncommitted Changes vorhanden!${colors.reset}`);
    }
    if (gitStatus.needsPull) {
        console.log(`- 📥 ${colors.red}${gitStatus.behind} Commits behind Remote!${colors.reset}`);
    }
    if (gitStatus.needsPush) {
        console.log(`- 📤 ${colors.yellow}${gitStatus.ahead} Commits ahead of Remote!${colors.reset}`);
    }
    
    console.log(`\n${colors.bright}📌 Status:${colors.reset}`);
    const openIssues = issues.filter(i => i.status === 'open').length;
    const criticalIssues = issues.filter(i => i.priority === 'critical').length;
    const openPRs = prs.filter(pr => pr.status === 'open').length;
    
    console.log(`- ${openIssues} offene Issues (davon ${colors.red}${criticalIssues} kritisch${colors.reset})`);
    console.log(`- ${colors.cyan}${branches.feature.length}${colors.reset} aktive Feature-Branches (${branches.total} total)`);
    console.log(`- ${openPRs} offene Pull Requests`);
    
    // Branch-Synchronisation Status
    if (branches.localOnly.length > 0 || branches.remoteOnly.length > 0) {
        console.log(`\n${colors.yellow}⚠️  Branch-Synchronisation:${colors.reset}`);
        if (branches.localOnly.length > 0) {
            console.log(`- ${branches.localOnly.length} Branches nur lokal (nicht gepusht):`);
            branches.localOnly.slice(0, 3).forEach(b => 
                console.log(`  ${colors.yellow}→ ${b}${colors.reset}`)
            );
        }
        if (branches.remoteOnly.length > 0) {
            console.log(`- ${branches.remoteOnly.length} Branches nur remote (nicht lokal):`);
            branches.remoteOnly.slice(0, 3).forEach(b => 
                console.log(`  ${colors.blue}→ ${b}${colors.reset}`)
            );
        }
    }
    
    // Kritische Issues
    if (criticalIssues > 0) {
        console.log(`\n${colors.red}🚨 Kritische offene Issues:${colors.reset}`);
        issues.filter(i => i.priority === 'critical' && i.status === 'open')
              .slice(0, 5)
              .forEach(issue => {
                  const labels = issue.labels?.join(', ') || '';
                  console.log(`- ${issue.id} - ${issue.title}${labels ? ` [${labels}]` : ''}`);
              });
    }
    
    console.log(`\n${colors.bright}🔗 Branch-Beziehungen:${colors.reset}`);
    
    // Aktuelle Branch-Analyse
    let recommendation = '';
    
    // Zeige aktiven Branch
    const currentBranchData = memory[currentBranch];
    if (currentBranchData) {
        const issue = currentBranchData.issue ? issues.find(i => i.id === currentBranchData.issue) : null;
        const pr = prs.find(p => p.branch === currentBranch);
        
        let status = `- ${colors.green}${currentBranch} (AKTUELL)${colors.reset}`;
        if (currentBranchData.issue) {
            status += ` → Issue ${currentBranchData.issue}`;
            if (issue) {
                status += ` ("${issue.title.substring(0, 30)}...")`;
            }
        } else {
            status += ` → ${colors.yellow}kein Issue${colors.reset}`;
        }
        
        if (pr && pr.status === 'open') {
            status += ` → ${colors.cyan}PR offen${colors.reset}`;
            recommendation = `→ PR für ${currentBranch} wartet auf Review.`;
        } else {
            status += ` → ${colors.yellow}kein PR${colors.reset}`;
            if (currentBranchData.issue && issue) {
                recommendation = `→ Bleib auf ${currentBranch} und arbeite an Issue ${currentBranchData.issue}.`;
            }
        }
        
        console.log(status);
    }
    
    // Zeige andere aktive Feature-Branches (max 5)
    branches.feature
        .filter(b => b !== currentBranch)
        .slice(0, 5)
        .forEach(branch => {
            const data = memory[branch];
            const inLocal = branches.local.includes(branch);
            const inRemote = branches.remote.includes(branch);
            
            let status = `- ${branch}`;
            if (!inLocal) status = `- ${colors.blue}${branch} (nur remote)${colors.reset}`;
            if (!inRemote) status = `- ${colors.yellow}${branch} (nur lokal)${colors.reset}`;
            
            if (data?.issue) {
                const issue = issues.find(i => i.id === data.issue);
                status += ` → Issue ${data.issue}`;
                if (issue) {
                    status += ` ("${issue.title.substring(0, 20)}...")`;
                }
            }
            
            console.log(status);
        });
    
    // Empfehlungen mit Priorität
    console.log(`\n${colors.bright}✅ Empfehlung:${colors.reset}`);
    
    // Erste Priorität: Synchronisation
    if (gitStatus.needsPull || gitStatus.needsPush || branches.localOnly.length > 0) {
        console.log(`${colors.red}1. ZUERST: Repository synchronisieren${colors.reset}`);
        if (gitStatus.needsPull) {
            console.log(`   ${colors.cyan}→ git pull${colors.reset} (${gitStatus.behind} commits behind)`);
        }
        if (gitStatus.needsPush) {
            console.log(`   ${colors.cyan}→ git push${colors.reset} (${gitStatus.ahead} commits ahead)`);
        }
        if (branches.localOnly.length > 0) {
            console.log(`   ${colors.cyan}→ git push --set-upstream origin ${branches.localOnly[0]}${colors.reset}`);
        }
        console.log('');
    }
    
    // Zweite Priorität: Arbeitsempfehlung
    if (!recommendation) {
        const unassignedCritical = issues.filter(i => 
            i.priority === 'critical' && 
            i.status === 'open' && 
            !Object.values(memory).some(m => m.issue === i.id)
        );
        
        if (unassignedCritical.length > 0) {
            recommendation = `2. Arbeite an kritischem Issue: ${unassignedCritical[0].id} - "${unassignedCritical[0].title}"`;
        } else {
            recommendation = '2. Schaue dir die offenen Issues an und wähle das nächste aus.';
        }
    } else {
        recommendation = '2. ' + recommendation;
    }
    console.log(recommendation);
    
    // Branch-Cleanup Warnung
    if (branches.total > 20) {
        console.log(`\n${colors.yellow}⚠️  Branch-Cleanup empfohlen:${colors.reset}`);
        console.log(`→ ${branches.total} Branches sind zu viele! Führe ein Branch-Audit durch.`);
        console.log(`→ Lösche gemergte Branches: ${colors.cyan}git branch --merged | grep -v main | xargs git branch -d${colors.reset}`);
    }
    
    console.log('');
}

// Interaktive Sync-Funktion
function syncRepository() {
    console.log(`${colors.cyan}🔄 Synchronisiere Repository...${colors.reset}\n`);
    
    // Fetch latest
    console.log('📥 Fetching latest changes...');
    gitCommand('git fetch --all --prune');
    
    const gitStatus = getGitStatus();
    
    if (gitStatus.needsPull) {
        console.log(`📥 Pulling ${gitStatus.behind} commits...`);
        const result = gitCommand('git pull');
        console.log(result || '✅ Pull erfolgreich');
    }
    
    if (gitStatus.needsPush) {
        console.log(`📤 Pushing ${gitStatus.ahead} commits...`);
        const result = gitCommand('git push');
        console.log(result || '✅ Push erfolgreich');
    }
    
    // Cleanup merged branches
    console.log('\n🧹 Lösche gemergte Branches...');
    const merged = gitCommand('git branch --merged main | grep -v "main\\|develop\\|master" | head -5');
    if (merged) {
        console.log('Folgende Branches können gelöscht werden:');
        console.log(merged);
        // Hier könnte man interaktiv fragen ob gelöscht werden soll
    }
    
    console.log(`\n${colors.green}✅ Synchronisation abgeschlossen!${colors.reset}`);
}

// CLI Entry Point
const command = process.argv[2];

if (command === 'status' || !command) {
    showStatus();
} else if (command === 'sync') {
    syncRepository();
} else if (command === 'update') {
    syncRepository();
    console.log('\n' + '='.repeat(50) + '\n');
    showStatus();
} else {
    console.log('Usage: node context-tracker.js [status|sync|update]');
    console.log('  status - Zeigt aktuellen Status (default)');
    console.log('  sync   - Synchronisiert Repository');
    console.log('  update - Sync + Status in einem');
}