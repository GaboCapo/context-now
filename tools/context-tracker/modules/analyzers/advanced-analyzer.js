/**
 * Advanced Branch Analyzer
 * ========================
 * Erweiterte Analyse-Logik für Branch-Management
 * 
 * Phase 2 der Advanced Branch Analysis Implementation
 */

const fs = require('fs');
const path = require('path');
const gitCollector = require('../collectors/git-data-collector');

// Lade Konfiguration
const configPath = path.join(__dirname, '../config/config.json');
let config = {};

try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    // Entferne Kommentar-Zeilen aus der JSON
    const cleanJson = configContent
        .split('\n')
        .filter(line => !line.trim().startsWith('//'))
        .join('\n');
    config = JSON.parse(cleanJson);
} catch (e) {
    console.error('⚠️  Konnte config.json nicht laden, nutze Defaults:', e.message);
    // Fallback zu Default-Werten
    config = {
        staleThresholdDays: 30,
        criticalStaleThresholdDays: 14,
        duplicateResolution: {
            weightCommitCount: 0.7,
            weightRecency: 0.3,
            minCommitDifference: 3
        }
    };
}
/**
 * Erkennt veraltete (stale) Branches
 * @param {Array} branches - Liste der Branch-Namen
 * @param {number} threshold - Schwellenwert in Tagen (optional)
 * @returns {Array} Liste veralteter Branches mit Details
 */
function detectStaleBranches(branches, threshold = null) {
    const staleThreshold = threshold || config.staleThresholdDays || 30;
    const staleBranches = [];
    
    branches.forEach(branch => {
        const daysSinceCommit = gitCollector.getDaysSinceLastCommit(branch);
        
        if (daysSinceCommit >= staleThreshold) {
            const branchData = gitCollector.collectBranchData(branch);
            staleBranches.push({
                branch,
                daysSinceLastCommit: daysSinceCommit,
                lastCommitDate: branchData.lastCommitDate,
                commitCount: branchData.commitCount,
                severity: daysSinceCommit > staleThreshold * 2 ? 'critical' : 'warning',
                recommendation: daysSinceCommit > staleThreshold * 2 ?
                    `Branch ist ${daysSinceCommit} Tage inaktiv → Dringend löschen oder reaktivieren` :
                    `Branch ist ${daysSinceCommit} Tage inaktiv → Prüfen und ggf. löschen`
            });
        }
    });
    
    return staleBranches.sort((a, b) => b.daysSinceLastCommit - a.daysSinceLastCommit);
}
/**
 * Analysiert Duplikat-Branches (mehrere Branches für dasselbe Issue)
 * @param {Object} duplicates - Map von Issue-ID zu Branch-Array
 * @returns {Array} Analyse-Ergebnisse mit Empfehlungen
 */
function analyzeDuplicateBranches(duplicates) {
    const results = [];
    
    Object.entries(duplicates).forEach(([issueId, branches]) => {
        if (branches.length < 2) return;
        
        // Sammle Daten für alle Branches
        const branchesData = branches.map(branch => ({
            name: branch,
            ...gitCollector.collectBranchData(branch)
        }));
        
        // Sortiere nach Score (Commits * weight + Recency * weight)
        const commitWeight = config.duplicateResolution?.weightCommitCount || 0.7;
        const recencyWeight = config.duplicateResolution?.weightRecency || 0.3;
        
        branchesData.forEach(data => {
            const recencyScore = Math.max(0, 100 - data.daysSinceLastCommit);
            data.score = (data.commitCount * commitWeight * 10) + (recencyScore * recencyWeight);
        });
        
        branchesData.sort((a, b) => b.score - a.score);
        
        const primary = branchesData[0];
        const duplicatesToMerge = branchesData.slice(1);
        
        results.push({
            issueId,
            primaryBranch: primary.name,
            duplicates: duplicatesToMerge.map(d => d.name),
            analysis: {
                primary: {
                    name: primary.name,
                    commits: primary.commitCount,
                    lastActivity: primary.daysSinceLastCommit + ' Tage',
                    score: primary.score.toFixed(1)
                },                duplicates: duplicatesToMerge.map(d => ({
                    name: d.name,
                    commits: d.commitCount,
                    lastActivity: d.daysSinceLastCommit + ' Tage',
                    score: d.score.toFixed(1)
                }))
            },
            recommendation: duplicatesToMerge.map(dup => 
                `git checkout ${primary.name} && git merge ${dup.name} && git branch -D ${dup.name}`
            ).join('\n'),
            severity: duplicatesToMerge.some(d => d.commitCount > 5) ? 'high' : 'medium'
        });
    });
    
    return results;
}

/**
 * Erkennt verwaiste Branches (Branches die auf nicht-existente Issues verweisen)
 * @param {Array} branches - Liste der Branch-Namen
 * @param {Array} issues - Liste der existierenden Issues
 * @returns {Array} Liste verwaister Branches
 */
function detectOrphanedBranches(branches, issues) {
    const issueIds = new Set(issues.map(i => i.id || `#${i.number}`));
    const orphaned = [];
    
    branches.forEach(branch => {
        // Extrahiere Issue-Nummer aus Branch-Name (importiere die Funktion)
        const issueRef = extractIssueFromBranchName(branch);
        
        if (issueRef && !issueIds.has(issueRef)) {
            const branchData = gitCollector.collectBranchData(branch);
            
            orphaned.push({
                branch,
                referencedIssue: issueRef,
                commitCount: branchData.commitCount,
                lastActivity: branchData.daysSinceLastCommit,
                changedFiles: branchData.changedFiles,                recommendation: branchData.commitCount > 3 ?
                    `Branch hat ${branchData.commitCount} Commits → Issue wiederherstellen: gh issue create -t "Restored: ${branch}"` :
                    `Branch hat nur ${branchData.commitCount} Commits → Löschen: git branch -D ${branch}`,
                severity: branchData.commitCount > 5 ? 'high' : 'medium'
            });
        }
    });
    
    return orphaned;
}

/**
 * Hilfsfunktion: Extrahiert Issue-Nummer aus Branch-Namen
 * (Kopie aus branch-issue-analyzer.js - sollte später importiert werden)
 */
function extractIssueFromBranchName(branchName) {
    const patterns = [
        /issue[- ](\d+)/i,
        /^(?:feature|bugfix|fix|hotfix)\/(\d+)-/,
        /^(?:feature|bugfix|fix|hotfix)\/#(\d+)/,
        /[A-Z]+-(\d+)/,
        /#(\d+)/
    ];
    
    for (const pattern of patterns) {
        const match = branchName.match(pattern);
        if (match) {
            return `#${match[1]}`;
        }
    }
    
    return null;
}
/**
 * Analysiert den Kontext des aktuellen Branches
 * @param {string} branch - Branch-Name
 * @returns {Object} Analyse des Branch-Kontexts
 */
function analyzeCurrentBranchContext(branch) {
    const branchData = gitCollector.collectBranchData(branch);
    const issueRef = extractIssueFromBranchName(branch);
    
    const context = {
        branch,
        hasIssue: !!issueRef,
        issueRef,
        ...branchData,
        status: determineStatus(branchData),
        workSummary: generateWorkSummary(branchData)
    };
    
    // Generiere Empfehlungen basierend auf Kontext
    const recommendations = [];
    
    if (!issueRef && branchData.commitCount > (config.warnings?.unlinkedBranchCommitThreshold || 5)) {
        recommendations.push({
            type: 'UNLINKED_CURRENT',
            severity: 'high',
            message: `Du hast ${branchData.commitCount} Commits auf unverknüpftem Branch`,
            action: 'Erstelle ein Issue für deine Arbeit oder wechsle zu einem Issue-Branch'
        });
    }
    
    if (branchData.aheadBehind.ahead > 15 && branchData.changedFiles > 10) {
        recommendations.push({
            type: 'READY_FOR_PR',
            severity: 'info',
            message: `Branch ist ${branchData.aheadBehind.ahead} Commits ahead mit ${branchData.changedFiles} geänderten Dateien`,
            action: `gh pr create -B main -H ${branch}`
        });
    }
    
    context.recommendations = recommendations;
    return context;
}
/**
 * Bestimmt den Status eines Branches
 */
function determineStatus(branchData) {
    const { commitCount, daysSinceLastCommit, aheadBehind, stats } = branchData;
    
    if (daysSinceLastCommit > 30) return 'stale';
    if (aheadBehind.ahead > 10 && stats.total > 200) return 'ready-for-pr';
    if (commitCount < 3) return 'in-progress';
    if (aheadBehind.behind > 20) return 'needs-rebase';
    
    return 'active';
}

/**
 * Generiert eine Zusammenfassung der Arbeit
 */
function generateWorkSummary(branchData) {
    const { commitCount, changedFiles, stats, daysSinceLastCommit } = branchData;
    
    return {
        description: `${commitCount} Commits, ${changedFiles} Dateien geändert`,
        linesChanged: `+${stats.additions} / -${stats.deletions} Zeilen`,
        lastActivity: daysSinceLastCommit === 0 ? 'Heute' : 
                      daysSinceLastCommit === 1 ? 'Gestern' : 
                      `vor ${daysSinceLastCommit} Tagen`,
        estimatedProgress: estimateProgress(branchData)
    };
}

/**
 * Schätzt den Fortschritt eines Branches
 */
function estimateProgress(branchData) {
    const { commitCount, stats } = branchData;
    
    if (commitCount < 2) return 'Just started (< 20%)';
    if (commitCount < 5 && stats.total < 100) return 'Early stage (20-40%)';
    if (commitCount < 10 && stats.total < 300) return 'In progress (40-70%)';
    if (commitCount >= 10 || stats.total > 300) return 'Near completion (70-100%)';
    
    return 'Unknown';
}
/**
 * Erkennt Prioritätskonflikte
 * @param {Object} currentWork - Aktuelle Arbeit (Branch + Issue)
 * @param {Array} openIssues - Alle offenen Issues
 * @returns {Array} Liste von Prioritätskonflikten
 */
function detectPriorityConflicts(currentWork, openIssues) {
    const conflicts = [];
    const priorities = config.issuePriorities || {
        CRITICAL: 4,
        HIGH: 3,
        MEDIUM: 2,
        LOW: 1,
        NONE: 0
    };
    
    // Bestimme Priorität der aktuellen Arbeit
    const currentPriority = currentWork.issue?.priority || 'NONE';
    const currentPriorityLevel = priorities[currentPriority] || 0;
    
    // Finde höher priorisierte Issues ohne Branch
    openIssues.forEach(issue => {
        const issuePriority = issue.priority || issue.labels?.find(l => 
            Object.keys(priorities).includes(l.toUpperCase())
        )?.toUpperCase() || 'NONE';
        
        const issuePriorityLevel = priorities[issuePriority] || 0;
        
        // Prüfe ob Issue höhere Priorität hat und keinen aktiven Branch
        if (issuePriorityLevel > currentPriorityLevel && !issue.activeBranch) {
            const levelDifference = issuePriorityLevel - currentPriorityLevel;
            
            if (levelDifference >= (config.warnings?.priorityMismatchLevels || 2)) {
                conflicts.push({
                    type: 'PRIORITY_MISMATCH',
                    severity: issuePriority === 'CRITICAL' ? 'critical' : 'high',
                    currentWork: {
                        branch: currentWork.branch,
                        issue: currentWork.issue?.id,
                        priority: currentPriority
                    },
                    higherPriorityIssue: {
                        id: issue.id || `#${issue.number}`,
                        title: issue.title,
                        priority: issuePriority,
                        age: issue.createdDaysAgo || 0
                    },                    recommendation: `Stoppe Arbeit an ${currentPriority} Issue und wechsle zu ${issuePriority} Issue ${issue.id || `#${issue.number}`}`,
                    action: `git stash && git checkout -b feature/issue-${issue.number || issue.id?.replace('#', '')}`
                });
            }
        }
    });
    
    return conflicts;
}

/**
 * Hauptanalyse-Funktion die alle Analyzer kombiniert
 * @param {Object} options - Analyse-Optionen
 * @returns {Object} Komplette Analyse-Ergebnisse
 */
function runFullAnalysis(options = {}) {
    const { branches = [], issues = [], currentBranch = null, memory = {} } = options;
    
    const analysis = {
        timestamp: new Date().toISOString(),
        summary: {
            totalBranches: branches.length,
            totalIssues: issues.length,
            currentBranch
        },
        staleBranches: detectStaleBranches(branches),
        orphanedBranches: detectOrphanedBranches(branches, issues),
        currentBranchContext: currentBranch ? analyzeCurrentBranchContext(currentBranch) : null,
        duplicates: null, // Muss von außen mit Duplikat-Map aufgerufen werden
        priorityConflicts: null // Muss mit currentWork Objekt aufgerufen werden
    };
    
    // Statistiken
    analysis.statistics = {
        staleCount: analysis.staleBranches.length,
        orphanedCount: analysis.orphanedBranches.length,
        criticalIssues: analysis.staleBranches.filter(b => b.severity === 'critical').length +
                        analysis.orphanedBranches.filter(b => b.severity === 'high').length
    };
    
    return analysis;
}
// Exportiere alle Funktionen
module.exports = {
    detectStaleBranches,
    analyzeDuplicateBranches,
    detectOrphanedBranches,
    analyzeCurrentBranchContext,
    detectPriorityConflicts,
    runFullAnalysis,
    // Hilfsfunktionen auch exportieren für Tests
    extractIssueFromBranchName,
    determineStatus,
    generateWorkSummary,
    estimateProgress
};
