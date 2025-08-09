# 📖 Context-Now Command Reference

Vollständige Übersicht aller verfügbaren Befehle und Optionen.

## 🎯 Grundbefehle

### `cn -c, --connect <path>`
Verbindet ein neues Projekt mit Context-Now.

```bash
cn -c /home/user/my-project
cn --connect ~/Code/awesome-app
```

**Was passiert:**
- Erstellt Konfiguration für das Projekt
- Legt Datenverzeichnis an (je nach Storage-Mode)
- Fügt Projekt zur globalen Liste hinzu
- Optional: Aktualisiert `.gitignore`

### `cn -l, --list`
Zeigt alle verbundenen Projekte.

```bash
cn -l
# Ausgabe:
# 1. my-project (/home/user/my-project)
# 2. awesome-app (/home/user/Code/awesome-app)
```

### `cn -g, --go <name|number>`
Wechselt zu einem Projekt.

```bash
cn -g 1                  # Nach Nummer
cn -g my-project         # Nach Name
cn --go awesome-app      # Lange Form
```

### `cn -s, --status [name]`
Zeigt umfassenden Projekt-Status.

```bash
cn -s                    # Aktuelles Projekt
cn -s my-project         # Spezifisches Projekt
```

**Zeigt:**
- Git Branch und Status
- Offene Issues (nach Priorität)
- Pull Requests
- Intelligente Empfehlungen
- Performance-Warnungen bei großen Repos

### `cn -d, --disconnect <name>`
Trennt ein Projekt von Context-Now.

```bash
cn -d my-project
cn --disconnect old-app
```

## 📊 Analyse-Befehle

### `cn doctor`
Umfassende Systemdiagnose.

```bash
cn doctor
```

**Prüft:**
- Installation (Home, Config, NPM)
- System-Dependencies (git, gh, node, npm)
- Projekt-Speicherorte
- Storage-Modi (embedded/local/hybrid)
- Empfehlungen für Optimierungen

### `cn stats [name]`
Statistische Analyse für große Repositories.

```bash
cn stats                 # Aktuelles Projekt
cn stats large-repo      # Spezifisches Projekt
```

**Zeigt:**
- Issue-Statistiken (nach Status, Label, Alter)
- PR-Statistiken
- Top-Contributors
- Trend-Analyse
- Performance-Metriken

### `cn structure [name]`
Generiert narrative Projektstruktur-Beschreibung.

```bash
cn structure             # Aktuelles Verzeichnis
cn structure my-project  # Spezifisches Projekt
```

**Output:**
- Textbasierte Beschreibung der Dateistruktur
- Erklärungen zu Verzeichniszwecken
- Technologie-Erkennung
- Zusammenfassung mit Metriken

### `cn performance-test [repo]`
Testet Performance mit bekannten großen Repositories.

```bash
cn performance-test                      # Zeigt Liste
cn performance-test microsoft/vscode     # Test mit VSCode
cn performance-test kubernetes/kubernetes # Test mit K8s
```

## 🔍 Fokussierte Ansichten

Diese Befehle zeigen spezifische Daten OHNE Kürzung:

### `cn branches [name]`
Alle Branches ohne Truncation.

```bash
cn branches              # Aktuelles Projekt
cn branches my-project   # Spezifisches Projekt
```

### `cn issues [name]`
Komplette Issue-Liste.

```bash
cn issues                # Alle Issues
cn issues --filter bug   # Gefiltert
cn issues --days 30      # Letzte 30 Tage
```

### `cn prs [name]`
Alle Pull Requests.

```bash
cn prs                   # Alle PRs
cn prs --state open      # Nur offene
cn prs --author @me      # Eigene PRs
```

### `cn critical [name]`
Nur kritische Issues.

```bash
cn critical              # Critical priority only
cn critical --security   # Security-critical
```

### `cn relations [name]`
Issue-Beziehungen und Abhängigkeiten.

```bash
cn relations             # Zeigt EPICs, Blocks, etc.
cn relations --graph     # Grafische Darstellung
```

## ⚙️ Konfigurations-Befehle

### `cn --storage [mode]`
Storage-Modus verwalten.

```bash
cn --storage             # Zeigt aktuellen Modus
cn --storage local       # Wechsel zu local storage
cn --storage embedded    # Wechsel zu embedded
cn --storage hybrid      # Wechsel zu hybrid
```

**Modi:**
- **embedded**: Daten im Projekt (mit Symlinks)
- **local**: Alle Daten in ~/.config/context-now
- **hybrid**: Config lokal, Cache im Projekt

### `cn --migrate-storage <name>`
Migriert Projekt zwischen Storage-Modi.

```bash
cn --migrate-storage my-project
# Interaktiv: Wählt Ziel-Modus
```

### `cn --update-scripts <name>`
Aktualisiert NPM Scripts in package.json.

```bash
cn --update-scripts my-project
```

**Fügt hinzu:**
- `npm run context-now` - Status anzeigen
- `npm run context-now:sync` - Synchronisieren
- `npm run context-now:update` - Sync + Status

### `cn -k, --key`
SSH Deploy-Key einrichten.

```bash
cn -k
# Interaktive SSH-Key Konfiguration
```

## 🔄 Sync-Befehle

### `cn sync [name]`
Synchronisiert Projekt mit GitHub.

```bash
cn sync                  # Aktuelles Projekt
cn sync my-project       # Spezifisches Projekt
```

**Synchronisiert:**
- Issues von GitHub
- Pull Requests
- Branches
- Collaborators

### `cn fetch [name]`
Holt nur Daten ohne Status-Anzeige.

```bash
cn fetch                 # Leise synchronisieren
cn fetch --verbose       # Mit Details
```

## 🎯 Erweiterte Optionen

### Globale Flags

```bash
cn <command> --verbose   # Ausführliche Ausgabe
cn <command> --quiet     # Minimale Ausgabe
cn <command> --json      # JSON-Output
cn <command> --no-color  # Ohne Farben
```

### Filter-Optionen

```bash
cn issues --filter "label:bug"           # Nach Label
cn issues --filter "author:username"     # Nach Autor
cn issues --days 7                       # Zeitraum
cn issues --state open                   # Nach Status
cn issues --priority critical            # Nach Priorität
```

### Pagination

```bash
cn issues --page 1 --per-page 50        # Seite 1, 50 Items
cn issues --limit 100                    # Maximal 100
cn issues --all                          # Alle (Vorsicht!)
```

### Cache-Optionen

```bash
cn --cache sync my-project              # Cache aktivieren
cn issues --cached                       # Cached data nutzen
cn --cache clear                        # Cache löschen
```

## 📝 NPM Scripts (in Projekten)

Nach dem Verbinden können Sie diese NPM Scripts nutzen:

```json
{
  "scripts": {
    "context-now": "cn -s",
    "context-now:sync": "cn sync",
    "context-now:update": "cn sync && cn -s",
    "context-now:issues": "cn issues",
    "context-now:stats": "cn stats"
  }
}
```

Verwendung:
```bash
npm run context-now         # Status
npm run context-now:sync    # Synchronisieren
npm run context-now:stats   # Statistiken
```

## 🚀 Beispiel-Workflows

### Tägliche Arbeit

```bash
# Morgens: Status checken
cn -s

# Issues anschauen
cn critical              # Kritische zuerst
cn issues --days 1       # Neue von heute

# Branch für Issue erstellen
git checkout -b fix/issue-123

# Später: Fortschritt prüfen
cn -s
```

### Große Repositories

```bash
# Performance prüfen
cn doctor
cn performance-test

# Statistiken statt volle Listen
cn stats

# Gefilterte Ansichten
cn issues --filter "label:bug" --days 30
cn prs --state open --limit 20
```

### Team-Handover

```bash
# Vollständige Analyse
cn doctor
cn -s
cn structure > project-structure.txt

# Kritische Items
cn critical
cn relations

# Export für Kollegen
cn issues --json > issues.json
```

### Migration

```bash
# Von altem context-tracker
cn --update-scripts my-project

# Storage-Mode wechseln
cn --storage          # Check current
cn --storage local    # Switch to local
cn --migrate-storage my-project
```

## ⚠️ Deprecations

Diese Befehle sind veraltet:

```bash
# ALT (funktioniert noch)     → NEU (empfohlen)
npm run context              → npm run context-now
tools/context-tracker        → tools/context-now
~/.context-tracker           → ~/.config/context-now
```

## 🆘 Hilfe

```bash
cn --help                # Allgemeine Hilfe
cn <command> --help      # Befehl-spezifisch
cn --version            # Version anzeigen
```

## 🐛 Debug-Modus

```bash
# Mit Debug-Output
DEBUG=* cn -s

# Nur Context-Now Debug
DEBUG=context-now:* cn -s

# Verbose + Debug
cn -s --verbose --debug
```

---

💡 **Tipp**: Die meisten Befehle funktionieren kontextsensitiv. Wenn Sie sich in einem Projektverzeichnis befinden, wird automatisch dieses Projekt verwendet.