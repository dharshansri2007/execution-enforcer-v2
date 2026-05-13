import React, { useState, useEffect, useRef } from 'react';
import { Settings, Zap, Lock, Server, RefreshCw, AlertTriangle, CheckCircle2, Database, Terminal, Key, ShieldCheck, Save, Eye, EyeOff, Calendar, Target, HelpCircle, X, Info, Trash2, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '../firebase'; 
import { doc, getDoc } from 'firebase/firestore';

const API_BASE = import.meta.env.VITE_API_BASE;

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const FRONTEND_URL = window.location.origin + "/config"; 

export default function SystemConfig() {
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState(null);
  const [showAbout, setShowAbout] = useState(false); // V1/V2 About Modal State
  
  const [showKeys, setShowKeys] = useState(false);
  const [isSavingKeys, setIsSavingKeys] = useState(false);
  const [keyMessage, setKeyMessage] = useState(null);
  
  const [notionApiKey, setNotionApiKey] = useState('');
  const [notionPageId, setNotionPageId] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  
  const [showNotionHelp, setShowNotionHelp] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState(["[ OK ] Cloud Run Production Instance: ACTIVE", "[ OK ] Persistence Layer: SECURE"]);

  const addLog = (msg) => setTerminalLogs(prev => [...prev, msg].slice(-5));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const docSnap = await getDoc(doc(db, 'users', user.uid));
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.notion_api_key) setNotionApiKey(data.notion_api_key);
            if (data.notion_page_id) setNotionPageId(data.notion_page_id);
            if (data.accountability_partner_email) setPartnerEmail(data.accountability_partner_email);
          }
        }
      } catch (error) {
        console.error("⚠️ Failed to load profile data:", error);
      }
    };
    fetchData();
  }, []);

  const getAuthHeaders = async () => {
    const token = await auth.currentUser?.getIdToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  const isVaulting = useRef(false);
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code && !isVaulting.current) {
      isVaulting.current = true; 
      addLog("[ SYSTEM ] Intercepted Google Auth Code. Vaulting...");
      
      getAuthHeaders().then(headers => {
        fetch(`${API_BASE}/auth/google/callback`, {
          method: "POST",
          headers: headers,
          body: JSON.stringify({ code: code, redirect_uri: FRONTEND_URL })
        })
        .then(res => res.json())
        .then(data => {
          if(data.status === "SUCCESS") {
            addLog("[ SUCCESS ] Google Workspace Locked & Vaulted.");
            window.history.replaceState({}, document.title, window.location.pathname); 
          } else {
            addLog(`[ ERROR ] Vaulting Failed: ${data.detail || 'Unknown error'}`);
          }
        })
        .catch(err => addLog(`[ ERROR ] Vaulting Failed: ${err.message}`));
      });
    }
  }, []);

  const handleConnectGoogle = () => {
    const scope = "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/gmail.send";
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${FRONTEND_URL}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
    window.location.href = authUrl;
  };

  const handleSaveConfig = async () => {
    setIsSavingKeys(true);
    setKeyMessage(null);
    try {
      const headers = await getAuthHeaders();
      
      if (partnerEmail) {
        await fetch(`${API_BASE}/set-partner`, {
          method: 'POST', headers,
          body: JSON.stringify({ partner_email: partnerEmail })
        });
      }

      if (notionApiKey && notionPageId) {
        await fetch(`${API_BASE}/set-notion`, {
          method: 'POST', headers,
          body: JSON.stringify({ api_key: notionApiKey, page_id: notionPageId })
        });
      }

      setKeyMessage({ type: 'success', text: 'CONFIGURATION SYNCED & SECURED.' });
      addLog("[ SUCCESS ] External Configurations Locked.");
    } catch (error) {
      setKeyMessage({ type: 'error', text: 'SYNC FAILED. CONNECTION REFUSED.' });
      addLog("[ ERROR ] Failed to sync configurations.");
    } finally {
      setIsSavingKeys(false);
      setTimeout(() => setKeyMessage(null), 3000);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("⚠️ EXTREME WARNING: This will permanently wipe your Firestore ledger. Proceed?")) return;
    setIsResetting(true);
    try {
      const headers = await getAuthHeaders();
      await fetch(`${API_BASE}/reset-account`, { method: 'POST', headers });
      setTimeout(() => {
        setIsResetting(false);
        setResetMessage("ACCOUNT RESET SUCCESSFUL. CLOUD LEDGER PURGED.");
        addLog("[ SYSTEM ] Cloud Ledger Purged.");
        setTimeout(() => window.location.reload(), 1000);
      }, 2000);
    } catch (e) {
      setIsResetting(false);
    }
  };

  const inputStyle = "w-full bg-[#121212] border border-white/10 p-2.5 rounded text-white focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-all shadow-inner font-mono text-xs";
  const disabledInputStyle = "w-full bg-[#0a0a0a] border border-white/5 p-2.5 rounded text-gray-500 outline-none font-mono text-xs cursor-not-allowed opacity-60";

  return (
    <div className="flex flex-col h-full pb-10 relative bg-[#050505] min-h-screen text-white font-sans">
      
      <motion.header 
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="mb-8 border-b border-cyan-500/20 pb-6 pt-4 px-2 flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl md:text-3xl font-display tracking-widest text-white uppercase flex items-center gap-3">
            <Settings className="text-cyan-400 animate-spin-slow w-8 h-8" /> SYSTEM CONFIGURATION
          </h2>
          <p className="text-xs text-gray-500 font-tech tracking-widest mt-2 uppercase font-bold">Runtime Control & Security Vault</p>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setShowAbout(true)}
          className="flex items-center gap-2 bg-white/5 border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/10 text-gray-300 hover:text-cyan-400 px-4 py-2.5 rounded-lg text-xs font-display tracking-widest uppercase font-bold transition-all shadow-sm"
        >
          <Info className="w-4 h-4" /> ABOUT ARCHITECTURE
        </motion.button>
      </motion.header>

      <div className="max-w-4xl flex flex-col gap-8 px-2">
        
        {/* GOOGLE WORKSPACE */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
          className="p-6 border border-blue-500/30 rounded-xl relative overflow-hidden bg-[#0a0a0a] shadow-sm backdrop-blur-md"
        >
          <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
            <h3 className="text-sm font-display text-gray-300 tracking-widest uppercase flex items-center gap-2 font-bold">
              <Calendar className="w-4 h-4 text-blue-400" /> Google Workspace Integration
            </h3>
          </div>
          <p className="text-xs text-gray-400 font-tech tracking-widest uppercase mb-6 font-bold">
            Authorize Execution Enforcer to actively modify your Google Calendar and dispatch failure alerts via Gmail.
          </p>
          <motion.button 
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleConnectGoogle}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-display tracking-widest uppercase flex items-center gap-2 hover:bg-blue-500 transition-all font-bold shadow-[0_0_15px_rgba(37,99,235,0.4)] border border-transparent w-full md:w-auto justify-center"
          >
            <Zap className="w-4 h-4" /> AUTHORIZE GOOGLE WORKSPACE
          </motion.button>
        </motion.div>

        {/* EXTERNAL API VAULT */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
          className="p-6 border border-gold/30 rounded-xl relative overflow-hidden bg-[#0a0a0a] shadow-sm backdrop-blur-md"
        >
          <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
            <h3 className="text-sm font-display text-gray-300 tracking-widest uppercase flex items-center gap-2 font-bold">
              <Key className="w-4 h-4 text-gold" /> External API Vault
            </h3>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowNotionHelp(true)}
                className="text-[10px] flex items-center gap-1 font-tech uppercase tracking-widest text-cyan-400 hover:text-cyan-300 transition-colors border border-cyan-500/30 px-2 py-1 rounded shadow-[0_0_10px_rgba(34,211,238,0.1)] bg-cyan-500/5"
              >
                <HelpCircle className="w-3 h-3"/> Setup Guide
              </button>
              <button 
                onClick={() => setShowKeys(!showKeys)}
                className="text-[10px] flex items-center gap-1 font-tech uppercase tracking-widest text-gray-400 hover:text-white transition-colors border border-white/10 px-2 py-1 rounded shadow-sm bg-white/5"
              >
                {showKeys ? <><EyeOff className="w-3 h-3"/> Hide</> : <><Eye className="w-3 h-3"/> Reveal</>}
              </button>
            </div>
          </div>

          <div className="space-y-6 max-w-2xl relative">
            
            {/* Target Setup */}
            <div>
              <label className="text-[10px] text-gray-500 mb-1.5 uppercase tracking-widest font-bold flex items-center gap-2">
                <Target className="w-3 h-3"/> Accountability Target Email
              </label>
              <input type="email" value={partnerEmail} onChange={(e) => setPartnerEmail(e.target.value)} placeholder="partner@company.com" className={inputStyle} />
              <p className="text-[9px] text-danger font-tech tracking-widest mt-2 uppercase font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3"/> [ RESTRICTION ] TARGET EMAIL SECURES WITH A 28-DAY HARD LOCK UPON SAVING.
              </p>
            </div>

            {/* Notion Setup */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-gray-500 mb-1.5 block uppercase tracking-widest font-bold">Notion Integration Token</label>
                <input type={showKeys ? "text" : "password"} value={notionApiKey} onChange={(e) => setNotionApiKey(e.target.value)} placeholder="secret_..." className={inputStyle} />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 mb-1.5 block uppercase tracking-widest font-bold">Notion Target Page ID</label>
                <input type={showKeys ? "text" : "password"} value={notionPageId} onChange={(e) => setNotionPageId(e.target.value)} placeholder="e.g., 8f813c9..." className={inputStyle} />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-4">
              <motion.button 
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleSaveConfig} disabled={isSavingKeys}
                className="bg-gold text-black px-6 py-2 rounded-lg font-display tracking-widest uppercase flex items-center gap-2 hover:brightness-110 transition-all font-bold shadow-[0_0_15px_rgba(251,191,36,0.2)]"
              >
                {isSavingKeys ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSavingKeys ? 'SYNCING...' : 'SAVE CONFIGURATION'}
              </motion.button>
              <AnimatePresence>
                {keyMessage && (
                  <motion.div className={`text-[10px] font-tech uppercase tracking-widest font-bold px-3 py-1.5 rounded flex items-center gap-2 shadow-sm ${keyMessage.type === 'success' ? 'text-success bg-success/10 border border-success/30' : 'text-danger bg-danger/10 border border-danger/30'}`}>
                    {keyMessage.type === 'success' ? <CheckCircle2 className="w-3 h-3"/> : <AlertTriangle className="w-3 h-3"/>}
                    {keyMessage.text}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* JIRA ENTERPRISE SYNC (BETA UI) */}
            <div className="mt-8 border-t border-white/10 pt-6">
              <div className="flex justify-between items-center mb-4">
                <label className="text-[10px] text-cyan-500 uppercase tracking-widest font-bold flex items-center gap-2">
                  <Briefcase className="w-3 h-3"/> Atlassian Jira Integration
                </label>
                <span className="text-[9px] border border-cyan-500/40 text-cyan-400 px-2 py-0.5 rounded uppercase tracking-widest font-bold bg-cyan-500/10 shadow-sm flex items-center gap-1">
                  <Lock className="w-3 h-3"/> BETA - ENTERPRISE TIER
                </span>
              </div>
              <div className="flex gap-3">
                <input disabled type="text" placeholder="workspace.atlassian.net" className={disabledInputStyle} />
                <button disabled className="bg-white/5 border border-white/10 text-gray-500 px-4 rounded-lg font-display tracking-widest uppercase text-xs cursor-not-allowed opacity-60 font-bold whitespace-nowrap">
                  Connect
                </button>
              </div>
            </div>

          </div>
        </motion.div>

        {/* SYSTEM TERMINAL */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
          className="p-0 border border-white/10 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)]"
        >
          <div className="bg-black p-3 border-b border-white/10 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-gray-500" />
            <span className="text-[10px] font-tech text-gray-400 tracking-widest uppercase font-bold">System Status Monitor</span>
          </div>
          <div className="p-6 bg-[#030303] font-mono text-[10px] md:text-xs leading-loose text-success/80 shadow-inner flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-2"><span className="text-cyan-400">root@execution-v2:~$</span> tail -f /var/log/system.log</div>
            {terminalLogs.map((log, i) => (
              <div key={i}>
                {log.includes("[ SUCCESS ]") || log.includes("[ OK ]") ? (
                  <><span className="text-success font-bold">{log.split("] ")[0]}] </span><span className="text-white">{log.split("] ")[1]}</span></>
                ) : log.includes("[ ERROR ]") ? (
                  <><span className="text-red-500 font-bold">{log.split("] ")[0]}] </span><span className="text-gray-300">{log.split("] ")[1]}</span></>
                ) : (
                  <><span className="text-cyan-400 font-bold">{log.split("] ")[0]}] </span><span className="text-gray-300">{log.split("] ")[1]}</span></>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/*  ABOUT ARCHITECTURE MODAL (V1 VS V2 + DANGER ZONE) */}
      <AnimatePresence>
        {showAbout && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0a0a0a] border border-cyan-500/30 rounded-xl max-w-4xl w-full p-6 shadow-[0_0_50px_rgba(34,211,238,0.15)] relative max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <button onClick={() => setShowAbout(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>

              <h2 className="text-2xl font-display tracking-widest text-white uppercase flex items-center gap-3 mb-8 border-b border-white/10 pb-4">
                <Server className="text-cyan-400 w-6 h-6" /> Deployment Architecture
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* V1 Card */}
                <div className="p-6 border border-white/10 rounded-xl bg-black/40 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gray-500"></div>
                  <h3 className="text-gray-400 text-xs font-display tracking-widest uppercase mb-4 flex items-center gap-2 font-bold">
                    <Database className="w-4 h-4"/> Demo Mode (V1)
                  </h3>
                  <ul className="space-y-3 text-xs font-tech text-gray-500 font-bold">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-gray-600"/> Stateless Architecture (Cloud Run)</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-gray-600"/> Local SQLite Ephemeral DB</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-gray-600"/> Auto-resets on container spin-down</li>
                  </ul>
                  <div className="mt-4 text-[9px] bg-white/5 text-gray-400 p-2 rounded uppercase tracking-widest border border-white/5">
                    Status: DEPRECATED
                  </div>
                </div>

                {/* V2 Card */}
                <div className="p-6 border border-cyan-500/40 rounded-xl bg-cyan-900/10 relative overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                  <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500 shadow-[0_0_10px_#06b6d4]"></div>
                  <h3 className="text-cyan-400 text-xs font-display tracking-widest uppercase mb-4 flex items-center gap-2 font-bold">
                    <ShieldCheck className="w-4 h-4"/> Production Mode (V2)
                  </h3>
                  <ul className="space-y-3 text-xs font-tech text-cyan-100/80 font-bold">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-cyan-400"/> Persistent Firebase / Firestore DB</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-cyan-400"/> Google Secret Manager Auth Vault</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-cyan-400"/> Multi-Tenant Scaling</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-cyan-400"/> Vertex AI 2.5 Pro Integration</li>
                  </ul>
                  <div className="mt-4 text-[9px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 p-2 rounded uppercase tracking-widest flex items-center justify-between">
                    Status: ACTIVE DEPLOYMENT <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/*  DANGER ZONE  MODAL */}
              <div className="border border-danger/40 bg-danger/5 rounded-xl p-6 relative overflow-hidden shadow-sm mt-8">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-danger"></div>
                <h3 className="text-danger text-sm font-display tracking-widest uppercase flex items-center gap-2 font-bold mb-2">
                  <AlertTriangle className="w-4 h-4" /> Danger Zone
                </h3>
                <p className="text-[10px] text-gray-400 font-tech tracking-widest uppercase mb-5 font-bold leading-relaxed">
                  Manually trigger a complete database purge. This destroys all execution tasks, XP balances, and history ledgers. Useful for resetting the environment prior to a live presentation.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <motion.button 
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleReset} disabled={isResetting}
                    className="bg-transparent border border-danger text-danger hover:bg-danger hover:text-white px-6 py-2.5 rounded-lg font-display tracking-widest uppercase text-xs flex items-center gap-2 transition-all font-bold w-full sm:w-auto justify-center"
                  >
                    {isResetting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    {isResetting ? 'PURGING LEDGER...' : 'FACTORY RESET ENVIRONMENT'}
                  </motion.button>
                  {resetMessage && (
                    <span className="text-[10px] text-danger font-tech tracking-widest uppercase font-bold animate-pulse">
                      {resetMessage}
                    </span>
                  )}
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NOTION INTEGRATION GUIDE MODAL */}
      <AnimatePresence>
        {showNotionHelp && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0a0a0a] border border-cyan-500/30 rounded-xl max-w-2xl w-full p-6 shadow-[0_0_40px_rgba(34,211,238,0.1)] relative max-h-[90vh] overflow-y-auto"
            >
              <button onClick={() => setShowNotionHelp(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-display tracking-widest text-white uppercase flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                <Database className="text-cyan-400 w-6 h-6" /> Notion Integration Protocol
              </h2>

              <div className="space-y-6 text-sm font-sans text-gray-300 leading-relaxed">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-display text-cyan-400 font-bold">1</div>
                  <div>
                    <h4 className="text-white font-bold mb-1 uppercase tracking-wider text-xs">Create the Internal Integration</h4>
                    <p>Navigate to <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Notion Integrations</a>. Click "New integration". Name it "Execution Enforcer" and submit.</p>
                    <div className="mt-2 bg-black/50 border border-white/10 p-3 rounded text-xs font-mono">
                      <span className="text-gray-500">Result:</span> You will receive an "Internal Integration Secret". Paste this into the <span className="text-gold">Notion Integration Token</span> field.
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-display text-cyan-400 font-bold">2</div>
                  <div>
                    <h4 className="text-white font-bold mb-1 uppercase tracking-wider text-xs">Create the Wall of Shame Page</h4>
                    <p>Create a blank page in your Notion workspace. This is where the AI will log your failures and push your task schedule.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-display text-cyan-400 font-bold">3</div>
                  <div>
                    <h4 className="text-white font-bold mb-1 uppercase tracking-wider text-xs">Connect the Integration</h4>
                    <p>On your new Notion page, click the three dots (`...`) in the top right corner. Scroll down to "Add connections" and search for "Execution Enforcer". Click confirm.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-display text-cyan-400 font-bold">4</div>
                  <div>
                    <h4 className="text-white font-bold mb-1 uppercase tracking-wider text-xs">Extract the Page ID</h4>
                    <p>Look at the URL of your Notion page. The Page ID is the 32-character string of numbers and letters at the very end of the link.</p>
                    <p className="mt-2 text-xs">Paste that 32-character string into the <span className="text-gold">Notion Target Page ID</span> field.</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/10 flex justify-end">
                <button 
                  onClick={() => setShowNotionHelp(false)}
                  className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg font-display tracking-widest uppercase transition-all font-bold text-xs"
                >
                  Acknowledge & Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}