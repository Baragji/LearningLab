### Oversigt – LearningLabs datastruktur og seneste modelrevisioner

Denne informationsblok beskriver den nuværende datamodel i LearningLab-platformen samt de ændringer, der er gennemført i fase 1-revisionen. Formålet er at give nye udviklere et samlet overblik, så de hurtigt kan forstå modelhierarkiet, navngivningen i kodebasen og den tilhørende migrationshistorik.

---

#### 1. Hovedhierarki

```
EducationProgram
   └─ Course (inkl. semesterNumber)
        └─ Topic (med subjectCategory: FagCategory)
             └─ Lesson
                  └─ ContentBlock
```

* **EducationProgram**
  Tidligere *SubjectArea*. Repræsenterer et samlet uddannelsesforløb eller uddannelsesretning.

* **Course**
  Indeholder et valgfrit heltalsfelt **semesterNumber** (Int?) for at angive placeringen i uddannelsens forløb.

* **Topic**
  Tidligere *Module*. Har mange-til-én-relation til Course og et felt **subjectCategory** baseret på den nye enum **FagCategory**
  (`KEMI | BIOLOGI | DATABEHANDLING | ANDET`). Feltet er midlertidigt valgfrit af hensyn til eksisterende data.

* **Lesson**
  Nu koblet til Topic (mange Lesson-poster pr. Topic).

* **ContentBlock**
  Uændret relation til Lesson; bruges til at lagre selve læringsindholdet (tekst, video-refs, quizzer osv.).

---

#### 2. Navngivning i backend‐koden

Alle filer, klasser, controllere, services, DTO’er og moduler under `apps/api/src/` følger de nye betegnelser:

| Tidligere navn          | Nyt navn                     |
| ----------------------- | ---------------------------- |
| `SubjectAreaController` | `EducationProgramController` |
| `SubjectAreaService`    | `EducationProgramService`    |
| `ModuleController`      | `TopicController`            |
| `ModuleService`         | `TopicService`               |
| osv.                    |                              |

Disse omdøbninger sikrer konsistens mellem Prisma-skemaet og NestJS-lagene.

---

#### 3. Prisma-skema og migrationshistorik

| Migrations-filnavn                                            | Indhold                                                                            |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `transform-subjectarea-to-educationprogram-and-update-course` | Omdøber modellen, tilføjer relation samt feltet `semesterNumber`.                  |
| `transform-module-to-topic-with-fagcategory`                  | Omdøber Module→Topic, introducerer `FagCategory` enum og feltet `subjectCategory`. |
| `update-lesson-relation-to-topic`                             | Pege Lesson-relationen fra Module→Topic; bekræfter ContentBlock-relation.          |

Efter hver skemaændring køres `npx prisma generate` for at regenerere Prisma Client.

---

#### 4. Datamigrering og fremtidige skridt

* **subjectCategory-udfyldning** – Eksisterende Topic-poster (tidl. Module) mangler kategori. Feltet er midlertidigt valgfrit; en særskilt migreringsrutine skal senere tildele passende værdier eller bruge `ANDET` som default.
* **Frontend** – Ingen tilpasninger er nødvendige i denne fase; komponenter refererer fortsat til GraphQL-/REST-endpoints, som nu blot eksponerer de omdøbte entiteter.

---

#### 5. Praktiske noter

* Branch-strategi: alle ændringer i fase 1 ligger i én feature-branch, så diff-review er overskueligt.
* Testdækning: Enheds- og integrationstests er opdateret til nye modelnavne; CI‐pipelines kræver ingen yderligere tweaks.
* Dokumentation: Denne oversigt bør ligge i repo-roden (`docs/architecture/learninglab_data_model.md`) for hurtig reference.

Med denne struktur og navngivning som udgangspunkt kan efterfølgende udvikling fortsætte uden at skulle dechifrere historiske navne eller relateringsmønstre.
