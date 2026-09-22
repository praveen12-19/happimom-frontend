import React, { useState, useEffect, useRef } from 'react';

const BreathingSection = () => {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState('Inhale'); // 'Inhale', 'Hold', 'Exhale'
  const [phaseTime, setPhaseTime] = useState(4);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);

  useEffect(() => {
    let timer = null;
    if (isActive) {
      timer = setInterval(() => {
        setPhaseTime((prev) => {
          if (prev <= 1) {
            // Transition phase
            if (phase === 'Inhale') {
              setPhase('Hold');
              return 4;
            } else if (phase === 'Hold') {
              setPhase('Exhale');
              return 6;
            } else {
              setPhase('Inhale');
              setCyclesCompleted((c) => c + 1);
              return 4;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isActive, phase]);

  const toggleSession = () => {
    if (!isActive) {
      setPhase('Inhale');
      setPhaseTime(4);
    }
    setIsActive(!isActive);
  };

  return (
    <div className="section-interactive-view">
      <div className="section-view-header">
        <div className="section-title-wrap">
          <span className="section-pill-tag">Mindfulness & Breath</span>
          <h2 className="section-main-heading">🫁 Guided Breathing Practice</h2>
          <p className="section-main-sub">Gentle diaphragmatic breathing supplies rich oxygen to your baby and soothes anxiety.</p>
        </div>
      </div>

      <div className="breathing-card-container">
        {/* Animated Breathing Circle */}
        <div className="breathing-circle-outer">
          <div
            className={`breathing-circle ${isActive ? phase.toLowerCase() : 'idle'}`}
          >
            <div className="breathing-content">
              <span className="breathing-phase-text">
                {isActive ? phase : 'Ready?'}
              </span>
              <span className="breathing-timer-text">
                {isActive ? `${phaseTime}s` : 'Press Start'}
              </span>
              <span className="breathing-sub-guide">
                {isActive
                  ? phase === 'Inhale'
                    ? 'Breathe deeply through nose'
                    : phase === 'Hold'
                    ? 'Gently pause & stay soft'
                    : 'Slowly release through mouth'
                  : '4-4-6 Calming Pattern'}
              </span>
            </div>
          </div>
        </div>

        {/* Controls & Metrics */}
        <div className="breathing-controls-panel">
          <div className="breathing-stats">
            <div className="b-stat-item">
              <span className="b-stat-number">{cyclesCompleted}</span>
              <span className="b-stat-label">Cycles Completed</span>
            </div>
          </div>

          <div className="breathing-btn-row">
            <button
              className={`breathing-main-btn ${isActive ? 'active' : ''}`}
              onClick={toggleSession}
            >
              {isActive ? '⏸ Pause Breathing' : '▶ Start Breathing'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BreathingSection;
