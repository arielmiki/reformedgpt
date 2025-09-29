export interface Source {
  content: string;
  metadata: {
    page: number;
    source: string;
  };
}

export interface Context {
  type: 'context';
  data: Source[];
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  sources?: Source[];
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
}
