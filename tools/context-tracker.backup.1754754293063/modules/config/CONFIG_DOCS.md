# Context-Tracker Konfiguration

## Branch-Verwaltung

- **staleThresholdDays** (Standard: 30)
  - Anzahl Tage ohne Commits, nach der ein Branch als 'veraltet' gilt
  - Empfehlung: 30 Tage für aktive Projekte, 60 für langsamere Projekte

- **criticalStaleThresholdDays** (Standard: 14)
  - Branches mit CRITICAL Issues werden schneller als veraltet markiert
  - Grund: Kritische Issues sollten nicht lange unbearbeitet bleiben

## Duplikat-Branch Bewertung

- **duplicateResolution.weightCommitCount** (Standard: 0.7)
  - Wie stark zählt die Anzahl der Commits (70%)

- **duplicateResolution.weightRecency** (Standard: 0.3)  
  - Wie stark zählt die Aktualität des letzten Commits (30%)

- **duplicateResolution.autoMergeThreshold** (Standard: 0.8)
  - Ab diesem Score (0.8 = 80%) wird automatisches Mergen empfohlen

- **duplicateResolution.minCommitDifference** (Standard: 3)
  - Mindestunterschied in Commits für eindeutige Empfehlung

## Verwaiste Branches

- **orphanedBranches.action** (Standard: "prompt")
  - Mögliche Werte: 'prompt' (nachfragen), 'delete' (löschen), 'create-issue' (Issue erstellen)

- **orphanedBranches.issuePrefix** (Standard: "Restored: ")
  - Prefix für automatisch erstellte Issues aus verwaisten Branches

- **orphanedBranches.gracePeriodDays** (Standard: 7)
  - Tage nach Issue-Löschung bevor Branch als 'orphaned' gilt
  - Grund: Manchmal werden Issues versehentlich gelöscht

## Issue-Prioritäten

Höhere Zahlen = höhere Priorität

- **CRITICAL**: 4 - Produktionsausfälle, Sicherheitslücken, Datenverlust
- **HIGH**: 3 - Wichtige Features, größere Bugs die Nutzer blockieren  
- **MEDIUM**: 2 - Standard-Features und normale Bugs
- **LOW**: 1 - Nice-to-have Features, kosmetische Verbesserungen
- **NONE**: 0 - Keine Priorität gesetzt (Standard)

## Branch-Fortschritts-Metriken

### Ready for PR Schwellenwerte:
- **minCommits**: 3 - Mindestanzahl Commits für PR-Bereitschaft
- **minChangedFiles**: 1 - Mindestanzahl geänderter Dateien
- **minLinesChanged**: 50 - Mindestanzahl geänderter Zeilen

### Significant Progress:
- **commits**: 10 - Ab dieser Anzahl gilt ein Branch als 'significant progress'
- **linesChanged**: 200 - Alternative: Diese Anzahl Zeilen reicht auch aus

## Warnungen

- **unlinkedBranchCommitThreshold** (Standard: 5)
  - Warnung wenn unverknüpfter Branch mehr als X Commits hat

- **multipleBranchesPerIssueThreshold** (Standard: 2)
  - Warnung wenn mehr als X Branches auf dasselbe Issue zeigen

- **priorityMismatchLevels** (Standard: 2)
  - Warnstufe: Arbeite an LOW während CRITICAL offen (2 Level Unterschied)

## Automatisierung

- **enabled**: false - Aktiviert automatische Aktionen (mit Vorsicht nutzen!)
- **autoDeleteStaleBranches**: false - Automatisches Löschen veralteter Branches
- **autoCreateIssuesForOrphans**: false - Automatisch Issues für verwaiste Branches erstellen  
- **requireConfirmation**: true - Bestätigung vor automatischen Aktionen erforderlich

## Ausgabe-Formatierung

- **showEmojis**: true - Emojis in der Ausgabe anzeigen (🚨 ⚠️ ✅ etc.)
- **verboseMode**: false - Ausführliche Ausgabe mit allen Details
- **groupByPriority**: true - Empfehlungen nach Priorität gruppieren
- **maxRecommendations**: 10 - Maximale Anzahl angezeigter Empfehlungen
