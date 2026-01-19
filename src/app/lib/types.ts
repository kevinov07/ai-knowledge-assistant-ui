export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
}
