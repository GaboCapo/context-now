# Benutzeranleitung

Diese Anleitung erklärt die tägliche Verwendung von `context-now`, von der Projektverwaltung bis hin zur Team-Kollaboration.

## Inhaltsverzeichnis
- [Projektverwaltung](#projektverwaltung)
  - [Projekt verbinden](#projekt-verbinden)
  - [Projekte auflisten](#projekte-auflisten)
  - [Zu einem Projekt wechseln](#zu-einem-projekt-wechseln)
  - [Projektstatus anzeigen](#projektstatus-anzeigen)
  - [Projekt trennen](#projekt-trennen)
- [Typischer Workflow](#typischer-workflow)
- [Alle Befehle im Überblick](#alle-befehle-im-überblick)
  - [Basis-Befehle](#basis-befehle)
  - [Erweiterte Befehle](#erweiterte-befehle)
- [JSON-Dateien pflegen](#json-dateien-pflegen)
- [Team-Kollaboration](#team-kollaboration)

---

## Projektverwaltung

`context-now` ist darauf ausgelegt, mehrere Projekte gleichzeitig zu verwalten.

### Projekt verbinden
Um ein neues Projekt hinzuzufügen, benutze den `-c` oder `--connect` Befehl:
```bash
# Gib den Pfad zu deinem Git-Projekt an
cn -c /pfad/zu/deinem/projekt
```
Das Tool erstellt dann die notwendigen Symlinks und Konfigurationsdateien.

### Projekte auflisten
Zeige alle verbundenen Projekte an:
```bash
cn -l
# Oder
cn --list
```

### Zu einem Projekt wechseln
Wechsle den aktiven Kontext zu einem anderen Projekt:
```bash
# Nach Projekt-Nummer (aus der Liste)
cn -g 1

# Nach Projekt-Namen
cn -g mein-projekt
```

### Projektstatus anzeigen
Der Statusbefehl ist der wichtigste Befehl. Er gibt dir einen Überblick über den aktuellen Zustand deines Projekts.
```bash
# Zeigt den Status des aktuellen Projekts an
cn -s

# Zeigt den Status eines bestimmten Projekts an
cn -s mein-projekt
```
In einem Projekt-Verzeichnis kannst du auch die `npm`-Skripte verwenden, falls eingerichtet:
```bash
npm run context-now
```

### Projekt trennen
Entferne ein Projekt aus der Verwaltung:
```bash
cn -d mein-projekt
```

---

## Typischer Workflow

1.  **Projekt verbinden**:
    `cn -c ~/Code/mein-projekt`

2.  **Ins Projekt-Verzeichnis wechseln**:
    `cd ~/Code/mein-projekt`

3.  **Status prüfen und Empfehlungen erhalten**:
    `npm run context-now` oder `cn -s`
    
    Das Tool zeigt Ihnen:
    - Aktueller Branch-Status
    - Offene Issues nach Priorität (kritisch → hoch → normal)
    - Aktive Branches und deren Sync-Status
    - **🎯 Intelligente Empfehlungen** basierend auf Ihrem Projektstatus

4.  **Den Empfehlungen folgen**:
    Context-Now analysiert Ihr Projekt und schlägt die wichtigsten nächsten Schritte vor:
    - Kritische Sicherheitsprobleme zur sofortigen Behebung
    - Uncommitted Changes zum Stashen oder Committen
    - Branches die aufgeräumt werden müssen
    - Issues ohne Branches die Aufmerksamkeit benötigen

5.  **Synchronisieren**:
    Nach `git` Operationen wie `pull` oder `checkout` solltest du den Status synchronisieren:
    `npm run context-now:sync` oder `cn sync`

---

## 🎯 Intelligente Empfehlungen

Die Empfehlungs-Engine von Context-Now priorisiert Ihre Arbeit basierend auf:

### Prioritätsstufen
1. **🚨 Kritische Issues**: Sicherheitslücken, Systemausfälle
2. **⚠️ Hohe Priorität**: Wichtige Features, größere Bugs
3. **📋 Normale Priorität**: Reguläre Aufgaben und Verbesserungen
4. **🔄 Wartung**: Branch-Bereinigung, Synchronisation

### Beispiel-Empfehlungen
```
✅ Empfehlungen:

🚨 7 KRITISCHE Issues offen:
   ● #146: [SECURITY] Sicherheits-Audit implementieren
     → git checkout -b bugfix/critical-issue-146

📋 Nächste Schritte:
1. Uncommitted Changes sichern:
   → git stash push -m "WIP: aktueller-branch"
2. Kritisches Issue #146 sofort bearbeiten
   → git checkout -b bugfix/critical-issue-146
3. Remote-Branches aufräumen
   → git remote prune origin
```

Alle Befehle sind kopier-bereit für sofortige Ausführung!

---

## Alle Befehle im Überblick

### Basis-Befehle
| Befehl | Alias | Beschreibung |
|---|---|---|
| `cn --connect <path>` | `cn -c <path>` | Verbindet ein neues Projekt. |
| `cn --list` | `cn -l` | Listet alle Projekte auf. |
| `cn --go <name/id>` | `cn -g <name/id>` | Wechselt das aktive Projekt. |
| `cn --status [name]`| `cn -s [name]` | Zeigt den Projektstatus an. |
| `cn --disconnect <name>`| `cn -d <name>` | Trennt ein Projekt. |
| `cn sync` | | Synchronisiert den Repository-Status. |
| `cn update` | | Führt `sync` und `status` aus. |
| `cn --help` | `cn -h` | Zeigt die Hilfe an. |

### Erweiterte Befehle
| Befehl | Beschreibung |
|---|---|
| `cn handover` | Startet den Modus für Entwickler-Übergaben. |
| `cn cache-clear` | Leert den internen Cache. |
| `cn-backup` | Erstellt ein Backup der Konfiguration. |
| `cn-edit` | Öffnet die Konfigurationsdatei im Editor. |
| `cn-update` | Aktualisiert das `context-now` Tool selbst. |
| `DEBUG=1 cn status` | Führt einen Befehl im Debug-Modus aus. |

---

## JSON-Dateien pflegen

Die Genauigkeit des Tools hängt von der Aktualität der projektspezifischen JSON-Dateien ab. Diese befinden sich im `tools/context-tracker`-Verzeichnis deines Projekts.

- **`issues.json`**:
  Liste der Issues, idealerweise mit Status, Priorität und Labels.
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

- **`github-branches.json`**:
  Eine aktuelle Liste der Branches, die auf GitHub existieren. Dies ist wichtig, da `git` lokale Caches von Remote-Branches hat, die veraltet sein können.

- **`project-memory.json`**:
  Verknüpft Branches mit Issues und speichert Metadaten wie das Erstellungsdatum.

- **`issue-relations.json`** (optional):
  Definiert Beziehungen zwischen Issues (z.B. Epics), um intelligentere Empfehlungen zu ermöglichen.
  ```json
  {
    "#100": {
      "type": "epic",
      "includes": ["#101", "#102", "#103"]
    }
  }
  ```

---

## Team-Kollaboration

Der `handover`-Befehl wurde speziell für die Übergabe von Arbeit an Teamkollegen entwickelt.
```bash
# Führe diesen Befehl in deinem Projektverzeichnis aus
cn handover
```
**Ausgabe:**
- Nicht eingecheckte Änderungen (`git status`)
- Der letzte Commit
- Unfertige Arbeit (basierend auf dem Abgleich von Branches und Issues)
- Nächste Schritte (Empfehlungen vom Tool)

Dies gibt deinem Teamkollegen einen schnellen und umfassenden Überblick über den aktuellen Stand deiner Arbeit.
