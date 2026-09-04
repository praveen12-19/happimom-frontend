import React, { useState, useEffect } from 'react';
import { useTracker } from '../context/TrackerContext';
import '../css/EmergencyContactModal.css';

const EmergencyContactModal = () => {
  const { isEmergencyModalOpen, setIsEmergencyModalOpen, emergencyContact, updateEmergencyContact } = useTracker();
  const [isEditing, setIsEditing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    relationship: '',
    hospital: ''
  });

  // Sync state whenever modal opens or contact updates
  useEffect(() => {
    if (emergencyContact) {
      setFormData({
        name: emergencyContact.name || '',
        phone: emergencyContact.phone || '',
        relationship: emergencyContact.relationship || '',
        hospital: emergencyContact.hospital || ''
      });
    }
  }, [emergencyContact, isEmergencyModalOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isEmergencyModalOpen) {
        setIsEmergencyModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEmergencyModalOpen, setIsEmergencyModalOpen]);

  if (!isEmergencyModalOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
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

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert('Please provide both a Name and Phone Number.');
      return;
    }

    if (formData.phone.trim().length !== 10) {
      alert('Phone number must be exactly 10 digits.');
      return;
    }

    updateEmergencyContact({
      ...emergencyContact,
      name: formData.name,
      phone: formData.phone,
      relationship: formData.relationship || 'Emergency Contact',
      hospital: formData.hospital || ''
    });

    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="modal-backdrop" onClick={() => setIsEmergencyModalOpen(false)}>
      <div
        className="emergency-modal-dialog"
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
              <h3 id="modal-title" className="emergency-title">Emergency Contact</h3>
              <p className="emergency-subtitle">Instant medical & family support</p>
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
              <span>✅ Contact information updated successfully!</span>
            </div>
          )}

          {!isEditing ? (
            /* View Existing Contact */
            <div className="view-contact-card">
              <div className="contact-main-info">
                <div className="contact-avatar-circle">
                  <span>🩺</span>
                </div>
                <div className="contact-text-details">
                  <span className="contact-relationship-tag">
                    {emergencyContact?.relationship || 'Doctor / Specialist'}
                  </span>
                  <h4 className="contact-name">{emergencyContact?.name || 'Not set'}</h4>
                  <p className="contact-hospital">{emergencyContact?.hospital || 'Women’s Health Specialist'}</p>
                </div>
              </div>

              <div className="contact-phone-box">
                <span className="phone-label">Direct Phone:</span>
                <a
                  href={`tel:${emergencyContact?.phone || ''}`}
                  className="phone-number-link"
                >
                  📞 {emergencyContact?.phone || 'No phone number added'}
                </a>
              </div>

              {emergencyContact?.secondaryName && (
                <div className="secondary-contact-box">
                  <span className="secondary-title">Secondary Contact:</span>
                  <div className="secondary-content">
                    <strong>{emergencyContact.secondaryName}</strong> ({emergencyContact.secondaryRelationship})
                    <span className="secondary-phone">{emergencyContact.secondaryPhone}</span>
                  </div>
                </div>
              )}

              <div className="modal-actions-bar">
                <a
                  href={`tel:${emergencyContact?.phone || ''}`}
                  className="action-call-btn"
                >
                  <span>📞</span> Call Now
                </a>
                <button
                  type="button"
                  className="action-edit-btn"
                  onClick={() => setIsEditing(true)}
                >
                  ✏️ Edit Contact
                </button>
              </div>
            </div>
          ) : (
            /* Edit / Update Contact Form */
            <form onSubmit={handleSave} className="contact-edit-form">
              <div className="form-group">
                <label htmlFor="contact-name" className="form-label">
                  Contact Name <span className="required-star">*</span>
                </label>
                <input
                  id="contact-name"
                  type="text"
                  name="name"
                  className="form-input"
                  placeholder="Enter contact name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="contact-phone" className="form-label">
                  Phone Number (10 Digits) <span className="required-star">*</span>
                </label>
                <input
                  id="contact-phone"
                  type="tel"
                  name="phone"
                  className="form-input"
                  placeholder="Enter 10-digit phone number"
                  value={formData.phone}
                  onChange={handleInputChange}
                  maxLength={10}
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="contact-relationship" className="form-label">
                  Relationship / Role
                </label>
                <input
                  id="contact-relationship"
                  type="text"
                  name="relationship"
                  className="form-input"
                  placeholder="Enter relationship or role"
                  value={formData.relationship}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="contact-hospital" className="form-label">
                  Clinic / Hospital Name (Optional)
                </label>
                <input
                  id="contact-hospital"
                  type="text"
                  name="hospital"
                  className="form-input"
                  placeholder="Enter clinic or hospital name"
                  value={formData.hospital}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-buttons-row">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  Save Changes
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
