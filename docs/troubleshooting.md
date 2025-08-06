# Fehlerbehebung (Troubleshooting)

Hier findest du Lösungen für häufig auftretende Probleme bei der Verwendung von `context-now`.

## Inhaltsverzeichnis
- [Installation & Setup](#installation--setup)
- [Befehlsausführung](#befehlsausführung)
- [GitHub API & Token](#github-api--token)
- [Synchronisierung](#synchronisierung)

---

## Installation & Setup

### `command not found: cn`
- **Problem**: Deine Shell kann den `cn`-Befehl nicht finden.
- **Lösung 1**: Lade deine Shell-Konfiguration neu.
  ```bash
  # Für Bash
  source ~/.bashrc
  # Für Zsh
  source ~/.zshrc
  ```
- **Lösung 2**: Überprüfe, ob der Installationspfad in deiner `$PATH`-Umgebungsvariable enthalten ist.
  ```bash
  echo $PATH
  ```
  Wenn der Pfad `~/.context-now` oder ein Symlink-Verzeichnis wie `~/.local/bin` fehlt, musst du ihn manuell hinzufügen oder die Installation wiederholen.

### `Permission denied` beim Ausführen von `cn`
- **Problem**: Dem Skript fehlen die Ausführungsrechte.
- **Lösung**: Mache das Skript ausführbar.
  ```bash
  chmod +x /pfad/zu/context-now/cn
  ```
  Wenn du den Schnell-Installer verwendet hast, sollte dies automatisch geschehen.

---

## Befehlsausführung

### `cn -c` meldet einen Fehler
- **Problem**: Das Verbinden eines Projekts schlägt fehl.
- **Lösung**:
  - Stelle sicher, dass du den **absoluten Pfad** zu deinem Projekt-Repository angibst.
  - Überprüfe, ob es sich um ein gültiges Git-Repository handelt (`.git`-Ordner muss existieren).
  - Stelle sicher, dass du Schreibrechte für das Projektverzeichnis hast.

---

## GitHub API & Token

### "Repository nicht gefunden oder privat"
- **Problem**: Das Tool kann nicht auf das GitHub-Repository zugreifen.
- **Lösung**:
  - Stelle sicher, dass du einen [GitHub Token konfiguriert](configuration.md#github-api-anbindung) hast.
  - Überprüfe, ob dein Token die notwendigen Berechtigungen (`repo`-Scope) für das private Repository hat.

### "GitHub API Rate Limit erreicht"
- **Problem**: Du hast die maximale Anzahl von Anfragen an die GitHub API ohne Authentifizierung erreicht (ca. 60 pro Stunde).
- **Lösung**: [Konfiguriere einen GitHub Token](configuration.md#github-api-anbindung), um dein Limit auf 5.000 Anfragen pro Stunde zu erhöhen.

### "Bad credentials" oder "Zugriff verweigert"
- **Problem**: Dein GitHub Token ist ungültig.
- **Lösung**: Dein Token ist wahrscheinlich abgelaufen oder wurde widerrufen. Erstelle einen neuen Token auf GitHub und aktualisiere ihn in deiner Konfiguration.

---

## Synchronisierung

### `cn sync` zeigt veraltete Branches an
- **Problem**: Das Tool zeigt Remote-Branches an, die auf GitHub bereits gelöscht wurden.
- **Lösung 1 (Empfohlen)**: Bereinige den lokalen Git-Cache deines Projekts.
  ```bash
  # In deinem Projektverzeichnis
  git remote prune origin
  ```
- **Lösung 2**: Halte die `github-branches.json`-Datei manuell aktuell. Diese Datei hat für das Tool die höchste Priorität.
