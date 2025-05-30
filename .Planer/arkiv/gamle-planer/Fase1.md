# Detaljeret Handlingsplan for Fase 1: Styrkelse af Kernen

Baseret på min analyse af den nuværende LearningLab struktur og vision, har jeg udarbejdet følgende detaljerede handlingsplan for Fase 1.

## Oversigt over Nuværende Struktur

**Nuværende:** SubjectArea → Course → Module → Lesson → ContentBlock  
**Ønsket (Vision):** Kursus → Fag → Emne → Lektion

**Hovedudfordring:** Der er et strukturelt mismatch mellem nuværende og ønsket hierarki.

---

## 1. LÆRINGSSTRUKTUR FÆRDIGGØRELSE

### Delopgave 1.1: Omdøb SubjectArea til Fag

**Filer der skal modificeres:**
- `prisma/schema.prisma`
- `apps/api/src/controllers/subjectArea.controller.ts`
- `apps/api/src/controllers/services/subject-area.service.ts`
- `apps/api/src/controllers/dto/subject-area/` (alle filer)
- `apps/api/src/controllers/subjectAreas.module.ts`

**Beskrivelse af ændringer:**
- Omdøb `SubjectArea` model til `Fag` i Prisma schema
- Opdater alle relationer til at bruge `Fag` i stedet for `SubjectArea`
- Omdøb controller fra `subjectArea` til `fag`
- Opdater service navne og metoder
- Omdøb DTO filer og klasser

**Nødvendige kommandoer:**
```bash
npx prisma generate
npx prisma migrate dev --name rename-subjectarea-to-fag
```

**Potentielle udfordringer:**
- Eksisterende data skal migreres korrekt
- Alle API endpoints skal opdateres
- Frontend skal opdateres til nye endpoint navne

**Testscenarier:**
- Kan oprette et nyt Fag
- Kan liste alle Fag
- Eksisterende Kurser er stadig knyttet til deres Fag

---

### Delopgave 1.2: Tilføj Emne model mellem Course og Module

**Filer der skal modificeres:**
- `prisma/schema.prisma`

**Nye filer der skal oprettes:**
- `apps/api/src/controllers/emne.controller.ts`
- `apps/api/src/controllers/emne.controller.nest.ts`
- `apps/api/src/controllers/emner.module.ts`
- `apps/api/src/controllers/services/emne.service.ts`
- `apps/api/src/controllers/dto/emne/create-emne.dto.ts`
- `apps/api/src/controllers/dto/emne/update-emne.dto.ts`
- `apps/api/src/routes/emne.routes.ts`

**Beskrivelse af ændringer:**
- Tilføj `Emne` model i Prisma schema med relation til `Course`
- Opdater `Module` model til at have relation til `Emne` i stedet for `Course`
- Opret komplet CRUD controller for Emne
- Implementer service med standard operationer
- Definer DTOs for create/update operationer

**Nødvendige kommandoer:**
```bash
npx prisma generate
npx prisma migrate dev --name add-emne-model
```

**Potentielle udfordringer:**
- Eksisterende Modules skal migreres til at tilhøre et Emne
- Kompleks datamigrering kan være nødvendig
- API struktur ændres betydeligt

**Testscenarier:**
- Kan oprette Emne under et Course
- Kan tilknytte Modules til et Emne
- Hierarkiet Course → Emne → Module → Lesson fungerer

---

### Delopgave 1.3: Opdater Course struktur og relationer

**Filer der skal modificeres:**
- `apps/api/src/controllers/course.controller.ts`
- `apps/api/src/controllers/course.controller.nest.ts`
- `apps/api/src/controllers/dto/course.dto.ts`
- `apps/api/src/controllers/module.controller.ts`
- `apps/api/src/controllers/dto/module/create-module.dto.ts`

**Beskrivelse af ændringer:**
- Opdater Course controller til at håndtere relation til Fag i stedet for SubjectArea
- Modificer Course DTOs til at inkludere fagId
- Opdater Module controller til at håndtere emneId i stedet for courseId
- Tilføj endpoints for at hente Emner under et Course

**Nødvendige kommandoer:**
```bash
npm test -- --testPathPattern=course
npm test -- --testPathPattern=module
```

**Potentielle udfordringer:**
- Breaking changes i eksisterende API
- Frontend skal opdateres samtidigt
- Komplekse nested queries

**Testscenarier:**
- Course kan oprettes med fagId
- Kan hente alle Emner under et Course
- Module oprettelse fungerer med emneId

---

## 2. QUIZ FUNKTIONALITET UDVIDELSE

### Delopgave 2.1: Udvid Quiz model med manglende felter

**Filer der skal modificeres:**
- `prisma/schema.prisma`
- `apps/api/src/controllers/dto/quiz/` (alle filer)

**Beskrivelse af ændringer:**
- Tilføj felter til Quiz model: `timeLimit`, `passingScore`, `maxAttempts`, `showCorrectAnswers`, `randomizeQuestions`
- Opdater Quiz DTOs til at inkludere nye felter
- Tilføj validering for nye felter

**Nødvendige kommandoer:**
```bash
npx prisma generate
npx prisma migrate dev --name extend-quiz-model
```

**Potentielle udfordringer:**
- Eksisterende quizzer skal have default værdier
- Validering af timeLimit og passingScore

**Testscenarier:**
- Kan oprette quiz med alle nye felter
- Validering fungerer korrekt
- Eksisterende quizzer fungerer stadig

---

### Delopgave 2.2: Udvid Question model med flere spørgsmålstyper

**Filer der skal modificeres:**
- `prisma/schema.prisma`
- `apps/api/src/controllers/question-bank.controller.ts`
- `apps/api/src/controllers/dto/question-bank/` (alle filer)

**Beskrivelse af ændringer:**
- Udvid `QuestionType` enum med: `TRUE_FALSE`, `FILL_IN_BLANK`, `MATCHING`, `ORDERING`
- Tilføj `explanation` felt til Question model
- Opdater Question DTOs til at håndtere nye typer
- Implementer validering for hver spørgsmålstype

**Nødvendige kommandoer:**
```bash
npx prisma generate
npx prisma migrate dev --name extend-question-types
```

**Potentielle udfordringer:**
- Kompleks validering for forskellige spørgsmålstyper
- JSON struktur for answers skal være fleksibel

**Testscenarier:**
- Kan oprette spørgsmål af alle typer
- Validering fungerer for hver type
- Explanation vises korrekt

---

### Delopgave 2.3: Forbedre UserQuizAttempt tracking

**Filer der skal modificeres:**
- `prisma/schema.prisma`
- `apps/api/src/controllers/quizAttempt.controller.ts`
- `apps/api/src/controllers/dto/quiz-attempt/` (alle filer)
- `apps/api/src/services/quiz.service.ts`

**Beskrivelse af ændringer:**
- Tilføj `timeSpent`, `detailedAnswers` (JSON) til UserQuizAttempt
- Implementer automatisk scoring baseret på spørgsmålstype
- Tilføj endpoints for detaljeret attempt analyse
- Implementer retry logik baseret på maxAttempts

**Nødvendige kommandoer:**
```bash
npx prisma generate
npx prisma migrate dev --name improve-quiz-attempts
```

**Potentielle udfordringer:**
- Kompleks scoring algoritme
- Performance ved store JSON objekter
- Concurrent attempt håndtering

**Testscenarier:**
- Automatic scoring fungerer korrekt
- Time tracking er præcis
- Retry limits respekteres

---

## 3. MATERIALEHÅNDTERING

### Delopgave 3.1: Udvid ContentBlock med flere typer

**Filer der skal modificeres:**
- `prisma/schema.prisma`
- `apps/api/src/controllers/contentBlock.controller.ts`
- `apps/api/src/controllers/dto/contentBlock/` (alle filer)

**Beskrivelse af ændringer:**
- Udvid `ContentBlockType` enum med: `AUDIO`, `DOCUMENT`, `PRESENTATION`, `EXERCISE`
- Tilføj `metadata` JSON felt til ContentBlock
- Implementer type-specifik validering
- Tilføj `duration` felt for tidsbaseret indhold

**Nødvendige kommandoer:**
```bash
npx prisma generate
npx prisma migrate dev --name extend-content-blocks
```

**Potentielle udfordringer:**
- Type-specifik validering er kompleks
- Metadata struktur skal være fleksibel

**Testscenarier:**
- Kan oprette alle nye content block typer
- Metadata gemmes og hentes korrekt
- Validering fungerer for hver type

---

### Delopgave 3.2: Implementer Material model

**Nye filer der skal oprettes:**
- `apps/api/src/controllers/material.controller.ts`
- `apps/api/src/controllers/material.controller.nest.ts`
- `apps/api/src/controllers/materials.module.ts`
- `apps/api/src/controllers/services/material.service.ts`
- `apps/api/src/controllers/dto/material/create-material.dto.ts`
- `apps/api/src/controllers/dto/material/update-material.dto.ts`

**Filer der skal modificeres:**
- `prisma/schema.prisma`

**Beskrivelse af ændringer:**
- Opret Material model med felter: `title`, `description`, `fileUrl`, `fileType`, `fileSize`, `uploadedBy`
- Implementer komplet CRUD controller
- Tilføj relation til Course/Emne/Lesson
- Implementer file upload håndtering

**Nødvendige kommandoer:**
```bash
npx prisma generate
npx prisma migrate dev --name add-material-model
npm install multer @types/multer
```

**Potentielle udfordringer:**
- File upload sikkerhed
- Storage management
- File type validering

**Testscenarier:**
- Kan uploade og gemme filer
- Kan tilknytte materialer til lektioner
- File metadata gemmes korrekt

---

### Delopgave 3.3: Forbedre filhåndtering og sikkerhed

**Nye filer der skal oprettes:**
- `apps/api/src/common/services/file-upload.service.ts`
- `apps/api/src/common/guards/file-type.guard.ts`
- `apps/api/src/common/pipes/file-validation.pipe.ts`

**Filer der skal modificeres:**
- `apps/api/src/common/common.module.ts`
- `apps/api/src/config/app.config.ts`

**Beskrivelse af ændringer:**
- Implementer centraliseret file upload service
- Tilføj file type og størrelse validering
- Implementer virus scanning (hvis muligt)
- Tilføj file cleanup for slettede materialer

**Nødvendige kommandoer:**
```bash
npm install sharp
mkdir -p uploads/materials
```

**Potentielle udfordringer:**
- Sikkerhedsrisici ved file uploads
- Storage begrænsninger
- Performance ved store filer

**Testscenarier:**
- Kun tilladte filtyper kan uploades
- Store filer afvises
- Slettede filer fjernes fra storage

---

## IMPLEMENTERINGSRÆKKEFØLGE

1. **Database ændringer først** (1.1, 1.2, 2.1, 2.2, 3.1, 3.2)
2. **Service lag opdateringer** (1.3, 2.3, 3.3)
3. **Controller og API opdateringer** (alle resterende)
4. **Test og validering** (løbende)

## OVERORDNEDE RISICI OG MITIGERING

- **Breaking Changes:** Implementer API versioning
- **Data Migration:** Opret backup før hver migration
- **Performance:** Implementer database indexing
- **Sikkerhed:** Code review for alle file upload funktioner

## ESTIMERET TIDSRAMME

- **Læringsstruktur:** 3-4 dage
- **Quiz funktionalitet:** 2-3 dage  
- **Materialehåndtering:** 2-3 dage
- **Test og debugging:** 1-2 dage

**Total: 8-12 dage**

Denne plan sikrer en systematisk og sikker implementering af Fase 1 målene med minimal risiko for breaking changes og maksimal kodekvalitet.
        