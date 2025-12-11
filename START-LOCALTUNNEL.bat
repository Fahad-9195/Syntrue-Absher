@echo off
chcp 65001 > nul
echo ====================================
echo 🌐 تشغيل النظام مع Localtunnel
echo ====================================
echo.

REM Check if Node.js and npx are installed
where npx >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js غير مثبت
    echo.
    echo 📥 يرجى تثبيت Node.js من:
    echo https://nodejs.org
    pause
    exit /b 1
)

echo ✅ بدء تشغيل السيرفر...
echo.

REM Start Python server in background
start /B cmd /c "cd backend && ..\.venv\Scripts\python.exe main.py"

REM Wait for server to start
timeout /t 5 /nobreak > nul

echo ✅ بدء Localtunnel...
echo.
echo 📱 سيتم إنشاء رابط HTTPS يمكنك فتحه من الجوال
echo.
echo 🚀 الرابط: https://synture.loca.lt
echo.

REM Start localtunnel with custom subdomain
npx localtunnel --port 8000 --subdomain synture

echo.
echo "رابط الدخول: https://your-link.loca.lt/static/operations-login.html"
echo.
echo "لإنشاء حساب على Ngrok، يرجى زيارة الرابط التالي:"
echo "https://dashboard.ngrok.com/signup"

pause
