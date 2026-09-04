import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTracker } from '../context/TrackerContext';
import { updateUserProfile } from '../api/authApi';
import '../css/OnboardingModal.css';

const OnboardingModal = () => {
  const {
    user,
    updateUser,
    isOnboardingModalOpen,
    closeOnboardingModal,
    onboardingDestination,
    updateEmergencyContact,
    emergencyContact
  } = useTracker();

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    dob: '',
    city: '',
    pregnancyDate: '',
    bloodGroup: '',
    husbandName: '',
    husbandContact: '',
    emergencyDoctor: '',
    medicalConditions: '',
    allergies: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Pre-fill values only if already saved by user; do NOT default to email or O+
  useEffect(() => {
    if (isOnboardingModalOpen && user) {
      // Only show name if user has explicitly saved a name (not an email prefix fallback)
      const savedName = (user.name && user.name !== user.email?.split('@')[0]) ? user.name : '';
      setFormData({
        name: user.profileComplete ? savedName : '',
        age: user.age ? String(user.age) : '',
        dob: user.dob || '',
        city: user.city || '',
        pregnancyDate: user.pregnancyDate || '',
        bloodGroup: user.bloodGroup || '',
        husbandName: user.husbandName || '',
        husbandContact: user.husbandContact || '',
        emergencyDoctor: user.emergencyContact || emergencyContact?.name || '',
        medicalConditions: user.medicalConditions || '',
        allergies: user.allergies || ''
      });
      setError('');
      setSuccess(false);
    }
  }, [isOnboardingModalOpen, user]);

  if (!isOnboardingModalOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'husbandContact') {
      const numeric = value.replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: numeric }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSkip = () => {
    // User chooses to skip onboarding for now
    closeOnboardingModal();
    if (onboardingDestination) {
      navigate(onboardingDestination);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Please provide your name so we can personalize your experience.');
      return;
    }

    if (formData.husbandContact && formData.husbandContact.length !== 10) {
      setError('Contact number must be exactly 10 digits.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        age: formData.age ? parseInt(formData.age, 10) : null,
        dob: formData.dob || null,
        city: formData.city.trim() || null,
        pregnancyDate: formData.pregnancyDate || null,
        bloodGroup: formData.bloodGroup || null,
        husbandName: formData.husbandName.trim() || null,
        husbandContact: formData.husbandContact.trim() || null,
        emergencyContact: formData.emergencyDoctor.trim() || null,
        medicalConditions: formData.medicalConditions.trim() || null,
        allergies: formData.allergies.trim() || null
      };

      if (user?.id) {
        // Persist to MySQL database via Spring Boot backend
        const updatedUser = await updateUserProfile(user.id, payload);
        updateUser({
          ...updatedUser,
          profileComplete: true
        });
      } else {
        // Fallback local update if running without backend user id
        updateUser({
          ...payload,
          profileComplete: true
        });
      }

      // If emergency doctor or partner is provided, update emergency contact state
      if (formData.husbandName || formData.emergencyDoctor) {
        updateEmergencyContact({
          name: formData.emergencyDoctor || emergencyContact?.name || '',
          phone: emergencyContact?.phone || '',
          relationship: emergencyContact?.relationship || 'Primary Support',
          hospital: emergencyContact?.hospital || '',
          secondaryName: formData.husbandName || emergencyContact?.secondaryName || '',
          secondaryPhone: formData.husbandContact || emergencyContact?.secondaryPhone || '',
          secondaryRelationship: 'Partner / Spouse'
        });
      }

      setSuccess(true);
      setTimeout(() => {
        closeOnboardingModal();
        if (onboardingDestination) {
          navigate(onboardingDestination);
        } else {
          navigate('/calendar');
        }
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to save your details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="true">
      <div className="onboarding-modal-card">
        {/* Floating Heart Decorations */}
        <div className="onboarding-deco-bubble deco-1">🌸</div>
        <div className="onboarding-deco-bubble deco-2">✨</div>

        {/* Header */}
        <div className="onboarding-header">
          <div className="onboarding-badge-pill">
            <span className="badge-sparkle">💖</span> Quick Profile Setup
          </div>
          <h2 className="onboarding-title">Welcome to HappiMoM!</h2>
          <p className="onboarding-subtitle">
            Before entering into HappiMoM, fill these details for a better experience
          </p>
        </div>

        {/* Alerts */}
        {error && <div className="onboarding-alert error">{error}</div>}
        {success && (
          <div className="onboarding-alert success">
            🎉 Wonderful! Your details are saved. Entering HappiMoM now...
          </div>
        )}

        <form onSubmit={handleSubmit} className="onboarding-form" autoComplete="off">
          <div className="onboarding-sections-grid">
            {/* Section 1: About Mom */}
            <div className="onboarding-card-section">
              <div className="section-title-wrap">
                <span className="section-icon">👩‍🍼</span>
                <div>
                  <h3 className="section-title">Mother's Details</h3>
                  <p className="section-desc">Help us address you properly</p>
                </div>
              </div>

              <div className="onboarding-fields-two-col">
                <div className="field-group">
                  <label htmlFor="ob-name">
                    Full Name <span className="req-star">*</span>
                  </label>
                  <input
                    id="ob-name"
                    type="text"
                    name="name"
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="ob-age">Age (Years)</label>
                  <input
                    id="ob-age"
                    type="number"
                    name="age"
                    placeholder="Enter age"
                    min="16"
                    max="65"
                    value={formData.age}
                    onChange={handleChange}
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="ob-blood">Blood Group</label>
                  <select
                    id="ob-blood"
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleChange}
                  >
                    <option value="">Select</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div className="field-group">
                  <label htmlFor="ob-city">City / Location</label>
                  <input
                    id="ob-city"
                    type="text"
                    name="city"
                    placeholder="Enter city"
                    value={formData.city}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Pregnancy & Due Date */}
            <div className="onboarding-card-section">
              <div className="section-title-wrap">
                <span className="section-icon">👶</span>
                <div>
                  <h3 className="section-title">Pregnancy Timeline</h3>
                  <p className="section-desc">Calculates your week & milestones</p>
                </div>
              </div>

              <div className="onboarding-fields-two-col">
                <div className="field-group">
                  <label htmlFor="ob-preg-date">
                    Last Period / Conception Date (LMP)
                  </label>
                  <input
                    id="ob-preg-date"
                    type="date"
                    name="pregnancyDate"
                    value={formData.pregnancyDate}
                    onChange={handleChange}
                  />
                  <span className="field-helper-text">
                    Calculates your weekly growth & due date
                  </span>
                </div>

                <div className="field-group">
                  <label htmlFor="ob-allergies">Known Allergies (Optional)</label>
                  <input
                    id="ob-allergies"
                    type="text"
                    name="allergies"
                    placeholder="Enter known allergies"
                    value={formData.allergies}
                    onChange={handleChange}
                  />
                </div>

                <div className="field-group span-full">
                  <label htmlFor="ob-medical">Medical Notes (Optional)</label>
                  <input
                    id="ob-medical"
                    type="text"
                    name="medicalConditions"
                    placeholder="Enter medical notes"
                    value={formData.medicalConditions}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Partner & Emergency Support */}
            <div className="onboarding-card-section">
              <div className="section-title-wrap">
                <span className="section-icon">🤝</span>
                <div>
                  <h3 className="section-title">Partner & Emergency Support</h3>
                  <p className="section-desc">For quick assistance in critical moments</p>
                </div>
              </div>

              <div className="onboarding-fields-two-col">
                <div className="field-group">
                  <label htmlFor="ob-husband-name">Partner / Husband's Name</label>
                  <input
                    id="ob-husband-name"
                    type="text"
                    name="husbandName"
                    placeholder="Enter partner's name"
                    value={formData.husbandName}
                    onChange={handleChange}
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="ob-husband-phone">Partner's Phone Number (10 Digits)</label>
                  <input
                    id="ob-husband-phone"
                    type="tel"
                    name="husbandContact"
                    placeholder="Enter 10-digit phone number"
                    value={formData.husbandContact}
                    onChange={handleChange}
                    maxLength={10}
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                  />
                </div>

                <div className="field-group span-full">
                  <label htmlFor="ob-doctor">Primary Doctor / Clinic (Optional)</label>
                  <input
                    id="ob-doctor"
                    type="text"
                    name="emergencyDoctor"
                    placeholder="Enter doctor or clinic name"
                    value={formData.emergencyDoctor}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="onboarding-actions-row">
            <button
              type="button"
              className="onboarding-skip-btn"
              onClick={handleSkip}
              disabled={loading}
            >
              Skip for now & explore
            </button>

            <button
              type="submit"
              className="onboarding-submit-btn"
              disabled={loading || success}
            >
              {loading ? (
                <span className="btn-spinner-wrap">
                  <span className="btn-spinner"></span> Saving Details...
                </span>
              ) : success ? (
                'Saved! Welcome to HappiMoM 💖'
              ) : (
                'Save Details & Enter HappiMoM ✨'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OnboardingModal;
