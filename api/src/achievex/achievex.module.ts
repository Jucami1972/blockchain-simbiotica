import { Module } from '@nestjs/common';
import { AchievexService } from './achievex.service';
import { AchievexController } from './achievex.controller';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [
    BlockchainModule,
    ConfigModule,
    LoggerModule
  ],
  controllers: [AchievexController],
  providers: [AchievexService],
  exports: [AchievexService]
})
export class AchievexModule {}
