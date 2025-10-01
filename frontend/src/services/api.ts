import type { Message, Source } from '../types';

// API base URL from Vite env; fallback to localhost for dev
const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:8000';

export type ChatEvent = 
  | { type: 'context'; data: Source[] }
  | { type: 'delta'; data: string };

export async function* streamChat(messages: Omit<Message, 'id'>[]): AsyncGenerator<ChatEvent> {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages }),
  });

  if (!response.body) {
    throw new Error('No response body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let eventData = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? '';

    for (const rawLine of lines) {
      const line = rawLine; // already split without newline characters

      if (line === '') {
        if (eventData) {
          const jsonStr = eventData;
          try {
            const event = JSON.parse(jsonStr) as ChatEvent;
            yield event;
          } catch (e) {
            console.error('Failed to parse SSE event:', jsonStr, e);
          }
          eventData = '';
        }
        continue;
      }

      if (line.startsWith(':')) continue;

      if (line.startsWith('data:')) {
        const dataPart = line.slice(5).replace(/^\s/, '');
        eventData = eventData ? `${eventData}\n${dataPart}` : dataPart;
        continue;
      }
    }
  }

  if (eventData) {
    const jsonStr = eventData;
    try {
      const event = JSON.parse(jsonStr) as ChatEvent;
      yield event;
    } catch (e) {
      console.error('Failed to parse SSE event at stream end:', jsonStr, e);
    }
  }
}
