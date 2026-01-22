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


export interface QuestionRequest {
  question: string;
}

export interface QuestionResponse {
  answer: string;
  sources?: string[];
  timestamp?: string;
}

export interface FailedFile {
  filename: string;
  error: string;
}

export interface UploadResponse {
  files_uploaded: string[];
  failed_files: FailedFile[];
  documents_indexed: number;
}
