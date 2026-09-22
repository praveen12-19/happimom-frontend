import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import FloatingChatButton from '../components/FloatingChatButton';
import EmergencyContactModal from '../components/EmergencyContactModal';
import YogaSection from '../components/onlyforyou/YogaSection';
import ExerciseSection from '../components/onlyforyou/ExerciseSection';
import StepsSection from '../components/onlyforyou/StepsSection';
import BreathingSection from '../components/onlyforyou/BreathingSection';
import MusicSection from '../components/onlyforyou/MusicSection';
import StoriesSection from '../components/onlyforyou/StoriesSection';
import './OnlyForYouPage.css';

const TOPICS = [
  {
    id: 'movement-fitness',
    title: 'Yoga & Exercise',
    tag: 'Physical Wellness',
    icon: '🌸',
    cards: [
      {
        id: 'yoga',
        title: 'Yoga',
        icon: '🧘‍♀️'
      },
      {
        id: 'exercise',
        title: 'Exercise',
        icon: '🏃‍♀️'
      }
    ]
  },
  {
    id: 'vitality-mindfulness',
    title: 'Steps Tracking & Breathing Practice',
    tag: 'Daily Health & Mind',
    icon: '✨',
    cards: [
      {
        id: 'steps',
        title: 'Steps Tracking',
        icon: '👟'
      },
      {
        id: 'breathing',
        title: 'Breathing Practice',
        icon: '🫁'
      }
    ]
  },
  {
    id: 'calm-sleep',
    title: 'Music (Calm Musics) & Stories (Smooth Stories)',
    tag: 'Relax & Unwind',
    icon: '🌙',
    cards: [
      {
        id: 'music',
        title: 'Music',
        icon: '🎵'
      },
      {
        id: 'stories',
        title: 'Stories',
        icon: '📖'
      }
    ]
  }
];

const OnlyForYouPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSection = searchParams.get('section');

  const openSection = (sectionId) => {
    setSearchParams({ section: sectionId });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeSection = () => {
    setSearchParams({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Scroll to top when section changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeSection]);

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'yoga':
        return <YogaSection />;
      case 'exercise':
        return <ExerciseSection />;
      case 'steps':
        return <StepsSection />;
      case 'breathing':
        return <BreathingSection />;
      case 'music':
        return <MusicSection />;
      case 'stories':
        return <StoriesSection />;
      default:
        return null;
    }
  };

  return (
    <main className="only-for-u-container">
      <div className="only-for-u-content">
        {/* Banner */}
        <section className="u-greeting-banner">
          <span className="u-tag">Mother Care & Wellness</span>
          <h1 className="u-title">Only for U, Mom! 🌸</h1>
          <p className="u-subtitle">
            Curated physical wellness, mindful vitality, and peaceful relaxation tailored just for you.
          </p>
        </section>

        {activeSection ? (
          /* Active Section Detail View */
          <div className="active-section-wrapper">
            <div className="section-top-nav">
              <button className="back-to-topics-btn" onClick={closeSection}>
                ← Back to Only for U Topics
              </button>

              {/* Quick switch between sections */}
              <div className="quick-switch-tabs">
                <button
                  className={`switch-chip ${activeSection === 'yoga' ? 'active' : ''}`}
                  onClick={() => openSection('yoga')}
                >
                  🧘‍♀️ Yoga
                </button>
                <button
                  className={`switch-chip ${activeSection === 'exercise' ? 'active' : ''}`}
                  onClick={() => openSection('exercise')}
                >
                  🏃‍♀️ Exercise
                </button>
                <button
                  className={`switch-chip ${activeSection === 'steps' ? 'active' : ''}`}
                  onClick={() => openSection('steps')}
                >
                  👟 Steps
                </button>
                <button
                  className={`switch-chip ${activeSection === 'breathing' ? 'active' : ''}`}
                  onClick={() => openSection('breathing')}
                >
                  🫁 Breathing
                </button>
                <button
                  className={`switch-chip ${activeSection === 'music' ? 'active' : ''}`}
                  onClick={() => openSection('music')}
                >
                  🎵 Music
                </button>
                <button
                  className={`switch-chip ${activeSection === 'stories' ? 'active' : ''}`}
                  onClick={() => openSection('stories')}
                >
                  📖 Stories
                </button>
              </div>
            </div>

            <div className="section-content-body">
              {renderActiveSection()}
            </div>
          </div>
        ) : (
          /* Topics & Clickable Clean Cards */
          <div className="topics-list-container">
            {TOPICS.map((topic) => (
              <div key={topic.id} className="topic-group-section">
                <div className="topic-header-bar">
                  <span className="topic-badge">
                    <span className="topic-badge-icon">{topic.icon}</span>
                    <span>{topic.tag}</span>
                  </span>
                  <h2 className="topic-title">{topic.title}</h2>
                </div>

                <div className="clickable-cards-grid">
                  {topic.cards.map((card) => (
                    <button
                      key={card.id}
                      className="clean-topic-card"
                      onClick={() => openSection(card.id)}
                      aria-label={`Open ${card.title}`}
                    >
                      <div className="card-icon-center-wrap">
                        <span className="card-emoji-icon">{card.icon}</span>
                      </div>
                      <h3 className="card-clean-title">{card.title}</h3>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <FloatingChatButton />
      <EmergencyContactModal />
    </main>
  );
};

export default OnlyForYouPage;
