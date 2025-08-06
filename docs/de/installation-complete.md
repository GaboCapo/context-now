# 🚀 Context-Now - Vollständige Installationsanleitung

## 📋 Systemvoraussetzungen

- **Node.js**: Version 14.0.0 oder höher
- **npm**: Version 6.0.0 oder höher  
- **Git**: Version 2.0 oder höher
- **OS**: Linux, macOS oder Windows (mit WSL)
- **Shell**: Bash, Zsh oder Fish

## 🎯 Schnellinstallation (Empfohlen)

### Option 1: Automatische Installation via Installer-Script

```bash
# Repository klonen
git clone https://github.com/GaboCapo/context-now.git ~/Code/context-now
cd ~/Code/context-now

# Installer ausführen
./install.sh

# Shell neu laden
source ~/.bashrc  # oder ~/.zshrc für Zsh
```

Der Installer erledigt automatisch:
- ✅ Prüfung aller Voraussetzungen
- ✅ Installation in ~/.context-now
- ✅ Einrichtung der Environment-Variablen
- ✅ Erstellung der Aliase (cn, kontext, context)
- ✅ Shell-Konfiguration
- ✅ Auto-Completion Setup

### Option 2: Installation via npm (Global)

```bash
# Repository klonen
git clone https://github.com/GaboCapo/context-now.git
cd context-now

# Global installieren
sudo npm install -g .

# Oder ohne sudo mit npm prefix
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
npm install -g .
```

## 📦 Manuelle Installation (für Entwickler)

### 1. Repository Setup

```bash
# Repository klonen
git clone https://github.com/GaboCapo/context-now.git ~/Code/context-now
cd ~/Code/context-now

# Oder via SSH (wenn Deploy Keys eingerichtet)
git clone git@github.com:GaboCapo/context-now.git ~/Code/context-now
```

### 2. Dependencies installieren

```bash
# Im Projektverzeichnis
npm install

# Oder mit yarn
yarn install
```

### 3. Environment-Variablen einrichten

Füge zu deiner `~/.bashrc`, `~/.zshrc` oder `~/.profile`:

```bash
# Context-Now Environment
export CONTEXT_NOW_HOME="$HOME/Code/context-now"
export CONTEXT_NOW_CONFIG="$HOME/.config/context-now"
export PATH="$PATH:$CONTEXT_NOW_HOME"

# Aliase
alias cn='$CONTEXT_NOW_HOME/cn'
alias kontext='$CONTEXT_NOW_HOME/cn'
alias context='$CONTEXT_NOW_HOME/cn'

# Hilfreiche Funktionen
cn-update() {
    cd "$CONTEXT_NOW_HOME" && git pull && cd - > /dev/null
    echo "Context-Now updated!"
}
```

### 4. Ausführbar machen

```bash
chmod +x ~/Code/context-now/cn
chmod +x ~/Code/context-now/cn-ssh
chmod +x ~/Code/context-now/context-now.js
```

## 🔧 Konfiguration

### Erstes Projekt verbinden

```bash
# Projekt hinzufügen
cn -c /pfad/zu/deinem/projekt

# Oder interaktiv
cn --connect
```

### Projekt-Templates einrichten

Jedes Projekt benötigt diese JSON-Dateien im `tools/context-tracker/` Verzeichnis:

1. **issues.json** - Aktuelle Issues
2. **prs.json** - Pull Requests
3. **github-branches.json** - Branch-Liste
4. **project-memory.json** - Branch-zu-Issue Mapping
5. **issue-relations.json** - Issue-Beziehungen (optional)

Templates werden automatisch kopiert bei:
```bash
cn -c /neues/projekt
```

## 📊 Verwendung

### Alltägliche Befehle

```bash
# Status anzeigen
cn -s
cn status

# Projekte auflisten
cn -l
cn --list

# Zu Projekt wechseln
cn -g projektname
cn -g 1  # Nach Nummer

# Repository synchronisieren
cn sync

# Kontext aktualisieren
cn update

# Hilfe anzeigen
cn -h
cn --help
```

### Erweiterte Funktionen

```bash
# Entwickler-Übergabe Modus
cn handover

# Backup erstellen
cn-backup

# Konfiguration bearbeiten
cn-edit

# Tool updaten
cn-update

# Cache leeren
cn cache-clear

# Debug-Modus
DEBUG=1 cn status
```

## 🔄 Updates

### Automatisches Update (mit Installer)

```bash
cd ~/Code/context-now
./install.sh --update
```

### Manuelles Update

```bash
cd ~/Code/context-now
git pull
npm install  # Falls neue Dependencies
```

## 🗑️ Deinstallation

### Automatisch (mit Installer)

```bash
# Interaktiv ausführen (empfohlen)
bash <(curl -sSL https://raw.githubusercontent.com/GaboCapo/context-now/main/uninstall.sh)

# Oder lokal ausführen
~/Code/context-now/install.sh --uninstall
```

### Manuell

```bash
# Symlinks entfernen
rm -f ~/.local/bin/cn
rm -f ~/.local/bin/kontext
rm -f ~/.local/bin/context

# Installation entfernen
rm -rf ~/.context-now
rm -rf ~/.config/context-now

# Repository entfernen (optional)
rm -rf ~/Code/context-now

# Environment-Variablen aus Shell-Config entfernen
# Editiere ~/.bashrc oder ~/.zshrc und entferne Context-Now Zeilen
```

## 🐛 Fehlerbehebung

### Problem: "command not found: cn"

```bash
# PATH prüfen
echo $PATH | grep context-now

# Falls nicht vorhanden, Shell-Config neu laden
source ~/.bashrc  # oder ~/.zshrc

# Oder manuell zum PATH hinzufügen
export PATH="$PATH:$HOME/Code/context-now"
```

### Problem: "Permission denied"

```bash
# Ausführungsrechte setzen
chmod +x ~/Code/context-now/cn
chmod +x ~/Code/context-now/context-now.js
```

### Problem: "Module not found"

```bash
# Dependencies neu installieren
cd ~/Code/context-now
rm -rf node_modules package-lock.json
npm install
```

### Problem: JSON-Dateien fehlen

```bash
# Templates kopieren
cd /dein/projekt
mkdir -p tools/context-tracker
cp ~/Code/context-now/tools/context-tracker/*.template.json tools/context-tracker/

# Templates umbenennen
cd tools/context-tracker
for f in *.template.json; do 
    mv "$f" "${f%.template.json}.json"
done
```

## 📚 Dokumentation

### Verfügbare Dokumentation

- **README.md** - Hauptdokumentation
- **INSTALLATION.md** - Original-Installationsanleitung  
- **installation-complete.md** - This guide
- **tools/context-tracker/DATA_SOURCES.md** - Datenquellen-Dokumentation
- **GITHUB_TOKEN.md** - GitHub Token Setup
- **SSH_DEPLOY_KEYS.md** - SSH Deploy Keys Setup

## 🔒 Sicherheit & Best Practices

### Git-Konfiguration

Die `.gitignore` ist bereits korrekt konfiguriert:

```gitignore
# Projektspezifische Daten (NICHT committen!)
tools/context-tracker/issues.json
tools/context-tracker/prs.json
tools/context-tracker/project-memory.json
tools/context-tracker/github-branches.json
tools/context-tracker/issue-relations.json

# Templates behalten
!tools/context-tracker/*.template.json
```

### Empfohlene Arbeitsweise

1. **Tägliche Updates**: `cn update` zum Start des Arbeitstages
2. **Branch-Wechsel**: Immer `cn sync` nach Git-Operationen
3. **Issue-Tracking**: Issues in `issues.json` aktuell halten
4. **Backup**: Wöchentlich `cn-backup` ausführen

## 🤝 Team-Setup

### Für Teams

1. **Gemeinsames Repository** für Context-Now Tool
2. **Eigene JSON-Dateien** pro Entwickler (nicht teilen!)
3. **Templates** im Repository pflegen
4. **Deploy Keys** für automatische Synchronisation

### Entwickler-Onboarding

```bash
# Neuer Entwickler Setup
git clone [team-repo]/context-now.git
cd context-now
./install.sh

# Projekt verbinden
cn -c /pfad/zum/teamprojekt

# Templates nutzen
cn init-templates
```

## 📝 Changelog

### Version 2.0.0
- Multi-Projekt Support
- Installer-Script
- Auto-Completion
- Environment-Variablen
- Verbesserte Aliase (cn, kontext)

## 🆘 Support

- **Issues**: https://github.com/GaboCapo/context-now/issues
- **Wiki**: https://github.com/GaboCapo/context-now/wiki
- **Email**: support@context-now.dev

---
*Context-Now - Never lose context again! 🎯*
