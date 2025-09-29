import type { Message, Source } from '../types';

export type ChatEvent = 
  | { type: 'context'; data: Source[] }
  | { type: 'delta'; data: string };

export async function* streamChat(messages: Omit<Message, 'id'>[]): AsyncGenerator<ChatEvent> {
  const response = await fetch('http://localhost:8000/api/chat', {
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

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const eventLines = chunk.split('\n\n').filter(line => line.startsWith('data:'));

    for (const line of eventLines) {
      const jsonStr = line.replace('data: ', '');
      try {
        const event = JSON.parse(jsonStr) as ChatEvent;
        yield event;
      } catch (e) {
        console.error('Failed to parse SSE event:', jsonStr);
      }
    }
  }
}
