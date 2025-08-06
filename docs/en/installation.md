# Installation Guide

Here you will find all the information you need to install and set up `context-now` on your system.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Quick Install (Recommended)](#quick-install-recommended)
- [Manual Installation (for Developers)](#manual-installation-for-developers)
- [Uninstallation](#uninstallation)
- [Troubleshooting](#troubleshooting)
- [Deprecated Method: Manual Setup per Project](#deprecated-method-manual-setup-per-project)

---

## Prerequisites
- **Node.js**: Version 14.0.0 or higher
- **npm**: Version 6.0.0 or higher
- **Git**: Version 2.0 or higher
- **Operating System**: Linux, macOS, or Windows (with WSL)
- **Shell**: Bash, Zsh, or Fish

---

## Quick Install (Recommended)

This is the easiest and fastest way to install `context-now`.

```bash
# Download and run the installation script
curl -sSL https://raw.githubusercontent.com/GaboCapo/context-now/main/quick-setup.sh | bash
```
Alternatively, you can clone the repository first:
```bash
# Clone the repository
git clone https://github.com/GaboCapo/context-now.git ~/Code/context-now
cd ~/Code/context-now

# Run the installer
./install.sh
```

**What does the installer do?**
- ✅ Checks all system prerequisites.
- ✅ Installs the tool to `~/.context-now`.
- ✅ Sets up the necessary configuration files in `~/.config/context-now`.
- ✅ Creates the aliases `cn`, `kontext`, and `context` for easy access.
- ✅ Configures your shell (adds environment variables).
- ✅ Sets up auto-completion for commands (Bash/Zsh).

After installation, you need to reload your shell for the changes to take effect:
```bash
# For Bash
source ~/.bashrc

# For Zsh
source ~/.zshrc
```

---

## Manual Installation (for Developers)

This method gives you full control over the installation.

### 1. Clone the repository
```bash
git clone https://github.com/GaboCapo/context-now.git ~/Code/context-now
cd ~/Code/context-now
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Add the following lines to your shell configuration file (`~/.bashrc`, `~/.zshrc`, or `~/.config/fish/config.fish`):
```bash
# Context-Now Environment
export CONTEXT_NOW_HOME="$HOME/Code/context-now"
export CONTEXT_NOW_CONFIG="$HOME/.config/context-now"
export PATH="$PATH:$CONTEXT_NOW_HOME"

# Aliases for quick access
alias cn='$CONTEXT_NOW_HOME/cn'
alias kontext='$CONTEXT_NOW_HOME/cn'
alias context='$CONTEXT_NOW_HOME/cn'
```

### 4. Make scripts executable
```bash
chmod +x ~/Code/context-now/cn
chmod +x ~/Code/context-now/context-now.js
```

---

## Uninstallation

### Automatic Uninstallation (Recommended)
If you installed the tool using the installer script, you can remove it as follows:
```bash
# Download the uninstallation script and run it interactively
bash <(curl -sSL https://raw.githubusercontent.com/GaboCapo/context-now/main/uninstall.sh)
```
Or, if you still have the repository:
```bash
~/Code/context-now/uninstall.sh
```

### Manual Uninstallation
1.  **Remove symlinks**:
    `rm -f ~/.local/bin/cn ~/.local/bin/kontext ~/.local/bin/context`
2.  **Remove installation**:
    `rm -rf ~/.context-now`
3.  **Remove configuration** (Warning: contains your project data!):
    `rm -rf ~/.config/context-now`
4.  **Clean up shell configuration**:
    Manually remove the `context-now` entries from your `~/.bashrc` or `~/.zshrc`.

---

## Troubleshooting

- **"command not found: cn"**:
  Make sure the installation path is included in your `$PATH` (`echo $PATH`) and reload your shell (`source ~/.bashrc`).

- **"Permission denied"**:
  Grant execution rights to the scripts: `chmod +x ~/Code/context-now/cn`.

- **"Module not found"**:
  Reinstall the `npm` dependencies: `cd ~/Code/context-now && npm install`.

---

## Deprecated Method: Manual Setup per Project

This method is **no longer recommended** as it does not receive updates and does not offer multi-project support. It is listed here for completeness only.

### 1. Copy tool files
Copy the `tools` folder from the `context-now` repository into your own project.
```bash
# In your project directory
cp -r /path/to/context-now/tools .
```

### 2. Add NPM scripts
Add the following scripts to your `package.json`:
```json
"scripts": {
  "context": "node tools/context-tracker/context-tracker.js status",
  "context:sync": "node tools/context-tracker/context-tracker.js sync",
  "context:update": "node tools/context-tracker/context-tracker.js update"
}
```

### 3. Create project-specific files
Create the necessary JSON files in the `tools/context-tracker` folder of your project by copying the `.template.json` files.
```bash
cd tools/context-tracker
cp issues.template.json issues.json
cp prs.template.json prs.json
# ... and so on for the other templates.
```
This method requires manual updates and is significantly more cumbersome to manage.

Here are the steps as described in the old documentation:

#### 1. Copy tool files
```bash
# Change to your project directory
cd /path/to/your/project

# Copy Context-Tracker tools
cp -r /path/to/context-now/tools .
```

#### 2. Add NPM Scripts
Add the following scripts to your `package.json`:
```json
"scripts": {
  "context": "node tools/context-tracker/context-tracker.js status",
  "context:sync": "node tools/context-tracker/context-tracker.js sync",
  "context:update": "node tools/context-tracker/context-tracker.js update"
}
```

#### 3. Create project-specific files
Create the necessary JSON files in the `tools/context-tracker` folder by copying the `.template.json` files.
```bash
cd tools/context-tracker
cp issues.template.json issues.json
cp prs.template.json prs.json
cp project-memory.template.json project-memory.json
echo '["main", "develop"]' > github-branches.json
echo '{}' > issue-relations.json
```
Afterward, these files must be filled with the actual project data.
