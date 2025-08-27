RobloxScriptChecker.prototype.isVerifiedDeprecated = function(functionName) {
    return this.verifiedDeprecatedAPIs.some(api => api.name === functionName);
};

RobloxScriptChecker.prototype.getVerifiedAPIInfo = function(functionName) {
    return this.verifiedDeprecatedAPIs.find(api => api.name === functionName);
};

RobloxScriptChecker.prototype.getModernAlternative = function(deprecated) {
    const apiInfo = this.getVerifiedAPIInfo(deprecated);
    if (apiInfo) {
        return apiInfo.alternative;
    }
    
    const alternatives = {
        'wait': 'task.wait()',
        'spawn': 'task.spawn()',
        'delay': 'task.delay()',
        'Debris:AddItem': 'Debris:addItem()'
    };
    return alternatives[deprecated] || 'Check Roblox documentation for modern alternative';
};

RobloxScriptChecker.prototype.validateDeprecationStatus = function(functionName) {
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
};