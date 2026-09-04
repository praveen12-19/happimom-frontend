import React from 'react';
import { useTracker } from '../context/TrackerContext';
import '../css/PregnancyProgressCard.css';

const PregnancyProgressCard = () => {
  const { pregnancy } = useTracker();

  if (!pregnancy) return null;

  return (
    <section className="progress-card-banner" aria-label="Pregnancy Progress Summary">
      <div className="progress-banner-overlay"></div>
      
      {/* Left side: Icon, Current Week, Due Date */}
      <div className="progress-left">
        <div className="progress-icon-badge" aria-hidden="true">
          <span className="progress-icon">👶</span>
        </div>
        
        <div className="progress-details">
          <span className="progress-subtitle">Current Week</span>
          <h2 className="progress-week-title">Week {pregnancy.currentWeek}</h2>
          <p className="progress-due-date">
            <span className="due-date-icon">🗓️</span>
            Due Date: {pregnancy.dueDate || 'Not calculated'}
          </p>
        </div>
      </div>

      {/* Right side: Two stats — Trimester and Days Left with bold pink numbers */}
      <div className="progress-right-stats">
        <div className="stat-pill">
          <span className="stat-label">Trimester</span>
          <span className="stat-value bold-pink-number">{pregnancy.trimester}</span>
        </div>

        <div className="stat-pill">
          <span className="stat-label">Days Left</span>
          <span className="stat-value bold-pink-number">{pregnancy.daysLeft}</span>
        </div>
      </div>
    </section>
  );
};

export default PregnancyProgressCard;
