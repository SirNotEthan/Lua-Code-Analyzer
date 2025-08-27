RobloxScriptChecker.prototype.usesGetService = function(node) {
    if (node.type === 'MemberExpression') {
        const base = node.base;
        if (base && base.name === 'game') {
            const service = node.identifier.name;
            const robloxServices = ['Players', 'Workspace', 'ReplicatedStorage', 'TweenService', 'UserInputService', 'RunService'];
            return robloxServices.includes(service) && !this.hasGetServiceCall(node.parent);
        }
    }
    return false;
};

RobloxScriptChecker.prototype.hasGetServiceCall = function(node) {
    return node && node.type === 'CallExpression' && 
           this.getMemberExpressionString(node.base).includes('GetService');
};

RobloxScriptChecker.prototype.hasUnconnectedEvents = function(node) {
    if (node.type === 'CallExpression') {
        const funcName = this.getMemberExpressionString(node.base);
        if (funcName.includes('Connect') || funcName.includes('connect')) {
            return !this.hasDisconnectNearby(node);
        }
    }
    return false;
};

RobloxScriptChecker.prototype.hasDisconnectNearby = function(node) {
    return false;
};

RobloxScriptChecker.prototype.usesFindFirstChild = function(node) {
    if (node.type === 'CallExpression') {
        const funcName = this.getMemberExpressionString(node.base);
        return funcName.includes('FindFirstChild');
    }
    return false;
};

RobloxScriptChecker.prototype.hasHardcodedIds = function(node) {
    if (node.type === 'NumericLiteral') {
        const value = node.value;
        return value > 100000 && value < 999999999;
    }
    if (node.type === 'StringLiteral') {
        return node.value.includes('rbxassetid://') || node.value.includes('rbxasset://');
    }
    return false;
};