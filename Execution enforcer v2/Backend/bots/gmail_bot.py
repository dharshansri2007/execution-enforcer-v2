import os
import base64
import traceback
from email.message import EmailMessage
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import database # V2 Firestore connection

# Scope required to send emails
SCOPES = ['https://www.googleapis.com/auth/gmail.send']

class GmailEnforcer:
    
    @staticmethod
    def get_service(uid: str):
        """ V2  AUTH: Dynamically builds Gmail credentials from The Vault."""
        # Pull tokens securely from the secrets subcollection
        vault_data = database.get_google_tokens(uid)
        
        if not vault_data or not vault_data.get("access_token"):
            raise Exception(f"User {uid} has not linked their Google Workspace. Tokens missing from Vault.")
            
        access_token = vault_data.get("access_token")
        refresh_token = vault_data.get("refresh_token")
        
        # Pulled from GCP Cloud Run Env Variables
        client_id = os.getenv("GOOGLE_CLIENT_ID")
        client_secret = os.getenv("GOOGLE_CLIENT_SECRET")

        # Rebuild the credentials object dynamically in memory
        creds = Credentials(
            token=access_token,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=client_id,
            client_secret=client_secret,
            scopes=SCOPES
        )
        
        return build('gmail', 'v1', credentials=creds)

    @staticmethod
    def send_failure_alert(uid: str, task_name: str, reason: str, to_email: str):
        """Sends the accountability email using the user's specific Gmail account."""
        print(f"📧 Preparing to send Wall of Shame email to {to_email} on behalf of {uid}...")
        try:
            service = GmailEnforcer.get_service(uid)

            message = EmailMessage()
            message.set_content(f"""🚨 EXECUTION FAILURE ALERT 🚨

Your accountability partner has failed a scheduled task.

Task: {task_name}
Excuse provided: {reason}

The system has automatically adapted their schedule to enforce compliance. Please ensure they do not fail again.

- Execution Enforcer System""")

            message['To'] = to_email
            message['From'] = "me" # "me" dynamically refers to the authenticated user's email
            message['Subject'] = f"🚨 ALERT: Execution Failed - {task_name}"

            encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
            create_message = {'raw': encoded_message}
            
            send_message = (service.users().messages().send(userId="me", body=create_message).execute())
            
            print(f"✅ Email successfully fired! Message ID: {send_message['id']}")
            return True
            
        except Exception as e:
            print(f"🚨 Gmail API Error for UID {uid}:")
            print(traceback.format_exc())
            return False

# ==========================================
# 🚀 TEST FIRE (Note: Requires a valid UID now)
# ==========================================
if __name__ == "__main__":
    print("=" * 40)
    print("⚡ V2 GMAIL ENFORCER BOT (Awaiting Firebase Tokens)")
    print("=" * 40)