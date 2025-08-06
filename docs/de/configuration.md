# Konfigurationsanleitung

Diese Anleitung erklärt die Konfiguration von `context-now`, die projektspezifischen Datenquellen und die Anbindung an die GitHub API.

## Inhaltsverzeichnis
- [Datenquellen](#datenquellen-des-tools)
  - [Manuell gepflegte Dateien](#manuell-gepflegte-dateien)
  - [Automatisch erfasste Daten](#automatisch-erfasste-daten)
- [Umgang mit dem Git-Cache](#umgang-mit-dem-git-cache)
- [GitHub API Anbindung](#github-api-anbindung)
  - [GitHub Token erstellen](#github-token-erstellen)
  - [Token verwenden](#token-verwenden)
  - [Sicherheitshinweise](#sicherheitshinweise)

---

## Datenquellen des Tools

`context-now` bezieht seine Informationen aus verschiedenen Quellen, um ein genaues Bild deines Projekts zu zeichnen. Die Konfigurationsdateien sind pro Projekt im Unterordner `tools/context-tracker/` zu finden.

### Manuell gepflegte Dateien

Diese JSON-Dateien sind das Herzstück deines Projektkontextes und sollten regelmäßig gepflegt werden.

- **`issues.json`**: Enthält eine Liste aller relevanten Issues. Du kannst hier Status, Priorität und Labels definieren, um die Empfehlungen des Tools zu verbessern.
- **`prs.json`**: Eine Liste von Pull Requests, die für den aktuellen Kontext von Bedeutung sind.
- **`github-branches.json`**: Dies ist eine der wichtigsten Dateien. Sie sollte eine aktuelle Liste der **echten** Branch-Namen von GitHub enthalten. Das Tool vergleicht diese Liste mit deinen lokalen Branches, um Abweichungen zu finden.
- **`project-memory.json`**: Hier merkt sich das Tool, welcher Branch zu welchem Issue gehört.
- **`issue-relations.json`**: (Optional) Definiere hier Beziehungen zwischen Issues, z.B. Epics, die mehrere untergeordnete Issues haben. Dies ermöglicht dem Tool, komplexere Zusammenhänge zu verstehen.

### Automatisch erfasste Daten

- **Lokale Git-Daten**: Das Tool liest deine lokalen Branches (`git branch`) und den Status deiner Arbeitskopie (`git status`).

---

## Umgang mit dem Git-Cache

Ein häufiges Problem ist, dass `git` Informationen über Remote-Branches lokal zwischenspeichert. Selbst wenn ein Branch auf GitHub bereits gelöscht wurde, kann er in deinem lokalen Cache noch als Remote-Branch erscheinen.

**Problem**: Das Tool könnte veraltete Branches anzeigen.

**Lösung**: Bereinige regelmäßig deinen lokalen Git-Cache.
```bash
# Entfernt alle Verweise auf Remote-Branches, die nicht mehr existieren
git remote prune origin

# Alternativ: Hole alle Änderungen und bereinige gleichzeitig
git fetch --all --prune
```
Die beste Methode ist jedoch, die `github-branches.json` aktuell zu halten, da diese Datei für das Tool die höchste Priorität hat.

---

## GitHub API Anbindung

Für den vollen Funktionsumfang, insbesondere bei **privaten Repositories**, benötigt `context-now` Zugriff auf die GitHub API.

### GitHub Token erstellen

1.  Gehe zu deinen **GitHub Developer Settings**: [Personal access tokens (classic)](https://github.com/settings/tokens).
2.  Klicke auf **"Generate new token (classic)"**.
3.  **Name**: Gib einen aussagekräftigen Namen ein, z.B. "context-now".
4.  **Scopes**: Wähle die benötigten Berechtigungen aus.
    -   `repo`: Für den vollen Zugriff auf private und öffentliche Repositories.
    -   `public_repo`: Ausreichend, wenn du nur mit öffentlichen Repositories arbeitest.
5.  Klicke auf **"Generate token"**.
6.  **Wichtig**: Kopiere den Token sofort! Er wird dir nur ein einziges Mal angezeigt.

### Token verwenden

Es gibt mehrere Wege, dem Tool den Token zur Verfügung zu stellen.

- **Option 1: Umgebungsvariable (empfohlen)**
  Setze die Variable in deiner aktuellen Shell-Sitzung:
  ```bash
  export GITHUB_TOKEN="ghp_DEIN_TOKEN_HIER"
  # Alternativ wird auch GH_TOKEN unterstützt
  export GH_TOKEN="ghp_DEIN_TOKEN_HIER"
  ```
  Für eine permanente Speicherung kannst du diese Zeile zu deiner `~/.bashrc` oder `~/.zshrc` hinzufügen.

- **Option 2: `.env`-Datei**
  Erstelle eine Datei mit dem Namen `.env` im Stammverzeichnis deines **`context-now`-Klons** (nicht in deinem Projekt) und füge den Token dort ein:
  ```
  GITHUB_TOKEN=ghp_DEIN_TOKEN_HIER
  ```
  **Achtung**: Stelle sicher, dass die `.env`-Datei in deiner globalen `.gitignore` eingetragen ist, um ein versehentliches Commit zu verhindern.

### Sicherheitshinweise

- **COMMITE DEINEN TOKEN NIEMALS!** Er gehört nicht in die Versionskontrolle.
- Erstelle Tokens immer nur mit den minimal notwendigen Berechtigungen.
- Rotiere deine Tokens regelmäßig, d.h. erstelle einen neuen und lösche den alten.
- Wenn ein Token versehentlich veröffentlicht wurde, widerrufe ihn sofort auf GitHub.

---

### Rate Limits und Nutzung ohne Token

Die GitHub API hat Ratenbegrenzungen, um Missbrauch zu verhindern.

- **Ohne Token**: Du bist auf ca. 60 Anfragen pro Stunde beschränkt. Dies ist ausreichend für gelegentliche Nutzung bei öffentlichen Repositories.
- **Mit Token**: Dein Limit erhöht sich auf 5.000 Anfragen pro Stunde, was für die intensive Nutzung, auch in großen Teams, problemlos ausreicht.

Das Tool funktioniert auch ohne Token für öffentliche Repositories oder wenn du die `github-branches.json` manuell pflegst. Für private Repositories ist ein Token zwingend erforderlich.

### Fehlerbehebung (Troubleshooting)

- **"Repository nicht gefunden oder privat"**:
  Dein Token fehlt oder hat nicht die notwendigen `repo`-Berechtigungen für dieses Repository.

- **"GitHub API Rate Limit erreicht"**:
  Du hast die maximale Anzahl an Anfragen ohne Token erreicht. Konfiguriere einen Token, um das Limit zu erhöhen.

- **"GitHub API Zugriff verweigert" / "Bad credentials"**:
  Dein Token ist ungültig, abgelaufen oder wurde widerrufen. Erstelle einen neuen Token.
