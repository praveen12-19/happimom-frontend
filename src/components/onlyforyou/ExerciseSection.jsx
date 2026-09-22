import React, { useState } from 'react';

const EXERCISES = [
  {
    id: 'pelvic-tilts',
    name: 'Pelvic Tilts (Standing or Hands & Knees)',
    reps: '10–12 Reps',
    target: 'Deep Core & Lower Spine',
    icon: '✨',
    tips: 'Gently tuck your pelvis forward to flatten the lower back arch. Inhale release, exhale tilt.',
    benefits: 'Strengthens abdominal muscles, alleviates pregnancy back strain, and prepares pelvis for birth.'
  },
  {
    id: 'side-leg-raises',
    name: 'Side-Lying Clamshells & Leg Raises',
    reps: '10 Reps per side',
    target: 'Glutes & Hip Stabilizers',
    icon: '🦵',
    tips: 'Lie on your side with knees slightly bent. Rest your head on your arm or a pillow. Lift upper knee smoothly.',
    benefits: 'Strengthens hips to support the weight of the growing baby and stabilize pelvis.'
  },
  {
    id: 'wall-pushups',
    name: 'Gentle Wall Push-Ups',
    reps: '10–15 Reps',
    target: 'Chest, Shoulders & Posture',
    icon: '🧱',
    tips: 'Stand arm’s length from the wall. Place hands flat shoulder-width apart. Bend elbows to bring chest toward wall.',
    benefits: 'Builds upper body strength for holding your baby without abdominal pressure.'
  },
  {
    id: 'ankle-pumps',
    name: 'Ankle Circles & Calf Pumps',
    reps: '15 Circles each direction',
    target: 'Circulation & Leg Relief',
    icon: '🦶',
    tips: 'Sit comfortably with legs extended. Rotate ankles slowly clockwise, then counter-clockwise. Point and flex toes.',
    benefits: 'Improves venous return, helps prevent varicose veins, and relieves swollen ankles.'
  },
  {
    id: 'seated-torso',
    name: 'Seated Torso Circles',
    reps: '8 Reps each way',
    target: 'Spine Mobility & Pelvis',
    icon: '🧘‍♀️',
    tips: 'Sit cross-legged or on an exercise ball. Draw smooth, gentle circles with your torso from the hips.',
    benefits: 'Gently loosens tight hip flexors and lower back while easing digestion.'
  }
];

const ExerciseSection = () => {
  const [completed, setCompleted] = useState({});

  const toggleComplete = (id) => {
    setCompleted((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const completedCount = Object.values(completed).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / EXERCISES.length) * 100);

  return (
    <div className="section-interactive-view">
      <div className="section-view-header">
        <div className="section-title-wrap">
          <span className="section-pill-tag">Movement & Strength</span>
          <h2 className="section-main-heading">🏃‍♀️ Gentle Pregnancy Exercise</h2>
          <p className="section-main-sub">Low-impact, doctor-recommended movements to boost stamina, circulation, and maternal energy.</p>
        </div>

        {/* Progress Card */}
        <div className="exercise-progress-banner">
          <div className="progress-info">
            <span className="progress-label">Today's Routine Completed</span>
            <span className="progress-number">{completedCount} / {EXERCISES.length} Moves</span>
          </div>
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="exercise-cards-list">
        {EXERCISES.map((ex) => {
          const isDone = !!completed[ex.id];
          return (
            <div key={ex.id} className={`exercise-item-card ${isDone ? 'done' : ''}`}>
              <div className="exercise-item-left">
                <button
                  className={`exercise-checkbox ${isDone ? 'checked' : ''}`}
                  onClick={() => toggleComplete(ex.id)}
                  aria-label="Toggle completed"
                >
                  {isDone ? '✓' : ''}
                </button>
                <div className="exercise-icon-badge">{ex.icon}</div>
                <div className="exercise-item-details">
                  <div className="exercise-title-row">
                    <h3 className="exercise-title">{ex.name}</h3>
                    <span className="exercise-rep-badge">{ex.reps}</span>
                    <span className="exercise-target-badge">{ex.target}</span>
                  </div>
                  <p className="exercise-tips"><strong>How to perform:</strong> {ex.tips}</p>
                  <p className="exercise-benefits"><strong>Why it helps:</strong> {ex.benefits}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="exercise-tip-footer">
        <div className="water-tip">
          <span>💧</span>
          <div>
            <strong>Hydration & Comfort Rule:</strong> Keep a water bottle nearby. Never hold your breath during reps; always breathe continuously. Stop immediately if you feel lightheaded.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseSection;
