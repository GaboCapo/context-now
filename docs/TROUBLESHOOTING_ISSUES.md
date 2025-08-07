# Troubleshooting: Context-Now findet keine GitHub Issues

## Problem
Context-Now zeigt "0 offene Issues" obwohl Issues auf GitHub existieren.

## Ursachen & Lösungen

### 1. Neuer Namespace (tools/context-now/)
**Problem:** Nach der Installation verwendet Context-Now den neuen Namespace `/tools/context-now/` statt `/tools/context-tracker/`, wodurch leere JSON-Dateien erstellt werden.

**Lösung:** 
- Die neueste Version von Context-Now unterstützt beide Namespaces automatisch
- Pull die neuesten Updates: `git pull origin main`

### 2. GitHub API Zugriff

#### Option A: GitHub CLI (Empfohlen für private Repos)
```bash
# Installation
brew install gh        # macOS
apt install gh         # Ubuntu/Debian
winget install gh      # Windows

# Authentifizierung
gh auth login

# Test
gh issue list --repo owner/repo
```

#### Option B: GitHub Token (für API Zugriff)
```bash
# Token erstellen: https://github.com/settings/tokens
# Benötigte Scopes: repo (full control)

# Token setzen
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx

# Oder in .env Datei
echo "GITHUB_TOKEN=ghp_xxxxxxxxxxxx" >> .env
```

#### Option C: Manuelles Befüllen der issues.json
Wenn keine API-Verbindung möglich ist, können Sie die Issues manuell pflegen:

```bash
# Navigiere zum Projekt
cd /path/to/your/project

# Editiere die issues.json
nano tools/context-now/issues.json
# oder
nano tools/context-tracker/issues.json
```

Format:
```json
[
  {
    "number": 135,
    "title": "Case Management Crash Issue",
    "state": "open",
    "labels": [{"name": "bug"}, {"name": "critical"}],
    "assignees": [],
    "body": "Description..."
  }
]
```

### 3. SSH vs HTTPS Remotes

**Problem:** Bei SSH-Remotes (`git@github.com:...`) versucht Context-Now primär lokale Daten zu verwenden.

**Lösung:**
- Installiere `gh` CLI für besseren Support
- Oder wechsle temporär zu HTTPS: 
  ```bash
  git remote set-url origin https://github.com/owner/repo.git
  npm run context
  git remote set-url origin git@github.com:owner/repo.git
  ```

### 4. Alte vs Neue Installation

Wenn Ihr Projekt noch die alte Installation hat:
```bash
# Prüfe welcher Namespace verwendet wird
ls -la tools/

# Falls tools/context-tracker/ existiert mit echten Dateien:
# Das ist Ihre alte Installation - behalten Sie diese!

# Falls tools/context-now/ existiert:
# Das ist die neue Installation
```

### 5. Quick Fix für Entwickler

```bash
# 1. Installiere gh CLI
brew install gh  # oder apt install gh

# 2. Authentifiziere
gh auth login

# 3. Teste manuell
gh issue list --repo GaboCapo/persona-nexus-manager --state all

# 4. Falls das funktioniert, sollte auch context-now funktionieren
npm run context
```

### 6. Debug-Modus

Um zu sehen was Context-Now tut:
```bash
# Verbose output
DEBUG=* npm run context

# Oder direkt
node tools/context-now/context-tracker.js status
```

## Kontakt

Bei weiteren Problemen:
- Erstelle ein Issue: https://github.com/GaboCapo/context-now/issues
- Mit Details zu:
  - Betriebssystem
  - Node.js Version
  - Fehlermeldungen
  - Output von `gh auth status`