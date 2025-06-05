# Vejledning til Brug af Master-Prompt Manual for LearningLab

## Introduktion

Velkommen til Master-Prompt Manualen for LearningLab-projektet! Denne manual er designet til at være din primære ressource for effektiv fejlfinding, refaktorering og udvikling ved hjælp af en avanceret AI-kodningsassistent (som Claude 4 eller Gemini 2.5) integreret i din Cursor eller Trae IDE.

Formålet med manualen er at:

- **Standardisere fejlfindingsprocessen:** Ved at tilbyde præcise prompts for kendte og potentielle problemer.
- **Øge effektiviteten:** Gøre det hurtigere at diagnosticere og løse fejl med AI-assistance.
- **Sikre konsistens:** Anvende best practices og løsningsmønstre på tværs af kodebasen.
- **Dele viden:** Opsamle erfaringer og løsninger på almindelige udfordringer i LearningLab-stakken.

## Manualens Struktur

Manualen er organiseret i kategorier, der dækker forskellige aspekter af LearningLab-monorepoet. Hver kategori indeholder en række specifikke fejl-ID'er eller problemområder.

**Hovedkategorier:**

1.  `k1-afhaengigheder-moduloploesning-vaerktoej.md`: Fejl relateret til dependencies, hvordan moduler findes, og den overordnede værktøjskæde (Yarn, Turbo, etc.).
2.  `k2-typescript-konfiguration-stialiaser.md`: Udfordringer med TypeScript-opsætning, `tsconfig.json` filer, og path aliases.
3.  `k3-database-prisma.md`: Problemer relateret til Prisma ORM, databasemigrationer, og dataadgang.
4.  `k4-nextjs-frontend-specifikke-fejl.md`: Specifikke fejl for Next.js frontend-applikationen (`apps/web`).
5.  `k5-build-cicd-docker.md`: Udfordringer med build-processen, Continuous Integration/Continuous Deployment (CI/CD) via GitHub Actions, og Docker-opsætningen.
6.  `k6-linting-kodekvalitet-projektregler.md`: Problemer relateret til ESLint, Prettier, generel kodekvalitet og overholdelse af projektdefinerede regler.

**Indhold pr. Fejl-ID:**
For hvert specifikt fejl-ID eller problemområde finder du:

- **Trigger-tekst / Fejlkode:** Typiske symptomer eller konkrete fejlmeddelelser, der indikerer problemet.
- **AI Masterprompt:** En "plug and play" prompt, du kan kopiere direkte ind i din AI-assistents chatvindue. Denne prompt er designet til at give AI'en den nødvendige kontekst fra LearningLab-projektet for at kunne levere relevante og præcise løsningsforslag.
- **Løsningsskabeloner (Eksempler):** Eksempler på kodeændringer (ofte i `diff`-format), terminalkommandoer, eller konfigurationsjusteringer, som AI'en _kunne_ foreslå, eller som du kan bruge som reference. Disse er ikke altid den endelige løsning, men tjener som illustration.

## Sådan Bruger Du Manualen Effektivt

1.  **Identificer Problemet:**

    - Når du støder på en fejl, en advarsel, eller et område du ønsker at refaktorere, prøv først at matche symptomerne med en **Trigger-tekst / Fejlkode** i manualen.
    - Naviger gennem de relevante kategorifiler for at finde det mest passende fejl-ID.

2.  **Kopiér AI Masterprompten:**

    - Marker og kopiér hele den tilhørende **AI Masterprompt**.
    - Vær opmærksom på eventuelle placeholders i prompten (f.eks. `[indsæt pakkenavn her]`, `[indsæt filsti]`) og erstat dem med de specifikke detaljer fra din aktuelle situation, _før_ du sender prompten til AI'en.

3.  **Interager med AI-Assistenten:**

    - Indsæt den udfyldte masterprompt i chatvinduet i din Cursor eller Trae IDE.
    - AI'en har adgang til din kodebase via IDE-integrationen. Prompten guider AI'en til at bruge denne kontekst.
    - Gennemgå AI'ens analyse og løsningsforslag kritisk. AI'en er et værktøj; den endelige beslutning og ansvar for kodeændringer ligger hos dig.

4.  **Anvend Løsningen:**

    - Brug AI'ens forslag og de medfølgende **Løsningsskabeloner** til at implementere rettelsen.
    - Test altid ændringer grundigt (kør `yarn lint`, `yarn test`, `yarn build`, og test manuelt).

5.  **Bidrag til Manualen (Vigtigt!):**
    - Hvis du støder på en ny fejl, der ikke er dækket, eller finder en bedre løsning/prompt for et eksisterende problem, så opdatér manualen!
    - Tilføj nye fejl-ID'er, forfin prompts, eller tilføj nye løsningsskabeloner.
    - Dette er et levende dokument, der bliver bedre, jo mere teamet bruger og bidrager til det.

## Generelle Tips til AI-Prompts

- **Vær Specifik:** Jo mere kontekst og specifik information du giver AI'en (udover masterprompten, hvis nødvendigt), jo bedre bliver resultatet.
- **Iterér:** Hvis det første svar fra AI'en ikke er perfekt, stil opfølgende spørgsmål, bed om uddybning, eller bed den om at prøve en anden tilgang.
- **Små Skridt:** For komplekse problemer, overvej at bryde dem ned og bruge flere, mindre prompts.
- **Review Altid Koden:** AI-genereret kode skal altid gennemgås og forstås, før den implementeres.

## Vedligeholdelse af Manualen

- Hold filstrukturen (`MasterManual/kategori-X.md`) som den er.
- Når nye, generelle fejltyper identificeres, overvej om en ny kategori er nødvendig, eller om fejlen passer ind under en eksisterende.
- Sørg for at holde `manualvejledning.md` (denne fil) opdateret, hvis der sker større ændringer i, hvordan manualen er tænkt brugt.

Ved at bruge denne manual konsekvent og bidrage til dens udvikling, kan vi i fællesskab gøre LearningLab-projektet mere robust og udviklingsprocessen mere effektiv.
