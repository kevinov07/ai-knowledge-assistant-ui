import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileData } from '../../lib/types';

import { LucideAngularModule, Upload, FileText, X, File, FileSpreadsheet, FileImage } from "lucide-angular";

@Component({
  selector: 'app-file-upload-zone',
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './file-upload-zone.html',
})
export class FileUploadZone {
  readonly Upload = Upload;
  readonly FileText = FileText;
  readonly X = X;
  readonly File = File;
  readonly FileSpreadsheet = FileSpreadsheet;
  readonly FileImage = FileImage;


  @Input() files: FileData[] = [];
  @Output() filesChange = new EventEmitter<FileData[]>();
  @Input() maxFiles = 10;
  @Input() acceptedTypes = ['.pdf', '.doc', '.docx', '.txt', '.csv', '.xlsx', '.md'];

  isDragging = false;

  getFileIcon(type: string) {
    if (type.includes('pdf')) return FileText;
    if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv'))
      return FileSpreadsheet;
    if (type.includes('image')) return FileImage;
    if (type.includes('word') || type.includes('document')) return FileText;
    return File;
  }

  getFileIconColor(type: string): string {
    if (type.includes('pdf')) return 'text-red-400';
    if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv'))
      return 'text-green-400';
    if (type.includes('image')) return 'text-blue-400';
    if (type.includes('word') || type.includes('document')) return 'text-blue-400';
    return 'text-muted-foreground';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  handleDragIn(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer?.items && event.dataTransfer.items.length > 0) {
      this.isDragging = true;
    }
  }

  handleDragOut(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  handleDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  handleDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer?.files) {
      const droppedFiles = Array.from(event.dataTransfer.files);
      this.addFiles(droppedFiles);
    }
  }

  addFiles(newFiles: File[]): void {
    const remainingSlots = this.maxFiles - this.files.length;
    const filesToAdd = newFiles.slice(0, remainingSlots).map((file) => ({
      id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      filename: file.name,
      size: file.size,
      type: file.type,
      file,
    }));

    this.filesChange.emit([...this.files, ...filesToAdd]);
  }

  handleFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.addFiles(Array.from(input.files));
    }
    input.value = '';
  }

  removeFile(id: string): void {
    this.filesChange.emit(this.files.filter((f) => f.id !== id));
  }

  clearAll(): void {
    this.filesChange.emit([]);
  }

  get isMaxFilesReached(): boolean {
    return this.files.length >= this.maxFiles;
  }
}
