# 🎯 Context-Tracker Tool

Ein intelligentes Tool zur Übersicht über Issues, Branches und Pull Requests in deinem Projekt.

## 🚀 Installation in dein Projekt

### 1. Tool kopieren
```bash
# In dein Projektverzeichnis wechseln
cd /pfad/zu/deinem/projekt

# Tools kopieren
cp -r /home/commander/Code/context-now/tools .

# NPM Script hinzufügen zu package.json
# Füge in "scripts" Sektion hinzu:
"context": "node tools/context-tracker/context-tracker.js status"
```

### 2. Konfiguration anpassen

Die JSON-Dateien im `tools/context-tracker/` Verzeichnis anpassen:

- **issues.json**: Deine offenen GitHub Issues
- **prs.json**: Deine offenen Pull Requests  
- **project-memory.json**: Deine aktiven Feature-Branches

Template-Dateien sind vorhanden als `*.template.json`.

### 3. Verwendung

```bash
# Status anzeigen
npm run context
```

## 📊 Was das Tool zeigt

- **Projektübersicht**: Aktueller Branch
- **Status**: Anzahl offener Issues, Branches, PRs
- **Kritische Issues**: Priorisierte Aufgaben
- **Branch-Beziehungen**: Welcher Branch an welchem Issue arbeitet
- **Empfehlungen**: Was als nächstes zu tun ist

## 🔧 Anpassung für dein Projekt

### Issues Format (issues.json)
```json
{
  "id": "#123",
  "title": "Issue Titel",
  "status": "open",
  "priority": "critical|high|medium|low",
  "labels": ["bug", "feature", etc.]
}
```

### Pull Requests Format (prs.json)
```json
{
  "id": "PR-1",
  "branch": "feature/branch-name",
  "status": "open|merged|closed",
  "issue": "#123"
}
```

### Branch Memory Format (project-memory.json)
```json
{
  "branch-name": {
    "created": "YYYY-MM-DD",
    "issue": "#123",
    "lastActivity": "YYYY-MM-DD"
  }
}
```

## 🎯 Best Practices

1. **Vor jedem Branch-Wechsel**: `npm run context` ausführen
2. **Nach Issue-Abschluss**: Nächste Priorität checken
3. **Bei Team-Meetings**: Übersicht zeigen
4. **Regelmäßig aktualisieren**: JSON-Dateien mit echten Daten pflegen

## 💡 Tipps

- Das Tool warnt bei zu vielen Branches (>20)
- Kritische Issues werden hervorgehoben
- Empfehlungen basieren auf Prioritäten
- Unzugeordnete Branches werden markiert

## 🐛 Troubleshooting

- **"Branch nicht getrackt"**: Branch zu project-memory.json hinzufügen
- **Keine Empfehlung**: Issues.json aktualisieren
- **Falsche Zahlen**: JSON-Dateien prüfen

---

Entwickelt für bessere Projekt-Koordination! 🚀