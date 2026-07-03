import { Injectable } from '@nestjs/common';
import { HealthResponseDto } from './hello-response.dto';

@Injectable()
export class AppService {
  getHealth(): HealthResponseDto {
    return { status: 'UP' };
  }
}
