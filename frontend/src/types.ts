export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
}
