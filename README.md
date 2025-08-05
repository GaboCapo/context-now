# 🎯 Context-Now - Multi-Projekt Management Tool

Ein intelligentes Tool zur zentralen Verwaltung von Projekt-Kontexten, Issues, Branches und Pull Requests über mehrere Projekte hinweg.

## ✨ Features

- **Multi-Projekt Management**: Verwalte mehrere Projekte zentral
- **Symlink-basiert**: Templates und Scripts werden geteilt, Daten bleiben projektspezifisch
- **Intelligente Empfehlungen**: Kontextbewusste Arbeitsempfehlungen basierend auf Issue-Beziehungen
- **Entwickler-Übergabe**: Spezielle Modi für nahtlose Team-Übergaben
- **Git-Integration**: Live-Synchronisation mit lokalen und Remote-Branches

## 🚀 Installation

### 1. Repository klonen
```bash
git clone <repository-url> ~/Code/context-now
cd ~/Code/context-now
```

### 2. Alias einrichten (optional)
```bash
# Füge zu ~/.bashrc oder ~/.zshrc hinzu:
alias cn="/home/commander/Code/context-now/cn"

# Oder direkt ausführbar machen:
chmod +x ~/Code/context-now/cn
```

## 📋 Verwendung

### Projekt verbinden
```bash
cn -c /pfad/zu/deinem/projekt
# oder
~/Code/context-now/cn -c ~/Code/mein-projekt
```

### Projekte auflisten
```bash
cn -l
```

### Zu Projekt wechseln
```bash
cn -g 1                    # Nach Nummer
cn -g persona-nexus-manager # Nach Name
```

### Projekt-Status anzeigen
```bash
cn -s                      # Aktuelles Projekt
cn -s persona-nexus-manager # Spezifisches Projekt
```

### Projekt trennen
```bash
cn -d persona-nexus-manager
```

## 🔧 Was passiert beim Verbinden?

1. **Symlinks werden erstellt**:
   - `context-tracker.js` → Hauptscript (geteilt)
   - `*.template.json` → Templates (geteilt, read-only)

2. **Projekt-spezifische Dateien werden erstellt**:
   - `issues.json` - Deine Issues
   - `prs.json` - Pull Requests
   - `project-memory.json` - Branch-Verknüpfungen
   - `github-branches.json` - GitHub Branch-Liste
   - `issue-relations.json` - Issue-Beziehungen

3. **NPM Scripts werden hinzugefügt**:
   - `npm run context` - Status anzeigen
   - `npm run context:sync` - Repository synchronisieren
   - `npm run context:update` - Sync + Status

## 📂 Struktur

```
context-now/
├── context-now.js         # Multi-Projekt Manager
├── cn                     # Launcher Script
├── projects.json          # Projekt-Registry
└── tools/
    └── context-tracker/
        ├── context-tracker.js    # Hauptscript (geteilt via Symlink)
        ├── *.template.json        # Templates (geteilt)
        └── DATA_SOURCES.md        # Dokumentation
```

Projekte:
```
dein-projekt/
└── tools/
    └── context-tracker/
        ├── context-tracker.js → symlink
        ├── *.template.json → symlinks
        ├── issues.json (projektspezifisch)
        ├── prs.json (projektspezifisch)
        └── ...
```

## 🎯 Beispiel-Workflow

```bash
# 1. Projekt verbinden
cn -c ~/Code/mein-projekt

# 2. Ins Projekt wechseln
cd ~/Code/mein-projekt

# 3. Status checken
npm run context

# 4. JSON-Dateien mit echten Daten füllen
vim tools/context-tracker/issues.json

# 5. Wieder Status checken
npm run context
```

## 🔄 Updates

Wenn das Tool verbessert wird, erhalten alle verbundenen Projekte automatisch die Updates, da sie via Symlinks verbunden sind!

## 📝 JSON-Dateien pflegen

### issues.json
```json
[
  {
    "id": "#123",
    "title": "Feature implementieren",
    "status": "open",
    "priority": "high",
    "labels": ["feature", "frontend"]
  }
]
```

### issue-relations.json (für intelligente Empfehlungen)
```json
{
  "#100": {
    "type": "epic",
    "includes": ["#101", "#102", "#103"],
    "description": "Epic beinhaltet diese Issues"
  }
}
```

## 🤝 Team-Kollaboration

Das Tool unterstützt Entwickler-Übergaben:

```bash
# In deinem Projekt:
npm run context:handover

# Zeigt:
# - Uncommitted Changes
# - Letzter Commit
# - Unfertige Arbeit
# - Nächste Schritte
```

## 📌 Tipps

- **Täglich aktualisieren**: `github-branches.json` mit echten GitHub-Daten
- **Issues pflegen**: Halte `issues.json` aktuell
- **Relations nutzen**: Definiere EPICs und Bug-Beziehungen
- **Symlinks behalten**: Lösche nie die Symlinks, nur die JSON-Daten sind projektspezifisch

---

**Version**: 2.0.0  
**Lizenz**: MIT