import React, { useState, useEffect } from 'react';
import { History as HistoryIcon, Search, Filter, CheckCircle2, XCircle, Clock, Database, Server, RefreshCw, Trash2, ShieldAlert, ChevronRight, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../firebase'; 

const API_BASE = import.meta.env.VITE_API_BASE;

export default function History() {
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All'); 

  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [purgeType, setPurgeType] = useState(null);

  const getAuthHeaders = async () => {
    const token = await auth.currentUser?.getIdToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE}/history`, { headers });
      if (res.ok) {
        setHistoryLogs(await res.json());
      }
    } catch (err) {
      console.error("⚠️ Failed to fetch history:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatIST = (dateString) => {
    if (!dateString) return 'UNKNOWN DATE';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'PARSE ERROR'; // Failsafe
      return date.toLocaleString('en-US', {
        month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true
      }).toUpperCase();
    } catch (e) {
      return 'UNKNOWN DATE';
    }
  };

  
  const executeAdvancedPurge = async (type) => {
    setIsPurging(true);
    setPurgeType(type);

    try {
      const headers = await getAuthHeaders();
      let endpoint = type === 'COMPLETED' ? '/purge-notion' : '/purge-shame';
      
      const res = await fetch(`${API_BASE}${endpoint}`, { method: 'POST', headers });
      
      if (!res.ok) throw new Error("Network response was not OK");

      // UI Delay for Hackathon effect
      setTimeout(() => {
        setIsPurging(false);
        setShowPurgeModal(false);
        setPurgeType(null);
        alert(`[ SUCCESS ]: ${type === 'COMPLETED' ? 'Completed Tasks' : 'Wall of Shame'} successfully expunged from Notion Database.`);
      }, 800);
      
    } catch(e) {
      console.error("Purge Error:", e);
      alert("[ ERROR ]: Failed to reach Notion API. Check System Config.");
      setIsPurging(false);
      setShowPurgeModal(false);
      setPurgeType(null);
    }
  };

  const handleDeleteLog = async (index, taskName) => {
    if(!window.confirm(`Delete '${taskName}' from the permanent ledger?\n\nWARNING: Modifying history will alter your 7-Day Execution Graph on the Home dashboard.`)) return;

    setHistoryLogs(prev => prev.filter((_, i) => i !== index));

    try {
      const headers = await getAuthHeaders();
      await fetch(`${API_BASE}/history`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ task_name: taskName })
      });
    } catch(e) {
      console.error("⚠️ Backend delete failed:", e);
      fetchHistory(); 
    }
  };

  const filteredLogs = historyLogs.filter(log => {
    const matchesSearch = log.task_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'All' || log.status === filter;
    return matchesSearch && matchesFilter;
  });

  const inputStyle = "w-full bg-[#121212] border border-white/10 p-3 pl-10 rounded-lg text-white focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-all shadow-inner";

  return (
    <div className="flex flex-col h-full pb-10 relative bg-[#0a0a0a] text-white min-h-screen font-sans">
      
      <motion.header 
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="mb-8 border-b border-gold/20 pb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-2 pt-4"
      >
        <div className="flex items-center gap-4">
          <div className="p-2 bg-white/5 rounded-lg shadow-sm border border-white/5">
            <HistoryIcon className="w-8 h-8 text-gold drop-shadow-sm" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-display tracking-widest text-white uppercase leading-none">Execution Ledger</h2>
            <p className="text-xs text-gray-400 font-tech tracking-widest mt-1 font-bold">PERMANENT CLOUD RECORDS</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowPurgeModal(true)}
            className="flex items-center justify-center gap-2 text-xs font-display font-bold tracking-widest uppercase border border-gold/40 text-gold bg-gold/10 hover:bg-gold hover:text-black shadow-[0_0_15px_rgba(251,191,36,0.15)] transition-all flex-1 md:flex-none px-5 py-2.5 rounded-lg"
          >
            <RefreshCw className="w-4 h-4" />
            NOTION PURGE MENU
          </motion.button>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 px-2">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="xl:col-span-12 flex flex-col gap-4"
        >
          <div className="p-4 border border-gold/30 rounded-xl shadow-neon-gold flex flex-col md:flex-row gap-4 items-center justify-between bg-black/40 backdrop-blur-md">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search audit records..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={inputStyle}
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto bg-white/5 p-1.5 rounded-lg border border-white/10">
              <FilterButton label="All" current={filter} onClick={() => setFilter('All')} />
              <FilterButton label="Done" current={filter} onClick={() => setFilter('Done')} icon={<CheckCircle2 className="w-3 h-3"/>} />
              <FilterButton label="Failed" current={filter} onClick={() => setFilter('Failed')} icon={<XCircle className="w-3 h-3"/>} />
            </div>
          </div>

          <div className="p-4 md:p-6 border border-white/10 rounded-xl shadow-sm bg-[#121212]/50 min-h-[400px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-gold animate-pulse">
                <ShieldAlert className="w-10 h-10 mb-4 opacity-70" />
                <span className="font-tech tracking-widest text-xs uppercase font-bold text-gold">Decrypting Cloud Logs...</span>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-16 flex flex-col items-center">
                <FileText className="w-12 h-12 text-gray-700 mb-4" />
                <p className="text-gray-500 font-tech tracking-widest uppercase font-bold">No records match the current criteria.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredLogs.map((log, index) => (
                    <motion.div 
                      key={log.id || index}
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}
                      className={`p-4 md:p-5 border-l-4 rounded-lg bg-black/40 flex flex-col md:flex-row md:items-center justify-between gap-4 group transition-all shadow-sm
                        ${log.status === 'Done' ? 'border-success hover:bg-success/10' : 'border-danger hover:bg-danger/10'}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          {log.status === 'Done' ? <CheckCircle2 className="w-4 h-4 text-success" /> : <XCircle className="w-4 h-4 text-danger" />}
                          <span className={`text-xs font-display font-bold tracking-widest uppercase px-2 py-0.5 rounded ${log.status === 'Done' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                            {log.status}
                          </span>
                        </div>
                        <h3 className="text-white font-display font-bold text-base md:text-lg">{log.task_name}</h3>
                        {log.status === 'Failed' && log.failure_reason && (
                          <p className="text-danger/80 font-tech text-xs mt-1.5 font-bold">Cause: {log.failure_reason}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                        <div className="text-gray-400 font-tech text-[10px] md:text-xs flex items-center gap-1.5 uppercase tracking-widest font-bold">
                          <Clock className="w-3.5 h-3.5" /> {formatIST(log.logged_at)}
                        </div>
                        
                        <button 
                          onClick={() => handleDeleteLog(index, log.task_name)}
                          className="text-gray-600 hover:text-danger transition-colors p-1.5 bg-white/5 rounded md:opacity-0 group-hover:opacity-100"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showPurgeModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-[#080e1c] border-2 border-gold/40 max-w-lg w-full p-8 rounded-xl shadow-[0_0_50px_rgba(251,191,36,0.15)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-gold/10 via-gold to-gold/10"></div>
              
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-3 bg-gold/10 rounded-full">
                  <Database className="w-8 h-8 text-gold drop-shadow-sm" />
                </div>
              </div>
              <h2 className="text-2xl font-display font-bold text-white tracking-widest uppercase text-center mb-2">Select Purge Target</h2>
              
              <p className="text-gray-400 font-tech text-xs font-bold tracking-widest uppercase text-center mb-8 bg-white/5 py-2 rounded-lg border border-white/5">
                Targeted erasure of external Notion data. Action is irreversible.
              </p>

              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => executeAdvancedPurge('COMPLETED')}
                  disabled={isPurging}
                  className={`border p-4 rounded-xl text-left transition-all flex items-center justify-between group shadow-sm
                    ${isPurging && purgeType !== 'COMPLETED' ? 'opacity-40 cursor-not-allowed border-white/10 bg-transparent' : 'border-success/30 bg-transparent hover:bg-success/10 hover:border-success/60'}`}
                >
                  <div>
                    <div className="flex items-center gap-2 text-success font-display font-bold tracking-widest text-lg mb-1">
                      <CheckCircle2 className="w-5 h-5" /> COMPLETED TASKS
                    </div>
                    <div className="text-[10px] text-gray-500 font-tech font-bold tracking-widest uppercase">Erase all successfully executed directives.</div>
                  </div>
                  {isPurging && purgeType === 'COMPLETED' ? <RefreshCw className="w-5 h-5 text-success animate-spin" /> : <ChevronRight className="w-5 h-5 text-success/50 group-hover:text-success transition-transform group-hover:translate-x-1" />}
                </button>

                <button 
                  onClick={() => executeAdvancedPurge('SHAME')}
                  disabled={isPurging}
                  className={`border p-4 rounded-xl text-left transition-all flex items-center justify-between group shadow-sm
                    ${isPurging && purgeType !== 'SHAME' ? 'opacity-40 cursor-not-allowed border-white/10 bg-transparent' : 'border-danger/30 bg-transparent hover:bg-danger/10 hover:border-danger/60'}`}
                >
                  <div>
                    <div className="flex items-center gap-2 text-danger font-display font-bold tracking-widest text-lg mb-1">
                      <ShieldAlert className="w-5 h-5" /> WALL OF SHAME
                    </div>
                    <div className="text-[10px] text-gray-500 font-tech font-bold tracking-widest uppercase">Erase failure logs and red headings.</div>
                  </div>
                  {isPurging && purgeType === 'SHAME' ? <RefreshCw className="w-5 h-5 text-danger animate-spin" /> : <ChevronRight className="w-5 h-5 text-danger/50 group-hover:text-danger transition-transform group-hover:translate-x-1" />}
                </button>
              </div>

              <div className="mt-8 flex justify-center">
                <button 
                  onClick={() => setShowPurgeModal(false)}
                  disabled={isPurging}
                  className="text-xs font-display font-bold tracking-widest uppercase text-gray-500 hover:text-white transition-colors px-6 py-2.5 border border-transparent hover:bg-white/5 rounded-lg"
                >
                  CANCEL OPERATION
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

function FilterButton({ label, current, onClick, icon }) {
  const active = current === label;
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-display uppercase tracking-widest font-bold transition-all
        ${active ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}
      `}
    >
      {icon} {label}
    </button>
  );
}