class RobloxScriptChecker {
    constructor() {
        this.verifiedDeprecatedAPIs = [
            {
                name: 'wait',
                reason: 'Global wait() is deprecated',
                alternative: 'task.wait()',
                docUrl: 'https://create.roblox.com/docs',
                lastVerified: '2024-08-26',
                severity: 'high'
            },
            {
                name: 'spawn',
                reason: 'Global spawn() is deprecated',
                alternative: 'coroutine.create() and coroutine.resume() or task.defer()',
                docUrl: 'https://create.roblox.com/docs',
                lastVerified: '2024-08-26',
                severity: 'high'
            },
            {
                name: 'delay',
                reason: 'Global delay() is deprecated',
                alternative: 'task.delay()',
                docUrl: 'https://create.roblox.com/docs',
                lastVerified: '2024-08-26',
                severity: 'high'
            },
            {
                name: 'LoadAnimation',
                reason: 'Humanoid:LoadAnimation() is deprecated',
                alternative: 'AnimationController:LoadAnimation() or Animator:LoadAnimation()',
                docUrl: 'https://create.roblox.com/docs',
                lastVerified: '2024-08-26',
                severity: 'medium'
            },
            {
                name: 'FindPartOnRay',
                reason: 'WorldRoot:FindPartOnRay() is deprecated',
                alternative: 'workspace:Raycast()',
                docUrl: 'https://create.roblox.com/docs',
                lastVerified: '2024-08-26',
                severity: 'medium'
            },
            {
                name: 'FindPartOnRayWithIgnoreList',
                reason: 'WorldRoot:FindPartOnRayWithIgnoreList() is deprecated',
                alternative: 'workspace:Raycast() with RaycastParams',
                docUrl: 'https://create.roblox.com/docs',
                lastVerified: '2024-08-26',
                severity: 'medium'
            },
            {
                name: 'GetChildren',
                reason: 'Use GetChildren() with validation instead of assuming structure',
                alternative: 'GetChildren() with type checking or FindFirstChild()',
                docUrl: 'https://create.roblox.com/docs',
                lastVerified: '2024-08-26',
                severity: 'low'
            },
            {
                name: 'Mouse.Hit',
                reason: 'Mouse.Hit should be used carefully due to filtering',
                alternative: 'Use Mouse.Hit with validation or UserInputService',
                docUrl: 'https://create.roblox.com/docs',
                lastVerified: '2024-08-26',
                severity: 'medium'
            },
            {
                name: 'RemoteEvent:FireServer',
                reason: 'Ensure proper validation and security checks',
                alternative: 'Add server-side validation and rate limiting',
                docUrl: 'https://create.roblox.com/docs',
                lastVerified: '2024-08-26',
                severity: 'high'
            },
            {
                name: 'Instance.new',
                reason: 'Consider object pooling for frequently created instances',
                alternative: 'Use object pools or pre-created instances when possible',
                docUrl: 'https://create.roblox.com/docs',
                lastVerified: '2024-08-26',
                severity: 'low'
            },
            {
                name: 'game.Players.LocalPlayer',
                reason: 'Cache LocalPlayer reference to avoid repeated access',
                alternative: 'Store in local variable: local player = game.Players.LocalPlayer',
                docUrl: 'https://create.roblox.com/docs',
                lastVerified: '2024-08-26',
                severity: 'medium'
            }
        ];

        this.deprecatedAPIs = this.verifiedDeprecatedAPIs.map(api => api.name);

        this.securityIssues = [
            {
                check: (node) => this.hasUnsafeRemoteEvents(node),
                message: 'Remote event without validation - potential security vulnerability'
            },
            {
                check: (node) => this.hasClientSideValidation(node),
                message: 'Client-side validation detected - implement server-side checks'
            },
            {
                check: (node) => this.hasInsecureDataStorage(node),
                message: 'Potential insecure data storage pattern detected'
            },
            {
                check: (node) => this.hasUnsafeStringOperations(node),
                message: 'Unsafe string operations that could lead to injection'
            },
            {
                check: (node) => this.hasUnprotectedValueChanges(node),
                message: 'Unprotected value changes - validate on server'
            }
        ];

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
            },
            {
                check: (node) => this.usesGetService(node),
                message: 'Use game:GetService() instead of direct service access'
            },
            {
                check: (node) => this.hasUnconnectedEvents(node),
                message: 'Event connections should be properly cleaned up'
            },
            {
                check: (node) => this.usesFindFirstChild(node),
                message: 'Consider using WaitForChild() if the child is expected to exist'
            },
            {
                check: (node) => this.hasHardcodedIds(node),
                message: 'Avoid hardcoded asset IDs - use configuration or variables'
            }
        ];

        this.inefficiencyPatterns = [
            {
                check: (node) => this.isInfiniteLoop(node),
                message: 'Infinite loop detected - ensure it has proper yielding'
            },
            {
                check: (node) => this.isNumericForLoop(node),
                message: 'Consider using generic for loops for table iteration'
            },
            {
                check: (node) => this.isRepeatedGameAccess(node),
                message: 'Cache game service references instead of repeated access'
            },
            {
                check: (node) => this.hasExpensiveOperationsInLoop(node),
                message: 'Expensive operations detected in loop - consider optimization'
            },
            {
                check: (node) => this.hasUnoptimizedTableOperations(node),
                message: 'Inefficient table operations - consider using better data structures'
            },
            {
                check: (node) => this.hasFrequentInstanceCreation(node),
                message: 'Frequent instance creation detected - consider object pooling'
            },
            {
                check: (node) => this.hasUnnecessaryStringConcatenation(node),
                message: 'Inefficient string concatenation - use table.concat for multiple strings'
            },
            {
                check: (node) => this.hasDeepTableAccess(node),
                message: 'Deep table access - consider caching intermediate values'
            }
        ];

        this.lintChecks = [
            {
                check: (node) => this.hasDeepNesting(node),
                message: 'Excessive nesting detected (>6 levels) - consider refactoring'
            },
            {
                check: (node) => this.hasTooManyParameters(node),
                message: 'Function has too many parameters (>8) - consider refactoring'
            },
            {
                check: (node) => this.hasLongFunction(node),
                message: 'Function is very long (>100 lines) - consider breaking it down'
            }
        ];
    }

    analyzeScript(script) {
        try {
            const ast = luaparse.parse(script, { 
                comments: true,
                locations: true,
                ranges: true,
                luaVersion: '5.1'
            });

            return {
                lineCount: this.getLineCount(script),
                commentCount: this.getCommentCount(ast),
                nestingLevel: this.getMaxNestingLevel(ast),
                deprecations: this.findDeprecations(ast),
                securityIssues: this.findSecurityIssues(ast),
                apiIssues: this.findAPIIssues(ast),
                inefficiencies: this.findInefficiencies(ast),
                lintIssues: this.findLintIssues(ast, script),
                parseSuccess: true
            };
        } catch (error) {
            return this.fallbackAnalysis(script);
        }
    }
    
    findDeprecations(ast) {
        const issues = [];
        const traverse = (node) => {
            if (!node || typeof node !== 'object') return;
            if (node.type === 'CallExpression') {
                const fullFunctionPath = this.getFullFunctionPath(node);
                const funcName = this.getFunctionName(node);
                for (const apiInfo of this.verifiedDeprecatedAPIs) {
                    if (this.isDeprecatedCallMatch(node, apiInfo, fullFunctionPath, funcName)) {
                        issues.push({
                            line: node.loc ? node.loc.start.line : 'unknown',
                            message: `${apiInfo.reason}`,
                            suggestion: `Use ${apiInfo.alternative}`,
                            docUrl: apiInfo.docUrl,
                            severity: apiInfo.severity,
                            lastVerified: apiInfo.lastVerified
                        });
                        break;
                    }
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
    
    findSecurityIssues(ast) {
        const issues = [];
        const traverse = (node) => {
            if (!node || typeof node !== 'object') return;
            
            // Check each security issue pattern
            for (const issue of this.securityIssues) {
                try {
                    if (issue.check(node)) {
                        issues.push({
                            line: node.loc ? node.loc.start.line : 'unknown',
                            message: issue.message,
                            category: 'security',
                            severity: 'high'
                        });
                    }
                } catch (e) {
                    // Ignore individual check errors
                }
            }
            
            // Traverse child nodes
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
            
            // Check each API issue pattern
            for (const issue of this.apiIssues) {
                try {
                    if (issue.check(node)) {
                        issues.push({
                            line: node.loc ? node.loc.start.line : 'unknown',
                            message: issue.message,
                            category: 'api',
                            severity: 'medium'
                        });
                    }
                } catch (e) {
                    // Ignore individual check errors
                }
            }
            
            // Traverse child nodes
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
            
            // Check each performance issue pattern
            for (const issue of this.inefficiencyPatterns) {
                try {
                    if (issue.check(node)) {
                        issues.push({
                            line: node.loc ? node.loc.start.line : 'unknown',
                            message: issue.message,
                            category: 'performance',
                            severity: 'medium'
                        });
                    }
                } catch (e) {
                    // Ignore individual check errors
                }
            }
            
            // Traverse child nodes
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
        const traverse = (node) => {
            if (!node || typeof node !== 'object') return;
            
            // Check each lint/quality issue pattern
            for (const issue of this.lintChecks) {
                try {
                    if (issue.check(node)) {
                        issues.push({
                            line: node.loc ? node.loc.start.line : 'unknown',
                            message: issue.message,
                            category: 'quality',
                            severity: 'low'
                        });
                    }
                } catch (e) {
                    // Ignore individual check errors
                }
            }
            
            // Traverse child nodes
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
    
    getFunctionName(callNode) {
        if (callNode.base && callNode.base.type === 'Identifier') {
            return callNode.base.name;
        }
        if (callNode.base && callNode.base.type === 'MemberExpression') {
            return callNode.base.identifier ? callNode.base.identifier.name : '';
        }
        return '';
    }
    
    getFullFunctionPath(callNode) {
        if (callNode.base && callNode.base.type === 'Identifier') {
            return callNode.base.name;
        }
        if (callNode.base && callNode.base.type === 'MemberExpression') {
            return this.getMemberExpressionString(callNode.base);
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
    
    isDeprecatedCallMatch(node, apiInfo, fullPath, funcName) {
        return funcName === apiInfo.name;
    }
    
    getCommentCount(ast) {
        return ast.comments ? ast.comments.length : 0;
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
    
    fallbackAnalysis(script) {
        const lines = script.split('\n');
        return {
            lineCount: this.getLineCount(script),
            commentCount: this.getCommentCountFallback(lines),
            nestingLevel: this.getMaxNestingLevelFallback(lines),
            deprecations: [],
            securityIssues: [],
            apiIssues: [],
            inefficiencies: [],
            lintIssues: [],
            parseSuccess: false
        };
    }
    
    getCommentCountFallback(lines) {
        let count = 0;
        for (let line of lines) {
            if (line.trim().startsWith('--')) {
                count++;
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
    
    // Security check helper methods
    hasUnsafeRemoteEvents(node) {
        if (node.type === 'CallExpression') {
            const funcPath = this.getFullFunctionPath(node);
            return funcPath.includes('FireServer') || funcPath.includes('InvokeServer');
        }
        return false;
    }
    
    hasClientSideValidation(node) {
        return false; // Placeholder for more complex validation detection
    }
    
    hasInsecureDataStorage(node) {
        return false; // Placeholder for insecure storage detection
    }
    
    hasUnsafeStringOperations(node) {
        if (node.type === 'CallExpression') {
            const funcName = this.getFunctionName(node);
            return funcName === 'loadstring';
        }
        return false;
    }
    
    hasUnprotectedValueChanges(node) {
        if (node.type === 'AssignmentStatement') {
            for (const variable of node.variables) {
                const varPath = this.getMemberExpressionString(variable);
                if (varPath.includes('.Health') || varPath.includes('.Money') || varPath.includes('.Value')) {
                    return true;
                }
            }
        }
        return false;
    }
    
    // API check helper methods
    isCallExpression(node, baseName, path) {
        if (node.type === 'CallExpression' && node.base && node.base.type === 'MemberExpression') {
            const fullPath = this.getFullFunctionPath(node);
            return fullPath.includes(baseName) && path.some(p => fullPath.includes(p));
        }
        return false;
    }
    
    isPropertyAccess(node, objectName, propertyName) {
        if (node.type === 'MemberExpression') {
            const fullPath = this.getMemberExpressionString(node);
            return fullPath.includes(objectName) && fullPath.includes(propertyName);
        }
        return false;
    }
    
    isAssignment(node) {
        return node && node.type === 'AssignmentStatement';
    }
    
    hasNestedWaitForChild(node) {
        if (node.type === 'CallExpression') {
            const funcPath = this.getFullFunctionPath(node);
            return funcPath.split('WaitForChild').length > 2;
        }
        return false;
    }
    
    usesGetService(node) {
        if (node.type === 'CallExpression') {
            const funcPath = this.getFullFunctionPath(node);
            return funcPath.includes('GetService');
        }
        return false;
    }
    
    hasUnconnectedEvents(node) {
        return false; // Placeholder for event connection tracking
    }
    
    usesFindFirstChild(node) {
        if (node.type === 'CallExpression') {
            const funcName = this.getFunctionName(node);
            return funcName === 'FindFirstChild';
        }
        return false;
    }
    
    hasHardcodedIds(node) {
        if (node.type === 'StringLiteral' && node.value.includes('rbxassetid://')) {
            return true;
        }
        return false;
    }
    
    // Performance check helper methods
    isInfiniteLoop(node) {
        if (node.type === 'WhileStatement') {
            // Check if condition is always true
            if (node.condition && node.condition.type === 'BooleanLiteral' && node.condition.value === true) {
                return true;
            }
        }
        return false;
    }
    
    isNumericForLoop(node) {
        return node.type === 'ForNumericStatement';
    }
    
    isRepeatedGameAccess(node) {
        if (node.type === 'CallExpression') {
            const funcPath = this.getFullFunctionPath(node);
            return funcPath.startsWith('game.') && !funcPath.includes('GetService');
        }
        return false;
    }
    
    hasExpensiveOperationsInLoop(node) {
        if (this.isLoopNode(node)) {
            // Check if loop body contains expensive operations
            return this.containsExpensiveOperations(node.body || node.statements);
        }
        return false;
    }
    
    isLoopNode(node) {
        return ['WhileStatement', 'RepeatStatement', 'ForNumericStatement', 'ForGenericStatement'].includes(node.type);
    }
    
    containsExpensiveOperations(statements) {
        if (!statements || !Array.isArray(statements)) return false;
        
        for (const stmt of statements) {
            if (stmt.type === 'CallExpression') {
                const funcPath = this.getFullFunctionPath(stmt);
                if (funcPath.includes('Instance.new') || funcPath.includes('GetChildren') || funcPath.includes('GetService')) {
                    return true;
                }
            }
        }
        return false;
    }
    
    hasUnoptimizedTableOperations(node) {
        return false; // Placeholder for table operation analysis
    }
    
    hasFrequentInstanceCreation(node) {
        if (node.type === 'CallExpression') {
            const funcPath = this.getFullFunctionPath(node);
            return funcPath.includes('Instance.new');
        }
        return false;
    }
    
    hasUnnecessaryStringConcatenation(node) {
        if (node.type === 'BinaryExpression' && node.operator === '..') {
            return true;
        }
        return false;
    }
    
    hasDeepTableAccess(node) {
        if (node.type === 'MemberExpression') {
            const depth = (this.getMemberExpressionString(node).match(/\./g) || []).length;
            return depth > 3;
        }
        return false;
    }
    
    // Quality check helper methods
    hasDeepNesting(node) {
        let depth = 0;
        const traverse = (n, currentDepth = 0) => {
            if (!n || typeof n !== 'object') return;
            
            const nestingNodes = ['IfStatement', 'WhileStatement', 'ForStatement', 'FunctionDeclaration'];
            if (nestingNodes.includes(n.type)) {
                currentDepth++;
                depth = Math.max(depth, currentDepth);
            }
            
            Object.values(n).forEach(child => {
                if (Array.isArray(child)) {
                    child.forEach(item => traverse(item, currentDepth));
                } else if (child && typeof child === 'object') {
                    traverse(child, currentDepth);
                }
            });
        };
        
        traverse(node);
        return depth > 6;
    }
    
    hasTooManyParameters(node) {
        if (node.type === 'FunctionDeclaration') {
            return node.parameters && node.parameters.length > 8;
        }
        return false;
    }
    
    hasLongFunction(node) {
        if (node.type === 'FunctionDeclaration') {
            if (node.body && node.body.length > 100) {
                return true;
            }
        }
        return false;
    }
}