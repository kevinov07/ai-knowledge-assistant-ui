# Integración con Backend Python

Este documento explica cómo conectar el frontend Angular con el backend Python.

## Configuración del Backend

### Requisitos del Backend

El backend Python debe exponer los siguientes endpoints:

#### 1. **POST /api/upload**
Sube archivos al servidor para procesamiento.

**Request:**
```
Content-Type: multipart/form-data
Body: files (múltiples archivos)
```

**Response:**
```json
{
  "success": true,
  "message": "Files uploaded successfully",
  "file_ids": ["file-id-1", "file-id-2"]
}
```

#### 2. **POST /api/ask**
Hace una pregunta usando los archivos previamente subidos.

**Request:**
```json
{
  "question": "¿Cuál es el contenido principal?",
  "file_ids": ["file-id-1", "file-id-2"]
}
```

**Response:**
```json
{
  "answer": "Respuesta generada por el modelo...",
  "sources": ["documento1.pdf", "documento2.txt"],
  "timestamp": "2026-01-19T10:30:00Z"
}
```

#### 3. **POST /api/upload-and-ask**
Sube archivos y hace una pregunta en una sola llamada.

**Request:**
```
Content-Type: multipart/form-data
Body: 
  - files (múltiples archivos)
  - question (string)
```

**Response:**
```json
{
  "answer": "Respuesta generada por el modelo...",
  "sources": ["documento1.pdf"],
  "timestamp": "2026-01-19T10:30:00Z"
}
```

#### 4. **GET /api/health**
Verifica el estado del servidor.

**Response:**
```json
{
  "status": "ok",
  "version": "1.0.0"
}
```

## Ejemplo de Backend con FastAPI

```python
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import uuid
from datetime import datetime

app = FastAPI()

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],  # URL del frontend Angular
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Almacenamiento temporal de archivos (en producción usar base de datos)
uploaded_files = {}

@app.post("/api/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    file_ids = []
    
    for file in files:
        file_id = str(uuid.uuid4())
        file_ids.append(file_id)
        
        # Guardar archivo y procesarlo (embedding, etc.)
        content = await file.read()
        uploaded_files[file_id] = {
            "filename": file.filename,
            "content": content,
            "content_type": file.content_type
        }
    
    return {
        "success": True,
        "message": "Files uploaded successfully",
        "file_ids": file_ids
    }

@app.post("/api/ask")
async def ask_question(request: dict):
    question = request.get("question")
    file_ids = request.get("file_ids", [])
    
    # Aquí implementarías tu lógica RAG:
    # 1. Recuperar archivos por file_ids
    # 2. Buscar contexto relevante (vector search)
    # 3. Generar respuesta con LLM
    
    # Ejemplo de respuesta:
    answer = f"Esta es una respuesta basada en {len(file_ids)} documentos para la pregunta: {question}"
    
    return {
        "answer": answer,
        "sources": [uploaded_files[fid]["filename"] for fid in file_ids if fid in uploaded_files],
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/upload-and-ask")
async def upload_and_ask(
    files: List[UploadFile] = File(...),
    question: str = Form(...)
):
    # Procesar archivos
    file_ids = []
    for file in files:
        file_id = str(uuid.uuid4())
        file_ids.append(file_id)
        content = await file.read()
        uploaded_files[file_id] = {
            "filename": file.filename,
            "content": content,
            "content_type": file.content_type
        }
    
    # Generar respuesta
    answer = f"Respuesta basada en {len(files)} archivos: {question}"
    
    return {
        "answer": answer,
        "sources": [f.filename for f in files],
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

## Configuración del Frontend

### 1. Cambiar la URL del Backend

Edita el archivo `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api'  // Cambia según tu configuración
};
```

Para producción, edita `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://tu-api-produccion.com/api'
};
```

### 2. Ejecutar el Backend

```bash
# Instalar dependencias
pip install fastapi uvicorn python-multipart

# Ejecutar servidor
python main.py
```

El servidor debería estar corriendo en `http://localhost:8000`

### 3. Ejecutar el Frontend

```bash
# Instalar dependencias
bun install

# Ejecutar en modo desarrollo
bun run dev
```

El frontend estará disponible en `http://localhost:4200`

## Troubleshooting

### Error de CORS

Si ves errores de CORS en la consola del navegador, asegúrate de que el backend tiene configurado CORS correctamente:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Backend no responde

Verifica que el backend está corriendo:
```bash
curl http://localhost:8000/api/health
```

Deberías ver:
```json
{"status":"ok","version":"1.0.0"}
```

### Error de conexión

Si ves un error de conexión en el frontend, revisa:

1. ¿El backend está ejecutándose?
2. ¿La URL en `environment.ts` es correcta?
3. ¿El puerto es el correcto?

## Próximos Pasos

1. Implementar autenticación (JWT)
2. Agregar manejo de sesiones
3. Implementar streaming de respuestas (SSE o WebSockets)
4. Agregar rate limiting
5. Implementar caché de respuestas
