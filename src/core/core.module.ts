import { CoreService } from './core.service';
import { Module } from '@nestjs/common';

@Module({
  providers: [CoreService],
})
export class CoreModule {}
