# Material System Documentation

Dette dokument beskriver det nye materialesystem, der er implementeret i LearningLab API'en.

## Oversigt

Materialesystemet giver mulighed for at:
- Uploade og administrere filer
- Oprette og administrere undervisningsmaterialer (ContentBlocks)
- Søge i materialer og filer
- Organisere materialer efter lektioner, emner og kurser

## Nye Komponenter

### 1. Database Indekser

Tilføjet indekser til følgende modeller for optimeret performance:

#### ContentBlock
- `lessonId` - For hurtig hentning af materialer efter lektion
- `type` - For filtrering efter materialetype
- `order` - For sortering af materialer
- `fileId` - For hurtig lookup af tilknyttede filer

#### Course
- `title` - For søgning efter kursustitler
- `slug` - For hurtig URL-baseret lookup
- `educationProgramId` - For filtrering efter uddannelsesprogram
- `difficulty` - For filtrering efter sværhedsgrad
- `status` - For filtrering efter status

#### Topic
- `courseId` - For hentning af emner efter kursus
- `title` - For søgning efter emnetitler
- `order` - For sortering af emner
- `subjectCategory` - For kategorisering

#### Lesson
- `topicId` - For hentning af lektioner efter emne
- `title` - For søgning efter lektionstitler
- `order` - For sortering af lektioner

#### EducationProgram
- `name` - For søgning efter programnavne

### 2. Services

#### FileUploadService
**Placering:** `src/services/file-upload.service.ts`

**Funktionalitet:**
- Upload af filer med validering
- Hentning af filinformation
- Søgning i filer
- Opdatering af filbeskrivelser
- Sletning af filer
- Sikkerhedsvalidering af filtyper og størrelser

**Understøttede filtyper:**
- Billeder: JPEG, PNG, GIF, WebP
- Dokumenter: PDF, Word, Excel, PowerPoint, TXT, CSV
- Video: MP4, WebM
- Audio: MP3, WAV

**Maksimal filstørrelse:** 10MB

#### MaterialService
**Placering:** `src/services/material.service.ts`

**Funktionalitet:**
- Oprettelse af materialer (ContentBlocks)
- Hentning af materialer (individuelt, efter lektion, emne, kursus)
- Opdatering af materialer
- Bulk opdatering af materialernes rækkefølge
- Duplikering af materialer
- Sletning af materialer
- Søgning i materialer

### 3. Controllers

#### FileController
**Placering:** `src/controllers/file.controller.ts`

**Endpoints:**
- `POST /files/upload` - Upload filer
- `GET /files/:id` - Hent filinformation
- `GET /files/:id/download` - Download fil
- `GET /files/user/:userId` - Hent brugerens filer
- `GET /files/search` - Søg i filer
- `PATCH /files/:id` - Opdater filbeskrivelse
- `DELETE /files/:id` - Slet fil

#### MaterialController
**Placering:** `src/controllers/material.controller.ts`

**Endpoints:**
- `POST /materials` - Opret materiale
- `GET /materials/:id` - Hent materiale
- `GET /materials/lesson/:lessonId` - Hent materialer efter lektion
- `GET /materials/topic/:topicId` - Hent materialer efter emne
- `GET /materials/course/:courseId` - Hent materialer efter kursus
- `PATCH /materials/:id` - Opdater materiale
- `PATCH /materials/bulk-order` - Bulk opdater rækkefølge
- `POST /materials/:id/duplicate` - Dupliker materiale
- `DELETE /materials/:id` - Slet materiale
- `GET /materials/search` - Søg i materialer

### 4. DTOs

#### ContentBlock DTOs
**Placering:** `src/dto/content-block.dto.ts`

- `CreateContentBlockDto` - Validering af nye materialer
- `UpdateContentBlockDto` - Validering af opdateringer
- `BulkUpdateContentBlockOrderDto` - Validering af bulk rækkefølge opdateringer

#### File Upload DTOs
**Placering:** `src/dto/file-upload.dto.ts`

- `UpdateFileDto` - Validering af filopdateringer
- `FileSearchDto` - Validering af filsøgninger
- `FileUploadResponseDto` - Response format for uploads

### 5. Sikkerhed og Validering

#### GlobalExceptionFilter
**Placering:** `src/filters/global-exception.filter.ts`

**Funktionalitet:**
- Centraliseret fejlhåndtering
- Prisma fejl mapping
- Sikkerhedslogning
- Strukturerede fejlresponses

#### CustomValidationPipe
**Placering:** `src/pipes/validation.pipe.ts`

**Funktionalitet:**
- Input sanitization (XSS beskyttelse)
- Validering med class-validator
- Filvalidering med størrelser og typer
- Sikkerhedsfiltrering af farlige karakterer

#### FileValidationPipe
**Samme fil som CustomValidationPipe**

**Funktionalitet:**
- Validering af uploadede filer
- Kontrol af filstørrelser og typer
- Sanitization af filnavne

### 6. Logging og Monitoring

#### LoggingInterceptor
**Placering:** `src/interceptors/logging.interceptor.ts`

**Funktionalitet:**
- HTTP request/response logging
- Brugeridentifikation i logs
- Sanitization af sensitive data
- Performance monitoring

#### PerformanceInterceptor
**Samme fil som LoggingInterceptor**

**Funktionalitet:**
- Måling af response tider
- Identifikation af langsomme requests
- Memory usage monitoring

### 7. Udvidet Søgning

**SearchService er udvidet til at inkludere:**
- Søgning i materialer (ContentBlocks)
- Søgning i filer
- Relevance scoring for materialer og filer
- Filtrering efter materialetype og filtype

## Konfiguration

### Environment Variables

```env
# Fil upload konfiguration
UPLOAD_PATH=./uploads

# Database (eksisterende)
DATABASE_URL="your-database-url"
```

### Upload Directory Structure

```
uploads/
├── images/          # Billedfiler
├── videos/          # Videofiler
├── audio/           # Lydfiler
├── documents/       # Dokumenter (PDF, Word, etc.)
└── misc/            # Andre filtyper
```

## Sikkerhedsforanstaltninger

1. **Filvalidering:** Kun tilladte filtyper og størrelser
2. **Input sanitization:** XSS beskyttelse på alle inputs
3. **Authentication:** JWT-baseret autentificering på alle endpoints
4. **Authorization:** Rollebaseret adgangskontrol
5. **Logging:** Omfattende logging af alle aktiviteter
6. **Error handling:** Sikker fejlhåndtering uden information leakage

## Performance Optimering

1. **Database indekser:** Optimeret for almindelige forespørgsler
2. **Caching:** Integreret med eksisterende cache system
3. **Pagination:** Alle lister understøtter pagination
4. **Lazy loading:** Relationer indlæses kun når nødvendigt
5. **File streaming:** Effektiv fil-download med streaming

## Brug

### Upload en fil

```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('description', 'Min fil beskrivelse');

const response = await fetch('/files/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

### Opret et materiale

```typescript
const material = await fetch('/materials', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    lessonId: 1,
    type: 'FILE',
    title: 'Lektion 1 Materiale',
    content: 'Beskrivelse af materialet',
    fileId: 123,
    order: 1
  })
});
```

### Søg i materialer

```typescript
const results = await fetch('/search?query=matematik&type=material&page=1&limit=10', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Migration

For at anvende de nye funktioner:

1. Kør database migration for at tilføje indekser
2. Genstart applikationen
3. Opret upload directory struktur
4. Konfigurer environment variables

```bash
# Generer Prisma client
yarn prisma:generate

# Kør migrations (hvis nødvendigt)
yarn prisma:migrate

# Start applikationen
yarn start:dev
```