import React, { useState, useEffect, useRef } from 'react';

const CATEGORIES = [
  { id: 'all', label: 'All Poses' },
  { id: 'back-relief', label: 'Back & Sciatica Relief' },
  { id: 'labor-hips', label: 'Labor Prep & Hips' },
  { id: 'rest-swelling', label: 'Rest & Swelling Relief' }
];

const POSES = [
  {
    id: 'cat-cow',
    name: 'Cat-Cow Stretch',
    sanskrit: 'Marjaryasana & Bitilasana',
    category: 'back-relief',
    trimester: 'All Trimesters Safe',
    duration: 60,
    icon: '🐈',
    image: '/assets/yoga/cat-cow.jpg',
    benefits: 'Relieves lower back compression, eases pelvic heaviness, and gently encourages optimal head-down baby positioning (anterior position).',
    instructions: [
      'Begin on hands and knees with wrists directly beneath shoulders and knees hip-width apart.',
      'Inhale softly: Relax your belly downward toward the floor, roll your shoulders back, and look slightly forward (Cow Pose).',
      'Exhale slowly: Gently draw baby toward your spine, round your back toward the ceiling, and tuck your chin (Cat Pose).',
      'Move fluidly with your breath for 5 to 8 slow, continuous cycles without overarching your lower spine.'
    ],
    precautions: 'Do not overarch your lower back. Keep the movements soft, gentle, and breath-centered.'
  },
  {
    id: 'childs-pose',
    name: 'Supported Wide-Knee Child’s Pose',
    sanskrit: 'Balasana (Prenatal Modification)',
    category: 'rest-swelling',
    trimester: 'All Trimesters Safe',
    duration: 120,
    icon: '🌸',
    image: '/assets/yoga/childs-pose.jpg',
    benefits: 'Decompresses lumbar vertebrae, calms maternal stress hormones, and gives the baby bump complete freedom from pressure.',
    instructions: [
      'Kneel on your mat and spread your knees wide to the outer edges to create generous space for your baby bump.',
      'Bring your big toes together and gently sink your hips back toward your heels.',
      'Place a bolster, stacked cushions, or firm pillows between your knees and fold your torso forward onto the support.',
      'Rest your head comfortably to one side, relax your arms forward, close your eyes, and take slow belly breaths.'
    ],
    precautions: 'Never allow your abdomen to feel squished or compressed. Place a rolled towel under shins if ankles ache.'
  },
  {
    id: 'butterfly',
    name: 'Bound Angle / Butterfly Pose',
    sanskrit: 'Baddha Konasana',
    category: 'labor-hips',
    trimester: 'All Trimesters Safe',
    duration: 90,
    icon: '🦋',
    image: '/assets/yoga/butterfly.jpg',
    benefits: 'Opens tight pelvic muscles, gently stretches inner thighs, improves blood circulation to the womb, and prepares the pelvic floor for smooth labor.',
    instructions: [
      'Sit tall on the mat with a folded blanket under your sit bones to tilt your pelvis forward into comfortable alignment.',
      'Bend knees and bring the soles of your feet together, letting your knees naturally fall open to each side.',
      'Gently hold your ankles or shins, lengthen your spine upward, and relax your shoulder blades down.',
      'Breathe deeply into your lower abdomen. If comfortable, gently flutter your knees like butterfly wings.'
    ],
    precautions: 'Never force your knees downward. If groin or hips feel tight, place cushions or yoga blocks under each knee.'
  },
  {
    id: 'goddess-squat',
    name: 'Goddess Pose / Birth Squat',
    sanskrit: 'Utkata Konasana',
    category: 'labor-hips',
    trimester: 'Trimester 2 & 3',
    duration: 45,
    icon: '👑',
    image: '/assets/yoga/goddess-squat.jpg',
    benefits: 'Strengthens pelvic floor muscles, thighs, and glutes while opening the birth canal in preparation for natural delivery.',
    instructions: [
      'Step your feet 3 to 4 feet apart with toes turned outward at approximately 45 degrees.',
      'Inhale to lengthen your spine, then exhale and bend knees deeply, lowering hips into a wide squat stance.',
      'Keep your knees tracking in the same direction as your toes (never collapsing inward).',
      'Bring hands to heart center in prayer, keep your chest lifted, and hold for 3 to 5 calm, steady breaths.'
    ],
    precautions: 'If balance feels unsteady or fatigue sets in, place hands on a sturdy chair or lean your back against a wall.'
  },
  {
    id: 'side-lying-savasana',
    name: 'Side-Lying Savasana (Left Side Rest)',
    sanskrit: 'Parsva Savasana',
    category: 'rest-swelling',
    trimester: 'Essential for Trimester 2 & 3',
    duration: 180,
    icon: '🌙',
    image: '/assets/yoga/side-lying-savasana.jpg',
    benefits: 'The doctor-recommended gold standard for maternal rest. Lying on your left side maximizes blood and oxygen flow through the inferior vena cava to your baby and kidneys.',
    instructions: [
      'Lie comfortably on your left side with your head and neck supported by a plush pillow.',
      'Bend both knees slightly. Place a pillow or folded blanket between your knees and ankles to keep hips evenly aligned.',
      'Tuck a small soft pillow or rolled towel underneath your baby bump for gentle uplift.',
      'Rest your top arm on a pillow in front of your chest. Close your eyes and allow every muscle to melt into deep relaxation.'
    ],
    precautions: 'Avoid lying flat on your back after week 16 to prevent the weight of the uterus from compressing major blood vessels.'
  },
  {
    id: 'pelvic-circles',
    name: 'Hands-and-Knees Pelvic Circles',
    sanskrit: 'Chakrasana Variation',
    category: 'back-relief',
    trimester: 'All Trimesters Safe',
    duration: 90,
    icon: '🌀',
    image: '/assets/yoga/pelvic-circles.jpg',
    benefits: 'Instant relief for pregnancy sciatica, tailbone ache, and sacroiliac (SI) joint pain. Gently frees up tension in the lower back and pelvis.',
    instructions: [
      'Begin on all fours on a soft padded yoga mat.',
      'Slowly begin drawing smooth, flowing circles with your hips—swaying to the right, back toward heels, to the left, and forward.',
      'Imagine drawing a circle on the wall behind you with your tailbone.',
      'Complete 5 slow circles clockwise, then pause and complete 5 slow circles counter-clockwise.'
    ],
    precautions: 'Keep circles organic and gentle. Stop if you experience any sharp pelvic pain or dizziness.'
  },
  {
    id: 'seated-side-stretch',
    name: 'Seated Side Stretch (Rib Opener)',
    sanskrit: 'Sukhasana Side Stretch',
    category: 'back-relief',
    trimester: 'All Trimesters Safe',
    duration: 60,
    icon: '🧜‍♀️',
    image: '/assets/yoga/seated-side-stretch.jpg',
    benefits: 'Expands the rib cage and intercostal muscles, creating vital breathing room as your baby pushes upward against the diaphragm.',
    instructions: [
      'Sit cross-legged comfortably with a folded blanket under your hips to keep your spine effortlessly tall.',
      'Place your right hand flat on the floor beside you for steady grounding.',
      'Inhale: Sweep your left arm up overhead. Exhale: Gently lean to the right, opening the left side of your ribcage.',
      'Keep your chest open toward the front (avoid collapsing). Take 3 to 4 deep breaths, then smoothly switch sides.'
    ],
    precautions: 'Avoid deep abdominal twists. This movement is a pure, gentle lateral stretch along the ribs.'
  },
  {
    id: 'warrior-ii',
    name: 'Modified Prenatal Warrior II',
    sanskrit: 'Virabhadrasana II (Gentle)',
    category: 'labor-hips',
    trimester: 'Trimester 1 & 2 (Gentle in T3)',
    duration: 60,
    icon: '🛡️',
    image: '/assets/yoga/warrior-ii.jpg',
    benefits: 'Builds maternal stamina, strengthens legs and back, opens the chest, and counteracts sluggish circulation and fatigue.',
    instructions: [
      'Stand with feet wide apart. Turn your right foot outward 90 degrees and angle your back foot slightly inward.',
      'Bend your right knee so it tracks over your ankle (do not let it pass your toes).',
      'Extend arms out parallel to the floor at shoulder height, keeping shoulders relaxed away from your ears.',
      'Gaze softly over your right fingertips. Breathe deeply for 3–5 breaths, then repeat on the opposite side.'
    ],
    precautions: 'Adopt a shorter, stable stance. Use a chair placed under the front thigh if you need additional support.'
  },
  {
    id: 'legs-elevated',
    name: 'Legs Elevated on Bolster',
    sanskrit: 'Modified Viparita Karani',
    category: 'rest-swelling',
    trimester: 'All Trimesters Safe',
    duration: 120,
    icon: '🛋️',
    image: '/assets/yoga/legs-elevated.jpg',
    benefits: 'Reverses gravitational pressure on tired legs, dramatically reduces ankle swelling (edema), relieves varicose veins, and refreshes the circulatory system.',
    instructions: [
      'Place a pile of firm cushions, pillows, or a couch cushion in front of your mat.',
      'Sit sideways next to the cushions, then swing your legs up so your calves and ankles rest comfortably atop them.',
      'Keep your upper back and head propped up on pillows at a 45-degree angle (do not lie flat).',
      'Relax your arms by your sides with palms facing upward. Close your eyes and breathe rhythmically for 3 to 5 minutes.'
    ],
    precautions: 'Ensure your upper body is elevated on pillows so you are not lying completely flat on your back.'
  }
];

const YogaSection = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPose, setSelectedPose] = useState(POSES[0]);
  const [timeLeft, setTimeLeft] = useState(POSES[0].duration);
  const [timerRunning, setTimerRunning] = useState(false);

  const audioCtxRef = useRef(null);

  // Gentle chime sound
  const playTone = (freq = 523.25) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.3);
    } catch (e) {
      // ignore
    }
  };

  const filteredPoses = POSES.filter((pose) => {
    if (selectedCategory === 'all') return true;
    return pose.category === selectedCategory;
  });

  useEffect(() => {
    setTimeLeft(selectedPose.duration);
    setTimerRunning(false);
  }, [selectedPose]);

  useEffect(() => {
    let interval = null;
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerRunning) {
      playTone(659.25); // E5 chime
      setTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timeLeft]);

  const toggleTimer = () => {
    if (!timerRunning && timeLeft > 0) {
      playTone(523.25);
    }
    setTimerRunning(!timerRunning);
  };

  const resetTimer = () => {
    setTimerRunning(false);
    setTimeLeft(selectedPose.duration);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="section-interactive-view">
      <div className="section-view-header">
        <div className="section-title-wrap">
          <span className="section-pill-tag">Movement & Flexibility</span>
          <h2 className="section-main-heading">🧘‍♀️ Prenatal Yoga Routine</h2>
          <p className="section-main-sub">
            Doctor-approved, safe yoga poses specifically tailored with character visual guides to help you understand each pose easily.
          </p>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="yoga-category-tabs">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`yoga-cat-tab ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => {
              setSelectedCategory(cat.id);
              const firstMatch = POSES.find((p) => cat.id === 'all' || p.category === cat.id);
              if (firstMatch) setSelectedPose(firstMatch);
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="yoga-layout">
        {/* Poses Selector List */}
        <div className="yoga-pose-list">
          <div className="pose-list-header">
            <h4 className="sublist-heading">Safe Poses ({filteredPoses.length})</h4>
          </div>

          <div className="pose-scroll-list">
            {filteredPoses.map((pose) => {
              const isSelected = selectedPose.id === pose.id;
              return (
                <button
                  key={pose.id}
                  className={`yoga-pose-btn ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedPose(pose)}
                >
                  <div className="pose-btn-thumb-wrap">
                    <img
                      src={pose.image}
                      alt={pose.name}
                      className="pose-btn-thumb-img"
                    />
                  </div>
                  <div className="pose-btn-info">
                    <span className="pose-btn-title">{pose.name}</span>
                    <span className="pose-btn-sub">{pose.sanskrit}</span>
                    <span className="pose-btn-trim">{pose.trimester}</span>
                  </div>
                  <span className="pose-btn-time">{pose.duration}s</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Pose Detail & Visual Guide */}
        <div className="yoga-pose-detail-card">
          <div className="pose-detail-header">
            <div className="pose-title-area">
              <div className="pose-tag-row">
                <span className="pose-trimester-tag">{selectedPose.trimester}</span>
                <span className="pose-category-tag">Visual Guide</span>
              </div>
              <div className="pose-name-row">
                <div>
                  <h3 className="pose-detail-title">{selectedPose.name}</h3>
                  <p className="pose-detail-sanskrit">{selectedPose.sanskrit}</p>
                </div>
              </div>
            </div>

            {/* Timer Box */}
            <div className="pose-timer-box">
              <div className="timer-display">{formatTime(timeLeft)}</div>
              <div className="timer-controls">
                <button
                  className={`timer-action-btn ${timerRunning ? 'pause' : 'start'}`}
                  onClick={toggleTimer}
                >
                  {timerRunning ? '⏸ Pause' : '▶ Start'}
                </button>
                <button className="timer-action-btn reset" onClick={resetTimer}>
                  ↺ Reset
                </button>
              </div>
            </div>
          </div>

          {/* Character Visual Demonstration */}
          <div className="pose-visual-demonstration-wrap">
            <div className="pose-visual-frame">
              <img
                src={selectedPose.image}
                alt={`Mother practicing ${selectedPose.name}`}
                className="pose-character-main-img"
              />
              <div className="pose-visual-caption">
                <span className="caption-star">🌸</span>
                <span>Visual Form Guide for {selectedPose.name}</span>
              </div>
            </div>
          </div>

          <div className="pose-benefit-box">
            <strong>✨ Why It Helps: </strong> {selectedPose.benefits}
          </div>

          <div className="pose-instructions-block">
            <h4 className="instructions-title">Step-by-Step Prenatal Guide:</h4>
            <ol className="pose-instructions-list">
              {selectedPose.instructions.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
          </div>

          <div className="pose-safety-notice">
            <span className="safety-icon">⚠️</span>
            <div>
              <strong>Doctor-Approved Safety Tip:</strong> {selectedPose.precautions}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YogaSection;
