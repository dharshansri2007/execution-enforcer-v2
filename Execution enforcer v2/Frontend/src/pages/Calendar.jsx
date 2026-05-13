import React, { useState, useEffect } from 'react';
import { Calendar as CalIcon, CheckCircle2, AlertTriangle, Clock, Flame, ChevronLeft, ChevronRight, Zap, Target, ShieldAlert, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../firebase'; 

const API_BASE = import.meta.env.VITE_API_BASE;

export default function CalendarSync({ stats }) {
  const [penalties, setPenalties] = useState([]);
  const [weekDays, setWeekDays] = useState([]);
  const [todayIndex, setTodayIndex] = useState(0);
  const [weekOffset, setWeekOffset] = useState(0); 
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  //  THE FIX: LIVE STATE SYNC
  const [liveStats, setLiveStats] = useState(stats || null);

  const getAuthHeaders = async () => {
    const token = await auth.currentUser?.getIdToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const headers = await getAuthHeaders();
        //  MULTI-FETCH: GET CALENDAR BLOCKS & LIVE SCORE
        const [penRes, scoreRes] = await Promise.all([
          fetch(`${API_BASE}/penalties`, { headers }),
          fetch(`${API_BASE}/score`, { headers })
        ]);

        if (isMounted) {
          if (penRes.ok) setPenalties(await penRes.json());
          if (scoreRes.ok) setLiveStats(await scoreRes.json());
        }
      } catch (err) {
        console.error("🚨 Cloud Run Fetch Failed:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    fetchData();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    const realToday = new Date();
    const curr = new Date();
    curr.setDate(curr.getDate() + (weekOffset * 7));

    const currentDay = curr.getDay(); 
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;

    const monday = new Date(curr);
    monday.setDate(curr.getDate() + distanceToMonday);

    const days = [];
    let tIndex = -1; 

    for (let i = 0; i < 6; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const isRealToday = d.toDateString() === realToday.toDateString();
      if (isRealToday) tIndex = i;
      
      days.push({
        day: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
        date: d.getDate(),
        isToday: isRealToday
      });
    }
    setWeekDays(days);
    setTodayIndex(tIndex);
  }, [weekOffset]);

  const handleOptimize = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
      alert("[SYSTEM]: Optimization Authorized. AI has successfully re-routed your Google Calendar for maximum focus output.");
    }, 2000);
  };

  const currentStats = liveStats || stats;
  const xpPercentage = currentStats ? Math.min((currentStats.xp_balance / 10000) * 100, 100) : 0;
  const activeStreak = currentStats ? currentStats.streak : 0;
  
  const renderIndex = todayIndex !== -1 ? todayIndex : 2; 
  const todayLeftPosition = `${renderIndex * 16.66}%`;

  // Time Grid Variables
  const startHour = 8; // 8 AM
  const totalHours = 14; // 8 AM to 9 PM
  const hourHeightPercent = 100 / totalHours; // ~7.14% per hour block

  const currentHour = new Date().getHours();
  const currentMinute = new Date().getMinutes();
  const isTimeInGrid = currentHour >= startHour && currentHour < (startHour + totalHours);
  const currentTimePosition = isTimeInGrid ? ((currentHour - startHour) + (currentMinute / 60)) * hourHeightPercent : null;

  return (
    <div className="flex flex-col h-full pb-10 bg-[#0a0a0a] text-white min-h-screen font-sans">
      
      <motion.header 
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-4 px-2"
      >
        <div>
          <h2 className="text-2xl md:text-3xl font-display tracking-widest text-white uppercase flex items-center gap-3 leading-none">
            <CalIcon className="text-gold w-8 h-8" /> G-CALENDAR COMMAND
          </h2>
          <p className="text-xs text-gray-500 font-tech tracking-widest mt-2 uppercase font-bold">Tactical Schedule Overview</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-success bg-success/10 border border-success/30 px-4 py-2.5 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.15)] tracking-widest uppercase">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.8)]"></div>
          Live Sync Active
        </div>
      </motion.header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 px-2">
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="xl:col-span-8 border border-gold/30 rounded-xl p-0 shadow-neon-gold overflow-hidden flex flex-col bg-black/40 backdrop-blur-md"
        >
          <div className="flex justify-between items-center border-b border-gold/20 bg-gold/5 p-4">
            <button onClick={() => setWeekOffset(prev => prev - 1)} className="text-gold/60 hover:text-gold transition-colors p-2 hover:bg-gold/10 rounded-lg">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="grid grid-cols-6 w-full text-center">
              {weekDays.map((d, i) => (
                <DayHeader key={i} day={d.day} date={d.date} active={d.isToday} />
              ))}
            </div>
            <button onClick={() => setWeekOffset(prev => prev + 1)} className="text-gold/60 hover:text-gold transition-colors p-2 hover:bg-gold/10 rounded-lg">
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          <div className="relative h-[600px] overflow-y-auto pr-2 custom-scrollbar bg-tech-grid">
            
            {/* 🔥 V2 REAL TIME GRID LAYER */}
            <div className="absolute inset-0 ml-14 z-0 pointer-events-none flex flex-col">
              {[...Array(totalHours)].map((_, i) => (
                <div key={i} className="w-full border-b border-white/5 border-dashed" style={{ height: `${hourHeightPercent}%` }}></div>
              ))}
            </div>

            <div className="absolute inset-0 grid grid-cols-6 ml-14 pointer-events-none z-0">
              {weekDays.map((d, i) => (
                <div key={i} className={`border-r border-white/5 ${d.isToday ? 'bg-gold/5 border-x border-gold/20 shadow-[inset_0_0_20px_rgba(251,191,36,0.05)]' : ''}`}></div>
              ))}
            </div>

            <div className="flex flex-col justify-between h-[800px] text-[10px] text-gray-500 font-tech font-bold tracking-widest absolute left-0 top-0 w-14 text-right pr-3 pt-2 pb-2 bg-[#0a0a0a]/90 border-r border-white/10 z-10 backdrop-blur-sm">
              <span>8 AM</span><span>9 AM</span><span>10 AM</span><span>11 AM</span><span>12 PM</span>
              <span>1 PM</span><span>2 PM</span><span>3 PM</span><span>4 PM</span><span>5 PM</span>
              <span>6 PM</span><span>7 PM</span><span>8 PM</span><span>9 PM</span>
            </div>

            {/* EVENT RENDERING AREA */}
            <div className="relative h-[800px] ml-14 z-10">
              
              {/* CURRENT TIME TRACKER LINE */}
              {isTimeInGrid && todayIndex !== -1 && (
                <div 
                  className="absolute z-20 flex items-center" 
                  style={{ top: `${currentTimePosition}%`, left: `${todayIndex * 16.66}%`, width: '16.66%' }}
                >
                  <div className="w-2 h-2 rounded-full bg-danger animate-pulse -ml-1 shadow-[0_0_8px_rgba(244,63,94,1)]"></div>
                  <div className="w-full h-[2px] bg-danger/80 shadow-[0_0_5px_rgba(244,63,94,0.8)]"></div>
                </div>
              )}

              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-gold animate-spin" />
                </div>
              ) : (
                <AnimatePresence>
                  {penalties.length > 0 ? (
                    penalties.map((penalty, index) => {
                      // Dynamically spacing penalties roughly between 2 PM and 8 PM for realism
                      const mockStartHourIndex = 6 + (index * 2); 
                      const topPos = `${mockStartHourIndex * hourHeightPercent}%`; 
                      const heightPos = `${(penalty.duration || 1) * hourHeightPercent}%`;

                      return (
                        <EventBlock 
                          key={index} 
                          color="danger" 
                          top={topPos} 
                          height={heightPos} 
                          left={todayLeftPosition} 
                          width="16.6%" 
                          title={penalty.title} 
                          time={`${penalty.duration} Hour Lock`} 
                        />
                      );
                    })
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center w-3/4 max-w-sm bg-success/5 border border-success/20 py-10 rounded-2xl shadow-sm backdrop-blur-md"
                    >
                      <CheckCircle2 className="w-16 h-16 text-success/70 mx-auto mb-4 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      <p className="text-success font-display tracking-widest uppercase text-lg font-bold">Calendar Clear</p>
                      <p className="text-gray-400 font-tech text-xs mt-2 uppercase font-bold">No active punishment blocks.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          className="xl:col-span-4 flex flex-col gap-6"
        >
          <div className="p-6 border border-gold/40 rounded-xl relative overflow-hidden bg-gradient-to-br from-[#121212] to-gold/5 shadow-[0_0_20px_rgba(251,191,36,0.1)]">
            <div className="absolute -right-4 -top-4 opacity-10"><Target className="w-32 h-32 text-gold" /></div>
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <Flame className={`w-7 h-7 ${activeStreak > 0 ? 'text-gold animate-pulse drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'text-gray-600'}`} />
              <h3 className={`text-2xl font-display tracking-widest ${activeStreak > 0 ? 'text-white' : 'text-gray-500'}`}>{activeStreak} DAY STREAK</h3>
            </div>
            <div className="flex justify-between text-xs text-gold font-bold mb-2 tracking-widest uppercase relative z-10 font-tech">
              <span>XP: {currentStats?.xp_balance || 0}</span><span>10,000</span>
            </div>
            
            <div className="w-full bg-black border border-gold/30 rounded-full h-2.5 relative z-10 overflow-hidden shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${xpPercentage}%` }}
                transition={{ duration: 1.5, ease: "easeOut", type: "tween" }}
                className="bg-gradient-to-r from-gold/80 to-gold h-full rounded-full shadow-neon-gold"
              ></motion.div>
            </div>
          </div>

          <div className="p-0 border border-cyan-500/30 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.1)] flex-grow flex flex-col overflow-hidden bg-[#121212]">
            <h3 className="bg-cyan-500/10 text-cyan-400 text-sm font-display font-bold tracking-widest uppercase flex items-center gap-2 p-4 border-b border-cyan-500/20">
              <Zap className="w-4 h-4"/> AI Schedule Optimization
            </h3>
            
            <div className="p-6 flex-grow flex flex-col">
              <div className="bg-black/50 border border-white/5 p-4 rounded-lg mb-6 text-sm text-gray-300 leading-relaxed font-tech shadow-inner">
                {penalties.length > 0 
                  ? <><span className="text-danger font-bold">High failure rate detected.</span> Your afternoon focus is compromised. The system recommends shifting execution to a strict morning block.</>
                  : <><span className="text-success font-bold">Compliance verified.</span> Based on your current calendar telemetry, your focus output is optimal. Maintain current schedule.</>
                }
              </div>
              
              <div className="border border-cyan-500/30 bg-cyan-500/5 p-5 rounded-lg mb-8 text-center relative overflow-hidden shadow-sm">
                <div className="absolute top-0 left-0 w-1 h-full bg-cyan-400"></div>
                <div className="flex justify-center items-center gap-2 text-[10px] text-cyan-500 tracking-widest uppercase mb-2 font-bold">
                  <Clock className="w-3 h-3" /> Recommended Execution Window
                </div>
                <div className="text-2xl md:text-3xl font-display text-white font-bold tracking-widest drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                  {penalties.length > 0 ? "5:00 AM - 7:00 AM" : "10:00 AM - 1:00 PM"}
                </div>
              </div>

              <div className="flex gap-4 mt-auto">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleOptimize}
                  disabled={isOptimizing}
                  className={`flex-1 border py-3.5 rounded-lg tracking-widest font-display font-bold transition-all shadow-sm 
                    ${isOptimizing ? 'border-cyan-500/30 text-cyan-400 cursor-wait' : 'border-cyan-400 text-cyan-400 hover:bg-cyan-500 hover:text-black hover:shadow-[0_0_25px_rgba(6,182,212,0.4)]'}`}
                >
                  {isOptimizing ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div> RECALIBRATING...</span> : 'AUTHORIZE SHIFT'}
                </motion.button>
              </div>
            </div>
          </div>

          <div className="p-6 border border-white/10 rounded-xl bg-black/60 relative overflow-hidden shadow-sm backdrop-blur-md">
            {penalties.length > 0 && <div className="absolute top-0 left-0 w-full h-1.5 bg-danger"></div>}
            <h3 className="text-gray-500 text-xs font-tech tracking-widest uppercase mb-4 font-bold">Penalty Status</h3>
            <div className={`flex items-start gap-4 ${penalties.length > 0 ? 'text-danger' : 'text-success'}`}>
              {penalties.length > 0 ? <ShieldAlert className="w-7 h-7 flex-shrink-0 mt-1" /> : <CheckCircle2 className="w-7 h-7 flex-shrink-0 mt-1" />}
              <div>
                <div className={`text-lg font-display font-bold tracking-widest uppercase mb-1 ${penalties.length > 0 ? 'drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 'drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]'}`}>
                  {penalties.length > 0 ? `${penalties.length} ACTIVE PENALTIES` : "ALL CLEAR"}
                </div>
                <div className="text-xs font-tech text-gray-400 leading-relaxed font-bold">
                  {penalties.length > 0 ? "You have failed directives actively blocking your Google Calendar. Execute assigned tasks immediately to redeem your schedule." : "Your Google Calendar is free of punishment blocks. Awaiting next directive."}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function DayHeader({ day, date, active }) {
  return (
    <div className={`flex flex-col items-center justify-center py-2 ${active ? 'text-gold' : 'text-gray-500'}`}>
      <span className="text-[10px] tracking-widest uppercase font-tech font-bold">{day}</span>
      <span className={`text-xl font-display mt-1 font-bold ${active ? 'drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' : ''}`}>{date}</span>
      {active && <div className="w-1.5 h-1.5 bg-gold rounded-full mt-1 shadow-[0_0_5px_rgba(251,191,36,0.8)]"></div>}
    </div>
  );
}

function EventBlock({ color, top, left, width, height, title, time }) {
  const colorMap = {
    gold: 'border-gold bg-gold/10 text-gold shadow-[0_0_15px_rgba(251,191,36,0.2)]',
    danger: 'border-danger bg-danger/10 text-danger shadow-[0_0_15px_rgba(244,63,94,0.2)] z-10 backdrop-blur-md',
    cyan: 'border-cyan-400 bg-cyan-400/10 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]',
    success: 'border-success bg-success/10 text-success shadow-[0_0_15px_rgba(16,185,129,0.2)]',
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`absolute border-l-4 rounded-r-lg p-2.5 overflow-hidden cursor-pointer hover:brightness-110 transition-all flex flex-col justify-start pt-3 ${colorMap[color]}`} 
      style={{ top, left, width, height }}
    >
      <div className="text-xs font-display uppercase font-bold tracking-widest leading-tight line-clamp-2 drop-shadow-sm">{title}</div>
      <div className="text-[10px] opacity-90 font-tech mt-1 font-bold">{time}</div>
    </motion.div>
  );
}