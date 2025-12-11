# 🚀 دليل سريع لرفع المشروع

## خطوات بسيطة:

### 1. سجل في Render:
https://render.com/signup

### 2. سجل في GitHub (إذا ما عندك):
https://github.com/signup

### 3. حمل GitHub Desktop:
https://desktop.github.com

### 4. ارفع المشروع:
- افتح GitHub Desktop
- File → Add Local Repository
- اختر مجلد المشروع
- Publish repository
- اسمه: smart-security-absher

### 5. اربط مع Render:
- في Render اضغط "New +"
- Web Service
- Connect GitHub
- اختر smart-security-absher

### 6. الإعدادات:
```
Name: smart-security-absher
Environment: Python 3
Build Command: pip install -r backend/requirements.txt
Start Command: cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
```

### 7. اضغط Create Web Service

### 8. انتظر 2-3 دقائق

### 9. جاهز! 🎉

رابطك: https://smart-security-absher.onrender.com

---

## ملاحظة:
قبل الرفع شغل:
```
تحويل-للإنتاج.bat
```

هذا راح يحول الروابط من localhost للإنتاج
