@echo off
cd /d "%~dp0backend"
echo.
echo ============================================
echo   نظام الأمان الذكي - Smart Security System
echo ============================================
echo.
echo جاري تشغيل السيرفر...
echo.
py -m uvicorn main_simple:app --host 0.0.0.0 --port 8080
pause
