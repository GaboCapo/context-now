# MCP (Model Context Protocol) Integration

## 🤖 What is MCP?

The Model Context Protocol (MCP) is an open protocol that enables AI assistants like Claude to interact with external tools and data sources. Context-Now implements MCP to provide direct access to your Git project context.

## 🚀 Quick Start

### 1. Install Context-Now

```bash
npm install -g @gabocapo/context-now
```

### 2. Configure Claude Desktop

Add to your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**Linux**: `~/.config/claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "context-now": {
      "command": "npx",
      "args": [
        "-y",
        "@gabocapo/context-now",
        "mcp-server"
      ]
    }
  }
}
```

### 3. Restart Claude Desktop

After adding the configuration, restart Claude Desktop to load the MCP server.

## 📚 Available Resources

Once configured, Claude can access these resources:

| Resource | Description | Example Usage |
|----------|-------------|---------------|
| `context://projects/list` | All connected projects | "Show me all my projects" |
| `context://project/status` | Current project status | "What's the project status?" |
| `context://issues/all` | All project issues | "List all issues" |
| `context://issues/critical` | Critical priority issues | "Show critical issues" |
| `context://branches/all` | All branches | "What branches exist?" |
| `context://prs/open` | Open pull requests | "Show open PRs" |
| `context://recommendations` | AI recommendations | "What should I work on?" |

## 🛠️ Available Tools

Claude can execute these actions:

### connect_project
Connect a new project to Context-Now.
```
"Connect the project at /home/user/my-project"
```

### create_branch
Create a new Git branch for an issue.
```
"Create a bugfix branch for issue #123"
```

### analyze_project
Get comprehensive project analysis.
```
"Analyze the project and give me recommendations"
```

### sync_project
Sync project data with GitHub.
```
"Sync the project with GitHub"
```

## 💬 Pre-configured Prompts

Context-Now provides intelligent prompts for common workflows:

### Project Overview
```
"Give me a project overview"
```
Claude will analyze your project and provide:
- Current branch and git status
- Critical issues needing attention
- Open PRs requiring review
- Stale branches to clean
- Project health score
- Top 3 recommended actions

### Fix Critical Issue
```
"Help me fix the most critical issue"
```
Claude will:
- Identify the most critical issue
- Create an appropriate branch
- Provide a fixing plan
- List related issues

### Developer Handover
```
"Create a handover document for Alice"
```
Claude will generate:
- Current project state
- Uncommitted changes
- Critical issues with priority
- Open PRs status
- Recent work completed
- Recommended next steps

### Security Audit
```
"Perform a security audit"
```
Claude will check:
- Security-labeled issues
- Age of security PRs
- Security-related branches
- Critical dependency issues
- Security recommendations

### Sprint Planning
```
"Help me plan the next sprint"
```
Claude will provide:
- Issues by priority
- Sprint capacity estimates
- Issue dependencies
- Sprint goals
- Assignment recommendations

### Daily Standup
```
"Generate my daily standup"
```
Claude will prepare:
- Yesterday's work
- Today's plan
- Current blockers
- Help needed
- PRs for review

## 🔧 Advanced Configuration

### Custom Project Path

If your projects are in a specific location:

```json
{
  "mcpServers": {
    "context-now": {
      "command": "npx",
      "args": ["-y", "@gabocapo/context-now", "mcp-server"],
      "env": {
        "CONTEXT_NOW_ROOT": "/path/to/projects"
      }
    }
  }
}
```

### Debug Mode

Enable debug output:

```json
{
  "mcpServers": {
    "context-now": {
      "command": "npx",
      "args": ["-y", "@gabocapo/context-now", "mcp-server"],
      "env": {
        "DEBUG": "context-now:*"
      }
    }
  }
}
```

## 📝 Example Conversations

### Example 1: Morning Routine
```
You: "Good morning! What should I work on today?"
Claude: *Uses context://recommendations and context://issues/critical*
"Good morning! Based on Context-Now data:
1. You have 2 critical issues that need attention
2. PR #456 has been waiting for review for 5 days
3. Your current branch has uncommitted changes

I recommend:
1. First, stash your current changes
2. Review and merge PR #456
3. Then tackle issue #789 (critical security fix)"
```

### Example 2: Issue Development
```
You: "I need to fix issue #123"
Claude: *Uses create_branch tool and context://issues/all*
"I've created branch 'bugfix/issue-123' for you. 
Issue #123: 'Login fails with special characters'
This is a high-priority authentication issue.

Related issues that might be affected:
- #124: Password validation
- #125: Session management

Would you like me to provide a implementation plan?"
```

### Example 3: Project Health Check
```
You: "How healthy is my project?"
Claude: *Uses analyze_project tool*
"Project Health Score: 75/100

Positives:
✅ All critical issues addressed
✅ No old PRs (all reviewed within 7 days)
✅ Good test coverage

Areas for improvement:
⚠️ 12 stale branches (>30 days old)
⚠️ 3 high-priority issues pending
⚠️ 5 issues missing priority labels

Recommendations:
1. Clean up stale branches (can remove 8 safely)
2. Prioritize the 3 high-priority issues
3. Triage unlabeled issues"
```

## 🐛 Troubleshooting

### MCP Server Not Found

If Claude says "MCP server context-now not found":

1. Verify installation:
```bash
npm list -g @gabocapo/context-now
```

2. Check config file location:
```bash
# macOS
cat ~/Library/Application Support/Claude/claude_desktop_config.json

# Windows
type %APPDATA%\Claude\claude_desktop_config.json

# Linux
cat ~/.config/claude/claude_desktop_config.json
```

3. Restart Claude Desktop

### Permission Errors

If you get permission errors:

```bash
# Fix npm permissions
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
npm install -g @gabocapo/context-now
```

### Server Crashes

Check logs:
```bash
# Run server manually to see errors
npx @gabocapo/context-now mcp-server
```

## 🔒 Security

The MCP integration maintains Context-Now's security features:

- All inputs are validated
- No shell execution
- Path traversal protection
- Read-only access to sensitive data
- Write operations require confirmation

## 🚦 Status Indicators

When using Context-Now through MCP, Claude will show:

- 🟢 **Connected**: MCP server is running
- 🟡 **Syncing**: Fetching latest data
- 🔴 **Error**: Connection or permission issue
- 🔵 **Working**: Executing a tool

## 🎯 Best Practices

1. **Connect Projects First**: Before using MCP, connect your projects:
   ```bash
   cn -c /path/to/project
   ```

2. **Keep Data Fresh**: Sync regularly:
   ```
   "Sync the project data"
   ```

3. **Use Prompts**: Leverage pre-configured prompts for common tasks

4. **Review Before Action**: Always review Claude's suggestions before executing

5. **Security First**: Don't share sensitive project data in conversations

## 📊 MCP Metrics

Track MCP usage:

```bash
# View MCP server logs
tail -f ~/.context-now/mcp.log

# Check resource access
grep "resources/read" ~/.context-now/mcp.log | wc -l

# Most used tools
grep "tools/call" ~/.context-now/mcp.log | cut -d'"' -f4 | sort | uniq -c
```

## 🔄 Updates

Context-Now MCP server updates automatically when you update the package:

```bash
npm update -g @gabocapo/context-now
```

## 🤝 Contributing

Want to add new MCP features? 

1. Fork the repository
2. Add new resources/tools in `lib/mcp/server.js`
3. Add new prompts in `lib/mcp/prompts.js`
4. Test with Claude Desktop
5. Submit a PR

## 📚 Further Reading

- [MCP Specification](https://modelcontextprotocol.io/docs)
- [Claude Desktop Docs](https://claude.ai/docs/desktop)
- [Context-Now API](./API.md)
- [Security Documentation](./SECURITY.md)

---

**Note**: MCP integration requires Context-Now v3.0.0 or higher and Claude Desktop with MCP support.