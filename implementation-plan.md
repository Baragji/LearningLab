# LearningLab Template Implementation Plan

Dette dokument indeholder en detaljeret, faseopdelt plan for at færdiggøre LearningLab templaten. Planen er opdelt i 5 faser, hvor hver fase bygger videre på den forrige og fokuserer på specifikke områder af projektet. Dokumentet inkluderer også afhængigheder mellem opgaver, risikovurdering, og strategier for testning og dokumentation.

## Indholdsfortegnelse

1. [Projektoverblick og strategiske overvejelser](#projektoverblick-og-strategiske-overvejelser)
   - [Projektmål og succeskriterier](#projektmål-og-succeskriterier)
   - [Afhængighedsstyring](#afhængighedsstyring)
   - [Risikovurdering og mitigering](#risikovurdering-og-mitigering)
   - [Ressourceallokering](#ressourceallokering)

2. [Fase 1: Færdiggørelse af kernestruktur og grundlæggende funktionalitet](#fase-1-færdiggørelse-af-kernestruktur-og-grundlæggende-funktionalitet) (2.5 uger)
3. [Fase 2: UI-komponenter og brugeroplevelse](#fase-2-ui-komponenter-og-brugeroplevelse) (2.5 uger)
4. [Fase 3: Gamification og brugerengagement](#fase-3-gamification-og-brugerengagement) (2.5 uger)
5. [Fase 4: AI-integration](#fase-4-ai-integration) (4 uger)
6. [Fase 5: CLI-generator og presets](#fase-5-cli-generator-og-presets) (2.5 uger)
7. [Testning og kvalitetssikring](#testning-og-kvalitetssikring) (Løbende)
8. [Dokumentation og vidensdeling](#dokumentation-og-vidensdeling) (Løbende)
9. [Projektafslutning og evaluering](#projektafslutning-og-evaluering) (1 uge)

## Projektoverblick og strategiske overvejelser

### Projektmål og succeskriterier

**Overordnede mål:**
- Udvikle en fleksibel og skalerbar LearningLab template
- Skabe en platform der understøtter moderne læringsmetoder og engagement
- Levere en løsning der nemt kan tilpasses forskellige fagområder

**Succeskriterier:**
- Komplet funktionalitet som beskrevet i alle faser
- Kodebase med mindst 85% test coverage
- Dokumentation der muliggør onboarding af nye udviklere på under 2 dage
- Brugervenlig UI med høj tilgængelighed (WCAG AA-standard)
- Skalerbarhed til at håndtere mindst 10.000 samtidige brugere

### Afhængighedsstyring

**Kritisk sti:**
```
Fase 1 (Kernestruktur) → Fase 2 (UI) → Fase 3 (Gamification) → Fase 4 (AI) → Fase 5 (CLI)
```

**Parallelle spor:**
- Dokumentation og testning (kan køre parallelt med alle faser)
- UI-komponent udvikling (kan starte tidligt i Fase 1)
- DevOps og infrastruktur (kan implementeres gradvist)

**Milepæle og gateways:**
- M1: Kernearkitektur og datamodel godkendt (slutningen af uge 1)
- M2: Grundlæggende API og autentificering implementeret (slutningen af uge 3)
- M3: UI-komponentbibliotek færdigt (slutningen af uge 5)
- M4: Gamification-funktioner implementeret (slutningen af uge 8)
- M5: AI-integration færdig (slutningen af uge 12)
- M6: CLI og presets færdige (slutningen af uge 14)
- M7: Endelig release (slutningen af uge 15)

### Risikovurdering og mitigering

| Risiko | Sandsynlighed | Konsekvens | Mitigeringsstrategi |
|--------|---------------|------------|---------------------|
| Forsinkelser i AI-integration | Høj | Medium | Start tidligt med proof-of-concept, hav fallback-løsninger uden AI |
| Performanceproblemer ved skalering | Medium | Høj | Implementer load testing tidligt, design for skalerbarhed fra start |
| Teknisk gæld | Medium | Medium | Regelmæssige code reviews, refactoring-sprints, klare kodestandarder |
| Sikkerhedssårbarheder | Lav | Høj | Sikkerhedsreviews, penetrationstest, følg OWASP-guidelines |
| Afhængighed af eksterne API'er | Medium | Medium | Implementer circuit breakers, caching, og fallback-mekanismer |

### Ressourceallokering

**Team:**
- 2 Backend-udviklere
- 2 Frontend-udviklere
- 1 DevOps-specialist
- 1 UX/UI-designer
- 1 Projektleder

**Teknologistack:**
- Backend: NestJS, Prisma, PostgreSQL
- Frontend: React, TypeScript, MUI
- DevOps: Docker, GitHub Actions, Terraform
- AI: OpenAI API, TensorFlow.js

## Fase 1: Færdiggørelse af kernestruktur og grundlæggende funktionalitet

**Varighed: 2.5 uger**

**Mål:** Etablere en solid grundstruktur med komplet datamodel, API-endpoints, autentificering og indholdsadministration.

**Afhængigheder:**
- Kræver: Godkendt arkitekturdesign og teknologivalg
- Blokkerer: UI-udvikling (Fase 2), Gamification (Fase 3)

### 1.1 Databasemodel og API-endpoints (4 dage)

1. **Gennemgå og udvid databasemodellen** *(Dag 1-2)*
   - Tilføj manglende felter til eksisterende modeller
   - Tilføj `createdBy` og `updatedBy` felter til relevante modeller
   - Implementer soft delete for alle modeller
   - Tilføj indekser for optimeret søgning og filtrering
   - Implementer datamigrationsstrategi for eksisterende data

   ```prisma
   // Eksempel på soft delete og audit fields i Prisma schema
   model Course {
     id        Int       @id @default(autoincrement())
     title     String
     description String?
     // Eksisterende felter...
     
     // Audit fields
     createdAt DateTime  @default(now())
     updatedAt DateTime  @updatedAt
     createdBy Int?
     updatedBy Int?
     deletedAt DateTime?
     
     // Relations
     creator   User?     @relation("CourseCreator", fields: [createdBy], references: [id])
     updater   User?     @relation("CourseUpdater", fields: [updatedBy], references: [id])
     
     // Indexes for performance
     @@index([title])
     @@index([deletedAt])
     @@index([createdAt])
   }
   ```

2. **Implementer manglende API-endpoints** *(Dag 2-3)*
   - Gennemgå alle modeller og sikr CRUD-operationer
   - Implementer filtrering, sortering og paginering for alle liste-endpoints
   - Tilføj validering for alle input-data med class-validator
   - Implementer API-versionering (v1, v2) for fremtidssikring
   - Tilføj rate limiting og sikkerhedsforanstaltninger

   ```typescript
   // Eksempel på controller med filtrering, paginering og validering
   @Controller('api/v1/courses')
   export class CoursesController {
     constructor(private readonly coursesService: CoursesService) {}
     
     @Get()
     @UseGuards(JwtAuthGuard)
     @UseInterceptors(CacheInterceptor)
     async findAll(
       @Query() queryDto: CourseQueryDto,
       @CurrentUser() user: User,
     ) {
       // Validate permissions
       this.authorizationService.validateAccess(user, 'course', 'read');
       
       const { page = 1, limit = 10, sort = 'createdAt', order = 'desc', filter } = queryDto;
       
       return this.coursesService.findAll({
         page: Number(page),
         limit: Number(limit),
         sort,
         order: order as 'asc' | 'desc',
         filter: filter ? JSON.parse(filter) : undefined,
         userId: user.id, // For filtering by user permissions
       });
     }
     
     @Post()
     @UseGuards(JwtAuthGuard)
     @UsePipes(new ValidationPipe({ transform: true }))
     async create(
       @Body() createCourseDto: CreateCourseDto,
       @CurrentUser() user: User,
     ) {
       // Validate permissions
       this.authorizationService.validateAccess(user, 'course', 'create');
       
       return this.coursesService.create({
         ...createCourseDto,
         createdBy: user.id,
       });
     }
     
     // Other endpoints...
   }
   
   // DTO with validation
   export class CreateCourseDto {
     @IsString()
     @MinLength(3)
     @MaxLength(100)
     title: string;
     
     @IsString()
     @IsOptional()
     @MaxLength(1000)
     description?: string;
     
     @IsArray()
     @IsString({ each: true })
     @IsOptional()
     tags?: string[];
     
     @IsEnum(Difficulty)
     @IsOptional()
     difficulty?: Difficulty = Difficulty.BEGINNER;
     
     // Other fields...
   }
   ```

3. **Implementer avancerede søgefunktioner** *(Dag 3-4)*
   - Tilføj fuld-tekst søgning på tværs af kurser, moduler og lektioner
   - Implementer filtrering baseret på tags, kategorier og sværhedsgrad
   - Tilføj facetteret søgning med aggregeringer
   - Implementer søgeresultat-highlighting
   - Tilføj søgehistorik og populære søgninger

   ```typescript
   // Eksempel på avanceret søgeservice
   @Injectable()
   export class SearchService {
     constructor(
       private readonly prisma: PrismaService,
       private readonly elasticsearchService: ElasticsearchService,
     ) {}
     
     async search(query: string, options: SearchOptions): Promise<SearchResult> {
       // Implementer fallback-mekanisme hvis Elasticsearch ikke er tilgængelig
       try {
         return await this.searchWithElasticsearch(query, options);
       } catch (error) {
         this.logger.warn('Elasticsearch search failed, falling back to database search', error);
         return await this.searchWithDatabase(query, options);
       }
     }
     
     private async searchWithElasticsearch(query: string, options: SearchOptions): Promise<SearchResult> {
       // Implementer Elasticsearch-søgning med highlighting og facets
       const { index, page, limit, filters } = options;
       
       const result = await this.elasticsearchService.search({
         index,
         from: (page - 1) * limit,
         size: limit,
         body: {
           query: {
             bool: {
               must: [
                 {
                   multi_match: {
                     query,
                     fields: ['title^3', 'description^2', 'content'],
                     fuzziness: 'AUTO',
                   },
                 },
               ],
               filter: this.buildFilters(filters),
             },
           },
           highlight: {
             fields: {
               title: {},
               description: {},
               content: {},
             },
           },
           aggs: this.buildAggregations(filters),
         },
       });
       
       // Log search for analytics
       await this.logSearch(query, options, result.hits.total.value);
       
       return this.formatSearchResult(result);
     }
     
     // Other methods...
   }
   ```

4. **Implementer API-dokumentation og monitoring** *(Dag 4)*
   - Tilføj Swagger/OpenAPI dokumentation for alle endpoints
   - Implementer API-logging og monitoring
   - Tilføj health checks og readiness probes
   - Implementer API-metrics for performance-tracking

### 1.2 Autentificering og brugeradministration (4 dage)

**Afhængigheder:**
- Kræver: Databasemodel (1.1)
- Blokkerer: Kursusadministration (1.3), Brugerengagement (Fase 3)

1. **Udvid brugermodellen** *(Dag 1)*
   - Tilføj profilbillede, bio, sociale links
   - Implementer brugerindstillinger (notifikationer, privatindstillinger)
   - Tilføj brugerroller og tilladelser med RBAC (Role-Based Access Control)
   - Implementer brugerverifikation og kontoaktivering
   - Tilføj GDPR-compliance felter (samtykke, data retention)

   ```prisma
   model User {
     id        Int       @id @default(autoincrement())
     email     String    @unique
     password  String
     name      String
     // Udvidede profil-felter
     profileImage String?
     bio        String?
     socialLinks Json?
     settings   Json?
     
     // Roller og tilladelser
     role       Role     @default(STUDENT)
     permissions Permission[]
     
     // Verifikation og sikkerhed
     isVerified Boolean  @default(false)
     verificationToken String?
     resetPasswordToken String?
     resetPasswordExpires DateTime?
     twoFactorSecret String?
     twoFactorEnabled Boolean @default(false)
     
     // GDPR og privacy
     consentGiven Boolean @default(false)
     consentTimestamp DateTime?
     dataRetentionDate DateTime?
     
     // Audit og tracking
     lastLogin  DateTime?
     loginCount Int      @default(0)
     failedLoginAttempts Int @default(0)
     lockedUntil DateTime?
     
     // Relations
     sessions   Session[]
     courses    CourseEnrollment[]
     createdAt  DateTime @default(now())
     updatedAt  DateTime @updatedAt
     deletedAt  DateTime?
     
     @@index([email])
     @@index([role])
     @@index([deletedAt])
   }
   
   model Permission {
     id        Int       @id @default(autoincrement())
     name      String    @unique
     users     User[]
     createdAt DateTime  @default(now())
     updatedAt DateTime  @updatedAt
   }
   
   model Session {
     id        String    @id @default(uuid())
     userId    Int
     token     String    @unique
     device    String?
     ip        String?
     expiresAt DateTime
     createdAt DateTime  @default(now())
     user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
     
     @@index([userId])
     @@index([expiresAt])
   }
   
   enum Role {
     STUDENT
     TEACHER
     ADMIN
     SUPER_ADMIN
   }
   ```

2. **Implementer robust autentificering** *(Dag 2)*
   - Implementer JWT-baseret autentificering med refresh tokens
   - Tilføj social login (Google, GitHub, Microsoft) med OAuth2
   - Implementer two-factor authentication (TOTP, SMS)
   - Tilføj session management med device tracking
   - Implementer sikkerhedsforanstaltninger (rate limiting, brute force protection)

   ```typescript
   // Auth service med robust implementering
   @Injectable()
   export class AuthService {
     constructor(
       private readonly usersService: UsersService,
       private readonly jwtService: JwtService,
       private readonly configService: ConfigService,
       private readonly mailService: MailService,
       private readonly twoFactorService: TwoFactorService,
       private readonly sessionService: SessionService,
     ) {}
     
     async validateUser(email: string, password: string): Promise<any> {
       const user = await this.usersService.findByEmail(email);
       
       // Check if user exists and is not locked
       if (!user || user.lockedUntil && user.lockedUntil > new Date()) {
         // Increment failed login attempts if user exists
         if (user) {
           await this.handleFailedLogin(user);
         }
         return null;
       }
       
       // Verify password
       const isPasswordValid = await bcrypt.compare(password, user.password);
       if (!isPasswordValid) {
         await this.handleFailedLogin(user);
         return null;
       }
       
       // Reset failed login attempts on successful login
       if (user.failedLoginAttempts > 0) {
         await this.usersService.update(user.id, {
           failedLoginAttempts: 0,
           lockedUntil: null,
         });
       }
       
       // Update login stats
       await this.usersService.update(user.id, {
         lastLogin: new Date(),
         loginCount: { increment: 1 },
       });
       
       return this.sanitizeUser(user);
     }
     
     async login(user: any, deviceInfo: DeviceInfo): Promise<AuthResponse> {
       // Check if 2FA is required
       if (user.twoFactorEnabled) {
         return {
           requiresTwoFactor: true,
           userId: user.id,
           twoFactorToken: await this.twoFactorService.generateTempToken(user.id),
         };
       }
       
       // Generate tokens
       const tokens = await this.generateTokens(user);
       
       // Create session
       await this.sessionService.create({
         userId: user.id,
         token: tokens.refreshToken,
         device: deviceInfo.userAgent,
         ip: deviceInfo.ip,
         expiresAt: new Date(Date.now() + this.configService.get('auth.refreshTokenExpiry')),
       });
       
       return {
         accessToken: tokens.accessToken,
         refreshToken: tokens.refreshToken,
         user: this.sanitizeUser(user),
       };
     }
     
     // Other methods...
   }
   ```

3. **Implementer avanceret brugeradministration** *(Dag 3)*
   - Udvikl admin panel til brugeradministration
   - Tilføj bulk-operationer (invite multiple users, assign to courses)
   - Implementer brugergrupper og hierarkiske tilladelser
   - Tilføj brugerstatistik og aktivitetslog
   - Implementer brugereksport og import

   ```typescript
   // Admin controller for brugeradministration
   @Controller('api/v1/admin/users')
   @UseGuards(JwtAuthGuard, RolesGuard)
   @Roles(Role.ADMIN, Role.SUPER_ADMIN)
   export class AdminUsersController {
     constructor(
       private readonly usersService: UsersService,
       private readonly mailService: MailService,
       private readonly auditService: AuditService,
     ) {}
     
     @Get()
     async findAll(@Query() queryDto: AdminUserQueryDto): Promise<PaginatedResult<User>> {
       return this.usersService.findAll(queryDto);
     }
     
     @Post('bulk-invite')
     async bulkInvite(
       @Body() dto: BulkInviteDto,
       @CurrentUser() admin: User,
     ): Promise<BulkOperationResult> {
       const result = await this.usersService.bulkInvite(dto.emails, dto.role, dto.courseIds);
       
       // Log audit trail
       await this.auditService.log({
         action: 'BULK_INVITE',
         userId: admin.id,
         resource: 'users',
         details: {
           count: dto.emails.length,
           role: dto.role,
           courseIds: dto.courseIds,
         },
       });
       
       // Send invitation emails
       for (const user of result.created) {
         await this.mailService.sendInvitation(user.email, {
           name: user.name,
           invitedBy: admin.name,
           token: user.verificationToken,
         });
       }
       
       return result;
     }
     
     // Other admin endpoints...
   }
   ```

4. **Implementer tilladelsessystem og sikkerhed** *(Dag 4)*
   - Udvikl granulært tilladelsessystem (RBAC/ABAC)
   - Implementer sikkerhedsaudit og logging
   - Tilføj brugerverifikationsflow (email, telefon)
   - Implementer password policies og sikkerhedstjek
   - Tilføj GDPR-compliance funktioner (data export, deletion)

   ```typescript
   // Permission service med RBAC/ABAC
   @Injectable()
   export class PermissionService {
     constructor(
       private readonly prisma: PrismaService,
       private readonly configService: ConfigService,
       private readonly cacheManager: Cache,
     ) {}
     
     async hasPermission(
       userId: number,
       resource: string,
       action: string,
       context?: any,
     ): Promise<boolean> {
       // Check cache first
       const cacheKey = `perm:${userId}:${resource}:${action}`;
       const cached = await this.cacheManager.get(cacheKey);
       if (cached !== undefined) {
         return cached as boolean;
       }
       
       // Get user with roles and permissions
       const user = await this.prisma.user.findUnique({
         where: { id: userId },
         include: {
           permissions: true,
         },
       });
       
       if (!user) return false;
       
       // Super admin has all permissions
       if (user.role === Role.SUPER_ADMIN) {
         await this.cacheManager.set(cacheKey, true, 300); // Cache for 5 minutes
         return true;
       }
       
       // Check direct permissions
       const hasDirectPermission = user.permissions.some(
         p => p.name === `${resource}:${action}` || p.name === `${resource}:*`
       );
       
       if (hasDirectPermission) {
         await this.cacheManager.set(cacheKey, true, 300);
         return true;
       }
       
       // Check role-based permissions
       const rolePermissions = await this.getRolePermissions(user.role);
       const hasRolePermission = rolePermissions.some(
         p => p === `${resource}:${action}` || p === `${resource}:*`
       );
       
       if (hasRolePermission) {
         await this.cacheManager.set(cacheKey, true, 300);
         return true;
       }
       
       // Check context-based permissions (ABAC)
       if (context) {
         const hasContextPermission = await this.checkContextPermission(
           user,
           resource,
           action,
           context,
         );
         
         await this.cacheManager.set(cacheKey, hasContextPermission, 300);
         return hasContextPermission;
       }
       
       await this.cacheManager.set(cacheKey, false, 300);
       return false;
     }
     
     // Other methods...
   }
   ```

### 1.3 Kursus- og indholdsadministration (5 dage)

**Afhængigheder:**
- Kræver: Databasemodel (1.1), Autentificering (1.2)
- Blokkerer: Quiz-system (1.4), UI-komponenter (Fase 2)

1. **Udvid kursusmodellen** *(Dag 1)*
   - Tilføj metadata (tags, sværhedsgrad, estimeret tid, målgruppe)
   - Implementer kursusstatus og workflow (draft, review, published, archived)
   - Tilføj kursusbillede, banner og medieressourcer
   - Implementer kursusversioner og revisionshistorik
   - Tilføj SEO-metadata og deling på sociale medier

   ```prisma
   model Course {
     id          Int       @id @default(autoincrement())
     slug        String    @unique
     title       String
     description String?
     
     // Metadata
     tags        String[]
     difficulty  Difficulty @default(BEGINNER)
     estimatedHours Int?
     targetAudience String?
     prerequisites String[]
     learningObjectives String[]
     
     // Status og workflow
     status      CourseStatus @default(DRAFT)
     reviewerId  Int?
     reviewNotes String?
     publishedAt DateTime?
     
     // Media
     image       String?
     banner      String?
     mediaResources CourseMedia[]
     
     // SEO og deling
     seoTitle    String?
     seoDescription String?
     seoKeywords String[]
     ogImage     String?
     
     // Versioning
     version     Int       @default(1)
     isLatestVersion Boolean @default(true)
     previousVersionId Int?
     previousVersion Course? @relation("CourseVersions", fields: [previousVersionId], references: [id])
     nextVersions Course[] @relation("CourseVersions")
     
     // Relations
     modules     Module[]
     enrollments CourseEnrollment[]
     createdBy   Int?
     updatedBy   Int?
     createdAt   DateTime  @default(now())
     updatedAt   DateTime  @updatedAt
     deletedAt   DateTime?
     
     // Indexes
     @@index([status])
     @@index([difficulty])
     @@index([createdAt])
     @@index([tags])
     @@index([deletedAt])
   }
   
   model CourseMedia {
     id        Int       @id @default(autoincrement())
     courseId  Int
     type      MediaType
     url       String
     title     String?
     description String?
     order     Int       @default(0)
     course    Course    @relation(fields: [courseId], references: [id], onDelete: Cascade)
     
     @@index([courseId])
   }
   
   enum MediaType {
     IMAGE
     VIDEO
     DOCUMENT
     AUDIO
     OTHER
   }
   
   enum Difficulty {
     BEGINNER
     INTERMEDIATE
     ADVANCED
     EXPERT
   }
   
   enum CourseStatus {
     DRAFT
     REVIEW
     PUBLISHED
     ARCHIVED
   }
   ```

2. **Implementer avanceret indholdsmodel** *(Dag 2)*
   - Udvid ContentBlock med flere typer (code, file, embed, interactive, assessment)
   - Implementer versionering af indhold med diff-visning
   - Tilføj mulighed for at arrangere indhold via drag-and-drop
   - Implementer indholdsafhængigheder og forudsætninger
   - Tilføj indholdsanalyse og kompleksitetsvurdering

   ```prisma
   model Module {
     id          Int       @id @default(autoincrement())
     courseId    Int
     title       String
     description String?
     order       Int       @default(0)
     isPublished Boolean   @default(false)
     
     // Relations
     course      Course    @relation(fields: [courseId], references: [id], onDelete: Cascade)
     lessons     Lesson[]
     
     // Audit
     createdBy   Int?
     updatedBy   Int?
     createdAt   DateTime  @default(now())
     updatedAt   DateTime  @updatedAt
     deletedAt   DateTime?
     
     @@index([courseId])
     @@index([order])
   }
   
   model Lesson {
     id          Int       @id @default(autoincrement())
     moduleId    Int
     title       String
     description String?
     order       Int       @default(0)
     isPublished Boolean   @default(false)
     estimatedMinutes Int?
     
     // Content
     contentBlocks ContentBlock[]
     
     // Prerequisites
     prerequisites Lesson[] @relation("LessonPrerequisites")
     prerequisiteFor Lesson[] @relation("LessonPrerequisites")
     
     // Relations
     module      Module    @relation(fields: [moduleId], references: [id], onDelete: Cascade)
     
     // Audit
     createdBy   Int?
     updatedBy   Int?
     createdAt   DateTime  @default(now())
     updatedAt   DateTime  @updatedAt
     deletedAt   DateTime?
     
     @@index([moduleId])
     @@index([order])
   }
   
   model ContentBlock {
     id          Int       @id @default(autoincrement())
     lessonId    Int
     type        ContentBlockType
     content     Json
     order       Int       @default(0)
     
     // Versioning
     version     Int       @default(1)
     isLatestVersion Boolean @default(true)
     previousVersionId Int?
     previousVersion ContentBlock? @relation("ContentVersions", fields: [previousVersionId], references: [id])
     nextVersions ContentBlock[] @relation("ContentVersions")
     
     // Relations
     lesson      Lesson    @relation(fields: [lessonId], references: [id], onDelete: Cascade)
     
     // Audit
     createdBy   Int?
     updatedBy   Int?
     createdAt   DateTime  @default(now())
     updatedAt   DateTime  @updatedAt
     
     @@index([lessonId])
     @@index([type])
     @@index([order])
   }
   
   enum ContentBlockType {
     TEXT
     IMAGE_URL
     VIDEO_URL
     QUIZ_REF
     CODE
     FILE
     EMBED
     INTERACTIVE
     ASSESSMENT
     DISCUSSION
     ASSIGNMENT
     MARKDOWN
     MATH_FORMULA
     DIAGRAM
     TIMELINE
   }
   ```

3. **Implementer avanceret indholdseditor** *(Dag 3)*
   - Udvikl modulær rich text editor med plugins
   - Implementer upload af billeder og filer med optimering
   - Tilføj preview af indhold i forskellige formater (desktop, tablet, mobile)
   - Implementer samarbejdsfunktioner (kommentarer, forslag)
   - Tilføj versionskontrol og historik

   ```typescript
   // Content editor service
   @Injectable()
   export class ContentEditorService {
     constructor(
       private readonly prisma: PrismaService,
       private readonly storageService: StorageService,
       private readonly diffService: DiffService,
       private readonly notificationService: NotificationService,
     ) {}
     
     async createContentBlock(
       lessonId: number,
       data: CreateContentBlockDto,
       userId: number,
     ): Promise<ContentBlock> {
       // Process content based on type
       const processedContent = await this.processContent(data.type, data.content);
       
       // Create content block
       const contentBlock = await this.prisma.contentBlock.create({
         data: {
           lessonId,
           type: data.type,
           content: processedContent,
           order: data.order,
           createdBy: userId,
           updatedBy: userId,
         },
       });
       
       // Notify collaborators
       await this.notifyCollaborators(lessonId, userId, 'CONTENT_CREATED');
       
       return contentBlock;
     }
     
     async updateContentBlock(
       id: number,
       data: UpdateContentBlockDto,
       userId: number,
     ): Promise<ContentBlock> {
       // Get current version
       const currentBlock = await this.prisma.contentBlock.findUnique({
         where: { id },
       });
       
       if (!currentBlock) {
         throw new NotFoundException('Content block not found');
       }
       
       // Process content if provided
       const processedContent = data.content 
         ? await this.processContent(currentBlock.type, data.content)
         : undefined;
       
       // Create new version
       const updatedBlock = await this.prisma.$transaction(async (tx) => {
         // Set all previous versions as not latest
         if (processedContent) {
           await tx.contentBlock.update({
             where: { id },
             data: { isLatestVersion: false },
           });
           
           // Create new version
           return tx.contentBlock.create({
             data: {
               lessonId: currentBlock.lessonId,
               type: currentBlock.type,
               content: processedContent,
               order: data.order ?? currentBlock.order,
               version: currentBlock.version + 1,
               isLatestVersion: true,
               previousVersionId: id,
               createdBy: userId,
               updatedBy: userId,
             },
           });
         } else {
           // Just update order if content not changed
           return tx.contentBlock.update({
             where: { id },
             data: {
               order: data.order,
               updatedBy: userId,
               updatedAt: new Date(),
             },
           });
         }
       });
       
       // Generate diff for audit
       if (processedContent) {
         await this.diffService.createDiff({
           entityType: 'CONTENT_BLOCK',
           entityId: id,
           oldVersion: currentBlock.version,
           newVersion: updatedBlock.version,
           oldContent: currentBlock.content,
           newContent: processedContent,
           userId,
         });
       }
       
       // Notify collaborators
       await this.notifyCollaborators(currentBlock.lessonId, userId, 'CONTENT_UPDATED');
       
       return updatedBlock;
     }
     
     // Other methods...
   }
   ```

4. **Implementer kursusadministration og workflow** *(Dag 4)*
   - Udvikl kursusadministrationspanel
   - Implementer godkendelsesworkflow for kurser
   - Tilføj kursusduplikering og templating
   - Implementer batch-operationer for indhold
   - Tilføj import/eksport af kurser (SCORM, xAPI)

   ```typescript
   // Course administration controller
   @Controller('api/v1/admin/courses')
   @UseGuards(JwtAuthGuard, RolesGuard)
   @Roles(Role.ADMIN, Role.TEACHER)
   export class CourseAdminController {
     constructor(
       private readonly courseService: CourseService,
       private readonly workflowService: WorkflowService,
       private readonly exportService: CourseExportService,
       private readonly auditService: AuditService,
     ) {}
     
     @Post(':id/submit-for-review')
     async submitForReview(
       @Param('id', ParseIntPipe) id: number,
       @Body() dto: SubmitForReviewDto,
       @CurrentUser() user: User,
     ) {
       // Check permissions
       await this.courseService.checkCourseAccess(id, user.id, 'SUBMIT_FOR_REVIEW');
       
       // Submit for review
       const result = await this.workflowService.submitCourseForReview(id, {
         notes: dto.notes,
         submittedBy: user.id,
       });
       
       // Log audit
       await this.auditService.log({
         action: 'COURSE_SUBMITTED_FOR_REVIEW',
         userId: user.id,
         resource: 'course',
         resourceId: id,
         details: { notes: dto.notes },
       });
       
       return result;
     }
     
     @Post(':id/approve')
     @Roles(Role.ADMIN)
     async approveCourse(
       @Param('id', ParseIntPipe) id: number,
       @Body() dto: ApproveRejectDto,
       @CurrentUser() user: User,
     ) {
       const result = await this.workflowService.approveCourse(id, {
         notes: dto.notes,
         approvedBy: user.id,
       });
       
       // Log audit
       await this.auditService.log({
         action: 'COURSE_APPROVED',
         userId: user.id,
         resource: 'course',
         resourceId: id,
         details: { notes: dto.notes },
       });
       
       return result;
     }
     
     @Post(':id/duplicate')
     async duplicateCourse(
       @Param('id', ParseIntPipe) id: number,
       @Body() dto: DuplicateCourseDto,
       @CurrentUser() user: User,
     ) {
       // Duplicate course
       const newCourse = await this.courseService.duplicateCourse(id, {
         title: dto.title || `Copy of ${dto.title}`,
         includeContent: dto.includeContent ?? true,
         includeQuizzes: dto.includeQuizzes ?? true,
         createdBy: user.id,
       });
       
       // Log audit
       await this.auditService.log({
         action: 'COURSE_DUPLICATED',
         userId: user.id,
         resource: 'course',
         resourceId: id,
         details: { newCourseId: newCourse.id },
       });
       
       return newCourse;
     }
     
     @Get(':id/export/:format')
     async exportCourse(
       @Param('id', ParseIntPipe) id: number,
       @Param('format') format: 'scorm' | 'xapi' | 'pdf' | 'json',
       @CurrentUser() user: User,
       @Res() res: Response,
     ) {
       // Check permissions
       await this.courseService.checkCourseAccess(id, user.id, 'EXPORT');
       
       // Export course
       const { fileName, mimeType, content } = await this.exportService.exportCourse(id, format);
       
       // Log audit
       await this.auditService.log({
         action: 'COURSE_EXPORTED',
         userId: user.id,
         resource: 'course',
         resourceId: id,
         details: { format },
       });
       
       // Send file
       res.setHeader('Content-Type', mimeType);
       res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
       return res.send(content);
     }
     
     // Other endpoints...
   }
   ```

5. **Implementer indholdsanalyse og optimering** *(Dag 5)*
   - Udvikl indholdsanalyseværktøjer (læsbarhed, kompleksitet)
   - Implementer SEO-optimering for kurser og lektioner
   - Tilføj automatisk generering af metadata
   - Implementer indholdsanbefalinger baseret på analyse
   - Tilføj plagieringskontrol og kildeverifikation

   ```typescript
   // Content analysis service
   @Injectable()
   export class ContentAnalysisService {
     constructor(
       private readonly nlpService: NLPService,
       private readonly seoService: SEOService,
       private readonly recommendationService: RecommendationService,
     ) {}
     
     async analyzeContent(contentId: number): Promise<ContentAnalysis> {
       // Get content
       const content = await this.getContentById(contentId);
       
       // Extract text based on content type
       const text = this.extractText(content);
       
       // Run various analyses in parallel
       const [
         readabilityScore,
         complexityScore,
         keywordAnalysis,
         sentimentAnalysis,
         plagiarismCheck,
       ] = await Promise.all([
         this.nlpService.calculateReadability(text),
         this.nlpService.calculateComplexity(text),
         this.nlpService.extractKeywords(text),
         this.nlpService.analyzeSentiment(text),
         this.checkPlagiarism(text),
       ]);
       
       // Generate recommendations
       const recommendations = await this.generateRecommendations({
         readabilityScore,
         complexityScore,
         keywordAnalysis,
         sentimentAnalysis,
         plagiarismCheck,
         contentType: content.type,
       });
       
       // Generate SEO suggestions
       const seoSuggestions = await this.seoService.generateSuggestions({
         title: content.title,
         content: text,
         keywords: keywordAnalysis.keywords,
       });
       
       return {
         readabilityScore,
         complexityScore,
         keywordAnalysis,
         sentimentAnalysis,
         plagiarismCheck,
         recommendations,
         seoSuggestions,
       };
     }
     
     // Other methods...
   }
   ```

### 1.4 Quiz og vurderingssystem (5 dage)

**Afhængigheder:**
- Kræver: Databasemodel (1.1), Autentificering (1.2), Indholdsadministration (1.3)
- Blokkerer: Gamification (Fase 3), AI-integration (Fase 4)

1. **Udvid quiz- og spørgsmålsmodellen** *(Dag 1)*
   - Tilføj flere spørgsmålstyper (drag-and-drop, code, essay, hotspot, sequence)
   - Implementer tidsbegrænsning, forsøgsbegrænsning og adaptive quizzer
   - Tilføj avancerede quiz-indstillinger (randomize, partial scoring, branching)
   - Implementer spørgsmålsgrupper og sektioner
   - Tilføj metadata og tagging for spørgsmål

   ```prisma
   model Quiz {
     id          Int       @id @default(autoincrement())
     title       String
     description String?
     lessonId    Int?
     
     // Settings
     timeLimit   Int?      // i sekunder
     maxAttempts Int?
     passingScore Float?   // 0-100
     randomizeQuestions Boolean @default(false)
     randomizeAnswers Boolean @default(false)
     showAnswers  Boolean @default(true)
     showFeedback Boolean @default(true)
     isAdaptive   Boolean @default(false)
     allowPartialScoring Boolean @default(true)
     
     // Structure
     sections    QuizSection[]
     questions   Question[]   // For backwards compatibility or simple quizzes
     
     // Relations
     lesson      Lesson?   @relation(fields: [lessonId], references: [id])
     attempts    QuizAttempt[]
     
     // Audit
     createdBy   Int?
     updatedBy   Int?
     createdAt   DateTime  @default(now())
     updatedAt   DateTime  @updatedAt
     deletedAt   DateTime?
     
     @@index([lessonId])
     @@index([createdAt])
     @@index([deletedAt])
   }
   
   model QuizSection {
     id          Int       @id @default(autoincrement())
     quizId      Int
     title       String
     description String?
     order       Int       @default(0)
     
     // Settings
     timeLimit   Int?      // Override quiz time limit
     questionCount Int?    // Number of questions to select if using question bank
     
     // Relations
     quiz        Quiz      @relation(fields: [quizId], references: [id], onDelete: Cascade)
     questions   Question[]
     questionGroups QuestionGroup[]
     
     @@index([quizId])
     @@index([order])
   }
   
   model QuestionGroup {
     id          Int       @id @default(autoincrement())
     sectionId   Int
     title       String?
     description String?
     order       Int       @default(0)
     
     // Settings
     difficulty  Difficulty?
     tags        String[]
     selectCount Int?      // Number of questions to select from this group
     
     // Relations
     section     QuizSection @relation(fields: [sectionId], references: [id], onDelete: Cascade)
     questions   Question[]
     
     @@index([sectionId])
     @@index([order])
   }
   
   model Question {
     id          Int       @id @default(autoincrement())
     quizId      Int?
     sectionId   Int?
     groupId     Int?
     bankId      Int?      // For question bank
     
     // Content
     type        QuestionType
     content     Json      // Question text, media, etc.
     answers     Json      // Possible answers
     correctAnswer Json    // Correct answer(s)
     explanation String?   // Explanation of correct answer
     
     // Metadata
     difficulty  Difficulty?
     tags        String[]
     points      Float     @default(1)
     timeLimit   Int?      // Per-question time limit
     
     // Relations
     quiz        Quiz?     @relation(fields: [quizId], references: [id])
     section     QuizSection? @relation(fields: [sectionId], references: [id])
     group       QuestionGroup? @relation(fields: [groupId], references: [id])
     bank        QuestionBank? @relation(fields: [bankId], references: [id])
     responses   QuestionResponse[]
     
     // Audit
     createdBy   Int?
     updatedBy   Int?
     createdAt   DateTime  @default(now())
     updatedAt   DateTime  @updatedAt
     
     @@index([quizId])
     @@index([sectionId])
     @@index([groupId])
     @@index([bankId])
     @@index([type])
     @@index([difficulty])
     @@index([tags])
   }
   
   enum QuestionType {
     MULTIPLE_CHOICE
     MULTIPLE_ANSWER
     TRUE_FALSE
     FILL_IN_BLANK
     MATCHING
     DRAG_AND_DROP
     ORDERING
     HOTSPOT
     CODE
     ESSAY
     SHORT_ANSWER
     NUMERICAL
     FORMULA
     DRAWING
     AUDIO_RESPONSE
   }
   ```

2. **Implementer spørgsmålsbank og import/eksport** *(Dag 2)*
   - Udvikl komplet spørgsmålsbank med kategorier og tags
   - Implementer import af spørgsmål fra CSV/Excel/QTI
   - Tilføj mulighed for at genbruge spørgsmål på tværs af quizzer
   - Implementer batch-operationer for spørgsmål
   - Tilføj versionering og historik for spørgsmål

   ```prisma
   model QuestionBank {
     id          Int       @id @default(autoincrement())
     name        String
     description String?
     isPublic    Boolean   @default(false)
     
     // Organization
     categories  QuestionCategory[]
     questions   Question[]
     
     // Access control
     ownerId     Int
     owner       User      @relation(fields: [ownerId], references: [id])
     sharedWith  QuestionBankAccess[]
     
     // Audit
     createdAt   DateTime  @default(now())
     updatedAt   DateTime  @updatedAt
     
     @@index([ownerId])
     @@index([isPublic])
   }
   
   model QuestionCategory {
     id          Int       @id @default(autoincrement())
     bankId      Int
     name        String
     description String?
     parentId    Int?
     
     // Hierarchy
     parent      QuestionCategory? @relation("CategoryHierarchy", fields: [parentId], references: [id])
     children    QuestionCategory[] @relation("CategoryHierarchy")
     
     // Relations
     bank        QuestionBank @relation(fields: [bankId], references: [id], onDelete: Cascade)
     
     @@unique([bankId, name, parentId])
     @@index([bankId])
     @@index([parentId])
   }
   
   model QuestionBankAccess {
     id          Int       @id @default(autoincrement())
     bankId      Int
     userId      Int
     accessLevel AccessLevel
     
     // Relations
     bank        QuestionBank @relation(fields: [bankId], references: [id], onDelete: Cascade)
     user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
     
     @@unique([bankId, userId])
     @@index([bankId])
     @@index([userId])
   }
   
   enum AccessLevel {
     READ
     WRITE
     ADMIN
   }
   ```

   ```typescript
   // Question import service
   @Injectable()
   export class QuestionImportService {
     constructor(
       private readonly prisma: PrismaService,
       private readonly fileService: FileService,
       private readonly parserFactory: ParserFactory,
     ) {}
     
     async importQuestions(
       file: Express.Multer.File,
       options: ImportOptions,
       userId: number,
     ): Promise<ImportResult> {
       // Determine file type and get appropriate parser
       const fileType = this.determineFileType(file);
       const parser = this.parserFactory.getParser(fileType);
       
       // Parse file
       const parsedQuestions = await parser.parse(file.buffer);
       
       // Validate questions
       const validationResult = await this.validateQuestions(parsedQuestions);
       
       if (!validationResult.isValid) {
         return {
           success: false,
           errors: validationResult.errors,
         };
       }
       
       // Import questions to database
       const importedQuestions = await this.saveQuestions(
         parsedQuestions,
         options.bankId,
         options.categoryId,
         userId,
       );
       
       return {
         success: true,
         importedCount: importedQuestions.length,
         questions: importedQuestions,
       };
     }
     
     // Other methods...
   }
   ```

3. **Implementer avanceret vurderingssystem** *(Dag 3)*
   - Udvikl automatisk vurdering for alle spørgsmålstyper
   - Implementer manuel vurdering for essay og open-ended spørgsmål
   - Tilføj detaljeret feedback baseret på svar og fejlmønstre
   - Implementer rubrics og vurderingskriterier
   - Tilføj peer review og self-assessment

   ```prisma
   model QuizAttempt {
     id          Int       @id @default(autoincrement())
     quizId      Int
     userId      Int
     startedAt   DateTime  @default(now())
     completedAt DateTime?
     score       Float?
     maxScore    Float?
     passingScore Float?
     passed      Boolean?
     timeSpent   Int?      // i sekunder
     
     // Attempt data
     responses   QuestionResponse[]
     
     // Relations
     quiz        Quiz      @relation(fields: [quizId], references: [id])
     user        User      @relation(fields: [userId], references: [id])
     reviews     PeerReview[] @relation("ReviewedAttempt")
     
     @@index([quizId])
     @@index([userId])
     @@index([startedAt])
     @@index([completedAt])
   }
   
   model QuestionResponse {
     id          Int       @id @default(autoincrement())
     attemptId   Int
     questionId  Int
     answer      Json
     isCorrect   Boolean?
     score       Float?
     maxScore    Float?
     feedback    String?
     timeSpent   Int?      // i sekunder
     
     // For manual grading
     gradedBy    Int?
     gradedAt    DateTime?
     gradingNotes String?
     
     // Relations
     attempt     QuizAttempt @relation(fields: [attemptId], references: [id], onDelete: Cascade)
     question    Question  @relation(fields: [questionId], references: [id])
     grader      User?     @relation("ResponseGrader", fields: [gradedBy], references: [id])
     reviews     PeerReview[] @relation("ReviewedResponse")
     
     @@index([attemptId])
     @@index([questionId])
     @@index([isCorrect])
   }
   
   model PeerReview {
     id          Int       @id @default(autoincrement())
     attemptId   Int
     responseId  Int?
     reviewerId  Int
     score       Float?
     feedback    String?
     rubricScores Json?
     createdAt   DateTime  @default(now())
     
     // Relations
     attempt     QuizAttempt @relation("ReviewedAttempt", fields: [attemptId], references: [id], onDelete: Cascade)
     response    QuestionResponse? @relation("ReviewedResponse", fields: [responseId], references: [id])
     reviewer    User      @relation(fields: [reviewerId], references: [id])
     
     @@index([attemptId])
     @@index([responseId])
     @@index([reviewerId])
   }
   ```

4. **Implementer certifikater og badges** *(Dag 4)*
   - Udvikl certifikatgenerering med tilpassede skabeloner
   - Implementer badge-tildeling baseret på quiz-resultater
   - Tilføj verifikation af certifikater med QR-koder
   - Implementer deling af certifikater på sociale medier
   - Tilføj certifikatudløb og fornyelse

   ```prisma
   model Certificate {
     id          Int       @id @default(autoincrement())
     userId      Int
     courseId    Int
     title       String
     description String?
     templateId  Int
     data        Json      // Data for certificate template
     verificationCode String @unique
     issuedAt    DateTime  @default(now())
     expiresAt   DateTime?
     revokedAt   DateTime?
     
     // Relations
     user        User      @relation(fields: [userId], references: [id])
     course      Course    @relation(fields: [courseId], references: [id])
     template    CertificateTemplate @relation(fields: [templateId], references: [id])
     
     @@index([userId])
     @@index([courseId])
     @@index([verificationCode])
     @@index([issuedAt])
     @@index([expiresAt])
   }
   
   model CertificateTemplate {
     id          Int       @id @default(autoincrement())
     name        String
     description String?
     html        String    // HTML template with placeholders
     css         String?   // Custom CSS
     isDefault   Boolean   @default(false)
     
     // Relations
     certificates Certificate[]
     
     @@index([isDefault])
   }
   ```

   ```typescript
   // Certificate service
   @Injectable()
   export class CertificateService {
     constructor(
       private readonly prisma: PrismaService,
       private readonly pdfService: PdfService,
       private readonly qrService: QrService,
       private readonly mailService: MailService,
     ) {}
     
     async generateCertificate(
       userId: number,
       courseId: number,
       options?: GenerateCertificateOptions,
     ): Promise<Certificate> {
       // Check if user has completed the course
       const courseCompletion = await this.prisma.courseCompletion.findUnique({
         where: {
           userId_courseId: {
             userId,
             courseId,
           },
         },
       });
       
       if (!courseCompletion || !courseCompletion.isCompleted) {
         throw new BadRequestException('User has not completed this course');
       }
       
       // Get course and user data
       const [course, user] = await Promise.all([
         this.prisma.course.findUnique({ where: { id: courseId } }),
         this.prisma.user.findUnique({ where: { id: userId } }),
       ]);
       
       // Get certificate template
       const templateId = options?.templateId || await this.getDefaultTemplateId();
       const template = await this.prisma.certificateTemplate.findUnique({
         where: { id: templateId },
       });
       
       if (!template) {
         throw new NotFoundException('Certificate template not found');
       }
       
       // Generate verification code
       const verificationCode = this.generateVerificationCode();
       
       // Prepare certificate data
       const certificateData = {
         userName: user.name,
         courseName: course.title,
         issueDate: new Date().toLocaleDateString(),
         expiryDate: options?.expiresAt ? new Date(options.expiresAt).toLocaleDateString() : null,
         verificationCode,
         verificationUrl: `${this.configService.get('app.url')}/verify/${verificationCode}`,
       };
       
       // Create certificate record
       const certificate = await this.prisma.certificate.create({
         data: {
           userId,
           courseId,
           title: `${course.title} Certificate`,
           description: options?.description,
           templateId,
           data: certificateData,
           verificationCode,
           expiresAt: options?.expiresAt,
         },
       });
       
       // Generate QR code for verification
       const qrCode = await this.qrService.generateQR(certificateData.verificationUrl);
       
       // Generate PDF
       const pdfBuffer = await this.generatePdf(template, {
         ...certificateData,
         qrCode,
       });
       
       // Store PDF
       await this.storeCertificatePdf(certificate.id, pdfBuffer);
       
       // Notify user
       await this.mailService.sendCertificateEmail(user.email, {
         name: user.name,
         courseName: course.title,
         certificateId: certificate.id,
       });
       
       return certificate;
     }
     
     // Other methods...
   }
   ```

5. **Implementer analytics og rapportering** *(Dag 5)*
   - Udvikl detaljeret quiz-analytics med sværhedsgradsanalyse
   - Implementer item-analyse og diskriminationsindeks
   - Tilføj rapportering for individuelle og grupperesultater
   - Implementer eksport af resultater til forskellige formater
   - Tilføj dashboards for undervisere og administratorer

   ```typescript
   // Quiz analytics service
   @Injectable()
   export class QuizAnalyticsService {
     constructor(
       private readonly prisma: PrismaService,
       private readonly statsService: StatisticsService,
     ) {}
     
     async getQuizAnalytics(quizId: number): Promise<QuizAnalytics> {
       // Get quiz with questions
       const quiz = await this.prisma.quiz.findUnique({
         where: { id: quizId },
         include: {
           questions: true,
           attempts: {
             include: {
               responses: true,
             },
           },
         },
       });
       
       if (!quiz) {
         throw new NotFoundException('Quiz not found');
       }
       
       // Calculate basic statistics
       const attemptCount = quiz.attempts.length;
       const completedAttempts = quiz.attempts.filter(a => a.completedAt);
       const completionRate = attemptCount > 0 ? completedAttempts.length / attemptCount : 0;
       
       const scores = completedAttempts.map(a => a.score);
       const averageScore = this.statsService.mean(scores);
       const medianScore = this.statsService.median(scores);
       const scoreDistribution = this.statsService.distribution(scores, 10);
       
       // Calculate question statistics
       const questionStats = await Promise.all(
         quiz.questions.map(async (question) => {
           const responses = quiz.attempts
             .flatMap(a => a.responses)
             .filter(r => r.questionId === question.id);
           
           const correctCount = responses.filter(r => r.isCorrect).length;
           const incorrectCount = responses.filter(r => r.isCorrect === false).length;
           const skippedCount = responses.filter(r => r.isCorrect === null).length;
           
           const difficultyIndex = responses.length > 0 
             ? correctCount / responses.length 
             : null;
           
           const discriminationIndex = await this.calculateDiscriminationIndex(
             quizId,
             question.id,
           );
           
           return {
             questionId: question.id,
             correctCount,
             incorrectCount,
             skippedCount,
             difficultyIndex,
             discriminationIndex,
             averageTimeSpent: this.statsService.mean(responses.map(r => r.timeSpent || 0)),
           };
         })
       );
       
       return {
         quizId,
         attemptCount,
         completionRate,
         averageScore,
         medianScore,
         scoreDistribution,
         passingRate: completedAttempts.filter(a => a.passed).length / completedAttempts.length,
         averageTimeSpent: this.statsService.mean(completedAttempts.map(a => a.timeSpent || 0)),
         questionStats,
       };
     }
     
     // Other methods...
   }
   ```

## Fase 2: UI-komponenter og brugeroplevelse

**Varighed: 2.5 uger**

**Mål:** Udvikle et komplet, tilgængeligt og konsistent UI-komponentbibliotek, der understøtter alle applikationens funktioner og giver en fremragende brugeroplevelse.

**Afhængigheder:**
- Kræver: Kernestruktur (Fase 1)
- Blokkerer: Gamification (Fase 3), AI-integration (Fase 4)

### 2.1 Grundlæggende UI-komponenter (4 dage)

**Afhængigheder:**
- Kræver: Ingen specifikke afhængigheder
- Blokkerer: Avancerede UI-komponenter (2.2), Tema (2.3)

1. **Udvid eksisterende komponenter** *(Dag 1-2)*
   - Forbedre Button-komponenten med varianter, størrelser og ikoner
   - Udvid Notification-komponenten med flere typer og animationer
   - Forbedre Skeleton-komponenten med flere varianter
   - Implementer konsistent styling og theming
   - Tilføj tilgængelighedsfunktioner til alle komponenter

   ```tsx
   // Eksempel på udvidet Button-komponent med tilgængelighed
   export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
     variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'danger' | 'success' | 'warning';
     size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
     isLoading?: boolean;
     isDisabled?: boolean;
     leftIcon?: React.ReactNode;
     rightIcon?: React.ReactNode;
     fullWidth?: boolean;
     loadingText?: string;
     iconSpacing?: number;
   }
   
   export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
     variant = 'primary',
     size = 'md',
     isLoading = false,
     isDisabled = false,
     leftIcon,
     rightIcon,
     children,
     fullWidth = false,
     loadingText,
     iconSpacing = 2,
     className,
     ...props
   }, ref) => {
     // Combine classes based on props
     const classes = cx(
       'btn',
       `btn-${variant}`,
       `btn-${size}`,
       isLoading && 'btn-loading',
       fullWidth && 'btn-full-width',
       className
     );
     
     // Handle disabled state
     const disabled = isDisabled || isLoading;
     
     return (
       <button
         ref={ref}
         className={classes}
         disabled={disabled}
         aria-disabled={disabled}
         {...(isLoading && { 'aria-busy': true })}
         {...props}
       >
         {isLoading && (
           <span className="btn-spinner" aria-hidden="true">
             <Spinner size={size} />
           </span>
         )}
         
         {!isLoading && leftIcon && (
           <span className="btn-icon-left" style={{ marginRight: `${iconSpacing}px` }} aria-hidden="true">
             {leftIcon}
           </span>
         )}
         
         {isLoading && loadingText ? loadingText : children}
         
         {!isLoading && rightIcon && (
           <span className="btn-icon-right" style={{ marginLeft: `${iconSpacing}px` }} aria-hidden="true">
             {rightIcon}
           </span>
         )}
       </button>
     );
   });
   
   Button.displayName = 'Button';
   ```

2. **Implementer nye UI-komponenter** *(Dag 2-3)*
   - Udvikl Card, Modal, Dropdown, Tabs, Accordion komponenter
   - Implementer Form-komponenter (Input, Select, Checkbox, Radio, Switch)
   - Tilføj Feedback-komponenter (Alert, Toast, Progress)
   - Implementer Tooltip, Popover og Menu komponenter
   - Tilføj Avatar, Badge og Tag komponenter

   ```tsx
   // Eksempel på tilgængelig Modal-komponent
   export interface ModalProps {
     isOpen: boolean;
     onClose: () => void;
     title?: React.ReactNode;
     children: React.ReactNode;
     size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
     closeOnEsc?: boolean;
     closeOnOverlayClick?: boolean;
     initialFocusRef?: React.RefObject<HTMLElement>;
     finalFocusRef?: React.RefObject<HTMLElement>;
     returnFocusOnClose?: boolean;
     scrollBehavior?: 'inside' | 'outside';
     isCentered?: boolean;
     motionPreset?: 'fade' | 'scale' | 'slide';
   }
   
   export const Modal: React.FC<ModalProps> = ({
     isOpen,
     onClose,
     title,
     children,
     size = 'md',
     closeOnEsc = true,
     closeOnOverlayClick = true,
     initialFocusRef,
     finalFocusRef,
     returnFocusOnClose = true,
     scrollBehavior = 'inside',
     isCentered = true,
     motionPreset = 'scale',
   }) => {
     const modalRef = React.useRef<HTMLDivElement>(null);
     const [previouslyFocusedElement, setPreviouslyFocusedElement] = React.useState<HTMLElement | null>(null);
     
     // Store previously focused element
     React.useEffect(() => {
       if (isOpen) {
         setPreviouslyFocusedElement(document.activeElement as HTMLElement);
       }
     }, [isOpen]);
     
     // Handle focus management
     React.useEffect(() => {
       if (isOpen) {
         // Set focus to initial focus ref or first focusable element
         const elementToFocus = initialFocusRef?.current || findFirstFocusableElement(modalRef.current);
         elementToFocus?.focus();
         
         // Add event listener for tab key to trap focus
         const handleKeyDown = (e: KeyboardEvent) => {
           if (e.key === 'Tab') {
             trapFocus(e, modalRef.current);
           }
           
           if (closeOnEsc && e.key === 'Escape') {
             onClose();
           }
         };
         
         document.addEventListener('keydown', handleKeyDown);
         return () => {
           document.removeEventListener('keydown', handleKeyDown);
           
           // Return focus when modal closes
           if (returnFocusOnClose) {
             if (finalFocusRef?.current) {
               finalFocusRef.current.focus();
             } else if (previouslyFocusedElement) {
               previouslyFocusedElement.focus();
             }
           }
         };
       }
     }, [isOpen, initialFocusRef, finalFocusRef, returnFocusOnClose, previouslyFocusedElement, closeOnEsc, onClose]);
     
     if (!isOpen) return null;
     
     return (
       <Portal>
         <ModalOverlay 
           onClick={closeOnOverlayClick ? onClose : undefined} 
           motionPreset={motionPreset}
         />
         <div
           className={cx('modal-container', isCentered && 'modal-centered')}
           role="dialog"
           aria-modal="true"
           aria-labelledby={title ? 'modal-title' : undefined}
           ref={modalRef}
         >
           <div className={cx('modal', `modal-${size}`, `modal-scroll-${scrollBehavior}`)}>
             {title && (
               <div className="modal-header">
                 <h2 id="modal-title" className="modal-title">{title}</h2>
                 <button
                   className="modal-close-button"
                   onClick={onClose}
                   aria-label="Close"
                 >
                   <CloseIcon />
                 </button>
               </div>
             )}
             <div className="modal-body">
               {children}
             </div>
           </div>
         </div>
       </Portal>
     );
   };
   ```

3. **Implementer layout-komponenter** *(Dag 3-4)*
   - Udvikl Grid, Flex, Box, Stack komponenter
   - Implementer Responsive Container og AspectRatio
   - Tilføj Sidebar, Header, Footer komponenter
   - Implementer Divider, Spacer og Center komponenter
   - Tilføj SimpleGrid og Wrap komponenter for avanceret layout

   ```tsx
   // Eksempel på Flex-komponent med responsive props
   export interface FlexProps extends BoxProps {
     direction?: ResponsiveValue<'row' | 'column' | 'row-reverse' | 'column-reverse'>;
     align?: ResponsiveValue<'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch'>;
     justify?: ResponsiveValue<'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'>;
     wrap?: ResponsiveValue<'nowrap' | 'wrap' | 'wrap-reverse'>;
     basis?: ResponsiveValue<CSSProperties['flexBasis']>;
     grow?: ResponsiveValue<CSSProperties['flexGrow']>;
     shrink?: ResponsiveValue<CSSProperties['flexShrink']>;
     gap?: ResponsiveValue<SpacingToken>;
   }
   
   export const Flex = React.forwardRef<HTMLDivElement, FlexProps>(({
     direction = 'row',
     align,
     justify,
     wrap,
     basis,
     grow,
     shrink,
     gap,
     children,
     ...rest
   }, ref) => {
     const styles = useResponsiveStyles({
       display: 'flex',
       flexDirection: direction,
       alignItems: align,
       justifyContent: justify,
       flexWrap: wrap,
       flexBasis: basis,
       flexGrow: grow,
       flexShrink: shrink,
       gap: gap && getSpacing(gap),
     });
     
     return (
       <Box ref={ref} __css={styles} {...rest}>
         {children}
       </Box>
     );
   });
   
   Flex.displayName = 'Flex';
   ```

4. **Implementer komponentdokumentation og storybook** *(Dag 4)*
   - Opsæt Storybook for komponentdokumentation
   - Tilføj stories for alle komponenter med eksempler
   - Implementer komponenttests med Jest og React Testing Library
   - Tilføj dokumentation for props og usage guidelines
   - Implementer visual regression testing med Chromatic

### 2.2 Avancerede UI-komponenter (5 dage)

**Afhængigheder:**
- Kræver: Grundlæggende UI-komponenter (2.1)
- Blokkerer: Brugeroplevelse (2.4), Gamification (Fase 3)

1. **Implementer datavisningskomponenter** *(Dag 1-2)*
   - Udvikl Table med sortering, filtrering og paginering
   - Implementer DataGrid med inline-redigering og celleformatering
   - Tilføj List og ListView med virtuel scrolling for store datasæt
   - Implementer TreeView og TreeTable for hierarkiske data
   - Tilføj InfiniteScroll og LazyLoad komponenter

   ```tsx
   // Eksempel på avanceret Table-komponent
   export interface TableProps<T extends Record<string, any>> {
     // Data
     data: T[];
     columns: TableColumn<T>[];
     
     // Styling
     variant?: 'simple' | 'striped' | 'bordered' | 'unstyled';
     size?: 'sm' | 'md' | 'lg';
     colorScheme?: string;
     
     // Features
     isSelectable?: boolean;
     selectedRows?: string[];
     onRowSelect?: (rowIds: string[]) => void;
     getRowId?: (row: T) => string;
     
     // Sorting
     sortable?: boolean;
     defaultSortColumn?: string;
     defaultSortDirection?: 'asc' | 'desc';
     onSort?: (column: string, direction: 'asc' | 'desc') => void;
     
     // Filtering
     filterable?: boolean;
     filters?: Record<string, any>;
     onFilter?: (filters: Record<string, any>) => void;
     
     // Pagination
     pagination?: TablePagination;
     
     // Events
     onRowClick?: (row: T, index: number) => void;
     onRowDoubleClick?: (row: T, index: number) => void;
     onRowContextMenu?: (row: T, index: number, event: React.MouseEvent) => void;
     
     // Accessibility
     'aria-label'?: string;
     'aria-describedby'?: string;
   }
   
   export interface TableColumn<T> {
     // Basic
     id: string;
     header: React.ReactNode;
     accessor: keyof T | ((row: T) => any);
     cell?: (value: any, row: T, index: number) => React.ReactNode;
     
     // Styling
     width?: string | number;
     minWidth?: string | number;
     maxWidth?: string | number;
     align?: 'left' | 'center' | 'right';
     
     // Features
     sortable?: boolean;
     filterable?: boolean;
     filterComponent?: React.ComponentType<any>;
     isNumeric?: boolean;
     
     // Grouping
     groupable?: boolean;
     aggregate?: (values: any[]) => any;
     
     // Visibility
     isVisible?: boolean;
     canHide?: boolean;
     
     // Editing
     editable?: boolean;
     editComponent?: React.ComponentType<any>;
     validation?: (value: any) => boolean | string;
   }
   
   export const Table = React.forwardRef(<T extends Record<string, any>>(
     {
       data,
       columns,
       variant = 'simple',
       size = 'md',
       colorScheme,
       isSelectable,
       selectedRows = [],
       onRowSelect,
       getRowId = (row: any) => row.id,
       sortable = false,
       defaultSortColumn,
       defaultSortDirection = 'asc',
       onSort,
       filterable = false,
       filters = {},
       onFilter,
       pagination,
       onRowClick,
       onRowDoubleClick,
       onRowContextMenu,
       'aria-label': ariaLabel,
       'aria-describedby': ariaDescribedBy,
       ...rest
     }: TableProps<T>,
     ref: React.Ref<HTMLTableElement>
   ) => {
     // State for sorting
     const [sortColumn, setSortColumn] = useState(defaultSortColumn);
     const [sortDirection, setSortDirection] = useState(defaultSortDirection);
     
     // State for selection
     const [selected, setSelected] = useState<string[]>(selectedRows);
     
     // Handle sort
     const handleSort = (columnId: string) => {
       const column = columns.find(col => col.id === columnId);
       if (!sortable || !column?.sortable) return;
       
       const newDirection = sortColumn === columnId && sortDirection === 'asc' ? 'desc' : 'asc';
       setSortColumn(columnId);
       setSortDirection(newDirection);
       
       if (onSort) {
         onSort(columnId, newDirection);
       }
     };
     
     // Handle row selection
     const handleRowSelect = (rowId: string, isMultiSelect: boolean) => {
       if (!isSelectable) return;
       
       let newSelected: string[];
       
       if (isMultiSelect) {
         newSelected = selected.includes(rowId)
           ? selected.filter(id => id !== rowId)
           : [...selected, rowId];
       } else {
         newSelected = selected.includes(rowId) && selected.length === 1
           ? []
           : [rowId];
       }
       
       setSelected(newSelected);
       
       if (onRowSelect) {
         onRowSelect(newSelected);
       }
     };
     
     // Handle select all
     const handleSelectAll = () => {
       if (!isSelectable) return;
       
       const allRowIds = data.map(row => getRowId(row));
       const newSelected = selected.length === allRowIds.length ? [] : allRowIds;
       
       setSelected(newSelected);
       
       if (onRowSelect) {
         onRowSelect(newSelected);
       }
     };
     
     // Render table header
     const renderHeader = () => (
       <thead className={`table-head table-head-${size}`}>
         <tr>
           {isSelectable && (
             <th className="table-select-cell">
               <Checkbox
                 isChecked={data.length > 0 && selected.length === data.length}
                 isIndeterminate={selected.length > 0 && selected.length < data.length}
                 onChange={handleSelectAll}
                 aria-label="Select all rows"
               />
             </th>
           )}
           {columns.filter(col => col.isVisible !== false).map(column => (
             <th
               key={column.id}
               className={cx(
                 'table-th',
                 column.align && `text-${column.align}`,
                 column.isNumeric && 'table-th-numeric',
                 sortable && column.sortable && 'table-th-sortable'
               )}
               style={{
                 width: column.width,
                 minWidth: column.minWidth,
                 maxWidth: column.maxWidth,
               }}
               onClick={() => handleSort(column.id)}
               aria-sort={
                 sortColumn === column.id
                   ? sortDirection === 'asc'
                     ? 'ascending'
                     : 'descending'
                   : undefined
               }
             >
               <div className="table-th-content">
                 {column.header}
                 {sortable && column.sortable && (
                   <span className="table-sort-icon">
                     {sortColumn === column.id ? (
                       sortDirection === 'asc' ? <SortAscIcon /> : <SortDescIcon />
                     ) : (
                       <SortIcon />
                     )}
                   </span>
                 )}
               </div>
             </th>
           ))}
         </tr>
       </thead>
     );
     
     // Render table body
     const renderBody = () => (
       <tbody className="table-body">
         {data.length === 0 ? (
           <tr>
             <td
               colSpan={isSelectable ? columns.length + 1 : columns.length}
               className="table-empty-state"
             >
               No data available
             </td>
           </tr>
         ) : (
           data.map((row, rowIndex) => {
             const rowId = getRowId(row);
             const isSelected = selected.includes(rowId);
             
             return (
               <tr
                 key={rowId}
                 className={cx(
                   'table-row',
                   isSelected && 'table-row-selected',
                   onRowClick && 'table-row-clickable'
                 )}
                 onClick={e => {
                   if (onRowClick) onRowClick(row, rowIndex);
                 }}
                 onDoubleClick={e => {
                   if (onRowDoubleClick) onRowDoubleClick(row, rowIndex);
                 }}
                 onContextMenu={e => {
                   if (onRowContextMenu) {
                     e.preventDefault();
                     onRowContextMenu(row, rowIndex, e);
                   }
                 }}
                 aria-selected={isSelectable ? isSelected : undefined}
               >
                 {isSelectable && (
                   <td className="table-select-cell">
                     <Checkbox
                       isChecked={isSelected}
                       onChange={e => {
                         e.stopPropagation();
                         handleRowSelect(rowId, e.nativeEvent.shiftKey);
                       }}
                       aria-label={`Select row ${rowIndex + 1}`}
                     />
                   </td>
                 )}
                 {columns
                   .filter(col => col.isVisible !== false)
                   .map(column => {
                     const value = typeof column.accessor === 'function'
                       ? column.accessor(row)
                       : row[column.accessor as keyof T];
                     
                     return (
                       <td
                         key={column.id}
                         className={cx(
                           'table-td',
                           column.align && `text-${column.align}`,
                           column.isNumeric && 'table-td-numeric'
                         )}
                       >
                         {column.cell ? column.cell(value, row, rowIndex) : value}
                       </td>
                     );
                   })}
               </tr>
             );
           })
         )}
       </tbody>
     );
     
     // Render pagination
     const renderPagination = () => {
       if (!pagination) return null;
       
       const { page, pageSize, total, onPageChange } = pagination;
       const totalPages = Math.ceil(total / pageSize);
       
       return (
         <div className="table-pagination">
           <div className="table-pagination-info">
             Showing {Math.min((page - 1) * pageSize + 1, total)} to {Math.min(page * pageSize, total)} of {total} entries
           </div>
           <Pagination
             currentPage={page}
             totalPages={totalPages}
             onPageChange={onPageChange}
             siblingCount={1}
           />
         </div>
       );
     };
     
     return (
       <div className="table-container" {...rest}>
         {filterable && (
           <div className="table-filters">
             {/* Filter components */}
           </div>
         )}
         <div className="table-responsive">
           <table
             ref={ref}
             className={cx('table', `table-${variant}`, `table-${size}`, colorScheme && `table-${colorScheme}`)}
             aria-label={ariaLabel}
             aria-describedby={ariaDescribedBy}
           >
             {renderHeader()}
             {renderBody()}
           </table>
         </div>
         {pagination && renderPagination()}
       </div>
     );
   });
   
   Table.displayName = 'Table';
   ```

2. **Implementer specialiserede komponenter** *(Dag 2-3)*
   - Udvikl FileUploader med drag-and-drop, progress og preview
   - Implementer RichTextEditor med formatting, embedding og markdown support
   - Tilføj DatePicker, TimePicker og DateRangePicker komponenter
   - Implementer ColorPicker, ImageCropper og MediaGallery
   - Tilføj CodeEditor med syntax highlighting og autocompletion

   ```tsx
   // Eksempel på FileUploader-komponent
   export interface FileUploaderProps {
     // Basic
     accept?: string | string[];
     multiple?: boolean;
     maxFiles?: number;
     maxSize?: number; // in bytes
     minSize?: number; // in bytes
     disabled?: boolean;
     
     // Callbacks
     onDrop?: (acceptedFiles: File[], rejectedFiles: FileRejection[]) => void;
     onDropAccepted?: (acceptedFiles: File[]) => void;
     onDropRejected?: (rejectedFiles: FileRejection[]) => void;
     onFileDialogCancel?: () => void;
     
     // Validation
     validator?: (file: File) => FileError | FileError[] | null;
     
     // UI Customization
     children?: React.ReactNode | ((props: DropzoneState) => React.ReactNode);
     noClick?: boolean;
     noDrag?: boolean;
     noDragEventsBubbling?: boolean;
     
     // Accessibility
     'aria-label'?: string;
     'aria-describedby'?: string;
     'aria-labelledby'?: string;
   }
   
   export const FileUploader: React.FC<FileUploaderProps> = ({
     accept,
     multiple = false,
     maxFiles = 0,
     maxSize,
     minSize,
     disabled = false,
     onDrop,
     onDropAccepted,
     onDropRejected,
     onFileDialogCancel,
     validator,
     children,
     noClick = false,
     noDrag = false,
     noDragEventsBubbling = false,
     'aria-label': ariaLabel,
     'aria-describedby': ariaDescribedBy,
     'aria-labelledby': ariaLabelledBy,
   }) => {
     // Use react-dropzone hook
     const {
       getRootProps,
       getInputProps,
       isDragActive,
       isDragAccept,
       isDragReject,
       open,
       acceptedFiles,
       fileRejections,
     } = useDropzone({
       accept: accept ? formatAccept(accept) : undefined,
       multiple,
       maxFiles: maxFiles > 0 ? maxFiles : undefined,
       maxSize,
       minSize,
       disabled,
       onDrop,
       onDropAccepted,
       onDropRejected,
       onFileDialogCancel,
       validator,
       noClick,
       noDrag,
       noDragEventsBubbling,
     });
     
     // Format file size for display
     const formatFileSize = (bytes: number) => {
       if (bytes === 0) return '0 Bytes';
       const k = 1024;
       const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
       const i = Math.floor(Math.log(bytes) / Math.log(k));
       return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
     };
     
     // Render file list
     const renderFileList = () => {
       if (acceptedFiles.length === 0) return null;
       
       return (
         <ul className="file-list">
           {acceptedFiles.map((file, index) => (
             <li key={`${file.name}-${index}`} className="file-item">
               <div className="file-item-info">
                 <FileIcon extension={getFileExtension(file.name)} />
                 <div className="file-item-details">
                   <div className="file-item-name">{file.name}</div>
                   <div className="file-item-size">{formatFileSize(file.size)}</div>
                 </div>
               </div>
               <button
                 type="button"
                 className="file-item-remove"
                 onClick={(e) => {
                   e.stopPropagation();
                   const newFiles = [...acceptedFiles];
                   newFiles.splice(index, 1);
                   onDropAccepted?.(newFiles);
                 }}
                 aria-label={`Remove ${file.name}`}
               >
                 <RemoveIcon />
               </button>
             </li>
           ))}
         </ul>
       );
     };
     
     // Render error messages
     const renderErrors = () => {
       if (fileRejections.length === 0) return null;
       
       return (
         <ul className="file-error-list">
           {fileRejections.map(({ file, errors }, index) => (
             <li key={`${file.name}-${index}`} className="file-error-item">
               <div className="file-error-name">{file.name}</div>
               <ul className="file-error-details">
                 {errors.map((error) => (
                   <li key={error.code} className="file-error-message">
                     {error.message}
                   </li>
                 ))}
               </ul>
             </li>
           ))}
         </ul>
       );
     };
     
     return (
       <div className="file-uploader-container">
         <div
           {...getRootProps({
             className: cx(
               'file-uploader-dropzone',
               isDragActive && 'file-uploader-dropzone-active',
               isDragAccept && 'file-uploader-dropzone-accept',
               isDragReject && 'file-uploader-dropzone-reject',
               disabled && 'file-uploader-dropzone-disabled'
             ),
           })}
           aria-label={ariaLabel}
           aria-describedby={ariaDescribedBy}
           aria-labelledby={ariaLabelledBy}
         >
           <input {...getInputProps()} />
           {children ? (
             typeof children === 'function' ? (
               children({
                 isDragActive,
                 isDragAccept,
                 isDragReject,
                 acceptedFiles,
                 fileRejections,
               })
             ) : (
               children
             )
           ) : (
             <div className="file-uploader-content">
               <UploadIcon className="file-uploader-icon" />
               <div className="file-uploader-text">
                 {isDragActive ? (
                   isDragReject ? (
                     <p>Some files will be rejected</p>
                   ) : (
                     <p>Drop the files here</p>
                   )
                 ) : (
                   <p>
                     Drag & drop files here, or{' '}
                     <button
                       type="button"
                       className="file-uploader-browse"
                       onClick={(e) => {
                         e.stopPropagation();
                         open();
                       }}
                       disabled={disabled}
                     >
                       browse
                     </button>
                   </p>
                 )}
               </div>
               {accept && (
                 <div className="file-uploader-hint">
                   Allowed file types: {formatAcceptForDisplay(accept)}
                 </div>
               )}
               {maxSize && (
                 <div className="file-uploader-hint">
                   Maximum file size: {formatFileSize(maxSize)}
                 </div>
               )}
             </div>
           )}
         </div>
         {renderFileList()}
         {renderErrors()}
       </div>
     );
   };
   ```

3. **Implementer animerede komponenter** *(Dag 3-4)*
   - Udvikl Transition og AnimatePresence komponenter
   - Implementer Motion komponenter for animerede UI-elementer
   - Tilføj Animated counters, progress bars og charts
   - Implementer Skeleton loaders med shimmer effect
   - Tilføj Konfetti, Fireworks og andre celebration effects

   ```tsx
   // Eksempel på Transition-komponent
   export interface TransitionProps {
     in: boolean;
     children: React.ReactNode;
     timeout?: number | { enter?: number; exit?: number };
     mountOnEnter?: boolean;
     unmountOnExit?: boolean;
     appear?: boolean;
     enter?: boolean;
     exit?: boolean;
     easing?: string | { enter?: string; exit?: string };
     onEnter?: () => void;
     onEntering?: () => void;
     onEntered?: () => void;
     onExit?: () => void;
     onExiting?: () => void;
     onExited?: () => void;
   }
   
   export const Transition: React.FC<TransitionProps> = ({
     in: inProp,
     children,
     timeout = 300,
     mountOnEnter = false,
     unmountOnExit = false,
     appear = false,
     enter = true,
     exit = true,
     easing = 'ease',
     onEnter,
     onEntering,
     onEntered,
     onExit,
     onExiting,
     onExited,
   }) => {
     const [status, setStatus] = useState<'entering' | 'entered' | 'exiting' | 'exited'>(
       inProp ? (appear ? 'entering' : 'entered') : 'exited'
     );
     
     const nodeRef = useRef<HTMLDivElement>(null);
     const prevInProp = usePrevious(inProp);
     
     // Calculate timeouts
     const getTimeout = (type: 'enter' | 'exit') => {
       if (typeof timeout === 'number') {
         return timeout;
       }
       return timeout[type] ?? 0;
     };
     
     // Calculate easing
     const getEasing = (type: 'enter' | 'exit') => {
       if (typeof easing === 'string') {
         return easing;
       }
       return easing[type] ?? 'ease';
     };
     
     // Handle transitions
     useEffect(() => {
       if (prevInProp !== inProp) {
         if (inProp) {
           // Enter transition
           if (mountOnEnter || status !== 'exited') {
             const enterTimeout = getTimeout('enter');
             const enterEasing = getEasing('enter');
             
             if (onEnter) onEnter();
             setStatus('entering');
             
             if (nodeRef.current) {
               nodeRef.current.style.transition = `all ${enterTimeout}ms ${enterEasing}`;
             }
             
             // Force reflow
             nodeRef.current?.offsetHeight;
             
             if (onEntering) onEntering();
             
             setTimeout(() => {
               setStatus('entered');
               if (onEntered) onEntered();
             }, enterTimeout);
           }
         } else {
           // Exit transition
           if (status !== 'exited') {
             const exitTimeout = getTimeout('exit');
             const exitEasing = getEasing('exit');
             
             if (onExit) onExit();
             setStatus('exiting');
             
             if (nodeRef.current) {
               nodeRef.current.style.transition = `all ${exitTimeout}ms ${exitEasing}`;
             }
             
             if (onExiting) onExiting();
             
             setTimeout(() => {
               setStatus('exited');
               if (onExited) onExited();
             }, exitTimeout);
           }
         }
       }
     }, [inProp, prevInProp, status]);
     
     // Don't render if not mounted
     if (status === 'exited' && unmountOnExit) {
       return null;
     }
     
     // Don't mount until needed
     if (status === 'exited' && !inProp && mountOnEnter) {
       return null;
     }
     
     return (
       <div
         ref={nodeRef}
         className={cx('transition', `transition-${status}`)}
         data-status={status}
       >
         {children}
       </div>
     );
   };
   ```

4. **Implementer interaktive visualiseringer** *(Dag 4-5)*
   - Udvikl Chart komponenter (Line, Bar, Pie, Area, Scatter)
   - Implementer interaktive Maps og Heatmaps
   - Tilføj Timeline og Gantt chart komponenter
   - Implementer Network Graph og Tree visualiseringer
   - Tilføj Dashboard og Widget komponenter

   ```tsx
   // Eksempel på Chart-komponent
   export interface ChartProps {
     // Data
     data: any[];
     series: ChartSeries[];
     
     // Dimensions
     width?: number | string;
     height?: number | string;
     
     // Axes
     xAxis?: ChartAxis;
     yAxis?: ChartAxis;
     
     // Styling
     colors?: string[];
     theme?: 'light' | 'dark' | 'custom';
     customTheme?: ChartTheme;
     
     // Features
     tooltip?: boolean | ChartTooltip;
     legend?: boolean | ChartLegend;
     grid?: boolean | ChartGrid;
     animation?: boolean | ChartAnimation;
     
     // Interactivity
     onClick?: (point: ChartPoint, event: React.MouseEvent) => void;
     onHover?: (point: ChartPoint | null, event: React.MouseEvent) => void;
     
     // Accessibility
     'aria-label'?: string;
     'aria-describedby'?: string;
   }
   
   export const Chart: React.FC<ChartProps> = ({
     data,
     series,
     width = '100%',
     height = 300,
     xAxis,
     yAxis,
     colors,
     theme = 'light',
     customTheme,
     tooltip = true,
     legend = true,
     grid = true,
     animation = true,
     onClick,
     onHover,
     'aria-label': ariaLabel,
     'aria-describedby': ariaDescribedBy,
   }) => {
     const chartRef = useRef<HTMLDivElement>(null);
     const [chartInstance, setChartInstance] = useState<any>(null);
     
     // Initialize chart
     useEffect(() => {
       if (!chartRef.current) return;
       
       // Create chart instance
       const chart = echarts.init(chartRef.current, theme === 'custom' ? undefined : theme);
       
       // Apply custom theme if provided
       if (theme === 'custom' && customTheme) {
         echarts.registerTheme('custom', customTheme);
         chart.setTheme('custom');
       }
       
       setChartInstance(chart);
       
       // Clean up on unmount
       return () => {
         chart.dispose();
       };
     }, [theme, customTheme]);
     
     // Update chart options when props change
     useEffect(() => {
       if (!chartInstance) return;
       
       // Prepare series configuration
       const seriesConfig = series.map(s => ({
         type: s.type,
         name: s.name,
         data: s.dataKey ? data.map(item => item[s.dataKey]) : s.data,
         // Other series options...
       }));
       
       // Set chart options
       chartInstance.setOption({
         color: colors,
         xAxis: xAxis ? {
           type: xAxis.type || 'category',
           data: xAxis.data || (xAxis.dataKey ? data.map(item => item[xAxis.dataKey]) : undefined),
           name: xAxis.name,
           // Other xAxis options...
         } : undefined,
         yAxis: yAxis ? {
           type: yAxis.type || 'value',
           name: yAxis.name,
           // Other yAxis options...
         } : undefined,
         tooltip: tooltip ? {
           trigger: 'item',
           // Other tooltip options...
         } : undefined,
         legend: legend ? {
           // Legend options...
         } : undefined,
         grid: grid ? {
           // Grid options...
         } : undefined,
         animation: animation,
         series: seriesConfig,
       });
       
       // Handle events
       if (onClick) {
         chartInstance.on('click', (params: any) => {
           onClick({
             seriesName: params.seriesName,
             dataIndex: params.dataIndex,
             value: params.value,
             name: params.name,
           }, params.event.event);
         });
       }
       
       if (onHover) {
         chartInstance.on('mouseover', (params: any) => {
           onHover({
             seriesName: params.seriesName,
             dataIndex: params.dataIndex,
             value: params.value,
             name: params.name,
           }, params.event.event);
         });
         
         chartInstance.on('mouseout', () => {
           onHover(null, null);
         });
       }
       
       // Handle resize
       const handleResize = () => {
         chartInstance.resize();
       };
       
       window.addEventListener('resize', handleResize);
       
       return () => {
         window.removeEventListener('resize', handleResize);
         chartInstance.off('click');
         chartInstance.off('mouseover');
         chartInstance.off('mouseout');
       };
     }, [data, series, xAxis, yAxis, colors, tooltip, legend, grid, animation, onClick, onHover, chartInstance]);
     
     return (
       <div
         ref={chartRef}
         style={{ width, height }}
         className="chart-container"
         aria-label={ariaLabel}
         aria-describedby={ariaDescribedBy}
       />
     );
   };
   ```

### 2.3 Tema og design system (4 dage)

**Afhængigheder:**
- Kræver: Grundlæggende UI-komponenter (2.1)
- Blokkerer: Brugeroplevelse (2.4), Gamification (Fase 3)

1. **Implementer komplet design system** *(Dag 1-2)*
   - Definér farvepalette med primær, sekundær og accent farver
   - Implementer typografi med skrifttyper, størrelser og vægte
   - Definér spacing og layout grid
   - Tilføj shadows, borders, radii og andre designelementer
   - Implementer design tokens og CSS variabler

   ```tsx
   // Eksempel på komplet theme configuration
   export const theme = {
     // Color system
     colors: {
       // Brand colors
       primary: {
         50: '#f0f9ff',
         100: '#e0f2fe',
         200: '#bae6fd',
         300: '#7dd3fc',
         400: '#38bdf8',
         500: '#0ea5e9',
         600: '#0284c7',
         700: '#0369a1',
         800: '#075985',
         900: '#0c4a6e',
         950: '#082f49',
       },
       secondary: {
         50: '#f5f3ff',
         100: '#ede9fe',
         200: '#ddd6fe',
         300: '#c4b5fd',
         400: '#a78bfa',
         500: '#8b5cf6',
         600: '#7c3aed',
         700: '#6d28d9',
         800: '#5b21b6',
         900: '#4c1d95',
         950: '#2e1065',
       },
       accent: {
         50: '#fff7ed',
         100: '#ffedd5',
         200: '#fed7aa',
         300: '#fdba74',
         400: '#fb923c',
         500: '#f97316',
         600: '#ea580c',
         700: '#c2410c',
         800: '#9a3412',
         900: '#7c2d12',
         950: '#431407',
       },
       
       // UI colors
       success: {
         50: '#f0fdf4',
         100: '#dcfce7',
         500: '#22c55e',
         700: '#15803d',
         900: '#14532d',
       },
       warning: {
         50: '#fffbeb',
         100: '#fef3c7',
         500: '#f59e0b',
         700: '#b45309',
         900: '#78350f',
       },
       error: {
         50: '#fef2f2',
         100: '#fee2e2',
         500: '#ef4444',
         700: '#b91c1c',
         900: '#7f1d1d',
       },
       info: {
         50: '#f0f9ff',
         100: '#e0f2fe',
         500: '#0ea5e9',
         700: '#0369a1',
         900: '#0c4a6e',
       },
       
       // Neutral colors
       gray: {
         50: '#f9fafb',
         100: '#f3f4f6',
         200: '#e5e7eb',
         300: '#d1d5db',
         400: '#9ca3af',
         500: '#6b7280',
         600: '#4b5563',
         700: '#374151',
         800: '#1f2937',
         900: '#111827',
         950: '#030712',
       },
       
       // Semantic colors
       background: {
         light: '#ffffff',
         dark: '#121212',
       },
       text: {
         light: {
           primary: 'rgba(0, 0, 0, 0.87)',
           secondary: 'rgba(0, 0, 0, 0.6)',
           disabled: 'rgba(0, 0, 0, 0.38)',
         },
         dark: {
           primary: 'rgba(255, 255, 255, 0.87)',
           secondary: 'rgba(255, 255, 255, 0.6)',
           disabled: 'rgba(255, 255, 255, 0.38)',
         },
       },
       border: {
         light: 'rgba(0, 0, 0, 0.12)',
         dark: 'rgba(255, 255, 255, 0.12)',
       },
     },
     
     // Typography system
     typography: {
       fonts: {
         body: 'Inter, system-ui, -apple-system, sans-serif',
         heading: 'Inter, system-ui, -apple-system, sans-serif',
         mono: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
       },
       fontSizes: {
         xs: '0.75rem',     // 12px
         sm: '0.875rem',    // 14px
         md: '1rem',        // 16px
         lg: '1.125rem',    // 18px
         xl: '1.25rem',     // 20px
         '2xl': '1.5rem',   // 24px
         '3xl': '1.875rem', // 30px
         '4xl': '2.25rem',  // 36px
         '5xl': '3rem',     // 48px
         '6xl': '3.75rem',  // 60px
         '7xl': '4.5rem',   // 72px
         '8xl': '6rem',     // 96px
         '9xl': '8rem',     // 128px
       },
       fontWeights: {
         thin: 100,
         extralight: 200,
         light: 300,
         normal: 400,
         medium: 500,
         semibold: 600,
         bold: 700,
         extrabold: 800,
         black: 900,
       },
       lineHeights: {
         none: 1,
         tight: 1.25,
         snug: 1.375,
         normal: 1.5,
         relaxed: 1.625,
         loose: 2,
       },
       letterSpacings: {
         tighter: '-0.05em',
         tight: '-0.025em',
         normal: '0',
         wide: '0.025em',
         wider: '0.05em',
         widest: '0.1em',
       },
       textStyles: {
         h1: {
           fontSize: '3xl',
           fontWeight: 'bold',
           lineHeight: 'tight',
           letterSpacing: 'tight',
         },
         h2: {
           fontSize: '2xl',
           fontWeight: 'semibold',
           lineHeight: 'tight',
           letterSpacing: 'tight',
         },
         // Other text styles...
       },
     },
     
     // Spacing system
     spacing: {
       0: '0',
       px: '1px',
       0.5: '0.125rem',  // 2px
       1: '0.25rem',     // 4px
       1.5: '0.375rem',  // 6px
       2: '0.5rem',      // 8px
       2.5: '0.625rem',  // 10px
       3: '0.75rem',     // 12px
       3.5: '0.875rem',  // 14px
       4: '1rem',        // 16px
       5: '1.25rem',     // 20px
       6: '1.5rem',      // 24px
       7: '1.75rem',     // 28px
       8: '2rem',        // 32px
       9: '2.25rem',     // 36px
       10: '2.5rem',     // 40px
       11: '2.75rem',    // 44px
       12: '3rem',       // 48px
       14: '3.5rem',     // 56px
       16: '4rem',       // 64px
       20: '5rem',       // 80px
       24: '6rem',       // 96px
       28: '7rem',       // 112px
       32: '8rem',       // 128px
       36: '9rem',       // 144px
       40: '10rem',      // 160px
       44: '11rem',      // 176px
       48: '12rem',      // 192px
       52: '13rem',      // 208px
       56: '14rem',      // 224px
       60: '15rem',      // 240px
       64: '16rem',      // 256px
       72: '18rem',      // 288px
       80: '20rem',      // 320px
       96: '24rem',      // 384px
     },
     
     // Breakpoints for responsive design
     breakpoints: {
       xs: '0px',
       sm: '600px',
       md: '900px',
       lg: '1200px',
       xl: '1536px',
       '2xl': '1920px',
     },
     
     // Border radius
     radii: {
       none: '0',
       sm: '0.125rem',   // 2px
       md: '0.25rem',    // 4px
       lg: '0.5rem',     // 8px
       xl: '0.75rem',    // 12px
       '2xl': '1rem',    // 16px
       '3xl': '1.5rem',  // 24px
       full: '9999px',
     },
     
     // Shadows
     shadows: {
       xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
       sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
       md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
       lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
       xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
       '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
       inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
       none: 'none',
     },
     
     // Z-index
     zIndices: {
       hide: -1,
       auto: 'auto',
       base: 0,
       docked: 10,
       dropdown: 1000,
       sticky: 1100,
       banner: 1200,
       overlay: 1300,
       modal: 1400,
       popover: 1500,
       skipLink: 1600,
       toast: 1700,
       tooltip: 1800,
     },
     
     // Transitions
     transitions: {
       easing: {
         easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
         easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
         easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
         sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
       },
       duration: {
         fastest: '50ms',
         faster: '100ms',
         fast: '150ms',
         normal: '200ms',
         slow: '300ms',
         slower: '400ms',
         slowest: '500ms',
       },
     },
   };
   
   // Generate CSS variables from theme
   export function generateCssVariables(theme) {
     return `
       :root {
         ${Object.entries(flattenObject(theme.colors, 'color')).map(([key, value]) => `--${key}: ${value};`).join('\n')}
         ${Object.entries(theme.typography.fontSizes).map(([key, value]) => `--font-size-${key}: ${value};`).join('\n')}
         ${Object.entries(theme.spacing).map(([key, value]) => `--spacing-${key}: ${value};`).join('\n')}
         ${Object.entries(theme.radii).map(([key, value]) => `--radius-${key}: ${value};`).join('\n')}
         ${Object.entries(theme.shadows).map(([key, value]) => `--shadow-${key}: ${value};`).join('\n')}
         ${Object.entries(theme.transitions.duration).map(([key, value]) => `--duration-${key}: ${value};`).join('\n')}
       }
     `;
   }
   ```

2. **Implementer tema-skift og customization** *(Dag 2-3)*
   - Udvikl ThemeProvider med context API
   - Implementer light/dark mode toggle med system preference detection
   - Tilføj tema-vælger med predefinerede temaer
   - Implementer dynamisk tema-generering baseret på primær farve
   - Tilføj tema-customization med brugerindstillinger

   ```tsx
   // Eksempel på ThemeProvider og useTheme hook
   export interface ThemeProviderProps {
     children: React.ReactNode;
     defaultTheme?: 'light' | 'dark' | 'system';
     storageKey?: string;
     themes?: Record<string, ThemeConfig>;
   }
   
   const ThemeContext = React.createContext<ThemeContextValue>({
     theme: 'light',
     setTheme: () => null,
     themes: {},
     systemTheme: 'light',
   });
   
   export const ThemeProvider: React.FC<ThemeProviderProps> = ({
     children,
     defaultTheme = 'system',
     storageKey = 'ui-theme',
     themes = {
       light: lightTheme,
       dark: darkTheme,
     },
   }) => {
     // Get system preference
     const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
     const systemTheme = prefersDark ? 'dark' : 'light';
     
     // Get stored theme
     const [theme, setThemeState] = useState<string>(() => {
       try {
         const storedTheme = localStorage.getItem(storageKey);
         return storedTheme || defaultTheme;
       } catch (error) {
         console.error('Error reading theme from localStorage:', error);
         return defaultTheme;
       }
     });
     
     // Resolve actual theme (handle 'system' value)
     const resolvedTheme = theme === 'system' ? systemTheme : theme;
     
     // Update theme in localStorage and document
     const setTheme = useCallback((newTheme: string) => {
       try {
         localStorage.setItem(storageKey, newTheme);
         setThemeState(newTheme);
       } catch (error) {
         console.error('Error saving theme to localStorage:', error);
       }
     }, [storageKey]);
     
     // Update document attributes when theme changes
     useEffect(() => {
       const root = window.document.documentElement;
       
       // Remove previous theme classes
       Object.keys(themes).forEach(themeName => {
         root.classList.remove(`theme-${themeName}`);
       });
       
       // Add current theme class
       root.classList.add(`theme-${resolvedTheme}`);
       
       // Update color-scheme
       root.style.colorScheme = resolvedTheme;
       
       // Update meta theme-color
       const metaThemeColor = document.querySelector('meta[name="theme-color"]');
       if (metaThemeColor) {
         metaThemeColor.setAttribute(
           'content',
           resolvedTheme === 'dark' ? themes.dark.colors.background.dark : themes.light.colors.background.light
         );
       }
     }, [resolvedTheme, themes]);
     
     // Update theme when system preference changes
     useEffect(() => {
       if (theme === 'system') {
         // Force re-render when system theme changes
         setThemeState('system');
       }
     }, [systemTheme]);
     
     const value = {
       theme,
       setTheme,
       themes,
       systemTheme,
     };
     
     return (
       <ThemeContext.Provider value={value}>
         {children}
       </ThemeContext.Provider>
     );
   };
   
   // Hook to use theme
   export const useTheme = () => {
     const context = useContext(ThemeContext);
     if (!context) {
       throw new Error('useTheme must be used within a ThemeProvider');
     }
     return context;
   };
   ```

3. **Implementer responsivt design system** *(Dag 3-4)*
   - Udvikl mobile-first CSS utility classes
   - Implementer responsive hooks og komponenter
   - Tilføj breakpoint system med media queries
   - Implementer container queries for avanceret responsivitet
   - Tilføj adaptive layouts baseret på skærmstørrelse og orientering

   ```tsx
   // Eksempel på responsive hooks
   export function useBreakpoint() {
     const theme = useTheme();
     const breakpoints = theme.breakpoints;
     
     const queries = useMemo(() => {
       return Object.entries(breakpoints).reduce((acc, [key, value]) => {
         acc[key] = `(min-width: ${value})`;
         return acc;
       }, {} as Record<string, string>);
     }, [breakpoints]);
     
     const [matches, setMatches] = useState(() => {
       return Object.keys(queries).reduce((acc, key) => {
         acc[key] = false;
         return acc;
       }, {} as Record<string, boolean>);
     });
     
     useEffect(() => {
       const mediaQueryLists: Record<string, MediaQueryList> = {};
       const handlers: Record<string, (e: MediaQueryListEvent) => void> = {};
       
       Object.entries(queries).forEach(([key, query]) => {
         mediaQueryLists[key] = window.matchMedia(query);
         handlers[key] = (e: MediaQueryListEvent) => {
           setMatches(prev => ({
             ...prev,
             [key]: e.matches,
           }));
         };
         
         // Set initial values
         setMatches(prev => ({
           ...prev,
           [key]: mediaQueryLists[key].matches,
         }));
         
         // Add listeners
         if (mediaQueryLists[key].addEventListener) {
           mediaQueryLists[key].addEventListener('change', handlers[key]);
         } else {
           // Fallback for older browsers
           mediaQueryLists[key].addListener(handlers[key]);
         }
       });
       
       // Cleanup
       return () => {
         Object.entries(mediaQueryLists).forEach(([key, mql]) => {
           if (mql.removeEventListener) {
             mql.removeEventListener('change', handlers[key]);
           } else {
             // Fallback for older browsers
             mql.removeListener(handlers[key]);
           }
         });
       };
     }, [queries]);
     
     // Get current active breakpoint
     const activeBreakpoint = useMemo(() => {
       const sorted = Object.entries(breakpoints)
         .sort((a, b) => parseInt(b[1]) - parseInt(a[1]));
       
       return sorted.find(([key]) => matches[key])?.[0] || 'xs';
     }, [matches, breakpoints]);
     
     return { matches, activeBreakpoint };
   }
   
   // Responsive value utility
   export function useResponsiveValue<T>(values: ResponsiveValue<T>): T {
     const { activeBreakpoint } = useBreakpoint();
     const breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
     
     if (typeof values !== 'object' || values === null) {
       return values as T;
     }
     
     // Find the appropriate value based on current breakpoint
     const currentIndex = breakpointOrder.indexOf(activeBreakpoint);
     
     // Look for exact match first
     if (values[activeBreakpoint] !== undefined) {
       return values[activeBreakpoint] as T;
     }
     
     // Look for smaller breakpoints
     for (let i = currentIndex - 1; i >= 0; i--) {
       const breakpoint = breakpointOrder[i];
       if (values[breakpoint] !== undefined) {
         return values[breakpoint] as T;
       }
     }
     
     // Fallback to base value
     return values.base as T;
   }
   ```

4. **Implementer design tokens og styling system** *(Dag 4)*
   - Udvikl design token system med CSS variabler
   - Implementer styling utilities og mixins
   - Tilføj CSS-in-JS løsning med theming support
   - Implementer style composition og variant system
   - Tilføj automatisk dark mode styling baseret på tokens

   ```tsx
   // Eksempel på styling system med CSS-in-JS
   export interface StyleProps {
     theme?: Theme;
     sx?: SxProps;
     css?: CSSObject;
     className?: string;
   }
   
   export type SxProps = CSSObject | ((theme: Theme) => CSSObject);
   
   export const styled = <T extends React.ComponentType<any>>(
     Component: T,
     baseStyles?: CSSObject | ((theme: Theme) => CSSObject),
     options?: StyledOptions
   ) => {
     const StyledComponent = React.forwardRef<
       React.ComponentRef<T>,
       React.ComponentPropsWithRef<T> & StyleProps
     >((props, ref) => {
       const { sx, css, className, ...rest } = props;
       const theme = useTheme();
       
       // Compute base styles
       const computedBaseStyles = typeof baseStyles === 'function'
         ? baseStyles(theme)
         : baseStyles || {};
       
       // Compute sx prop styles
       const computedSxStyles = typeof sx === 'function'
         ? sx(theme)
         : sx || {};
       
       // Merge all styles
       const mergedStyles = {
         ...computedBaseStyles,
         ...computedSxStyles,
         ...css,
       };
       
       // Generate class name from styles
       const generatedClassName = css(mergedStyles);
       
       // Combine with provided className
       const combinedClassName = cx(generatedClassName, className);
       
       return <Component ref={ref} className={combinedClassName} {...rest} />;
     });
     
     StyledComponent.displayName = `Styled(${getDisplayName(Component)})`;
     
     return StyledComponent;
   };
   
   // Variant system
   export function createVariants<T extends Record<string, any>>(
     config: VariantConfig<T>
   ) {
     return (props: T & { theme: Theme }) => {
       const { theme, ...restProps } = props;
       let styles = {};
       
       // Apply variants
       Object.entries(config).forEach(([propName, variantConfig]) => {
         const propValue = restProps[propName as keyof typeof restProps];
         if (propValue !== undefined && variantConfig[propValue]) {
           const variantStyle = typeof variantConfig[propValue] === 'function'
             ? variantConfig[propValue](theme, restProps)
             : variantConfig[propValue];
           
           styles = { ...styles, ...variantStyle };
         }
       });
       
       return styles;
     };
   }
   ```

### 2.4 Brugeroplevelse og tilgængelighed (5 dage)

**Afhængigheder:**
- Kræver: UI-komponenter (2.1, 2.2), Tema (2.3)
- Blokkerer: Gamification (Fase 3)

1. **Implementer avanceret navigation og brugerflow** *(Dag 1-2)*
   - Udvikl breadcrumbs og navigation trails med context tracking
   - Implementer global søgefunktion med autocomplete og resultatkategorier
   - Tilføj keyboard shortcuts og navigation med kommandopalette
   - Implementer intelligent routing med history management
   - Tilføj progress-bevarende navigation og form recovery

   ```tsx
   // Eksempel på NavigationContext og useNavigation hook
   export interface NavigationContextValue {
     // Current navigation state
     currentPath: string;
     previousPath: string;
     navigationHistory: string[];
     
     // Breadcrumb data
     breadcrumbs: Breadcrumb[];
     
     // Navigation methods
     navigate: (path: string, options?: NavigateOptions) => void;
     goBack: () => void;
     goForward: () => void;
     
     // Search
     searchResults: SearchResult[];
     isSearching: boolean;
     search: (query: string) => Promise<SearchResult[]>;
     clearSearch: () => void;
   }
   
   export interface Breadcrumb {
     label: string;
     path: string;
     icon?: React.ReactNode;
   }
   
   export interface SearchResult {
     id: string;
     title: string;
     description?: string;
     path: string;
     category: string;
     icon?: React.ReactNode;
     highlight?: {
       field: string;
       text: string;
     }[];
   }
   
   const NavigationContext = React.createContext<NavigationContextValue | undefined>(undefined);
   
   export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
     const router = useRouter();
     const [previousPath, setPreviousPath] = useState<string>('');
     const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
     const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
     const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
     const [isSearching, setIsSearching] = useState<boolean>(false);
     
     // Update navigation history when path changes
     useEffect(() => {
       const currentPath = router.asPath;
       
       if (currentPath !== previousPath) {
         setPreviousPath(previousPath);
         setNavigationHistory(prev => [...prev, currentPath].slice(-10));
       }
     }, [router.asPath, previousPath]);
     
     // Generate breadcrumbs based on current path
     useEffect(() => {
       const generateBreadcrumbs = async () => {
         const currentPath = router.asPath;
         const pathSegments = currentPath.split('/').filter(Boolean);
         
         const breadcrumbData: Breadcrumb[] = [
           { label: 'Home', path: '/', icon: <HomeIcon /> },
         ];
         
         let currentPathAccumulator = '';
         
         for (const segment of pathSegments) {
           currentPathAccumulator += `/${segment}`;
           
           // Get page metadata for this path
           const metadata = await getPageMetadata(currentPathAccumulator);
           
           breadcrumbData.push({
             label: metadata?.title || startCase(segment),
             path: currentPathAccumulator,
             icon: metadata?.icon,
           });
         }
         
         setBreadcrumbs(breadcrumbData);
       };
       
       generateBreadcrumbs();
     }, [router.asPath]);
     
     // Navigation methods
     const navigate = useCallback((path: string, options?: NavigateOptions) => {
       if (options?.replace) {
         router.replace(path);
       } else {
         router.push(path);
       }
     }, [router]);
     
     const goBack = useCallback(() => {
       if (navigationHistory.length > 1) {
         const previousPath = navigationHistory[navigationHistory.length - 2];
         router.push(previousPath);
         setNavigationHistory(prev => prev.slice(0, -1));
       }
     }, [navigationHistory, router]);
     
     const goForward = useCallback(() => {
       router.forward();
     }, [router]);
     
     // Search functionality
     const search = useCallback(async (query: string): Promise<SearchResult[]> => {
       if (!query.trim()) {
         setSearchResults([]);
         return [];
       }
       
       setIsSearching(true);
       
       try {
         const results = await searchService.search(query);
         setSearchResults(results);
         return results;
       } catch (error) {
         console.error('Search error:', error);
         return [];
       } finally {
         setIsSearching(false);
       }
     }, []);
     
     const clearSearch = useCallback(() => {
       setSearchResults([]);
     }, []);
     
     // Register keyboard shortcuts
     useEffect(() => {
       const handleKeyDown = (e: KeyboardEvent) => {
         // Command palette: Cmd+K or Ctrl+K
         if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
           e.preventDefault();
           // Open command palette
         }
         
         // Back: Alt+Left
         if (e.altKey && e.key === 'ArrowLeft') {
           e.preventDefault();
           goBack();
         }
         
         // Forward: Alt+Right
         if (e.altKey && e.key === 'ArrowRight') {
           e.preventDefault();
           goForward();
         }
       };
       
       window.addEventListener('keydown', handleKeyDown);
       return () => window.removeEventListener('keydown', handleKeyDown);
     }, [goBack, goForward]);
     
     const value = {
       currentPath: router.asPath,
       previousPath,
       navigationHistory,
       breadcrumbs,
       navigate,
       goBack,
       goForward,
       searchResults,
       isSearching,
       search,
       clearSearch,
     };
     
     return (
       <NavigationContext.Provider value={value}>
         {children}
       </NavigationContext.Provider>
     );
   };
   
   export const useNavigation = () => {
     const context = useContext(NavigationContext);
     if (!context) {
       throw new Error('useNavigation must be used within a NavigationProvider');
     }
     return context;
   };
   ```

2. **Implementer omfattende tilgængelighed (a11y)** *(Dag 2-3)*
   - Udvikl a11y-hooks og utilities for konsistent implementering
   - Implementer ARIA-attributter og semantisk HTML i alle komponenter
   - Tilføj keyboard navigation, focus management og focus trapping
   - Implementer screen reader announcements for dynamisk indhold
   - Tilføj high contrast mode og reduced motion support

   ```tsx
   // Eksempel på a11y utilities
   export const A11yProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
     const [announcements, setAnnouncements] = useState<string[]>([]);
     
     // Function to announce messages to screen readers
     const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
       setAnnouncements(prev => [...prev, message]);
       
       // Clean up announcements after they've been read
       setTimeout(() => {
         setAnnouncements(prev => prev.filter(m => m !== message));
       }, 3000);
     }, []);
     
     // Focus trap utility
     const createFocusTrap = useCallback((ref: React.RefObject<HTMLElement>) => {
       return {
         activate: () => {
           // Store previous active element
           const previousActiveElement = document.activeElement as HTMLElement;
           
           // Find all focusable elements
           const focusableElements = ref.current?.querySelectorAll(
             'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
           ) || [];
           
           const firstElement = focusableElements[0] as HTMLElement;
           const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
           
           // Set focus to first element
           firstElement?.focus();
           
           // Handle tab key to trap focus
           const handleKeyDown = (e: KeyboardEvent) => {
             if (e.key === 'Tab') {
               if (e.shiftKey) {
                 // Shift+Tab: if on first element, move to last
                 if (document.activeElement === firstElement) {
                   e.preventDefault();
                   lastElement?.focus();
                 }
               } else {
                 // Tab: if on last element, move to first
                 if (document.activeElement === lastElement) {
                   e.preventDefault();
                   firstElement?.focus();
                 }
               }
             }
           };
           
           // Add event listener
           document.addEventListener('keydown', handleKeyDown);
           
           return {
             deactivate: () => {
               document.removeEventListener('keydown', handleKeyDown);
               previousActiveElement?.focus();
             }
           };
         }
       };
     }, []);
     
     // Skip to content link handler
     const handleSkipToContent = useCallback(() => {
       const mainContent = document.getElementById('main-content');
       if (mainContent) {
         mainContent.focus();
         mainContent.setAttribute('tabindex', '-1');
         
         // Remove tabindex after blur
         const handleBlur = () => {
           mainContent.removeAttribute('tabindex');
           mainContent.removeEventListener('blur', handleBlur);
         };
         
         mainContent.addEventListener('blur', handleBlur);
       }
     }, []);
     
     const value = {
       announce,
       createFocusTrap,
       handleSkipToContent,
     };
     
     return (
       <A11yContext.Provider value={value}>
         {/* Skip to content link */}
         <a 
           href="#main-content" 
           className="skip-link"
           onClick={handleSkipToContent}
         >
           Skip to content
         </a>
         
         {/* Screen reader announcements */}
         <div 
           aria-live="polite" 
           aria-atomic="true" 
           className="sr-only"
         >
           {announcements.map((announcement, i) => (
             <div key={`${announcement}-${i}`}>{announcement}</div>
           ))}
         </div>
         
         {children}
       </A11yContext.Provider>
     );
   };
   
   // Hook to use a11y features
   export const useA11y = () => {
     const context = useContext(A11yContext);
     if (!context) {
       throw new Error('useA11y must be used within an A11yProvider');
     }
     return context;
   };
   ```

3. **Implementer avanceret performance optimering** *(Dag 3-4)*
   - Udvikl intelligent code splitting og dynamic imports
   - Implementer virtualisering for lange lister og tabeller
   - Tilføj progressive image loading og responsive images
   - Implementer service worker for offline support og caching
   - Tilføj performance monitoring og automatisk optimering

   ```tsx
   // Eksempel på performance optimeret image component
   export interface OptimizedImageProps {
     src: string;
     alt: string;
     width?: number;
     height?: number;
     sizes?: string;
     priority?: boolean;
     loading?: 'lazy' | 'eager';
     placeholder?: 'blur' | 'empty';
     blurDataURL?: string;
     objectFit?: CSSProperties['objectFit'];
     objectPosition?: CSSProperties['objectPosition'];
     onLoad?: () => void;
     onError?: () => void;
   }
   
   export const OptimizedImage: React.FC<OptimizedImageProps> = ({
     src,
     alt,
     width,
     height,
     sizes = '100vw',
     priority = false,
     loading = 'lazy',
     placeholder = 'empty',
     blurDataURL,
     objectFit = 'cover',
     objectPosition = 'center',
     onLoad,
     onError,
   }) => {
     const [isLoaded, setIsLoaded] = useState(false);
     const [error, setError] = useState(false);
     const imgRef = useRef<HTMLImageElement>(null);
     
     // Generate srcSet for responsive images
     const generateSrcSet = () => {
       if (!width) return undefined;
       
       const widths = [320, 640, 960, 1280, 1920, 2560];
       const filteredWidths = widths.filter(w => w <= width * 2);
       
       if (filteredWidths.length === 0) {
         filteredWidths.push(width);
       }
       
       return filteredWidths
         .map(w => `${getImageUrl(src, w)} ${w}w`)
         .join(', ');
     };
     
     // Get image URL with width parameter
     const getImageUrl = (url: string, width: number) => {
       // Check if URL is already an optimized image URL
       if (url.includes('?w=')) {
         return url;
       }
       
       // Add width parameter to URL
       const separator = url.includes('?') ? '&' : '?';
       return `${url}${separator}w=${width}`;
     };
     
     // Generate low quality placeholder
     const getLowQualityUrl = () => {
       if (blurDataURL) return blurDataURL;
       return getImageUrl(src, 20);
     };
     
     // Handle image load
     const handleLoad = () => {
       setIsLoaded(true);
       onLoad?.();
     };
     
     // Handle image error
     const handleError = () => {
       setError(true);
       onError?.();
     };
     
     // Use Intersection Observer for lazy loading
     useEffect(() => {
       if (priority || loading === 'eager' || !imgRef.current) return;
       
       const observer = new IntersectionObserver(
         (entries) => {
           entries.forEach(entry => {
             if (entry.isIntersecting) {
               const img = entry.target as HTMLImageElement;
               img.src = src;
               if (generateSrcSet()) {
                 img.srcset = generateSrcSet();
               }
               observer.disconnect();
             }
           });
         },
         {
           rootMargin: '200px 0px',
           threshold: 0.01,
         }
       );
       
       observer.observe(imgRef.current);
       
       return () => {
         observer.disconnect();
       };
     }, [src, priority, loading]);
     
     return (
       <div
         className={cx(
           'optimized-image-container',
           isLoaded && 'image-loaded',
           error && 'image-error'
         )}
         style={{
           position: 'relative',
           overflow: 'hidden',
           width: width ? `${width}px` : '100%',
           height: height ? `${height}px` : 'auto',
         }}
       >
         {/* Low quality placeholder */}
         {placeholder === 'blur' && !isLoaded && !error && (
           <img
             src={getLowQualityUrl()}
             alt=""
             aria-hidden="true"
             className="image-placeholder"
             style={{
               position: 'absolute',
               top: 0,
               left: 0,
               width: '100%',
               height: '100%',
               objectFit,
               objectPosition,
               filter: 'blur(20px)',
               transform: 'scale(1.1)',
             }}
           />
         )}
         
         {/* Main image */}
         <img
           ref={imgRef}
           src={priority || loading === 'eager' ? src : undefined}
           srcSet={priority || loading === 'eager' ? generateSrcSet() : undefined}
           sizes={sizes}
           alt={alt}
           width={width}
           height={height}
           onLoad={handleLoad}
           onError={handleError}
           loading={priority ? undefined : loading}
           decoding="async"
           style={{
             objectFit,
             objectPosition,
             width: '100%',
             height: '100%',
             opacity: isLoaded ? 1 : 0,
             transition: 'opacity 0.3s ease',
           }}
         />
         
         {/* Error fallback */}
         {error && (
           <div className="image-error-fallback">
             <ImageErrorIcon />
             <span>Failed to load image</span>
           </div>
         )}
       </div>
     );
   };
   ```

4. **Implementer brugerflow optimering og UX patterns** *(Dag 4-5)*
   - Udvikl skeletons og content placeholders for loading states
   - Implementer optimistic UI updates for bedre responsiveness
   - Tilføj error boundaries og fejlhåndtering med recovery
   - Implementer form validation med real-time feedback
   - Tilføj onboarding flows og guided tours

   ```tsx
   // Eksempel på optimistic update hook
   export function useOptimisticUpdate<T, U = any>(
     mutationFn: (data: U) => Promise<T>,
     options?: {
       onSuccess?: (data: T) => void;
       onError?: (error: Error, rollbackData: T) => void;
       rollbackOnError?: boolean;
     }
   ) {
     const [isLoading, setIsLoading] = useState(false);
     const [error, setError] = useState<Error | null>(null);
     const rollbackDataRef = useRef<T | null>(null);
     
     const mutate = useCallback(
       async (newData: T, mutationData: U) => {
         setIsLoading(true);
         setError(null);
         
         // Store current data for potential rollback
         rollbackDataRef.current = newData;
         
         try {
           // Perform actual mutation
           const result = await mutationFn(mutationData);
           
           // Call success callback
           options?.onSuccess?.(result);
           
           setIsLoading(false);
           return result;
         } catch (err) {
           setError(err as Error);
           
           // Call error callback
           options?.onError?.(err as Error, rollbackDataRef.current);
           
           setIsLoading(false);
           throw err;
         }
       },
       [mutationFn, options]
     );
     
     return {
       mutate,
       isLoading,
       error,
     };
   }
   
   // Example usage:
   // const { mutate } = useOptimisticUpdate(
   //   (todoData) => api.updateTodo(todoData),
   //   {
   //     onSuccess: (data) => {
   //       toast.success('Todo updated successfully');
   //     },
   //     onError: (error, rollbackData) => {
   //       toast.error('Failed to update todo');
   //       // Rollback UI state
   //       setTodos(prevTodos => 
   //         prevTodos.map(todo => 
   //           todo.id === rollbackData.id ? rollbackData : todo
   //         )
   //       );
   //     }
   //   }
   // );
   //
   // // In UI event handler:
   // const handleToggleTodo = (id) => {
   //   // Optimistically update UI
   //   const updatedTodos = todos.map(todo => 
   //     todo.id === id ? { ...todo, completed: !todo.completed } : todo
   //   );
   //   setTodos(updatedTodos);
   //   
   //   // Perform actual update
   //   const updatedTodo = updatedTodos.find(todo => todo.id === id);
   //   mutate(updatedTodo, { id, completed: updatedTodo.completed });
   // };
   ```

5. **Implementer brugertest og analytics** *(Dag 5)*
   - Udvikl analytics tracking med privacy-first approach
   - Implementer A/B testing framework for UI eksperimenter
   - Tilføj user feedback collection og bug reporting
   - Implementer session recording med privacy controls
   - Tilføj heatmaps og click tracking

   ```tsx
   // Eksempel på analytics provider
   export interface AnalyticsEvent {
     category: string;
     action: string;
     label?: string;
     value?: number;
     properties?: Record<string, any>;
   }
   
   export interface AnalyticsPageView {
     path: string;
     title: string;
     properties?: Record<string, any>;
   }
   
   export interface AnalyticsUser {
     id: string;
     traits?: Record<string, any>;
   }
   
   export interface AnalyticsProviderProps {
     children: React.ReactNode;
     providers?: AnalyticsAdapter[];
     consentRequired?: boolean;
     defaultConsent?: AnalyticsConsent;
   }
   
   export interface AnalyticsConsent {
     necessary: boolean;
     analytics: boolean;
     marketing: boolean;
     preferences: boolean;
   }
   
   export interface AnalyticsAdapter {
     name: string;
     type: 'necessary' | 'analytics' | 'marketing' | 'preferences';
     initialize: (consent: AnalyticsConsent) => void;
     trackEvent: (event: AnalyticsEvent) => void;
     trackPageView: (pageView: AnalyticsPageView) => void;
     identifyUser: (user: AnalyticsUser) => void;
     reset: () => void;
   }
   
   export const AnalyticsContext = React.createContext<{
     trackEvent: (event: AnalyticsEvent) => void;
     trackPageView: (pageView: AnalyticsPageView) => void;
     identifyUser: (user: AnalyticsUser) => void;
     resetAnalytics: () => void;
     consent: AnalyticsConsent;
     updateConsent: (consent: Partial<AnalyticsConsent>) => void;
   }>({
     trackEvent: () => {},
     trackPageView: () => {},
     identifyUser: () => {},
     resetAnalytics: () => {},
     consent: {
       necessary: true,
       analytics: false,
       marketing: false,
       preferences: false,
     },
     updateConsent: () => {},
   });
   
   export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({
     children,
     providers = [],
     consentRequired = true,
     defaultConsent = {
       necessary: true,
       analytics: false,
       marketing: false,
       preferences: false,
     },
   }) => {
     // Load consent from storage
     const [consent, setConsent] = useState<AnalyticsConsent>(() => {
       if (typeof window === 'undefined') return defaultConsent;
       
       try {
         const storedConsent = localStorage.getItem('analytics-consent');
         return storedConsent ? JSON.parse(storedConsent) : defaultConsent;
       } catch (error) {
         console.error('Error loading analytics consent:', error);
         return defaultConsent;
       }
     });
     
     // Initialize providers
     useEffect(() => {
       providers.forEach(provider => {
         if (
           provider.type === 'necessary' ||
           (provider.type === 'analytics' && consent.analytics) ||
           (provider.type === 'marketing' && consent.marketing) ||
           (provider.type === 'preferences' && consent.preferences)
         ) {
           provider.initialize(consent);
         }
       });
     }, [providers, consent]);
     
     // Track page views
     useEffect(() => {
       if (typeof window === 'undefined') return;
       
       const handleRouteChange = (url: string) => {
         const pageView: AnalyticsPageView = {
           path: url,
           title: document.title,
         };
         
         trackPageView(pageView);
       };
       
       // Track initial page view
       handleRouteChange(window.location.pathname + window.location.search);
       
       // Set up router events
       router.events.on('routeChangeComplete', handleRouteChange);
       
       return () => {
         router.events.off('routeChangeComplete', handleRouteChange);
       };
     }, [consent]);
     
     // Update consent
     const updateConsent = useCallback((newConsent: Partial<AnalyticsConsent>) => {
       const updatedConsent = { ...consent, ...newConsent };
       setConsent(updatedConsent);
       
       // Save to storage
       try {
         localStorage.setItem('analytics-consent', JSON.stringify(updatedConsent));
       } catch (error) {
         console.error('Error saving analytics consent:', error);
       }
       
       // Reinitialize providers
       providers.forEach(provider => {
         if (
           provider.type === 'necessary' ||
           (provider.type === 'analytics' && updatedConsent.analytics) ||
           (provider.type === 'marketing' && updatedConsent.marketing) ||
           (provider.type === 'preferences' && updatedConsent.preferences)
         ) {
           provider.initialize(updatedConsent);
         }
       });
     }, [consent, providers]);
     
     // Track event
     const trackEvent = useCallback((event: AnalyticsEvent) => {
       providers.forEach(provider => {
         if (
           provider.type === 'necessary' ||
           (provider.type === 'analytics' && consent.analytics) ||
           (provider.type === 'marketing' && consent.marketing) ||
           (provider.type === 'preferences' && consent.preferences)
         ) {
           provider.trackEvent(event);
         }
       });
     }, [providers, consent]);
     
     // Track page view
     const trackPageView = useCallback((pageView: AnalyticsPageView) => {
       providers.forEach(provider => {
         if (
           provider.type === 'necessary' ||
           (provider.type === 'analytics' && consent.analytics) ||
           (provider.type === 'marketing' && consent.marketing) ||
           (provider.type === 'preferences' && consent.preferences)
         ) {
           provider.trackPageView(pageView);
         }
       });
     }, [providers, consent]);
     
     // Identify user
     const identifyUser = useCallback((user: AnalyticsUser) => {
       providers.forEach(provider => {
         if (
           provider.type === 'necessary' ||
           (provider.type === 'analytics' && consent.analytics) ||
           (provider.type === 'marketing' && consent.marketing) ||
           (provider.type === 'preferences' && consent.preferences)
         ) {
           provider.identifyUser(user);
         }
       });
     }, [providers, consent]);
     
     // Reset analytics
     const resetAnalytics = useCallback(() => {
       providers.forEach(provider => {
         provider.reset();
       });
     }, [providers]);
     
     const value = {
       trackEvent,
       trackPageView,
       identifyUser,
       resetAnalytics,
       consent,
       updateConsent,
     };
     
     return (
       <AnalyticsContext.Provider value={value}>
         {children}
         
         {/* Consent banner if required and not given */}
         {consentRequired && !consent.analytics && !consent.marketing && !consent.preferences && (
           <ConsentBanner onAccept={updateConsent} />
         )}
       </AnalyticsContext.Provider>
     );
   };
   
   // Hook to use analytics
   export const useAnalytics = () => {
     return useContext(AnalyticsContext);
   };
   ```

## Fase 3: Gamification og brugerengagement

**Varighed: 2 uger**

### 3.1 XP og niveausystem (3 dage)

1. **Implementer XP-system**
   - Definér XP-værdier for forskellige aktiviteter
   - Implementer XP-tildeling og tracking
   - Tilføj niveauer baseret på XP

   ```prisma
   model User {
     // Eksisterende felter...
     xp Int @default(0)
     level Int @default(1)
     xpHistory XpTransaction[]
   }
   
   model XpTransaction {
     id Int @id @default(autoincrement())
     userId Int
     amount Int
     reason String
     metadata Json?
     createdAt DateTime @default(now())
     user User @relation(fields: [userId], references: [id])
   }
   ```

2. **Implementer XP-notifikationer**
   - Tilføj real-time notifikationer ved XP-tildeling
   - Implementer XP-animation ved optjening
   - Tilføj level-up celebration

   ```typescript
   // Eksempel på XP-service
   @Injectable()
   export class XpService {
     constructor(
       private prisma: PrismaService,
       private notificationService: NotificationService,
     ) {}
     
     async awardXp(userId: number, amount: number, reason: string, metadata?: any) {
       // Award XP and check for level up
       const user = await this.prisma.user.update({
         where: { id: userId },
         data: { xp: { increment: amount } },
         include: { xpHistory: true },
       });
       
       // Create XP transaction
       await this.prisma.xpTransaction.create({
         data: {
           userId,
           amount,
           reason,
           metadata,
         },
       });
       
       // Check for level up
       const newLevel = this.calculateLevel(user.xp);
       if (newLevel > user.level) {
         await this.prisma.user.update({
           where: { id: userId },
           data: { level: newLevel },
         });
         
         // Send level up notification
         await this.notificationService.sendNotification(userId, {
           type: 'LEVEL_UP',
           title: 'Level Up!',
           message: `Congratulations! You've reached level ${newLevel}!`,
         });
       }
       
       // Send XP notification
       await this.notificationService.sendNotification(userId, {
         type: 'XP_EARNED',
         title: 'XP Earned',
         message: `You've earned ${amount} XP for ${reason}!`,
       });
       
       return { xp: user.xp, level: newLevel };
     }
     
     calculateLevel(xp: number): number {
       // Implement level calculation algorithm
       // Example: level = Math.floor(Math.sqrt(xp / 100)) + 1
     }
   }
   ```

3. **Implementer XP-historik og statistik**
   - Tilføj XP-historik side med filtrering
   - Implementer XP-statistik og grafer
   - Tilføj XP-prognose og mål

### 3.2 Badges og achievements (3 dage)

1. **Implementer badge-system**
   - Definér badge-kategorier og typer
   - Implementer badge-tildeling og tracking
   - Tilføj badge-visning på profil

   ```prisma
   model Badge {
     id Int @id @default(autoincrement())
     name String
     description String
     icon String
     category BadgeCategory
     criteria Json
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
     userBadges UserBadge[]
   }
   
   model UserBadge {
     id Int @id @default(autoincrement())
     userId Int
     badgeId Int
     awardedAt DateTime @default(now())
     user User @relation(fields: [userId], references: [id])
     badge Badge @relation(fields: [badgeId], references: [id])
     
     @@unique([userId, badgeId])
   }
   
   enum BadgeCategory {
     COMPLETION
     ACHIEVEMENT
     PARTICIPATION
     SPECIAL
   }
   ```

2. **Implementer achievement-tracking**
   - Definér achievements med kriterier
   - Implementer automatisk tracking af fremskridt
   - Tilføj achievement-notifikationer

   ```typescript
   // Eksempel på Achievement-service
   @Injectable()
   export class AchievementService {
     constructor(
       private prisma: PrismaService,
       private badgeService: BadgeService,
     ) {}
     
     async checkAchievements(userId: number) {
       const user = await this.prisma.user.findUnique({
         where: { id: userId },
         include: {
           quizAttempts: true,
           progress: true,
           // Include other relevant relations
         },
       });
       
       const badges = await this.prisma.badge.findMany();
       
       for (const badge of badges) {
         // Check if user already has this badge
         const hasBadge = await this.prisma.userBadge.findUnique({
           where: {
             userId_badgeId: {
               userId,
               badgeId: badge.id,
             },
           },
         });
         
         if (hasBadge) continue;
         
         // Check if user meets criteria for this badge
         const criteria = badge.criteria as any;
         let meetsAllCriteria = true;
         
         // Example criteria check for course completion
         if (criteria.type === 'COURSE_COMPLETION' && criteria.courseId) {
           const courseCompleted = user.progress.some(
             p => p.courseId === criteria.courseId && p.status === 'COMPLETED'
           );
           
           if (!courseCompleted) {
             meetsAllCriteria = false;
           }
         }
         
         // Example criteria check for quiz score
         if (criteria.type === 'QUIZ_SCORE' && criteria.quizId && criteria.minScore) {
           const bestAttempt = user.quizAttempts
             .filter(a => a.quizId === criteria.quizId)
             .sort((a, b) => b.score - a.score)[0];
             
           if (!bestAttempt || bestAttempt.score < criteria.minScore) {
             meetsAllCriteria = false;
           }
         }
         
         // Award badge if all criteria are met
         if (meetsAllCriteria) {
           await this.badgeService.awardBadge(userId, badge.id);
         }
       }
     }
   }
   ```

3. **Implementer badge-showcase**
   - Tilføj badge-galleri på profil
   - Implementer badge-detaljevisning
   - Tilføj mulighed for at fremhæve badges

### 3.3 Leaderboards og social interaktion (3 dage)

1. **Implementer leaderboards**
   - Tilføj global leaderboard baseret på XP
   - Implementer kursus-specifikke leaderboards
   - Tilføj filtrering og tidsperioder (uge, måned, all-time)

   ```prisma
   model Leaderboard {
     id Int @id @default(autoincrement())
     type LeaderboardType
     courseId Int?
     period LeaderboardPeriod
     startDate DateTime
     endDate DateTime
     entries LeaderboardEntry[]
     course Course? @relation(fields: [courseId], references: [id])
     
     @@unique([type, courseId, period, startDate])
   }
   
   model LeaderboardEntry {
     id Int @id @default(autoincrement())
     leaderboardId Int
     userId Int
     rank Int
     score Int
     leaderboard Leaderboard @relation(fields: [leaderboardId], references: [id])
     user User @relation(fields: [userId], references: [id])
     
     @@unique([leaderboardId, userId])
   }
   
   enum LeaderboardType {
     XP
     QUIZ_SCORE
     COMPLETION_RATE
   }
   
   enum LeaderboardPeriod {
     DAILY
     WEEKLY
     MONTHLY
     ALL_TIME
   }
   ```

2. **Implementer social features**
   - Tilføj bruger-til-bruger messaging
   - Implementer kommentarer på kurser og lektioner
   - Tilføj mulighed for at dele fremskridt og badges

3. **Implementer studiegrupper**
   - Tilføj mulighed for at oprette og tilmelde sig grupper
   - Implementer gruppe-diskussioner og ressourcedeling
   - Tilføj gruppe-leaderboards og statistik

### 3.4 Progress tracking og visualisering (5 dage)

1. **Implementer detaljeret progress tracking**
   - Tilføj tracking af tid brugt på lektioner
   - Implementer tracking af quiz-forsøg og resultater
   - Tilføj tracking af læsehastighed og engagement

   ```prisma
   model UserProgress {
     // Eksisterende felter...
     timeSpent Int? // i sekunder
     engagementScore Float?
     lastInteractionAt DateTime?
   }
   ```

2. **Implementer progress visualisering**
   - Tilføj progress bars og completion rings
   - Implementer heat maps for aktivitet
   - Tilføj skill trees og learning paths

   ```tsx
   // Eksempel på ProgressRing-komponent
   export interface ProgressRingProps {
     progress: number; // 0-100
     size?: number;
     strokeWidth?: number;
     color?: string;
     backgroundColor?: string;
     children?: React.ReactNode;
   }
   
   export const ProgressRing: React.FC<ProgressRingProps> = ({
     progress,
     size = 120,
     strokeWidth = 8,
     color = 'currentColor',
     backgroundColor = 'rgba(0, 0, 0, 0.1)',
     children,
   }) => {
     const radius = (size - strokeWidth) / 2;
     const circumference = 2 * Math.PI * radius;
     const strokeDashoffset = circumference - (progress / 100) * circumference;
     
     return (
       <div className="relative" style={{ width: size, height: size }}>
         <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
           <circle
             cx={size / 2}
             cy={size / 2}
             r={radius}
             fill="none"
             stroke={backgroundColor}
             strokeWidth={strokeWidth}
           />
           <circle
             cx={size / 2}
             cy={size / 2}
             r={radius}
             fill="none"
             stroke={color}
             strokeWidth={strokeWidth}
             strokeDasharray={circumference}
             strokeDashoffset={strokeDashoffset}
             transform={`rotate(-90 ${size / 2} ${size / 2})`}
             strokeLinecap="round"
           />
         </svg>
         {children && (
           <div className="absolute inset-0 flex items-center justify-center">
             {children}
           </div>
         )}
       </div>
     );
   };
   ```

3. **Implementer statistik og analytics**
   - Tilføj personlig dashboard med nøgletal
   - Implementer grafer for fremskridt over tid
   - Tilføj prædiktiv analyse for fremtidige resultater

## Fase 4: AI-integration

**Varighed: 3 uger**

### 4.1 AI-assisteret spørgsmålsgenerering (5 dage)

1. **Implementer dokument-analyse**
   - Tilføj upload og parsing af dokumenter (PDF, DOCX, PPT)
   - Implementer tekst-ekstraktion og preprocessing
   - Tilføj emne-identifikation og kategorisering

   ```typescript
   // Eksempel på dokument-analyse service
   @Injectable()
   export class DocumentAnalysisService {
     constructor(
       private readonly aiService: AIService,
     ) {}
     
     async analyzeDocument(file: Express.Multer.File): Promise<DocumentAnalysis> {
       // Extract text from document based on file type
       const text = await this.extractText(file);
       
       // Preprocess text
       const processedText = this.preprocessText(text);
       
       // Identify topics
       const topics = await this.aiService.identifyTopics(processedText);
       
       // Extract key concepts
       const concepts = await this.aiService.extractConcepts(processedText);
       
       return {
         text: processedText,
         topics,
         concepts,
         metadata: {
           fileName: file.originalname,
           fileType: file.mimetype,
           fileSize: file.size,
         },
       };
     }
     
     private async extractText(file: Express.Multer.File): Promise<string> {
       // Implementation based on file type...
     }
     
     private preprocessText(text: string): string {
       // Clean and normalize text...
     }
   }
   ```

2. **Implementer AI-spørgsmålsgenerering**
   - Integrér med OpenAI eller anden LLM-tjeneste
   - Implementer prompt engineering for forskellige spørgsmålstyper
   - Tilføj kvalitetskontrol og validering af genererede spørgsmål

   ```typescript
   // Eksempel på AI-spørgsmålsgenerering service
   @Injectable()
   export class QuestionGenerationService {
     constructor(
       private readonly openaiService: OpenAIService,
     ) {}
     
     async generateQuestions(
       text: string,
       options: {
         count: number;
         types: QuestionType[];
         difficulty: 'easy' | 'medium' | 'hard';
       },
     ): Promise<GeneratedQuestion[]> {
       const prompt = this.buildPrompt(text, options);
       
       const response = await this.openaiService.createCompletion({
         model: 'gpt-4',
         prompt,
         max_tokens: 1000,
         temperature: 0.7,
       });
       
       const rawQuestions = this.parseResponse(response.choices[0].text);
       
       // Validate and format questions
       const validatedQuestions = await this.validateQuestions(rawQuestions);
       
       return validatedQuestions;
     }
     
     private buildPrompt(text: string, options: any): string {
       // Build prompt based on text and options...
     }
     
     private parseResponse(response: string): any[] {
       // Parse response into structured question objects...
     }
     
     private async validateQuestions(questions: any[]): Promise<GeneratedQuestion[]> {
       // Validate questions for quality and correctness...
     }
   }
   ```

3. **Implementer brugergrænsefladen for spørgsmålsgenerering**
   - Tilføj dokument-upload interface
   - Implementer preview og redigering af genererede spørgsmål
   - Tilføj mulighed for at gemme spørgsmål til spørgsmålsbank

### 4.2 AI-drevet feedback og adaptiv læring (5 dage)

1. **Implementer AI-feedback på quiz-besvarelser**
   - Tilføj analyse af brugerens svar
   - Implementer personaliseret feedback baseret på fejlmønstre
   - Tilføj forslag til forbedring og ressourcer

   ```typescript
   // Eksempel på AI-feedback service
   @Injectable()
   export class QuizFeedbackService {
     constructor(
       private readonly aiService: AIService,
       private readonly contentService: ContentService,
     ) {}
     
     async generateFeedback(quizAttempt: QuizAttempt): Promise<QuizFeedback> {
       // Analyze answer patterns
       const answerAnalysis = this.analyzeAnswers(quizAttempt);
       
       // Generate personalized feedback
       const feedback = await this.aiService.generateFeedback({
         quizTitle: quizAttempt.quiz.title,
         score: quizAttempt.score,
         correctAnswers: answerAnalysis.correctCount,
         incorrectAnswers: answerAnalysis.incorrectCount,
         missedConcepts: answerAnalysis.missedConcepts,
         strengths: answerAnalysis.strengths,
         weaknesses: answerAnalysis.weaknesses,
       });
       
       // Find relevant resources
       const resources = await this.contentService.findRelatedContent(
         answerAnalysis.missedConcepts
       );
       
       return {
         summary: feedback.summary,
         detailedFeedback: feedback.detailed,
         improvementAreas: feedback.improvementAreas,
         recommendedResources: resources,
       };
     }
     
     private analyzeAnswers(quizAttempt: QuizAttempt): AnswerAnalysis {
       // Analyze answer patterns and identify concepts...
     }
   }
   ```

2. **Implementer adaptiv quiz-generering**
   - Tilføj analyse af brugerens styrker og svagheder
   - Implementer generering af personaliserede quizzer
   - Tilføj sværhedsgrads-justering baseret på præstation

3. **Implementer læringssti-optimering**
   - Tilføj AI-drevet anbefaling af næste lektioner
   - Implementer personaliserede læringsplaner
   - Tilføj adaptiv sværhedsgrad for indhold

### 4.3 AI-chatbot og studieassistent (5 dage)

1. **Implementer AI-chatbot**
   - Integrér med OpenAI eller anden LLM-tjeneste
   - Implementer kontekst-bevidst chat baseret på kursusindhold
   - Tilføj spørgsmål-besvarelse og forklaringer

   ```typescript
   // Eksempel på AI-chatbot service
   @Injectable()
   export class ChatbotService {
     constructor(
       private readonly openaiService: OpenAIService,
       private readonly contentService: ContentService,
     ) {}
     
     async generateResponse(
       userId: number,
       message: string,
       conversationId: string,
     ): Promise<ChatResponse> {
       // Get user context
       const userContext = await this.getUserContext(userId);
       
       // Get relevant content based on message
       const relevantContent = await this.contentService.findRelevantContent(message);
       
       // Get conversation history
       const conversationHistory = await this.getConversationHistory(conversationId);
       
       // Build prompt with context
       const prompt = this.buildPrompt(
         message,
         userContext,
         relevantContent,
         conversationHistory,
       );
       
       // Generate response
       const response = await this.openaiService.createChatCompletion({
         model: 'gpt-4',
         messages: [
           { role: 'system', content: prompt.systemPrompt },
           ...conversationHistory.map(msg => ({
             role: msg.role as 'user' | 'assistant',
             content: msg.content,
           })),
           { role: 'user', content: message },
         ],
         temperature: 0.7,
       });
       
       const responseText = response.choices[0].message.content;
       
       // Save message to conversation history
       await this.saveToConversationHistory(conversationId, {
         role: 'user',
         content: message,
       });
       
       await this.saveToConversationHistory(conversationId, {
         role: 'assistant',
         content: responseText,
       });
       
       // Extract references and sources
       const sources = this.extractSources(responseText, relevantContent);
       
       return {
         text: responseText,
         sources,
       };
     }
     
     // Helper methods...
   }
   ```

2. **Implementer studieassistent-funktioner**
   - Tilføj mulighed for at stille spørgsmål om specifikt indhold
   - Implementer forklaringer af komplekse koncepter
   - Tilføj hjælp til opgaveløsning og quizzer

3. **Implementer brugergrænsefladen for chatbot**
   - Tilføj chat-interface med beskedhistorik
   - Implementer kontekst-skift mellem kurser og emner
   - Tilføj mulighed for at gemme og dele samtaler

### 4.4 AI-drevet indholdsanalyse og forbedring (6 dage)

1. **Implementer indholdsanalyse**
   - Tilføj analyse af kursusindhold for kompleksitet og læsbarhed
   - Implementer identifikation af manglende emner og huller
   - Tilføj forslag til forbedring af indhold

2. **Implementer brugeradfærdsanalyse**
   - Tilføj analyse af brugeradfærd og engagement
   - Implementer identifikation af problematiske områder
   - Tilføj prædiktiv analyse for frafald og succes

3. **Implementer automatisk indholdsgeneration**
   - Tilføj generering af opsummeringer og noter
   - Implementer generering af ekstra øvelser og eksempler
   - Tilføj generering af glossary og begrebsforklaringer

## Fase 5: CLI-generator og presets

**Varighed: 2 uger**

### 5.1 CLI-generator grundstruktur (3 dage)

1. **Forbedre eksisterende CLI-struktur**
   - Opdatér kommandostruktur og argumenter
   - Implementer bedre fejlhåndtering og validering
   - Tilføj progress tracking og logging

   ```typescript
   // Eksempel på forbedret CLI-struktur
   import { Command } from 'commander';
   import chalk from 'chalk';
   import inquirer from 'inquirer';
   import { createProject } from './commands/create';
   import { validateProjectName } from './utils/validation';
   import { logger } from './utils/logger';
   
   export function run() {
     const program = new Command();
     
     program
       .name('create-solid-wow')
       .description('Create a new LearningLab project')
       .version('0.1.0');
     
     program
       .command('create [project-name]')
       .description('Create a new project')
       .option('-p, --preset <preset>', 'Use a preset template (laborant, medicin, etc.)')
       .option('--use-npm', 'Use npm instead of yarn')
       .option('--skip-git', 'Skip git initialization')
       .option('--skip-install', 'Skip installing dependencies')
       .option('--skip-seed', 'Skip seeding the database')
       .action(async (projectName, options) => {
         try {
           // Prompt for project name if not provided
           if (!projectName) {
             const answers = await inquirer.prompt([
               {
                 type: 'input',
                 name: 'projectName',
                 message: 'What is the name of your project?',
                 default: 'learning-lab',
                 validate: validateProjectName,
               },
             ]);
             projectName = answers.projectName;
           } else {
             // Validate provided project name
             const validationResult = validateProjectName(projectName);
             if (validationResult !== true) {
               logger.error(validationResult);
               process.exit(1);
             }
           }
           
           // Create project
           await createProject(projectName, options);
         } catch (error) {
           logger.error('Failed to create project:', error);
           process.exit(1);
         }
       });
     
     // Add more commands...
     
     program.parse();
   }
   ```

2. **Implementer template-system**
   - Tilføj template-struktur med placeholders
   - Implementer template-rendering med variables
   - Tilføj template-validering og tests

3. **Implementer konfigurationssystem**
   - Tilføj config-fil generering
   - Implementer environment-specifik konfiguration
   - Tilføj validering og defaults

### 5.2 Presets og tilpasning (4 dage)

1. **Implementer preset-system**
   - Definér preset-struktur og metadata
   - Implementer preset-valg og anvendelse
   - Tilføj preset-dokumentation

   ```typescript
   // Eksempel på preset-definition
   export interface Preset {
     id: string;
     name: string;
     description: string;
     templates: {
       [key: string]: string; // template path
     };
     dependencies: {
       [key: string]: string; // version
     };
     devDependencies: {
       [key: string]: string; // version
     };
     scripts: {
       [key: string]: string; // script command
     };
     seedData: {
       path: string;
       options?: any;
     };
     configuration: {
       [key: string]: any;
     };
   }
   
   export const presets: Record<string, Preset> = {
     laborant: {
       id: 'laborant',
       name: 'Laborant',
       description: 'Preset for laborant education',
       templates: {
         // Template paths...
       },
       dependencies: {
         // Dependencies...
       },
       devDependencies: {
         // Dev dependencies...
       },
       scripts: {
         // Scripts...
       },
       seedData: {
         path: './presets/laborant/seed-data',
       },
       configuration: {
         // Configuration...
       },
     },
     medicin: {
       // Medicin preset...
     },
     // Other presets...
   };
   ```

2. **Implementer laborant-preset**
   - Tilføj laborant-specifik datamodel
   - Implementer laborant-specifikt indhold og quizzer
   - Tilføj laborant-specifikt tema og design

3. **Implementer medicin-preset**
   - Tilføj medicin-specifik datamodel
   - Implementer medicin-specifikt indhold og quizzer
   - Tilføj medicin-specifikt tema og design

### 5.3 Deployment og CI/CD (3 dage)

1. **Forbedre Docker-support**
   - Opdatér Docker-filer og compose-konfiguration
   - Implementer multi-stage builds for optimering
   - Tilføj healthchecks og monitoring

   ```dockerfile
   # Eksempel på forbedret Dockerfile for API
   FROM node:18-alpine AS builder
   
   WORKDIR /app
   
   # Copy package files
   COPY package.json yarn.lock ./
   COPY apps/api/package.json ./apps/api/
   COPY packages/core/package.json ./packages/core/
   
   # Install dependencies
   RUN yarn install --frozen-lockfile
   
   # Copy source code
   COPY . .
   
   # Build packages
   RUN yarn build
   
   # Production image
   FROM node:18-alpine AS runner
   
   WORKDIR /app
   
   # Set environment variables
   ENV NODE_ENV=production
   
   # Copy built files
   COPY --from=builder /app/apps/api/dist ./apps/api/dist
   COPY --from=builder /app/packages/core/dist ./packages/core/dist
   COPY --from=builder /app/node_modules ./node_modules
   COPY --from=builder /app/package.json ./
   COPY --from=builder /app/apps/api/package.json ./apps/api/
   COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
   
   # Install production dependencies only
   RUN yarn install --production --frozen-lockfile
   
   # Generate Prisma client
   RUN cd apps/api && npx prisma generate
   
   # Expose port
   EXPOSE 3000
   
   # Healthcheck
   HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
     CMD node -e "fetch('http://localhost:3000/health').then(r => process.exit(r.ok ? 0 : 1))"
   
   # Start the app
   CMD ["node", "apps/api/dist/main.js"]
   ```

2. **Implementer CI/CD-pipeline**
   - Tilføj GitHub Actions eller anden CI/CD-løsning
   - Implementer automatisk test og build
   - Tilføj automatisk deployment

   ```yaml
   # Eksempel på GitHub Actions workflow
   name: CI/CD Pipeline
   
   on:
     push:
       branches: [main]
     pull_request:
       branches: [main]
   
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - name: Set up Node.js
           uses: actions/setup-node@v3
           with:
             node-version: '18'
             cache: 'yarn'
         - name: Install dependencies
           run: yarn install --frozen-lockfile
         - name: Lint
           run: yarn lint
         - name: Test
           run: yarn test
   
     build:
       needs: test
       if: github.event_name == 'push' && github.ref == 'refs/heads/main'
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - name: Set up Node.js
           uses: actions/setup-node@v3
           with:
             node-version: '18'
             cache: 'yarn'
         - name: Install dependencies
           run: yarn install --frozen-lockfile
         - name: Build
           run: yarn build
         - name: Upload build artifacts
           uses: actions/upload-artifact@v3
           with:
             name: build
             path: |
               apps/api/dist
               apps/web/.next
               packages/*/dist
   
     deploy:
       needs: build
       if: github.event_name == 'push' && github.ref == 'refs/heads/main'
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - name: Download build artifacts
           uses: actions/download-artifact@v3
           with:
             name: build
         - name: Deploy to production
           # Deployment steps...
   ```

3. **Implementer cloud-deployment**
   - Tilføj support for forskellige cloud-providers
   - Implementer terraform eller anden IaC-løsning
   - Tilføj dokumentation for deployment

### 5.4 Dokumentation og guides (4 dage)

1. **Implementer teknisk dokumentation**
   - Tilføj API-dokumentation med Swagger/OpenAPI
   - Implementer kodekommentar-baseret dokumentation
   - Tilføj arkitektur- og designdokumentation

2. **Implementer brugerguides**
   - Tilføj installation og setup guide
   - Implementer administrator guide
   - Tilføj content creator guide

3. **Implementer developer guides**
   - Tilføj contribution guidelines
   - Implementer plugin development guide
   - Tilføj theming og customization guide

## Testning og dokumentation

**Løbende gennem alle faser**

### Automatiseret testning

1. **Enhedstests**
   - Skriv tests for alle services og utilities
   - Implementer mocking af eksterne afhængigheder
   - Tilføj code coverage rapportering

   ```typescript
   // Eksempel på enhedstest for XpService
   describe('XpService', () => {
     let service: XpService;
     let prismaService: PrismaService;
     let notificationService: NotificationService;
     
     beforeEach(async () => {
       const module: TestingModule = await Test.createTestingModule({
         providers: [
           XpService,
           {
             provide: PrismaService,
             useValue: {
               user: {
                 update: jest.fn(),
                 findUnique: jest.fn(),
               },
               xpTransaction: {
                 create: jest.fn(),
               },
               $transaction: jest.fn(),
             },
           },
           {
             provide: NotificationService,
             useValue: {
               sendNotification: jest.fn(),
             },
           },
         ],
       }).compile();
       
       service = module.get<XpService>(XpService);
       prismaService = module.get<PrismaService>(PrismaService);
       notificationService = module.get<NotificationService>(NotificationService);
     });
     
     it('should award XP to a user', async () => {
       // Arrange
       const userId = 1;
       const amount = 10;
       const reason = 'Completed quiz';
       
       jest.spyOn(prismaService.user, 'update').mockResolvedValue({
         id: userId,
         xp: 100,
         level: 1,
       } as any);
       
       jest.spyOn(service, 'calculateLevel').mockReturnValue(2);
       
       // Act
       const result = await service.awardXp(userId, amount, reason);
       
       // Assert
       expect(prismaService.user.update).toHaveBeenCalledWith({
         where: { id: userId },
         data: { xp: { increment: amount } },
         include: { xpHistory: true },
       });
       
       expect(prismaService.xpTransaction.create).toHaveBeenCalledWith({
         data: {
           userId,
           amount,
           reason,
           metadata: undefined,
         },
       });
       
       expect(prismaService.user.update).toHaveBeenCalledWith({
         where: { id: userId },
         data: { level: 2 },
       });
       
       expect(notificationService.sendNotification).toHaveBeenCalledTimes(2);
       
       expect(result).toEqual({ xp: 100, level: 2 });
     });
   });
   ```

2. **Integrationstests**
   - Skriv tests for API-endpoints
   - Implementer database-integration tests
   - Tilføj end-to-end tests for kritiske flows

3. **UI-tests**
   - Skriv tests for UI-komponenter
   - Implementer snapshot tests
   - Tilføj end-to-end tests med Playwright eller Cypress

### Dokumentation

1. **Kodekommentarer og JSDoc**
   - Tilføj JSDoc-kommentarer til alle funktioner og klasser
   - Implementer type-dokumentation
   - Tilføj eksempler og use cases

   ```typescript
   /**
    * Service for handling user experience points (XP) and levels.
    * 
    * This service manages the awarding of XP to users, calculating levels,
    * and sending notifications for XP and level-up events.
    */
   @Injectable()
   export class XpService {
     constructor(
       private prisma: PrismaService,
       private notificationService: NotificationService,
     ) {}
     
     /**
      * Awards XP to a user and handles level-up logic.
      * 
      * @param userId - The ID of the user to award XP to
      * @param amount - The amount of XP to award (must be positive)
      * @param reason - The reason for awarding XP (e.g., "Completed quiz")
      * @param metadata - Optional additional data related to the XP award
      * @returns An object containing the user's updated XP and level
      * 
      * @example
      * // Award 10 XP for completing a quiz
      * const result = await xpService.awardXp(1, 10, 'Completed quiz');
      * console.log(`User now has ${result.xp} XP and is level ${result.level}`);
      */
     async awardXp(
       userId: number,
       amount: number,
       reason: string,
       metadata?: any,
     ): Promise<{ xp: number; level: number }> {
       // Implementation...
     }
   }
   ```

2. **README og setup guides**
   - Opdatér README med installation og setup instruktioner
   - Tilføj development guidelines
   - Tilføj troubleshooting guide

3. **API-dokumentation**
   - Implementer Swagger/OpenAPI dokumentation
   - Tilføj eksempler på API-kald
   - Tilføj postman/insomnia collections

### Kontinuerlig integration

1. **Linting og code style**
   - Konfigurér ESLint og Prettier
   - Implementer pre-commit hooks
   - Tilføj automatisk formatering

2. **Code reviews**
   - Implementer pull request templates
   - Definér code review guidelines
   - Tilføj automatiserede code quality checks

3. **Versionering og releases**
   - Implementer semantic versioning
   - Tilføj changelog generation
   - Implementer release automation

## Opsummering

Denne implementeringsplan giver en detaljeret, trinvis tilgang til at færdiggøre LearningLab templaten. Ved at følge denne plan vil du:

1. Færdiggøre kernestrukturen og grundlæggende funktionalitet
2. Implementere et omfattende sæt UI-komponenter og forbedre brugeroplevelsen
3. Tilføje gamification-elementer og brugerengagement-funktioner
4. Integrere AI-funktionalitet for at skabe en intelligent læringsplatform
5. Færdiggøre CLI-generatoren med presets for forskellige fagområder

Hver fase bygger på den forrige og fokuserer på specifikke områder af projektet. Ved at følge denne plan vil du kunne færdiggøre templaten og opnå de mål, der er beskrevet i Vision&brainstom.txt.