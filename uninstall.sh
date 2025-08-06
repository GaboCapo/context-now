#!/bin/bash

# ========================================
# Context-Now Uninstaller Script
# Version: 1.0.0
# ========================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

# Paths
INSTALL_DIR="$HOME/.context-now"
CONFIG_DIR="$HOME/.config/context-now"
BIN_DIR="$HOME/.local/bin"

print_logo() {
    echo -e "${RED}"
    cat << "EOF"
    ╔═══════════════════════════════════════╗
    ║    Context-Now Uninstaller Tool      ║
    ╚═══════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

detect_shell() {
    if [ -n "$SHELL" ]; then
        case "$SHELL" in
            */bash) echo "bash" ;;
            */zsh) echo "zsh" ;;
            */fish) echo "fish" ;;
            *) echo "unknown" ;;
        esac
    else
        echo "unknown"
    fi
}

get_shell_config() {
    local shell_type=$(detect_shell)
    case "$shell_type" in
        bash)
            if [ -f "$HOME/.bashrc" ]; then
                echo "$HOME/.bashrc"
            elif [ -f "$HOME/.bash_profile" ]; then
                echo "$HOME/.bash_profile"
            else
                echo "$HOME/.profile"
            fi
            ;;
        zsh)
            if [ -f "$HOME/.zshrc" ]; then
                echo "$HOME/.zshrc"
            else
                echo "$HOME/.zprofile"
            fi
            ;;
        fish)
            echo "$HOME/.config/fish/config.fish"
            ;;
        *)
            echo "$HOME/.profile"
            ;;
    esac
}

clear
print_logo

echo -e "${YELLOW}This will remove Context-Now from your system.${NC}"
echo ""

# Check what's installed
echo -e "${CYAN}Found installations:${NC}"
[ -d "$INSTALL_DIR" ] && echo "  • Installation directory: $INSTALL_DIR"
[ -d "$CONFIG_DIR" ] && echo "  • Configuration directory: $CONFIG_DIR"
[ -L "$BIN_DIR/cn" ] && echo "  • Symlink: $BIN_DIR/cn"
[ -L "$BIN_DIR/kontext" ] && echo "  • Symlink: $BIN_DIR/kontext"
[ -L "$BIN_DIR/context" ] && echo "  • Symlink: $BIN_DIR/context"
[ -d "$HOME/.config/fish/functions" ] && ls "$HOME/.config/fish/functions"/cn-*.fish 2>/dev/null | head -n 1 > /dev/null && echo "  • Fish functions"
echo ""

# Confirmation
read -p "Do you want to continue? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Uninstallation cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${RED}Removing Context-Now...${NC}"

# Remove symlinks
echo "  • Removing symlinks..."
rm -f "$BIN_DIR/cn" "$BIN_DIR/kontext" "$BIN_DIR/context" "$BIN_DIR/context-now" 2>/dev/null || true

# Remove Fish functions
echo "  • Removing Fish functions..."
rm -f "$HOME/.config/fish/functions/cn-update.fish" 2>/dev/null || true
rm -f "$HOME/.config/fish/functions/cn-edit.fish" 2>/dev/null || true
rm -f "$HOME/.config/fish/functions/cn-backup.fish" 2>/dev/null || true

# Remove installation directory
if [ -d "$INSTALL_DIR" ]; then
    echo "  • Removing installation directory..."
    rm -rf "$INSTALL_DIR"
fi

# Ask about config
if [ -d "$CONFIG_DIR" ]; then
    echo ""
    echo -e "${YELLOW}Configuration directory contains your project data.${NC}"
    read -p "Remove configuration directory too? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "  • Removing configuration directory..."
        rm -rf "$CONFIG_DIR"
    else
        echo -e "${CYAN}Configuration kept at: $CONFIG_DIR${NC}"
    fi
fi

# Clean shell configuration
echo ""
echo -e "${YELLOW}Shell configuration cleanup:${NC}"
echo "Please manually remove these lines from your shell config:"
echo ""

SHELL_CONFIG=$(get_shell_config)
echo "File: $SHELL_CONFIG"
echo "Remove:"
echo "  # Context-Now Configuration"
echo "  [ -f \"\$HOME/.config/context-now/env.sh\" ] && source \"\$HOME/.config/context-now/env.sh\""

if [ "$(detect_shell)" = "fish" ]; then
    echo ""
    echo "For Fish, also remove:"
    echo "  if test -f \"\$HOME/.config/context-now/env.fish\""
    echo "      source \"\$HOME/.config/context-now/env.fish\""
    echo "  end"
fi

echo ""
echo -e "${GREEN}✅ Context-Now has been uninstalled!${NC}"
echo ""
echo -e "${CYAN}Thank you for using Context-Now!${NC}"
echo "If you change your mind, you can reinstall with:"
echo "  curl -sSL https://raw.githubusercontent.com/GaboCapo/context-now/main/quick-setup.sh | bash"
