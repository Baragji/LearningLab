# AI Question Generation Service

## Oversigt

Dette modul implementerer fase 2.2 af LearningLab - Automatisk Spørgsmålsgenerering. Servicen bruger OpenAI's GPT-4 til at analysere uddannelsesindhold og generere relevante, kvalitetsvurderede spørgsmål.

## Arkitektur

Servicen er bygget med en modulær arkitektur der følger best practices for clean code og separation of concerns:

```
question-generation/
├── types.ts                    # TypeScript interfaces og typer
├── content-analyzer.ts         # Analyserer indhold for emner og kompleksitet
├── question-generator.ts       # Genererer spørgsmål baseret på analyse
├── quality-evaluator.ts        # Evaluerer og scorer spørgsmålskvalitet
├── ai-usage-logger.ts         # Logger AI usage for monitoring
├── content-fetcher.ts         # Henter indhold fra database
├── question-generation.service.ts  # Hovedservice der koordinerer modulerne
└── index.ts                   # Eksporter
```

## Features

### 1. Indholdsanalyse

- Identificerer hovedemner og nøgletermer
- Vurderer kompleksitetsniveau
- Estimerer læsetid
- Kategoriserer indholdstype (tekst, kode, blandet)

### 2. Spørgsmålsgenerering

- Understøtter multiple spørgsmålstyper:
  - Multiple Choice
  - Fill in the Blank
  - Essay
  - True/False
  - Code
  - Drag & Drop
- Tilpasser sværhedsgrad (Beginner, Intermediate, Advanced)
- Fokuserer på specifikke emneområder

### 3. Kvalitetsevaluering

- Scorer hvert spørgsmål på en skala fra 0-100
- Evaluerer baseret på:
  - Tekstlængde og klarhed
  - Spørgsmålsformat
  - Svarmuligheder (for multiple choice)
  - Essay krav
  - Pædagogisk værdi

### 4. AI Usage Tracking

- Logger alle AI requests
- Sporer token forbrug
- Beregner estimerede omkostninger
- Genererer usage statistik

## API Endpoints

### Generer spørgsmål fra rå indhold

```
POST /api/ai/questions/generate-advanced
Body: {
  content: string,
  contentType: 'lesson' | 'topic' | 'course',
  contentId: string,
  numberOfQuestions?: number (1-20),
  questionTypes?: QuestionType[],
  targetDifficulty?: Difficulty,
  focusAreas?: string[]
}
```

### Generer spørgsmål fra lesson

```
POST /api/ai/questions/generate/lesson/:lessonId
Body: {
  numberOfQuestions?: number,
  questionTypes?: QuestionType[],
  targetDifficulty?: Difficulty
}
```

### Generer spørgsmål fra topic

```
POST /api/ai/questions/generate/topic/:topicId
Body: {
  numberOfQuestions?: number,
  questionTypes?: QuestionType[],
  targetDifficulty?: Difficulty
}
```

### Generer spørgsmål fra course

```
POST /api/ai/questions/generate/course/:courseId
Body: {
  numberOfQuestions?: number,
  questionTypes?: QuestionType[],
  targetDifficulty?: Difficulty,
  focusAreas?: string[]
}
```

### Hent usage statistik

```
GET /api/ai/questions/usage-stats?startDate=2024-01-01&endDate=2024-12-31
```

## Konfiguration

Tilføj følgende miljøvariabler i `.env`:

```env
# OpenAI
OPENAI_API_KEY=your-api-key-here
OPENAI_MODEL=gpt-4-turbo-preview  # eller gpt-3.5-turbo for lavere omkostninger
```

## Eksempel Response

```json
{
  "success": true,
  "questions": [
    {
      "text": "Hvad er hovedformålet med unit testing i softwareudvikling?",
      "type": "MULTIPLE_CHOICE",
      "difficulty": "INTERMEDIATE",
      "points": 3,
      "answerOptions": [
        {
          "text": "At teste individuelle komponenter isoleret",
          "isCorrect": true
        },
        {
          "text": "At teste hele systemet end-to-end",
          "isCorrect": false
        },
        {
          "text": "At teste brugergr��nsefladen",
          "isCorrect": false
        },
        {
          "text": "At teste databaseforbindelser",
          "isCorrect": false
        }
      ],
      "qualityScore": 85,
      "reasoning": "Dette spørgsmål tester forståelsen af unit testing konceptet, som er et kernebegreb i materialet"
    }
  ],
  "count": 1,
  "message": "Advanced questions generated successfully",
  "metadata": {
    "contentType": "lesson",
    "contentId": "123",
    "processingTime": 2456
  }
}
```

## Fejlhåndtering

Servicen håndterer følgende fejlscenarier:

- OpenAI API fejl (timeout, rate limits)
- Parsing fejl af AI responses
- Manglende indhold i lessons/topics
- Valideringsfejl af genererede spørgsmål

Alle fejl logges og returneres med beskrivende fejlmeddelelser.

## Performance

- Gennemsnitlig responstid: 2-5 sekunder for 5 spørgsmål
- Maksimal batch størrelse: 20 spørgsmål per request
- Token forbrug: ~500-1000 tokens per spørgsmål (afhængig af indhold)

## Testing

Kør tests med:

```bash
npm test apps/api/src/ai/services/question-generation
```

## Fremtidige Forbedringer

1. **Caching**: Cache genererede spørgsmål for identisk indhold
2. **Batch Processing**: Generer spørgsmål for multiple lessons samtidigt
3. **Fine-tuning**: Træn en specialiseret model på uddannelsesdata
4. **Multi-language**: Understøt spørgsmålsgenerering på andre sprog
5. **Adaptive Difficulty**: Juster sværhedsgrad baseret på brugerens performance
