import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { FileData, QuestionResponse, UploadResponse, UploadedDocument } from './types';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Envía una pregunta al backend
   */
  askQuestion(question: string): Observable<QuestionResponse> {
    const body = { question };
    return this.http.post<QuestionResponse>(`${this.apiUrl}/ask`, body);
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
