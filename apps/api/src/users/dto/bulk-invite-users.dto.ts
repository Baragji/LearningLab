// apps/api/src/users/dto/bulk-invite-users.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Role } from '@repo/core';

export class InviteUserDto {
  @ApiProperty({
    description: 'Brugerens email',
    example: 'bruger@eksempel.dk',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Brugerens navn (valgfrit)',
    example: 'John Doe',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Brugerens rolle',
    enum: Role,
    example: Role.STUDENT,
  })
  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}

export class BulkInviteUsersDto {
  @ApiProperty({
    description: 'Liste af brugere der skal inviteres',
    type: [InviteUserDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InviteUserDto)
  invitations: InviteUserDto[];
}
