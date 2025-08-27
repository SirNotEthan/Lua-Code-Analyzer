RobloxScriptChecker.prototype.getFunctionName = function(callNode) {
    if (callNode.base && callNode.base.type === 'Identifier') {
        return callNode.base.name;
    }
    if (callNode.base && callNode.base.type === 'MemberExpression') {
        return callNode.base.identifier ? callNode.base.identifier.name : '';
    }
    return '';
};

RobloxScriptChecker.prototype.getMemberExpressionString = function(node) {
    if (node.type === 'MemberExpression') {
        const base = node.base.name || this.getMemberExpressionString(node.base);
        const identifier = node.identifier.name;
        return `${base}.${identifier}`;
    }
    return node.name || '';
};

RobloxScriptChecker.prototype.isCallExpression = function(node, baseName, path) {
    if (node.type !== 'CallExpression') return false;
    
    let current = node.base;
    for (let i = path.length - 1; i >= 0; i--) {
        if (!current || current.type !== 'MemberExpression') return false;
        if (current.identifier.name !== path[i]) return false;
        current = current.base;
    }
    
    return current && current.name === baseName;
};

RobloxScriptChecker.prototype.isPropertyAccess = function(node, objectType, property) {
    return node.type === 'MemberExpression' && 
           node.identifier.name === property &&
           this.containsType(node.base, objectType);
};

RobloxScriptChecker.prototype.isAssignment = function(node) {
    return node && node.type === 'AssignmentStatement';
};

RobloxScriptChecker.prototype.containsType = function(node, typeName) {
    return this.getMemberExpressionString(node).includes(typeName);
};

RobloxScriptChecker.prototype.hasNestedWaitForChild = function(node) {
    if (node.type === 'CallExpression') {
        const funcName = this.getFunctionName(node);
        if (funcName.includes('WaitForChild')) {
            return node.base && node.base.type === 'CallExpression' &&
                   this.getFunctionName(node.base).includes('WaitForChild');
        }
    }
    return false;
};

RobloxScriptChecker.prototype.isInfiniteLoop = function(node) {
    if (node.type === 'WhileStatement') {
        return node.condition.type === 'BooleanLiteral' && node.condition.value === true;
    }
    return false;
};

RobloxScriptChecker.prototype.isNumericForLoop = function(node) {
    return node.type === 'ForNumericStatement';
};

RobloxScriptChecker.prototype.isRepeatedGameAccess = function(node) {
    return false;
};

RobloxScriptChecker.prototype.hasExpensiveOperationsInLoop = function(node) {
    if (this.isLoopNode(node)) {
        return this.containsExpensiveOperations(node.body || node.statement);
    }
    return false;
};

RobloxScriptChecker.prototype.isLoopNode = function(node) {
    const loopTypes = ['WhileStatement', 'RepeatStatement', 'ForNumericStatement', 'ForGenericStatement'];
    return loopTypes.includes(node.type);
};

RobloxScriptChecker.prototype.containsExpensiveOperations = function(bodyNode) {
    if (!bodyNode) return false;
    
    const traverse = (node) => {
        if (!node || typeof node !== 'object') return false;
        
        if (node.type === 'CallExpression') {
            const funcName = this.getMemberExpressionString(node.base);
            const expensiveOps = ['FindFirstChild', 'GetChildren', 'Instance.new', 'math.random', 'CFrame.new'];
            if (expensiveOps.some(op => funcName.includes(op))) {
                return true;
            }
        }
        
        for (let key in node) {
            if (Array.isArray(node[key])) {
                if (node[key].some(child => traverse(child))) return true;
            } else if (node[key] && typeof node[key] === 'object') {
                if (traverse(node[key])) return true;
            }
        }
        return false;
    };
    
    return traverse(bodyNode);
};

RobloxScriptChecker.prototype.hasUnoptimizedTableOperations = function(node) {
    if (node.type === 'CallExpression') {
        const funcName = this.getMemberExpressionString(node.base);
        return funcName.includes('table.insert') && this.isInLoop(node);
    }
    return false;
};

RobloxScriptChecker.prototype.hasFrequentInstanceCreation = function(node) {
    if (node.type === 'CallExpression') {
        const funcName = this.getMemberExpressionString(node.base);
        if (funcName.includes('Instance.new')) {
            return this.isInLoop(node) || this.isInFrequentEvent(node);
        }
    }
    return false;
};

RobloxScriptChecker.prototype.hasUnnecessaryStringConcatenation = function(node) {
    if (node.type === 'BinaryExpression' && node.operator === '..') {
        return this.hasMultipleConcatenations(node.parent);
    }
    return false;
};

RobloxScriptChecker.prototype.hasDeepTableAccess = function(node) {
    if (node.type === 'MemberExpression') {
        let depth = 0;
        let current = node;
        while (current && current.type === 'MemberExpression') {
            depth++;
            current = current.base;
        }
        return depth > 3;
    }
    return false;
};

RobloxScriptChecker.prototype.isInLoop = function(node) {
    let current = node.parent;
    while (current) {
        if (this.isLoopNode(current)) return true;
        current = current.parent;
    }
    return false;
};

RobloxScriptChecker.prototype.isInFrequentEvent = function(node) {
    let current = node.parent;
    while (current) {
        if (current.type === 'CallExpression') {
            const funcName = this.getMemberExpressionString(current.base);
            const frequentEvents = ['Heartbeat', 'RenderStepped', 'Stepped', 'Changed'];
            if (frequentEvents.some(event => funcName.includes(event))) {
                return true;
            }
        }
        current = current.parent;
    }
    return false;
};

RobloxScriptChecker.prototype.hasMultipleConcatenations = function(node) {
    return node && node.type === 'BinaryExpression' && node.operator === '..';
};

RobloxScriptChecker.prototype.getNodeSource = function(node) {
    return `Line ${node.loc ? node.loc.start.line : '?'}`;
};