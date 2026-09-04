import React from 'react';
import { useTracker } from '../context/TrackerContext';
import '../css/BabyGrowthCard.css';

const BabyGrowthCard = () => {
  const { babyGrowth } = useTracker();

  if (!babyGrowth) return null;

  return (
    <div className="baby-growth-card" aria-label="Baby Growth Information">
      <div className="baby-growth-header">
        <div className="baby-growth-tag">
          <span className="sparkle-icon">✨</span>
          <span>Week {babyGrowth.week} Milestone</span>
        </div>
        <span className="baby-growth-badge">Development</span>
      </div>

      <div className="baby-growth-content">
        <div className="baby-illustration-box">
          <span className="baby-emoji" role="img" aria-label="Baby size comparison">
            {babyGrowth.emoji}
          </span>
          <span className="baby-dimensions-chip">
            {babyGrowth.dimensions}
          </span>
        </div>

        <div className="baby-growth-text-block">
          <h3 className="baby-size-title">
            Your baby is the <span className="highlight-text">{babyGrowth.comparison}</span>
          </h3>

          <p className="baby-size-description">
            {babyGrowth.description}
          </p>

          {babyGrowth.highlights && (
            <ul className="baby-highlights-list">
              {babyGrowth.highlights.map((highlight, index) => (
                <li key={index} className="baby-highlight-item">
                  <span className="highlight-bullet">✓</span>
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default BabyGrowthCard;
