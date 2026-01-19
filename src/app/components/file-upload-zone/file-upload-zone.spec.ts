import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileUploadZone } from './file-upload-zone';

describe('FileUploadZone', () => {
  let component: FileUploadZone;
  let fixture: ComponentFixture<FileUploadZone>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileUploadZone]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FileUploadZone);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.files).toEqual([]);
    expect(component.maxFiles).toBe(10);
    expect(component.isDragging).toBe(false);
  });

  it('should format file size correctly', () => {
    expect(component.formatFileSize(0)).toBe('0 Bytes');
    expect(component.formatFileSize(1024)).toBe('1 KB');
    expect(component.formatFileSize(1048576)).toBe('1 MB');
  });

  it('should handle drag events', () => {
    const event = new DragEvent('dragenter');
    Object.defineProperty(event, 'dataTransfer', {
      value: { items: [{ kind: 'file' }] }
    });
    
    component.handleDragIn(event);
    expect(component.isDragging).toBe(true);
    
    component.handleDragOut(event);
    expect(component.isDragging).toBe(false);
  });
});
