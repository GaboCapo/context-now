#!/bin/bash

# Context-Now Fish Shell Fix Script
# Repariert die Installation für Fish Shell Nutzer

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🐟 Context-Now Fish Shell Fix${NC}"
echo "================================"
echo ""

# Check if Fish is installed
if ! command -v fish &> /dev/null; then
    echo -e "${RED}Fish shell is not installed or not the current shell${NC}"
    exit 1
fi

# Paths
INSTALL_DIR="$HOME/.context-now"
CONFIG_DIR="$HOME/.config/context-now"
BIN_DIR="$HOME/.local/bin"

# Create directories if they don't exist
mkdir -p "$CONFIG_DIR"
mkdir -p "$HOME/.config/fish/functions"
mkdir -p "$BIN_DIR"

# Create Fish environment file
cat > "$CONFIG_DIR/env.fish" << 'EOF'
# Context-Now Environment Variables for Fish
set -gx CONTEXT_NOW_HOME "$HOME/.context-now"
set -gx CONTEXT_NOW_CONFIG "$HOME/.config/context-now"
set -gx CONTEXT_NOW_PROJECTS "$HOME/.config/context-now/projects.json"
set -gx PATH $PATH "$HOME/.local/bin"

# Aliases for Fish
alias cn "$HOME/.context-now/cn"
alias kontext "$HOME/.context-now/cn"
alias context "$HOME/.context-now/cn"
EOF

# Add to Fish config if not already there
if ! grep -q "Context-Now Configuration" "$HOME/.config/fish/config.fish" 2>/dev/null; then
    echo "" >> "$HOME/.config/fish/config.fish"
    echo "# Context-Now Configuration" >> "$HOME/.config/fish/config.fish"
    echo "if test -f \"$CONFIG_DIR/env.fish\"" >> "$HOME/.config/fish/config.fish"
    echo "    source \"$CONFIG_DIR/env.fish\"" >> "$HOME/.config/fish/config.fish"
    echo "end" >> "$HOME/.config/fish/config.fish"
fi

echo -e "${GREEN}✅ Fish configuration fixed!${NC}"
echo ""
echo -e "${YELLOW}Please run one of the following:${NC}"
echo "  1. Restart your terminal"
echo "  2. Run: source ~/.config/fish/config.fish"
echo ""
echo "Then test with: cn --help"
