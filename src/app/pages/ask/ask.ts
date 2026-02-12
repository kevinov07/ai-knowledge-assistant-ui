import { Component, ChangeDetectorRef, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { CollectionsSidebar } from '../../components/collections-sidebar/collections-sidebar';
import { CollectionView } from '../../components/collection-view/collection-view';
import { WelcomeView } from '../../components/welcome-view/welcome-view';
import { CreateCollectionDialog } from '../../components/create-collection-dialog/create-collection-dialog';
import { PrivateCodeDialog } from '../../components/private-code-dialog/private-code-dialog';
import { ApiService } from '../../lib/api.service';
import { CollectionRequest, CollectionResponse, FileData, Message } from '../../lib/types';

@Component({
  selector: 'app-ask',
  standalone: true,
  imports: [
    CommonModule,
    CollectionsSidebar,
    CollectionView,
    WelcomeView,
    CreateCollectionDialog,
    PrivateCodeDialog,
  ],
  templateUrl: './ask.html',
  styleUrl: './ask.css',
})
export class Ask implements OnInit {
  collections: CollectionResponse[] = [];
  /** Archivos y mensajes de la sesión global (cuando no hay colección activa). */
  files: FileData[] = [];
  messages: Message[] = [];
  isLoading = false;
  uploadedFileIds: string[] = [];
  sessionId: string | null = null;

  private cdr = inject(ChangeDetectorRef);
  private api = inject(ApiService);
  private platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    this.api.getCollections().subscribe((list) => {
      this.collections = list;
      // Restaurar colección activa desde sessionStorage (si existe y sigue disponible)
      if (isPlatformBrowser(this.platformId)) {
        const savedId = sessionStorage.getItem('active_collection_id');
        if (savedId) {
          const found = this.collections.find((c) => c.id === savedId);
          if (found) {
            this.activeCollectionId = savedId;
            // Si no es pública, asumimos que ya estaba desbloqueada en esta sesión
            if (!found.is_public) {
              this.unlockedCollectionIds = new Set(this.unlockedCollectionIds).add(savedId);
            }
            // Cargar siempre el detalle actualizado (documentos, mensajes, etc.)
            this.loadCollectionDetails(savedId);
          } else {
            sessionStorage.removeItem('active_collection_id');
          }
        }
      }
    });
      // this.api.getFiles().subscribe((files) => {
      //   this.files = files;
      // });

    if (!isPlatformBrowser(this.platformId)) return;

    const session_id = localStorage.getItem('session_id');
    this.sessionId = session_id;

    if (this.sessionId) {
      this.api.getSession(this.sessionId).subscribe((session) => {
        this.sessionId = session.session_id;
        const raw = session.messages ?? [];
        this.messages = raw.map((m) => {
          const msg = m as Message;
          return {
            ...msg,
            created_at: msg.created_at instanceof Date ? msg.created_at : new Date(String(msg.created_at)),
          };
        }) as Message[];
        this.cdr.detectChanges();
      });
    }
  }

  /** Colección virtual para la vista de sesión (sin colección seleccionada). */
  get sessionCollection(): CollectionResponse {
    return {
      id: 'session',
      name: 'Chat',
      document_count: this.files.length,
      messages: this.messages,
      files: this.files.length ? this.files : undefined,
    };
  }

  activeCollectionId: string | null = null;
  sidebarCollapsed = false;
  showCreateDialog = false;
  pendingPrivateCollection: CollectionResponse | null = null;
  unlockedCollectionIds = new Set<string>();
  privateCodeError: string | null = null;
  isUnlocking = false;

  get activeCollection(): CollectionResponse | null {
    return this.collections.find((c) => c.id === this.activeCollectionId) ?? null;
  }

  /** Carga detalles frescos de una colección (documentos, mensajes, etc.) desde el backend. */
  private loadCollectionDetails(collectionId: string): void {
    const base = this.collections.find((c) => c.id === collectionId);
    if (!base) return;

    const isPublic = base.is_public ?? false;

    this.api.getCollectionDocuments(collectionId, isPublic).subscribe((files) => {
      this.api.getCollectionMessages(collectionId, isPublic).subscribe((msgs) => {
        const normalizedMessages: Message[] = (msgs ?? []).map((m) => ({
          ...m,
          created_at: m.created_at instanceof Date ? m.created_at : new Date(String(m.created_at)),
        }));

        const updated: CollectionResponse = {
          ...base,
          files,
          messages: normalizedMessages,
          document_count: files.length,
        };
        this.onUpdateCollection(updated);
        this.cdr.detectChanges();
      });
    });
  }

  onSelectCollection(collection: CollectionResponse): void {
    if (!collection.is_public && !this.unlockedCollectionIds.has(collection.id)) {
      this.pendingPrivateCollection = collection;
      this.privateCodeError = null;
      return;
    }
    this.activeCollectionId = collection.id;
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem('active_collection_id', collection.id);
    }
    // Siempre que entramos a una colección, pedimos su detalle actualizado
    this.loadCollectionDetails(collection.id);
  }

  onCreateCollection(): void {
    this.showCreateDialog = true;
  }

  onCreatedCollection(data: CollectionRequest): void {
    console.log(data);
    console.log("entra a crear la colección");
    this.api.createCollection(data).subscribe((response) => {
      this.collections = [response, ...this.collections];
      console.log(this.collections);
      if (data.is_public) {
        this.unlockedCollectionIds = new Set(this.unlockedCollectionIds).add(response.id);
      }
      this.activeCollectionId = response.id;
      if (isPlatformBrowser(this.platformId)) {
        sessionStorage.setItem('active_collection_id', response.id);
      }
      // Cargamos inmediatamente el detalle de la colección recién creada
      this.loadCollectionDetails(response.id);
      this.cdr.detectChanges();
    });
    this.showCreateDialog = false;
    console.log("despues de crear la colección");
    console.log(this.collections);
  }

  onDeleteCollection(id: string): void {
    this.collections = this.collections.filter((c) => c.id !== id);
    if (this.activeCollectionId === id) {
      this.activeCollectionId = null;
      if (isPlatformBrowser(this.platformId)) {
        sessionStorage.removeItem('active_collection_id');
      }
    }
  }

  onUpdateCollection(updated: CollectionResponse): void {
    this.collections = this.collections.map((c) => (c.id === updated.id ? updated : c));
  }

  onBack(): void {
    this.activeCollectionId = null;
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem('active_collection_id');
    }
  }

  onGoHome(): void {
    this.activeCollectionId = null;
    this.pendingPrivateCollection = null;
    this.privateCodeError = null;
    this.isUnlocking = false;
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem('active_collection_id');
    }
  }

  /** Sube archivos al backend (desde sesión o colección activa). */
  onUploadFiles(files: File[]): void {
    console.log(this.activeCollectionId);
    if (files.length === 0) return;
    const current = this.activeCollection
    if (current) {
      const isPublic = current.is_public ?? false;
      this.api.uploadFiles(files, current.id, isPublic).subscribe({
        next: (res) => {
          const currentFiles = current.files ?? [];
          const withoutTemp = currentFiles.filter((f) => !f.file);
          const newFiles = [...withoutTemp, ...res.files_uploaded];
          this.onUpdateCollection({
            ...current,
            files: newFiles,
            document_count: newFiles.length,
          });
          this.cdr.detectChanges();
        },
        error: () => {
          const withoutTemp = (current.files ?? []).filter((f) => !f.file);
          this.onUpdateCollection({
            ...current,
            files: withoutTemp,
            document_count: withoutTemp.length,
          });
          this.cdr.detectChanges();
        },
      });
    } else {
      this.uploadFilesToBackend();
    }
  }

  /**
   * Sube archivos al backend (solo los que tienen .file; los del fetch no tienen).
   * Usado para la sesión global (sin colección activa).
   */
  private uploadFilesToBackend(): void {
    const filesToUpload = this.files
      .filter((f): f is FileData & { file: File } => !!f.file)
      .map((f) => f.file);

    if (filesToUpload.length === 0) return;

    const current = this.activeCollection;
    if (current && current.id) {
      const isPublic = current.is_public ?? false;
      this.api.uploadFiles(filesToUpload, current.id, isPublic).subscribe({
        next: (response) => {
          const existingFromServer = this.files.filter((f) => !f.file);
          this.files = [...existingFromServer, ...response.files_uploaded];
          this.cdr.detectChanges();
        },
        error: () => {
          this.files = this.files.filter((f) => !f.file);
          this.cdr.detectChanges();
        },
      });
    }
  }

  /** Envía pregunta al backend y actualiza mensajes (sesión o colección activa). */
  onAskQuestion(content: string): void {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      created_at: new Date(),
    };
    const current = this.activeCollection;
    if (current) {
      this.onUpdateCollection({
        ...current,
        messages: [...(current.messages ?? []), userMessage],
      });
    } else {
      this.messages = [...this.messages, userMessage];
    }
    this.isLoading = true;
    this.cdr.detectChanges();

    const isPublic = current?.is_public ?? false;
    this.api.askQuestion(content, current?.id, isPublic).subscribe({
      next: (response) => this.handleBackendResponse(response, current),
      error: (error) => this.handleBackendError(error, current),
    });
  }

  private handleBackendResponse(response: { session_id?: string; answer?: string; content?: string }, current: CollectionResponse | null): void {
    if (isPlatformBrowser(this.platformId) && response.session_id) {
      localStorage.setItem('session_id', response.session_id);
    }
    this.sessionId = response.session_id ?? this.sessionId;

    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: response.answer ?? response.content ?? 'No response from backend',
      created_at: new Date(),
    };

    if (current) {
      const updated = this.collections.find((c) => c.id === current.id);
      const list = updated ? [...(updated.messages ?? []), assistantMessage] : [assistantMessage];
      this.onUpdateCollection({
        ...(updated ?? current),
        messages: list,
      });
    } else {
      this.messages = [...this.messages, assistantMessage];
    }
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  private handleBackendError(error: unknown, current: CollectionResponse | null): void {
    const errorMessage: Message = {
      id: `error-${Date.now()}`,
      role: 'assistant',
      content: `Lo siento, hubo un error al conectar con el backend:\n\n${error instanceof Error ? error.message : 'Error desconocido'}\n\nPor favor, asegúrate de que el servidor backend está ejecutándose en http://localhost:8000`,
      created_at: new Date(),
    };

    if (current) {
      const updated = this.collections.find((c) => c.id === current.id);
      const list = updated ? [...(updated.messages ?? []), errorMessage] : [errorMessage];
      this.onUpdateCollection({
        ...(updated ?? current),
        messages: list,
      });
    } else {
      this.messages = [...this.messages, errorMessage];
    }
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  /** Actualiza estado de la sesión cuando se edita desde la vista (sin colección). */
  onSessionUpdate(updated: CollectionResponse): void {
    if (updated.id !== 'session') return;
    this.files = updated.files ?? [];
    this.messages = updated.messages ?? [];
  }

  onSubmitPrivateCode(code: string): void {
    if (!this.pendingPrivateCollection || this.isUnlocking) return;
    const collection = this.pendingPrivateCollection;
    this.privateCodeError = null;
    this.isUnlocking = true;
    this.api
      .unlockCollection(collection.id, code.trim())
      .pipe(
        finalize(() => {
          this.isUnlocking = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          if (!this.pendingPrivateCollection || this.pendingPrivateCollection.id !== collection.id) {
            return;
          }
          this.unlockedCollectionIds = new Set(this.unlockedCollectionIds).add(collection.id);
          this.activeCollectionId = collection.id;
          if (isPlatformBrowser(this.platformId)) {
            sessionStorage.setItem('active_collection_id', collection.id);
          }
          // Una vez desbloqueada, cargamos los documentos y mensajes de la colección
          this.loadCollectionDetails(collection.id);
          this.pendingPrivateCollection = null;
          this.privateCodeError = null;
        },
        error: (error: any) => {
          if (!this.pendingPrivateCollection || this.pendingPrivateCollection.id !== collection.id) {
            return;
          }
          if (error?.status === 401) {
            this.privateCodeError = 'Incorrect code. Try again.';
          } else {
            this.privateCodeError = 'Could not verify code. Try again.';
          }
        },
      });
  }

  onPrivateDialogClose(open: boolean): void {
    if (!open) {
      this.pendingPrivateCollection = null;
      this.privateCodeError = null;
      this.isUnlocking = false;
    }
  }

  onToggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
}
