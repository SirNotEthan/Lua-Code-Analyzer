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
    
    // Initialize modules
    const checker = new RobloxScriptChecker();
    const resultsDisplay = new ResultsDisplay();
    const editorHighlighting = new EditorHighlighting(editor);
    const exampleManager = new ExampleManager(editor);
    
    // Make instances globally accessible
    window.editorInstance = editor;
    window.editorHighlighting = editorHighlighting;
    window.IssueModal = IssueModal;
    
    // Get DOM elements
    const analyzeBtn = document.getElementById('analyzeBtn');
    const clearBtn = document.getElementById('clearBtn');
    const exampleBtn = document.getElementById('exampleBtn');
    const exportBtn = document.getElementById('exportBtn');
    const shareBtn = document.getElementById('shareBtn');
    const resultsSection = document.getElementById('resultsSection');
    
    // File input for loading scripts
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.lua,.luau,.txt';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    
    let currentResults = null;
    
    // Button event handlers
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', function() {
            const script = editor.getValue().trim();
            
            if (!script) {
                showNotification('Please enter a script to analyze', 'warning');
                return;
            }
            
            showLoadingState();
            
            setTimeout(() => {
                try {
                    const results = checker.analyzeScript(script);
                    resultsDisplay.displayResults(results);
                    editorHighlighting.highlightIssues(results);
                    hideLoadingState();
                    showParsingInfo(results);
                } catch (error) {
                    console.error('Analysis error:', error);
                    showNotification('Error during analysis: ' + error.message, 'warning');
                    hideLoadingState();
                }
            }, 1000);
        });
    }
    
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
                exampleManager.showExampleModal();
            } catch (error) {
                showNotification('Error loading examples: ' + error.message, 'warning');
            }
        });
    }
    
    // Export and share functionality
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
    
    // Keyboard shortcuts
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
    
    // Collapsible sections
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
    
    // File input handler
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
            resultsDisplay.hideResults();
            editorHighlighting.clearHighlights();
            currentResults = null;
            showNotification(`File "${file.name}" loaded successfully!`, 'success');
        };
        
        reader.onerror = function() {
            showNotification('Error reading file. Please try again.', 'warning');
        };
        
        reader.readAsText(file);
        fileInput.value = '';
    });
    
    // Helper functions
    function showLoadingState() {
        const btnIcon = analyzeBtn.querySelector('.btn-icon');
        const btnText = analyzeBtn.querySelector('.btn-text');
        const btnLoading = analyzeBtn.querySelector('.btn-loading');
        
        if (btnIcon) btnIcon.style.display = 'none';
        if (btnText) btnText.style.display = 'none';
        if (btnLoading) btnLoading.style.display = 'inline';
        analyzeBtn.disabled = true;
        analyzeBtn.classList.add('loading');
    }
    
    function hideLoadingState() {
        const btnIcon = analyzeBtn.querySelector('.btn-icon');
        const btnText = analyzeBtn.querySelector('.btn-text');
        const btnLoading = analyzeBtn.querySelector('.btn-loading');
        
        if (btnIcon) btnIcon.style.display = 'inline';
        if (btnText) btnText.style.display = 'inline';
        if (btnLoading) btnLoading.style.display = 'none';
        analyzeBtn.disabled = false;
        analyzeBtn.classList.remove('loading');
    }
    
    function showParsingInfo(results) {
        if (!results.parseSuccess) {
            if (results.parseErrors && results.parseErrors.length > 0) {
                showNotification('Using fallback analysis - some complex syntax not fully parsed', 'warning');
            } else {
                showNotification('Using fallback analysis due to parsing complexities', 'warning');
            }
        } else if (results.parseErrors && results.parseErrors.length > 0) {
            showNotification('Analysis completed with relaxed parsing settings', 'info');
        } else {
            showNotification('Analysis completed successfully!', 'success');
        }
    }
    
    function clearEditor() {
        if (editor.getValue().trim() && !confirm('Are you sure you want to clear the editor? Any unsaved work will be lost.')) {
            return;
        }
        
        editor.setValue('');
        resultsDisplay.hideResults();
        editorHighlighting.clearHighlights();
        currentResults = null;
        
        // Reset metrics display
        document.getElementById('overallScore').textContent = '--';
        document.getElementById('scoreDescription').textContent = 'Run analysis to see code health score';
        document.getElementById('scoreCircle').style.background = '';
        
        ['lineCount', 'commentCount', 'nestingLevel', 'totalIssues'].forEach(id => {
            document.getElementById(id).textContent = '0';
        });
        
        showNotification('Editor cleared successfully', 'success');
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
    
    // Export/Share functionality (simplified versions)
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
                background: rgba(30, 30, 30, 0.98);
                border: 1px solid rgba(64, 64, 64, 0.4);
                padding: 30px;
                border-radius: 12px;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 20px 40px rgba(0,0,0,0.5);
            ">
                <h3 style="margin-top: 0; color: #e2e8f0;">Export Analysis Report</h3>
                <p style="color: #a0aec0; margin-bottom: 20px;">Choose your preferred export format:</p>
                
                <div class="export-formats" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    ${formats.map(format => `
                        <button class="export-format-btn" data-format="${format}" style="
                            padding: 12px 20px;
                            border: 2px solid rgba(113, 128, 150, 0.3);
                            background: rgba(45, 55, 72, 0.6);
                            border-radius: 8px;
                            cursor: pointer;
                            transition: all 0.2s;
                            text-transform: uppercase;
                            font-weight: bold;
                            color: #e2e8f0;
                        " onmouseover="this.style.background='rgba(45, 55, 72, 0.8)'; this.style.borderColor='rgba(113, 128, 150, 0.5)'" onmouseout="this.style.background='rgba(45, 55, 72, 0.6)'; this.style.borderColor='rgba(113, 128, 150, 0.3)'">${format}</button>
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
                    transition: all 0.2s;
                " onmouseover="this.style.background='#c53030'" onmouseout="this.style.background='#e53e3e'">Cancel</button>
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
                content = generateTextReport(results);
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
    
    function generateTextReport(results) {
        const date = new Date().toLocaleDateString();
        const score = resultsDisplay.calculateOverallScore(results);
        
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
        
        const categories = [
            { name: 'SECURITY ISSUES', issues: results.securityIssues },
            { name: 'DEPRECATIONS', issues: results.deprecations },
            { name: 'API ISSUES', issues: results.apiIssues },
            { name: 'PERFORMANCE ISSUES', issues: results.inefficiencies },
            { name: 'CODE QUALITY ISSUES', issues: results.lintIssues }
        ];
        
        categories.forEach(category => {
            if (category.issues && category.issues.length > 0) {
                report += `${category.name} (${category.issues.length})\n`;
                report += `${'-'.repeat(40)}\n`;
                category.issues.forEach((issue, i) => {
                    report += `${i + 1}. Line ${issue.line}: ${issue.message}\n`;
                    if (issue.suggestion) report += `   Suggestion: ${issue.suggestion}\n`;
                    report += `\n`;
                });
            }
        });
        
        report += `\n═══════════════════════════════════\n`;
        report += `Generated by Roblox Script Analyzer\n`;
        
        return report;
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
        const score = resultsDisplay.calculateOverallScore(results);
        
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
        const shareOptions = [
            { name: 'Quick Summary', type: 'summary' },
            { name: 'Full Report', type: 'full' },
            { name: 'Issues Only', type: 'issues' }
        ];

        const modal = createShareModal(shareOptions);
        document.body.appendChild(modal);
        
        modal.addEventListener('click', function(e) {
            if (e.target.classList.contains('share-option-btn')) {
                const type = e.target.dataset.type;
                performShare(results, type);
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
                background: rgba(30, 30, 30, 0.98);
                border: 1px solid rgba(64, 64, 64, 0.4);
                padding: 30px;
                border-radius: 12px;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 20px 40px rgba(0,0,0,0.5);
            ">
                <h3 style="margin-top: 0; color: #e2e8f0;">Share Analysis Results</h3>
                <p style="color: #a0aec0; margin-bottom: 20px;">Choose what to share:</p>
                
                <div class="share-options" style="display: grid; gap: 10px;">
                    ${options.map(option => `
                        <button class="share-option-btn" data-type="${option.type}" style="
                            padding: 12px 20px;
                            border: 2px solid rgba(113, 128, 150, 0.3);
                            background: rgba(45, 55, 72, 0.6);
                            border-radius: 8px;
                            cursor: pointer;
                            transition: all 0.2s;
                            font-weight: bold;
                            color: #e2e8f0;
                            text-align: left;
                        " onmouseover="this.style.background='rgba(45, 55, 72, 0.8)'; this.style.borderColor='rgba(113, 128, 150, 0.5)'" onmouseout="this.style.background='rgba(45, 55, 72, 0.6)'; this.style.borderColor='rgba(113, 128, 150, 0.3)'">${option.name}</button>
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
                    transition: all 0.2s;
                " onmouseover="this.style.background='#c53030'" onmouseout="this.style.background='#e53e3e'">Cancel</button>
            </div>
        `;

        return modal;
    }
    
    function performShare(results, type) {
        let content;
        const score = resultsDisplay.calculateOverallScore(results);
        
        switch (type) {
            case 'summary':
                content = `🔍 Roblox Script Analysis Summary\n\nScore: ${score}/100\nLines: ${results.lineCount} | Comments: ${results.commentCount}\nIssues: ${(results.securityIssues?.length || 0) + (results.deprecations?.length || 0) + (results.apiIssues?.length || 0) + (results.inefficiencies?.length || 0) + (results.lintIssues?.length || 0)}\n\n✨ Analyzed with Roblox Script Analyzer`;
                break;
            case 'issues':
                content = `⚠️ Script Issues Report\n\n🔒 Security: ${results.securityIssues?.length || 0}\n⚠️ Deprecations: ${results.deprecations?.length || 0}\n🔧 API Issues: ${results.apiIssues?.length || 0}\n⚡ Performance: ${results.inefficiencies?.length || 0}\n✨ Quality: ${results.lintIssues?.length || 0}\n\n🛠️ Get detailed analysis at Roblox Script Analyzer`;
                break;
            default: 
                content = generateTextReport(results);
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
    
    function fallbackShare(content) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(content).then(() => {
                showNotification('Report copied to clipboard!', 'success');
            }).catch(() => {
                showNotification('Unable to copy to clipboard', 'warning');
            });
        } else {
            showNotification('Sharing not supported on this device', 'warning');
        }
    }
});