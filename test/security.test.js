/**
 * Security Tests
 * =============
 * Testet Sicherheits-Features gegen Injection-Angriffe
 */

'use strict';

const assert = require('assert');
const {
    isValidBranchName,
    sanitizeIssueTitle,
    safePath,
    validateSchema
} = require('../lib/security/safe-exec');

console.log('🔒 Running Security Tests...\n');

// Test 1: Branch Name Validation
console.log('Testing Branch Name Validation...');
{
    // Gültige Branch-Namen
    assert(isValidBranchName('feature/new-feature'));
    assert(isValidBranchName('bugfix/issue-123'));
    assert(isValidBranchName('release/v1.0.0'));
    
    // Ungültige Branch-Namen (Injection-Versuche)
    assert(!isValidBranchName('feature; rm -rf /'));
    assert(!isValidBranchName('$(whoami)'));
    assert(!isValidBranchName('feature && curl evil.com'));
    assert(!isValidBranchName('../../../etc/passwd'));
    assert(!isValidBranchName('feature`id`'));
    assert(!isValidBranchName('feature|ls'));
    assert(!isValidBranchName('feature > /etc/passwd'));
    
    console.log('✅ Branch validation passed');
}

// Test 2: Issue Title Sanitization
console.log('\nTesting Issue Title Sanitization...');
{
    // Normale Titel
    assert.strictEqual(
        sanitizeIssueTitle('Fix bug in login'),
        'Fix bug in login'
    );
    
    // Shell-Metazeichen entfernen
    assert.strictEqual(
        sanitizeIssueTitle('Bug `rm -rf /` in system'),
        'Bug rm -rf / in system'
    );
    
    assert.strictEqual(
        sanitizeIssueTitle('Issue $(curl evil.com)'),
        'Issue curl evil.com'
    );
    
    assert.strictEqual(
        sanitizeIssueTitle('Test; echo "hacked" > file'),
        'Test echo hacked file'
    );
    
    // Control Characters entfernen
    assert.strictEqual(
        sanitizeIssueTitle('Test\x00\x1B[31mRed\x1B[0m'),
        'Test31mRed0m'
    );
    
    console.log('✅ Title sanitization passed');
}

// Test 3: Path Traversal Protection
console.log('\nTesting Path Traversal Protection...');
{
    const basePath = '/home/user/project';
    
    // Gültige Pfade
    assert.strictEqual(
        safePath('src/index.js', basePath),
        '/home/user/project/src/index.js'
    );
    
    assert.strictEqual(
        safePath('./config/settings.json', basePath),
        '/home/user/project/config/settings.json'
    );
    
    // Path Traversal Versuche sollten Fehler werfen
    assert.throws(() => {
        safePath('../../etc/passwd', basePath);
    }, /Path traversal detected/);
    
    assert.throws(() => {
        safePath('../../../root/.ssh/id_rsa', basePath);
    }, /Path traversal detected/);
    
    assert.throws(() => {
        safePath('/etc/shadow', basePath);
    }, /Path traversal detected/);
    
    console.log('✅ Path traversal protection passed');
}

// Test 4: Schema Validation
console.log('\nTesting Schema Validation...');
{
    const schema = {
        name: 'string',
        age: 'number',
        active: 'boolean'
    };
    
    // Gültige Daten
    assert.doesNotThrow(() => {
        validateSchema({
            name: 'Test',
            age: 25,
            active: true
        }, schema);
    });
    
    // Fehlende Felder
    assert.throws(() => {
        validateSchema({
            name: 'Test',
            age: 25
        }, schema);
    }, /Missing required field: active/);
    
    // Falscher Typ
    assert.throws(() => {
        validateSchema({
            name: 'Test',
            age: '25', // String statt Number
            active: true
        }, schema);
    }, /Invalid type for age/);
    
    console.log('✅ Schema validation passed');
}

// Test 5: Command Injection Prevention
console.log('\nTesting Command Injection Prevention...');
{
    // Diese Tests prüfen nur die Validation-Logic
    // Echte Command-Execution wird in safe-exec.js verhindert
    
    const dangerousInputs = [
        '"; cat /etc/passwd; "',
        '`id`',
        '$(whoami)',
        '| ls -la',
        '&& curl evil.com',
        '; rm -rf /',
        '> /dev/null',
        '< /etc/shadow'
    ];
    
    dangerousInputs.forEach(input => {
        // Branch-Namen sollten diese nicht erlauben
        assert(!isValidBranchName(input));
        
        // Titel sollten bereinigt werden
        const sanitized = sanitizeIssueTitle(input);
        assert(!sanitized.includes('`'));
        assert(!sanitized.includes('$'));
        assert(!sanitized.includes('|'));
        assert(!sanitized.includes('&'));
        assert(!sanitized.includes(';'));
        assert(!sanitized.includes('>'));
        assert(!sanitized.includes('<'));
    });
    
    console.log('✅ Command injection prevention passed');
}

console.log('\n🎉 All security tests passed!\n');
console.log('Summary:');
console.log('- Branch name validation: ✅');
console.log('- Issue title sanitization: ✅');
console.log('- Path traversal protection: ✅');
console.log('- Schema validation: ✅');
console.log('- Command injection prevention: ✅');

process.exit(0);