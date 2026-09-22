import React, { useState, useEffect } from 'react';

const STORIES = [
  {
    id: 'starlight-meadow',
    title: 'The Starlight Meadow',
    author: 'HappyMom Bedtime Tales',
    readingTime: '4 mins read',
    icon: '✨',
    content: [
      'Far beyond the edge of the busy world lies a calm, golden meadow bathed in eternal twilight. Here, gentle lavender blossoms sway in tune with the quiet rhythm of the evening breeze.',
      'As you step into the soft grass, a comforting warmth wraps around your shoulders. You place a hand gently over your baby bump and feel the quiet harmony between your heart and the little heartbeat blooming inside you.',
      'Every star in the night sky glimmers like a soft nightlight, casting silvery ribbons upon the winding stream. The water whispers a tender melody, singing of peaceful rest, safe tomorrows, and unconditional love.',
      'Take a slow, deep breath in... and let every worry from the day drift away like dandelion seeds upon the wind. In this quiet sanctuary, you and your little one are completely cradled in serenity, love, and protection.',
      'Rest your eyes now. Tomorrow will bring its own warmth, but tonight belongs only to peace.'
    ]
  },
  {
    id: 'cloud-lullaby',
    title: 'The Little Cloud’s Lullaby',
    author: 'Serene Nighttime Stories',
    readingTime: '3 mins read',
    icon: '☁️',
    content: [
      'High in the twilight sky, a small, pillowy cloud named Lumina floated gracefully above the sleepy hills. She was as soft as spun cotton and carried a quiet secret.',
      'Whenever the world below grew still, Lumina would gently weave blankets of cool, soothing mist to tuck in the tall pine trees, the sleepy deer, and the quiet rivers.',
      'Tonight, Lumina looked down and saw an expectant mother resting peacefully. She hovered softly above, humming a silent lullaby that resonated with gentle waves of comfort.',
      '“Grow strong, little one,” she whispered into the soft breeze. “Your mother is your sky, your sanctuary, and your shelter. In her warmth, you are safe.”',
      'The moon smiled warmly from behind the veil of stars, blanketing mother and baby in a calm, dreamy embrace.'
    ]
  },
  {
    id: 'letter-from-tomorrow',
    title: 'A Letter from Tomorrow',
    author: 'Heartfelt Keepsake',
    readingTime: '3 mins read',
    icon: '💌',
    content: [
      'Dear Mom, even before I open my eyes to see the world, I already know your voice. It is the very first song I ever heard, and it makes my entire world feel safe.',
      'I feel the gentle rhythm of your breathing when you rest. I feel your hand resting gently on your belly, and I know that I am already deeply loved beyond measure.',
      'Thank you for carrying me through each day, for nourishing me, for pausing to take care of yourself, and for dreaming of our days ahead.',
      'Tonight, let yourself rest without worry. You are doing an extraordinary thing, and you are already the most wonderful mother in the universe.',
      'Sweet dreams, Mom. I cannot wait to meet you.'
    ]
  }
];

const StoriesSection = () => {
  const [selectedStory, setSelectedStory] = useState(STORIES[0]);
  const [fontSize, setFontSize] = useState(1.05); // rem
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    // Stop speech if switching stories or unmounting
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [selectedStory]);

  const handleSpeechToggle = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in your browser.');
      return;
    }

    const synth = window.speechSynthesis;

    if (isSpeaking && !isPaused) {
      synth.pause();
      setIsPaused(true);
    } else if (isSpeaking && isPaused) {
      synth.resume();
      setIsPaused(false);
    } else {
      synth.cancel();
      const textToRead = `${selectedStory.title}. By ${selectedStory.author}. ${selectedStory.content.join(' ')}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 0.88; // Gentle, slower bedtime pace
      utterance.pitch = 1.0;

      // Select warm natural voice if available
      const voices = synth.getVoices();
      const femaleVoice = voices.find(
        (v) => v.lang.startsWith('en') && (v.name.includes('Samantha') || v.name.includes('Natural') || v.name.includes('Female') || v.name.includes('Google UK English Female') || v.name.includes('Zira'))
      );
      if (femaleVoice) utterance.voice = femaleVoice;

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };

      synth.speak(utterance);
      setIsSpeaking(true);
      setIsPaused(false);
    }
  };

  const handleStopSpeech = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
  };

  return (
    <div className="section-interactive-view">
      <div className="section-view-header">
        <div className="section-title-wrap">
          <span className="section-pill-tag">Smooth Stories & Bonding</span>
          <h2 className="section-main-heading">📖 Bedtime & Bonding Stories</h2>
          <p className="section-main-sub">Gentle, soothing stories crafted to relax your mind and foster deep maternal connection.</p>
        </div>
      </div>

      <div className="stories-container-layout">
        {/* Story Selector List */}
        <div className="stories-selector-card">
          <h4 className="stories-list-heading">Choose a Story</h4>
          <div className="stories-tab-list">
            {STORIES.map((story) => {
              const isSelected = selectedStory.id === story.id;
              return (
                <button
                  key={story.id}
                  className={`story-tab-btn ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedStory(story)}
                >
                  <span className="story-tab-icon">{story.icon}</span>
                  <div className="story-tab-info">
                    <span className="story-tab-title">{story.title}</span>
                    <span className="story-tab-time">{story.readingTime}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Reader View */}
        <div className="story-reader-card">
          <div className="reader-top-bar">
            <div>
              <span className="reader-story-time">{selectedStory.readingTime}</span>
              <h3 className="reader-story-title">{selectedStory.title}</h3>
              <span className="reader-author">{selectedStory.author}</span>
            </div>

            {/* Reading Controls */}
            <div className="reader-controls-wrap">
              {/* Font Size Adjust */}
              <div className="font-adjust-row">
                <button
                  className="font-btn"
                  onClick={() => setFontSize((f) => Math.max(0.9, f - 0.1))}
                  title="Smaller text"
                >
                  A-
                </button>
                <button
                  className="font-btn"
                  onClick={() => setFontSize((f) => Math.min(1.4, f + 0.1))}
                  title="Larger text"
                >
                  A+
                </button>
              </div>

              {/* Read Aloud Button */}
              <button
                className={`read-aloud-btn ${isSpeaking && !isPaused ? 'active' : ''}`}
                onClick={handleSpeechToggle}
              >
                {isSpeaking && !isPaused ? '⏸ Pause Voice' : isPaused ? '▶ Resume Voice' : '🔊 Listen Aloud'}
              </button>

              {isSpeaking && (
                <button className="read-stop-btn" onClick={handleStopSpeech}>
                  ⏹ Stop
                </button>
              )}
            </div>
          </div>

          <article
            className="story-body-content"
            style={{ fontSize: `${fontSize}rem` }}
          >
            {selectedStory.content.map((paragraph, idx) => (
              <p key={idx} className="story-paragraph">
                {paragraph}
              </p>
            ))}
          </article>

          <div className="story-reader-footer">
            <span>🌸 Rest easy, mama. Both of you are held in love.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoriesSection;
