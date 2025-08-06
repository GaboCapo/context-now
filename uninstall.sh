#!/bin/bash

# Context-Now Uninstaller Script v2
# Fixed version without typos

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

print_header() {
    printf "${RED}\n"
    printf "╔═══════════════════════════════════════╗\n"
    printf "║    Context-Now Uninstaller Tool      ║\n"
    printf "╚═══════════════════════════════════════╝\n"
    printf "${NC}\n"
}

detect_shell() {
    if [ -n "$SHELL" ]; then
        case "$SHELL" in
            */bash) printf "bash" ;;
            */zsh) printf "zsh" ;;
            */fish) printf "fish" ;;
            *) printf "unknown" ;;
        esac
    else
        printf "unknown"
    fi
}

get_shell_config() {
    local shell_type=$(detect_shell)
    case "$shell_type" in
        bash)
            [ -f "$HOME/.bashrc" ] && printf "$HOME/.bashrc" || printf "$HOME/.bash_profile"
            ;;
        zsh)
            [ -f "$HOME/.zshrc" ] && printf "$HOME/.zshrc" || printf "$HOME/.zprofile"
            ;;
        fish)
            printf "$HOME/.config/fish/config.fish"
            ;;
        *)
            printf "$HOME/.profile"
            ;;
    esac
}

# Main
clear
print_header

printf "${YELLOW}This will remove Context-Now from your system.${NC}\n\n"

# Check installations
printf "${CYAN}Found installations:${NC}\n"
[ -d "$INSTALL_DIR" ] && printf "  • Installation directory: $INSTALL_DIR\n"
[ -d "$CONFIG_DIR" ] && printf "  • Configuration directory: $CONFIG_DIR\n"
[ -L "$BIN_DIR/cn" ] && printf "  • Symlink: $BIN_DIR/cn\n"
[ -L "$BIN_DIR/kontext" ] && printf "  • Symlink: $BIN_DIR/kontext\n"
[ -L "$BIN_DIR/context" ] && printf "  • Symlink: $BIN_DIR/context\n"

# Check for Fish functions
if [ -d "$HOME/.config/fish/functions" ]; then
    if ls "$HOME/.config/fish/functions"/cn-*.fish >/dev/null 2>&1; then
        printf "  • Fish functions\n"
    fi
fi

printf "\n"

# Confirmation
printf "Do you want to continue? (y/N): "
read -r REPLY
if [ "$REPLY" != "y" ] && [ "$REPLY" != "Y" ]; then
    printf "${YELLOW}Uninstallation cancelled.${NC}\n"
    exit 0
fi

printf "\n${RED}Removing Context-Now...${NC}\n"

# Remove symlinks
printf "  • Removing symlinks...\n"
rm -f "$BIN_DIR/cn" "$BIN_DIR/kontext" "$BIN_DIR/context" "$BIN_DIR/context-now" 2>/dev/null || true

# Remove Fish functions
printf "  • Removing Fish functions...\n"
rm -f "$HOME/.config/fish/functions/cn-update.fish" 2>/dev/null || true
rm -f "$HOME/.config/fish/functions/cn-edit.fish" 2>/dev/null || true
rm -f "$HOME/.config/fish/functions/cn-backup.fish" 2>/dev/null || true

# Remove installation
if [ -d "$INSTALL_DIR" ]; then
    printf "  • Removing installation directory...\n"
    rm -rf "$INSTALL_DIR"
fi

# Ask about config
if [ -d "$CONFIG_DIR" ]; then
    printf "\n${YELLOW}Configuration directory contains your project data.${NC}\n"
    printf "Remove configuration directory too? (y/N): "
    read -r REPLY
    if [ "$REPLY" = "y" ] || [ "$REPLY" = "Y" ]; then
        printf "  • Removing configuration directory...\n"
        rm -rf "$CONFIG_DIR"
    else
        printf "${CYAN}Configuration kept at: $CONFIG_DIR${NC}\n"
    fi
fi

# Shell config cleanup instructions
printf "\n${YELLOW}Shell configuration cleanup:${NC}\n"
printf "Please manually remove these lines from your shell config:\n\n"

SHELL_CONFIG=$(get_shell_config)
printf "File: $SHELL_CONFIG\n"
printf "Remove:\n"
printf "  # Context-Now Configuration\n"
printf "  [ -f \"\$HOME/.config/context-now/env.sh\" ] && source \"\$HOME/.config/context-now/env.sh\"\n"

if [ "$(detect_shell)" = "fish" ]; then
    printf "\nFor Fish, also remove:\n"
    printf "  if test -f \"\$HOME/.config/context-now/env.fish\"\n"
    printf "      source \"\$HOME/.config/context-now/env.fish\"\n"
    printf "  end\n"
fi

printf "\n${GREEN}✅ Context-Now has been uninstalled!${NC}\n\n"
printf "${CYAN}Thank you for using Context-Now!${NC}\n"
printf "If you change your mind, you can reinstall with:\n"
printf "  curl -sSL https://raw.githubusercontent.com/GaboCapo/context-now/main/quick-setup.sh | bash\n"
