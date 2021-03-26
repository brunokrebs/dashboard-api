import { Module } from '@nestjs/common';
import { AppLogger } from '../logger/app-logger.service';
import { BackuperService } from './backuper.service';

@Module({
  providers: [BackuperService, AppLogger],
})
export class BackuperModule {}
