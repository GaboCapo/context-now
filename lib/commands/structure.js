/**
 * Project Structure Command
 * =========================
 * Generates a narrative, text-based description of the project structure
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { safePath } = require('../security/safe-exec');

// Directories to always ignore
const IGNORE_DIRS = [
    'node_modules',
    '.git',
    '.next',
    'dist',
    'build',
    'coverage',
    '.cache',
    'tmp',
    'temp',
    '.vscode',
    '.idea',
    '__pycache__',
    '.pytest_cache',
    'venv',
    'env',
    '.env',
    'vendor'
];

// File patterns to ignore
const IGNORE_FILES = [
    '.DS_Store',
    'Thumbs.db',
    '*.log',
    '*.lock',
    '.gitignore',
    '.env*'
];

// File type descriptions
const FILE_DESCRIPTIONS = {
    // Config files
    'package.json': 'Node.js project configuration defining dependencies and scripts',
    'tsconfig.json': 'TypeScript compiler configuration',
    'webpack.config.js': 'Webpack bundler configuration',
    '.eslintrc.json': 'ESLint code quality rules',
    'babel.config.js': 'Babel transpiler configuration',
    
    // Documentation
    'README.md': 'Primary project documentation',
    'CONTRIBUTING.md': 'Contribution guidelines',
    'LICENSE': 'Software license terms',
    'CHANGELOG.md': 'Version history and changes',
    
    // Source files
    'index.js': 'Main entry point',
    'app.js': 'Application initialization',
    'server.js': 'Server configuration',
    'routes.js': 'API route definitions',
    
    // Test files
    '*.test.js': 'Test specifications',
    '*.spec.js': 'Test specifications',
    
    // Styles
    '*.css': 'Stylesheet definitions',
    '*.scss': 'Sass stylesheet with variables and mixins',
    '*.less': 'Less stylesheet with dynamic behavior',
    
    // Data
    '*.json': 'Structured data in JSON format',
    '*.yaml': 'Configuration in YAML format',
    '*.xml': 'Structured data in XML format',
    
    // Images
    '*.png': 'PNG image file',
    '*.jpg': 'JPEG image file',
    '*.svg': 'Scalable vector graphic',
    '*.gif': 'Animated image',
    
    // Documents
    '*.pdf': 'PDF document',
    '*.docx': 'Word document',
    '*.xlsx': 'Excel spreadsheet'
};

/**
 * Get file type description
 */
function getFileDescription(filename) {
    // Check exact match first
    if (FILE_DESCRIPTIONS[filename]) {
        return FILE_DESCRIPTIONS[filename];
    }
    
    // Check patterns
    for (const [pattern, description] of Object.entries(FILE_DESCRIPTIONS)) {
        if (pattern.includes('*')) {
            const regex = new RegExp(pattern.replace('*', '.*'));
            if (regex.test(filename)) {
                return description;
            }
        }
    }
    
    // Default descriptions by extension
    const ext = path.extname(filename).toLowerCase();
    switch (ext) {
        case '.js':
            return 'JavaScript module';
        case '.ts':
            return 'TypeScript module';
        case '.jsx':
            return 'React component';
        case '.tsx':
            return 'TypeScript React component';
        case '.vue':
            return 'Vue.js component';
        case '.py':
            return 'Python module';
        case '.java':
            return 'Java class';
        case '.go':
            return 'Go source file';
        case '.rs':
            return 'Rust source file';
        case '.c':
            return 'C source file';
        case '.cpp':
            return 'C++ source file';
        case '.h':
            return 'Header file';
        case '.sh':
            return 'Shell script';
        case '.bat':
            return 'Batch script';
        case '.sql':
            return 'SQL database queries';
        case '.html':
            return 'HTML markup';
        case '.md':
            return 'Markdown documentation';
        default:
            return 'file';
    }
}

/**
 * Get directory purpose based on name
 */
function getDirectoryPurpose(dirname) {
    const purposes = {
        'src': 'source code',
        'lib': 'library modules',
        'test': 'test suites',
        'tests': 'test suites',
        'spec': 'specifications',
        'docs': 'documentation',
        'doc': 'documentation',
        'public': 'publicly accessible assets',
        'static': 'static assets',
        'assets': 'media and resources',
        'images': 'image files',
        'img': 'images',
        'styles': 'stylesheets',
        'css': 'stylesheets',
        'scripts': 'client-side scripts',
        'js': 'JavaScript files',
        'components': 'reusable components',
        'pages': 'page components',
        'views': 'view templates',
        'templates': 'template files',
        'layouts': 'layout templates',
        'models': 'data models',
        'controllers': 'request handlers',
        'services': 'business logic services',
        'utils': 'utility functions',
        'helpers': 'helper functions',
        'config': 'configuration files',
        'middleware': 'middleware functions',
        'api': 'API endpoints',
        'routes': 'route definitions',
        'database': 'database related files',
        'db': 'database files',
        'migrations': 'database migrations',
        'seeds': 'database seed data',
        'fixtures': 'test fixtures',
        'mocks': 'mock data',
        'bin': 'executable scripts',
        'cmd': 'command-line tools',
        'tools': 'development tools',
        'packages': 'sub-packages',
        'modules': 'module definitions',
        'plugins': 'plugin extensions',
        'extensions': 'extensions',
        'themes': 'theme definitions',
        'locales': 'internationalization files',
        'i18n': 'internationalization',
        'l10n': 'localization',
        'translations': 'translation files'
    };
    
    return purposes[dirname.toLowerCase()] || 'project files';
}

/**
 * Analyze directory structure
 */
function analyzeDirectory(dirPath, level = 0, maxLevel = 3) {
    const result = {
        path: dirPath,
        name: path.basename(dirPath),
        level: level,
        directories: [],
        files: [],
        fileCount: 0,
        dirCount: 0
    };
    
    if (level >= maxLevel) {
        result.truncated = true;
        return result;
    }
    
    try {
        const items = fs.readdirSync(dirPath);
        
        for (const item of items) {
            // Skip ignored items
            if (IGNORE_DIRS.includes(item) || item.startsWith('.')) {
                continue;
            }
            
            const itemPath = path.join(dirPath, item);
            const stats = fs.statSync(itemPath);
            
            if (stats.isDirectory()) {
                result.directories.push(analyzeDirectory(itemPath, level + 1, maxLevel));
                result.dirCount++;
            } else if (stats.isFile()) {
                // Skip ignored files
                let skip = false;
                for (const pattern of IGNORE_FILES) {
                    if (pattern.includes('*')) {
                        const regex = new RegExp(pattern.replace('*', '.*'));
                        if (regex.test(item)) {
                            skip = true;
                            break;
                        }
                    } else if (item === pattern) {
                        skip = true;
                        break;
                    }
                }
                
                if (!skip) {
                    result.files.push({
                        name: item,
                        size: stats.size,
                        description: getFileDescription(item)
                    });
                    result.fileCount++;
                }
            }
        }
        
        // Sort for consistent output
        result.directories.sort((a, b) => a.name.localeCompare(b.name));
        result.files.sort((a, b) => a.name.localeCompare(b.name));
        
    } catch (error) {
        result.error = error.message;
    }
    
    return result;
}

/**
 * Generate narrative description
 */
function generateNarrative(structure, isRoot = true) {
    const lines = [];
    
    if (isRoot) {
        lines.push('PROJECT STRUCTURE OVERVIEW');
        lines.push('=' .repeat(50));
        lines.push('');
        lines.push(`This project is organized in the following structure:`);
        lines.push('');
    }
    
    // Describe current directory
    const indent = '  '.repeat(structure.level);
    
    if (structure.level === 0) {
        lines.push('At the root level of the project, we have:');
    } else {
        const purpose = getDirectoryPurpose(structure.name);
        lines.push(`${indent}The "${structure.name}" directory contains ${purpose}:`);
    }
    lines.push('');
    
    // Describe subdirectories
    if (structure.directories.length > 0) {
        if (structure.directories.length === 1) {
            lines.push(`${indent}It contains one subdirectory:`);
        } else {
            lines.push(`${indent}It contains ${structure.directories.length} subdirectories:`);
        }
        lines.push('');
        
        for (const dir of structure.directories) {
            const purpose = getDirectoryPurpose(dir.name);
            const fileInfo = dir.fileCount > 0 ? ` (${dir.fileCount} files)` : '';
            lines.push(`${indent}  • "${dir.name}" - ${purpose}${fileInfo}`);
            
            // Add nested description if not truncated
            if (!dir.truncated && (dir.directories.length > 0 || dir.files.length > 5)) {
                lines.push('');
                lines.push(...generateNarrative(dir, false));
            }
        }
        lines.push('');
    }
    
    // Describe files
    if (structure.files.length > 0) {
        const indent2 = indent + '  ';
        
        // Group files by type
        const byType = {};
        for (const file of structure.files) {
            const ext = path.extname(file.name).toLowerCase() || 'other';
            if (!byType[ext]) {
                byType[ext] = [];
            }
            byType[ext].push(file);
        }
        
        // Describe important files first
        const importantFiles = ['package.json', 'README.md', 'index.js', 'app.js', 'server.js'];
        const important = structure.files.filter(f => importantFiles.includes(f.name));
        
        if (important.length > 0) {
            lines.push(`${indent}Key files in this directory:`);
            for (const file of important) {
                lines.push(`${indent2}• "${file.name}" - ${file.description}`);
            }
            lines.push('');
        }
        
        // Describe other files by type
        const regularFiles = structure.files.filter(f => !importantFiles.includes(f.name));
        if (regularFiles.length > 0) {
            if (regularFiles.length <= 10) {
                lines.push(`${indent}Additional files include:`);
                for (const file of regularFiles) {
                    lines.push(`${indent2}• "${file.name}" - ${file.description}`);
                }
            } else {
                // Summarize by type for many files
                lines.push(`${indent}This directory also contains:`);
                for (const [ext, files] of Object.entries(byType)) {
                    if (files.length === 1) {
                        lines.push(`${indent2}• One ${getFileDescription('file' + ext)}`);
                    } else {
                        lines.push(`${indent2}• ${files.length} ${getFileDescription('file' + ext)}s`);
                    }
                }
            }
            lines.push('');
        }
    }
    
    // Add summary for root
    if (isRoot) {
        lines.push('');
        lines.push('SUMMARY');
        lines.push('-'.repeat(50));
        lines.push(`Total directories: ${countDirs(structure)}`);
        lines.push(`Total files: ${countFiles(structure)}`);
        
        // Identify main technologies
        const tech = identifyTechnologies(structure);
        if (tech.length > 0) {
            lines.push('');
            lines.push('Technologies detected:');
            tech.forEach(t => lines.push(`  • ${t}`));
        }
    }
    
    return lines;
}

/**
 * Count total directories recursively
 */
function countDirs(structure) {
    let count = structure.directories.length;
    for (const dir of structure.directories) {
        count += countDirs(dir);
    }
    return count;
}

/**
 * Count total files recursively
 */
function countFiles(structure) {
    let count = structure.files.length;
    for (const dir of structure.directories) {
        count += countFiles(dir);
    }
    return count;
}

/**
 * Identify technologies used in the project
 */
function identifyTechnologies(structure) {
    const tech = new Set();
    
    function scan(str) {
        // Check files for technology indicators
        for (const file of str.files) {
            switch (file.name) {
                case 'package.json':
                    tech.add('Node.js/npm');
                    break;
                case 'tsconfig.json':
                    tech.add('TypeScript');
                    break;
                case 'requirements.txt':
                case 'Pipfile':
                    tech.add('Python');
                    break;
                case 'Gemfile':
                    tech.add('Ruby');
                    break;
                case 'pom.xml':
                    tech.add('Java/Maven');
                    break;
                case 'build.gradle':
                    tech.add('Java/Gradle');
                    break;
                case 'Cargo.toml':
                    tech.add('Rust');
                    break;
                case 'go.mod':
                    tech.add('Go');
                    break;
                case 'composer.json':
                    tech.add('PHP/Composer');
                    break;
                case 'Dockerfile':
                    tech.add('Docker');
                    break;
                case 'docker-compose.yml':
                    tech.add('Docker Compose');
                    break;
                case '.travis.yml':
                    tech.add('Travis CI');
                    break;
                case '.gitlab-ci.yml':
                    tech.add('GitLab CI');
                    break;
                case 'Jenkinsfile':
                    tech.add('Jenkins');
                    break;
            }
            
            // Check by extension
            const ext = path.extname(file.name).toLowerCase();
            switch (ext) {
                case '.jsx':
                case '.tsx':
                    tech.add('React');
                    break;
                case '.vue':
                    tech.add('Vue.js');
                    break;
                case '.angular':
                    tech.add('Angular');
                    break;
                case '.svelte':
                    tech.add('Svelte');
                    break;
            }
        }
        
        // Scan subdirectories
        for (const dir of str.directories) {
            scan(dir);
        }
    }
    
    scan(structure);
    return Array.from(tech).sort();
}

/**
 * Main function to generate project structure narrative
 */
async function generateProjectStructure(projectPath = '.', options = {}) {
    const {
        maxLevel = 3,
        format = 'narrative', // 'narrative' or 'tree'
        output = 'console'    // 'console', 'file', or 'return'
    } = options;
    
    try {
        // Validate path
        const safeProjPath = safePath(projectPath, process.cwd());
        
        if (!fs.existsSync(safeProjPath)) {
            throw new Error(`Project path does not exist: ${projectPath}`);
        }
        
        // Analyze structure
        console.log('Analyzing project structure...');
        const structure = analyzeDirectory(safeProjPath, 0, maxLevel);
        
        // Generate output
        let result;
        if (format === 'narrative') {
            const lines = generateNarrative(structure);
            result = lines.join('\n');
        } else {
            // Tree format (traditional)
            result = generateTreeFormat(structure);
        }
        
        // Handle output
        switch (output) {
            case 'console':
                console.log('\n' + result);
                break;
                
            case 'file':
                const outputPath = path.join(safeProjPath, 'PROJECT_STRUCTURE.txt');
                fs.writeFileSync(outputPath, result, 'utf8');
                console.log(`Structure saved to: ${outputPath}`);
                break;
                
            case 'return':
                return result;
        }
        
        return {
            success: true,
            structure,
            narrative: result
        };
        
    } catch (error) {
        console.error(`Error generating structure: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Generate traditional tree format (alternative)
 */
function generateTreeFormat(structure, prefix = '') {
    const lines = [];
    
    if (structure.level === 0) {
        lines.push(structure.name || 'Project Root');
    }
    
    const items = [...structure.directories, ...structure.files];
    
    items.forEach((item, index) => {
        const isLast = index === items.length - 1;
        const connector = isLast ? '└── ' : '├── ';
        const extension = isLast ? '    ' : '│   ';
        
        if (item.directories !== undefined) {
            // It's a directory
            lines.push(prefix + connector + item.name + '/');
            if (!item.truncated) {
                lines.push(...generateTreeFormat(item, prefix + extension).slice(1));
            }
        } else {
            // It's a file
            lines.push(prefix + connector + item.name);
        }
    });
    
    return lines;
}

module.exports = generateProjectStructure;