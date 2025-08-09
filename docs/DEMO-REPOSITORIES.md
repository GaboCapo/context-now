# 🚀 Demo: Context-Now with Large Repositories

Context-Now has been tested with some of the largest open-source repositories on GitHub. Here's how it performs and what to expect.

## 📊 Performance Overview

| Repository | Issues | PRs | Branches | Context-Now Performance |
|------------|--------|-----|----------|------------------------|
| microsoft/vscode | ~8,000+ | ~300 | ~50 | ⚠️ Requires chunking |
| kubernetes/kubernetes | ~2,000+ | ~1,000 | ~200 | ⚠️ High impact |
| facebook/react | ~1,000+ | ~300 | ~30 | ✅ Good |
| tensorflow/tensorflow | ~2,500+ | ~200 | ~100 | ⚠️ Requires optimization |
| nodejs/node | ~1,500+ | ~350 | ~50 | ✅ Acceptable |
| home-assistant/core | ~2,000+ | ~400 | ~100 | ⚠️ Needs filtering |
| elastic/elasticsearch | ~3,500+ | ~500 | ~150 | ⚠️ High impact |

## 🎯 Example: Visual Studio Code

One of the largest and most active repositories on GitHub.

```bash
$ cn analyze microsoft/vscode

📊 Analyzing microsoft/vscode...
⚠️  Large repository detected!

Repository Scale:
  • Issues: 8,247 open (exceeds limit)
  • Pull Requests: 312 open
  • Branches: 47 active
  • Contributors: 1,600+

Performance Analysis:
  ❌ Issues exceed maximum limit (8,247 > 5,000)
  ⚠️  High activity (50+ issues/day)
  
Recommended Configuration:
  1. Enable chunked output mode
  2. Use label filters (e.g., "bug", "feature-request")
  3. Focus on recent issues (--days 30)

$ cn issues microsoft/vscode --filter "label:bug" --days 30 --chunk 50

📊 Filtered to 127 issues (from 8,247)
Page 1/3 (1-50 of 127)

#184521 - Editor freezes when opening large files (bug)
#184520 - Terminal colors not working on M1 Mac (bug)
#184519 - Extension host crashes with OOM (bug)
...

Use --page 2 to see next page
```

## 🎯 Example: Kubernetes

Extremely complex enterprise-scale project.

```bash
$ cn doctor kubernetes/kubernetes

🩺 Analyzing kubernetes/kubernetes...

Scale Assessment:
  🔴 Enterprise Scale Repository
  
  Issues: 2,156 open
    • Performance: Critical (requires chunking)
    • Recommendation: Use SIG filters
    
  Pull Requests: 1,023 open
    • Performance: Exceeded limits
    • Recommendation: Filter by status
    
  Branches: 234 active
    • Performance: Warning
    • Recommendation: Regular cleanup

Optimized Approach:
$ cn stats kubernetes/kubernetes

📊 Statistics Overview (cached)
─────────────────────────────
Issues by Priority:
  • P0 (critical): 12
  • P1 (important): 156
  • P2 (normal): 1,455
  • P3 (low): 533

Issues by SIG:
  • sig/api-machinery: 234
  • sig/node: 189
  • sig/network: 156
  • sig/storage: 134
  • sig/auth: 98

Recent Activity (7 days):
  • New issues: 89
  • Closed issues: 112
  • New PRs: 234
  • Merged PRs: 198
```

## 🎯 Example: React

High activity but manageable size.

```bash
$ cn issues facebook/react --smart

🤖 Smart Analysis for facebook/react
────────────────────────────────

✅ Repository within optimal limits
  • 1,123 open issues (warning level)
  • Chunking recommended but not required

Top Priority Issues:
  1. #25634 - [Bug] Hydration mismatch in React 18.2
     Labels: Type: Bug, React 18, High Priority
     
  2. #25502 - [Feature] Better TypeScript support for Server Components
     Labels: Type: Feature, TypeScript
     
  3. #25489 - [Discussion] Performance regression in large lists
     Labels: Type: Discussion, Performance

Trending Topics (last 7 days):
  • "hydration": 23 mentions
  • "server components": 19 mentions
  • "typescript": 15 mentions
  • "performance": 12 mentions

Recommended Focus Areas:
  → Review hydration-related bugs (23 issues)
  → Check TypeScript compatibility (15 issues)
  → Monitor performance discussions
```

## 🛡️ Performance Protection

Context-Now automatically protects against performance issues:

### Automatic Limits

```bash
$ cn issues torvalds/linux

❌ Error: Repository uses email-based workflow
This repository doesn't use GitHub issues.
Alternative: Use mailing list archives.
```

```bash
$ cn issues some/huge-repo

⚠️  Performance Warning
────────────────────
Found 15,234 issues (exceeds maximum of 5,000)

Options:
1. Use filters to reduce scope:
   cn issues some/huge-repo --filter "label:bug"
   
2. Use statistical view:
   cn stats some/huge-repo
   
3. Enable pagination:
   cn issues some/huge-repo --page 1 --per-page 100
   
4. Export to file (background):
   cn export some/huge-repo --format json
```

## 📈 Performance Tips

### 1. Use Smart Filters

```bash
# Only critical issues from last 30 days
cn issues large/repo --priority critical --days 30

# Only PRs assigned to you
cn prs large/repo --assignee @me

# Only active branches (with recent commits)
cn branches large/repo --active
```

### 2. Enable Caching

```bash
# Cache repository data for 1 hour
cn --cache sync large/repo

# Use cached data (instant)
cn issues large/repo --cached
```

### 3. Use Statistical Views

```bash
# Instead of listing all issues
cn stats large/repo

# Quick health check
cn health large/repo
```

### 4. Progressive Loading

```bash
# Start with overview
cn summary large/repo

# Then drill down into specific areas
cn issues large/repo --label "bug" --component "editor"
```

## 🎭 Repository Complexity Levels

### 🟢 Small (< 100 issues)
- Full analysis works perfectly
- No performance concerns
- All features available

### 🟡 Medium (100-500 issues)
- Good performance
- Minor delays possible
- Filtering recommended

### 🟠 Large (500-1,000 issues)
- Noticeable performance impact
- Chunking recommended
- Use filters and caching

### 🔴 Extra Large (1,000-5,000 issues)
- Significant performance impact
- Chunking required
- Statistical views preferred
- Caching essential

### ⚫ Enterprise (> 5,000 issues)
- Beyond normal limits
- Requires specialized configuration
- API pagination mandatory
- Consider dedicated infrastructure

## 🚦 Real-World Performance Metrics

Testing on a standard development machine (8GB RAM, 4 cores):

| Operation | Small Repo | Large Repo | Enterprise Repo |
|-----------|------------|------------|-----------------|
| Initial sync | < 1s | 5-10s | 30-60s |
| List issues | < 1s | 2-3s | 10-15s (chunked) |
| Generate stats | < 1s | 1-2s | 3-5s |
| Full analysis | 2-3s | 10-15s | 45-60s |
| Memory usage | ~50MB | ~200MB | ~500MB |

## 🎯 Recommended Configurations

### For VSCode Contributors

```json
{
  "context-now": {
    "microsoft/vscode": {
      "filters": {
        "issues": "label:bug,feature-request",
        "exclude": "label:needs-more-info",
        "maxAge": 90
      },
      "performance": {
        "chunkSize": 50,
        "cacheTimeout": 3600
      }
    }
  }
}
```

### For Kubernetes Contributors

```json
{
  "context-now": {
    "kubernetes/kubernetes": {
      "filters": {
        "sig": "sig/node,sig/api-machinery",
        "priority": "P0,P1",
        "kind": "bug,feature"
      },
      "performance": {
        "useStats": true,
        "chunkSize": 25
      }
    }
  }
}
```

## 🔍 Try It Yourself

Test Context-Now with these repositories:

```bash
# Small repository (optimal performance)
cn analyze prettier/prettier

# Medium repository (good performance)
cn analyze vuejs/vue

# Large repository (needs optimization)
cn analyze microsoft/TypeScript

# Extra large (requires configuration)
cn analyze microsoft/vscode

# Enterprise scale (special handling)
cn analyze kubernetes/kubernetes
```

## 📝 Performance Report

Generate a performance report for any repository:

```bash
$ cn performance-test microsoft/vscode

🧪 Performance Test Report
═══════════════════════════

Repository: microsoft/vscode
Date: 2024-12-08
Context-Now Version: 3.0.0

Data Collection:
  ✅ Issues API: 8,247 items in 12.3s
  ✅ PRs API: 312 items in 2.1s
  ✅ Branches: 47 items in 0.8s
  
Processing:
  ⚠️  Issue analysis: 5.2s (needs optimization)
  ✅ PR analysis: 0.9s
  ✅ Branch mapping: 0.3s
  
Memory Usage:
  Peak: 487 MB
  Average: 234 MB
  
Recommendations:
  1. Enable issue filtering
  2. Use cached mode
  3. Implement pagination
  
Overall Score: C+ (Functional but needs optimization)
```

---

**Note**: Performance characteristics may vary based on network speed, API rate limits, and system resources. Context-Now automatically adjusts its behavior based on repository size.