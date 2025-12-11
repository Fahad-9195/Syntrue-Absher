@echo off
chcp 65001 > nul
echo ====================================
echo 📦 ضغط المشروع للرفع
echo ====================================
echo.

echo ⏳ جاري ضغط الملفات...

REM إنشاء ملف ZIP يحتوي على backend فقط
powershell -Command "Compress-Archive -Path 'backend\*' -DestinationPath 'synture-project.zip' -Force"

echo.
echo ✅ تم إنشاء الملف: synture-project.zip
echo.
echo 📤 الآن:
echo 1. اذهب إلى https://www.pythonanywhere.com
echo 2. سجل حساب باسم: synture
echo 3. ارفع ملف synture-project.zip
echo 4. اتبع الدليل في: دليل-الرفع-المجاني.md
echo.

pause
