import os
import json
import vertexai
from vertexai.generative_models import GenerativeModel, GenerationConfig

# ==========================================
#  V2  INITIALIZATION
# ==========================================
# Dynamically pulls your V2 Project ID from the Cloud Run environment
PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT", "execution-enforcer-v2")

vertexai.init(project=PROJECT_ID, location="us-central1")

# Instantiate both models for the Multi-Agent Pipeline
model_pro = GenerativeModel(model_name="gemini-2.5-pro")
model_flash = GenerativeModel(model_name="gemini-2.5-flash")

strict_config = GenerationConfig(
    temperature=0.2,
    response_mime_type="application/json"
)

class OrchestratorAgent:
    """Agent 0: The Tactical Commander. Breaks down chaotic goals with ruthless precision."""
    
    @staticmethod
    def breakdown_goal(goal, user_context="No history available. New user."):
        prompt = f"""
        SYSTEM OVERRIDE: You are the Master Orchestrator Agent for EXECUTION ENFORCER V2. 
        You do not ask nicely. You do not suggest. You COMMAND.
        
        TARGET GOAL: {goal}
        OPERATOR CONTEXT: {user_context}
        
        DIRECTIVE:
        Break this goal down into 2 to 4 hyper-specific, aggressive execution steps. 
        Based on their history, assign a brutal difficulty rating, the optimal time of day to force them to do it, and predict their probability of failure.
        
        STRICT RULES: Output ONLY a valid JSON list of objects. Exactly these six keys:
        'task_name' (string, prepend a tag: [BRUTAL], [MEDIUM], or [EASY]. Make the task title aggressive and actionable),
        'duration_hours' (integer, realistic deep-work time),
        'difficulty' (string: 'EASY', 'MEDIUM', 'BRUTAL', 'NIGHTMARE'),
        'priority' (string: 'CRITICAL', 'HIGH', 'STANDARD'),
        'optimal_time' (string: e.g., '0500 Hours', 'Late Night', based on history),
        'failure_risk' (string: 'HIGH', 'MEDIUM', 'LOW' - calculate strictly based on their compliance score)
        """
        try:
            response = model_pro.generate_content(prompt, generation_config=strict_config)
            data = json.loads(response.text)
            
            if not isinstance(data, list):
                raise ValueError("Invalid format: Expected a list")
                
            required_keys = {"task_name", "duration_hours", "difficulty", "priority", "optimal_time", "failure_risk"}
            for item in data:
                if not required_keys.issubset(item.keys()):
                    raise ValueError(f"Missing keys in response. Found: {item.keys()}")
                    
            return data
            
        except Exception as e:
            print(f"🚨 Orchestrator Error: {e}")
            return [{"task_name": f"[BRUTAL] INITIATE: {goal}", "duration_hours": 2, "difficulty": "BRUTAL", "priority": "CRITICAL", "optimal_time": "Immediate", "failure_risk": "HIGH"}]

class WatcherAgent:
    """Agent 1: The Eyes. High-speed data extraction using Gemini Flash. No judgment, just facts."""
    
    @staticmethod
    def extract_state(task_name, duration, reason, history):
        prompt = f"""
        SYSTEM OVERRIDE: You are the Watcher Agent. Extract the facts into strict JSON. No judgment.
        
        TASK: {task_name} ({duration} hrs)
        EXCUSE PROVIDED: {reason}
        OPERATOR HISTORY: {history}
        
        STRICT RULES: Output ONLY a valid JSON object with exactly these keys:
        'excuse_category' (string: 'Time Management', 'Technical', 'Laziness', 'External'),
        'historical_reliability' (string: 'Good', 'Poor'),
        'core_fact' (string: 1-sentence objective summary of the failure)
        """
        try:
            # Using FLASH here because it is cheap and incredibly fast for basic extraction
            response = model_flash.generate_content(prompt, generation_config=strict_config)
            return json.loads(response.text)
        except Exception as e:
            print(f"🚨 Watcher Error: {e}")
            return {"excuse_category": "Unknown", "historical_reliability": "Poor", "core_fact": "Failed to parse excuse."}

class JudgeAgent:
    """Agent 2: The Brain. The reasoning engine using Gemini Pro. Dictates the punishment."""
    
    @staticmethod
    def render_verdict(watcher_state, original_hours):
        prompt = f"""
        SYSTEM OVERRIDE: You are the Judge Agent in a Zero-Trust system. Review the Watcher's state report:
        {json.dumps(watcher_state)}
        Original Hours Scheduled: {original_hours}
        
        FAILURE INTELLIGENCE PROTOCOL:
        1. If 'historical_reliability' is Poor, rip them apart.
        2. If 'excuse_category' is Laziness, INCREASE duration by 1 to 3 hours and trigger MCP penalties.
        3. If 'excuse_category' is External/Legitimate, do not increase duration, be cold but fair, and DO NOT trigger MCP penalties.
        
        STRICT RULES: Output ONLY a valid JSON object with exactly these keys:
        'status' (string: 'FAILURE'),
        'new_duration' (integer, updated hours they must suffer through),
        'adaptation_note' (string, your psychological breakdown and strict orders),
        'trigger_mcp' (boolean, true if they deserve calendar blocks and public shaming)
        """
        try:
            # Using PRO here because we need advanced logic and persona adherence
            response = model_pro.generate_content(prompt, generation_config=strict_config)
            data = json.loads(response.text)
            
            # 🛡️ THE CLAMP: Prevent the AI from assigning infinite hours
            data["new_duration"] = min(max(1, int(data.get("new_duration", original_hours + 1))), 8)
            
            return data
            
        except Exception as e:
            print(f"🚨 Judge Error: {e}")
            return {
                "status": "FAILURE",
                "new_duration": min(original_hours + 1, 8), 
                "adaptation_note": "System fault detected. Standard punishment applied. Execute.",
                "trigger_mcp": True
            }

class ExecutionerAgent:
    """Agent 3: The Hands. Pure Python dispatcher. Reads the Judge's verdict and fires the APIs."""
    
    @staticmethod
    def dispatch_penalties(uid, task_name, reason, judge_verdict, partner_email):
        # 1. Check if the Judge actually authorized MCP action
        if not judge_verdict.get("trigger_mcp", True):
            print("🛡️ Judge determined MCP action is not required. Skipping API triggers.")
            return False
            
        # Local imports to prevent circular dependency crashes with main.py
        from notion_bot import NotionEnforcer
        from gmail_bot import GmailEnforcer
        from gcal_bot import GCalEnforcer
        
        print(f"🔥 EXECUTIONER DEPLOYED FOR {uid}. Triggering MCP protocols...")
        
        try:
            # Fire the APIs autonomously based on the AI's ruling
            GCalEnforcer.add_penalty_block(uid, task_name, judge_verdict["new_duration"])
            NotionEnforcer.log_wall_of_shame(uid, task_name, reason)
            
            if partner_email:
                GmailEnforcer.send_failure_alert(uid, task_name, reason, partner_email)
                
            return True
        except Exception as e:
            print(f"⚠️ Executioner MCP Dispatch Warning: {e}")
            return False

# ==========================================
# 🚀 TEST FIRE
# ==========================================
if __name__ == "__main__":
    print("=" * 50)
    print("🧠 TESTING ORCHESTRATOR (Gemini 2.5 Pro)")
    print("=" * 50)
    fake_context = "User has a 40% compliance score. They constantly fail tasks scheduled after 8 PM due to fatigue."
    print(json.dumps(OrchestratorAgent.breakdown_goal("I need to study Applied Physics PH25C01 for Anna University Reg 2025 exams.", fake_context), indent=2))
    
    print("\n" + "=" * 50)
    print("💀 TESTING MULTI-AGENT PIPELINE (Flash -> Pro -> Python)")
    print("=" * 50)
    fake_history = "- Failed 'Essentials of Computing CS25C03' because 'I was playing God of War'\n- Failed 'Math' because 'I was playing God of War'"
    
    print("\n[1] WATCHER AGENT EXTRACTING STATE...")
    watcher_state = WatcherAgent.extract_state("Study Applied Physics PH25C01", 3, "I was playing God of War again", fake_history)
    print(json.dumps(watcher_state, indent=2))
    
    print("\n[2] JUDGE AGENT RENDERING VERDICT...")
    judge_verdict = JudgeAgent.render_verdict(watcher_state, 3)
    print(json.dumps(judge_verdict, indent=2))
    
    print("\n[3] EXECUTIONER AGENT AWAITING DISPATCH...")
    print(f"Trigger MCP Protocols? : {judge_verdict.get('trigger_mcp')}")