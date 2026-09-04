import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTracker } from '../context/TrackerContext';
import PregnancyProgressCard from '../components/PregnancyProgressCard';
import CalendarView from '../components/CalendarView';
import BabyGrowthCard from '../components/BabyGrowthCard';
import FloatingChatButton from '../components/FloatingChatButton';
import EmergencyContactModal from '../components/EmergencyContactModal';
import './Dashboard.css';

const Dashboard = () => {
  const { user, pregnancy, openAuthModal, openOnboardingModal } = useTracker();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      openAuthModal('/pregnancy');
      navigate('/calendar', { replace: true });
    }
  }, [user, navigate, openAuthModal]);

  if (!user) {
    return null;
  }

  const displayName = user.name || user.email?.split('@')[0] || 'Mom';

  return (
    <main className="dashboard-container">
      <div className="dashboard-content">
        {/* 1. Greeting section (centered, light pink background) */}
        <section className="dashboard-greeting-banner" aria-label="Welcome Greeting">
          <h1 className="greeting-heading">Welcome back, {displayName}! 👋</h1>
          <p className="greeting-subtext">Track your pregnancy journey week by week</p>
        </section>

        {/* Show pregnancy details only after profile completion */}
        {!user.profileComplete || !pregnancy ? (
          <div className="dashboard-incomplete-card">
            <div className="incomplete-card-badge">🌸 Profile Setup Required</div>
            <h2 className="incomplete-card-title">Unlock Your Pregnancy Milestones</h2>
            <p className="incomplete-card-desc">
              Your week-by-week developmental milestones, baby growth size comparison, and estimated due date
              will be displayed here once you enter your pregnancy timeline details.
            </p>
            <button
              type="button"
              className="dashboard-setup-btn"
              onClick={() => openOnboardingModal('/pregnancy')}
            >
              Complete Profile Setup Now ✨
            </button>
          </div>
        ) : (
          <>
            {/* 2. "Pregnancy Progress" summary card (pink-to-blue gradient banner, rounded corners) */}
            <div className="dashboard-section">
              <PregnancyProgressCard />
            </div>

            {/* 3. Weekly calendar view & 4. Baby growth info card */}
            <div className="dashboard-grid-layout">
              {/* Calendar View (white card, rounded) */}
              <div className="dashboard-grid-main">
                <CalendarView />
              </div>

              {/* Baby growth info card */}
              <div className="dashboard-grid-side">
                <BabyGrowthCard />
              </div>
            </div>
          </>
        )}
      </div>

      {/* 5. Floating chat button (bottom-right corner) */}
      <FloatingChatButton />

      {/* Emergency Contact Modal */}
      <EmergencyContactModal />
    </main>
  );
};

export default Dashboard;
