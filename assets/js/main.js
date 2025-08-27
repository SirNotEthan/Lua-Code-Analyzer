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
    const resultsSection = document.getElementById('resultsSection');
    
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
    
    clearBtn.addEventListener('click', function() {
        editor.setValue('');
        hideResults();
    });
    
    exampleBtn.addEventListener('click', function() {
        editor.setValue(exampleScript);
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
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'warning' ? '#ed8936' : '#667eea'};
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
    
    function displayResults(results) {
        document.getElementById('lineCount').textContent = results.lineCount;
        document.getElementById('commentCount').textContent = results.commentCount;
        document.getElementById('nestingLevel').textContent = results.nestingLevel;
        
        const totalIssues = (results.deprecations?.length || 0) +
                           (results.securityIssues?.length || 0) +
                           (results.apiIssues?.length || 0) +
                           (results.inefficiencies?.length || 0) +
                           (results.lintIssues?.length || 0);
        
        document.getElementById('totalIssues').textContent = totalIssues;
        
        const score = calculateOverallScore(results);
        updateScoreDisplay(score);
        
        displayIssues('securityList', 'securityCount', results.securityIssues || []);
        displayIssues('deprecationsList', 'deprecationCount', results.deprecations || []);
        displayIssues('apiIssuesList', 'apiCount', results.apiIssues || []);
        displayIssues('inefficienciesList', 'inefficiencyCount', results.inefficiencies || []);
        displayIssues('lintIssuesList', 'lintCount', results.lintIssues || []);
        
        if (!results.parseSuccess) {
            showNotification('Using fallback analysis due to parsing errors', 'warning');
        } else {
            showNotification('Analysis completed successfully!', 'success');
        }
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
    
    function updateScoreDisplay(score) {
        const scoreElement = document.getElementById('overallScore');
        const descElement = document.getElementById('scoreDescription');
        const circleElement = document.getElementById('scoreCircle');
        
        scoreElement.textContent = score;
        
        let description, gradient;
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
        
        descElement.textContent = description;
        circleElement.style.background = gradient;
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