import { Module } from '@nestjs/common';
import { TelemedicinService } from './telemedicin.service';
import { TelemedicinController } from './telemedicin.controller';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [
    BlockchainModule,
    ConfigModule,
    LoggerModule
  ],
  controllers: [TelemedicinController],
  providers: [TelemedicinService],
  exports: [TelemedicinService]
})
export class TelemedicinModule {}
