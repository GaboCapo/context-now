# Migration Guide - Context to Context-Now

## ⚠️ Breaking Change: npm run context → npm run context-now

Ab Version 2.0.0 wurde der Befehl `npm run context` zu `npm run context-now` umbenannt, um Namespace-Konflikte zu vermeiden.

## Für bestehende Nutzer

### Problem:
```bash
npm run context
# Error: npm error Missing script: "context"
```

### Lösung:

#### Option 1: NPM Scripts aktualisieren (Empfohlen)
```bash
# Im Projektverzeichnis ausführen:
cn --update-scripts <projekt-name>

# Oder wenn cn global installiert ist:
cn --update-scripts .
```

#### Option 2: Manuell package.json anpassen
Ändere in deiner `package.json`:

**Alt:**
```json
{
  "scripts": {
    "context": "node tools/context-tracker/context-tracker.js status",
    "context:sync": "node tools/context-tracker/context-tracker.js sync",
    "context:update": "node tools/context-tracker/context-tracker.js update"
  }
}
```

**Neu:**
```json
{
  "scripts": {
    "context-now": "node tools/context-now/context-tracker.js status",
    "context-now:sync": "node tools/context-now/context-tracker.js sync",
    "context-now:update": "node tools/context-now/context-tracker.js update",
    "context-now:handover": "node tools/context-now/context-tracker.js handover"
  }
}
```

#### Option 3: Projekt neu verbinden
```bash
# Projekt trennen und neu verbinden
cn -d <projekt-name>
cn -c /pfad/zum/projekt
```

## Neue Befehle

### Alte Befehle:
```bash
npm run context          # Status anzeigen
npm run context:sync     # Repository synchronisieren
npm run context:update   # Sync + Status
```

### Neue Befehle:
```bash
npm run context-now          # Status anzeigen
npm run context-now:sync     # Repository synchronisieren  
npm run context-now:update   # Sync + Status
npm run context-now:handover # Developer handover
```

### Direkte CLI-Befehle (ohne npm):
```bash
cn -s                    # Status anzeigen
cn sync                  # Repository synchronisieren
cn update                # Sync + Status
cn handover              # Developer handover

# Neue fokussierte Ansichten:
cn branches              # Alle Branches ohne Kürzung
cn issues                # Alle Issues vollständig
cn prs                   # Alle Pull Requests
cn critical              # Nur kritische Issues
cn relations             # Issue-Beziehungen
```

## Warum diese Änderung?

1. **Namespace-Konflikte vermeiden**: Viele Projekte nutzen bereits `context` für andere Zwecke
2. **Klarere Benennung**: `context-now` ist eindeutiger und vermeidet Verwechslungen
3. **Separater Namespace**: Bei Konflikten nutzt Context-Now jetzt `/tools/context-now/` statt `/tools/context-tracker/`

## Weitere Hilfe

Bei Problemen:
- Issue erstellen: https://github.com/GaboCapo/context-now/issues
- Dokumentation: https://github.com/GaboCapo/context-now/docs

## Automatische Migration

Für eine vollautomatische Migration aller Projekte:
```bash
# Liste alle Projekte auf
cn -l

# Aktualisiere jedes Projekt einzeln
cn --update-scripts projekt1
cn --update-scripts projekt2
# ...
```