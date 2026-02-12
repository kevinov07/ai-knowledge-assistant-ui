import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Brain, FolderOpen, Lock, FileText, MessageSquare, ArrowRight, Plus } from 'lucide-angular';
import { CollectionResponse } from '../../lib/types';

@Component({
  selector: 'app-welcome-view',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './welcome-view.html',
})
export class WelcomeView {
  readonly Brain = Brain;
  readonly FolderOpen = FolderOpen;
  readonly Lock = Lock;
  readonly FileText = FileText;
  readonly MessageSquare = MessageSquare;
  readonly ArrowRight = ArrowRight;
  readonly Plus = Plus;

  @Input() collections: CollectionResponse[] = [];
  @Output() selectCollection = new EventEmitter<CollectionResponse>();
  @Output() createCollection = new EventEmitter<void>();

  onSelectCollection(collection: CollectionResponse): void {
    this.selectCollection.emit(collection);
  }

  onCreateCollection(): void {
    this.createCollection.emit();
  }
}
