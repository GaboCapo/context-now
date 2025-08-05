# 🎯 Context-Tracker Installation Guide

## Für neue Projekte

### 1. Tool in dein Projekt kopieren

```bash
# In dein Projektverzeichnis wechseln
cd /pfad/zu/deinem/projekt

# Context-Tracker Tools kopieren
cp -r /home/commander/Code/context-now/tools .

# Template-Dateien als Basis nehmen
cd tools/context-tracker
cp issues.template.json issues.json
cp prs.template.json prs.json
cp project-memory.template.json project-memory.json

# GitHub Branches Datei erstellen
echo '["main", "develop"]' > github-branches.json

# Issue Relations erstellen (optional)
echo '{}' > issue-relations.json
```

### 2. NPM Scripts hinzufügen

Füge zu deiner `package.json` in die `scripts` Sektion:

```json
"scripts": {
  // ... andere scripts
  "context": "node tools/context-tracker/context-tracker.js status",
  "context:sync": "node tools/context-tracker/context-tracker.js sync",
  "context:update": "node tools/context-tracker/context-tracker.js update"
}
```

### 3. JSON-Dateien mit echten Daten füllen

#### issues.json
```json
[
  {
    "id": "#123",
    "title": "Implement Feature X",
    "status": "open",
    "priority": "high",
    "labels": ["feature", "frontend"]
  }
]
```

#### github-branches.json
Liste der Branches von GitHub (aktualisiere regelmäßig):
```json
[
  "main",
  "develop",
  "feature/awesome-feature",
  "bugfix/critical-fix"
]
```

#### project-memory.json
Branch-zu-Issue Verknüpfungen:
```json
{
  "feature/awesome-feature": {
    "created": "2025-01-01",
    "issue": "#123",
    "lastActivity": "2025-01-15"
  }
}
```

#### issue-relations.json (optional)
Für intelligente Empfehlungen:
```json
{
  "#100": {
    "type": "epic",
    "includes": ["#101", "#102", "#103"],
    "description": "Epic beinhaltet diese Issues"
  }
}
```

### 4. Verwendung

```bash
# Status anzeigen
npm run context

# Repository synchronisieren
npm run context:sync

# Update (sync + status)
npm run context:update
```

## 🔄 Updates aus context-now holen

Wenn das Tool verbessert wurde:

```bash
# Neue Version holen (behält deine JSON-Daten)
cp /home/commander/Code/context-now/tools/context-tracker/context-tracker.js tools/context-tracker/
```

## 📝 Best Practices

1. **Täglich aktualisieren**: `github-branches.json` mit echten GitHub-Daten
2. **Issues pflegen**: `issues.json` aktuell halten
3. **Branch-Memory**: Neue Branches in `project-memory.json` eintragen
4. **Relations nutzen**: EPICs und Bug-Beziehungen in `issue-relations.json`

## 🚨 Wichtig

Die JSON-Dateien sind **projektspezifisch** und sollten NICHT zwischen Projekten geteilt werden!