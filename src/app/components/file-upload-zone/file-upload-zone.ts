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
  /** Se emite cuando se quiere eliminar un documento que ya existe en el backend (sin .file local). */
  @Output() deleteDocument = new EventEmitter<string>();
  @Input() maxFiles = 10;
  @Input() acceptedTypes = ['.pdf', '.doc', '.docx', '.txt', '.csv', '.xlsx', '.md'];

  isDragging = false;

  /** type puede ser extensión (docx, pdf) o MIME (application/pdf). */
  getFileIcon(type: string) {
    const t = type.toLowerCase();
    // PDF
    if (t === 'pdf' || t.includes('pdf')) return FileText;
    // Excel/Spreadsheets
    if (t === 'xlsx' || t === 'xls' || t === 'csv' || t.includes('spreadsheet') || t.includes('excel'))
      return FileSpreadsheet;
    // Imágenes
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(t) || t.includes('image'))
      return FileImage;
    // Word/Documentos
    if (t === 'doc' || t === 'docx' || t.includes('word') || t.includes('document'))
      return FileText;
    return File;
  }

  getFileIconColor(type: string): string {
    const t = type.toLowerCase();
    // PDF - rojo
    if (t === 'pdf' || t.includes('pdf')) return 'text-red-400';
    // Excel/Spreadsheets - verde
    if (t === 'xlsx' || t === 'xls' || t === 'csv' || t.includes('spreadsheet') || t.includes('excel'))
      return 'text-green-400';
    // Imágenes - azul
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(t) || t.includes('image'))
      return 'text-blue-400';
    // Word/Documentos - azul
    if (t === 'doc' || t === 'docx' || t.includes('word') || t.includes('document'))
      return 'text-blue-400';
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
    const file = this.files.find((f) => f.id === id);
    if (file && !file.file) {
      // Es un documento del backend (no tiene .file local) → emitir para eliminar en backend
      this.deleteDocument.emit(id);
    }
    // Siempre actualizamos la lista local
    this.filesChange.emit(this.files.filter((f) => f.id !== id));
  }

  clearAll(): void {
    this.filesChange.emit([]);
  }

  get isMaxFilesReached(): boolean {
    return this.files.length >= this.maxFiles;
  }
}
