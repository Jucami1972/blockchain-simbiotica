import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { TokenController } from './token.controller';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [
    BlockchainModule,
    ConfigModule,
    LoggerModule
  ],
  controllers: [TokenController],
  providers: [TokenService],
  exports: [TokenService]
})
export class TokenModule {}
