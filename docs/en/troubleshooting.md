# Troubleshooting

Here you will find solutions to common problems when using `context-now`.

## Table of Contents
- [Installation & Setup](#installation--setup)
- [Command Execution](#command-execution)
- [GitHub API & Token](#github-api--token)
- [Synchronization](#synchronization)

---

## Installation & Setup

### `command not found: cn`
- **Problem**: Your shell cannot find the `cn` command.
- **Solution 1**: Reload your shell configuration.
  ```bash
  # For Bash
  source ~/.bashrc
  # For Zsh
  source ~/.zshrc
  ```
- **Solution 2**: Check if the installation path is included in your `$PATH` environment variable.
  ```bash
  echo $PATH
  ```
  If the path `~/.context-now` or a symlink directory like `~/.local/bin` is missing, you must add it manually or repeat the installation.

### `Permission denied` when running `cn`
- **Problem**: The script lacks execution permissions.
- **Solution**: Make the script executable.
  ```bash
  chmod +x /path/to/context-now/cn
  ```
  If you used the quick installer, this should have been done automatically.

---

## Command Execution

### `cn -c` reports an error
- **Problem**: Connecting a project fails.
- **Solution**:
  - Make sure you are providing the **absolute path** to your project repository.
  - Check if it is a valid Git repository (a `.git` folder must exist).
  - Ensure you have write permissions for the project directory.

---

## GitHub API & Token

### "Repository not found or private"
- **Problem**: The tool cannot access the GitHub repository.
- **Solution**:
  - Make sure you have [configured a GitHub token](configuration.md#github-api-connection).
  - Check if your token has the necessary permissions (`repo` scope) for the private repository.

### "GitHub API rate limit exceeded"
- **Problem**: You have reached the maximum number of requests to the GitHub API without authentication (approx. 60 per hour).
- **Solution**: [Configure a GitHub token](configuration.md#github-api-connection) to increase your limit to 5,000 requests per hour.

### "Bad credentials" or "Access denied"
- **Problem**: Your GitHub token is invalid.
- **Solution**: Your token has likely expired or been revoked. Create a new token on GitHub and update it in your configuration.

---

## Synchronization

### `cn sync` shows outdated branches
- **Problem**: The tool displays remote branches that have already been deleted on GitHub.
- **Solution 1 (Recommended)**: Prune your project's local Git cache.
  ```bash
  # In your project directory
  git remote prune origin
  ```
- **Solution 2**: Manually keep the `github-branches.json` file up to date. This file has the highest priority for the tool.
