class ExampleManager {
    constructor(editor) {
        this.editor = editor;
        this.examples = [
            {
                name: 'Security Vulnerabilities',
                description: 'Examples of common security issues that can be exploited',
                difficulty: 'High Risk',
                icon: '🔒',
                color: '#e53e3e',
                tags: ['Security', 'Exploits', 'Remote Events'],
                code: `-- Security Vulnerabilities Example
-- This script demonstrates common security issues

local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local player = Players.LocalPlayer
local remoteEvent = ReplicatedStorage:WaitForChild("ProcessData")

-- SECURITY ISSUE: Hardcoded API keys (never do this!)
local API_KEY = "sk_live_abcd1234567890efgh1234567890ijkl"
local SECRET_TOKEN = "bearer_xyz789abc123def456ghi789"

-- SECURITY ISSUE: Unvalidated remote calls
remoteEvent:FireServer({
    userId = player.UserId,
    coins = 999999,  -- Client can set any amount!
    level = 100,     -- Client controls their level!
    items = {"Sword", "Shield", "Legendary Staff"}
})

-- SECURITY ISSUE: Dynamic code execution
local maliciousCode = 'game.Players:GetPlayers()[1]:Kick("Hacked!")'
loadstring(maliciousCode)()  -- Never do this!

-- SECURITY ISSUE: Unsafe HTTP requests
local response = HttpService:GetAsync("http://suspicious-site.com/api/user-data")
local userData = HttpService:JSONDecode(response)

-- SECURITY ISSUE: Client-side health manipulation
player.Character.Humanoid.Health = 0

-- SECURITY ISSUE: Sensitive data exposure
local dataToSend = {
    password = "mySecretPassword123",
    creditCard = "4532-1234-5678-9012",
    apiKey = API_KEY
}
HttpService:PostAsync("https://external-api.com/submit", HttpService:JSONEncode(dataToSend))`
            },
            {
                name: 'Legacy Script (Many Issues)',
                description: 'Common deprecated APIs and poor practices from older code',
                difficulty: 'Medium',
                icon: '⚠️',
                color: '#ed8936',
                tags: ['Deprecated', 'Legacy', 'Performance'],
                code: `-- Legacy Script with Multiple Issues
-- This demonstrates outdated patterns that should be updated

local player = game.Players.LocalPlayer
local character = player.Character or player.CharacterAdded:Wait()
local humanoid = character:WaitForChild("Humanoid")

-- DEPRECATED: Global spawn() function
spawn(function()
    while true do
        wait(1)  -- DEPRECATED: Global wait() function
        print("Loop running every second")
    end
end)

-- DEPRECATED: Global delay() function  
delay(5, function()
    print("Delayed execution")
end)

-- DEPRECATED: Humanoid:LoadAnimation()
local animation = Instance.new("Animation")
animation.AnimationId = "rbxassetid://123456789"
local animTrack = humanoid:LoadAnimation(animation)  -- Use Animator instead

-- DEPRECATED: BodyMover objects
local bodyVelocity = Instance.new("BodyVelocity")
bodyVelocity.MaxForce = Vector3.new(4000, 4000, 4000)
bodyVelocity.Velocity = Vector3.new(0, 50, 0)
bodyVelocity.Parent = character.HumanoidRootPart

-- API ISSUE: Unvalidated remote call
game.ReplicatedStorage.RemoteEvent:FireServer("unvalidated_data")

-- DEPRECATED: Old raycasting method
local ray = Ray.new(character.HumanoidRootPart.Position, Vector3.new(0, -10, 0))
local hit, position = workspace:FindPartOnRay(ray)  -- Use workspace:Raycast() instead

-- PERFORMANCE ISSUE: Repeated service access
print(game:GetService("Players").LocalPlayer.Name)
print(game:GetService("Players").LocalPlayer.UserId)
print(game:GetService("Players").LocalPlayer.Team)

-- QUALITY ISSUE: Long function with deep nesting
function processPlayerData(playerData)
    if playerData then
        if playerData.character then
            if playerData.character.humanoid then
                if playerData.character.humanoid.health > 0 then
                    if playerData.coins > 100 then
                        if playerData.level > 10 then
                            print("Player meets all requirements")
                        end
                    end
                end
            end
        end
    end
end`
            },
            {
                name: 'Performance Problems',
                description: 'Inefficient code patterns that hurt game performance',
                difficulty: 'High Impact',
                icon: '⚡',
                color: '#4299e1',
                tags: ['Performance', 'Optimization', 'Loops'],
                code: `-- Performance Problems Example
-- This script shows common performance bottlenecks

local Players = game:GetService("Players")
local Workspace = game:GetService("Workspace")

local player = Players.LocalPlayer

-- PERFORMANCE ISSUE: Infinite loop without yielding
while true do
    wait(0.03)  -- Very short wait = high CPU usage
    
    -- PERFORMANCE ISSUE: Mass instance creation in loop
    for i = 1, 500 do
        local part = Instance.new("Part")
        part.Name = "Part" .. i
        part.Size = Vector3.new(1, 1, 1)
        part.Position = Vector3.new(math.random(-50, 50), 10, math.random(-50, 50))
        part.Parent = workspace
        
        -- PERFORMANCE ISSUE: Nested expensive operations
        for _, otherPart in pairs(workspace:GetChildren()) do
            if otherPart:IsA("Part") and otherPart ~= part then
                local distance = (part.Position - otherPart.Position).Magnitude
                if distance < 5 then
                    part.BrickColor = BrickColor.Red()
                end
            end
        end
    end
    
    -- PERFORMANCE ISSUE: Inefficient string operations
    local allParts = {}
    for _, obj in pairs(workspace:GetChildren()) do
        if obj:IsA("Part") then
            table.insert(allParts, obj.Name .. " at " .. tostring(obj.Position))
        end
    end
    local partList = table.concat(allParts, ", ")  -- Better, but still wasteful
    print("Parts: " .. partList)
end

-- PERFORMANCE ISSUE: Repeated service calls
spawn(function()
    while true do
        local runService = game:GetService("RunService")  -- Cache this!
        local players = game:GetService("Players")        -- Cache this!
        local lighting = game:GetService("Lighting")      -- Cache this!
        wait(0.1)
    end
end)

-- PERFORMANCE ISSUE: Expensive operations in tight loop
local function findNearestPlayer()
    local myPosition = player.Character.HumanoidRootPart.Position
    local nearestDistance = math.huge
    
    -- This runs every frame - very expensive!
    for _, otherPlayer in pairs(Players:GetPlayers()) do
        if otherPlayer ~= player and otherPlayer.Character then
            local distance = (myPosition - otherPlayer.Character.HumanoidRootPart.Position).Magnitude
            if distance < nearestDistance then
                nearestDistance = distance
            end
        end
    end
    
    return nearestDistance
end

-- BAD: Running expensive function every heartbeat
game:GetService("RunService").Heartbeat:Connect(function()
    local distance = findNearestPlayer()  -- This is too expensive for 60 FPS!
    print("Nearest player distance: " .. distance)
end)`
            },
            {
                name: 'Modern Best Practices',
                description: 'Clean, efficient code following current Roblox standards',
                difficulty: 'Best Practice',
                icon: '✨',
                color: '#38a169',
                tags: ['Modern', 'Best Practices', 'Optimized'],
                code: `-- Modern Best Practices Example
-- This demonstrates current Roblox development standards

-- Cache services at the top (best practice)
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local player = Players.LocalPlayer
local remoteEvent = ReplicatedStorage:WaitForChild("ValidatedRemote")

-- Proper character loading
local character = player.CharacterAdded:Wait()
local humanoid = character:WaitForChild("Humanoid")
local animator = humanoid:WaitForChild("Animator")  -- Use Animator, not Humanoid
local rootPart = character:WaitForChild("HumanoidRootPart")

-- Modern animation system
local animation = Instance.new("Animation")
animation.AnimationId = "rbxassetid://123456789"
local animationTrack = animator:LoadAnimation(animation)  -- Correct way

-- Modern physics constraints instead of BodyMovers
local attachment = Instance.new("Attachment")
attachment.Name = "MovementAttachment"
attachment.Parent = rootPart

local linearVelocity = Instance.new("LinearVelocity")
linearVelocity.Attachment0 = attachment
linearVelocity.MaxForce = 4000
linearVelocity.VectorVelocity = Vector3.new(0, 0, 0)
linearVelocity.Parent = rootPart

-- Validated remote communication
local function validateAndSendData(data)
    -- Client-side validation (server should validate too)
    if type(data) == "table" and data.action and type(data.action) == "string" then
        remoteEvent:FireServer(data)
    else
        warn("Invalid data format")
    end
end

-- Modern raycasting with RaycastParams
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

-- Connection management (important for cleanup)
local connections = {}

-- Efficient heartbeat connection
connections.heartbeat = RunService.Heartbeat:Connect(function()
    local hit, position = performRaycast()
    if hit then
        -- Do something with the hit
        linearVelocity.VectorVelocity = Vector3.new(0, 0, 0)
    end
end)

-- Proper cleanup when player leaves
connections.playerRemoving = Players.PlayerRemoving:Connect(function(leavingPlayer)
    if leavingPlayer == player then
        -- Clean up animations
        if animationTrack then
            animationTrack:Stop()
        end
        
        -- Clean up physics objects
        if linearVelocity then
            linearVelocity:Destroy()
        end
        
        -- Disconnect all connections
        for _, connection in pairs(connections) do
            if connection then
                connection:Disconnect()
            end
        end
    end
end)

-- Modern task library usage (not global functions)
task.spawn(function()
    while character and character.Parent do
        task.wait(1)  -- Modern replacement for wait()
        
        -- Send validated heartbeat data
        validateAndSendData({
            action = "heartbeat",
            timestamp = tick()
        })
    end
end)

-- Efficient service usage pattern
local function createOptimizedPart()
    local part = Instance.new("Part")
    part.Name = "OptimizedPart"
    part.Size = Vector3.new(4, 1, 2)
    part.Material = Enum.Material.Plastic
    part.BrickColor = BrickColor.new("Bright blue")
    part.Position = rootPart.Position + Vector3.new(0, 5, 0)
    part.Parent = workspace
    
    -- Use TweenService for smooth animations
    local tween = TweenService:Create(part, 
        TweenInfo.new(2, Enum.EasingStyle.Bounce, Enum.EasingDirection.Out),
        {Position = part.Position + Vector3.new(0, 10, 0)}
    )
    
    tween:Play()
    return part
end

-- Example of proper error handling
local function safeRemoteCall(data)
    local success, result = pcall(function()
        return remoteEvent:InvokeServer(data)
    end)
    
    if success then
        return result
    else
        warn("Remote call failed:", result)
        return nil
    end
end`
            },
            {
                name: 'GUI System Example',
                description: 'Professional GUI creation with proper practices',
                difficulty: 'Advanced',
                icon: '🎨',
                color: '#9f7aea',
                tags: ['GUI', 'Interface', 'User Experience'],
                code: `-- Professional GUI System Example
-- Demonstrates modern GUI development practices

local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")
local UserInputService = game:GetService("UserInputService")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

-- Main GUI container
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "MainInterface"
screenGui.ResetOnSpawn = false
screenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
screenGui.Parent = playerGui

-- Main frame with modern styling
local mainFrame = Instance.new("Frame")
mainFrame.Name = "MainFrame"
mainFrame.Size = UDim2.new(0, 400, 0, 300)
mainFrame.Position = UDim2.new(0.5, -200, 0.5, -150)
mainFrame.BackgroundColor3 = Color3.fromRGB(45, 45, 45)
mainFrame.BorderSizePixel = 0
mainFrame.Parent = screenGui

-- Rounded corners
local corner = Instance.new("UICorner")
corner.CornerRadius = UDim.new(0, 12)
corner.Parent = mainFrame

-- Drop shadow effect
local shadow = Instance.new("ImageLabel")
shadow.Name = "Shadow"
shadow.Size = UDim2.new(1, 20, 1, 20)
shadow.Position = UDim2.new(0, -10, 0, -10)
shadow.BackgroundTransparency = 1
shadow.Image = "rbxasset://textures/ui/GuiImagePlaceholder.png"  -- Replace with shadow image
shadow.ImageTransparency = 0.8
shadow.ZIndex = -1
shadow.Parent = mainFrame

-- Header section
local header = Instance.new("Frame")
header.Name = "Header"
header.Size = UDim2.new(1, 0, 0, 60)
header.Position = UDim2.new(0, 0, 0, 0)
header.BackgroundColor3 = Color3.fromRGB(70, 130, 250)
header.BorderSizePixel = 0
header.Parent = mainFrame

local headerCorner = Instance.new("UICorner")
headerCorner.CornerRadius = UDim.new(0, 12)
headerCorner.Parent = header

-- Fix header corner to only round top
local headerFix = Instance.new("Frame")
headerFix.Size = UDim2.new(1, 0, 0, 20)
headerFix.Position = UDim2.new(0, 0, 1, -20)
headerFix.BackgroundColor3 = Color3.fromRGB(70, 130, 250)
headerFix.BorderSizePixel = 0
headerFix.Parent = header

-- Title with modern typography
local titleLabel = Instance.new("TextLabel")
titleLabel.Name = "Title"
titleLabel.Size = UDim2.new(1, -100, 1, 0)
titleLabel.Position = UDim2.new(0, 20, 0, 0)
titleLabel.BackgroundTransparency = 1
titleLabel.Text = "Game Interface"
titleLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
titleLabel.TextScaled = true
titleLabel.Font = Enum.Font.GothamBold
titleLabel.TextXAlignment = Enum.TextXAlignment.Left
titleLabel.Parent = header

-- Modern close button
local closeButton = Instance.new("TextButton")
closeButton.Name = "CloseButton"
closeButton.Size = UDim2.new(0, 32, 0, 32)
closeButton.Position = UDim2.new(1, -46, 0.5, -16)
closeButton.BackgroundColor3 = Color3.fromRGB(220, 53, 69)
closeButton.Text = "✕"
closeButton.TextColor3 = Color3.fromRGB(255, 255, 255)
closeButton.TextScaled = true
closeButton.Font = Enum.Font.GothamBold
closeButton.BorderSizePixel = 0
closeButton.Parent = header

local closeCorner = Instance.new("UICorner")
closeCorner.CornerRadius = UDim.new(0.5, 0)
closeCorner.Parent = closeButton

-- Content area
local content = Instance.new("ScrollingFrame")
content.Name = "Content"
content.Size = UDim2.new(1, -20, 1, -80)
content.Position = UDim2.new(0, 10, 0, 70)
content.BackgroundTransparency = 1
content.BorderSizePixel = 0
content.ScrollBarThickness = 6
content.ScrollBarImageColor3 = Color3.fromRGB(100, 100, 100)
content.Parent = mainFrame

-- List layout for content
local listLayout = Instance.new("UIListLayout")
listLayout.SortOrder = Enum.SortOrder.LayoutOrder
listLayout.Padding = UDim.new(0, 10)
listLayout.Parent = content

-- Example content items
for i = 1, 5 do
    local item = Instance.new("Frame")
    item.Name = "Item" .. i
    item.Size = UDim2.new(1, -12, 0, 50)
    item.BackgroundColor3 = Color3.fromRGB(60, 60, 60)
    item.BorderSizePixel = 0
    item.LayoutOrder = i
    item.Parent = content
    
    local itemCorner = Instance.new("UICorner")
    itemCorner.CornerRadius = UDim.new(0, 8)
    itemCorner.Parent = item
    
    local itemLabel = Instance.new("TextLabel")
    itemLabel.Size = UDim2.new(1, -20, 1, 0)
    itemLabel.Position = UDim2.new(0, 10, 0, 0)
    itemLabel.BackgroundTransparency = 1
    itemLabel.Text = "Example Item " .. i
    itemLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
    itemLabel.Font = Enum.Font.Gotham
    itemLabel.TextSize = 14
    itemLabel.TextXAlignment = Enum.TextXAlignment.Left
    itemLabel.Parent = item
end

-- Update scroll canvas size
content.CanvasSize = UDim2.new(0, 0, 0, listLayout.AbsoluteContentSize.Y)
listLayout:GetPropertyChangedSignal("AbsoluteContentSize"):Connect(function()
    content.CanvasSize = UDim2.new(0, 0, 0, listLayout.AbsoluteContentSize.Y)
end)

-- Animation functions
local function animateButton(button, hoverScale)
    hoverScale = hoverScale or 1.1
    
    local connections = {}
    
    connections.mouseEnter = button.MouseEnter:Connect(function()
        local tween = TweenService:Create(button, 
            TweenInfo.new(0.2, Enum.EasingStyle.Quart, Enum.EasingDirection.Out),
            {Size = button.Size * hoverScale, BackgroundColor3 = button.BackgroundColor3:lerp(Color3.fromRGB(255, 255, 255), 0.1)}
        )
        tween:Play()
    end)
    
    connections.mouseLeave = button.MouseLeave:Connect(function())
        local tween = TweenService:Create(button,
            TweenInfo.new(0.2, Enum.EasingStyle.Quart, Enum.EasingDirection.Out),
            {Size = button.Size / hoverScale, BackgroundColor3 = Color3.fromRGB(220, 53, 69)}
        )
        tween:Play()
    end)
    
    return connections
end

local function slideIn()
    mainFrame.Position = UDim2.new(0.5, -200, -1, 0)
    mainFrame.Visible = true
    
    local tween = TweenService:Create(mainFrame,
        TweenInfo.new(0.6, Enum.EasingStyle.Back, Enum.EasingDirection.Out),
        {Position = UDim2.new(0.5, -200, 0.5, -150)}
    )
    tween:Play()
end

local function slideOut()
    local tween = TweenService:Create(mainFrame,
        TweenInfo.new(0.4, Enum.EasingStyle.Back, Enum.EasingDirection.In),
        {Position = UDim2.new(0.5, -200, 1.5, 0)}
    )
    tween:Play()
    
    tween.Completed:Connect(function()
        screenGui:Destroy()
    end)
end

-- Set up button animations and events
local buttonConnections = animateButton(closeButton, 1.15)
closeButton.Activated:Connect(slideOut)

-- Keyboard shortcuts
UserInputService.InputBegan:Connect(function(input, gameProcessed)
    if not gameProcessed then
        if input.KeyCode == Enum.KeyCode.E then
            if screenGui.Parent then
                slideOut()
            end
        elseif input.KeyCode == Enum.KeyCode.Escape then
            slideOut()
        end
    end
end)

-- Initialize with animation
slideIn()

-- Cleanup function
local function cleanup()
    for _, connection in pairs(buttonConnections) do
        if connection then
            connection:Disconnect()
        end
    end
end

-- Auto-cleanup when player leaves
Players.PlayerRemoving:Connect(function(leavingPlayer)
    if leavingPlayer == player then
        cleanup()
    end
end)`
            },
            {
                name: 'DataStore Best Practices',
                description: 'Safe and efficient data persistence patterns',
                difficulty: 'Advanced',
                icon: '💾',
                color: '#38b2ac',
                tags: ['DataStore', 'Persistence', 'Error Handling'],
                code: `-- DataStore Best Practices Example
-- Demonstrates safe, efficient data persistence

local Players = game:GetService("Players")
local DataStoreService = game:GetService("DataStoreService")
local RunService = game:GetService("RunService")

-- Version your datastores for safe updates
local playerDataStore = DataStoreService:GetDataStore("PlayerData_v3")

-- Define default data structure
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
    achievements = {},
    lastLogin = 0,
    playTime = 0
}

-- Cache and operation tracking
local playerDataCache = {}
local pendingSaves = {}
local saveQueue = {}

-- Utility function for deep copying
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

-- Data validation function
local function validatePlayerData(data)
    if type(data) ~= "table" then return false end
    
    -- Check required fields
    if type(data.coins) ~= "number" or data.coins < 0 then return false end
    if type(data.level) ~= "number" or data.level < 1 or data.level > 1000 then return false end
    if type(data.experience) ~= "number" or data.experience < 0 then return false end
    if type(data.inventory) ~= "table" then return false end
    if type(data.settings) ~= "table" then return false end
    
    -- Validate inventory size (prevent abuse)
    if #data.inventory > 100 then return false end
    
    -- Validate coins (prevent unrealistic values)
    if data.coins > 1000000 then return false end
    
    return true
end

-- Safe data loading with retry logic
local function loadPlayerData(player)
    local userId = player.UserId
    local attempts = 0
    local maxAttempts = 3
    
    while attempts < maxAttempts do
        attempts = attempts + 1
        
        local success, data = pcall(function()
            return playerDataStore:GetAsync(userId)
        end)
        
        if success then
            if data and validatePlayerData(data) then
                -- Migrate old data if needed
                data = migrateDataIfNeeded(data)
                data.lastLogin = tick()
                playerDataCache[userId] = data
                return data
            else
                -- No data or invalid data - use defaults
                local newData = deepCopy(defaultPlayerData)
                newData.lastLogin = tick()
                playerDataCache[userId] = newData
                return newData
            end
        else
            warn("Failed to load data for " .. player.Name .. " (attempt " .. attempts .. "): " .. tostring(data))
            if attempts >= maxAttempts then
                -- Use default data on final failure
                local defaultData = deepCopy(defaultPlayerData)
                defaultData.lastLogin = tick()
                playerDataCache[userId] = defaultData
                return defaultData
            else
                task.wait(2 ^ attempts) -- Exponential backoff
            end
        end
    end
end

-- Data migration for version updates
local function migrateDataIfNeeded(data)
    -- Example migration: add new field if it doesn't exist
    if not data.achievements then
        data.achievements = {}
    end
    
    if not data.playTime then
        data.playTime = 0
    end
    
    -- Fix any data type issues from older versions
    if type(data.settings) ~= "table" then
        data.settings = deepCopy(defaultPlayerData.settings)
    end
    
    return data
end

-- Queue-based saving system to prevent data loss
local function queuePlayerSave(player)
    local userId = player.UserId
    if not playerDataCache[userId] then return end
    
    -- Add to save queue if not already there
    if not pendingSaves[userId] then
        pendingSaves[userId] = true
        table.insert(saveQueue, {player = player, data = deepCopy(playerDataCache[userId])})
    end
end

-- Process save queue
local function processSaveQueue()
    while #saveQueue > 0 do
        local saveData = table.remove(saveQueue, 1)
        local player = saveData.player
        local data = saveData.data
        local userId = player.UserId
        
        local attempts = 0
        local maxAttempts = 3
        local saved = false
        
        while attempts < maxAttempts and not saved do
            attempts = attempts + 1
            
            local success, errorMsg = pcall(function()
                playerDataStore:SetAsync(userId, data)
            end)
            
            if success then
                saved = true
                print("Successfully saved data for " .. player.Name)
            else
                warn("Failed to save data for " .. player.Name .. " (attempt " .. attempts .. "): " .. errorMsg)
                if attempts < maxAttempts then
                    task.wait(2 ^ attempts) -- Exponential backoff
                end
            end
        end
        
        if not saved then
            -- Re-queue for later attempt
            table.insert(saveQueue, saveData)
            warn("Re-queuing save for " .. player.Name)
        end
        
        pendingSaves[userId] = nil
        task.wait(0.1) -- Rate limiting
    end
end

-- Public API functions
local function getPlayerData(player)
    return playerDataCache[player.UserId]
end

local function updatePlayerData(player, key, value)
    local data = playerDataCache[player.UserId]
    if data and data[key] ~= nil then
        data[key] = value
        queuePlayerSave(player)
        return true
    end
    return false
end

local function incrementPlayerData(player, key, amount)
    local data = playerDataCache[player.UserId]
    if data and type(data[key]) == "number" then
        data[key] = math.max(0, data[key] + amount)
        queuePlayerSave(player)
        return data[key]
    end
    return nil
end

-- Event handlers
Players.PlayerAdded:Connect(function(player)
    -- Load data asynchronously
    task.spawn(function()
        loadPlayerData(player)
        
        -- Track play time
        local joinTime = tick()
        player.AncestryChanged:Connect(function()
            if not player.Parent then
                local data = playerDataCache[player.UserId]
                if data then
                    data.playTime = (data.playTime or 0) + (tick() - joinTime)
                end
            end
        end)
    end)
end)

Players.PlayerRemoving:Connect(function(player)
    queuePlayerSave(player)
    -- Keep data in cache briefly for final save
    task.wait(5)
    playerDataCache[player.UserId] = nil
end)

-- Auto-save system
task.spawn(function()
    while true do
        task.wait(300) -- Auto-save every 5 minutes
        for userId, _ in pairs(playerDataCache) do
            local player = Players:GetPlayerByUserId(userId)
            if player then
                queuePlayerSave(player)
            end
        end
    end
end)

-- Save queue processor
task.spawn(processSaveQueue)

-- Shutdown handler
game:BindToClose(function()
    print("Server shutting down, saving all player data...")
    
    -- Queue all players for save
    for userId, _ in pairs(playerDataCache) do
        local player = Players:GetPlayerByUserId(userId)
        if player then
            queuePlayerSave(player)
        end
    end
    
    -- Process remaining saves
    local timeout = 30
    local start = tick()
    
    while #saveQueue > 0 and tick() - start < timeout do
        processSaveQueue()
        task.wait(0.1)
    end
    
    print("Data save complete. Remaining unsaved: " .. #saveQueue)
end)

-- Example usage functions
local function giveCoins(player, amount)
    return incrementPlayerData(player, "coins", amount)
end

local function addToInventory(player, item)
    local data = getPlayerData(player)
    if data and data.inventory then
        if #data.inventory < 100 then -- Prevent inventory overflow
            table.insert(data.inventory, item)
            queuePlayerSave(player)
            return true
        end
    end
    return false
end

-- Export public functions
return {
    getPlayerData = getPlayerData,
    updatePlayerData = updatePlayerData,
    incrementPlayerData = incrementPlayerData,
    giveCoins = giveCoins,
    addToInventory = addToInventory
}`
            }
        ];
    }

    showExampleModal() {
        const modal = this.createExampleModal();
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('modal-close')) {
                modal.remove();
            }
            
            if (e.target.classList.contains('example-card') || e.target.closest('.example-card')) {
                const card = e.target.closest('.example-card') || e.target;
                const index = parseInt(card.dataset.index);
                if (!isNaN(index) && this.examples[index]) {
                    this.loadExample(this.examples[index]);
                    modal.remove();
                }
            }
        });
    }

    createExampleModal() {
        const modal = document.createElement('div');
        modal.className = 'example-modal';
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
            z-index: 10000;
            backdrop-filter: blur(4px);
        `;
        
        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 20px;
                max-width: 1000px;
                width: 95%;
                max-height: 90vh;
                overflow: hidden;
                box-shadow: 0 25px 80px rgba(0,0,0,0.5);
                position: relative;
            ">
                <div style="
                    background: rgba(255,255,255,0.1);
                    backdrop-filter: blur(10px);
                    padding: 25px;
                    border-bottom: 1px solid rgba(255,255,255,0.2);
                    position: relative;
                ">
                    <h2 style="
                        color: white;
                        margin: 0;
                        font-size: 24px;
                        font-weight: bold;
                        text-align: center;
                    ">
                        📚 Load Example Scripts
                    </h2>
                    <p style="
                        color: rgba(255,255,255,0.9);
                        margin: 8px 0 0 0;
                        text-align: center;
                        font-size: 16px;
                    ">
                        Choose an example to demonstrate different analysis features and learn best practices
                    </p>
                    <button class="modal-close" style="
                        position: absolute;
                        top: 15px;
                        right: 20px;
                        background: rgba(255,255,255,0.2);
                        border: none;
                        color: white;
                        width: 35px;
                        height: 35px;
                        border-radius: 50%;
                        cursor: pointer;
                        font-size: 20px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.3s ease;
                    ">×</button>
                </div>
                
                <div style="
                    padding: 30px;
                    background: rgba(30, 30, 30, 0.95);
                    max-height: calc(90vh - 120px);
                    overflow-y: auto;
                ">
                    <div style="
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                        gap: 20px;
                    ">
                        ${this.examples.map((example, index) => this.createExampleCard(example, index)).join('')}
                    </div>
                </div>
            </div>
        `;
        
        return modal;
    }

    createExampleCard(example, index) {
        return `
            <div class="example-card" data-index="${index}" style="
                background: rgba(26, 32, 44, 0.9);
                border: 2px solid ${example.color}40;
                border-radius: 16px;
                padding: 24px;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                position: relative;
                overflow: hidden;
            " onmouseenter="this.style.background='rgba(26, 32, 44, 1)'; this.style.transform='translateY(-4px)'" onmouseleave="this.style.background='rgba(26, 32, 44, 0.9)'; this.style.transform='translateY(0)'">
                <div style="
                    position: absolute;
                    top: -10px;
                    right: -10px;
                    width: 60px;
                    height: 60px;
                    background: ${example.color};
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    opacity: 0.1;
                ">
                    ${example.icon}
                </div>
                
                <div style="
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 16px;
                ">
                    <div style="
                        width: 50px;
                        height: 50px;
                        background: ${example.color};
                        border-radius: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 24px;
                        color: white;
                        box-shadow: 0 4px 12px ${example.color}40;
                    ">
                        ${example.icon}
                    </div>
                    <div>
                        <h3 style="
                            margin: 0;
                            color: #e2e8f0;
                            font-size: 18px;
                            font-weight: bold;
                        ">
                            ${example.name}
                        </h3>
                        <div style="
                            background: ${example.color}20;
                            color: ${example.color};
                            padding: 4px 12px;
                            border-radius: 20px;
                            font-size: 12px;
                            font-weight: bold;
                            margin-top: 4px;
                            display: inline-block;
                        ">
                            ${example.difficulty}
                        </div>
                    </div>
                </div>
                
                <p style="
                    color: #cbd5e0;
                    font-size: 14px;
                    line-height: 1.6;
                    margin-bottom: 16px;
                    min-height: 60px;
                ">
                    ${example.description}
                </p>
                
                <div style="
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-bottom: 16px;
                ">
                    ${example.tags.map(tag => `
                        <span style="
                            background: rgba(45, 55, 72, 0.6);
                            color: #a0aec0;
                            padding: 4px 10px;
                            border-radius: 12px;
                            font-size: 12px;
                            font-weight: 500;
                            border: 1px solid rgba(113, 128, 150, 0.3);
                        ">${tag}</span>
                    `).join('')}
                </div>
                
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding-top: 16px;
                    border-top: 1px solid rgba(113, 128, 150, 0.2);
                ">
                    <div style="
                        color: #a0aec0;
                        font-size: 13px;
                    ">
                        ${example.code.split('\n').length} lines of code
                    </div>
                    <div style="
                        background: ${example.color};
                        color: white;
                        padding: 8px 16px;
                        border-radius: 20px;
                        font-size: 13px;
                        font-weight: bold;
                        transition: all 0.3s ease;
                    ">
                        Load Example →
                    </div>
                </div>
            </div>
        `;
    }

    loadExample(example) {
        if (this.editor.getValue().trim() && 
            !confirm(`Loading "${example.name}" will replace current content. Continue?`)) {
            return;
        }
        
        this.editor.setValue(example.code);
        this.showSuccessNotification(`Loaded: ${example.name}`, example.icon);
        
        // Clear any existing highlights
        if (window.editorHighlighting) {
            window.editorHighlighting.clearHighlights();
        }
        
        // Hide results section
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.style.display = 'none';
        }
    }

    showSuccessNotification(message, icon = '✅') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #38a169 0%, #48bb78 100%);
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            z-index: 10001;
            box-shadow: 0 10px 30px rgba(56, 161, 105, 0.3);
            animation: slideInRight 0.4s ease;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 10px;
            max-width: 350px;
        `;
        
        notification.innerHTML = `
            <span style="font-size: 20px;">${icon}</span>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.4s ease';
            setTimeout(() => notification.remove(), 400);
        }, 3000);
    }
}