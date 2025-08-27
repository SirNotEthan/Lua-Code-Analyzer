RobloxScriptChecker.prototype.getLineCount = function(script) {
    const lines = script.split('\n');
    let count = 0;
    for (let line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('--')) {
            count++;
        }
    }
    return count;
};

RobloxScriptChecker.prototype.getCommentCount = function(ast) {
    return ast.comments ? ast.comments.length : 0;
};

RobloxScriptChecker.prototype.getMaxNestingLevel = function(ast) {
    let maxLevel = 0;
    
    const traverse = (node, level = 0) => {
        if (!node || typeof node !== 'object') return;
        
        maxLevel = Math.max(maxLevel, level);
        
        const nestingNodes = [
            'FunctionDeclaration', 'LocalStatement', 'IfStatement', 
            'WhileStatement', 'RepeatStatement', 'ForNumericStatement', 
            'ForGenericStatement', 'DoStatement'
        ];
        
        const newLevel = nestingNodes.includes(node.type) ? level + 1 : level;
        
        Object.values(node).forEach(child => {
            if (Array.isArray(child)) {
                child.forEach(item => traverse(item, newLevel));
            } else if (child && typeof child === 'object') {
                traverse(child, newLevel);
            }
        });
    };
    
    traverse(ast);
    return maxLevel;
};

RobloxScriptChecker.prototype.findDeprecations = function(ast) {
    const issues = [];
    
    const traverse = (node) => {
        if (!node || typeof node !== 'object') return;
        
        if (node.type === 'CallExpression') {
            const funcName = this.getFunctionName(node);
            let fullFuncName = funcName;
            
            if (node.base && node.base.type === 'MemberExpression') {
                fullFuncName = this.getMemberExpressionString(node.base);
            }
            
            if (this.isVerifiedDeprecated(fullFuncName)) {
                const apiInfo = this.getVerifiedAPIInfo(fullFuncName);
                issues.push({
                    line: node.loc ? node.loc.start.line : 'unknown',
                    message: `${apiInfo.reason}`,
                    suggestion: `Use ${apiInfo.alternative}`,
                    docUrl: apiInfo.docUrl,
                    severity: apiInfo.severity,
                    lastVerified: apiInfo.lastVerified
                });
            } else if (funcName === 'wait') {
                if (!(node.base && node.base.type === 'MemberExpression' && fullFuncName === 'task.wait')) {
                    issues.push({
                        line: node.loc ? node.loc.start.line : 'unknown',
                        message: `Deprecated function: ${funcName}`,
                        suggestion: this.getModernAlternative(funcName)
                    });
                }
            } else if (this.isVerifiedDeprecated(funcName)) {
                const apiInfo = this.getVerifiedAPIInfo(funcName);
                issues.push({
                    line: node.loc ? node.loc.start.line : 'unknown',
                    message: `${apiInfo.reason}`,
                    suggestion: `Use ${apiInfo.alternative}`,
                    docUrl: apiInfo.docUrl,
                    severity: apiInfo.severity,
                    lastVerified: apiInfo.lastVerified
                });
            }
        }
        
        Object.values(node).forEach(child => {
            if (Array.isArray(child)) {
                child.forEach(item => traverse(item));
            } else if (child && typeof child === 'object') {
                traverse(child);
            }
        });
    };
    
    traverse(ast);
    return issues;
};

RobloxScriptChecker.prototype.findSecurityIssues = function(ast) {
    const issues = [];
    
    const traverse = (node) => {
        if (!node || typeof node !== 'object') return;
        
        for (let securityCheck of this.securityIssues) {
            if (securityCheck.check(node)) {
                issues.push({
                    line: node.loc ? node.loc.start.line : 'unknown',
                    message: securityCheck.message,
                    code: this.getNodeSource(node),
                    severity: 'high'
                });
            }
        }
        
        Object.values(node).forEach(child => {
            if (Array.isArray(child)) {
                child.forEach(item => traverse(item));
            } else if (child && typeof child === 'object') {
                traverse(child);
            }
        });
    };
    
    traverse(ast);
    return issues;
};

RobloxScriptChecker.prototype.findAPIIssues = function(ast) {
    const issues = [];
    
    const traverse = (node) => {
        if (!node || typeof node !== 'object') return;
        
        for (let apiCheck of this.apiIssues) {
            if (apiCheck.check(node)) {
                issues.push({
                    line: node.loc ? node.loc.start.line : 'unknown',
                    message: apiCheck.message,
                    code: this.getNodeSource(node)
                });
            }
        }
        
        Object.values(node).forEach(child => {
            if (Array.isArray(child)) {
                child.forEach(item => traverse(item));
            } else if (child && typeof child === 'object') {
                traverse(child);
            }
        });
    };
    
    traverse(ast);
    return issues;
};

RobloxScriptChecker.prototype.findInefficiencies = function(ast) {
    const issues = [];
    
    const traverse = (node) => {
        if (!node || typeof node !== 'object') return;
        
        for (let pattern of this.inefficiencyPatterns) {
            if (pattern.check(node)) {
                issues.push({
                    line: node.loc ? node.loc.start.line : 'unknown',
                    message: pattern.message,
                    code: this.getNodeSource(node)
                });
            }
        }
        
        Object.values(node).forEach(child => {
            if (Array.isArray(child)) {
                child.forEach(item => traverse(item));
            } else if (child && typeof child === 'object') {
                traverse(child);
            }
        });
    };
    
    traverse(ast);
    return issues;
};

RobloxScriptChecker.prototype.findLintIssues = function(ast, script) {
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
    
    const traverse = (node) => {
        if (!node || typeof node !== 'object') return;
        
        for (let lintCheck of this.lintChecks) {
            if (lintCheck.check(node)) {
                issues.push({
                    line: node.loc ? node.loc.start.line : 'unknown',
                    message: lintCheck.message,
                    code: this.getNodeSource(node)
                });
            }
        }
        
        Object.values(node).forEach(child => {
            if (Array.isArray(child)) {
                child.forEach(item => traverse(item));
            } else if (child && typeof child === 'object') {
                traverse(child);
            }
        });
    };
    
    traverse(ast);
    return issues;
};