# شغّال لوحة الأمان الذكي - Smart Security Dashboard

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     🔒 لوحة الأمان الذكي - Smart Security Dashboard      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$backendPath = Join-Path $PSScriptRoot "backend"
Set-Location $backendPath

Write-Host "[1] فحص البيئة الافتراضية..." -ForegroundColor Yellow
if (-not (Test-Path ".\.venv")) {
    Write-Host "❌ البيئة الافتراضية غير موجودة" -ForegroundColor Red
    Write-Host "[*] جاري إنشاء البيئة الافتراضية..." -ForegroundColor Yellow
    python -m venv .venv
    Write-Host "✅ تم إنشاء البيئة" -ForegroundColor Green
}

Write-Host "`n[2] تفعيل البيئة الافتراضية..." -ForegroundColor Yellow
& .\.venv\Scripts\Activate.ps1

Write-Host "`n[3] تثبيت المتطلبات..." -ForegroundColor Yellow
pip install -q -r requirements.txt

Write-Host "`n[4] تشغيل الخادم..." -ForegroundColor Yellow
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                  🚀 الخادم قيد التشغيل                    ║" -ForegroundColor Green
Write-Host "║                                                            ║" -ForegroundColor Green
Write-Host "║  📱 لوحة التحكم (الافتراضية):                             ║" -ForegroundColor Green
Write-Host "║     https://syntrue-absher.onrender.com/static/dashboard-absher.html    ║" -ForegroundColor Cyan
Write-Host "║                                                            ║" -ForegroundColor Green
Write-Host "║  📱 لوحة التحكم (بسيطة):                                  ║" -ForegroundColor Green
Write-Host "║     https://syntrue-absher.onrender.com/static/dashboard-simple.html    ║" -ForegroundColor Cyan
Write-Host "║                                                            ║" -ForegroundColor Green
Write-Host "║  📚 توثيق API التفاعلي:                                   ║" -ForegroundColor Green
Write-Host "║     https://syntrue-absher.onrender.com/docs                            ║" -ForegroundColor Cyan
Write-Host "║                                                            ║" -ForegroundColor Green
Write-Host "║  ⏹  اضغط Ctrl+C لإيقاف الخادم                           ║" -ForegroundColor Yellow
Write-Host "║                                                            ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
