export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: Date;
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
  session_id?: string | null;
  /** Número de resultados (k) para búsquedas en colecciones. */
  k?: number;
}

export interface QuestionResponse {
  question: string;
  answer: string;
  results: string[];
  context_used: string[];
  session_id: string;
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

export interface SessionResponse {
  session_id: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
}

/** Reemplaza con tu tipo completo cuando lo pases. */
export interface CollectionRequest {
  name: string;
  description?: string;
  is_public: boolean;
  code?: string;
}

/** Reemplaza con tu tipo completo cuando lo pases. */
export interface CollectionResponse {
  id: string;
  name: string;
  description?: string;
  is_public?: boolean;
  code?: string;
  document_count: number;
  messages: Message[];
  files?: FileData[];
  created_at?: Date;
}

export interface UnlockCollectionRequest {
  code: string;
}

export interface UnlockCollectionResponse {
  unlocked: boolean;
  access_token: string;
  token_type: string;
  /** Tiempo de expiración en segundos (viene del backend). */
  expires_in: number;
}

/** Alias para uso en componentes (sidebar, collection-view). */
export type Collection = CollectionResponse;