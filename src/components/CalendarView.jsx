import React, { useState } from 'react';
import '../css/CalendarView.css';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Exact color-coded map matching the user screenshot for September 2026:
// Pink: 3, 4, 5, 6, 7
// Green: 12, 13, 14, 15, 16, 18
// Orange: 17
// Outline/Today (White with pink border): 19
const SEPTEMBER_2026_DAYS = {
  3: { type: 'pink', title: 'Prenatal Doctor Appointment', time: '10:00 AM' },
  4: { type: 'pink', title: 'Ultrasound Checkup', time: '11:30 AM' },
  5: { type: 'pink', title: 'Consultation & Blood Panel', time: '9:00 AM' },
  6: { type: 'pink', title: 'Nutrition & Fetal Health Review', time: '10:15 AM' },
  7: { type: 'pink', title: 'Doctor Follow-up Session', time: '2:30 PM' },
  12: { type: 'green', title: 'Growth Milestone Checkpoint', time: 'All Day' },
  13: { type: 'green', title: 'Week 14 Kickoff: Trimester 2 Begins', time: 'All Day' },
  14: { type: 'green', title: 'Baby Fingerprints Formed', time: 'All Day' },
  15: { type: 'green', title: 'Heartbeat Monitoring Milestone', time: 'All Day' },
  16: { type: 'green', title: 'Sensory Development Checkpoint', time: 'All Day' },
  17: { type: 'orange', title: 'Important Reminder: Glucose Screening Refill', time: '9:00 AM' },
  18: { type: 'green', title: 'Movement & Kick Sensations Check', time: 'All Day' },
  19: { type: 'outline', title: 'Today: Rest, Hydration & Pelvic Exercises', time: 'All Day' }
};

const CalendarView = ({ currentDate: externalDate }) => {
  // Use real Date API
  const realToday = new Date();
  const [currentDate, setCurrentDate] = useState(externalDate || new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const handleResetToToday = () => {
    setCurrentDate(new Date());
    setSelectedDay(null);
  };

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  // Determine styling for a day cell
  const getDayInfo = (d) => {
    if (month === 8 && year === 2026) {
      return SEPTEMBER_2026_DAYS[d] || { type: 'normal' };
    }
    // Pattern for other months so navigation remains engaging
    if ([3, 4, 5, 6, 7].includes(d)) return { type: 'pink', title: 'Doctor Appointment', time: '10:00 AM' };
    if ([12, 13, 14, 15, 16, 18].includes(d)) return { type: 'green', title: 'Growth Milestone', time: 'All Day' };
    if (d === 17) return { type: 'orange', title: 'Important Reminder', time: '9:00 AM' };
    if (d === 19) return { type: 'outline', title: 'Current Day', time: 'All Day' };
    return { type: 'normal' };
  };

  const daysGrid = [];
  // Empty slots for preceding days
  for (let i = 0; i < firstDayIndex; i++) {
    daysGrid.push({ empty: true, key: `empty-${i}` });
  }
  // Month days
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const info = getDayInfo(d);
    daysGrid.push({
      empty: false,
      day: d,
      ...info,
      key: `day-${d}`
    });
  }

  return (
    <div className="happimom-calendar-card">
      {/* Top Header: Navigation arrows & Centered Month/Year */}
      <div className="happimom-calendar-header">
        <button
          className="header-arrow-btn"
          onClick={handlePrevMonth}
          aria-label="Previous Month"
        >
          ←
        </button>

        <h2 className="header-month-title">
          {MONTH_NAMES[month]} {year}
        </h2>

        <button
          className="header-arrow-btn"
          onClick={handleNextMonth}
          aria-label="Next Month"
        >
          →
        </button>
      </div>

      {/* Weekday Row: Sun-Sat */}
      <div className="happimom-weekdays-row">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="weekday-column-title">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid matching screenshot cells */}
      <div className="happimom-calendar-grid">
        {daysGrid.map((item) => {
          if (item.empty) {
            return <div key={item.key} className="day-block empty-day-block" />;
          }

          // Check if this cell is today's real date
          const isToday =
            year === realToday.getFullYear() &&
            month === realToday.getMonth() &&
            item.day === realToday.getDate();

          const isSelected = selectedDay?.day === item.day;

          return (
            <div
              key={item.key}
              className={`day-block block-normal ${isToday ? 'block-today' : ''} ${isSelected ? 'block-selected' : ''}`}
              onClick={() => setSelectedDay(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setSelectedDay(item)}
              title={isToday ? "Today's Date" : `Day ${item.day}`}
            >
              <span className="day-number-label">{item.day}</span>
              {isToday && <span className="today-badge-label">Today</span>}
            </div>
          );
        })}
      </div>

      {/* Optional detail popup if a day is clicked */}
      {selectedDay && selectedDay.type !== 'normal' && (
        <div className={`selected-day-banner banner-${selectedDay.type}`}>
          <div className="selected-day-info">
            <span className="selected-day-pill">Day {selectedDay.day}</span>
            <div className="selected-day-text">
              <strong>{selectedDay.title}</strong>
              <span>⏰ {selectedDay.time}</span>
            </div>
          </div>
          <button
            className="selected-day-close"
            onClick={() => setSelectedDay(null)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
