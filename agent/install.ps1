# LOTIflow Agent Installer
$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "       LOTIflow Agent Installer" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

try {
    # 1. Check for Python
    try {
        $pythonVersion = python --version 2>&1
        Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ Python is not installed or not in PATH. Please install Python 3.8+ and try again." -ForegroundColor Red
        throw "Python missing"
    }

    # 2. Server Configuration
    Write-Host "`n--- Server Configuration ---" -ForegroundColor Yellow
    $ServerUrl = Read-Host "Enter LOTIflow Server URL (e.g., http://192.168.1.5:5001)"
    if ([string]::IsNullOrWhiteSpace($ServerUrl)) {
        Write-Host "❌ Server URL is required." -ForegroundColor Red
        throw "Server URL missing"
    }

    # Remove trailing slash if present
    if ($ServerUrl.EndsWith("/")) {
        $ServerUrl = $ServerUrl.Substring(0, $ServerUrl.Length - 1)
    }

    # Ensure http if not specified
    if (-not $ServerUrl.StartsWith("http")) {
        $ServerUrl = "http://$ServerUrl"
    }

    # Create Settings File
    $Settings = @{
        server_url = $ServerUrl
    }
    $SettingsJson = $Settings | ConvertTo-Json
    $SettingsJson | Out-File -FilePath "agent_settings.json" -Encoding utf8
    Write-Host "✅ Configuration saved to agent_settings.json" -ForegroundColor Green

    # 3. Install Dependencies
    Write-Host "`n📦 Installing dependencies..." -ForegroundColor Yellow
    try {
        pip install -r requirements.txt
        Write-Host "✅ Dependencies installed." -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to install dependencies. Check your internet connection." -ForegroundColor Red
        throw "Dependency failure"
    }

    # 4. Run Agent
    Write-Host "`n🚀 Starting Agent..." -ForegroundColor Cyan
    try {
        python agent_core.py
    } catch {
        Write-Host "❌ Failed to start agent." -ForegroundColor Red
    }
}
finally {
    Write-Host "`n==========================================" -ForegroundColor Cyan
    Write-Host "Done. Press any key to exit..." -ForegroundColor Cyan
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
