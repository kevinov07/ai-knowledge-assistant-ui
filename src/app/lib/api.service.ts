import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { CollectionRequest, CollectionResponse, FileData, Message, QuestionRequest, QuestionResponse, SessionResponse, UnlockCollectionRequest, UnlockCollectionResponse, UploadResponse, UploadedDocument } from './types';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;
  private platformId = inject(PLATFORM_ID);

  constructor(private http: HttpClient) {}

  /** Token de acceso para una colección privada (cada colección tiene el suyo). */
  private getAccessToken(collectionId: string): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return sessionStorage.getItem(`access_token_${collectionId}`);
  }

  /**
   * Envía una pregunta al backend.
   * - Si se pasa collectionId, usa el endpoint protegido de esa colección:
   *   POST /collections/{collectionId}/ask con Authorization (solo si no es pública).
   * - Si no, usa el endpoint global /ask (sesión general).
   */
  askQuestion(question: string, collectionId?: string, isPublic?: boolean): Observable<QuestionResponse> {
    if (collectionId) {
      // Solo enviamos token si la colección NO es pública (token específico de esa colección)
      const token = !isPublic ? this.getAccessToken(collectionId) : null;
      const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
      const body: QuestionRequest = { question, k: 5 }; // Ajusta k según necesites
      return this.http.post<QuestionResponse>(
        `${this.apiUrl}/collections/${collectionId}/ask`,
        body,
        headers ? { headers } : undefined
      );
    }

    const session_id = isPlatformBrowser(this.platformId)
      ? localStorage.getItem('session_id') ?? undefined
      : undefined;
    const body: QuestionRequest = { question, session_id };
    return this.http.post<QuestionResponse>(`${this.apiUrl}/ask`, body);
  }

  // /**
  //  * Lista de documentos del backend. Devuelve FileData[] listo para la UI.
  //  */
  // getFiles(): Observable<FileData[]> {
  //   return this.http.get<unknown>(`${this.apiUrl}/documents`).pipe(
  //     map((list) =>
  //       (Array.isArray(list) ? list : []).map((doc, i) =>
  //         this.uploadedDocToFileData(doc as UploadedDocument, i)
  //       )
  //     )
  //   );
  // }

  /**
   * Documentos de una colección específica.
   * GET /collections/{collection_id}/documents
   * Solo envía token si la colección NO es pública.
   */
  getCollectionDocuments(collectionId: string, isPublic?: boolean): Observable<FileData[]> {
    // Solo enviamos token si la colección NO es pública (token específico de esa colección)
    const token = !isPublic ? this.getAccessToken(collectionId) : null;
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http
      .get<unknown>(`${this.apiUrl}/collections/${collectionId}/documents`, headers ? { headers } : undefined)
      .pipe(
        map((list) =>
          (Array.isArray(list) ? list : []).map((doc, i) =>
            this.uploadedDocToFileData(doc as UploadedDocument, i)
          )
        )
      );
  }

  /**
   * Mensajes de una colección específica.
   * GET /collections/{collection_id}/messages
   * Solo envía token si la colección NO es pública.
   */
  getCollectionMessages(collectionId: string, isPublic?: boolean): Observable<Message[]> {
    // Solo enviamos token si la colección NO es pública (token específico de esa colección)
    const token = !isPublic ? this.getAccessToken(collectionId) : null;
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.get<Message[]>(
      `${this.apiUrl}/collections/${collectionId}/messages`,
      headers ? { headers } : undefined
    );
  }

  /**
   * Obtiene la sesión del backend.
   */
  getSession(session_id: string): Observable<SessionResponse> {
    return this.http.get<SessionResponse>(`${this.apiUrl}/sessions/${session_id}`);
  }

  /**
   * Sube archivos al backend.
   * Backend devuelve { files_uploaded, failed_files, documents_indexed }.
   * Normalizamos files_uploaded a FileData[] para la UI.
   * Solo envía token si la colección NO es pública.
   */
  uploadFiles(files: File[], collection_Id: string, isPublic?: boolean): Observable<UploadResponse> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file, file.name));

    // Solo enviamos token si la colección NO es pública (token específico de esa colección)
    const token = !isPublic ? this.getAccessToken(collection_Id) : null;
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

    return this.http.post<UploadResponse>(`${this.apiUrl}/upload/${collection_Id}`, formData, headers ? { headers } : undefined).pipe(
      map((res) => ({
        files_uploaded: res.files_uploaded.map((doc, i) => this.uploadedDocToFileData(doc, i)),
        failed_files: res.failed_files,
        documents_indexed: res.documents_indexed,
      }))
    );
  }


  /** UploadedDocument (id, filename) → FileData. Mismo nombre de campo, sin mapeo name/filename. */
  private uploadedDocToFileData(doc: UploadedDocument, index: number): FileData {
    const id = String(doc.id ?? '').trim() || `doc-${index}`;
    const ext = doc.filename.split('.').pop() ?? '';
    return {
      id,
      filename: doc.filename,
      type: ext,
      size: Number(doc.size ?? 0),
    };
  }

  createCollection(collection: CollectionRequest): Observable<CollectionResponse> {
    return this.http.post<unknown>(`${this.apiUrl}/collections`, collection).pipe(
      map((raw) => this.rawToCollection((raw ?? {}) as Record<string, unknown>, 0))
    );
  }

  unlockCollection(collectionId: string, code: string): Observable<UnlockCollectionResponse> {

    console.log("entra a unlockCollection");
    const payload: UnlockCollectionRequest = { code };
    return this.http
      .post<UnlockCollectionResponse>(
        `${this.apiUrl}/collections/${collectionId}/unlock`,
        payload
      )
      .pipe(
        tap((res) => {
          // Guardamos el token por colección (cada privada tiene el suyo)
          if (res?.access_token && isPlatformBrowser(this.platformId)) {
            sessionStorage.setItem(`access_token_${collectionId}`, res.access_token);
          }
        })
      );
  }

  /**
   * Lista de colecciones del backend. Se llama al cargar la app.
   */
  getCollections(): Observable<CollectionResponse[]> {
    return this.http.get<unknown>(`${this.apiUrl}/collections`).pipe(
      map((raw) => {
        const list = Array.isArray(raw) ? raw : [];
        return list.map((row: Record<string, unknown>, i: number) => this.rawToCollection(row, i));
      })
    );
  }

  /** Convierte un ítem crudo del backend a Collection. */
  private rawToCollection(row: Record<string, unknown>, index: number): CollectionResponse {
    const id = String(row['id'] ?? '').trim() || `collection-${index}`;
    const messages = Array.isArray(row['messages']) ? (row['messages'] as unknown[]) : [];
    const files = Array.isArray(row['files']) ? (row['files'] as FileData[]) : [];
    return {
      id,
      name: String(row['name'] ?? ''),
      description: row['description'] != null ? String(row['description']) : undefined,
      is_public: Boolean(row['is_public'] ?? false),
      code: row['code'] != null ? String(row['code']) : undefined,
      document_count: Number(row['document_count'] ?? 0),
      messages: messages as CollectionResponse['messages'],
      files: files.length ? files : undefined,
      created_at: row['created_at'] != null ? new Date(String(row['created_at'])) : undefined,
    };
  }

  /**
   * Verifica el estado del backend
   */
  healthCheck(): Observable<any> {
    return this.http.get(`${this.apiUrl}/health`);
  }
}
