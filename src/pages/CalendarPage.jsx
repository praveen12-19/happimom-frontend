import React from 'react';
import TodayDateBanner from '../components/TodayDateBanner';
import CalendarView from '../components/CalendarView';
import FloatingChatButton from '../components/FloatingChatButton';
import EmergencyContactModal from '../components/EmergencyContactModal';
import './CalendarPage.css';

const CalendarPage = () => {
  const today = new Date();

  return (
    <main className="calendar-page-container">
      <div className="calendar-page-content">
        {/* Today's Date Card in between navbar & calendar, matching length */}
        <TodayDateBanner currentDate={today} />

        {/* Calendar View */}
        <CalendarView currentDate={today} />
      </div>
      <FloatingChatButton />
      <EmergencyContactModal />
    </main>
  );
};

export default CalendarPage;
