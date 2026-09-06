import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTracker } from '../context/TrackerContext';
import { registerUser, loginUser, updateUserProfile, uploadMedicalFile } from '../api/authApi';
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
    mobileNumber: '',
    address: '',
    hasChildren: 'no',
    childrenCount: 1,
    pregnancyDate: '',
    bloodGroup: '',
    husbandName: '',
    husbandContact: '',
    parentName: '',
    parentContact: '',
    emergencyDoctor: '',
    doctorPhone: '',
    doctorAddress: '',
    medicalConditions: '',
    allergies: ''
  });

  const [childrenList, setChildrenList] = useState([
    { name: '', age: '', dob: '', gender: '' }
  ]);

  const [medicalFiles, setMedicalFiles] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Pre-fill values only if already saved by user; do NOT default to email or O+
  useEffect(() => {
    if (isOnboardingModalOpen && user) {
      // If profile is not complete, start with a completely fresh, empty form
      if (!user.profileComplete) {
        setFormData({
          name: (user.name && user.name !== user.email?.split('@')[0]) ? user.name : '',
          age: '',
          dob: '',
          city: '',
          mobileNumber: '',
          address: '',
          hasChildren: 'no',
          childrenCount: 1,
          pregnancyDate: '',
          bloodGroup: '',
          husbandName: '',
          husbandContact: '',
          parentName: '',
          parentContact: '',
          emergencyDoctor: '',
          doctorPhone: '',
          doctorAddress: '',
          medicalConditions: '',
          allergies: ''
        });
        setChildrenList([{ name: '', age: '', dob: '', gender: '' }]);
        setMedicalFiles([]);
        setError('');
        setSuccess(false);
        return;
      }

      // Profile is complete: user is editing/viewing previously saved profile
      const savedName = (user.name && user.name !== user.email?.split('@')[0]) ? user.name : '';

      let initialChildren = [];
      if (Array.isArray(user.children) && user.children.length > 0) {
        initialChildren = user.children.map((c) => ({
          name: c.name || '',
          age: c.age || '',
          dob: c.dob || '',
          gender: c.gender || ''
        }));
      } else if (user.childrenDetails) {
        try {
          const parsed = typeof user.childrenDetails === 'string' ? JSON.parse(user.childrenDetails) : user.childrenDetails;
          if (Array.isArray(parsed) && parsed.length > 0) {
            initialChildren = parsed;
          }
        } catch (e) {
          console.error("Failed to parse childrenDetails:", e);
        }
      }

      const initialHasChildren = user.hasChildren ? 'yes' : (user.childrenCount > 0 || initialChildren.length > 0 ? 'yes' : 'no');
      const initialCount = user.childrenCount || (initialHasChildren === 'yes' ? (initialChildren.length > 0 ? initialChildren.length : 1) : 1);

      if (initialChildren.length === 0) {
        initialChildren.push({ name: '', age: '', dob: '', gender: '' });
      }
      while (initialChildren.length < initialCount) {
        initialChildren.push({ name: '', age: '', dob: '', gender: '' });
      }

      setFormData({
        name: savedName,
        age: user.age ? String(user.age) : '',
        dob: user.dob || user.motherDetails?.dob || '',
        city: user.city || '',
        mobileNumber: user.mobileNumber || '',
        address: user.address || '',
        hasChildren: initialHasChildren,
        childrenCount: initialCount,
        pregnancyDate: user.pregnancyDate || '',
        bloodGroup: user.bloodGroup || '',
        husbandName: user.husbandName || '',
        husbandContact: user.husbandContact || '',
        parentName: user.parentName || '',
        parentContact: user.parentContact || '',
        emergencyDoctor: user.doctorClinicSupport?.doctorName || user.emergencyContact || '',
        doctorPhone: user.doctorClinicSupport?.doctorPhone || user.doctorPhone || '',
        doctorAddress: user.doctorClinicSupport?.doctorAddress || user.doctorAddress || '',
        medicalConditions: user.medicalConditions || '',
        allergies: user.allergies || ''
      });
      setChildrenList(initialChildren.slice(0, initialCount));

      let initialMedicalFiles = [];
      if (Array.isArray(user.fileStorageList) && user.fileStorageList.length > 0) {
        initialMedicalFiles = user.fileStorageList.map((f) => ({
          name: f.fileName,
          url: f.fileUrl,
          type: f.fileType,
          size: f.fileSize,
          storage: f.storage || 'cloudinary',
          uploadedAt: f.uploadedAt
        }));
      } else if (user.medicalDocuments) {
        try {
          const parsedDocs = typeof user.medicalDocuments === 'string' ? JSON.parse(user.medicalDocuments) : user.medicalDocuments;
          if (Array.isArray(parsedDocs)) {
            initialMedicalFiles = parsedDocs;
          }
        } catch (e) {
          console.error("Failed to parse medicalDocuments:", e);
        }
      }
      setMedicalFiles(initialMedicalFiles);

      setError('');
      setSuccess(false);
    }
  }, [isOnboardingModalOpen, user]);

  if (!isOnboardingModalOpen) return null;

  const todayDate = new Date().toISOString().split('T')[0];

  const handleChange = (e) => {
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
    if (name === 'dob') {
      if (value && value > todayDate) {
        setError("Mother's date of birth cannot be in the future.");
        return;
      }
      setError('');
      if (value) {
        const birthDate = new Date(value);
        if (!isNaN(birthDate.getTime())) {
          const today = new Date();
          let calculatedAge = today.getFullYear() - birthDate.getFullYear();
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            calculatedAge--;
          }
          if (calculatedAge >= 10 && calculatedAge <= 100) {
            setFormData((prev) => ({ ...prev, dob: value, age: String(calculatedAge) }));
            return;
          }
        }
      }
      setFormData((prev) => ({ ...prev, dob: value }));
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

  const handleChildChange = (index, field, value) => {
    if (field === 'dob' && value && value > todayDate) {
      setError(`Date of birth for Child/Baby #${index + 1} cannot be in the future.`);
      return;
    }
    setError('');
    setChildrenList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingFile(true);
    setError('');

    for (const file of files) {
      if (file.size > 25 * 1024 * 1024) {
        setError(`File "${file.name}" exceeds the 25MB limit.`);
        continue;
      }

      try {
        setUploadProgress(`Uploading "${file.name}"...`);
        const result = await uploadMedicalFile(file);
        const newDoc = {
          name: file.name,
          url: result.url,
          size: file.size,
          type: file.type || 'application/octet-stream',
          uploadedAt: new Date().toISOString(),
          storage: result.storage || 'cloudinary'
        };
        setMedicalFiles((prev) => [...prev, newDoc]);
      } catch (err) {
        console.error('Medical file upload failed:', err);
        setError(`Failed to upload "${file.name}": ${err.message}`);
      }
    }

    setUploadingFile(false);
    setUploadProgress('');
    e.target.value = '';
  };

  const handleRemoveFile = (indexToRemove) => {
    setMedicalFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
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
      setError('Please provide your full name.');
      return;
    }

    if (!formData.dob) {
      setError("Please provide Mother's Date of Birth.");
      return;
    }

    if (formData.dob > todayDate) {
      setError("Mother's Date of Birth cannot be in the future.");
      return;
    }

    if (!formData.age || isNaN(formData.age) || parseInt(formData.age, 10) < 16 || parseInt(formData.age, 10) > 65) {
      setError('Please provide a valid age (between 16 and 65).');
      return;
    }

    if (!formData.mobileNumber || formData.mobileNumber.length !== 10) {
      setError("Mother's mobile number is required and must be exactly 10 digits.");
      return;
    }

    if (!formData.bloodGroup) {
      setError('Please select your blood group.');
      return;
    }

    if (!formData.city.trim()) {
      setError('Please provide your city / location.');
      return;
    }

    if (!formData.address.trim()) {
      setError('Please provide your residential address.');
      return;
    }

    if (formData.hasChildren === 'yes') {
      for (let i = 0; i < childrenList.length; i++) {
        const c = childrenList[i];
        if (!c.name.trim()) {
          setError(`Please provide the name for Child/Baby #${i + 1}.`);
          return;
        }
        if (!c.age.trim()) {
          setError(`Please provide the age for Child/Baby #${i + 1}.`);
          return;
        }
        if (!c.dob) {
          setError(`Please select the date of birth for Child/Baby #${i + 1}.`);
          return;
        }
        if (c.dob > todayDate) {
          setError(`Date of birth for Child/Baby #${i + 1} cannot be in the future.`);
          return;
        }
        if (!c.gender) {
          setError(`Please select the gender for Child/Baby #${i + 1}.`);
          return;
        }
      }
    }

    if (!formData.pregnancyDate) {
      setError('Please select your pregnancy confirmation date.');
      return;
    }

    if (!formData.husbandName.trim()) {
      setError("Please provide your partner's name.");
      return;
    }

    if (!formData.husbandContact || formData.husbandContact.length !== 10) {
      setError("Partner's contact number is required and must be exactly 10 digits.");
      return;
    }

    if (!formData.parentName.trim()) {
      setError("Please provide your parent's name.");
      return;
    }

    if (!formData.parentContact || formData.parentContact.length !== 10) {
      setError("Parent's contact number is required and must be exactly 10 digits.");
      return;
    }

    if (formData.doctorPhone && formData.doctorPhone.length !== 10) {
      setError("Doctor/Clinic phone number must be exactly 10 digits.");
      return;
    }

    setLoading(true);

    try {
      const motherAge = parseInt(formData.age, 10);
      const approxBirthYear = new Date().getFullYear() - (isNaN(motherAge) ? 25 : motherAge);
      const computedDob = formData.dob || `${approxBirthYear}-01-01`;

      const payload = {
        name: formData.name.trim(),
        age: motherAge,
        dob: formData.dob || computedDob,
        city: formData.city.trim(),
        mobileNumber: formData.mobileNumber.trim(),
        address: formData.address.trim(),
        hasChildren: formData.hasChildren === 'yes',
        childrenCount: formData.hasChildren === 'yes' ? parseInt(formData.childrenCount, 10) : 0,
        childrenDetails: formData.hasChildren === 'yes' ? JSON.stringify(childrenList) : '[]',
        pregnancyDate: formData.pregnancyDate,
        bloodGroup: formData.bloodGroup,
        husbandName: formData.husbandName.trim(),
        husbandContact: formData.husbandContact.trim(),
        parentName: formData.parentName.trim(),
        parentContact: formData.parentContact.trim(),
        // Doctor details remain the only optional fields
        emergencyContact: formData.emergencyDoctor.trim() || null,
        doctorPhone: formData.doctorPhone.trim() || null,
        doctorAddress: formData.doctorAddress.trim() || null,
        medicalConditions: formData.medicalConditions.trim() || 'None',
        allergies: formData.allergies.trim() || 'None',
        medicalDocuments: JSON.stringify(medicalFiles),
        state: formData.city.trim(),
        country: 'India',
        zipCode: 'N/A'
      };

      let targetUserId = user?.id;

      // If user ID is missing (e.g. accessed without prior auth or legacy localStorage), ensure backend user exists
      if (!targetUserId) {
        const userEmail = user?.email || `mom_${formData.mobileNumber || Date.now()}@happimom.com`;
        try {
          const regRes = await registerUser(userEmail, 'HappiMom@123');
          targetUserId = regRes.id;
        } catch (regErr) {
          try {
            const loginRes = await loginUser(userEmail, 'HappiMom@123');
            targetUserId = loginRes.id;
          } catch (loginErr) {
            console.warn('Could not auto-register user on backend:', loginErr);
          }
        }
      }

      if (targetUserId) {
        // Persist to MySQL database via Spring Boot backend
        const updatedUser = await updateUserProfile(targetUserId, payload);
        updateUser({
          ...updatedUser,
          id: targetUserId,
          profileComplete: true
        });
      } else {
        // Fallback local update if backend is entirely unreachable
        updateUser({
          ...payload,
          profileComplete: true
        });
      }

      // If emergency doctor or partner is provided, update emergency contact state
      if (formData.husbandName || formData.emergencyDoctor || formData.doctorPhone) {
        updateEmergencyContact({
          name: formData.emergencyDoctor || '',
          phone: formData.doctorPhone || '',
          relationship: 'Primary Doctor / Clinic',
          hospital: formData.doctorAddress || '',
          secondaryName: formData.husbandName || '',
          secondaryPhone: formData.husbandContact || '',
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
                  <label htmlFor="ob-dob">
                    Mother's Date of Birth <span className="req-star">*</span>
                  </label>
                  <input
                    id="ob-dob"
                    type="date"
                    name="dob"
                    max={todayDate}
                    value={formData.dob}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="ob-age">
                    Age (Years) <span className="req-star">*</span>
                  </label>
                  <input
                    id="ob-age"
                    type="number"
                    name="age"
                    placeholder="Enter age"
                    min="16"
                    max="65"
                    value={formData.age}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="ob-mobile">
                    Mobile Number <span className="req-star">*</span>
                  </label>
                  <input
                    id="ob-mobile"
                    type="tel"
                    name="mobileNumber"
                    placeholder="Enter 10-digit mobile number"
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    maxLength={10}
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    required
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="ob-blood">
                    Blood Group <span className="req-star">*</span>
                  </label>
                  <select
                    id="ob-blood"
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleChange}
                    required
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
                  <label htmlFor="ob-city">
                    City / Location <span className="req-star">*</span>
                  </label>
                  <input
                    id="ob-city"
                    type="text"
                    name="city"
                    placeholder="Enter city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="field-group">
                  <label>Having Children?</label>
                  <div className="choice-pill-group">
                    <label className={`choice-pill ${formData.hasChildren === 'no' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="hasChildren"
                        value="no"
                        checked={formData.hasChildren === 'no'}
                        onChange={handleChange}
                      />
                      <span>No</span>
                    </label>
                    <label className={`choice-pill ${formData.hasChildren === 'yes' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="hasChildren"
                        value="yes"
                        checked={formData.hasChildren === 'yes'}
                        onChange={handleChange}
                      />
                      <span>Yes</span>
                    </label>
                  </div>
                </div>

                {formData.hasChildren === 'yes' && (
                  <div className="field-group">
                    <label htmlFor="ob-children-count">Count of Children</label>
                    <select
                      id="ob-children-count"
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

                <div className="field-group span-full">
                  <label htmlFor="ob-address">
                    Address <span className="req-star">*</span>
                  </label>
                  <input
                    id="ob-address"
                    type="text"
                    name="address"
                    placeholder="Enter street, locality, or residential address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                  />
                </div>

                {formData.hasChildren === 'yes' && (
                  <div className="children-details-container span-full">
                    <div className="children-section-header">
                      <div className="children-title-box">
                        <span className="children-icon">👶</span>
                        <div>
                          <h4 className="children-section-heading">Children Details</h4>
                          <p className="children-section-sub">
                            Please provide details for your {formData.childrenCount} {formData.childrenCount === 1 ? 'child' : 'children'}
                          </p>
                        </div>
                      </div>
                      <span className="children-count-badge">
                        {formData.childrenCount} {formData.childrenCount === 1 ? 'Child' : 'Children'}
                      </span>
                    </div>

                    <div className="children-cards-list">
                      {childrenList.map((child, idx) => (
                        <div key={idx} className="child-item-card">
                          <div className="child-card-header">
                            <span className="child-num-badge">Child / Baby #{idx + 1}</span>
                          </div>
                          <div className="child-fields-grid">
                            <div className="field-group">
                              <label htmlFor={`child-name-${idx}`}>
                                Name <span className="req-star">*</span>
                              </label>
                              <input
                                id={`child-name-${idx}`}
                                type="text"
                                placeholder="Child's full name"
                                value={child.name}
                                onChange={(e) => handleChildChange(idx, 'name', e.target.value)}
                                required
                              />
                            </div>

                            <div className="field-group">
                              <label htmlFor={`child-age-${idx}`}>
                                Age (Years / Months) <span className="req-star">*</span>
                              </label>
                              <input
                                id={`child-age-${idx}`}
                                type="text"
                                placeholder="e.g. 2 yrs or 8 mos"
                                value={child.age}
                                onChange={(e) => handleChildChange(idx, 'age', e.target.value)}
                                required
                              />
                            </div>

                            <div className="field-group">
                              <label htmlFor={`child-dob-${idx}`}>
                                Date of Birth <span className="req-star">*</span>
                              </label>
                              <input
                                id={`child-dob-${idx}`}
                                type="date"
                                max={todayDate}
                                value={child.dob}
                                onChange={(e) => handleChildChange(idx, 'dob', e.target.value)}
                                required
                              />
                            </div>

                            <div className="field-group">
                              <label htmlFor={`child-gender-${idx}`}>
                                Gender <span className="req-star">*</span>
                              </label>
                              <select
                                id={`child-gender-${idx}`}
                                value={child.gender}
                                onChange={(e) => handleChildChange(idx, 'gender', e.target.value)}
                                required
                              >
                                <option value="">Select Gender</option>
                                <option value="Boy">Boy 👦</option>
                                <option value="Girl">Girl 👧</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                    Pregnancy Confirmation Date <span className="req-star">*</span>
                  </label>
                  <input
                    id="ob-preg-date"
                    type="date"
                    name="pregnancyDate"
                    value={formData.pregnancyDate}
                    onChange={handleChange}
                    required
                  />
                  <span className="field-helper-text">
                    Calculates your weekly growth & due date
                  </span>
                </div>

                <div className="field-group">
                  <label htmlFor="ob-allergies">Known Allergies</label>
                  <input
                    id="ob-allergies"
                    type="text"
                    name="allergies"
                    placeholder="e.g. None, Penicillin, Peanuts"
                    value={formData.allergies}
                    onChange={handleChange}
                  />
                </div>

                <div className="field-group span-full">
                  <label htmlFor="ob-medical">Medical Notes</label>
                  <input
                    id="ob-medical"
                    type="text"
                    name="medicalConditions"
                    placeholder="e.g. None, Normal pregnancy"
                    value={formData.medicalConditions}
                    onChange={handleChange}
                  />
                </div>

                {/* Medical Reports & Receipts Upload */}
                <div className="medical-files-section span-full">
                  <div className="medical-files-header">
                    <span className="files-title">📎 Medical Receipts & Reports</span>
                  </div>

                  <div className="file-upload-dropzone">
                    <input
                      id="medical-file-input"
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                      disabled={uploadingFile}
                    />
                    <label htmlFor="medical-file-input" className="file-upload-label">
                      <span className="upload-icon">📁</span>
                      <div className="upload-text-group">
                        <span className="upload-prompt">
                          <strong>Choose files</strong> or drop here
                        </span>
                        <span className="upload-hint">
                          PDF, JPG, PNG (up to 25MB)
                        </span>
                      </div>
                      <span className="browse-files-btn">
                        {uploadingFile ? 'Uploading...' : 'Browse'}
                      </span>
                    </label>
                  </div>

                  {uploadingFile && (
                    <div className="file-upload-status">
                      <span className="spinner-dot">⏳</span> {uploadProgress || 'Uploading...'}
                    </div>
                  )}

                  {medicalFiles.length > 0 && (
                    <div className="uploaded-files-list">
                      <span className="uploaded-files-heading">Uploaded Documents ({medicalFiles.length})</span>
                      <div className="file-chips-grid">
                        {medicalFiles.map((file, idx) => (
                          <div key={idx} className="file-chip-item">
                            <span className="file-chip-icon">
                              {file.type?.includes('pdf') ? '📑' : file.type?.includes('image') ? '🖼️' : '📄'}
                            </span>
                            <div className="file-chip-info">
                              <span className="file-chip-name" title={file.name}>{file.name}</span>
                              <span className="file-chip-size">
                                {(file.size / 1024).toFixed(1)} KB
                              </span>
                            </div>
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="file-chip-view"
                              title="View Document"
                            >
                              👁️
                            </a>
                            <button
                              type="button"
                              className="file-chip-remove"
                              onClick={() => handleRemoveFile(idx)}
                              title="Remove File"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Partner's Details */}
            <div className="onboarding-card-section">
              <div className="section-title-wrap">
                <span className="section-icon">💍</span>
                <div>
                  <h3 className="section-title">Partner Details</h3>
                  <p className="section-desc">Your partner's contact for direct support</p>
                </div>
              </div>

              <div className="onboarding-fields-two-col">
                <div className="field-group">
                  <label htmlFor="ob-husband-name">
                    Partner's Name <span className="req-star">*</span>
                  </label>
                  <input
                    id="ob-husband-name"
                    type="text"
                    name="husbandName"
                    placeholder="Enter partner's name"
                    value={formData.husbandName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="ob-husband-phone">
                    Partner's Phone Number <span className="req-star">*</span>
                  </label>
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
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Parents' Details */}
            <div className="onboarding-card-section">
              <div className="section-title-wrap">
                <span className="section-icon">👨‍👩‍👧</span>
                <div>
                  <h3 className="section-title">Parent Details</h3>
                  <p className="section-desc">Family contact for guidance & emergency care</p>
                </div>
              </div>

              <div className="onboarding-fields-two-col">
                <div className="field-group">
                  <label htmlFor="ob-parent-name">
                    Parent's Name <span className="req-star">*</span>
                  </label>
                  <input
                    id="ob-parent-name"
                    type="text"
                    name="parentName"
                    placeholder="Enter parent's name"
                    value={formData.parentName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="ob-parent-phone">
                    Parent's Phone Number <span className="req-star">*</span>
                  </label>
                  <input
                    id="ob-parent-phone"
                    type="tel"
                    name="parentContact"
                    placeholder="Enter 10-digit phone number"
                    value={formData.parentContact}
                    onChange={handleChange}
                    maxLength={10}
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 5: Doctor & Clinic Support (Optional) */}
            <div className="onboarding-card-section">
              <div className="section-title-wrap">
                <span className="section-icon">🏥</span>
                <div>
                  <h3 className="section-title">Doctor & Clinic Support (Optional)</h3>
                  <p className="section-desc">Your primary physician for medical assistance</p>
                </div>
              </div>

              <div className="onboarding-fields-two-col">
                <div className="field-group">
                  <label htmlFor="ob-doctor">Primary Doctor / Clinic</label>
                  <input
                    id="ob-doctor"
                    type="text"
                    name="emergencyDoctor"
                    placeholder="Enter doctor or clinic name"
                    value={formData.emergencyDoctor}
                    onChange={handleChange}
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="ob-doctor-phone">Doctor / Clinic Phone Number</label>
                  <input
                    id="ob-doctor-phone"
                    type="tel"
                    name="doctorPhone"
                    placeholder="Enter 10-digit phone number"
                    value={formData.doctorPhone}
                    onChange={handleChange}
                    maxLength={10}
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                  />
                </div>

                <div className="field-group span-full">
                  <label htmlFor="ob-doctor-address">Doctor / Clinic Address</label>
                  <input
                    id="ob-doctor-address"
                    type="text"
                    name="doctorAddress"
                    placeholder="Enter hospital, clinic, or doctor's office address"
                    value={formData.doctorAddress}
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
