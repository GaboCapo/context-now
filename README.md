*[Deutsch](docs/de/README.md) | English*

> For detailed documentation, please visit our [**docs folder**](./docs/en/index.md).

<p align="center">
  <img width="256" height="256" alt="Context-Now Logo" src="https://github.com/user-attachments/assets/ed19b593-2d4f-4372-9ba0-2edb17ce0f52" />
</p>

⚠️ **Breaking Change in v2.0.0**: `npm run context` has been renamed to `npm run context-now` to avoid namespace conflicts. See [Migration Guide](docs/MIGRATION.md) for details.

⚠️ This project is still under active development. Some features may not work as expected.


# 🎯 Context-Now - Git Project Context Tracker

An intelligent tool for managing Git project contexts, issues, branches and pull requests with automatic synchronization.

## ✨ Features

- **🤖 AI-Native (MCP)**: First-class integration with Claude Desktop & Claude Code via Model Context Protocol
- **Git Integration**: Live synchronization with local and remote branches, automatic branch-to-issue mapping
- **Issue & PR Tracking**: Manage issues and pull requests directly from the terminal with gh CLI integration
- **🎯 Intelligent Recommendations**: Priority-based action suggestions with copy-paste ready commands
  - Detects critical issues and security problems
  - Warns about uncommitted changes
  - Suggests branch cleanup strategies
  - Provides context-aware next steps
- **📊 Enterprise Scale**: Handles repositories with thousands of issues ([see demos](docs/DEMO-REPOSITORIES.md))
  - Automatic performance optimization
  - Smart chunking for large datasets
  - Statistical views for massive repos
- **Developer Handover**: Special modes for seamless team handovers
- **Multi-Project Support**: Manage multiple Git projects with one tool
- **SSH Config Support**: Works with custom SSH configs (e.g., `git@github.com-work:owner/repo`)
- **🔒 Security-First**: No shell execution, injection-proof design

## 🤖 AI Assistant Compatibility (MCP)

| Platform | Status | Configuration | Notes |
|----------|--------|---------------|-------|
| Claude Desktop | 🟡 Testing | [MCP Guide](docs/MCP-INTEGRATION.md) | Full MCP support |
| Claude Code | 🟡 Testing | [MCP Guide](docs/MCP-INTEGRATION.md) | VS Code extension |
| Continue.dev | 🔵 Planned | Coming soon | MCP planned |
| Cody | 🔵 Planned | - | Evaluating |
| GitHub Copilot | ⚫ N/A | - | No MCP |
| Cursor | ⚫ N/A | - | No MCP |

## 🔧 Git Provider Compatibility

| Provider | Status | Notes |
|----------|--------|-------|
| GitHub | ✅ Fully tested | All features work |
| GitLab | 🟠 Not tested | Contributions welcome! |
| Bitbucket | 🟠 Not tested | Contributions welcome! |
| Gitea | 🟠 Not tested | Contributions welcome! |
| Azure DevOps | 🟠 Not tested | Contributions welcome! |
| AWS CodeCommit | 🟠 Not tested | Contributions welcome! |
| SourceForge | 🟠 Not tested | Contributions welcome! |
| Codeberg | 🟠 Not tested | Contributions welcome! |

> **Note:** Context-Now has only been tested with GitHub so far. We welcome feedback and contributions for other Git providers! If you test it with another provider, let us know via [Issues](https://github.com/GaboCapo/context-now/issues).

## 🔄 Migration from older versions

If you get `npm error Missing script: "context"`, you need to update your npm scripts:

```bash
# Quick fix - update npm scripts for your project:
cn --update-scripts <your-project-name>

# Then use the new commands:
npm run context-now        # (was: npm run context)
npm run context-now:sync   # (was: npm run context:sync)
```

See [Migration Guide](docs/MIGRATION.md) for full details.

## 🚀 Installation

> ⚠️ **Important**: Context-Now is **NOT an official NPM package**. We use NPM features for professional installation without publishing to npmjs.com.

### Recommended: NPM Link Method
```bash
# 1. Clone repository
git clone https://github.com/GaboCapo/context-now.git ~/Code/context-now
cd ~/Code/context-now

# 2. Install dependencies
npm install

# 3. Make globally available (without publishing!)
npm link

# 4. Verify installation
cn --version
```

**What is npm link?** It creates a global symlink to your local code, giving you all NPM features without publishing. [Learn more →](docs/NPM-LINK-EXPLAINED.md)

### Alternative: Direct from GitHub
```bash
# Install directly from GitHub (no npmjs.com!)
npm install -g github:GaboCapo/context-now
```

### Alternative: Shell Script
```bash
# Traditional installation without NPM
curl -sSL https://raw.githubusercontent.com/GaboCapo/context-now/main/quick-setup.sh | bash
```

### What gets installed?
- ✅ Global `cn` command
- ✅ Configuration in `~/.config/context-now`
- ✅ Full NPM dependency management
- ✅ Live updates with npm link
- ✅ No npmjs.com account needed
- ✅ No public package responsibility

📚 **Documentation:**
- [Installation Guide](docs/INSTALLATION-2024.md) - Detailed installation instructions
- [NPM Link Explained](docs/NPM-LINK-EXPLAINED.md) - Understanding npm link
- [Command Reference](docs/COMMANDS.md) - All available commands

## 📋 Usage

### Connect a project
```bash
cn -c /path/to/your/project
# or
~/Code/context-now/cn -c ~/Code/my-project
```

### List projects
```bash
cn -l
```

### Switch to project
```bash
cn -g 1                    # By number
cn -g my-project           # By name
```

### Show project status
```bash
cn -s                      # Current project
cn -s my-project           # Specific project
```

### Disconnect project
```bash
cn -d my-project
```

## 🚀 Performance & Scale

Context-Now has been tested with some of the largest repositories on GitHub:

- **microsoft/vscode**: ~8,000+ issues ⚠️ (requires chunking)
- **kubernetes/kubernetes**: ~2,000+ issues ⚠️ (high impact)
- **facebook/react**: ~1,000+ issues ✅ (good performance)
- **tensorflow/tensorflow**: ~2,500+ issues ⚠️ (needs optimization)

👉 **[See detailed performance demos and examples](docs/DEMO-REPOSITORIES.md)**

## 📊 Example Output

Here's what Context-Now shows you when running `cn -s` or `npm run context-now`:

```
🔄 Prüfe Status...
  → Versuche Issues über gh CLI zu holen...
  ✓ 63 Issues über gh CLI abgerufen
  ✓ 92 PRs über gh CLI abgerufen

📊 Projektübersicht:
- 🌿 Aktueller Branch: develop
- ⚠️  Uncommitted Changes vorhanden!

📌 Status:
- 20 offene Issues (7 kritisch, 3 hoch)
- 15 aktive Branches (18 total)
  └─ 3 lokal, 17 auf GitHub
- 1 offene Pull Requests

📋 Issues im Detail:

🚨 Kritische Issues:
  ● #146 - 🔐 [SECURITY] Implement Comprehensive Security Audit
    Erstellt vor 2 Tagen • Nicht zugewiesen
  ● #143 - 🚌 [ARCHITECTURE] Implement Event-Bus System
    Erstellt vor 3 Tagen • Zugewiesen an: dev-team
  ● #138 - 🏗️ [EPIC] Architecture Redesign Required
    Erstellt vor 5 Tagen • Nicht zugewiesen

✅ Empfehlungen:

🚨 7 KRITISCHE Issues offen:
   ● #146: [SECURITY] Implement Comprehensive Security Audit
     → git checkout -b bugfix/critical-issue-146
   ● #143: [ARCHITECTURE] Implement Event-Bus System
     → git checkout -b bugfix/critical-issue-143

📋 Nächste Schritte:
1. Uncommitted Changes sichern:
   → git stash push -m "WIP: develop"
2. Kritisches Issue #146 sofort bearbeiten
   → git checkout -b bugfix/critical-issue-146
3. 14 Remote-Branches lokal auschecken oder löschen
   → git remote prune origin
```

### 🎯 Key Benefits

The intelligent recommendation engine provides:

- **Priority-based actions**: Critical issues first, then high priority
- **Copy-paste ready commands**: All git commands ready to execute
- **Context awareness**: Detects uncommitted changes, branch states
- **Branch-Issue mapping**: Automatic detection and linking suggestions
- **Clean-up suggestions**: Identifies stale and orphaned branches

## 🗑️ Uninstallation

### Quick Uninstallation (Recommended)
```bash
# Download and run uninstaller interactively
bash <(curl -sSL https://raw.githubusercontent.com/GaboCapo/context-now/main/uninstall.sh)

# Or download first, then run
curl -sSL https://raw.githubusercontent.com/GaboCapo/context-now/main/uninstall.sh -o uninstall.sh && bash uninstall.sh && rm uninstall.sh
```

### Alternative: With cloned repository
```bash
# If repository still exists
~/Code/context-now/uninstall.sh

# Or with the original installer
~/Code/context-now/install.sh --uninstall
```

### Manual Uninstallation
```bash
# 1. Remove symlinks
rm -f ~/.local/bin/cn ~/.local/bin/kontext ~/.local/bin/context

# 2. Remove installation
rm -rf ~/.context-now

# 3. Remove configuration (optional, contains your project data!)
rm -rf ~/.config/context-now

# 4. Remove Fish functions (if Fish is used)
rm -f ~/.config/fish/functions/cn-*.fish

# 5. Clean shell config (edit manually)
# Remove Context-Now lines from ~/.bashrc, ~/.zshrc or ~/.config/fish/config.fish
```

## 🔧 What happens when connecting?

1. **Symlinks are created**:
   - `context-tracker.js` → Main script (shared)
   - `*.template.json` → Templates (shared, read-only)

2. **Project-specific files are created**:
   - `issues.json` - Your issues
   - `prs.json` - Pull requests
   - `project-memory.json` - Branch associations
   - `github-branches.json` - GitHub branch list
   - `issue-relations.json` - Issue relationships

3. **NPM scripts are added**:
   - `npm run context-now` - Show status
   - `npm run context-now:sync` - Sync repository
   - `npm run context-now:update` - Sync + Status

## 🛠️ New in v3.0

### 🩺 Doctor Command
```bash
cn doctor  # Full system diagnosis
```
Shows installation health, storage locations, and optimization tips.

### 📊 Performance Management
```bash
cn stats              # Statistical view for large repos
cn performance-test   # Test with known large repositories
```
Handles repos with 1000+ issues intelligently.

### 🗂️ Flexible Storage
```bash
cn --storage          # Show current mode
cn --storage local    # Store in ~/.config, not in projects
```
Choose where to store data: embedded in projects or centrally.

### 📝 Project Structure
```bash
cn structure          # Generate narrative project description
```
Text-based project structure for documentation.

## 📂 Storage Modes

Context-Now supports flexible data storage:

### Embedded Mode (Default)
```
your-project/
└── tools/
    └── context-now/     # Data stored in project
        ├── issues.json
        ├── prs.json
        └── ...
```

### Local Mode (Clean Projects)
```
~/.config/context-now/
└── projects/
    └── your-project/    # Data stored centrally
        ├── issues.json
        ├── prs.json
        └── ...
```

Switch modes anytime: `cn --storage local`

## 🎯 Example Workflow

```bash
# 1. Connect project
cn -c ~/Code/my-project

# 2. Switch to project
cd ~/Code/my-project

# 3. Check status
npm run context-now

# 4. Fill JSON files with real data
vim tools/context-now/issues.json

# 5. Check status again
npm run context-now
```

## 🔄 Updates

When the tool is improved, all connected projects automatically receive the updates as they are connected via symlinks!

## 📝 Maintaining JSON Files

### issues.json
```json
[
  {
    "id": "#123",
    "title": "Implement feature",
    "status": "open",
    "priority": "high",
    "labels": ["feature", "frontend"]
  }
]
```

### issue-relations.json (for smart recommendations)
```json
{
  "#100": {
    "type": "epic",
    "includes": ["#101", "#102", "#103"],
    "description": "Epic includes these issues"
  }
}
```

## 🤝 Team Collaboration

The tool supports developer handovers:

```bash
# In your project:
npm run context-now:handover

# Shows:
# - Uncommitted Changes
# - Last Commit
# - Unfinished Work
# - Next Steps
```

## 📌 Tips

- **Update daily**: `github-branches.json` with real GitHub data
- **Maintain issues**: Keep `issues.json` up to date
- **Use relations**: Define EPICs and bug relationships
- **Keep symlinks**: Never delete the symlinks, only the JSON data is project-specific

## 🤝 Contributing

### Git Provider Testing
We're looking for testers for other Git providers! If you test Context-Now with GitLab, Bitbucket or other providers:

1. Fork the repository
2. Test functionality with your provider
3. Document what works/doesn't work
4. Create a Pull Request or Issue with your results

### Development
```bash
# Fork and clone repository
git clone https://github.com/[your-username]/context-now.git
cd context-now

# Create feature branch
git checkout -b feature/gitlab-support

# Commit changes
git commit -m "Add GitLab support"

# Create Pull Request
```

### Issue Reports
For problems, please create an [Issue](https://github.com/GaboCapo/context-now/issues) with the following info:
- Git provider (GitHub, GitLab, etc.)
- Shell type (bash, zsh, fish)
- Error message
- Steps to reproduce

## 📚 Further Documentation

For a comprehensive guide, please see the [**Full Documentation**](./docs/en/index.md).

Key documents include:
- [**Installation Complete Guide**](docs/en/installation-complete.md) - Overview of all installed components.
- [**Data Sources Documentation**](tools/context-now/DATA_SOURCES.md) - A deep dive into the tool's data.

---

**Version**: 2.0.0  
**License**: MIT  
**Maintainer**: GaboCapo
