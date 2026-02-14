import { Component, ChangeDetectorRef, HostListener, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { CollectionsSidebar } from '../../components/collections-sidebar/collections-sidebar';
import { CollectionView } from '../../components/collection-view/collection-view';
import { WelcomeView } from '../../components/welcome-view/welcome-view';
import { CreateCollectionDialog } from '../../components/create-collection-dialog/create-collection-dialog';
import { PrivateCodeDialog } from '../../components/private-code-dialog/private-code-dialog';
import { ConfirmDialog } from '../../components/confirm-dialog/confirm-dialog';
import { ApiService } from '../../lib/api.service';
import { CollectionRequest, CollectionResponse, FileData, Message, PaginationMeta } from '../../lib/types';

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
    ConfirmDialog,
  ],
  templateUrl: './ask.html',
  styleUrl: './ask.css',
  host: { ngSkipHydration: '' },
})
export class Ask implements OnInit {
  collections: CollectionResponse[] = [];
  isLoading = false;

  /** Paginación de colecciones (sidebar) */
  collectionsPage = 1;
  collectionsPageSize = 10;
  collectionsPagination: PaginationMeta = {
    page: 1,
    page_size: 10,
    total: 0,
    total_pages: 0,
  };

  private cdr = inject(ChangeDetectorRef);
  private api = inject(ApiService);
  private platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    this.updateMobile();
    if (this.isMobile) this.sidebarCollapsed = true;
    this.loadCollections();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateMobile();
    if (this.isMobile && !this.sidebarCollapsed) {
      // Al redimensionar a móvil con sidebar abierto, mantener abierto; al pasar a desktop no forzar.
    }
    this.cdr.detectChanges();
  }

  private updateMobile(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth < this.mobileBreakpoint;
    if (this.isMobile && !wasMobile) this.sidebarCollapsed = true;
  }

  /** Carga la página actual de colecciones para el sidebar. */
  loadCollections(): void {
    this.api.getCollections(this.collectionsPage, this.collectionsPageSize).subscribe((res) => {
      this.collections = res.items;
      this.collectionsPagination = res.pagination;
      // Restaurar colección activa desde sessionStorage (solo si está en la página actual)
      if (isPlatformBrowser(this.platformId)) {
        const savedId = sessionStorage.getItem('active_collection_id');
        if (savedId) {
          const found = this.collections.find((c) => c.id === savedId);
          if (found) {
            this.activeCollectionId = savedId;
            this.activeCollectionData = found;
            if (!found.is_public) {
              this.unlockedCollectionIds = new Set(this.unlockedCollectionIds).add(savedId);
            }
            this.loadCollectionDetails(savedId);
          } else {
            sessionStorage.removeItem('active_collection_id');
          }
        }
      }
      this.cdr.detectChanges();
    });
  }

  onCollectionsPageChange(page: number): void {
    if (page < 1 || page > this.collectionsPagination.total_pages) return;
    this.collectionsPage = page;
    this.loadCollections();
  }

  activeCollectionId: string | null = null;
  /** Datos de la colección activa (se mantienen al cambiar de página en el sidebar). */
  activeCollectionData: CollectionResponse | null = null;
  /** En móvil el sidebar empieza cerrado y al abrirlo ocupa toda la pantalla. */
  sidebarCollapsed = false;
  isMobile = false;
  private readonly mobileBreakpoint = 768;
  showCreateDialog = false;
  pendingPrivateCollection: CollectionResponse | null = null;
  unlockedCollectionIds = new Set<string>();
  privateCodeError: string | null = null;
  isUnlocking = false;

  /** Acción pendiente a ejecutar después de desbloquear la colección. */
  pendingAction: 'enter' | 'delete-collection' | 'delete-document' | null = null;
  /** ID del documento pendiente a eliminar (solo cuando pendingAction = 'delete-document'). */
  pendingDocumentId: string | null = null;

  /** Estado del diálogo de confirmación de eliminación. */
  showDeleteConfirm = false;
  /** Colección pendiente de eliminar (después de confirmar). */
  collectionToDelete: CollectionResponse | null = null;

  /** Mensaje de confirmación para eliminar colección. */
  get deleteConfirmMessage(): string {
    const name = this.collectionToDelete?.name ?? 'this collection';
    return `Are you sure you want to delete "${name}"? This action cannot be undone and all documents in this collection will be permanently deleted.`;
  }

  get activeCollection(): CollectionResponse | null {
    if (this.activeCollectionId && this.activeCollectionData?.id === this.activeCollectionId) {
      return this.activeCollectionData;
    }
    return this.collections.find((c) => c.id === this.activeCollectionId) ?? null;
  }

  /** Carga documentos y mensajes de una colección al entrar en ella. */
  private loadCollectionDetails(collectionId: string): void {
    const base =
      this.collections.find((c) => c.id === collectionId) ??
      (this.activeCollectionId === collectionId ? this.activeCollectionData : null);
    if (!base) return;

    const isPublic = base.is_public ?? false;

    forkJoin({
      files: this.api.getCollectionDocuments(collectionId, isPublic),
      messages: this.api.getCollectionMessages(collectionId, isPublic),
    }).subscribe({
      next: ({ files, messages: msgs }) => {
        // Solo aplicar si esta colección sigue siendo la activa (por si el usuario cambió).
        if (this.activeCollectionId !== collectionId) return;

        const filesList = Array.isArray(files) ? files : [];
        const msgsList = Array.isArray(msgs) ? msgs : [];

        const updated: CollectionResponse = {
          ...base,
          files: filesList,
          messages: msgsList,
          document_count: filesList.length,
          message_count: msgsList.length,
        };
        if (filesList.length === 0 && msgsList.length === 0) {
          updated.document_count = base.document_count ?? 0;
          updated.message_count = base.message_count ?? 0;
        }
        this.onUpdateCollection(updated);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading collection details:', err);
        this.cdr.detectChanges();
      },
    });
  }

  onSelectCollection(collection: CollectionResponse): void {
    if (!collection.is_public && !this.unlockedCollectionIds.has(collection.id)) {
      this.pendingPrivateCollection = collection;
      this.pendingAction = 'enter';
      this.privateCodeError = null;
      return;
    }
    this.activeCollectionId = collection.id;
    this.activeCollectionData = collection;
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem('active_collection_id', collection.id);
    }
    // Siempre cargar documentos y mensajes al entrar en la colección.
    this.loadCollectionDetails(collection.id);
    if (this.isMobile) this.sidebarCollapsed = true;
  }

  onCreateCollection(): void {
    this.showCreateDialog = true;
  }

  onCreatedCollection(data: CollectionRequest): void {
    console.log(data);
    console.log("entra a crear la colección");
    this.api.createCollection(data).subscribe((response) => {
      this.collections = [response, ...this.collections];
      this.collectionsPagination = {
        ...this.collectionsPagination,
        total: this.collectionsPagination.total + 1,
      };
      if (data.is_public) {
        this.unlockedCollectionIds = new Set(this.unlockedCollectionIds).add(response.id);
      }
      this.activeCollectionId = response.id;
      this.activeCollectionData = response;
      if (isPlatformBrowser(this.platformId)) {
        sessionStorage.setItem('active_collection_id', response.id);
      }
      this.loadCollectionDetails(response.id);
      this.cdr.detectChanges();
    });
    this.showCreateDialog = false;
    console.log("despues de crear la colección");
    console.log(this.collections);
  }

  /** Muestra el diálogo de confirmación antes de eliminar una colección. */
  onDeleteCollection(id: string): void {
    const collection = this.collections.find((c) => c.id === id);
    if (!collection) return;

    // Mostrar diálogo de confirmación
    this.collectionToDelete = collection;
    this.showDeleteConfirm = true;
  }

  /** Cancela la eliminación de la colección. */
  onCancelDelete(): void {
    this.showDeleteConfirm = false;
    this.collectionToDelete = null;
  }

  /** Confirma y procede con la eliminación de la colección. */
  onConfirmDelete(): void {
    const collection = this.collectionToDelete;
    if (!collection) return;

    this.showDeleteConfirm = false;
    this.collectionToDelete = null;

    // Si es privada y no está desbloqueada, pedir código primero
    if (!collection.is_public && !this.unlockedCollectionIds.has(collection.id)) {
      this.pendingPrivateCollection = collection;
      this.pendingAction = 'delete-collection';
      this.privateCodeError = null;
      return;
    }

    // Llamar al backend para eliminar
    this.executeDeleteCollection(collection);
  }

  /** Ejecuta la eliminación de la colección en el backend. */
  private executeDeleteCollection(collection: CollectionResponse): void {
    const isPublic = collection.is_public ?? false;
    this.api.deleteCollection(collection.id, isPublic).subscribe({
      next: () => {
        this.collections = this.collections.filter((c) => c.id !== collection.id);
        this.collectionsPagination = {
          ...this.collectionsPagination,
          total: Math.max(0, this.collectionsPagination.total - 1),
        };
        if (this.activeCollectionId === collection.id) {
          this.activeCollectionId = null;
          this.activeCollectionData = null;
          if (isPlatformBrowser(this.platformId)) {
            sessionStorage.removeItem('active_collection_id');
          }
        }
        // Limpiar el token de esa colección si existe
        if (isPlatformBrowser(this.platformId)) {
          sessionStorage.removeItem(`access_token_${collection.id}`);
        }
        this.unlockedCollectionIds.delete(collection.id);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error deleting collection:', err);
      },
    });
  }

  onUpdateCollection(updated: CollectionResponse): void {
    // No sustituir conteos positivos por cero (p. ej. detalle devolvió [] al entrar a la colección).
    const existing = this.collections.find((c) => c.id === updated.id);
    const incomingZeros = (updated.document_count ?? 0) === 0 && (updated.message_count ?? 0) === 0;
    const existingHadCounts = (existing?.document_count ?? 0) > 0 || (existing?.message_count ?? 0) > 0;
    const toApply =
      incomingZeros && existingHadCounts && existing
        ? { ...updated, document_count: existing.document_count ?? 0, message_count: existing.message_count ?? 0 }
        : updated;

    this.collections = this.collections.map((c) => (c.id === toApply.id ? toApply : c));
    if (toApply.id === this.activeCollectionId) {
      this.activeCollectionData = toApply;
    }
  }

  onBack(): void {
    this.activeCollectionId = null;
    this.activeCollectionData = null;
    if (this.isMobile) this.sidebarCollapsed = true;
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem('active_collection_id');
    }
  }

  onGoHome(): void {
    this.activeCollectionId = null;
    this.activeCollectionData = null;
    this.pendingPrivateCollection = null;
    this.privateCodeError = null;
    this.isUnlocking = false;
    if (this.isMobile) this.sidebarCollapsed = true;
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem('active_collection_id');
    }
  }

  /** Sube archivos al backend de la colección activa. */
  onUploadFiles(files: File[]): void {
    if (files.length === 0) return;
    const current = this.activeCollection;
    if (!current) return;

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
  }

  /** Envía pregunta al backend y actualiza mensajes de la colección activa. */
  onAskQuestion(content: string): void {
    const current = this.activeCollection;
    if (!current) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    const updatedMessages = [...(current.messages ?? []), userMessage];
    this.onUpdateCollection({
      ...current,
      messages: updatedMessages,
      message_count: updatedMessages.length,
    });
    this.isLoading = true;
    this.cdr.detectChanges();

    const isPublic = current.is_public ?? false;
    this.api.askQuestion(content, current.id, isPublic).subscribe({
      next: (response) => this.handleBackendResponse(response, current),
      error: (error) => this.handleBackendError(error, current),
    });
  }

  private handleBackendResponse(response: { answer?: string; content?: string }, current: CollectionResponse): void {
    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: response.answer ?? response.content ?? 'No response from backend',
      created_at: new Date().toISOString(),
    };

    const updated = this.collections.find((c) => c.id === current.id);
    const list = updated ? [...(updated.messages ?? []), assistantMessage] : [assistantMessage];
    this.onUpdateCollection({
      ...(updated ?? current),
      messages: list,
      message_count: list.length,
    });
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  private handleBackendError(error: unknown, current: CollectionResponse): void {
    const errorMessage: Message = {
      id: `error-${Date.now()}`,
      role: 'assistant',
      content: `Lo siento, hubo un error al conectar con el backend:\n\n${error instanceof Error ? error.message : 'Error desconocido'}\n\nPor favor, asegúrate de que el servidor backend está ejecutándose en http://localhost:8000`,
      created_at: new Date().toISOString(),
    };

    const updated = this.collections.find((c) => c.id === current.id);
    const list = updated ? [...(updated.messages ?? []), errorMessage] : [errorMessage];
    this.onUpdateCollection({
      ...(updated ?? current),
      messages: list,
      message_count: list.length,
    });
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  /** Elimina un documento específico de la colección activa. */
  onDeleteDocument(documentId: string): void {
    const collection = this.activeCollection;
    if (!collection) return;

    // Si es privada y no está desbloqueada, pedir código primero
    if (!collection.is_public && !this.unlockedCollectionIds.has(collection.id)) {
      this.pendingPrivateCollection = collection;
      this.pendingAction = 'delete-document';
      this.pendingDocumentId = documentId;
      this.privateCodeError = null;
      return;
    }

    // Llamar al backend para eliminar el documento
    const isPublic = collection.is_public ?? false;
    this.api.deleteDocument(collection.id, documentId, isPublic).subscribe({
      next: () => {
        const updatedFiles = (collection.files ?? []).filter((f) => f.id !== documentId);
        this.onUpdateCollection({
          ...collection,
          files: updatedFiles,
          document_count: updatedFiles.length,
        });
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error deleting document:', err);
      },
    });
  }

  onSubmitPrivateCode(code: string): void {
    if (!this.pendingPrivateCollection || this.isUnlocking) return;
    const collection = this.pendingPrivateCollection;
    const action = this.pendingAction ?? 'enter';
    const documentId = this.pendingDocumentId;
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
          // Marcar la colección como desbloqueada
          this.unlockedCollectionIds = new Set(this.unlockedCollectionIds).add(collection.id);

          // Ejecutar la acción pendiente
          switch (action) {
            case 'enter':
              this.activeCollectionId = collection.id;
              this.activeCollectionData = collection;
              if (isPlatformBrowser(this.platformId)) {
                sessionStorage.setItem('active_collection_id', collection.id);
              }
              this.loadCollectionDetails(collection.id);
              break;

            case 'delete-collection':
              this.executeDeleteCollection(collection);
              break;

            case 'delete-document':
              if (documentId) {
                this.api.deleteDocument(collection.id, documentId, false).subscribe({
                  next: () => {
                    const current = this.collections.find((c) => c.id === collection.id);
                    if (current) {
                      const updatedFiles = (current.files ?? []).filter((f) => f.id !== documentId);
                      this.onUpdateCollection({
                        ...current,
                        files: updatedFiles,
                        document_count: updatedFiles.length,
                      });
                    }
                    this.cdr.detectChanges();
                  },
                  error: (err) => console.error('Error deleting document:', err),
                });
              }
              break;
          }

          // Limpiar estado pendiente
          this.pendingPrivateCollection = null;
          this.pendingAction = null;
          this.pendingDocumentId = null;
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
      this.pendingAction = null;
      this.pendingDocumentId = null;
      this.privateCodeError = null;
      this.isUnlocking = false;
    }
  }

  onToggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
}
