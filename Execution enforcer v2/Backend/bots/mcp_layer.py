import json
import database #  V2 Firestore connection

class MCPLayer:
    @staticmethod
    def simulate_calendar_update(uid: str, task_name: str, original_hours: int, new_hours: int):
        """
        Generates the UI/AI JSON payload for a specific user.
        The actual Google Calendar API strike is handled exclusively by gcal_bot.py.
        """
        payload = {
            "mcp_tool": "calendar.update_event",
            "status": "ADAPTATION_LOGGED",
            "user_uid": uid,
            "payload": {
                "target_task": task_name,
                "action": "force_reschedule",
                "rescheduled_block": f"{original_hours} HRS -> {new_hours} HRS required.",
                "system_note": "AI adaptation logged. Red penalty block dispatched via GCalEnforcer."
            }
        }
        return json.dumps(payload, indent=2)

    @staticmethod
    def simulate_email_alert(uid: str, failure_reason: str):
        """Generates the MCP payload dynamically using the user's actual accountability partner."""
        try:
            user_doc = database.db.collection("users").document(uid).get()
            if user_doc.exists:
                user_data = user_doc.to_dict()
                target_email = user_data.get("accountability_partner_email") or "SETUP_REQUIRED@enforcer.os"
            else:
                target_email = "UNKNOWN_USER@enforcer.os"
        except Exception as e:
            print(f"⚠️ MCP Database Fetch Error: {e}")
            target_email = "DB_ERROR@enforcer.os"

        payload = {
            "mcp_tool": "email.send",
            "status": "ACCOUNTABILITY_TRIGGERED",
            "user_uid": uid,
            "payload": {
                "to": target_email,
                "subject": "⚠️ SYSTEM ALERT: Missed Execution Block",
                "body": f"Automated Alert: Failure reason logged: '{failure_reason}'."
            }
        }
        return json.dumps(payload, indent=2)

    @staticmethod
    def simulate_notion_log(uid: str, task_name: str):
        """Generates the MCP payload for the Notion Wall of Shame log."""
        payload = {
            "mcp_tool": "notion.append_block",
            "status": "COMPLIANCE_LOGGED",
            "user_uid": uid,
            "payload": {
                "target_task": task_name,
                "action": "write_permanent_record",
                "system_note": "Failure permanently inscribed in the Notion compliance ledger."
            }
        }
        return json.dumps(payload, indent=2)

# ==========================================
# 🚀 TEST FIRE
# ==========================================
if __name__ == "__main__":
    print("--- Firing V2 MCP Layer (Logs Only) ---")
    print(MCPLayer.simulate_calendar_update("DEMO_UID_12345", "Applied Physics", 2, 4))
    print(MCPLayer.simulate_notion_log("DEMO_UID_12345", "Applied Physics"))