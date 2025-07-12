#!/usr/bin/env node

/**
 * Changelog Generator for NEX7
 * 
 * Automatically generates changelog from git commits following conventional commit format
 * Supports multiple output formats: Markdown, JSON, HTML
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class ChangelogGenerator {
  constructor(options = {}) {
    this.options = {
      output: 'CHANGELOG.md',
      format: 'markdown',
      since: null,
      until: 'HEAD',
      includeAll: false,
      groupBy: 'type',
      ...options
    };
    
    this.commitTypes = {
      feat: { title: '✨ Features', emoji: '✨' },
      fix: { title: '🐛 Bug Fixes', emoji: '🐛' },
      docs: { title: '📚 Documentation', emoji: '📚' },
      style: { title: '💄 Styles', emoji: '💄' },
      refactor: { title: '♻️ Code Refactoring', emoji: '♻️' },
      perf: { title: '⚡ Performance Improvements', emoji: '⚡' },
      test: { title: '✅ Tests', emoji: '✅' },
      build: { title: '👷 Build System', emoji: '👷' },
      ci: { title: '💚 Continuous Integration', emoji: '💚' },
      chore: { title: '🔧 Chores', emoji: '🔧' },
      revert: { title: '⏪ Reverts', emoji: '⏪' }
    };
  }

  // Get git commits with conventional commit parsing
  getCommits() {
    const since = this.options.since ? `--since="${this.options.since}"` : '';
    const until = this.options.until || 'HEAD';
    
    try {
      const gitLog = execSync(
        `git log ${since} ${until} --pretty=format:"%H|%s|%b|%an|%ad" --date=short`,
        { encoding: 'utf8' }
      );

      return gitLog
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          const [hash, subject, body, author, date] = line.split('|');
          return this.parseCommit({ hash, subject, body, author, date });
        })
        .filter(commit => commit.type || this.options.includeAll);
    } catch (error) {
      console.error('Error getting git commits:', error.message);
      return [];
    }
  }

  // Parse conventional commit format
  parseCommit({ hash, subject, body, author, date }) {
    const conventionalRegex = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?: (.+)/;
    const match = subject.match(conventionalRegex);

    if (match) {
      const [, type, scope, description] = match;
      return {
        hash: hash.substring(0, 8),
        type,
        scope: scope ? scope.slice(1, -1) : null,
        subject: description,
        body: body || '',
        author,
        date,
        breaking: this.isBreakingChange(subject, body)
      };
    }

    // Non-conventional commit
    return {
      hash: hash.substring(0, 8),
      type: 'other',
      scope: null,
      subject,
      body: body || '',
      author,
      date,
      breaking: false
    };
  }

  // Check if commit contains breaking changes
  isBreakingChange(subject, body) {
    return subject.includes('!') || 
           body.includes('BREAKING CHANGE') || 
           body.includes('BREAKING-CHANGE');
  }

  // Group commits by type or scope
  groupCommits(commits) {
    const grouped = {};

    commits.forEach(commit => {
      const key = this.options.groupBy === 'scope' 
        ? commit.scope || 'misc'
        : commit.type;

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(commit);
    });

    return grouped;
  }

  // Generate Markdown changelog
  generateMarkdown(commits) {
    const grouped = this.groupCommits(commits);
    const version = this.getCurrentVersion();
    const date = new Date().toISOString().split('T')[0];
    
    let changelog = `# Changelog\n\n`;
    changelog += `All notable changes to NEX7 will be documented in this file.\n\n`;
    changelog += `The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),\n`;
    changelog += `and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).\n\n`;

    // Current version section
    changelog += `## [${version}] - ${date}\n\n`;

    // Breaking changes first
    const breakingChanges = commits.filter(c => c.breaking);
    if (breakingChanges.length > 0) {
      changelog += `### 💥 BREAKING CHANGES\n\n`;
      breakingChanges.forEach(commit => {
        changelog += `- **${commit.scope || 'core'}**: ${commit.subject} ([${commit.hash}](../../commit/${commit.hash}))\n`;
      });
      changelog += '\n';
    }

    // Group by type
    Object.keys(grouped).forEach(type => {
      const typeConfig = this.commitTypes[type];
      if (!typeConfig && type !== 'other') return;

      const title = typeConfig ? typeConfig.title : '🔧 Other Changes';
      changelog += `### ${title}\n\n`;

      grouped[type].forEach(commit => {
        const scope = commit.scope ? `**${commit.scope}**: ` : '';
        changelog += `- ${scope}${commit.subject} ([${commit.hash}](../../commit/${commit.hash}))\n`;
      });
      changelog += '\n';
    });

    return changelog;
  }

  // Generate JSON changelog
  generateJSON(commits) {
    const version = this.getCurrentVersion();
    const date = new Date().toISOString();
    
    return JSON.stringify({
      version,
      date,
      commits: commits.map(commit => ({
        hash: commit.hash,
        type: commit.type,
        scope: commit.scope,
        subject: commit.subject,
        body: commit.body,
        author: commit.author,
        date: commit.date,
        breaking: commit.breaking
      })),
      summary: {
        total: commits.length,
        breaking: commits.filter(c => c.breaking).length,
        byType: Object.keys(this.groupCommits(commits)).reduce((acc, type) => {
          acc[type] = this.groupCommits(commits)[type].length;
          return acc;
        }, {})
      }
    }, null, 2);
  }

  // Generate HTML changelog
  generateHTML(commits) {
    const grouped = this.groupCommits(commits);
    const version = this.getCurrentVersion();
    const date = new Date().toISOString().split('T')[0];

    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NEX7 Changelog v${version}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
        .header { border-bottom: 2px solid #e1e5e9; padding-bottom: 1rem; margin-bottom: 2rem; }
        .version { color: #0969da; }
        .section { margin-bottom: 2rem; }
        .commit { margin-bottom: 0.5rem; }
        .hash { font-family: monospace; background: #f6f8fa; padding: 0.2rem 0.4rem; border-radius: 3px; }
        .scope { font-weight: bold; color: #8250df; }
        .breaking { color: #d1242f; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>NEX7 Changelog</h1>
        <h2 class="version">Version ${version} - ${date}</h2>
    </div>
`;

    // Breaking changes
    const breakingChanges = commits.filter(c => c.breaking);
    if (breakingChanges.length > 0) {
      html += `    <div class="section">
        <h3 class="breaking">💥 BREAKING CHANGES</h3>
`;
      breakingChanges.forEach(commit => {
        html += `        <div class="commit">
            <span class="scope">${commit.scope || 'core'}:</span> ${commit.subject}
            <span class="hash">${commit.hash}</span>
        </div>
`;
      });
      html += `    </div>
`;
    }

    // Sections by type
    Object.keys(grouped).forEach(type => {
      const typeConfig = this.commitTypes[type];
      if (!typeConfig && type !== 'other') return;

      const title = typeConfig ? typeConfig.title : '🔧 Other Changes';
      html += `    <div class="section">
        <h3>${title}</h3>
`;
      grouped[type].forEach(commit => {
        const scope = commit.scope ? `<span class="scope">${commit.scope}:</span> ` : '';
        html += `        <div class="commit">
            ${scope}${commit.subject} <span class="hash">${commit.hash}</span>
        </div>
`;
      });
      html += `    </div>
`;
    });

    html += `</body>
</html>`;

    return html;
  }

  // Get current version from package.json
  getCurrentVersion() {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return packageJson.version || '0.1.0';
    } catch (error) {
      return '0.1.0';
    }
  }

  // Generate changelog based on format
  generate() {
    const commits = this.getCommits();
    
    if (commits.length === 0) {
      console.log('No commits found for the specified range.');
      return;
    }

    let content;
    switch (this.options.format) {
      case 'json':
        content = this.generateJSON(commits);
        break;
      case 'html':
        content = this.generateHTML(commits);
        break;
      default:
        content = this.generateMarkdown(commits);
    }

    // Write to file
    fs.writeFileSync(this.options.output, content);
    
    console.log(`✅ Changelog generated: ${this.options.output}`);
    console.log(`📊 Summary:`);
    console.log(`   - Total commits: ${commits.length}`);
    console.log(`   - Breaking changes: ${commits.filter(c => c.breaking).length}`);
    console.log(`   - Features: ${commits.filter(c => c.type === 'feat').length}`);
    console.log(`   - Bug fixes: ${commits.filter(c => c.type === 'fix').length}`);
  }
}

// CLI interface
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--output':
      case '-o':
        options.output = args[++i];
        break;
      case '--format':
      case '-f':
        options.format = args[++i];
        break;
      case '--since':
      case '-s':
        options.since = args[++i];
        break;
      case '--until':
      case '-u':
        options.until = args[++i];
        break;
      case '--include-all':
        options.includeAll = true;
        break;
      case '--group-by':
        options.groupBy = args[++i];
        break;
      case '--help':
      case '-h':
        console.log(`
Usage: node generate-changelog.js [options]

Options:
  -o, --output <file>     Output file (default: CHANGELOG.md)
  -f, --format <format>   Output format: markdown|json|html (default: markdown)
  -s, --since <date>      Include commits since date (YYYY-MM-DD)
  -u, --until <ref>       Include commits until ref (default: HEAD)
  --include-all           Include non-conventional commits
  --group-by <field>      Group by: type|scope (default: type)
  -h, --help              Show this help message

Examples:
  node generate-changelog.js
  node generate-changelog.js --since "2024-01-01" --format json
  node generate-changelog.js --output RELEASES.md --group-by scope
        `);
        process.exit(0);
        break;
    }
  }

  return options;
}

// Run if called directly
if (require.main === module) {
  const options = parseArgs();
  const generator = new ChangelogGenerator(options);
  generator.generate();
}

module.exports = ChangelogGenerator;