const BASE_URL = 'http://localhost:8080/api';

/**
 * Fetch all appointments for a user
 */
export const getUserAppointments = async (userId) => {
  if (!userId) return [];
  try {
    const response = await fetch(`${BASE_URL}/appointments/user/${userId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch appointments: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('getUserAppointments error:', error);
    return [];
  }
};

/**
 * Manually create an appointment
 */
export const createAppointment = async (appointmentData) => {
  const response = await fetch(`${BASE_URL}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(appointmentData)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to create appointment');
  }
  return data;
};

/**
 * Update an existing appointment
 */
export const updateAppointment = async (id, appointmentData) => {
  const response = await fetch(`${BASE_URL}/appointments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(appointmentData)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to update appointment');
  }
  return data;
};

/**
 * Delete an appointment
 */
export const deleteAppointment = async (id, userId) => {
  const response = await fetch(`${BASE_URL}/appointments/${id}?userId=${userId}`, {
    method: 'DELETE'
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to delete appointment');
  }
  return data;
};

/**
 * Upload prescription / appointment slip to Cloudinary and schedule the appointment
 */
export const uploadPrescriptionAndSchedule = async ({
  file,
  userId,
  notes = '',
  appointmentDate = '',
  appointmentTime = '',
  doctorName = '',
  purpose = ''
}) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('userId', userId);
  if (notes) formData.append('notes', notes);
  if (appointmentDate) formData.append('appointmentDate', appointmentDate);
  if (appointmentTime) formData.append('appointmentTime', appointmentTime);
  if (doctorName) formData.append('doctorName', doctorName);
  if (purpose) formData.append('purpose', purpose);

  const response = await fetch(`${BASE_URL}/appointments/upload-prescription`, {
    method: 'POST',
    body: formData
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to upload prescription and schedule appointment');
  }
  return data;
};

/**
 * Upload post-consultation doctor report to Cloudinary and get AI explanation
 */
export const uploadDoctorReportAndExplain = async ({
  appointmentId,
  file,
  userId,
  notes = ''
}) => {
  const formData = new FormData();
  formData.append('file', file);
  if (userId) formData.append('userId', userId);
  if (notes) formData.append('notes', notes);

  const response = await fetch(`${BASE_URL}/appointments/${appointmentId}/upload-report`, {
    method: 'POST',
    body: formData
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to upload doctor report');
  }
  return data;
};
