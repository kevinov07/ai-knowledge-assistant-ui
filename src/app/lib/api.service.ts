import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { FileData, QuestionRequest, QuestionResponse, SessionResponse, UploadResponse, UploadedDocument } from './types';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;
  private platformId = inject(PLATFORM_ID);

  constructor(private http: HttpClient) {}

  /**
   * Envía una pregunta al backend
   */
  askQuestion(question: string): Observable<QuestionResponse> {
    const session_id = isPlatformBrowser(this.platformId) ? localStorage.getItem('session_id') ?? undefined : undefined;
    const body: QuestionRequest = { question, session_id };
    return this.http.post<QuestionResponse>(`${this.apiUrl}/ask`, body);
  }

  /**
   * Lista de documentos del backend. Devuelve FileData[] listo para la UI.
   */
  getFiles(): Observable<FileData[]> {
    return this.http.get<unknown>(`${this.apiUrl}/documents`).pipe(
      map((list) =>
        (Array.isArray(list) ? list : []).map((doc, i) =>
          this.uploadedDocToFileData(doc as UploadedDocument, i)
        )
      )
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
   */
  uploadFiles(files: File[]): Observable<UploadResponse> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file, file.name));
    return this.http.post<UploadResponse>(`${this.apiUrl}/upload`, formData).pipe(
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

  /**
   * Verifica el estado del backend
   */
  healthCheck(): Observable<any> {
    return this.http.get(`${this.apiUrl}/health`);
  }
}
