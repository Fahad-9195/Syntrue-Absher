import sqlite3
import json
from datetime import datetime
from typing import Optional, List, Dict, Any
from contextlib import contextmanager

DATABASE_PATH = "smart_security.db"

@contextmanager
def get_db():
    """Context manager for database connection"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def init_database():
    """Initialize database tables"""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Events table
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
                resolved_at TEXT,
                resolved_by TEXT,
                resolution_notes TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Officers table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS officers (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                badge_number TEXT UNIQUE NOT NULL,
                rank TEXT,
                phone TEXT,
                email TEXT,
                status TEXT DEFAULT 'active',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Users table (for authentication)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL,
                full_name TEXT,
                email TEXT,
                officer_id TEXT,
                is_active BOOLEAN DEFAULT 1,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                last_login TEXT,
                FOREIGN KEY (officer_id) REFERENCES officers(id)
            )
        ''')
        
        # Danger zones table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS danger_zones (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                center_lat REAL NOT NULL,
                center_lng REAL NOT NULL,
                radius REAL NOT NULL,
                severity TEXT DEFAULT 'medium',
                description TEXT,
                is_active BOOLEAN DEFAULT 1,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Messages table (for internal communication)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                from_user_id INTEGER,
                to_user_id INTEGER,
                to_officer_id TEXT,
                subject TEXT,
                body TEXT NOT NULL,
                is_broadcast BOOLEAN DEFAULT 0,
                is_read BOOLEAN DEFAULT 0,
                priority TEXT DEFAULT 'normal',
                sent_at TEXT DEFAULT CURRENT_TIMESTAMP,
                read_at TEXT,
                FOREIGN KEY (from_user_id) REFERENCES users(id),
                FOREIGN KEY (to_user_id) REFERENCES users(id),
                FOREIGN KEY (to_officer_id) REFERENCES officers(id)
            )
        ''')
        
        # Activity log table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS activity_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                action TEXT NOT NULL,
                entity_type TEXT,
                entity_id TEXT,
                details TEXT,
                ip_address TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        ''')
        
        # Resolutions table (track all resolved issues)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS resolutions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id INTEGER,
                device_id TEXT NOT NULL,
                device_name TEXT,
                original_type TEXT NOT NULL,
                original_level TEXT NOT NULL,
                resolved_at TEXT DEFAULT CURRENT_TIMESTAMP,
                resolved_by TEXT,
                resolution_type TEXT,
                notes TEXT,
                response_time_seconds INTEGER,
                FOREIGN KEY (event_id) REFERENCES events(id)
            )
        ''')
        
        conn.commit()
        print("✅ Database initialized successfully")

# ===== Event Operations =====

def add_event(event_data: Dict[str, Any]) -> int:
    """Add a new event to the database"""
    with get_db() as conn:
        cursor = conn.cursor()
        
        location_json = json.dumps(event_data.get('location')) if event_data.get('location') else None
        
        cursor.execute('''
            INSERT INTO events (timestamp, device_id, type, level, status, home_id, absher_id, location)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            event_data.get('timestamp', datetime.utcnow().isoformat()),
            event_data['device_id'],
            event_data['type'],
            event_data['level'],
            event_data.get('status', 'open'),
            event_data.get('home_id'),
            event_data.get('absher_id'),
            location_json
        ))
        
        conn.commit()
        return cursor.lastrowid

def get_events(limit: Optional[int] = 1000, status: Optional[str] = None) -> List[Dict]:
    """Get events from database"""
    with get_db() as conn:
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
        
        events = []
        for row in rows:
            event = dict(row)
            if event['location']:
                event['location'] = json.loads(event['location'])
            events.append(event)
        
        return events

def resolve_all_events() -> int:
    """Mark all open events as resolved"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('UPDATE events SET status = ? WHERE status = ?', ('resolved', 'open'))
        conn.commit()
        return cursor.rowcount

def update_event(event_id: int, event_data: Dict[str, Any]) -> bool:
    """Update an existing event"""
    with get_db() as conn:
        cursor = conn.cursor()
        
        location_json = json.dumps(event_data.get('location')) if event_data.get('location') else None
        
        cursor.execute('''
            UPDATE events 
            SET timestamp = ?,
                device_id = ?,
                type = ?,
                level = ?,
                status = ?,
                home_id = ?,
                absher_id = ?,
                location = ?
            WHERE id = ?
        ''', (
            event_data.get('timestamp', datetime.utcnow().isoformat()),
            event_data['device_id'],
            event_data['type'],
            event_data['level'],
            event_data.get('status', 'open'),
            event_data.get('home_id'),
            event_data.get('absher_id'),
            location_json,
            event_id
        ))
        
        conn.commit()
        return cursor.rowcount > 0

def delete_all_events() -> bool:
    """Delete all events"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('DELETE FROM events')
        conn.commit()
        return True

def add_resolution(resolution_data: Dict[str, Any]) -> int:
    """Add a resolution record"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO resolutions 
            (event_id, device_id, device_name, original_type, original_level, 
             resolved_by, resolution_type, notes, response_time_seconds)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            resolution_data.get('event_id'),
            resolution_data['device_id'],
            resolution_data.get('device_name'),
            resolution_data['original_type'],
            resolution_data['original_level'],
            resolution_data.get('resolved_by', 'system'),
            resolution_data.get('resolution_type', 'manual'),
            resolution_data.get('notes'),
            resolution_data.get('response_time_seconds')
        ))
        conn.commit()
        return cursor.lastrowid

def get_resolutions(limit: int = 100) -> List[Dict]:
    """Get recent resolutions"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM resolutions 
            ORDER BY resolved_at DESC 
            LIMIT ?
        ''', (limit,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

def get_resolution_stats() -> Dict[str, Any]:
    """Get resolution statistics"""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Total resolutions
        cursor.execute('SELECT COUNT(*) as total FROM resolutions')
        total = cursor.fetchone()['total']
        
        # Average response time
        cursor.execute('SELECT AVG(response_time_seconds) as avg_time FROM resolutions WHERE response_time_seconds IS NOT NULL')
        avg_time = cursor.fetchone()['avg_time'] or 0
        
        # Resolutions by type
        cursor.execute('''
            SELECT original_level, COUNT(*) as count 
            FROM resolutions 
            GROUP BY original_level
        ''')
        by_level = {row['original_level']: row['count'] for row in cursor.fetchall()}
        
        # Resolutions today
        cursor.execute('''
            SELECT COUNT(*) as today 
            FROM resolutions 
            WHERE date(resolved_at) = date('now')
        ''')
        today = cursor.fetchone()['today']
        
        return {
            'total': total,
            'average_response_time': round(avg_time, 1),
            'by_level': by_level,
            'today': today
        }

# ===== Officer Operations =====

def add_officer(officer_data: Dict[str, Any]) -> str:
    """Add a new officer"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO officers (id, name, badge_number, rank, phone, email)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            officer_data['id'],
            officer_data['name'],
            officer_data['badge_number'],
            officer_data.get('rank'),
            officer_data.get('phone'),
            officer_data.get('email')
        ))
        conn.commit()
        return officer_data['id']

def get_officers() -> List[Dict]:
    """Get all officers"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM officers WHERE status = ?', ('active',))
        return [dict(row) for row in cursor.fetchall()]

def get_officer(officer_id: str) -> Optional[Dict]:
    """Get single officer"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM officers WHERE id = ?', (officer_id,))
        row = cursor.fetchone()
        return dict(row) if row else None

# ===== Statistics =====

def get_statistics() -> Dict:
    """Get system statistics"""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Total events
        cursor.execute('SELECT COUNT(*) as count FROM events')
        total_events = cursor.fetchone()['count']
        
        # Events by level
        cursor.execute('''
            SELECT level, COUNT(*) as count 
            FROM events 
            GROUP BY level
        ''')
        events_by_level = {row['level']: row['count'] for row in cursor.fetchall()}
        
        # Events by status
        cursor.execute('''
            SELECT status, COUNT(*) as count 
            FROM events 
            GROUP BY status
        ''')
        events_by_status = {row['status']: row['count'] for row in cursor.fetchall()}
        
        # Active officers
        cursor.execute('SELECT COUNT(*) as count FROM officers WHERE status = ?', ('active',))
        total_officers = cursor.fetchone()['count']
        
        # Recent events (last 24 hours)
        cursor.execute('''
            SELECT COUNT(*) as count 
            FROM events 
            WHERE datetime(timestamp) >= datetime('now', '-1 day')
        ''')
        recent_events = cursor.fetchone()['count']
        
        return {
            'total_events': total_events,
            'events_by_level': events_by_level,
            'events_by_status': events_by_status,
            'total_officers': total_officers,
            'recent_events_24h': recent_events
        }

# Initialize database on import
init_database()
