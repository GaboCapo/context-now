# 🎯 Context-Tracker Datenquellen

## Wie das Tool seine Daten bekommt:

### 1. **Issues** (`issues.json`)
- Manuell gepflegt oder von GitHub API
- Enthält alle offenen Issues mit Prioritäten und Labels

### 2. **Pull Requests** (`prs.json`)
- Manuell gepflegt oder von GitHub API
- Zeigt offene/gemergte PRs

### 3. **GitHub Branches** (`github-branches.json`) ⭐ NEU!
- **WICHTIG**: Dies sind die ECHTEN Branches von GitHub
- Muss manuell aktualisiert werden mit den Branches die auf GitHub sichtbar sind
- Hat Priorität über lokale Git-Daten

### 4. **Lokale Git-Daten**
- `git branch` - lokale Branches
- `git branch -r` - remote Branches (KANN VERALTET SEIN!)

## ⚠️ Problem mit Git-Cache

Dein lokales Repository cached alte Remote-Branches. Auch gelöschte Branches bleiben im Cache!

### Lösung 1: Git-Cache bereinigen
```bash
# Entfernt gelöschte Remote-Branches aus dem Cache
git remote prune origin

# Oder komplett neu fetchen
git fetch --all --prune
```

### Lösung 2: GitHub-Branches manuell aktualisieren
```bash
# Kopiere die Branch-Liste von GitHub und update github-branches.json
```

## 📋 Aktualisierung der github-branches.json

1. Gehe zu: https://github.com/[YOUR-USERNAME]/[YOUR-REPO]/branches
2. Kopiere die Branch-Namen
3. Update die Datei:

```json
[
  "main",
  "develop",
  "feature/your-feature",
  "bugfix/your-fix"
]
```

## 🔄 Workflow

1. **Täglich**: Aktualisiere `github-branches.json` mit echten GitHub-Daten
2. **Bei Bedarf**: Update `issues.json` und `prs.json`
3. **Automatisch**: Tool zeigt Unterschiede zwischen lokal und GitHub

## 📊 Was die Zahlen bedeuten

- **Lokale Branches**: Was du auf deinem Rechner hast (`git branch`)
- **Remote Branches**: Was GitHub hat (aus `github-branches.json`)
- **Aktive Branches**: Alle außer main/develop/backup
- **Nur lokal**: Branches die du noch nicht gepusht hast
- **Nur remote**: Branches auf GitHub die du nicht lokal hast
