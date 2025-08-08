# @gabocapo/context-now

[![npm version](https://img.shields.io/npm/v/@gabocapo/context-now.svg)](https://www.npmjs.com/package/@gabocapo/context-now)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/@gabocapo/context-now.svg)](https://nodejs.org)
[![Security: Hardened](https://img.shields.io/badge/Security-Hardened-green.svg)](#security)

> 🔒 **Enterprise-grade Git project context tracker with injection protection**

Context-Now is a secure, professional CLI tool and library for managing Git project contexts, tracking issues, PRs, and branches across multiple projects with zero security vulnerabilities.

<p align="center">
  <img width="256" height="256" alt="Context-Now Logo" src="https://github.com/user-attachments/assets/ed19b593-2d4f-4372-9ba0-2edb17ce0f52" />
</p>

## 🚀 Quick Start

### NPM Installation (Recommended)

```bash
# Global installation (CLI everywhere)
npm install -g @gabocapo/context-now

# Project-specific installation
npm install --save-dev @gabocapo/context-now
```

### Usage

```bash
# Connect a project
cn -c /path/to/project

# Check status
cn -s

# View all issues without truncation
cn issues

# View critical issues only
cn critical

# List all branches
cn branches
```

## 🔒 Security Features

Context-Now v3.0 has been completely rewritten with security as the top priority:

### Protection Against

- ✅ **Command Injection** - All shell executions use `execFileSync` (no shell)
- ✅ **Path Traversal** - Validates all paths against base directories
- ✅ **Input Injection** - Sanitizes all user inputs
- ✅ **Memory Exhaustion** - Enforces timeouts and buffer limits
- ✅ **Unauthorized Commands** - Whitelist-based command execution

### Security Test Suite

```bash
npm test
# ✅ Branch name validation
# ✅ Issue title sanitization
# ✅ Path traversal protection
# ✅ Schema validation
# ✅ Command injection prevention
```

## 🤖 AI Assistant Compatibility

### MCP (Model Context Protocol) Support

| Platform | Status | Notes |
|----------|--------|-------|
| Claude Desktop | 🟡 Testing | Full MCP support, awaiting field tests |
| Claude Code (VS Code) | 🟡 Testing | MCP via VS Code extension |
| Continue.dev | 🔵 Planned | MCP support coming soon |
| Cody | 🔵 Planned | Evaluating MCP integration |
| GitHub Copilot | ⚫ N/A | No MCP support |
| Cursor | ⚫ N/A | No MCP support |

> **Note**: MCP integration is brand new (December 2024). We're actively testing with Claude Desktop and Claude Code. Please report your experience!

## ✨ Key Features

### 🎯 Intelligent Recommendations
- Detects issues already in PRs
- Groups related issues (e.g., Case Management)
- Prioritizes PR merges over new work
- Shows commit count for branch decisions

### 📊 Advanced Analytics
- Branch-Issue relationship mapping
- Stale branch detection
- Duplicate work prevention
- Critical issue prioritization

### 🔄 Git Integration
- Works with all SSH configs
- GitHub CLI integration
- Automatic branch synchronization
- PR-Issue linking

### 👥 Team Features
- Developer handover mode
- Multi-project management
- Consistent project contexts
- No symlinks (NPM-based)

## 📦 Installation Methods

### 1. Global CLI (Recommended)

```bash
npm install -g @gabocapo/context-now
cn --help
```

### 2. Project DevDependency

```json
{
  "devDependencies": {
    "@gabocapo/context-now": "^3.0.0"
  },
  "scripts": {
    "status": "cn -s",
    "issues": "cn issues",
    "sync": "cn sync"
  }
}
```

### 3. Programmatic API

```javascript
const contextNow = require('@gabocapo/context-now');

// Safe async API
async function getProjectStatus() {
  const status = await contextNow.status('my-project');
  const issues = await contextNow.issues();
  const critical = await contextNow.critical();
  
  return { status, issues, critical };
}
```

## 🛠️ CLI Commands

### Basic Commands

| Command | Description |
|---------|-------------|
| `cn -c <path>` | Connect a project |
| `cn -s [name]` | Show project status |
| `cn -l` | List all projects |
| `cn -g <name\|number>` | Go to project |
| `cn -d <name>` | Disconnect project |
| `cn -h` | Show help |

### Focused View Commands

| Command | Description |
|---------|-------------|
| `cn branches [name]` | Show ALL branches (no truncation) |
| `cn issues [name]` | Display complete issue list |
| `cn prs [name]` | View all pull requests |
| `cn critical [name]` | Show only critical issues |
| `cn relations [name]` | Display issue relationships |

## 🔧 API Reference

### connect(projectPath)
Connect a new project to Context-Now.

```javascript
await contextNow.connect('/path/to/project');
```

### status(projectName?)
Get the status of a project.

```javascript
const status = await contextNow.status('my-project');
// Returns: { branch, modified, branches, issues }
```

### issues(projectName?)
Get all issues for a project.

```javascript
const issues = await contextNow.issues();
// Returns: Array of issue objects
```

### critical(projectName?)
Get only critical priority issues.

```javascript
const critical = await contextNow.critical();
// Returns: Array of critical issues
```

### pullRequests(projectName?)
Get all pull requests.

```javascript
const prs = await contextNow.pullRequests();
// Returns: Array of PR objects
```

## 🔄 Migration from v2.x

### Breaking Changes

1. **No more symlinks** - Uses NPM installation
2. **Secure API** - All inputs validated
3. **New package name** - `@gabocapo/context-now`

### Migration Steps

```bash
# 1. Uninstall old version
rm -rf ~/Code/context-now

# 2. Install new version
npm install -g @gabocapo/context-now

# 3. Re-connect projects
cn -c /path/to/project
```

## 🏗️ Architecture

```
@gabocapo/context-now/
├── bin/
│   └── cn                    # CLI entry point
├── lib/
│   ├── cli.js               # CLI logic
│   ├── security/            # Security utilities
│   │   └── safe-exec.js    # Injection protection
│   └── commands/            # Command implementations
├── index.js                 # Programmatic API
└── test/
    └── security.test.js     # Security test suite
```

## 🤝 Contributing

We welcome contributions! Please ensure:

1. All security tests pass
2. No new `execSync` calls
3. Input validation for user data
4. Path traversal protection

```bash
# Run tests before submitting PR
npm test
```

## 📝 License

MIT © GaboCapo

## 🛡️ Security Policy

Found a security issue? Please email security@context-now.dev (do not create public issues).

### Security Commitments

- No shell execution (`execFileSync` only)
- All inputs validated and sanitized
- Path traversal protection on all file operations
- Command whitelist enforcement
- Regular security audits

## 📚 Documentation

- [Installation Guide](docs/en/installation.md)
- [API Documentation](docs/en/api.md)
- [Security Details](docs/en/security.md)
- [Migration Guide](docs/MIGRATION.md)

## 🏆 Why Context-Now?

| Feature | Context-Now | Other Tools |
|---------|------------|-------------|
| Security | ✅ Hardened | ⚠️ Vulnerable |
| Installation | ✅ NPM | ❌ Manual |
| Team-Ready | ✅ Yes | ❌ No |
| API | ✅ Async/Await | ❌ CLI only |
| PR-Issue Link | ✅ Automatic | ❌ Manual |
| Issue Groups | ✅ Smart | ❌ None |

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/GaboCapo/context-now/issues)
- **Discussions**: [GitHub Discussions](https://github.com/GaboCapo/context-now/discussions)
- **Security**: security@context-now.dev

---

Made with ❤️ and 🔒 by GaboCapo