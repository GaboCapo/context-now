# Configuration Guide

This guide explains the configuration of `context-now`, the project-specific data sources, and how to connect to the GitHub API.

## Table of Contents
- [Data Sources](#data-sources-of-the-tool)
  - [Manually Maintained Files](#manually-maintained-files)
  - [Automatically Collected Data](#automatically-collected-data)
- [Handling the Git Cache](#handling-the-git-cache)
- [GitHub API Connection](#github-api-connection)
  - [Create a GitHub Token](#create-a-github-token)
  - [Use the Token](#use-the-token)
  - [Security Advice](#security-advice)

---

## Data Sources of the Tool

`context-now` draws its information from various sources to create an accurate picture of your project. The configuration files for each project can be found in the `tools/context-tracker/` subdirectory.

### Manually Maintained Files

These JSON files are the heart of your project context and should be maintained regularly.

- **`issues.json`**: Contains a list of all relevant issues. You can define status, priority, and labels here to improve the tool's recommendations.
- **`prs.json`**: A list of pull requests that are relevant to the current context.
- **`github-branches.json`**: This is one of the most important files. It should contain an up-to-date list of the **real** branch names from GitHub. The tool compares this list with your local branches to find discrepancies.
- **`project-memory.json`**: Here, the tool remembers which branch belongs to which issue.
- **`issue-relations.json`**: (Optional) Define relationships between issues here, e.g., epics that have multiple sub-issues. This allows the tool to understand more complex relationships.

### Automatically Collected Data

- **Local Git Data**: The tool reads your local branches (`git branch`) and the status of your working copy (`git status`).

---

## Handling the Git Cache

A common problem is that `git` caches information about remote branches locally. Even if a branch has already been deleted on GitHub, it may still appear in your local cache as a remote branch.

**Problem**: The tool might display outdated branches.

**Solution**: Regularly prune your local Git cache.
```bash
# Removes all references to remote branches that no longer exist
git remote prune origin

# Alternatively: Fetch all changes and prune at the same time
git fetch --all --prune
```
However, the best method is to keep `github-branches.json` up to date, as this file has the highest priority for the tool.

---

## GitHub API Connection

For full functionality, especially with **private repositories**, `context-now` requires access to the GitHub API.

### Create a GitHub Token

1.  Go to your **GitHub Developer Settings**: [Personal access tokens (classic)](https://github.com/settings/tokens).
2.  Click on **"Generate new token (classic)"**.
3.  **Name**: Enter a descriptive name, e.g., "context-now".
4.  **Scopes**: Select the required permissions.
    -   `repo`: For full access to private and public repositories.
    -   `public_repo`: Sufficient if you only work with public repositories.
5.  Click on **"Generate token"**.
6.  **Important**: Copy the token immediately! It will only be shown to you once.

### Use the Token

There are several ways to provide the token to the tool.

- **Option 1: Environment Variable (recommended)**
  Set the variable in your current shell session:
  ```bash
  export GITHUB_TOKEN="ghp_YOUR_TOKEN_HERE"
  # Alternatively, GH_TOKEN is also supported
  export GH_TOKEN="ghp_YOUR_TOKEN_HERE"
  ```
  For permanent storage, you can add this line to your `~/.bashrc` or `~/.zshrc`.

- **Option 2: `.env` File**
  Create a file named `.env` in the root directory of your **`context-now` clone** (not in your project) and add the token there:
  ```
  GITHUB_TOKEN=ghp_YOUR_TOKEN_HERE
  ```
  **Warning**: Make sure the `.env` file is listed in your global `.gitignore` to prevent accidental commits.

### Security Advice

- **NEVER COMMIT YOUR TOKEN!** It does not belong in version control.
- Always create tokens with only the minimum necessary permissions.
- Rotate your tokens regularly, i.e., create a new one and delete the old one.
- If a token is accidentally published, revoke it immediately on GitHub.

---

### Rate Limits and Usage without a Token

The GitHub API has rate limits to prevent abuse.

- **Without a token**: You are limited to about 60 requests per hour. This is sufficient for occasional use with public repositories.
- **With a token**: Your limit increases to 5,000 requests per hour, which is more than enough for intensive use, even in large teams.

The tool also works without a token for public repositories or if you maintain `github-branches.json` manually. For private repositories, a token is mandatory.

### Troubleshooting

- **"Repository not found or private"**:
  Your token is missing or does not have the necessary `repo` permissions for this repository.

- **"GitHub API rate limit exceeded"**:
  You have reached the maximum number of requests without a token. Configure a token to increase the limit.

- **"GitHub API access denied" / "Bad credentials"**:
  Your token is invalid, expired, or has been revoked. Create a new token.
