import React, { useState, useEffect } from 'react';
import { User, Shield, Flame, Zap, Terminal, Edit2, Check, BookOpen, ShieldCheck, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '../firebase'; 
import { doc, getDoc, setDoc } from 'firebase/firestore';


const API_BASE = import.meta.env.VITE_API_BASE;

export default function Profile({ stats }) {
  const [isEditing, setIsEditing] = useState(false);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState(null); 
  
  
  const [liveStats, setLiveStats] = useState(stats || null);
  
  const [profile, setProfile] = useState({
    nickname: "LOADING...",
    role: "OPERATOR",
    context: "INITIALIZING...",
    battleStation: "",
    defaultSyllabus: ""
  });

  const getAuthHeaders = async () => {
    const token = await auth.currentUser?.getIdToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  useEffect(() => {
    let isMounted = true;

    const fetchAllData = async () => {
      try {
        const user = auth.currentUser;
        if (user && isMounted) {
          setPhotoUrl(user.photoURL); 
          
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            setProfile({
              nickname: data.nickname || "UNKNOWN",
              role: data.role || "OPERATOR",
              context: data.context || "UNASSIGNED",
              battleStation: data.battleStation || "Porur HQ - Dell Terminal",
              defaultSyllabus: data.defaultSyllabus || "Anna University R2025"
            });
          }
        }

        const headers = await getAuthHeaders();
        
        
        const [histRes, scoreRes] = await Promise.all([
          fetch(`${API_BASE}/history`, { headers }),
          fetch(`${API_BASE}/score`, { headers })
        ]);

        if (isMounted) {
          if (histRes.ok) setHistoryLogs(await histRes.json());
          if (scoreRes.ok) setLiveStats(await scoreRes.json());
        }

      } catch (err) {
        console.error("⚠️ Failed to load profile telemetry:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchAllData();
    return () => { isMounted = false; };
  }, []);


  const handleSaveProfile = async () => {
    setIsEditing(false);
    try {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        await setDoc(docRef, {
          nickname: profile.nickname,
          role: profile.role,
          battleStation: profile.battleStation,
          defaultSyllabus: profile.defaultSyllabus
        }, { merge: true });
        
        window.dispatchEvent(new Event('syllabusUpdated'));
      }
    } catch (error) {
      console.error("⚠️ Error syncing profile to cloud:", error);
    }
  };

  const generateHeatmap = () => {
    const today = new Date();
    const days = [];
    const historyMap = {};

    historyLogs.forEach(log => {
      if (log.status === 'Done') {
        const dateStr = new Date(log.logged_at).toLocaleDateString('en-CA'); 
        historyMap[dateStr] = (historyMap[dateStr] || 0) + 1;
      }
    });

    for (let i = 181; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toLocaleDateString('en-CA');
      days.push({ date: dateStr, count: historyMap[dateStr] || 0 });
    }
    return days;
  };

  const heatmapData = generateHeatmap();
  const currentStats = liveStats || stats;
  const xpPercentage = currentStats ? Math.min((currentStats.xp_balance / 10000) * 100, 100) : 0;

  const inputStyle = "bg-[#0a0a0a] border border-white/10 p-2 rounded-lg text-white focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-all shadow-inner w-full";

  return (
    <div className="flex flex-col h-full pb-10 relative bg-[#050505] min-h-screen text-white font-sans">
      
      <motion.header 
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="mb-8 border-b border-gold/20 pb-6 flex items-center justify-between gap-4 px-2 pt-4"
      >
        <div className="flex items-center gap-4">
          <div className="p-2 bg-white/5 rounded-lg shadow-sm border border-white/5">
            <User className="w-8 h-8 text-gold drop-shadow-sm" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-display tracking-widest text-white uppercase leading-none">Operator Profile</h2>
            <p className="text-xs text-gray-500 font-tech tracking-widest mt-1 uppercase font-bold">Cloud Identity & Telemetry</p>
          </div>
        </div>
        
        <div className="hidden md:flex text-xs text-gray-400 uppercase tracking-widest items-center gap-2 bg-black/40 px-4 py-2 rounded-lg border border-white/10 shadow-sm font-bold">
          System Status: <span className="text-success flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-success animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.8)]"></div> Optimal</span>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 px-2">
        
        <motion.div 
          initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="xl:col-span-8 flex flex-col gap-6"
        >
          <div className="p-6 md:p-8 border border-gold/40 shadow-neon-gold rounded-xl relative overflow-hidden bg-[#0a0a0a] backdrop-blur-md">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-gold/10 via-gold to-gold/10"></div>
            
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start">
              
              <div className="w-28 h-28 rounded-xl border-2 border-gold/50 bg-black/50 flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.2)] flex-shrink-0 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gold/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                {photoUrl ? (
                  <img src={photoUrl} alt="Operator" className="w-full h-full object-cover z-10" />
                ) : (
                  <User className="w-12 h-12 text-gold/60 group-hover:text-gold transition-colors z-10" />
                )}
              </div>
              
              <div className="flex-1 w-full text-center md:text-left relative">
                
                <motion.button 
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={isEditing ? handleSaveProfile : () => setIsEditing(true)}
                  className="absolute top-0 right-0 p-2.5 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-gold transition-colors z-10 shadow-sm"
                >
                  {isEditing ? <Check className="w-4 h-4 text-success" /> : <Edit2 className="w-4 h-4" />}
                </motion.button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pr-14">
                  <div className="w-full">
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={profile.nickname} 
                        onChange={(e) => setProfile({...profile, nickname: e.target.value})} 
                        className={`${inputStyle} text-xl md:text-2xl font-display font-bold tracking-widest uppercase mb-2`}
                        placeholder="OPERATOR ALIAS"
                      />
                    ) : (
                      <h2 className="text-3xl md:text-4xl font-display font-bold text-white tracking-widest uppercase">
                        {isLoading ? "..." : profile.nickname}
                      </h2>
                    )}
                    <p className="text-gold text-sm font-tech font-bold tracking-widest uppercase mt-1">
                      {isLoading ? "..." : profile.context}
                    </p>
                  </div>
                  
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={profile.role} 
                      onChange={(e) => setProfile({...profile, role: e.target.value})} 
                      className={`${inputStyle} text-xs uppercase tracking-widest text-gold font-bold w-full md:w-32 mt-2 md:mt-0`}
                      placeholder="ROLE"
                    />
                  ) : (
                    <div className="border border-gold/30 bg-gold/10 text-gold px-4 py-1.5 rounded-lg flex items-center justify-center md:justify-start gap-2 text-xs uppercase tracking-widest whitespace-nowrap mt-2 md:mt-0 font-bold shadow-sm">
                      <ShieldCheck className="w-4 h-4" /> {profile.role}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 border-t border-white/10 pt-5">
                  <div className="flex items-center gap-3 text-sm text-gray-300 font-tech font-bold bg-black/40 p-2.5 rounded-lg border border-white/5">
                    <MapPin className="w-4 h-4 text-gold flex-shrink-0" />
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={profile.battleStation}
                        onChange={(e) => setProfile({...profile, battleStation: e.target.value})}
                        className={inputStyle}
                        placeholder="Location / Station Name"
                      />
                    ) : (
                      <span className="truncate">{profile.battleStation}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm text-gray-300 font-tech font-bold bg-black/40 p-2.5 rounded-lg border border-white/5">
                    <BookOpen className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={profile.defaultSyllabus}
                        onChange={(e) => setProfile({...profile, defaultSyllabus: e.target.value})}
                        className={inputStyle}
                        placeholder="Global Target Config"
                      />
                    ) : (
                      <span className="truncate text-cyan-400" title={profile.defaultSyllabus}>Target: {profile.defaultSyllabus}</span>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>

          <div className="p-6 border border-white/10 rounded-xl bg-[#0a0a0a] shadow-sm backdrop-blur-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-display text-gray-300 tracking-widest uppercase font-bold">Execution Matrix</h3>
              <span className="text-[10px] border border-white/10 text-gray-500 px-2.5 py-1 rounded uppercase tracking-widest font-bold bg-black/30">Last 182 Days</span>
            </div>
            
            {/*  FIXED SCROLL CONTAINER */}
            <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
              <div className="flex items-start gap-4 min-w-max pr-4">
                
                {/* Sticky Days Column */}
                <div className="flex flex-col justify-between h-[100px] text-[10px] text-gray-600 uppercase tracking-widest py-1 font-bold sticky left-0 bg-[#0a0a0a] z-10 pr-2">
                  <span>Mon</span><span>Wed</span><span>Fri</span>
                </div>
                
                {/* Expanding Grid */}
                <div className="grid grid-rows-7 grid-flow-col gap-1.5 h-[100px]">
                  {heatmapData.map((day, i) => {
                    let colorClass = 'bg-white/5 hover:border-white/50 border-transparent'; 
                    if (day.count === 1) colorClass = 'bg-success/30 border border-success/10 hover:border-success/50'; 
                    if (day.count === 2 || day.count === 3) colorClass = 'bg-success/70 border border-success/30 hover:brightness-110'; 
                    if (day.count >= 4) colorClass = 'bg-success shadow-[0_0_8px_rgba(16,185,129,0.8)] border border-success hover:brightness-125'; 

                    return (
                      <div 
                        key={i} 
                        className={`w-[11px] h-[11px] rounded-[2px] border ${colorClass} transition-all cursor-pointer relative group`} 
                      >
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1.5 hidden group-hover:block bg-black border border-white/20 text-white text-[10px] font-tech font-bold px-2.5 py-1 rounded whitespace-nowrap z-50 pointer-events-none shadow-xl">
                          {day.count} Executions on {day.date}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>
            
            <div className="flex justify-end gap-2.5 text-[10px] uppercase tracking-widest text-gray-500 mt-4 items-center font-tech font-bold">
              <span>Less</span>
              <div className="w-3 h-3 rounded-[2px] bg-white/5 border border-transparent"></div>
              <div className="w-3 h-3 rounded-[2px] bg-success/30 border border-success/10"></div>
              <div className="w-3 h-3 rounded-[2px] bg-success/70 border border-success/30"></div>
              <div className="w-3 h-3 rounded-[2px] bg-success shadow-[0_0_5px_rgba(16,185,129,0.8)]"></div>
              <span>More</span>
            </div>
          </div>

        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          className="xl:col-span-4 flex flex-col gap-6"
        >
          <div className="p-6 md:p-8 border border-gold/30 rounded-xl relative overflow-hidden bg-[#121212] shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <Flame className={`w-8 h-8 ${currentStats?.streak > 0 ? 'text-danger animate-pulse drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 'text-gray-600'}`} />
              <h3 className={`text-2xl font-display font-bold tracking-widest ${currentStats?.streak > 0 ? 'text-white' : 'text-gray-500'}`}>{currentStats?.streak || 0} DAY STREAK</h3>
            </div>
            
            <div className="flex justify-between text-xs text-gold mb-3 tracking-widest uppercase items-end mt-8 font-bold">
              <span className="text-5xl font-tech drop-shadow-[0_0_10px_rgba(251,191,36,0.5)] text-gold">{currentStats?.xp_balance || 0}</span>
              <span>XP EARNED</span>
            </div>
            <div className="w-full bg-black/60 border border-gold/20 rounded-full h-3 mb-6 shadow-inner overflow-hidden">
              <motion.div 
                initial={{ width: 0 }} animate={{ width: `${xpPercentage}%` }} transition={{ duration: 1.5 }}
                className="bg-gradient-to-r from-gold/80 to-gold h-full rounded-full shadow-[0_0_10px_#fbbf24]"
              ></motion.div>
            </div>
            <div className="text-center text-xs text-gray-400 uppercase tracking-widest font-bold border-t border-white/10 pt-5 flex items-center justify-center gap-2">
              <Shield className="w-4 h-4 text-gold"/> Level 12 — Executioner
            </div>
          </div>

          <div className="p-6 border border-cyan-500/20 bg-[#08101a] rounded-xl shadow-sm flex-grow flex flex-col">
            <h3 className="text-cyan-400 text-sm font-display font-bold tracking-widest uppercase flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4"/> Execution Analytics
            </h3>
            <p className="text-xs text-cyan-100/90 mb-5 leading-relaxed font-tech font-bold">
              Operator <span className="text-cyan-300">[{profile.nickname}]</span>, global pattern analysis verified:
            </p>
            
            <div className="flex-grow"></div>

            <ul className="text-xs text-cyan-200/80 space-y-4 font-tech font-bold">
              <li className="flex justify-between items-center bg-black/50 p-3 rounded-lg border border-cyan-500/20 shadow-sm">
                <span className="flex gap-2.5 items-center"><div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_5px_#06b6d4]"></div> Compliance</span>
                <span className="text-cyan-400 text-sm">{currentStats?.compliance_score || "100%"}</span>
              </li>
              <li className="flex justify-between items-center bg-black/50 p-3 rounded-lg border border-danger/20 shadow-sm">
                <span className="flex gap-2.5 items-center"><div className="w-2 h-2 rounded-full bg-danger shadow-[0_0_5px_#ef4444]"></div> Failures</span>
                <span className="text-danger text-sm">{currentStats?.total_failures || 0}</span>
              </li>
            </ul>
          </div>
        </motion.div>

      </div>
    </div>
  );
}