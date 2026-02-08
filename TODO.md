# AI Knowledge Assistant - TODO

## Features Pendientes

### 🔔 Notificaciones

- [ ] **Sistema de notificaciones toast/alert**
  - Notificación de éxito al cargar documentos correctamente
  - Notificación de error cuando falla la carga
  - Mostrar detalles específicos de los errores (qué documentos fallaron y por qué)
  - Indicador visual durante el proceso de carga
  - Lista de documentos procesados con su estado (exitoso/fallido)

### 📝 Gestión de Documentos

- [ ] **Crear documentos en la app**
  - Agregar funcionalidad para crear documentos directamente escribiendo texto en un input dentro de la aplicación
  - Permitir editar y guardar documentos creados

- [ ] **Soporte para múltiples formatos**
  - Actualmente solo funciona con `.txt`
  - Agregar soporte para:
    - `.pdf`
    - `.docx`
    - `.md` (Markdown)
    - `.csv`
    - Otros formatos relevantes

### 📚 Sistema de Colecciones

- [ ] **Colecciones de documentos**
  - Permitir a los usuarios crear colecciones personalizadas de documentos
  - Características:
    - **Colecciones públicas**: Accesibles para todos
    - **Colecciones privadas**: Protegidas con clave/código de acceso
    - Selector de colección para elegir el contexto en las consultas

- [ ] **Backend para colecciones**
  - Implementar base de datos para gestionar colecciones
  - API endpoints para CRUD de colecciones
  - Validación de contraseña simple para colecciones privadas (sin sistema de usuarios)
  - Lógica para seleccionar contexto de colecciones específicas

## Configuración Completada

- [x] Variables de entorno para API URL
- [x] Build con SSR funcionando
- [x] Configuración de despliegue en Vercel