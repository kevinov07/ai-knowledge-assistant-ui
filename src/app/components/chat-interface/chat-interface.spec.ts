import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatInterface } from './chat-interface';

describe('ChatInterface', () => {
  let component: ChatInterface;
  let fixture: ComponentFixture<ChatInterface>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatInterface]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatInterface);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.messages).toEqual([]);
    expect(component.isLoading).toBe(false);
    expect(component.hasFiles).toBe(false);
    expect(component.input).toBe('');
  });

  it('should have suggested questions', () => {
    expect(component.suggestedQuestions.length).toBe(4);
    expect(component.suggestedQuestions[0]).toBe('Summarize the main points');
  });

  it('should format time correctly', () => {
    const date = new Date('2024-01-01T14:30:00');
    const formatted = component.formatTime(date);
    expect(formatted).toContain('2:30');
  });

  it('should emit sendMessage when handleSubmit is called with valid input', () => {
    spyOn(component.sendMessage, 'emit');
    component.input = 'Test message';
    component.hasFiles = true;
    component.isLoading = false;

    component.handleSubmit();

    expect(component.sendMessage.emit).toHaveBeenCalledWith('Test message');
    expect(component.input).toBe('');
  });

  it('should not emit sendMessage when input is empty', () => {
    spyOn(component.sendMessage, 'emit');
    component.input = '   ';
    component.hasFiles = true;

    component.handleSubmit();

    expect(component.sendMessage.emit).not.toHaveBeenCalled();
  });

  it('should not emit sendMessage when hasFiles is false', () => {
    spyOn(component.sendMessage, 'emit');
    component.input = 'Test message';
    component.hasFiles = false;

    component.handleSubmit();

    expect(component.sendMessage.emit).not.toHaveBeenCalled();
  });

  it('should handle suggested question click', () => {
    spyOn(component.sendMessage, 'emit');
    component.hasFiles = true;
    component.isLoading = false;

    component.handleSuggestedQuestion('Test question');

    expect(component.sendMessage.emit).toHaveBeenCalledWith('Test question');
  });
});
