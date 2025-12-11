# 📝 دليل المطور - نظام الأمان الذكي

## 🏗️ هيكل المشروع

```
smart-security-absher/
├── backend/                    # الخادم الخلفي
│   ├── main.py                # نقطة الدخول الرئيسية + API Routes
│   ├── auth.py                # نظام المصادقة والتوكنات
│   ├── database.py            # قاعدة البيانات الأساسية
│   ├── events_management.py   # نظام إدارة الفعاليات (9 جداول)
│   ├── requirements.txt       # المكتبات المطلوبة
│   ├── smart_security.db      # قاعدة بيانات SQLite
│   └── static/                # الواجهات الأمامية
│       ├── welcome.html       # صفحة الترحيب (نقطة البداية)
│       ├── home-login.html    # تسجيل دخول الأفراد
│       ├── dashboard.html     # لوحة الأفراد
│       ├── operations-login.html  # تسجيل دخول الأمن
│       ├── operations-center.html # مركز العمليات
│       └── events-dashboard.html  # إدارة الفعاليات
├── .venv/                     # البيئة الافتراضية (محلي فقط)
├── .gitignore                 # ملفات Git المتجاهلة
├── LICENSE                    # ترخيص MIT
├── README.md                  # التوثيق الرئيسي
├── QUICKSTART.md              # دليل البدء السريع
├── START.bat                  # ملف تشغيل سريع (Windows)
├── render.yaml                # إعدادات النشر على Render
└── requirements.txt           # نسخة احتياطية
```

## 🔧 التقنيات

### Backend
- **FastAPI 2.0** - إطار عمل Web حديث وسريع
- **Uvicorn** - خادم ASGI
- **SQLite** - قاعدة بيانات خفيفة
- **Pydantic** - التحقق من البيانات
- **Python-Jose** - JWT Tokens

### Frontend
- **Vanilla JavaScript** - بدون أطر عمل
- **Leaflet.js** - خرائط تفاعلية
- **Leaflet.heat** - خرائط حرارية
- **Font Awesome 6.4** - أيقونات

## 📊 قاعدة البيانات

### database.py (الجداول الأساسية)
- `events` - جدول الأحداث الأمنية
- `officers` - جدول الدوريات
- `resolutions` - حلول البلاغات

### events_management.py (جداول الفعاليات)
- `seasonal_events` - الفعاليات الموسمية
- `event_participants` - المشاركون (الحجاج)
- `iot_devices` - أجهزة IoT
- `biometric_data` - البيانات البيومترية
- `access_logs` - سجلات الدخول
- `location_tracking` - تتبع المواقع
- `security_alerts` - التنبيهات الأمنية
- `fraud_attempts` - محاولات الاحتيال
- `access_credentials` - بيانات الاعتماد

## 🔐 نظام المصادقة

### للأفراد
```javascript
localStorage.setItem('homeAuth', 'true');
// Username: home
// Password: home123
```

### للأمن الميداني
```javascript
localStorage.setItem('opsAuth', 'true');
// Username: ops
// Password: ops123
```

## 🛣️ API Endpoints

### الأحداث الأساسية
```
GET    /api/events              # جميع الأحداث
POST   /api/events              # إضافة حدث
GET    /api/officers            # جميع الدوريات
POST   /api/resolutions         # إضافة حل
GET    /api/resolutions/stats   # إحصائيات الحلول
```

### إدارة الفعاليات
```
POST   /api/events/seasonal/create              # إنشاء فعالية
GET    /api/events/seasonal/list                # قائمة الفعاليات
POST   /api/events/seasonal/participants        # تسجيل مشارك
POST   /api/events/seasonal/iot-devices         # تسجيل جهاز IoT
POST   /api/events/seasonal/biometric           # تسجيل بيومتري
POST   /api/events/seasonal/access-log          # سجل دخول
POST   /api/events/seasonal/location-track      # تتبع موقع
POST   /api/events/seasonal/security-alert      # تنبيه أمني
POST   /api/events/seasonal/fraud-attempt       # محاولة احتيال
```

## 🚀 التطوير المحلي

```bash
# 1. إنشاء بيئة افتراضية
python -m venv .venv

# 2. تفعيل البيئة
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Linux/Mac

# 3. تثبيت المكتبات
cd backend
pip install -r requirements.txt

# 4. تشغيل الخادم
python main.py

# 5. فتح المتصفح
# http://localhost:8000
```

## 🌐 النشر على Render

1. ارفع على GitHub
2. سجل في [Render.com](https://render.com)
3. اختر "New Web Service"
4. اربط المستودع
5. Render سيقرأ `render.yaml` تلقائياً
6. انقر Deploy

## 🔄 سير العمل

```
1. المستخدم → welcome.html
2. اختيار: أفراد / أمن ميداني
3. تسجيل دخول
4. Dashboard المناسب
5. للأمن: يمكن الوصول لإدارة الفعاليات
```

## 📝 ملاحظات مهمة

- الـ database يُنشأ تلقائياً عند أول تشغيل
- جميع الواجهات تستخدم polling كل 3 ثوانٍ
- localStorage يُستخدم للمصادقة (للتطوير فقط)
- في الإنتاج: استخدم JWT tokens حقيقية

## 🐛 استكشاف الأخطاء

### الخادم لا يعمل؟
```bash
# تحقق من Python
python --version  # يجب أن يكون 3.11+

# تحقق من المكتبات
pip list

# أعد التثبيت
pip install -r requirements.txt --force-reinstall
```

### قاعدة البيانات تالفة؟
```bash
# احذف وأعد الإنشاء
rm backend/smart_security.db
python backend/main.py
```

## 📦 إضافة ميزة جديدة

1. أضف النموذج (Model) في `main.py`
2. أضف الـ endpoint
3. أضف الواجهة في `static/`
4. اختبر محلياً
5. ارفع على Git
6. Render سينشر تلقائياً

---

**Happy Coding! 🚀**
