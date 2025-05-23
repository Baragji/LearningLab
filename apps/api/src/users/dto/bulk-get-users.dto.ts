// apps/api/src/users/dto/bulk-get-users.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, ArrayMinSize } from 'class-validator';

export class BulkGetUsersDto {
  @ApiProperty({
    description: "Liste af bruger-ID'er der skal hentes",
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Type(() => Number)
  userIds: number[];
}
