import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface QuestionRequest {
  question: string;
  files?: File[];
}

export interface QuestionResponse {
  answer: string;
  sources?: string[];
  timestamp?: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  file_ids?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Envía una pregunta al backend
   */
  askQuestion(question: string, fileIds?: string[]): Observable<QuestionResponse> {
    const body = {
      question,
      file_ids: fileIds || []
    };
    
    return this.http.post<QuestionResponse>(`${this.apiUrl}/ask`, body);
  }

  /**
   * Sube archivos al backend
   */
  uploadFiles(files: File[]): Observable<UploadResponse> {
    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append('files', file, file.name);
    });
    
    return this.http.post<UploadResponse>(`${this.apiUrl}/upload`, formData);
  }

  /**
   * Sube archivos y luego hace una pregunta
   */
  uploadAndAsk(files: File[], question: string): Observable<QuestionResponse> {
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append('files', file, file.name);
    });
    
    formData.append('question', question);
    
    return this.http.post<QuestionResponse>(`${this.apiUrl}/upload-and-ask`, formData);
  }

  /**
   * Verifica el estado del backend
   */
  healthCheck(): Observable<any> {
    return this.http.get(`${this.apiUrl}/health`);
  }
}
