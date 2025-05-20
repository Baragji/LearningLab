# E2 - Quiz Core Implementeringsplan

## Oversigt
E2 fokuserer på at implementere quiz-funktionaliteten i LearningLab, som er en central del af læringsoplevelsen. Dette inkluderer UI til at tage quizzer, visning af resultater og integration med backend for at gemme brugerens fremskridt.

## Tidsramme
**Target:** 5 udviklingsdage

## User Stories

### E2-1: Quiz UI V1 (8 SP)
**Beskrivelse:** Implementere en grundlæggende quiz-brugergrænseflade, der viser ét spørgsmål ad gangen og giver feedback efter indsendelse.

**Acceptance Criteria:**
- Brugeren kan se ét spørgsmål ad gangen
- Brugeren kan vælge et svar blandt flere muligheder
- Brugeren kan navigere mellem spørgsmål (næste/forrige)
- Ved indsendelse af quiz vises en score-toast med resultatet
- Korrekte og forkerte svar markeres tydeligt

**Tekniske Tasks:**
1. Opret `QuizComponent` til at vise et enkelt spørgsmål
2. Implementer `QuizNavigation` til at navigere mellem spørgsmål
3. Opret `QuizContext` til at håndtere quiz-tilstand
4. Implementer `SubmitQuiz`-funktion til at beregne score
5. Opret `ScoreToast`-komponent til at vise resultatet
6. Tilføj side til at starte en quiz (`/courses/[slug]/quizzes/[id]`)

### E2-2: Resultatside & fremdrift (5 SP)
**Beskrivelse:** Implementere en resultatside, der viser brugerens score og fremskridt, samt en liste over forkerte svar.

**Acceptance Criteria:**
- Efter en quiz vises en resultatside med samlet score
- Radial progress-indikator viser procentvis korrekte svar
- Liste over forkerte svar med korrekte svar vist
- Mulighed for at prøve quizzen igen
- Navigere tilbage til kurset

**Tekniske Tasks:**
1. Opret `QuizResultPage` komponent
2. Implementer `RadialProgress`-komponent
3. Opret `IncorrectAnswersList`-komponent
4. Tilføj "Prøv igen" og "Tilbage til kursus" knapper
5. Tilføj route til resultatside (`/courses/[slug]/quizzes/[id]/results`)

### E2-3: UserProgress API-integration (3 SP)
**Beskrivelse:** Integrere med backend API for at gemme brugerens fremskridt efter en quiz.

**Acceptance Criteria:**
- Efter en quiz sendes resultatet til backend via PATCH `/user-progress`
- Brugerens fremskridt opdateres i UI baseret på API-svar
- Fejlhåndtering ved netværksproblemer (offline-support)
- Loading-states under API-kald

**Tekniske Tasks:**
1. Opret `userProgressApi` service
2. Implementer `updateQuizProgress`-funktion
3. Integrer med `QuizContext` for at gemme resultater
4. Tilføj fejlhåndtering og retry-logik
5. Implementer loading-states under API-kald

## Teknisk Arkitektur

### Datamodeller

```typescript
// Quiz-relaterede typer
interface QuizQuestion {
  id: number;
  text: string;
  options: QuizOption[];
  explanation?: string;
}

interface QuizOption {
  id: number;
  text: string;
  isCorrect: boolean;
}

interface Quiz {
  id: number;
  title: string;
  description: string;
  courseId: number;
  moduleId: number;
  questions: QuizQuestion[];
  passingScore: number; // f.eks. 70%
}

// Brugerens svar og fremskridt
interface UserAnswer {
  questionId: number;
  selectedOptionId: number;
  isCorrect: boolean;
}

interface QuizResult {
  quizId: number;
  score: number; // Procentvis score
  answers: UserAnswer[];
  completedAt: string; // ISO-datostreng
  passed: boolean;
}

interface UserProgress {
  userId: number;
  courseId: number;
  completedLessons: number[];
  quizResults: QuizResult[];
  overallProgress: number; // Procentvis fremskridt i kurset
}
```

### Komponenter

#### Quiz UI
- `QuizContainer`: Overordnet container for quiz-oplevelsen
- `QuizQuestion`: Viser et enkelt spørgsmål med svarmuligheder
- `QuizNavigation`: Knapper til at navigere mellem spørgsmål
- `QuizProgress`: Viser fremskridt i quizzen (f.eks. "3 af 10 spørgsmål")
- `SubmitQuizButton`: Knap til at indsende quizzen
- `ScoreToast`: Toast-notifikation med resultatet

#### Resultatside
- `QuizResultPage`: Overordnet side for quiz-resultater
- `RadialProgress`: Cirkulær fremskridtsindikator
- `IncorrectAnswersList`: Liste over forkerte svar
- `CorrectAnswerCard`: Kort der viser det korrekte svar
- `RetryQuizButton`: Knap til at prøve quizzen igen

#### API Integration
- `userProgressApi`: Service til at kommunikere med backend
- `useQuizProgress`: Custom hook til at håndtere quiz-fremskridt
- `ProgressContext`: Context til at dele fremskridtsdata på tværs af komponenter

## Implementeringsplan

### Dag 1: Quiz UI Grundstruktur
- Opret grundlæggende quiz-komponenter
- Implementer quiz-datamodel
- Opsæt mock-data til udvikling
- Implementer grundlæggende navigation mellem spørgsmål

### Dag 2: Quiz Interaktion
- Implementer valg af svarmuligheder
- Tilføj validering af svar
- Implementer quiz-indsendelse
- Tilføj score-beregning

### Dag 3: Resultatside
- Opret resultatside-layout
- Implementer radial progress-komponent
- Tilføj liste over forkerte svar
- Implementer navigation til/fra resultatsiden

### Dag 4: API Integration
- Opsæt API-service til user progress
- Implementer PATCH `/user-progress`
- Tilføj fejlhåndtering
- Implementer loading-states

### Dag 5: Polering og Tests
- Tilføj animationer og overgange
- Forbedre responsivt design
- Implementer unit tests
- Gennemfør end-to-end test af quiz-flow

## Afhængigheder
- E1 skal være færdigimplementeret
- Backend API-endepunkt `/user-progress` skal være tilgængeligt
- Adgang til quiz-data fra backend

## Risici og Udfordringer
- Kompleksitet i at håndtere forskellige typer quiz-spørgsmål
- Offline-support kan være udfordrende
- Performance ved store quizzer med mange spørgsmål
- Synkronisering af brugerens fremskridt på tværs af enheder

## Definition af Done
- Alle acceptance-kriterier er opfyldt
- Koden er testet og reviewet
- Dokumentation er opdateret
- UI er responsivt og tilgængeligt
- Performance er optimeret