import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional
import json
import database as db

# Simple password hashing (for development - use passlib in production)
def hash_password(password: str) -> str:
    """Hash a password using SHA256"""
    salt = secrets.token_hex(16)
    password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{salt}${password_hash}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    try:
        salt, password_hash = hashed_password.split('$')
        return hashlib.sha256((plain_password + salt).encode()).hexdigest() == password_hash
    except:
        return False

# Simple JWT implementation (for development - use python-jose in production)
SECRET_KEY = "smart-security-absher-secret-key-change-in-production"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create simple access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire.isoformat()})
    # Simple encoding - in production use real JWT
    token_data = json.dumps(to_encode)
    return hashlib.sha256((token_data + SECRET_KEY).encode()).hexdigest() + "." + token_data.encode().hex()

def decode_access_token(token: str) -> Optional[dict]:
    """Decode and verify simple token"""
    try:
        parts = token.split('.')
        if len(parts) != 2:
            return None
        
        signature, data_hex = parts
        token_data = bytes.fromhex(data_hex).decode()
        
        # Verify signature
        expected_sig = hashlib.sha256((token_data + SECRET_KEY).encode()).hexdigest()
        if signature != expected_sig:
            return None
        
        payload = json.loads(token_data)
        
        # Check expiration
        exp = datetime.fromisoformat(payload.get('exp', ''))
        if datetime.utcnow() > exp:
            return None
        
        return payload
    except:
        return None

def create_user(username: str, password: str, role: str, full_name: str, email: Optional[str] = None, officer_id: Optional[str] = None) -> int:
    """Create a new user"""
    password_hash = hash_password(password)
    
    with db.get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO users (username, password_hash, role, full_name, email, officer_id)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (username, password_hash, role, full_name, email, officer_id))
        conn.commit()
        return cursor.lastrowid

def authenticate_user(username: str, password: str) -> Optional[dict]:
    """Authenticate user and return user data"""
    with db.get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE username = ? AND is_active = 1', (username,))
        user = cursor.fetchone()
        
        if not user:
            return None
        
        if not verify_password(password, user['password_hash']):
            return None
        
        # Update last login
        cursor.execute('UPDATE users SET last_login = ? WHERE id = ?', 
                      (datetime.utcnow().isoformat(), user['id']))
        conn.commit()
        
        return dict(user)

def get_user_by_id(user_id: int) -> Optional[dict]:
    """Get user by ID"""
    with db.get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
        user = cursor.fetchone()
        return dict(user) if user else None

def get_all_users() -> list:
    """Get all users"""
    with db.get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT id, username, role, full_name, email, is_active, created_at, last_login FROM users')
        return [dict(row) for row in cursor.fetchall()]

def update_user_status(user_id: int, is_active: bool) -> bool:
    """Activate or deactivate a user"""
    with db.get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('UPDATE users SET is_active = ? WHERE id = ?', (is_active, user_id))
        conn.commit()
        return True

def change_password(user_id: int, new_password: str) -> bool:
    """Change user password"""
    password_hash = hash_password(new_password)
    
    with db.get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('UPDATE users SET password_hash = ? WHERE id = ?', (password_hash, user_id))
        conn.commit()
        return True

def log_activity(user_id: Optional[int], action: str, entity_type: Optional[str] = None, 
                entity_id: Optional[str] = None, details: Optional[str] = None, 
                ip_address: Optional[str] = None) -> int:
    """Log user activity"""
    with db.get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO activity_log (user_id, action, entity_type, entity_id, details, ip_address)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (user_id, action, entity_type, entity_id, details, ip_address))
        conn.commit()
        return cursor.lastrowid

# Initialize default admin user
def init_default_users():
    """Create default admin user if not exists"""
    with db.get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) as count FROM users WHERE role = ?', ('admin',))
        admin_count = cursor.fetchone()['count']
        
        if admin_count == 0:
            create_user(
                username='admin',
                password='admin123',
                role='admin',
                full_name='المسؤول العام',
                email='admin@absher.sa'
            )
            print("✅ Default admin user created: username=admin, password=admin123")
            
        # Create supervisor
        cursor.execute('SELECT COUNT(*) as count FROM users WHERE role = ?', ('supervisor',))
        supervisor_count = cursor.fetchone()['count']
        
        if supervisor_count == 0:
            create_user(
                username='supervisor',
                password='super123',
                role='supervisor',
                full_name='المشرف الأمني',
                email='supervisor@absher.sa'
            )
            print("✅ Default supervisor user created: username=supervisor, password=super123")

# Run on import
init_default_users()
