export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/**
 * Documento tal como lo devuelve el backend (UploadedDocument en Pydantic).
 * id + filename siempre; size opcional (upload no lo envía, GET /documents sí puede).
 */
export interface UploadedDocument {
  id: string;
  filename: string;
  size?: number;
}

/**
 * Documento en la UI: mismo nombre de campos que el backend (filename).
 * Puede venir del backend (sin `file`) o ser un archivo recién elegido (con `file`).
 */
export interface FileData extends UploadedDocument {
  type?: string;
  /** Solo presente cuando el usuario acaba de elegir el archivo y aún no se ha subido. */
  file?: File;
  chunk_count?: number;
  created_at?: string;
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

/** Respuesta de upload normalizada para la UI (files_uploaded como FileData[]). */
export interface UploadResponse {
  files_uploaded: FileData[];
  failed_files: FailedFile[];
  documents_indexed: number;
}
