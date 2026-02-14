import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { CollectionRequest, CollectionResponse, FileData, Message, PaginatedResponse, PaginationMeta, QuestionRequest, QuestionResponse, UnlockCollectionRequest, UnlockCollectionResponse, UploadResponse, UploadedDocument } from './types';

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
   * POST /collections/{collectionId}/ask con Authorization (solo si no es pública).
   */
  askQuestion(question: string, collectionId: string, isPublic?: boolean): Observable<QuestionResponse> {
    // Solo enviamos token si la colección NO es pública (token específico de esa colección)
    const token = !isPublic ? this.getAccessToken(collectionId) : null;
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    const body: QuestionRequest = { question, k: 5 };
    return this.http.post<QuestionResponse>(
      `${this.apiUrl}/collections/${collectionId}/ask`,
      body,
      headers ? { headers } : undefined
    );
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
    const token = !isPublic ? this.getAccessToken(collectionId) : null;
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http
      .get<unknown>(`${this.apiUrl}/collections/${collectionId}/documents`, headers ? { headers } : undefined)
      .pipe(
        map((raw) => {
          const list = Array.isArray(raw)
            ? raw
            : (raw && typeof raw === 'object' && (Array.isArray((raw as any).documents)
                ? (raw as any).documents
                : Array.isArray((raw as any).items) ? (raw as any).items : Array.isArray((raw as any).data) ? (raw as any).data : []));
          return (Array.isArray(list) ? list : []).map((doc, i) =>
            this.uploadedDocToFileData(doc as UploadedDocument, i)
          );
        })
      );
  }

  /**
   * Mensajes de una colección específica.
   * GET /collections/{collection_id}/messages
   * Solo envía token si la colección NO es pública.
   */
  getCollectionMessages(collectionId: string, isPublic?: boolean): Observable<Message[]> {
    const token = !isPublic ? this.getAccessToken(collectionId) : null;
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http
      .get<unknown>(`${this.apiUrl}/collections/${collectionId}/messages`, headers ? { headers } : undefined)
      .pipe(
        map((raw) => {
          if (Array.isArray(raw)) return raw as Message[];
          if (raw && typeof raw === 'object') {
            const arr = (raw as any).messages ?? (raw as any).items ?? (raw as any).data;
            return Array.isArray(arr) ? arr : [];
          }
          return [];
        })
      );
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


  /** UploadedDocument (id, filename) → FileData. Extrae extensión para type. */
  private uploadedDocToFileData(doc: UploadedDocument, index: number): FileData {
    const id = String(doc.id ?? '').trim() || `doc-${index}`;
    const ext = doc.filename.split('.').pop() ?? '';
    return {
      id,
      filename: doc.filename,
      type: ext,
      size: Number(doc.size ?? 0),
      chunk_count: doc.chunk_count,
      created_at: doc.created_at,
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
   * Lista de colecciones del backend con paginación.
   * GET /collections?page=1&page_size=10
   */
  getCollections(page = 1, pageSize = 10): Observable<PaginatedResponse<CollectionResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());
    return this.http
      .get<{ items: unknown[]; pagination: PaginationMeta }>(`${this.apiUrl}/collections`, { params })
      .pipe(
        map((raw) => ({
          items: (Array.isArray(raw.items) ? raw.items : []).map((row: unknown, i: number) =>
            this.rawToCollection(row as Record<string, unknown>, i)
          ),
          pagination: raw.pagination,
        }))
      );
  }

  /** Convierte un ítem crudo del backend a Collection. */
  private rawToCollection(row: Record<string, unknown>, index: number): CollectionResponse {
    const id = String(row['id'] ?? '').trim() || `collection-${index}`;
    return {
      id,
      name: String(row['name'] ?? ''),
      description: row['description'] != null ? String(row['description']) : undefined,
      is_public: Boolean(row['is_public'] ?? false),
      document_count: Number(row['document_count'] ?? 0),
      message_count: row['message_count'] != null ? Number(row['message_count']) : undefined,
      created_at: row['created_at'] != null ? new Date(String(row['created_at'])) : undefined,
      // messages y files NO vienen en el fetch inicial, se cargan después con loadCollectionDetails
    };
  }

  /**
   * Elimina una colección completa.
   * DELETE /collections/{collection_id}
   * Solo envía token si la colección NO es pública.
   */
  deleteCollection(collectionId: string, isPublic?: boolean): Observable<void> {
    const token = !isPublic ? this.getAccessToken(collectionId) : null;
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.delete<void>(
      `${this.apiUrl}/collections/${collectionId}`,
      headers ? { headers } : undefined
    );
  }

  /**
   * Elimina un documento específico de una colección.
   * DELETE /collections/{collection_id}/documents/{document_id}
   * Solo envía token si la colección NO es pública.
   */
  deleteDocument(collectionId: string, documentId: string, isPublic?: boolean): Observable<void> {
    const token = !isPublic ? this.getAccessToken(collectionId) : null;
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.delete<void>(
      `${this.apiUrl}/collections/${collectionId}/documents/${documentId}`,
      headers ? { headers } : undefined
    );
  }

  /**
   * Verifica el estado del backend
   */
  healthCheck(): Observable<any> {
    return this.http.get(`${this.apiUrl}/health`);
  }
}
