@echo off
chcp 65001 > nul
echo ====================================
echo 🔧 تحويل الروابط للإنتاج
echo ====================================
echo.

echo ✅ تعديل ملفات JavaScript...

REM Update dashboard.html
powershell -Command "(Get-Content 'backend\static\dashboard.html') -replace 'https://syntrue-absher.onrender.com/api/', '/api/' | Set-Content 'backend\static\dashboard.html'"

REM Update operations-dashboard.html  
powershell -Command "(Get-Content 'backend\static\operations-dashboard.html') -replace 'https://syntrue-absher.onrender.com/api/', '/api/' | Set-Content 'backend\static\operations-dashboard.html'"

REM Update operations-center.html
powershell -Command "(Get-Content 'backend\static\operations-center.html') -replace 'https://syntrue-absher.onrender.com/api/', '/api/' | Set-Content 'backend\static\operations-center.html'"

REM Update analytics.html
powershell -Command "(Get-Content 'backend\static\analytics.html') -replace 'http://127.0.0.1:8000/api/', '/api/' | Set-Content 'backend\static\analytics.html'"

echo.
echo ✅ تم التحويل بنجاح!
echo.
echo الآن يمكنك رفع المشروع على Render أو أي خدمة استضافة
echo.
pause
