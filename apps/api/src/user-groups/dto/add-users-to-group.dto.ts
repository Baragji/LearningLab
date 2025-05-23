// apps/api/src/user-groups/dto/add-users-to-group.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class AddUsersToGroupDto {
  @ApiProperty({
    description: "Liste af bruger-ID'er der skal tilføjes til gruppen",
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Type(() => Number)
  userIds: number[];
}
