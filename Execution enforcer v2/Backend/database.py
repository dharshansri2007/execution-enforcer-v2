import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timezone
import os


try:
    # Local Developer Environment
    if os.path.exists("firebase-credentials.json"):
        cred = credentials.Certificate("firebase-credentials.json")
        firebase_admin.initialize_app(cred)
        print("✅ Firebase initialized with LOCAL credentials.")
    else:
        # Production Environment (Google Cloud Run)
        firebase_admin.initialize_app()
        print("✅ Firebase initialized via GCP Default Service Account.")
        
    db = firestore.client()
except ValueError:
    
    db = firestore.client()

def get_user_ref(uid: str):
    """Gets the Firestore document reference for a specific user."""
    return db.collection("users").document(uid)

def init_new_user(uid: str, email: str, name: str):
    """Creates a fresh gamification profile for a new Google Sign-In user."""
    user_ref = get_user_ref(uid)
    if not user_ref.get().exists:
        user_ref.set({
            "email": email,
            "name": name,
            "compliance_score": 100,
            "streak": 0,
            "total_failures": 0,
            "xp_balance": 0,
            "accountability_partner_email": None, 
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        print(f"⚡ Provisioned new enterprise profile for: {email}")

def add_task(uid: str, task_name: str, duration_hours: int, difficulty: str = "MEDIUM"):
    """Adds a task to a specific user's sub-collection."""
    tasks_ref = get_user_ref(uid).collection("tasks")
    tasks_ref.add({
        "task_name": task_name,
        "duration_hours": duration_hours,
        "difficulty": difficulty,
        "status": "Pending",
        "failure_reason": None,
        "notion_page_id": None,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

def update_task_status(uid: str, task_id: str, completed: bool, failure_reason: str = None):
    """Updates task, handles XP/Streak math, and archives using an atomic batch commit."""
    user_ref = get_user_ref(uid)
    task_ref = user_ref.collection("tasks").document(task_id)
    
    # 1. Fetch Current State
    task_data = task_ref.get().to_dict()
    if not task_data:
        raise Exception("Task not found in active queue.")
        
    user_stats = user_ref.get().to_dict() or {}
    
    status = "Done" if completed else "Failed"
    task_name = task_data.get("task_name", "Unknown Task")
    duration = task_data.get("duration_hours", 1)
    
    # 2. Calculate Gamification Economy
    current_xp = user_stats.get("xp_balance", 0)
    current_streak = user_stats.get("streak", 0)
    total_failures = user_stats.get("total_failures", 0)
    current_compliance = user_stats.get("compliance_score", 100) #  FETCH CURRENT SCORE
    
    user_updates = {}
    if completed:
        new_xp = current_xp + (duration * 500) # 500 XP per hour of deep work
        user_updates = {"xp_balance": new_xp, "streak": current_streak + 1}
    else:
    
        new_compliance = max(0, current_compliance - 5) 
        user_updates = {"streak": 0, "total_failures": total_failures + 1, "compliance_score": new_compliance}

    # 3. ATOMIC BATCH WRITE (Prevents Data Corruption on Crash)
    batch = db.batch()
    
    # Update Active Task
    batch.update(task_ref, {
        "status": status, 
        "failure_reason": failure_reason if not completed else None
    })
    
    
    history_ref = user_ref.collection("history").document() 
    batch.set(history_ref, {
        "task_name": task_name,
        "status": status,
        "duration_hours": duration,
        "failure_reason": failure_reason,
        "logged_at": datetime.now(timezone.utc).isoformat()
    })
    
    
    batch.update(user_ref, user_updates)
    
    
    batch.commit()
        
    return task_data

def log_intelligence(uid: str, task_name: str, reasoning: str, adjustment: str):
    """Logs the AI Agent's memory and adaptation strategy."""
    intel_ref = get_user_ref(uid).collection("intelligence")
    intel_ref.add({
        "task_name": task_name,
        "reasoning": reasoning,
        "adjustment": adjustment,
        "logged_at": datetime.now(timezone.utc).isoformat()
    })

# THE VAULT (For OAuth Tokens)
def update_google_tokens(uid: str, token_data: dict):
    """Securely stores or updates the Google Workspace refresh tokens."""
    get_user_ref(uid).collection("secrets").document("google_oauth").set(token_data)

def get_google_tokens(uid: str):
    """Retrieves the Google Workspace tokens for the user."""
    token_doc = get_user_ref(uid).collection("secrets").document("google_oauth").get()
    return token_doc.to_dict() if token_doc.exists else None

# THE NOTION VAULT 
def update_notion_keys(uid: str, api_key: str, page_id: str):
    """Securely stores the Notion API tokens in the vault."""
    get_user_ref(uid).collection("secrets").document("notion_oauth").set({
        "api_key": api_key,
        "page_id": page_id
    })

def get_notion_keys(uid: str):
    """Retrieves the Notion tokens from the vault."""
    token_doc = get_user_ref(uid).collection("secrets").document("notion_oauth").get()
    return token_doc.to_dict() if token_doc.exists else None