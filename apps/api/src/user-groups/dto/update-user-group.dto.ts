// apps/api/src/user-groups/dto/update-user-group.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsObject } from 'class-validator';

export class UpdateUserGroupDto {
  @ApiPropertyOptional({
    description: 'Navn på brugergruppen',
    example: 'Administratorer',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Beskrivelse af brugergruppen',
    example: 'Gruppe for administratorer med fulde rettigheder',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Tilladelser for brugergruppen',
    example: {
      canManageUsers: true,
      canManageCourses: true,
      canViewReports: true,
    },
  })
  @IsObject()
  @IsOptional()
  permissions?: Record<string, boolean>;
}
