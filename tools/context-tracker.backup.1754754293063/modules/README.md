# Context-Tracker Advanced Modules

## 📁 Projektstruktur (7-1 Pattern)

```
modules/
├── index.js           # Haupt-Export-Datei
├── base/             # Grundlegende Utilities
├── collectors/       # Phase 1: Datensammlung
│   └── git-data-collector.js
├── analyzers/        # Phase 2: Analyse-Logik  
│   └── advanced-analyzer.js
├── engines/          # Phase 3: Empfehlungs-Engine (TODO)
├── helpers/          # Hilfsfunktionen
├── models/           # Datenmodelle
└── config/           # Konfiguration
    └── config.json   # Zentrale Konfiguration mit Kommentaren
```

## 🚀 Verwendung

### Import in bestehenden Code:

```javascript
// In branch-issue-analyzer.js oder context-tracker.js
const advancedModules = require('./modules');

// Zugriff auf Git-Collector
const branchData = advancedModules.git.collectBranchData('feature/my-branch');

// Zugriff auf Analyzer
const staleBranches = advancedModules.analyzer.detectStaleBranches(branches);

// Komplette Analyse
const analysis = advancedModules.analyze({
    branches: localBranches,
    issues: githubIssues,
    currentBranch: 'feature/issue-123'
});
```

### Schnell-Check für aktuellen Branch:

```javascript
const quickCheck = advancedModules.quickBranchCheck();
console.log(quickCheck.context.recommendations);
```

## ✅ Phase 1: Git Data Collector (FERTIG)

Sammelt erweiterte Git-Informationen:

- `getBranchAge(branch)` - Alter in Tagen
- `getBranchLastCommitDate(branch)` - Letzter Commit
- `getDaysSinceLastCommit(branch)` - Tage seit letztem Commit
- `getBranchCommitCount(branch)` - Anzahl Commits
- `getBranchAheadBehind(branch)` - Ahead/Behind Status
- `getBranchChangedFiles(branch)` - Geänderte Dateien
- `getBranchStats(branch)` - Additions/Deletions
- `compareBranchActivity(branch1, branch2)` - Vergleich

## ✅ Phase 2: Advanced Analyzer (FERTIG)

Intelligente Analyse-Funktionen:

- `detectStaleBranches(branches, threshold)` - Veraltete Branches
- `analyzeDuplicateBranches(duplicates)` - Duplikat-Analyse
- `detectOrphanedBranches(branches, issues)` - Verwaiste Branches
- `analyzeCurrentBranchContext(branch)` - Kontext-Analyse
- `detectPriorityConflicts(currentWork, openIssues)` - Prioritätskonflikte

## 🔧 Konfiguration

Die `config/config.json` enthält alle Einstellungen mit ausführlichen Kommentaren:

- **staleThresholdDays**: Wann gilt ein Branch als veraltet
- **duplicateResolution**: Wie werden Duplikate bewertet
- **orphanedBranches**: Umgang mit verwaisten Branches
- **issuePriorities**: Prioritätsstufen
- **progressMetrics**: Fortschritts-Schwellenwerte
- **warnings**: Warnstufen
- **automation**: Automatisierungs-Optionen

## 📝 TODO: Phase 3 - Recommendation Engine

Die Empfehlungs-Engine wird in `engines/recommendation-engine.js` implementiert und generiert konkrete Handlungsempfehlungen mit Git-Commands.

## 🧪 Testing

```bash
# Test mit Demo-Daten
node tools/context-tracker/modules/test-advanced.js

# Integration testen
cn status --advanced
```
