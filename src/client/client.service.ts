import { Injectable } from '@nestjs/common';

@Injectable()
export class ClientService {
  root(): string {
    return 'Hello World!';
  }
}
