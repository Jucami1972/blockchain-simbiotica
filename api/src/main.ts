import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const port: number = configService.get<number>('app.port') || 3000;
  const apiPrefix: string = configService.get<string>('app.apiPrefix') || 'api';

  app.setGlobalPrefix(apiPrefix);
  app.enableCors();

  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`API Blockchain Simbiotica escuchando en http://0.0.0.0:${port}/${apiPrefix}`);
}

bootstrap();
