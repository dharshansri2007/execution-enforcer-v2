import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, User, Briefcase, GraduationCap, ChevronRight, Loader, Mail } from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    nickname: '',
    role: 'Student', // Default to Student
    context: '', 
    partnerEmail: '' 
  });

  const handleCompleteProfile = async () => {
    if (!formData.nickname || !formData.context || !formData.partnerEmail) return;
    setIsLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No authenticated user found.");

      
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        nickname: formData.nickname,
        role: formData.role,
        context: formData.context,
        accountability_partner_email: formData.partnerEmail, // Required for GmailEnforcer
        created_at: new Date().toISOString(),
        stats: {
          xp_balance: 0,
          total_failures: 0,
          streak: 0,
          compliance_score: 100
        }
      });

      // Send them to the dashboard
      navigate('/home');
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = "w-full bg-[#121212] border border-white/10 p-3 rounded-lg text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition-all shadow-inner";

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center relative overflow-hidden font-tech selection:bg-cyan-500 selection:text-black p-4">
      {/* 🌌 ANIMATED CYBERPUNK BACKGROUND */}
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]">
        {/* GPU-Accelerated Cyan Ambient Glow */}
        <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-cyan-500/10 rounded-full mix-blend-screen filter blur-[120px] animate-pulse transform-gpu" style={{ animationDuration: '6s' }}></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-lg p-8 md:p-10 rounded-2xl z-10 flex flex-col border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)] relative bg-[#0a0a0a]/80 backdrop-blur-xl"
      >
        <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
          <ShieldAlert className="w-10 h-10 text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
          <div>
            <h1 className="font-display text-2xl tracking-widest text-white uppercase">Initialize Operator</h1>
            <p className="text-[10px] text-gray-400 tracking-widest uppercase font-bold">System Calibration Required</p>
          </div>
        </div>

        <div className="space-y-6 relative z-20">
          {/* Nickname */}
          <div>
            <label className="text-[10px] text-cyan-400 mb-2 block uppercase tracking-widest font-bold flex items-center gap-2">
              <User className="w-3.5 h-3.5"/> Operator Callsign (Nickname)
            </label>
            <input 
              type="text" 
              placeholder="e.g., SD, Neo, Director" 
              value={formData.nickname}
              onChange={e => setFormData({...formData, nickname: e.target.value})}
              className={inputStyle} 
              maxLength={15}
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="text-[10px] text-gray-400 mb-2 block uppercase tracking-widest font-bold">Primary Designation</label>
            <div className="flex gap-3">
              <button 
                onClick={() => setFormData({...formData, role: 'Student'})}
                className={`flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all
                  ${formData.role === 'Student' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[inset_0_0_15px_rgba(6,182,212,0.2)]' : 'border-white/10 text-gray-500 hover:bg-white/5'}`}
              >
                <GraduationCap className="w-6 h-6" />
                <span className="font-display tracking-widest uppercase text-[10px]">Student</span>
              </button>
              
              <button 
                onClick={() => setFormData({...formData, role: 'Professional'})}
                className={`flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all
                  ${formData.role === 'Professional' ? 'bg-gold/20 border-gold text-gold shadow-[inset_0_0_15px_rgba(251,191,36,0.2)]' : 'border-white/10 text-gray-500 hover:bg-white/5'}`}
              >
                <Briefcase className="w-6 h-6" />
                <span className="font-display tracking-widest uppercase text-[10px]">Professional</span>
              </button>
            </div>
          </div>

          {/* Context Input */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={formData.role}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="pt-2"
            >
              <label className="text-[10px] text-gray-400 mb-2 block uppercase tracking-widest font-bold">
                {formData.role === 'Student' ? 'Degree / Major Focus' : 'Job Title / Industry'}
              </label>
              <input 
                type="text" 
                placeholder={formData.role === 'Student' ? "e.g., Anna Univ CSE AI/ML" : "e.g., Senior Full-Stack Engineer"} 
                value={formData.context}
                onChange={e => setFormData({...formData, context: e.target.value})}
                className={inputStyle} 
              />
              <p className="text-[9px] text-gray-500 mt-2 font-tech uppercase tracking-widest">
                *The AI Enforcer uses this context to tailor penalties and adapt task difficulty.
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Accountability Partner Email (CRITICAL FOR V2) */}
          <div className="pt-2">
            <label className="text-[10px] text-danger mb-2 block uppercase tracking-widest font-bold flex items-center gap-2">
              <Mail className="w-3.5 h-3.5"/> Accountability Partner Email
            </label>
            <input 
              type="email" 
              placeholder="e.g., mentor@example.com" 
              value={formData.partnerEmail}
              onChange={e => setFormData({...formData, partnerEmail: e.target.value})}
              className="w-full bg-[#121212] border border-danger/30 p-3 rounded-lg text-white focus:border-danger focus:ring-1 focus:ring-danger outline-none transition-all shadow-inner"
            />
            <p className="text-[9px] text-danger/80 mt-2 font-tech uppercase tracking-widest leading-relaxed">
              *WARNING: If you fail a task, an automated "Wall of Shame" report will be emailed to this address. Choose wisely.
            </p>
          </div>

        </div>

        <button
          onClick={handleCompleteProfile}
          disabled={isLoading || !formData.nickname || !formData.context || !formData.partnerEmail}
          className={`mt-10 w-full relative group overflow-hidden rounded-lg p-4 flex items-center justify-center gap-3 transition-all border z-20
            ${isLoading || !formData.nickname || !formData.context || !formData.partnerEmail
              ? 'bg-white/5 border-white/10 text-gray-600 cursor-not-allowed' 
              : 'border-cyan-400 text-cyan-400 hover:text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]'}`}
        >
          {(!isLoading && formData.nickname && formData.context && formData.partnerEmail) && (
            <div className="absolute inset-0 bg-cyan-400 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out -z-10"></div>
          )}
          
          {isLoading ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span className="font-display tracking-widest uppercase text-base z-10 font-bold">Initialize System</span>
              <ChevronRight className="w-5 h-5 z-10" />
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}
