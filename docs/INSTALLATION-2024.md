# 🚀 Context-Now Installation Guide (2024)

> **Wichtig**: Context-Now ist **KEIN offizielles NPM-Paket**. Wir nutzen NPM-Features für professionelle Installation ohne Publishing auf npmjs.com. [Details hier](NPM-LINK-EXPLAINED.md).

## 📋 Voraussetzungen

- **Node.js**: Version 16+ (empfohlen: 18+)
- **Git**: Version 2.25+
- **GitHub CLI** (optional): Für Issue/PR-Synchronisation
- **OS**: Linux, macOS, Windows (WSL)

## 🎯 Empfohlene Installation: NPM Link

Diese Methode gibt Ihnen alle NPM-Features ohne öffentliches Publishing:

```bash
# 1. Repository klonen
git clone https://github.com/GaboCapo/context-now.git ~/Code/context-now

# 2. Ins Verzeichnis wechseln
cd ~/Code/context-now

# 3. Dependencies installieren
npm install

# 4. Global verfügbar machen (ohne Publishing!)
npm link

# 5. Testen
cn --version
cn --help
```

### Was macht `npm link`?

- ✅ Installiert `cn` global auf Ihrem System
- ✅ Erstellt Symlink zu Ihrem lokalen Code
- ✅ Updates sofort aktiv (kein reinstall nötig)
- ❌ KEIN Upload zu npmjs.com
- ❌ KEIN NPM-Account nötig

[Ausführliche Erklärung zu NPM Link →](NPM-LINK-EXPLAINED.md)

## 🔄 Alternative Installationsmethoden

### Option 1: Direkt von GitHub

```bash
# Einzeiler-Installation von GitHub
npm install -g github:GaboCapo/context-now

# Mit spezifischem Branch
npm install -g github:GaboCapo/context-now#main
```

**Vorteile**: Ein Befehl, automatische Updates  
**Nachteile**: Keine lokale Entwicklung

### Option 2: Shell-Script Installation

```bash
# Traditionelle Installation ohne NPM
curl -sSL https://raw.githubusercontent.com/GaboCapo/context-now/main/quick-setup.sh | bash

# Oder manuell
git clone https://github.com/GaboCapo/context-now.git ~/Code/context-now
cd ~/Code/context-now
./install.sh
```

**Vorteile**: Kein Node.js/NPM nötig  
**Nachteile**: Keine NPM-Features

### Option 3: Lokale Projekt-Installation

```bash
# In Ihrem Projekt (nicht global)
cd ~/my-project
npm install file:../Code/context-now

# Nutzen mit npx
npx cn --help
```

**Vorteile**: Projekt-isoliert  
**Nachteile**: Nicht global verfügbar

## ⚙️ Post-Installation Setup

### 1. Konfiguration erstellen

```bash
# Config-Verzeichnis wird automatisch erstellt
cn --init
```

### 2. Erstes Projekt verbinden

```bash
# Projekt mit Context-Now verbinden
cn -c ~/Code/mein-projekt

# Status prüfen
cn -s
```

### 3. GitHub CLI konfigurieren (optional)

```bash
# Für Issue/PR-Synchronisation
gh auth login
```

## 🔧 Konfiguration

### Umgebungsvariablen

```bash
# Optional in ~/.bashrc oder ~/.zshrc
export CONTEXT_NOW_HOME="$HOME/Code/context-now"
export CONTEXT_NOW_CONFIG="$HOME/.config/context-now"
export CONTEXT_NOW_STORAGE="local"  # oder "embedded"
```

### Storage-Modi

Context-Now unterstützt verschiedene Storage-Modi:

```bash
# Storage-Info anzeigen
cn --storage

# Storage-Modus ändern
cn --storage local     # Daten in ~/.config/context-now
cn --storage embedded  # Daten im Projekt (Standard)
cn --storage hybrid    # Mix aus beiden
```

[Mehr zu Storage-Modi →](docs/storage.md)

## 📊 Installation verifizieren

```bash
# Umfassender System-Check
cn doctor

# Zeigt:
# - Installation paths
# - Config locations  
# - Dependencies status
# - Connected projects
# - Storage configuration
```

### Erwartete Ausgabe

```
🩺 Context-Now Doctor
─────────────────────
✅ Node.js: v18.17.0
✅ Git: 2.42.0
✅ Installation: ~/Code/context-now
✅ Config: ~/.config/context-now
✅ Storage: local mode
✅ Projects: 0 connected
```

## 🔄 Updates

### Mit NPM Link

```bash
cd ~/Code/context-now
git pull
npm install  # Bei neuen Dependencies
# Fertig! Keine weiteren Schritte nötig
```

### Mit GitHub-Installation

```bash
npm update -g context-now
```

## 🗑️ Deinstallation

### NPM Link entfernen

```bash
# Global unlink
npm unlink -g context-now

# Lokale Dateien behalten oder löschen
rm -rf ~/Code/context-now  # Optional
```

### Config behalten oder löschen

```bash
# Projekt-Daten löschen (Vorsicht!)
rm -rf ~/.config/context-now
```

## ❓ Troubleshooting

### Permission Errors bei npm link

```bash
# Option 1: Mit sudo (nicht empfohlen)
sudo npm link

# Option 2: NPM prefix ändern (empfohlen)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
npm link
```

### Command not found: cn

```bash
# Prüfen wo installiert
npm list -g --depth=0

# PATH prüfen
echo $PATH

# Symlink prüfen
ls -la $(npm config get prefix)/bin/cn
```

### Updates funktionieren nicht

```bash
cd ~/Code/context-now
npm unlink
git pull
npm install
npm link
```

## 🚀 Nächste Schritte

1. **Projekt verbinden**: `cn -c /path/to/project`
2. **Status prüfen**: `cn -s`
3. **Hilfe anzeigen**: `cn --help`
4. **Performance testen**: `cn performance-test`
5. **MCP einrichten**: [MCP Integration Guide](MCP-INTEGRATION.md)

## 📚 Weitere Dokumentation

- [NPM Link Explained](NPM-LINK-EXPLAINED.md) - Detaillierte NPM Link Erklärung
- [Command Reference](COMMANDS.md) - Alle Befehle im Detail
- [Storage Modes](STORAGE.md) - Daten-Speicherung konfigurieren
- [Performance Guide](DEMO-REPOSITORIES.md) - Große Repos handhaben
- [Migration Guide](MIGRATION.md) - Von älteren Versionen

---

⚠️ **Reminder**: Context-Now ist ein GitHub-Projekt, KEIN offizielles NPM-Paket. Installation erfolgt via GitHub/npm link, nicht via `npm install context-now`.