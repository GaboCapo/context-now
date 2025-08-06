#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');
const readline = require('readline');

// Branch-Issue Analyzer importieren
const analyzer = require('./branch-issue-analyzer.js');

// Versuche SSH-Modul zu laden (falls vorhanden)
let sshModule = null;
try {
    sshModule = require('./context-tracker-ssh.js');
} catch (e) {
    // SSH-Modul nicht verfügbar
}

// Paths zu den JSON-Dateien - WICHTIG: Verwende process.cwd() für lokale Projekt-Dateien!
const ISSUES_FILE = path.join(process.cwd(), 'tools', 'context-tracker', 'issues.json');
const PRS_FILE = path.join(process.cwd(), 'tools', 'context-tracker', 'prs.json');
const MEMORY_FILE = path.join(process.cwd(), 'tools', 'context-tracker', 'project-memory.json');
const GITHUB_BRANCHES_FILE = path.join(process.cwd(), 'tools', 'context-tracker', 'github-branches.json');
const CLOSED_BRANCHES_FILE = path.join(process.cwd(), 'tools', 'context-tracker', 'closed-branches.json');

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
// JSON speichern
function saveJSON(filepath, data) {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

// Git-Befehl ausführen
function gitCommand(command, defaultValue = '') {
    try {
        return execSync(command, { encoding: 'utf8' }).trim();
    } catch (e) {
        return defaultValue;
    }
}

// GitHub Repo Info extrahieren
function getGitHubInfo() {
    const remoteUrl = gitCommand('git config --get remote.origin.url');
    if (!remoteUrl) return null;
    
    // Parse verschiedene URL-Formate
    let match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
    if (!match) {
        // Versuche SSH-Config Format (z.B. git@github-context-now:owner/repo)
        match = remoteUrl.match(/github-[^:]+:([^/]+)\/([^/.]+)/);
    }
    
    if (match) {
        return {
            owner: match[1],
            repo: match[2]
        };
    }
    return null;
}

// GitHub Issues abrufen
async function fetchGitHubIssues(owner, repo) {
    return new Promise((resolve, reject) => {
        const token = process.env.GITHUB_TOKEN || '';
        
        const options = {
            hostname: 'api.github.com',
            path: `/repos/${owner}/${repo}/issues?state=all&per_page=100`,
            method: 'GET',
            headers: {
                'User-Agent': 'Context-Tracker',
                'Accept': 'application/vnd.github.v3+json'
            }
        };
        
        if (token) {
            options.headers['Authorization'] = `token ${token}`;
        }
        
        https.get(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const issues = JSON.parse(data);
                        const formattedIssues = issues.map(issue => ({
                            id: `#${issue.number}`,
                            title: issue.title,
                            status: issue.state,
                            priority: getPriorityFromLabels(issue.labels),
                            labels: issue.labels.map(l => l.name),
                            assignee: issue.assignee?.login || null,
                            created_at: issue.created_at,
                            updated_at: issue.updated_at,
                            pull_request: !!issue.pull_request
                        })).filter(i => !i.pull_request); // Nur echte Issues, keine PRs
                        resolve(formattedIssues);
                    } catch (e) {
                        reject(e);
                    }
                } else {
                    reject(new Error(`GitHub API: ${res.statusCode}`));
                }
            });
        }).on('error', reject);
    });
}

// Priorität aus Labels extrahieren
function getPriorityFromLabels(labels) {
    const labelNames = labels.map(l => l.name.toLowerCase());
    if (labelNames.some(l => l.includes('critical') || l.includes('urgent'))) return 'critical';
    if (labelNames.some(l => l.includes('high'))) return 'high';
    if (labelNames.some(l => l.includes('medium'))) return 'medium';
    if (labelNames.some(l => l.includes('low'))) return 'low';
    return 'normal';
}
// GitHub Pull Requests abrufen
async function fetchGitHubPRs(owner, repo) {
    return new Promise((resolve, reject) => {
        const token = process.env.GITHUB_TOKEN || '';
        
        const options = {
            hostname: 'api.github.com',
            path: `/repos/${owner}/${repo}/pulls?state=all&per_page=100`,
            method: 'GET',
            headers: {
                'User-Agent': 'Context-Tracker',
                'Accept': 'application/vnd.github.v3+json'
            }
        };
        
        if (token) {
            options.headers['Authorization'] = `token ${token}`;
        }
        
        https.get(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const prs = JSON.parse(data);
                        const formattedPRs = prs.map(pr => ({
                            id: `#${pr.number}`,
                            title: pr.title,
                            status: pr.state,
                            branch: pr.head.ref,
                            base: pr.base.ref,
                            author: pr.user.login,
                            created_at: pr.created_at,
                            updated_at: pr.updated_at,
                            mergeable: pr.mergeable,
                            draft: pr.draft
                        }));
                        resolve(formattedPRs);
                    } catch (e) {
                        reject(e);
                    }
                } else {
                    reject(new Error(`GitHub API: ${res.statusCode}`));
                }
            });
        }).on('error', reject);
    });
}

// GitHub Branches abrufen
async function fetchGitHubBranches(owner, repo) {
    return new Promise((resolve, reject) => {
        const token = process.env.GITHUB_TOKEN || '';
        
        const headers = {
            'User-Agent': 'Context-Tracker',
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
                    reject(new Error('Repository nicht gefunden oder privat (SSH-Key erforderlich)\n  → Richte SSH-Key ein mit: cn -k'));
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
        .map(branch => branch.trim().replace('* ', ''))
        .filter(branch => branch && !branch.includes('HEAD'));
}

// Remote Branches abrufen (mit Fallback)
async function getRemoteBranches() {
    // Option 1: Versuche git fetch für aktuelle Daten (wenn SSH konfiguriert)
    try {
        console.log(`${colors.cyan}  → Versuche git fetch für aktuelle Daten...${colors.reset}`);
        
        // Prüfe erst ob Remote konfiguriert ist
        const remoteCheck = gitCommand('git remote -v', '');
        if (!remoteCheck || !remoteCheck.includes('origin')) {
            throw new Error('Kein Remote-Repository konfiguriert');
        }
        
        // Versuche fetch - ignoriere stderr output
        execSync('git fetch --all --prune 2>/dev/null', { encoding: 'utf8' });
        
        // Hole alle Remote-Branches
        const remoteBranches = gitCommand('git branch -r', '');
        if (remoteBranches) {
            const branches = remoteBranches
                .split('\n')
                .filter(b => b.trim())
                .map(b => b.trim().replace('origin/', ''))
                .filter(b => !b.includes('HEAD'));
            
            if (branches.length > 0) {
                console.log(`${colors.green}  ✓ ${branches.length} Branches via git fetch abgerufen${colors.reset}`);
                // Speichere für Cache
                fs.writeFileSync(GITHUB_BRANCHES_FILE, JSON.stringify(branches, null, 2));
                return branches;
            }
        }
    } catch (error) {
        // Git fetch fehlgeschlagen, versuche andere Methoden
        console.log(`${colors.dim}  → Git fetch fehlgeschlagen, versuche alternative Methoden...${colors.reset}`);
    }
    
    // Option 2: SSH Deploy Key
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
    
    // Option 3: GitHub API
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
            if (error.message.includes('SSH-Key erforderlich')) {
                console.log(`${colors.cyan}  💡 Empfehlung:${colors.reset}`);
                console.log(`     1. Richte SSH-Key ein: ${colors.bright}cn -k${colors.reset}`);
                console.log(`     2. Versuche es dann erneut`);
            }
        }
    }
    
    // Option 4: Cache
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
    
    // Option 5: Git Remote (wahrscheinlich veraltet)
    console.log(`${colors.red}  ⚠️  Verwende lokalen Git-Cache (wahrscheinlich veraltet!)${colors.reset}`);
    console.log(`${colors.cyan}  💡 Für private Repos: Richte SSH-Key ein mit${colors.reset} ${colors.bright}cn -k${colors.reset}`);
    const output = gitCommand('git branch -r', '');
    if (!output) return [];
    
    return output.split('\n')
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
    const all = [...new Set([...localBranches, ...remoteBranches])];
    const active = all.filter(b => 
        !['main', 'master', 'develop', 'staging'].includes(b) &&
        !b.startsWith('backup/')
    );
    
    // Branches die nur lokal existieren
    const localOnly = localBranches.filter(b => !remoteBranches.includes(b));
    // Branches die nur remote existieren
    const remoteOnly = remoteBranches.filter(b => !localBranches.includes(b));
    
    // Neue lokale Branches (noch nicht gepusht)
    const newLocal = localOnly.filter(b => !['main', 'master', 'develop'].includes(b));
    
    // Wahrscheinlich geschlossene Branches (waren mal da, sind jetzt weg)
    const likelyClosed = localBranches.filter(b => 
        closedBranches.includes(b) && 
        !remoteBranches.includes(b)
    );
    
    // Gemergte Branches erkennen
    const mergedOutput = gitCommand('git branch --merged main', '');
    const merged = mergedOutput
        .split('\n')
        .map(b => b.trim().replace('* ', ''))
        .filter(b => b && !['main', 'master', getCurrentBranch()].includes(b));
    
    return {
        all,
        local: localBranches,
        remote: remoteBranches,
        active,
        localOnly,
        remoteOnly,
        newLocal,
        likelyClosed,
        merged
    };
}

// Closed Branches tracken
function updateClosedBranches(localBranches, remoteBranches) {
    let closedBranches = loadJSON(CLOSED_BRANCHES_FILE, []);
    const allCurrentBranches = [...new Set([...localBranches, ...remoteBranches])];
    
    // Füge alle Remote-Branches zu closed hinzu, die wir gesehen haben
    remoteBranches.forEach(branch => {
        if (!closedBranches.includes(branch)) {
            closedBranches.push(branch);
        }
    });
    
    // Speichere aktualisierte Liste
    saveJSON(CLOSED_BRANCHES_FILE, closedBranches);
    
    return closedBranches;
}
// Issues und PRs von GitHub holen
async function updateGitHubData() {
    const githubInfo = getGitHubInfo();
    if (!githubInfo) {
        console.log(`${colors.yellow}  ⚠️  Kein GitHub-Repository erkannt${colors.reset}`);
        // Lade lokale Daten als Fallback
        return { 
            issues: loadJSON(ISSUES_FILE), 
            prs: loadJSON(PRS_FILE) 
        };
    }
    
    let issues = loadJSON(ISSUES_FILE);  // Lade zuerst lokale Issues
    let prs = loadJSON(PRS_FILE);        // Lade zuerst lokale PRs
    
    // Versuche zuerst SSH/Git basierte Methoden (funktioniert mit Deploy-Keys!)
    const useSSH = gitCommand('git remote -v', '').includes('git@');
    
    if (useSSH) {
        try {
            // Versuche Issues über Git zu holen (z.B. mit gh CLI wenn installiert)
            console.log(`${colors.cyan}  → Versuche Issues über Git/SSH...${colors.reset}`);
            
            // Für jetzt: Behalte lokale Issues bei privaten Repos
            if (issues.length > 0) {
                console.log(`${colors.green}  ✓ Verwende ${issues.length} lokale Issues${colors.reset}`);
            } else {
                console.log(`${colors.dim}  → Keine lokalen Issues gefunden${colors.reset}`);
            }
            
            return { issues, prs };
        } catch (e) {
            // Fallback zu API
        }
    }
    
    // Fallback: GitHub API (nur für öffentliche Repos)
    try {
        console.log(`${colors.cyan}  → Hole Issues von GitHub API...${colors.reset}`);
        const githubIssues = await fetchGitHubIssues(githubInfo.owner, githubInfo.repo);
        // Nur bei Erfolg überschreiben
        if (githubIssues && githubIssues.length > 0) {
            issues = githubIssues;
            saveJSON(ISSUES_FILE, issues);
            console.log(`${colors.green}  ✓ ${issues.length} Issues von GitHub abgerufen${colors.reset}`);
        } else if (issues.length > 0) {
            console.log(`${colors.dim}  → Verwende ${issues.length} lokale Issues${colors.reset}`);
        }
    } catch (e) {
        if (e.message.includes('404')) {
            console.log(`${colors.yellow}  ⚠️  Repository ist privat - verwende lokale Issues${colors.reset}`);
        } else {
            console.log(`${colors.yellow}  ⚠️  GitHub API: ${e.message}${colors.reset}`);
        }
        if (issues.length > 0) {
            console.log(`${colors.cyan}  → Verwende ${issues.length} lokale Issues${colors.reset}`);
        }
    }
    
    // Das gleiche für PRs
    try {
        if (!useSSH) {
            console.log(`${colors.cyan}  → Hole Pull Requests von GitHub API...${colors.reset}`);
            const githubPRs = await fetchGitHubPRs(githubInfo.owner, githubInfo.repo);
            if (githubPRs && githubPRs.length > 0) {
                prs = githubPRs;
                saveJSON(PRS_FILE, prs);
                console.log(`${colors.green}  ✓ ${prs.length} Pull Requests von GitHub abgerufen${colors.reset}`);
            }
        }
    } catch (e) {
        // Ignoriere PR-Fehler
    }
    
    return { issues, prs };
}

// Erweiterte Status-Anzeige
async function showStatus() {
    // Erst GitHub-Daten aktualisieren für aktuelle Issues
    console.log(`${colors.cyan}🔄 Prüfe Status...${colors.reset}`);
    
    // GitHub-Daten abrufen (mit Fehlerbehandlung)
    try {
        console.log(`${colors.dim}  → Versuche git fetch für aktuelle Daten...${colors.reset}`);
        gitCommand('git fetch --quiet 2>/dev/null');
        
        const githubData = await updateGitHubData();
        if (githubData && githubData.issues) {
            // Speichere aktualisierte Daten
            saveJSON(ISSUES_FILE, githubData.issues);
            if (githubData.prs) {
                saveJSON(PRS_FILE, githubData.prs);
            }
        }
    } catch (e) {
        console.log(`${colors.dim}  → Verwende lokale Daten (GitHub nicht erreichbar)${colors.reset}`);
    }
    
    // Jetzt die aktualisierten Daten laden
    const issues = loadJSON(ISSUES_FILE);
    const prs = loadJSON(PRS_FILE);
    const memory = loadJSON(MEMORY_FILE, {});
    const currentBranch = getCurrentBranch();
    const gitStatus = getGitStatus();
    
    // Remote Branches holen
    const localBranches = getLocalBranches();
    const remoteBranches = await getRemoteBranches();
    
    // Closed Branches analysieren
    const closedBranches = updateClosedBranches(localBranches, remoteBranches);
    const branches = analyzeBranches(localBranches, remoteBranches, closedBranches);
    
    // PROJEKTÜBERSICHT
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
    
    // STATISTIKEN
    console.log(`\n${colors.bright}📌 Status:${colors.reset}`);
    const openIssues = issues.filter(i => i.status === 'open').length;
    const criticalIssuesCount = issues.filter(i => i.priority === 'critical' && i.status === 'open').length;
    const highIssuesCount = issues.filter(i => i.priority === 'high' && i.status === 'open').length;
    const openPRsCount = prs.filter(pr => pr.status === 'open').length;
    
    console.log(`- ${openIssues} offene Issues (${colors.red}${criticalIssuesCount} kritisch${colors.reset}, ${colors.yellow}${highIssuesCount} hoch${colors.reset})`);
    console.log(`- ${colors.cyan}${branches.active.length}${colors.reset} aktive Branches (${branches.all.length} total)`);
    console.log(`  └─ ${branches.local.length} lokal, ${colors.green}${branches.remote.length} auf GitHub${colors.reset}`);
    console.log(`- ${openPRsCount} offene Pull Requests`);
    
    // DETAILLIERTE ISSUE-LISTE
    if (issues.length > 0 && issues.filter(i => i.status === 'open').length > 0) {
        console.log(`\n${colors.bright}📋 Issues im Detail:${colors.reset}`);
        
        // Kritische Issues
        const criticalIssues = issues.filter(i => i.priority === 'critical' && i.status === 'open');
        if (criticalIssues.length > 0) {
            console.log(`\n${colors.red}🚨 Kritische Issues:${colors.reset}`);
            criticalIssues.forEach(issue => {
                const age = Math.floor((new Date() - new Date(issue.created_at)) / (1000 * 60 * 60 * 24));
                console.log(`  ${colors.red}●${colors.reset} ${issue.id} - ${issue.title}`);
                console.log(`    ${colors.dim}Erstellt vor ${age} Tagen${issue.assignee ? ` • Zugewiesen an: ${issue.assignee}` : ' • Nicht zugewiesen'}${colors.reset}`);
            });
        }
        
        // High Priority Issues
        const highIssues = issues.filter(i => i.priority === 'high' && i.status === 'open');
        if (highIssues.length > 0) {
            console.log(`\n${colors.yellow}⚠️  High Priority Issues:${colors.reset}`);
            highIssues.forEach(issue => {
                const age = Math.floor((new Date() - new Date(issue.created_at)) / (1000 * 60 * 60 * 24));
                console.log(`  ${colors.yellow}●${colors.reset} ${issue.id} - ${issue.title}`);
                console.log(`    ${colors.dim}Erstellt vor ${age} Tagen${issue.assignee ? ` • Zugewiesen an: ${issue.assignee}` : ''}${colors.reset}`);
            });
        }
        
        // Normale Issues (nur erste 5)
        const normalIssues = issues.filter(i => 
            i.status === 'open' && 
            !['critical', 'high'].includes(i.priority)
        ).slice(0, 5);
        
        if (normalIssues.length > 0) {
            console.log(`\n${colors.cyan}📝 Weitere offene Issues:${colors.reset}`);
            normalIssues.forEach(issue => {
                console.log(`  ${colors.cyan}●${colors.reset} ${issue.id} - ${issue.title}`);
            });
            
            const moreCount = issues.filter(i => 
                i.status === 'open' && 
                !['critical', 'high'].includes(i.priority)
            ).length - 5;
            
            if (moreCount > 0) {
                console.log(`  ${colors.dim}... und ${moreCount} weitere${colors.reset}`);
            }
        }
    } else {
        // Keine offenen Issues vorhanden
        const openIssuesCount = issues.filter(i => i.status === 'open').length;
        if (openIssuesCount === 0 && issues.length === 0) {
            console.log(`\n${colors.green}✨ Keine offenen Issues vorhanden${colors.reset}`);
        }
    }
    
    // DETAILLIERTE BRANCH-AUFLISTUNG
    console.log(`\n${colors.bright}🌳 Branches im Detail:${colors.reset}`);
    
    // Aktuelle Branch-Info
    if (currentBranch !== 'main' && currentBranch !== 'master') {
        console.log(`\n${colors.green}Aktueller Branch:${colors.reset}`);
        console.log(`  ➜ ${colors.green}${currentBranch}${colors.reset}`);
        if (memory[currentBranch]?.issue) {
            console.log(`    ${colors.dim}Verknüpft mit Issue ${memory[currentBranch].issue}${colors.reset}`);
        }
    }
    
    // Feature/Bugfix Branches
    const featureBranches = branches.active.filter(b => 
        b.startsWith('feature/') || b.startsWith('bugfix/')
    );
    
    if (featureBranches.length > 0) {
        console.log(`\n${colors.cyan}Feature/Bugfix Branches:${colors.reset}`);
        featureBranches.forEach(branch => {
            const inLocal = branches.local.includes(branch);
            const inRemote = branches.remote.includes(branch);
            let status = '';
            
            if (inLocal && inRemote) {
                status = `${colors.green}✓${colors.reset}`;
            } else if (inLocal && !inRemote) {
                status = `${colors.yellow}⬆${colors.reset}`;  // Needs push
            } else if (!inLocal && inRemote) {
                status = `${colors.blue}⬇${colors.reset}`;   // Needs pull
            }
            
            console.log(`  ${status} ${branch}`);
            
            if (memory[branch]?.issue) {
                const issue = issues.find(i => i.id === memory[branch].issue);
                if (issue) {
                    console.log(`    ${colors.dim}→ Issue ${issue.id}: ${issue.title}${colors.reset}`);
                }
            }
        });
    }
    
    // Andere aktive Branches
    const otherBranches = branches.active.filter(b => 
        !b.startsWith('feature/') && 
        !b.startsWith('bugfix/') &&
        b !== currentBranch
    );
    
    if (otherBranches.length > 0) {
        console.log(`\n${colors.dim}Andere Branches:${colors.reset}`);
        otherBranches.slice(0, 5).forEach(branch => {
            const inLocal = branches.local.includes(branch);
            const inRemote = branches.remote.includes(branch);
            
            if (inLocal && inRemote) {
                console.log(`  ${colors.dim}${branch}${colors.reset}`);
            } else if (inLocal && !inRemote) {
                console.log(`  ${colors.yellow}${branch} (nur lokal)${colors.reset}`);
            } else if (!inLocal && inRemote) {
                console.log(`  ${colors.blue}${branch} (nur GitHub)${colors.reset}`);
            }
        });
        
        if (otherBranches.length > 5) {
            console.log(`  ${colors.dim}... und ${otherBranches.length - 5} weitere${colors.reset}`);
        }
    }
    
    // Branch-Synchronisation
    if (branches.newLocal.length > 0 || branches.remoteOnly.length > 0) {
        console.log(`\n${colors.bright}🔄 Branch-Synchronisation:${colors.reset}`);
        
        if (branches.newLocal.length > 0) {
            console.log(`\n${colors.yellow}📤 Neue lokale Branches (nicht gepusht):${colors.reset}`);
            branches.newLocal.forEach(b => {
                console.log(`  → ${colors.yellow}${b}${colors.reset}`);
            });
        }
        
        if (branches.remoteOnly.length > 0) {
            console.log(`\n${colors.blue}📥 Nur auf GitHub (nicht lokal):${colors.reset}`);
            branches.remoteOnly.slice(0, 5).forEach(b => {
                console.log(`  → ${colors.blue}${b}${colors.reset}`);
            });
            if (branches.remoteOnly.length > 5) {
                console.log(`  ${colors.dim}... und ${branches.remoteOnly.length - 5} weitere${colors.reset}`);
            }
        }
    }
    
    // PULL REQUESTS
    if (prs.length > 0) {
        const openPRs = prs.filter(pr => pr.status === 'open');
        if (openPRs.length > 0) {
            console.log(`\n${colors.bright}🔀 Offene Pull Requests:${colors.reset}`);
            openPRs.forEach(pr => {
                const age = Math.floor((new Date() - new Date(pr.created_at)) / (1000 * 60 * 60 * 24));
                console.log(`  ${colors.magenta}●${colors.reset} PR ${pr.id}: ${pr.title}`);
                console.log(`    ${colors.dim}${pr.branch} → ${pr.base} • Von ${pr.author} • Vor ${age} Tagen${colors.reset}`);
                if (pr.draft) {
                    console.log(`    ${colors.yellow}[DRAFT]${colors.reset}`);
                }
            });
        }
    }
    
    // ERWEITERTE BRANCH-ISSUE ANALYSE
    console.log(`\n${colors.bright}🔗 Branch-Issue Verknüpfungen:${colors.reset}`);
    
    // Analysiere alle Branch-Issue Beziehungen
    const relations = analyzer.analyzeBranchIssueRelations(branches.active, issues, memory);
    const unassignedIssues = analyzer.findUnassignedIssues(issues, relations);
    
    // Zeige Duplikate-Warnung prominent
    if (Object.keys(relations.duplicates).length > 0) {
        console.log(`\n${colors.red}⚠️  WARNUNG: Mehrere Branches für dieselben Issues:${colors.reset}`);
        Object.entries(relations.duplicates).forEach(([issueId, branchList]) => {
            const issue = issues.find(i => i.id === issueId);
            console.log(`  ${colors.yellow}Issue ${issueId}${colors.reset}: "${issue?.title || 'Unbekannt'}"`);
            branchList.forEach(branch => {
                const isCurrent = branch === currentBranch;
                console.log(`    ${isCurrent ? colors.green + '→' : ' '} ${branch}${isCurrent ? ' (AKTUELL)' : ''}${colors.reset}`);
            });
        });
    }
    
    // Zeige verifizierte Verknüpfungen
    if (relations.verified.length > 0) {
        console.log(`\n${colors.green}✓ Verifizierte Verknüpfungen:${colors.reset}`);
        relations.verified.slice(0, 5).forEach(({ branch, issue, issueData }) => {
            const isCurrent = branch === currentBranch;
            const status = issueData ? `[${issueData.priority.toUpperCase()}]` : '';
            console.log(`  ${isCurrent ? colors.green + '→' : ' '} ${branch}${isCurrent ? ' (AKTUELL)' : ''} → ${issue} ${status} "${issueData?.title || 'Unbekannt'}"${colors.reset}`);
        });
        if (relations.verified.length > 5) {
            console.log(`  ${colors.dim}... und ${relations.verified.length - 5} weitere${colors.reset}`);
        }
    }
    
    // Zeige automatisch erkannte Verknüpfungen
    if (relations.detected.length > 0) {
        console.log(`\n${colors.cyan}✨ Automatisch erkannte Verknüpfungen:${colors.reset}`);
        relations.detected.slice(0, 3).forEach(({ branch, issue, issueData }) => {
            console.log(`  ${colors.cyan}?${colors.reset} ${branch} → ${issue} "${issueData?.title || 'Unbekannt'}"`);
            console.log(`    ${colors.dim}→ Bestätigen mit: cn link "${branch}" ${issue}${colors.reset}`);
        });
    }
    
    // Zeige unverknüpfte Branches
    if (relations.unlinked.length > 0) {
        console.log(`\n${colors.yellow}⚠️  Branches ohne Issue-Verknüpfung:${colors.reset}`);
        relations.unlinked.slice(0, 5).forEach(branch => {
            const isCurrent = branch === currentBranch;
            console.log(`  ${colors.yellow}○${colors.reset} ${branch}${isCurrent ? ' (AKTUELL)' : ''}`);
        });
        if (relations.unlinked.length > 5) {
            console.log(`  ${colors.dim}... und ${relations.unlinked.length - 5} weitere${colors.reset}`);
        }
    }
    
    // Zeige Issues ohne Branch
    if (unassignedIssues.length > 0) {
        console.log(`\n${colors.red}📝 Issues ohne Branch:${colors.reset}`);
        unassignedIssues.slice(0, 5).forEach(issue => {
            const priorityColor = issue.priority === 'critical' ? colors.red :
                                 issue.priority === 'high' ? colors.yellow : colors.cyan;
            console.log(`  ${priorityColor}●${colors.reset} ${issue.id} [${issue.priority.toUpperCase()}] "${issue.title}"`);
            const suggestedBranch = analyzer.suggestBranchName(issue);
            console.log(`    ${colors.dim}→ git checkout -b ${suggestedBranch}${colors.reset}`);
        });
    }
    
    // ERWEITERTE EMPFEHLUNGEN
    console.log(`\n${colors.bright}✅ Empfehlungen:${colors.reset}`);
    
    // Prüfe ob EINFACHE Analyse gewünscht ist (Standard ist erweitert)
    const useSimple = process.argv.includes('--simple') || process.argv.includes('-s') || process.argv.includes('--basic');
    
    if (!useSimple) {
        // ERWEITERTE ANALYSE MIT NEUEN MODULEN (STANDARD)
        console.log(`${colors.dim}Analysiere Branch-Situation...${colors.reset}\n`);
        
        const advancedResults = analyzer.runAdvancedAnalysis(
            localBranches,
            issues,
            memory,
            currentBranch
        );
        
        // Zeige erweiterte Empfehlungen
        if (advancedResults.hasAdvancedIssues) {
            console.log(advancedResults.recommendations);
        } else {
            console.log(`${colors.green}✅ Keine kritischen Probleme gefunden!${colors.reset}`);
        }
        
        // Zeige Statistiken
        const stats = advancedResults.advanced.statistics;
        if (stats && (stats.staleCount > 0 || stats.orphanedCount > 0)) {
            console.log(`\n${colors.dim}Statistiken:`);
            if (stats.staleCount > 0) {
                console.log(`  • ${stats.staleCount} veraltete Branches`);
            }
            if (stats.orphanedCount > 0) {
                console.log(`  • ${stats.orphanedCount} verwaiste Branches`);
            }
            if (stats.criticalIssues > 0) {
                console.log(`  • ${colors.red}${stats.criticalIssues} kritische Probleme${colors.dim}`);
            }
            console.log(colors.reset);
        }
    } else {
        // EINFACHE/BASIC EMPFEHLUNGEN (nur wenn explizit gewünscht)
        console.log(`${colors.dim}Verwende vereinfachte Ansicht...${colors.reset}\n`);
        // Generiere Empfehlungen mit dem Analyzer
        const recommendations = analyzer.generateRecommendations(relations, unassignedIssues, currentBranch);
        
        let recommendationCount = 1;
    
    // KRITISCH: Uncommitted Changes haben oberste Priorität
    if (gitStatus.hasChanges) {
        console.log(`${colors.red}${recommendationCount}. ZUERST: Uncommitted Changes committen oder stashen${colors.reset}`);
        console.log(`   ${colors.cyan}→ git add . && git commit -m "WIP: ${currentBranch}"${colors.reset}`);
        console.log(`   ${colors.dim}oder: git stash push -m "WIP ${new Date().toISOString()}"${colors.reset}`);
        recommendationCount++;
    }
    
    // PRIORITÄT 2: Repository synchronisieren
    if (gitStatus.behind > 0 || gitStatus.ahead > 0 || branches.newLocal.length > 0) {
        console.log(`${colors.yellow}${recommendationCount}. Repository synchronisieren:${colors.reset}`);
        if (gitStatus.behind > 0) {
            console.log(`   ${colors.cyan}→ git pull${colors.reset} (${gitStatus.behind} commits behind)`);
        }
        if (gitStatus.ahead > 0) {
            console.log(`   ${colors.cyan}→ git push${colors.reset} (${gitStatus.ahead} commits ahead)`);
        }
        if (branches.newLocal.length > 0) {
            const unpushed = branches.newLocal[0];
            console.log(`   ${colors.cyan}→ git push --set-upstream origin ${unpushed}${colors.reset}`);
            if (branches.newLocal.length > 1) {
                console.log(`   ${colors.dim}(und ${branches.newLocal.length - 1} weitere neue Branches)${colors.reset}`);
            }
        }
        recommendationCount++;
    }
    
    // ANALYZER-BASIERTE EMPFEHLUNGEN
    // Zeige nur die wichtigsten Empfehlungen
    const highPriorityRecs = recommendations.filter(r => r.priority === 'high');
    const mediumPriorityRecs = recommendations.filter(r => r.priority === 'medium');
    
    // Duplikate-Warnungen
    highPriorityRecs.filter(r => r.type === 'warning').forEach(rec => {
        console.log(`${colors.red}${recommendationCount}. ${rec.message}${colors.reset}`);
        console.log(`   ${colors.dim}${rec.detail}${colors.reset}`);
        console.log(`   ${colors.cyan}→ ${rec.action}${colors.reset}`);
        recommendationCount++;
    });
    
    // Kritische Issues ohne Branch
    const criticalUnassigned = unassignedIssues.filter(i => i.priority === 'critical');
    if (criticalUnassigned.length > 0) {
        const issue = criticalUnassigned[0];
        const suggestedBranch = analyzer.suggestBranchName(issue);
        console.log(`${colors.red}${recommendationCount}. KRITISCH: Issue ${issue.id} hat keinen Branch${colors.reset}`);
        console.log(`   "${issue.title}"`);
        console.log(`   ${colors.cyan}→ git checkout -b ${suggestedBranch}${colors.reset}`);
        recommendationCount++;
    }
    
    // Unverknüpfte Branches
    if (relations.unlinked.length > 0 && recommendationCount <= 6) {
        const unlinkedBranch = relations.unlinked.find(b => b === currentBranch) || relations.unlinked[0];
        console.log(`${colors.yellow}${recommendationCount}. Branch "${unlinkedBranch}" mit Issue verknüpfen:${colors.reset}`);
        console.log(`   ${colors.cyan}→ cn link "${unlinkedBranch}"${colors.reset} (interaktive Auswahl)`);
        recommendationCount++;
    }
    
    // Automatisch erkannte Verknüpfungen bestätigen
    if (relations.detected.length > 0 && recommendationCount <= 7) {
        const detected = relations.detected[0];
        console.log(`${colors.cyan}${recommendationCount}. Erkannte Verknüpfung bestätigen:${colors.reset}`);
        console.log(`   ${detected.branch} → ${detected.issue}`);
        console.log(`   ${colors.cyan}→ cn confirm-link "${detected.branch}" ${detected.issue}${colors.reset}`);
        recommendationCount++;
    }
    
    // High Priority Issues ohne Branch
    const highUnassigned = unassignedIssues.filter(i => i.priority === 'high');
    if (highUnassigned.length > 0 && recommendationCount <= 8) {
        const issue = highUnassigned[0];
        const suggestedBranch = analyzer.suggestBranchName(issue);
        console.log(`${colors.yellow}${recommendationCount}. High Priority Issue ${issue.id} bearbeiten:${colors.reset}`);
        console.log(`   "${issue.title}"`);
        console.log(`   ${colors.cyan}→ git checkout -b ${suggestedBranch}${colors.reset}`);
        recommendationCount++;
    }
    
    // Remote Branches auschecken
    const openPRs = prs.filter(pr => pr.status === 'open' && !pr.draft);
    if (openPRs.length > 0) {
        const oldestPR = openPRs.sort((a, b) => 
            new Date(a.created_at) - new Date(b.created_at)
        )[0];
        const age = Math.floor((new Date() - new Date(oldestPR.created_at)) / (1000 * 60 * 60 * 24));
        
        console.log(`${colors.blue}${recommendationCount}. Pull Request ${oldestPR.id} wartet seit ${age} Tagen:${colors.reset}`);
        console.log(`   "${oldestPR.title}"`);
        console.log(`   ${colors.cyan}→ Review durchführen oder mergen${colors.reset}`);
        recommendationCount++;
    }
    
    // PRIORITÄT 6: High Priority Issues
    const highPriorityIssues = issues.filter(i => 
        i.priority === 'high' && 
        i.status === 'open' &&
        !i.assignee
    );
    
    if (highPriorityIssues.length > 0 && recommendationCount <= 5) {
        const issue = highPriorityIssues[0];
        console.log(`${colors.yellow}${recommendationCount}. Als nächstes: Issue ${issue.id} (High Priority)${colors.reset}`);
        console.log(`   "${issue.title}"`);
        console.log(`   ${colors.cyan}→ git checkout -b feature/issue-${issue.id.replace('#', '')}${colors.reset}`);
        recommendationCount++;
    }
    
    // PRIORITÄT 7: Branch Cleanup
    if (branches.merged.length > 3) {
        console.log(`${colors.dim}${recommendationCount}. Branch-Cleanup empfohlen (${branches.merged.length} gemergte Branches):${colors.reset}`);
        console.log(`   ${colors.cyan}→ npm run context:cleanup${colors.reset}`);
        recommendationCount++;
    }
    
    // PRIORITÄT 8: Remote Branches auschecken
    if (branches.remoteOnly.length > 0 && recommendationCount <= 6) {
        const interestingRemote = branches.remoteOnly.find(b => 
            b.startsWith('feature/') || b.startsWith('bugfix/')
        );
        if (interestingRemote) {
            console.log(`${colors.blue}${recommendationCount}. Remote Branch auschecken:${colors.reset}`);
            console.log(`   ${colors.cyan}→ git checkout -b ${interestingRemote} origin/${interestingRemote}${colors.reset}`);
            recommendationCount++;
        }
    }
    
        // Kontext-Zusammenfassung
        if (recommendationCount === 1) {
            console.log(`${colors.green}1. Alles im grünen Bereich! 🎉${colors.reset}`);
            console.log(`   Wähle das nächste Issue aus dem Backlog`);
            console.log(`   ${colors.cyan}→ gh issue list --state open --label "ready"${colors.reset}`);
        }
    } // Ende des else-Blocks für einfache Empfehlungen
    
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
        console.log(`  npm run context:cleanup:force`);
    }
}

// Sync Command
async function syncRepository() {
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
    
    // Update GitHub data
    await updateGitHubData();
    
    console.log(`\n${colors.green}✅ Synchronisation abgeschlossen!${colors.reset}`);
}

// Interaktive Branch-Issue Verknüpfung
async function linkBranchToIssue(branchName) {
    const memory = loadJSON(MEMORY_FILE, {});
    const issues = loadJSON(ISSUES_FILE);
    
    // Wenn kein Branch angegeben, aktuellen Branch verwenden
    if (!branchName) {
        branchName = getCurrentBranch();
    }
    
    console.log(`\n${colors.bright}🔗 Branch-Issue Verknüpfung${colors.reset}`);
    console.log(`Branch: ${colors.cyan}${branchName}${colors.reset}\n`);
    
    // Prüfe ob bereits verknüpft
    if (memory[branchName]?.issue) {
        console.log(`${colors.yellow}⚠️  Branch ist bereits verknüpft mit Issue ${memory[branchName].issue}${colors.reset}`);
        console.log(`Möchtest du die Verknüpfung ändern? (j/n)`);
        
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        const answer = await new Promise(resolve => {
            rl.question('', resolve);
        });
        rl.close();
        
        if (answer.toLowerCase() !== 'j') {
            return;
        }
    }
    
    // Zeige verfügbare Issues
    const openIssues = issues.filter(i => i.status === 'open');
    if (openIssues.length === 0) {
        console.log(`${colors.red}Keine offenen Issues gefunden!${colors.reset}`);
        return;
    }
    
    console.log(`${colors.bright}Verfügbare Issues:${colors.reset}`);
    openIssues.forEach((issue, index) => {
        const priorityColor = issue.priority === 'critical' ? colors.red :
                             issue.priority === 'high' ? colors.yellow : colors.cyan;
        console.log(`  ${colors.bright}${index + 1}.${colors.reset} ${priorityColor}[${issue.priority.toUpperCase()}]${colors.reset} ${issue.id}: ${issue.title}`);
    });
    
    console.log(`\n${colors.cyan}Wähle ein Issue (1-${openIssues.length}) oder 0 zum Abbrechen:${colors.reset}`);
    
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    const choice = await new Promise(resolve => {
        rl.question('', resolve);
    });
    rl.close();
    
    const index = parseInt(choice) - 1;
    if (index < 0 || index >= openIssues.length) {
        console.log(`${colors.yellow}Abgebrochen${colors.reset}`);
        return;
    }
    
    const selectedIssue = openIssues[index];
    
    // Speichere Verknüpfung
    if (!memory[branchName]) {
        memory[branchName] = {};
    }
    memory[branchName].issue = selectedIssue.id;
    memory[branchName].linkedAt = new Date().toISOString();
    memory[branchName].lastActivity = new Date().toISOString();
    
    saveJSON(MEMORY_FILE, memory);
    
    console.log(`\n${colors.green}✅ Branch "${branchName}" wurde mit Issue ${selectedIssue.id} verknüpft!${colors.reset}`);
    console.log(`   "${selectedIssue.title}"`);
}

// Bestätige automatisch erkannte Verknüpfung
function confirmLink(branchName, issueId) {
    const memory = loadJSON(MEMORY_FILE, {});
    
    if (!memory[branchName]) {
        memory[branchName] = {};
    }
    
    memory[branchName].issue = issueId;
    memory[branchName].linkedAt = new Date().toISOString();
    memory[branchName].lastActivity = new Date().toISOString();
    memory[branchName].autoDetected = true;
    
    saveJSON(MEMORY_FILE, memory);
    
    console.log(`${colors.green}✅ Verknüpfung bestätigt: "${branchName}" → ${issueId}${colors.reset}`);
}

// Update Command
async function updateStatus() {
    await syncRepository();
    await showStatus();
}

// CLI Entry Point
const command = process.argv[2] || 'status';
const args = process.argv.slice(3);

switch (command) {
    case 'status':
        // Standard ist jetzt erweiterte Analyse
        showStatus();
        break;
    
    case 'simple':
    case 'basic':
    case 'status:simple':
        // Füge --simple Flag hinzu für einfache Analyse
        process.argv.push('--simple');
        showStatus();
        break;
    
    case 'advanced':
    case 'status:advanced':
        // Für Rückwärtskompatibilität - macht jetzt dasselbe wie status
        showStatus();
        break;
    
    case 'sync':
        syncRepository();
        break;
    
    case 'update':
        updateStatus();
        break;
    
    case 'link':
        linkBranchToIssue(args[0]);
        break;
    
    case 'confirm-link':
        if (args.length < 2) {
            console.log(`${colors.red}Verwendung: cn confirm-link <branch> <issue>${colors.reset}`);
        } else {
            confirmLink(args[0], args[1]);
        }
        break;
    
    case 'cleanup':
        cleanupBranches(true);
        break;
    
    case 'cleanup:force':
        cleanupBranches(false);
        break;
    
    default:
        console.log(`${colors.red}Unbekannter Befehl: ${command}${colors.reset}`);
        console.log('\nVerfügbare Befehle:');
        console.log('  status            - Zeigt erweiterte Analyse mit allen Details (Standard)');
        console.log('  simple            - Zeigt vereinfachte Basis-Empfehlungen');
        console.log('  sync              - Synchronisiert Repository mit Remote');
        console.log('  update            - Sync + Status kombiniert');
        console.log('  link [branch]     - Verknüpft Branch mit Issue (interaktiv)');
        console.log('  confirm-link      - Bestätigt automatisch erkannte Verknüpfung');
        console.log('  cleanup           - Zeigt zu löschende Branches (dry-run)');
        console.log('  cleanup:force     - Löscht merged/geschlossene Branches');
        console.log('\nFlags:');
        console.log('  --simple, -s      - Aktiviert vereinfachte Ansicht');
        console.log('  --basic           - Alias für --simple');
}
