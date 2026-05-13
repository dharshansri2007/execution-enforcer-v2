import React from 'react'; 
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';

// Layout & Security
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Onboarding from './pages/Onboarding'; 
import Home from './pages/Home';
import Tasks from './pages/Tasks';
import CalendarSync from './pages/Calendar';
import Profile from './pages/Profile';
import Store from './pages/Store';
import Intelligence from './pages/Intelligence'; 
import History from './pages/History'; 
import SystemConfig from './pages/SystemConfig'; 


// This keeps the Sidebar persistent and swaps out the pages next to it
const AppLayout = () => {
  return (
    <div className="min-h-screen bg-[#03040a] bg-tech-grid text-gray-300 font-tech flex overflow-hidden selection:bg-gold selection:text-background">
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto relative p-4 md:p-6">
        <div className="absolute top-0 left-0 w-full h-full ambient-glow pointer-events-none -z-10"></div>
        {/* <Outlet /> is where the router injects the current page (Home, Tasks, etc.) */}
        <Outlet />
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/*  PUBLIC ROUTE: The Login Screen */}
        <Route path="/login" element={<Login />} />

        {/*  PROTECTED ROUTES: Only accessible if logged in via Firebase */}
        <Route element={<ProtectedRoute />}>
          
          {/*  ONBOARDING: Protected, but NO Sidebar */}
          <Route path="/onboarding" element={<Onboarding />} />

          {/*  DASHBOARD: Protected WITH Sidebar */}
          <Route element={<AppLayout />}>
            
            {/* If user hits the root "/", redirect them to /home */}
            <Route path="/" element={<Navigate to="/home" replace />} />
            
            {/* Core Pages */}
            <Route path="/home" element={<Home />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/history" element={<History />} />
            <Route path="/intelligence" element={<Intelligence />} />
            <Route path="/gcal" element={<CalendarSync />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/store" element={<Store />} />
            <Route path="/config" element={<SystemConfig />} />
            
            {/* Fallback route for unknown URLs */}
            <Route path="*" element={<Navigate to="/home" replace />} />

          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
