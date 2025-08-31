class ResultsDisplay {
    constructor() {
        this.currentResults = null;
        this.codeHealthHistory = [];
    }

    displayResults(results) {
        this.currentResults = results;
        
        try {
            const health = this.analyzeCodeHealth(results);
            
            this.updateMetrics(results, health);
            this.updateScoreDisplay(health.overallScore, health);
        } catch (error) {
            console.error('Error in displayResults:', error);
            this.displayBasicResults(results);
        }
        
        this.displayIssueCategories(results);
        this.displayDetailedCodeQuality(results);
        this.showResults();
    }

    updateMetrics(results, health) {
        document.getElementById('lineCount').textContent = results.lineCount;
        document.getElementById('commentCount').textContent = results.commentCount;
        document.getElementById('nestingLevel').textContent = results.nestingLevel;
        
        const totalIssues = health.issues.security + health.issues.deprecations + 
                           health.issues.api + health.issues.performance + health.issues.quality;
        
        document.getElementById('totalIssues').textContent = totalIssues;
    }

    displayBasicResults(results) {
        const basicScore = this.calculateOverallScore(results);
        
        document.getElementById('lineCount').textContent = results.lineCount;
        document.getElementById('commentCount').textContent = results.commentCount;
        document.getElementById('nestingLevel').textContent = results.nestingLevel;
        
        const totalIssues = (results.deprecations?.length || 0) +
                           (results.securityIssues?.length || 0) +
                           (results.apiIssues?.length || 0) +
                           (results.inefficiencies?.length || 0) +
                           (results.lintIssues?.length || 0);
        
        document.getElementById('totalIssues').textContent = totalIssues;
        this.updateScoreDisplay(basicScore);
    }

    displayIssueCategories(results) {
        this.displayIssues('securityList', 'securityCount', results.securityIssues || []);
        this.displayIssues('deprecationsList', 'deprecationCount', results.deprecations || []);
        this.displayIssues('apiIssuesList', 'apiCount', results.apiIssues || []);
        this.displayIssues('inefficienciesList', 'inefficiencyCount', results.inefficiencies || []);
        this.displayIssues('lintIssuesList', 'lintCount', results.lintIssues || []);
        
        // Add instruction tooltip after first analysis
        this.addClickInstructions();
    }
    
    addClickInstructions() {
        const issuesSection = document.querySelector('.issues-section');
        if (issuesSection && !document.getElementById('click-instructions')) {
            const instruction = document.createElement('div');
            instruction.id = 'click-instructions';
            instruction.style.cssText = `
                background: linear-gradient(135deg, rgba(66, 153, 225, 0.1) 0%, rgba(99, 179, 237, 0.1) 100%);
                border: 1px solid rgba(66, 153, 225, 0.3);
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 20px;
                color: #90cdf4;
                font-size: 14px;
                text-align: center;
                animation: fadeIn 1s ease-out;
            `;
            instruction.innerHTML = `
                💡 <strong>Tip:</strong> Click on any issue below to see detailed explanation, code examples, and fix suggestions
            `;
            
            // Insert before the first issue category
            const firstCategory = issuesSection.querySelector('.issue-category');
            if (firstCategory) {
                issuesSection.insertBefore(instruction, firstCategory);
            }
        }
    }

    displayIssues(listId, countId, issues) {
        const list = document.getElementById(listId);
        const count = document.getElementById(countId);
        const category = list.closest('.issue-category');
        
        list.innerHTML = '';
        count.textContent = issues.length;
        
        if (issues.length === 0) {
            const li = document.createElement('li');
            li.textContent = '✅ No issues found';
            li.className = 'no-issues';
            li.style.cssText = `
                color: #38a169;
                font-weight: 500;
                padding: 12px;
                text-align: center;
                background: #f0fff4;
                border-radius: 6px;
                margin: 5px 0;
            `;
            list.appendChild(li);
            category.style.opacity = '0.6';
        } else {
            category.style.opacity = '1';
            
            issues.forEach((issue, index) => {
                const li = this.createIssueItem(issue, index);
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

    createIssueItem(issue, index) {
        const li = document.createElement('li');
        li.style.animationDelay = `${index * 0.1}s`;
        li.classList.add('fadeInUp');
        li.style.cssText = `
            background: rgba(26, 32, 44, 0.8);
            border: 1px solid rgba(113, 128, 150, 0.2);
            border-radius: 8px;
            padding: 15px;
            margin: 10px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            transition: all 0.2s ease;
            cursor: pointer;
            position: relative;
        `;
        
        let content = `<div class="issue-header" style="margin-bottom: 10px;">`;
        content += `<strong style="color: #e2e8f0;">Line ${issue.line}:</strong> <span style="color: #cbd5e0;">${issue.message}</span>`;
        
        if (issue.severity) {
            const severityColors = {
                'high': '#e53e3e',
                'medium': '#ed8936',
                'low': '#38a169'
            };
            const color = severityColors[issue.severity] || '#718096';
            
            content += ` <span style="
                background: ${color};
                color: white;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: bold;
                text-transform: uppercase;
                margin-left: 8px;
            ">${issue.severity}</span>`;
        }
        content += `</div>`;
        
        if (issue.suggestion) {
            content += `<div style="
                background: rgba(56, 161, 105, 0.1);
                border-left: 4px solid #38a169;
                padding: 10px 12px;
                margin: 8px 0;
                border-radius: 0 4px 4px 0;
            ">
                <em style="color: #68d391;">💡 <strong>Suggestion:</strong> ${issue.suggestion}</em>
            </div>`;
        }
        
        if (issue.docUrl) {
            content += `<div style="margin-top: 10px;">
                <a href="${issue.docUrl}" target="_blank" rel="noopener" style="
                    color: #4299e1;
                    text-decoration: none;
                    font-size: 14px;
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                ">
                    📖 View Documentation →
                </a>
            </div>`;
        }
        
        if (issue.lastVerified) {
            content += `<div style="
                margin-top: 8px;
                font-size: 12px;
                color: #718096;
            ">
                Last verified: ${issue.lastVerified}
            </div>`;
        }
        
        // Add click indicator
        content += `<div style="
            position: absolute;
            top: 10px;
            right: 15px;
            color: #4299e1;
            font-size: 16px;
            opacity: 0.7;
        " title="Click for detailed explanation">🔍</div>`;
        
        li.innerHTML = content;
        
        // Add CSS hover effect with inline styles
        li.onmouseenter = function() {
            this.style.background = 'rgba(26, 32, 44, 0.95)';
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        };
        
        li.onmouseleave = function() {
            this.style.background = 'rgba(26, 32, 44, 0.8)';
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        };
        
        // Add click handler to show detailed modal
        li.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Issue clicked:', issue); // Debug log
            if (window.IssueModal) {
                console.log('Opening IssueModal'); // Debug log
                window.IssueModal.show(issue.line, [issue], window.editorInstance);
            } else {
                console.error('IssueModal not found on window object'); // Debug log
            }
        };
        
        return li;
    }

    analyzeCodeHealth(results) {
        const health = {
            timestamp: new Date().toISOString(),
            overallScore: this.calculateOverallScore(results),
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
            recommendations: this.generateHealthRecommendations(results)
        };

        this.codeHealthHistory.unshift(health);
        if (this.codeHealthHistory.length > 10) {
            this.codeHealthHistory = this.codeHealthHistory.slice(0, 10);
        }

        return health;
    }

    generateHealthRecommendations(results) {
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

    calculateOverallScore(results) {
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

    updateScoreDisplay(score, health = null) {
        const scoreElement = document.getElementById('overallScore');
        const descElement = document.getElementById('scoreDescription');
        const circleElement = document.getElementById('scoreCircle');
        
        scoreElement.textContent = score;
        
        let description, gradient;
        
        if (health && health.recommendations.length > 0) {
            const topPriority = health.recommendations[0];
            const trend = this.getHealthTrend();
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
            circleElement.onclick = () => this.showHealthDetails(health);
        }
    }

    getHealthTrend() {
        if (this.codeHealthHistory.length < 2) return 'stable';
        
        const current = this.codeHealthHistory[0].overallScore;
        const previous = this.codeHealthHistory[1].overallScore;
        
        if (current > previous + 5) return 'improving';
        if (current < previous - 5) return 'declining';
        return 'stable';
    }

    showHealthDetails(health) {
        const modal = this.createHealthModal(health);
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close') || e.target.classList.contains('health-modal')) {
                modal.remove();
            }
        });
    }

    createHealthModal(health) {
        const trend = this.getHealthTrend();
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
            <div style="
                background: rgba(30, 30, 30, 0.98);
                border: 1px solid rgba(64, 64, 64, 0.4);
                padding: 30px;
                border-radius: 12px;
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 20px 40px rgba(0,0,0,0.5);
            ">
                <h3 style="margin-top: 0; color: #e2e8f0;">📊 Code Health Details</h3>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
                    <div style="text-align: center;">
                        <div style="font-size: 36px; font-weight: bold; color: ${health.overallScore >= 80 ? '#38a169' : health.overallScore >= 60 ? '#ed8936' : '#e53e3e'};">
                            ${health.overallScore}/100
                        </div>
                        <div style="color: #a0aec0;">Overall Score</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 24px;">${trendIcon}</div>
                        <div style="color: #a0aec0; text-transform: capitalize;">${trend}</div>
                    </div>
                </div>

                <div style="margin: 20px 0;">
                    <h4 style="color: #e2e8f0; margin-bottom: 10px;">Issue Breakdown:</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px;">
                        <div style="text-align: center; padding: 10px; background: rgba(229, 62, 62, 0.2); border: 1px solid rgba(229, 62, 62, 0.3); border-radius: 6px;">
                            <div style="font-weight: bold; color: #e2e8f0;">🔒 ${health.issues.security}</div>
                            <div style="font-size: 12px; color: #a0aec0;">Security</div>
                        </div>
                        <div style="text-align: center; padding: 10px; background: rgba(237, 137, 54, 0.2); border: 1px solid rgba(237, 137, 54, 0.3); border-radius: 6px;">
                            <div style="font-weight: bold; color: #e2e8f0;">⚠️ ${health.issues.deprecations}</div>
                            <div style="font-size: 12px; color: #a0aec0;">Deprecations</div>
                        </div>
                        <div style="text-align: center; padding: 10px; background: rgba(49, 130, 206, 0.2); border: 1px solid rgba(49, 130, 206, 0.3); border-radius: 6px;">
                            <div style="font-weight: bold; color: #e2e8f0;">🔧 ${health.issues.api}</div>
                            <div style="font-size: 12px; color: #a0aec0;">API</div>
                        </div>
                        <div style="text-align: center; padding: 10px; background: rgba(56, 161, 105, 0.2); border: 1px solid rgba(56, 161, 105, 0.3); border-radius: 6px;">
                            <div style="font-weight: bold; color: #e2e8f0;">⚡ ${health.issues.performance}</div>
                            <div style="font-size: 12px; color: #a0aec0;">Performance</div>
                        </div>
                        <div style="text-align: center; padding: 10px; background: rgba(128, 90, 213, 0.2); border: 1px solid rgba(128, 90, 213, 0.3); border-radius: 6px;">
                            <div style="font-weight: bold; color: #e2e8f0;">✨ ${health.issues.quality}</div>
                            <div style="font-size: 12px; color: #a0aec0;">Quality</div>
                        </div>
                    </div>
                </div>

                ${health.recommendations.length > 0 ? `
                    <div style="margin: 20px 0;">
                        <h4 style="color: #e2e8f0; margin-bottom: 10px;">💡 Top Recommendations:</h4>
                        ${health.recommendations.slice(0, 3).map(rec => `
                            <div style="margin: 10px 0; padding: 15px; background: rgba(45, 55, 72, 0.6); border-left: 4px solid ${rec.priority === 'high' ? '#e53e3e' : '#ed8936'}; border-radius: 4px;">
                                <div style="font-weight: bold; color: #e2e8f0;">${rec.category}</div>
                                <div style="color: #cbd5e0; margin: 5px 0;">${rec.message}</div>
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
                        transition: all 0.2s;
                    " onmouseover="this.style.background='#3182ce'" onmouseout="this.style.background='#4299e1'">Close</button>
                </div>
            </div>
        `;

        return modal;
    }

    displayDetailedCodeQuality(results) {
        const allIssues = this.collectAllIssues(results);
        const lineRatings = this.calculateLineRatings(allIssues, results.lineCount);
        const scriptContent = window.editorInstance?.getValue() || '';
        
        this.displayLineByLineAnalysis(lineRatings, allIssues, scriptContent);
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

    calculateLineRatings(allIssues, totalLines) {
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

    displayLineByLineAnalysis(lineRatings, allIssues, scriptContent, minRating = 70) {
        const problemLines = Object.entries(lineRatings)
            .filter(([lineNum, rating]) => rating.score < minRating)
            .sort(([,a], [,b]) => a.score - b.score);
        
        if (problemLines.length === 0) {
            this.displayExcellentCodeMessage();
            return;
        }

        this.createDetailedQualitySection(problemLines, scriptContent, minRating);
    }

    displayExcellentCodeMessage() {
        const resultsSection = document.getElementById('resultsSection');
        let qualitySection = document.getElementById('detailed-quality-section');
        
        if (qualitySection) {
            qualitySection.remove();
        }
        
        qualitySection = document.createElement('div');
        qualitySection.id = 'detailed-quality-section';
        qualitySection.style.cssText = `
            background: linear-gradient(135deg, rgba(56, 161, 105, 0.1) 0%, rgba(72, 187, 120, 0.1) 100%);
            border: 2px solid rgba(56, 161, 105, 0.3);
            border-radius: 12px;
            padding: 30px;
            margin: 20px 0;
            text-align: center;
            box-shadow: 0 4px 12px rgba(56, 161, 105, 0.2);
        `;
        
        qualitySection.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 20px;">🏆</div>
            <h3 style="color: #e2e8f0; margin-bottom: 15px;">Excellent Code Quality!</h3>
            <p style="color: #cbd5e0; font-size: 16px; line-height: 1.5;">
                Your code meets high quality standards with no significant issues detected.
                All lines score above the quality threshold.
            </p>
        `;
        
        resultsSection.appendChild(qualitySection);
    }

    createDetailedQualitySection(problemLines, scriptContent, minRating) {
        const resultsSection = document.getElementById('resultsSection');
        let qualitySection = document.getElementById('detailed-quality-section');
        
        if (qualitySection) {
            qualitySection.remove();
        }
        
        qualitySection = document.createElement('div');
        qualitySection.id = 'detailed-quality-section';
        qualitySection.style.cssText = `
            background: rgba(45, 55, 72, 0.6);
            border: 1px solid rgba(113, 128, 150, 0.3);
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        `;
        
        const lines = scriptContent.split('\n');
        
        qualitySection.innerHTML = `
            <div class="quality-header" style="margin-bottom: 20px;">
                <h3 style="color: #e2e8f0; margin-bottom: 10px;">
                    📊 Detailed Code Quality Analysis
                </h3>
                <p style="color: #a0aec0; font-size: 14px;">
                    Lines scoring below ${minRating}/100 with detailed explanations:
                </p>
                <div style="margin: 15px 0; padding: 10px; background: rgba(237, 137, 54, 0.2); border: 1px solid rgba(237, 137, 54, 0.3); border-radius: 6px; font-size: 14px; color: #e2e8f0;">
                    <strong>${problemLines.length}</strong> lines need attention out of <strong>${lines.length}</strong> total lines
                </div>
            </div>
            
            <div class="quality-lines">
                ${problemLines.map(([lineNum, rating]) => {
                    const lineContent = lines[parseInt(lineNum) - 1] || '';
                    return this.createLineQualityCard(lineNum, rating, lineContent.trim());
                }).join('')}
            </div>
        `;
        
        resultsSection.appendChild(qualitySection);
    }

    createLineQualityCard(lineNum, rating, lineContent) {
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
                background: rgba(26, 32, 44, 0.8);
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
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
                    background: rgba(26, 32, 44, 0.9);
                    border: 1px solid rgba(113, 128, 150, 0.2);
                    color: #e2e8f0;
                    padding: 12px;
                    border-radius: 6px;
                    font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', 'Menlo', monospace;
                    font-size: 14px;
                    margin-bottom: 15px;
                    overflow-x: auto;
                ">
                    <code>${lineContent || '(empty line)'}</code>
                </div>
                
                <div class="line-issues">
                    <h4 style="color: #e2e8f0; margin-bottom: 10px; font-size: 16px;">
                        Issues Found (${rating.issues.length}):
                    </h4>
                    ${rating.issues.map(issue => `
                        <div class="issue-detail" style="
                            background: rgba(229, 62, 62, 0.1);
                            border-left: 4px solid #e53e3e;
                            padding: 12px;
                            margin: 8px 0;
                            border-radius: 4px;
                        ">
                            <div style="font-weight: bold; color: #e2e8f0; margin-bottom: 5px;">
                                ${this.getCategoryIcon(issue.category)} ${issue.message}
                            </div>
                            ${issue.suggestion ? `
                                <div style="color: #cbd5e0; font-style: italic; margin-top: 8px;">
                                    💡 <strong>Suggestion:</strong> ${issue.suggestion}
                                </div>
                            ` : ''}
                            <div style="
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                margin-top: 10px;
                                font-size: 12px;
                                color: #a0aec0;
                            ">
                                <span>Category: ${issue.category.toUpperCase()}</span>
                                <span>Impact: -${issue.weight} points</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="line-recommendations" style="
                    background: rgba(72, 187, 120, 0.1);
                    border: 1px solid rgba(72, 187, 120, 0.3);
                    border-radius: 6px;
                    padding: 12px;
                    margin-top: 15px;
                ">
                    <h5 style="color: #e2e8f0; margin-bottom: 8px;">Improvement Recommendations:</h5>
                    <div style="color: #cbd5e0;">${this.generateLineRecommendations(rating.issues)}</div>
                </div>
            </div>
        `;
    }

    getCategoryIcon(category) {
        const icons = {
            'security': '🔒',
            'deprecation': '⚠️',
            'api': '🔧',
            'performance': '⚡',
            'quality': '✨'
        };
        return icons[category] || '❓';
    }

    generateLineRecommendations(issues) {
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

    showResults() {
        const resultsSection = document.getElementById('resultsSection');
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    hideResults() {
        const resultsSection = document.getElementById('resultsSection');
        resultsSection.style.display = 'none';
    }
}