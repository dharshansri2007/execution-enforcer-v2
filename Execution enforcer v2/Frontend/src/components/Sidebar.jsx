import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldAlert, Home, Activity, History, Brain, Calendar, ShoppingBag, Settings, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Sidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  
  
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <motion.nav 
      animate={{ width: isCollapsed ? 80 : 260 }} 
      transition={{ type: "spring", bounce: 0, duration: 0.4 }}
      className="flex flex-col h-screen z-50 sticky top-0 bg-[#030303] border-r border-white/5 overflow-visible transform-gpu shadow-[10px_0_30px_rgba(0,0,0,0.5)] flex-shrink-0"
    >
      {/* HEADER */}
      <div className="p-4 md:p-6 border-b border-white/5 flex items-center gap-4 h-24 overflow-hidden relative">
        <div className="relative">
          <div className="absolute inset-0 bg-gold/20 blur-md rounded-full animate-pulse"></div>
          <ShieldAlert className="text-gold w-10 h-10 relative z-10 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
        </div>
        
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}
              className="whitespace-nowrap flex flex-col justify-center"
            >
              <h1 className="font-display text-xl tracking-widest text-white leading-none mb-1">EXECUTION</h1>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse shadow-[0_0_5px_#10b981]"></div>
                <p className="text-gray-500 text-[10px] font-tech font-bold tracking-[0.2em] uppercase">Operator: {currentUser?.displayName || 'UNKNOWN'}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CORE NAVIGATION */}
      <div className="flex flex-col flex-grow py-6 px-3 gap-1.5 overflow-y-auto overflow-x-hidden custom-scrollbar">
        <NavButton to="/home" currentPath={currentPath} icon={<Home />} label="Home" isCollapsed={isCollapsed} />
        <NavButton to="/tasks" currentPath={currentPath} icon={<Activity />} label="Ongoing Tasks" isCollapsed={isCollapsed} />
        
        <div className="my-3 mx-2 border-t border-white/5"></div>
        
        <NavButton to="/history" currentPath={currentPath} icon={<History />} label="Ledger" isCollapsed={isCollapsed} />
        <NavButton to="/intelligence" currentPath={currentPath} icon={<Brain />} label="Intelligence" isCollapsed={isCollapsed} badge="BETA" />
        <NavButton to="/gcal" currentPath={currentPath} icon={<Calendar />} label="G-Cal Sync" isCollapsed={isCollapsed} />
        <NavButton to="/store" currentPath={currentPath} icon={<ShoppingBag />} label="Rewards" isCollapsed={isCollapsed} />
      </div>
      
      {/* BOTTOM SECTION */}
      <div className="mt-auto border-t border-white/5 p-3 flex flex-col gap-1.5 bg-[#050505]">
        <NavButton to="/profile" currentPath={currentPath} icon={<User />} label="My Profile" isCollapsed={isCollapsed} />
        <NavButton to="/config" currentPath={currentPath} icon={<Settings />} label="System Config" isCollapsed={isCollapsed} colorScheme="cyan" />
      </div>

      {/*  CONTROL BAR */}
      <div className="border-t border-white/5 h-14 flex items-center justify-between px-4 bg-black">
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-gray-600 hover:text-white transition-colors p-1.5 rounded hover:bg-white/5 w-full flex justify-center md:justify-start"
          title={isCollapsed ? "Expand Terminal" : "Collapse Terminal"}
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </motion.nav>
  );
}


function NavButton({ to, currentPath, icon, label, isCollapsed, badge, colorScheme = 'gold' }) {
  const active = currentPath === to;
  
  // Dynamic Color Palettes
  const colors = {
    gold: {
      activeBg: 'bg-gold/10',
      activeBorder: 'border-gold',
      activeShadow: 'shadow-[inset_4px_0_15px_rgba(251,191,36,0.15)]',
      activeText: 'text-gold',
      activeIconShadow: 'drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]',
      hoverBg: 'hover:bg-gold/5',
      hoverText: 'hover:text-gold/80',
      badgeBorder: 'border-gold/50',
      badgeText: 'text-gold'
    },
    cyan: {
      activeBg: 'bg-cyan-500/10',
      activeBorder: 'border-cyan-400',
      activeShadow: 'shadow-[inset_4px_0_15px_rgba(6,182,212,0.15)]',
      activeText: 'text-cyan-400',
      activeIconShadow: 'drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]',
      hoverBg: 'hover:bg-cyan-500/5',
      hoverText: 'hover:text-cyan-400/80',
      badgeBorder: 'border-cyan-400/50',
      badgeText: 'text-cyan-400'
    }
  };

  const theme = colors[colorScheme];

  return (
    <Link 
      to={to} 
      className={`flex items-center p-3 rounded-lg transition-all duration-200 group relative
        ${active ? `${theme.activeBg} border-l-4 ${theme.activeBorder} ${theme.activeShadow}` : `border-l-4 border-transparent ${theme.hoverBg}`} 
        ${isCollapsed ? 'justify-center px-0' : 'justify-start gap-4'}
      `}
    >
      {/* Icon Wrapper for precise alignment and glowing */}
      <div className={`relative flex-shrink-0 transition-colors duration-200 
        ${active ? theme.activeText : `text-gray-500 group-${theme.hoverText}`}
        ${isCollapsed ? 'mx-auto' : 'ml-2'}
      `}>
        {React.cloneElement(icon, { 
          className: `w-5 h-5 transition-all duration-300 ${active ? theme.activeIconShadow : ''} 
          ${colorScheme === 'cyan' && active ? 'animate-spin-slow' : ''}` 
        })}
      </div>
      
      {/* Text & Badge */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
            className="flex items-center justify-between flex-1 whitespace-nowrap overflow-hidden"
          >
            <span className={`font-display tracking-widest text-[11px] font-bold uppercase mt-0.5 transition-colors duration-200
              ${active ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}
            `}>
              {label}
            </span>
            {badge && (
              <span className={`ml-2 text-[9px] border ${theme.badgeBorder} ${theme.badgeText} px-1.5 py-0.5 rounded font-tech tracking-widest font-bold`}>
                {badge}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom CSS Tooltip for Collapsed Mode */}
      {isCollapsed && (
        <div className="absolute left-full ml-4 px-3 py-1.5 bg-black border border-white/10 text-white text-[10px] font-display tracking-widest uppercase font-bold rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap shadow-xl flex items-center gap-2">
          {label}
          {badge && <span className={`${theme.badgeText} ml-1`}>[{badge}]</span>}
        </div>
      )}
    </Link>
  );
}
