# Context-Now Integration Guide

## For External Projects

If you want to use context-now in your own projects, follow these steps:

### Option 1: Global Installation (Recommended)

1. Install context-now globally:
```bash
cd ~/Code/context-now
npm run install-global
```

2. Connect your project:
```bash
cn -c /path/to/your/project
```

This will create the necessary symlinks in your project.

### Option 2: Manual Integration

If the automatic connection doesn't work, you can manually add the scripts to your project's package.json:

```json
{
  "scripts": {
    "context": "context-now -s",
    "context:simple": "context-now -s --simple",
    "context:sync": "context-now --sync",
    "context:update": "context-now --update"
  }
}
```

### Option 3: Direct Symlink (For Development)

If you're developing and need the scripts locally:

1. Create the tools directory in your project:
```bash
mkdir -p tools/context-tracker
```

2. Create symlinks to the context-now installation:
```bash
ln -s ~/Code/context-now/tools/context-tracker/context-tracker.js tools/context-tracker/context-tracker.js
ln -s ~/Code/context-now/tools/context-tracker/modules tools/context-tracker/modules
```

3. Add the scripts to your package.json:
```json
{
  "scripts": {
    "context": "node tools/context-tracker/context-tracker.js status",
    "context:simple": "node tools/context-tracker/context-tracker.js simple",
    "context:sync": "node tools/context-tracker/context-tracker.js sync",
    "context:update": "node tools/context-tracker/context-tracker.js update"
  }
}
```

## Troubleshooting

### Error: Cannot find module
If you get a "Cannot find module" error, ensure that:
1. The symlinks are correctly created
2. The context-now installation path is correct
3. You've run `cn -c /path/to/your/project` to connect your project

### Private Repositories
For private repositories, set up SSH keys first:
```bash
cn -k
```

Then connect your project:
```bash
cn -c /path/to/your/project
```