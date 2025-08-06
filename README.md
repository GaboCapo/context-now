*[Deutsch](README.de.md) | English*

<p align="center">
  <img width="256" height="256" alt="Context-Now Logo" src="https://github.com/user-attachments/assets/ed19b593-2d4f-4372-9ba0-2edb17ce0f52" />
</p>

# 🎯 Context-Now - Git Project Context Tracker

An intelligent tool for managing Git project contexts, issues, branches and pull requests with automatic synchronization.

## ✨ Features

- **Git Integration**: Live synchronization with local and remote branches, automatic branch-to-issue mapping
- **Issue & PR Tracking**: Manage issues and pull requests directly from the terminal
- **Smart Recommendations**: Context-aware work recommendations based on issue relationships
- **Developer Handover**: Special modes for seamless team handovers
- **Multi-Project Support**: Manage multiple Git projects with one tool
- **Symlink-based**: Templates and scripts are shared, data remains project-specific

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

## 🚀 Installation

### Quick Installation (Recommended)
```bash
# One-command installation
curl -sSL https://raw.githubusercontent.com/GaboCapo/context-now/main/quick-setup.sh | bash

# Or with git clone + installer
git clone https://github.com/GaboCapo/context-now.git ~/Code/context-now
cd ~/Code/context-now && ./install.sh
```

### What gets installed?
- ✅ Context-Now in `~/.context-now`
- ✅ Configuration in `~/.config/context-now`
- ✅ Aliases: `cn`, `kontext`, `context`
- ✅ Auto-completion for bash/zsh/fish
- ✅ Environment variables
- ✅ Helper functions (cn-update, cn-backup, cn-edit)

See [INSTALLATION_COMPLETE.md](INSTALLATION_COMPLETE.md) for all options.

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
cn -g persona-nexus-manager # By name
```

### Show project status
```bash
cn -s                      # Current project
cn -s persona-nexus-manager # Specific project
```

### Disconnect project
```bash
cn -d persona-nexus-manager
```

## 🗑️ Uninstallation

### Quick Uninstallation (One command)
```bash
# Complete uninstallation with one command
curl -sSL https://raw.githubusercontent.com/GaboCapo/context-now/main/uninstall.sh | bash
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
   - `npm run context` - Show status
   - `npm run context:sync` - Sync repository
   - `npm run context:update` - Sync + Status

## 📂 Structure

```
context-now/
├── context-now.js         # Multi-project manager
├── cn                     # Launcher script
├── projects.json          # Project registry
└── tools/
    └── context-tracker/
        ├── context-tracker.js    # Main script (shared via symlink)
        ├── *.template.json        # Templates (shared)
        └── DATA_SOURCES.md        # Documentation
```

Projects:
```
your-project/
└── tools/
    └── context-tracker/
        ├── context-tracker.js → symlink
        ├── *.template.json → symlinks
        ├── issues.json (project-specific)
        ├── prs.json (project-specific)
        └── ...
```

## 🎯 Example Workflow

```bash
# 1. Connect project
cn -c ~/Code/my-project

# 2. Switch to project
cd ~/Code/my-project

# 3. Check status
npm run context

# 4. Fill JSON files with real data
vim tools/context-tracker/issues.json

# 5. Check status again
npm run context
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
npm run context:handover

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

- [**INSTALLATION_COMPLETE.md**](INSTALLATION_COMPLETE.md) - Detailed installation guide
- [**INSTALLATION.md**](INSTALLATION.md) - Project setup guide
- [**GITHUB_TOKEN.md**](GITHUB_TOKEN.md) - Setting up GitHub token
- [**SSH_DEPLOY_KEYS.md**](SSH_DEPLOY_KEYS.md) - SSH Deploy Keys setup
- [**tools/context-tracker/DATA_SOURCES.md**](tools/context-tracker/DATA_SOURCES.md) - Data sources documentation

---

**Version**: 2.0.0  
**License**: MIT  
**Maintainer**: GaboCapo
