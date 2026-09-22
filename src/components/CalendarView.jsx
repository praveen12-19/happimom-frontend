import React, { useState, useRef } from 'react';
import { useTracker } from '../context/TrackerContext';
import '../css/CalendarView.css';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Standard demo doctor & milestone sample schedule for demo month navigation
const SEPTEMBER_2026_DAYS = {
  3: { type: 'pink', title: 'Prenatal Doctor Appointment', time: '10:00 AM' },
  4: { type: 'pink', title: 'Ultrasound Checkup', time: '11:30 AM' },
  5: { type: 'pink', title: 'Consultation & Blood Panel', time: '9:00 AM' },
  6: { type: 'pink', title: 'Nutrition & Fetal Health Review', time: '10:15 AM' },
  7: { type: 'pink', title: 'Doctor Follow-up Session', time: '2:30 PM' },
  12: { type: 'green', title: 'Growth Milestone Checkpoint', time: 'All Day' },
  13: { type: 'green', title: 'Week 14 Kickoff: Trimester 2 Begins', time: 'All Day' },
  14: { type: 'green', title: 'Baby Fingerprints Formed', time: 'All Day' },
  15: { type: 'green', title: 'Heartbeat Monitoring Milestone', time: 'All Day' },
  16: { type: 'green', title: 'Sensory Development Checkpoint', time: 'All Day' },
  17: { type: 'orange', title: 'Important Reminder: Glucose Screening Refill', time: '9:00 AM' },
  18: { type: 'green', title: 'Movement & Kick Sensations Check', time: 'All Day' }
};

const CalendarView = ({ currentDate: externalDate }) => {
  const realToday = new Date();
  const [currentDate, setCurrentDate] = useState(externalDate || new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  // New Appointment Modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleMode, setScheduleMode] = useState('manual'); // 'manual' or 'prescription'
  const [newDoctor, setNewDoctor] = useState('');
  const [newClinic, setNewClinic] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('10:00 AM');
  const [newPurpose, setNewPurpose] = useState('Routine Prenatal Ultrasound & Checkup');
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [prescriptionNotes, setPrescriptionNotes] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleError, setScheduleError] = useState(null);

  // Post-Appointment Report Upload inside detail popup
  const [reportFile, setReportFile] = useState(null);
  const [reportNotes, setReportNotes] = useState('');
  const [isUploadingReport, setIsUploadingReport] = useState(false);
  const [reportUploadError, setReportUploadError] = useState(null);

  const fileInputRef = useRef(null);
  const reportFileInputRef = useRef(null);

  const {
    user,
    pregnancy,
    openOnboardingModal,
    appointments,
    scheduleAppointment,
    schedulePrescriptionAppointment,
    uploadPostAppointmentReport,
    removeAppointment
  } = useTracker();

  const isProfileComplete = Boolean(
    user && (user.profileComplete === true || user.isProfileComplete === true)
  );

  const confirmationDate = isProfileComplete && pregnancy?.confirmationDate ? pregnancy.confirmationDate : null;
  const dueDate = isProfileComplete && pregnancy?.dueDateObj ? pregnancy.dueDateObj : null;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const handleJumpTo = (targetDate, milestoneType) => {
    if (!targetDate) return;
    const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    setCurrentDate(target);

    const day = targetDate.getDate();
    if (milestoneType === 'confirmation') {
      setSelectedDay({
        day,
        type: 'pregnancy-confirmed',
        title: 'Pregnancy Confirmation Date',
        dateStr: pregnancy?.confirmationDateStr,
        time: 'Milestone Day',
        note: 'Official date your pregnancy was confirmed! Milestone journey started.'
      });
    } else if (milestoneType === 'due-date') {
      setSelectedDay({
        day,
        type: 'due-date',
        title: 'Expected Due Date (40 Weeks)',
        dateStr: pregnancy?.dueDate,
        time: 'Baby Arrival',
        note: 'Calculated 280 days from confirmation date. Welcome to motherhood!'
      });
    }
  };

  const handleResetToToday = () => {
    setCurrentDate(new Date());
    setSelectedDay(null);
  };

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  // Determine styling for a day cell
  const getDayInfo = (d) => {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    // 1. Check User's Real Appointments first
    if (Array.isArray(appointments) && appointments.length > 0) {
      const userAppt = appointments.find((a) => a.appointmentDate === dayStr);
      if (userAppt) {
        const isCompleted = userAppt.status === 'COMPLETED' || Boolean(userAppt.reportFileUrl);
        return {
          type: 'user-appointment',
          appointment: userAppt,
          title: userAppt.doctorName ? `Dr. ${userAppt.doctorName.replace(/^Dr\.\s*/i, '')}` : (userAppt.purpose || 'Doctor Appointment'),
          time: userAppt.appointmentTime || '10:00 AM',
          dateStr: userAppt.appointmentDate,
          status: userAppt.status || 'SCHEDULED',
          note: userAppt.purpose || 'Prenatal medical consultation',
          isCompleted
        };
      }
    }

    // 2. Pregnancy Confirmation Date
    if (
      confirmationDate &&
      year === confirmationDate.getFullYear() &&
      month === confirmationDate.getMonth() &&
      d === confirmationDate.getDate()
    ) {
      return {
        type: 'pregnancy-confirmed',
        title: 'Pregnancy Confirmation Date',
        time: 'Milestone Day',
        dateStr: pregnancy?.confirmationDateStr,
        note: 'Your pregnancy was officially recorded on this day. Cherish this special moment!'
      };
    }

    // 3. Expected Due Date
    if (
      dueDate &&
      year === dueDate.getFullYear() &&
      month === dueDate.getMonth() &&
      d === dueDate.getDate()
    ) {
      return {
        type: 'due-date',
        title: 'Expected Due Date (40 Weeks)',
        time: 'Baby Arrival',
        dateStr: pregnancy?.dueDate,
        note: 'Calculated 280 days from confirmation date. Get ready to welcome your little blessing!'
      };
    }

    // 4. Demo appointments for September 2026 (only if no custom user appointments for this day)
    if (month === 8 && year === 2026) {
      if (SEPTEMBER_2026_DAYS[d]) {
        return SEPTEMBER_2026_DAYS[d];
      }
    }

    return { type: 'normal' };
  };

  const daysGrid = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysGrid.push({ empty: true, key: `empty-${i}` });
  }
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const info = getDayInfo(d);
    daysGrid.push({
      empty: false,
      day: d,
      ...info,
      key: `day-${d}`
    });
  }

  // Handle scheduling submission
  const handleCreateAppointmentSubmit = async (e) => {
    e.preventDefault();
    setScheduleError(null);
    setIsScheduling(true);

    try {
      if (scheduleMode === 'prescription' && prescriptionFile) {
        await schedulePrescriptionAppointment({
          file: prescriptionFile,
          notes: prescriptionNotes,
          appointmentDate: newDate,
          appointmentTime: newTime,
          doctorName: newDoctor,
          purpose: newPurpose
        });
      } else {
        if (!newDate) {
          throw new Error('Please select an appointment date');
        }
        await scheduleAppointment({
          doctorName: newDoctor || 'Obstetrician Specialist',
          clinicName: newClinic || 'Maternity Health Clinic',
          appointmentDate: newDate,
          appointmentTime: newTime || '10:00 AM',
          purpose: newPurpose || 'Prenatal Consultation & Checkup',
          status: 'SCHEDULED'
        });
      }

      setIsScheduleModalOpen(false);
      setPrescriptionFile(null);
      setPrescriptionNotes('');
      setNewDoctor('');
      setNewClinic('');
      setNewDate('');
    } catch (err) {
      console.error('Scheduling error:', err);
      setScheduleError(err.message || 'Failed to schedule appointment');
    } finally {
      setIsScheduling(false);
    }
  };

  // Handle Post-Appointment Doctor Report upload
  const handleUploadReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportFile || !selectedDay?.appointment?.id) return;
    setReportUploadError(null);
    setIsUploadingReport(true);

    try {
      const updated = await uploadPostAppointmentReport(
        selectedDay.appointment.id,
        reportFile,
        reportNotes
      );
      // Update the local selectedDay view
      setSelectedDay((prev) => ({
        ...prev,
        appointment: updated,
        isCompleted: true,
        status: 'COMPLETED'
      }));
      setReportFile(null);
      setReportNotes('');
    } catch (err) {
      console.error('Report upload error:', err);
      setReportUploadError(err.message || 'Failed to upload and analyze doctor report');
    } finally {
      setIsUploadingReport(false);
    }
  };

  const handleOpenScheduleForDay = (d) => {
    const formatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    setNewDate(formatted);
    setIsScheduleModalOpen(true);
  };

  return (
    <div className="happimom-calendar-card">
      {/* Pregnancy Milestones Bar */}
      {isProfileComplete && confirmationDate && dueDate ? (
        <div className="calendar-pregnancy-bar">
          <div
            className="milestone-chip confirmed-chip"
            onClick={() => handleJumpTo(confirmationDate, 'confirmation')}
            role="button"
            tabIndex={0}
            title="Click to view Confirmation Month"
          >
            <div className="chip-left">
              <span className="chip-icon">🌸</span>
              <div className="chip-info">
                <span className="chip-label">Pregnancy Confirmed</span>
                <strong className="chip-date">{pregnancy.confirmationDateStr}</strong>
              </div>
            </div>
            <span className="chip-jump-btn">View in Calendar ↗</span>
          </div>

          <div
            className="milestone-chip due-chip"
            onClick={() => handleJumpTo(dueDate, 'due-date')}
            role="button"
            tabIndex={0}
            title="Click to view Expected Due Date Month"
          >
            <div className="chip-left">
              <span className="chip-icon">🎉</span>
              <div className="chip-info">
                <span className="chip-label">Expected Due Date (40 Wks)</span>
                <strong className="chip-date">{pregnancy.dueDate}</strong>
              </div>
            </div>
            <span className="chip-jump-btn">View in Calendar ↗</span>
          </div>
        </div>
      ) : (
        <div className="calendar-profile-prompt-card">
          <div className="prompt-left-content">
            <span className="prompt-badge-icon">💖</span>
            <div>
              <h4 className="prompt-text-heading">Track Your Pregnancy & Due Date</h4>
              <p className="prompt-text-desc">
                Fill your pregnancy details in the Quick Profile form to have your Confirmation Date and Expected Due Date automatically marked on your calendar.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="prompt-complete-btn"
            onClick={() => openOnboardingModal('/calendar')}
          >
            Complete Profile ✨
          </button>
        </div>
      )}

      {/* Calendar Header with Navigation and Schedule Action */}
      <div className="happimom-calendar-header">
        <button
          className="header-arrow-btn"
          onClick={handlePrevMonth}
          aria-label="Previous Month"
        >
          ←
        </button>

        <div className="header-title-container">
          <h2 className="header-month-title">
            {MONTH_NAMES[month]} {year}
          </h2>
          {(year !== realToday.getFullYear() || month !== realToday.getMonth()) && (
            <button
              type="button"
              className="calendar-today-pill-btn"
              onClick={handleResetToToday}
            >
              Back to Today
            </button>
          )}
        </div>

        <div className="header-actions-right">
          <button
            type="button"
            className="calendar-schedule-btn"
            onClick={() => {
              const todayStr = `${realToday.getFullYear()}-${String(realToday.getMonth() + 1).padStart(2, '0')}-${String(realToday.getDate()).padStart(2, '0')}`;
              setNewDate(todayStr);
              setIsScheduleModalOpen(true);
            }}
          >
            + Schedule Appointment
          </button>
          <button
            className="header-arrow-btn"
            onClick={handleNextMonth}
            aria-label="Next Month"
          >
            →
          </button>
        </div>
      </div>

      {/* Weekdays Row */}
      <div className="happimom-weekdays-row">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="weekday-column-title">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="happimom-calendar-grid">
        {daysGrid.map((item) => {
          if (item.empty) {
            return <div key={item.key} className="day-block empty-day-block" />;
          }

          const isToday =
            year === realToday.getFullYear() &&
            month === realToday.getMonth() &&
            item.day === realToday.getDate();

          const isSelected = selectedDay?.day === item.day;

          let variantClass = 'block-normal';
          if (item.type === 'user-appointment') {
            variantClass = item.isCompleted ? 'block-user-appointment block-appt-completed' : 'block-user-appointment';
          } else if (item.type === 'pregnancy-confirmed') {
            variantClass = 'block-pregnancy-confirmed';
          } else if (item.type === 'due-date') {
            variantClass = 'block-due-date';
          }

          return (
            <div
              key={item.key}
              className={`day-block ${variantClass} ${isToday ? 'block-today' : ''} ${isSelected ? 'block-selected' : ''}`}
              onClick={() => setSelectedDay(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setSelectedDay(item)}
              title={
                item.type === 'user-appointment'
                  ? `${item.title} (${item.time}) - ${item.status}`
                  : item.type === 'pregnancy-confirmed'
                  ? `Pregnancy Confirmed: Day ${item.day}`
                  : item.type === 'due-date'
                  ? `Expected Due Date: Day ${item.day}`
                  : isToday
                  ? "Today's Date"
                  : `Day ${item.day}`
              }
            >
              <span className="day-number-label">{item.day}</span>

              {item.type === 'user-appointment' && (
                <span className={`milestone-badge-pill ${item.isCompleted ? 'pill-completed' : 'pill-appointment'}`}>
                  {item.isCompleted ? '✅ Report Stored' : '🩺 Doctor Appt'}
                </span>
              )}

              {item.type === 'pregnancy-confirmed' && (
                <span className="milestone-badge-pill pill-confirmed">🌸 Confirmed</span>
              )}

              {item.type === 'due-date' && (
                <span className="milestone-badge-pill pill-due">🎉 Due Date</span>
              )}

              {isToday && item.type !== 'pregnancy-confirmed' && item.type !== 'due-date' && item.type !== 'user-appointment' && (
                <span className="today-badge-label">Today</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Day Detail Card */}
      {selectedDay && (
        <div className={`selected-day-banner banner-${selectedDay.type || 'normal'}`}>
          <div className="selected-day-info">
            <span className="selected-day-pill">Day {selectedDay.day}</span>
            <div className="selected-day-text">
              <div className="detail-header-row">
                <strong className="detail-title">{selectedDay.title}</strong>
                {selectedDay.status && (
                  <span className={`status-pill ${selectedDay.status === 'COMPLETED' ? 'status-completed' : 'status-scheduled'}`}>
                    {selectedDay.status}
                  </span>
                )}
              </div>

              {selectedDay.dateStr && (
                <span className="selected-date-callout">📅 Date: {selectedDay.dateStr}</span>
              )}
              {selectedDay.time && <span>⏰ Time: {selectedDay.time}</span>}
              {selectedDay.note && <span className="selected-day-note">{selectedDay.note}</span>}

              {/* User Appointment Specific Details & Actions */}
              {selectedDay.type === 'user-appointment' && selectedDay.appointment && (
                <div className="appointment-deep-details">
                  {selectedDay.appointment.clinicName && (
                    <div className="detail-item">
                      🏥 <strong>Clinic / Hospital:</strong> {selectedDay.appointment.clinicName}
                    </div>
                  )}

                  {/* Prescription Section if uploaded */}
                  {selectedDay.appointment.prescriptionFileUrl && (
                    <div className="detail-attachment-box">
                      <div className="attachment-header">
                        <span>📄 <strong>Prescription / Slip (Cloudinary)</strong></span>
                        <a
                          href={selectedDay.appointment.prescriptionFileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="view-cloudinary-link"
                        >
                          View File ↗
                        </a>
                      </div>
                      {selectedDay.appointment.prescriptionAnalysis && (
                        <div className="prescription-analysis-snippet">
                          <strong>AI Prescription Analysis:</strong>
                          <p>{selectedDay.appointment.prescriptionAnalysis}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Doctor Report Section (If already uploaded) */}
                  {selectedDay.appointment.reportFileUrl && (
                    <div className="detail-attachment-box report-box-highlight">
                      <div className="attachment-header">
                        <span>🩺 <strong>Doctor Consultation Report (Cloudinary)</strong></span>
                        <a
                          href={selectedDay.appointment.reportFileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="view-cloudinary-link report-link"
                        >
                          Open Report ↗
                        </a>
                      </div>
                      {selectedDay.appointment.reportAnalysis && (
                        <div className="report-ai-explanation">
                          <div className="explanation-badge">✨ AI Doctor Consultation Explanation:</div>
                          <div className="explanation-body">
                            {selectedDay.appointment.reportAnalysis.split('\n').map((line, idx) => (
                              <p key={idx}>{line}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* If report is NOT yet uploaded, provide direct upload & AI explanation form */}
                  {!selectedDay.appointment.reportFileUrl && (
                    <div className="post-consultation-upload-card">
                      <div className="upload-card-header">
                        <span className="upload-badge-icon">🩺</span>
                        <div>
                          <h5>Consultation Completed? Upload Doctor's Report</h5>
                          <p>
                            Attach your doctor's report or visit notes. We'll store it safely in your Cloudinary vault and the AI will explain everything the doctor noted down in simple terms.
                          </p>
                        </div>
                      </div>

                      <form onSubmit={handleUploadReportSubmit} className="report-upload-inline-form">
                        <div className="file-input-wrapper">
                          <input
                            type="file"
                            ref={reportFileInputRef}
                            accept="image/*,application/pdf"
                            onChange={(e) => setReportFile(e.target.files[0])}
                            required
                          />
                        </div>

                        <input
                          type="text"
                          placeholder="Optional: What did the doctor tell you? (e.g., 'Everything normal, take calcium tablets')"
                          value={reportNotes}
                          onChange={(e) => setReportNotes(e.target.value)}
                          className="report-notes-input"
                        />

                        {reportUploadError && (
                          <div className="form-error-inline">{reportUploadError}</div>
                        )}

                        <button
                          type="submit"
                          className="upload-report-submit-btn"
                          disabled={isUploadingReport || !reportFile}
                        >
                          {isUploadingReport ? (
                            <span>⏳ Storing in Cloudinary & Asking AI...</span>
                          ) : (
                            <span>Upload to Cloudinary & Explain with AI ✨</span>
                          )}
                        </button>
                      </form>
                    </div>
                  )}

                  <div className="appointment-actions-row">
                    <button
                      type="button"
                      className="delete-appt-btn"
                      onClick={async () => {
                        if (window.confirm('Are you sure you want to remove this appointment?')) {
                          await removeAppointment(selectedDay.appointment.id);
                          setSelectedDay(null);
                        }
                      }}
                    >
                      Delete Appointment
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            className="selected-day-close"
            onClick={() => setSelectedDay(null)}
            aria-label="Close details"
          >
            ✕
          </button>
        </div>
      )}

      {/* Schedule Appointment / Upload Prescription Modal */}
      {isScheduleModalOpen && (
        <div className="appointment-modal-overlay" onClick={() => setIsScheduleModalOpen(false)}>
          <div className="appointment-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3>🌸 Schedule Doctor Appointment</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsScheduleModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-mode-tabs">
              <button
                type="button"
                className={`tab-btn ${scheduleMode === 'manual' ? 'active-tab' : ''}`}
                onClick={() => setScheduleMode('manual')}
              >
                📅 Enter Appointment Details
              </button>
              <button
                type="button"
                className={`tab-btn ${scheduleMode === 'prescription' ? 'active-tab' : ''}`}
                onClick={() => setScheduleMode('prescription')}
              >
                📄 Upload Prescription / Slip
              </button>
            </div>

            <form onSubmit={handleCreateAppointmentSubmit} className="modal-schedule-form">
              {scheduleMode === 'prescription' && (
                <div className="form-group file-dropzone-group">
                  <label>Prescription / Doctor Slip (Saved to Cloudinary):</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*,application/pdf"
                    onChange={(e) => setPrescriptionFile(e.target.files[0])}
                    required
                  />
                  <small className="form-help-text">
                    The AI will analyze the prescription, store the document in Cloudinary, and schedule the appointment on your calendar.
                  </small>
                </div>
              )}

              <div className="form-row-2col">
                <div className="form-group">
                  <label>Appointment Date *</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 10:30 AM"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row-2col">
                <div className="form-group">
                  <label>Doctor's Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Sarah Jenkins"
                    value={newDoctor}
                    onChange={(e) => setNewDoctor(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Hospital / Clinic Name</label>
                  <input
                    type="text"
                    placeholder="e.g. City Maternity Center"
                    value={newClinic}
                    onChange={(e) => setNewClinic(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Purpose / Visit Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Routine 2nd Trimester Ultrasound & Checkup"
                  value={newPurpose}
                  onChange={(e) => setNewPurpose(e.target.value)}
                />
              </div>

              {scheduleMode === 'prescription' && (
                <div className="form-group">
                  <label>Additional Prescription Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Any specific symptoms or medication notes..."
                    value={prescriptionNotes}
                    onChange={(e) => setPrescriptionNotes(e.target.value)}
                  />
                </div>
              )}

              {scheduleError && <div className="modal-error-banner">{scheduleError}</div>}

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setIsScheduleModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-submit-btn"
                  disabled={isScheduling}
                >
                  {isScheduling ? '⏳ Saving & Scheduling...' : 'Confirm & Mark on Calendar ✨'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
