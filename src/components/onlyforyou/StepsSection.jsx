import React, { useState, useEffect, useRef } from 'react';

// Haversine formula to compute actual physical distance (in meters) between coordinates
function getDisplacementMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const StepsSection = () => {
  const todayKey = `happimom_steps_${new Date().toISOString().slice(0, 10)}`;

  // Starts with 0
  const [steps, setSteps] = useState(() => {
    const saved = localStorage.getItem(todayKey);
    return saved ? parseInt(saved, 10) : 0;
  });

  const [isTracking, setIsTracking] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [speedKmh, setSpeedKmh] = useState('0.0');
  const [geoStatus, setGeoStatus] = useState('Stationary • Click "Start Tracking" to begin');

  const goal = 6000;
  const watchIdRef = useRef(null);
  const lastLocationRef = useRef(null);
  const lastStepTimeRef = useRef(0);

  // Save steps to localStorage
  useEffect(() => {
    localStorage.setItem(todayKey, steps.toString());
  }, [steps, todayKey]);

  // Real Geolocation and Movement Tracker (NO fake continuous timer)
  useEffect(() => {
    if (!isTracking) {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      lastLocationRef.current = null;
      setIsMoving(false);
      setSpeedKmh('0.0');
      setGeoStatus('Stationary • Tracking paused');
      return;
    }

    setGeoStatus('GPS Active • Monitoring movement (Laptop stationary)');

    // 1. Geolocation tracking with stationary jitter filter
    if ('geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, speed, accuracy } = pos.coords;
          const now = Date.now();

          // If GPS accuracy is too low (> 40m), ignore to prevent false leaps
          if (accuracy && accuracy > 40) {
            return;
          }

          if (lastLocationRef.current) {
            const dist = getDisplacementMeters(
              lastLocationRef.current.lat,
              lastLocationRef.current.lng,
              latitude,
              longitude
            );
            const timeDiffSec = (now - lastLocationRef.current.time) / 1000;

            // Threshold: If displacement is under 2.5 meters, the device is considered STATIONARY (no step added)
            if (dist < 2.5) {
              setIsMoving(false);
              setSpeedKmh('0.0');
              setGeoStatus('Stationary (0.0 km/h) • Device not moving');
            } else if (timeDiffSec > 1.5) {
              // Real physical movement detected
              const calculatedSpeedKmh = Math.min(12, (dist / timeDiffSec) * 3.6);
              const reportedSpeed = speed ? speed * 3.6 : calculatedSpeedKmh;
              const displaySpeed = Math.max(0.5, reportedSpeed).toFixed(1);

              // Average stride length for gentle walking: 0.72 meters
              const stepsGained = Math.max(1, Math.round(dist / 0.72));

              setSteps((prev) => prev + stepsGained);
              setIsMoving(true);
              setSpeedKmh(displaySpeed);
              setGeoStatus(`Active Movement • ${displaySpeed} km/h • GPS Steps Logged`);

              lastLocationRef.current = { lat: latitude, lng: longitude, time: now };
            }
          } else {
            lastLocationRef.current = { lat: latitude, lng: longitude, time: now };
            setGeoStatus('GPS Connected • Waiting for physical movement...');
          }
        },
        (err) => {
          console.warn('Geolocation warning:', err);
          setGeoStatus('GPS Standby • Waiting for location updates');
        },
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
      );
    }

    // 2. Physical Accelerometer Step Detection (triggers only when device physically shakes/moves)
    const handleDeviceMotion = (event) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc || acc.x === null) return;

      const totalAcc = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
      const now = Date.now();

      // Gravity is ~9.8 m/s². On a stationary table, totalAcc is ~9.8 with 0 variance.
      // A step produces a dynamic spike > 12.8 m/s²
      if (totalAcc > 12.8 && now - lastStepTimeRef.current > 450) {
        lastStepTimeRef.current = now;
        setIsMoving(true);
        setSpeedKmh('3.2');
        setSteps((prev) => prev + 1);
        setGeoStatus('Step Detected • Motion Sensor Active');

        setTimeout(() => {
          if (Date.now() - lastStepTimeRef.current >= 1500) {
            setIsMoving(false);
            setSpeedKmh('0.0');
            setGeoStatus('Stationary (0.0 km/h) • Device not moving');
          }
        }, 1500);
      }
    };

    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', handleDeviceMotion);
    }

    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (window.DeviceMotionEvent) {
        window.removeEventListener('devicemotion', handleDeviceMotion);
      }
    };
  }, [isTracking]);

  // Start / Stop Tracking Toggle
  const toggleTracking = () => {
    setIsTracking(!isTracking);
  };

  // Reset steps back to 0
  const handleReset = () => {
    setSteps(0);
    localStorage.setItem(todayKey, '0');
    setIsTracking(false);
    setIsMoving(false);
    setSpeedKmh('0.0');
    setGeoStatus('Counter reset to 0 • Ready to start');
  };

  // Optional manual step simulator for laptop/desktop testing without walking outside
  const handleSimulateSteps = (count = 10) => {
    setSteps((prev) => prev + count);
    setIsMoving(true);
    setSpeedKmh('3.5');
    setGeoStatus(`Test Steps Added (+${count})`);
    setTimeout(() => {
      setIsMoving(false);
      setSpeedKmh('0.0');
    }, 2000);
  };

  const percent = Math.min(100, Math.round((steps / goal) * 100));
  const km = (steps * 0.00072).toFixed(2);
  const calories = Math.round(steps * 0.038);

  return (
    <div className="section-interactive-view steps-clean-view">
      {/* Header */}
      <div className="section-view-header">
        <div className="section-title-wrap">
          <span className="section-pill-tag">Live Activity & GPS</span>
          <h2 className="section-main-heading">👟 Live Step Tracker</h2>
          <p className="section-main-sub">
            Starts with 0. Increments only when you physically move. Stays paused when stationary.
          </p>
        </div>
      </div>

      {/* Main Single-Circle Walking Tracker Container */}
      <div className="clean-walking-circle-wrapper">
        {/* Live Status Badge */}
        <div className={`live-movement-status-badge ${isMoving ? 'moving' : 'stationary'}`}>
          <span className="status-dot" />
          <span className="status-text">
            {isMoving
              ? `Active Movement (${speedKmh} km/h) • Counting Steps`
              : isTracking
              ? `Stationary (0.0 km/h) • Device Not Moving`
              : 'Stationary • Tracking Paused'}
          </span>
        </div>

        {/* Central Circular Progress Ring with Walking Woman */}
        <div className="walking-hero-ring-container">
          {/* Pulsing Ripple Rings (Active ONLY when real movement is detected) */}
          <div className={`ring-ripple-effect ${isMoving ? 'active-ripple' : ''}`} />

          {/* SVG Progress Circle */}
          <svg className="walking-progress-svg" viewBox="0 0 280 280">
            <circle
              className="walking-circle-track"
              cx="140"
              cy="140"
              r="124"
            />
            <circle
              className="walking-circle-progress"
              cx="140"
              cy="140"
              r="124"
              strokeDasharray="780"
              strokeDashoffset={780 - (780 * percent) / 100}
            />
          </svg>

          {/* Center Content: Walking Woman Character (Kept completely still with no shaking) */}
          <div className="walking-character-inner">
            <div className="walking-character-frame">
              <img
                src="/assets/woman-walking.jpg"
                alt="Pregnant woman walking"
                className="walking-woman-img"
              />
            </div>
          </div>
        </div>

        {/* Steps Readout Details */}
        <div className="walking-readout-block">
          <div className="steps-giant-number-wrap">
            <span className="steps-giant-number">
              {steps.toLocaleString()}
            </span>
            <span className="steps-giant-unit">Steps</span>
          </div>

          <div className="steps-submetrics-row">
            <span className="submetric-pill">🎯 Goal: {goal.toLocaleString()} ({percent}%)</span>
            <span className="submetric-pill">📍 {km} km</span>
            <span className="submetric-pill">🔥 {calories} kcal</span>
          </div>

          <p className="geo-status-indicator-text">{geoStatus}</p>
        </div>

        {/* Primary Action Controls */}
        <div className="clean-steps-actions-row">
          <button
            className={`geo-track-master-btn ${isTracking ? 'tracking-on' : ''}`}
            onClick={toggleTracking}
          >
            {isTracking ? '⏸ Pause Tracking' : '▶ Start Tracking'}
          </button>

          <button className="steps-clean-reset-btn" onClick={handleReset}>
            ↺ Reset to 0
          </button>

          {/* Convenient Test Button for Stationary Laptops/Desktops */}
          <button
            className="steps-clean-reset-btn"
            style={{ borderColor: '#fed7aa', color: '#ea580c' }}
            onClick={() => handleSimulateSteps(10)}
            title="Add 10 test steps without having to walk outside with your laptop"
          >
            +10 Test Steps
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepsSection;
