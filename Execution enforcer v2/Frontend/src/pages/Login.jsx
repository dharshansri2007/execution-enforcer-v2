import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore'; 
import { auth, db } from '../firebase'; 
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, AlertCircle } from 'lucide-react';


function GoogleLoginButton({ onClick, isLoading }) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`group relative w-full flex items-center justify-center gap-4
                 px-6 py-3.5 rounded-xl font-display uppercase tracking-widest
                 bg-[#0a0a0a] text-gold font-bold text-sm md:text-base
                 shadow-lg shadow-gold/5
                 border border-gold/30 hover:border-gold
                 transition-all duration-500 ease-out
                 transform-gpu hover:shadow-[0_0_25px_rgba(251,191,36,0.25)] hover:scale-[1.02]
                 active:scale-[0.98]
                 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>
      ) : (
        <img
          src="https://www.svgrepo.com/show/475656/google-color.svg"
          alt="Google"
          className="w-5 h-5 transition-transform duration-700 ease-out group-hover:rotate-[360deg]"
        />
      )}

      <span className="tracking-widest mt-0.5">{isLoading ? 'CONNECTING...' : 'LOGIN'}</span>

      {!isLoading && (
        <div className="absolute right-5 opacity-0 -translate-x-2 
                        group-hover:opacity-100 group-hover:translate-x-0 
                        transition-all duration-500 text-gold font-bold">
          →
        </div>
      )}
    </button>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        navigate('/home');
      } else {
        navigate('/onboarding');
      }
      
    } catch (err) {
      console.error("Auth Error:", err);
      
      if (err.code === 'auth/popup-closed-by-user') {
        setError("Authentication aborted by operator.");
      } else if (err.code === 'auth/popup-blocked') {
        setError("Popup blocked by browser. Allow popups to connect.");
      } else {
        setError("Authentication failed. Operator access denied.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#050505] font-tech text-white selection:bg-gold selection:text-black">
      
      {/*  ANIMATED  BACKGROUND */}
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]">
        {/* GPU-Accelerated Gold Ambient Glow */}
        <div className="absolute top-[10%] left-[20%] w-[40vw] h-[40vw] bg-gold/10 rounded-full mix-blend-screen filter blur-[120px] animate-pulse transform-gpu" style={{ animationDuration: '4s' }}></div>
        {/* GPU-Accelerated Cyan Ambient Glow */}
        <div className="absolute bottom-[10%] right-[10%] w-[35vw] h-[35vw] bg-cyan-500/10 rounded-full mix-blend-screen filter blur-[100px] transform-gpu" style={{ animationDelay: '2s', animationDuration: '5s' }}></div>
      </div>

      {/*  LOGIN CARD */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} 
        className="relative z-10 w-full max-w-[420px] px-4"
      >
        <div className="relative bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/5 rounded-2xl shadow-2xl p-8 sm:p-10 overflow-hidden ring-1 ring-gold/20 shadow-[0_0_50px_rgba(251,191,36,0.05)]">
          
          {/* Subtle Top Gradient */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-gold to-transparent opacity-60 blur-[2px]"></div>

          {/* Logo & Header */}
          <div className="text-center mb-10 flex flex-col items-center">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="inline-block mb-6 relative group cursor-default"
            >
              <div className="absolute inset-0 bg-gold blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-700 transform-gpu"></div>
              <ShieldAlert className="relative w-16 h-16 text-gold drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]" />
            </motion.div>

            <h1 className="text-4xl font-display text-white tracking-widest mb-2 leading-none drop-shadow-sm">
              EXECUTION
            </h1>
            <h2 className="text-xl font-display text-gold tracking-[0.3em] font-bold mb-6">
              ENFORCER v2
            </h2>
            <p className="text-gray-400 text-[10px] tracking-[0.2em] uppercase font-bold px-4 leading-relaxed">
              Made for Gen AI APAC Hackathon '26
            </p>
          </div>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="w-full bg-danger/10 border border-danger/50 text-danger text-xs font-bold tracking-widest uppercase p-3 rounded-lg mb-6 flex items-start gap-2 shadow-[0_0_15px_rgba(239,68,68,0.2)] overflow-hidden"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="space-y-6 relative z-20 mt-4">
            <GoogleLoginButton onClick={handleGoogleSignIn} isLoading={isLoading} />

            <div className="flex items-center gap-4">
              <div className="h-px bg-white/10 flex-1"></div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Secure Access</span>
              <div className="h-px bg-white/10 flex-1"></div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center border-t border-white/5 pt-6">
            <p className="text-[10px] font-bold tracking-widest uppercase text-gray-600 transition-colors hover:text-gray-400">
              Powered by <span className="text-gold">Vertex AI 2.5 Pro</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}