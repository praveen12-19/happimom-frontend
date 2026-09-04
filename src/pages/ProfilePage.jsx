import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTracker } from '../context/TrackerContext';
import { getUserProfile, updateUserProfile } from '../api/authApi';
import FloatingChatButton from '../components/FloatingChatButton';
import EmergencyContactModal from '../components/EmergencyContactModal';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user, updateUser, pregnancy, emergencyContact, setIsEmergencyModalOpen, openAuthModal, openOnboardingModal } = useTracker();
  const navigate = useNavigate();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    dob: '',
    husbandName: '',
    husbandContact: '',
    pregnancyDate: '',
    bloodGroup: '',
    medicalConditions: '',
    allergies: '',
    city: ''
  });

  useEffect(() => {
    if (!user) {
      openAuthModal('/profile');
      navigate('/calendar', { replace: true });
      return;
    }

    // Populate initial form values from user
    const savedName = (user.name && user.name !== user.email?.split('@')[0]) ? user.name : (user.profileComplete ? user.name || '' : '');
    setFormData({
      name: savedName,
      age: user.age || '',
      dob: user.dob || '',
      husbandName: user.husbandName || '',
      husbandContact: user.husbandContact || '',
      pregnancyDate: user.pregnancyDate || '',
      bloodGroup: user.bloodGroup || '',
      medicalConditions: user.medicalConditions || '',
      allergies: user.allergies || '',
      city: user.city || ''
    });

    // Refresh from backend if id is available
    if (user.id) {
      getUserProfile(user.id)
        .then((profile) => {
          if (profile) {
            updateUser(profile);
            setFormData({
              name: profile.name || '',
              age: profile.age || '',
              dob: profile.dob || '',
              husbandName: profile.husbandName || '',
              husbandContact: profile.husbandContact || '',
              pregnancyDate: profile.pregnancyDate || '',
              bloodGroup: profile.bloodGroup || '',
              medicalConditions: profile.medicalConditions || '',
              allergies: profile.allergies || '',
              city: profile.city || ''
            });
          }
        })
        .catch((err) => console.log('Could not fetch latest profile:', err.message));
    }
  }, [user?.id]);

  if (!user) {
    return null;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'husbandContact') {
      const numeric = value.replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: numeric }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user.id) return;

    if (formData.husbandContact && formData.husbandContact.length !== 10) {
      setErrorMsg('Partner contact number must be exactly 10 digits.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const updated = await updateUserProfile(user.id, {
        ...formData,
        age: formData.age ? parseInt(formData.age, 10) : null
      });

      updateUser(updated);
      setSuccessMsg('Profile saved to database successfully!');
      setTimeout(() => {
        setIsEditModalOpen(false);
        setSuccessMsg('');
      }, 1000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const displayName = user.name || user.email?.split('@')[0] || 'Expecting Mom';

  return (
    <main className="profile-page-container">
      <div className="profile-page-content">
        {/* Incomplete profile prompt banner */}
        {!user.profileComplete && (
          <div className="profile-incomplete-banner">
            <div className="incomplete-banner-text">
              <span className="incomplete-icon">🌸</span>
              <div>
                <h4 className="incomplete-title">Complete your HappiMoM Profile</h4>
                <p className="incomplete-desc">Fill in your pregnancy and personal details for a personalized tracking experience.</p>
              </div>
            </div>
            <button
              type="button"
              className="incomplete-action-btn"
              onClick={() => openOnboardingModal('/profile')}
            >
              Fill Details Now ✨
            </button>
          </div>
        )}

        {/* Profile Card */}
        <div className="profile-main-card">
          <div className="profile-hero">
            <div className="profile-pic-container">
              {user?.avatar ? (
                <img src={user.avatar} alt={displayName} className="profile-large-img" />
              ) : (
                <div className="profile-fallback-circle">
                  <span>{displayName.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
            <div className="profile-hero-info">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <h1 className="profile-name">{displayName}</h1>
                <button
                  className="profile-edit-trigger-btn"
                  onClick={() => setIsEditModalOpen(true)}
                  title="Edit details in MySQL database"
                >
                  ✏️ Edit Profile
                </button>
              </div>
              {user.profileComplete && pregnancy ? (
                <span className="profile-badge">Expecting Mom • Week {pregnancy.currentWeek}</span>
              ) : (
                <span className="profile-badge pending">Profile Incomplete</span>
              )}
              <p className="profile-due-date">
                Account: <strong>{user?.email}</strong> {formData.city ? `• ${formData.city}` : ''}
              </p>
              <p className="profile-due-date">
                Estimated Due Date: <strong>{pregnancy?.dueDate || 'Not configured yet'}</strong>
              </p>
            </div>
          </div>

          {/* Only show pregnancy statistics after profile completion */}
          {user.profileComplete && pregnancy ? (
            <div className="profile-stats-row">
              <div className="profile-stat-box">
                <span className="profile-stat-val">{pregnancy.currentWeek} / 40</span>
                <span className="profile-stat-lbl">Weeks Completed</span>
              </div>
              <div className="profile-stat-box">
                <span className="profile-stat-val">{pregnancy.trimester}</span>
                <span className="profile-stat-lbl">Current Trimester</span>
              </div>
              <div className="profile-stat-box">
                <span className="profile-stat-val">{pregnancy.daysLeft}</span>
                <span className="profile-stat-lbl">Days Remaining</span>
              </div>
            </div>
          ) : (
            <div className="profile-stats-pending-box">
              <div className="pending-content">
                <span className="pending-sparkle">✨</span>
                <div>
                  <h4 className="pending-title">Pregnancy Timeline Locked</h4>
                  <p className="pending-desc">Fill in your pregnancy details to unlock your week-by-week progress and baby growth tracking.</p>
                </div>
              </div>
              <button
                type="button"
                className="pending-setup-btn"
                onClick={() => openOnboardingModal('/profile')}
              >
                Complete Profile Setup 🌸
              </button>
            </div>
          )}
        </div>

        {/* Personal & Health Details */}
        <div className="profile-details-card">
          <div className="details-header">
            <h3 className="widget-title">Personal & Medical Details</h3>
          </div>

          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">Partner / Husband:</span>
              <span className="detail-value">{formData.husbandName || 'Not specified'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Partner Contact:</span>
              <span className="detail-value">{formData.husbandContact || 'Not specified'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Blood Group:</span>
              <span className="detail-value">{formData.bloodGroup || 'Not specified'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Age:</span>
              <span className="detail-value">{formData.age ? `${formData.age} yrs` : 'Not specified'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Medical Notes:</span>
              <span className="detail-value">{formData.medicalConditions || 'None reported'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Allergies:</span>
              <span className="detail-value">{formData.allergies || 'None reported'}</span>
            </div>
          </div>
        </div>

        {/* Emergency Contact Quick Widget */}
        <div className="profile-emergency-widget">
          <div className="widget-header">
            <div className="widget-title-group">
              <span className="widget-icon">🚨</span>
              <div>
                <h3 className="widget-title">Emergency Contact Details</h3>
                <p className="widget-subtitle">Primary physician and emergency support</p>
              </div>
            </div>
            <button
              className="widget-edit-btn"
              onClick={() => setIsEmergencyModalOpen(true)}
            >
              {emergencyContact?.name ? '✏️ Manage Contact' : '+ Add Contact'}
            </button>
          </div>

          <div className="widget-details-box">
            {emergencyContact?.name ? (
              <>
                <div className="widget-item">
                  <span className="widget-label">Contact Name:</span>
                  <span className="widget-val">{emergencyContact.name}</span>
                </div>
                <div className="widget-item">
                  <span className="widget-label">Phone:</span>
                  <span className="widget-val">{emergencyContact.phone || 'Not specified'}</span>
                </div>
                <div className="widget-item">
                  <span className="widget-label">Role / Facility:</span>
                  <span className="widget-val">{emergencyContact.hospital || emergencyContact.relationship || 'Primary Support'}</span>
                </div>
              </>
            ) : (
              <div className="no-contact-box">
                <p className="no-contact-text">No emergency contact saved yet.</p>
                <button
                  type="button"
                  className="add-inline-contact-btn"
                  onClick={() => setIsEmergencyModalOpen(true)}
                >
                  + Add Doctor / Partner Contact
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="auth-modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="auth-modal-box" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <button className="auth-modal-close" onClick={() => setIsEditModalOpen(false)}>✕</button>
            <div className="auth-modal-header">
              <div className="auth-icon-badge">📝</div>
              <h2 className="auth-modal-title">Edit Profile Details</h2>
              <p className="auth-modal-subtext">Save details directly to MySQL database</p>
            </div>

            {errorMsg && <div className="auth-alert error-alert">{errorMsg}</div>}
            {successMsg && <div className="auth-alert success-alert">{successMsg}</div>}

            <form onSubmit={handleSaveProfile} className="auth-form">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="form-group">
                  <label>Age</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    placeholder="Enter age"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div className="form-group">
                  <label>Partner / Husband</label>
                  <input
                    type="text"
                    name="husbandName"
                    value={formData.husbandName}
                    onChange={handleInputChange}
                    placeholder="Enter partner's name"
                  />
                </div>
                <div className="form-group">
                  <label>Partner Contact (10 Digits)</label>
                  <input
                    type="tel"
                    name="husbandContact"
                    value={formData.husbandContact}
                    onChange={handleInputChange}
                    placeholder="Enter 10-digit phone number"
                    maxLength={10}
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div className="form-group">
                  <label>Blood Group</label>
                  <input
                    type="text"
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleInputChange}
                    placeholder="Enter blood group"
                  />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Enter city"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Medical Conditions (if any)</label>
                <input
                  type="text"
                  name="medicalConditions"
                  value={formData.medicalConditions}
                  onChange={handleInputChange}
                  placeholder="Enter medical conditions"
                />
              </div>

              <div className="form-group">
                <label>Allergies</label>
                <input
                  type="text"
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleInputChange}
                  placeholder="Enter allergies"
                />
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? 'Saving to Database...' : 'Save to MySQL Database'}
              </button>
            </form>
          </div>
        </div>
      )}

      <FloatingChatButton />
      <EmergencyContactModal />
    </main>
  );
};

export default ProfilePage;
