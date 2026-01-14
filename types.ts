
export interface Message {
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
  images?: string[]; // base64 strings
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}
