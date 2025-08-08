# API Documentation

## Table of Contents
- [Installation](#installation)
- [CLI Usage](#cli-usage)
- [Programmatic API](#programmatic-api)
- [Data Structures](#data-structures)
- [Error Handling](#error-handling)
- [Examples](#examples)

## Installation

### NPM Global
```bash
npm install -g @gabocapo/context-now
```

### NPM Local
```bash
npm install --save-dev @gabocapo/context-now
```

### Programmatic Usage
```javascript
const contextNow = require('@gabocapo/context-now');
```

## CLI Usage

### Basic Syntax
```bash
cn [COMMAND] [OPTIONS]
```

### Commands Reference

#### Connect Project
```bash
cn -c <path>
cn --connect <path>
```

**Parameters:**
- `path` - Absolute or relative path to Git project

**Example:**
```bash
cn -c /home/user/my-project
cn -c .
cn -c ~/projects/webapp
```

#### Status
```bash
cn -s [project-name]
cn --status [project-name]
```

**Parameters:**
- `project-name` (optional) - Name of specific project

**Output:**
- Current branch
- Uncommitted changes
- Open issues count
- PR count
- Recommendations

#### List Projects
```bash
cn -l
cn --list
```

**Output:**
- Numbered list of all connected projects
- Project paths
- Current project indicator

#### Go to Project
```bash
cn -g <name|number>
cn --go <name|number>
```

**Parameters:**
- `name` - Project name
- `number` - Project number from list

**Example:**
```bash
cn -g my-project
cn -g 1
```

#### Disconnect Project
```bash
cn -d <name>
cn --disconnect <name>
```

**Parameters:**
- `name` - Project name to disconnect

#### Focused Views
```bash
cn branches [project]  # All branches
cn issues [project]    # All issues  
cn prs [project]       # All PRs
cn critical [project]  # Critical issues only
cn relations [project] # Issue relationships
```

## Programmatic API

### Core Methods

#### connect(projectPath)
Connect a new project to Context-Now.

```javascript
const result = await contextNow.connect('/path/to/project');
```

**Parameters:**
- `projectPath` (string) - Path to Git project

**Returns:** Promise<Object>
```javascript
{
  success: boolean,
  project: string,      // Project name
  namespace: string,    // Installation namespace
  message: string       // Status message
}
```

**Throws:**
- `Error` - Invalid path
- `Error` - Not a Git repository
- `Error` - Path traversal attempt

#### status(projectName?)
Get comprehensive project status.

```javascript
const status = await contextNow.status('my-project');
```

**Parameters:**
- `projectName` (string, optional) - Project name

**Returns:** Promise<Object>
```javascript
{
  success: boolean,
  project: string,
  status: {
    branch: string,        // Current branch
    modified: number,      // Modified files count
    branches: number,      // Total branches
    issues: number,        // Open issues
    ahead: number,         // Commits ahead
    behind: number,        // Commits behind
    recommendations: Array // Action items
  }
}
```

#### issues(projectName?)
Get all issues for a project.

```javascript
const issues = await contextNow.issues();
```

**Returns:** Promise<Array>
```javascript
[
  {
    id: string,           // Issue ID (#123)
    number: number,       // Issue number
    title: string,        // Issue title
    state: string,        // 'open' | 'closed'
    priority: string,     // 'critical' | 'high' | 'medium' | 'low'
    labels: Array,        // Label names
    assignee: string,     // Assignee username
    created_at: string,   // ISO date
    updated_at: string,   // ISO date
    body: string         // Issue description
  }
]
```

#### pullRequests(projectName?)
Get all pull requests.

```javascript
const prs = await contextNow.pullRequests();
```

**Returns:** Promise<Array>
```javascript
[
  {
    id: string,           // PR ID
    number: number,       // PR number
    title: string,        // PR title
    state: string,        // 'open' | 'closed' | 'merged'
    branch: string,       // Source branch
    base: string,         // Target branch
    author: string,       // Author username
    draft: boolean,       // Is draft PR
    created_at: string,   // ISO date
    updated_at: string,   // ISO date
    body: string         // PR description
  }
]
```

#### branches(projectName?)
Get branch information.

```javascript
const branches = await contextNow.branches();
```

**Returns:** Promise<Object>
```javascript
{
  current: string,        // Current branch name
  local: Array<string>,   // Local branch names
  remote: Array<string>,  // Remote branch names
  merged: Array<string>,  // Merged branches
  stale: Array<{         // Stale branches
    name: string,
    lastCommit: string,
    daysSinceCommit: number
  }>
}
```

#### critical(projectName?)
Get only critical priority issues.

```javascript
const critical = await contextNow.critical();
```

**Returns:** Promise<Array>
- Same structure as `issues()` but filtered for critical priority

#### list()
List all connected projects.

```javascript
const projects = await contextNow.list();
```

**Returns:** Promise<Array>
```javascript
[
  {
    name: string,         // Project name
    path: string,         // Project path
    connected: string,    // Connection date
    namespace: string,    // Installation namespace
    current: boolean      // Is current directory
  }
]
```

#### disconnect(projectName)
Disconnect a project.

```javascript
const result = await contextNow.disconnect('my-project');
```

**Parameters:**
- `projectName` (string) - Project to disconnect

**Returns:** Promise<boolean>
- `true` if successful
- `false` if project not found

### Utility Methods

#### utils.safeGit(args, options?)
Execute Git commands safely.

```javascript
const output = contextNow.utils.safeGit(
  ['log', '--oneline', '-10']
);
```

**Parameters:**
- `args` (Array<string>) - Git command arguments
- `options` (Object, optional) - Execution options

**Returns:** string - Command output

**Throws:**
- `Error` - Git not installed
- `Error` - Command failed

#### utils.safeGH(args, options?)
Execute GitHub CLI commands safely.

```javascript
const issues = contextNow.utils.safeGH(
  ['issue', 'list', '--json', 'title,number']
);
```

**Parameters:**
- `args` (Array<string>) - gh command arguments
- `options` (Object, optional) - Execution options

**Returns:** string - Command output

#### utils.safePath(userPath, basePath)
Validate path against traversal attacks.

```javascript
const safe = contextNow.utils.safePath(
  'src/index.js',
  '/project'
);
// Returns: /project/src/index.js
```

**Parameters:**
- `userPath` (string) - User-provided path
- `basePath` (string) - Base directory

**Returns:** string - Safe absolute path

**Throws:**
- `Error` - Path traversal detected

## Data Structures

### Project Configuration
```javascript
{
  "my-project": {
    "path": "/home/user/my-project",
    "connected": "2024-01-15T10:30:00Z",
    "namespace": "context-now",
    "remote": "git@github.com:user/project.git"
  }
}
```

### Issue Priority Levels
```javascript
{
  critical: "🔴 Immediate action required",
  high:     "🟠 Important, address soon",
  medium:   "🟡 Normal priority",
  low:      "🟢 Can wait"
}
```

### Recommendation Types
```javascript
{
  CRITICAL_ISSUE:    "Address critical issue",
  UNCOMMITTED:       "Save uncommitted changes",
  PR_REVIEW:         "Review pending PRs",
  BRANCH_CLEANUP:    "Clean old branches",
  UPDATE_REQUIRED:   "Pull latest changes"
}
```

## Error Handling

### Error Types

```javascript
try {
  await contextNow.connect('/invalid/path');
} catch (error) {
  if (error.message.includes('not found')) {
    // Path doesn't exist
  } else if (error.message.includes('not a git repository')) {
    // Not a Git repo
  } else if (error.message.includes('Path traversal')) {
    // Security violation
  }
}
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Path not found` | Invalid project path | Check path exists |
| `Not a git repository` | No .git directory | Run `git init` |
| `Path traversal detected` | Security violation | Use valid paths |
| `Git not installed` | Git missing | Install Git |
| `gh not installed` | GitHub CLI missing | Install gh |
| `Project not found` | Unknown project name | Check `cn -l` |

## Examples

### Basic Workflow
```javascript
const cn = require('@gabocapo/context-now');

async function workflow() {
  // Connect project
  await cn.connect('/my/project');
  
  // Get status
  const status = await cn.status();
  console.log(`Branch: ${status.branch}`);
  console.log(`Issues: ${status.issues}`);
  
  // Get critical issues
  const critical = await cn.critical();
  if (critical.length > 0) {
    console.log('Critical issues found!');
    critical.forEach(issue => {
      console.log(`- ${issue.id}: ${issue.title}`);
    });
  }
}
```

### Multi-Project Management
```javascript
async function manageProjects() {
  // List all projects
  const projects = await cn.list();
  
  // Check each project
  for (const project of projects) {
    const status = await cn.status(project.name);
    
    if (status.status.modified > 0) {
      console.log(`${project.name}: Has uncommitted changes!`);
    }
    
    const issues = await cn.issues(project.name);
    const critical = issues.filter(i => i.priority === 'critical');
    
    if (critical.length > 0) {
      console.log(`${project.name}: ${critical.length} critical issues`);
    }
  }
}
```

### Error Handling Example
```javascript
async function safeConnect(projectPath) {
  try {
    const result = await cn.connect(projectPath);
    console.log(`Connected: ${result.project}`);
    return true;
  } catch (error) {
    console.error(`Failed to connect: ${error.message}`);
    
    // Specific error handling
    if (error.message.includes('not a git repository')) {
      console.log('Initializing git...');
      cn.utils.safeGit(['init'], { cwd: projectPath });
      
      // Retry connection
      return safeConnect(projectPath);
    }
    
    return false;
  }
}
```

### Custom Integration
```javascript
// Create status dashboard
async function createDashboard() {
  const projects = await cn.list();
  const dashboard = {};
  
  for (const project of projects) {
    const status = await cn.status(project.name);
    const issues = await cn.issues(project.name);
    const prs = await cn.pullRequests(project.name);
    
    dashboard[project.name] = {
      branch: status.status.branch,
      changes: status.status.modified,
      openIssues: issues.filter(i => i.state === 'open').length,
      criticalIssues: issues.filter(i => i.priority === 'critical').length,
      openPRs: prs.filter(pr => pr.state === 'open').length,
      health: calculateHealth(status, issues, prs)
    };
  }
  
  return dashboard;
}

function calculateHealth(status, issues, prs) {
  let score = 100;
  
  // Deduct for issues
  score -= issues.filter(i => i.priority === 'critical').length * 20;
  score -= issues.filter(i => i.priority === 'high').length * 10;
  
  // Deduct for old PRs
  const oldPRs = prs.filter(pr => {
    const age = Date.now() - new Date(pr.created_at);
    return age > 7 * 24 * 60 * 60 * 1000; // 7 days
  });
  score -= oldPRs.length * 5;
  
  // Deduct for uncommitted changes
  if (status.status.modified > 10) score -= 10;
  
  return Math.max(0, score);
}
```

## TypeScript Support

TypeScript definitions coming in v3.1.0:

```typescript
interface ContextNow {
  connect(path: string): Promise<ConnectionResult>;
  status(project?: string): Promise<StatusResult>;
  issues(project?: string): Promise<Issue[]>;
  pullRequests(project?: string): Promise<PullRequest[]>;
  branches(project?: string): Promise<BranchInfo>;
  critical(project?: string): Promise<Issue[]>;
  list(): Promise<Project[]>;
  disconnect(project: string): Promise<boolean>;
}
```

## Rate Limits

- Git operations: No limit
- GitHub API: 60/hour (unauthenticated)
- GitHub API: 5000/hour (authenticated)
- File operations: OS-dependent

## Best Practices

1. **Always handle errors** - Network and Git operations can fail
2. **Use project names** - More reliable than paths
3. **Check status first** - Ensure project is connected
4. **Batch operations** - Reduce API calls
5. **Cache results** - Store issue/PR data when appropriate

---

For more examples, see [examples/](../examples/) directory.