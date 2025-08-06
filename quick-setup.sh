#!/bin/bash

# Context-Now Quick Setup
# Ein-Zeilen-Installation für Entwickler

echo "🚀 Context-Now Quick Setup"
echo "========================="
echo ""

# Prüfe ob git installiert ist
if ! command -v git &> /dev/null; then
    echo "❌ Git ist nicht installiert!"
    echo "Bitte installiere Git zuerst:"
    echo "  Ubuntu/Debian: sudo apt install git"
    echo "  macOS: brew install git"
    echo "  Fedora: sudo dnf install git"
    exit 1
fi

# Prüfe ob node installiert ist
if ! command -v node &> /dev/null; then
    echo "❌ Node.js ist nicht installiert!"
    echo "Bitte installiere Node.js zuerst:"
    echo "  https://nodejs.org/"
    exit 1
fi

# Clone und installiere
INSTALL_DIR="$HOME/Code/context-now"

if [ -d "$INSTALL_DIR" ]; then
    echo "📦 Repository existiert bereits, update..."
    cd "$INSTALL_DIR" && git pull
else
    echo "📦 Installiere Context-Now..."
    mkdir -p "$HOME/Code"
    git clone https://github.com/GaboCapo/context-now.git "$INSTALL_DIR"
fi

cd "$INSTALL_DIR"

# Führe Installer aus
if [ -f "./install.sh" ]; then
    echo "🔧 Führe Installation aus..."
    bash ./install.sh
else
    echo "❌ Installer nicht gefunden!"
    exit 1
fi

echo ""
echo "✅ Installation abgeschlossen!"
echo ""
echo "Nächste Schritte:"
echo "1. Terminal neu starten oder: source ~/.bashrc"
echo "2. Erstes Projekt verbinden: cn -c /pfad/zu/projekt"  
echo "3. Status prüfen: cn -s"
echo ""
echo "Viel Erfolg mit Context-Now! 🎯"
