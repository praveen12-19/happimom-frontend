const BASE_URL = 'http://localhost:8080/api';

/**
 * Sends pregnancy symptoms for zero-shot classification with facebook/bart-large-mnli
 */
export const analyzeSymptom = async (symptomText, userId = null, candidateLabels = null) => {
  const response = await fetch(`${BASE_URL}/ai/analyze-symptom`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      symptomText,
      userId,
      candidateLabels
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to analyze symptoms');
  }
  return data;
};

/**
 * Uploads prescription/receipt file to Cloudinary, saves to database, and runs AI analysis
 */
export const analyzePrescriptionFile = async (file, userId = null, notes = '') => {
  const formData = new FormData();
  formData.append('file', file);
  if (userId) {
    formData.append('userId', userId);
  }
  if (notes) {
    formData.append('notes', notes);
  }

  const response = await fetch(`${BASE_URL}/ai/upload-prescription`, {
    method: 'POST',
    body: formData
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to analyze prescription file');
  }
  return data;
};

/**
 * Direct prescription text and medication names analysis
 */
export const analyzePrescriptionText = async (prescriptionText, userId = null, additionalNotes = '') => {
  const response = await fetch(`${BASE_URL}/ai/analyze-prescription-text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prescriptionText,
      userId,
      additionalNotes
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to analyze prescription text');
  }
  return data;
};

/**
 * Conversational AI (Gemini 2.0 Flash with Groq fallback)
 * Handles casual greetings, personalized maternal advice, health guidance, and file analysis.
 */
export const chatWithAI = async (message, userId = null, history = [], fileBase64 = null, fileMimeType = null) => {
  const safeUserId = (userId && !isNaN(Number(userId))) ? Number(userId) : null;
  const response = await fetch(`${BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message,
      userId: safeUserId,
      history,
      fileBase64,
      fileMimeType
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to chat with AI');
  }
  return data;
};

/**
 * Conversational AI SSE Token Streaming (Groq Primary for Plain Text, Gemini for Vision/Files)
 * Decodes SSE stream chunks and invokes onChunk(token) progressively for instant UI rendering.
 * Falls back to non-streaming chatWithAI on error or unsupported environment.
 */
export const chatWithAIStream = async (
  message,
  userId = null,
  history = [],
  fileBase64 = null,
  fileMimeType = null,
  onChunk = () => {}
) => {
  const safeUserId = (userId && !isNaN(Number(userId))) ? Number(userId) : null;
  const payload = {
    message,
    userId: safeUserId,
    history,
    fileBase64,
    fileMimeType
  };

  try {
    const response = await fetch(`${BASE_URL}/ai/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok || !response.body) {
      throw new Error(`Streaming failed with status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let accumulatedText = '';
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep last incomplete line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;

        let content = line;
        if (line.startsWith('data:')) {
          content = line.slice(5);
        }

        if (content === '[DONE]') continue;

        if (content) {
          accumulatedText += content;
          onChunk(content);
        }
      }
    }

    // Flush any leftover buffer
    if (buffer.trim() && !buffer.startsWith(':')) {
      let content = buffer;
      if (buffer.startsWith('data:')) {
        content = buffer.slice(5);
      }
      if (content && content !== '[DONE]') {
        accumulatedText += content;
        onChunk(content);
      }
    }

    if (!accumulatedText.trim()) {
      throw new Error('Received empty stream from server');
    }

    return {
      reply: accumulatedText,
      modelUsed: 'Groq / Gemini Stream'
    };

  } catch (err) {
    console.warn('Streaming failed, falling back to non-streaming chatWithAI:', err);
    const fallbackResult = await chatWithAI(message, safeUserId, history, fileBase64, fileMimeType);
    if (fallbackResult?.reply) {
      onChunk(fallbackResult.reply);
    }
    return fallbackResult;
  }
};

