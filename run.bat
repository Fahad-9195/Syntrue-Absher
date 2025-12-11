@echo off
REM شغّال لوحة الأمان الذكي - Smart Security Dashboard

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║     🔒 لوحة الأمان الذكي - Smart Security Dashboard      ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0backend"

echo [1] فحص البيئة الافتراضية...
if not exist ".venv" (
    echo ❌ البيئة الافتراضية غير موجودة
    echo [*] جاري إنشاء البيئة الافتراضية...
    python -m venv .venv
    echo ✅ تم إنشاء البيئة
)

echo.
echo [2] تفعيل البيئة الافتراضية...
call .venv\Scripts\activate.bat

echo.
echo [3] تثبيت المتطلبات...
pip install -q -r requirements.txt

echo.
echo [4] تشغيل الخادم...
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                  🚀 الخادم قيد التشغيل                    ║
echo ║                                                            ║
echo ║  📱 لوحة التحكم (الافتراضية):                             ║
echo ║     https://syntrue-absher.onrender.com/static/dashboard-absher.html    ║
echo ║                                                            ║
echo ║  📱 لوحة التحكم (بسيطة):                                  ║
echo ║     https://syntrue-absher.onrender.com/static/dashboard-simple.html    ║
echo ║                                                            ║
echo ║  📚 توثيق API التفاعلي:                                   ║
echo ║     https://syntrue-absher.onrender.com/docs                            ║
echo ║                                                            ║
echo ║  ⏹  اضغط Ctrl+C لإيقاف الخادم                           ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

echo.
echo [!] تم إيقاف الخادم
pause
