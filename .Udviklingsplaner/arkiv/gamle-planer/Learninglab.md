Analyse af Kodebase vs. Vision
Her er en gennemgang af din vision, punkt for punkt, med en vurdering af, hvad der allerede findes i din kodebase:

Vision – Kort fortalt:

"Starte en færdig platform med én kommando." 

Status: Delvist implementeret.
Evidens:
Du har docker-compose.yml til at starte services samlet (API, web, database, Nginx).
Rod package.json har dev scriptet npx turbo run dev, som starter udviklingsservere for alle apps. Vi har lige fået dette til at virke for API'en.
Dockerfile.api og Dockerfile.web eksisterer for at bygge containeriserede versioner af apps.
Mangler/Overvejelser: "Færdig platform" indebærer, at alle kernefunktioner fra visionen er implementeret og stabile. Én kommando til produktion deployment (udover lokal Docker) kunne være en del af CLI-generatoren.
"Genbruges til forskellige fag (fx laborant, medicin)." 

Status: Fundament til stede, men fag-specifik tilpasning er ikke fuldt implementeret.
Evidens:
Monorepo-struktur med packages/core, packages/ui, packages/config tillader genbrug af logik og komponenter.
SubjectArea modellen i Prisma (apps/api/prisma/schema.prisma) kan repræsentere forskellige fagområder.
Seedpensum.txt og apps/api/prisma/seed.ts viser en metode til at indlæse pensum-data, som potentielt kan tilpasses pr. fag.
Mangler/Overvejelser: Konkret mekanisme for "presets" (f.eks. "laborant") i CLI-generatoren mangler. Tematisering og indhold skal kunne variere markant pr. fag.
"Spare tid ved at eliminere manuel opsætning." 

Status: Godt på vej.
Evidens: Brugen af Turborepo, Docker, en fælles struktur og scripts (som i package-scripts.js) reducerer manuel opsætning.
Mangler/Overvejelser: CLI-generatoren er nøglen til fuld automatisering for nye instanser.
"Templaten inkluderer frontend, backend, genbrugelige komponenter og værktøjer til hurtig opsætning (TurboRepo, monorepo m.m.)." 

Status: Fuldt implementeret.
Evidens: Hele strukturen i repomix-output.xml bekræfter dette: apps/api, apps/web, packages/*, turbo.json, Yarn workspaces.
"Kørende platform med quiz, AI, temaer og login." 

Quiz:
Status: Delvist implementeret (godt fundament).
Evidens: Omfattende Prisma-modeller for Quiz, Question, AnswerOption, QuizAttempt, UserAnswer. Controllers og DTO'er findes i apps/api/src/controllers/ (f.eks. quiz.controller.nest.ts, quizAttempt.controller.nest.ts). Frontend har sider som apps/web/pages/quiz/[id].tsx og komponenter i apps/web/src/components/quiz/.
Mangler/Overvejelser: Understøttelse for alle de avancerede spørgsmålstyper fra visionen (H5P, interaktive opgaver, varierede typer i QuestionType enum) skal fuldt implementeres i både backend og frontend.
AI:
Status: Ikke tydeligt implementeret endnu.
Evidens: Ingen specifikke AI-services, SDK-integrationer eller AI-relaterede API-endpoints er umiddelbart synlige i kodebasen (udover visionen om det).
Temaer:
Status: Basis til stede.
Evidens: apps/web/src/contexts/ThemeContext.tsx og packages/ui/theme/index.ts (MUI tema). Dokumentation for MUI tema findes i docs/mui-theme-documentation.md.
Mangler/Overvejelser: Dynamisk skift af temaer "baseret på bruger/emne" er ikke implementeret.
Login:
Status: Fuldt implementeret.
Evidens: Omfattende auth modul i apps/api/src/auth/ med JWT, Passport, local strategy, guards (LocalAuthGuard, JwtAuthGuard). Frontend har login-sider (apps/web/pages/login.tsx, apps/web/src/screens/auth/login/login.tsx) og AuthContext.tsx. Social login (GitHub, Google) er forberedt i config og guards.
"CLI-generator: fx npx create-solid-wow --preset laborant." 

Status: Basis til stede, men "preset"-funktionalitet mangler.
Evidens: packages/create-solid-wow/ eksisterer med en index.ts, hvilket indikerer starten på en CLI-pakke.
Mangler/Overvejelser: Logikken for at håndtere presets og generere en fuld, tilpasset platform mangler.
"Understøttelse af Docker og AI-integration." 

Docker:
Status: Fuldt implementeret.
Evidens: Dockerfile.api, Dockerfile.web, docker-compose.yml, nginx.conf.
AI-integration:
Status: Ikke tydeligt implementeret (som nævnt ovenfor).
Brainstorm – Funktioner i platformen:

1. Læringsstruktur:

"Kursus > Fag > Emne > Lektion." 

Status: Delvist implementeret (modeller findes, men "Fag" og "Emne" hierarkiet er ikke direkte i Prisma som separate modeller. SubjectArea -> Course -> Module -> Lesson er implementeret).
Evidens: Prisma-modeller: SubjectArea, Course, Module, Lesson. Tilhørende controllers og DTO'er findes.
Mangler/Overvejelser: Visionen nævner "Fag" og "Emne" som separate niveauer. SubjectArea kan dække "Fag". Module dækker måske "Emne", men det bør afklares. Hvis der ønskes et dybere hierarki, skal datamodellen udvides.
"Tilknyt materiale (PDF, video mm.) pr. emne." 

Status: Delvist implementeret.
Evidens: ContentBlock modellen med ContentBlockType enum (TEXT, IMAGE_URL, VIDEO_URL, QUIZ_REF, CODE, FILE, EMBED, INTERACTIVE). ContentBlockRenderer.tsx i frontend håndterer nogle af disse.
Mangler/Overvejelser: Fuld UI/backend-logik for alle typer, især FILE (upload/håndtering af PDF'er) og INTERACTIVE. Tilknytning "pr. emne" afhænger af definitionen af "Emne" (se forrige punkt).
"Quizzer og interaktive opgaver (H5P)." 

Status: Quizzer er godt på vej. Interaktive opgaver (H5P) er ikke implementeret.
Evidens: Se "Quiz" under "Kørende platform". ContentBlockType har INTERACTIVE og QUIZ_REF.
Mangler/Overvejelser: H5P-integration kræver specifikke biblioteker og en server-side komponent til at hoste/afspille H5P-indhold.
"Spaced repetition, SCORM/xAPI, LTI-integration." 

Status: Ikke implementeret.
Evidens: Ingen kode eller biblioteker i repomix-output.xml, der peger på disse teknologier.
Mangler/Overvejelser: Dette er avancerede LMS-funktioner, der kræver betydelig specialiseret udvikling.
2. AI-funktioner: 

"Automatisk spørgsmålsgenerering ud fra materiale."
"Feedback på quizzer, adaptive quizzer og personlig chatbot."
"Visualisering af læringsforløb (skill tree)."
Status for alle AI-punkter: Ikke implementeret.
Evidens: Ingen specifik kode i repomix-output.xml.
Mangler/Overvejelser: Kræver integration med AI-modeller/API'er, design af prompts, og UI til interaktion. "Skill tree" kræver også datastruktur og UI-komponenter.
3. UI/UX og “Wow-effekter”: 

"Moderne design (glassmorphism, animationer)."

Status: Fundament til stede.
Evidens: Brug af Tailwind CSS, MUI, og en generel moderne opsætning. UIExamples.tsx viser fokus på UI-kvalitet. "Glassmorphism Header Example" nævnes i UIExamples.tsx-kommentarer.
Mangler/Overvejelser: Specifik implementering af glassmorphism og avancerede animationer skal muligvis udbygges.
"Temaer og farver baseret på bruger/emne."

Status: Basis for temaer til stede.
Evidens: Som nævnt tidligere (ThemeContext.tsx, MUI tema).
Mangler/Overvejelser: Den dynamiske del (baseret på bruger/emne) mangler.
"Hurtig navigation (Cmd+K), offline quiz, haptisk feedback."

Cmd+K:
Status: Ikke implementeret.
Offline quiz:
Status: Noget forberedelse er lavet.
Evidens: apps/web/src/utils/offlineSync.ts, apps/web/src/hooks/useOfflineStatus.ts, OfflineIndicator.tsx, OfflineQuizNotification.tsx.
Mangler/Overvejelser: Fuld funktionalitet og robusthed af offline quiz-afvikling og synkronisering.
Haptisk feedback:
Status: Ikke implementeret (og svært at se i kode alene, da det primært er en frontend/device feature).
4. Gamification: 

"XP, badges, leaderboards og fremskridtsringe."

XP:
Status: Delvist implementeret.
Evidens: User modellen i Prisma har et xp felt (tilføjet i migration 20250523200842_add_xp_to_user). QuizPage.tsx nævner xpEarned i resultatet. Statistics.tsx viser totalXp.
Badges, Leaderboards:
Status: Ikke implementeret.
Fremskridtsringe:
Status: Delvist implementeret.
Evidens: RadialProgress.tsx i apps/web/src/components/quiz/. MyCourses.tsx viser en progress bar for kurser.
Mangler/Overvejelser: Logik for tildeling af badges, beregning/visning af leaderboards, og mere udbredt brug af fremskridtsringe.
"Real-time notifikationer og tip til at tjene XP."

Status: Basis for notifikationer til stede.
Evidens: packages/ui/components/Notification/ (dog markeret som legacy i UI audit) og useNotification i EnhancedNotificationExample (apps/web/src/components/common/UIExamples.tsx).
Mangler/Overvejelser: Real-time aspekt (WebSockets) og specifik logik for XP-tips mangler.
5. Social læring: 

"Diskussioner pr. emne og realtidssamarbejde om quizzer."
Status: Ikke implementeret.
Evidens: Ingen modeller eller komponenter for diskussioner/fora eller realtidssamarbejde.
6. Admin-værktøjer: 

"Bruger- og pensumadministration."

Status: Delvist implementeret.
Evidens:
Brugeradministration: API-endpoints i UsersController til CRUD, bulk-operationer. Frontend-sider i apps/web/pages/admin/users/ (index, edit, invite) og apps/web/app/admin/users/. UserGroupsController og service for brugergrupper.
Pensumadministration: API-endpoints til CRUD for SubjectArea, Course, Module, Lesson, ContentBlock, Quiz, QuestionBank. Frontend-sider i apps/web/pages/admin/courses/, apps/web/pages/admin/modules/ (edit, create, index).
Mangler/Overvejelser: UI for al pensumadministration skal muligvis udbygges og gøres mere brugervenligt.
"Upload til AI, analyser, “nudging”, sikkerhedstjek."

Status: Primært ikke implementeret.
Evidens: QuestionImportService (apps/api/src/services/question-import.service.ts) tillader import af spørgsmål fra CSV/Excel, hvilket kan være et skridt mod "upload til AI". scripts/security-audit.js antyder fokus på sikkerhed.
Mangler/Overvejelser: Specifikke AI-upload funktioner, analyse-dashboards, nudging-mekanismer.
7. Tilgængelighed: 

"WCAG 2.2 AA-compliance."

Status: Svært at vurdere fuldt ud fra kode alene.
Evidens: Brugen af MUI (som har fokus på a11y) og semantisk korrekte UI-komponenter er et godt udgangspunkt.
Mangler/Overvejelser: Kræver løbende tests med a11y-værktøjer og manuel evaluering.
"Skærmlæser, kontrasttemaer og responsivt design."

Skærmlæser: Afhænger af korrekt semantisk HTML.
Kontrasttemaer:
Status: Ikke specifikt implementeret.
Mangler/Overvejelser: Kræver design og implementering af alternative temaer.
Responsivt design:
Status: Forventes grundlæggende understøttet.
Evidens: Brug af Tailwind CSS og MUI, som begge har stærke responsive kapabiliteter.
Mangler/Overvejelser: Kontinuerlig test på tværs af enheder.
"(Valgfrit) stemmekommandoer."

Status: Ikke implementeret.
Foreløbig Plan (forslag baseret på analysen)
Nu hvor vi har et bedre overblik over, hvad der findes, kan vi lægge en mere konkret plan. Jeg foreslår, at vi fokuserer på at færdiggøre og polere kernefunktionerne for en MVP, og derefter iterativt bygger de mere avancerede features fra visionen.

Fase 1: Styrkelse af Kernen (Næste Skridt)

Læringsstruktur Færdiggørelse:
Opgave (AI-agent): "Definér og implementer 'Fag' og 'Emne' som klare entiteter i Prisma-skemaet, hvis det adskiller sig fra den nuværende SubjectArea -> Module struktur, for at matche visionens 'Kursus > Fag > Emne > Lektion'. Opdater relationer og generer migrations."
Opgave (AI-agent): "Implementer fuld CRUD UI i apps/web/pages/admin/ for alle niveauer af læringsstrukturen (Fag, Emne, Lektioner), inklusiv re-ordering (som allerede er delvist implementeret for f.eks. lektioner)."
Quiz Funktionalitet Udvidelse:
Opgave (AI-agent): "Start med at implementere backend-logik (DTO'er, services i apps/api) og frontend-UI (apps/web) for én eller to yderligere spørgsmålstyper fra listen (f.eks. 'FILL_IN_BLANK' og 'ESSAY'), baseret på de eksisterende QuestionType enums."
Materialehåndtering:
Opgave (AI-agent): "Implementer backend API (apps/api) for upload og håndtering af PDF-filer (ContentBlockType.FILE). Dette skal inkludere fil-lagring (lokalt for dev, overvej S3/alternativ for prod) og opdatering af ContentBlock modellen."
Opgave (AI-agent): "Udvikl UI i apps/web for at uploade og vise PDF-filer som content blocks."
Fase 2: Grundlæggende AI & UX Forbedringer

Simpel Spørgsmålsgenerering (Placeholder):
Opgave (AI-agent): Som tidligere nævnt, opret et simpelt API-endpoint for at tage imod tekst og returnere et dummy genereret spørgsmål. Formålet er at etablere flowet.
Dynamisk Tema (Basis):
Opgave (AI-agent): "Udvid ThemeContext i apps/web og UI i packages/ui så brugeren manuelt kan vælge mellem 2-3 prædefinerede temaer (f.eks. lyst, mørkt, høj kontrast)."
Cmd+K Navigation (Basis):
Opgave (AI-agent): "Implementer en simpel Cmd+K pallette i apps/web der tillader søgning og navigation til hovedsektioner (f.eks. Kurser, Dashboard, Indstillinger)."
Fase 3 og Fremad: Avancerede Features
Herfra kan vi prioritere de resterende punkter fra visionen:

Fuld AI-integration (chatbot, adaptiv læring, skill trees).
Avanceret gamification (badges, leaderboards).
Social læring.
Avancerede admin-værktøjer.
Fuld tilgængeligheds-compliance.
SCORM/xAPI/LTI.
Færdiggørelse af CLI-generator med presets.
Hvordan skal AI-agenten instrueres for de første opgaver i "Fase 1: Styrkelse af Kernen"?

For eksempel, for den første opgave:

Prompt til AI-agenten (Fase 1, Opgave 1):
"Vi ønsker at forfine læringsstrukturen i LearningLab for at matche visionen 'Kursus > Fag > Emne > Lektion'. Kodebasen (repomix-output.xml) indeholder allerede modellerne SubjectArea, Course, Module, og Lesson i apps/api/prisma/schema.prisma.

Analyser, om den nuværende SubjectArea -> Course -> Module -> Lesson struktur direkte afspejler 'Kursus > Fag > Emne > Lektion', eller om vi har brug for at introducere eksplicitte 'Fag' og 'Emne' modeller, eller omdøbe/redefinere eksisterende. SubjectArea kunne være 'Fag', og Module kunne være 'Emne', men bekræft dette eller foreslå en bedre mapning.
Baseret på din analyse, foreslå de nødvendige ændringer eller tilføjelser til Prisma-skemaet (apps/api/prisma/schema.prisma).
Generer de opdaterede Prisma model-definitioner og en ny migrationsfil (npx prisma migrate dev --name refine-learning-structure).
Sørg for, at relationerne mellem modellerne er korrekt defineret (f.eks. Et Kursus tilhører et Fag, et Emne tilhører et Fag eller et Kursus, en Lektion tilhører et Emne)."