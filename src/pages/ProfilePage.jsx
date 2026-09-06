import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTracker } from '../context/TrackerContext';
import { getUserProfile, updateUserProfile } from '../api/authApi';
import FloatingChatButton from '../components/FloatingChatButton';
import EmergencyContactModal from '../components/EmergencyContactModal';
import './ProfilePage.css';

const formatDateDMY = (dateStr) => {
  if (!dateStr) return '';
  const str = String(dateStr).trim();
  const ymdMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    const [, year, month, day] = ymdMatch;
    return `${day}-${month}-${year}`;
  }
  if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
    return str;
  }
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }
  return str;
};

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
    mobileNumber: '',
    address: '',
    hasChildren: 'no',
    childrenCount: 1,
    husbandName: '',
    husbandContact: '',
    parentName: '',
    parentContact: '',
    emergencyDoctor: '',
    doctorPhone: '',
    doctorAddress: '',
    pregnancyDate: '',
    bloodGroup: '',
    medicalConditions: '',
    allergies: '',
    city: ''
  });

  const [childrenList, setChildrenList] = useState([]);

  useEffect(() => {
    if (!user) {
      openAuthModal('/profile');
      navigate('/calendar', { replace: true });
      return;
    }

    const parseChildren = (input) => {
      if (!input) return [];
      if (typeof input === 'object' && !Array.isArray(input)) {
        if (Array.isArray(input.children) && input.children.length > 0) {
          return input.children;
        }
        if (input.childrenDetails) {
          return parseChildren(input.childrenDetails);
        }
        return [];
      }
      if (Array.isArray(input)) return input;
      try {
        const parsed = typeof input === 'string' ? JSON.parse(input) : input;
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    };

    // Populate initial form values from user
    const savedName = (user.name && user.name !== user.email?.split('@')[0]) ? user.name : (user.profileComplete ? user.name || '' : '');
    const userChildren = parseChildren(user);
    const userHasChildren = user.hasChildren ? 'yes' : (user.childrenCount > 0 || userChildren.length > 0 ? 'yes' : 'no');

    setFormData({
      name: savedName,
      age: user.age || '',
      dob: user.dob || user.motherDetails?.dob || '',
      mobileNumber: user.mobileNumber || user.motherDetails?.mobileNumber || '',
      address: user.address || user.motherDetails?.address || '',
      hasChildren: userHasChildren,
      childrenCount: user.childrenCount || (userChildren.length > 0 ? userChildren.length : 1),
      husbandName: user.husbandName || user.partnerDetails?.partnerName || user.partnerName || '',
      husbandContact: user.husbandContact || user.partnerDetails?.partnerContact || user.partnerContact || '',
      parentName: user.parentName || user.parentDetails?.parentName || '',
      parentContact: user.parentContact || user.parentDetails?.parentContact || '',
      emergencyDoctor: user.doctorClinicSupport?.doctorName || user.emergencyContact || '',
      doctorPhone: user.doctorClinicSupport?.doctorPhone || user.doctorPhone || '',
      doctorAddress: user.doctorClinicSupport?.doctorAddress || user.doctorAddress || '',
      pregnancyDate: user.pregnancyDate || user.pregnancyTimeline?.pregnancyDate || '',
      bloodGroup: user.bloodGroup || user.motherDetails?.bloodGroup || '',
      medicalConditions: user.medicalConditions || user.pregnancyTimeline?.medicalConditions || '',
      allergies: user.allergies || user.pregnancyTimeline?.allergies || '',
      city: user.city || user.motherDetails?.city || ''
    });
    setChildrenList(userChildren);

    // Refresh from backend if id is available
    if (user.id) {
      getUserProfile(user.id)
        .then((profile) => {
          if (profile) {
            updateUser(profile);
            const profChildren = parseChildren(profile);
            const profHasChildren = profile.hasChildren ? 'yes' : (profile.childrenCount > 0 || profChildren.length > 0 ? 'yes' : 'no');
            setFormData({
              name: profile.name || '',
              age: profile.age || '',
              dob: profile.dob || profile.motherDetails?.dob || '',
              mobileNumber: profile.mobileNumber || profile.motherDetails?.mobileNumber || '',
              address: profile.address || profile.motherDetails?.address || '',
              hasChildren: profHasChildren,
              childrenCount: profile.childrenCount || (profChildren.length > 0 ? profChildren.length : 1),
              husbandName: profile.husbandName || profile.partnerDetails?.partnerName || profile.partnerName || '',
              husbandContact: profile.husbandContact || profile.partnerDetails?.partnerContact || profile.partnerContact || '',
              parentName: profile.parentName || profile.parentDetails?.parentName || '',
              parentContact: profile.parentContact || profile.parentDetails?.parentContact || '',
              emergencyDoctor: profile.doctorClinicSupport?.doctorName || profile.emergencyContact || '',
              doctorPhone: profile.doctorClinicSupport?.doctorPhone || profile.doctorPhone || '',
              doctorAddress: profile.doctorClinicSupport?.doctorAddress || profile.doctorAddress || '',
              pregnancyDate: profile.pregnancyDate || profile.pregnancyTimeline?.pregnancyDate || '',
              bloodGroup: profile.bloodGroup || profile.motherDetails?.bloodGroup || '',
              medicalConditions: profile.medicalConditions || profile.pregnancyTimeline?.medicalConditions || '',
              allergies: profile.allergies || profile.pregnancyTimeline?.allergies || '',
              city: profile.city || profile.motherDetails?.city || ''
            });
            setChildrenList(profChildren);
          }
        })
        .catch((err) => console.log('Could not fetch latest profile:', err.message));
    }
  }, [user?.id]);

  // Lock background scrolling when edit modal is active
  useEffect(() => {
    if (isEditModalOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isEditModalOpen]);

  if (!user) {
    return null;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'husbandContact' || name === 'mobileNumber' || name === 'parentContact' || name === 'doctorPhone') {
      const numeric = value.replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: numeric }));
      return;
    }
    if (name === 'hasChildren') {
      setFormData((prev) => ({ ...prev, hasChildren: value }));
      if (value === 'yes' && childrenList.length === 0) {
        setChildrenList([{ name: '', age: '', dob: '', gender: '' }]);
      }
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleChildrenCountChange = (val) => {
    const count = Math.max(1, Math.min(10, parseInt(val, 10) || 1));
    setFormData((prev) => ({ ...prev, childrenCount: count }));
    setChildrenList((prev) => {
      const updated = [...prev];
      while (updated.length < count) {
        updated.push({ name: '', age: '', dob: '', gender: '' });
      }
      return updated.slice(0, count);
    });
  };

  const todayDate = new Date().toISOString().split('T')[0];

  const handleChildChange = (index, field, value) => {
    if (field === 'dob' && value && value > todayDate) {
      setErrorMsg(`Date of birth for Baby #${index + 1} cannot be in the future.`);
      return;
    }
    setErrorMsg('');
    setChildrenList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user.id) return;

    if (formData.mobileNumber && formData.mobileNumber.length !== 10) {
      setErrorMsg("Mother's mobile number must be exactly 10 digits.");
      return;
    }

    if (formData.husbandContact && formData.husbandContact.length !== 10) {
      setErrorMsg('Partner contact number must be exactly 10 digits.');
      return;
    }

    if (formData.parentContact && formData.parentContact.length !== 10) {
      setErrorMsg("Parent's contact number must be exactly 10 digits.");
      return;
    }

    if (formData.doctorPhone && formData.doctorPhone.length !== 10) {
      setErrorMsg("Doctor/Clinic phone number must be exactly 10 digits.");
      return;
    }

    if (formData.hasChildren === 'yes') {
      for (let i = 0; i < childrenList.length; i++) {
        if (childrenList[i].dob && childrenList[i].dob > todayDate) {
          setErrorMsg(`Date of birth for Baby #${i + 1} cannot be in the future.`);
          return;
        }
      }
    }

    // Instant Optimistic Update: Reflect changes immediately without waiting
    const updatedLocal = {
      ...user,
      ...formData,
      age: formData.age ? parseInt(formData.age, 10) : null,
      hasChildren: formData.hasChildren === 'yes',
      childrenCount: formData.hasChildren === 'yes' ? parseInt(formData.childrenCount, 10) : 0,
      childrenDetails: formData.hasChildren === 'yes' ? JSON.stringify(childrenList) : null,
      children: formData.hasChildren === 'yes' ? childrenList : [],
      emergencyContact: formData.emergencyDoctor || null,
      doctorPhone: formData.doctorPhone || null,
      doctorAddress: formData.doctorAddress || null,
      partnerDetails: {
        partnerName: formData.husbandName,
        partnerContact: formData.husbandContact
      },
      parentDetails: {
        parentName: formData.parentName,
        parentContact: formData.parentContact
      },
      doctorClinicSupport: {
        doctorName: formData.emergencyDoctor,
        doctorPhone: formData.doctorPhone,
        doctorAddress: formData.doctorAddress
      },
      motherDetails: {
        dob: formData.dob,
        mobileNumber: formData.mobileNumber,
        bloodGroup: formData.bloodGroup,
        city: formData.city,
        address: formData.address,
        hasChildren: formData.hasChildren === 'yes',
        childrenCount: formData.hasChildren === 'yes' ? parseInt(formData.childrenCount, 10) : 0
      },
      pregnancyTimeline: {
        pregnancyDate: formData.pregnancyDate,
        medicalConditions: formData.medicalConditions,
        allergies: formData.allergies
      }
    };

    updateUser(updatedLocal);
    setIsEditModalOpen(false);

    // Persist to MySQL in the background without blocking the UI
    if (user?.id) {
      updateUserProfile(user.id, {
        ...formData,
        age: formData.age ? parseInt(formData.age, 10) : null,
        hasChildren: formData.hasChildren === 'yes',
        childrenCount: formData.hasChildren === 'yes' ? parseInt(formData.childrenCount, 10) : 0,
        childrenDetails: formData.hasChildren === 'yes' ? JSON.stringify(childrenList) : null,
        emergencyContact: formData.emergencyDoctor || null,
        doctorPhone: formData.doctorPhone || null,
        doctorAddress: formData.doctorAddress || null
      })
        .then((updated) => {
          updateUser(updated);
        })
        .catch((err) => {
          console.error('Failed to sync profile to database:', err);
        });
    }
  };

  const displayName = user.name || user.email?.split('@')[0] || 'Expecting Mom';

  const partnerName = formData.husbandName || user?.husbandName || user?.partnerDetails?.partnerName || user?.partnerName || '';
  const partnerPhone = formData.husbandContact || user?.husbandContact || user?.partnerDetails?.partnerContact || user?.partnerContact || '';

  const parentName = formData.parentName || user?.parentName || user?.parentDetails?.parentName || '';
  const parentPhone = formData.parentContact || user?.parentContact || user?.parentDetails?.parentContact || '';

  const doctorName = formData.emergencyDoctor || user?.doctorClinicSupport?.doctorName || user?.emergencyContact || '';
  const doctorPhone = formData.doctorPhone || user?.doctorClinicSupport?.doctorPhone || user?.doctorPhone || '';
  const doctorAddress = formData.doctorAddress || user?.doctorClinicSupport?.doctorAddress || user?.doctorAddress || '';

  const hasAnyEmergencyContact = Boolean(partnerName || partnerPhone || parentName || parentPhone || doctorName || doctorPhone);

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
              <span className="detail-label">Mother's Mobile:</span>
              <span className="detail-value">{formData.mobileNumber || 'Not specified'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Address:</span>
              <span className="detail-value">{formData.address || 'Not specified'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Having Children:</span>
              <span className="detail-value">{formData.hasChildren === 'yes' ? `Yes (${formData.childrenCount || childrenList.length})` : 'No'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Blood Group:</span>
              <span className="detail-value">{formData.bloodGroup || 'Not specified'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Age:</span>
              <span className="detail-value">{formData.age ? `${formData.age} yrs` : 'Not specified'}</span>
            </div>
            {formData.dob && (
              <div className="detail-item">
                <span className="detail-label">Mother's DOB:</span>
                <span className="detail-value">{formatDateDMY(formData.dob)}</span>
              </div>
            )}
            <div className="detail-item">
              <span className="detail-label">Partner:</span>
              <span className="detail-value">{partnerName || 'Not specified'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Partner Contact:</span>
              <span className="detail-value">{partnerPhone || 'Not specified'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Parent:</span>
              <span className="detail-value">{parentName || 'Not specified'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Parent Contact:</span>
              <span className="detail-value">{parentPhone || 'Not specified'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">City:</span>
              <span className="detail-value">{formData.city || 'Not specified'}</span>
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

          {formData.hasChildren === 'yes' && childrenList.length > 0 && (
            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px dashed #ffd1dc' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#831843', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                👶 Children
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                {childrenList.map((child, idx) => {
                  const ordinals = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];
                  const childTitle = `${ordinals[idx] || `#${idx + 1}`} Child`;
                  return (
                    <div key={idx} style={{ background: '#fff0f5', border: '1px solid #ffd1dc', borderRadius: '12px', padding: '0.75rem 0.9rem' }}>
                      <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#be185d', marginBottom: '0.45rem' }}>
                        {childTitle}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: '1.6' }}>
                        <div>Name : <strong>{child.name || '—'}</strong></div>
                        <div>Age : <strong>{child.age || '—'}</strong></div>
                        {child.dob && <div>DOB : <strong>{formatDateDMY(child.dob)}</strong></div>}
                        {child.gender && <div>Gender : <strong>{child.gender}</strong></div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Emergency Contact Section */}
        <div className="profile-emergency-widget">
          <div className="widget-header">
            <div className="widget-title-group">
              <span className="widget-icon">🚨</span>
              <div>
                <h3 className="widget-title">Emergency Contact Details</h3>
                <p className="widget-subtitle">Immediate family and medical support contacts</p>
              </div>
            </div>
            <button
              className="widget-edit-btn"
              onClick={() => setIsEmergencyModalOpen(true)}
            >
              ✏️ Manage Contacts
            </button>
          </div>

          <div className="emergency-contacts-grid">
            {/* 1. Partner */}
            <div className="emergency-contact-box">
              <div className="contact-box-header">
                <span className="contact-box-title">💍 Partner</span>
                {partnerPhone && (
                  <a href={`tel:${partnerPhone}`} className="contact-call-link">
                    <span>📞</span> Call
                  </a>
                )}
              </div>
              <div className="contact-box-body">
                <div className="contact-person-name">{partnerName || 'Not specified'}</div>
                <div className="contact-person-phone">
                  {partnerPhone ? (
                    <a href={`tel:${partnerPhone}`} className="phone-link">
                      📞 {partnerPhone}
                    </a>
                  ) : (
                    <span className="phone-empty">Not added yet</span>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Parent */}
            <div className="emergency-contact-box">
              <div className="contact-box-header">
                <span className="contact-box-title">👨‍👩‍👧 Parent</span>
                {parentPhone && (
                  <a href={`tel:${parentPhone}`} className="contact-call-link">
                    <span>📞</span> Call
                  </a>
                )}
              </div>
              <div className="contact-box-body">
                <div className="contact-person-name">{parentName || 'Not specified'}</div>
                <div className="contact-person-phone">
                  {parentPhone ? (
                    <a href={`tel:${parentPhone}`} className="phone-link">
                      📞 {parentPhone}
                    </a>
                  ) : (
                    <span className="phone-empty">Not added yet</span>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Primary Doctor / Clinic */}
            <div className="emergency-contact-box">
              <div className="contact-box-header">
                <span className="contact-box-title">🩺 Doctor / Clinic</span>
                {doctorPhone && (
                  <a href={`tel:${doctorPhone}`} className="contact-call-link">
                    <span>📞</span> Call
                  </a>
                )}
              </div>
              <div className="contact-box-body">
                <div className="contact-person-name">{doctorName || 'Not specified'}</div>
                <div className="contact-person-phone">
                  {doctorPhone ? (
                    <a href={`tel:${doctorPhone}`} className="phone-link">
                      📞 {doctorPhone}
                    </a>
                  ) : (
                    <span className="phone-empty">Not added yet</span>
                  )}
                </div>
                {doctorAddress && (
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.35rem' }}>
                    📍 {doctorAddress}
                  </div>
                )}
              </div>
            </div>
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
                  />
                </div>
                <div className="form-group">
                  <label>Age</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div className="form-group">
                  <label>Mother's Date of Birth</label>
                  <input
                    type="date"
                    name="dob"
                    max={todayDate}
                    value={formData.dob}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Pregnancy Confirmation Date</label>
                  <input
                    type="date"
                    name="pregnancyDate"
                    max={todayDate}
                    value={formData.pregnancyDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div className="form-group">
                  <label>Partner's Name</label>
                  <input
                    type="text"
                    name="husbandName"
                    value={formData.husbandName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Partner Contact</label>
                  <input
                    type="tel"
                    name="husbandContact"
                    value={formData.husbandContact}
                    onChange={handleInputChange}
                    maxLength={10}
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div className="form-group">
                  <label>Parent's Name</label>
                  <input
                    type="text"
                    name="parentName"
                    value={formData.parentName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Parent Contact</label>
                  <input
                    type="tel"
                    name="parentContact"
                    value={formData.parentContact}
                    onChange={handleInputChange}
                    maxLength={10}
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div className="form-group">
                  <label>Mother's Mobile</label>
                  <input
                    type="tel"
                    name="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={handleInputChange}
                    maxLength={10}
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                  />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
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
                  />
                </div>
                <div className="form-group">
                  <label>Having Children?</label>
                  <select
                    name="hasChildren"
                    value={formData.hasChildren}
                    onChange={handleInputChange}
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
              </div>

              {formData.hasChildren === 'yes' && (
                <div className="form-group">
                  <label>Count of Children</label>
                  <select
                    name="childrenCount"
                    value={formData.childrenCount}
                    onChange={(e) => handleChildrenCountChange(e.target.value)}
                  >
                    <option value="1">1 Child</option>
                    <option value="2">2 Children</option>
                    <option value="3">3 Children</option>
                    <option value="4">4 Children</option>
                    <option value="5">5 Children</option>
                  </select>
                </div>
              )}

              {formData.hasChildren === 'yes' && (
                <div style={{ background: '#fff0f5', padding: '0.85rem', borderRadius: '12px', border: '1px solid #fbcfe8', marginBottom: '0.75rem' }}>
                  <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#be185d', marginBottom: '0.6rem' }}>
                    👶 Children ({formData.childrenCount})
                  </div>
                  {childrenList.map((child, idx) => {
                    const ordinals = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];
                    return (
                      <div key={idx} style={{ background: '#ffffff', border: '1.5px solid #fbcfe8', borderRadius: '12px', padding: '0.9rem', marginBottom: '0.75rem' }}>
                        <div style={{ fontSize: '0.86rem', fontWeight: '700', color: '#be185d', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          👶 {ordinals[idx] || `#${idx + 1}`} Child
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.65rem' }}>
                          <div className="form-group">
                            <label>Name</label>
                            <input
                              type="text"
                              value={child.name}
                              onChange={(e) => handleChildChange(idx, 'name', e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label>Age</label>
                            <input
                              type="text"
                              value={child.age}
                              onChange={(e) => handleChildChange(idx, 'age', e.target.value)}
                            />
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                          <div className="form-group">
                            <label>Date of Birth</label>
                            <input
                              type="date"
                              max={todayDate}
                              value={child.dob}
                              onChange={(e) => handleChildChange(idx, 'dob', e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label>Gender</label>
                            <select
                              value={child.gender}
                              onChange={(e) => handleChildChange(idx, 'gender', e.target.value)}
                            >
                              <option value="">Select Gender</option>
                              <option value="Boy">Boy 👦</option>
                              <option value="Girl">Girl 👧</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div className="form-group">
                  <label>Primary Doctor / Clinic</label>
                  <input
                    type="text"
                    name="emergencyDoctor"
                    value={formData.emergencyDoctor}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Doctor's Phone</label>
                  <input
                    type="tel"
                    name="doctorPhone"
                    value={formData.doctorPhone}
                    onChange={handleInputChange}
                    maxLength={10}
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Doctor / Clinic Address</label>
                <input
                  type="text"
                  name="doctorAddress"
                  value={formData.doctorAddress}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Medical Conditions (if any)</label>
                <input
                  type="text"
                  name="medicalConditions"
                  value={formData.medicalConditions}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Allergies</label>
                <input
                  type="text"
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleInputChange}
                />
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? 'Saving...' : 'Save'}
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
