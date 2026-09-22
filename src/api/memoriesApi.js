const BASE_URL = 'http://localhost:8080/api';

/**
 * Upload a memory file to Cloudinary and persist its record in MySQL database.
 * @param {File} file - The file object from input or dropzone
 * @param {number|string} userId - ID of the logged-in user
 * @param {string} [topic] - Optional caption, title, or category (e.g. "Ultrasound", "Baby Bump")
 */
export const uploadMemoryFile = async (file, userId, topic = '') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('userId', userId);
  if (topic) {
    formData.append('topic', topic);
  }

  const response = await fetch(`${BASE_URL}/memories/upload`, {
    method: 'POST',
    body: formData
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = { error: `Server error (${response.status}): ${response.statusText}` };
  }

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to upload memory file');
  }
  return data;
};

/**
 * Fetch all memories for a user from MySQL database.
 * @param {number|string} userId
 */
export const getUserMemories = async (userId) => {
  const response = await fetch(`${BASE_URL}/memories/user/${userId}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch memories');
  }
  return data;
};

/**
 * Delete a memory from the database.
 * @param {number|string} memoryId
 * @param {number|string} userId
 */
export const deleteUserMemory = async (memoryId, userId) => {
  const response = await fetch(`${BASE_URL}/memories/${memoryId}?userId=${userId}`, {
    method: 'DELETE'
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to delete memory');
  }
  return data;
};
