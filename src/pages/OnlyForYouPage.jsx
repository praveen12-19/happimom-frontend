import React from 'react';
import FloatingChatButton from '../components/FloatingChatButton';
import EmergencyContactModal from '../components/EmergencyContactModal';
import './OnlyForYouPage.css';

const OnlyForYouPage = () => {
  const selfCareTips = [
    {
      icon: '🧘‍♀️',
      title: 'Prenatal Yoga & Gentle Stretching',
      time: '15 mins',
      desc: 'Gentle hip-openers and shoulder rolls to relieve lower back tension as your bump starts expanding.'
    },
    {
      icon: '🥑',
      title: 'Hydrating & Nutrient Power Bowls',
      time: 'Healthy Snack',
      desc: 'Avocado, chia seeds, walnuts, and Greek yogurt for optimal brain-boosting omega-3s and calcium.'
    },
    {
      icon: '🛁',
      title: 'Warm Bath & Soothing Music',
      time: 'Evening Ritual',
      desc: 'Unwind with magnesium salts (warm, not hot) and a calming pregnancy meditation audio session.'
    },
    {
      icon: '📖',
      title: 'Baby Bonding Journaling',
      time: '5 mins',
      desc: 'Write down a sweet thought or memory from Week 14 to treasure as your keepsake.'
    }
  ];

  return (
    <main className="only-for-u-container">
      <div className="only-for-u-content">
        {/* Banner */}
        <section className="u-greeting-banner">
          <span className="u-tag">Mother Care & Wellness</span>
          <h1 className="u-title">Only for U, Mom! 🌸</h1>
          <p className="u-subtitle">Curated self-care, nutrition tips, and mindfulness tailored just for you</p>
        </section>

        {/* Affirmation Card */}
        <div className="affirmation-card">
          <div className="affirmation-icon">✨</div>
          <div className="affirmation-text">
            <h3>Today’s Affirmation</h3>
            <p>“My body is creating life with incredible grace. I honor my feelings, rest when I need, and trust the process.”</p>
          </div>
        </div>

        {/* Self Care Grid */}
        <div className="self-care-grid">
          {selfCareTips.map((tip, idx) => (
            <div key={idx} className="self-care-card">
              <div className="care-card-header">
                <span className="care-card-icon">{tip.icon}</span>
                <span className="care-card-time">{tip.time}</span>
              </div>
              <h3 className="care-card-title">{tip.title}</h3>
              <p className="care-card-desc">{tip.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <FloatingChatButton />
      <EmergencyContactModal />
    </main>
  );
};

export default OnlyForYouPage;
