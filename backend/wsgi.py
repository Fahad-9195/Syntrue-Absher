"""
WSGI Configuration for PythonAnywhere
نسخ هذا الملف إلى WSGI configuration file في PythonAnywhere
"""

import sys
import os

# إضافة مسار المشروع
path = '/home/synture/backend'
if path not in sys.path:
    sys.path.insert(0, path)

# تحميل قاعدة البيانات
from database import init_db
init_db()

# تحميل FastAPI application
from main import app

# WSGI application
application = app
