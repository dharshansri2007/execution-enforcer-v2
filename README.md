# ⚡ Execution Enforcer: High-Stakes Compliance for Mission-Critical Roles

> **Submission:** Lab Lab Ai Hackathon Track 2 -- 26'  
> **Status:** ✅ Production Live | **Architecture:** Serverless MCP Multi-Agent System

---




## 🛑 The Problem

Standard productivity tools (like Todoist, Jira, or Notion) suffer from a fatal structural flaw: **They are entirely passive.** They allow endless rescheduling without consequences. 

**The Real-World Impact:** In fields like Cybersecurity, DevOps, or Flight Ops, failure isn't an option. "I'll do it tomorrow" causes system outages and missed compliance deadlines. Corporate teams don't need another passive to-do list; they need an active compliance engine.

## 💡 Solution Overview

Execution Enforcer is not a task manager. It is an **active compliance engine powered by a multi-agent AI architecture** that monitors behavior in real time, detects failure, and fires cross-platform consequences automatically — no user action required.

## 🎨 What Happens When a User FAILS?
Execution Enforcer flips the model using **Constructive Friction**. If a user attempts to delay a critical task, the system does not passively accept it. 

1. **The Interception:** The AI stops the rescheduling action.

2. **The Audit:** It securely queries the user's Google Calendar via MCP to prove they have open time blocks.

3. **The Enforcement:** It calls out the excuse and forces the user into a 15-minute micro-commitment before allowing any workflow changes.

---

## ✨ Key Features

**Strict Mode & Tab Sniper**

Browser `visibilitychange` API monitors session focus. Any navigation away from the active task screen during Strict Mode triggers immediate auto-fail and consequence dispatch. The user **cannot bypass** this by switching tabs, opening DevTools, closing or minimizing the window.

**Intelligence Logs — AI Adaptation Feed**

The Adaptation Agent reads the failure cause, task difficulty, duration estimate, and the last 5 Firestore failure records. It generates a named, personalized behavioral analysis — identifying patterns like consecutive EASY task failures or repeated same-hour abandonment — and recalculates time allocation for future directives accordingly.

**G-Calendar Command**

Live Google Calendar sync. The AI reads the user's actual schedule to surface the Most Productive Window vs. Primary Failure Window based on historical task timestamps. Penalty blocks are injected as real calendar events. The user cannot reclaim that time until the failure is redeemed.

**Execution Heatmap**

A 182-day (26-week) activity grid rendered from raw Firestore timestamps. Days with completed tasks glow. Days with only failures are marked. Days with zero activity are dark. No manual input — the ledger drives everything.

**Rewards Store & XP System**

Persistent XP earned from successful task completions. Redeemable for system modifiers: Skip Penalty, Double XP Boost, Focus Shield. Gamification layer intentionally balanced against the punishment engine — the store items cost more XP than a typical user accumulates in a day.

**Purge Notion Garbage**

A backend loop that authenticates to Notion, queries all checked `to_do` blocks across the user's workspace, and bulk-deletes them. One-click workspace hygiene.

## 🏗️ Cloud-Native Architecture

To ensure enterprise-grade scalability and data persistence, this project utilizes a strictly decoupled, zero-trust infrastructure.

* **Frontend:** React + Vite client deployed on Google's Global CDN (**Firebase Hosting**).

* **Backend Engine:** Containerized Python/FastAPI REST API hosted on **Google Cloud Run**.

* **Database:** **Cloud Firestore** for high-speed, NoSQL persistent state management.

* **Security Protocol:** Strict OAuth 2.0 implementation. Zero hardcoded credentials; all secrets injected at runtime via environment variables.

---

## 🎯 Hackathon Core Requirements Execution

This architecture was specifically engineered to fulfill the **4 core mandates of the APAC 2026 Hackathon**:

### 1. Multi-Agent Coordination (`agents.py`)

* **Primary Orchestrator:** Routes intent and manages global state.

* **The Auditor:** Analyzes the database for overdue tasks and procrastination patterns.

* **The Strategist:** Breaks complex, stalled tasks into actionable micro-steps.

* **The Enforcer:** Handles direct user intervention and excuse-busting.

### 2. MCP (Model Context Protocol) Tool Integration (`mcp_layer.py`)

The AI does not operate in a solo. It interfaces with the actual workspace:

* **Google Calendar (`gcal_bot.py`):** Reads availability to prevent scheduling conflicts and audit excuses.

* **Notes/Tasks (`notion_bot.py`):** Reads project context to help the Strategist agent break down tasks accurately.

* **Communications (`gmail_bot.py`):** Integrates with email for status updates and action-item extraction.

### 3. Structured Data & Workflows (`database.py`)

  "Migrated to Cloud Firestore to maintain the exact persistent state of tasks, execution histories, and AI-generated workflows across distributed sessions."
  
### 4. API-Based Deployment (`main.py`)

* The core multi-agent AI engine is fully decoupled, operating as a secure REST API on Google Cloud Run, seamlessly coordinating with the **Firebase-hosted React client**.

---

## 💻 Technical Stack

* **AI Engine:** Google Vertex AI (Gemini 2.5 Pro)
  
* **Cloud Infrastructure:** Google Cloud Platform (Cloud Run, Firebase Hosting)

* **Backend:** Python / FastAPI / Docker

* **Frontend:** React / Tailwind CSS / Vite

* **Database:** Google Cloud Firestore (NoSQL)

* **Auth & Integration:** Google Identity Services (OAuth 2.0), Model Context Protocol (MCP)

---

## 🛠️ Local Development Setup

To deploy the API and frontend interface on your local machine for testing or contribution, follow these exact steps:

### 1. Clone & Initialize
<pre>
git clone https://github.com/dharshansri2007/execution-enforcer.git
cd execution-enforcer
</pre>

### 2. Backend Setup (Python API)
<pre>
cd backend
python -m venv venv

# Activate Environment
.\venv\Scripts\activate   # Windows
# source venv/bin/activate # Mac/Linux

# Install backend dependencies
pip install -r requirements.txt
</pre>

### 3. Security & Environment Variables
<pre>
#Create a .env file in the backend directory and add your credentials
#(Note: This project strictly enforces zero hardcoded credentials)

GEMINI_API_KEY=your_gemini_api_key_here

GOOGLE_CLIENT_ID=your_oauth_client_id_here

GOOGLE_CLIENT_SECRET=your_oauth_client_secret_here

NOTION_API_KEY=your_notion_integration_secret

FIREBASE_SERVICE_ACCOUNT_KEY=path/to/your/firebase-adminsdk.json</pre>

### 4. Boot the Orchestration Engine
<pre>
# Start the FastAPI and Multi-Agent system
python main.py
# The backend initializes on http://localhost:8000
</pre>

### 5. Launch the Client (React Frontend)
<pre>
# Open a NEW terminal window
cd frontend

# Install Node modules and boot Vite server
npm install
npm run dev
# The UI deploys on http://localhost:5173
</pre>

---

## 🏁 Conclusion

Execution Enforcer is not a proof-of-concept; it is a fully deployed, zero-trust compliance engine. It proves that the future of Generative AI isn't just in answering questions or generating text—it is in **driving and enforcing human action**. 

We didn't just build another task manager. We built a relentless digital Chief of Staff for those who absolutely cannot afford to fail.

> *Made with ☕, zero excuses, and an AI sub-agent that threatened to lock my calendar if I procrastinated on this deployment.* ⚡

---
*Architected and engineered by Sri Dharshan G D.*
