# Improvement Plan for LearningLab

This document outlines a step-by-step plan to address the issues identified in the code review of the database model, API endpoints, and user administration features.

## Table of Contents

1. [Database Model Improvements](#database-model-improvements)
2. [API Endpoints Standardization](#api-endpoints-standardization)
3. [User Administration Enhancements](#user-administration-enhancements)
4. [Security Enhancements](#security-enhancements)
5. [Performance Optimizations](#performance-optimizations)
6. [Code Quality Improvements](#code-quality-improvements)

## Database Model Improvements

### 1. Extend ContentBlockType Enum (1 day)

**Current Issue:** The `ContentBlockType` enum doesn't include all the types mentioned in the implementation plan.

**Steps:**

1. Update the Prisma schema to include additional content block types:

```prisma
enum ContentBlockType {
  TEXT
  IMAGE_URL
  VIDEO_URL
  QUIZ_REF
  CODE
  FILE
  EMBED
  INTERACTIVE
}
```

2. Run Prisma migration:

```bash
npx prisma migrate dev --name add_content_block_types
```

3. Update any related TypeScript types in the codebase.

### 2. Add Missing Quiz Fields (1 day)

**Current Issue:** The Quiz model doesn't include time limit, max attempts, and other settings.

**Steps:**

1. Update the Prisma schema to add the missing fields:

```prisma
model Quiz {
  // Existing fields...
  timeLimit Int? // in seconds
  maxAttempts Int?
  randomizeQuestions Boolean @default(false)
  showAnswers Boolean @default(true)
}
```

2. Run Prisma migration:

```bash
npx prisma migrate dev --name add_quiz_settings
```

3. Update the Quiz DTOs to include the new fields.
4. Update the Quiz controller and service to handle the new fields.

### 3. Add Validation for JSON Fields (2 days)

**Current Issue:** JSON fields like `socialLinks` and `settings` lack schema validation.

**Steps:**

1. Create validation schemas for JSON fields:

```typescript
// apps/api/src/users/schemas/social-links.schema.ts
import { z } from "zod";

export const socialLinksSchema = z.object({
  twitter: z.string().url().optional(),
  linkedin: z.string().url().optional(),
  github: z.string().url().optional(),
  website: z.string().url().optional(),
  // Add other social platforms as needed
});

export type SocialLinks = z.infer<typeof socialLinksSchema>;
```

```typescript
// apps/api/src/users/schemas/user-settings.schema.ts
import { z } from "zod";

export const userSettingsSchema = z.object({
  notifications: z.object({
    email: z.boolean().default(true),
    browser: z.boolean().default(true),
  }),
  privacy: z.object({
    showProfile: z.boolean().default(true),
    showProgress: z.boolean().default(false),
  }),
  theme: z.enum(["light", "dark", "system"]).default("system"),
  // Add other settings as needed
});

export type UserSettings = z.infer<typeof userSettingsSchema>;
```

2. Update DTOs to use these schemas:

```typescript
// apps/api/src/users/dto/create-user.dto.ts
import { IsOptional, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { SocialLinks, socialLinksSchema } from "../schemas/social-links.schema";
import {
  UserSettings,
  userSettingsSchema,
} from "../schemas/user-settings.schema";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";

export class CreateUserDto {
  // Existing fields...

  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  @ZodValidationPipe(socialLinksSchema)
  socialLinks?: SocialLinks;

  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  @ZodValidationPipe(userSettingsSchema)
  settings?: UserSettings;
}
```

3. Create a custom validation pipe for Zod schemas:

```typescript
// apps/api/src/common/pipes/zod-validation.pipe.ts
import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from "@nestjs/common";
import { ZodSchema } from "zod";

export function ZodValidationPipe(schema: ZodSchema) {
  @Injectable()
  class ZodValidationPipeImpl implements PipeTransform {
    constructor(private schema: ZodSchema) {}

    transform(value: unknown, metadata: ArgumentMetadata) {
      try {
        return this.schema.parse(value);
      } catch (error) {
        throw new BadRequestException(
          `Validation failed: ${error.errors.map((e) => e.message).join(", ")}`,
        );
      }
    }
  }

  return new ZodValidationPipeImpl(schema);
}
```

## API Endpoints Standardization

### 1. Convert Express-style Controllers to NestJS-style (3 days)

**Current Issue:** There are two different styles of controllers in the codebase.

**Note:** During implementation of this section, we encountered build errors in the web app due to missing UI components and contexts. The web app is trying to use components from `@/components/ui/...` (likely shadcn/ui components) and contexts from `@/contexts/...` that don't exist yet. We've created a `build:api` script in the root package.json to build only the API and its dependencies, allowing us to continue working on the API without being blocked by the web app build errors. These UI components and contexts should be implemented as part of the UI improvements phase.

**Steps:**

1. Create a NestJS controller for each Express-style controller:

```typescript
// apps/api/src/courses/courses.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from "@nestjs/swagger";
import { CoursesService } from "./courses.service";
import { CreateCourseDto } from "./dto/create-course.dto";
import { UpdateCourseDto } from "./dto/update-course.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Role } from "@repo/core";

@ApiTags("Courses")
@Controller("courses")
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @ApiOperation({ summary: "Get all courses" })
  @ApiResponse({ status: 200, description: "List of courses" })
  @Get()
  async getAllCourses() {
    return this.coursesService.findAll();
  }

  // Implement other endpoints...
}
```

2. Create corresponding service classes:

```typescript
// apps/api/src/courses/courses.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../persistence/prisma/prisma.service";
import { CreateCourseDto } from "./dto/create-course.dto";
import { UpdateCourseDto } from "./dto/update-course.dto";

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.course.findMany({
      include: {
        subjectArea: true,
      },
      orderBy: { title: "asc" },
    });
  }

  // Implement other methods...
}
```

3. Create DTOs for request validation:

```typescript
// apps/api/src/courses/dto/create-course.dto.ts
import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsOptional,
  IsArray,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Difficulty, CourseStatus } from "@prisma/client";

export class CreateCourseDto {
  @ApiProperty({ description: "Course title" })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: "Course description" })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ description: "Course slug (URL-friendly identifier)" })
  @IsNotEmpty()
  @IsString()
  slug: string;

  @ApiProperty({ description: "Subject area ID" })
  @IsNotEmpty()
  @IsInt()
  subjectAreaId: number;

  @ApiProperty({ description: "Course tags", required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({
    description: "Course difficulty",
    enum: Difficulty,
    required: false,
    default: "BEGINNER",
  })
  @IsOptional()
  difficulty?: Difficulty;

  @ApiProperty({
    description: "Estimated hours to complete",
    required: false,
  })
  @IsOptional()
  @IsInt()
  estimatedHours?: number;

  @ApiProperty({
    description: "Course status",
    enum: CourseStatus,
    required: false,
    default: "DRAFT",
  })
  @IsOptional()
  status?: CourseStatus;

  @ApiProperty({ description: "Course image URL", required: false })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ description: "Course banner URL", required: false })
  @IsOptional()
  @IsString()
  banner?: string;
}
```

4. Update the module imports to include the new controllers and services.

5. Test each endpoint to ensure functionality is preserved.

### 2. Add Transaction Support for Multi-record Operations (2 days)

**Current Issue:** Operations that modify multiple records don't use transactions.

**Steps:**

1. Update service methods to use Prisma transactions:

```typescript
// Example for bulk user operations
async bulkDelete(
  userIds: number[],
  currentUserId?: number,
): Promise<{ success: boolean; count: number }> {
  const results = {
    success: true,
    count: 0,
  };

  try {
    // Use transaction to ensure all operations succeed or fail together
    await this.prisma.$transaction(async (tx) => {
      // Check if we're trying to delete all admins
      const adminUsers = await tx.user.findMany({
        where: {
          id: { in: userIds },
          role: 'ADMIN' as PrismaGeneratedRoleType,
          deletedAt: null,
        },
      });

      if (adminUsers.length > 0) {
        const totalAdmins = await tx.user.count({
          where: {
            role: 'ADMIN' as PrismaGeneratedRoleType,
            deletedAt: null,
          },
        });

        if (totalAdmins <= adminUsers.length) {
          throw new Error('Cannot delete all administrators');
        }
      }

      // Perform the soft delete
      const result = await tx.user.updateMany({
        where: {
          id: { in: userIds },
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
          updatedBy: currentUserId || null,
        },
      });

      results.count = result.count;
    });
  } catch (error) {
    console.error('Error during bulk delete transaction:', error);
    results.success = false;

    if (error.message === 'Cannot delete all administrators') {
      throw new ForbiddenException('Cannot delete all administrators');
    }

    throw new InternalServerErrorException('Database error during bulk delete operation');
  }

  return results;
}
```

2. Apply similar transaction patterns to other multi-record operations.

### 3. Refactor Search Service to Reduce Duplication (1 day)

**Current Issue:** The search service has duplicate code for building query conditions.

**Steps:**

1. Extract common query building logic into helper functions:

```typescript
// apps/api/src/search/search.service.ts
private buildCourseWhereClause(
  query?: string,
  tags?: string[],
  difficulty?: Difficulty,
  status?: CourseStatus | CourseStatus[],
  subjectAreaId?: number,
): Prisma.CourseWhereInput {
  return {
    deletedAt: null,
    ...(query && {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    }),
    ...(tags && tags.length > 0 && {
      tags: { hasSome: tags },
    }),
    ...(difficulty && { difficulty }),
    ...(status && { status: Array.isArray(status) ? { in: status } : status }),
    ...(subjectAreaId && { subjectAreaId }),
  };
}

private buildModuleWhereClause(
  query?: string,
  courseWhere?: Prisma.CourseWhereInput,
): Prisma.ModuleWhereInput {
  return {
    deletedAt: null,
    ...(query && {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    }),
    ...(courseWhere && { course: courseWhere }),
  };
}

private buildLessonWhereClause(
  query?: string,
  moduleWhere?: Prisma.ModuleWhereInput,
): Prisma.LessonWhereInput {
  return {
    deletedAt: null,
    ...(query && {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { contentBlocks: {
            some: {
              content: { contains: query, mode: 'insensitive' },
              deletedAt: null,
            },
          },
        },
      ],
    }),
    ...(moduleWhere && { module: moduleWhere }),
  };
}
```

2. Update the search method to use these helper functions:

```typescript
async search(params: SearchParams) {
  const { query, type, tags, difficulty, status, subjectAreaId, page, limit } = params;

  // Calculate offset based on page and limit
  const offset = (page - 1) * limit;

  // Initialize results
  let courses = [];
  let modules = [];
  let lessons = [];
  let total = 0;

  // Build base where conditions
  const courseWhereBase = this.buildCourseWhereClause(
    query, tags, difficulty, status, subjectAreaId
  );

  // Search for courses if type is 'course' or 'all'
  if (type === 'course' || type === 'all') {
    courses = await this.prisma.course.findMany({
      where: courseWhereBase,
      include: {
        subjectArea: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: query
        ? [{ title: 'asc' }]
        : { createdAt: 'desc' },
      skip: offset,
      take: type === 'all' ? Math.floor(limit / 3) : limit,
    });

    // Add relevance score to each course
    courses = courses.map(course => ({
      ...course,
      relevanceScore: this.calculateRelevanceScore(course, query),
    }));

    // Count total number of courses matching the search
    if (type === 'course') {
      total = await this.prisma.course.count({
        where: courseWhereBase,
      });
    }
  }

  // Continue with similar refactoring for modules and lessons...
}
```

## User Administration Enhancements

### 1. Implement Email Notifications for User Invitations (2 days)

**Current Issue:** The bulk user invitation feature generates passwords but doesn't send emails.

**Steps:**

1. Install email sending library:

```bash
npm install @nestjs-modules/mailer nodemailer
```

2. Create an email module:

```typescript
// apps/api/src/email/email.module.ts
import { Module } from "@nestjs/common";
import { MailerModule } from "@nestjs-modules/mailer";
import { HandlebarsAdapter } from "@nestjs-modules/mailer/dist/adapters/handlebars.adapter";
import { ConfigService } from "@nestjs/config";
import { EmailService } from "./email.service";
import { join } from "path";

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: config.get("MAIL_HOST"),
          port: config.get("MAIL_PORT"),
          secure: config.get("MAIL_SECURE", false),
          auth: {
            user: config.get("MAIL_USER"),
            pass: config.get("MAIL_PASSWORD"),
          },
        },
        defaults: {
          from: `"${config.get("MAIL_FROM_NAME")}" <${config.get("MAIL_FROM_ADDRESS")}>`,
        },
        template: {
          dir: join(__dirname, "templates"),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
```

3. Create an email service:

```typescript
// apps/api/src/email/email.service.ts
import { Injectable } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";

@Injectable()
export class EmailService {
  constructor(private mailerService: MailerService) {}

  async sendInvitation(email: string, password: string, name?: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: "Welcome to LearningLab",
      template: "invitation",
      context: {
        name: name || "User",
        email,
        password,
        loginUrl: "https://learninglab.example.com/login",
      },
    });
  }
}
```

4. Create email templates:

```html
<!-- apps/api/src/email/templates/invitation.hbs -->
<h1>Welcome to LearningLab, {{name}}!</h1>
<p>You have been invited to join LearningLab. Here are your login details:</p>
<p><strong>Email:</strong> {{email}}</p>
<p><strong>Password:</strong> {{password}}</p>
<p>
  Please login at <a href="{{loginUrl}}">{{loginUrl}}</a> and change your
  password as soon as possible.
</p>
```

5. Update the user service to send emails:

```typescript
// apps/api/src/users/users.service.ts
@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService<ServerEnv, true>,
    private emailService: EmailService, // Add this
  ) {
    // Existing constructor code...
  }

  async bulkInvite(
    invitations: { email: string; name?: string; role: Role }[],
    currentUserId?: number,
  ): Promise<{ success: boolean; count: number; failed: string[] }> {
    const results = {
      success: true,
      count: 0,
      failed: [] as string[],
    };

    // Generate a random password for each user
    const generateRandomPassword = () => {
      // Existing code...
    };

    // Process each invitation
    for (const invitation of invitations) {
      try {
        // Check if user already exists
        const existingUser = await this.findOneByEmail(invitation.email);
        if (existingUser) {
          results.failed.push(`${invitation.email} (already exists)`);
          continue;
        }

        // Create user with random password
        const password = generateRandomPassword();
        const createUserDto = {
          email: invitation.email,
          password,
          name: invitation.name,
          role: invitation.role,
        };

        await this.create(createUserDto, currentUserId);
        results.count++;

        // Send invitation email
        await this.emailService.sendInvitation(
          invitation.email,
          password,
          invitation.name,
        );
      } catch (error) {
        console.error(`Error inviting ${invitation.email}:`, error);
        results.failed.push(invitation.email);
        results.success = false;
      }
    }

    return results;
  }
}
```

### 2. Implement Password Reset Flow (2 days)

**Current Issue:** The password reset flow is not fully implemented.

**Steps:**

1. Add methods to the user service:

```typescript
// apps/api/src/users/users.service.ts
async generatePasswordResetToken(email: string): Promise<boolean> {
  const user = await this.findOneByEmail(email);
  if (!user) {
    return false;
  }

  // Generate a random token
  const token = crypto.randomBytes(32).toString('hex');

  // Set token expiration (1 hour from now)
  const expires = new Date();
  expires.setHours(expires.getHours() + 1);

  // Save token to user
  await this.prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: token,
      passwordResetExpires: expires,
    },
  });

  // Send password reset email
  await this.emailService.sendPasswordReset(
    user.email,
    token,
    user.name,
  );

  return true;
}

async resetPassword(token: string, newPassword: string): Promise<boolean> {
  // Find user with this token and valid expiration
  const user = await this.prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpires: {
        gt: new Date(),
      },
      deletedAt: null,
    },
  });

  if (!user) {
    return false;
  }

  // Hash the new password
  const passwordHash = await bcrypt.hash(newPassword, this.saltRounds);

  // Update user with new password and clear reset token
  await this.prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
      updatedAt: new Date(),
    },
  });

  return true;
}
```

2. Add methods to the email service:

```typescript
// apps/api/src/email/email.service.ts
async sendPasswordReset(email: string, token: string, name?: string) {
  const resetUrl = `https://learninglab.example.com/reset-password?token=${token}`;

  await this.mailerService.sendMail({
    to: email,
    subject: 'Reset Your Password',
    template: 'password-reset',
    context: {
      name: name || 'User',
      resetUrl,
    },
  });
}
```

3. Create password reset email template:

```html
<!-- apps/api/src/email/templates/password-reset.hbs -->
<h1>Reset Your Password</h1>
<p>Hello {{name}},</p>
<p>
  You requested to reset your password. Please click the link below to set a new
  password:
</p>
<p><a href="{{resetUrl}}">Reset Password</a></p>
<p>This link will expire in 1 hour.</p>
<p>If you didn't request this, please ignore this email.</p>
```

4. Add controller endpoints:

```typescript
// apps/api/src/auth/auth.controller.ts
@Post('forgot-password')
@HttpCode(HttpStatus.OK)
async forgotPassword(@Body('email') email: string) {
  const result = await this.usersService.generatePasswordResetToken(email);

  // Always return success to prevent email enumeration
  return { message: 'If your email is registered, you will receive a password reset link.' };
}

@Post('reset-password')
@HttpCode(HttpStatus.OK)
async resetPassword(
  @Body('token') token: string,
  @Body('password') password: string,
) {
  const result = await this.usersService.resetPassword(token, password);

  if (!result) {
    throw new BadRequestException('Invalid or expired token');
  }

  return { message: 'Password has been reset successfully' };
}
```

## Security Enhancements

### 1. Add Rate Limiting for Authentication Endpoints (1 day)

**Current Issue:** No rate limiting to prevent brute force attacks.

**Steps:**

1. Install rate limiting package:

```bash
npm install @nestjs/throttler
```

2. Configure the throttler module:

```typescript
// apps/api/src/app.module.ts
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";

@Module({
  imports: [
    // Existing imports...
    ThrottlerModule.forRoot({
      ttl: 60, // time to live in seconds
      limit: 10, // number of requests allowed in the TTL
    }),
  ],
  providers: [
    // Existing providers...
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

3. Apply specific throttling to auth endpoints:

```typescript
// apps/api/src/auth/auth.controller.ts
import { Throttle } from "@nestjs/throttler";

@Controller("auth")
export class AuthController {
  // Existing code...

  @Throttle(5, 60) // 5 requests per minute
  @Post("login")
  async login(@Body() loginDto: LoginDto) {
    // Existing code...
  }

  @Throttle(3, 60) // 3 requests per minute
  @Post("forgot-password")
  async forgotPassword(@Body("email") email: string) {
    // Existing code...
  }
}
```

## Performance Optimizations

### 1. Add Database Indexes for Frequently Searched Fields (1 day)

**Current Issue:** Potential performance issues with complex search queries.

**Steps:**

1. Update the Prisma schema to add indexes:

```prisma
model Course {
  // Existing fields...

  // Add indexes for frequently searched fields
  @@index([title])
  @@index([tags])
  @@index([difficulty])
  @@index([status])
  @@index([subjectAreaId])
  @@index([deletedAt])
}

model Module {
  // Existing fields...

  @@index([title])
  @@index([courseId])
  @@index([deletedAt])
}

model Lesson {
  // Existing fields...

  @@index([title])
  @@index([moduleId])
  @@index([deletedAt])
}

model User {
  // Existing fields...

  @@index([email])
  @@index([role])
  @@index([deletedAt])
}
```

2. Run Prisma migration:

```bash
npx prisma migrate dev --name add_search_indexes
```

### 2. Implement Caching for Frequently Accessed Data (2 days)

**Current Issue:** Repeated database queries for frequently accessed data.

**Steps:**

1. Install caching package:

```bash
npm install @nestjs/cache-manager cache-manager
```

2. Configure the cache module:

```typescript
// apps/api/src/app.module.ts
import { CacheModule } from "@nestjs/cache-manager";

@Module({
  imports: [
    // Existing imports...
    CacheModule.register({
      ttl: 60 * 5, // 5 minutes
      max: 100, // maximum number of items in cache
    }),
  ],
})
export class AppModule {}
```

3. Inject and use the cache in services:

```typescript
// apps/api/src/courses/courses.service.ts
import { Injectable, Inject } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";

@Injectable()
export class CoursesService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findAll() {
    // Try to get from cache first
    const cacheKey = "all_courses";
    const cachedCourses = await this.cacheManager.get(cacheKey);

    if (cachedCourses) {
      return cachedCourses;
    }

    // If not in cache, get from database
    const courses = await this.prisma.course.findMany({
      include: {
        subjectArea: true,
      },
      orderBy: { title: "asc" },
    });

    // Store in cache for future requests
    await this.cacheManager.set(cacheKey, courses);

    return courses;
  }

  // Apply similar caching to other frequently called methods
}
```

## Code Quality Improvements

### 1. Add Unit Tests for Critical Components (3 days)

**Current Issue:** Lack of comprehensive test coverage.

**Steps:**

1. Create test files for critical services:

```typescript
// apps/api/src/users/users.service.spec.ts
import { Test, TestingModule } from "@nestjs/testing";
import { UsersService } from "./users.service";
import { PrismaService } from "../persistence/prisma/prisma.service";
import { ConfigService } from "@nestjs/config";
import { EmailService } from "../email/email.service";
import { Role } from "@repo/core";

describe("UsersService", () => {
  let service: UsersService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
              count: jest.fn(),
            },
            $transaction: jest.fn((callback) => callback(prismaService)),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(10),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendInvitation: jest.fn(),
            sendPasswordReset: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  // Add specific tests for each method
  describe("create", () => {
    it("should create a user successfully", async () => {
      const createUserDto = {
        email: "test@example.com",
        password: "password123",
        name: "Test User",
        role: Role.STUDENT,
      };

      const mockUser = {
        id: 1,
        email: createUserDto.email,
        name: createUserDto.name,
        role: createUserDto.role,
        passwordHash: "hashedpassword",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prismaService.user, "findUnique").mockResolvedValue(null);
      jest
        .spyOn(prismaService.user, "create")
        .mockResolvedValue(mockUser as any);

      const result = await service.create(createUserDto);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
      expect(prismaService.user.create).toHaveBeenCalled();
      expect(result).toHaveProperty("id", mockUser.id);
      expect(result).toHaveProperty("email", mockUser.email);
      expect(result).not.toHaveProperty("passwordHash");
    });

    // Add more tests...
  });
});
```

2. Create test files for controllers:

```typescript
// apps/api/src/users/users.controller.spec.ts
import { Test, TestingModule } from "@nestjs/testing";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { Role } from "@repo/core";
import { ForbiddenException, NotFoundException } from "@nestjs/common";

describe("UsersController", () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOneById: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            bulkInvite: jest.fn(),
            bulkDelete: jest.fn(),
            bulkGet: jest.fn(),
            mapToCoreUser: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  // Add specific tests for each endpoint
  describe("findAll", () => {
    it("should return an array of users", async () => {
      const result = {
        users: [
          {
            id: 1,
            email: "test@example.com",
            name: "Test User",
            role: Role.STUDENT,
          },
        ],
        total: 1,
      };
      jest.spyOn(service, "findAll").mockResolvedValue(result);

      expect(await controller.findAll()).toBe(result);
      expect(service.findAll).toHaveBeenCalledWith(1, 10, undefined, undefined);
    });

    // Add more tests...
  });
});
```

3. Run tests:

```bash
npm run test
```

### 2. Add Integration Tests for API Endpoints (2 days)

**Current Issue:** Lack of end-to-end testing.

**Steps:**

1. Create integration test files:

```typescript
// apps/api/test/users.e2e-spec.ts
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/persistence/prisma/prisma.service";
import { Role } from "@repo/core";
import { JwtService } from "@nestjs/jwt";

describe("UsersController (e2e)", () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    // Create test admin user and generate token
    const adminUser = await prismaService.user.create({
      data: {
        email: "admin@test.com",
        name: "Admin User",
        passwordHash: "hashedpassword",
        role: Role.ADMIN,
      },
    });

    adminToken = jwtService.sign({
      sub: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prismaService.user.deleteMany({
      where: {
        email: {
          contains: "test.com",
        },
      },
    });

    await app.close();
  });

  describe("/users (GET)", () => {
    it("should return 401 for unauthenticated requests", () => {
      return request(app.getHttpServer()).get("/users").expect(401);
    });

    it("should return users for authenticated admin", () => {
      return request(app.getHttpServer())
        .get("/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("users");
          expect(res.body).toHaveProperty("total");
          expect(Array.isArray(res.body.users)).toBe(true);
        });
    });

    // Add more tests...
  });
});
```

2. Run integration tests:

```bash
npm run test:e2e
```

## Timeline and Priority

| Task                                                | Priority | Estimated Time | Dependencies             |
| --------------------------------------------------- | -------- | -------------- | ------------------------ |
| Extend ContentBlockType Enum                        | High     | 1 day          | None                     |
| Add Missing Quiz Fields                             | High     | 1 day          | None                     |
| Convert Express-style Controllers to NestJS-style   | High     | 3 days         | None                     |
| Add Transaction Support for Multi-record Operations | High     | 2 days         | None                     |
| Add Validation for JSON Fields                      | Medium   | 2 days         | None                     |
| Implement Email Notifications for User Invitations  | Medium   | 2 days         | None                     |
| Implement Password Reset Flow                       | Medium   | 2 days         | Email Notifications      |
| Add Rate Limiting for Authentication Endpoints      | Medium   | 1 day          | None                     |
| Add Database Indexes for Frequently Searched Fields | Medium   | 1 day          | None                     |
| Refactor Search Service to Reduce Duplication       | Low      | 1 day          | None                     |
| Implement Caching for Frequently Accessed Data      | Low      | 2 days         | None                     |
| Add Unit Tests for Critical Components              | Low      | 3 days         | All implementation tasks |
| Add Integration Tests for API Endpoints             | Low      | 2 days         | All implementation tasks |

**Total Estimated Time: 23 days**

## Conclusion

This improvement plan addresses all the issues identified in the code review. By following this step-by-step approach, the LearningLab platform will have a more robust, secure, and maintainable codebase. The plan prioritizes critical database and API improvements first, followed by security and performance enhancements, and finally code quality improvements.

The implementation of these improvements will ensure that the LearningLab platform meets the requirements specified in the implementation plan and follows best practices for modern web application development.
