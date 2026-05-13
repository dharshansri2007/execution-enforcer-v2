import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';


import { app } from '../firebase'; 

const ProtectedRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const auth = getAuth(app);
    
    // Firebase listener that automatically checks if a user is logged in
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    });

    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#03040a] bg-tech-grid flex items-center justify-center">
        <div className="text-gold font-tech animate-pulse text-2xl tracking-widest">
          [ SYSTEM AUTHENTICATING... ]
        </div>
      </div>
    );
  }

  
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
