# تشغيل النظام مع رابط HTTPS للجوال

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "🌐 تشغيل النظام مع Localtunnel" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if npx is available
try {
    $null = Get-Command npx -ErrorAction Stop
} catch {
    Write-Host "❌ Node.js غير مثبت" -ForegroundColor Red
    Write-Host ""
    Write-Host "📥 يرجى تثبيت Node.js من: https://nodejs.org" -ForegroundColor Yellow
    Read-Host "اضغط Enter للخروج"
    exit 1
}

Write-Host "✅ بدء تشغيل السيرفر..." -ForegroundColor Green
Write-Host ""

# Start Python server
$serverProcess = Start-Process -FilePath "C:\Users\abdal\Desktop\smart-security-absher\.venv\Scripts\python.exe" `
                                -ArgumentList "C:\Users\abdal\Desktop\smart-security-absher\backend\main.py" `
                                -WorkingDirectory "C:\Users\abdal\Desktop\smart-security-absher\backend" `
                                -PassThru `
                                -NoNewWindow

# Wait for server to start
Start-Sleep -Seconds 5

Write-Host "✅ بدء Localtunnel..." -ForegroundColor Green
Write-Host ""
Write-Host "📱 سيتم إنشاء رابط HTTPS يمكنك فتحه من الجوال" -ForegroundColor Yellow
Write-Host "⚠️  احفظ الرابط الذي سيظهر وافتحه في جوالك!" -ForegroundColor Yellow
Write-Host ""

# Start localtunnel
& npx localtunnel --port 8000

# Cleanup
if ($serverProcess) {
    Stop-Process -Id $serverProcess.Id -Force
}
