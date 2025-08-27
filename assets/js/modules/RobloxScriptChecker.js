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
                alternative: 'coroutine.create() and coroutine.resume() or task.defer()',
                docUrl: 'https://create.roblox.com/docs/reference/engine/libraries/task#defer',
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
            },
            {
                name: 'GetChildren',
                reason: 'Use GetChildren() with validation instead of assuming structure',
                alternative: 'GetChildren() with type checking or FindFirstChild()',
                docUrl: 'https://create.roblox.com/docs/reference/engine/classes/Instance#GetChildren',
                lastVerified: '2024-08-26',
                severity: 'low'
            },
            {
                name: 'Mouse.Hit',
                reason: 'Mouse.Hit should be used carefully due to filtering',
                alternative: 'Use Mouse.Hit with validation or UserInputService',
                docUrl: 'https://create.roblox.com/docs/reference/engine/classes/UserInputService',
                lastVerified: '2024-08-26',
                severity: 'medium'
            },
            {
                name: 'RemoteEvent:FireServer',
                reason: 'Ensure proper validation and security checks',
                alternative: 'Add server-side validation and rate limiting',
                docUrl: 'https://create.roblox.com/docs/scripting/events/remote',
                lastVerified: '2024-08-26',
                severity: 'high'
            },
            {
                name: 'Instance.new',
                reason: 'Consider object pooling for frequently created instances',
                alternative: 'Use object pools or pre-created instances when possible',
                docUrl: 'https://create.roblox.com/docs/scripting/performance-optimization',
                lastVerified: '2024-08-26',
                severity: 'low'
            },
            {
                name: 'game.Players.LocalPlayer',
                reason: 'Cache LocalPlayer reference to avoid repeated access',
                alternative: 'Store in local variable: local player = game.Players.LocalPlayer',
                docUrl: 'https://create.roblox.com/docs/reference/engine/classes/Players#LocalPlayer',
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
                message: 'Consider using ipairs() or pairs() for table iteration'
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
            },
            {
                check: (node) => this.hasLongFunction(node),
                message: 'Function is too long (>50 lines) - consider breaking it down'
            },
            {
                check: (node) => this.hasPoorNaming(node),
                message: 'Variable/function naming could be improved'
            },
            {
                check: (node) => this.hasNoErrorHandling(node),
                message: 'Consider adding error handling (pcall/xpcall)'
            },
            {
                check: (node) => this.hasEmptyBlocks(node),
                message: 'Empty code block detected'
            },
            {
                check: (node) => this.hasDuplicateCode(node),
                message: 'Potential duplicate code detected'
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
            console.warn('Lua parsing failed, using fallback analysis:', error);
            return this.fallbackAnalysis(script);
        }
    }
}