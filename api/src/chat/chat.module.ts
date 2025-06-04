import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [
    BlockchainModule,
    ConfigModule,
    LoggerModule
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService]
})
export class ChatModule {}
