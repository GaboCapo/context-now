/**
 * Context-Tracker Advanced Modules
 * =================================
 * Zentrale Export-Datei für alle erweiterten Module
 */

// Phase 1: Git Data Collection
const gitCollector = require('./collectors/git-data-collector');

// Phase 2: Advanced Analysis
const analyzer = require('./analyzers/advanced-analyzer');

// Phase 3: Recommendation Engine
const recommendationEngine = require('./engines/recommendation-engine');

// Lade und parse Konfiguration
const fs = require('fs');
const path = require('path');

let config = {};
try {
    const configPath = path.join(__dirname, 'config/config.json');
    const configContent = fs.readFileSync(configPath, 'utf8');
    // Entferne Kommentar-Zeilen
    const cleanJson = configContent
        .split('\n')
        .filter(line => !line.trim().startsWith('//'))
        .join('\n');
    config = JSON.parse(cleanJson);
} catch (e) {
    console.error('⚠️  Konnte config.json nicht laden');
}

/**
 * Haupt-Export mit allen Modulen strukturiert
 */
module.exports = {
    // Konfiguration
    config,
    
    // Git Data Collector (Phase 1)
    git: gitCollector,
    
    // Advanced Analyzer (Phase 2)
    analyzer,
    
    // Recommendation Engine (Phase 3)
    recommendations: recommendationEngine,
    
    // Kombinierte Analyse-Funktion
    analyze: function(options = {}) {
        // Erweitere Options mit Git-Daten wenn nicht vorhanden
        if (!options.branches && !options.skipGitData) {
            options.branches = gitCollector.getAllLocalBranches();
        }
        
        if (!options.currentBranch && !options.skipGitData) {
            options.currentBranch = gitCollector.getCurrentBranch();
        }
        
        const analysisResults = analyzer.runFullAnalysis(options);
        const recommendationResults = recommendationEngine.processAnalysis(analysisResults);
        
        return {
            ...analysisResults,
            recommendations: recommendationResults
        };
    },
    
    // Utility-Funktion für schnelle Branch-Analyse
    quickBranchCheck: function(branchName = null) {
        const branch = branchName || gitCollector.getCurrentBranch();
        return {
            branch,
            data: gitCollector.collectBranchData(branch),
            context: analyzer.analyzeCurrentBranchContext(branch)
        };
    }
};
