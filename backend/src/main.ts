import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { config } from './config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useBodyParser('json', { limit: config.bodyLimit });
  app.enableShutdownHooks();
  await app.listen(config.port, config.host);
  new Logger('Thinker').log(`API listening on http://${config.host}:${config.port}`);
}

bootstrap();
