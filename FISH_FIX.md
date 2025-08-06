# 🚨 WICHTIG für Fish Shell Nutzer

Falls du Fish Shell nutzt und der `cn` Befehl nicht funktioniert, führe bitte aus:

```bash
# Fix-Script ausführen
curl -sSL https://raw.githubusercontent.com/GaboCapo/context-now/main/fix-fish.sh | bash

# Oder wenn bereits geklont:
~/Code/context-now/fix-fish.sh

# Dann Shell neu laden:
source ~/.config/fish/config.fish
```

## Für alle betroffenen Nutzer - Schnellfix:

### Option 1: Installer erneut ausführen (empfohlen)
```bash
cd ~/Code/context-now
git pull
./install.sh
source ~/.bashrc  # oder ~/.zshrc oder ~/.config/fish/config.fish
```

### Option 2: Manueller Fix für Fish
```bash
# Environment setzen
echo 'set -gx PATH $PATH "$HOME/.local/bin"' >> ~/.config/fish/config.fish
source ~/.config/fish/config.fish
```

### Option 3: Direkt-Alias (Workaround)
```bash
# Für Fish
echo 'alias cn "$HOME/.context-now/cn"' >> ~/.config/fish/config.fish

# Für Bash/Zsh
echo 'alias cn="$HOME/.context-now/cn"' >> ~/.bashrc
```

## Prüfen ob es funktioniert:
```bash
cn --help
# oder
which cn
```

---
Entschuldigung für die Unannehmlichkeiten! Das Update behebt das Problem vollständig.
