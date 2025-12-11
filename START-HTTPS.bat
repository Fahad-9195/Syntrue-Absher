@echo off
chcp 65001 > nul
echo ====================================
echo 🌐 تشغيل النظام مع رابط HTTPS
echo ====================================
echo.

REM Check if ngrok is installed
where ngrok >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ ngrok غير مثبت
    echo.
    echo 📥 يرجى تثبيت ngrok من:
    echo https://ngrok.com/download
    echo.
    echo أو استخدم npm install -g localtunnel
    pause
    exit /b 1
)

echo ✅ بدء تشغيل السيرفر...
echo.

REM Start Python server in background
start /B cmd /c "cd backend && ..\.venv\Scripts\python.exe main.py"

REM Wait for server to start
timeout /t 3 /nobreak > nul

echo ✅ بدء Ngrok...
echo.

REM Start ngrok
ngrok http 8000

pause
