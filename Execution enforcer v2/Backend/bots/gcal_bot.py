import datetime
import os
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import database # Pulls in our V2 Firestore connection

# Scope required to read and edit calendars
SCOPES = ['https://www.googleapis.com/auth/calendar.events']
TIMEZONE = 'Asia/Kolkata'

IST = datetime.timezone(datetime.timedelta(hours=5, minutes=30))

class GCalEnforcer:
    
    @staticmethod
    def get_service(uid: str):
        """ V2  AUTH: Dynamically builds credentials from The Vault."""
        # Pull tokens securely from the secrets subcollection
        vault_data = database.get_google_tokens(uid)
        
        if not vault_data or not vault_data.get("access_token"):
            raise Exception(f"User {uid} has not linked their Google Calendar. Tokens missing from Vault.")
            
        access_token = vault_data.get("access_token")
        refresh_token = vault_data.get("refresh_token")
        
        # We will set these in the GCP Cloud Run Environment Variables later
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
        
        return build('calendar', 'v3', credentials=creds)

    @staticmethod
    def clear_todays_schedule(uid: str):
        """ANTI-SPAM FIX: Sweeps and deletes existing Enforcer tasks for a specific user."""
        try:
            service = GCalEnforcer.get_service(uid)
            now = datetime.datetime.now(datetime.timezone.utc)
            time_min = now.isoformat()
            time_max = (now + datetime.timedelta(days=1)).isoformat()
            
            events_result = service.events().list(
                calendarId='primary', timeMin=time_min, timeMax=time_max, singleEvents=True
            ).execute()
            events = events_result.get('items', [])
            
            for event in events:
                if "🤖 Automated by Execution Enforcer" in event.get('description', ''):
                    service.events().delete(calendarId='primary', eventId=event['id']).execute()
        except Exception as e:
            print(f"⚠️ Calendar Sweep Failed for {uid}: {e}")

    @staticmethod
    def push_schedule(uid: str, tasks: list):
        """Injects a clean, sequential list of tasks into the user's calendar."""
        GCalEnforcer.clear_todays_schedule(uid)
        service = GCalEnforcer.get_service(uid)
        
        start_time = datetime.datetime.now(IST)
        
        for t in tasks:
            task_name = t.get("task_name", "Unknown Task")
            duration = int(t.get("duration_hours", 1))
            end_time = start_time + datetime.timedelta(hours=duration)
            
            event = {
                'summary': f"🎯 {task_name}",
                'description': '🤖 Automated by Execution Enforcer. Execute immediately.',
                'start': {'dateTime': start_time.isoformat(), 'timeZone': TIMEZONE},
                'end': {'dateTime': end_time.isoformat(), 'timeZone': TIMEZONE},
                'colorId': '5'
            }
            service.events().insert(calendarId='primary', body=event).execute()
            start_time = end_time 

    @staticmethod
    def add_penalty_block(uid: str, task_name: str, duration_hours: int):
        """ THE SEQUENTIAL STACKING  V2 (Index-Lag Proof)"""
        try:
            service = GCalEnforcer.get_service(uid)
            now_ist = datetime.datetime.now(IST)
            
            # Default start time: Tomorrow, rounded down to the clean hour in IST
            start_time = (now_ist + datetime.timedelta(days=1)).replace(minute=0, second=0, microsecond=0)
            
            # Fetch ALL events in the next 3 days to bypass Google Search Index lag
            time_min = now_ist.isoformat()
            time_max = (now_ist + datetime.timedelta(days=3)).isoformat()
            
            events_result = service.events().list(
                calendarId='primary', timeMin=time_min, timeMax=time_max, singleEvents=True, orderBy='startTime'
            ).execute()
            events = events_result.get('items', [])
            
            # Manually filter and find the absolute latest end time
            for event in events:
                if "PENALTY" in event.get('summary', '') and "Execution Enforcer" in event.get('description', ''):
                    end_str = event['end'].get('dateTime')
                    if end_str:
                        try:
                            event_end = datetime.datetime.fromisoformat(end_str)
                            if event_end > start_time:
                                start_time = event_end
                        except Exception:
                            pass
            
            end_time = start_time + datetime.timedelta(hours=duration_hours)
            
            event = {
                'summary': f"🚨 PENALTY: {task_name}",
                'description': '🤖 Automated by Execution Enforcer. You failed this. Redemption required.',
                'start': {'dateTime': start_time.isoformat(), 'timeZone': TIMEZONE},
                'end': {'dateTime': end_time.isoformat(), 'timeZone': TIMEZONE},
                'colorId': '11'
            }
            service.events().insert(calendarId='primary', body=event).execute()
            print(f"💀 PENALTY BLOCK deployed to {uid}'s G-Cal sequentially at {start_time.strftime('%I:%M %p')}")
        except Exception as e:
            print(f"⚠️ Failed to add penalty block for {uid}: {e}")

    @staticmethod
    def redeem_penalty(uid: str, task_name: str):
        """THE REDEMPTION ARC"""
        try:
            service = GCalEnforcer.get_service(uid)
            now = datetime.datetime.now(datetime.timezone.utc)
            time_min = now.isoformat()
            time_max = (now + datetime.timedelta(days=7)).isoformat()
            
            # Bypassing Search Lag here too
            events_result = service.events().list(
                calendarId='primary', timeMin=time_min, timeMax=time_max, singleEvents=True
            ).execute()
            events = events_result.get('items', [])
            
            for event in events:
                if f"PENALTY: {task_name}" in event.get('summary', '') and "Execution Enforcer" in event.get('description', ''):
                    service.events().delete(calendarId='primary', eventId=event['id']).execute()
                    print(f"🕊️ REDEMPTION: Removed penalty block for {uid} - {task_name}")
        except Exception as e:
            print(f"⚠️ Failed to redeem penalty for {uid}: {e}")