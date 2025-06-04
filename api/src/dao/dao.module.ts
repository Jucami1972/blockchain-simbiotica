import { Module } from '@nestjs/common';
import { DAOService } from './dao.service';
import { DAOController } from './dao.controller';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [
    BlockchainModule,
    ConfigModule,
    LoggerModule
  ],
  controllers: [DAOController],
  providers: [DAOService],
  exports: [DAOService]
})
export class DAOModule {}
