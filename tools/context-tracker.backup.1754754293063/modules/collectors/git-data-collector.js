/**
 * Git Data Collector
 * ===================
 * Sammelt erweiterte Git-Informationen für Branch-Analyse
 * 
 * Phase 1 der Advanced Branch Analysis Implementation
 */

const { execSync } = require('child_process');
const path = require('path');

/**
 * Führt Git-Befehle aus und fängt Fehler ab
 */
function gitCommand(command, defaultValue = '') {
    try {
        return execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    } catch (e) {
        return defaultValue;
    }
}

/**
 * Ermittelt das Alter eines Branches in Tagen
 * @param {string} branch - Branch-Name
 * @returns {number} Alter in Tagen
 */
function getBranchAge(branch) {
    const firstCommitDate = gitCommand(
        `git log ${branch} --reverse --format=%at | head -1`
    );
    
    if (!firstCommitDate) return 0;
    
    const now = Date.now() / 1000;
    const created = parseInt(firstCommitDate);
    return Math.floor((now - created) / (60 * 60 * 24));
}

/**
 * Ermittelt das Datum des letzten Commits auf einem Branch
 * @param {string} branch - Branch-Name
 * @returns {Date|null} Datum des letzten Commits
 */
function getBranchLastCommitDate(branch) {
    const lastCommitTimestamp = gitCommand(
        `git log -1 --format=%at ${branch}`
    );
    
    if (!lastCommitTimestamp) return null;
    
    return new Date(parseInt(lastCommitTimestamp) * 1000);
}

/**
 * Ermittelt wie viele Tage seit dem letzten Commit vergangen sind
 * @param {string} branch - Branch-Name
 * @returns {number} Tage seit letztem Commit
 */
function getDaysSinceLastCommit(branch) {
    const lastDate = getBranchLastCommitDate(branch);
    if (!lastDate) return Infinity;
    
    const now = new Date();
    const diffMs = now - lastDate;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Zählt die Anzahl der Commits auf einem Branch
 * @param {string} branch - Branch-Name
 * @returns {number} Anzahl der Commits
 */
function getBranchCommitCount(branch) {
    const count = gitCommand(
        `git rev-list --count ${branch}`
    );
    
    return parseInt(count) || 0;
}
/**
 * Ermittelt Ahead/Behind Status eines Branches gegenüber main/master
 * @param {string} branch - Branch-Name
 * @param {string} baseBranch - Basis-Branch (default: main oder master)
 * @returns {Object} { ahead: number, behind: number }
 */
function getBranchAheadBehind(branch, baseBranch = null) {
    // Ermittle Basis-Branch wenn nicht angegeben
    if (!baseBranch) {
        const hasMain = gitCommand('git show-ref --verify refs/heads/main');
        baseBranch = hasMain ? 'main' : 'master';
    }
    
    const stats = gitCommand(
        `git rev-list --left-right --count ${baseBranch}...${branch}`
    );
    
    if (!stats) return { ahead: 0, behind: 0 };
    
    const [behind, ahead] = stats.split('\t').map(n => parseInt(n) || 0);
    return { ahead, behind };
}

/**
 * Ermittelt die Anzahl geänderter Dateien auf einem Branch
 * @param {string} branch - Branch-Name
 * @param {string} baseBranch - Vergleichs-Branch
 * @returns {number} Anzahl geänderter Dateien
 */
function getBranchChangedFiles(branch, baseBranch = null) {
    if (!baseBranch) {
        const hasMain = gitCommand('git show-ref --verify refs/heads/main');
        baseBranch = hasMain ? 'main' : 'master';
    }
    
    const files = gitCommand(
        `git diff --name-only ${baseBranch}...${branch} | wc -l`
    );
    
    return parseInt(files) || 0;
}
/**
 * Ermittelt Zeilen-Statistiken (additions/deletions) für einen Branch
 * @param {string} branch - Branch-Name
 * @param {string} baseBranch - Vergleichs-Branch
 * @returns {Object} { additions: number, deletions: number, total: number }
 */
function getBranchStats(branch, baseBranch = null) {
    if (!baseBranch) {
        const hasMain = gitCommand('git show-ref --verify refs/heads/main');
        baseBranch = hasMain ? 'main' : 'master';
    }
    
    const stats = gitCommand(
        `git diff --shortstat ${baseBranch}...${branch}`
    );
    
    if (!stats) return { additions: 0, deletions: 0, total: 0 };
    
    // Parse: "X files changed, Y insertions(+), Z deletions(-)"
    const additions = parseInt((stats.match(/(\d+) insertion/) || [0, 0])[1]) || 0;
    const deletions = parseInt((stats.match(/(\d+) deletion/) || [0, 0])[1]) || 0;
    
    return {
        additions,
        deletions,
        total: additions + deletions
    };
}

/**
 * Vergleicht die Aktivität zweier Branches
 * @param {string} branch1 - Erster Branch
 * @param {string} branch2 - Zweiter Branch
 * @returns {Object} Detaillierter Vergleich
 */
function compareBranchActivity(branch1, branch2) {
    const data1 = {
        name: branch1,
        lastCommit: getBranchLastCommitDate(branch1),
        daysSinceCommit: getDaysSinceLastCommit(branch1),
        commitCount: getBranchCommitCount(branch1),
        stats: getBranchStats(branch1),
        aheadBehind: getBranchAheadBehind(branch1)
    };    
    const data2 = {
        name: branch2,
        lastCommit: getBranchLastCommitDate(branch2),
        daysSinceCommit: getDaysSinceLastCommit(branch2),
        commitCount: getBranchCommitCount(branch2),
        stats: getBranchStats(branch2),
        aheadBehind: getBranchAheadBehind(branch2)
    };
    
    // Berechne Scores basierend auf Config (später aus config.json laden)
    const commitWeight = 0.7;
    const recencyWeight = 0.3;
    
    const score1 = (data1.commitCount * commitWeight) + 
                   ((100 - Math.min(data1.daysSinceCommit, 100)) * recencyWeight);
    const score2 = (data2.commitCount * commitWeight) + 
                   ((100 - Math.min(data2.daysSinceCommit, 100)) * recencyWeight);
    
    return {
        branch1: data1,
        branch2: data2,
        recommendation: score1 > score2 ? 
            `Keep ${branch1} (Score: ${score1.toFixed(1)}) and merge/delete ${branch2}` :
            `Keep ${branch2} (Score: ${score2.toFixed(1)}) and merge/delete ${branch1}`,
        scores: { [branch1]: score1, [branch2]: score2 }
    };
}

/**
 * Sammelt alle erweiterten Daten für einen Branch
 * @param {string} branch - Branch-Name
 * @returns {Object} Komplettes Branch-Datenprofil
 */
function collectBranchData(branch) {
    return {
        name: branch,
        age: getBranchAge(branch),
        lastCommitDate: getBranchLastCommitDate(branch),
        daysSinceLastCommit: getDaysSinceLastCommit(branch),
        commitCount: getBranchCommitCount(branch),
        aheadBehind: getBranchAheadBehind(branch),
        changedFiles: getBranchChangedFiles(branch),
        stats: getBranchStats(branch)
    };
}
/**
 * Ermittelt alle lokalen Branches
 * @returns {Array<string>} Liste der Branch-Namen
 */
function getAllLocalBranches() {
    const branches = gitCommand('git branch --format="%(refname:short)"');
    return branches.split('\n').filter(b => b.trim());
}

/**
 * Ermittelt den aktuellen Branch
 * @returns {string} Name des aktuellen Branches
 */
function getCurrentBranch() {
    return gitCommand('git branch --show-current');
}

// Exportiere alle Funktionen
module.exports = {
    getBranchAge,
    getBranchLastCommitDate,
    getDaysSinceLastCommit,
    getBranchCommitCount,
    getBranchAheadBehind,
    getBranchChangedFiles,
    getBranchStats,
    compareBranchActivity,
    collectBranchData,
    getAllLocalBranches,
    getCurrentBranch
};
