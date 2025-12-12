# نظام الأمان الذكي - دليل التشغيل السريع

## ⚠️ المشكلة الحالية
يبدو أن Python غير مثبت بشكل صحيح أو غير موجود في PATH

## ✅ الحل

### الخطوة 1: تثبيت Python
1. قم بتحميل Python من: https://www.python.org/downloads/
2. تأكد من تحديد "Add Python to PATH" أثناء التثبيت
3. أعد تشغيل PowerShell

### الخطوة 2: تثبيت المكتبات
```bash
cd backend
python -m pip install fastapi uvicorn
```

### الخطوة 3: تشغيل السيرفر
```bash
cd backend
python main_simple.py
```

## 🚀 روابط سريعة بعد التشغيل

- Dashboard: https://syntrue-absher.onrender.com
- Operations Center: https://syntrue-absher.onrender.com/static/operations-center.html
- Officer Device: https://syntrue-absher.onrender.com/static/officer-device.html?id=officer_1
- Analytics: https://syntrue-absher.onrender.com/static/analytics.html

## 📱 للاستخدام على الجوال

1. شغل السيرفر على الكمبيوتر
2. اعرف IP الكمبيوتر: `ipconfig`
3. على الجوال افتح: `http://192.168.x.x:8000/static/officer-device.html?id=officer_1`

## ✨ الميزات المنفذة

✅ نظام الإشعارات الصوتية
✅ تطبيق PWA (قابل للتثبيت على الجوال)
✅ GPS الحقيقي
✅ Push Notifications
✅ قاعدة بيانات SQLite
✅ نظام المستخدمين (في main.py الكامل)
✅ لوحة الإدارة

## 🔧 استكشاف الأخطاء

### إذا لم يعمل السيرفر:
```bash
# تأكد من تثبيت المكتبات
python -m pip list | findstr fastapi

# إذا لم تظهر، ثبتها:
python -m pip install fastapi uvicorn
```

### إذا ظهر خطأ في قاعدة البيانات:
```bash
# احذف الملف واتركه يُنشأ من جديد
del smart_security.db
python main_simple.py
```

## 📞 للدعم
راجع الملفات:
- FEATURES-v2.md - قائمة الميزات الكاملة
- IMPLEMENTATION-STATUS.md - حالة التنفيذ
