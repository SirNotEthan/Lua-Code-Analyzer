class RobloxScriptChecker {
    constructor() {
        this.verifiedDeprecatedAPIs = [
            {
                name: 'wait',
                reason: 'Global wait() is deprecated',
                alternative: 'task.wait()',
                docUrl: 'https://create.roblox.com/docs/reference/engine/libraries/task#wait',
                lastVerified: '2024-08-26',
                severity: 'high'
            },
            {
                name: 'spawn',
                reason: 'Global spawn() is deprecated',
                alternative: 'task.spawn()',
                docUrl: 'https://create.roblox.com/docs/reference/engine/libraries/task#spawn',
                lastVerified: '2024-08-26',
                severity: 'high'
            },
            {
                name: 'delay',
                reason: 'Global delay() is deprecated',
                alternative: 'task.delay()',
                docUrl: 'https://create.roblox.com/docs/reference/engine/libraries/task#delay',
                lastVerified: '2024-08-26',
                severity: 'high'
            },
            {
                name: 'LoadAnimation',
                reason: 'Humanoid:LoadAnimation() is deprecated',
                alternative: 'AnimationController:LoadAnimation() or Animator:LoadAnimation()',
                docUrl: 'https://create.roblox.com/docs/reference/engine/classes/AnimationController#LoadAnimation',
                lastVerified: '2024-08-26',
                severity: 'medium'
            },
            {
                name: 'FindPartOnRay',
                reason: 'WorldRoot:FindPartOnRay() is deprecated',
                alternative: 'workspace:Raycast()',
                docUrl: 'https://create.roblox.com/docs/reference/engine/classes/WorldRoot#Raycast',
                lastVerified: '2024-08-26',
                severity: 'medium'
            },
            {
                name: 'FindPartOnRayWithIgnoreList',
                reason: 'WorldRoot:FindPartOnRayWithIgnoreList() is deprecated',
                alternative: 'workspace:Raycast() with RaycastParams',
                docUrl: 'https://create.roblox.com/docs/reference/engine/classes/WorldRoot#Raycast',
                lastVerified: '2024-08-26',
                severity: 'medium'
            }
        ];

        // Create quick lookup for legacy compatibility
        this.deprecatedAPIs = this.verifiedDeprecatedAPIs.map(api => api.name);

        // Modern Roblox best practices and API issues
        this.apiIssues = [
            {
                check: (node) => this.isCallExpression(node, 'game', ['Workspace']),
                message: 'Use workspace instead of game.Workspace'
            },
            {
                check: (node) => this.isCallExpression(node, 'game', ['Players', 'LocalPlayer']),
                message: 'Cache LocalPlayer reference instead of repeated access'
            },
            {
                check: (node) => this.isPropertyAccess(node, 'Humanoid', 'Health') && this.isAssignment(node.parent),
                message: 'Health modification should be done on server for security'
            },
            {
                check: (node) => this.hasNestedWaitForChild(node),
                message: 'Avoid chaining WaitForChild calls - cache intermediate results'
            }
        ];

        // Performance inefficiencies
        this.inefficiencyPatterns = [
            {
                check: (node) => this.isInfiniteLoop(node),
                message: 'Infinite loop detected - ensure it has proper yielding'
            },
            {
                check: (node) => this.isNumericForLoop(node),
                message: 'Consider using ipairs() or pairs() for table iteration'
            },
            {
                check: (node) => this.isRepeatedGameAccess(node),
                message: 'Cache game service references instead of repeated access'
            }
        ];

        // Code quality/lint checks
        this.lintChecks = [
            {
                check: (node) => this.hasLongLineLength(node),
                message: 'Line length exceeds recommended 120 characters'
            },
            {
                check: (node) => this.hasInconsistentIndentation(node),
                message: 'Inconsistent indentation detected'
            },
            {
                check: (node) => this.hasMagicNumbers(node),
                message: 'Consider using named constants instead of magic numbers'
            },
            {
                check: (node) => this.hasUnusedVariable(node),
                message: 'Unused variable detected'
            },
            {
                check: (node) => this.hasDeepNesting(node),
                message: 'Deep nesting detected - consider refactoring'
            },
            {
                check: (node) => this.hasTooManyParameters(node),
                message: 'Function has too many parameters (>5) - consider refactoring'
            }
        ];
    }

    analyzeScript(script) {
        try {
            const ast = luaparse.parse(script, { 
                comments: true,
                locations: true,
                ranges: true,
                luaVersion: '5.1' // Roblox uses Lua 5.1
            });

            return {
                lineCount: this.getLineCount(script),
                commentCount: this.getCommentCount(ast, script),
                nestingLevel: this.getMaxNestingLevel(ast),
                deprecations: this.findDeprecations(ast),
                apiIssues: this.findAPIIssues(ast),
                inefficiencies: this.findInefficiencies(ast),
                lintIssues: this.findLintIssues(ast, script),
                parseSuccess: true
            };
        } catch (error) {
            // Fallback to regex-based analysis if parsing fails
            console.warn('Lua parsing failed, using fallback analysis:', error);
            return this.fallbackAnalysis(script);
        }
    }

    getLineCount(script) {
        const lines = script.split('\n');
        let count = 0;
        for (let line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('--')) {
                count++;
            }
        }
        return count;
    }

    getCommentCount(ast, script) {
        let astComments = ast.comments ? ast.comments.length : 0;
        
        const lines = script.split('\n');
        let inlineComments = 0;
        
        for (let line of lines) {
            const commentMatch = line.match(/^[^-]*--/);
            if (commentMatch && !line.trim().startsWith('--')) {
                inlineComments++;
            }
        }
        
        return Math.max(astComments, inlineComments + this.getStandaloneCommentCount(lines));
    }

    getStandaloneCommentCount(lines) {
        let count = 0;
        for (let line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('--')) {
                count++;
            }
        }
        return count;
    }

    getMaxNestingLevel(ast) {
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
    }

    findDeprecations(ast) {
        const issues = [];
        
        const traverse = (node) => {
            if (!node || typeof node !== 'object') return;
            
            // Check for deprecated function calls
            if (node.type === 'CallExpression') {
                const funcName = this.getFunctionName(node);
                
                if (funcName === 'wait') {
                    let isTaskWait = false;
                    if (node.base && node.base.type === 'MemberExpression') {
                        const baseExpr = this.getMemberExpressionString(node.base);
                        if (baseExpr === 'task.wait') {
                            isTaskWait = true;
                        }
                    }
                    
                    if (!isTaskWait) {
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
    }

    findAPIIssues(ast) {
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
    }

    findInefficiencies(ast) {
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
    }

    findLintIssues(ast, script) {
        const issues = [];
        const lines = script.split('\n');
        
        // Check line length and indentation
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Line length check
            if (line.length > 120) {
                issues.push({
                    line: i + 1,
                    message: 'Line length exceeds recommended 120 characters',
                    code: line.slice(0, 50) + '...'
                });
            }
            
            // Indentation consistency (detect mixed tabs and spaces)
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
    }

    // Helper methods for AST analysis
    getFunctionName(callNode) {
        if (callNode.base && callNode.base.type === 'Identifier') {
            return callNode.base.name;
        }
        if (callNode.base && callNode.base.type === 'MemberExpression') {
            // For member expressions, we want just the method name, not the full path
            return callNode.base.identifier ? callNode.base.identifier.name : '';
        }
        return '';
    }

    getMemberExpressionString(node) {
        if (node.type === 'MemberExpression') {
            const base = node.base.name || this.getMemberExpressionString(node.base);
            const identifier = node.identifier.name;
            return `${base}.${identifier}`;
        }
        return node.name || '';
    }

    isCallExpression(node, baseName, path) {
        if (node.type !== 'CallExpression') return false;
        
        let current = node.base;
        for (let i = path.length - 1; i >= 0; i--) {
            if (!current || current.type !== 'MemberExpression') return false;
            if (current.identifier.name !== path[i]) return false;
            current = current.base;
        }
        
        return current && current.name === baseName;
    }

    isPropertyAccess(node, objectType, property) {
        return node.type === 'MemberExpression' && 
               node.identifier.name === property &&
               this.containsType(node.base, objectType);
    }

    isAssignment(node) {
        return node && node.type === 'AssignmentStatement';
    }

    containsType(node, typeName) {
        // Simplified check - in a real implementation, you'd need type inference
        return this.getMemberExpressionString(node).includes(typeName);
    }

    hasNestedWaitForChild(node) {
        if (node.type === 'CallExpression') {
            const funcName = this.getFunctionName(node);
            if (funcName.includes('WaitForChild')) {
                // Check if the base is also a WaitForChild call
                return node.base && node.base.type === 'CallExpression' &&
                       this.getFunctionName(node.base).includes('WaitForChild');
            }
        }
        return false;
    }

    isInfiniteLoop(node) {
        if (node.type === 'WhileStatement') {
            // Check if condition is literal true
            return node.condition.type === 'BooleanLiteral' && node.condition.value === true;
        }
        return false;
    }

    isNumericForLoop(node) {
        return node.type === 'ForNumericStatement';
    }

    isRepeatedGameAccess(node) {
        // This would require more complex analysis to track repeated patterns
        return false; // Placeholder
    }

    getNodeSource(node) {
        // Simplified - would need the original source to extract properly
        return `Line ${node.loc ? node.loc.start.line : '?'}`;
    }

    // Lint check helper methods
    hasLongLineLength(node) {
        // This is handled separately in findLintIssues for better line-by-line checking
        return false;
    }

    hasInconsistentIndentation(node) {
        // This is handled separately in findLintIssues for better line-by-line checking
        return false;
    }

    hasMagicNumbers(node) {
        // Check for numeric literals that might be magic numbers (excluding common ones like 0, 1, 2)
        if (node.type === 'NumericLiteral') {
            const value = node.value;
            const commonNumbers = [0, 1, 2, -1, 10, 100, 1000];
            return !commonNumbers.includes(value) && Math.abs(value) > 2;
        }
        return false;
    }

    hasUnusedVariable(node) {
        // Simplified check - would need more complex analysis for accurate detection
        if (node.type === 'LocalStatement' && node.variables.length > 0) {
            // This would require scope analysis to be accurate
            return false; // Placeholder
        }
        return false;
    }

    hasDeepNesting(node) {
        // Check if this node contributes to deep nesting (>4 levels)
        let depth = 0;
        let current = node.parent;
        const nestingNodes = [
            'FunctionDeclaration', 'IfStatement', 'WhileStatement', 
            'RepeatStatement', 'ForNumericStatement', 'ForGenericStatement'
        ];
        
        while (current) {
            if (nestingNodes.includes(current.type)) {
                depth++;
            }
            current = current.parent;
        }
        
        return depth > 4;
    }

    hasTooManyParameters(node) {
        if (node.type === 'FunctionDeclaration') {
            return node.parameters && node.parameters.length > 5;
        }
        return false;
    }

    // Safeguarded API verification methods
    isVerifiedDeprecated(functionName) {
        return this.verifiedDeprecatedAPIs.some(api => api.name === functionName);
    }

    getVerifiedAPIInfo(functionName) {
        return this.verifiedDeprecatedAPIs.find(api => api.name === functionName);
    }

    getModernAlternative(deprecated) {
        const apiInfo = this.getVerifiedAPIInfo(deprecated);
        if (apiInfo) {
            return apiInfo.alternative;
        }
        
        // Fallback for legacy calls
        const alternatives = {
            'wait': 'task.wait()',
            'spawn': 'task.spawn()',
            'delay': 'task.delay()',
            'Debris:AddItem': 'Debris:addItem()'
        };
        return alternatives[deprecated] || 'Check Roblox documentation for modern alternative';
    }

    // Validation safeguard - check if an API might be incorrectly flagged
    validateDeprecationStatus(functionName) {
        const currentYear = new Date().getFullYear();
        const apiInfo = this.getVerifiedAPIInfo(functionName);
        
        if (!apiInfo) {
            console.warn(`⚠️  API Validation Warning: "${functionName}" not found in verified deprecated list`);
            return false;
        }
        
        const lastVerifiedYear = new Date(apiInfo.lastVerified).getFullYear();
        const yearsDifference = currentYear - lastVerifiedYear;
        
        if (yearsDifference > 1) {
            console.warn(`⚠️  API Validation Warning: "${functionName}" deprecation status last verified ${yearsDifference} years ago (${apiInfo.lastVerified})`);
            console.warn(`📖 Please verify current status at: ${apiInfo.docUrl}`);
        }
        
        return true;
    }

    // Fallback analysis using regex patterns (original implementation)
    fallbackAnalysis(script) {
        const lines = script.split('\n');
        
        return {
            lineCount: this.getLineCount(script),
            commentCount: this.getCommentCountFallback(lines),
            nestingLevel: this.getMaxNestingLevelFallback(lines),
            deprecations: this.findDeprecationsFallback(script),
            apiIssues: this.findAPIIssuesFallback(script),
            inefficiencies: this.findInefficienciesFallback(script),
            lintIssues: this.findLintIssuesFallback(script),
            parseSuccess: false
        };
    }

    getCommentCountFallback(lines) {
        let count = 0;
        for (let line of lines) {
            const trimmed = line.trim();
            // Count standalone comments
            if (trimmed.startsWith('--')) {
                count++;
            }
            // Count inline comments (code followed by --)
            else if (line.includes('--') && !trimmed.startsWith('--')) {
                // Make sure it's not within a string literal
                const beforeComment = line.substring(0, line.indexOf('--'));
                // Simple check: if we have an even number of quotes before the comment, it's likely not in a string
                const singleQuotes = (beforeComment.match(/'/g) || []).length;
                const doubleQuotes = (beforeComment.match(/"/g) || []).length;
                if (singleQuotes % 2 === 0 && doubleQuotes % 2 === 0) {
                    count++;
                }
            }
        }
        return count;
    }

    getMaxNestingLevelFallback(lines) {
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
    }

    findDeprecationsFallback(script) {
        const issues = [];
        const lines = script.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Special handling for 'wait' to avoid flagging 'task.wait()'
            if (line.includes('wait')) {
                // Only flag if it's not 'task.wait'
                if (!line.includes('task.wait') && /\bwait\s*\(/.test(line)) {
                    issues.push({
                        line: i + 1,
                        message: `Deprecated API: wait`,
                        suggestion: this.getModernAlternative('wait')
                    });
                }
            }
            
            // Check other verified deprecated APIs (excluding wait since we handled it above)
            for (let apiInfo of this.verifiedDeprecatedAPIs) {
                if (apiInfo.name !== 'wait' && line.includes(apiInfo.name)) {
                    // Validate before flagging
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
    }

    findAPIIssuesFallback(script) {
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
    }

    findInefficienciesFallback(script) {
        const issues = [];
        const lines = script.split('\n');
        const patterns = [
            { pattern: /while\s+true\s+do/, message: "Infinite while loop - ensure proper yielding" },
            { pattern: /for\s+\w+\s*=\s*1\s*,\s*#/, message: "Consider using ipairs() for array iteration" }
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
    }

    findLintIssuesFallback(script) {
        const issues = [];
        const lines = script.split('\n');
        
        // Check line length and mixed indentation
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Line length check
            if (line.length > 120) {
                issues.push({
                    line: i + 1,
                    message: 'Line length exceeds recommended 120 characters',
                    code: line.slice(0, 50) + '...'
                });
            }
            
            // Mixed tabs and spaces
            if (line.match(/^\s+/) && line.includes('\t') && line.includes(' ')) {
                issues.push({
                    line: i + 1,
                    message: 'Mixed tabs and spaces detected',
                    code: 'Use consistent indentation'
                });
            }
        }
        
        return issues;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize CodeMirror editor
    const editor = CodeMirror(document.getElementById('codeEditor'), {
        mode: 'lua',
        theme: 'monokai',
        lineNumbers: true,
        indentUnit: 4,
        lineWrapping: true,
        matchBrackets: true,
        autoCloseBrackets: true,
        foldGutter: true,
        gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
        placeholder: "-- Your Roblox script goes here\n-- Example:\nlocal player = game.Players.LocalPlayer\nprint('Hello, ' .. player.Name .. '!')",
        extraKeys: {
            "Ctrl-Space": "autocomplete",
            "Tab": function(cm) {
                if (cm.somethingSelected()) {
                    cm.indentSelection("add");
                } else {
                    cm.replaceSelection(Array(cm.getOption("indentUnit") + 1).join(" "));
                }
            }
        }
    });
    
    // Set editor height
    editor.setSize(null, 300);
    
    const analyzeBtn = document.getElementById('analyzeBtn');
    const resultsSection = document.getElementById('resultsSection');
    
    const checker = new RobloxScriptChecker();
    
    analyzeBtn.addEventListener('click', function() {
        const script = editor.getValue().trim();
        
        if (!script) {
            alert('Please enter a script to analyze');
            return;
        }
        
        const results = checker.analyzeScript(script);
        displayResults(results);
        resultsSection.style.display = 'block';
    });
    
    function displayResults(results) {
        document.getElementById('lineCount').textContent = results.lineCount;
        document.getElementById('commentCount').textContent = results.commentCount;
        document.getElementById('nestingLevel').textContent = results.nestingLevel;
        
        displayIssues('deprecationsList', 'deprecationCount', results.deprecations);
        displayIssues('apiIssuesList', 'apiCount', results.apiIssues);
        displayIssues('inefficienciesList', 'inefficiencyCount', results.inefficiencies);
        
        // Show parsing status
        if (!results.parseSuccess) {
            console.warn('Using fallback analysis due to parsing errors');
        }
    }
    
    function displayIssues(listId, countId, issues) {
        const list = document.getElementById(listId);
        const count = document.getElementById(countId);
        
        list.innerHTML = '';
        count.textContent = issues.length;
        
        if (issues.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'No issues found';
            li.className = 'no-issues';
            list.appendChild(li);
        } else {
            issues.forEach(issue => {
                const li = document.createElement('li');
                let content = `<strong>Line ${issue.line}:</strong> ${issue.message}`;
                
                // Add severity indicator
                if (issue.severity) {
                    const severityClass = issue.severity === 'high' ? 'severity-high' : 'severity-medium';
                    content += ` <span class="${severityClass}">[${issue.severity.toUpperCase()}]</span>`;
                }
                
                if (issue.suggestion) {
                    content += `<br><em>Suggestion: ${issue.suggestion}</em>`;
                }
                
                // Add documentation link if available
                if (issue.docUrl) {
                    content += `<br>📖 <a href="${issue.docUrl}" target="_blank" rel="noopener">View Documentation</a>`;
                }
                
                // Add verification timestamp for transparency
                if (issue.lastVerified) {
                    content += `<br><small>Last verified: ${issue.lastVerified}</small>`;
                }
                
                if (issue.code && issue.code !== `Line ${issue.line}`) {
                    content += `<br><code>${issue.code}</code>`;
                }
                
                li.innerHTML = content;
                list.appendChild(li);
            });
        }
    }
});