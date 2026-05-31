import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { JobsModule } from '../jobs/jobs.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [AiModule, JobsModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
