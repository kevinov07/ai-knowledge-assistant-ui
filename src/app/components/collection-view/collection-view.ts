import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileUploadZone } from '../file-upload-zone/file-upload-zone';
import { ChatInterface } from '../chat-interface/chat-interface';
import { FeatureCardComponent } from '../../ui/feature-card/feature-card';
import {
  LucideAngularModule,
  FileStack,
  MessageSquare,
  Zap,
  Shield,
  Clock,
  Lock,
  ArrowLeft,
} from 'lucide-angular';
import { Collection, Message, FileData } from '../../lib/types';

@Component({
  selector: 'app-collection-view',
  standalone: true,
  imports: [
    CommonModule,
    FileUploadZone,
    ChatInterface,
    LucideAngularModule,
    FeatureCardComponent,
  ],
  templateUrl: './collection-view.html',
})
export class CollectionView {
  readonly FileStack = FileStack;
  readonly MessageSquare = MessageSquare;
  readonly Zap = Zap;
  readonly Shield = Shield;
  readonly Clock = Clock;
  readonly Lock = Lock;
  readonly ArrowLeft = ArrowLeft;

  @Input() collection!: Collection;
  @Input() isLoading = false;
  @Output() updateCollection = new EventEmitter<Collection>();
  @Output() uploadRequest = new EventEmitter<File[]>();
  @Output() sendMessage = new EventEmitter<string>();
  @Output() back = new EventEmitter<void>();
  @Output() deleteDocument = new EventEmitter<string>();

  get files(): FileData[] {
    return this.collection.files ?? [];
  }

  get messages(): Message[] {
    const list = this.collection?.messages;
    return Array.isArray(list) ? list : [];
  }

  onFilesChange(files: FileData[]): void {
    this.updateCollection.emit({
      ...this.collection,
      files,
      document_count: files.length,
    });
    const toUpload = files.filter((f) => f.file).map((f) => f.file!);
    if (toUpload.length > 0) {
      this.uploadRequest.emit(toUpload);
    }
  }

  onSendMessage(content: string): void {
    this.sendMessage.emit(content);
  }

  onBack(): void {
    this.back.emit();
  }

  onDeleteDocument(documentId: string): void {
    this.deleteDocument.emit(documentId);
  }
}
