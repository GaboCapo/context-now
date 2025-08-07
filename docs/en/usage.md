# User Guide

This guide explains the daily use of `context-now`, from project management to team collaboration.

## Table of Contents
- [Project Management](#project-management)
  - [Connect a Project](#connect-a-project)
  - [List Projects](#list-projects)
  - [Switch to a Project](#switch-to-a-project)
  - [Show Project Status](#show-project-status)
  - [Disconnect a Project](#disconnect-a-project)
- [Typical Workflow](#typical-workflow)
- [Command Overview](#command-overview)
  - [Basic Commands](#basic-commands)
  - [Advanced Commands](#advanced-commands)
- [Maintaining JSON Files](#maintaining-json-files)
- [Team Collaboration](#team-collaboration)

---

## Project Management

`context-now` is designed to manage multiple projects simultaneously.

### Connect a Project
To add a new project, use the `-c` or `--connect` command:
```bash
# Provide the path to your Git project
cn -c /path/to/your/project
```
The tool will then create the necessary symlinks and configuration files.

### List Projects
Display all connected projects:
```bash
cn -l
# Or
cn --list
```

### Switch to a Project
Change the active context to another project:
```bash
# By project number (from the list)
cn -g 1

# By project name
cn -g my-project
```

### Show Project Status
The status command is the most important command. It gives you an overview of the current state of your project.
```bash
# Shows the status of the current project
cn -s

# Shows the status of a specific project
cn -s my-project
```
In a project directory, you can also use the `npm` scripts if they are set up:
```bash
npm run context-now
```

### Disconnect a Project
Remove a project from management:
```bash
cn -d my-project
```

---

## Typical Workflow

1.  **Connect a project**:
    `cn -c ~/Code/my-project`

2.  **Change into the project directory**:
    `cd ~/Code/my-project`

3.  **Check status and get recommendations**:
    `npm run context-now` or `cn -s`
    
    The tool will show you:
    - Current branch status
    - Open issues by priority (critical → high → normal)
    - Active branches and their sync status
    - **🎯 Intelligent recommendations** based on your project state

4.  **Follow the recommendations**:
    Context-Now analyzes your project and suggests the most important next steps:
    - Critical security issues to fix immediately
    - Uncommitted changes to stash or commit
    - Branches that need cleanup
    - Issues without branches that need attention

5.  **Synchronize**:
    After `git` operations like `pull` or `checkout`, you should synchronize the status:
    `npm run context-now:sync` or `cn sync`

---

## 🎯 Intelligent Recommendations

Context-Now's recommendation engine prioritizes your work based on:

### Priority Levels
1. **🚨 Critical Issues**: Security vulnerabilities, system failures
2. **⚠️ High Priority**: Important features, major bugs
3. **📋 Normal Priority**: Regular tasks and improvements
4. **🔄 Maintenance**: Branch cleanup, synchronization

### Example Recommendations
```
✅ Empfehlungen:

🚨 7 KRITISCHE Issues offen:
   ● #146: [SECURITY] Implement Security Audit
     → git checkout -b bugfix/critical-issue-146

📋 Nächste Schritte:
1. Uncommitted Changes sichern:
   → git stash push -m "WIP: current-branch"
2. Kritisches Issue #146 sofort bearbeiten
   → git checkout -b bugfix/critical-issue-146
3. Remote-Branches aufräumen
   → git remote prune origin
```

All commands are copy-paste ready for immediate execution!

---

## Command Overview

### Basic Commands
| Command | Alias | Description |
|---|---|---|
| `cn --connect <path>` | `cn -c <path>` | Connects a new project. |
| `cn --list` | `cn -l` | Lists all projects. |
| `cn --go <name/id>` | `cn -g <name/id>` | Switches the active project. |
| `cn --status [name]`| `cn -s [name]` | Shows the project status. |
| `cn --disconnect <name>`| `cn -d <name>` | Disconnects a project. |
| `cn sync` | | Synchronizes the repository status. |
| `cn update` | | Runs `sync` and `status`. |
| `cn --help` | `cn -h` | Displays the help message. |

### Advanced Commands
| Command | Description |
|---|---|
| `cn handover` | Starts the mode for developer handovers. |
| `cn cache-clear` | Clears the internal cache. |
| `cn-backup` | Creates a backup of the configuration. |
| `cn-edit` | Opens the configuration file in the editor. |
| `cn-update` | Updates the `context-now` tool itself. |
| `DEBUG=1 cn status` | Runs a command in debug mode. |

---

## Maintaining JSON Files

The accuracy of the tool depends on the timeliness of the project-specific JSON files. These are located in the `tools/context-tracker` directory of your project.

- **`issues.json`**:
  A list of issues, ideally with status, priority, and labels.
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

- **`github-branches.json`**:
  An up-to-date list of branches that exist on GitHub. This is important because `git` has local caches of remote branches that can become outdated.

- **`project-memory.json`**:
  Links branches to issues and stores metadata such as the creation date.

- **`issue-relations.json`** (optional):
  Defines relationships between issues (e.g., epics) to enable smarter recommendations.
  ```json
  {
    "#100": {
      "type": "epic",
      "includes": ["#101", "#102", "#103"]
    }
  }
  ```

---

## Team Collaboration

The `handover` command was specifically designed for handing over work to teammates.
```bash
# Run this command in your project directory
cn handover
```
**Output:**
- Uncommitted changes (`git status`)
- The last commit
- Unfinished work (based on the comparison of branches and issues)
- Next steps (recommendations from the tool)

This gives your teammate a quick and comprehensive overview of the current state of your work.
