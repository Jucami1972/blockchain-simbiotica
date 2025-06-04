import { Module } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { BlockchainController } from './blockchain.controller';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule
  ],
  controllers: [BlockchainController],
  providers: [BlockchainService],
  exports: [BlockchainService]
})
export class BlockchainModule {}
