<p align="center">
  <img width="256" height="256" alt="Context-Now Logo" src="https://github.com/user-attachments/assets/ed19b593-2d4f-4372-9ba0-2edb17ce0f52" />
</p>

# 🎯 Context-Now - Git Project Context Tracker

Ein intelligentes Tool zur Verwaltung von Git-Projekt-Kontexten, Issues, Branches und Pull Requests mit automatischer Synchronisation.

## ✨ Features

- **Git-Integration**: Live-Synchronisation mit lokalen und Remote-Branches, automatisches Branch-zu-Issue Mapping
- **Issue & PR Tracking**: Verwalte Issues und Pull Requests direkt aus dem Terminal
- **Intelligente Empfehlungen**: Kontextbewusste Arbeitsempfehlungen basierend auf Issue-Beziehungen
- **Entwickler-Übergabe**: Spezielle Modi für nahtlose Team-Übergaben
- **Multi-Projekt Support**: Verwalte mehrere Git-Projekte mit einem Tool
- **Symlink-basiert**: Templates und Scripts werden geteilt, Daten bleiben projektspezifisch

## 🔧 Git Provider Kompatibilität

| Provider | Status | Hinweise |
|----------|--------|----------|
| GitHub | ✅ Vollständig getestet | Alle Features funktionieren |
| GitLab | 🟠 Nicht getestet | Contributions willkommen! |
| Bitbucket | 🟠 Nicht getestet | Contributions willkommen! |
| Gitea | 🟠 Nicht getestet | Contributions willkommen! |
| Azure DevOps | 🟠 Nicht getestet | Contributions willkommen! |
| AWS CodeCommit | 🟠 Nicht getestet | Contributions willkommen! |
| SourceForge | 🟠 Nicht getestet | Contributions willkommen! |
| Codeberg | 🟠 Nicht getestet | Contributions willkommen! |

> **Hinweis:** Context-Now wurde bisher nur mit GitHub getestet. Wir freuen uns über Feedback und Contributions für andere Git-Provider! Wenn du es mit einem anderen Provider testest, lass es uns wissen via [Issues](https://github.com/GaboCapo/context-now/issues).

## 🚀 Installation

### Schnellinstallation (Empfohlen) 
```bash
# Ein-Befehl-Installation
curl -sSL https://raw.githubusercontent.com/GaboCapo/context-now/main/quick-setup.sh | bash

# Oder mit git clone + Installer
git clone https://github.com/GaboCapo/context-now.git ~/Code/context-now
cd ~/Code/context-now && ./install.sh
```

### Was wird installiert?
- ✅ Context-Now in `~/.context-now`
- ✅ Konfiguration in `~/.config/context-now`  
- ✅ Aliase: `cn`, `kontext`, `context`
- ✅ Auto-Completion für bash/zsh
- ✅ Environment-Variablen
- ✅ Hilfs-Funktionen (cn-update, cn-backup, cn-edit)

Siehe [INSTALLATION_COMPLETE.md](INSTALLATION_COMPLETE.md) für alle Optionen.

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

## 🗑️ Deinstallation

### Schnell-Deinstallation (Ein Befehl)
```bash
# Komplette Deinstallation mit einem Befehl
curl -sSL https://raw.githubusercontent.com/GaboCapo/context-now/main/uninstall.sh | bash
```

### Alternative: Mit geklontem Repository
```bash
# Wenn Repository noch vorhanden
~/Code/context-now/uninstall.sh

# Oder mit dem Original-Installer
~/Code/context-now/install.sh --uninstall
```

### Manuelle Deinstallation
```bash
# 1. Symlinks entfernen
rm -f ~/.local/bin/cn ~/.local/bin/kontext ~/.local/bin/context

# 2. Installation entfernen  
rm -rf ~/.context-now

# 3. Konfiguration entfernen (optional, enthält deine Projekt-Daten!)
rm -rf ~/.config/context-now

# 4. Fish-Funktionen entfernen (falls Fish genutzt)
rm -f ~/.config/fish/functions/cn-*.fish

# 5. Shell-Config bereinigen (manuell editieren)
# Entferne Context-Now Zeilen aus ~/.bashrc, ~/.zshrc oder ~/.config/fish/config.fish
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

## 🤝 Contributing

### Git-Provider Testing
Wir suchen Tester für andere Git-Provider! Wenn du Context-Now mit GitLab, Bitbucket oder anderen Providern testest:

1. Fork das Repository
2. Teste die Funktionalität mit deinem Provider
3. Dokumentiere was funktioniert/nicht funktioniert
4. Erstelle einen Pull Request oder Issue mit deinen Ergebnissen

### Entwicklung
```bash
# Repository forken und klonen
git clone https://github.com/[dein-username]/context-now.git
cd context-now

# Feature-Branch erstellen
git checkout -b feature/gitlab-support

# Änderungen committen
git commit -m "Add GitLab support"

# Pull Request erstellen
```

### Issue Reports
Bei Problemen bitte ein [Issue](https://github.com/GaboCapo/context-now/issues) mit folgenden Infos erstellen:
- Git-Provider (GitHub, GitLab, etc.)
- Shell-Type (bash, zsh, fish)
- Fehlermeldung
- Steps to reproduce

---

**Version**: 2.0.0  
**Lizenz**: MIT  
**Maintainer**: GaboCapo
