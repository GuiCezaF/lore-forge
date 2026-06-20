import { Injectable } from '@nestjs/common';
import { HelloResponseDto } from './hello-response.dto';

@Injectable()
export class AppService {
  getHello(): HelloResponseDto {
    return { message: 'Hello World!' };
  }
}
