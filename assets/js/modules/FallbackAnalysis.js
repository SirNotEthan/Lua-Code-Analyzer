RobloxScriptChecker.prototype.fallbackAnalysis = function(script) {
    const lines = script.split('\n');
    
    return {
        lineCount: this.getLineCount(script),
        commentCount: this.getCommentCountFallback(lines),
        nestingLevel: this.getMaxNestingLevelFallback(lines),
        deprecations: this.findDeprecationsFallback(script),
        securityIssues: this.findSecurityIssuesFallback(script),
        apiIssues: this.findAPIIssuesFallback(script),
        inefficiencies: this.findInefficienciesFallback(script),
        lintIssues: this.findLintIssuesFallback(script),
        parseSuccess: false
    };
};

RobloxScriptChecker.prototype.getCommentCountFallback = function(lines) {
    let count = 0;
    for (let line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('--')) {
            count++;
        }
    }
    return count;
};

RobloxScriptChecker.prototype.getMaxNestingLevelFallback = function(lines) {
    let maxLevel = 0;
    let currentLevel = 0;
    
    const increaseKeywords = ['function', 'if', 'for', 'while', 'repeat', 'do'];
    const decreaseKeywords = ['end', 'until'];
    
    for (let line of lines) {
        const trimmed = line.trim().toLowerCase();
        
        if (trimmed.startsWith('--')) continue;
        
        for (let keyword of increaseKeywords) {
            if (trimmed.includes(keyword)) {
                currentLevel++;
                maxLevel = Math.max(maxLevel, currentLevel);
                break;
            }
        }
        
        for (let keyword of decreaseKeywords) {
            if (trimmed.includes(keyword)) {
                currentLevel = Math.max(0, currentLevel - 1);
                break;
            }
        }
    }
    
    return maxLevel;
};

RobloxScriptChecker.prototype.findDeprecationsFallback = function(script) {
    const issues = [];
    const lines = script.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.includes('wait')) {
            if (!line.includes('task.wait') && /\bwait\s*\(/.test(line)) {
                issues.push({
                    line: i + 1,
                    message: `Deprecated API: wait`,
                    suggestion: this.getModernAlternative('wait')
                });
            }
        }
        
        for (let apiInfo of this.verifiedDeprecatedAPIs) {
            if (apiInfo.name !== 'wait' && line.includes(apiInfo.name)) {
                if (this.validateDeprecationStatus(apiInfo.name)) {
                    issues.push({
                        line: i + 1,
                        message: apiInfo.reason,
                        suggestion: `Use ${apiInfo.alternative}`,
                        docUrl: apiInfo.docUrl,
                        severity: apiInfo.severity,
                        lastVerified: apiInfo.lastVerified
                    });
                }
            }
        }
    }
    
    return issues;
};

RobloxScriptChecker.prototype.findSecurityIssuesFallback = function(script) {
    const issues = [];
    const lines = script.split('\n');
    const patterns = [
        { pattern: /FireServer\s*\(/, message: "Remote event without validation - ensure server-side checks" },
        { pattern: /FireClient\s*\(/, message: "Remote event - ensure proper validation and rate limiting" },
        { pattern: /loadstring\s*\(/, message: "Dynamic code execution detected - potential security risk" },
        { pattern: /LocalPlayer.*Health\s*=/, message: "Client-side health modification - validate on server" },
        { pattern: /SetAttribute.*password|token|key|secret/i, message: "Storing sensitive data in attributes" }
    ];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (let pattern of patterns) {
            if (pattern.pattern.test(line)) {
                issues.push({
                    line: i + 1,
                    message: pattern.message,
                    code: line.trim(),
                    severity: 'high'
                });
            }
        }
    }
    
    return issues;
};

RobloxScriptChecker.prototype.findAPIIssuesFallback = function(script) {
    const issues = [];
    const lines = script.split('\n');
    const patterns = [
        { pattern: /game\.Workspace/, message: "Use 'workspace' instead of 'game.Workspace'" },
        { pattern: /game\.Players\.LocalPlayer\.Character\.Humanoid\.Health\s*=/, message: "Health should be modified on server" }
    ];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (let issue of patterns) {
            if (issue.pattern.test(line)) {
                issues.push({
                    line: i + 1,
                    message: issue.message,
                    code: line.trim()
                });
            }
        }
    }
    
    return issues;
};

RobloxScriptChecker.prototype.findInefficienciesFallback = function(script) {
    const issues = [];
    const lines = script.split('\n');
    const patterns = [
        { pattern: /while\s+true\s+do/, message: "Infinite while loop - ensure proper yielding" },
        { pattern: /for\s+\w+\s*=\s*1\s*,\s*#/, message: "Consider using generic for loops for array iteration" }
    ];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (let pattern of patterns) {
            if (pattern.pattern.test(line)) {
                issues.push({
                    line: i + 1,
                    message: pattern.message,
                    code: line.trim()
                });
            }
        }
    }
    
    return issues;
};

RobloxScriptChecker.prototype.findLintIssuesFallback = function(script) {
    const issues = [];
    const lines = script.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.length > 120) {
            issues.push({
                line: i + 1,
                message: 'Line length exceeds recommended 120 characters',
                code: line.slice(0, 50) + '...'
            });
        }
        
        if (line.match(/^\s+/) && line.includes('\t') && line.includes(' ')) {
            issues.push({
                line: i + 1,
                message: 'Mixed tabs and spaces detected',
                code: 'Use consistent indentation'
            });
        }
    }
    
    return issues;
};