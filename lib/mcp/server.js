/**
 * MCP (Model Context Protocol) Server for Context-Now
 * ====================================================
 * Exposes Context-Now functionality via MCP for AI assistants
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const contextNow = require('../../index.js');

class ContextNowMCPServer {
    constructor() {
        this.server = new Server(
            {
                name: 'context-now-mcp',
                version: '1.0.0',
            },
            {
                capabilities: {
                    resources: {},
                    tools: {},
                    prompts: {},
                },
            }
        );
        
        this.setupHandlers();
    }
    
    setupHandlers() {
        // Import prompts
        const { prompts } = require('./prompts');
        
        // Setup prompts handler
        this.server.setRequestHandler('prompts/list', async () => {
            return {
                prompts: prompts.map(p => ({
                    name: p.name,
                    description: p.description,
                    arguments: p.arguments,
                })),
            };
        });
        
        this.server.setRequestHandler('prompts/get', async (request) => {
            const { name, arguments: args } = request.params;
            const prompt = prompts.find(p => p.name === name);
            
            if (!prompt) {
                throw new Error(`Unknown prompt: ${name}`);
            }
            
            // Replace template variables
            let content = prompt.template;
            if (args) {
                Object.entries(args).forEach(([key, value]) => {
                    const regex = new RegExp(`{{${key}\\|\\|"[^"]*"}}|{{${key}}}`, 'g');
                    content = content.replace(regex, value);
                });
            }
            
            return {
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: content,
                        },
                    },
                ],
            };
        });
        
        // List available resources
        this.server.setRequestHandler('resources/list', async () => {
            return {
                resources: [
                    {
                        uri: 'context://projects/list',
                        name: 'All Projects',
                        description: 'List of all connected projects',
                        mimeType: 'application/json',
                    },
                    {
                        uri: 'context://project/status',
                        name: 'Project Status',
                        description: 'Current project status with branch, issues, PRs',
                        mimeType: 'application/json',
                    },
                    {
                        uri: 'context://issues/all',
                        name: 'All Issues',
                        description: 'Complete list of project issues',
                        mimeType: 'application/json',
                    },
                    {
                        uri: 'context://issues/critical',
                        name: 'Critical Issues',
                        description: 'Only critical priority issues',
                        mimeType: 'application/json',
                    },
                    {
                        uri: 'context://branches/all',
                        name: 'All Branches',
                        description: 'Local and remote branches',
                        mimeType: 'application/json',
                    },
                    {
                        uri: 'context://prs/open',
                        name: 'Open PRs',
                        description: 'All open pull requests',
                        mimeType: 'application/json',
                    },
                    {
                        uri: 'context://recommendations',
                        name: 'Recommendations',
                        description: 'AI-powered project recommendations',
                        mimeType: 'application/json',
                    },
                    {
                        uri: 'context://project/structure',
                        name: 'Project Structure',
                        description: 'Narrative description of project file structure',
                        mimeType: 'text/plain',
                    },
                ],
            };
        });
        
        // Read resource content
        this.server.setRequestHandler('resources/read', async (request) => {
            const { uri } = request.params;
            
            try {
                let content;
                
                switch (uri) {
                    case 'context://projects/list':
                        content = await contextNow.list();
                        break;
                        
                    case 'context://project/status':
                        content = await contextNow.status();
                        break;
                        
                    case 'context://issues/all':
                        content = await contextNow.issues();
                        break;
                        
                    case 'context://issues/critical':
                        content = await contextNow.critical();
                        break;
                        
                    case 'context://branches/all':
                        content = await contextNow.branches();
                        break;
                        
                    case 'context://prs/open':
                        const prs = await contextNow.pullRequests();
                        content = prs.filter(pr => pr.state === 'open');
                        break;
                        
                    case 'context://recommendations':
                        content = await this.generateRecommendations();
                        break;
                        
                    case 'context://project/structure':
                        const generateProjectStructure = require('../commands/structure');
                        const currentProject = await this.getCurrentProject();
                        if (!currentProject) {
                            throw new Error('No project currently active');
                        }
                        const structureResult = await generateProjectStructure(currentProject.path, {
                            maxLevel: 4,
                            format: 'narrative',
                            output: 'return'
                        });
                        return {
                            contents: [
                                {
                                    uri,
                                    mimeType: 'text/plain',
                                    text: structureResult,
                                },
                            ],
                        };
                        
                    default:
                        throw new Error(`Unknown resource: ${uri}`);
                }
                
                return {
                    contents: [
                        {
                            uri,
                            mimeType: 'application/json',
                            text: JSON.stringify(content, null, 2),
                        },
                    ],
                };
            } catch (error) {
                throw new Error(`Failed to read ${uri}: ${error.message}`);
            }
        });
        
        // List available tools
        this.server.setRequestHandler('tools/list', async () => {
            return {
                tools: [
                    {
                        name: 'connect_project',
                        description: 'Connect a new project to Context-Now',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                path: {
                                    type: 'string',
                                    description: 'Path to the Git project',
                                },
                            },
                            required: ['path'],
                        },
                    },
                    {
                        name: 'create_branch',
                        description: 'Create a new Git branch for an issue',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                issue_number: {
                                    type: 'string',
                                    description: 'Issue number (e.g., 123)',
                                },
                                branch_type: {
                                    type: 'string',
                                    enum: ['feature', 'bugfix', 'hotfix'],
                                    description: 'Type of branch to create',
                                },
                            },
                            required: ['issue_number', 'branch_type'],
                        },
                    },
                    {
                        name: 'analyze_project',
                        description: 'Analyze project and get recommendations',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                project_name: {
                                    type: 'string',
                                    description: 'Optional project name',
                                },
                                include_stale: {
                                    type: 'boolean',
                                    description: 'Include stale branch analysis',
                                },
                            },
                        },
                    },
                    {
                        name: 'sync_project',
                        description: 'Sync project data with GitHub',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                project_name: {
                                    type: 'string',
                                    description: 'Optional project name',
                                },
                            },
                        },
                    },
                ],
            };
        });
        
        // Execute tools
        this.server.setRequestHandler('tools/call', async (request) => {
            const { name, arguments: args } = request.params;
            
            try {
                let result;
                
                switch (name) {
                    case 'connect_project':
                        result = await contextNow.connect(args.path);
                        break;
                        
                    case 'create_branch':
                        result = await this.createBranch(
                            args.issue_number,
                            args.branch_type
                        );
                        break;
                        
                    case 'analyze_project':
                        result = await this.analyzeProject(
                            args.project_name,
                            args.include_stale
                        );
                        break;
                        
                    case 'sync_project':
                        result = await this.syncProject(args.project_name);
                        break;
                        
                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
                
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error: ${error.message}`,
                        },
                    ],
                    isError: true,
                };
            }
        });
    }
    
    async getCurrentProject() {
        // Try to get current project from context
        const projects = await contextNow.list();
        if (projects && projects.length > 0) {
            // Return the first project for now
            // In a real implementation, this might track the active project
            return projects[0];
        }
        return null;
    }
    
    async createBranch(issueNumber, branchType) {
        const { safeGit } = contextNow.utils;
        const branchName = `${branchType}/issue-${issueNumber}`;
        
        // Check if branch exists
        const branches = await contextNow.branches();
        if (branches.local.includes(branchName)) {
            return { 
                success: false, 
                message: `Branch ${branchName} already exists` 
            };
        }
        
        // Create branch
        safeGit(['checkout', '-b', branchName]);
        
        return {
            success: true,
            branch: branchName,
            message: `Created branch ${branchName}`,
        };
    }
    
    async analyzeProject(projectName, includeStale = false) {
        const status = await contextNow.status(projectName);
        const issues = await contextNow.issues(projectName);
        const prs = await contextNow.pullRequests(projectName);
        const branches = await contextNow.branches(projectName);
        
        const analysis = {
            health_score: 100,
            critical_issues: [],
            recommendations: [],
            metrics: {},
        };
        
        // Critical issues
        const critical = issues.filter(i => i.priority === 'critical');
        analysis.critical_issues = critical;
        analysis.health_score -= critical.length * 20;
        
        // Old PRs
        const oldPRs = prs.filter(pr => {
            const age = Date.now() - new Date(pr.created_at);
            return age > 7 * 24 * 60 * 60 * 1000; // 7 days
        });
        
        if (oldPRs.length > 0) {
            analysis.recommendations.push({
                type: 'PR_REVIEW',
                message: `${oldPRs.length} PRs older than 7 days need review`,
                prs: oldPRs.map(pr => pr.id),
            });
            analysis.health_score -= oldPRs.length * 5;
        }
        
        // Stale branches
        if (includeStale && branches.stale) {
            analysis.recommendations.push({
                type: 'BRANCH_CLEANUP',
                message: `${branches.stale.length} stale branches should be cleaned`,
                branches: branches.stale.map(b => b.name),
            });
        }
        
        // Metrics
        analysis.metrics = {
            open_issues: issues.filter(i => i.state === 'open').length,
            critical_issues: critical.length,
            open_prs: prs.filter(pr => pr.state === 'open').length,
            total_branches: branches.local.length,
            health_score: Math.max(0, analysis.health_score),
        };
        
        return analysis;
    }
    
    async syncProject(projectName) {
        const { safeGit, safeGH } = contextNow.utils;
        
        // Git fetch
        safeGit(['fetch', '--all']);
        
        // Get fresh data from GitHub
        const issues = safeGH(['issue', 'list', '--json', 'number,title,state,labels']);
        const prs = safeGH(['pr', 'list', '--json', 'number,title,state,author']);
        
        return {
            success: true,
            synced: {
                issues: JSON.parse(issues).length,
                prs: JSON.parse(prs).length,
            },
            timestamp: new Date().toISOString(),
        };
    }
    
    async generateRecommendations() {
        const analysis = await this.analyzeProject();
        const recommendations = [];
        
        // Priority 1: Critical issues
        if (analysis.critical_issues.length > 0) {
            recommendations.push({
                priority: 1,
                action: 'FIX_CRITICAL',
                description: `Fix ${analysis.critical_issues.length} critical issues immediately`,
                issues: analysis.critical_issues.map(i => i.id),
            });
        }
        
        // Priority 2: Review PRs
        const prs = await contextNow.pullRequests();
        const openPRs = prs.filter(pr => pr.state === 'open');
        if (openPRs.length > 0) {
            recommendations.push({
                priority: 2,
                action: 'REVIEW_PRS',
                description: `Review ${openPRs.length} open pull requests`,
                prs: openPRs.map(pr => pr.id),
            });
        }
        
        // Priority 3: Clean branches
        const branches = await contextNow.branches();
        if (branches.stale && branches.stale.length > 5) {
            recommendations.push({
                priority: 3,
                action: 'CLEANUP_BRANCHES',
                description: `Clean up ${branches.stale.length} stale branches`,
                count: branches.stale.length,
            });
        }
        
        return recommendations;
    }
    
    async start() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Context-Now MCP server running');
    }
}

// Start server if run directly
if (require.main === module) {
    const server = new ContextNowMCPServer();
    server.start().catch(console.error);
}

module.exports = ContextNowMCPServer;