# Migration Guide: v2 to v3

## ⚠️ Breaking Changes

Context-Now v3.0 is a complete rewrite focused on security and NPM distribution. This guide helps you migrate from v2.x to v3.0.

## Major Changes

### 1. Installation Method

**v2.x (Old):**
```bash
# Git clone based
git clone https://github.com/GaboCapo/context-now.git ~/Code/context-now
cd ~/Code/context-now && ./install.sh
```

**v3.0 (New):**
```bash
# NPM based
npm install -g @gabocapo/context-now
```

### 2. No More Symlinks

**v2.x:** Used symlinks to share code between projects
```
project/
└── tools/context-tracker/ → symlink to ~/Code/context-now/tools
```

**v3.0:** Each project gets its own copy via NPM
```
project/
└── node_modules/@gabocapo/context-now/
```

### 3. Package Name Change

**v2.x:**
```json
{
  "name": "context-now"
}
```

**v3.0:**
```json
{
  "name": "@gabocapo/context-now"  // Scoped package
}
```

### 4. Security Hardening

**v2.x:** Used shell execution (vulnerable)
```javascript
execSync(`git checkout -b ${branch}`);  // DANGEROUS!
```

**v3.0:** No shell execution (secure)
```javascript
execFileSync('git', ['checkout', '-b', branch]);  // SAFE!
```

## Migration Steps

### Step 1: Backup Current Data

```bash
# Backup your project data
cp -r ~/Code/context-now/projects.json ~/projects-backup.json

# For each project, backup tracking data
for project in $(cn -l | grep "→" | cut -d' ' -f2); do
  cp -r /path/to/$project/tools/context-tracker/*.json ~/backup/$project/
done
```

### Step 2: Uninstall v2.x

```bash
# Remove old installation
rm -rf ~/Code/context-now

# Remove old aliases
# Edit ~/.bashrc or ~/.zshrc and remove:
# alias cn='~/Code/context-now/context-now.js'
# alias context='~/Code/context-now/context-now.js'
```

### Step 3: Install v3.0

```bash
# Install globally via NPM
npm install -g @gabocapo/context-now

# Verify installation
cn --version
```

### Step 4: Re-connect Projects

```bash
# For each project you had connected
cn -c /path/to/project1
cn -c /path/to/project2
# etc...
```

### Step 5: Restore Data (Optional)

If you need to preserve issue/PR tracking data:

```bash
# Copy backed up JSON files to new location
cp ~/backup/project1/*.json /path/to/project1/.context-now/
```

## API Changes

### CLI Commands (No Changes)

All CLI commands remain the same:
```bash
cn -c <path>         # Connect project
cn -s                # Status
cn -l                # List
cn branches          # All branches
cn issues            # All issues
```

### Programmatic API (New)

**v2.x:** No programmatic API

**v3.0:** Full async API
```javascript
const cn = require('@gabocapo/context-now');

// New programmatic access
await cn.connect('/project');
await cn.status();
await cn.issues();
```

## Configuration Changes

### Project Data Location

**v2.x:**
```
project/
└── tools/context-tracker/
    ├── issues.json
    ├── prs.json
    └── project-memory.json
```

**v3.0:**
```
project/
└── .context-now/
    ├── issues.json
    ├── prs.json
    └── project-memory.json
```

### Global Configuration

**v2.x:**
```
~/Code/context-now/projects.json
```

**v3.0:**
```
~/.context-now/projects.json
```

## NPM Scripts Update

### package.json Changes

**v2.x:**
```json
{
  "scripts": {
    "context": "node tools/context-tracker/context-tracker.js status",
    "context:sync": "node tools/context-tracker/context-tracker.js sync"
  }
}
```

**v3.0:**
```json
{
  "scripts": {
    "status": "cn -s",
    "sync": "cn sync",
    "issues": "cn issues"
  }
}
```

## Feature Improvements

### New Security Features
- ✅ Command injection protection
- ✅ Path traversal prevention
- ✅ Input sanitization
- ✅ No shell execution

### New Functionality
- ✅ Programmatic API
- ✅ PR-Issue linking
- ✅ Issue grouping
- ✅ Better error messages

### Performance
- ✅ Faster execution (no shell overhead)
- ✅ Smaller footprint (no symlinks)
- ✅ Better caching

## Troubleshooting

### Issue: Command not found
```bash
# If 'cn' command not found after install
npm install -g @gabocapo/context-now
npm link @gabocapo/context-now
```

### Issue: Old data not showing
```bash
# Data is now in .context-now folder
mkdir -p .context-now
cp tools/context-tracker/*.json .context-now/
```

### Issue: Permission errors
```bash
# Use npm with proper permissions
sudo npm install -g @gabocapo/context-now
# OR better:
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
npm install -g @gabocapo/context-now
```

### Issue: Projects not found
```bash
# Projects list moved to home directory
mkdir -p ~/.context-now
cp ~/Code/context-now/projects.json ~/.context-now/
```

## Rollback Plan

If you need to rollback to v2.x:

```bash
# Uninstall v3
npm uninstall -g @gabocapo/context-now

# Reinstall v2
git clone --branch v2.0.0 https://github.com/GaboCapo/context-now.git ~/Code/context-now
cd ~/Code/context-now && ./install.sh
```

## Breaking Change Summary

| Feature | v2.x | v3.0 |
|---------|------|------|
| Installation | Git clone | NPM |
| Distribution | Symlinks | NPM package |
| Package name | context-now | @gabocapo/context-now |
| Security | Vulnerable | Hardened |
| API | CLI only | CLI + Programmatic |
| Data location | tools/context-tracker/ | .context-now/ |
| Config location | ~/Code/context-now/ | ~/.context-now/ |
| Dependencies | None | None |
| Node version | Any | >=14.0.0 |

## Support

Having issues with migration?

1. Check [GitHub Issues](https://github.com/GaboCapo/context-now/issues)
2. Review [Security Docs](./SECURITY.md)
3. See [API Docs](./API.md)
4. Contact: support@context-now.dev

## Why Upgrade?

### Security
- v2.x had multiple command injection vulnerabilities
- v3.0 is completely secure with no shell execution

### Distribution
- v2.x required manual installation and symlinks
- v3.0 uses standard NPM installation

### Team-Ready
- v2.x was single-developer focused
- v3.0 works perfectly in team environments

### Future-Proof
- v2.x used deprecated patterns
- v3.0 follows modern Node.js best practices

---

**Recommendation**: Upgrade to v3.0 as soon as possible for security and feature improvements.