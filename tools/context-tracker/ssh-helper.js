// Issues über Git/SSH holen (wenn gh CLI verfügbar)
async function fetchIssuesViaSSH(owner, repo) {
    return new Promise((resolve, reject) => {
        try {
            // Versuche gh CLI wenn verfügbar
            const ghCheck = gitCommand('which gh', '');
            if (ghCheck) {
                console.log(`${colors.cyan}  → Versuche Issues via gh CLI...${colors.reset}`);
                const result = gitCommand(`gh issue list --repo ${owner}/${repo} --json number,title,state,labels,assignees --limit 100`, '');
                if (result) {
                    const issues = JSON.parse(result);
                    const formattedIssues = issues.map(issue => ({
                        id: `#${issue.number}`,
                        title: issue.title,
                        status: issue.state.toLowerCase(),
                        priority: getPriorityFromLabels(issue.labels || []),
                        labels: (issue.labels || []).map(l => typeof l === 'string' ? l : l.name),
                        assignee: issue.assignees && issue.assignees[0] ? issue.assignees[0].login : null,
                        created_at: issue.createdAt || new Date().toISOString(),
                        updated_at: issue.updatedAt || new Date().toISOString()
                    }));
                    resolve(formattedIssues);
                    return;
                }
            }
        } catch (e) {
            // gh CLI nicht verfügbar oder Fehler
        }
        
        // Fallback: Verwende git log um Issue-Nummern aus Commit-Messages zu extrahieren
        try {
            console.log(`${colors.cyan}  → Extrahiere Issues aus Git-Historie...${colors.reset}`);
            const log = gitCommand('git log --oneline -100', '');
            const issueNumbers = new Set();
            const issuePattern = /#(\d+)|issue[- ](\d+)/gi;
            
            let match;
            while ((match = issuePattern.exec(log)) !== null) {
                issueNumbers.add(match[1] || match[2]);
            }
            
            // Erstelle Basis-Issues aus gefundenen Nummern
            const issues = Array.from(issueNumbers).map(num => ({
                id: `#${num}`,
                title: `Issue ${num} (aus Git-Historie)`,
                status: 'open',
                priority: 'normal',
                labels: [],
                assignee: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }));
            
            resolve(issues);
        } catch (e) {
            reject(new Error('Konnte keine Issues über SSH/Git abrufen'));
        }
    });
}

// PRs über Git/SSH holen
async function fetchPRsViaSSH(owner, repo) {
    return new Promise((resolve, reject) => {
        try {
            // Versuche gh CLI wenn verfügbar
            const ghCheck = gitCommand('which gh', '');
            if (ghCheck) {
                console.log(`${colors.cyan}  → Versuche PRs via gh CLI...${colors.reset}`);
                const result = gitCommand(`gh pr list --repo ${owner}/${repo} --json number,title,state,headRefName,baseRefName,author --limit 100`, '');
                if (result) {
                    const prs = JSON.parse(result);
                    const formattedPRs = prs.map(pr => ({
                        id: `#${pr.number}`,
                        title: pr.title,
                        status: pr.state.toLowerCase(),
                        branch: pr.headRefName,
                        base: pr.baseRefName,
                        author: pr.author ? pr.author.login : 'unknown',
                        created_at: pr.createdAt || new Date().toISOString(),
                        updated_at: pr.updatedAt || new Date().toISOString(),
                        draft: pr.isDraft || false
                    }));
                    resolve(formattedPRs);
                    return;
                }
            }
        } catch (e) {
            // gh CLI nicht verfügbar
        }
        
        // Fallback: Leeres Array
        resolve([]);
    });
}
