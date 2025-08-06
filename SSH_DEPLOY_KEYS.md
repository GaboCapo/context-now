# 🔐 SSH Deploy Key Integration

Context-Tracker kann jetzt **SSH Deploy Keys** verwenden um die echten GitHub-Branches abzurufen - ohne Personal Access Tokens!

## 🚀 Schnellstart

### 1. Deploy Key Setup starten
```bash
# Kurzer Befehl:
~/Code/context-now/cn-ssh -s

# Oder direkt:
node ~/Code/context-now/tools/context-tracker/context-tracker-ssh.js -s
```

### 2. Setup-Ablauf

Das Tool führt dich durch folgende Schritte:

1. **SSH-Verzeichnis bestätigen**
   - Standard: `/home/commander/.ssh`
   - Oder eigenen Pfad eingeben

2. **Keys werden automatisch gescannt**
   - Zeigt alle gefundenen SSH-Keys
   - Deploy Keys werden erkannt (enthalten "deploy" im Namen)

3. **Deploy Keys auswählen**
   - Wähle welche Keys verwendet werden sollen
   - Eingabe: `1,2` für Keys 1 und 2
   - Oder: `all` für alle Deploy Keys

4. **Repository zuordnen**
   - Für jeden Key:
   - GitHub Owner eingeben (z.B. `GaboCapo`)
   - Repository Name (z.B. `persona-nexus-manager`)

5. **Aktiven Key wählen**
   - Welcher Key soll standardmäßig verwendet werden

## 📋 Verwaltung

### Deploy Keys anzeigen
```bash
cn-ssh -l
```

Zeigt alle konfigurierten Deploy Keys mit:
- ✅ Aktiver Key
- Repository-Zuordnung
- Pfad zum Key
- Hinzufügungsdatum

### Verbindung testen
```bash
cn-ssh -t
```

Testet die SSH-Verbindung und zeigt die gefundenen Branches.

## 🔧 Wie es funktioniert

### Prioritäten-Reihenfolge:

1. **SSH Deploy Key** (höchste Priorität)
   - Nutzt `git ls-remote` mit spezifischem SSH-Key
   - Funktioniert IMMER mit privaten Repos
   - Kein Token erforderlich!

2. **GitHub API mit Token** (Fallback 1)
   - Falls `GITHUB_TOKEN` gesetzt ist
   - Für Repos ohne Deploy Key

3. **GitHub API ohne Token** (Fallback 2)
   - Nur für öffentliche Repos
   - 60 Requests/Stunde Limit

4. **Cache** (Fallback 3)
   - `github-branches.json` als letzter Fallback

## 🔑 Deploy Key erstellen (GitHub)

Falls du noch keinen Deploy Key hast:

1. **Auf GitHub:**
   - Gehe zu: Repository → Settings → Deploy keys
   - "Add deploy key" klicken
   - Titel: z.B. "context-tracker"
   - Key: Inhalt von `~/.ssh/KEYNAME.pub` einfügen
   - "Allow write access": NICHT aktivieren (nur Lesen nötig)

2. **Lokal generieren:**
```bash
# Deploy Key generieren
ssh-keygen -t ed25519 -f ~/.ssh/reponame_deploy-key -C "deploy-key-for-reponame"

# Öffentlichen Key anzeigen (für GitHub)
cat ~/.ssh/reponame_deploy-key.pub
```

## 📁 Konfiguration

Die Konfiguration wird gespeichert in:
```
~/.config/context-tracker/deploy-keys.json
```

Beispiel:
```json
{
  "sshPath": "/home/commander/.ssh",
  "deployKeys": [
    {
      "name": "persona-nexus-manager_deploy-key",
      "path": "/home/commander/.ssh/persona-nexus-manager_deploy-key",
      "pubPath": "/home/commander/.ssh/persona-nexus-manager_deploy-key.pub",
      "owner": "GaboCapo",
      "repo": "persona-nexus-manager",
      "addedAt": "2025-01-20T10:00:00.000Z"
    }
  ],
  "activeKey": "persona-nexus-manager_deploy-key"
}
```

## ✅ Vorteile gegenüber Tokens

- **Sicherer**: Keys sind repository-spezifisch
- **Kein Ablaufdatum**: Deploy Keys laufen nie ab
- **Read-only**: Kann nur lesen, nicht schreiben
- **Einfache Verwaltung**: Pro Repo ein Key
- **Kein Rate Limit**: Keine API-Beschränkungen

## 🎯 Verwendung im Context-Tracker

Nach dem Setup funktioniert alles automatisch:

```bash
cd ~/Code/persona-nexus-manager
npm run context

# Output:
# → Versuche SSH Deploy Key...
# ✓ 11 Branches via SSH abgerufen
```

Das Tool nutzt automatisch den passenden Deploy Key für das aktuelle Repository!

## 🚨 Troubleshooting

### "Keine Deploy Keys konfiguriert"
→ Führe `cn-ssh -s` aus

### "SSH-Fehler: Permission denied"
→ Deploy Key hat keine Rechte für das Repo
→ Prüfe auf GitHub: Settings → Deploy keys

### "Kein passender Deploy Key gefunden"
→ Repository nicht in Konfiguration
→ Führe Setup erneut aus: `cn-ssh -s`

---

**Hinweis**: Deploy Keys sind die sicherste Methode für automatisierten Zugriff auf private GitHub Repositories!