class EditorHighlighting {
    constructor(editor) {
        this.editor = editor;
        this.issueMarkers = [];
        this.issueTooltip = null;
        this.tooltipTimeout = null;
        this.currentHoverLine = -1;
        this.createHighlightStyles();
    }

    highlightIssues(results) {
        this.clearHighlights();
        
        const allIssues = this.collectAllIssues(results);
        if (allIssues.length === 0) return;
        
        this.highlightIssueLines(allIssues);
        this.addGutterMarkers(allIssues);
        this.setupEditorInteractions(allIssues);
    }

    clearHighlights() {
        this.issueMarkers.forEach(marker => marker.clear());
        this.issueMarkers = [];
        
        if (this.issueTooltip) {
            this.issueTooltip.remove();
            this.issueTooltip = null;
        }
        
        this.editor.clearGutter("issue-gutter");
    }

    collectAllIssues(results) {
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

    createHighlightStyles() {
        let styleElement = document.getElementById('editor-highlight-styles');
        if (styleElement) return;
        
        styleElement = document.createElement('style');
        styleElement.id = 'editor-highlight-styles';
        styleElement.textContent = `
            /* Smooth, consistent highlighting styles */
            .issue-critical { 
                background: linear-gradient(90deg, rgba(229, 62, 62, 0.12) 0%, rgba(229, 62, 62, 0.06) 100%) !important;
                border-left: 3px solid rgba(229, 62, 62, 0.8) !important;
                box-shadow: inset 0 0 0 1px rgba(229, 62, 62, 0.1) !important;
                transition: all 0.2s ease !important;
            }
            
            .issue-warning { 
                background: linear-gradient(90deg, rgba(237, 137, 54, 0.12) 0%, rgba(237, 137, 54, 0.06) 100%) !important;
                border-left: 3px solid rgba(237, 137, 54, 0.8) !important;
                box-shadow: inset 0 0 0 1px rgba(237, 137, 54, 0.1) !important;
                transition: all 0.2s ease !important;
            }
            
            .issue-security { 
                background: linear-gradient(90deg, rgba(229, 62, 62, 0.12) 0%, rgba(229, 62, 62, 0.06) 100%) !important;
                border-left: 3px solid rgba(229, 62, 62, 0.8) !important;
                box-shadow: inset 0 0 0 1px rgba(229, 62, 62, 0.1) !important;
                transition: all 0.2s ease !important;
            }
            
            .issue-deprecation { 
                background: linear-gradient(90deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.06) 100%) !important;
                border-left: 3px solid rgba(245, 158, 11, 0.8) !important;
                box-shadow: inset 0 0 0 1px rgba(245, 158, 11, 0.1) !important;
                transition: all 0.2s ease !important;
            }
            
            .issue-performance { 
                background: linear-gradient(90deg, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.06) 100%) !important;
                border-left: 3px solid rgba(59, 130, 246, 0.8) !important;
                box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.1) !important;
                transition: all 0.2s ease !important;
            }
            
            .issue-api { 
                background: linear-gradient(90deg, rgba(20, 184, 166, 0.12) 0%, rgba(20, 184, 166, 0.06) 100%) !important;
                border-left: 3px solid rgba(20, 184, 166, 0.8) !important;
                box-shadow: inset 0 0 0 1px rgba(20, 184, 166, 0.1) !important;
                transition: all 0.2s ease !important;
            }
            
            .issue-quality { 
                background: linear-gradient(90deg, rgba(147, 51, 234, 0.12) 0%, rgba(147, 51, 234, 0.06) 100%) !important;
                border-left: 3px solid rgba(147, 51, 234, 0.8) !important;
                box-shadow: inset 0 0 0 1px rgba(147, 51, 234, 0.1) !important;
                transition: all 0.2s ease !important;
            }
            
            /* Hover effects for highlighted lines */
            .issue-critical:hover,
            .issue-warning:hover,
            .issue-security:hover,
            .issue-deprecation:hover,
            .issue-performance:hover,
            .issue-api:hover,
            .issue-quality:hover {
                background-opacity: 0.2 !important;
                transform: translateX(2px) !important;
            }
            
            /* Smooth, modern gutter markers */
            .issue-gutter-marker {
                display: inline-block;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 9px;
                text-align: center;
                line-height: 16px;
                font-weight: 600;
                color: white;
                margin-left: 2px;
                transition: all 0.2s ease;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }
            
            .issue-gutter-marker:hover {
                transform: scale(1.1);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            }
            
            /* Consistent gutter marker colors matching line highlights */
            .issue-critical-marker { 
                background: linear-gradient(135deg, #e53e3e, #dc2626);
            }
            
            .issue-warning-marker { 
                background: linear-gradient(135deg, #f59e0b, #d97706);
            }
            
            .issue-security-marker { 
                background: linear-gradient(135deg, #e53e3e, #dc2626);
            }
            
            .issue-deprecation-marker { 
                background: linear-gradient(135deg, #f59e0b, #d97706);
            }
            
            .issue-performance-marker { 
                background: linear-gradient(135deg, #3b82f6, #2563eb);
            }
            
            .issue-api-marker { 
                background: linear-gradient(135deg, #14b8a6, #0d9488);
            }
            
            .issue-quality-marker { 
                background: linear-gradient(135deg, #9333ea, #7c3aed);
            }
        `;
        
        document.head.appendChild(styleElement);
    }

    highlightIssueLines(allIssues) {
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
            const primaryIssue = this.getPrimaryIssue(issues);
            const className = this.getHighlightClass(primaryIssue);
            
            const marker = this.editor.markText(
                {line: line, ch: 0},
                {line: line, ch: this.editor.getLine(line)?.length || 0},
                {
                    className: className,
                    title: `${issues.length} issue${issues.length > 1 ? 's' : ''} detected`
                }
            );
            
            this.issueMarkers.push(marker);
        });
    }

    getPrimaryIssue(issues) {
        const severityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        return issues.sort((a, b) => (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0))[0];
    }

    getHighlightClass(issue) {
        if (issue.severity === 'high') return 'issue-critical';
        if (issue.severity === 'medium') return 'issue-warning';
        return `issue-${issue.category}`;
    }

    addGutterMarkers(allIssues) {
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
            const primaryIssue = this.getPrimaryIssue(issues);
            const marker = this.createGutterMarker(issues, primaryIssue);
            
            this.editor.setGutterMarker(line, "issue-gutter", marker);
        });
    }

    createGutterMarker(issues, primaryIssue) {
        const marker = document.createElement('div');
        marker.className = `issue-gutter-marker issue-${primaryIssue.severity}-marker`;
        marker.textContent = issues.length;
        marker.title = `${issues.length} issue${issues.length > 1 ? 's' : ''} on this line`;
        
        return marker;
    }

    setupEditorInteractions(allIssues) {
        const issuesByLine = {};
        
        allIssues.forEach(issue => {
            const lineNum = parseInt(issue.line) - 1;
            if (lineNum >= 0) {
                if (!issuesByLine[lineNum]) issuesByLine[lineNum] = [];
                issuesByLine[lineNum].push(issue);
            }
        });
        
        // Reset state
        this.currentHoverLine = -1;
        this.tooltipTimeout = null;
        
        // Clear any existing tooltip when cursor moves
        this.editor.on('cursorActivity', () => this.hideTooltip());
        
        // Handle mouse movement over editor
        this.editor.getWrapperElement().addEventListener('mousemove', (e) => {
            const pos = this.editor.coordsChar({left: e.clientX, top: e.clientY});
            const lineIssues = issuesByLine[pos.line];
            
            // Only show tooltip if we're on a new line with issues
            if (lineIssues && lineIssues.length > 0 && this.currentHoverLine !== pos.line) {
                // Clear any pending hide timeout
                if (this.tooltipTimeout) {
                    clearTimeout(this.tooltipTimeout);
                    this.tooltipTimeout = null;
                }
                
                this.currentHoverLine = pos.line;
                this.showTooltip(e, pos, lineIssues);
            } else if (!lineIssues && this.currentHoverLine !== -1) {
                // Only hide if we're not over the tooltip
                if (!this.isMouseOverTooltip(e)) {
                    this.currentHoverLine = -1;
                    this.scheduleHideTooltip();
                }
            }
        });
        
        // Hide tooltip when mouse leaves editor area
        this.editor.getWrapperElement().addEventListener('mouseleave', () => {
            this.currentHoverLine = -1;
            this.scheduleHideTooltip();
        });
        
        // Handle gutter marker clicks
        this.editor.getWrapperElement().addEventListener('click', (e) => {
            if (e.target.classList.contains('issue-gutter-marker')) {
                const lineNum = Array.from(e.target.parentNode.parentNode.children).indexOf(e.target.parentNode);
                const lineIssues = issuesByLine[lineNum];
                if (lineIssues && window.IssueModal) {
                    this.hideTooltip();
                    window.IssueModal.show(lineNum + 1, lineIssues, this.editor);
                }
            }
        });
    }

    showTooltip(event, pos, issues) {
        this.hideTooltip();
        
        const primaryIssue = this.getPrimaryIssue(issues);
        
        this.issueTooltip = document.createElement('div');
        this.issueTooltip.className = 'issue-tooltip';
        this.issueTooltip.innerHTML = this.createTooltipContent(primaryIssue, issues, pos);
        
        // Add hover handlers to keep tooltip visible when mouse is over it
        this.issueTooltip.addEventListener('mouseenter', () => {
            if (this.tooltipTimeout) {
                clearTimeout(this.tooltipTimeout);
                this.tooltipTimeout = null;
            }
        });
        
        this.issueTooltip.addEventListener('mouseleave', () => {
            this.scheduleHideTooltip();
        });
        
        document.body.appendChild(this.issueTooltip);
        this.positionTooltip(event, pos);
    }

    createTooltipContent(primaryIssue, issues, pos) {
        const categoryIcons = {
            'security': '🔒',
            'deprecation': '⚠️',
            'api': '🔧',
            'performance': '⚡',
            'quality': '✨'
        };

        return `
            <div class="tooltip-header">
                <span>${categoryIcons[primaryIssue.category] || '❓'}</span>
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
                <button class="tooltip-action-btn" onclick="window.IssueModal?.show(${pos.line + 1}, ${JSON.stringify(issues).replace(/"/g, '&quot;')}, window.editorInstance)">
                    View Details
                </button>
                <button class="tooltip-action-btn" onclick="window.editorHighlighting?.hideTooltip()">
                    Close
                </button>
            </div>
        `;
    }

    positionTooltip(event, pos) {
        // Position tooltip relative to the line, not mouse cursor to prevent flickering
        const lineHandle = this.editor.getLineHandle(pos.line);
        const coords = this.editor.charCoords({line: pos.line, ch: 0}, 'page');
        
        const rect = this.issueTooltip.getBoundingClientRect();
        let x = coords.left + 20; // Position slightly to the right of line start
        let y = coords.bottom + 10; // Below the line
        
        // Adjust if tooltip would go off-screen
        if (x + rect.width > window.innerWidth - 20) {
            x = window.innerWidth - rect.width - 20;
        }
        
        if (y + rect.height > window.innerHeight - 10) {
            y = coords.top - rect.height - 10; // Above the line if no room below
        }
        
        this.issueTooltip.style.position = 'absolute';
        this.issueTooltip.style.left = x + 'px';
        this.issueTooltip.style.top = y + 'px';
        this.issueTooltip.style.zIndex = '10000';
        this.issueTooltip.style.pointerEvents = 'auto'; // Make tooltip clickable
    }

    hideTooltip() {
        if (this.tooltipTimeout) {
            clearTimeout(this.tooltipTimeout);
            this.tooltipTimeout = null;
        }
        
        if (this.issueTooltip) {
            this.issueTooltip.remove();
            this.issueTooltip = null;
        }
    }
    
    scheduleHideTooltip() {
        if (this.tooltipTimeout) {
            clearTimeout(this.tooltipTimeout);
        }
        
        this.tooltipTimeout = setTimeout(() => {
            this.hideTooltip();
        }, 300); // 300ms delay before hiding
    }
    
    isMouseOverTooltip(event) {
        if (!this.issueTooltip) return false;
        
        const rect = this.issueTooltip.getBoundingClientRect();
        return event.clientX >= rect.left - 10 && 
               event.clientX <= rect.right + 10 && 
               event.clientY >= rect.top - 10 && 
               event.clientY <= rect.bottom + 10;
    }
}