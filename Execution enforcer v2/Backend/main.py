from fastapi import FastAPI, HTTPException, Security, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional
import os
import requests
import json

# Firebase Admin
from firebase_admin import auth

# Execution Enforcer Modules
import database
from agents import OrchestratorAgent, WatcherAgent, JudgeAgent, ExecutionerAgent
from notion_bot import NotionEnforcer
from gmail_bot import GmailEnforcer
from gcal_bot import GCalEnforcer
import mcp_layer 

app = FastAPI(title="Execution Enforcer API V2", description="Multi-Tenant SaaS Execution System.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=False, 
    allow_methods=["*"],
    allow_headers=["*"],
)

# V2 SECURITY LAYER
security = HTTPBearer()

def verify_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token['uid'] 
    except Exception as e:
        print(f"🚨 Token Blocked: {e}")
        raise HTTPException(status_code=401, detail="Unauthorized.")

# OAUTH CONFIGURATION 
OAUTH_CONFIG = {
    "CLIENT_ID": os.environ.get("GOOGLE_CLIENT_ID", "PASTE_YOUR_CLIENT_ID_HERE"),
    "CLIENT_SECRET": os.environ.get("GOOGLE_CLIENT_SECRET", "PASTE_YOUR_CLIENT_SECRET_HERE")
}

# --- PYDANTIC MODELS ---
class GoalRequest(BaseModel):
    goal: str

class ComplianceRequest(BaseModel):
    task_id: str  
    completed: bool
    failure_reason: Optional[str] = "No reason provided."

class DeleteHistoryRequest(BaseModel):
    task_name: str

class SpendXPRequest(BaseModel):
    cost: int
    item_name: str

class OAuthExchangeRequest(BaseModel):
    code: str
    redirect_uri: str

class PartnerRequest(BaseModel):
    partner_email: str

class NotionRequest(BaseModel):
    api_key: str
    page_id: str

# --- ENDPOINTS ---

@app.get("/")
def home():
    return {"message": "Execution Enforcer V2 Backend is LIVE 🚀"}

@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return Response(content=b"", media_type="image/x-icon")

@app.get("/score")
def get_score(uid: str = Depends(verify_user)):
    user_ref = database.db.collection("users").document(uid).get()
    if user_ref.exists:
        user_data = user_ref.to_dict()
        return {
            "compliance_score": f"{user_data.get('compliance_score', 100)}%", 
            "streak": user_data.get('streak', 0), 
            "total_failures": user_data.get('total_failures', 0),
            "xp_balance": user_data.get('xp_balance', 0)
        }
    return {"compliance_score": "100%", "streak": 0, "total_failures": 0, "xp_balance": 0}

@app.get("/tasks")
def get_tasks(uid: str = Depends(verify_user)):
    tasks_ref = database.db.collection("users").document(uid).collection("tasks").stream()
    task_list = []
    for t in tasks_ref:
        data = t.to_dict()
        task_list.append({
            "id": t.id, 
            "task_name": data.get("task_name"),
            "duration_hours": data.get("duration_hours"),
            "status": data.get("status"),
            "failure_reason": data.get("failure_reason")
        })
    return task_list

@app.post("/plan")
def create_plan(req: GoalRequest, uid: str = Depends(verify_user)):
    print(f"🔥 INITIATING V2 ORCHESTRATOR FOR UID {uid}...")
    
    user_data = database.db.collection("users").document(uid).get().to_dict() or {}
    comp_score = user_data.get("compliance_score", 100)
    user_context = f"Compliance: {comp_score}%. Identity: {user_data.get('name', 'Unknown')}."
    
    tasks = OrchestratorAgent.breakdown_goal(req.goal, user_context)
    if not tasks:
        raise HTTPException(status_code=500, detail="Gemini failed to generate plan.")
    
    old_tasks = database.db.collection("users").document(uid).collection("tasks").stream()
    for t in old_tasks:
        t.reference.delete()
        
    try:
        NotionEnforcer.push_timetable(uid, req.goal, tasks)
        GCalEnforcer.push_schedule(uid, tasks)
    except Exception as e:
        print(f"⚠️ Third-Party API Sync Warning: {e}")

    for t in tasks:
        database.add_task(
            uid=uid,
            task_name=t.get("task_name", "Unknown Task"),
            duration_hours=t.get("duration_hours", 1),
            difficulty=t.get("difficulty", "MEDIUM")
        )

    return {"message": "Plan locked and deployed to cloud.", "total_tasks": len(tasks)}

@app.post("/check-compliance")
def check_compliance(req: ComplianceRequest, uid: str = Depends(verify_user)):
    """🔥 THE CONSEQUENCE ENGINE (Multi-Agent Pipeline)"""
    try:
        # 1. Update Firestore status
        result = database.update_task_status(uid, req.task_id, req.completed, req.failure_reason)
        task_name = result.get("task_name", "Unknown")
        notion_id = result.get("notion_page_id")
        original_hours = result.get("duration_hours", 1)

        if req.completed:
            try:
                NotionEnforcer.mark_task_complete(uid, notion_id)
                GCalEnforcer.redeem_penalty(uid, task_name)
            except Exception as e:
                 print(f"⚠️ API Sync Skip: {e}")
            return {"status": "SUCCESS", "message": "Compliance recorded. XP Awarded."}
            
        else:
            user_data = database.db.collection("users").document(uid).get().to_dict() or {}
            partner_email = user_data.get("accountability_partner_email")
            
            recent_fails_ref = database.db.collection("users").document(uid).collection("history").where("status", "==", "Failed").limit(3).stream()
            history_str = ", ".join([f"Failed '{f.to_dict().get('task_name')}' due to '{f.to_dict().get('failure_reason')}'" for f in recent_fails_ref])
            if not history_str: 
                history_str = "No recent failures."

            # --- MULTI-AGENT PIPELINE ---
            
            # Agent 1: The Watcher (Flash) - State Extraction
            watcher_state = WatcherAgent.extract_state(
                task_name, original_hours, req.failure_reason, history_str
            )
            
            # Agent 2: The Judge (Pro) - Reasoning & Verdict
            judge_verdict = JudgeAgent.render_verdict(watcher_state, original_hours)
            new_penalty_hours = judge_verdict.get("new_duration", 2)
            roast = judge_verdict.get("adaptation_note", "Unacceptable failure.")

            # Agent 3: The Executioner (Python) - MCP Dispatch
            if judge_verdict.get("trigger_mcp", True):
                try:
                    ExecutionerAgent.dispatch_penalties(uid, task_name, req.failure_reason, judge_verdict, partner_email)
                except Exception as e:
                    print(f"⚠️ Executioner MCP Dispatch Warning: {e}")

            # ----------------------------

            # C. Log the AI roast to Intelligence Logs 
            combined_adjustment = f"{roast} [Penalty Shift: {original_hours} HRS -> {new_penalty_hours} HRS]"
            database.log_intelligence(uid, task_name, req.failure_reason, combined_adjustment)

            # GENERATE MCP LOGS FOR FRONTEND
            cal_log = json.loads(mcp_layer.MCPLayer.simulate_calendar_update(uid, task_name, original_hours, new_penalty_hours))
            email_log = json.loads(mcp_layer.MCPLayer.simulate_email_alert(uid, req.failure_reason))

            return {
                "status": "FAILED", 
                "message": "Failure logged. Penalties dispatched.",
                "mcp_logs": [cal_log, email_log] 
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history")
def get_history(uid: str = Depends(verify_user)):
    hist_ref = database.db.collection("users").document(uid).collection("history").order_by("logged_at", direction="DESCENDING").stream()
    return [{"id": h.id, **h.to_dict()} for h in hist_ref]

@app.delete("/history")
def delete_history(req: DeleteHistoryRequest, uid: str = Depends(verify_user)):
    hist_ref = database.db.collection("users").document(uid).collection("history").where("task_name", "==", req.task_name).stream()
    for h in hist_ref:
        h.reference.delete()
    return {"status": "SUCCESS"}

@app.get("/intelligence")
def get_intelligence(uid: str = Depends(verify_user)):
    int_ref = database.db.collection("users").document(uid).collection("intelligence").order_by("logged_at", direction="DESCENDING").stream()
    return [{"id": i.id, **i.to_dict()} for i in int_ref]

@app.get("/penalties")
def get_penalties(uid: str = Depends(verify_user)):
    tasks_ref = database.db.collection("users").document(uid).collection("tasks").where("status", "==", "Failed").stream()
    return [{"title": t.to_dict().get("task_name"), "duration": t.to_dict().get("duration_hours")} for t in tasks_ref]

@app.post("/spend-xp")
def spend_xp(req: SpendXPRequest, uid: str = Depends(verify_user)):
    user_ref = database.db.collection("users").document(uid)
    user_data = user_ref.get().to_dict() or {}
    current_xp = user_data.get("xp_balance", 0)
    
    if current_xp < req.cost:
        raise HTTPException(status_code=400, detail="Insufficient XP.")
        
    new_xp = current_xp - req.cost
    user_ref.update({"xp_balance": new_xp})
    return {"status": "SUCCESS", "new_balance": new_xp}

@app.post("/reset-account")
def reset_account(uid: str = Depends(verify_user)):
    user_ref = database.db.collection("users").document(uid)
    user_ref.update({
        "compliance_score": 100, 
        "streak": 0, 
        "total_failures": 0, 
        "xp_balance": 0
    })
    return {"status": "SUCCESS"}

@app.post("/purge-notion")
def purge_notion(uid: str = Depends(verify_user)):
    NotionEnforcer.purge_completed_tasks(uid)
    return {"status": "SUCCESS"}

@app.post("/purge-shame")
def purge_shame(uid: str = Depends(verify_user)):
    NotionEnforcer.purge_shame(uid)
    return {"status": "SUCCESS"}
    
@app.post("/set-partner")
def set_partner(req: PartnerRequest, uid: str = Depends(verify_user)):
    user_ref = database.db.collection("users").document(uid)
    if not user_ref.get().exists:
        raise HTTPException(status_code=404, detail="User profile not found.")
        
    user_ref.update({"accountability_partner_email": req.partner_email})
    return {"status": "SUCCESS", "message": f"Partner locked to {req.partner_email}"}

@app.post("/set-notion")
def set_notion(req: NotionRequest, uid: str = Depends(verify_user)):
    user_ref = database.db.collection("users").document(uid)
    if not user_ref.get().exists:
        raise HTTPException(status_code=404, detail="User profile not found.")
        
    user_ref.update({
        "notion_api_key": req.api_key,
        "notion_page_id": req.page_id
    })
    return {"status": "SUCCESS", "message": "Notion Keys Locked."}

@app.post("/auth/google/callback")
def google_oauth_callback(req: OAuthExchangeRequest, uid: str = Depends(verify_user)):
    token_url = "https://oauth2.googleapis.com/token"
    payload = {
        "code": req.code,
        "client_id": OAUTH_CONFIG["CLIENT_ID"],
        "client_secret": OAUTH_CONFIG["CLIENT_SECRET"],
        "redirect_uri": req.redirect_uri,
        "grant_type": "authorization_code"
    }
    
    try:
        response = requests.post(token_url, data=payload)
        response.raise_for_status()
        token_data = response.json()
        
        database.update_google_tokens(uid, token_data)
        
        return {"status": "SUCCESS", "message": "Tokens Vaulted."}
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=400, detail=f"OAuth Exchange Failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)