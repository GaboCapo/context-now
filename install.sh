#!/bin/bash

# ========================================
# Context-Now Installer Script
# Version: 2.0.0
# ========================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Installation paths
INSTALL_DIR="$HOME/.context-now"
CONFIG_DIR="$HOME/.config/context-now"
BIN_DIR="$HOME/.local/bin"
CURRENT_DIR="$(pwd)"

# ASCII Art Logo
print_logo() {
    echo -e "${CYAN}"
    cat << "EOF"
    ╔═══════════════════════════════════════╗
    ║     Context-Now Installation Tool     ║
    ║         Professional Edition          ║
    ╚═══════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

# Print colored message
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Print step
print_step() {
    echo -e "\n${BOLD}${BLUE}▶ $1${NC}"
}

# Print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Print warning
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Detect shell
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

# Get shell config file
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

# Check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites..."
    
    local missing_deps=()
    
    # Check Node.js
    if command_exists node; then
        NODE_VERSION=$(node -v | cut -d 'v' -f 2)
        print_success "Node.js v${NODE_VERSION} found"
    else
        missing_deps+=("Node.js")
    fi
    
    # Check Git
    if command_exists git; then
        GIT_VERSION=$(git --version | cut -d ' ' -f 3)
        print_success "Git v${GIT_VERSION} found"
    else
        missing_deps+=("Git")
    fi
    
    # Check npm
    if command_exists npm; then
        NPM_VERSION=$(npm -v)
        print_success "npm v${NPM_VERSION} found"
    else
        missing_deps+=("npm")
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        print_error "Missing dependencies: ${missing_deps[*]}"
        print_message "$YELLOW" "Please install the missing dependencies and run the installer again."
        exit 1
    fi
}

# Backup existing installation
backup_existing() {
    if [ -d "$INSTALL_DIR" ]; then
        print_step "Backing up existing installation..."
        BACKUP_DIR="${INSTALL_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
        mv "$INSTALL_DIR" "$BACKUP_DIR"
        print_success "Backup created at: $BACKUP_DIR"
    fi
}

# Install Context-Now
install_context_now() {
    print_step "Installing Context-Now..."
    
    # Create directories
    mkdir -p "$INSTALL_DIR"
    mkdir -p "$CONFIG_DIR"
    mkdir -p "$BIN_DIR"
    
    # Copy files from current directory or clone from git
    if [ -f "$CURRENT_DIR/context-now.js" ]; then
        print_message "$CYAN" "Installing from local directory..."
        cp -r "$CURRENT_DIR"/* "$INSTALL_DIR/"
    else
        print_message "$CYAN" "Cloning from repository..."
        git clone https://github.com/yourusername/context-now.git "$INSTALL_DIR"
    fi
    
    print_success "Context-Now installed to $INSTALL_DIR"
}

# Setup environment variables
setup_environment() {
    print_step "Setting up environment variables..."
    
    local shell_config=$(get_shell_config)
    local shell_type=$(detect_shell)
    
    # Create environment configuration for bash/zsh
    cat > "$CONFIG_DIR/env.sh" << EOF
# Context-Now Environment Variables
export CONTEXT_NOW_HOME="$INSTALL_DIR"
export CONTEXT_NOW_CONFIG="$CONFIG_DIR"
export CONTEXT_NOW_PROJECTS="$CONFIG_DIR/projects.json"
export PATH="\$PATH:$BIN_DIR"

# Aliases
alias cn='$INSTALL_DIR/cn'
alias kontext='$INSTALL_DIR/cn'
alias context='$INSTALL_DIR/cn'

# Functions
cn-update() {
    cd "$INSTALL_DIR" && git pull && cd - > /dev/null
    echo "Context-Now updated successfully!"
}

cn-edit() {
    \${EDITOR:-nano} "$CONFIG_DIR/projects.json"
}

cn-backup() {
    local backup_file="$CONFIG_DIR/backup_\$(date +%Y%m%d_%H%M%S).tar.gz"
    tar -czf "\$backup_file" -C "$CONFIG_DIR" .
    echo "Backup created: \$backup_file"
}
EOF
    
    # Create Fish-specific configuration
    if [ "$shell_type" = "fish" ]; then
        mkdir -p "$HOME/.config/fish/functions"
        
        # Environment variables for Fish
        cat > "$CONFIG_DIR/env.fish" << EOF
# Context-Now Environment Variables for Fish
set -gx CONTEXT_NOW_HOME "$INSTALL_DIR"
set -gx CONTEXT_NOW_CONFIG "$CONFIG_DIR"
set -gx CONTEXT_NOW_PROJECTS "$CONFIG_DIR/projects.json"
set -gx PATH \$PATH "$BIN_DIR"

# Aliases for Fish
alias cn '$INSTALL_DIR/cn'
alias kontext '$INSTALL_DIR/cn'
alias context '$INSTALL_DIR/cn'
EOF
        
        # Functions for Fish
        cat > "$HOME/.config/fish/functions/cn-update.fish" << EOF
function cn-update
    cd "$INSTALL_DIR" && git pull && cd - > /dev/null
    echo "Context-Now updated successfully!"
end
EOF
        
        cat > "$HOME/.config/fish/functions/cn-edit.fish" << EOF
function cn-edit
    if set -q EDITOR
        \$EDITOR "$CONFIG_DIR/projects.json"
    else
        nano "$CONFIG_DIR/projects.json"
    end
end
EOF
        
        cat > "$HOME/.config/fish/functions/cn-backup.fish" << EOF
function cn-backup
    set backup_file "$CONFIG_DIR/backup_(date +%Y%m%d_%H%M%S).tar.gz"
    tar -czf "\$backup_file" -C "$CONFIG_DIR" .
    echo "Backup created: \$backup_file"
end
EOF
        print_success "Fish-specific configuration created"
    fi
    
    print_success "Environment configuration created"
}

# Create symlinks
create_symlinks() {
    print_step "Creating symlinks..."
    
    # Create main executable symlink
    chmod +x "$INSTALL_DIR/cn"
    ln -sf "$INSTALL_DIR/cn" "$BIN_DIR/cn"
    ln -sf "$INSTALL_DIR/cn" "$BIN_DIR/kontext"
    ln -sf "$INSTALL_DIR/cn" "$BIN_DIR/context"
    
    # Create context-now.js symlink
    chmod +x "$INSTALL_DIR/context-now.js"
    ln -sf "$INSTALL_DIR/context-now.js" "$BIN_DIR/context-now"
    
    print_success "Symlinks created in $BIN_DIR"
}

# Update shell configuration
update_shell_config() {
    print_step "Updating shell configuration..."
    
    local shell_config=$(get_shell_config)
    local shell_type=$(detect_shell)
    
    # Special handling for Fish shell
    if [ "$shell_type" = "fish" ]; then
        # Check if already configured
        if grep -q "CONTEXT_NOW_HOME" "$shell_config" 2>/dev/null; then
            print_warning "Shell already configured, skipping..."
            return
        fi
        
        # Add Fish configuration
        echo "" >> "$shell_config"
        echo "# Context-Now Configuration" >> "$shell_config"
        echo "if test -f \"$CONFIG_DIR/env.fish\"" >> "$shell_config"
        echo "    source \"$CONFIG_DIR/env.fish\"" >> "$shell_config"
        echo "end" >> "$shell_config"
        
        print_success "Fish shell configuration updated: $shell_config"
        return
    fi
    
    # For Bash/Zsh
    # Check if already configured
    if grep -q "CONTEXT_NOW_HOME" "$shell_config" 2>/dev/null; then
        print_warning "Shell already configured, skipping..."
        return
    fi
    
    # Add source line to shell config
    echo "" >> "$shell_config"
    echo "# Context-Now Configuration" >> "$shell_config"
    echo "[ -f \"$CONFIG_DIR/env.sh\" ] && source \"$CONFIG_DIR/env.sh\"" >> "$shell_config"
    
    print_success "Shell configuration updated: $shell_config"
}

# Initialize project templates
init_templates() {
    print_step "Initializing project templates..."
    
    # Create example project configuration
    if [ ! -f "$CONFIG_DIR/projects.json" ]; then
        cat > "$CONFIG_DIR/projects.json" << 'EOF'
{
  "projects": [],
  "settings": {
    "defaultEditor": "code",
    "autoSync": true,
    "colorOutput": true,
    "maxRecentProjects": 10
  }
}
EOF
        print_success "Project configuration initialized"
    else
        print_warning "Project configuration already exists"
    fi
}

# Install npm dependencies
install_dependencies() {
    print_step "Installing npm dependencies..."
    
    cd "$INSTALL_DIR"
    
    # Check if package.json exists
    if [ -f "package.json" ]; then
        npm install --silent
        print_success "Dependencies installed"
    else
        print_warning "No package.json found, skipping dependency installation"
    fi
    
    cd "$CURRENT_DIR"
}

# Setup auto-completion
setup_autocomplete() {
    print_step "Setting up auto-completion..."
    
    local shell_type=$(detect_shell)
    
    case "$shell_type" in
        bash)
            cat > "$CONFIG_DIR/completion.bash" << 'EOF'
# Context-Now bash completion
_cn_complete() {
    local cur="${COMP_WORDS[COMP_CWORD]}"
    local commands="status sync update help -c -l -g -s -h --connect --list --goto --status --help"
    
    if [ $COMP_CWORD -eq 1 ]; then
        COMPREPLY=($(compgen -W "$commands" -- "$cur"))
    fi
}

complete -F _cn_complete cn
complete -F _cn_complete kontext
complete -F _cn_complete context
EOF
            echo "[ -f \"$CONFIG_DIR/completion.bash\" ] && source \"$CONFIG_DIR/completion.bash\"" >> $(get_shell_config)
            print_success "Bash completion installed"
            ;;
            
        zsh)
            cat > "$CONFIG_DIR/completion.zsh" << 'EOF'
# Context-Now zsh completion
_cn_complete() {
    local -a commands
    commands=(
        'status:Show project status'
        'sync:Sync with repository'
        'update:Update context'
        'help:Show help'
        '-c:Connect project'
        '-l:List projects'
        '-g:Go to project'
        '-s:Show status'
        '-h:Show help'
    )
    _describe 'command' commands
}

compdef _cn_complete cn
compdef _cn_complete kontext
compdef _cn_complete context
EOF
            echo "[ -f \"$CONFIG_DIR/completion.zsh\" ] && source \"$CONFIG_DIR/completion.zsh\"" >> $(get_shell_config)
            print_success "Zsh completion installed"
            ;;
            
        *)
            print_warning "Auto-completion not available for $shell_type"
            ;;
    esac
}

# Display installation summary
show_summary() {
    echo
    print_message "$GREEN" "╔═══════════════════════════════════════════════════════╗"
    print_message "$GREEN" "║     Context-Now Installation Complete! 🎉             ║"
    print_message "$GREEN" "╚═══════════════════════════════════════════════════════╝"
    echo
    
    print_message "$CYAN" "Installation Details:"
    echo "  • Install Directory: $INSTALL_DIR"
    echo "  • Config Directory:  $CONFIG_DIR"
    echo "  • Binary Directory:  $BIN_DIR"
    echo
    
    print_message "$YELLOW" "Available Commands:"
    echo "  • cn / kontext / context - Main command"
    echo "  • cn -c <path>          - Connect a project"
    echo "  • cn -l                 - List all projects"
    echo "  • cn -g <name/number>   - Go to project"
    echo "  • cn -s                 - Show status"
    echo "  • cn-update             - Update Context-Now"
    echo "  • cn-edit               - Edit project configuration"
    echo "  • cn-backup             - Create backup"
    echo
    
    print_message "$MAGENTA" "Quick Start:"
    echo "  1. Reload your shell or run: source $(get_shell_config)"
    echo "  2. Connect your first project: cn -c /path/to/project"
    echo "  3. Check status: cn -s"
    echo
    
    print_message "$BOLD" "Documentation:"
    echo "  • README: $INSTALL_DIR/README.md"
    echo "  • Installation Guide: $INSTALL_DIR/INSTALLATION.md"
    echo "  • GitHub: https://github.com/yourusername/context-now"
}

# Uninstall function
uninstall() {
    print_message "$RED" "Uninstalling Context-Now..."
    
    # Remove symlinks
    rm -f "$BIN_DIR/cn" "$BIN_DIR/kontext" "$BIN_DIR/context" "$BIN_DIR/context-now"
    
    # Remove installation directory
    if [ -d "$INSTALL_DIR" ]; then
        rm -rf "$INSTALL_DIR"
    fi
    
    # Remove config directory (ask first)
    if [ -d "$CONFIG_DIR" ]; then
        read -p "Remove configuration files? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf "$CONFIG_DIR"
        fi
    fi
    
    print_success "Context-Now uninstalled"
    print_warning "Please manually remove the source line from your shell config"
}

# Main installation flow
main() {
    clear
    print_logo
    
    # Parse arguments
    case "${1:-}" in
        --uninstall|-u)
            uninstall
            exit 0
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --help, -h       Show this help"
            echo "  --uninstall, -u  Uninstall Context-Now"
            echo "  --update         Update existing installation"
            echo "  --force          Force installation (skip backups)"
            exit 0
            ;;
        --update)
            print_step "Updating Context-Now..."
            cd "$INSTALL_DIR" && git pull
            print_success "Update complete!"
            exit 0
            ;;
    esac
    
    # Run installation steps
    check_prerequisites
    
    if [[ "${1:-}" != "--force" ]]; then
        backup_existing
    fi
    
    install_context_now
    setup_environment
    create_symlinks
    update_shell_config
    init_templates
    install_dependencies
    setup_autocomplete
    
    # Show summary
    show_summary
    
    # Final message
    print_message "$BOLD$GREEN" "\n✨ Installation successful! Please restart your shell or run:"
    print_message "$CYAN" "   source $(get_shell_config)"
}

# Run main function
main "$@"
