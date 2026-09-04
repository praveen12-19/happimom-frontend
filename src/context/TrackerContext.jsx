import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialTrackerData, getBabyGrowthForWeek } from '../api/mockData';

const TrackerContext = createContext(null);

export const TrackerProvider = ({ children }) => {
  const [trackerData, setTrackerData] = useState(initialTrackerData);

  // Authenticated user state, persisted in localStorage
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('happimom_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        console.error('Failed to parse saved user', e);
      }
    }
    return null;
  });

  // Auth modal controls
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authDestination, setAuthDestination] = useState(null);

  const openAuthModal = (destination = null) => {
    setAuthDestination(destination);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthDestination(null);
  };

  // First-time Onboarding modal controls
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [onboardingDestination, setOnboardingDestination] = useState(null);

  const openOnboardingModal = (destination = null) => {
    setOnboardingDestination(destination);
    setIsOnboardingModalOpen(true);
  };

  const closeOnboardingModal = () => {
    setIsOnboardingModalOpen(false);
    setOnboardingDestination(null);
  };

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('happimom_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('happimom_user');
    setEmergencyContact(null);
  };

  const updateUser = (updatedFields) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedFields };
      localStorage.setItem('happimom_user', JSON.stringify(merged));
      return merged;
    });
  };

  // Dynamic pregnancy calculation: ONLY available if user has configured pregnancyDate
  const getPregnancyInfo = () => {
    if (!user || !user.pregnancyDate) {
      return null;
    }
    try {
      const lmp = new Date(user.pregnancyDate);
      if (isNaN(lmp.getTime())) return null;

      const now = new Date();
      const diffMs = now.getTime() - lmp.getTime();
      const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      const currentWeek = Math.max(1, Math.min(40, Math.floor(diffDays / 7) + 1));

      const dueDateObj = new Date(lmp.getTime() + 280 * 24 * 60 * 60 * 1000);
      const dueDateStr = dueDateObj.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });

      const daysLeft = Math.max(
        0,
        Math.floor((dueDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      );
      const trimester = currentWeek <= 13 ? '1st' : currentWeek <= 27 ? '2nd' : '3rd';
      const progressPercentage = Math.min(100, Math.round((currentWeek / 40) * 100));

      return {
        currentWeek,
        totalWeeks: 40,
        dueDate: dueDateStr,
        trimester,
        daysLeft,
        progressPercentage
      };
    } catch {
      return null;
    }
  };

  const pregnancy = getPregnancyInfo();
  const babyGrowth = pregnancy ? getBabyGrowthForWeek(pregnancy.currentWeek) : null;

  // Emergency contact state - no fake/mock doctor details by default
  const [emergencyContact, setEmergencyContact] = useState(() => {
    const saved = localStorage.getItem('happimom_emergency_contact');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved emergency contact', e);
      }
    }
    return null;
  });

  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const updateEmergencyContact = (updatedContact) => {
    setEmergencyContact(updatedContact);
    localStorage.setItem('happimom_emergency_contact', JSON.stringify(updatedContact));
  };

  return (
    <TrackerContext.Provider
      value={{
        user,
        setUser,
        login,
        logout,
        updateUser,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        authDestination,
        isOnboardingModalOpen,
        setIsOnboardingModalOpen,
        openOnboardingModal,
        closeOnboardingModal,
        onboardingDestination,
        pregnancy,
        babyGrowth,
        calendarEvents: trackerData.calendarEvents,
        emergencyContact,
        updateEmergencyContact,
        isEmergencyModalOpen,
        setIsEmergencyModalOpen,
        isChatOpen,
        setIsChatOpen
      }}
    >
      {children}
    </TrackerContext.Provider>
  );
};

export const useTracker = () => {
  const context = useContext(TrackerContext);
  if (!context) {
    throw new Error('useTracker must be used within a TrackerProvider');
  }
  return context;
};
