import sqlite3
import os
import time
from typing import List, Dict, Any, Optional, Tuple

DB_PATH = os.path.join(os.path.dirname(__file__), "trustcall.db")

def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Table for Trust Log records
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS trust_log (
        log_index INTEGER PRIMARY KEY,
        call_id TEXT NOT NULL,
        transcript TEXT NOT NULL,
        risk_score REAL NOT NULL,
        action TEXT NOT NULL,
        timestamp REAL NOT NULL,
        previous_hash TEXT NOT NULL,
        record_hash TEXT NOT NULL,
        tampered INTEGER DEFAULT 0
    );
    """)
    
    # Table for EWMA call sessions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS call_sessions (
        call_id TEXT PRIMARY KEY,
        running_score REAL NOT NULL,
        turn_count INTEGER NOT NULL,
        updated_at REAL NOT NULL
    );
    """)

    # Table for Privacy & Consent (Guard 5)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_consent (
        user_id TEXT PRIMARY KEY,
        consented INTEGER NOT NULL,
        updated_at REAL NOT NULL
    );
    """)
    
    conn.commit()
    conn.close()

def insert_trust_log(record_dict: Dict[str, Any]):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO trust_log (log_index, call_id, transcript, risk_score, action, timestamp, previous_hash, record_hash, tampered)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    """, (
        record_dict["index"],
        record_dict["call_id"],
        record_dict["transcript"],
        record_dict["risk_score"],
        record_dict["action"],
        record_dict["timestamp"],
        record_dict["previous_hash"],
        record_dict["record_hash"]
    ))
    conn.commit()
    conn.close()

def get_all_trust_logs() -> List[Dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM trust_log ORDER BY log_index ASC")
    rows = cursor.fetchall()
    conn.close()
    
    results = []
    for r in rows:
        results.append({
            "index": r["log_index"],
            "call_id": r["call_id"],
            "transcript": r["transcript"],
            "risk_score": r["risk_score"],
            "action": r["action"],
            "timestamp": r["timestamp"],
            "previous_hash": r["previous_hash"],
            "record_hash": r["record_hash"],
            "tampered": bool(r["tampered"])
        })
    return results

def get_trust_log_by_index(log_index: int) -> Optional[Dict[str, Any]]:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM trust_log WHERE log_index = ?", (log_index,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return {
        "index": row["log_index"],
        "call_id": row["call_id"],
        "transcript": row["transcript"],
        "risk_score": row["risk_score"],
        "action": row["action"],
        "timestamp": row["timestamp"],
        "previous_hash": row["previous_hash"],
        "record_hash": row["record_hash"],
        "tampered": bool(row["tampered"])
    }

def tamper_trust_log_record(log_index: int, new_transcript: str = "TAMPERED: I am sending money now", new_score: float = 0.0) -> Optional[Dict[str, Any]]:
    """
    Intentionally mutates a stored record to simulate database tampering for demo purposes.
    """
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE trust_log 
        SET transcript = ?, risk_score = ?, tampered = 1 
        WHERE log_index = ?
    """, (new_transcript, new_score, log_index))
    conn.commit()
    conn.close()
    return get_trust_log_by_index(log_index)

def update_call_ewma(call_id: str, new_score: float) -> Tuple[float, int]:
    """
    EWMA Formula: new_running = 0.6 * new_score + 0.4 * old_running
    If first turn, running_score = new_score.
    """
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT running_score, turn_count FROM call_sessions WHERE call_id = ?", (call_id,))
    row = cursor.fetchone()
    
    now = time.time()
    if row is None:
        running_score = round(float(new_score), 2)
        turn_count = 1
        cursor.execute("""
            INSERT INTO call_sessions (call_id, running_score, turn_count, updated_at)
            VALUES (?, ?, ?, ?)
        """, (call_id, running_score, turn_count, now))
    else:
        old_running = row["running_score"]
        turn_count = row["turn_count"] + 1
        running_score = round(0.6 * float(new_score) + 0.4 * float(old_running), 2)
        cursor.execute("""
            UPDATE call_sessions
            SET running_score = ?, turn_count = ?, updated_at = ?
            WHERE call_id = ?
        """, (running_score, turn_count, now, call_id))
        
    conn.commit()
    conn.close()
    return running_score, turn_count

def set_user_consent_db(user_id: str, consented: bool):
    conn = get_db()
    cursor = conn.cursor()
    now = time.time()
    cursor.execute("""
        INSERT INTO user_consent (user_id, consented, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET consented=excluded.consented, updated_at=excluded.updated_at
    """, (user_id, 1 if consented else 0, now))
    conn.commit()
    conn.close()

def get_user_consent_db(user_id: str) -> bool:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT consented FROM user_consent WHERE user_id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return True # Default opt-in unless explicitly withdrawn
    return bool(row["consented"])

def delete_user_data_db(user_id: str) -> int:
    conn = get_db()
    cursor = conn.cursor()
    # Delete logs and sessions matching user_id pattern or user_id
    cursor.execute("DELETE FROM trust_log WHERE call_id LIKE ?", (f"%{user_id}%",))
    count1 = cursor.rowcount
    cursor.execute("DELETE FROM call_sessions WHERE call_id LIKE ?", (f"%{user_id}%",))
    count2 = cursor.rowcount
    cursor.execute("DELETE FROM user_consent WHERE user_id = ?", (user_id,))
    conn.commit()
    conn.close()
    return count1 + count2
