import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Lock, Eye, EyeOff, AlertCircle } from 'lucide-angular';

@Component({
  selector: 'app-private-code-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './private-code-dialog.html',
})
export class PrivateCodeDialog implements OnChanges {
  readonly Lock = Lock;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly AlertCircle = AlertCircle;

  code = '';
  showCode = false;
  isShaking = false;

  @Input() open = false;
  @Input() collectionName = '';
  @Input() errorMessage: string | null = null;
  @Input() isLoading = false;
  @Output() openChange = new EventEmitter<boolean>();
  @Output() submitCode = new EventEmitter<string>();
  @Output() clearError = new EventEmitter<void>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['errorMessage']?.currentValue) {
      this.isShaking = true;
      setTimeout(() => (this.isShaking = false), 500);
    }
  }

  onSubmit(): void {
    if (this.isLoading) return;
    const result = this.code.trim();
    if (!result) return;
    this.submitCode.emit(result);
  }

  onCodeInput(): void {
    this.clearError.emit();
  }

  toggleShowCode(): void {
    this.showCode = !this.showCode;
  }

  handleOpenChange(value: boolean): void {
    if (!value) {
      this.code = '';
      this.showCode = false;
      this.clearError.emit();
    }
    this.openChange.emit(value);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onSubmit();
    }
  }
}
