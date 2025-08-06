/**
 * Recommendation Engine
 * =====================
 * Generiert konkrete Handlungsempfehlungen mit Git-Commands
 * 
 * Phase 3 der Advanced Branch Analysis Implementation
 */

const path = require('path');
const fs = require('fs');

// Lade Konfiguration
let config = {};
try {
    const configPath = path.join(__dirname, '../config/config.json');
    const configContent = fs.readFileSync(configPath, 'utf8');
    const cleanJson = configContent
        .split('\n')
        .filter(line => !line.trim().startsWith('//'))
        .join('\n');
    config = JSON.parse(cleanJson);
} catch (e) {
    config = {
        output: { showEmojis: true, groupByPriority: true, maxRecommendations: 10 }
    };
}

// Recommendation Typen
const RecommendationType = {
    CRITICAL_MISMATCH: 'CRITICAL_MISMATCH',
    DUPLICATE_RESOLUTION: 'DUPLICATE_RESOLUTION', 
    STALE_BRANCH_CLEANUP: 'STALE_BRANCH_CLEANUP',
    ORPHANED_BRANCH: 'ORPHANED_BRANCH',
    UNLINKED_CURRENT: 'UNLINKED_CURRENT',
    FORGOTTEN_CRITICAL: 'FORGOTTEN_CRITICAL',
    READY_FOR_PR: 'READY_FOR_PR',
    NEEDS_REBASE: 'NEEDS_REBASE'
};
/**
 * Generiert Empfehlungen basierend auf Analyse-Ergebnissen
 */
function generateRecommendations(analysisResults) {
    const recommendations = [];
    
    // Verarbeite Stale Branches
    if (analysisResults.staleBranches) {
        analysisResults.staleBranches.forEach(stale => {
            recommendations.push({
                type: RecommendationType.STALE_BRANCH_CLEANUP,
                severity: stale.severity,
                priority: stale.severity === 'critical' ? 1 : 3,
                branch: stale.branch,
                message: `Branch ist seit ${stale.daysSinceLastCommit} Tagen inaktiv (${stale.commitCount} Commits)`,
                command: `git branch -D ${stale.branch}`,
                alternative: stale.commitCount > 5 ? 
                    `Alternativ: Branch reaktivieren mit: git checkout ${stale.branch} && git merge main` : null
            });
        });
    }
    
    // Verarbeite Orphaned Branches
    if (analysisResults.orphanedBranches) {
        analysisResults.orphanedBranches.forEach(orphan => {
            recommendations.push({
                type: RecommendationType.ORPHANED_BRANCH,
                severity: orphan.severity,
                priority: 2,
                branch: orphan.branch,
                message: `Branch verweist auf nicht-existentes Issue ${orphan.referencedIssue} (${orphan.commitCount} Commits)`,
                command: orphan.commitCount > 3 ?
                    `gh issue create -t "Restored: ${orphan.branch}" -b "Branch hatte ${orphan.commitCount} Commits"` :
                    `git branch -D ${orphan.branch}`,
                alternative: orphan.commitCount > 3 ? 
                    `Oder Branch löschen: git branch -D ${orphan.branch}` :
                    `Oder Issue erstellen: gh issue create -t "${orphan.branch}"`
            });
        });
    }
    // Verarbeite Current Branch Context
    if (analysisResults.currentBranchContext) {
        const context = analysisResults.currentBranchContext;
        
        if (context.recommendations) {
            context.recommendations.forEach(rec => {
                if (rec.type === 'UNLINKED_CURRENT') {
                    recommendations.push({
                        type: RecommendationType.UNLINKED_CURRENT,
                        severity: 'high',
                        priority: 0,
                        branch: context.branch,
                        message: rec.message,
                        command: `gh issue create -t "${context.branch}" -b "Arbeit an: ${context.workSummary.description}"`,
                        alternative: 'Oder wechsle zu einem Issue-Branch'
                    });
                } else if (rec.type === 'READY_FOR_PR') {
                    recommendations.push({
                        type: RecommendationType.READY_FOR_PR,
                        severity: 'info',
                        priority: 4,
                        branch: context.branch,
                        message: rec.message,
                        command: rec.action
                    });
                }
            });
        }
        
        // Prüfe auf Rebase-Bedarf
        if (context.aheadBehind && context.aheadBehind.behind > 20) {
            recommendations.push({
                type: RecommendationType.NEEDS_REBASE,
                severity: 'medium',
                priority: 2,
                branch: context.branch,
                message: `Branch ist ${context.aheadBehind.behind} Commits behind main`,
                command: `git checkout ${context.branch} && git rebase main`,
                alternative: `Oder merge: git merge main`
            });
        }
    }
    // Verarbeite Priority Conflicts
    if (analysisResults.priorityConflicts) {
        analysisResults.priorityConflicts.forEach(conflict => {
            recommendations.push({
                type: RecommendationType.CRITICAL_MISMATCH,
                severity: conflict.severity,
                priority: 0,
                message: `Du arbeitest an ${conflict.currentWork.priority} während ${conflict.higherPriorityIssue.priority} Issue ${conflict.higherPriorityIssue.id} wartet`,
                command: conflict.action,
                issueInfo: conflict.higherPriorityIssue
            });
        });
    }
    
    // Verarbeite Duplicate Branches
    if (analysisResults.duplicates) {
        analysisResults.duplicates.forEach(dup => {
            recommendations.push({
                type: RecommendationType.DUPLICATE_RESOLUTION,
                severity: dup.severity,
                priority: 2,
                message: `Issue ${dup.issueId} hat ${dup.duplicates.length + 1} Branches`,
                primaryBranch: dup.primaryBranch,
                duplicates: dup.duplicates,
                command: dup.recommendation,
                analysis: dup.analysis
            });
        });
    }
    
    // Sortiere nach Priorität
    recommendations.sort((a, b) => a.priority - b.priority);
    
    // Limitiere auf maxRecommendations
    const maxRecs = config.output?.maxRecommendations || 10;
    
    return recommendations.slice(0, maxRecs);
}
/**
 * Formatiert Empfehlungen für die Ausgabe
 */
function formatRecommendations(recommendations) {
    if (!recommendations || recommendations.length === 0) {
        return '\n✅ Keine kritischen Probleme gefunden!';
    }
    
    const useEmojis = config.output?.showEmojis !== false;
    const groupByPriority = config.output?.groupByPriority !== false;
    
    let output = [];
    
    // Gruppiere nach Severity wenn gewünscht
    const groups = {
        critical: [],
        high: [],
        medium: [],
        low: [],
        info: []
    };
    
    recommendations.forEach(rec => {
        const severity = rec.severity || 'medium';
        groups[severity].push(rec);
    });
    
    // Critical & High Priority
    if (groups.critical.length > 0 || groups.high.length > 0) {
        output.push(useEmojis ? '\n🚨 KRITISCHE SITUATION:' : '\n[KRITISCH]:');
        [...groups.critical, ...groups.high].forEach((rec, idx) => {
            output.push(formatSingleRecommendation(rec, idx + 1, useEmojis));
        });
    }
    
    // Medium Priority
    if (groups.medium.length > 0) {
        output.push(useEmojis ? '\n⚠️  AUFRÄUMEN ERFORDERLICH:' : '\n[WARNUNG]:');
        groups.medium.forEach((rec, idx) => {
            const startIdx = groups.critical.length + groups.high.length + 1;
            output.push(formatSingleRecommendation(rec, startIdx + idx, useEmojis));
        });
    }
    // Info & Low Priority
    if (groups.info.length > 0 || groups.low.length > 0) {
        output.push(useEmojis ? '\n📊 FORTSCHRITT & NÄCHSTE SCHRITTE:' : '\n[INFO]:');
        [...groups.low, ...groups.info].forEach((rec, idx) => {
            const startIdx = groups.critical.length + groups.high.length + groups.medium.length + 1;
            output.push(formatSingleRecommendation(rec, startIdx + idx, useEmojis));
        });
    }
    
    return output.join('\n');
}

/**
 * Formatiert eine einzelne Empfehlung
 */
function formatSingleRecommendation(rec, index, useEmojis = true) {
    let output = [`\n${index}. ${rec.message}`];
    
    if (rec.command) {
        const arrow = useEmojis ? '   →' : '   >';
        output.push(`${arrow} ${rec.command}`);
    }
    
    if (rec.alternative) {
        const alt = useEmojis ? '   ↪' : '   ALT:';
        output.push(`${alt} ${rec.alternative}`);
    }
    
    // Zusätzliche Details für Duplikate
    if (rec.type === RecommendationType.DUPLICATE_RESOLUTION && rec.analysis) {
        output.push(`   Primary: ${rec.primaryBranch} (${rec.analysis.primary.commits} commits, ${rec.analysis.primary.lastActivity})`);
        rec.analysis.duplicates.forEach(dup => {
            output.push(`   Duplicate: ${dup.name} (${dup.commits} commits, ${dup.lastActivity})`);
        });
    }
    
    return output.join('\n');
}
// Exportiere Funktionen
module.exports = {
    RecommendationType,
    generateRecommendations,
    formatRecommendations,
    
    // Hauptfunktion für einfache Verwendung
    processAnalysis: function(analysisResults) {
        const recommendations = generateRecommendations(analysisResults);
        return {
            recommendations,
            formatted: formatRecommendations(recommendations),
            count: recommendations.length,
            hasCritical: recommendations.some(r => r.severity === 'critical')
        };
    }
};
