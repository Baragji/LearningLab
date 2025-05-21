// apps/api/src/dto/update-lesson-progress.dto.ts
import { IsEnum } from 'class-validator';
import { ProgressStatus } from '@prisma/client'; // Antager at ProgressStatus er i Prisma schema

export class UpdateLessonProgressDto {
  @IsEnum(ProgressStatus, {
    message: 'Status skal være en gyldig ProgressStatus værdi.',
  })
  status: ProgressStatus;
}
