import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BlockchainModule } from './blockchain/blockchain.module';
import { TokenModule } from './token/token.module';
import { TelemedicinModule } from './telemedicin/telemedicin.module';
import { IdentityModule } from './identity/identity.module';
import { AchievexModule } from './achievex/achievex.module';
import { ChatModule } from './chat/chat.module';
import { IAModule } from './ia/ia.module';
import { DAOModule } from './dao/dao.module';
import { AuthModule } from './auth/auth.module';
import { LoggerModule } from './logger/logger.module';
import configuration from './config/configuration';

@Module({
  imports: [
    // Configuración global
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),
    
    // Módulos de la aplicación
    LoggerModule,
    BlockchainModule,
    AuthModule,
    IdentityModule,
    TokenModule,
    TelemedicinModule,
    AchievexModule,
    ChatModule,
    IAModule,
    DAOModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
