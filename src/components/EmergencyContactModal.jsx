import React, { useState, useEffect } from 'react';
import { useTracker } from '../context/TrackerContext';
import { updateUserProfile } from '../api/authApi';
import '../css/EmergencyContactModal.css';

const EmergencyContactModal = () => {
  const { isEmergencyModalOpen, setIsEmergencyModalOpen, user, updateUser } = useTracker();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    husbandName: '',
    husbandContact: '',
    parentName: '',
    parentContact: '',
    doctorName: '',
    doctorPhone: '',
    doctorAddress: ''
  });

  // Sync state whenever modal opens or user updates
  useEffect(() => {
    if (user) {
      setFormData({
        husbandName: user.husbandName || user.partnerDetails?.partnerName || user.partnerName || '',
        husbandContact: user.husbandContact || user.partnerDetails?.partnerContact || user.partnerContact || '',
        parentName: user.parentName || user.parentDetails?.parentName || '',
        parentContact: user.parentContact || user.parentDetails?.parentContact || '',
        doctorName: user.emergencyContact || user.doctorClinicSupport?.doctorName || '',
        doctorPhone: user.doctorPhone || user.doctorClinicSupport?.doctorPhone || '',
        doctorAddress: user.doctorAddress || user.doctorClinicSupport?.doctorAddress || ''
      });
      setErrorMsg('');
      setSavedSuccess(false);
    }
  }, [user, isEmergencyModalOpen]);

  // Close on Escape key and lock body scrolling
  useEffect(() => {
    if (isEmergencyModalOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          setIsEmergencyModalOpen(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = original;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isEmergencyModalOpen, setIsEmergencyModalOpen]);

  if (!isEmergencyModalOpen) return null;

  const partnerName = formData.husbandName || user?.husbandName || user?.partnerDetails?.partnerName || user?.partnerName || '';
  const partnerPhone = formData.husbandContact || user?.husbandContact || user?.partnerDetails?.partnerContact || user?.partnerContact || '';

  const parentName = formData.parentName || user?.parentName || user?.parentDetails?.parentName || '';
  const parentPhone = formData.parentContact || user?.parentContact || user?.parentDetails?.parentContact || '';

  const doctorName = formData.doctorName || user?.emergencyContact || user?.doctorClinicSupport?.doctorName || '';
  const doctorPhone = formData.doctorPhone || user?.doctorPhone || user?.doctorClinicSupport?.doctorPhone || '';
  const doctorAddress = formData.doctorAddress || user?.doctorAddress || user?.doctorClinicSupport?.doctorAddress || '';

  const orderedContacts = [
    {
      id: 'partner',
      role: 'Partner',
      badge: 'Partner',
      badgeClass: 'partner-badge',
      icon: '💍',
      name: partnerName,
      phone: partnerPhone,
      address: null,
      desc: 'Primary Emergency & Personal Contact'
    },
    {
      id: 'parent',
      role: 'Parent',
      badge: 'Parent',
      badgeClass: 'parent-badge',
      icon: '👨‍👩‍👧',
      name: parentName,
      phone: parentPhone,
      address: null,
      desc: 'Family Support & Next of Kin'
    },
    {
      id: 'doctor',
      role: 'Primary Doctor / Clinic',
      badge: 'Doctor / Clinic',
      badgeClass: 'doctor-badge',
      icon: '🩺',
      name: doctorName,
      phone: doctorPhone,
      address: doctorAddress,
      desc: 'Attending Physician & Delivery Clinic'
    }
  ];

  const hasAnyContact = orderedContacts.some((c) => c.name || c.phone);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'husbandContact' || name === 'parentContact' || name === 'doctorPhone') {
      const numeric = value.replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({
        ...prev,
        [name]: numeric
      }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Phone validation
    if (formData.husbandContact && formData.husbandContact.length !== 10) {
      setErrorMsg('Partner contact number must be exactly 10 digits.');
      return;
    }
    if (formData.parentContact && formData.parentContact.length !== 10) {
      setErrorMsg("Parent's contact number must be exactly 10 digits.");
      return;
    }
    if (formData.doctorPhone && formData.doctorPhone.length !== 10) {
      setErrorMsg("Doctor's phone number must be exactly 10 digits.");
      return;
    }

    if (!formData.husbandContact && !formData.parentContact && !formData.doctorPhone) {
      setErrorMsg('Please provide at least one contact phone number.');
      return;
    }

    // Instant Optimistic Update: Reflect changes immediately without waiting
    const updatedLocal = {
      husbandName: formData.husbandName,
      husbandContact: formData.husbandContact,
      parentName: formData.parentName,
      parentContact: formData.parentContact,
      emergencyContact: formData.doctorName,
      doctorPhone: formData.doctorPhone,
      doctorAddress: formData.doctorAddress,
      partnerDetails: {
        partnerName: formData.husbandName,
        partnerContact: formData.husbandContact
      },
      parentDetails: {
        parentName: formData.parentName,
        parentContact: formData.parentContact
      },
      doctorClinicSupport: {
        doctorName: formData.doctorName,
        doctorPhone: formData.doctorPhone,
        doctorAddress: formData.doctorAddress
      }
    };

    updateUser(updatedLocal);
    setIsEditing(false);

    // Persist to MySQL in the background
    if (user?.id) {
      const payload = {
        ...user,
        ...updatedLocal
      };
      updateUserProfile(user.id, payload)
        .then((updated) => {
          updateUser(updated);
        })
        .catch((err) => {
          console.error('Failed to sync emergency contacts to database:', err);
        });
    }
  };

  return (
    <div className="modal-backdrop" onClick={() => setIsEmergencyModalOpen(false)}>
      <div
        className="emergency-modal-dialog"
        style={{ maxWidth: isEditing ? '540px' : '520px' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Modal Header */}
        <div className="emergency-modal-header">
          <div className="header-icon-title">
            <span className="emergency-badge-icon">🚨</span>
            <div>
              <h3 id="modal-title" className="emergency-title">Emergency Contacts</h3>
              <p className="emergency-subtitle">Immediate family and medical support contacts</p>
            </div>
          </div>
          <button
            className="modal-close-btn"
            onClick={() => setIsEmergencyModalOpen(false)}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="emergency-modal-body">
          {savedSuccess && (
            <div className="save-success-alert">
              <span>✅ Emergency contacts saved to database successfully!</span>
            </div>
          )}

          {errorMsg && (
            <div className="auth-alert error-alert" style={{ marginBottom: '1rem' }}>
              <span>{errorMsg}</span>
            </div>
          )}

          {!isEditing ? (
            /* View Mode: Ordered Contacts */
            <div className="view-contact-card">
              {hasAnyContact ? (
                <div className="modal-ordered-contacts-list">
                  {orderedContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className={`modal-contact-row ${contact.phone || contact.name ? 'row-active' : 'row-muted'}`}
                    >
                      <div className="modal-contact-icon-box">
                        <span>{contact.icon}</span>
                      </div>

                      <div className="modal-contact-main">
                        <div className="modal-contact-tag-row">
                          <span className={`modal-priority-pill ${contact.badgeClass}`}>
                            {contact.badge}
                          </span>
                        </div>
                        <h4 className="modal-contact-title">
                          {contact.name || contact.role}
                        </h4>
                        <div className="modal-contact-phone-row">
                          {contact.phone ? (
                            <a href={`tel:${contact.phone}`} className="modal-phone-link">
                              📞 {contact.phone}
                            </a>
                          ) : (
                            <span className="modal-phone-empty">Not added yet</span>
                          )}
                        </div>
                        {contact.address && (
                          <div className="modal-contact-sub">{contact.address}</div>
                        )}
                      </div>

                      {contact.phone && (
                        <a
                          href={`tel:${contact.phone}`}
                          className="modal-row-call-btn"
                          title={`Call ${contact.name || contact.role}`}
                        >
                          <span>📞</span> Call
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-contact-box" style={{ padding: '1.5rem 0' }}>
                  <p className="no-contact-text">No emergency contacts saved yet in database.</p>
                  <button
                    type="button"
                    className="add-inline-contact-btn"
                    onClick={() => setIsEditing(true)}
                  >
                    + Add Partner, Parent & Doctor Contacts
                  </button>
                </div>
              )}

              <div className="modal-actions-bar" style={{ marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="action-edit-btn"
                  onClick={() => setIsEditing(true)}
                  style={{ width: '100%' }}
                >
                  ✏️ Edit / Manage Emergency Contacts
                </button>
              </div>
            </div>
          ) : (
            /* Edit / Update Contact Form */
            <form onSubmit={handleSave} className="contact-edit-form">
              {/* 1. Partner Details */}
              <div className="form-contact-section">
                <div className="section-title-badge">💍 Partner Details</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                  <div className="form-group">
                    <label className="form-label">Partner's Name</label>
                    <input
                      type="text"
                      name="husbandName"
                      className="form-input"
                      value={formData.husbandName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Partner Phone</label>
                    <input
                      type="tel"
                      name="husbandContact"
                      className="form-input"
                      value={formData.husbandContact}
                      onChange={handleInputChange}
                      maxLength={10}
                      inputMode="numeric"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Parent Details */}
              <div className="form-contact-section">
                <div className="section-title-badge">👨‍👩‍👧 Parent Details</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                  <div className="form-group">
                    <label className="form-label">Parent's Name</label>
                    <input
                      type="text"
                      name="parentName"
                      className="form-input"
                      value={formData.parentName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Parent Phone</label>
                    <input
                      type="tel"
                      name="parentContact"
                      className="form-input"
                      value={formData.parentContact}
                      onChange={handleInputChange}
                      maxLength={10}
                      inputMode="numeric"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Doctor Details */}
              <div className="form-contact-section">
                <div className="section-title-badge">🩺 Doctor & Clinic Details</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '0.5rem' }}>
                  <div className="form-group">
                    <label className="form-label">Doctor / Clinic Name</label>
                    <input
                      type="text"
                      name="doctorName"
                      className="form-input"
                      value={formData.doctorName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Doctor Phone</label>
                    <input
                      type="tel"
                      name="doctorPhone"
                      className="form-input"
                      value={formData.doctorPhone}
                      onChange={handleInputChange}
                      maxLength={10}
                      inputMode="numeric"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Hospital / Clinic Address</label>
                  <input
                    type="text"
                    name="doctorAddress"
                    className="form-input"
                    value={formData.doctorAddress}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-buttons-row">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsEditing(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={loading}>
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmergencyContactModal;
