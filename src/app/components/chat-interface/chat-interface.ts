import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Sparkles, User, Bot, Loader, Send } from 'lucide-angular';
import { Message } from '../../lib/types';

@Component({
  selector: 'app-chat-interface',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './chat-interface.html',
})
export class ChatInterface implements AfterViewChecked {
  readonly Sparkles = Sparkles;
  readonly User = User;
  readonly Bot = Bot;
  readonly Loader = Loader;
  readonly Send = Send;


  @Input() 
  set messages(value: Message[]) {
    console.log('🔄 ChatInterface received messages:', value.length);
    this._messages = value;
  }
  get messages(): Message[] {
    return this._messages;
  }
  private _messages: Message[] = [];

  @Input() 
  set isLoading(value: boolean) {
    console.log('🔄 ChatInterface received isLoading:', value);
    this._isLoading = value;
  }
  get isLoading(): boolean {
    return this._isLoading;
  }
  private _isLoading = false;

  @Input() hasFiles = false;
  @Output() sendMessage = new EventEmitter<string>();

  @ViewChild('messagesEnd') messagesEndRef!: ElementRef;
  @ViewChild('textarea') textareaRef!: ElementRef<HTMLTextAreaElement>;

  input = '';
  private shouldScroll = false;

  suggestedQuestions = [
    'Summarize the main points',
    'What are the key findings?',
    'Extract important dates',
    'List all mentioned names',
  ];

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  scrollToBottom(): void {
    try {
      this.messagesEndRef?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      console.error('Scroll error:', err);
    }
  }

  handleSubmit(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    if (this.input.trim() && this.hasFiles && !this.isLoading) {
      this.sendMessage.emit(this.input.trim());
      this.input = '';
      this.shouldScroll = true;
    }
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.handleSubmit();
    }
  }

  handleSuggestedQuestion(question: string): void {
    if (this.hasFiles && !this.isLoading) {
      this.sendMessage.emit(question);
      this.shouldScroll = true;
    }
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  adjustTextareaHeight(): void {
    const textarea = this.textareaRef?.nativeElement;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }
}
