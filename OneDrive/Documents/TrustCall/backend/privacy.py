import os
from typing import Dict, Any
try:
    from .database import set_user_consent_db, get_user_consent_db, delete_user_data_db
except ImportError:
    from database import set_user_consent_db, get_user_consent_db, delete_user_data_db

def grant_consent(user_id: str) -> Dict[str, Any]:
    """
    Grants privacy consent for user session recording and risk scoring.
    """
    set_user_consent_db(user_id, True)
    return {
        "status": "success",
        "user_id": user_id,
        "consent": True,
        "message": "User consent granted successfully for real-time risk assessment."
    }

def withdraw_consent(user_id: str) -> Dict[str, Any]:
    """
    Withdraws consent for user session recording.
    """
    set_user_consent_db(user_id, False)
    return {
        "status": "success",
        "user_id": user_id,
        "consent": False,
        "message": "User consent withdrawn successfully. System will decline real-time analysis."
    }

def delete_user_data(user_id: str) -> Dict[str, Any]:
    """
    Deletes all historical logs, EWMA sessions, and user records for user_id.
    """
    records_deleted = delete_user_data_db(user_id)
    return {
        "status": "success",
        "user_id": user_id,
        "records_deleted": records_deleted,
        "message": f"Purged {records_deleted} records for user {user_id} in compliance with privacy guidelines."
    }

def cleanup_raw_audio_file(file_path: str) -> bool:
    """
    Strict Privacy Rule (Guard 5): Raw voice audio files MUST NEVER be stored permanently.
    This function immediately deletes the file from disk after scoring.
    """
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"[Privacy Enforcer Guard 5] Deleted temporary raw audio file: {file_path}")
            return True
    except Exception as e:
        print(f"[Privacy Enforcer Guard 5] Error deleting raw audio file {file_path}: {e}")
    return False
