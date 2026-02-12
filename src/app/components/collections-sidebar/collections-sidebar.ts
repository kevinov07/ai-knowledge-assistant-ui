import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  FolderOpen,
  Plus,
  Lock,
  ChevronLeft,
  ChevronRight,
  Search,
  FileText,
  MessageSquare,
  Trash2,
  Brain,
} from 'lucide-angular';
import { Collection } from '../../lib/types';

@Component({
  selector: 'app-collections-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './collections-sidebar.html',
})
export class CollectionsSidebar {
  readonly FolderOpen = FolderOpen;
  readonly Plus = Plus;
  readonly Lock = Lock;
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;
  readonly Search = Search;
  readonly FileText = FileText;
  readonly MessageSquare = MessageSquare;
  readonly Trash2 = Trash2;
  readonly Brain = Brain;

  searchQuery = '';

  @Input() collections: Collection[] = [];
  @Input() activeCollectionId: string | null = null;
  @Input() isCollapsed = false;
  @Output() toggleCollapse = new EventEmitter<void>();
  @Output() selectCollection = new EventEmitter<Collection>();
  @Output() createCollection = new EventEmitter<void>();
  @Output() deleteCollection = new EventEmitter<string>();
  @Output() goHome = new EventEmitter<void>();

  get filteredCollections(): Collection[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.collections;
    return this.collections.filter((c) =>
      c.name.toLowerCase().includes(q)
    );
  }

  onToggleCollapse(): void {
    this.toggleCollapse.emit();
  }

  onSelectCollection(collection: Collection): void {
    this.selectCollection.emit(collection);
  }

  onCreateCollection(): void {
    this.createCollection.emit();
  }

  onDeleteCollection(e: Event, id: string): void {
    e.stopPropagation();
    this.deleteCollection.emit(id);
  }

  isActive(collection: Collection): boolean {
    return collection.id === this.activeCollectionId;
  }

  onGoHome(): void {
    this.goHome.emit();
  }
}
