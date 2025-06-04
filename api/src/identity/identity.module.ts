import { Module } from '@nestjs/common';
import { IdentityService } from './identity.service';
import { IdentityController } from './identity.controller';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [
    BlockchainModule,
    ConfigModule,
    LoggerModule
  ],
  controllers: [IdentityController],
  providers: [IdentityService],
  exports: [IdentityService]
})
export class IdentityModule {}
