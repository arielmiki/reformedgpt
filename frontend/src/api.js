import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:8000',
})

export async function listSessions() {
  const res = await api.get('/api/chat/sessions')
  return res.data
}

export async function createSession(title) {
  const res = await api.post('/api/chat/sessions', { title })
  return res.data
}

export async function listMessages(sessionId) {
  const res = await api.get(`/api/chat/sessions/${sessionId}/messages`)
  return res.data
}

export async function sendMessage(sessionId, content, onData) {
  const response = await fetch(`${api.defaults.baseURL}/api/chat/sessions/${sessionId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });

  if (!response.body) {
    throw new Error('Response body is null');
  }

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += value;
    let boundary = buffer.lastIndexOf('\n\n');
    if (boundary === -1) continue;

    const events = buffer.substring(0, boundary).split('\n\n');
    buffer = buffer.substring(boundary + 2);

    for (const event of events) {
      if (event.startsWith('data: ')) {
        const data = JSON.parse(event.substring(6));
        onData(data);
      }
    }
  }
}
