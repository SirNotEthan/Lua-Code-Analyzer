class IssueModal {
    static show(lineNumber, issues, editor) {
        const modal = this.createModal(lineNumber, issues, editor);
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('modal-close-btn')) {
                modal.remove();
            }
        });
    }

    static createModal(lineNumber, issues, editor) {
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
        modal.innerHTML = this.createModalContent(lineNumber, issues, lineContent);
        
        return modal;
    }

    static createModalContent(lineNumber, issues, lineContent) {
        return `
            <div style="
                background: rgba(30, 30, 30, 0.98);
                border: 1px solid rgba(64, 64, 64, 0.4);
                border-radius: 12px;
                max-width: 700px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0,0,0,0.5);
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
                        background: rgba(26, 32, 44, 0.8);
                        color: #e2e8f0;
                        padding: 15px;
                        border-radius: 8px;
                        font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
                        margin-bottom: 20px;
                        font-size: 14px;
                        overflow-x: auto;
                        border: 1px solid rgba(113, 128, 150, 0.2);
                    ">
                        <div style="color: #a0aec0; font-size: 12px; margin-bottom: 5px;">Line ${lineNumber}:</div>
                        <code>${lineContent}</code>
                    </div>
                    
                    <div style="display: grid; gap: 15px;">
                        ${issues.map((issue, index) => this.createIssueCard(issue, index)).join('')}
                    </div>
                    
                    <div style="
                        margin-top: 25px;
                        padding: 15px;
                        background: linear-gradient(135deg, rgba(56, 161, 105, 0.1) 0%, rgba(72, 187, 120, 0.1) 100%);
                        border-radius: 8px;
                        border: 1px solid rgba(72, 187, 120, 0.3);
                    ">
                        <h4 style="color: #e2e8f0; margin-top: 0;">💡 Overall Recommendations:</h4>
                        ${this.generateOverallRecommendations(issues)}
                    </div>
                    
                    ${this.generateResourceSection(issues)}
                </div>
            </div>
        `;
    }

    static createIssueCard(issue, index) {
        console.log('Creating issue card for:', issue); // Debug log
        
        const severityColors = {
            'high': '#e53e3e',
            'medium': '#ed8936',
            'low': '#38a169'
        };
        
        const categoryIcons = {
            'security': '🔒',
            'deprecation': '⚠️',
            'api': '🔧',
            'performance': '⚡',
            'quality': '✨'
        };
        
        // Safely extract and detect category from message if not provided
        const message = issue.message || 'Unknown issue';
        const category = issue.category || this.detectCategory(message);
        const severity = issue.severity || 'medium';
        
        console.log('Detected category:', category, 'severity:', severity); // Debug log
        
        const color = severityColors[severity] || '#718096';
        
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
                    <span style="font-size: 18px;">${categoryIcons[category] || '❓'}</span>
                    <span>${String(category || 'GENERAL').toUpperCase()} - ${String(severity || 'MEDIUM').toUpperCase()} PRIORITY</span>
                </div>
                
                <div style="padding: 15px; background: rgba(26, 32, 44, 0.6); border-radius: 0 0 8px 8px;">
                    <div style="font-weight: bold; color: #e2e8f0; margin-bottom: 10px;">
                        ${issue.message}
                    </div>
                    
                    ${issue.suggestion ? `
                        <div style="
                            background: rgba(66, 153, 225, 0.1);
                            border-left: 4px solid #4299e1;
                            padding: 12px;
                            margin: 10px 0;
                            border-radius: 0 4px 4px 0;
                        ">
                            <div style="font-weight: bold; color: #90cdf4; margin-bottom: 5px;">
                                💡 Recommended Fix:
                            </div>
                            <div style="color: #cbd5e0;">${issue.suggestion}</div>
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
                    
                    ${this.generateSpecificAdvice(issue)}
                </div>
            </div>
        `;
    }

    static generateSpecificAdvice(issue) {
        // Ensure issue has a category
        const issueWithCategory = {
            ...issue,
            category: issue.category || this.detectCategory(issue.message)
        };
        
        const adviceData = this.getAdviceForIssue(issueWithCategory);
        if (!adviceData) return '';
        
        return `
            <div style="
                margin-top: 15px;
                padding: 0;
                background: linear-gradient(135deg, rgba(237, 137, 54, 0.1) 0%, rgba(246, 173, 85, 0.1) 100%);
                border-radius: 8px;
                border: 1px solid rgba(246, 173, 85, 0.3);
                overflow: hidden;
            ">
                <div style="padding: 12px;">
                    <div style="font-weight: bold; color: #f6ad55; margin-bottom: 8px;">
                        🎯 Detailed Explanation:
                    </div>
                    <div style="color: #cbd5e0; font-size: 14px; line-height: 1.5; margin-bottom: 12px;">${adviceData.advice}</div>
                </div>
                
                ${adviceData.codeExample ? `
                    <div style="border-top: 1px solid rgba(246, 173, 85, 0.3);">
                        <div style="padding: 10px 12px; background: rgba(0, 0, 0, 0.2); font-weight: bold; color: #f6ad55; font-size: 13px;">
                            📝 Code Example:
                        </div>
                        <div style="
                            padding: 12px;
                            background: rgba(26, 32, 44, 0.9);
                            font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
                            font-size: 12px;
                            line-height: 1.4;
                            color: #e2e8f0;
                            overflow-x: auto;
                        ">
                            <pre style="margin: 0; white-space: pre-wrap;">${adviceData.codeExample}</pre>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    static getAdviceForIssue(issue) {
        const adviceMap = {
            'security': {
                'remote event/function calls should validate data on server': {
                    advice: 'Always validate and sanitize data on the server before processing. Use type checking, range validation, and rate limiting to prevent exploitation.',
                    codeExample: `-- BAD: No validation
RemoteEvent.OnServerEvent:Connect(function(player, data)
    player.leaderstats.Money.Value = data.amount
end)

-- GOOD: Proper validation
RemoteEvent.OnServerEvent:Connect(function(player, data)
    if type(data) ~= "table" or type(data.amount) ~= "number" then
        return -- Invalid data
    end
    if data.amount < 0 or data.amount > 100 then
        return -- Invalid range
    end
    player.leaderstats.Money.Value = math.floor(data.amount)
end)`
                },
                'remote': {
                    advice: 'Remote events and functions should always validate incoming data on the server side. Never trust client input.',
                    codeExample: `-- BAD: Trusting client data
RemoteEvent.OnServerEvent:Connect(function(player, weaponDamage)
    enemy.Health = enemy.Health - weaponDamage -- Client can send any value!
end)

-- GOOD: Server validation
RemoteEvent.OnServerEvent:Connect(function(player, targetEnemy)
    local weapon = player.Character:FindFirstChild("Weapon")
    if weapon and weapon:GetAttribute("Damage") then
        targetEnemy.Health = targetEnemy.Health - weapon:GetAttribute("Damage")
    end
end)`
                },
                'security': {
                    advice: 'Security vulnerabilities can lead to exploits. Always validate data, use proper authentication, and never trust client input.',
                    codeExample: `-- BAD: Client-side security
if player.UserId == adminUserId then
    giveAdminPowers(player) -- Exploiters can fake UserId!
end

-- GOOD: Server-side verification
local adminsList = {123456, 789012} -- Store on server
if table.find(adminsList, player.UserId) then
    giveAdminPowers(player)
end`
                },
                'loadstring': {
                    advice: 'Never use loadstring() with user input. If dynamic code execution is necessary, use a whitelist approach with predefined safe functions.',
                    codeExample: `-- BAD: Direct loadstring usage
local userCode = "print('hello')"
loadstring(userCode)()

-- GOOD: Use a safe command system
local safeCommands = {
    greet = function() print("Hello!") end,
    help = function() print("Available commands: greet, help") end
}
safeCommands[userCommand]()`
                },
                'potential sensitive data in string literal': {
                    advice: 'Move API keys and sensitive data to server-side configuration files or use Roblox\'s HttpService with proper authentication headers.',
                    codeExample: `-- BAD: Hardcoded API key
local API_KEY = "sk_live_abc123..."

-- GOOD: Use server-side secure storage
local HttpService = game:GetService("HttpService")
local API_ENDPOINT = "https://api.example.com/data"
-- API key stored securely on server`
                }
            },
            'deprecation': {
                'global wait() is deprecated': {
                    advice: 'task.wait() provides better performance and more accurate timing. It doesn\'t throttle and integrates better with the task scheduler.',
                    codeExample: `-- BAD: Old deprecated wait()
wait(1)
print("After 1 second")

-- GOOD: Use task.wait()
task.wait(1)
print("After 1 second")`
                },
                'wait() is deprecated': {
                    advice: 'Use task.wait() instead of the deprecated global wait() function. It provides better performance and more reliable timing.',
                    codeExample: `-- BAD: Old wait()
while true do
    wait(0.1)
    updateGame()
end

-- GOOD: Use task.wait()
while true do
    task.wait(0.1)
    updateGame()
end`
                },
                'global spawn() is deprecated': {
                    advice: 'task.spawn() provides guaranteed execution without throttling and better error handling than the deprecated spawn() function.',
                    codeExample: `-- BAD: Old spawn()
spawn(function()
    while true do
        print("Running...")
        wait(1)
    end
end)

-- GOOD: Use task.spawn()
task.spawn(function()
    while true do
        print("Running...")
        task.wait(1)
    end
end)`
                },
                'spawn() is deprecated': {
                    advice: 'Replace spawn() with task.spawn() for better performance and guaranteed execution without throttling.',
                    codeExample: `-- BAD: Old spawn()
spawn(function()
    processData()
end)

-- GOOD: Use task.spawn()
task.spawn(function()
    processData()
end)`
                },
                'delay() is deprecated': {
                    advice: 'Use task.delay() instead of the deprecated delay() function for better performance and more reliable scheduling.',
                    codeExample: `-- BAD: Old delay()
delay(5, function()
    print("Delayed execution")
end)

-- GOOD: Use task.delay()
task.delay(5, function()
    print("Delayed execution")
end)`
                },
                'humanoid:loadanimation() is deprecated': {
                    advice: 'Use Animator:LoadAnimation() for better replication control and to avoid client-side only animation issues.',
                    codeExample: `-- BAD: Direct Humanoid:LoadAnimation()
local animation = humanoid:LoadAnimation(animationTrack)

-- GOOD: Use Animator
local animator = humanoid:FindFirstChild("Animator")
local animation = animator:LoadAnimation(animationTrack)`
                }
            },
            'performance': {
                'infinite loop detected': {
                    advice: 'Add task.wait() or RunService heartbeat connections in loops to prevent script timeout and maintain 60 FPS.',
                    codeExample: `-- BAD: Infinite loop without yield
while true do
    -- This will freeze the game!
    print("Running")
end

-- GOOD: Proper yielding loop
while true do
    print("Running")
    task.wait() -- Yields to prevent freezing
end`
                },
                'consider using generic for loops': {
                    advice: 'Generic for loops (for k,v in pairs()) are faster for sparse arrays and provide better iteration patterns.',
                    codeExample: `-- SLOWER: Numeric for loop
for i = 1, #array do
    print(array[i])
end

-- FASTER: Generic for loop
for index, value in ipairs(array) do
    print(value)
end`
                },
                'cache game service references': {
                    advice: 'Store frequently used services in local variables at script start to avoid repeated GetService() calls.',
                    codeExample: `-- BAD: Repeated GetService calls
game:GetService("Players").PlayerAdded:Connect(...)
game:GetService("Players").PlayerRemoving:Connect(...)

-- GOOD: Cache service reference
local Players = game:GetService("Players")
Players.PlayerAdded:Connect(...)
Players.PlayerRemoving:Connect(...)`
                }
            },
            'api': {
                'use workspace instead of game.workspace': {
                    advice: 'The global workspace reference is more efficient and cleaner than accessing through game.Workspace.',
                    codeExample: `-- GOOD: Use global workspace
local part = workspace.Part

-- AVOID: Accessing through game
local part = game.Workspace.Part`
                },
                'workspace': {
                    advice: 'Use the global workspace variable instead of game.Workspace for better performance and cleaner code.',
                    codeExample: `-- BAD: Long access path
local parts = game.Workspace:GetChildren()

-- GOOD: Use workspace global
local parts = workspace:GetChildren()`
                },
                'cache localplayer reference': {
                    advice: 'Store game.Players.LocalPlayer in a variable once rather than accessing it repeatedly to improve performance.',
                    codeExample: `-- BAD: Repeated LocalPlayer access
print(game.Players.LocalPlayer.Name)
print(game.Players.LocalPlayer.UserId)

-- GOOD: Cache LocalPlayer
local player = game.Players.LocalPlayer
print(player.Name)
print(player.UserId)`
                },
                'localplayer': {
                    advice: 'Cache the LocalPlayer reference instead of accessing game.Players.LocalPlayer repeatedly.',
                    codeExample: `-- BAD: Multiple accesses
if game.Players.LocalPlayer.Character then
    game.Players.LocalPlayer.Character.Humanoid.Health = 100
end

-- GOOD: Cache the reference
local player = game.Players.LocalPlayer
if player.Character then
    player.Character.Humanoid.Health = 100
end`
                },
                'service': {
                    advice: 'Cache service references at the top of your script instead of calling GetService() repeatedly.',
                    codeExample: `-- BAD: Repeated GetService calls
game:GetService("Players").PlayerAdded:Connect(...)
game:GetService("RunService").Heartbeat:Connect(...)

-- GOOD: Cache services
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
Players.PlayerAdded:Connect(...)
RunService.Heartbeat:Connect(...)`
                },
                'health modification should be done on server': {
                    advice: 'Client-side health changes can be exploited. Handle health modifications through server scripts and RemoteEvents.',
                    codeExample: `-- BAD: Client-side health change
game.Players.LocalPlayer.Character.Humanoid.Health = 100

-- GOOD: Server-side through RemoteEvent
-- Client:
ReplicatedStorage.HealthEvent:FireServer(100)
-- Server:
HealthEvent.OnServerEvent:Connect(function(player, newHealth)
    if newHealth <= player.Character.Humanoid.MaxHealth then
        player.Character.Humanoid.Health = newHealth
    end
end)`
                }
            },
            'quality': {
                'nested': {
                    advice: 'Reduce nesting levels by using early returns and extracting functions to improve code readability and maintainability.',
                    codeExample: `-- BAD: Deep nesting
function processPlayer(player)
    if player then
        if player.Character then
            if player.Character.Humanoid then
                if player.Character.Humanoid.Health > 0 then
                    -- Process alive player
                end
            end
        end
    end
end

-- GOOD: Early returns
function processPlayer(player)
    if not player then return end
    if not player.Character then return end
    if not player.Character.Humanoid then return end
    if player.Character.Humanoid.Health <= 0 then return end
    
    -- Process alive player
end`
                },
                'long function': {
                    advice: 'Break down long functions into smaller, focused functions that handle specific tasks.',
                    codeExample: `-- BAD: Long function doing everything
function gameLoop()
    updatePlayers()
    checkCollisions()
    updateUI()
    saveData()
    checkWinConditions()
    -- 50+ more lines...
end

-- GOOD: Separate responsibilities
function gameLoop()
    updateGame()
    handleUI()
    handleData()
end

function updateGame()
    updatePlayers()
    checkCollisions()
    checkWinConditions()
end`
                },
                'magic number': {
                    advice: 'Replace magic numbers with named constants to make your code more readable and maintainable.',
                    codeExample: `-- BAD: Magic numbers
if player.Level >= 50 then
    player.MaxHealth = 200
end

-- GOOD: Named constants
local MAX_LEVEL_FOR_BONUS = 50
local BONUS_HEALTH = 200

if player.Level >= MAX_LEVEL_FOR_BONUS then
    player.MaxHealth = BONUS_HEALTH
end`
                }
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

    static detectCategory(message) {
        const lowerMessage = message.toLowerCase();
        
        // Security patterns
        if (lowerMessage.includes('security') || 
            lowerMessage.includes('remote') || 
            lowerMessage.includes('loadstring') ||
            lowerMessage.includes('exploit') ||
            lowerMessage.includes('validate') ||
            lowerMessage.includes('sanitize') ||
            lowerMessage.includes('trust client') ||
            lowerMessage.includes('server') && lowerMessage.includes('validation')) {
            return 'security';
        }
        
        // Deprecation patterns
        if (lowerMessage.includes('deprecated') || 
            lowerMessage.includes('spawn()') || 
            lowerMessage.includes('wait()') ||
            lowerMessage.includes('delay()') ||
            lowerMessage.includes('loadanimation') ||
            lowerMessage.includes('bodyposition') ||
            lowerMessage.includes('bodymover') ||
            lowerMessage.includes('findpartonray')) {
            return 'deprecation';
        }
        
        // Performance patterns
        if (lowerMessage.includes('performance') || 
            lowerMessage.includes('inefficient') || 
            lowerMessage.includes('loop') ||
            lowerMessage.includes('infinite') ||
            lowerMessage.includes('cache') ||
            lowerMessage.includes('repeated') ||
            lowerMessage.includes('optimize') ||
            lowerMessage.includes('slow') ||
            lowerMessage.includes('expensive')) {
            return 'performance';
        }
        
        // API patterns
        if (lowerMessage.includes('api') || 
            lowerMessage.includes('workspace') || 
            lowerMessage.includes('service') ||
            lowerMessage.includes('localplayer') ||
            lowerMessage.includes('getservice') ||
            lowerMessage.includes('game.workspace') ||
            lowerMessage.includes('best practice')) {
            return 'api';
        }
        
        // Quality patterns
        if (lowerMessage.includes('nested') ||
            lowerMessage.includes('complex') ||
            lowerMessage.includes('refactor') ||
            lowerMessage.includes('readability') ||
            lowerMessage.includes('maintainability') ||
            lowerMessage.includes('magic number') ||
            lowerMessage.includes('long function')) {
            return 'quality';
        }
        
        return 'quality'; // Default category
    }

    static generateOverallRecommendations(issues) {
        const categories = [...new Set(issues.map(i => i.category || this.detectCategory(i.message)))];
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

    static generateResourceSection(issues) {
        const categories = [...new Set(issues.map(i => i.category || this.detectCategory(i.message)))];
        const resources = {
            'security': [
                { name: 'Roblox Security Best Practices', url: 'https://create.roblox.com/docs/production/security/security-tactics' },
                { name: 'Remote Events & Functions Security', url: 'https://create.roblox.com/docs/scripting/events/remote' },
                { name: 'Preventing Exploits Guide', url: 'https://create.roblox.com/docs/production/security/preventing-exploits' },
                { name: 'Server-Side Validation', url: 'https://create.roblox.com/docs/scripting/security/server-side-validation' }
            ],
            'deprecation': [
                { name: 'Task Scheduler Documentation', url: 'https://create.roblox.com/docs/reference/engine/libraries/task' },
                { name: 'Modern Animation System', url: 'https://create.roblox.com/docs/animation/using' },
                { name: 'Deprecated Features List', url: 'https://create.roblox.com/docs/reference/engine/deprecated' },
                { name: 'Migration Guide', url: 'https://create.roblox.com/docs/scripting/luau/migration' }
            ],
            'performance': [
                { name: 'Luau Performance Guide', url: 'https://luau-lang.org/performance' },
                { name: 'Game Optimization Best Practices', url: 'https://create.roblox.com/docs/production/game-design/optimization' },
                { name: 'Memory Management', url: 'https://create.roblox.com/docs/scripting/luau/memory' },
                { name: 'RunService Best Practices', url: 'https://create.roblox.com/docs/reference/engine/classes/RunService' }
            ],
            'api': [
                { name: 'Roblox Engine API Reference', url: 'https://create.roblox.com/docs/reference/engine' },
                { name: 'Scripting Best Practices', url: 'https://create.roblox.com/docs/scripting/scripting' },
                { name: 'Services Documentation', url: 'https://create.roblox.com/docs/reference/engine/classes/ServiceProvider' },
                { name: 'Modern Roblox Development', url: 'https://create.roblox.com/docs/scripting/luau' }
            ],
            'quality': [
                { name: 'Code Style Guide', url: 'https://roblox.github.io/lua-style-guide/' },
                { name: 'Luau Style Guide', url: 'https://luau-lang.org/style' },
                { name: 'Best Practices', url: 'https://create.roblox.com/docs/scripting/scripting' },
                { name: 'Code Review Guidelines', url: 'https://create.roblox.com/docs/production/publishing/publishing-experiences' }
            ]
        };

        const relevantResources = [];
        categories.forEach(category => {
            if (resources[category]) {
                relevantResources.push(...resources[category]);
            }
        });

        if (relevantResources.length === 0) return '';

        return `
            <div style="
                margin-top: 20px;
                padding: 15px;
                background: linear-gradient(135deg, rgba(66, 153, 225, 0.1) 0%, rgba(99, 179, 237, 0.1) 100%);
                border-radius: 8px;
                border: 1px solid rgba(66, 153, 225, 0.3);
            ">
                <h4 style="color: #e2e8f0; margin-top: 0;">📚 Helpful Resources:</h4>
                <div style="display: grid; gap: 8px;">
                    ${relevantResources.slice(0, 4).map(resource => `
                        <a href="${resource.url}" target="_blank" style="
                            color: #90cdf4;
                            text-decoration: none;
                            font-size: 14px;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            padding: 6px 0;
                            transition: color 0.2s;
                        " onmouseover="this.style.color='#63b3ed'" onmouseout="this.style.color='#90cdf4'">
                            🔗 ${resource.name}
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
    }
}