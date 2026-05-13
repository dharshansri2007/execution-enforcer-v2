import React, { useState, useEffect } from 'react';
import { Flame, Activity, CheckSquare, PlusCircle, AlertTriangle, Zap, BookOpen, Wrench, User, Briefcase, Loader, BarChart3, ShieldCheck, Target, Crosshair } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../firebase'; 


const API_BASE = import.meta.env.VITE_API_BASE;

export default function Home({ stats }) {
  const [tasks, setTasks] = useState([]);
  const [history, setHistory] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  
  const [liveStats, setLiveStats] = useState(stats);
  
  const loadingPhrases = ["DISPATCHING DIRECTIVE...", "VERTEX AI STRUCTURING...", "OPTIMIZING WORKFLOW...", "ENFORCING PROTOCOL..."];
  const [loadingText, setLoadingText] = useState(loadingPhrases[0]);
  
  const [directiveType, setDirectiveType] = useState('Study'); 
  const [formData, setFormData] = useState({
    subject: '',
    syllabus: 'Anna University R2025 - CSE AI ML',
    difficulty: 'Medium',
    duration: 2,
    reference: '',
    skillName: '',
    level: 'Beginner',
    taskName: '',
    ticketId: '',
    priority: 'Standard'
  });

  useEffect(() => {
    fetchTasks();
    fetchHistory();
    fetchLiveStats(); // Fetch fresh stats immediately on component mount
  }, []);

  useEffect(() => {
    let interval;
    if (isGenerating) {
      let i = 0;
      interval = setInterval(() => {
        i = (i + 1) % loadingPhrases.length;
        setLoadingText(loadingPhrases[i]);
      }, 2000); 
    } else {
      setLoadingText(loadingPhrases[0]);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const getAuthHeaders = async () => {
    const token = await auth.currentUser?.getIdToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  
  const fetchLiveStats = async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/score`, { headers });
      if(res.ok) setLiveStats(await res.json());
    } catch (err) {
      console.error("Failed to fetch live stats", err);
    }
  };

  const fetchTasks = async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/tasks`, { headers });
      if(res.ok) setTasks(await res.json());
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    }
  };

  const fetchHistory = async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/history`, { headers });
      if(res.ok) setHistory(await res.json());
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  const handleAddDirective = async () => {
    if (directiveType === 'Study' && !formData.subject) return alert("Subject required.");
    if (directiveType === 'Skill' && !formData.skillName) return alert("Skill name required.");
    if (directiveType === 'Personal' && !formData.taskName) return alert("Task name required.");
    if (directiveType === 'IT Sprint' && !formData.ticketId) return alert("Ticket ID/Description required.");

    setIsGenerating(true);
    
    let structuredGoal = "";
    if (directiveType === 'Study') {
      structuredGoal = `[STUDY MODE] Subject: ${formData.subject}. Syllabus Context: ${formData.syllabus}. Target Difficulty: ${formData.difficulty}. Total Time: ${formData.duration} hours. Reference Material: ${formData.reference || 'None provided'}.`;
    } else if (directiveType === 'Skill') {
      structuredGoal = `[SKILL MODE] Target Skill: ${formData.skillName}. Current Level: ${formData.level}. Total Time: ${formData.duration} hours.`;
    } else if (directiveType === 'Personal') {
      structuredGoal = `[PERSONAL MODE] Task: ${formData.taskName}. Duration: ${formData.duration} hours. (Bypass AI Breakdown, direct save).`;
    } else if (directiveType === 'IT Sprint') {
      structuredGoal = `[ENTERPRISE MODE] Jira Ticket / Workflow: ${formData.ticketId}. Priority Level: ${formData.priority}. Allocated Sprint Time: ${formData.duration} hours.`;
    }

    try {
      const headers = await getAuthHeaders();
      await fetch(`${API_BASE}/plan`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ goal: structuredGoal })
      });
      
      setFormData(prev => ({...prev, subject: '', skillName: '', taskName: '', ticketId: ''}));
      fetchTasks();
    } catch (err) {
      console.error("Failed to generate plan", err);
    } finally {
      setIsGenerating(false);
    }
  };

  
  const handleCompleteTask = async (taskId) => {
    try {
      const headers = await getAuthHeaders();
      await fetch(`${API_BASE}/check-compliance`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ task_id: taskId, completed: true })
      });
      fetchTasks(); 
      fetchHistory(); // Instantly update 7-Day Chart
      fetchLiveStats(); // Instantly update XP and Compliance
    } catch (err) {
      console.error("Failed to complete task", err);
    }
  };

  const getWeeklyData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    let weekStats = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      weekStats.push({ 
        day: days[d.getDay()], 
        dateStr: d.toDateString(), 
        done: 0, 
        failed: 0,
      });
    }

    history.forEach(log => {
      const logDate = new Date(log.logged_at).toDateString();
      const targetDay = weekStats.find(w => w.dateStr === logDate);
      if (targetDay) {
        if (log.status === 'Done') targetDay.done += 1;
        if (log.status === 'Failed') targetDay.failed += 1;
      }
    });

    const maxTasksInOneDay = Math.max(...weekStats.map(w => w.done + w.failed), 1);
    return weekStats.map(w => ({
      ...w,
      heightDone: (w.done / maxTasksInOneDay) * 100,
      heightFail: (w.failed / maxTasksInOneDay) * 100
    }));
  };

  const weeklyChart = getWeeklyData();
  const currentStats = liveStats || stats; // Fallback to props if live fetch hasn't completed

  const inputStyle = "w-full bg-[#121212] border border-white/10 p-2.5 rounded-lg text-white focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-all shadow-inner";

  return (
    <div className="flex flex-col h-full pb-10 bg-[#0a0a0a] min-h-screen text-white font-sans">
      
      <motion.header 
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-4 gap-4 pt-4 px-2"
      >
        <div>
          <h2 className="text-2xl md:text-3xl font-display tracking-widest text-white uppercase leading-none">
            Welcome, Sir.
          </h2>
          <span className="text-gold font-display text-lg tracking-[0.2em] flex items-center gap-2 mt-1 drop-shadow-sm">
            <ShieldCheck className="w-5 h-5" /> SYSTEM DIRECTOR
          </span>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <StatBadge icon={<Target className="w-4 h-4 text-gold"/>} label="XP Earned" value={currentStats?.xp_balance || 0} color="text-gold" />
          <StatBadge icon={<AlertTriangle className="w-4 h-4 text-danger"/>} label="Failures" value={currentStats?.total_failures || 0} color="text-danger" />
          <StatBadge icon={<Activity className="w-4 h-4 text-cyan-400"/>} label="Compliance" value={currentStats?.compliance_score || "100%"} color="text-cyan-400" />
        </div>
      </motion.header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 px-2">
        
        <div className="xl:col-span-8 flex flex-col gap-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="p-6 border border-gold/40 shadow-neon-gold rounded-xl relative overflow-hidden bg-black/40 backdrop-blur-md"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold/10 via-gold to-gold/10"></div>
            
            <div className="flex items-center gap-3 mb-6">
              <Zap className="text-gold w-6 h-6 animate-pulse drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
              <h3 className="text-base text-gray-200 font-display tracking-widest uppercase">New Execution Directive</h3>
            </div>

            <div className="flex flex-wrap md:flex-nowrap gap-2 mb-6 bg-black/40 p-1.5 rounded-lg border border-white/5">
              {['Study', 'Skill', 'Personal', 'IT Sprint'].map(type => (
                <button 
                  key={type}
                  onClick={() => setDirectiveType(type)}
                  className={`flex-1 py-2.5 px-2 text-xs tracking-widest uppercase font-display rounded-md transition-all flex justify-center items-center gap-2
                    ${directiveType === type 
                      ? 'bg-gold/20 text-gold border border-gold/30 shadow-[0_0_10px_rgba(251,191,36,0.2)]' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  {type === 'Study' && <BookOpen className="w-3.5 h-3.5"/>}
                  {type === 'Skill' && <Wrench className="w-3.5 h-3.5"/>}
                  {type === 'Personal' && <User className="w-3.5 h-3.5"/>}
                  {type === 'IT Sprint' && <Briefcase className="w-3.5 h-3.5 text-cyan-400"/>}
                  {type}
                </button>
              ))}
            </div>

            <div className="space-y-4 font-tech text-sm">
              {directiveType === 'Study' && (
                <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs text-gray-400 mb-1.5 block uppercase tracking-wider font-bold">Subject / Topic</label>
                    <input type="text" placeholder="e.g., Semiconductor Physics" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className={inputStyle} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gold/80 mb-1.5 block flex items-center gap-2 uppercase tracking-wider font-bold">
                      <Crosshair className="w-3 h-3"/> Context Boundary (Syllabus Lock)
                    </label>
                    <input type="text" value={formData.syllabus} onChange={e => setFormData({...formData, syllabus: e.target.value})} className="w-full bg-gold/5 border border-gold/30 p-2.5 rounded-lg text-gold/90 outline-none font-mono text-xs shadow-inner focus:ring-1 focus:ring-gold" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block uppercase tracking-wider font-bold">Difficulty</label>
                    <select value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})} className={inputStyle}>
                      <option>Easy</option><option>Medium</option><option>Brutal</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block uppercase tracking-wider font-bold">Duration (Hours)</label>
                    <input type="number" min="0.5" max="8" step="0.5" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} className={inputStyle} />
                  </div>
                </motion.div>
              )}

              {directiveType === 'IT Sprint' && (
                <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs text-cyan-500 mb-1.5 block uppercase tracking-wider font-bold flex items-center gap-2">
                      <Briefcase className="w-3 h-3"/> Ticket ID / Objective
                    </label>
                    <input type="text" placeholder="e.g., ENG-402: Refactor Payment Gateway" value={formData.ticketId} onChange={e => setFormData({...formData, ticketId: e.target.value})} className="w-full bg-cyan-900/10 border border-cyan-500/30 p-2.5 rounded-lg text-cyan-100 focus:border-cyan-400 outline-none focus:ring-1 focus:ring-cyan-400 shadow-inner" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block uppercase tracking-wider font-bold">Priority</label>
                    <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className={inputStyle}>
                      <option>Standard</option><option>High</option><option className="text-danger font-bold">Critical P0</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block uppercase tracking-wider font-bold">Sprint Hours</label>
                    <input type="number" min="1" max="12" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} className={inputStyle} />
                  </div>
                </motion.div>
              )}

              {(directiveType === 'Skill' || directiveType === 'Personal') && (
                <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} className="grid grid-cols-2 gap-4">
                   <div className="col-span-2">
                    <label className="text-xs text-gray-400 mb-1.5 block uppercase tracking-wider font-bold">Target Name</label>
                    <input type="text" placeholder="What are we doing?" value={directiveType === 'Skill' ? formData.skillName : formData.taskName} onChange={e => setFormData(directiveType === 'Skill' ? {...formData, skillName: e.target.value} : {...formData, taskName: e.target.value})} className={inputStyle} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-400 mb-1.5 block uppercase tracking-wider font-bold">Duration (Hours)</label>
                    <input type="number" min="0.5" max="8" step="0.5" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} className={inputStyle} />
                  </div>
                </motion.div>
              )}
            </div>

            <div className="mt-8 flex justify-end">
               <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddDirective}
                disabled={isGenerating}
                className={`relative group overflow-hidden px-8 py-3.5 font-display text-lg tracking-widest rounded-lg transition-all flex items-center gap-3 border
                  ${isGenerating ? 'opacity-70 cursor-not-allowed border-gray-500 text-gray-400' : 'border-gold text-gold hover:text-black'}
                  ${!isGenerating && directiveType === 'IT Sprint' ? 'border-cyan-500 text-cyan-400 hover:text-black' : ''}`}
              >
                {!isGenerating && (
                  <div className={`absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out -z-10
                    ${directiveType === 'IT Sprint' ? 'bg-cyan-400' : 'bg-gold'}`}></div>
                )}
                {isGenerating ? <><Loader className="w-5 h-5 animate-spin" /> {loadingText}</> : 'EXECUTE DIRECTIVE'}
              </motion.button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="p-6 border border-gold/20 rounded-xl flex-grow shadow-sm bg-[#121212]/50"
          >
            <div className="flex items-center justify-between border-b border-gold/20 pb-4 mb-4">
              <h3 className="text-sm text-gray-300 font-display tracking-widest uppercase flex items-center gap-2 font-bold">
                <CheckSquare className="w-5 h-5 text-gold" /> Active Protocol 
                <span className="bg-gold/20 text-gold px-2 py-0.5 rounded text-xs ml-2">{tasks.length}</span>
              </h3>
            </div>
            
            <div className="flex flex-col gap-3">
              <AnimatePresence>
                {tasks.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-gray-500 py-10 font-tech text-sm tracking-widest uppercase">
                    No active directives. <br/> Awaiting command.
                  </motion.div>
                ) : (
                  tasks.map((task) => (
                    <TaskRow key={task.id} task={task} onComplete={handleCompleteTask} />
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>

        </div>

        <div className="xl:col-span-4 flex flex-col gap-6">
          
          <motion.div 
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="p-6 border border-gold/30 rounded-xl relative overflow-hidden shadow-sm bg-[#121212]"
          >
            <div className="flex items-center gap-3 mb-6">
              <Flame className="text-danger w-7 h-7 animate-pulse drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
              <h3 className="text-2xl font-display text-white tracking-widest">{currentStats?.streak || 0} DAY STREAK</h3>
            </div>
            <div className="flex justify-between text-xs text-gold font-bold mb-2 tracking-widest uppercase font-tech">
              <span>XP: {currentStats?.xp_balance || 0}</span><span>10,000</span>
            </div>
            
            <div className="w-full bg-black/50 border border-gold/30 rounded-full h-2.5 mb-2 overflow-hidden shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(((currentStats?.xp_balance || 0) / 10000) * 100, 100)}%` }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                className="bg-gradient-to-r from-gold/80 to-gold h-full rounded-full shadow-[0_0_12px_#fbbf24]"
              ></motion.div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="p-6 border border-white/10 rounded-xl relative overflow-hidden shadow-sm bg-[#121212]/80"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-display text-gray-300 tracking-widest uppercase font-bold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-gold" /> Execution Pattern
              </h3>
              <span className="text-[9px] uppercase tracking-widest text-gray-500 border border-white/10 px-2 py-1 rounded">Past 7 Days</span>
            </div>

            <div className="flex items-end justify-between h-[140px] gap-2 border-b border-white/10 pb-3">
              {weeklyChart.map((stat, i) => (
                <div key={i} className="flex flex-col items-center gap-2 w-full group relative">
                  <div className="absolute -top-10 bg-black border border-white/10 text-[10px] font-tech text-white px-2.5 py-1.5 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 -translate-y-2 group-hover:translate-y-0 z-10 whitespace-nowrap shadow-xl">
                    <span className="text-success font-bold">{stat.done} Done</span> / <span className="text-danger font-bold">{stat.failed} Fail</span>
                  </div>
                  
                  <div className="w-full flex flex-col justify-end h-[100px] gap-0.5 rounded-sm overflow-hidden bg-white/5">
                    {stat.heightFail > 0 && (
                      <motion.div initial={{ height: 0 }} animate={{ height: `${stat.heightFail}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} className="w-full bg-danger/90 rounded-t-sm"></motion.div>
                    )}
                    {stat.heightDone > 0 && (
                      <motion.div initial={{ height: 0 }} animate={{ height: `${stat.heightDone}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} className="w-full bg-success/90 rounded-t-sm"></motion.div>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-500 font-tech uppercase font-bold">{stat.day}</span>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between mt-4 text-[10px] font-tech tracking-widest uppercase font-bold text-gray-400">
              <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-success rounded-sm shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div> Successful</span>
              <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-danger rounded-sm shadow-[0_0_5px_rgba(244,63,94,0.5)]"></div> Failed</span>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="p-6 border border-danger/40 bg-danger/5 rounded-xl relative overflow-hidden shadow-[0_0_20px_rgba(244,63,94,0.05)]"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-danger"></div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="text-danger w-5 h-5 animate-pulse drop-shadow-[0_0_5px_rgba(244,63,94,0.8)]" />
              <h3 className="text-sm font-display font-bold text-danger tracking-widest uppercase">Threat Level</h3>
            </div>
            <h2 className="text-3xl text-white font-bold tracking-widest mb-2 drop-shadow-[0_0_5px_rgba(239,68,68,0.3)]">ELEVATED</h2>
            <p className="text-xs text-gray-400 leading-relaxed font-tech">
              Failure to complete active protocol will result in severe digital roasting and <span className="text-danger font-bold">Calendar Penalties</span>.
            </p>
          </motion.div>

        </div>
      </div>
    </div>
  );
}

function TaskRow({ task, onComplete }) {
  const isDone = task.status === 'Done';
  const isFailed = task.status === 'Failed';
  
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: isDone || isFailed ? 1 : 1.01 }}
      className={`flex items-center justify-between p-3.5 md:p-4 border rounded-lg transition-all group
        ${isDone ? 'border-success/40 bg-success/10 shadow-sm' 
        : isFailed ? 'border-danger/40 bg-danger/10 shadow-sm' 
        : 'border-white/10 bg-black/30 hover:border-gold/50 hover:shadow-[0_0_15px_rgba(251,191,36,0.1)]'}
      `}
    >
      <div className="flex items-center gap-4">
        <button 
          onClick={() => !isDone && !isFailed && onComplete(task.id)}
          disabled={isDone || isFailed}
          className={`${isDone || isFailed ? 'cursor-default' : 'cursor-pointer hover:scale-110 transition-transform active:scale-95'}`}
        >
          <CheckSquare className={`w-5 h-5 md:w-6 md:h-6 ${isDone ? 'text-success drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]' : isFailed ? 'text-danger' : 'text-gray-500 group-hover:text-gold'} transition-all`} />
        </button>
        <span className={`text-sm md:text-base tracking-wide font-display ${isDone ? 'text-success line-through opacity-80' : isFailed ? 'text-danger line-through opacity-80' : 'text-gray-200 font-bold'}`}>
          {task.task_name}
        </span>
      </div>
      
      <div className="flex items-center gap-3 md:gap-5 text-xs font-tech">
        <span className={`px-2 py-1 rounded bg-white/5 ${isDone ? 'text-success' : isFailed ? 'text-danger' : 'text-gray-400 font-bold'}`}>
          {task.duration_hours} hr
        </span>
        <span className={`w-16 md:w-20 text-right uppercase tracking-widest text-[10px] md:text-xs font-bold
          ${isDone ? 'text-success' : isFailed ? 'text-danger' : 'text-gray-500'}`}>
          {task.status}
        </span>
      </div>
    </motion.div>
  );
}

function StatBadge({ icon, label, value, color }) {
  return (
    <div className="flex items-center gap-3 bg-[#121212] px-4 py-2 border border-white/5 rounded-lg shadow-sm">
      <div className="p-1.5 rounded-md bg-white/5 shadow-sm">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[9px] uppercase tracking-widest text-gray-500 font-tech">{label}</span>
        <span className={`${color} font-display font-bold text-sm leading-none mt-0.5`}>{value}</span>
      </div>
    </div>
  );
}