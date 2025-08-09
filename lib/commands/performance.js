/**
 * Performance Management for Context-Now
 * =======================================
 * Handles large repositories and performance limits
 */

'use strict';

// Performance thresholds
const LIMITS = {
    ISSUES: {
        OPTIMAL: 100,      // Best performance
        WARNING: 500,      // Show warning
        CRITICAL: 1000,    // Require chunking
        MAX: 5000         // Hard limit
    },
    BRANCHES: {
        OPTIMAL: 50,
        WARNING: 200,
        CRITICAL: 500,
        MAX: 1000
    },
    PRS: {
        OPTIMAL: 50,
        WARNING: 200,
        CRITICAL: 500,
        MAX: 1000
    },
    OUTPUT: {
        MAX_LINES: 500,        // Max lines for terminal output
        CHUNK_SIZE: 50,        // Items per chunk
        MAX_FILE_SIZE: 10485760 // 10MB max for JSON files
    }
};

// Known large repositories for testing
const EXAMPLE_REPOS = {
    'microsoft/vscode': {
        name: 'Visual Studio Code',
        issues: '~8,000+ open issues',
        stars: '150k+',
        complexity: 'very high',
        challenges: ['Massive issue count', 'Complex label system', 'Multiple teams']
    },
    'kubernetes/kubernetes': {
        name: 'Kubernetes',
        issues: '~2,000+ open issues',
        stars: '100k+',
        complexity: 'extreme',
        challenges: ['Enterprise scale', 'Complex CI/CD', 'Multiple SIGs']
    },
    'facebook/react': {
        name: 'React',
        issues: '~1,000+ open issues',
        stars: '200k+',
        complexity: 'high',
        challenges: ['High activity', 'Complex discussions', 'Performance critical']
    },
    'tensorflow/tensorflow': {
        name: 'TensorFlow',
        issues: '~2,500+ open issues',
        stars: '175k+',
        complexity: 'very high',
        challenges: ['Multiple languages', 'Hardware dependencies', 'Complex builds']
    },
    'torvalds/linux': {
        name: 'Linux Kernel',
        issues: 'N/A (uses mailing lists)',
        stars: '150k+',
        complexity: 'extreme',
        challenges: ['Massive codebase', 'No GitHub issues', 'Email-based workflow']
    },
    'nodejs/node': {
        name: 'Node.js',
        issues: '~1,500+ open issues',
        stars: '100k+',
        complexity: 'high',
        challenges: ['Multiple release lines', 'Complex versioning', 'Native dependencies']
    },
    'home-assistant/core': {
        name: 'Home Assistant',
        issues: '~2,000+ open issues',
        stars: '65k+',
        complexity: 'high',
        challenges: ['Rapid release cycle', 'Many integrations', 'Community driven']
    },
    'elastic/elasticsearch': {
        name: 'Elasticsearch',
        issues: '~3,500+ open issues',
        stars: '65k+',
        complexity: 'very high',
        challenges: ['Enterprise features', 'Complex queries', 'Performance critical']
    }
};

/**
 * Check performance implications for a dataset
 */
function checkPerformance(type, count) {
    const limits = LIMITS[type.toUpperCase()];
    if (!limits) return { status: 'unknown' };
    
    if (count <= limits.OPTIMAL) {
        return {
            status: 'optimal',
            message: `✅ Optimal performance (${count} ${type})`,
            color: 'green'
        };
    } else if (count <= limits.WARNING) {
        return {
            status: 'good',
            message: `✅ Good performance (${count} ${type})`,
            color: 'green'
        };
    } else if (count <= limits.CRITICAL) {
        return {
            status: 'warning',
            message: `⚠️  Performance impact expected (${count} ${type})`,
            recommendation: `Consider filtering or chunking output`,
            color: 'yellow'
        };
    } else if (count <= limits.MAX) {
        return {
            status: 'critical',
            message: `⚠️  High performance impact (${count} ${type})`,
            recommendation: `Chunking required for optimal performance`,
            chunks: Math.ceil(count / LIMITS.OUTPUT.CHUNK_SIZE),
            color: 'red'
        };
    } else {
        return {
            status: 'exceeded',
            message: `❌ Exceeds maximum limit (${count} ${type}, max: ${limits.MAX})`,
            recommendation: `Use filters or API pagination`,
            color: 'red'
        };
    }
}

/**
 * Chunk large datasets for better performance
 */
function chunkData(data, chunkSize = LIMITS.OUTPUT.CHUNK_SIZE) {
    const chunks = [];
    for (let i = 0; i < data.length; i += chunkSize) {
        chunks.push({
            chunk: Math.floor(i / chunkSize) + 1,
            total: Math.ceil(data.length / chunkSize),
            start: i + 1,
            end: Math.min(i + chunkSize, data.length),
            data: data.slice(i, i + chunkSize)
        });
    }
    return chunks;
}

/**
 * Format output with performance considerations
 */
function formatWithLimits(data, options = {}) {
    const {
        type = 'issues',
        format = 'summary',
        maxItems = LIMITS.OUTPUT.CHUNK_SIZE,
        page = 1
    } = options;
    
    const perf = checkPerformance(type, data.length);
    const output = [];
    
    // Add performance header
    if (perf.status === 'warning' || perf.status === 'critical' || perf.status === 'exceeded') {
        output.push(`${perf.message}`);
        if (perf.recommendation) {
            output.push(`💡 ${perf.recommendation}`);
        }
        output.push('');
    }
    
    // Handle different formats
    switch (format) {
        case 'summary':
            output.push(`Total ${type}: ${data.length}`);
            if (data.length > maxItems) {
                output.push(`Showing first ${maxItems} items (use --all to see everything)`);
                output.push('');
                data.slice(0, maxItems).forEach(item => {
                    output.push(formatItem(item, type));
                });
                output.push('');
                output.push(`... and ${data.length - maxItems} more`);
            } else {
                data.forEach(item => {
                    output.push(formatItem(item, type));
                });
            }
            break;
            
        case 'chunked':
            const chunks = chunkData(data, maxItems);
            const chunk = chunks[page - 1] || chunks[0];
            output.push(`Page ${chunk.chunk}/${chunk.total} (${chunk.start}-${chunk.end} of ${data.length})`);
            output.push('');
            chunk.data.forEach(item => {
                output.push(formatItem(item, type));
            });
            if (chunk.chunk < chunk.total) {
                output.push('');
                output.push(`Use --page ${chunk.chunk + 1} to see next page`);
            }
            break;
            
        case 'stats':
            output.push(generateStats(data, type));
            break;
    }
    
    return output.join('\n');
}

/**
 * Format individual item based on type
 */
function formatItem(item, type) {
    switch (type) {
        case 'issues':
            return `  #${item.number || item.id} - ${item.title} (${item.state})`;
        case 'prs':
            return `  PR #${item.number} - ${item.title} (${item.state})`;
        case 'branches':
            return `  ${item.name} (${item.commits || 0} commits)`;
        default:
            return `  ${JSON.stringify(item)}`;
    }
}

/**
 * Generate statistics for large datasets
 */
function generateStats(data, type) {
    const stats = {
        total: data.length,
        byState: {},
        byLabel: {},
        byAuthor: {},
        byAge: {
            day: 0,
            week: 0,
            month: 0,
            quarter: 0,
            year: 0,
            older: 0
        }
    };
    
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    
    data.forEach(item => {
        // Count by state
        const state = item.state || 'unknown';
        stats.byState[state] = (stats.byState[state] || 0) + 1;
        
        // Count by labels
        if (item.labels) {
            item.labels.forEach(label => {
                const labelName = typeof label === 'string' ? label : label.name;
                stats.byLabel[labelName] = (stats.byLabel[labelName] || 0) + 1;
            });
        }
        
        // Count by author
        const author = item.author || item.user?.login || 'unknown';
        stats.byAuthor[author] = (stats.byAuthor[author] || 0) + 1;
        
        // Count by age
        if (item.created_at) {
            const age = now - new Date(item.created_at).getTime();
            if (age < DAY) stats.byAge.day++;
            else if (age < 7 * DAY) stats.byAge.week++;
            else if (age < 30 * DAY) stats.byAge.month++;
            else if (age < 90 * DAY) stats.byAge.quarter++;
            else if (age < 365 * DAY) stats.byAge.year++;
            else stats.byAge.older++;
        }
    });
    
    // Format statistics
    const output = [];
    output.push(`📊 Statistics for ${stats.total} ${type}`);
    output.push('─'.repeat(50));
    
    // By state
    output.push('\nBy State:');
    Object.entries(stats.byState)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .forEach(([state, count]) => {
            const percent = ((count / stats.total) * 100).toFixed(1);
            output.push(`  ${state}: ${count} (${percent}%)`);
        });
    
    // By age
    output.push('\nBy Age:');
    output.push(`  < 1 day: ${stats.byAge.day}`);
    output.push(`  < 1 week: ${stats.byAge.week}`);
    output.push(`  < 1 month: ${stats.byAge.month}`);
    output.push(`  < 3 months: ${stats.byAge.quarter}`);
    output.push(`  < 1 year: ${stats.byAge.year}`);
    output.push(`  > 1 year: ${stats.byAge.older}`);
    
    // Top labels
    if (Object.keys(stats.byLabel).length > 0) {
        output.push('\nTop Labels:');
        Object.entries(stats.byLabel)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .forEach(([label, count]) => {
                output.push(`  ${label}: ${count}`);
            });
    }
    
    // Top contributors
    output.push('\nTop Contributors:');
    Object.entries(stats.byAuthor)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .forEach(([author, count]) => {
            output.push(`  ${author}: ${count}`);
        });
    
    return output.join('\n');
}

/**
 * Analyze repository scale and provide recommendations
 */
function analyzeRepositoryScale(issues, prs, branches) {
    const scale = {
        issues: checkPerformance('issues', issues.length),
        prs: checkPerformance('prs', prs.length),
        branches: checkPerformance('branches', branches.length)
    };
    
    // Determine overall scale
    let overallStatus = 'optimal';
    if (scale.issues.status === 'exceeded' || scale.prs.status === 'exceeded' || scale.branches.status === 'exceeded') {
        overallStatus = 'exceeded';
    } else if (scale.issues.status === 'critical' || scale.prs.status === 'critical' || scale.branches.status === 'critical') {
        overallStatus = 'critical';
    } else if (scale.issues.status === 'warning' || scale.prs.status === 'warning' || scale.branches.status === 'warning') {
        overallStatus = 'warning';
    }
    
    const recommendations = [];
    
    if (overallStatus === 'exceeded' || overallStatus === 'critical') {
        recommendations.push('🚨 This is a large-scale repository!');
        recommendations.push('');
        recommendations.push('Recommended actions:');
        
        if (issues.length > LIMITS.ISSUES.CRITICAL) {
            recommendations.push('• Use filters to focus on specific issue types');
            recommendations.push('• Consider using labels for better organization');
            recommendations.push('• Enable pagination with --page flag');
        }
        
        if (prs.length > LIMITS.PRS.CRITICAL) {
            recommendations.push('• Focus on PRs assigned to you');
            recommendations.push('• Filter by PR state (draft, ready, etc.)');
        }
        
        if (branches.length > LIMITS.BRANCHES.CRITICAL) {
            recommendations.push('• Clean up stale branches regularly');
            recommendations.push('• Use branch prefixes for organization');
        }
        
        recommendations.push('');
        recommendations.push('Performance tips:');
        recommendations.push('• Use "cn --cache" to cache data locally');
        recommendations.push('• Use "cn stats" for overview instead of full lists');
        recommendations.push('• Set up filters in your config file');
    }
    
    return {
        scale,
        overallStatus,
        recommendations: recommendations.join('\n'),
        requiresOptimization: overallStatus === 'critical' || overallStatus === 'exceeded'
    };
}

/**
 * Generate example analysis for README
 */
function generateExampleAnalysis(repoName) {
    const repo = EXAMPLE_REPOS[repoName];
    if (!repo) {
        return `Repository ${repoName} not in examples database`;
    }
    
    const output = [];
    output.push(`### Example: ${repo.name}`);
    output.push('');
    output.push('```bash');
    output.push(`$ cn analyze ${repoName}`);
    output.push('');
    output.push(`📊 Analyzing ${repo.name}...`);
    output.push(`⚠️  Large repository detected!`);
    output.push('');
    output.push('Repository Scale:');
    output.push(`  • Issues: ${repo.issues}`);
    output.push(`  • Stars: ${repo.stars}`);
    output.push(`  • Complexity: ${repo.complexity}`);
    output.push('');
    output.push('Challenges for Context-Now:');
    repo.challenges.forEach(challenge => {
        output.push(`  • ${challenge}`);
    });
    output.push('');
    output.push('Recommended approach:');
    output.push('  1. Use filtered queries');
    output.push('  2. Enable caching');
    output.push('  3. Use statistical views');
    output.push('```');
    
    return output.join('\n');
}

module.exports = {
    LIMITS,
    EXAMPLE_REPOS,
    checkPerformance,
    chunkData,
    formatWithLimits,
    generateStats,
    analyzeRepositoryScale,
    generateExampleAnalysis
};