const BASE_URL = 'http://localhost:8080/api';

export const registerUser = async (email, password) => {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Registration failed');
  }
  return data;
};

export const loginUser = async (email, password) => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }
  return data;
};

export const getUserProfile = async (userId) => {
  const response = await fetch(`${BASE_URL}/users/${userId}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch user profile');
  }
  return data;
};

export const updateUserProfile = async (userId, profileData) => {
  const response = await fetch(`${BASE_URL}/users/${userId}/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(profileData)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update user profile');
  }
  return data;
};

export const uploadMedicalFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${BASE_URL}/upload/medical-file`, {
    method: 'POST',
    body: formData
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || data.message || 'Failed to upload medical file');
  }
  return data;
};

export const deleteUploadedFile = async ({ publicId, url } = {}) => {
  const params = new URLSearchParams();
  if (publicId) params.append('publicId', publicId);
  if (url) params.append('url', url);

  const response = await fetch(`${BASE_URL}/upload/file?${params.toString()}`, {
    method: 'DELETE'
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to delete file from Cloudinary');
  }
  return data;
};
