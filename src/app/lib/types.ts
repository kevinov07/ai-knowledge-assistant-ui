export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string; // ISO string
}

/**
 * Documento tal como lo devuelve el backend (DocumentListItem).
 * Viene de GET /collections/{id}/documents
 */
export interface UploadedDocument {
  id: string;
  filename: string;
  size?: number;
  created_at?: string; // ISO string from backend
  chunk_count?: number;
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
  /** Número de resultados (k) para búsquedas en colecciones. */
  k?: number;
}

export interface QuestionResponse {
  question: string;
  answer: string;
  results?: string[];
  context_used?: string[];
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
  document_count: number;
  message_count?: number;
  /** Mensajes cargados desde GET /collections/{id}/messages (no vienen en el fetch inicial) */
  messages?: Message[];
  /** Archivos cargados desde GET /collections/{id}/documents (no vienen en el fetch inicial) */
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

/** Metadatos de paginación que devuelve el backend */
export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

/** Respuesta paginada genérica */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}