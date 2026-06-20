import { ApiProperty } from '@nestjs/swagger';

export class HelloResponseDto {
  @ApiProperty({ example: 'Hello World!' })
  message!: string;
}
