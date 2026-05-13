import React, { useState, useEffect, useRef } from 'react';
import { Activity, Zap, CheckCircle2, XCircle, Clock, BrainCircuit, Target, ChevronRight, AlertTriangle, ShieldAlert, Skull } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../firebase'; 


const API_BASE = import.meta.env.VITE_API_BASE;


const ENFORCER_QUOTES = [
  "Discipline is the weapon. Execution is the victory.",
  "Excuses are the nails used to build a house of failure.",
  "Action cures fear. Indecision creates it.",
  "The penalty of inaction is a compromised future.",
  "Execute the protocol. Feelings are irrelevant.",
  "Motivation is fragile. Routine is relentless."
];

export default function Tasks() {
  const [showFailureMode, setShowFailureMode] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState(ENFORCER_QUOTES[0]);

  const [showFocusWarning, setShowFocusWarning] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // V2 Refs for Synchronous Emergency Unmounts
  const isFocusModeRef = useRef(isFocusMode);
  const activeTaskRef = useRef(null);
  const tokenRef = useRef(null); 

  useEffect(() => {
    isFocusModeRef.current = isFocusMode;
  }, [isFocusMode]);

  useEffect(() => {
    fetchTasks();
    setQuote(ENFORCER_QUOTES[Math.floor(Math.random() * ENFORCER_QUOTES.length)]);
  }, []);

  
  const getAuthHeaders = async () => {
    const token = await auth.currentUser?.getIdToken();
    if (token) tokenRef.current = token; 
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  const fetchTasks = async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/tasks`, { headers });
      if (res.ok) {
        setTasks(await res.json());
      }
    } catch (err) {
      console.error("⚠️ Failed to fetch directives:", err);
    } finally {
      setLoading(false);
    }
  };

  const activeTask = tasks.find(t => t.status === 'Pending');
  
  useEffect(() => {
    activeTaskRef.current = activeTask;
  }, [activeTask]);

  const parseTaskName = (name) => {
    if (!name) return { tag: 'TASK', cleanName: 'Unknown Target' };
    const match = name.match(/^\[(.*?)\]\s*(.*)$/);
    if (match) {
      return { tag: match[1], cleanName: match[2] };
    }
    return { tag: 'TARGET', cleanName: name };
  };

  const handleCompliance = async (taskId, isCompleted, manualReason = null) => {
    let reason = "No reason provided.";
    if (!isCompleted) {
      if (manualReason) {
        reason = manualReason; 
      } else {
        reason = prompt("💀 THREAT DETECTED. Enter your excuse for failing this directive:");
        if (reason === null) return; 
      }
    }

    setShowFailureMode(false); 
    setIsFocusMode(false); 

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/check-compliance`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          task_id: taskId,
          completed: isCompleted,
          failure_reason: reason
        })
      });
      
      const data = await res.json();
      alert(`[SYSTEM]: ${data.message || 'Protocol updated.'}`);
      fetchTasks(); 
    } catch (err) {
      console.error("⚠️ Compliance API failure:", err);
    }
  };

  
  useEffect(() => {
    return () => {
      if (isFocusModeRef.current && activeTaskRef.current && tokenRef.current) {
        fetch(`${API_BASE}/check-compliance`, {
          method: 'POST',
          keepalive: true,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokenRef.current}`
          },
          body: JSON.stringify({
            task_id: activeTaskRef.current.id,
            completed: false,
            failure_reason: "System detected user abandoned the terminal during Strict Mode."
          })
        }).catch(() => {});
      }
    };
  }, []);

  
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isFocusModeRef.current && activeTaskRef.current && tokenRef.current) {
        fetch(`${API_BASE}/check-compliance`, {
          method: 'POST',
          keepalive: true,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokenRef.current}`
          },
          body: JSON.stringify({
            task_id: activeTaskRef.current.id,
            completed: false,
            failure_reason: "System detected user forcibly closed the browser during Strict Mode."
          })
        }).catch(() => {});
        
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);


  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isFocusModeRef.current && activeTaskRef.current) {
        setIsFocusMode(false);
        alert("💀 FATAL VIOLATION: TAB SWITCH DETECTED.\nFocus broken. Immediate penalty deployed to Calendar.");
        handleCompliance(activeTaskRef.current.id, false, "System detected tab-switching/distraction during Strict Mode.");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isFocusMode]);

  // TIMER LOGIC
  useEffect(() => {
    let timer;
    if (isFocusMode && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isFocusMode && timeLeft === 0) {
      setIsFocusMode(false);
      handleCompliance(activeTask?.id, true);
    }
    return () => clearInterval(timer);
  }, [isFocusMode, timeLeft, activeTask]);

  const startFocusProtocol = async () => {
    if (!activeTask) return;
    await getAuthHeaders(); 
    setShowFocusWarning(false);
    setIsFocusMode(true);
    setTimeLeft(activeTask.duration_hours * 3600); 
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full pb-10 relative bg-[#050505] min-h-screen text-white font-sans">
      
      {/* V2 HEADER */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="flex justify-between items-center mb-8 border-b border-white/10 pb-6 pt-4 px-2"
      >
        <div className="flex items-center gap-4">
          <div className="p-2 bg-white/5 rounded-lg shadow-sm border border-white/5">
            <Activity className="w-8 h-8 text-gold drop-shadow-sm" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-display tracking-widest text-white uppercase leading-none">ONGOING TASKS</h2>
            <p className="text-xs text-gray-500 font-tech tracking-widest mt-1 uppercase font-bold">Manage & Track Daily Execution</p>
          </div>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-2">
        
        {/* ========================================== */}
        {/* PANE 1: THE QUEUE                            */}
        {/* ========================================== */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          className={`lg:col-span-3 flex flex-col gap-6 transition-all duration-500 ${isFocusMode ? 'opacity-30 pointer-events-none grayscale blur-sm' : ''}`}
        >
          <div className="p-5 rounded-xl border border-white/5 bg-[#0a0a0a] shadow-sm h-[500px] overflow-y-auto custom-scrollbar flex flex-col backdrop-blur-md">
            <h3 className="text-xs text-gray-400 font-display tracking-widest uppercase mb-5 flex justify-between items-center font-bold border-b border-white/5 pb-3">
              Task Queue <span className="bg-gold/10 text-gold px-2 py-0.5 rounded shadow-sm border border-gold/20">{tasks.length}</span>
            </h3>
            
            <div className="flex flex-col gap-3 flex-grow">
              {loading ? (
                <div className="text-gold font-tech animate-pulse text-xs text-center mt-10">Fetching Directives...</div>
              ) : tasks.length === 0 ? (
                <div className="text-gray-500 font-tech text-xs italic text-center mt-10">No directives generated.</div>
              ) : (
                tasks.map((task) => {
                  const { tag, cleanName } = parseTaskName(task.task_name);
                  return (
                    <div key={task.id} className={`border p-3.5 rounded-lg relative overflow-hidden transition-all shadow-sm
                      ${task.status === 'Pending' ? 'border-gold/40 bg-gold/5 hover:border-gold' : 
                        task.status === 'Done' ? 'border-success/30 bg-success/5 opacity-70' : 
                        'border-danger/30 bg-danger/5 opacity-70'}`}>
                      <div className={`absolute left-0 top-0 w-1.5 h-full ${task.status === 'Pending' ? 'bg-gold shadow-[0_0_10px_#fbbf24]' : task.status === 'Done' ? 'bg-success' : 'bg-danger'}`}></div>
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1.5">
                          <span className={`text-[9px] uppercase tracking-widest inline-block w-max px-2 py-0.5 rounded font-bold
                            ${task.status === 'Pending' ? 'border border-gold/50 text-gold bg-gold/10' : 
                              task.status === 'Done' ? 'border border-success/50 text-success bg-success/10' : 
                              'border border-danger/50 text-danger bg-danger/10'}`}>
                            {tag}
                          </span>
                          <span className={`text-xs font-tech font-bold leading-relaxed ${task.status === 'Failed' ? 'text-gray-500 line-through' : 'text-white'}`}>
                            {cleanName}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </motion.div>

        {/* ========================================== */}
        {/* PANE 2: EXECUTION ZONE                     */}
        {/* ========================================== */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-6 flex flex-col gap-6 relative"
        >
          {/* AI Enforcer Quote Box */}
          <div className={`p-4 rounded-xl text-center transition-all duration-500 shadow-sm border
            ${isFocusMode ? 'border-danger/30 bg-danger/10 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'border-cyan-500/20 bg-cyan-500/5'}`}>
            <p className={`text-sm md:text-base italic tracking-wide font-display font-bold ${isFocusMode ? 'text-danger' : 'text-cyan-100'}`}>"{quote}"</p>
            <p className={`text-[10px] uppercase tracking-widest mt-2 font-bold ${isFocusMode ? 'text-danger/70' : 'text-cyan-500'}`}>— Execution Enforcer AI</p>
          </div>

          {/* MAIN EXECUTION SCREEN */}
          <div className={`rounded-xl p-8 relative overflow-hidden flex-grow flex flex-col transition-all duration-700 border
            ${isFocusMode ? 'border-danger/80 shadow-[0_0_80px_rgba(239,68,68,0.4)] bg-[#030000] scale-[1.02] z-20' : 'border-gold/40 shadow-[0_0_30px_rgba(251,191,36,0.1)] bg-[#0a0a0a]'}`}>
            
            <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r 
              ${isFocusMode ? 'from-danger via-danger to-danger animate-pulse shadow-[0_0_15px_#ef4444]' : 'from-gold/10 via-gold to-gold/10'}`}></div>
            
            {!activeTask ? (
               <div className="flex-grow flex flex-col items-center justify-center text-gray-500">
                 <CheckCircle2 className="w-20 h-20 mb-6 text-success opacity-60 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]" />
                 <p className="font-display tracking-widest uppercase font-bold text-lg">All Directives Cleared.</p>
               </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-6">
                  <div className="w-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-3.5 h-3.5 rounded-full animate-pulse ${isFocusMode ? 'bg-danger shadow-[0_0_10px_#ef4444]' : 'bg-gold shadow-[0_0_10px_#fbbf24]'}`}></div>
                      <span className={`text-[10px] border px-2.5 py-1 rounded font-bold uppercase tracking-widest shadow-sm
                        ${isFocusMode ? 'border-danger/50 text-white bg-danger shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'border-gold/50 text-gold bg-gold/10'}`}>
                        {isFocusMode ? 'STRICT MODE LOCKED IN' : 'ACTIVE TARGET'}
                      </span>
                    </div>
                    <h2 className={`text-2xl md:text-4xl font-display font-bold tracking-widest drop-shadow-sm leading-tight uppercase
                      ${isFocusMode ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'text-white'}`}>
                      {parseTaskName(activeTask.task_name).cleanName}
                    </h2>
                  </div>
                </div>

                {/* THE TIMER DISPLAY */}
                <div className={`my-8 py-10 rounded-xl text-center flex flex-col justify-center items-center transition-all shadow-inner border
                  ${isFocusMode ? 'bg-[#050000] border-danger/50 shadow-[inset_0_0_80px_rgba(239,68,68,0.15)]' : 'bg-[#121212] border-white/5'}`}>
                  <div className={`text-xs tracking-widest font-bold uppercase mb-4 flex items-center justify-center gap-2 ${isFocusMode ? 'text-danger drop-shadow-sm' : 'text-gray-500'}`}>
                    <Clock className="w-4 h-4"/> Time Remaining
                  </div>
                  <div className={`text-6xl md:text-8xl font-tech font-bold ${isFocusMode ? 'text-danger drop-shadow-[0_0_30px_rgba(239,68,68,1)] animate-pulse' : 'text-gold drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]'}`}>
                    {isFocusMode ? formatTime(timeLeft) : `${activeTask.duration_hours}:00:00`}
                  </div>
                </div>

                {/* CONTROLS */}
                <div className="mt-auto">
                  {!isFocusMode ? (
                    <div className="flex flex-col gap-4">
                      <motion.button 
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => setShowFocusWarning(true)}
                        className="w-full bg-danger/10 border-2 border-danger text-danger py-5 rounded-lg font-display font-bold tracking-widest text-xl hover:bg-danger hover:text-black transition-all flex justify-center items-center gap-3 shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:shadow-[0_0_40px_rgba(239,68,68,0.6)] uppercase"
                      >
                        <Zap className="w-6 h-6"/> INITIATE STRICT MODE
                      </motion.button>
                      
                      <div className="flex flex-col md:flex-row gap-4 mt-2">
                        <button onClick={() => handleCompliance(activeTask.id, true)} className="flex-1 border border-success/40 text-success bg-success/5 hover:bg-success hover:text-black py-3 rounded-lg text-xs font-bold tracking-widest font-tech transition-all flex justify-center items-center gap-2 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                          <CheckCircle2 className="w-4 h-4"/> MANUAL BYPASS (DONE)
                        </button>
                        <button onClick={() => setShowFailureMode(!showFailureMode)} className="flex-1 border border-danger/40 text-danger bg-danger/5 hover:bg-danger hover:text-black py-3 rounded-lg text-xs font-bold tracking-widest font-tech transition-all flex justify-center items-center gap-2 shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                          <XCircle className="w-4 h-4"/> REPORT FAILURE
                        </button>
                      </div>
                    </div>
                  ) : (
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      onClick={() => handleCompliance(activeTask.id, false, "Surrendered during Strict Mode")}
                      className="w-full bg-black border-2 border-danger/80 text-danger py-5 rounded-lg font-display font-bold tracking-widest hover:bg-danger hover:text-white transition-all flex justify-center items-center gap-3 shadow-[0_0_30px_rgba(239,68,68,0.4)] uppercase"
                    >
                      <Skull className="w-6 h-6"/> SURRENDER TO PENALTY
                    </motion.button>
                  )}
                </div>
              </>
            )}

            {/* FAILURE REASON MODAL */}
            <AnimatePresence>
              {showFailureMode && activeTask && !isFocusMode && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                  className="border-danger border p-6 rounded-xl shadow-[0_0_20px_rgba(244,63,94,0.15)] mt-6 bg-[#0a0a0a]"
                >
                  <h3 className="text-danger tracking-widest uppercase flex items-center gap-2 mb-2 font-display font-bold text-lg">
                    <AlertTriangle className="w-5 h-5" /> Narrative Logging Required
                  </h3>
                  <p className="text-[10px] text-gray-400 font-tech uppercase font-bold mb-4">Select failure parameter for behavioral analysis.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FailureBtn label="YouTube Hole" onClick={() => handleCompliance(activeTask.id, false, "Distracted by YouTube")} />
                    <FailureBtn label="Social Media Doomscroll" onClick={() => handleCompliance(activeTask.id, false, "Scrolling Social Media")} />
                    <EnergyFailureBtn label="Energy Depletion" onClick={() => handleCompliance(activeTask.id, false, "Burnout / Too tired")} />
                    <FailureBtn label="Attention Drift" onClick={() => handleCompliance(activeTask.id, false, "Lost focus on the objective")} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ========================================== */}
        {/* PANE 3: WALL OF SHAME                      */}
        {/* ========================================== */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
          className={`lg:col-span-3 flex flex-col gap-5 transition-all duration-500 ${isFocusMode ? 'opacity-30 pointer-events-none grayscale blur-sm' : ''}`}
        >
          <div className="p-0 border border-danger/40 bg-black/80 rounded-xl relative overflow-hidden shadow-[0_0_30px_rgba(244,63,94,0.15)] h-full flex flex-col backdrop-blur-md">
            <div className="bg-danger/10 border-b border-danger/30 p-4 flex justify-between items-center">
              <h3 className="text-danger text-sm font-display font-bold tracking-widest uppercase flex items-center gap-2">
                <ShieldAlert className="w-5 h-5"/> PENALTY LOGS
              </h3>
              <span className="text-[9px] bg-danger text-white font-bold px-2 py-0.5 rounded uppercase tracking-widest shadow-[0_0_10px_rgba(239,68,68,0.5)]">Restricted</span>
            </div>
            
            <div className="p-5 overflow-y-auto custom-scrollbar font-mono flex-grow bg-transparent">
              {tasks.filter(t => t.status === 'Failed').length > 0 ? (
                tasks.filter(t => t.status === 'Failed').map(task => {
                  const { cleanName } = parseTaskName(task.task_name);
                  return (
                    <div key={task.id} className="mb-6 border-l-4 border-danger pl-4 last:mb-0">
                      <div className="text-xs font-bold text-danger mb-1.5 uppercase tracking-wide drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]">TARGET: {cleanName}</div>
                      <div className="text-[10px] text-gray-400 font-bold mb-3 bg-white/5 p-2 border border-white/5 rounded-lg shadow-inner">CAUSE: {task.failure_reason}</div>
                      
                      <button 
                        disabled={isFocusMode}
                        onClick={() => {
                          if (isFocusMode) return;
                          if(window.confirm("Initiate Redemption Protocol? This will mark the task complete and clear your calendar penalty.")) {
                            handleCompliance(task.id, true);
                          }
                        }}
                        className={`w-full text-[10px] font-bold px-3 py-2 rounded-lg tracking-widest uppercase transition-all flex items-center justify-center gap-2 shadow-sm
                          ${isFocusMode 
                            ? 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed' 
                            : 'bg-success/10 text-success border border-success/30 hover:bg-success hover:text-black'}`}
                      >
                        <Zap className="w-3.5 h-3.5" /> REDEEM SCHEDULE
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full opacity-60 py-10">
                  <ShieldAlert className="w-12 h-12 text-success mb-4 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                  <div className="text-[10px] text-success tracking-widest font-bold uppercase text-center">Logs Clear.<br/>No Active Violations.</div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

      </div>

      {/* V2 STRICT MODE WARNING MODAL */}
      <AnimatePresence>
        {showFocusWarning && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-[#050000] border-2 border-danger max-w-lg w-full p-8 md:p-10 rounded-2xl shadow-[0_0_80px_rgba(239,68,68,0.4)] text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-danger animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.8)]"></div>

              <ShieldAlert className="w-16 h-16 text-danger mx-auto mb-5 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" />

              <h2 className="text-3xl font-display font-bold text-white tracking-widest uppercase mb-2">Point of No Return</h2>

              <p className="text-danger font-tech text-sm font-bold tracking-widest uppercase mb-8">Strict Mode Engagement</p>

              <div className="bg-danger/10 border border-danger/30 p-5 rounded-xl text-left mb-10 shadow-[inset_0_0_20px_rgba(239,68,68,0.1)]">
                <ul className="text-gray-300 font-tech text-sm space-y-4 font-bold">
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 mt-0.5 text-danger flex-shrink-0" />
                    <div>The terminal will lock for <span className="text-danger">{activeTask?.duration_hours} hour(s)</span>.</div>
                  </li>
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 mt-0.5 text-danger flex-shrink-0" />
                    <div>
                      <span className="font-extrabold text-white uppercase">Stay on this exact screen.</span> Switching browser tabs or clicking other UI navigation will instantly deploy a failure penalty.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 mt-0.5 text-danger flex-shrink-0" />
                    <div>If you fail, the AI will immediately hijack your Google Calendar.</div>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <button 
                  onClick={() => setShowFocusWarning(false)}
                  className="flex-1 border-2 border-gray-600 text-gray-400 py-3.5 rounded-lg font-display font-bold tracking-widest hover:bg-gray-800 transition-colors uppercase"
                >
                  ABORT
                </button>
                <button 
                  onClick={startFocusProtocol}
                  className="flex-1 bg-danger text-white py-3.5 rounded-lg font-display font-bold tracking-widest hover:bg-red-600 hover:shadow-[0_0_30px_rgba(239,68,68,0.6)] transition-all uppercase"
                >
                  ENGAGE PROTOCOL
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// V2 Enhanced Buttons
function FailureBtn({ label, onClick }) {
  return (
    <button 
      onClick={onClick}
      className="bg-danger/5 border border-danger/30 text-danger/90 py-3 px-2 rounded-lg text-[10px] md:text-xs font-bold tracking-widest font-tech uppercase hover:bg-danger hover:text-black transition-all shadow-[0_0_10px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]"
    >
      {label}
    </button>
  );
}

function EnergyFailureBtn({ label, onClick }) {
  return (
    <button 
      onClick={onClick}
      className="bg-yellow-500/5 border border-yellow-500/30 text-yellow-500/90 py-3 px-2 rounded-lg text-[10px] md:text-xs font-bold tracking-widest font-tech uppercase hover:bg-yellow-500 hover:text-black transition-all shadow-[0_0_10px_rgba(234,179,8,0.1)] hover:shadow-[0_0_20px_rgba(234,179,8,0.4)]"
    >
      {label}
    </button>
  );
}
