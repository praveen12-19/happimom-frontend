import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialTrackerData, getBabyGrowthForWeek } from '../api/mockData';
import {
  getUserAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  uploadPrescriptionAndSchedule,
  uploadDoctorReportAndExplain
} from '../api/appointmentApi';

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

  // Dynamic pregnancy calculation: ONLY available if user has completed profile and configured pregnancyDate
  const getPregnancyInfo = () => {
    if (!user || (!user.profileComplete && !user.isProfileComplete)) {
      return null;
    }
    const pregDateStr = user.pregnancyDate || user.pregnancyTimeline?.pregnancyDate;
    if (!pregDateStr) {
      return null;
    }
    try {
      let lmp = null;
      const str = String(pregDateStr).trim();
      const ymd = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (ymd) {
        lmp = new Date(parseInt(ymd[1], 10), parseInt(ymd[2], 10) - 1, parseInt(ymd[3], 10));
      } else {
        const dmy = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);
        if (dmy) {
          lmp = new Date(parseInt(dmy[3], 10), parseInt(dmy[2], 10) - 1, parseInt(dmy[1], 10));
        } else {
          lmp = new Date(str);
        }
      }
      if (!lmp || isNaN(lmp.getTime())) return null;

      const now = new Date();
      const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const lmpZero = new Date(lmp.getFullYear(), lmp.getMonth(), lmp.getDate());

      const diffMs = todayZero.getTime() - lmpZero.getTime();
      const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      const currentWeek = Math.max(1, Math.min(40, Math.floor(diffDays / 7) + 1));

      const dueDateObj = new Date(lmpZero.getFullYear(), lmpZero.getMonth(), lmpZero.getDate() + 280);
      const dueDateStr = dueDateObj.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });

      const confirmationDateStr = lmpZero.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });

      const daysLeft = Math.max(
        0,
        Math.floor((dueDateObj.getTime() - todayZero.getTime()) / (1000 * 60 * 60 * 24))
      );
      const trimester = currentWeek <= 13 ? '1st' : currentWeek <= 27 ? '2nd' : '3rd';
      const progressPercentage = Math.min(100, Math.round((currentWeek / 40) * 100));

      return {
        confirmationDate: lmpZero,
        confirmationDateStr,
        dueDateObj,
        dueDate: dueDateStr,
        currentWeek,
        totalWeeks: 40,
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
        const parsed = JSON.parse(saved);
        if (parsed?.hospital?.includes("St. Mary") || parsed?.name?.includes("Robust")) {
          localStorage.removeItem('happimom_emergency_contact');
          return null;
        }
        return parsed;
      } catch (e) {
        console.error('Failed to parse saved emergency contact', e);
      }
    }
    return null;
  });

  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [emergencyModalReadOnly, setEmergencyModalReadOnly] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const openEmergencyModal = ({ readOnly = false } = {}) => {
    setEmergencyModalReadOnly(readOnly);
    setIsEmergencyModalOpen(true);
  };

  const closeEmergencyModal = () => {
    setIsEmergencyModalOpen(false);
    setEmergencyModalReadOnly(false);
  };

  const updateEmergencyContact = (updatedContact) => {
    setEmergencyContact(updatedContact);
    localStorage.setItem('happimom_emergency_contact', JSON.stringify(updatedContact));
  };

  // Appointments State & Operations
  const [appointments, setAppointments] = useState(() => {
    const saved = localStorage.getItem('happimom_appointments');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved appointments', e);
      }
    }
    return [];
  });

  const refreshAppointments = async () => {
    if (!user?.id) return;
    try {
      const data = await getUserAppointments(user.id);
      if (Array.isArray(data)) {
        setAppointments(data);
        localStorage.setItem('happimom_appointments', JSON.stringify(data));
      }
    } catch (e) {
      console.error('Failed to load appointments from server', e);
    }
  };

  useEffect(() => {
    if (user?.id) {
      refreshAppointments();
    } else {
      setAppointments([]);
      localStorage.removeItem('happimom_appointments');
    }
  }, [user?.id]);

  const scheduleAppointment = async (apptData) => {
    const payload = { ...apptData, userId: user?.id };
    const created = await createAppointment(payload);
    setAppointments((prev) => {
      const updated = [...prev, created].sort((a, b) => (a.appointmentDate || '').localeCompare(b.appointmentDate || ''));
      localStorage.setItem('happimom_appointments', JSON.stringify(updated));
      return updated;
    });
    return created;
  };

  const schedulePrescriptionAppointment = async (formData) => {
    const scheduled = await uploadPrescriptionAndSchedule({ ...formData, userId: user?.id });
    setAppointments((prev) => {
      const updated = [...prev, scheduled].sort((a, b) => (a.appointmentDate || '').localeCompare(b.appointmentDate || ''));
      localStorage.setItem('happimom_appointments', JSON.stringify(updated));
      return updated;
    });
    return scheduled;
  };

  const uploadPostAppointmentReport = async (appointmentId, file, notes) => {
    const updated = await uploadDoctorReportAndExplain({
      appointmentId,
      file,
      userId: user?.id,
      notes
    });
    setAppointments((prev) => {
      const next = prev.map((a) => (a.id === appointmentId ? updated : a));
      localStorage.setItem('happimom_appointments', JSON.stringify(next));
      return next;
    });
    return updated;
  };

  const removeAppointment = async (appointmentId) => {
    await deleteAppointment(appointmentId, user?.id);
    setAppointments((prev) => {
      const next = prev.filter((a) => a.id !== appointmentId);
      localStorage.setItem('happimom_appointments', JSON.stringify(next));
      return next;
    });
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
        emergencyModalReadOnly,
        setEmergencyModalReadOnly,
        openEmergencyModal,
        closeEmergencyModal,
        isChatOpen,
        setIsChatOpen,
        appointments,
        refreshAppointments,
        scheduleAppointment,
        schedulePrescriptionAppointment,
        uploadPostAppointmentReport,
        removeAppointment
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
