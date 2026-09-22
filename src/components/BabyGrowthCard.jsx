import React from 'react';
import { useTracker } from '../context/TrackerContext';
import '../css/BabyGrowthCard.css';

const BabyGrowthCard = () => {
  const { babyGrowth } = useTracker();

  if (!babyGrowth) return null;

  return (
    <div className="baby-growth-card" aria-label="Baby Growth Information">
      {/* 1. Header: Milestone Tag & Category Badge */}
      <div className="baby-growth-header">
        <div className="baby-growth-tag">
          <span className="sparkle-icon">✨</span>
          <span>Week {babyGrowth.week} Milestone</span>
        </div>
        <span className="baby-growth-badge">Development</span>
      </div>

      {/* 2. Main Title - Full Width, Clear Hierarchy */}
      <h3 className="baby-size-title">
        Your baby is the <span className="highlight-text">{babyGrowth.comparison}</span>
      </h3>

      {/* 3. Visual Showcase Banner: Cute illustration & Dimensions chip */}
      <div className="baby-visual-showcase">
        <div className="baby-emoji-box" role="img" aria-label="Baby size comparison">
          <span className="baby-emoji-icon">{babyGrowth.emoji}</span>
        </div>
        <div className="baby-showcase-meta">
          <span className="baby-showcase-label">Current Size Comparison</span>
          <div className="baby-dimensions-chip">
            <span className="dimensions-ruler">📏</span>
            <span>{babyGrowth.dimensions}</span>
          </div>
        </div>
      </div>

      {/* 4. Development Description */}
      <p className="baby-size-description">
        {babyGrowth.description}
      </p>

      {/* 5. Key Highlights / Milestones Checklist */}
      {babyGrowth.highlights && babyGrowth.highlights.length > 0 && (
        <div className="baby-highlights-block">
          <span className="baby-highlights-subtitle">Key Developments This Week</span>
          <ul className="baby-highlights-list">
            {babyGrowth.highlights.map((highlight, index) => (
              <li key={index} className="baby-highlight-item">
                <span className="highlight-bullet">✓</span>
                <span className="highlight-text-val">{highlight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default BabyGrowthCard;
