# 🔐 GitHub Token Setup

Das Context-Tracker Tool kann direkt von der GitHub API die echten Branch-Daten abrufen.
Für private Repositories ist ein GitHub Personal Access Token erforderlich.

## Token erstellen

1. Gehe zu GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Klicke auf "Generate new token (classic)"
3. Gib einen Namen ein: z.B. "context-tracker"
4. Wähle folgende Scopes:
   - `repo` (für private Repos)
   - Oder nur `public_repo` (für öffentliche Repos)
5. Klicke auf "Generate token"
6. **KOPIERE DEN TOKEN SOFORT** (wird nur einmal angezeigt!)

## Token verwenden

### Option 1: Umgebungsvariable (empfohlen)
```bash
export GITHUB_TOKEN="ghp_deinTokenHier"
# oder
export GH_TOKEN="ghp_deinTokenHier"

# Dann normal verwenden:
npm run context
```

### Option 2: In .bashrc/.zshrc speichern
```bash
echo 'export GITHUB_TOKEN="ghp_deinTokenHier"' >> ~/.bashrc
source ~/.bashrc
```

### Option 3: .env Datei (für Projekte)
```bash
# In deinem Projekt:
echo "GITHUB_TOKEN=ghp_deinTokenHier" > .env
# Füge .env zu .gitignore hinzu!
```

## Ohne Token

Ohne Token funktioniert das Tool:
- ✅ Mit öffentlichen Repositories
- ✅ Mit der gespeicherten github-branches.json
- ❌ NICHT mit privaten Repositories

## Rate Limits

- Ohne Token: 60 Requests pro Stunde
- Mit Token: 5000 Requests pro Stunde

## Sicherheit

- **NIEMALS** den Token in Git committen!
- Token nur mit minimalen Rechten erstellen
- Token regelmäßig rotieren
- Bei Leak sofort auf GitHub widerrufen

## Troubleshooting

### "Repository nicht gefunden oder privat"
→ Token fehlt oder hat keine Rechte für das Repo

### "GitHub API Rate Limit erreicht"
→ Zu viele Requests. Mit Token erhöht sich das Limit.

### "GitHub API Zugriff verweigert"
→ Token ist ungültig oder abgelaufen