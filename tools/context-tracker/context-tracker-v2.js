#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');

// Versuche SSH-Modul zu laden (falls vorhanden)
let sshModule = null;
try {
    sshModule = require('./context-tracker-ssh.js');
} catch (e) {
    // SSH-Modul nicht verfügbar
}

// Paths zu den JSON-Dateien
const ISSUES_FILE = path.join(__dirname, 'issues.json');
const PRS_FILE = path.join(__dirname, 'prs.json');
const MEMORY_FILE = path.join(__dirname, 'project-memory.json');
const GITHUB_BRANCHES_FILE = path.join(__dirname, 'github-branches.json');
const CLOSED_BRANCHES_FILE = path.join(__dirname, 'closed-branches.json');

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
    white: '\x1b[37m',
    strikethrough: '\x1b[9m'
};

// JSON-Dateien laden
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

// Prüfe ob Branch gemerged wurde
function isBranchMerged(branch) {
    // Prüfe ob Branch in main/master gemerged wurde
    const mergedInMain = gitCommand(`git branch --merged main 2>/dev/null | grep -w "${branch}"`, '');
    const mergedInMaster = gitCommand(`git branch --merged master 2>/dev/null | grep -w "${branch}"`, '');
    const mergedInDevelop = gitCommand(`git branch --merged develop 2>/dev/null | grep -w "${branch}"`, '');
    
    return !!(mergedInMain || mergedInMaster || mergedInDevelop);
}

// Closed/Merged Branches verwalten
function updateClosedBranches(localBranches, remoteBranches) {
    const closedBranches = loadJSON(CLOSED_BRANCHES_FILE, {});
    const currentDate = new Date().toISOString();
    
    // Branches die lokal existieren aber nicht remote
    const localOnly = localBranches.filter(b => !remoteBranches.includes(b));
    
    localOnly.forEach(branch => {
        // Skip main/master/develop
        if (['main', 'master', 'develop'].includes(branch)) return;
        
        // Prüfe ob bereits als geschlossen markiert
        if (!closedBranches[branch]) {
            // Prüfe ob gemerged
            const merged = isBranchMerged(branch);
            
            if (merged) {
                closedBranches[branch] = {
                    status: 'merged',
                    detectedAt: currentDate,
                    lastSeen: currentDate
                };
            } else {
                // Könnte ein neuer Branch sein oder remote gelöscht
                // Prüfe ob es Commits gibt die nicht in main sind
                const hasUnmergedCommits = gitCommand(
                    `git rev-list --count main..${branch} 2>/dev/null`, 
                    '0'
                );
                
                if (parseInt(hasUnmergedCommits) === 0) {
                    closedBranches[branch] = {
                        status: 'likely-closed',
                        detectedAt: currentDate,
                        lastSeen: currentDate
                    };
                }
            }
        } else {
            // Update last seen
            closedBranches[branch].lastSeen = currentDate;
        }
    });
    
    // Branches die wieder remote sind (wiedereröffnet)
    Object.keys(closedBranches).forEach(branch => {
        if (remoteBranches.includes(branch)) {
            delete closedBranches[branch];
        }
    });
    
    // Speichern
    fs.writeFileSync(CLOSED_BRANCHES_FILE, JSON.stringify(closedBranches, null, 2));
    
    return closedBranches;
}

// GitHub Repository Info ermitteln
function getGitHubInfo() {
    const remoteUrl = gitCommand('git config --get remote.origin.url', '');
    
    if (!remoteUrl) {
        return null;
    }
    
    // Parse GitHub URL (ssh oder https)
    let match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)(\.git)?$/);
    if (!match) {
        match = remoteUrl.match(/github\.com\/([^/]+)\/([^/.]+)(\.git)?$/);
    }
    
    if (match) {
        return {
            owner: match[1],
            repo: match[2]
        };
    }
    
    return null;
}

// GitHub API aufrufen
function fetchGitHubBranches(owner, repo) {
    return new Promise((resolve, reject) => {
        const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
        
        const headers = {
            'User-Agent': 'context-tracker',
            'Accept': 'application/vnd.github.v3+json'
        };
        
        if (token) {
            headers['Authorization'] = `token ${token}`;
        }
        
        const options = {
            hostname: 'api.github.com',
            path: `/repos/${owner}/${repo}/branches?per_page=100`,
            method: 'GET',
            headers: headers
        };
        
        https.get(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const branches = JSON.parse(data);
                        const branchNames = branches.map(b => b.name);
                        resolve(branchNames);
                    } catch (e) {
                        reject(e);
                    }
                } else if (res.statusCode === 404) {
                    reject(new Error('Repository nicht gefunden oder privat (Token/SSH-Key erforderlich)'));
                } else if (res.statusCode === 403) {
                    reject(new Error('GitHub API Rate Limit oder Zugriff verweigert'));
                } else {
                    reject(new Error(`GitHub API Error: ${res.statusCode}`));
                }
            });
        }).on('error', reject);
    });
}

// Aktuellen Branch ermitteln
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

// Remote Branches abrufen
async function getRemoteBranches() {
    // Option 1: SSH Deploy Key
    if (sshModule) {
        try {
            console.log(`${colors.cyan}  → Versuche SSH Deploy Key...${colors.reset}`);
            const branches = sshModule.fetchCurrentRepoBranches();
            if (branches && branches.length > 0) {
                console.log(`${colors.green}  ✓ ${branches.length} Branches via SSH abgerufen${colors.reset}`);
                fs.writeFileSync(GITHUB_BRANCHES_FILE, JSON.stringify(branches, null, 2));
                return branches;
            }
        } catch (error) {
            console.log(`${colors.yellow}  ⚠️  SSH fehlgeschlagen: ${error.message}${colors.reset}`);
        }
    }
    
    // Option 2: GitHub API
    const githubInfo = getGitHubInfo();
    if (githubInfo) {
        try {
            console.log(`${colors.cyan}  → Hole Daten von GitHub API...${colors.reset}`);
            const branches = await fetchGitHubBranches(githubInfo.owner, githubInfo.repo);
            fs.writeFileSync(GITHUB_BRANCHES_FILE, JSON.stringify(branches, null, 2));
            console.log(`${colors.green}  ✓ ${branches.length} Branches von GitHub abgerufen${colors.reset}`);
            return branches;
        } catch (error) {
            console.log(`${colors.yellow}  ⚠️  GitHub API: ${error.message}${colors.reset}`);
        }
    }
    
    // Option 3: Cache
    if (fs.existsSync(GITHUB_BRANCHES_FILE)) {
        try {
            const branches = JSON.parse(fs.readFileSync(GITHUB_BRANCHES_FILE, 'utf8'));
            const stats = fs.statSync(GITHUB_BRANCHES_FILE);
            const ageInHours = (Date.now() - stats.mtime) / (1000 * 60 * 60);
            
            if (ageInHours > 1) {
                console.log(`${colors.yellow}  ⚠️  Cache ist ${Math.floor(ageInHours)} Stunden alt${colors.reset}`);
            }
            return branches;
        } catch (e) {
            console.error('Fehler beim Lesen der github-branches.json:', e.message);
        }
    }
    
    // Option 4: Git Remote (wahrscheinlich veraltet)
    console.log(`${colors.red}  ⚠️  Verwende lokalen Git-Cache (wahrscheinlich veraltet!)${colors.reset}`);
    const output = gitCommand('git branch -r', '');
    if (!output) return [];
    
    return output.split('\n')
        .map(line => line.trim())
        .filter(branch => branch && !branch.includes('HEAD'))
        .map(branch => branch.replace('origin/', ''));
}

// Git Status prüfen
function getGitStatus() {
    const status = gitCommand('git status --porcelain', '');
    const ahead = gitCommand('git rev-list --count @{u}..HEAD 2>/dev/null', '0');
    const behind = gitCommand('git rev-list --count HEAD..@{u} 2>/dev/null', '0');
    
    return {
        hasChanges: status.length > 0,
        ahead: parseInt(ahead) || 0,
        behind: parseInt(behind) || 0,
        needsPull: parseInt(behind) > 0,
        needsPush: parseInt(ahead) > 0
    };
}

// Branch-Analyse mit Closed Detection
function analyzeBranches(localBranches, remoteBranches, closedBranches) {
    // Kategorisierung
    const localOnly = localBranches.filter(b => !remoteBranches.includes(b));
    const remoteOnly = remoteBranches.filter(b => !localBranches.includes(b));
    const inBoth = localBranches.filter(b => remoteBranches.includes(b));
    
    // Unterteile localOnly in verschiedene Kategorien
    const newLocalBranches = [];
    const mergedBranches = [];
    const likelyClosedBranches = [];
    const unknownLocalBranches = [];
    
    localOnly.forEach(branch => {
        // Skip system branches
        if (['main', 'master', 'develop'].includes(branch)) return;
        
        const closedInfo = closedBranches[branch];
        
        if (closedInfo) {
            if (closedInfo.status === 'merged') {
                mergedBranches.push(branch);
            } else if (closedInfo.status === 'likely-closed') {
                likelyClosedBranches.push(branch);
            }
        } else if (isBranchMerged(branch)) {
            mergedBranches.push(branch);
        } else {
            // Prüfe ob es neue Commits gibt
            const hasCommits = gitCommand(`git rev-list --count main..${branch} 2>/dev/null`, '0');
            if (parseInt(hasCommits) > 0) {
                newLocalBranches.push(branch);
            } else {
                unknownLocalBranches.push(branch);
            }
        }
    });
    
    // Aktive Branches
    const allUniqueBranches = [...new Set([...localBranches, ...remoteBranches])];
    const activeBranches = allUniqueBranches.filter(b => {
        if (['main', 'master', 'develop'].includes(b)) return false;
        if (b.includes('backup')) return false;
        if (mergedBranches.includes(b)) return false;
        return true;
    });
    
    return {
        local: localBranches,
        remote: remoteBranches,
        all: allUniqueBranches,
        localOnly,
        remoteOnly,
        inBoth,
        active: activeBranches,
        newLocal: newLocalBranches,
        merged: mergedBranches,
        likelyClosed: likelyClosedBranches,
        unknownLocal: unknownLocalBranches
    };
}
// Status anzeigen mit Closed Branch Detection
async function showStatus() {
    const issues = loadJSON(ISSUES_FILE);
    const prs = loadJSON(PRS_FILE);
    const memory = loadJSON(MEMORY_FILE, {});
    const currentBranch = getCurrentBranch();
    const gitStatus = getGitStatus();
    
    console.log(`${colors.cyan}🔄 Prüfe Status...${colors.reset}`);
    
    // Remote Branches holen
    const localBranches = getLocalBranches();
    const remoteBranches = await getRemoteBranches();
    
    // Closed Branches analysieren
    const closedBranches = updateClosedBranches(localBranches, remoteBranches);
    const branches = analyzeBranches(localBranches, remoteBranches, closedBranches);
    
    console.log(`\n${colors.bright}📊 Projektübersicht:${colors.reset}`);
    console.log(`- 🌿 Aktueller Branch: ${colors.green}${currentBranch}${colors.reset}`);
    
    // Git Status
    if (gitStatus.hasChanges) {
        console.log(`- ⚠️  ${colors.yellow}Uncommitted Changes vorhanden!${colors.reset}`);
    }
    if (gitStatus.needsPull) {
        console.log(`- 📥 ${colors.red}${gitStatus.behind} Commits behind Remote!${colors.reset}`);
    }
    if (gitStatus.needsPush) {
        console.log(`- 📤 ${colors.yellow}${gitStatus.ahead} Commits ahead of Remote!${colors.reset}`);
    }
    
    // Statistiken
    console.log(`\n${colors.bright}📌 Status:${colors.reset}`);
    const openIssues = issues.filter(i => i.status !== 'closed').length;
    const criticalIssues = issues.filter(i => i.priority === 'critical').length;
    const openPRs = prs.filter(pr => pr.status === 'open').length;
    
    console.log(`- ${openIssues} offene Issues (davon ${colors.red}${criticalIssues} kritisch${colors.reset})`);
    console.log(`- ${colors.cyan}${branches.active.length}${colors.reset} aktive Branches (${branches.all.length} total)`);
    console.log(`  └─ ${branches.local.length} lokal, ${colors.green}${branches.remote.length} auf GitHub${colors.reset}`);
    console.log(`- ${openPRs} offene Pull Requests`);
    
    // Branch-Synchronisation mit Details
    if (branches.localOnly.length > 0 || branches.remoteOnly.length > 0) {
        console.log(`\n${colors.bright}🔄 Branch-Synchronisation:${colors.reset}`);
        
        // Neue lokale Branches (noch nicht gepusht)
        if (branches.newLocal.length > 0) {
            console.log(`\n${colors.yellow}📤 Neue lokale Branches (nicht gepusht):${colors.reset}`);
            branches.newLocal.slice(0, 5).forEach(b => {
                const memData = memory[b];
                let info = `  → ${colors.yellow}${b}${colors.reset}`;
                if (memData?.issue) info += ` (Issue ${memData.issue})`;
                console.log(info);
            });
            if (branches.newLocal.length > 5) {
                console.log(`  ${colors.dim}... und ${branches.newLocal.length - 5} weitere${colors.reset}`);
            }
        }
        
        // Gemergte Branches (können gelöscht werden)
        if (branches.merged.length > 0) {
            console.log(`\n${colors.green}✅ Gemergte Branches (können gelöscht werden):${colors.reset}`);
            branches.merged.slice(0, 5).forEach(b => {
                console.log(`  → ${colors.strikethrough}${colors.dim}${b}${colors.reset} ${colors.green}(merged)${colors.reset}`);
            });
            if (branches.merged.length > 5) {
                console.log(`  ${colors.dim}... und ${branches.merged.length - 5} weitere${colors.reset}`);
            }
        }
        
        // Wahrscheinlich geschlossene Branches
        if (branches.likelyClosed.length > 0) {
            console.log(`\n${colors.dim}🔒 Wahrscheinlich geschlossene Branches:${colors.reset}`);
            branches.likelyClosed.slice(0, 3).forEach(b => {
                console.log(`  → ${colors.dim}${b} (remote gelöscht)${colors.reset}`);
            });
        }
        
        // Remote-only Branches
        if (branches.remoteOnly.length > 0) {
            console.log(`\n${colors.blue}📥 Nur auf GitHub (nicht lokal):${colors.reset}`);
            branches.remoteOnly.slice(0, 5).forEach(b => 
                console.log(`  → ${colors.blue}${b}${colors.reset}`)
            );
            if (branches.remoteOnly.length > 5) {
                console.log(`  ${colors.dim}... und ${branches.remoteOnly.length - 5} weitere${colors.reset}`);
            }
        }
    }
    
    // Kritische Issues
    if (criticalIssues > 0) {
        console.log(`\n${colors.red}🚨 Kritische offene Issues:${colors.reset}`);
        issues.filter(i => i.priority === 'critical' && i.status !== 'closed')
              .slice(0, 5)
              .forEach(issue => {
                  const labels = issue.labels?.join(', ') || '';
                  console.log(`- ${issue.id} - ${issue.title}${labels ? ` [${labels}]` : ''}`);
              });
    }
    
    // Branch-Beziehungen
    console.log(`\n${colors.bright}🔗 Branch-Issue Verknüpfungen:${colors.reset}`);
    
    // Aktuelle Branch-Beziehung
    const currentBranchData = memory[currentBranch];
    if (currentBranchData?.issue) {
        const issue = issues.find(i => i.id === currentBranchData.issue);
        console.log(`- ${colors.green}${currentBranch} (AKTUELL)${colors.reset} → Issue ${currentBranchData.issue}`);
    }
    
    // Andere aktive Branches mit Issues
    const activeBranchesWithIssues = branches.active
        .filter(b => memory[b]?.issue && b !== currentBranch)
        .slice(0, 4);
    
    activeBranchesWithIssues.forEach(branch => {
        const data = memory[branch];
        const inLocal = branches.local.includes(branch);
        const inRemote = branches.remote.includes(branch);
        
        let status = `- ${branch}`;
        if (!inRemote) status = `- ${colors.yellow}${branch} (lokal)${colors.reset}`;
        else if (!inLocal) status = `- ${colors.blue}${branch} (GitHub)${colors.reset}`;
        
        if (data.issue) {
            status += ` → Issue ${data.issue}`;
        }
        console.log(status);
    });
    
    // Empfehlungen
    console.log(`\n${colors.bright}✅ Empfehlungen:${colors.reset}`);
    
    let recommendationCount = 1;
    
    // Uncommitted Changes
    if (gitStatus.hasChanges) {
        console.log(`${colors.yellow}${recommendationCount}. Uncommitted Changes committen oder stashen${colors.reset}`);
        console.log(`   ${colors.cyan}→ git add . && git commit -m "WIP"${colors.reset}`);
        recommendationCount++;
    }
    
    // Gemergte Branches löschen
    if (branches.merged.length > 0) {
        console.log(`${colors.green}${recommendationCount}. Gemergte Branches löschen (${branches.merged.length} Branches):${colors.reset}`);
        if (branches.merged.length <= 3) {
            branches.merged.forEach(b => {
                console.log(`   ${colors.cyan}→ git branch -d ${b}${colors.reset}`);
            });
        } else {
            console.log(`   ${colors.cyan}→ git branch --merged | grep -v "main\\|develop" | xargs git branch -d${colors.reset}`);
        }
        recommendationCount++;
    }
    
    // Neue Branches pushen
    if (branches.newLocal.length > 0) {
        const unpushed = branches.newLocal[0];
        console.log(`${colors.yellow}${recommendationCount}. Neuen Branch zu GitHub pushen:${colors.reset}`);
        console.log(`   ${colors.cyan}→ git push --set-upstream origin ${unpushed}${colors.reset}`);
        recommendationCount++;
    }
    
    // Wahrscheinlich geschlossene Branches prüfen
    if (branches.likelyClosed.length > 0) {
        console.log(`${colors.dim}${recommendationCount}. Geschlossene Branches prüfen und ggf. löschen:${colors.reset}`);
        console.log(`   ${colors.cyan}→ git branch -D ${branches.likelyClosed[0]}${colors.reset}`);
        console.log(`   ${colors.dim}(Erst prüfen ob keine wichtigen Änderungen verloren gehen!)${colors.reset}`);
        recommendationCount++;
    }
    
    // Aktuelles Issue
    if (currentBranchData?.issue) {
        const issue = issues.find(i => i.id === currentBranchData.issue);
        if (issue) {
            console.log(`${recommendationCount}. Weiterarbeiten an Issue ${currentBranchData.issue}: "${issue.title}"`);
        }
    }
    
    console.log('');
}

// Branch Cleanup Command
async function cleanupBranches(dryRun = true) {
    console.log(`${colors.bright}🧹 Branch Cleanup${colors.reset}\n`);
    
    const localBranches = getLocalBranches();
    const remoteBranches = await getRemoteBranches();
    const closedBranches = updateClosedBranches(localBranches, remoteBranches);
    const branches = analyzeBranches(localBranches, remoteBranches, closedBranches);
    
    if (branches.merged.length === 0 && branches.likelyClosed.length === 0) {
        console.log(`${colors.green}✅ Keine Branches zum Aufräumen gefunden!${colors.reset}`);
        return;
    }
    
    if (dryRun) {
        console.log(`${colors.yellow}DRY RUN - keine Branches werden gelöscht${colors.reset}\n`);
    }
    
    // Gemergte Branches
    if (branches.merged.length > 0) {
        console.log(`${colors.green}Gemergte Branches (${branches.merged.length}):${colors.reset}`);
        branches.merged.forEach(b => {
            if (dryRun) {
                console.log(`  → würde löschen: ${b}`);
            } else {
                const result = gitCommand(`git branch -d ${b} 2>&1`, 'Fehler');
                if (result.includes('Deleted')) {
                    console.log(`  ${colors.green}✅ Gelöscht: ${b}${colors.reset}`);
                } else {
                    console.log(`  ${colors.red}❌ Fehler bei ${b}: ${result}${colors.reset}`);
                }
            }
        });
    }
    
    // Wahrscheinlich geschlossene
    if (branches.likelyClosed.length > 0) {
        console.log(`\n${colors.yellow}Wahrscheinlich geschlossene Branches (${branches.likelyClosed.length}):${colors.reset}`);
        console.log(`${colors.dim}(Diese sollten manuell geprüft werden)${colors.reset}`);
        branches.likelyClosed.forEach(b => {
            console.log(`  → ${b}`);
        });
    }
    
    if (dryRun && (branches.merged.length > 0 || branches.likelyClosed.length > 0)) {
        console.log(`\n${colors.cyan}Zum tatsächlichen Löschen:${colors.reset}`);
        console.log(`  → node context-tracker-v2.js cleanup --force`);
    }
}

// CLI Entry Point
const command = process.argv[2];
const args = process.argv.slice(3);

if (command === 'status' || !command) {
    showStatus().catch(error => {
        console.error(`${colors.red}Fehler: ${error.message}${colors.reset}`);
        process.exit(1);
    });
} else if (command === 'cleanup') {
    const force = args.includes('--force') || args.includes('-f');
    cleanupBranches(!force).catch(error => {
        console.error(`${colors.red}Fehler: ${error.message}${colors.reset}`);
        process.exit(1);
    });
} else {
    console.log(`
${colors.bright}Context-Tracker v2${colors.reset}

${colors.cyan}Verwendung:${colors.reset}
  node context-tracker-v2.js [command]

${colors.cyan}Commands:${colors.reset}
  ${colors.green}status${colors.reset}              Status anzeigen (default)
  ${colors.green}cleanup${colors.reset}             Branch-Cleanup (Dry-Run)
  ${colors.green}cleanup --force${colors.reset}     Branches wirklich löschen

${colors.dim}Erkennt automatisch gemergte und geschlossene Branches!${colors.reset}
`);
}