import { Transform } from 'class-transformer';
import { Allow, IsNotEmpty } from 'class-validator';

export class UserProfileDTO {
  @IsNotEmpty()
  @Transform((value: string) => value?.trim())
  name: string;

  @Allow()
  @Transform((value: string) => value?.trim())
  password?: string;
}
