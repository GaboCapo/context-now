/**
 * MCP Prompts for Context-Now
 * ===========================
 * Pre-configured prompts for common development workflows
 */

module.exports = {
    prompts: [
        {
            name: 'project_overview',
            description: 'Get a comprehensive project overview',
            arguments: [],
            template: `Please analyze the current project using Context-Now and provide:
1. Current branch and git status
2. Critical issues that need immediate attention
3. Open PRs requiring review
4. Stale branches that could be cleaned
5. Overall project health score
6. Top 3 recommended actions`
        },
        {
            name: 'fix_critical_issue',
            description: 'Start working on the most critical issue',
            arguments: [
                {
                    name: 'issue_number',
                    description: 'Issue number to fix (optional, uses most critical if not provided)',
                    required: false
                }
            ],
            template: `I need to fix issue {{issue_number||"the most critical issue"}}. Please:
1. Get issue details from Context-Now
2. Create an appropriate branch using the create_branch tool
3. Provide a plan for fixing the issue
4. List any related issues that might be affected`
        },
        {
            name: 'pr_review',
            description: 'Review and analyze open pull requests',
            arguments: [],
            template: `Please review all open PRs using Context-Now and provide:
1. List of PRs sorted by age
2. Which PRs solve critical issues
3. Potential merge conflicts
4. Recommended merge order
5. Any PRs that should be closed or updated`
        },
        {
            name: 'developer_handover',
            description: 'Create a developer handover document',
            arguments: [
                {
                    name: 'developer_name',
                    description: 'Name of developer taking over',
                    required: true
                }
            ],
            template: `Create a handover document for {{developer_name}} using Context-Now data:
1. Current project state and active branch
2. Uncommitted changes summary
3. Critical issues with priority
4. Open PRs status
5. Recent completed work
6. Recommended next steps
7. Important project context and gotchas`
        },
        {
            name: 'security_audit',
            description: 'Perform a security audit of the project',
            arguments: [],
            template: `Perform a security audit using Context-Now:
1. Check for security-labeled issues
2. Review age of security-related PRs
3. Identify any branches with "security" or "CVE" in the name
4. Check for any critical issues related to dependencies
5. Provide security recommendations`
        },
        {
            name: 'sprint_planning',
            description: 'Help with sprint planning',
            arguments: [
                {
                    name: 'sprint_days',
                    description: 'Number of days in sprint',
                    required: false
                }
            ],
            template: `Help me plan the next {{sprint_days||14}} day sprint using Context-Now:
1. List all open issues by priority
2. Estimate which issues can be completed
3. Identify dependencies between issues
4. Suggest sprint goals
5. Recommend issue assignment based on complexity`
        },
        {
            name: 'cleanup_branches',
            description: 'Clean up old and stale branches',
            arguments: [],
            template: `Help me clean up branches using Context-Now:
1. List all stale branches (>30 days inactive)
2. Identify merged branches that can be deleted
3. Find branches with no corresponding issue
4. Provide git commands to clean each category
5. Warn about any branches that might still be needed`
        },
        {
            name: 'issue_triage',
            description: 'Triage and prioritize issues',
            arguments: [],
            template: `Help me triage issues using Context-Now:
1. List all issues grouped by priority
2. Identify issues missing priority labels
3. Find duplicate or related issues
4. Suggest priority changes based on age and impact
5. Recommend which issues to work on first`
        },
        {
            name: 'release_preparation',
            description: 'Prepare for a release',
            arguments: [
                {
                    name: 'version',
                    description: 'Release version number',
                    required: true
                }
            ],
            template: `Help me prepare release {{version}} using Context-Now:
1. List all completed issues since last release
2. Identify any critical issues still open
3. Check for PRs that should be merged
4. Generate release notes draft
5. Suggest post-release cleanup tasks`
        },
        {
            name: 'daily_standup',
            description: 'Prepare daily standup report',
            arguments: [],
            template: `Generate my daily standup using Context-Now data:
1. What I worked on (recent commits/branches)
2. What I'm working on today (current branch/issue)
3. Any blockers (waiting PRs, critical issues)
4. Issues I need help with
5. PRs ready for review`
        }
    ]
};