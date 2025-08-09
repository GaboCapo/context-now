/**
 * Sync Command for Context-Now
 * ============================
 * Handles git sync with conflict resolution
 */

'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

/**
 * Execute git command safely
 */
function gitExec(args, options = {}) {
    try {
        return execFileSync('git', args, {
            encoding: 'utf8',
            cwd: options.cwd || process.cwd(),
            ...options
        }).trim();
    } catch (error) {
        return { error: error.message, code: error.status };
    }
}

/**
 * Get git status information
 */
function getGitStatus(projectPath) {
    const status = {
        branch: '',
        upstream: '',
        ahead: 0,
        behind: 0,
        hasChanges: false,
        hasConflicts: false,
        diverged: false
    };
    
    // Get current branch
    const branch = gitExec(['branch', '--show-current'], { cwd: projectPath });
    if (typeof branch === 'string') {
        status.branch = branch;
    }
    
    // Get upstream branch
    const upstream = gitExec(['rev-parse', '--abbrev-ref', '@{u}'], { cwd: projectPath });
    if (typeof upstream === 'string') {
        status.upstream = upstream;
    }
    
    // Check ahead/behind
    const revList = gitExec(['rev-list', '--left-right', '--count', 'HEAD...@{u}'], { cwd: projectPath });
    if (typeof revList === 'string') {
        const [ahead, behind] = revList.split('\t').map(n => parseInt(n) || 0);
        status.ahead = ahead;
        status.behind = behind;
        status.diverged = ahead > 0 && behind > 0;
    }
    
    // Check for changes
    const changes = gitExec(['status', '--porcelain'], { cwd: projectPath });
    if (typeof changes === 'string' && changes.length > 0) {
        status.hasChanges = true;
    }
    
    // Check for conflicts
    const conflicts = gitExec(['diff', '--name-only', '--diff-filter=U'], { cwd: projectPath });
    if (typeof conflicts === 'string' && conflicts.length > 0) {
        status.hasConflicts = true;
    }
    
    return status;
}

/**
 * Smart sync with conflict handling
 */
async function syncProject(projectPath, options = {}) {
    console.log(`${colors.cyan}🔄 Syncing project...${colors.reset}\n`);
    
    // Get current status
    const status = getGitStatus(projectPath);
    
    console.log(`${colors.bright}Current Status:${colors.reset}`);
    console.log(`  Branch: ${status.branch}`);
    console.log(`  Upstream: ${status.upstream || 'not set'}`);
    
    if (status.hasConflicts) {
        console.error(`${colors.red}❌ Merge conflicts detected!${colors.reset}`);
        console.log(`${colors.yellow}Please resolve conflicts manually before syncing${colors.reset}`);
        return { success: false, reason: 'conflicts' };
    }
    
    // Handle uncommitted changes
    if (status.hasChanges) {
        console.log(`${colors.yellow}⚠️  Uncommitted changes detected${colors.reset}`);
        
        if (options.stash) {
            console.log(`${colors.cyan}Stashing changes...${colors.reset}`);
            const stashResult = gitExec(['stash', 'push', '-m', `context-now-sync-${Date.now()}`], { cwd: projectPath });
            if (stashResult.error) {
                console.error(`${colors.red}Failed to stash: ${stashResult.error}${colors.reset}`);
                return { success: false, reason: 'stash-failed' };
            }
            console.log(`${colors.green}✅ Changes stashed${colors.reset}`);
        } else if (!options.force) {
            console.log(`${colors.yellow}Use --stash to automatically stash changes${colors.reset}`);
            console.log(`${colors.yellow}Or commit/stash manually first${colors.reset}`);
            return { success: false, reason: 'uncommitted-changes' };
        }
    }
    
    // Handle diverged branches
    if (status.diverged) {
        console.log(`${colors.yellow}⚠️  Branch has diverged!${colors.reset}`);
        console.log(`  Local: ${status.ahead} commits ahead`);
        console.log(`  Remote: ${status.behind} commits behind`);
        
        if (options.strategy === 'rebase') {
            console.log(`${colors.cyan}Rebasing on upstream...${colors.reset}`);
            const rebaseResult = gitExec(['pull', '--rebase'], { cwd: projectPath });
            
            if (rebaseResult.error) {
                console.error(`${colors.red}Rebase failed: ${rebaseResult.error}${colors.reset}`);
                console.log(`${colors.yellow}You may need to resolve conflicts and run:${colors.reset}`);
                console.log(`  git rebase --continue`);
                return { success: false, reason: 'rebase-failed' };
            }
            
            console.log(`${colors.green}✅ Rebased successfully${colors.reset}`);
            
        } else if (options.strategy === 'merge') {
            console.log(`${colors.cyan}Merging upstream...${colors.reset}`);
            const mergeResult = gitExec(['pull', '--no-rebase'], { cwd: projectPath });
            
            if (mergeResult.error) {
                console.error(`${colors.red}Merge failed: ${mergeResult.error}${colors.reset}`);
                return { success: false, reason: 'merge-failed' };
            }
            
            console.log(`${colors.green}✅ Merged successfully${colors.reset}`);
            
        } else {
            // Default: ask user
            console.log(`\n${colors.bright}Options:${colors.reset}`);
            console.log(`  1. Rebase (recommended) - cleaner history`);
            console.log(`  2. Merge - preserves all commits`);
            console.log(`  3. Cancel - handle manually`);
            console.log(`\n${colors.yellow}Use --strategy rebase or --strategy merge to choose${colors.reset}`);
            
            return { success: false, reason: 'diverged-needs-strategy' };
        }
    } else if (status.behind > 0) {
        // Simple fast-forward pull
        console.log(`${colors.cyan}Pulling ${status.behind} commits...${colors.reset}`);
        const pullResult = gitExec(['pull'], { cwd: projectPath });
        
        if (pullResult.error) {
            console.error(`${colors.red}Pull failed: ${pullResult.error}${colors.reset}`);
            return { success: false, reason: 'pull-failed' };
        }
        
        console.log(`${colors.green}✅ Pulled successfully${colors.reset}`);
    }
    
    // Push if ahead
    if (status.ahead > 0) {
        console.log(`${colors.cyan}Pushing ${status.ahead} commits...${colors.reset}`);
        const pushResult = gitExec(['push'], { cwd: projectPath });
        
        if (pushResult.error) {
            console.error(`${colors.red}Push failed: ${pushResult.error}${colors.reset}`);
            
            // Check if it's a force-push situation
            if (pushResult.error.includes('non-fast-forward')) {
                console.log(`${colors.yellow}Remote has diverged. You may need to:${colors.reset}`);
                console.log(`  git push --force-with-lease`);
                console.log(`${colors.red}⚠️  Use with caution!${colors.reset}`);
            }
            
            return { success: false, reason: 'push-failed' };
        }
        
        console.log(`${colors.green}✅ Pushed successfully${colors.reset}`);
    }
    
    // Restore stashed changes if any
    if (options.stash && status.hasChanges) {
        console.log(`${colors.cyan}Restoring stashed changes...${colors.reset}`);
        const popResult = gitExec(['stash', 'pop'], { cwd: projectPath });
        
        if (popResult.error) {
            console.log(`${colors.yellow}⚠️  Could not restore stash automatically${colors.reset}`);
            console.log(`Run: git stash pop`);
        } else {
            console.log(`${colors.green}✅ Changes restored${colors.reset}`);
        }
    }
    
    // Final status
    const finalStatus = getGitStatus(projectPath);
    console.log(`\n${colors.bright}Final Status:${colors.reset}`);
    console.log(`  Branch: ${finalStatus.branch}`);
    console.log(`  Status: ${finalStatus.ahead === 0 && finalStatus.behind === 0 ? '✅ Up to date' : '⚠️ Check status'}`);
    
    return { success: true, finalStatus };
}

/**
 * Sync with GitHub issues/PRs
 */
async function syncGitHub(projectPath, options = {}) {
    console.log(`\n${colors.cyan}🐙 Syncing GitHub data...${colors.reset}\n`);
    
    try {
        // Get repository info
        const remoteUrl = gitExec(['remote', 'get-url', 'origin'], { cwd: projectPath });
        if (remoteUrl.error) {
            console.error(`${colors.red}No remote origin found${colors.reset}`);
            return { success: false };
        }
        
        // Extract owner/repo from URL
        const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^.]+)/);
        if (!match) {
            console.error(`${colors.red}Not a GitHub repository${colors.reset}`);
            return { success: false };
        }
        
        const [, owner, repo] = match;
        console.log(`Repository: ${owner}/${repo}`);
        
        // Fetch issues
        console.log(`${colors.cyan}Fetching issues...${colors.reset}`);
        const issuesResult = execFileSync('gh', ['issue', 'list', '--repo', `${owner}/${repo}`, '--json', 'number,title,state,labels,assignees'], {
            encoding: 'utf8'
        });
        
        const issues = JSON.parse(issuesResult);
        console.log(`${colors.green}✅ Fetched ${issues.length} issues${colors.reset}`);
        
        // Fetch PRs
        console.log(`${colors.cyan}Fetching pull requests...${colors.reset}`);
        const prsResult = execFileSync('gh', ['pr', 'list', '--repo', `${owner}/${repo}`, '--json', 'number,title,state,labels,author'], {
            encoding: 'utf8'
        });
        
        const prs = JSON.parse(prsResult);
        console.log(`${colors.green}✅ Fetched ${prs.length} pull requests${colors.reset}`);
        
        // Save to project data
        const namespace = options.namespace || 'context-now';
        const dataPath = path.join(projectPath, 'tools', namespace);
        
        if (!fs.existsSync(dataPath)) {
            fs.mkdirSync(dataPath, { recursive: true });
        }
        
        fs.writeFileSync(path.join(dataPath, 'issues.json'), JSON.stringify(issues, null, 2));
        fs.writeFileSync(path.join(dataPath, 'prs.json'), JSON.stringify(prs, null, 2));
        
        return { success: true, issues: issues.length, prs: prs.length };
        
    } catch (error) {
        console.error(`${colors.red}GitHub sync failed: ${error.message}${colors.reset}`);
        console.log(`${colors.yellow}Make sure 'gh' CLI is installed and authenticated${colors.reset}`);
        return { success: false, error: error.message };
    }
}

/**
 * Main sync function
 */
async function sync(projectPath, options = {}) {
    console.log(`${colors.bright}${colors.cyan}🔄 Context-Now Sync${colors.reset}`);
    console.log('─'.repeat(50));
    
    // Git sync
    const gitResult = await syncProject(projectPath, options);
    
    if (!gitResult.success) {
        console.log(`\n${colors.yellow}Git sync incomplete: ${gitResult.reason}${colors.reset}`);
        
        if (gitResult.reason === 'diverged-needs-strategy') {
            console.log(`\nRun one of:`);
            console.log(`  cn sync --strategy rebase   (recommended)`);
            console.log(`  cn sync --strategy merge`);
        }
    }
    
    // GitHub sync (only if git sync succeeded or was skipped)
    if (options.github !== false) {
        const githubResult = await syncGitHub(projectPath, options);
        
        if (githubResult.success) {
            console.log(`\n${colors.green}✅ Sync complete!${colors.reset}`);
        } else {
            console.log(`\n${colors.yellow}⚠️  GitHub sync failed (git sync may have succeeded)${colors.reset}`);
        }
    }
    
    return gitResult;
}

module.exports = { sync, syncProject, syncGitHub, getGitStatus };