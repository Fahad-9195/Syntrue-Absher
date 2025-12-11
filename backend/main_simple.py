from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import sqlite3
import json

app = FastAPI(title="Smart Security System - Absher", version="2.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple database connection
def get_db():
    conn = sqlite3.connect("smart_security.db")
    conn.row_factory = sqlite3.Row
    return conn

# Initialize database
def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            device_id TEXT NOT NULL,
            type TEXT NOT NULL,
            level TEXT NOT NULL,
            status TEXT DEFAULT 'open',
            home_id TEXT,
            absher_id TEXT,
            location TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS officers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            badge_number TEXT UNIQUE NOT NULL,
            rank TEXT,
            phone TEXT,
            email TEXT,
            status TEXT DEFAULT 'active',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()
    print("✅ Database initialized")

# Models
class Event(BaseModel):
    timestamp: Optional[str] = None
    device_id: str
    type: str
    level: str
    status: str = "open"
    home_id: Optional[str] = None
    absher_id: Optional[str] = None
    location: Optional[Dict[str, Any]] = None

class Officer(BaseModel):
    id: str
    name: str
    badge_number: str
    rank: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

# API Endpoints
@app.get("/api/events")
def get_events(limit: int = 1000, status: Optional[str] = None):
    """Get all events"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        query = 'SELECT * FROM events'
        params = []
        
        if status:
            query += ' WHERE status = ?'
            params.append(status)
        
        query += ' ORDER BY timestamp DESC LIMIT ?'
        params.append(limit)
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        
        events = []
        for row in rows:
            event = dict(row)
            if event.get('location'):
                try:
                    event['location'] = json.loads(event['location'])
                except:
                    pass
            events.append(event)
        
        return events
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/events")
def add_event(ev: Event):
    """Add new event"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        location_json = json.dumps(ev.location) if ev.location else None
        timestamp = ev.timestamp or datetime.utcnow().isoformat()
        
        cursor.execute('''
            INSERT INTO events (timestamp, device_id, type, level, status, home_id, absher_id, location)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (timestamp, ev.device_id, ev.type, ev.level, ev.status, ev.home_id, ev.absher_id, location_json))
        
        conn.commit()
        event_id = cursor.lastrowid
        conn.close()
        
        return {"ok": True, "id": event_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/events/resolve_all")
def resolve_all():
    """Resolve all events"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('UPDATE events SET status = ? WHERE status = ?', ('resolved', 'open'))
        count = cursor.rowcount
        conn.commit()
        conn.close()
        return {"resolved": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/events/reset")
@app.post("/reset")
def reset_events():
    """Delete all events"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM events')
        conn.commit()
        conn.close()
        return {"reset": True, "message": "تم مسح جميع الأحداث"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/statistics")
def get_statistics():
    """Get statistics"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('SELECT COUNT(*) as count FROM events')
        total_events = cursor.fetchone()['count']
        
        cursor.execute('SELECT level, COUNT(*) as count FROM events GROUP BY level')
        events_by_level = {row['level']: row['count'] for row in cursor.fetchall()}
        
        cursor.execute('SELECT COUNT(*) as count FROM officers WHERE status = ?', ('active',))
        total_officers = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM events WHERE datetime(timestamp) >= datetime('now', '-1 day')")
        recent_events = cursor.fetchone()['count']
        
        conn.close()
        
        return {
            'total_events': total_events,
            'events_by_level': events_by_level,
            'total_officers': total_officers,
            'recent_events_24h': recent_events
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/officers")
def get_officers():
    """Get all officers"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM officers WHERE status = ?', ('active',))
        officers = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return officers
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/officers")
def add_officer(officer: Officer):
    """Add new officer"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO officers (id, name, badge_number, rank, phone, email)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (officer.id, officer.name, officer.badge_number, officer.rank, officer.phone, officer.email))
        conn.commit()
        conn.close()
        return {"ok": True, "id": officer.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Static files
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def root():
    return FileResponse("static/dashboard-absher.html")

# Initialize DB
init_db()

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Smart Security System - Absher Edition")
    print("📊 Dashboard: https://syntrue-absher.onrender.com")
    print("🗺️  Operations Center: https://syntrue-absher.onrender.com/static/operations-center.html")
    print("📱 Officer Device: https://syntrue-absher.onrender.com/static/officer-device.html?id=officer_1")
    print("📈 Analytics: https://syntrue-absher.onrender.com/static/analytics.html")
    uvicorn.run(app, host="0.0.0.0", port=8000)
