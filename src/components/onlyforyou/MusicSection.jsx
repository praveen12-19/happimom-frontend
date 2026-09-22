import React, { useState, useEffect, useRef } from 'react';

const TRACKS = [
  {
    id: 'rain',
    title: 'Gentle Rainfall & Warm Cozy Mist',
    category: 'Nature Ambience',
    icon: '🌧️',
    description: 'Soft rhythmic raindrops to melt away sensory overload and ease bedtime insomnia.',
    type: 'rain'
  },
  {
    id: 'ocean',
    title: 'Ocean Waves & Twilight Shore',
    category: 'Water Soundscape',
    icon: '🌊',
    description: 'Slow rhythmic waves mimicking the peaceful amniotic whoosh your baby hears.',
    type: 'ocean'
  },
  {
    id: 'zen',
    title: 'Zen Tibetan Bowl & Harmonic Drone',
    category: 'Meditation & Calm',
    icon: '🧘',
    description: 'Warm resonant acoustic frequencies that relax muscles and reduce cortisol levels.',
    type: 'zen'
  },
  {
    id: 'lullaby',
    title: 'Sweet Celestial Lullaby',
    category: 'Baby & Mom Melody',
    icon: '✨',
    description: 'Delicate soothing chimes tuned to 432 Hz for deep serenity and bonding.',
    type: 'lullaby'
  }
];

const MusicSection = () => {
  const [selectedTrack, setSelectedTrack] = useState(TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const [sleepTimer, setSleepTimer] = useState(null); // in minutes
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState(null);

  const audioCtxRef = useRef(null);
  const gainNodeRef = useRef(null);
  const soundNodesRef = useRef([]);

  // Setup Web Audio nodes according to track type
  const stopAudio = () => {
    if (soundNodesRef.current.length) {
      soundNodesRef.current.forEach((node) => {
        try {
          if (node.stop) node.stop();
          node.disconnect();
        } catch (e) {
          // ignore
        }
      });
      soundNodesRef.current = [];
    }
  };

  const startAudio = (track) => {
    stopAudio();
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume, ctx.currentTime);
      masterGain.connect(ctx.destination);
      gainNodeRef.current = masterGain;

      if (track.type === 'rain' || track.type === 'ocean') {
        // Generate Pink/Brown noise for rain or ocean
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
          b6 = white * 0.115926;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        if (track.type === 'rain') {
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(800, ctx.currentTime);
        } else {
          // Ocean waves: LFO on lowpass filter
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(400, ctx.currentTime);

          const lfo = ctx.createOscillator();
          lfo.frequency.setValueAtTime(0.12, ctx.currentTime); // Wave period ~8s
          const lfoGain = ctx.createGain();
          lfoGain.gain.setValueAtTime(320, ctx.currentTime);
          lfo.connect(lfoGain);
          lfoGain.connect(filter.frequency);
          lfo.start();
          soundNodesRef.current.push(lfo, lfoGain);
        }

        whiteNoise.connect(filter);
        filter.connect(masterGain);
        whiteNoise.start();
        soundNodesRef.current.push(whiteNoise, filter);
      } else if (track.type === 'zen' || track.type === 'lullaby') {
        // Multi-oscillator harmonic chord drone (Root, 5th, Octave)
        const baseFreq = track.type === 'zen' ? 146.83 : 261.63; // D3 vs C4
        const freqs = [baseFreq, baseFreq * 1.5, baseFreq * 2];

        freqs.forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const subGain = ctx.createGain();
          osc.type = idx === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(f, ctx.currentTime);

          // Subtle detune for shimmer
          osc.detune.setValueAtTime((idx - 1) * 3, ctx.currentTime);

          subGain.gain.setValueAtTime(0.08 / (idx + 1), ctx.currentTime);

          osc.connect(subGain);
          subGain.connect(masterGain);
          osc.start();
          soundNodesRef.current.push(osc, subGain);
        });
      }
    } catch (err) {
      console.warn('Audio playback error', err);
    }
  };

  const handlePlayToggle = () => {
    if (isPlaying) {
      stopAudio();
      setIsPlaying(false);
    } else {
      startAudio(selectedTrack);
      setIsPlaying(true);
    }
  };

  const handleTrackSelect = (track) => {
    setSelectedTrack(track);
    if (isPlaying) {
      startAudio(track);
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(val, audioCtxRef.current.currentTime);
    }
  };

  // Sleep timer management
  useEffect(() => {
    if (!sleepTimer || !isPlaying) {
      setSleepTimerRemaining(null);
      return;
    }
    setSleepTimerRemaining(sleepTimer * 60);
    const interval = setInterval(() => {
      setSleepTimerRemaining((prev) => {
        if (prev <= 1) {
          stopAudio();
          setIsPlaying(false);
          setSleepTimer(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sleepTimer, isPlaying]);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  return (
    <div className="section-interactive-view">
      <div className="section-view-header">
        <div className="section-title-wrap">
          <span className="section-pill-tag">Calm & Relaxation</span>
          <h2 className="section-main-heading">🎵 Calm Musics & Soundscapes</h2>
          <p className="section-main-sub">Peaceful natural ambiences, meditative drones, and soothing frequencies for you and your baby.</p>
        </div>
      </div>

      <div className="music-player-layout">
        {/* Main Player Card */}
        <div className="music-active-card">
          <div className="music-art-disc">
            <span className={`music-disc-icon ${isPlaying ? 'spinning' : ''}`}>
              {selectedTrack.icon}
            </span>
          </div>

          <div className="music-active-info">
            <span className="music-category-badge">{selectedTrack.category}</span>
            <h3 className="music-track-title">{selectedTrack.title}</h3>
            <p className="music-track-desc">{selectedTrack.description}</p>
          </div>

          {/* Visualizer waves */}
          <div className={`audio-waves-container ${isPlaying ? 'active' : ''}`}>
            <span className="wave-bar bar-1"></span>
            <span className="wave-bar bar-2"></span>
            <span className="wave-bar bar-3"></span>
            <span className="wave-bar bar-4"></span>
            <span className="wave-bar bar-5"></span>
            <span className="wave-bar bar-6"></span>
            <span className="wave-bar bar-7"></span>
          </div>

          {/* Primary Controls */}
          <div className="music-controls-row">
            <button
              className={`music-play-btn ${isPlaying ? 'playing' : ''}`}
              onClick={handlePlayToggle}
              aria-label="Play or Pause"
            >
              {isPlaying ? '⏸ Pause' : '▶ Play Ambient Audio'}
            </button>
          </div>

          {/* Volume Slider & Sleep Timer */}
          <div className="music-extras-row">
            <div className="music-vol-wrap">
              <span className="vol-icon">🔊</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={handleVolumeChange}
                className="music-vol-slider"
              />
            </div>

            <div className="music-timer-picker">
              <span className="timer-label">⏱ Sleep Timer:</span>
              {[5, 15, 30].map((mins) => (
                <button
                  key={mins}
                  className={`timer-chip ${sleepTimer === mins ? 'selected' : ''}`}
                  onClick={() => setSleepTimer(sleepTimer === mins ? null : mins)}
                >
                  {mins}m
                </button>
              ))}
              {sleepTimerRemaining && (
                <span className="timer-countdown">
                  ({Math.floor(sleepTimerRemaining / 60)}:
                  {(sleepTimerRemaining % 60).toString().padStart(2, '0')})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tracks Playlist */}
        <div className="music-playlist-card">
          <h4 className="playlist-heading">Curated Sound Library</h4>
          <div className="playlist-items">
            {TRACKS.map((track) => {
              const isSelected = selectedTrack.id === track.id;
              return (
                <div
                  key={track.id}
                  className={`playlist-item ${isSelected ? 'active' : ''}`}
                  onClick={() => handleTrackSelect(track)}
                >
                  <span className="item-icon">{track.icon}</span>
                  <div className="item-details">
                    <span className="item-title">{track.title}</span>
                    <span className="item-category">{track.category}</span>
                  </div>
                  {isSelected && isPlaying ? (
                    <span className="item-playing-indicator">Playing ♫</span>
                  ) : (
                    <span className="item-play-action">Select</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicSection;
