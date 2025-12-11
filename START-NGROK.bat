@echo off
chcp 65001 > nul
echo ====================================
echo 🌐 تشغيل النظام مع Ngrok (بدون كلمة مرور)
echo ====================================
echo.

echo ✅ بدء تشغيل السيرفر...
echo.

REM Start Python server in background
start /B cmd /c "cd backend && ..\.venv\Scripts\python.exe main.py"

REM Wait for server to start
timeout /t 5 /nobreak > nul

echo ✅ بدء Ngrok...
echo.
echo 📱 سيتم إنشاء رابط HTTPS بدون كلمة مرور
echo ⚠️  انسخ الرابط اللي راح يظهر وارسله للناس
echo.

REM Start ngrok from Windows path
"C:\Program Files\WindowsApps\ngrok.ngrok_3.24.0.0_x64__1g87z0zv29zzc\ngrok.exe" http 8000

pause
