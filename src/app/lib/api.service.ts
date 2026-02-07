import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { QuestionResponse, UploadResponse } from './types';


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
    const body = {question: question};
    
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
   * Verifica el estado del backend
   */
  healthCheck(): Observable<any> {
    return this.http.get(`${this.apiUrl}/health`);
  }
}
