import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { TrackerProvider } from './context/TrackerContext';
import Navbar from './components/Navbar';
import CalendarPage from './pages/CalendarPage';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import OnlyForYouPage from './pages/OnlyForYouPage';
import AuthModal from './components/AuthModal';
import OnboardingModal from './components/OnboardingModal';
import './App.css';

function App() {
  return (
    <TrackerProvider>
      <Router>
        <div className="app-shell">
          <Navbar />
          <AuthModal />
          <OnboardingModal />
          <Routes>
            {/* Calendar page is the primary/default page as requested */}
            <Route path="/" element={<CalendarPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            
            {/* Pregnancy Tracker Dashboard */}
            <Route path="/pregnancy" element={<Dashboard />} />
            
            {/* Profile Overview */}
            <Route path="/profile" element={<ProfilePage />} />
            
            {/* Only for U */}
            <Route path="/only-for-u" element={<OnlyForYouPage />} />
            
            <Route path="*" element={<Navigate to="/calendar" replace />} />
          </Routes>
        </div>
      </Router>
    </TrackerProvider>
  );
}

export default App;
