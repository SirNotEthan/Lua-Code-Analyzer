RobloxScriptChecker.prototype.hasUnsafeRemoteEvents = function(node) {
    if (node.type === 'CallExpression') {
        const funcName = this.getMemberExpressionString(node.base);
        if (funcName.includes('FireServer') || funcName.includes('FireClient')) {
            return !this.hasValidationNearby(node);
        }
    }
    return false;
};

RobloxScriptChecker.prototype.hasClientSideValidation = function(node) {
    if (node.type === 'IfStatement') {
        const condition = this.getNodeSource(node.condition);
        return condition.includes('LocalPlayer') && 
               (condition.includes('Health') || condition.includes('Money') || condition.includes('Points'));
    }
    return false;
};

RobloxScriptChecker.prototype.hasInsecureDataStorage = function(node) {
    if (node.type === 'CallExpression') {
        const funcName = this.getMemberExpressionString(node.base);
        return funcName.includes('SetAttribute') && this.containsSensitiveData(node);
    }
    return false;
};

RobloxScriptChecker.prototype.hasUnsafeStringOperations = function(node) {
    if (node.type === 'CallExpression') {
        const funcName = this.getFunctionName(node);
        if (funcName === 'loadstring' || funcName === 'require') {
            return this.hasDynamicStringInput(node);
        }
    }
    return false;
};

RobloxScriptChecker.prototype.hasUnprotectedValueChanges = function(node) {
    if (node.type === 'AssignmentStatement') {
        const targets = node.variables;
        for (let target of targets) {
            const targetStr = this.getMemberExpressionString(target);
            if (targetStr.includes('Health') || targetStr.includes('Money') || targetStr.includes('Points')) {
                return true;
            }
        }
    }
    return false;
};

RobloxScriptChecker.prototype.hasValidationNearby = function(node) {
    return false;
};

RobloxScriptChecker.prototype.containsSensitiveData = function(node) {
    if (node.arguments && node.arguments.length > 0) {
        const firstArg = node.arguments[0];
        if (firstArg.type === 'StringLiteral') {
            const sensitive = ['password', 'token', 'key', 'secret', 'admin'];
            return sensitive.some(word => firstArg.value.toLowerCase().includes(word));
        }
    }
    return false;
};

RobloxScriptChecker.prototype.hasDynamicStringInput = function(node) {
    if (node.arguments && node.arguments.length > 0) {
        const firstArg = node.arguments[0];
        return firstArg.type !== 'StringLiteral';
    }
    return false;
};