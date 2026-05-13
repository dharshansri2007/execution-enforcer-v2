import React, { useState, useEffect } from 'react';
import { ShoppingBag, Zap, Shield, Clock, Lock, CheckCircle2, XCircle, AlertOctagon, Flame, BrainCircuit, Target, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../firebase'; 


const API_BASE = import.meta.env.VITE_API_BASE;

export default function Store({ stats }) {
  const [purchaseMsg, setPurchaseMsg] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  
  const [localXP, setLocalXP] = useState(0);
  const [complianceScore, setComplianceScore] = useState(100);

  const getAuthHeaders = async () => {
    const token = await auth.currentUser?.getIdToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  useEffect(() => {
    let isMounted = true;
    const fetchLiveEconomy = async () => {
      try {
        setIsLoading(true);
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_BASE}/score`, { headers });
        if (res.ok && isMounted) {
          const data = await res.json();
          setLocalXP(data.xp_balance || 0);
          setComplianceScore(parseInt(data.compliance_score || "100", 10));
        }
      } catch (err) {
        console.error("🚨 Failed to sync live economy:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    fetchLiveEconomy();
    return () => { isMounted = false; };
  }, []);

  const handlePurchase = async (itemName, cost) => {
    if (localXP >= cost) {
      setIsProcessing(true);
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_BASE}/spend-xp`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ cost: cost, item_name: itemName })
        });

        if (res.ok) {
          const data = await res.json();
          setLocalXP(data.new_balance); // Instant UI sync
          setPurchaseMsg({ type: 'success', text: `PROTOCOL ACQUIRED: ${itemName}. XP Deducted.` });
        } else {
          setPurchaseMsg({ type: 'error', text: `TRANSACTION FAILED: Backend rejected the request.` });
        }
      } catch (err) {
        setPurchaseMsg({ type: 'error', text: `NETWORK ERROR: Could not connect to API.` });
      }
      setIsProcessing(false);
    } else {
      setPurchaseMsg({ type: 'error', text: `ACCESS DENIED: Insufficient XP for ${itemName}.` });
    }
    
    setTimeout(() => setPurchaseMsg(null), 3000);
  };


  let aiMessage = "";
  if (complianceScore >= 80) {
    aiMessage = <><strong className="text-cyan-400">Optimal execution detected ({complianceScore}%).</strong> You have earned the right to spend your XP. A Double XP Boost is recommended to capitalize on your momentum.</>;
  } else if (complianceScore >= 50) {
    aiMessage = <><strong className="text-yellow-400">Mediocre execution detected ({complianceScore}%).</strong> Your focus is slipping. Purchasing a Focus Shield is highly recommended to prevent further calendar penalties.</>;
  } else {
    aiMessage = <><strong className="text-danger">CRITICAL FAILURE PATTERN ({complianceScore}%).</strong> You are actively sabotaging your goals. If you have the XP, buy a Penalty Skip immediately to salvage your schedule.</>;
  }

  
  const MAX_XP_CAP = 500000;
  const xpPercentage = Math.min((localXP / MAX_XP_CAP) * 100, 100);

  return (
    <div className="flex flex-col h-full pb-10 relative bg-[#050505] min-h-screen text-white font-sans">
      
      <motion.header 
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="mb-8 border-b border-gold/20 pb-6 flex items-center justify-between gap-4 pt-4 px-2"
      >
        <div className="flex items-center gap-4">
          <div className="p-2 bg-white/5 rounded-lg shadow-sm border border-white/5">
            <ShoppingBag className="w-8 h-8 text-gold drop-shadow-sm" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-display tracking-widest text-white uppercase leading-none">Rewards Store</h2>
            <p className="text-xs text-gray-500 font-tech tracking-widest mt-1 uppercase font-bold">Tactical Upgrades & Shields</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2.5 text-gold font-tech text-xl drop-shadow-[0_0_8px_rgba(251,191,36,0.6)] bg-black/40 px-4 py-2 rounded-lg border border-white/10 shadow-sm font-bold">
          {isLoading ? <Activity className="w-5 h-5 animate-spin" /> : <><Flame className="w-5 h-5 animate-pulse" /> {localXP.toLocaleString()} XP</>}
        </div>
      </motion.header>

      <div className="h-16 mb-2 px-2">
        <AnimatePresence>
          {purchaseMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.98 }}
              className={`p-4 rounded-xl border flex items-center gap-3 font-tech text-sm tracking-widest uppercase shadow-lg font-bold
                ${purchaseMsg.type === 'success' ? 'bg-success/10 border-success/50 text-success shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 
                                                   'bg-danger/10 border-danger/50 text-danger shadow-[0_0_20px_rgba(239,68,68,0.2)]'}`}
            >
              {purchaseMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 drop-shadow-sm" /> : <XCircle className="w-5 h-5 drop-shadow-sm" />}
              {purchaseMsg.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 px-2">
        
        <motion.div 
          initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="xl:col-span-8 flex flex-col gap-4"
        >
          <div className="p-6 md:p-8 border border-gold/30 shadow-[0_0_20px_rgba(251,191,36,0.05)] rounded-xl h-full bg-[#0a0a0a] backdrop-blur-md">
            <h3 className="text-sm font-display text-gray-300 tracking-widest uppercase mb-6 flex items-center justify-between font-bold">
              Available Upgrades
              <span className="text-xs text-gray-500 font-tech md:hidden">Balance: {localXP.toLocaleString()} XP</span>
            </h3>

            <div className="flex flex-col gap-4">
              <StoreItem 
                icon={<AlertOctagon className="w-6 h-6 text-danger drop-shadow-sm" />}
                title="Skip Penalty"
                desc="Bypass the AI Enforcer and skip your next scheduled Calendar Penalty automatically."
                cost={1500}
                currentXP={localXP}
                theme="danger"
                isProcessing={isProcessing || isLoading}
                onBuy={() => handlePurchase("Skip Penalty", 1500)}
              />
              <StoreItem 
                icon={<Zap className="w-6 h-6 text-gold drop-shadow-sm" />}
                title="Double XP Boost"
                desc="Engage overdrive. Earn Double XP for all directives completed in the next 24 hours."
                cost={3000}
                currentXP={localXP}
                theme="gold"
                isProcessing={isProcessing || isLoading}
                onBuy={() => handlePurchase("Double XP Boost", 3000)}
              />
              <StoreItem 
                icon={<Shield className="w-6 h-6 text-cyan-400 drop-shadow-sm" />}
                title="Focus Shield"
                desc="Activate an algorithmic shield against digital distractions and minor time-drifts."
                cost={800}
                currentXP={localXP}
                theme="cyan"
                isProcessing={isProcessing || isLoading}
                onBuy={() => handlePurchase("Focus Shield", 800)}
              />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          className="xl:col-span-4 flex flex-col gap-6"
        >
          <div className="p-6 border border-gold/40 shadow-[0_0_20px_rgba(251,191,36,0.1)] rounded-xl relative overflow-hidden bg-[#121212]">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-gold/10 via-gold to-gold/10"></div>
            <div className="absolute -right-4 -top-4 opacity-10"><Target className="w-32 h-32 text-gold" /></div>
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <Flame className="text-gold w-6 h-6 animate-pulse drop-shadow-sm" />
              <h3 className="font-display font-bold tracking-widest text-white uppercase text-lg">Financial Status</h3>
            </div>
            
            <div className="flex justify-between text-xs text-gold mb-3 tracking-widest uppercase items-end relative z-10 font-bold">
              <span className="text-4xl font-tech drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]">
                {isLoading ? "---" : localXP.toLocaleString()}
              </span>
              <span>/ 500,000 (CAP)</span>
            </div>
            <div className="w-full bg-black border border-gold/20 rounded-full h-2.5 mb-5 relative z-10 shadow-inner overflow-hidden">
              <div className="bg-gradient-to-r from-gold/80 to-gold h-full rounded-full shadow-[0_0_10px_#fbbf24] transition-all duration-1000 ease-out" style={{ width: `${xpPercentage}%` }}></div>
            </div>
            <div className="text-center text-xs text-gray-400 uppercase tracking-widest font-bold border-t border-white/10 pt-4 flex items-center justify-center gap-2">
              <Shield className="w-4 h-4 text-gold"/> Level 12 — Executioner
            </div>
          </div>

          <div className="p-6 border border-cyan-500/30 bg-[#08101a] rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.05)] flex-grow flex flex-col">
            <h3 className="text-cyan-400 text-sm font-display font-bold tracking-widest uppercase flex items-center gap-2 mb-4 border-b border-cyan-500/20 pb-4">
              <BrainCircuit className="w-5 h-5"/> Behavioral Analysis
            </h3>
            <p className="text-sm text-cyan-100 leading-relaxed font-tech font-bold flex-grow">
              {isLoading ? "Analyzing telemetry..." : aiMessage}
            </p>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-success mt-6 pt-4 border-t border-cyan-500/20">
              <CheckCircle2 className="w-3 h-3 animate-pulse" /> Live Database Sync Active
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}

function StoreItem({ icon, title, desc, cost, theme, currentXP, onBuy, isProcessing }) {
  const canAfford = currentXP >= cost;

  const themeConfig = {
    danger: {
      border: 'border-white/10 hover:border-danger/80 hover:shadow-[0_0_20px_rgba(244,63,94,0.15)]',
      iconBg: 'bg-danger/10 border-danger/20 group-hover:bg-danger/20',
      btnHover: 'hover:bg-danger hover:text-white hover:border-danger'
    },
    gold: {
      border: 'border-white/10 hover:border-gold/80 hover:shadow-[0_0_20px_rgba(251,191,36,0.15)]',
      iconBg: 'bg-gold/10 border-gold/20 group-hover:bg-gold/20',
      btnHover: 'hover:bg-gold hover:text-black hover:border-gold'
    },
    cyan: {
      border: 'border-white/10 hover:border-cyan-500/80 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]',
      iconBg: 'bg-cyan-500/10 border-cyan-500/20 group-hover:bg-cyan-500/20',
      btnHover: 'hover:bg-cyan-500 hover:text-black hover:border-cyan-500'
    }
  };

  return (
    <div className={`flex flex-col md:flex-row justify-between items-center gap-4 bg-[#121212] border ${themeConfig[theme].border} p-5 rounded-xl transition-all duration-300 group shadow-sm`}>
      <div className="flex items-center gap-5 w-full md:w-auto">
        <div className={`p-3.5 rounded-xl border transition-colors ${themeConfig[theme].iconBg}`}>
          {icon}
        </div>
        <div>
          <h4 className="text-white font-display font-bold tracking-widest text-lg md:text-xl">{title}</h4>
          <p className="text-xs text-gray-400 font-tech max-w-sm mt-1.5 leading-relaxed font-bold">{desc}</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between w-full md:w-auto gap-6 md:border-l border-white/10 md:pl-6 pt-4 md:pt-0 border-t md:border-t-0">
        <div className={`font-tech font-bold tracking-widest text-base flex items-center gap-1.5 ${canAfford ? 'text-gold drop-shadow-sm' : 'text-danger'}`}>
          <Zap className="w-4 h-4" /> {cost.toLocaleString()}
        </div>
        <motion.button 
          whileHover={canAfford && !isProcessing ? { scale: 1.05 } : {}}
          whileTap={canAfford && !isProcessing ? { scale: 0.95 } : {}}
          onClick={onBuy}
          disabled={!canAfford || isProcessing}
          className={`px-8 py-2.5 rounded-lg font-display font-bold tracking-widest uppercase transition-all shadow-sm text-sm flex items-center gap-2
            ${canAfford ? 
              `border border-white/20 text-gray-300 ${themeConfig[theme].btnHover}` : 
              'bg-black border border-gray-800 text-gray-600 cursor-not-allowed'}`}
        >
          {canAfford ? 'Acquire' : <Lock className="w-4 h-4" />}
        </motion.button>
      </div>
    </div>
  );
}