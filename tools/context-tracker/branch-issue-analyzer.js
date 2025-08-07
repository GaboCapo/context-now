#!/usr/bin/env node

/**
 * Branch-Issue Analyzer
 * Analysiert und verwaltet Beziehungen zwischen Git-Branches und Issues
 */

// Importiere erweiterte Module
const advancedModules = require('./modules');

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
 * Extrahiert Issue-Nummer aus Branch-Namen
 * Unterstützt Formate wie:
 * - feature/issue-123-description
 * - bugfix/123-description
 * - fix/#123-description
 * - feature/PROJECT-123-description (Jira-Style)
 */
function extractIssueFromBranchName(branchName) {
    const patterns = [
        /issue[- ](\d+)/i,           // issue-123 oder issue 123
        /^(?:feature|bugfix|fix|hotfix)\/(\d+)-/,  // feature/123-
        /^(?:feature|bugfix|fix|hotfix)\/#(\d+)/,   // feature/#123
        /[A-Z]+-(\d+)/,              // PROJ-123 (Jira-Style)
        /#(\d+)/                      // #123 anywhere
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
 * Analysiert alle Branches und findet Issue-Verknüpfungen
 */
function analyzeBranchIssueRelations(branches, issues, memory) {
    const relations = {
        verified: [],      // Bestätigte Verknüpfungen aus memory
        detected: [],      // Automatisch erkannte Verknüpfungen
        unlinked: [],      // Branches ohne Issue-Verknüpfung
        duplicates: {},    // Mehrere Branches für dasselbe Issue
        orphaned: []       // Branches mit Issue-Ref, aber Issue existiert nicht
    };
    
    const issueMap = {};
    issues.forEach(issue => {
        issueMap[issue.id] = issue;
    });
    
    // Analysiere jeden Branch
    branches.forEach(branch => {
        const memoryData = memory[branch];
        const detectedIssue = extractIssueFromBranchName(branch);
        
        if (memoryData?.issue) {
            // Verifizierte Verknüpfung aus memory
            relations.verified.push({
                branch,
                issue: memoryData.issue,
                issueData: issueMap[memoryData.issue]
            });
            
            // Track für Duplikate
            if (!relations.duplicates[memoryData.issue]) {
                relations.duplicates[memoryData.issue] = [];
            }
            relations.duplicates[memoryData.issue].push(branch);
            
        } else if (detectedIssue) {
            // Automatisch erkannte Verknüpfung
            if (issueMap[detectedIssue]) {
                relations.detected.push({
                    branch,
                    issue: detectedIssue,
                    issueData: issueMap[detectedIssue]
                });
                
                // Track für Duplikate
                if (!relations.duplicates[detectedIssue]) {
                    relations.duplicates[detectedIssue] = [];
                }
                relations.duplicates[detectedIssue].push(branch);
            } else {
                // Branch referenziert nicht-existierendes Issue
                relations.orphaned.push({
                    branch,
                    issue: detectedIssue
                });
            }
        } else {
            // Keine Verknüpfung gefunden
            relations.unlinked.push(branch);
        }
    });
    
    // Filtere Duplikate (nur Issues mit mehr als einem Branch)
    Object.keys(relations.duplicates).forEach(issueId => {
        if (relations.duplicates[issueId].length <= 1) {
            delete relations.duplicates[issueId];
        }
    });
    
    return relations;
}

/**
 * Findet Issues ohne zugeordnete Branches
 */
function findUnassignedIssues(issues, relations) {
    const assignedIssues = new Set();
    
    // Sammle alle zugeordneten Issues
    relations.verified.forEach(r => assignedIssues.add(r.issue));
    relations.detected.forEach(r => assignedIssues.add(r.issue));
    
    // Finde offene Issues ohne Branch
    return issues.filter(issue => 
        issue.status === 'open' && 
        !assignedIssues.has(issue.id)
    );
}

/**
 * Generiert Empfehlungen basierend auf der Analyse
 */
function generateRecommendations(relations, unassignedIssues, currentBranch) {
    const recommendations = [];
    
    // Warnung bei Duplikaten
    Object.entries(relations.duplicates).forEach(([issueId, branches]) => {
        recommendations.push({
            type: 'warning',
            priority: 'high',
            message: `⚠️  Mehrere Branches für Issue ${issueId}`,
            detail: `Branches: ${branches.join(', ')}`,
            action: `Prüfe, ob alle Branches benötigt werden oder merge/lösche überflüssige`
        });
    });
    
    // Unverknüpfte Branches
    if (relations.unlinked.length > 0) {
        relations.unlinked.forEach(branch => {
            recommendations.push({
                type: 'link',
                priority: 'medium',
                message: `🔗 Branch "${branch}" hat keine Issue-Verknüpfung`,
                action: `cn link "${branch}" oder erstelle ein neues Issue`
            });
        });
    }
    
    // Automatisch erkannte Verknüpfungen bestätigen
    if (relations.detected.length > 0) {
        relations.detected.forEach(({ branch, issue }) => {
            recommendations.push({
                type: 'confirm',
                priority: 'low',
                message: `✨ Erkannte Verknüpfung: "${branch}" → ${issue}`,
                action: `cn confirm-link "${branch}" ${issue}`
            });
        });
    }
    
    // Issues ohne Branch
    unassignedIssues.forEach(issue => {
        const priority = issue.priority === 'critical' ? 'high' : 
                        issue.priority === 'high' ? 'medium' : 'low';
        recommendations.push({
            type: 'create',
            priority,
            message: `📝 Issue ${issue.id} "${issue.title}" hat keinen Branch`,
            action: `git checkout -b ${suggestBranchName(issue)}`
        });
    });
    
    // Verwaiste Branches
    if (relations.orphaned.length > 0) {
        relations.orphaned.forEach(({ branch, issue }) => {
            recommendations.push({
                type: 'cleanup',
                priority: 'low',
                message: `🧹 Branch "${branch}" referenziert nicht-existentes Issue ${issue}`,
                action: `Lösche Branch oder erstelle Issue ${issue}`
            });
        });
    }
    
    // Sortiere nach Priorität
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    return recommendations;
}

/**
 * Schlägt einen Branch-Namen basierend auf Issue vor
 */
function suggestBranchName(issue) {
    const prefix = issue.labels.includes('bug') ? 'bugfix' : 'feature';
    const title = issue.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 30);
    return `${prefix}/issue-${issue.id.replace('#', '')}-${title}`;
}

/**
 * Führt erweiterte Analyse mit den neuen Modulen durch
 */
function runAdvancedAnalysis(branches, issues, memory, currentBranch) {
    // Führe Standard-Analyse durch
    const relations = analyzeBranchIssueRelations(branches, issues, memory);
    
    // Führe erweiterte Analyse durch
    const advancedAnalysis = advancedModules.analyze({
        branches,
        issues,
        currentBranch,
        memory
    });
    
    // Erweitere Duplikate-Analyse
    if (relations.duplicates) {
        const duplicatesArray = [];
        Object.entries(relations.duplicates).forEach(([issueId, branches]) => {
            if (branches.length > 1) {
                duplicatesArray.push({ issueId, branches });
            }
        });
        
        if (duplicatesArray.length > 0) {
            advancedAnalysis.duplicates = advancedModules.analyzer.analyzeDuplicateBranches(
                relations.duplicates
            );
        }
    }
    
    // Generiere erweiterte Empfehlungen
    const recommendations = advancedModules.recommendations.processAnalysis(advancedAnalysis);
    
    // Prüfe auf kritische Issues
    const criticalIssues = issues.filter(i => 
        i.priority === 'critical' && (i.status === 'open' || i.state === 'open')
    );
    const highPriorityIssues = issues.filter(i => 
        i.priority === 'high' && (i.status === 'open' || i.state === 'open')
    );
    
    return {
        relations,
        advanced: advancedAnalysis,
        recommendations: recommendations.formatted,
        hasAdvancedIssues: recommendations.hasCritical || 
                           advancedAnalysis.staleBranches.length > 0 ||
                           advancedAnalysis.orphanedBranches.length > 0 ||
                           criticalIssues.length > 0 ||
                           highPriorityIssues.length > 0,
        criticalIssues,
        highPriorityIssues
    };
}

module.exports = {
    extractIssueFromBranchName,
    analyzeBranchIssueRelations,
    findUnassignedIssues,
    generateRecommendations,
    suggestBranchName,
    runAdvancedAnalysis  // Neue Funktion exportieren
};
