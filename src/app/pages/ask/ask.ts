import { Component, ChangeDetectorRef, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FileUploadZone } from '../../components/file-upload-zone/file-upload-zone';
import { ChatInterface } from '../../components/chat-interface/chat-interface';
import { LucideAngularModule, Brain, FileStack, Clock, MessageSquare, Zap, Shield } from 'lucide-angular';
import { FeatureCardComponent } from '../../ui/feature-card/feature-card';
import { Message, FileData, SessionResponse } from '../../lib/types';
import { ApiService } from '../../lib/api.service';

@Component({
  selector: 'app-ask',
  imports: [CommonModule, FileUploadZone, ChatInterface, LucideAngularModule, FeatureCardComponent],
  templateUrl: './ask.html',
  styleUrl: './ask.css',
})
export class Ask implements OnInit {
  readonly Brain = Brain;
  readonly FileStack = FileStack;
  readonly Clock = Clock;
  readonly MessageSquare = MessageSquare;
  readonly Zap = Zap;
  readonly Shield = Shield;

  files: FileData[] = [];
  messages: Message[] = [];
  isLoading = false;
  uploadedFileIds: string[] = [];
  sessionId: string | null = null;

  private cdr = inject(ChangeDetectorRef);
  private apiService = inject(ApiService);
  private platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    this.apiService.getFiles().subscribe((files) => {
      this.files = files;
    });

    if (!isPlatformBrowser(this.platformId)) return;

    const session_id = localStorage.getItem('session_id');
    this.sessionId = session_id;

    if (this.sessionId) {
      console.log('🔍 Getting session from backend:', this.sessionId);
      this.apiService.getSession(this.sessionId).subscribe((session) => {
        console.log('✅ Session received:', session);
        this.sessionId = session.session_id;
        this.messages = session.messages;
        this.cdr.detectChanges();
      });
    }
  }

  onFilesChange(newFiles: FileData[]): void {
    this.files = newFiles;
    
    // Si se agregan nuevos archivos, subirlos al backend
    if (newFiles.length > 0) {
      this.uploadFilesToBackend();
    }
  }

  /**
   * Sube archivos al backend (solo los que tienen .file; los del fetch no tienen).
   */
  private uploadFilesToBackend(): void {
    const filesToUpload = this.files
      .filter((f): f is FileData & { file: File } => !!f.file)
      .map((f) => f.file);

    if (filesToUpload.length === 0) return;

    console.log('📤 Uploading files to backend:', filesToUpload.map(f => f.name));
    
    this.apiService.uploadFiles(filesToUpload).subscribe({
      next: (response) => {
        console.log('✅ Files uploaded successfully:', response);
        const existingFromServer = this.files.filter((f) => !f.file);
        this.files = [...existingFromServer, ...response.files_uploaded];
      },
      error: (error) => {
        console.error('❌ Error uploading files:', error);
        // Podrías mostrar un mensaje de error al usuario aquí
        this.files = this.files.filter((f) => !f.file);
      },
    });
  }

  handleSendMessage(content: string): void {
    console.log('📨 handleSendMessage called with:', content);
    
    // 1. Agregar mensaje del usuario
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      created_at: new Date(),
    };

    this.messages = [...this.messages, userMessage];
    console.log('🔍 Messages:', this.messages);
    this.isLoading = true;
    
    console.log('✅ User message added, isLoading set to:', this.isLoading);
    console.log('📊 Current state:', { 
      messagesCount: this.messages.length, 
      isLoading: this.isLoading,
      filesCount: this.files.length,
      uploadedFileIds: this.uploadedFileIds
    });


    this.apiService.askQuestion(content).subscribe({
      next: (response) => {
        this.handleBackendResponse(response);
      },
      error: (error) => {
        this.handleBackendError(error);
      }
    });
  }

  private handleBackendResponse(response: any): void {
    if (isPlatformBrowser(this.platformId) && response.session_id) {
      
      localStorage.setItem('session_id', response.session_id);
    }
    this.sessionId = response.session_id;

    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: response.answer || response.content || 'No response from backend',
      created_at: new Date(),
    };
    
    this.messages = [...this.messages, assistantMessage];
    this.isLoading = false;
    this.cdr.detectChanges();
    
    console.log('🎉 Assistant message added');
  }

  private handleBackendError(error: any): void {
    console.error('❌ Backend error:', error);
    
    const errorMessage: Message = {
      id: `error-${Date.now()}`,
      role: 'assistant',
      content: `Lo siento, hubo un error al conectar con el backend:\n\n${error.message || 'Error desconocido'}\n\nPor favor, asegúrate de que el servidor backend está ejecutándose en http://localhost:8000`,
      created_at: new Date(),
    };
    
    this.messages = [...this.messages, errorMessage];
    this.isLoading = false;
    this.cdr.detectChanges();
  }
}
