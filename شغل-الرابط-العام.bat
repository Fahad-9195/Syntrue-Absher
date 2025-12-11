@echo off
chcp 65001 > nul
cls
echo.
echo ╔════════════════════════════════════════════════╗
echo ║   🚀 نظام الأمان الذكي - فريق Synture        ║
echo ║   📱 تشغيل الرابط العام للجوال               ║
echo ╚════════════════════════════════════════════════╝
echo.
echo ⏳ جاري التشغيل...
echo.

REM Start Python server in background
start /min cmd /c "cd backend && ..\.venv\Scripts\python.exe main.py"

REM Wait for server to start
timeout /t 5 /nobreak > nul

cls
echo.
echo ╔════════════════════════════════════════════════╗
echo ║   ✅ السيرفر شغال!                            ║
echo ╚════════════════════════════════════════════════╝
echo.
echo 📡 جاري إنشاء الرابط العام...
echo.
echo ════════════════════════════════════════════════
echo.

REM Start localtunnel
npx -y localtunnel --port 8000 --subdomain synture

echo.
echo ════════════════════════════════════════════════
echo.
echo ⚠️  إذا طلب منك تأكيد عند فتح الرابط:
echo    فقط اضغط على الزر الأزرق "Click to Submit"
echo.
echo 💡 الرابط: https://synture.loca.lt
echo.
echo ════════════════════════════════════════════════
pause
