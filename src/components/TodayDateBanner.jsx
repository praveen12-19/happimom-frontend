import React from 'react';
import { useTracker } from '../context/TrackerContext';
import '../css/TodayDateBanner.css';

const TodayDateBanner = ({ currentDate }) => {
  // Use real Date API
  const today = currentDate || new Date();
  const { user, pregnancy } = useTracker();

  const isProfileComplete = Boolean(
    user && (user.profileComplete === true || user.isProfileComplete === true)
  );

  // Format real date e.g. "September 7, 2026"
  const formattedToday = today.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const weekdayName = today.toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <section className="today-date-banner-card" aria-label="Today Date & Cycle Summary">
      <div className="banner-left-content">
        {/* 3D-styled calendar icon matching image */}
        <div className="calendar-3d-icon" aria-hidden="true">
          <div className="calendar-icon-header">
            <span className="cal-ring ring-1"></span>
            <span className="cal-ring ring-2"></span>
          </div>
          <div className="calendar-icon-body">
            <div className="cal-dot"></div>
            <div className="cal-dot"></div>
            <div className="cal-dot"></div>
            <div className="cal-dot"></div>
            <div className="cal-dot active-blue"></div>
            <div className="cal-dot"></div>
          </div>
        </div>

        <div className="banner-date-details">
          <span className="banner-top-label">Today's Date</span>
          <h2 className="banner-large-date">{formattedToday}</h2>
          <span className="banner-subtext-day">{weekdayName}</span>
        </div>
      </div>

      {isProfileComplete && pregnancy && (
        <div className="banner-right-pregnancy-summary">
          <div className="pregnancy-summary-capsule">
            <div className="capsule-header">
              <span className="capsule-badge">🌸 Week {pregnancy.currentWeek}</span>
              <span className="capsule-trimester">{pregnancy.trimester} Trimester</span>
            </div>
            <div className="capsule-due-row">
              <span className="capsule-icon">🍼</span>
              <span className="capsule-due-text">
                Expected: <strong>{pregnancy.dueDate}</strong>
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default TodayDateBanner;
