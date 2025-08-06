# Installationsanleitung

Hier findest du alle Informationen, um `context-now` auf deinem System zu installieren und einzurichten.

## Inhaltsverzeichnis
- [Voraussetzungen](#systemvoraussetzungen)
- [Schnellinstallation (Empfohlen)](#schnellinstallation-empfohlen)
- [Manuelle Installation](#manuelle-installation-für-entwickler)
- [Deinstallation](#deinstallation)
- [Fehlerbehebung](#fehlerbehebung)
- [Veraltete Methode: Manuelles Setup pro Projekt](#veraltete-methode-manuelles-setup-pro-projekt)

---

## Systemvoraussetzungen
- **Node.js**: Version 14.0.0 oder höher
- **npm**: Version 6.0.0 oder höher
- **Git**: Version 2.0 oder höher
- **Betriebssystem**: Linux, macOS oder Windows (mit WSL)
- **Shell**: Bash, Zsh oder Fish

---

## Schnellinstallation (Empfohlen)

Dies ist der einfachste und schnellste Weg, `context-now` zu installieren.

```bash
# Lade das Installations-Skript herunter und führe es aus
curl -sSL https://raw.githubusercontent.com/GaboCapo/context-now/main/quick-setup.sh | bash
```
Alternativ kannst du das Repository auch zuerst klonen:
```bash
# Repository klonen
git clone https://github.com/GaboCapo/context-now.git ~/Code/context-now
cd ~/Code/context-now

# Installer ausführen
./install.sh
```

**Was macht der Installer?**
- ✅ Prüft alle Systemvoraussetzungen.
- ✅ Installiert das Tool nach `~/.context-now`.
- ✅ Richtet die notwendigen Konfigurationsdateien in `~/.config/context-now` ein.
- ✅ Erstellt die Aliase `cn`, `kontext`, und `context` für einen einfachen Zugriff.
- ✅ Konfiguriert deine Shell (fügt Umgebungsvariablen hinzu).
- ✅ Richtet die Auto-Completion für Befehle ein (Bash/Zsh).

Nach der Installation musst du deine Shell neu laden, damit die Änderungen wirksam werden:
```bash
# Für Bash
source ~/.bashrc

# Für Zsh
source ~/.zshrc
```

---

## Manuelle Installation (für Entwickler)

Diese Methode gibt dir die volle Kontrolle über die Installation.

### 1. Repository klonen
```bash
git clone https://github.com/GaboCapo/context-now.git ~/Code/context-now
cd ~/Code/context-now
```

### 2. Abhängigkeiten installieren
```bash
npm install
```

### 3. Umgebungsvariablen einrichten
Füge die folgenden Zeilen zu deiner Shell-Konfigurationsdatei hinzu (`~/.bashrc`, `~/.zshrc` oder `~/.config/fish/config.fish`):
```bash
# Context-Now Environment
export CONTEXT_NOW_HOME="$HOME/Code/context-now"
export CONTEXT_NOW_CONFIG="$HOME/.config/context-now"
export PATH="$PATH:$CONTEXT_NOW_HOME"

# Aliase für den schnellen Zugriff
alias cn='$CONTEXT_NOW_HOME/cn'
alias kontext='$CONTEXT_NOW_HOME/cn'
alias context='$CONTEXT_NOW_HOME/cn'
```

### 4. Skripte ausführbar machen
```bash
chmod +x ~/Code/context-now/cn
chmod +x ~/Code/context-now/context-now.js
```

---

## Deinstallation

### Automatische Deinstallation (Empfohlen)
Wenn du das Tool mit dem Installer-Skript installiert hast, kannst du es wie folgt wieder entfernen:
```bash
# Lade das Deinstallations-Skript herunter und führe es interaktiv aus
bash <(curl -sSL https://raw.githubusercontent.com/GaboCapo/context-now/main/uninstall.sh)
```
Oder, falls du das Repository noch hast:
```bash
~/Code/context-now/uninstall.sh
```

### Manuelle Deinstallation
1.  **Symlinks entfernen**:
    `rm -f ~/.local/bin/cn ~/.local/bin/kontext ~/.local/bin/context`
2.  **Installation entfernen**:
    `rm -rf ~/.context-now`
3.  **Konfiguration entfernen** (Achtung: enthält deine Projektdaten!):
    `rm -rf ~/.config/context-now`
4.  **Shell-Konfiguration bereinigen**:
    Entferne die `context-now` Einträge manuell aus deiner `~/.bashrc` oder `~/.zshrc`.

---

## Fehlerbehebung

- **"command not found: cn"**:
  Stelle sicher, dass der Installationspfad in deinem `$PATH` enthalten ist (`echo $PATH`) und lade deine Shell neu (`source ~/.bashrc`).

- **"Permission denied"**:
  Vergib Ausführungsrechte für die Skripte: `chmod +x ~/Code/context-now/cn`.

- **"Module not found"**:
  Installiere die `npm`-Abhängigkeiten neu: `cd ~/Code/context-now && npm install`.

---

## Veraltete Methode: Manuelles Setup pro Projekt

Diese Methode wird **nicht mehr empfohlen**, da sie keine Updates erhält und keine Multi-Projekt-Unterstützung bietet. Sie ist hier nur der Vollständigkeit halber aufgeführt.

### 1. Tool-Dateien kopieren
Kopiere den `tools`-Ordner aus dem `context-now`-Repository in dein eigenes Projekt.
```bash
# In deinem Projektverzeichnis
cp -r /pfad/zu/context-now/tools .
```

### 2. NPM-Skripte hinzufügen
Füge die folgenden Skripte zu deiner `package.json` hinzu:
```json
"scripts": {
  "context": "node tools/context-tracker/context-tracker.js status",
  "context:sync": "node tools/context-tracker/context-tracker.js sync",
  "context:update": "node tools/context-tracker/context-tracker.js update"
}
```

### 3. Projekt-spezifische Dateien erstellen
Erstelle die notwendigen JSON-Dateien im `tools/context-tracker`-Ordner deines Projekts, indem du die `.template.json`-Dateien kopierst.
```bash
cd tools/context-tracker
cp issues.template.json issues.json
cp prs.template.json prs.json
# ... und so weiter für die anderen Vorlagen.
```
Diese Methode erfordert manuelle Updates und ist deutlich umständlicher in der Handhabung.
