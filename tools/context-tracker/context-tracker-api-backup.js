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

// GitHub API aufrufen (mit optionalem Token für private repos)
function fetchGitHubBranches(owner, repo) {
    return new Promise((resolve, reject) => {
        // Token aus Umgebungsvariable oder .env Datei
        const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
        
        const headers = {
            'User-Agent': 'context-tracker',
            'Accept': 'application/vnd.github.v3+json'
        };
        
        // Füge Token hinzu wenn vorhanden
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
                    reject(new Error('Repository nicht gefunden oder privat (Token erforderlich)'));
                } else if (res.statusCode === 403) {
                    const resetTime = res.headers['x-ratelimit-reset'];
                    if (resetTime) {
                        const resetDate = new Date(resetTime * 1000);
                        reject(new Error(`GitHub API Rate Limit erreicht. Reset um: ${resetDate.toLocaleTimeString()}`));
                    } else {
                        reject(new Error('GitHub API Zugriff verweigert (Token prüfen)'));
                    }
                } else {
                    reject(new Error(`GitHub API Error: ${res.statusCode}`));
                }
            });
        }).on('error', reject);
    });
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

// Remote Branches abrufen - mit SSH Deploy Key und GitHub API Fallback
async function getRemoteBranches() {
    // Option 1: Versuche SSH Deploy Key (höchste Priorität)
    if (sshModule) {
        try {
            console.log(`${colors.cyan}  → Versuche SSH Deploy Key...${colors.reset}`);
            const branches = sshModule.fetchCurrentRepoBranches();
            if (branches && branches.length > 0) {
                console.log(`${colors.green}  ✓ ${branches.length} Branches via SSH abgerufen${colors.reset}`);
                
                // Speichere in github-branches.json für Cache
                fs.writeFileSync(GITHUB_BRANCHES_FILE, JSON.stringify(branches, null, 2));
                return branches;
            }
        } catch (error) {
            console.log(`${colors.yellow}  ⚠️  SSH fehlgeschlagen: ${error.message}${colors.reset}`);
        }
    }
    
    // Option 2: Versuche GitHub API
    const githubInfo = getGitHubInfo();
    if (githubInfo) {
        try {
            console.log(`${colors.cyan}  → Hole echte Daten von GitHub API...${colors.reset}`);
            const branches = await fetchGitHubBranches(githubInfo.owner, githubInfo.repo);
            
            // Speichere in github-branches.json für Cache
            fs.writeFileSync(GITHUB_BRANCHES_FILE, JSON.stringify(branches, null, 2));
            console.log(`${colors.green}  ✓ ${branches.length} Branches von GitHub API abgerufen${colors.reset}`);
            
            return branches;
        } catch (error) {
            console.log(`${colors.yellow}  ⚠️  GitHub API nicht erreichbar: ${error.message}${colors.reset}`);
        }
    }
    
    // Option 2: Verwende github-branches.json falls vorhanden
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
    
    // Option 3: Fallback zu git branch -r (wahrscheinlich veraltet!)
    console.log(`${colors.red}  ⚠️  Verwende lokalen Git-Cache (wahrscheinlich veraltet!)${colors.reset}`);
    console.log(`${colors.yellow}  → Führe 'git fetch --all --prune' aus für aktuelle Daten${colors.reset}`);
    
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

// Remote Status abrufen
async function fetchRemoteStatus() {
    console.log(`${colors.cyan}🔄 Prüfe Remote-Status...${colors.reset}`);
    
    // Versuche GitHub API zu nutzen
    const remoteBranches = await getRemoteBranches();
    
    // Optional: git fetch für lokale Änderungen (aber nicht für branches!)
    // gitCommand('git fetch --all --prune --quiet 2>/dev/null');
    
    return remoteBranches;
}
// Dynamische Branch-Analyse
function analyzeBranches(remoteBranches) {
    const localBranches = getLocalBranches();
    
    // Deduplizierte Liste aller Branches
    const allUniqueBranches = [...new Set([...localBranches, ...remoteBranches])];
    
    // Kategorisierung
    const localOnly = localBranches.filter(b => !remoteBranches.includes(b));
    const remoteOnly = remoteBranches.filter(b => !localBranches.includes(b));
    const inBoth = localBranches.filter(b => remoteBranches.includes(b));
    
    // Nach Typ filtern (aktive Branches)
    const activeBranches = allUniqueBranches.filter(b => {
        // Main/Master/Develop sind keine "aktiven" Feature-Branches
        if (['main', 'master', 'develop'].includes(b)) return false;
        // Backup branches sind nicht aktiv
        if (b.includes('backup')) return false;
        // Alles andere zählt als aktiv
        return true;
    });
    
    // Kategorisierung nach Typ
    const featureBranches = activeBranches.filter(b => b.startsWith('feature/'));
    const bugfixBranches = activeBranches.filter(b => b.startsWith('bugfix/'));
    const fixBranches = activeBranches.filter(b => b.startsWith('fix/'));
    const testBranches = activeBranches.filter(b => b.startsWith('test/'));
    const otherBranches = activeBranches.filter(b => 
        !b.startsWith('feature/') && 
        !b.startsWith('bugfix/') && 
        !b.startsWith('fix/') && 
        !b.startsWith('test/')
    );
    
    return {
        local: localBranches,
        remote: remoteBranches,
        all: allUniqueBranches,
        localOnly,
        remoteOnly,
        inBoth,
        active: activeBranches,
        feature: featureBranches,
        bugfix: bugfixBranches,
        fix: fixBranches,
        test: testBranches,
        other: otherBranches
    };
}

// Status-Command mit GitHub API
async function showStatus() {
    const issues = loadJSON(ISSUES_FILE);
    const prs = loadJSON(PRS_FILE);
    const memory = loadJSON(MEMORY_FILE, {});
    const currentBranch = getCurrentBranch();
    const gitStatus = getGitStatus();
    
    // Remote Branches von GitHub holen
    const remoteBranches = await fetchRemoteStatus();
    const branches = analyzeBranches(remoteBranches);
    
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
    const openIssues = issues.filter(i => i.status !== 'closed').length;
    const criticalIssues = issues.filter(i => i.priority === 'critical').length;
    const openPRs = prs.filter(pr => pr.status === 'open').length;
    
    console.log(`- ${openIssues} offene Issues (davon ${colors.red}${criticalIssues} kritisch${colors.reset})`);
    console.log(`- ${colors.cyan}${branches.active.length}${colors.reset} aktive Feature-Branches (${branches.all.length} total)`);
    console.log(`  └─ ${branches.local.length} lokal, ${colors.green}${branches.remote.length} auf GitHub${colors.reset}`);
    console.log(`- ${openPRs} offene Pull Requests`);
    
    // Branch-Synchronisation
    if (branches.localOnly.length > 0 || branches.remoteOnly.length > 0) {
        console.log(`\n${colors.yellow}⚠️  Branch-Synchronisation:${colors.reset}`);
        
        if (branches.localOnly.length > 0) {
            console.log(`- ${branches.localOnly.length} Branches nur lokal (nicht auf GitHub):`);
            branches.localOnly.slice(0, 5).forEach(b => 
                console.log(`  ${colors.yellow}→ ${b}${colors.reset}`)
            );
            if (branches.localOnly.length > 5) {
                console.log(`  ${colors.dim}... und ${branches.localOnly.length - 5} weitere${colors.reset}`);
            }
        }
        
        if (branches.remoteOnly.length > 0) {
            console.log(`- ${branches.remoteOnly.length} Branches nur auf GitHub (nicht lokal):`);
            branches.remoteOnly.slice(0, 5).forEach(b => 
                console.log(`  ${colors.blue}→ ${b}${colors.reset}`)
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
    console.log(`\n${colors.bright}🔗 Branch-Beziehungen:${colors.reset}`);
    
    // Zeige aktuelle Branch-Beziehung
    const currentBranchData = memory[currentBranch];
    if (currentBranchData && currentBranchData.issue) {
        const issue = issues.find(i => i.id === currentBranchData.issue);
        const pr = prs.find(p => p.branch === currentBranch);
        
        let status = `- ${colors.green}${currentBranch} (AKTUELL)${colors.reset}`;
        status += ` → Issue ${currentBranchData.issue}`;
        if (issue) {
            status += ` ("${issue.title.substring(0, 30)}...")`;
        }
        
        if (pr && pr.status === 'open') {
            status += ` → ${colors.cyan}PR offen${colors.reset}`;
        } else {
            status += ` → ${colors.yellow}kein PR${colors.reset}`;
        }
        
        console.log(status);
    }
    
    // Zeige andere aktive Branches
    const activeBranchesWithIssues = branches.active
        .filter(b => memory[b]?.issue)
        .slice(0, 5);
    
    activeBranchesWithIssues.forEach(branch => {
        if (branch !== currentBranch) {
            const data = memory[branch];
            const inLocal = branches.local.includes(branch);
            const inRemote = branches.remote.includes(branch);
            
            let status = `- ${branch}`;
            if (!inRemote) status = `- ${colors.yellow}${branch} (nur lokal)${colors.reset}`;
            else if (!inLocal) status = `- ${colors.blue}${branch} (nur GitHub)${colors.reset}`;
            
            if (data.issue) {
                status += ` → Issue ${data.issue}`;
            }
            
            console.log(status);
        }
    });
    
    // Empfehlung
    console.log(`\n${colors.bright}✅ Empfehlung:${colors.reset}`);
    
    if (gitStatus.hasChanges) {
        console.log(`${colors.yellow}1. Uncommitted Changes committen oder stashen${colors.reset}`);
        console.log(`   ${colors.cyan}→ git add . && git commit -m "WIP"${colors.reset}`);
    }
    
    if (branches.localOnly.length > 0) {
        const unpushed = branches.localOnly.find(b => b.startsWith('bugfix/') || b.startsWith('feature/'));
        if (unpushed) {
            console.log(`${colors.yellow}2. Branch zu GitHub pushen:${colors.reset}`);
            console.log(`   ${colors.cyan}→ git push --set-upstream origin ${unpushed}${colors.reset}`);
        }
    }
    
    if (currentBranchData?.issue) {
        const issue = issues.find(i => i.id === currentBranchData.issue);
        if (issue) {
            console.log(`3. Weiterarbeiten an Issue ${currentBranchData.issue}: "${issue.title}"`);
        }
    }
    
    console.log('');
}

// CLI Entry Point
const command = process.argv[2];

if (command === 'status' || !command) {
    showStatus().catch(error => {
        console.error(`${colors.red}Fehler: ${error.message}${colors.reset}`);
        process.exit(1);
    });
} else if (command === 'sync') {
    console.log('Sync-Funktion noch nicht implementiert in API-Version');
} else {
    console.log('Usage: node context-tracker-api.js [status|sync]');
}