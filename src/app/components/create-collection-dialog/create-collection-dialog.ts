import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Lock, FolderOpen, Eye, EyeOff } from 'lucide-angular';
import { CollectionRequest } from '../../lib/types';
@Component({
  selector: 'app-create-collection-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './create-collection-dialog.html',
})
export class CreateCollectionDialog {
  readonly Lock = Lock;
  readonly FolderOpen = FolderOpen;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;

  name = '';
  description = '';
  isPublic = false;
  code = '';
  showCode = false;

  @Input() open = false;
  @Output() openChange = new EventEmitter<boolean>();
  @Output() createCollection = new EventEmitter<CollectionRequest>();

  get canCreate(): boolean {
    if (!this.name.trim()) return false;
    if (!this.isPublic && !this.code.trim()) return false;
    return true;
  }

  handleCreate(): void {
    if (!this.canCreate) return;
    this.createCollection.emit({
      name: this.name.trim(),
      description: this.description.trim(),
      is_public: this.isPublic,
      code: this.isPublic ? undefined : this.code.trim(),
    });
    this.reset();
    this.openChange.emit(false);
  }

  handleOpenChange(value: boolean): void {
    if (!value) this.reset();
    this.openChange.emit(value);
  }

  toggleShowCode(): void {
    this.showCode = !this.showCode;
  }

  private reset(): void {
    this.name = '';
    this.description = '';
    this.isPublic = false;
    this.code = '';
    this.showCode = false;
  }
}
