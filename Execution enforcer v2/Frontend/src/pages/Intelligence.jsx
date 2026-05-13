import React, { useState, useEffect } from 'react';
import { Brain, Activity, AlertTriangle, Clock, BrainCircuit, BarChart3, Target, ShieldAlert, FileText, TrendingUp, Radar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../firebase'; 


const API_BASE = import.meta.env.VITE_API_BASE;

export default function Intelligence({ stats }) {
  const [logs, setLogs] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  
  const [liveStats, setLiveStats] = useState(stats || null);

  const getAuthHeaders = async () => {
    const token = await auth.currentUser?.getIdToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = await getAuthHeaders();
        
        const [intRes, histRes, scoreRes] = await Promise.all([
          fetch(`${API_BASE}/intelligence`, { headers }),
          fetch(`${API_BASE}/history`, { headers }),
          fetch(`${API_BASE}/score`, { headers })
        ]);
        
        if (intRes.ok) setLogs(await intRes.json());
        if (histRes.ok) setHistory(await histRes.json());
        if (scoreRes.ok) setLiveStats(await scoreRes.json());
      } catch (error) {
        console.error("⚠️ Failed to fetch intelligence data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const currentStats = liveStats || stats;
  const complianceNum = parseInt(currentStats?.compliance_score || "100", 10);
  const isStruggling = complianceNum < 80;

  
  let mostProductive = "Awaiting Data";
  let primaryFailure = "Awaiting Data";
  let successRate = "0%";
  let currentRisk = 15; 
  let primaryExcuse = "Attention Drift"; 

  if (history && history.length > 0) {
    const doneHours = history.filter(h => h.status === 'Done').map(h => new Date(h.logged_at).getHours());
    const failHours = history.filter(h => h.status === 'Failed').map(h => new Date(h.logged_at).getHours());

    const getFrequentHour = (arr) => {
      if (!arr || !arr.length) return null;
      const counts = arr.reduce((acc, val) => { acc[val] = (acc[val] || 0) + 1; return acc; }, {});
      return parseInt(Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b));
    };

    const formatWindow = (h) => {
      if (h === null || isNaN(h)) return "Insufficient Data";
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hr = h % 12 || 12;
      const nextHr = (h + 2) % 12 || 12;
      const nextAmpm = ((h + 2) % 24) >= 12 ? 'PM' : 'AM';
      return `${hr}:00 ${ampm} - ${nextHr}:00 ${nextAmpm}`;
    };

    const frequentDone = getFrequentHour(doneHours);
    const frequentFail = getFrequentHour(failHours);

    mostProductive = formatWindow(frequentDone);
    primaryFailure = formatWindow(frequentFail);

    const totalDone = history.filter(h => h.status === 'Done').length;
    successRate = Math.round((totalDone / history.length) * 100) + "%";

    const currentHour = new Date().getHours();
    if (frequentFail !== null) {
      const hourDifference = Math.abs(currentHour - frequentFail);
      if (hourDifference <= 1) currentRisk = 85;
      else if (hourDifference <= 3) currentRisk = 45;
      else currentRisk = 12;
    }
  }

  // V2 Narrative Generator
  const generateNarrative = () => {
    if (history.length < 3) return "Insufficient telemetry to generate behavioral audit. Awaiting further execution data.";
    if (isStruggling) {
      return `WARNING: Operator is exhibiting chronic failure patterns. Peak vulnerability detected between ${primaryFailure}. The Adaptation Engine has classified primary failures as '${primaryExcuse}'. Recommending immediate shift to high-frequency micro-burst scheduling.`;
    }
    return `STATUS OPTIMAL: Operator maintains a ${successRate} compliance threshold. Peak execution volume occurs between ${mostProductive}. No anomalous behavioral drift detected. Current risk of directive failure is minimal.`;
  };

  
  const formatIST = (dateString) => {
    if (!dateString) return 'UNKNOWN DATE';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'PARSE ERROR'; 
      return date.toLocaleString('en-US', {
        month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true
      }).toUpperCase();
    } catch (e) {
      return 'UNKNOWN DATE';
    }
  };

  return (
    <div className="flex flex-col h-full pb-10 bg-[#0a0a0a] min-h-screen text-white font-sans">
      
      <motion.header 
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="mb-8 border-b border-gold/20 pb-6 flex items-center justify-between gap-4 px-2 pt-4"
      >
        <div className="flex items-center gap-4">
          <div className="p-2 bg-white/5 rounded-lg shadow-sm border border-white/5">
            <Brain className="w-8 h-8 text-gold animate-pulse drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-display tracking-widest text-white uppercase leading-none">Intelligence Logs</h2>
            <p className="text-xs text-gray-500 font-tech tracking-widest mt-1 uppercase font-bold">BEHAVIORAL ANALYSIS & SYSTEM INSIGHTS</p>
          </div>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full px-2">
        
        <motion.div 
          initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="xl:col-span-8 flex flex-col gap-6"
        >
          <div className="p-6 border border-cyan-500/30 rounded-xl bg-cyan-900/10 shadow-sm relative overflow-hidden backdrop-blur-sm">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>
            <h3 className="text-sm font-display tracking-widest uppercase mb-3 text-cyan-400 flex items-center gap-2 font-bold drop-shadow-sm">
              <FileText className="w-4 h-4" /> Executive Behavioral Audit
            </h3>
            <p className="text-sm text-cyan-100/90 font-tech leading-relaxed font-bold">
              {loading ? "Synthesizing psychological profile..." : generateNarrative()}
            </p>
          </div>

          <div className="p-0 border border-cyan-500/30 bg-[#050b14] rounded-xl relative overflow-hidden flex-grow flex flex-col shadow-sm">
            <div className="bg-cyan-500/10 border-b border-cyan-500/30 p-4 flex justify-between items-center">
              <h3 className="text-cyan-400 text-sm font-display font-bold tracking-widest uppercase flex items-center gap-2">
                <BrainCircuit className="w-4 h-4"/> Cognitive Adaptation Feed
              </h3>
              <span className="text-[9px] border border-cyan-400/50 text-cyan-400 px-2 py-1 rounded uppercase tracking-widest animate-pulse font-bold bg-cyan-400/10">Live Context Sync</span>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-5 font-tech h-[500px] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-black/40 [&::-webkit-scrollbar-thumb]:bg-cyan-500/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[::-webkit-scrollbar-thumb]:bg-cyan-400/80">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <Activity className="w-8 h-8 text-cyan-500 animate-spin opacity-50" />
                </div>
              ) : logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-60 py-10">
                  <Activity className="w-8 h-8 text-cyan-500 mb-3" />
                  <div className="text-[10px] text-cyan-400 font-tech font-bold tracking-widest uppercase">No behavioral interventions required yet.</div>
                  <div className="text-[10px] text-gray-500 mt-2 text-center max-w-xs font-bold">The Adaptation Engine activates only when an anomalous failure is detected in the Execution Zone.</div>
                </div>
              ) : (
                logs.map((log, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    key={i} 
                    className="border-l-2 border-cyan-400 pl-4 pb-5 border-b border-white/5 last:border-b-0"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs text-white font-display font-bold tracking-widest uppercase flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-cyan-500 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]"/>
                        {log.task_name}
                      </span>
                      <span className="text-[9px] text-gray-500 uppercase font-bold flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                        <Clock className="w-3 h-3"/>
                        {formatIST(log.logged_at)}
                      </span>
                    </div>
                    <p className="text-xs text-cyan-100/70 italic mb-3 font-bold border-l-2 border-cyan-900/50 pl-3 leading-relaxed">"{log.reasoning}"</p>
                    <div className="text-[10px] uppercase font-bold tracking-widest bg-cyan-500/10 text-cyan-400 inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-cyan-500/30 shadow-sm">
                      <TrendingUp className="w-3 h-3" /> System Adjusted: {log.adjustment}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          className="xl:col-span-4 flex flex-col gap-6"
        >
          <div className={`p-6 border rounded-xl shadow-sm relative overflow-hidden
            ${currentRisk > 50 ? 'border-danger/40 bg-danger/5' : 'border-gold/30 bg-[#121212]'}`}>
            
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-sm font-display tracking-widest uppercase font-bold flex items-center gap-2 
                ${currentRisk > 50 ? 'text-danger' : 'text-gray-300'}`}>
                <Radar className={`w-4 h-4 ${currentRisk > 50 ? 'animate-pulse' : ''}`} /> Predictive Threat Radar
              </h3>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 flex items-center justify-center rounded-full border-4 border-white/10 bg-black/50">
                <div className={`absolute inset-0 rounded-full border-4 border-transparent ${currentRisk > 50 ? 'border-t-danger border-r-danger rotate-45' : 'border-t-success'} opacity-80`}></div>
                <span className={`font-display text-xl font-bold ${currentRisk > 50 ? 'text-danger drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]' : 'text-success drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]'}`}>{currentRisk}%</span>
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-tech text-gray-400 uppercase tracking-widest font-bold">Current Risk of Failure</p>
                <p className={`text-xs font-tech font-bold mt-1 leading-snug ${currentRisk > 50 ? 'text-danger' : 'text-gray-300'}`}>
                  {currentRisk > 50 ? "High probability of distraction detected in current time window." : "Focus conditions are highly stable."}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 border border-white/10 rounded-xl bg-black/40 shadow-sm backdrop-blur-sm">
            <h3 className="text-sm font-display tracking-widest uppercase mb-6 text-gray-300 flex items-center gap-2 font-bold">
              <BarChart3 className="w-4 h-4 text-gold" /> Session Patterns
            </h3>
            
            <div className="space-y-5 font-tech text-xs">
              <div className="flex flex-col gap-1.5 border-b border-white/5 pb-3">
                <span className="text-gray-500 uppercase tracking-widest text-[9px] font-bold">Most Productive Window</span>
                <span className="text-gold font-bold text-lg drop-shadow-[0_0_5px_rgba(251,191,36,0.3)]">{mostProductive}</span>
              </div>
              <div className="flex flex-col gap-1.5 border-b border-white/5 pb-3">
                <span className="text-gray-500 uppercase tracking-widest text-[9px] font-bold">Primary Failure Window</span>
                <span className="text-danger font-bold text-lg drop-shadow-[0_0_5px_rgba(239,68,68,0.3)]">{primaryFailure}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-gray-500 uppercase tracking-widest text-[9px] font-bold">Historical Success Rate</span>
                <span className="text-success font-bold text-2xl drop-shadow-[0_0_5px_rgba(16,185,129,0.3)]">{successRate}</span>
              </div>
            </div>
          </div>

          <div className={`p-6 border rounded-xl shadow-sm flex-grow flex flex-col ${isStruggling ? 'border-danger/30 bg-danger/5' : 'border-success/30 bg-success/5'}`}>
            <h3 className={`text-sm font-display tracking-widest uppercase mb-5 flex items-center gap-2 font-bold ${isStruggling ? 'text-danger' : 'text-success'}`}>
              {isStruggling ? <ShieldAlert className="w-4 h-4" /> : <Target className="w-4 h-4" />}
              Current Operator Status
            </h3>
            
            <ul className="text-xs text-gray-300 font-tech space-y-3">
              <li className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-white/5 shadow-sm">
                <span className="font-bold">Compliance Score</span>
                <span className={`font-bold text-base ${isStruggling ? 'text-danger' : 'text-success'}`}>{currentStats?.compliance_score || "100%"}</span>
              </li>
              <li className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-white/5 shadow-sm">
                <span className="font-bold">Total Failures</span>
                <span className="font-bold text-gray-400 text-base">{currentStats?.total_failures || 0}</span>
              </li>
              <li className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-white/5 shadow-sm">
                <span className="font-bold">Active Streak</span>
                <span className="font-bold text-gold text-base">{currentStats?.streak || 0} Days</span>
              </li>
            </ul>
          </div>
        </motion.div>

      </div>
    </div>
  );
}