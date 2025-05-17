import { Module } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { SqsService } from './application/sqs-service';

@Module({
  providers: [Logger, SqsService],
  exports: [SqsService, Logger],
})
export class CommonModule {}
