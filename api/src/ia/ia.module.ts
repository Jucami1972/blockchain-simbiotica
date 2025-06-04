import { Module } from '@nestjs/common';
import { IAService } from './ia.service';
import { IAController } from './ia.controller';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [
    BlockchainModule,
    ConfigModule,
    LoggerModule
  ],
  controllers: [IAController],
  providers: [IAService],
  exports: [IAService]
})
export class IAModule {}
