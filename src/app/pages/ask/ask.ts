import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileUploadZone } from '../../components/file-upload-zone/file-upload-zone';
import { ChatInterface } from '../../components/chat-interface/chat-interface';
import { LucideAngularModule, Brain, FileStack, Clock, MessageSquare, Zap, Shield } from 'lucide-angular';
import { FeatureCardComponent } from '../../ui/feature-card/feature-card';
import { Message, UploadedFile } from '../../lib/types';
import { ApiService } from '../../lib/api.service';


@Component({
  selector: 'app-ask',
  imports: [CommonModule, FileUploadZone, ChatInterface, LucideAngularModule, FeatureCardComponent],
  templateUrl: './ask.html',
  styleUrl: './ask.css',
})
export class Ask {
  readonly Brain = Brain;
  readonly FileStack = FileStack;
  readonly Clock = Clock;
  readonly MessageSquare = MessageSquare;
  readonly Zap = Zap;
  readonly Shield = Shield;

  files: UploadedFile[] = [];
  messages: Message[] = [];
  isLoading = false;
  uploadedFileIds: string[] = []; // IDs de archivos subidos al backend

  constructor(
    private cdr: ChangeDetectorRef,
    private apiService: ApiService
  ) {}

  onFilesChange(newFiles: UploadedFile[]): void {
    this.files = newFiles;
    
    // Si se agregan nuevos archivos, subirlos al backend
    if (newFiles.length > 0) {
      this.uploadFilesToBackend();
    }
  }

  /**
   * Sube archivos al backend
   */
  private uploadFilesToBackend(): void {
    const filesToUpload = this.files.map(f => f.file);
    
    if (filesToUpload.length === 0) return;

    console.log('📤 Uploading files to backend:', filesToUpload.map(f => f.name));
    
    this.apiService.uploadFiles(filesToUpload).subscribe({
      next: (response) => {
        console.log("respuesta del backend", response);
        console.log("response.success", response);
        // if (response.files_uploaded) {
        //   console.log("entra al if");
        //   this.uploadedFileIds = response.files_uploaded.map(f => f.id);
        // }
        console.log('✅ Files uploaded successfully:', response);
      },
      error: (error) => {
        console.error('❌ Error uploading files:', error);
        // Podrías mostrar un mensaje de error al usuario aquí
      }
    });
  }

  handleSendMessage(content: string): void {
    console.log('📨 handleSendMessage called with:', content);
    
    // 1. Agregar mensaje del usuario
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    this.messages = [...this.messages, userMessage];
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
    console.log('✅ Backend response received:', response);
    
    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: response.answer || response.content || 'No response from backend',
      timestamp: new Date(),
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
      timestamp: new Date(),
    };
    
    this.messages = [...this.messages, errorMessage];
    this.isLoading = false;
    this.cdr.detectChanges();
  }
}
