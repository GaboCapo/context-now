#!/bin/bash

# Emergency Fix for Context-Now Path Issue
# Fixes: Cannot find module error

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🔧 Context-Now Emergency Path Fix${NC}"
echo "===================================="
echo ""

# Check if installation exists
if [ ! -d "$HOME/.context-now" ]; then
    echo -e "${RED}Context-Now not found in ~/.context-now${NC}"
    echo "Please run the installer first:"
    echo "  curl -sSL https://raw.githubusercontent.com/GaboCapo/context-now/main/quick-setup.sh | bash"
    exit 1
fi

# Fix the cn script
echo -e "${YELLOW}Fixing cn launcher script...${NC}"

# Create corrected cn script
cat > "$HOME/.context-now/cn" << 'EOF'
#!/bin/bash
# Context-Now Launcher Script

# Find the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Execute context-now.js with passed arguments
node "$SCRIPT_DIR/context-now.js" "$@"
EOF

chmod +x "$HOME/.context-now/cn"

# Recreate symlinks
echo -e "${YELLOW}Recreating symlinks...${NC}"
mkdir -p "$HOME/.local/bin"
ln -sf "$HOME/.context-now/cn" "$HOME/.local/bin/cn"
ln -sf "$HOME/.context-now/cn" "$HOME/.local/bin/kontext"
ln -sf "$HOME/.context-now/cn" "$HOME/.local/bin/context"

echo -e "${GREEN}✅ Path issue fixed!${NC}"
echo ""
echo "Now test with: cn --help"
echo ""
echo "If it still doesn't work, make sure ~/.local/bin is in your PATH:"
echo "  export PATH=\"\$PATH:\$HOME/.local/bin\""
